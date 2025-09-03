/**
 * Data Validation Engine
 * Implements comprehensive validation rules based on context/business-logic/data_validation_rules.md
 */

import { logError, logWarn, logInfo } from '../../services/logger.js';

class ValidationEngine {
  constructor() {
    this.validationRules = this.initializeRules();
  }

  initializeRules() {
    return {
      // Product Data Validation
      products: {
        sku: {
          required: true,
          type: 'string',
          format: /^[A-Z0-9\-_]{3,50}$/,
          unique: true,
          description: 'Format: [PRODUCT]-[REGION]-[VARIANT] (e.g., "GABA-RED-UK-001")'
        },
        name: {
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 255
        },
        weight_kg: {
          required: true,
          type: 'number',
          min: 0.001,
          max: 50.000,
          precision: 3
        },
        dimensions_cm: {
          required: true,
          type: 'string',
          format: /^\d+(\.\d+)?x\d+(\.\d+)?x\d+(\.\d+)?$/,
          description: 'Format: "LxWxH" (e.g., "10.5x5.2x15.0")'
        },
        unit_cost: {
          required: true,
          type: 'number',
          min: 0.01,
          max: 10000.00,
          precision: 2
        },
        selling_price: {
          required: true,
          type: 'number',
          min: 0.01,
          max: 10000.00,
          precision: 2,
          businessRule: 'selling_price > unit_cost'
        },
        production_time_hours: {
          required: false,
          type: 'number',
          min: 0.1,
          max: 72.0,
          precision: 2
        },
        batch_size_min: {
          required: false,
          type: 'integer',
          min: 1,
          max: 10000
        },
        batch_size_max: {
          required: false,
          type: 'integer',
          min: 1,
          max: 100000,
          businessRule: 'batch_size_max >= batch_size_min'
        }
      },

      // Sales Data Validation
      historical_sales: {
        sku: {
          required: true,
          type: 'string',
          format: /^[A-Z0-9\-_]{3,50}$/,
          foreignKey: 'products.sku'
        },
        sale_date: {
          required: true,
          type: 'date',
          format: 'YYYY-MM-DD',
          min: '2020-01-01',
          maxDaysFromNow: 7
        },
        quantity_sold: {
          required: true,
          type: 'integer',
          min: 1,
          max: 10000
        },
        unit_price: {
          required: true,
          type: 'number',
          min: 0.01,
          max: 1000.00,
          precision: 2
        },
        currency: {
          required: true,
          type: 'string',
          enum: ['GBP', 'EUR', 'USD'],
          description: 'ISO 4217 currency codes'
        },
        gross_revenue: {
          required: false,
          type: 'number',
          businessRule: 'gross_revenue = quantity_sold * unit_price'
        },
        net_revenue: {
          required: false,
          type: 'number',
          businessRule: 'net_revenue = gross_revenue - discounts',
          min: 0
        },
        discounts: {
          required: false,
          type: 'number',
          min: 0,
          businessRule: 'discounts <= gross_revenue'
        },
        shipping_country: {
          required: false,
          type: 'string',
          format: /^[A-Z]{2}$/,
          enum: ['GB', 'US', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'DK', 'SE', 'NO', 'FI'],
          description: 'ISO 3166-1 alpha-2 country codes'
        }
      },

      // Inventory Data Validation
      inventory_levels: {
        sku: {
          required: true,
          type: 'string',
          format: /^[A-Z0-9\-_]{3,50}$/,
          foreignKey: 'products.sku'
        },
        warehouse_location: {
          required: true,
          type: 'string',
          minLength: 2,
          maxLength: 100
        },
        quantity_on_hand: {
          required: true,
          type: 'integer',
          min: 0
        },
        reserved_quantity: {
          required: false,
          type: 'integer',
          min: 0,
          businessRule: 'reserved_quantity <= quantity_on_hand'
        },
        available_quantity: {
          required: false,
          type: 'integer',
          businessRule: 'available_quantity = quantity_on_hand - reserved_quantity'
        },
        reorder_point: {
          required: false,
          type: 'integer',
          min: 0
        },
        max_stock_level: {
          required: false,
          type: 'integer',
          min: 0,
          businessRule: 'max_stock_level >= reorder_point'
        }
      },

      // Manufacturing Data Validation
      manufacturing_data: {
        job_number: {
          required: true,
          type: 'string',
          minLength: 3,
          maxLength: 50,
          unique: true
        },
        product_sku: {
          required: true,
          type: 'string',
          format: /^[A-Z0-9\-_]{3,50}$/,
          foreignKey: 'products.sku'
        },
        batch_number: {
          required: true,
          type: 'string',
          minLength: 3,
          maxLength: 50,
          unique: true
        },
        quantity_produced: {
          required: true,
          type: 'integer',
          min: 1
        },
        production_date: {
          required: true,
          type: 'date',
          format: 'YYYY-MM-DD',
          maxDaysFromNow: 0
        },
        quality_score: {
          required: false,
          type: 'number',
          min: 0,
          max: 100,
          precision: 2
        },
        defect_rate: {
          required: false,
          type: 'number',
          min: 0,
          max: 100,
          precision: 2,
          warning: { threshold: 10, message: 'High defect rate detected' }
        },
        yield_percentage: {
          required: false,
          type: 'number',
          min: 70,
          max: 100,
          precision: 2,
          warning: { threshold: 85, message: 'Low yield rate detected' }
        }
      },

      // Financial Data Validation
      financial_data: {
        transaction_date: {
          required: true,
          type: 'date',
          format: 'YYYY-MM-DD',
          min: '2020-01-01',
          maxDaysFromNow: 0
        },
        transaction_type: {
          required: true,
          type: 'string',
          enum: ['revenue', 'cost', 'expense', 'tax', 'fee', 'adjustment']
        },
        amount: {
          required: true,
          type: 'number',
          precision: 2
        },
        currency: {
          required: true,
          type: 'string',
          enum: ['GBP', 'EUR', 'USD']
        },
        account_code: {
          required: false,
          type: 'string',
          format: /^\d{4}-\d{2}$/,
          description: 'Format: XXXX-XX'
        }
      }
    };
  }

  /**
   * Validate a single row of data
   * @param {Object} data - Row data to validate
   * @param {string} dataType - Type of data (products, historical_sales, etc.)
   * @param {number} rowNumber - Row number for error reporting
   * @param {Object} context - Additional context (existing data, etc.)
   * @returns {Object} Validation result
   */
  async validateRow(data, dataType, rowNumber, context = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      processedData: { ...data }
    };

    const rules = this.validationRules[dataType];
    if (!rules) {
      result.errors.push({
        field: 'dataType',
        message: `Unknown data type: ${dataType}`,
        code: 'UNKNOWN_DATA_TYPE'
      });
      result.isValid = false;
      return result;
    }

    // Validate each field
    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const fieldResult = await this.validateField(
        data[fieldName], 
        fieldName, 
        fieldRules, 
        data, 
        rowNumber, 
        context
      );
      
      if (!fieldResult.isValid) {
        result.isValid = false;
        result.errors.push(...fieldResult.errors);
      }
      
      result.warnings.push(...fieldResult.warnings);
      
      // Use processed value if different
      if (fieldResult.processedValue !== undefined) {
        result.processedData[fieldName] = fieldResult.processedValue;
      }
    }

    // Validate business rules
    const businessRuleResult = this.validateBusinessRules(result.processedData, dataType, rowNumber);
    if (!businessRuleResult.isValid) {
      result.isValid = false;
      result.errors.push(...businessRuleResult.errors);
    }
    result.warnings.push(...businessRuleResult.warnings);

    return result;
  }

  /**
   * Validate a single field
   */
  async validateField(value, fieldName, rules, rowData, rowNumber, context) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      processedValue: value
    };

    // Required field validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      result.errors.push({
        field: fieldName,
        message: `Required field '${fieldName}' is missing`,
        code: 'REQUIRED_FIELD_MISSING',
        rowNumber
      });
      result.isValid = false;
      return result;
    }

    // Skip other validations if value is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return result;
    }

    // Type validation and conversion
    const typeResult = this.validateType(value, rules.type, fieldName, rowNumber);
    if (!typeResult.isValid) {
      result.errors.push(...typeResult.errors);
      result.isValid = false;
    } else {
      result.processedValue = typeResult.processedValue;
      value = typeResult.processedValue;
    }

    // Format validation
    if (rules.format && typeof value === 'string') {
      if (!rules.format.test(value)) {
        result.errors.push({
          field: fieldName,
          message: `Invalid format for '${fieldName}'. ${rules.description || ''}`,
          code: 'INVALID_FORMAT',
          rowNumber
        });
        result.isValid = false;
      }
    }

    // Range validation
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        result.errors.push({
          field: fieldName,
          message: `Value ${value} is below minimum ${rules.min} for '${fieldName}'`,
          code: 'VALUE_BELOW_MINIMUM',
          rowNumber
        });
        result.isValid = false;
      }
      
      if (rules.max !== undefined && value > rules.max) {
        result.errors.push({
          field: fieldName,
          message: `Value ${value} exceeds maximum ${rules.max} for '${fieldName}'`,
          code: 'VALUE_ABOVE_MAXIMUM',
          rowNumber
        });
        result.isValid = false;
      }
    }

    // String length validation
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        result.errors.push({
          field: fieldName,
          message: `Text too short for '${fieldName}' (minimum ${rules.minLength} characters)`,
          code: 'TEXT_TOO_SHORT',
          rowNumber
        });
        result.isValid = false;
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        result.errors.push({
          field: fieldName,
          message: `Text too long for '${fieldName}' (maximum ${rules.maxLength} characters)`,
          code: 'TEXT_TOO_LONG',
          rowNumber
        });
        result.isValid = false;
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      result.errors.push({
        field: fieldName,
        message: `Invalid value '${value}' for '${fieldName}'. Allowed values: ${rules.enum.join(', ')}`,
        code: 'INVALID_ENUM_VALUE',
        rowNumber
      });
      result.isValid = false;
    }

    // Precision validation for numbers
    if (rules.precision && typeof value === 'number') {
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > rules.precision) {
        result.warnings.push({
          field: fieldName,
          message: `Value ${value} has more than ${rules.precision} decimal places`,
          code: 'PRECISION_WARNING',
          rowNumber
        });
        // Round to specified precision
        result.processedValue = parseFloat(value.toFixed(rules.precision));
      }
    }

    // Warning thresholds
    if (rules.warning && typeof value === 'number') {
      if (value < rules.warning.threshold) {
        result.warnings.push({
          field: fieldName,
          message: rules.warning.message || `Value ${value} is below warning threshold`,
          code: 'WARNING_THRESHOLD',
          rowNumber
        });
      }
    }

    return result;
  }

  /**
   * Validate and convert data types
   */
  validateType(value, expectedType, fieldName, rowNumber) {
    const result = {
      isValid: true,
      errors: [],
      processedValue: value
    };

    try {
      switch (expectedType) {
        case 'string':
          result.processedValue = String(value);
          break;

        case 'number':
          if (typeof value === 'string') {
            // Remove common currency symbols and whitespace
            const cleanValue = value.replace(/[$£€,\s]/g, '');
            const parsed = parseFloat(cleanValue);
            if (isNaN(parsed)) {
              throw new Error(`Cannot convert '${value}' to number`);
            }
            result.processedValue = parsed;
          } else if (typeof value !== 'number') {
            throw new Error(`Expected number, got ${typeof value}`);
          }
          break;

        case 'integer':
          if (typeof value === 'string') {
            const parsed = parseInt(value.replace(/[,\s]/g, ''), 10);
            if (isNaN(parsed)) {
              throw new Error(`Cannot convert '${value}' to integer`);
            }
            result.processedValue = parsed;
          } else if (typeof value === 'number') {
            result.processedValue = Math.floor(value);
          } else {
            throw new Error(`Expected integer, got ${typeof value}`);
          }
          break;

        case 'date':
          if (typeof value === 'string') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              throw new Error(`Invalid date format: ${value}`);
            }
            result.processedValue = date.toISOString().split('T')[0]; // YYYY-MM-DD
          } else if (value instanceof Date) {
            result.processedValue = value.toISOString().split('T')[0];
          } else {
            throw new Error(`Expected date, got ${typeof value}`);
          }
          break;

        case 'boolean':
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            if (['true', '1', 'yes', 'y'].includes(lowerValue)) {
              result.processedValue = true;
            } else if (['false', '0', 'no', 'n'].includes(lowerValue)) {
              result.processedValue = false;
            } else {
              throw new Error(`Cannot convert '${value}' to boolean`);
            }
          } else if (typeof value !== 'boolean') {
            throw new Error(`Expected boolean, got ${typeof value}`);
          }
          break;

        default:
          // No conversion needed
          break;
      }
    } catch (error) {
      result.errors.push({
        field: fieldName,
        message: `Type validation failed: ${error.message}`,
        code: 'TYPE_VALIDATION_ERROR',
        rowNumber
      });
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate business rules across fields
   */
  validateBusinessRules(data, dataType, rowNumber) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const rules = this.validationRules[dataType];
    if (!rules) return result;

    // Check business rules defined in field definitions
    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      if (fieldRules.businessRule) {
        const ruleResult = this.evaluateBusinessRule(
          fieldRules.businessRule, 
          data, 
          fieldName, 
          rowNumber
        );
        if (!ruleResult.isValid) {
          result.errors.push(...ruleResult.errors);
          result.isValid = false;
        }
        result.warnings.push(...ruleResult.warnings);
      }
    }

    // Data type specific business rules
    switch (dataType) {
      case 'products':
        if (data.selling_price && data.unit_cost && data.selling_price <= data.unit_cost) {
          result.errors.push({
            field: 'selling_price',
            message: 'Selling price must be greater than unit cost',
            code: 'BUSINESS_RULE_VIOLATION',
            rowNumber
          });
          result.isValid = false;
        }
        break;

      case 'historical_sales':
        // Calculate gross revenue if not provided
        if (data.quantity_sold && data.unit_price && !data.gross_revenue) {
          data.gross_revenue = data.quantity_sold * data.unit_price;
        }
        
        // Validate revenue calculations
        if (data.gross_revenue && data.quantity_sold && data.unit_price) {
          const expectedGross = data.quantity_sold * data.unit_price;
          const tolerance = 0.01;
          if (Math.abs(data.gross_revenue - expectedGross) > tolerance) {
            result.warnings.push({
              field: 'gross_revenue',
              message: `Gross revenue ${data.gross_revenue} doesn't match quantity × price ${expectedGross}`,
              code: 'CALCULATION_MISMATCH',
              rowNumber
            });
          }
        }
        break;

      case 'inventory_levels':
        if (data.available_quantity && data.quantity_on_hand && data.reserved_quantity) {
          const expectedAvailable = data.quantity_on_hand - data.reserved_quantity;
          if (data.available_quantity !== expectedAvailable) {
            result.warnings.push({
              field: 'available_quantity',
              message: `Available quantity should be ${expectedAvailable} (on_hand - reserved)`,
              code: 'CALCULATION_MISMATCH',
              rowNumber
            });
          }
        }
        break;
    }

    return result;
  }

  /**
   * Evaluate a business rule string
   */
  evaluateBusinessRule(rule, data, fieldName, rowNumber) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Simple rule evaluation - in production, use a proper expression parser
      if (rule.includes('>')) {
        const [left, right] = rule.split('>').map(s => s.trim());
        const leftValue = this.getFieldValue(left, data);
        const rightValue = this.getFieldValue(right, data);
        
        if (leftValue !== null && rightValue !== null && leftValue <= rightValue) {
          result.errors.push({
            field: fieldName,
            message: `Business rule violation: ${rule}`,
            code: 'BUSINESS_RULE_VIOLATION',
            rowNumber
          });
          result.isValid = false;
        }
      } else if (rule.includes('>=')) {
        const [left, right] = rule.split('>=').map(s => s.trim());
        const leftValue = this.getFieldValue(left, data);
        const rightValue = this.getFieldValue(right, data);
        
        if (leftValue !== null && rightValue !== null && leftValue < rightValue) {
          result.errors.push({
            field: fieldName,
            message: `Business rule violation: ${rule}`,
            code: 'BUSINESS_RULE_VIOLATION',
            rowNumber
          });
          result.isValid = false;
        }
      } else if (rule.includes('=')) {
        // Calculation rules - mark as warning if values don't match
        const [left, right] = rule.split('=').map(s => s.trim());
        const leftValue = this.getFieldValue(left, data);
        const rightValue = this.evaluateExpression(right, data);
        
        if (leftValue !== null && rightValue !== null && Math.abs(leftValue - rightValue) > 0.01) {
          result.warnings.push({
            field: fieldName,
            message: `Calculated value mismatch: ${rule}`,
            code: 'CALCULATION_MISMATCH',
            rowNumber
          });
        }
      }
    } catch (error) {
      logWarn('Business rule evaluation failed', { rule, error: error.message });
    }

    return result;
  }

  /**
   * Get field value from data object
   */
  getFieldValue(fieldName, data) {
    return data[fieldName] !== undefined ? data[fieldName] : null;
  }

  /**
   * Evaluate simple mathematical expressions
   */
  evaluateExpression(expression, data) {
    try {
      // Simple expression evaluator - replace field names with values
      let expr = expression;
      for (const [field, value] of Object.entries(data)) {
        if (typeof value === 'number') {
          expr = expr.replace(new RegExp(field, 'g'), value.toString());
        }
      }
      
      // Basic math operations only
      if (/^[\d\+\-\*\/\.\s\(\)]+$/.test(expr)) {
        return eval(expr);
      }
    } catch (error) {
      logWarn('Expression evaluation failed', { expression, error: error.message });
    }
    return null;
  }

  /**
   * Validate an entire dataset
   * @param {Array} rows - Array of data rows
   * @param {string} dataType - Type of data
   * @param {Object} context - Additional context
   * @returns {Object} Validation summary
   */
  async validateDataset(rows, dataType, context = {}) {
    logInfo('Starting dataset validation', { 
      dataType, 
      rowCount: rows.length 
    });

    const results = {
      isValid: true,
      totalRows: rows.length,
      validRows: 0,
      errorRows: 0,
      warningRows: 0,
      results: [],
      summary: {
        errors: [],
        warnings: [],
        fieldStats: {}
      }
    };

    for (let i = 0; i < rows.length; i++) {
      const rowResult = await this.validateRow(rows[i], dataType, i + 1, context);
      results.results.push({
        rowNumber: i + 1,
        ...rowResult
      });

      if (rowResult.isValid) {
        results.validRows++;
      } else {
        results.errorRows++;
        results.isValid = false;
      }

      if (rowResult.warnings.length > 0) {
        results.warningRows++;
      }

      // Collect summary statistics
      rowResult.errors.forEach(error => {
        results.summary.errors.push(error);
      });
      
      rowResult.warnings.forEach(warning => {
        results.summary.warnings.push(warning);
      });
    }

    // Calculate completion percentage
    results.completionPercentage = results.totalRows > 0 
      ? Math.round((results.validRows / results.totalRows) * 100) 
      : 0;

    logInfo('Dataset validation completed', {
      dataType,
      totalRows: results.totalRows,
      validRows: results.validRows,
      errorRows: results.errorRows,
      completionPercentage: results.completionPercentage
    });

    return results;
  }
}

export default ValidationEngine;