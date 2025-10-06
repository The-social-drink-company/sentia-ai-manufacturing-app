/**
 * Amazon Orders Management Tool
 * 
 * Comprehensive orders retrieval and management for Amazon marketplaces
 * with fulfillment tracking, metrics calculation, and business intelligence.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon Orders Tool Class
 */
export class OrdersTool {
  constructor(authManager, options = {}) {
    this.authManager = authManager;
    this.options = {
      defaultLimit: options.defaultLimit || 100,
      maxLimit: options.maxLimit || 500,
      defaultDateRange: options.defaultDateRange || 30, // days
      includeMetrics: options.includeMetrics !== false,
      ...options
    };

    // Input schema for MCP
    this.inputSchema = {
      type: 'object',
      properties: {
        marketplaceId: {
          type: 'string',
          enum: ['UK', 'USA', 'EU', 'CANADA', 'A1F83G8C2ARO7P', 'ATVPDKIKX0DER', 'A1PA6795UKMFR9', 'A2EUQ1WTGCTBG2'],
          description: 'Amazon marketplace ID or name (UK, USA, EU, CANADA)'
        },
        dateRange: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' }
          },
          description: 'Date range for order retrieval (defaults to last 30 days)'
        },
        orderStatus: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['Pending', 'Unshipped', 'PartiallyShipped', 'Shipped', 'Canceled', 'Unfulfillable']
          },
          description: 'Filter by order status (all statuses if not specified)'
        },
        fulfillmentChannels: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['AFN', 'MFN']
          },
          description: 'Filter by fulfillment channel (AFN=FBA, MFN=FBM)'
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 500,
          description: 'Maximum number of orders to retrieve'
        },
        includeMetrics: {
          type: 'boolean',
          default: true,
          description: 'Include order metrics and analytics'
        },
        includeItems: {
          type: 'boolean',
          default: true,
          description: 'Include order line items details'
        },
        sandbox: {
          type: 'boolean',
          default: false,
          description: 'Use sandbox environment'
        }
      },
      required: ['marketplaceId']
    };

    logger.info('Amazon Orders Tool initialized', {
      defaultLimit: this.options.defaultLimit,
      maxLimit: this.options.maxLimit,
      defaultDateRange: this.options.defaultDateRange
    });
  }

  /**
   * Execute orders retrieval
   */
  async execute(params = {}) {
    const correlationId = `orders-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Executing Amazon orders retrieval', {
        correlationId,
        params: this.sanitizeParams(params)
      });

      // Validate and normalize parameters
      const normalizedParams = this.validateAndNormalizeParams(params);
      
      // Get authenticated client
      const client = await this.authManager.getClient(normalizedParams.marketplaceId, {
        sandbox: normalizedParams.sandbox,
        correlationId
      });

      // Retrieve orders
      const ordersData = await this.retrieveOrders(client, normalizedParams, correlationId);

      // Enrich with additional data if requested
      if (normalizedParams.includeItems) {
        await this.enrichOrdersWithItems(client, ordersData.orders, normalizedParams, correlationId);
      }

      // Calculate metrics if requested
      let metrics = null;
      if (normalizedParams.includeMetrics) {
        metrics = this.calculateOrderMetrics(ordersData.orders, normalizedParams);
      }

      const result = {
        success: true,
        marketplace: normalizedParams.marketplaceId,
        summary: {
          totalOrders: ordersData.orders.length,
          dateRange: normalizedParams.dateRange,
          totalValue: ordersData.orders.reduce((sum, order) => sum + parseFloat(order.OrderTotal?.Amount || 0), 0),
          currency: ordersData.orders[0]?.OrderTotal?.CurrencyCode || 'USD'
        },
        orders: ordersData.orders,
        metrics,
        pagination: {
          hasNextPage: !!ordersData.nextToken,
          nextToken: ordersData.nextToken
        },
        timestamp: new Date().toISOString(),
        correlationId
      };

      logger.info('Amazon orders retrieval completed', {
        correlationId,
        orderCount: result.orders.length,
        totalValue: result.summary.totalValue,
        marketplace: normalizedParams.marketplaceId
      });

      return result;

    } catch (error) {
      logger.error('Amazon orders retrieval failed', {
        correlationId,
        error: error.message,
        stack: error.stack,
        params: this.sanitizeParams(params)
      });

      return {
        success: false,
        error: error.message,
        correlationId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate and normalize input parameters
   */
  validateAndNormalizeParams(params) {
    const normalized = { ...params };

    // Set default date range if not provided
    if (!normalized.dateRange) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - this.options.defaultDateRange);
      
      normalized.dateRange = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }

    // Validate date range
    const start = new Date(normalized.dateRange.startDate);
    const end = new Date(normalized.dateRange.endDate);
    
    if (start >= end) {
      throw new Error('Start date must be before end date');
    }

    // Limit date range to prevent excessive API calls
    const maxDays = 180; // 6 months
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (daysDiff > maxDays) {
      throw new Error(`Date range cannot exceed ${maxDays} days`);
    }

    // Set defaults
    normalized.limit = Math.min(normalized.limit || this.options.defaultLimit, this.options.maxLimit);
    normalized.includeMetrics = normalized.includeMetrics !== false;
    normalized.includeItems = normalized.includeItems !== false;
    normalized.sandbox = normalized.sandbox || false;

    return normalized;
  }

  /**
   * Retrieve orders from Amazon SP-API
   */
  async retrieveOrders(client, params, correlationId) {
    try {
      logger.debug('Retrieving orders from SP-API', {
        correlationId,
        marketplace: params.marketplaceId,
        dateRange: params.dateRange
      });

      const requestParams = {
        MarketplaceIds: [this.getMarketplaceId(params.marketplaceId)],
        CreatedAfter: params.dateRange.startDate,
        CreatedBefore: params.dateRange.endDate,
        MaxResultsPerPage: params.limit
      };

      // Add optional filters
      if (params.orderStatus && params.orderStatus.length > 0) {
        requestParams.OrderStatuses = params.orderStatus;
      }

      if (params.fulfillmentChannels && params.fulfillmentChannels.length > 0) {
        requestParams.FulfillmentChannels = params.fulfillmentChannels;
      }

      const response = await client.callAPI({
        operation: 'getOrders',
        endpoint: 'orders',
        query: requestParams
      });

      const orders = response.Orders || [];
      
      // Enrich orders with calculated fields
      const enrichedOrders = orders.map(order => this.enrichOrderData(order, params));

      return {
        orders: enrichedOrders,
        nextToken: response.NextToken
      };

    } catch (error) {
      logger.error('Failed to retrieve orders from SP-API', {
        correlationId,
        error: error.message,
        marketplace: params.marketplaceId
      });
      throw error;
    }
  }

  /**
   * Enrich orders with order items data
   */
  async enrichOrdersWithItems(client, orders, params, correlationId) {
    logger.debug('Enriching orders with items data', {
      correlationId,
      orderCount: orders.length
    });

    const itemPromises = orders.map(async (order) => {
      try {
        const response = await client.callAPI({
          operation: 'getOrderItems',
          endpoint: 'orders',
          path: {
            orderId: order.AmazonOrderId
          }
        });

        order.OrderItems = response.OrderItems || [];
        order.ItemCount = order.OrderItems.length;
        
        // Calculate item-level metrics
        order.TotalQuantity = order.OrderItems.reduce(
          (sum, item) => sum + parseInt(item.QuantityOrdered || 0), 0
        );

        return order;
      } catch (error) {
        logger.warn('Failed to get items for order', {
          correlationId,
          orderId: order.AmazonOrderId,
          error: error.message
        });
        order.OrderItems = [];
        order.ItemCount = 0;
        return order;
      }
    });

    await Promise.all(itemPromises);
  }

  /**
   * Enrich individual order data
   */
  enrichOrderData(order, params) {
    const enriched = { ...order };

    // Add calculated fields
    enriched.calculated = {
      orderAge: this.calculateOrderAge(order.PurchaseDate),
      fulfillmentType: order.FulfillmentChannel === 'AFN' ? 'FBA' : 'FBM',
      isPrime: order.ShipServiceLevel?.includes('Prime') || false,
      isBusinessOrder: order.IsBusinessOrder || false,
      totalValue: parseFloat(order.OrderTotal?.Amount || 0),
      currency: order.OrderTotal?.CurrencyCode || 'USD'
    };

    // Shipping information
    if (order.ShippingAddress) {
      enriched.calculated.shippingRegion = this.determineShippingRegion(order.ShippingAddress);
    }

    // Order classification
    enriched.calculated.orderType = this.classifyOrder(order);
    enriched.calculated.priority = this.calculateOrderPriority(order);

    return enriched;
  }

  /**
   * Calculate comprehensive order metrics
   */
  calculateOrderMetrics(orders, params) {
    if (!orders || orders.length === 0) {
      return null;
    }

    const metrics = {
      overview: {
        totalOrders: orders.length,
        totalValue: 0,
        averageOrderValue: 0,
        currency: orders[0]?.OrderTotal?.CurrencyCode || 'USD'
      },
      fulfillment: {
        fba: { count: 0, value: 0 },
        fbm: { count: 0, value: 0 },
        fbaPercentage: 0
      },
      status: {},
      shipping: {
        prime: { count: 0, percentage: 0 },
        standard: { count: 0, percentage: 0 }
      },
      trends: {
        dailyOrders: {},
        hourlyDistribution: Array(24).fill(0)
      },
      geography: {}
    };

    // Calculate metrics
    orders.forEach(order => {
      const value = parseFloat(order.OrderTotal?.Amount || 0);
      metrics.overview.totalValue += value;

      // Fulfillment metrics
      if (order.FulfillmentChannel === 'AFN') {
        metrics.fulfillment.fba.count++;
        metrics.fulfillment.fba.value += value;
      } else {
        metrics.fulfillment.fbm.count++;
        metrics.fulfillment.fbm.value += value;
      }

      // Status metrics
      const status = order.OrderStatus;
      metrics.status[status] = (metrics.status[status] || 0) + 1;

      // Shipping metrics
      if (order.calculated?.isPrime) {
        metrics.shipping.prime.count++;
      } else {
        metrics.shipping.standard.count++;
      }

      // Time-based metrics
      const orderDate = new Date(order.PurchaseDate);
      const dateKey = orderDate.toISOString().split('T')[0];
      metrics.trends.dailyOrders[dateKey] = (metrics.trends.dailyOrders[dateKey] || 0) + 1;
      metrics.trends.hourlyDistribution[orderDate.getHours()]++;

      // Geographic metrics
      if (order.calculated?.shippingRegion) {
        const region = order.calculated.shippingRegion;
        metrics.geography[region] = (metrics.geography[region] || 0) + 1;
      }
    });

    // Calculate percentages and averages
    metrics.overview.averageOrderValue = metrics.overview.totalValue / metrics.overview.totalOrders;
    metrics.fulfillment.fbaPercentage = (metrics.fulfillment.fba.count / metrics.overview.totalOrders) * 100;
    metrics.shipping.prime.percentage = (metrics.shipping.prime.count / metrics.overview.totalOrders) * 100;
    metrics.shipping.standard.percentage = (metrics.shipping.standard.count / metrics.overview.totalOrders) * 100;

    return metrics;
  }

  /**
   * Calculate order age in days
   */
  calculateOrderAge(purchaseDate) {
    const orderDate = new Date(purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now - orderDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine shipping region from address
   */
  determineShippingRegion(address) {
    const stateCode = address.StateOrRegion;
    const countryCode = address.CountryCode;

    if (countryCode === 'US') {
      // US regions
      const westStates = ['CA', 'OR', 'WA', 'NV', 'AZ', 'UT', 'ID', 'MT', 'WY', 'CO', 'NM'];
      const eastStates = ['NY', 'NJ', 'PA', 'CT', 'MA', 'RI', 'VT', 'NH', 'ME'];
      const southStates = ['TX', 'FL', 'GA', 'NC', 'SC', 'VA', 'TN', 'KY', 'WV', 'MD', 'DE', 'DC'];
      
      if (westStates.includes(stateCode)) return 'US-West';
      if (eastStates.includes(stateCode)) return 'US-East';
      if (southStates.includes(stateCode)) return 'US-South';
      return 'US-Central';
    }

    return countryCode || 'Unknown';
  }

  /**
   * Classify order type
   */
  classifyOrder(order) {
    if (order.IsBusinessOrder) return 'Business';
    if (order.calculated?.isPrime) return 'Prime';
    if (parseFloat(order.OrderTotal?.Amount || 0) > 100) return 'High-Value';
    return 'Standard';
  }

  /**
   * Calculate order priority
   */
  calculateOrderPriority(order) {
    let priority = 0;
    
    if (order.calculated?.isPrime) priority += 3;
    if (order.IsBusinessOrder) priority += 2;
    if (order.FulfillmentChannel === 'AFN') priority += 1;
    if (parseFloat(order.OrderTotal?.Amount || 0) > 100) priority += 2;
    
    if (priority >= 5) return 'High';
    if (priority >= 3) return 'Medium';
    return 'Low';
  }

  /**
   * Get marketplace ID from name or return as-is if already ID
   */
  getMarketplaceId(identifier) {
    const marketplaceMap = {
      'UK': 'A1F83G8C2ARO7P',
      'USA': 'ATVPDKIKX0DER',
      'EU': 'A1PA6795UKMFR9',
      'CANADA': 'A2EUQ1WTGCTBG2'
    };

    return marketplaceMap[identifier.toUpperCase()] || identifier;
  }

  /**
   * Sanitize parameters for logging
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    // Remove sensitive data if any
    return sanitized;
  }

  /**
   * Get tool schema for MCP registration
   */
  getSchema() {
    return {
      name: 'amazon-get-orders',
      description: 'Retrieve and analyze Amazon marketplace orders with fulfillment tracking and business intelligence',
      inputSchema: this.inputSchema
    };
  }
}