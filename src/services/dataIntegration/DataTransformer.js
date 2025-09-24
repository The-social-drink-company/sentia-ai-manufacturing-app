// Data Transformation and Normalization System
// Handles data format conversion, validation, and standardization

export class DataTransformer {
  constructor(options = {}) {
    this.validationEnabled = options.validation !== false;
    this.transformations = new Map();
    this.validators = new Map();
    
    // Register default transformations
    this.registerDefaultTransformations();
    this.registerDefaultValidators();
  }
  
  // Main transformation method
  async transformResponse(response, endpoint, customTransform) {
    try {
      // Apply custom transformation if provided
      if (customTransform && typeof customTransform === 'function') {
        return await customTransform(response);
      }
      
      // Apply registered transformation based on endpoint
      const transformation = this.getTransformation(endpoint);
      if (transformation) {
        return await transformation(response);
      }
      
      // Apply default transformations
      return this.applyDefaultTransformation(response);
      
    } catch (error) {
      throw new Error(`Data transformation failed: ${error.message}`);
    }
  }
  
  // Transform request data
  async transformRequest(data, endpoint, customTransform) {
    try {
      if (customTransform && typeof customTransform === 'function') {
        return await customTransform(data);
      }
      
      const transformation = this.getRequestTransformation(endpoint);
      if (transformation) {
        return await transformation(data);
      }
      
      return this.applyDefaultRequestTransformation(data);
      
    } catch (error) {
      throw new Error(`Request transformation failed: ${error.message}`);
    }
  }
  
  // Apply default response transformation
  applyDefaultTransformation(response) {
    if (!response || typeof response !== 'object') {
      return response;
    }
    
    // Standardize response structure
    const transformed = {
      data: response.data || response,
      status: response.status 0,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Apply common transformations
    if (transformed.data) {
      transformed.data = this.normalizeData(transformed.data);
    }
    
    return transformed;
  }
  
  // Apply default request transformation
  applyDefaultRequestTransformation(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    // Convert dates to ISO strings
    const transformed = this.convertDates(data);
    
    // Remove null/undefined values
    return this.removeEmptyValues(transformed);
  }
  
  // Normalize data structures
  normalizeData(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeItem(item));
    }
    
    if (data && typeof data === 'object') {
      return this.normalizeItem(data);
    }
    
    return data;
  }
  
  // Normalize individual data items
  normalizeItem(item) {
    if (!item || typeof item !== 'object') {
      return item;
    }
    
    const normalized = {};
    
    for (const [key, value] of Object.entries(item)) {
      // Normalize key names (camelCase)
      const normalizedKey = this.normalizeKey(key);
      
      // Normalize values
      normalized[normalizedKey] = this.normalizeValue(value);
    }
    
    return normalized;
  }
  
  // Normalize object keys to camelCase
  normalizeKey(key) {
    if (typeof key !== 'string') {
      return key;
    }
    
    return key
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }
  
  // Normalize values
  normalizeValue(value) {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle dates
    if (typeof value === 'string' && this.isDateString(value)) {
      return new Date(value);
    }
    
    // Handle numbers
    if (typeof value === 'string' && this.isNumericString(value)) {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    
    // Handle booleans
    if (typeof value === 'string' && this.isBooleanString(value)) {
      return value.toLowerCase() === 'true';
    }
    
    // Handle nested objects/arrays
    if (Array.isArray(value)) {
      return value.map(item => this.normalizeValue(item));
    }
    
    if (value && typeof value === 'object') {
      return this.normalizeItem(value);
    }
    
    return value;
  }
  
  // Utility methods for type detection
  isDateString(str) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(str) && !isNaN(Date.parse(str));
  }
  
  isNumericString(str) {
    return /^-?\d*\.?\d+$/.test(str.trim());
  }
  
  isBooleanString(str) {
    return /^(true|false)$/i.test(str.trim());
  }
  
  // Convert Date objects to ISO strings
  convertDates(obj) {
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertDates(item));
    }
    
    if (obj && typeof obj === 'object') {
      const converted = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this.convertDates(value);
      }
      return converted;
    }
    
    return obj;
  }
  
  // Remove null, undefined, and empty string values
  removeEmptyValues(obj, options = { removeEmptyStrings: false }) {
    if (Array.isArray(obj)) {
      return obj
        .map(item => this.removeEmptyValues(item, options))
        .filter(item => item !== null && item !== undefined);
    }
    
    if (obj && typeof obj === 'object') {
      const cleaned = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
          continue;
        }
        
        if (options.removeEmptyStrings && value === '') {
          continue;
        }
        
        const cleanedValue = this.removeEmptyValues(value, options);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      
      return cleaned;
    }
    
    return obj;
  }
  
  // Register transformation for specific endpoints
  registerTransformation(pattern, transformation) {
    this.transformations.set(pattern, transformation);
  }
  
  // Get transformation for endpoint
  getTransformation(endpoint) {
    // Exact match first
    if (this.transformations.has(endpoint)) {
      return this.transformations.get(endpoint);
    }
    
    // Pattern matching
    for (const [pattern, transformation] of this.transformations.entries()) {
      if (this.matchesPattern(endpoint, pattern)) {
        return transformation;
      }
    }
    
    return null;
  }
  
  // Get request transformation for endpoint
  getRequestTransformation(endpoint) {
    const key = `request:${endpoint}`;
    return this.getTransformation(key);
  }
  
  // Pattern matching for endpoints
  matchesPattern(endpoint, pattern) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(endpoint);
    }
    
    return endpoint.includes(pattern);
  }
  
  // Validation methods
  async validateData(data, schema) {
    if (!this.validationEnabled || !schema) {
      return { valid: true };
    }
    
    try {
      const validator = this.getValidator(schema);
      if (validator) {
        return await validator(data);
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }
  
  // Register validator
  registerValidator(name, validator) {
    this.validators.set(name, validator);
  }
  
  // Get validator
  getValidator(name) {
    return this.validators.get(name);
  }
  
  // Register default transformations for common endpoints
  registerDefaultTransformations() {
    // Manufacturing data transformations
    this.registerTransformation('/api/production*', (response) => {
      const data = response.data || response;
      
      if (Array.isArray(data)) {
        return {
          ...response,
          data: data.map(item => ({
            ...item,
            efficiency: this.parsePercentage(item.efficiency),
            output: this.parseNumber(item.output),
            target: this.parseNumber(item.target),
            timestamp: this.parseDate(item.timestamp || item.date)
          }))
        };
      }
      
      return response;
    });
    
    // Quality control transformations
    this.registerTransformation('/api/quality*', (response) => {
      const data = response.data || response;
      
      if (Array.isArray(data)) {
        return {
          ...response,
          data: data.map(item => ({
            ...item,
            passRate: this.parsePercentage(item.passRate || item.pass_rate),
            testResults: this.normalizeTestResults(item.testResults || item.test_results),
            completedAt: this.parseDate(item.completedAt || item.completed_at)
          }))
        };
      }
      
      return response;
    });
    
    // Inventory transformations
    this.registerTransformation('/api/inventory*', (response) => {
      const data = response.data || response;
      
      if (Array.isArray(data)) {
        return {
          ...response,
          data: data.map(item => ({
            ...item,
            quantity: this.parseNumber(item.quantity || item.stock),
            unitPrice: this.parseNumber(item.unitPrice || item.unit_price || item.price),
            totalValue: this.parseNumber(item.totalValue || item.total_value),
            lastUpdated: this.parseDate(item.lastUpdated || item.last_updated)
          }))
        };
      }
      
      return response;
    });
  }
  
  // Register default validators
  registerDefaultValidators() {
    this.registerValidator('production', (data) => {
      const errors = [];
      
      if (!data.line_id && !data.lineId) {
        errors.push('Line ID is required');
      }
      
      if (data.efficiency !== undefined && (data.efficiency < 0 || data.efficiency > 100)) {
        errors.push('Efficiency must be between 0 and 100');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    });
    
    this.registerValidator('quality', (data) => {
      const errors = [];
      
      if (!data.batch_id && !data.batchId) {
        errors.push('Batch ID is required');
      }
      
      if (data.passRate !== undefined && (data.passRate < 0 || data.passRate > 100)) {
        errors.push('Pass rate must be between 0 and 100');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    });
  }
  
  // Helper parsing methods
  parseNumber(value) {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  parsePercentage(value) {
    const num = this.parseNumber(value);
    return Math.max(0, Math.min(100, num));
  }
  
  parseDate(value) {
    if (!value) {
      return null;
    }
    
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  normalizeTestResults(results) {
    if (!Array.isArray(results)) {
      return [];
    }
    
    return results.map(result => ({
      testName: result.test_name || result.testName || result.name,
      result: result.result || result.value,
      status: result.status || (result.passed ? 'passed' : 'failed'),
      specification: result.specification || result.spec,
      timestamp: this.parseDate(result.timestamp || result.date)
    }));
  }
  
  // Batch transformation for large datasets
  async transformBatch(items, transformer, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const transformedBatch = await Promise.all(
        batch.map(item => transformer(item))
      );
      results.push(...transformedBatch);
    }
    
    return results;
  }
  
  // Get transformation statistics
  getStats() {
    return {
      registeredTransformations: this.transformations.size,
      registeredValidators: this.validators.size,
      validationEnabled: this.validationEnabled
    };
  }
}

export default DataTransformer;