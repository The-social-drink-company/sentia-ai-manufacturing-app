/**
 * DATA VALIDATION AND SANITIZATION SERVICE
 *
 * Enterprise-grade data validation with comprehensive rules
 * for all data flowing through the system.
 */

import { z } from 'zod';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Manufacturing Data Schemas
 */
const schemas = {
  // Production Metrics Schema
  productionMetrics: z.object({
    date: z.date(),
    efficiency: z.number().min(0).max(100),
    unitsProduced: z.number().int().min(0),
    defectRate: z.number().min(0).max(100),
    oeeScore: z.number().min(0).max(100),
    availability: z.number().min(0).max(100).optional(),
    performance: z.number().min(0).max(100).optional(),
    quality: z.number().min(0).max(100).optional(),
    downtime: z.number().min(0).optional(),
    plannedProductionTime: z.number().min(0).optional(),
    actualProductionTime: z.number().min(0).optional(),
    goodUnits: z.number().int().min(0).optional(),
    totalUnits: z.number().int().min(0).optional(),
  }),

  // Financial Metrics Schema
  financialMetrics: z.object({
    date: z.date(),
    revenue: z.number().min(0),
    costs: z.number().min(0),
    grossMargin: z.number().min(-100).max(100),
    netMargin: z.number().min(-100).max(100),
    ebitda: z.number(),
    roi: z.number(),
    currentAssets: z.number().min(0).optional(),
    currentLiabilities: z.number().min(0).optional(),
    inventory: z.number().min(0).optional(),
    accountsReceivable: z.number().min(0).optional(),
    accountsPayable: z.number().min(0).optional(),
  }),

  // Working Capital Schema
  workingCapital: z.object({
    date: z.date(),
    currentAssets: z.number().min(0),
    currentLiabilities: z.number().min(0),
    workingCapital: z.number(),
    ratio: z.number().min(0),
    cashFlow: z.number(),
    operatingCashFlow: z.number().optional(),
    investingCashFlow: z.number().optional(),
    financingCashFlow: z.number().optional(),
    daysReceivable: z.number().int().min(0).max(365),
    daysPayable: z.number().int().min(0).max(365).optional(),
    daysInventory: z.number().int().min(0).max(365).optional(),
    cashConversionCycle: z.number().optional(),
  }),

  // Inventory Item Schema
  inventoryItem: z.object({
    sku: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    category: z.enum(['Raw Materials', 'Components', 'Finished Goods', 'Packaging', 'Consumables']).optional(),
    quantity: z.number().int().min(0),
    reorderPoint: z.number().int().min(0),
    reorderQuantity: z.number().int().min(0).optional(),
    unitCost: z.number().min(0),
    value: z.number().min(0),
    location: z.string().max(100).optional(),
    supplier: z.string().max(200).optional(),
    lastRestocked: z.date().optional(),
    expiryDate: z.date().optional(),
    batchNumber: z.string().max(50).optional(),
    qualityStatus: z.enum(['Approved', 'Pending', 'Quarantine', 'Rejected']).optional(),
  }),

  // Quality Metrics Schema
  qualityMetrics: z.object({
    date: z.date(),
    defectRate: z.number().min(0).max(100),
    firstPassYield: z.number().min(0).max(100),
    customerComplaints: z.number().int().min(0),
    qualityScore: z.number().min(0).max(100),
    inspectionsPassed: z.number().int().min(0),
    inspectionsFailed: z.number().int().min(0),
    reworkRate: z.number().min(0).max(100).optional(),
    scrapRate: z.number().min(0).max(100).optional(),
    supplierQualityRating: z.number().min(0).max(100).optional(),
    correctiveActions: z.number().int().min(0).optional(),
  }),

  // API Request Schema
  apiRequest: z.object({
    endpoint: z.string().regex(/^\/api\/[a-z0-9-/]+$/),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    params: z.record(z.string()).optional(),
    body: z.any().optional(),
    headers: z.record(z.string()).optional(),
  }),

  // User Input Schema
  userInput: z.object({
    text: z.string().max(1000),
    number: z.number().optional(),
    date: z.date().optional(),
    email: z.string().email().optional(),
    url: z.string().url().optional(),
  }),
};

/**
 * Data Validator Class
 */
class DataValidator {
  constructor() {
    this.schemas = schemas;
    this.sanitizer = DOMPurify;
    this.validator = validator;
  }

  /**
   * Validate data against schema
   */
  validate(schemaName, data) {
    try {
      const schema = this.schemas[schemaName];
      if (!schema) {
        throw new Error(`Schema '${schemaName}' not found`);
      }

      // Parse and validate
      const result = schema.parse(data);
      return {
        valid: true,
        data: result,
        errors: null,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          data: null,
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        };
      }
      throw error;
    }
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(html) {
    return this.sanitizer.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target'],
    });
  }

  /**
   * Sanitize text input
   */
  sanitizeText(text) {
    if (!text) return '';

    // Remove HTML tags
    let sanitized = validator.stripLow(text);

    // Escape special characters
    sanitized = validator.escape(sanitized);

    // Trim whitespace
    sanitized = validator.trim(sanitized);

    return sanitized;
  }

  /**
   * Validate and sanitize email
   */
  validateEmail(email) {
    if (!email) return { valid: false, error: 'Email is required' };

    const normalized = validator.normalizeEmail(email);
    if (!normalized || !validator.isEmail(normalized)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true, email: normalized };
  }

  /**
   * Validate and sanitize URL
   */
  validateURL(url) {
    if (!url) return { valid: false, error: 'URL is required' };

    if (!validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
    })) {
      return { valid: false, error: 'Invalid URL format' };
    }

    return { valid: true, url: validator.trim(url) };
  }

  /**
   * Validate numeric range
   */
  validateNumber(value, min, max) {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, error: 'Invalid number' };
    }

    if (min !== undefined && num < min) {
      return { valid: false, error: `Value must be at least ${min}` };
    }

    if (max !== undefined && num > max) {
      return { valid: false, error: `Value must be at most ${max}` };
    }

    return { valid: true, value: num };
  }

  /**
   * Validate date range
   */
  validateDate(date, minDate, maxDate) {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return { valid: false, error: 'Invalid date' };
    }

    if (minDate && d < new Date(minDate)) {
      return { valid: false, error: `Date must be after ${minDate}` };
    }

    if (maxDate && d > new Date(maxDate)) {
      return { valid: false, error: `Date must be before ${maxDate}` };
    }

    return { valid: true, date: d };
  }

  /**
   * Validate SKU format
   */
  validateSKU(sku) {
    const pattern = /^[A-Z0-9-]{3,50}$/;

    if (!pattern.test(sku)) {
      return {
        valid: false,
        error: 'SKU must be 3-50 characters, uppercase letters, numbers, and hyphens only',
      };
    }

    return { valid: true, sku };
  }

  /**
   * Validate batch of data
   */
  async validateBatch(schemaName, dataArray) {
    const results = {
      total: dataArray.length,
      valid: 0,
      invalid: 0,
      errors: [],
      validData: [],
    };

    for (let i = 0; i < dataArray.length; i++) {
      const validation = this.validate(schemaName, dataArray[i]);

      if (validation.valid) {
        results.valid++;
        results.validData.push(validation.data);
      } else {
        results.invalid++;
        results.errors.push({
          index: i,
          errors: validation.errors,
        });
      }
    }

    return results;
  }

  /**
   * Validate API request
   */
  validateAPIRequest(request) {
    // Validate endpoint format
    if (!request.endpoint || !request.endpoint.startsWith('/api/')) {
      return { valid: false, error: 'Invalid API endpoint' };
    }

    // Validate HTTP method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(request.method)) {
      return { valid: false, error: 'Invalid HTTP method' };
    }

    // Validate headers
    if (request.headers) {
      for (const [key, value] of Object.entries(request.headers)) {
        if (typeof key !== 'string' || typeof value !== 'string') {
          return { valid: false, error: 'Invalid header format' };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Clean and validate database query
   */
  validateDatabaseQuery(query) {
    // Check for SQL injection patterns
    const dangerousPatterns = [
      /(\b)(DROP|DELETE|TRUNCATE|ALTER|CREATE|REPLACE)(\b)/i,
      /(\b)(UNION|SELECT.*FROM|INSERT.*INTO)(\b)/i,
      /;.*--/,
      /\/\*.*\*\//,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        return {
          valid: false,
          error: 'Potentially dangerous SQL pattern detected',
        };
      }
    }

    return { valid: true, query };
  }

  /**
   * Validate manufacturing metrics
   */
  validateManufacturingMetrics(metrics) {
    const errors = [];

    // OEE components should multiply to OEE score
    if (metrics.availability && metrics.performance && metrics.quality) {
      const calculatedOEE = (metrics.availability / 100) *
                           (metrics.performance / 100) *
                           (metrics.quality / 100) * 100;

      if (Math.abs(calculatedOEE - metrics.oeeScore) > 1) {
        errors.push('OEE score does not match component calculation');
      }
    }

    // Defect rate should align with quality
    if (metrics.defectRate && metrics.quality) {
      const expectedQuality = 100 - metrics.defectRate;
      if (Math.abs(expectedQuality - metrics.quality) > 5) {
        errors.push('Quality score inconsistent with defect rate');
      }
    }

    // Good units should not exceed total units
    if (metrics.goodUnits > metrics.totalUnits) {
      errors.push('Good units exceed total units');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Create singleton instance
const dataValidator = new DataValidator();

export default dataValidator;
export { DataValidator, schemas };