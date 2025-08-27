import re
import uuid
from datetime import datetime, date, timezone
from decimal import Decimal, InvalidOperation
from typing import Dict, List, Any, Optional, Tuple, Union
from enum import Enum
import json
from dataclasses import dataclass, field

class ValidationSeverity(Enum):
    INFO = 'info'
    WARNING = 'warning'
    ERROR = 'error'
    CRITICAL = 'critical'

class ValidationErrorType(Enum):
    DATA_TYPE = 'data_type'
    FORMAT = 'format'
    RANGE = 'range'
    BUSINESS_RULE = 'business_rule'
    REFERENCE_INTEGRITY = 'reference_integrity'
    DUPLICATE = 'duplicate'
    REQUIRED_FIELD = 'required_field'
    CUSTOM = 'custom'

@dataclass
class ValidationResult:
    is_valid: bool
    errors: List['ValidationError'] = field(default_factory=list)
    warnings: List['ValidationError'] = field(default_factory=list)
    data_quality_score: float = 0.0
    completeness_score: float = 0.0
    accuracy_score: float = 0.0
    
    def add_error(self, error: 'ValidationError'):
        if error.severity in [ValidationSeverity.ERROR, ValidationSeverity.CRITICAL]:
            self.errors.append(error)
            self.is_valid = False
        else:
            self.warnings.append(error)
    
    def calculate_scores(self, total_fields: int, required_fields: int):
        """Calculate data quality scores"""
        if total_fields == 0:
            return
        
        error_penalty = len(self.errors) * 0.1
        warning_penalty = len(self.warnings) * 0.05
        
        self.accuracy_score = max(0.0, 1.0 - error_penalty - warning_penalty)
        self.completeness_score = max(0.0, 1.0 - (len([e for e in self.errors if e.error_type == ValidationErrorType.REQUIRED_FIELD]) / max(1, required_fields)))
        self.data_quality_score = (self.accuracy_score + self.completeness_score) / 2

@dataclass
class ValidationError:
    field_name: str
    error_type: ValidationErrorType
    error_code: str
    message: str
    severity: ValidationSeverity
    original_value: Any = None
    suggested_value: Any = None
    row_number: Optional[int] = None
    context: Dict[str, Any] = field(default_factory=dict)

class BaseValidator:
    """Base validator class with common validation methods"""
    
    def __init__(self, field_name: str, required: bool = False, allow_null: bool = True):
        self.field_name = field_name
        self.required = required
        self.allow_null = allow_null
        self.errors = []
    
    def validate(self, value: Any, row_data: Dict = None, row_number: int = None) -> ValidationResult:
        """Main validation method - override in subclasses"""
        result = ValidationResult(is_valid=True)
        
        # Check required field
        if self.required and (value is None or value == ''):
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.REQUIRED_FIELD,
                error_code='REQUIRED',
                message=f'Field {self.field_name} is required',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
            return result
        
        # Check null handling
        if not self.allow_null and value is None:
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.DATA_TYPE,
                error_code='NULL_NOT_ALLOWED',
                message=f'Field {self.field_name} cannot be null',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
            return result
        
        # If value is None and it's allowed, skip further validation
        if value is None:
            result.is_valid = True
            return result
        
        return self._validate_value(value, row_data, row_number)
    
    def _validate_value(self, value: Any, row_data: Dict = None, row_number: int = None) -> ValidationResult:
        """Override this method in subclasses for specific validation logic"""
        return ValidationResult(is_valid=True)

class StringValidator(BaseValidator):
    """Validator for string fields"""
    
    def __init__(self, field_name: str, required: bool = False, allow_null: bool = True,
                 min_length: int = None, max_length: int = None, pattern: str = None,
                 allowed_values: List[str] = None):
        super().__init__(field_name, required, allow_null)
        self.min_length = min_length
        self.max_length = max_length
        self.pattern = re.compile(pattern) if pattern else None
        self.allowed_values = allowed_values
    
    def _validate_value(self, value: Any, row_data: Dict = None, row_number: int = None) -> ValidationResult:
        result = ValidationResult(is_valid=True)
        
        # Convert to string if not already
        if not isinstance(value, str):
            try:
                str_value = str(value).strip()
            except:
                result.add_error(ValidationError(
                    field_name=self.field_name,
                    error_type=ValidationErrorType.DATA_TYPE,
                    error_code='INVALID_STRING',
                    message=f'Cannot convert {value} to string',
                    severity=ValidationSeverity.ERROR,
                    original_value=value,
                    row_number=row_number
                ))
                return result
        else:
            str_value = value.strip()
        
        # Length validation
        if self.min_length and len(str_value) < self.min_length:
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.RANGE,
                error_code='MIN_LENGTH',
                message=f'Field {self.field_name} must be at least {self.min_length} characters',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
        
        if self.max_length and len(str_value) > self.max_length:
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.RANGE,
                error_code='MAX_LENGTH',
                message=f'Field {self.field_name} cannot exceed {self.max_length} characters',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                suggested_value=str_value[:self.max_length],
                row_number=row_number
            ))
        
        # Pattern validation
        if self.pattern and not self.pattern.match(str_value):
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.FORMAT,
                error_code='PATTERN_MISMATCH',
                message=f'Field {self.field_name} does not match required format',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
        
        # Allowed values validation
        if self.allowed_values and str_value not in self.allowed_values:
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.BUSINESS_RULE,
                error_code='INVALID_VALUE',
                message=f'Field {self.field_name} must be one of: {", ".join(self.allowed_values)}',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
        
        return result

class NumericValidator(BaseValidator):
    """Validator for numeric fields"""
    
    def __init__(self, field_name: str, required: bool = False, allow_null: bool = True,
                 min_value: Union[int, float, Decimal] = None, max_value: Union[int, float, Decimal] = None,
                 decimal_places: int = None, data_type: str = 'decimal'):
        super().__init__(field_name, required, allow_null)
        self.min_value = min_value
        self.max_value = max_value
        self.decimal_places = decimal_places
        self.data_type = data_type  # 'int', 'float', 'decimal'
    
    def _validate_value(self, value: Any, row_data: Dict = None, row_number: int = None) -> ValidationResult:
        result = ValidationResult(is_valid=True)
        
        # Convert to appropriate numeric type
        try:
            if self.data_type == 'int':
                numeric_value = int(float(str(value)))
            elif self.data_type == 'float':
                numeric_value = float(value)
            else:  # decimal
                numeric_value = Decimal(str(value))
        except (ValueError, InvalidOperation, TypeError):
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.DATA_TYPE,
                error_code='INVALID_NUMERIC',
                message=f'Field {self.field_name} must be a valid number',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
            return result
        
        # Range validation
        if self.min_value is not None and numeric_value < self.min_value:
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.RANGE,
                error_code='MIN_VALUE',
                message=f'Field {self.field_name} must be at least {self.min_value}',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
        
        if self.max_value is not None and numeric_value > self.max_value:
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.RANGE,
                error_code='MAX_VALUE',
                message=f'Field {self.field_name} cannot exceed {self.max_value}',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
        
        # Decimal places validation
        if self.decimal_places is not None and self.data_type in ['float', 'decimal']:
            if isinstance(numeric_value, Decimal):
                _, digits, exponent = numeric_value.as_tuple()
                if exponent < -self.decimal_places:
                    result.add_error(ValidationError(
                        field_name=self.field_name,
                        error_type=ValidationErrorType.FORMAT,
                        error_code='DECIMAL_PRECISION',
                        message=f'Field {self.field_name} cannot have more than {self.decimal_places} decimal places',
                        severity=ValidationSeverity.WARNING,
                        original_value=value,
                        suggested_value=round(numeric_value, self.decimal_places),
                        row_number=row_number
                    ))
        
        return result

class DateValidator(BaseValidator):
    """Validator for date and datetime fields"""
    
    def __init__(self, field_name: str, required: bool = False, allow_null: bool = True,
                 min_date: Union[date, datetime] = None, max_date: Union[date, datetime] = None,
                 date_format: str = None, allow_future: bool = True):
        super().__init__(field_name, required, allow_null)
        self.min_date = min_date
        self.max_date = max_date
        self.date_format = date_format
        self.allow_future = allow_future
    
    def _validate_value(self, value: Any, row_data: Dict = None, row_number: int = None) -> ValidationResult:
        result = ValidationResult(is_valid=True)
        
        # Convert to date/datetime
        if isinstance(value, (date, datetime)):
            date_value = value
        elif isinstance(value, str):
            try:
                if self.date_format:
                    date_value = datetime.strptime(value, self.date_format).date()
                else:
                    # Try common formats
                    for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d %H:%M:%S']:
                        try:
                            date_value = datetime.strptime(value, fmt)
                            if fmt == '%Y-%m-%d':
                                date_value = date_value.date()
                            break
                        except ValueError:
                            continue
                    else:
                        raise ValueError("No matching date format found")
            except ValueError:
                result.add_error(ValidationError(
                    field_name=self.field_name,
                    error_type=ValidationErrorType.FORMAT,
                    error_code='INVALID_DATE',
                    message=f'Field {self.field_name} is not a valid date',
                    severity=ValidationSeverity.ERROR,
                    original_value=value,
                    row_number=row_number
                ))
                return result
        else:
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.DATA_TYPE,
                error_code='INVALID_DATE_TYPE',
                message=f'Field {self.field_name} must be a date or string',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
            return result
        
        # Extract date for comparison if datetime
        compare_date = date_value.date() if isinstance(date_value, datetime) else date_value
        
        # Range validation
        if self.min_date:
            min_compare = self.min_date.date() if isinstance(self.min_date, datetime) else self.min_date
            if compare_date < min_compare:
                result.add_error(ValidationError(
                    field_name=self.field_name,
                    error_type=ValidationErrorType.RANGE,
                    error_code='MIN_DATE',
                    message=f'Field {self.field_name} cannot be before {min_compare}',
                    severity=ValidationSeverity.ERROR,
                    original_value=value,
                    row_number=row_number
                ))
        
        if self.max_date:
            max_compare = self.max_date.date() if isinstance(self.max_date, datetime) else self.max_date
            if compare_date > max_compare:
                result.add_error(ValidationError(
                    field_name=self.field_name,
                    error_type=ValidationErrorType.RANGE,
                    error_code='MAX_DATE',
                    message=f'Field {self.field_name} cannot be after {max_compare}',
                    severity=ValidationSeverity.ERROR,
                    original_value=value,
                    row_number=row_number
                ))
        
        # Future date validation
        if not self.allow_future and compare_date > date.today():
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.BUSINESS_RULE,
                error_code='FUTURE_DATE',
                message=f'Field {self.field_name} cannot be a future date',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
        
        return result

class UUIDValidator(BaseValidator):
    """Validator for UUID fields"""
    
    def _validate_value(self, value: Any, row_data: Dict = None, row_number: int = None) -> ValidationResult:
        result = ValidationResult(is_valid=True)
        
        try:
            if isinstance(value, str):
                uuid.UUID(value)
            elif not isinstance(value, uuid.UUID):
                raise ValueError("Not a valid UUID")
        except (ValueError, TypeError):
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.FORMAT,
                error_code='INVALID_UUID',
                message=f'Field {self.field_name} must be a valid UUID',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
        
        return result

class BusinessRuleValidator(BaseValidator):
    """Custom validator for business rule validation"""
    
    def __init__(self, field_name: str, validation_func: callable, error_message: str,
                 error_code: str = 'BUSINESS_RULE', severity: ValidationSeverity = ValidationSeverity.ERROR):
        super().__init__(field_name, required=False, allow_null=True)
        self.validation_func = validation_func
        self.error_message = error_message
        self.error_code = error_code
        self.severity = severity
    
    def _validate_value(self, value: Any, row_data: Dict = None, row_number: int = None) -> ValidationResult:
        result = ValidationResult(is_valid=True)
        
        try:
            is_valid = self.validation_func(value, row_data)
            if not is_valid:
                result.add_error(ValidationError(
                    field_name=self.field_name,
                    error_type=ValidationErrorType.BUSINESS_RULE,
                    error_code=self.error_code,
                    message=self.error_message,
                    severity=self.severity,
                    original_value=value,
                    row_number=row_number,
                    context={'row_data': row_data}
                ))
        except Exception as e:
            result.add_error(ValidationError(
                field_name=self.field_name,
                error_type=ValidationErrorType.CUSTOM,
                error_code='VALIDATION_ERROR',
                message=f'Business rule validation failed: {str(e)}',
                severity=ValidationSeverity.ERROR,
                original_value=value,
                row_number=row_number
            ))
        
        return result

class DataValidator:
    """Main data validation engine"""
    
    def __init__(self):
        self.validators = {}
        self.business_rules = []
        self.duplicate_checkers = {}
    
    def add_validator(self, field_name: str, validator: BaseValidator):
        """Add a validator for a specific field"""
        self.validators[field_name] = validator
    
    def add_business_rule(self, rule: BusinessRuleValidator):
        """Add a business rule validator"""
        self.business_rules.append(rule)
    
    def validate_row(self, row_data: Dict, row_number: int = None) -> ValidationResult:
        """Validate a single row of data"""
        result = ValidationResult(is_valid=True)
        total_fields = len(row_data)
        required_fields = len([v for v in self.validators.values() if v.required])
        
        # Validate individual fields
        for field_name, value in row_data.items():
            if field_name in self.validators:
                field_result = self.validators[field_name].validate(value, row_data, row_number)
                result.errors.extend(field_result.errors)
                result.warnings.extend(field_result.warnings)
                if not field_result.is_valid:
                    result.is_valid = False
        
        # Check for missing required fields
        for field_name, validator in self.validators.items():
            if validator.required and field_name not in row_data:
                result.add_error(ValidationError(
                    field_name=field_name,
                    error_type=ValidationErrorType.REQUIRED_FIELD,
                    error_code='MISSING_FIELD',
                    message=f'Required field {field_name} is missing',
                    severity=ValidationSeverity.ERROR,
                    row_number=row_number
                ))
        
        # Validate business rules
        for rule in self.business_rules:
            rule_result = rule.validate(row_data.get(rule.field_name), row_data, row_number)
            result.errors.extend(rule_result.errors)
            result.warnings.extend(rule_result.warnings)
            if not rule_result.is_valid:
                result.is_valid = False
        
        # Calculate quality scores
        result.calculate_scores(total_fields, required_fields)
        
        return result
    
    def validate_dataset(self, data: List[Dict], check_duplicates: bool = True) -> Tuple[List[ValidationResult], Dict]:
        """Validate an entire dataset"""
        results = []
        duplicate_info = {'count': 0, 'rows': []}
        
        # Track duplicates if requested
        seen_rows = set() if check_duplicates else None
        
        for i, row in enumerate(data, 1):
            row_result = self.validate_row(row, i)
            
            # Check for duplicates
            if check_duplicates and seen_rows is not None:
                row_key = json.dumps(row, sort_keys=True, default=str)
                if row_key in seen_rows:
                    row_result.add_error(ValidationError(
                        field_name='_row',
                        error_type=ValidationErrorType.DUPLICATE,
                        error_code='DUPLICATE_ROW',
                        message=f'Row {i} is a duplicate',
                        severity=ValidationSeverity.WARNING,
                        row_number=i
                    ))
                    duplicate_info['count'] += 1
                    duplicate_info['rows'].append(i)
                else:
                    seen_rows.add(row_key)
            
            results.append(row_result)
        
        return results, duplicate_info

# Predefined validator configurations for common data types
COMMON_VALIDATORS = {
    'sku': StringValidator(
        'sku',
        required=True,
        min_length=3,
        max_length=50,
        pattern=r'^[A-Z0-9\-_]{3,50}$'
    ),
    'email': StringValidator(
        'email',
        required=False,
        pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ),
    'currency': StringValidator(
        'currency',
        required=True,
        allowed_values=['GBP', 'EUR', 'USD']
    ),
    'country_code': StringValidator(
        'country_code',
        required=True,
        allowed_values=['UK', 'EU', 'US', 'GB', 'DE', 'FR', 'IT', 'ES']
    ),
    'positive_integer': NumericValidator(
        'quantity',
        required=True,
        min_value=1,
        data_type='int'
    ),
    'price': NumericValidator(
        'price',
        required=True,
        min_value=0.01,
        max_value=10000.00,
        decimal_places=2,
        data_type='decimal'
    ),
    'percentage': NumericValidator(
        'percentage',
        required=False,
        min_value=0.0,
        max_value=100.0,
        decimal_places=2,
        data_type='decimal'
    ),
    'sale_date': DateValidator(
        'sale_date',
        required=True,
        min_date=date(2020, 1, 1),
        allow_future=False
    )
}

def create_product_validator() -> DataValidator:
    """Create a validator for product data"""
    validator = DataValidator()
    
    # Basic field validators
    validator.add_validator('sku', StringValidator('sku', required=True, min_length=3, max_length=50, 
                                                  pattern=r'^[A-Z0-9\-_]{3,50}$'))
    validator.add_validator('name', StringValidator('name', required=True, min_length=1, max_length=100))
    validator.add_validator('category', StringValidator('category', required=True, 
                                                       allowed_values=['GABA Red', 'GABA Black', 'GABA Gold']))
    validator.add_validator('market_region', StringValidator('market_region', required=True, 
                                                            allowed_values=['UK', 'EU', 'USA']))
    validator.add_validator('weight_kg', NumericValidator('weight_kg', min_value=0.001, max_value=50.000, 
                                                         decimal_places=3, data_type='decimal'))
    validator.add_validator('unit_cost', NumericValidator('unit_cost', min_value=0.01, max_value=10000.00, 
                                                         decimal_places=2, data_type='decimal'))
    validator.add_validator('selling_price', NumericValidator('selling_price', min_value=0.01, max_value=10000.00, 
                                                             decimal_places=2, data_type='decimal'))
    
    # Business rule: selling_price > unit_cost
    validator.add_business_rule(BusinessRuleValidator(
        'selling_price',
        lambda value, row: float(value) > float(row.get('unit_cost', 0)),
        'Selling price must be greater than unit cost',
        'PRICE_MARGIN'
    ))
    
    return validator

def create_sales_validator() -> DataValidator:
    """Create a validator for historical sales data"""
    validator = DataValidator()
    
    # Basic field validators
    validator.add_validator('product_id', UUIDValidator('product_id', required=True))
    validator.add_validator('sales_channel_id', UUIDValidator('sales_channel_id', required=True))
    validator.add_validator('sale_date', DateValidator('sale_date', required=True, 
                                                      min_date=date(2020, 1, 1), allow_future=False))
    validator.add_validator('quantity_sold', NumericValidator('quantity_sold', required=True, 
                                                             min_value=1, max_value=10000, data_type='int'))
    validator.add_validator('unit_price', NumericValidator('unit_price', required=True, 
                                                          min_value=0.01, max_value=1000.00, 
                                                          decimal_places=2, data_type='decimal'))
    validator.add_validator('gross_revenue', NumericValidator('gross_revenue', required=True, 
                                                             min_value=0.01, decimal_places=2, data_type='decimal'))
    
    # Business rule: gross_revenue = quantity_sold * unit_price
    validator.add_business_rule(BusinessRuleValidator(
        'gross_revenue',
        lambda value, row: abs(float(value) - (int(row.get('quantity_sold', 0)) * float(row.get('unit_price', 0)))) < 0.01,
        'Gross revenue must equal quantity sold × unit price',
        'REVENUE_CALCULATION'
    ))
    
    return validator