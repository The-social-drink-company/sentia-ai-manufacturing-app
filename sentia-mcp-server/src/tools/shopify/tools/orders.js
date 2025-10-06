/**
 * Shopify Orders Management Tool
 * 
 * Comprehensive order retrieval and analysis with customer data,
 * fulfillment tracking, and order metrics calculation.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

/**
 * Orders Tool Class
 */
export class OrdersTool {
  constructor(shopifyIntegration) {
    this.shopify = shopifyIntegration;
    this.name = 'shopify-get-orders';
    this.description = 'Retrieve and analyze Shopify orders with comprehensive filtering and metrics';
    this.category = 'orders';
    this.cacheEnabled = true;
    this.cacheTTL = 60; // 1 minute
    this.requiresAuth = true;

    this.inputSchema = {
      type: 'object',
      properties: {
        storeId: {
          type: 'string',
          enum: ['uk', 'usa', 'all'],
          description: 'Store to retrieve orders from',
          default: 'all'
        },
        status: {
          type: 'string',
          enum: ['open', 'closed', 'cancelled', 'any'],
          description: 'Order status filter',
          default: 'any'
        },
        fulfillmentStatus: {
          type: 'string',
          enum: ['shipped', 'partial', 'unshipped', 'any'],
          description: 'Fulfillment status filter',
          default: 'any'
        },
        financialStatus: {
          type: 'string',
          enum: ['pending', 'authorized', 'partially_paid', 'paid', 'partially_refunded', 'refunded', 'voided', 'any'],
          description: 'Financial status filter',
          default: 'any'
        },
        dateFrom: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'Start date for order filtering (YYYY-MM-DD)'
        },
        dateTo: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'End date for order filtering (YYYY-MM-DD)'
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 250,
          description: 'Maximum number of orders to retrieve per store',
          default: 50
        },
        sinceId: {
          type: 'string',
          description: 'Retrieve orders after this order ID (pagination)'
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific fields to retrieve (comma-separated)'
        },
        includeCustomer: {
          type: 'boolean',
          description: 'Include detailed customer information',
          default: true
        },
        includeFulfillments: {
          type: 'boolean',
          description: 'Include fulfillment details',
          default: true
        },
        includeLineItems: {
          type: 'boolean',
          description: 'Include line item details',
          default: true
        },
        includeAnalytics: {
          type: 'boolean',
          description: 'Include order analytics and metrics',
          default: true
        },
        sortBy: {
          type: 'string',
          enum: ['created_at', 'updated_at', 'total_price', 'order_number'],
          description: 'Sort orders by field',
          default: 'created_at'
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order direction',
          default: 'desc'
        }
      },
      additionalProperties: false
    };

    logger.info('Shopify Orders Tool initialized');
  }

  /**
   * Execute orders retrieval
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing Shopify orders tool', {
        correlationId,
        storeId: params.storeId || 'all',
        status: params.status,
        dateRange: params.dateFrom ? `${params.dateFrom} to ${params.dateTo || 'now'}` : 'all time'
      });

      const results = {};

      if (params.storeId === 'all') {
        // Get orders from all configured stores
        const configuredStores = Object.keys(this.shopify.config.stores).filter(
          storeId => this.shopify.config.stores[storeId].shopDomain && 
                     this.shopify.config.stores[storeId].accessToken
        );

        for (const storeId of configuredStores) {
          try {
            const storeParams = { ...params, storeId };
            results[storeId] = await this.getStoreOrders(storeParams, correlationId);
          } catch (error) {
            logger.warn('Failed to get orders for store', {
              correlationId,
              storeId,
              error: error.message
            });
            results[storeId] = { error: error.message };
          }
        }
      } else {
        // Get orders from specific store
        results[params.storeId] = await this.getStoreOrders(params, correlationId);
      }

      // Perform cross-store analytics if multiple stores
      let aggregatedAnalytics = null;
      if (params.includeAnalytics && Object.keys(results).length > 1) {
        aggregatedAnalytics = this.calculateAggregatedAnalytics(results);
      }

      const executionTime = Date.now() - startTime;

      logger.info('Orders retrieved successfully', {
        correlationId,
        storesProcessed: Object.keys(results).length,
        executionTime
      });

      return {
        success: true,
        data: {
          orders: results,
          aggregated: aggregatedAnalytics
        },
        metadata: {
          correlationId,
          executionTime,
          storesProcessed: Object.keys(results).length,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Orders retrieval failed', {
        correlationId,
        error: error.message,
        executionTime
      });

      throw new Error(`Orders retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get orders from a specific store
   */
  async getStoreOrders(params, correlationId) {
    try {
      const client = this.shopify.getRestClient(params.storeId);
      
      // Build query parameters
      const queryParams = this.buildQueryParams(params);

      logger.debug('Fetching orders from store', {
        correlationId,
        storeId: params.storeId,
        queryParams
      });

      // Fetch orders from Shopify
      const response = await client.get({
        path: 'orders',
        query: queryParams
      });

      if (!response.body || !response.body.orders) {
        throw new Error('Invalid response from Shopify API');
      }

      const orders = response.body.orders;

      // Enrich orders with additional data if requested
      const enrichedOrders = await this.enrichOrdersData(orders, params, correlationId);

      // Calculate analytics if requested
      let analytics = null;
      if (params.includeAnalytics) {
        analytics = this.calculateOrderAnalytics(enrichedOrders, params);
      }

      logger.debug('Orders retrieved from store', {
        correlationId,
        storeId: params.storeId,
        orderCount: orders.length
      });

      return {
        success: true,
        storeId: params.storeId,
        orders: enrichedOrders,
        analytics,
        pagination: this.extractPaginationInfo(response.headers),
        metadata: {
          orderCount: orders.length,
          retrievedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Failed to get orders from store', {
        correlationId,
        storeId: params.storeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Build query parameters for Shopify API
   */
  buildQueryParams(params) {
    const queryParams = {};

    // Basic filters
    if (params.status && params.status !== 'any') {
      queryParams.status = params.status;
    }

    if (params.fulfillmentStatus && params.fulfillmentStatus !== 'any') {
      queryParams.fulfillment_status = params.fulfillmentStatus;
    }

    if (params.financialStatus && params.financialStatus !== 'any') {
      queryParams.financial_status = params.financialStatus;
    }

    // Date filters
    if (params.dateFrom) {
      queryParams.created_at_min = `${params.dateFrom}T00:00:00Z`;
    }

    if (params.dateTo) {
      queryParams.created_at_max = `${params.dateTo}T23:59:59Z`;
    }

    // Pagination
    queryParams.limit = params.limit || 50;
    
    if (params.sinceId) {
      queryParams.since_id = params.sinceId;
    }

    // Field selection
    if (params.fields && params.fields.length > 0) {
      queryParams.fields = params.fields.join(',');
    }

    // Sorting - Shopify API sorts by ID by default, but we can process after
    // (Shopify doesn't support custom sorting directly in the API)

    return queryParams;
  }

  /**
   * Enrich orders with additional data
   */
  async enrichOrdersData(orders, params, correlationId) {
    try {
      const enrichedOrders = [];

      for (const order of orders) {
        const enrichedOrder = { ...order };

        // Add calculated fields
        enrichedOrder.calculated = {
          totalItems: this.calculateTotalItems(order),
          averageItemPrice: this.calculateAverageItemPrice(order),
          discountPercentage: this.calculateDiscountPercentage(order),
          taxPercentage: this.calculateTaxPercentage(order),
          daysToShip: this.calculateDaysToShip(order),
          orderValue: parseFloat(order.total_price || 0),
          profitMargin: this.estimateProfitMargin(order)
        };

        // Add customer analytics if customer data is available
        if (order.customer && params.includeCustomer) {
          enrichedOrder.customerAnalytics = {
            isFirstOrder: await this.isCustomerFirstOrder(order.customer.id, params.storeId),
            customerLifetimeOrders: order.customer.orders_count || 0,
            customerLifetimeValue: parseFloat(order.customer.total_spent || 0),
            customerSegment: this.categorizeCustomer(order.customer)
          };
        }

        // Add fulfillment analytics
        if (order.fulfillments && params.includeFulfillments) {
          enrichedOrder.fulfillmentAnalytics = {
            trackingProviders: this.extractTrackingProviders(order.fulfillments),
            shippingMethods: this.extractShippingMethods(order.fulfillments),
            fulfillmentSpeed: this.calculateFulfillmentSpeed(order),
            deliveryStatus: this.determineFulfillmentStatus(order.fulfillments)
          };
        }

        // Add product performance data
        if (order.line_items && params.includeLineItems) {
          enrichedOrder.productAnalytics = {
            topSellingProducts: this.identifyTopProducts(order.line_items),
            categoryBreakdown: this.analyzeCategoryBreakdown(order.line_items),
            variantAnalysis: this.analyzeVariants(order.line_items)
          };
        }

        enrichedOrders.push(enrichedOrder);
      }

      return enrichedOrders;

    } catch (error) {
      logger.warn('Failed to enrich orders data', {
        correlationId,
        error: error.message
      });
      // Return original orders if enrichment fails
      return orders;
    }
  }

  /**
   * Calculate comprehensive order analytics
   */
  calculateOrderAnalytics(orders, params) {
    try {
      const analytics = {
        summary: {
          totalOrders: orders.length,
          totalRevenue: 0,
          averageOrderValue: 0,
          totalItems: 0,
          uniqueCustomers: new Set()
        },
        trends: {
          dailyOrders: {},
          weeklyOrders: {},
          monthlyOrders: {}
        },
        performance: {
          conversionMetrics: {},
          fulfillmentMetrics: {},
          customerMetrics: {}
        },
        insights: []
      };

      // Calculate summary metrics
      orders.forEach(order => {
        const orderValue = parseFloat(order.total_price || 0);
        analytics.summary.totalRevenue += orderValue;
        analytics.summary.totalItems += order.calculated?.totalItems || 0;
        
        if (order.customer?.id) {
          analytics.summary.uniqueCustomers.add(order.customer.id);
        }

        // Track daily trends
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (!analytics.trends.dailyOrders[orderDate]) {
          analytics.trends.dailyOrders[orderDate] = { count: 0, revenue: 0 };
        }
        analytics.trends.dailyOrders[orderDate].count++;
        analytics.trends.dailyOrders[orderDate].revenue += orderValue;
      });

      // Calculate averages
      if (orders.length > 0) {
        analytics.summary.averageOrderValue = analytics.summary.totalRevenue / orders.length;
      }

      analytics.summary.uniqueCustomers = analytics.summary.uniqueCustomers.size;

      // Calculate performance metrics
      analytics.performance = this.calculatePerformanceMetrics(orders);

      // Generate insights
      analytics.insights = this.generateOrderInsights(analytics, orders);

      return analytics;

    } catch (error) {
      logger.warn('Failed to calculate order analytics', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics(orders) {
    const metrics = {
      conversionMetrics: {
        completedOrders: orders.filter(o => o.financial_status === 'paid').length,
        cancelledOrders: orders.filter(o => o.cancelled_at).length,
        refundedOrders: orders.filter(o => o.financial_status === 'refunded').length
      },
      fulfillmentMetrics: {
        shippedOrders: orders.filter(o => o.fulfillment_status === 'fulfilled').length,
        pendingOrders: orders.filter(o => !o.fulfillment_status || o.fulfillment_status === 'unfulfilled').length,
        averageFulfillmentTime: this.calculateAverageFulfillmentTime(orders)
      },
      customerMetrics: {
        newCustomers: orders.filter(o => o.customerAnalytics?.isFirstOrder).length,
        returningCustomers: orders.filter(o => !o.customerAnalytics?.isFirstOrder).length,
        averageCustomerValue: this.calculateAverageCustomerValue(orders)
      }
    };

    return metrics;
  }

  /**
   * Generate business insights from order data
   */
  generateOrderInsights(analytics, orders) {
    const insights = [];

    // Revenue insights
    if (analytics.summary.averageOrderValue > 100) {
      insights.push({
        type: 'revenue',
        severity: 'positive',
        message: `High average order value of $${analytics.summary.averageOrderValue.toFixed(2)}`
      });
    }

    // Fulfillment insights
    const pendingRate = analytics.performance.fulfillmentMetrics.pendingOrders / orders.length;
    if (pendingRate > 0.2) {
      insights.push({
        type: 'fulfillment',
        severity: 'warning',
        message: `${(pendingRate * 100).toFixed(1)}% of orders are pending fulfillment`
      });
    }

    // Customer insights
    const newCustomerRate = analytics.performance.customerMetrics.newCustomers / orders.length;
    if (newCustomerRate > 0.7) {
      insights.push({
        type: 'customer',
        severity: 'info',
        message: `High new customer acquisition rate: ${(newCustomerRate * 100).toFixed(1)}%`
      });
    }

    return insights;
  }

  // Helper methods for calculations

  calculateTotalItems(order) {
    return order.line_items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
  }

  calculateAverageItemPrice(order) {
    const totalItems = this.calculateTotalItems(order);
    return totalItems > 0 ? parseFloat(order.total_price || 0) / totalItems : 0;
  }

  calculateDiscountPercentage(order) {
    const subtotal = parseFloat(order.subtotal_price || 0);
    const totalDiscount = parseFloat(order.total_discounts || 0);
    return subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
  }

  calculateTaxPercentage(order) {
    const subtotal = parseFloat(order.subtotal_price || 0);
    const totalTax = parseFloat(order.total_tax || 0);
    return subtotal > 0 ? (totalTax / subtotal) * 100 : 0;
  }

  calculateDaysToShip(order) {
    if (!order.fulfillments || order.fulfillments.length === 0) return null;
    
    const orderDate = new Date(order.created_at);
    const shipDate = new Date(order.fulfillments[0].created_at);
    return Math.ceil((shipDate - orderDate) / (1000 * 60 * 60 * 24));
  }

  estimateProfitMargin(order) {
    // Simplified profit margin estimation (would need cost data for accuracy)
    const revenue = parseFloat(order.total_price || 0);
    const estimatedCost = revenue * 0.6; // Assume 60% cost ratio
    return revenue > 0 ? ((revenue - estimatedCost) / revenue) * 100 : 0;
  }

  async isCustomerFirstOrder(customerId, storeId) {
    // This would require a separate API call to check customer order history
    // For now, return null to indicate unknown
    return null;
  }

  categorizeCustomer(customer) {
    const lifetimeValue = parseFloat(customer.total_spent || 0);
    const orderCount = customer.orders_count || 0;

    if (lifetimeValue > 1000 && orderCount > 10) return 'VIP';
    if (lifetimeValue > 500 && orderCount > 5) return 'Loyal';
    if (orderCount > 1) return 'Returning';
    return 'New';
  }

  extractTrackingProviders(fulfillments) {
    return fulfillments.map(f => f.tracking_company).filter(Boolean);
  }

  extractShippingMethods(fulfillments) {
    return fulfillments.map(f => f.service).filter(Boolean);
  }

  calculateFulfillmentSpeed(order) {
    const daysToShip = this.calculateDaysToShip(order);
    if (daysToShip === null) return 'pending';
    if (daysToShip <= 1) return 'same_day';
    if (daysToShip <= 2) return 'next_day';
    if (daysToShip <= 5) return 'standard';
    return 'slow';
  }

  determineFulfillmentStatus(fulfillments) {
    if (!fulfillments || fulfillments.length === 0) return 'unfulfilled';
    if (fulfillments.every(f => f.status === 'success')) return 'fulfilled';
    if (fulfillments.some(f => f.status === 'success')) return 'partially_fulfilled';
    return 'pending';
  }

  identifyTopProducts(lineItems) {
    return lineItems
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, 3)
      .map(item => ({
        productId: item.product_id,
        title: item.title,
        quantity: item.quantity,
        price: item.price
      }));
  }

  analyzeCategoryBreakdown(lineItems) {
    // This would require product category data
    return {};
  }

  analyzeVariants(lineItems) {
    return lineItems.map(item => ({
      variantId: item.variant_id,
      title: item.variant_title,
      sku: item.sku,
      quantity: item.quantity
    }));
  }

  calculateAverageFulfillmentTime(orders) {
    const fulfilledOrders = orders.filter(o => this.calculateDaysToShip(o) !== null);
    if (fulfilledOrders.length === 0) return 0;
    
    const totalDays = fulfilledOrders.reduce((sum, order) => sum + this.calculateDaysToShip(order), 0);
    return totalDays / fulfilledOrders.length;
  }

  calculateAverageCustomerValue(orders) {
    const customersWithValue = orders.filter(o => o.customer?.total_spent);
    if (customersWithValue.length === 0) return 0;
    
    const totalValue = customersWithValue.reduce((sum, order) => sum + parseFloat(order.customer.total_spent || 0), 0);
    return totalValue / customersWithValue.length;
  }

  calculateAggregatedAnalytics(storeResults) {
    const aggregated = {
      totalOrders: 0,
      totalRevenue: 0,
      storeComparison: {},
      crossStoreInsights: []
    };

    Object.entries(storeResults).forEach(([storeId, result]) => {
      if (result.success && result.analytics) {
        aggregated.totalOrders += result.analytics.summary.totalOrders;
        aggregated.totalRevenue += result.analytics.summary.totalRevenue;
        
        aggregated.storeComparison[storeId] = {
          orders: result.analytics.summary.totalOrders,
          revenue: result.analytics.summary.totalRevenue,
          avgOrderValue: result.analytics.summary.averageOrderValue
        };
      }
    });

    return aggregated;
  }

  extractPaginationInfo(headers) {
    // Extract pagination info from Shopify headers
    const linkHeader = headers.link;
    if (!linkHeader) return null;

    return {
      hasNext: linkHeader.includes('rel="next"'),
      hasPrevious: linkHeader.includes('rel="previous"')
    };
  }
}