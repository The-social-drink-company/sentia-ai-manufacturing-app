
// Data Validation Service - Enterprise Grade
class DataValidationService {
  constructor() {
    this.validationRules = {
      unleashed: {
        required: ['guid', 'orderNumber', 'orderDate'],
        types: {
          guid: 'string',
          orderNumber: 'string',
          orderDate: 'string',
          total: 'number'
        },
        ranges: {
          total: { min: 0, max: 1000000 }
        }
      },
      shopify: {
        required: ['id', 'name', 'created_at'],
        types: {
          id: 'number',
          name: 'string',
          created_at: 'string',
          total_price: 'string'
        }
      }
    };
  }

  validateData(data, source) {
    const rules = this.validationRules[source];
    if (!rules) {
      return { valid: false, errors: [`Unknown source: ${source}`] };
    }

    const errors = [];

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const itemErrors = this.validateItem(item, rules, `[${index}]`);
        errors.push(...itemErrors);
      });
    } else {
      errors.push(...this.validateItem(data, rules));
    }

    return {
      valid: errors.length === 0,
      errors,
      itemCount: Array.isArray(data) ? data.length : 1,
      validItems: Array.isArray(data) ? data.length - errors.length : (errors.length === 0 ? 1 : 0)
    };
  }

  validateItem(item, rules, prefix = '') {
    const errors = [];

    // Check required fields
    if (rules.required) {
      rules.required.forEach(field => {
        if (!item || !item.hasOwnProperty(field)) {
          errors.push(`${prefix}Missing required field: ${field}`);
        }
      });
    }

    // Check types
    if (rules.types && item) {
      Object.entries(rules.types).forEach(([field, expectedType]) => {
        if (item.hasOwnProperty(field)) {
          const value = item[field];
          const actualType = typeof value;
          
          if (actualType !== expectedType && value !== null) {
            errors.push(`${prefix}Field ${field} expected ${expectedType}, got ${actualType}`);
          }
        }
      });
    }

    // Check ranges
    if (rules.ranges && item) {
      Object.entries(rules.ranges).forEach(([field, range]) => {
        if (item.hasOwnProperty(field)) {
          const value = parseFloat(item[field]);
          if (!isNaN(value)) {
            if (range.min !== undefined && value < range.min) {
              errors.push(`${prefix}Field ${field} below minimum: ${value} < ${range.min}`);
            }
            if (range.max !== undefined && value > range.max) {
              errors.push(`${prefix}Field ${field} above maximum: ${value} > ${range.max}`);
            }
          }
        }
      });
    }

    return errors;
  }

  generateValidationReport(validationResult, source) {
    return {
      source,
      timestamp: new Date().toISOString(),
      valid: validationResult.valid,
      totalItems: validationResult.itemCount,
      validItems: validationResult.validItems,
      errorCount: validationResult.errors.length,
      errors: validationResult.errors,
      successRate: validationResult.itemCount > 0 ? 
        (validationResult.validItems / validationResult.itemCount) * 100 : 0
    };
  }
}

export default DataValidationService;
