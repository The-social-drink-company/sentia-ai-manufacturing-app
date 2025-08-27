import os
import csv
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple, Union
from werkzeug.utils import secure_filename
import pandas as pd
from openpyxl import load_workbook
from sqlalchemy.exc import IntegrityError
import uuid
from flask import current_app

from app import db
from app.models.data_import import DataImport, ImportError, ImportLog, ImportStatus, ImportType, FileType
from app.utils.validation import DataValidator, ValidationResult, create_product_validator, create_sales_validator

class ImportProcessor:
    """Main class for handling data import processing"""
    
    def __init__(self, import_id: str):
        self.import_id = import_id
        self.data_import = DataImport.query.get(import_id)
        if not self.data_import:
            raise ValueError(f"Import {import_id} not found")
        
        self.validator = self._get_validator()
        self.upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    
    def _get_validator(self) -> DataValidator:
        """Get appropriate validator based on import type"""
        validators = {
            ImportType.PRODUCTS: create_product_validator,
            ImportType.HISTORICAL_SALES: create_sales_validator,
            # Add more validators as needed
        }
        
        validator_func = validators.get(self.data_import.import_type)
        if validator_func:
            return validator_func()
        else:
            return DataValidator()  # Basic validator
    
    def process_import(self) -> bool:
        """Main method to process the import"""
        try:
            self.data_import.status = ImportStatus.PROCESSING
            self.data_import.started_at = datetime.now(timezone.utc)
            db.session.commit()
            
            self._log_info("Starting import processing")
            
            # Step 1: Load and parse file
            self._update_progress(10, "Loading file...")
            raw_data = self._load_file()
            
            # Step 2: Validate data structure
            self._update_progress(30, "Validating data structure...")
            validation_results = self._validate_data(raw_data)
            
            # Step 3: Check validation results
            if not self._check_validation_results(validation_results):
                return False
            
            # Step 4: Transform and clean data
            self._update_progress(50, "Transforming data...")
            clean_data = self._transform_data(raw_data, validation_results)
            
            # Step 5: Import data to database
            self._update_progress(70, "Importing to database...")
            import_results = self._import_to_database(clean_data)
            
            # Step 6: Finalize import
            self._update_progress(100, "Finalizing import...")
            self._finalize_import(import_results)
            
            self._log_info("Import processing completed successfully")
            return True
            
        except Exception as e:
            self._log_error(f"Import processing failed: {str(e)}")
            self.data_import.mark_failed(str(e))
            return False
    
    def _load_file(self) -> List[Dict]:
        """Load and parse the uploaded file"""
        file_path = self.data_import.file_path
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Import file not found: {file_path}")
        
        file_type = self.data_import.file_type
        
        try:
            if file_type == FileType.CSV:
                return self._load_csv(file_path)
            elif file_type == FileType.XLSX:
                return self._load_excel(file_path)
            elif file_type == FileType.JSON:
                return self._load_json(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
                
        except Exception as e:
            raise Exception(f"Failed to load file: {str(e)}")
    
    def _load_csv(self, file_path: str) -> List[Dict]:
        """Load CSV file"""
        data = []
        
        # Detect encoding
        encodings = ['utf-8', 'latin-1', 'cp1252']
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    # Detect delimiter
                    sample = file.read(1024)
                    file.seek(0)
                    
                    delimiter = self._detect_delimiter(sample)
                    
                    reader = csv.DictReader(file, delimiter=delimiter)
                    data = [row for row in reader]
                    break
            except UnicodeDecodeError:
                continue
        
        if not data:
            raise Exception("Could not read CSV file with any supported encoding")
        
        self.data_import.total_rows = len(data)
        return data
    
    def _load_excel(self, file_path: str) -> List[Dict]:
        """Load Excel file"""
        try:
            # Use pandas for initial loading
            df = pd.read_excel(file_path, engine='openpyxl')
            
            # Convert to list of dictionaries
            data = df.to_dict('records')
            
            # Clean up NaN values
            for row in data:
                for key, value in row.items():
                    if pd.isna(value):
                        row[key] = None
            
            self.data_import.total_rows = len(data)
            return data
            
        except Exception as e:
            raise Exception(f"Failed to load Excel file: {str(e)}")
    
    def _load_json(self, file_path: str) -> List[Dict]:
        """Load JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                json_data = json.load(file)
            
            # Handle different JSON structures
            if isinstance(json_data, list):
                data = json_data
            elif isinstance(json_data, dict):
                # Look for common data keys
                data_keys = ['data', 'records', 'rows', 'items']
                data = None
                for key in data_keys:
                    if key in json_data and isinstance(json_data[key], list):
                        data = json_data[key]
                        break
                
                if data is None:
                    data = [json_data]  # Single record
            else:
                raise ValueError("JSON must contain an array or object with data array")
            
            self.data_import.total_rows = len(data)
            return data
            
        except Exception as e:
            raise Exception(f"Failed to load JSON file: {str(e)}")
    
    def _detect_delimiter(self, sample: str) -> str:
        """Detect CSV delimiter"""
        delimiters = [',', ';', '\t', '|']
        delimiter_counts = {}
        
        for delimiter in delimiters:
            delimiter_counts[delimiter] = sample.count(delimiter)
        
        # Return delimiter with highest count
        return max(delimiter_counts, key=delimiter_counts.get)
    
    def _validate_data(self, data: List[Dict]) -> List[ValidationResult]:
        """Validate all rows of data"""
        self._log_info(f"Starting validation of {len(data)} rows")
        
        results = []
        for i, row in enumerate(data, 1):
            result = self.validator.validate_row(row, i)
            results.append(result)
            
            # Log validation errors
            for error in result.errors:
                self._create_import_error(
                    row_number=i,
                    column_name=error.field_name,
                    error_type=error.error_type.value,
                    error_code=error.error_code,
                    error_message=error.message,
                    error_severity='error',
                    original_value=str(error.original_value) if error.original_value is not None else None,
                    suggested_value=str(error.suggested_value) if error.suggested_value is not None else None,
                    row_data=row
                )
            
            # Log validation warnings
            for warning in result.warnings:
                self._create_import_error(
                    row_number=i,
                    column_name=warning.field_name,
                    error_type=warning.error_type.value,
                    error_code=warning.error_code,
                    error_message=warning.message,
                    error_severity='warning',
                    original_value=str(warning.original_value) if warning.original_value is not None else None,
                    suggested_value=str(warning.suggested_value) if warning.suggested_value is not None else None,
                    row_data=row
                )
            
            # Update progress periodically
            if i % 100 == 0:
                progress = 30 + int((i / len(data)) * 20)  # 30-50% range for validation
                self._update_progress(progress, f"Validating data... ({i}/{len(data)} rows)")
        
        self._log_info(f"Validation completed. Found {sum(len(r.errors) for r in results)} errors and {sum(len(r.warnings) for r in results)} warnings")
        
        return results
    
    def _check_validation_results(self, validation_results: List[ValidationResult]) -> bool:
        """Check if validation results meet import criteria"""
        total_rows = len(validation_results)
        error_rows = sum(1 for result in validation_results if not result.is_valid)
        
        if total_rows == 0:
            self.data_import.mark_failed("No data rows found in file")
            return False
        
        error_percentage = (error_rows / total_rows) * 100
        
        # Get error threshold from import settings
        settings = self.data_import.import_settings or {}
        error_threshold = settings.get('error_threshold', 10)
        
        if error_percentage > error_threshold:
            self.data_import.mark_failed(
                f"Error rate {error_percentage:.1f}% exceeds threshold {error_threshold}%"
            )
            return False
        
        self._log_info(f"Validation passed: {error_rows} errors out of {total_rows} rows ({error_percentage:.1f}%)")
        return True
    
    def _transform_data(self, raw_data: List[Dict], validation_results: List[ValidationResult]) -> List[Dict]:
        """Transform and clean data based on validation results"""
        clean_data = []
        
        settings = self.data_import.import_settings or {}
        auto_correct = settings.get('auto_correct', True)
        
        for i, (row, result) in enumerate(zip(raw_data, validation_results)):
            if result.is_valid:
                # Apply auto-corrections if enabled
                if auto_correct:
                    corrected_row = self._apply_auto_corrections(row, result)
                    clean_data.append(corrected_row)
                else:
                    clean_data.append(row)
        
        self._log_info(f"Data transformation completed. {len(clean_data)} rows ready for import")
        return clean_data
    
    def _apply_auto_corrections(self, row: Dict, result: ValidationResult) -> Dict:
        """Apply automatic corrections to data"""
        corrected_row = row.copy()
        
        # Apply suggested corrections from validation warnings
        for warning in result.warnings:
            if warning.suggested_value is not None:
                corrected_row[warning.field_name] = warning.suggested_value
                self._log_info(f"Auto-corrected {warning.field_name}: {warning.original_value} -> {warning.suggested_value}")
        
        return corrected_row
    
    def _import_to_database(self, data: List[Dict]) -> Dict:
        """Import clean data to database"""
        successful_imports = 0
        failed_imports = 0
        duplicate_imports = 0
        
        import_type = self.data_import.import_type
        
        for i, row in enumerate(data, 1):
            try:
                if import_type == ImportType.PRODUCTS:
                    success, is_duplicate = self._import_product_row(row)
                elif import_type == ImportType.HISTORICAL_SALES:
                    success, is_duplicate = self._import_sales_row(row)
                else:
                    # Generic import - you'll need to implement specific importers
                    success, is_duplicate = self._import_generic_row(row)
                
                if success:
                    if is_duplicate:
                        duplicate_imports += 1
                    else:
                        successful_imports += 1
                else:
                    failed_imports += 1
                
            except Exception as e:
                self._log_error(f"Failed to import row {i}: {str(e)}")
                failed_imports += 1
            
            # Update progress
            if i % 50 == 0:
                progress = 70 + int((i / len(data)) * 20)  # 70-90% range for database import
                self._update_progress(progress, f"Importing to database... ({i}/{len(data)} rows)")
        
        results = {
            'successful': successful_imports,
            'failed': failed_imports,
            'duplicates': duplicate_imports
        }
        
        self._log_info(f"Database import completed: {successful_imports} successful, {failed_imports} failed, {duplicate_imports} duplicates")
        
        return results
    
    def _import_product_row(self, row: Dict) -> Tuple[bool, bool]:
        """Import a product row"""
        from app.models.product import Product
        
        try:
            # Check for existing product by SKU
            existing = Product.get_by_sku(row['sku'])
            
            if existing:
                # Update existing product
                for key, value in row.items():
                    if hasattr(existing, key) and value is not None:
                        setattr(existing, key, value)
                db.session.commit()
                return True, True  # Success, is duplicate/update
            else:
                # Create new product
                product = Product(**row)
                product.created_by = self.data_import.created_by
                db.session.add(product)
                db.session.commit()
                return True, False  # Success, not duplicate
                
        except IntegrityError as e:
            db.session.rollback()
            self._log_error(f"Database integrity error importing product: {str(e)}")
            return False, False
        except Exception as e:
            db.session.rollback()
            self._log_error(f"Error importing product: {str(e)}")
            return False, False
    
    def _import_sales_row(self, row: Dict) -> Tuple[bool, bool]:
        """Import a historical sales row"""
        from app.models.historical_sales import HistoricalSales
        
        try:
            # Create historical sales record
            sales_record = HistoricalSales(**row)
            sales_record.created_by = self.data_import.created_by
            sales_record.data_source = 'Import'
            
            # Set data quality score from validation
            # This would come from the validation results
            sales_record.data_quality_score = 0.9  # Default, should be calculated
            
            db.session.add(sales_record)
            db.session.commit()
            return True, False  # Success, not duplicate (sales records are unique by timestamp)
            
        except IntegrityError as e:
            db.session.rollback()
            self._log_error(f"Database integrity error importing sales: {str(e)}")
            return False, False
        except Exception as e:
            db.session.rollback()
            self._log_error(f"Error importing sales: {str(e)}")
            return False, False
    
    def _import_generic_row(self, row: Dict) -> Tuple[bool, bool]:
        """Generic import method - override for specific types"""
        # Placeholder for other import types
        return True, False
    
    def _finalize_import(self, import_results: Dict):
        """Finalize the import process"""
        successful = import_results['successful']
        failed = import_results['failed']
        duplicates = import_results['duplicates']
        
        # Calculate data quality scores
        total_processed = successful + duplicates
        if total_processed > 0:
            self.data_import.data_quality_score = successful / total_processed
        
        # Mark import as completed
        self.data_import.mark_completed(successful, failed, duplicates)
        
        self._log_info("Import finalized successfully")
    
    def _update_progress(self, percentage: int, message: str):
        """Update import progress"""
        self.data_import.update_progress(percentage, message)
    
    def _log_info(self, message: str, context: Dict = None):
        """Log info message"""
        self._create_log_entry('INFO', message, context)
    
    def _log_error(self, message: str, context: Dict = None):
        """Log error message"""
        self._create_log_entry('ERROR', message, context)
    
    def _create_log_entry(self, level: str, message: str, context: Dict = None):
        """Create import log entry"""
        log_entry = ImportLog(
            import_id=self.import_id,
            log_level=level,
            log_message=message,
            log_context=context,
            step_name=self.data_import.current_step
        )
        db.session.add(log_entry)
        db.session.commit()
    
    def _create_import_error(self, row_number: int, column_name: str, error_type: str,
                           error_code: str, error_message: str, error_severity: str,
                           original_value: str = None, suggested_value: str = None,
                           row_data: Dict = None):
        """Create import error record"""
        import_error = ImportError(
            import_id=self.import_id,
            row_number=row_number,
            column_name=column_name,
            error_type=error_type,
            error_code=error_code,
            error_message=error_message,
            error_severity=error_severity,
            original_value=original_value,
            suggested_value=suggested_value,
            row_data=row_data
        )
        db.session.add(import_error)
        db.session.commit()

class FileUploadHandler:
    """Handler for file upload operations"""
    
    def __init__(self, upload_folder: str):
        self.upload_folder = upload_folder
        self.max_file_size = 100 * 1024 * 1024  # 100MB
        self.allowed_extensions = {'.csv', '.xlsx', '.json'}
    
    def save_uploaded_file(self, file, import_type: str) -> Tuple[str, str, int]:
        """Save uploaded file and return file path, hash, and size"""
        if not file or file.filename == '':
            raise ValueError("No file selected")
        
        # Validate file
        self._validate_file(file)
        
        # Generate secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        
        # Create upload directory if it doesn't exist
        os.makedirs(self.upload_folder, exist_ok=True)
        
        # Save file
        file_path = os.path.join(self.upload_folder, filename)
        file.save(file_path)
        
        # Calculate file hash and size
        file_hash = self._calculate_file_hash(file_path)
        file_size = os.path.getsize(file_path)
        
        return file_path, file_hash, file_size
    
    def _validate_file(self, file):
        """Validate uploaded file"""
        # Check file extension
        filename = file.filename.lower()
        if not any(filename.endswith(ext) for ext in self.allowed_extensions):
            raise ValueError(f"File type not allowed. Allowed types: {', '.join(self.allowed_extensions)}")
        
        # Check file size (approximate)
        file.seek(0, 2)  # Seek to end
        size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if size > self.max_file_size:
            raise ValueError(f"File too large. Maximum size: {self.max_file_size // (1024*1024)}MB")
    
    def _calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of file"""
        hash_sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def get_file_type(self, filename: str) -> FileType:
        """Determine file type from filename"""
        extension = os.path.splitext(filename.lower())[1]
        
        type_mapping = {
            '.csv': FileType.CSV,
            '.xlsx': FileType.XLSX,
            '.json': FileType.JSON
        }
        
        return type_mapping.get(extension, FileType.CSV)
    
    def preview_file_data(self, file_path: str, file_type: FileType, max_rows: int = 10) -> Dict:
        """Generate preview of file data"""
        try:
            if file_type == FileType.CSV:
                return self._preview_csv(file_path, max_rows)
            elif file_type == FileType.XLSX:
                return self._preview_excel(file_path, max_rows)
            elif file_type == FileType.JSON:
                return self._preview_json(file_path, max_rows)
            else:
                raise ValueError(f"Unsupported file type for preview: {file_type}")
                
        except Exception as e:
            raise Exception(f"Failed to preview file: {str(e)}")
    
    def _preview_csv(self, file_path: str, max_rows: int) -> Dict:
        """Preview CSV file"""
        with open(file_path, 'r', encoding='utf-8') as file:
            # Detect delimiter
            sample = file.read(1024)
            file.seek(0)
            
            delimiter = self._detect_delimiter(sample)
            
            reader = csv.DictReader(file, delimiter=delimiter)
            headers = reader.fieldnames
            
            data = []
            for i, row in enumerate(reader):
                if i >= max_rows:
                    break
                data.append(row)
            
            # Count total rows
            file.seek(0)
            total_rows = sum(1 for _ in reader) - 1  # Subtract header row
        
        return {
            'headers': headers,
            'data': data,
            'total_rows': total_rows,
            'file_type': 'CSV'
        }
    
    def _preview_excel(self, file_path: str, max_rows: int) -> Dict:
        """Preview Excel file"""
        df = pd.read_excel(file_path, nrows=max_rows)
        
        # Get full row count
        full_df = pd.read_excel(file_path, usecols=[0])  # Read only first column for counting
        total_rows = len(full_df)
        
        headers = df.columns.tolist()
        data = df.fillna('').to_dict('records')
        
        return {
            'headers': headers,
            'data': data,
            'total_rows': total_rows,
            'file_type': 'Excel'
        }
    
    def _preview_json(self, file_path: str, max_rows: int) -> Dict:
        """Preview JSON file"""
        with open(file_path, 'r', encoding='utf-8') as file:
            json_data = json.load(file)
        
        if isinstance(json_data, list):
            data = json_data[:max_rows]
            total_rows = len(json_data)
        elif isinstance(json_data, dict):
            # Look for data array
            data_keys = ['data', 'records', 'rows', 'items']
            data = None
            total_rows = 0
            
            for key in data_keys:
                if key in json_data and isinstance(json_data[key], list):
                    full_data = json_data[key]
                    data = full_data[:max_rows]
                    total_rows = len(full_data)
                    break
            
            if data is None:
                data = [json_data]
                total_rows = 1
        else:
            raise ValueError("Unsupported JSON structure")
        
        # Extract headers from first row
        headers = list(data[0].keys()) if data else []
        
        return {
            'headers': headers,
            'data': data,
            'total_rows': total_rows,
            'file_type': 'JSON'
        }
    
    def _detect_delimiter(self, sample: str) -> str:
        """Detect CSV delimiter"""
        delimiters = [',', ';', '\t', '|']
        delimiter_counts = {d: sample.count(d) for d in delimiters}
        return max(delimiter_counts, key=delimiter_counts.get)