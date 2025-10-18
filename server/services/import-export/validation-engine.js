/**
 * Validation Engine
 * Validates imported data against schema rules
 */

import { logInfo, logWarn, logError, logDebug } from '../../utils/logger.js';

class ValidationEngine {
  constructor(schema) {
    this.schema = schema;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a single row of data
   * @param {Object} row - Data row to validate
   * @param {number} rowIndex - Row number (for error reporting)
   * @returns {Object} Validation result
   */
  validateRow(row, rowIndex) {
    const errors = [];
    const warnings = [];
    const validatedData = {};

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = row[field];

      // Required field validation
      if (rules.required && (value === null || value === undefined || value === '')) {
        errors.push({
          row: rowIndex,
          field,
          type: 'required',
          message: `${field} is required`,
        });
        continue;
      }

      // Skip further validation if field is empty and not required
      if (!rules.required && (value === null || value === undefined || value === '')) {
        continue;
      }

      // Type validation
      if (rules.type) {
        const typeValid = this.validateType(value, rules.type);
        if (!typeValid) {
          errors.push({
            row: rowIndex,
            field,
            type: 'type',
            message: `${field} must be of type ${rules.type}`,
            value,
          });
          continue;
        }
      }

      // Min/Max validation for numbers
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({
            row: rowIndex,
            field,
            type: 'range',
            message: `${field} must be >= ${rules.min}`,
            value,
          });
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push({
            row: rowIndex,
            field,
            type: 'range',
            message: `${field} must be <= ${rules.max}`,
            value,
          });
        }
      }

      // Pattern validation
      if (rules.pattern) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          errors.push({
            row: rowIndex,
            field,
            type: 'pattern',
            message: `${field} does not match required pattern`,
            value,
          });
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          row: rowIndex,
          field,
          type: 'enum',
          message: `${field} must be one of: ${rules.enum.join(', ')}`,
          value,
        });
      }

      // Custom validation function
      if (rules.validate) {
        const customResult = rules.validate(value, row);
        if (customResult !== true) {
          errors.push({
            row: rowIndex,
            field,
            type: 'custom',
            message: customResult || `${field} failed custom validation`,
            value,
          });
        }
      }

      // Transform value if transformer provided
      validatedData[field] = rules.transform ? rules.transform(value) : value;
    }

    return {
      valid: errors.length === 0,
      data: validatedData,
      errors,
      warnings,
    };
  }

  /**
   * Validate type
   */
  validateType(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      default:
        return true;
    }
  }

  /**
   * Validate entire dataset
   * @param {Array} data - Array of data rows
   * @returns {Object} Validation summary
   */
  validateAll(data) {
    const results = [];
    const allErrors = [];
    const allWarnings = [];
    let validCount = 0;

    logInfo(`Starting validation for ${data.length} rows`);

    data.forEach((row, index) => {
      const result = this.validateRow(row, index + 1);
      results.push(result);

      if (result.valid) {
        validCount++;
      } else {
        allErrors.push(...result.errors);
        // Log first few errors for debugging
        if (allErrors.length <= 5) {
          logError(`Validation error at row ${index + 1}:`, result.errors);
        }
      }

      if (result.warnings && result.warnings.length > 0) {
        allWarnings.push(...result.warnings);
        if (allWarnings.length <= 5) {
          logWarn(`Validation warning at row ${index + 1}:`, result.warnings);
        }
      }

      // Log progress for large datasets
      if ((index + 1) % 1000 === 0) {
        logDebug(`Validation progress: ${index + 1}/${data.length} rows processed`);
      }
    });

    const summary = {
      totalRows: data.length,
      validRows: validCount,
      invalidRows: data.length - validCount,
      errors: allErrors,
      warnings: allWarnings,
      results,
    };

    if (allErrors.length === 0) {
      logInfo(`Validation completed successfully: ${validCount}/${data.length} rows valid`);
    } else {
      logError(`Validation completed with errors: ${summary.invalidRows} invalid rows, ${allErrors.length} total errors`);
    }

    return summary;
  }

  /**
   * Get predefined schema for entity type
   */
  static getSchemaForType(type) {
    const schemas = {
      forecast: {
        productId: {
          required: true,
          type: 'string',
        },
        date: {
          required: true,
          type: 'date',
          transform: (val) => new Date(val),
        },
        forecastedDemand: {
          required: true,
          type: 'number',
          min: 0,
        },
        confidence: {
          required: false,
          type: 'number',
          min: 0,
          max: 1,
        },
      },
      inventory: {
        productId: {
          required: true,
          type: 'string',
        },
        quantity: {
          required: true,
          type: 'number',
          min: 0,
        },
        location: {
          required: false,
          type: 'string',
        },
        lastUpdated: {
          required: false,
          type: 'date',
          transform: (val) => new Date(val),
        },
      },
      sales: {
        productId: {
          required: true,
          type: 'string',
        },
        date: {
          required: true,
          type: 'date',
          transform: (val) => new Date(val),
        },
        quantity: {
          required: true,
          type: 'number',
          min: 0,
        },
        revenue: {
          required: false,
          type: 'number',
          min: 0,
        },
      },
    };

    return schemas[type] || {};
  }
}

export default ValidationEngine;
