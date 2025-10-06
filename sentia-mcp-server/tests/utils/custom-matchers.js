/**
 * Custom Vitest Matchers for MCP Server Testing
 * Business-specific and manufacturing-focused test matchers
 */

import { expect } from 'vitest';

// Manufacturing-specific matchers
expect.extend({
  /**
   * Validates manufacturing order structure
   */
  toBeValidManufacturingOrder(received) {
    const pass = received &&
      typeof received === 'object' &&
      typeof received.id === 'string' &&
      typeof received.order_number === 'string' &&
      typeof received.customer_id === 'string' &&
      typeof received.status === 'string' &&
      Array.isArray(received.line_items) &&
      received.line_items.length > 0 &&
      received.line_items.every(item => 
        typeof item.product_id === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0 &&
        typeof item.unit_price === 'number' &&
        item.unit_price > 0
      );

    return {
      pass,
      message: () => pass 
        ? `Expected ${JSON.stringify(received)} not to be a valid manufacturing order`
        : `Expected ${JSON.stringify(received)} to be a valid manufacturing order with id, order_number, customer_id, status, and valid line_items`
    };
  },

  /**
   * Validates product specification structure
   */
  toBeValidProductSpecification(received) {
    const pass = received &&
      typeof received === 'object' &&
      typeof received.id === 'string' &&
      typeof received.sku === 'string' &&
      typeof received.name === 'string' &&
      typeof received.category === 'string' &&
      typeof received.specifications === 'object' &&
      typeof received.cost === 'object' &&
      typeof received.cost.total === 'number' &&
      typeof received.price === 'number' &&
      typeof received.lead_time_days === 'number';

    return {
      pass,
      message: () => pass
        ? `Expected ${JSON.stringify(received)} not to be a valid product specification`
        : `Expected ${JSON.stringify(received)} to be a valid product specification with required manufacturing fields`
    };
  },

  /**
   * Validates quality control data
   */
  toBeValidQualityRecord(received) {
    const pass = received &&
      typeof received === 'object' &&
      typeof received.id === 'string' &&
      typeof received.inspector === 'string' &&
      typeof received.work_order === 'string' &&
      typeof received.product_id === 'string' &&
      Array.isArray(received.measurements) &&
      received.measurements.every(measurement =>
        typeof measurement.characteristic === 'string' &&
        Array.isArray(measurement.values) &&
        typeof measurement.specification === 'string' &&
        ['pass', 'fail'].includes(measurement.result)
      ) &&
      ['pass', 'fail'].includes(received.overall_result);

    return {
      pass,
      message: () => pass
        ? `Expected ${JSON.stringify(received)} not to be a valid quality record`
        : `Expected ${JSON.stringify(received)} to be a valid quality record with inspector, measurements, and results`
    };
  },

  /**
   * Validates inventory level data
   */
  toBeValidInventoryLevel(received) {
    const pass = received &&
      typeof received === 'object' &&
      (typeof received.id === 'string' || typeof received.sku === 'string') &&
      typeof received.current_stock === 'object' &&
      typeof received.current_stock.quantity === 'number' &&
      received.current_stock.quantity >= 0 &&
      typeof received.reorder_point === 'number' &&
      received.reorder_point >= 0;

    return {
      pass,
      message: () => pass
        ? `Expected ${JSON.stringify(received)} not to be a valid inventory level`
        : `Expected ${JSON.stringify(received)} to be a valid inventory level with stock quantities and reorder point`
    };
  }
});

// API Response matchers
expect.extend({
  /**
   * Validates MCP tool response structure
   */
  toBeValidMcpToolResponse(received) {
    const pass = received &&
      typeof received === 'object' &&
      typeof received.success === 'boolean' &&
      (received.success ? 
        (typeof received.data === 'object') :
        (typeof received.error === 'string')
      );

    return {
      pass,
      message: () => pass
        ? `Expected ${JSON.stringify(received)} not to be a valid MCP tool response`
        : `Expected ${JSON.stringify(received)} to be a valid MCP tool response with success boolean and data/error`
    };
  },

  /**
   * Validates Xero API response structure
   */
  toBeValidXeroResponse(received) {
    const pass = received &&
      typeof received === 'object' &&
      (received.reports || received.invoices || received.contacts) &&
      !received.error;

    return {
      pass,
      message: () => pass
        ? `Expected ${JSON.stringify(received)} not to be a valid Xero response`
        : `Expected ${JSON.stringify(received)} to be a valid Xero API response with expected data structure`
    };
  },

  /**
   * Validates Shopify API response structure
   */
  toBeValidShopifyResponse(received) {
    const pass = received &&
      typeof received === 'object' &&
      (received.orders || received.products || received.customers || received.inventory_levels) &&
      !received.errors;

    return {
      pass,
      message: () => pass
        ? `Expected ${JSON.stringify(received)} not to be a valid Shopify response`
        : `Expected ${JSON.stringify(received)} to be a valid Shopify API response with expected data structure`
    };
  },

  /**
   * Validates Amazon SP-API response structure
   */
  toBeValidAmazonResponse(received) {
    const pass = received &&
      typeof received === 'object' &&
      (received.inventorySummaries || received.orders || received.orderItems) &&
      !received.error;

    return {
      pass,
      message: () => pass
        ? `Expected ${JSON.stringify(received)} not to be a valid Amazon response`
        : `Expected ${JSON.stringify(received)} to be a valid Amazon SP-API response`
    };
  }
});

// Performance and timing matchers
expect.extend({
  /**
   * Validates API response time
   */
  toRespondWithin(received, expectedMs) {
    const pass = typeof received === 'number' && received <= expectedMs;

    return {
      pass,
      message: () => pass
        ? `Expected response time ${received}ms not to be within ${expectedMs}ms`
        : `Expected response time ${received}ms to be within ${expectedMs}ms`
    };
  },

  /**
   * Validates memory usage is within limits
   */
  toUseMemoryWithin(received, maxMB) {
    const memoryMB = received / (1024 * 1024);
    const pass = memoryMB <= maxMB;

    return {
      pass,
      message: () => pass
        ? `Expected memory usage ${memoryMB.toFixed(2)}MB not to be within ${maxMB}MB`
        : `Expected memory usage ${memoryMB.toFixed(2)}MB to be within ${maxMB}MB limit`
    };
  },

  /**
   * Validates manufacturing tolerance ranges
   */
  toBeWithinTolerance(received, target, tolerance) {
    const pass = typeof received === 'number' &&
      typeof target === 'number' &&
      typeof tolerance === 'number' &&
      Math.abs(received - target) <= tolerance;

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be within tolerance ±${tolerance} of target ${target}`
        : `Expected ${received} to be within tolerance ±${tolerance} of target ${target}. Actual deviation: ${Math.abs(received - target)}`
    };
  }
});

// Security and validation matchers
expect.extend({
  /**
   * Validates secure token format
   */
  toBeSecureToken(received) {
    const tokenPattern = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/; // JWT pattern
    const apiKeyPattern = /^sk_(live|test)_[A-Za-z0-9]{32}$/; // API key pattern
    
    const pass = typeof received === 'string' &&
      (tokenPattern.test(received) || apiKeyPattern.test(received));

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a secure token format`
        : `Expected ${received} to be a secure token (JWT or API key format)`
    };
  },

  /**
   * Validates sanitized input (no XSS/injection patterns)
   */
  toBeSanitizedInput(received) {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /drop\s+table/i,
      /union\s+select/i,
      /insert\s+into/i,
      /delete\s+from/i
    ];

    const pass = typeof received === 'string' &&
      !dangerousPatterns.some(pattern => pattern.test(received));

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be sanitized input`
        : `Expected ${received} to be sanitized input (contains potentially dangerous patterns)`
    };
  },

  /**
   * Validates proper error structure
   */
  toBeValidErrorResponse(received) {
    const pass = received &&
      typeof received === 'object' &&
      typeof received.error === 'string' &&
      typeof received.message === 'string' &&
      (received.code === undefined || typeof received.code === 'string') &&
      (received.details === undefined || typeof received.details === 'object');

    return {
      pass,
      message: () => pass
        ? `Expected ${JSON.stringify(received)} not to be a valid error response`
        : `Expected ${JSON.stringify(received)} to be a valid error response with error, message, and optional code/details`
    };
  }
});

// Financial and business matchers
expect.extend({
  /**
   * Validates financial amount format
   */
  toBeValidFinancialAmount(received) {
    const pass = typeof received === 'number' &&
      isFinite(received) &&
      Number.isInteger(received * 100); // Ensures proper decimal precision

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid financial amount`
        : `Expected ${received} to be a valid financial amount (number with max 2 decimal places)`
    };
  },

  /**
   * Validates currency code format
   */
  toBeValidCurrencyCode(received) {
    const currencyPattern = /^[A-Z]{3}$/;
    const pass = typeof received === 'string' && currencyPattern.test(received);

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid currency code`
        : `Expected ${received} to be a valid currency code (3-letter ISO format)`
    };
  },

  /**
   * Validates business date format
   */
  toBeValidBusinessDate(received) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const pass = typeof received === 'string' &&
      datePattern.test(received) &&
      !isNaN(Date.parse(received));

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid business date`
        : `Expected ${received} to be a valid business date (YYYY-MM-DD format)`
    };
  },

  /**
   * Validates profit margin calculations
   */
  toHaveProfitMargin(received, expectedMargin, tolerance = 0.01) {
    const pass = received &&
      typeof received === 'object' &&
      typeof received.revenue === 'number' &&
      typeof received.cost === 'number' &&
      received.revenue > 0;

    if (!pass) {
      return {
        pass: false,
        message: () => `Expected object with revenue and cost properties for profit margin calculation`
      };
    }

    const actualMargin = (received.revenue - received.cost) / received.revenue;
    const marginPass = Math.abs(actualMargin - expectedMargin) <= tolerance;

    return {
      pass: marginPass,
      message: () => marginPass
        ? `Expected profit margin ${(actualMargin * 100).toFixed(2)}% not to be ${(expectedMargin * 100).toFixed(2)}%`
        : `Expected profit margin ${(actualMargin * 100).toFixed(2)}% to be ${(expectedMargin * 100).toFixed(2)}% (±${(tolerance * 100).toFixed(2)}%)`
    };
  }
});

// Array and data structure matchers
expect.extend({
  /**
   * Validates array contains valid manufacturing data
   */
  toContainValidManufacturingData(received, validator) {
    const pass = Array.isArray(received) &&
      received.length > 0 &&
      received.every(item => validator(item));

    return {
      pass,
      message: () => pass
        ? `Expected array not to contain valid manufacturing data`
        : `Expected array to contain valid manufacturing data according to validator function`
    };
  },

  /**
   * Validates pagination structure
   */
  toHaveValidPagination(received) {
    const pass = received &&
      typeof received === 'object' &&
      typeof received.page === 'number' &&
      typeof received.limit === 'number' &&
      typeof received.total === 'number' &&
      typeof received.pages === 'number' &&
      Array.isArray(received.data);

    return {
      pass,
      message: () => pass
        ? `Expected ${JSON.stringify(received)} not to have valid pagination`
        : `Expected ${JSON.stringify(received)} to have valid pagination with page, limit, total, pages, and data array`
    };
  },

  /**
   * Validates sorted array by field
   */
  toBeSortedBy(received, field, direction = 'asc') {
    if (!Array.isArray(received) || received.length < 2) {
      return {
        pass: true,
        message: () => `Array with less than 2 elements is considered sorted`
      };
    }

    const pass = received.every((item, index, array) => {
      if (index === 0) return true;
      
      const current = field ? item[field] : item;
      const previous = field ? array[index - 1][field] : array[index - 1];
      
      return direction === 'asc' ? previous <= current : previous >= current;
    });

    return {
      pass,
      message: () => pass
        ? `Expected array not to be sorted by ${field || 'value'} in ${direction} order`
        : `Expected array to be sorted by ${field || 'value'} in ${direction} order`
    };
  }
});

// Export the matchers for documentation
export const customMatchers = {
  // Manufacturing-specific
  toBeValidManufacturingOrder: 'Validates manufacturing order structure',
  toBeValidProductSpecification: 'Validates product specification structure',
  toBeValidQualityRecord: 'Validates quality control data',
  toBeValidInventoryLevel: 'Validates inventory level data',
  
  // API Response
  toBeValidMcpToolResponse: 'Validates MCP tool response structure',
  toBeValidXeroResponse: 'Validates Xero API response structure',
  toBeValidShopifyResponse: 'Validates Shopify API response structure',
  toBeValidAmazonResponse: 'Validates Amazon SP-API response structure',
  
  // Performance
  toRespondWithin: 'Validates API response time',
  toUseMemoryWithin: 'Validates memory usage limits',
  toBeWithinTolerance: 'Validates manufacturing tolerance ranges',
  
  // Security
  toBeSecureToken: 'Validates secure token format',
  toBeSanitizedInput: 'Validates sanitized input',
  toBeValidErrorResponse: 'Validates proper error structure',
  
  // Financial
  toBeValidFinancialAmount: 'Validates financial amount format',
  toBeValidCurrencyCode: 'Validates currency code format',
  toBeValidBusinessDate: 'Validates business date format',
  toHaveProfitMargin: 'Validates profit margin calculations',
  
  // Data structures
  toContainValidManufacturingData: 'Validates array contains valid manufacturing data',
  toHaveValidPagination: 'Validates pagination structure',
  toBeSortedBy: 'Validates sorted array by field'
};