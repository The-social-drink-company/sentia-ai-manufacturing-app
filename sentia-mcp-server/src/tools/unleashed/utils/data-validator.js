/**
 * Unleashed Data Validator Utility
 * 
 * Comprehensive data validation and sanitization for Unleashed API inputs
 * and responses with manufacturing-specific business rules.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class UnleashedDataValidator {
  constructor() {
    this.isInitialized = false;
    this.validationRules = new Map();
    this.businessRules = new Map();
    this.sanitizers = new Map();
    
    logger.info('Unleashed Data Validator initialized');
  }

  async initialize() {
    try {
      logger.info('Initializing Unleashed Data Validator...');
      
      this.setupValidationRules();
      this.setupBusinessRules();
      this.setupSanitizers();
      
      this.isInitialized = true;
      logger.info('Data Validator initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize Data Validator', { error: error.message });
      throw error;
    }
  }

  setupValidationRules() {
    // Email validation
    this.validationRules.set('email', {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format'
    });
    
    // Product code validation (alphanumeric, hyphens, underscores)
    this.validationRules.set('product_code', {
      pattern: /^[A-Za-z0-9_-]+$/,
      message: 'Product code must contain only letters, numbers, hyphens, and underscores'
    });
    
    // Currency validation (2-3 letter currency codes)
    this.validationRules.set('currency', {
      pattern: /^[A-Z]{3}$/,
      message: 'Currency must be a 3-letter code (e.g., USD, EUR)'
    });
    
    // Phone number validation (international format)
    this.validationRules.set('phone', {
      pattern: /^\+?[\d\s\-\(\)]+$/,
      message: 'Invalid phone number format'
    });
    
    // Postcode/ZIP validation (flexible international format)
    this.validationRules.set('postcode', {
      pattern: /^[A-Za-z0-9\s\-]{3,10}$/,
      message: 'Invalid postcode format'
    });
    
    logger.info('Validation rules loaded', { rulesCount: this.validationRules.size });
  }

  setupBusinessRules() {
    // Quantity must be positive
    this.businessRules.set('positive_quantity', {
      check: (value) => parseFloat(value) > 0,
      message: 'Quantity must be greater than zero'
    });
    
    // Price must be non-negative
    this.businessRules.set('non_negative_price', {
      check: (value) => parseFloat(value) >= 0,
      message: 'Price cannot be negative'
    });
    
    // Page size limit
    this.businessRules.set('valid_page_size', {
      check: (value) => {
        const size = parseInt(value);
        return size >= 1 && size <= 1000;
      },
      message: 'Page size must be between 1 and 1000'
    });
    
    // Date not in future
    this.businessRules.set('date_not_future', {
      check: (value) => new Date(value) <= new Date(),
      message: 'Date cannot be in the future'
    });
    
    // Date within reasonable range (past year)
    this.businessRules.set('date_within_year', {
      check: (value) => {
        const date = new Date(value);
        const now = new Date();
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return date >= yearAgo && date <= now;
      },
      message: 'Date must be within the last year'
    });
    
    logger.info('Business rules loaded', { rulesCount: this.businessRules.size });
  }

  setupSanitizers() {
    this.sanitizers.set('trim', (value) => 
      typeof value === 'string' ? value.trim() : value
    );
    
    this.sanitizers.set('lowercase', (value) => 
      typeof value === 'string' ? value.toLowerCase() : value
    );
    
    this.sanitizers.set('uppercase', (value) => 
      typeof value === 'string' ? value.toUpperCase() : value
    );
    
    this.sanitizers.set('removeSpaces', (value) => 
      typeof value === 'string' ? value.replace(/\s+/g, '') : value
    );
    
    this.sanitizers.set('normalizeDecimal', (value) => {
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      }
      return value;
    });
    
    logger.info('Sanitizers loaded', { sanitizersCount: this.sanitizers.size });
  }

  validateInput(input, schema) {
    try {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        sanitizedData: null
      };

      if (!input || typeof input !== 'object') {
        result.valid = false;
        result.errors.push('Input must be an object');
        return result;
      }

      // Create sanitized copy of input
      result.sanitizedData = { ...input };

      // Validate required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in input) || input[field] === null || input[field] === undefined) {
            result.valid = false;
            result.errors.push(`Missing required field: ${field}`);
          }
        }
      }

      // Validate properties
      if (schema.properties) {
        for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
          if (fieldName in input) {
            const fieldResult = this.validateField(
              fieldName, 
              input[fieldName], 
              fieldSchema
            );
            
            if (!fieldResult.valid) {
              result.valid = false;
              result.errors.push(...fieldResult.errors);
            }
            
            result.warnings.push(...fieldResult.warnings);
            
            // Apply sanitized value
            if (fieldResult.sanitizedValue !== undefined) {
              result.sanitizedData[fieldName] = fieldResult.sanitizedValue;
            }
          }
        }
      }

      logger.debug('Input validation completed', {
        valid: result.valid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });

      return result;

    } catch (error) {
      logger.error('Input validation failed', { error: error.message });
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        sanitizedData: null
      };
    }
  }

  validateField(fieldName, value, fieldSchema) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      sanitizedValue: value
    };

    try {
      // Apply sanitization first
      if (fieldSchema.sanitize) {
        for (const sanitizerName of fieldSchema.sanitize) {
          const sanitizer = this.sanitizers.get(sanitizerName);
          if (sanitizer) {
            result.sanitizedValue = sanitizer(result.sanitizedValue);
          }
        }
      }

      // Type validation
      if (fieldSchema.type) {
        const typeResult = this.validateType(fieldName, result.sanitizedValue, fieldSchema.type);
        if (!typeResult.valid) {
          result.valid = false;
          result.errors.push(...typeResult.errors);
        }
      }

      // Format validation
      if (fieldSchema.format && result.valid) {
        const formatResult = this.validateFormat(fieldName, result.sanitizedValue, fieldSchema.format);
        if (!formatResult.valid) {
          result.valid = false;
          result.errors.push(...formatResult.errors);
        }
      }

      // Range validation
      if (fieldSchema.minimum !== undefined || fieldSchema.maximum !== undefined) {
        const rangeResult = this.validateRange(fieldName, result.sanitizedValue, fieldSchema);
        if (!rangeResult.valid) {
          result.valid = false;
          result.errors.push(...rangeResult.errors);
        }
      }

      // Length validation
      if (fieldSchema.minLength !== undefined || fieldSchema.maxLength !== undefined) {
        const lengthResult = this.validateLength(fieldName, result.sanitizedValue, fieldSchema);
        if (!lengthResult.valid) {
          result.valid = false;
          result.errors.push(...lengthResult.errors);
        }
      }

      // Enum validation
      if (fieldSchema.enum) {
        const enumResult = this.validateEnum(fieldName, result.sanitizedValue, fieldSchema.enum);
        if (!enumResult.valid) {
          result.valid = false;
          result.errors.push(...enumResult.errors);
        }
      }

      // Pattern validation
      if (fieldSchema.pattern) {
        const patternResult = this.validatePattern(fieldName, result.sanitizedValue, fieldSchema.pattern);
        if (!patternResult.valid) {
          result.valid = false;
          result.errors.push(...patternResult.errors);
        }
      }

      // Business rule validation
      if (fieldSchema.businessRules) {
        for (const ruleName of fieldSchema.businessRules) {
          const ruleResult = this.validateBusinessRule(fieldName, result.sanitizedValue, ruleName);
          if (!ruleResult.valid) {
            result.valid = false;
            result.errors.push(...ruleResult.errors);
          }
        }
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`Field validation error for ${fieldName}: ${error.message}`);
    }

    return result;
  }

  validateType(fieldName, value, expectedType) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (actualType !== expectedType) {
      return {
        valid: false,
        errors: [`Field '${fieldName}' must be of type ${expectedType}, got ${actualType}`]
      };
    }
    
    return { valid: true, errors: [] };
  }

  validateFormat(fieldName, value, format) {
    if (typeof value !== 'string') {
      return { valid: true, errors: [] }; // Skip format validation for non-strings
    }

    let isValid = false;
    let errorMessage = `Invalid ${format} format for field '${fieldName}'`;

    switch (format) {
      case 'email':
        isValid = this.validationRules.get('email').pattern.test(value);
        break;
      case 'date':
        isValid = !isNaN(Date.parse(value));
        break;
      case 'date-time':
        isValid = !isNaN(Date.parse(value));
        break;
      case 'uri':
        try {
          new URL(value);
          isValid = true;
        } catch {
          isValid = false;
        }
        break;
      default:
        // Check if it's a custom validation rule
        const rule = this.validationRules.get(format);
        if (rule) {
          isValid = rule.pattern.test(value);
          errorMessage = rule.message;
        } else {
          isValid = true; // Unknown format, skip validation
        }
    }

    return {
      valid: isValid,
      errors: isValid ? [] : [errorMessage]
    };
  }

  validateRange(fieldName, value, schema) {
    const errors = [];
    
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`Field '${fieldName}' must be >= ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`Field '${fieldName}' must be <= ${schema.maximum}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateLength(fieldName, value, schema) {
    const errors = [];
    
    if (typeof value === 'string' || Array.isArray(value)) {
      const length = value.length;
      
      if (schema.minLength !== undefined && length < schema.minLength) {
        errors.push(`Field '${fieldName}' must have at least ${schema.minLength} characters`);
      }
      if (schema.maxLength !== undefined && length > schema.maxLength) {
        errors.push(`Field '${fieldName}' must have at most ${schema.maxLength} characters`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateEnum(fieldName, value, enumValues) {
    const isValid = enumValues.includes(value);
    
    return {
      valid: isValid,
      errors: isValid ? [] : [
        `Field '${fieldName}' must be one of: ${enumValues.join(', ')}`
      ]
    };
  }

  validatePattern(fieldName, value, pattern) {
    if (typeof value !== 'string') {
      return { valid: true, errors: [] };
    }

    const regex = new RegExp(pattern);
    const isValid = regex.test(value);
    
    return {
      valid: isValid,
      errors: isValid ? [] : [
        `Field '${fieldName}' does not match required pattern`
      ]
    };
  }

  validateBusinessRule(fieldName, value, ruleName) {
    const rule = this.businessRules.get(ruleName);
    
    if (!rule) {
      return {
        valid: true,
        errors: [],
        warnings: [`Unknown business rule: ${ruleName}`]
      };
    }

    try {
      const isValid = rule.check(value);
      
      return {
        valid: isValid,
        errors: isValid ? [] : [`Field '${fieldName}': ${rule.message}`]
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Business rule '${ruleName}' failed for field '${fieldName}': ${error.message}`]
      };
    }
  }

  sanitizeData(data, sanitizers = []) {
    try {
      let sanitized = data;
      
      for (const sanitizerName of sanitizers) {
        const sanitizer = this.sanitizers.get(sanitizerName);
        if (sanitizer) {
          sanitized = sanitizer(sanitized);
        } else {
          logger.warn('Unknown sanitizer', { sanitizerName });
        }
      }
      
      return sanitized;
    } catch (error) {
      logger.error('Data sanitization failed', { error: error.message });
      return data; // Return original data on error
    }
  }

  validateApiResponse(response, expectedStructure) {
    try {
      const result = {
        valid: true,
        errors: [],
        warnings: []
      };

      // Check if response has expected structure
      if (expectedStructure.requiredFields) {
        for (const field of expectedStructure.requiredFields) {
          if (!(field in response)) {
            result.valid = false;
            result.errors.push(`Missing required response field: ${field}`);
          }
        }
      }

      // Validate data types
      if (expectedStructure.fieldTypes) {
        for (const [field, expectedType] of Object.entries(expectedStructure.fieldTypes)) {
          if (field in response) {
            const actualType = Array.isArray(response[field]) ? 'array' : typeof response[field];
            if (actualType !== expectedType) {
              result.warnings.push(
                `Response field '${field}' expected ${expectedType}, got ${actualType}`
              );
            }
          }
        }
      }

      return result;
    } catch (error) {
      logger.error('API response validation failed', { error: error.message });
      return {
        valid: false,
        errors: [`Response validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  addCustomRule(name, rule) {
    this.businessRules.set(name, rule);
    logger.info('Custom business rule added', { name });
  }

  addCustomSanitizer(name, sanitizer) {
    this.sanitizers.set(name, sanitizer);
    logger.info('Custom sanitizer added', { name });
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      validationRules: this.validationRules.size,
      businessRules: this.businessRules.size,
      sanitizers: this.sanitizers.size
    };
  }

  async cleanup() {
    try {
      logger.info('Cleaning up Data Validator...');
      
      this.validationRules.clear();
      this.businessRules.clear();
      this.sanitizers.clear();
      this.isInitialized = false;
      
      logger.info('Data Validator cleanup completed');
      
    } catch (error) {
      logger.error('Error during Data Validator cleanup', { error: error.message });
    }
  }
}