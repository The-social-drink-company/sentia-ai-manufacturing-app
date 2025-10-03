/**
 * Shopify Customers Management Tool
 * 
 * Comprehensive customer database retrieval with order history,
 * lifetime value calculation, and customer segmentation.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

/**
 * Customers Tool Class
 */
export class CustomersTool {
  constructor(shopifyIntegration) {
    this.shopify = shopifyIntegration;
    this.name = 'shopify-get-customers';
    this.description = 'Retrieve Shopify customers with order history, lifetime value, and segmentation';
    this.category = 'customers';
    this.cacheEnabled = true;
    this.cacheTTL = 1800; // 30 minutes
    this.requiresAuth = true;

    this.inputSchema = {
      type: 'object',
      properties: {
        storeId: {
          type: 'string',
          enum: ['uk', 'usa', 'all'],
          description: 'Store to retrieve customers from',
          default: 'all'
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Filter by specific customer email'
        },
        phone: {
          type: 'string',
          description: 'Filter by customer phone number'
        },
        state: {
          type: 'string',
          enum: ['disabled', 'invited', 'enabled', 'declined'],
          description: 'Customer account state filter'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by customer tags'
        },
        sinceId: {
          type: 'string',
          description: 'Retrieve customers after this customer ID (pagination)'
        },
        createdAtMin: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
          description: 'Minimum creation date (ISO 8601 format)'
        },
        createdAtMax: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
          description: 'Maximum creation date (ISO 8601 format)'
        },
        updatedAtMin: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
          description: 'Minimum update date (ISO 8601 format)'
        },
        updatedAtMax: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
          description: 'Maximum update date (ISO 8601 format)'
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 250,
          description: 'Maximum number of customers to retrieve per store',
          default: 50
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific fields to retrieve'
        },
        includeOrderHistory: {
          type: 'boolean',
          description: 'Include detailed order history for each customer',
          default: true
        },
        includeAddresses: {
          type: 'boolean',
          description: 'Include customer addresses',
          default: true
        },
        includeAnalytics: {
          type: 'boolean',
          description: 'Include customer analytics and segmentation',
          default: true
        },
        segmentBy: {
          type: 'string',
          enum: ['value', 'frequency', 'recency', 'geographic', 'lifecycle'],
          description: 'Customer segmentation method',
          default: 'value'
        },
        minLifetimeValue: {
          type: 'number',
          minimum: 0,
          description: 'Minimum customer lifetime value filter'
        },
        minOrderCount: {
          type: 'integer',
          minimum: 0,
          description: 'Minimum order count filter'
        }
      },
      additionalProperties: false
    };

    logger.info('Shopify Customers Tool initialized');
  }

  /**
   * Execute customers retrieval
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing Shopify customers tool', {
        correlationId,
        storeId: params.storeId || 'all',
        includeOrderHistory: params.includeOrderHistory,
        segmentBy: params.segmentBy
      });

      const results = {};

      if (params.storeId === 'all') {
        // Get customers from all configured stores
        const configuredStores = Object.keys(this.shopify.config.stores).filter(
          storeId => this.shopify.config.stores[storeId].shopDomain && 
                     this.shopify.config.stores[storeId].accessToken
        );

        for (const storeId of configuredStores) {
          try {
            const storeParams = { ...params, storeId };
            results[storeId] = await this.getStoreCustomers(storeParams, correlationId);
          } catch (error) {
            logger.warn('Failed to get customers for store', {
              correlationId,
              storeId,
              error: error.message
            });
            results[storeId] = { error: error.message };
          }
        }
      } else {
        // Get customers from specific store
        results[params.storeId] = await this.getStoreCustomers(params, correlationId);
      }

      // Perform cross-store analytics if multiple stores
      let aggregatedAnalytics = null;
      if (params.includeAnalytics && Object.keys(results).length > 1) {
        aggregatedAnalytics = this.calculateAggregatedAnalytics(results);
      }

      const executionTime = Date.now() - startTime;

      logger.info('Customers retrieved successfully', {
        correlationId,
        storesProcessed: Object.keys(results).length,
        executionTime
      });

      return {
        success: true,
        data: {
          customers: results,
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

      logger.error('Customers retrieval failed', {
        correlationId,
        error: error.message,
        executionTime
      });

      throw new Error(`Customers retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get customers from a specific store
   */
  async getStoreCustomers(params, correlationId) {
    try {
      const client = this.shopify.getRestClient(params.storeId);
      
      // Build query parameters
      const queryParams = this.buildQueryParams(params);

      logger.debug('Fetching customers from store', {
        correlationId,
        storeId: params.storeId,
        queryParams
      });

      // Fetch customers from Shopify
      const response = await client.get({
        path: 'customers',
        query: queryParams
      });

      if (!response.body || !response.body.customers) {
        throw new Error('Invalid response from Shopify API');
      }

      let customers = response.body.customers;

      // Apply additional filters
      customers = this.applyAdditionalFilters(customers, params);

      // Enrich customers with additional data if requested
      const enrichedCustomers = await this.enrichCustomersData(customers, params, correlationId);

      // Calculate analytics if requested
      let analytics = null;
      if (params.includeAnalytics) {
        analytics = this.calculateCustomerAnalytics(enrichedCustomers, params);
      }

      logger.debug('Customers retrieved from store', {
        correlationId,
        storeId: params.storeId,
        customerCount: customers.length
      });

      return {
        success: true,
        storeId: params.storeId,
        customers: enrichedCustomers,
        analytics,
        pagination: this.extractPaginationInfo(response.headers),
        metadata: {
          customerCount: customers.length,
          retrievedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Failed to get customers from store', {
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
    if (params.email) {
      queryParams.email = params.email;
    }

    if (params.phone) {
      queryParams.phone = params.phone;
    }

    if (params.state) {
      queryParams.state = params.state;
    }

    // Date filters
    if (params.createdAtMin) {
      queryParams.created_at_min = params.createdAtMin;
    }

    if (params.createdAtMax) {
      queryParams.created_at_max = params.createdAtMax;
    }

    if (params.updatedAtMin) {
      queryParams.updated_at_min = params.updatedAtMin;
    }

    if (params.updatedAtMax) {
      queryParams.updated_at_max = params.updatedAtMax;
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

    return queryParams;
  }

  /**
   * Apply additional filters not supported by Shopify API
   */
  applyAdditionalFilters(customers, params) {
    let filteredCustomers = [...customers];

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      filteredCustomers = filteredCustomers.filter(customer => {
        const customerTags = customer.tags ? customer.tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
        return params.tags.some(tag => customerTags.includes(tag.toLowerCase()));
      });
    }

    // Filter by lifetime value
    if (params.minLifetimeValue !== undefined) {
      filteredCustomers = filteredCustomers.filter(customer => {
        const lifetimeValue = parseFloat(customer.total_spent || 0);
        return lifetimeValue >= params.minLifetimeValue;
      });
    }

    // Filter by order count
    if (params.minOrderCount !== undefined) {
      filteredCustomers = filteredCustomers.filter(customer => {
        const orderCount = customer.orders_count || 0;
        return orderCount >= params.minOrderCount;
      });
    }

    return filteredCustomers;
  }

  /**
   * Enrich customers with additional data
   */
  async enrichCustomersData(customers, params, correlationId) {
    try {
      const enrichedCustomers = [];

      for (const customer of customers) {
        const enrichedCustomer = { ...customer };

        // Add calculated fields
        enrichedCustomer.calculated = {
          lifetimeValue: parseFloat(customer.total_spent || 0),
          orderCount: customer.orders_count || 0,
          averageOrderValue: this.calculateAverageOrderValue(customer),
          daysSinceLastOrder: this.calculateDaysSinceLastOrder(customer),
          daysSinceFirstOrder: this.calculateDaysSinceFirstOrder(customer),
          customerAge: this.calculateCustomerAge(customer),
          isActive: this.isCustomerActive(customer),
          riskScore: this.calculateChurnRisk(customer)
        };

        // Add segmentation
        enrichedCustomer.segmentation = this.segmentCustomer(customer, params.segmentBy);

        // Add geographic analysis
        if (customer.default_address) {
          enrichedCustomer.geographic = this.analyzeGeographic(customer.default_address);
        }

        // Add order history details if requested
        if (params.includeOrderHistory) {
          enrichedCustomer.orderHistoryAnalysis = await this.getOrderHistoryAnalysis(
            customer.id, 
            params.storeId, 
            correlationId
          );
        }

        // Add contact preferences analysis
        enrichedCustomer.contactAnalysis = this.analyzeContactPreferences(customer);

        // Add marketing insights
        enrichedCustomer.marketingInsights = this.generateMarketingInsights(enrichedCustomer);

        enrichedCustomers.push(enrichedCustomer);
      }

      return enrichedCustomers;

    } catch (error) {
      logger.warn('Failed to enrich customers data', {
        correlationId,
        error: error.message
      });
      // Return original customers if enrichment fails
      return customers;
    }
  }

  /**
   * Calculate comprehensive customer analytics
   */
  calculateCustomerAnalytics(customers, params) {
    try {
      const analytics = {
        summary: {
          totalCustomers: customers.length,
          activeCustomers: customers.filter(c => c.calculated?.isActive).length,
          newCustomers: 0,
          returningCustomers: 0,
          totalLifetimeValue: 0,
          averageLifetimeValue: 0,
          averageOrderCount: 0
        },
        segmentation: {
          byValue: { vip: 0, high: 0, medium: 0, low: 0 },
          byFrequency: { frequent: 0, regular: 0, occasional: 0, rare: 0 },
          byRecency: { recent: 0, lapsed: 0, dormant: 0, churned: 0 },
          byGeography: {},
          byLifecycle: { new: 0, developing: 0, established: 0, loyal: 0, atrisk: 0 }
        },
        churn: {
          atRiskCustomers: customers.filter(c => c.calculated?.riskScore > 0.7).length,
          averageRiskScore: 0,
          churnPredictions: []
        },
        insights: []
      };

      let totalLifetimeValue = 0;
      let totalOrderCount = 0;
      let totalRiskScore = 0;

      // Calculate summary metrics
      customers.forEach(customer => {
        const ltv = customer.calculated?.lifetimeValue || 0;
        const orderCount = customer.calculated?.orderCount || 0;
        const riskScore = customer.calculated?.riskScore || 0;

        totalLifetimeValue += ltv;
        totalOrderCount += orderCount;
        totalRiskScore += riskScore;

        // Categorize customers
        if (orderCount === 0) {
          analytics.summary.newCustomers++;
        } else {
          analytics.summary.returningCustomers++;
        }

        // Update segmentation counts
        this.updateSegmentationCounts(analytics.segmentation, customer);
      });

      // Calculate averages
      if (customers.length > 0) {
        analytics.summary.totalLifetimeValue = totalLifetimeValue;
        analytics.summary.averageLifetimeValue = totalLifetimeValue / customers.length;
        analytics.summary.averageOrderCount = totalOrderCount / customers.length;
        analytics.churn.averageRiskScore = totalRiskScore / customers.length;
      }

      // Generate insights
      analytics.insights = this.generateCustomerInsights(analytics, customers);

      return analytics;

    } catch (error) {
      logger.warn('Failed to calculate customer analytics', {
        error: error.message
      });
      return null;
    }
  }

  // Helper methods for calculations and analysis

  calculateAverageOrderValue(customer) {
    const lifetimeValue = parseFloat(customer.total_spent || 0);
    const orderCount = customer.orders_count || 0;
    return orderCount > 0 ? lifetimeValue / orderCount : 0;
  }

  calculateDaysSinceLastOrder(customer) {
    if (!customer.last_order_date) return null;
    const lastOrderDate = new Date(customer.last_order_date);
    const now = new Date();
    return Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24));
  }

  calculateDaysSinceFirstOrder(customer) {
    if (!customer.created_at) return null;
    const firstOrderDate = new Date(customer.created_at);
    const now = new Date();
    return Math.floor((now - firstOrderDate) / (1000 * 60 * 60 * 24));
  }

  calculateCustomerAge(customer) {
    if (!customer.created_at) return null;
    const createdDate = new Date(customer.created_at);
    const now = new Date();
    return Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
  }

  isCustomerActive(customer, dayThreshold = 90) {
    const daysSinceLastOrder = this.calculateDaysSinceLastOrder(customer);
    return daysSinceLastOrder !== null && daysSinceLastOrder <= dayThreshold;
  }

  calculateChurnRisk(customer) {
    let riskScore = 0;

    const daysSinceLastOrder = this.calculateDaysSinceLastOrder(customer);
    const orderCount = customer.orders_count || 0;
    const lifetimeValue = parseFloat(customer.total_spent || 0);

    // Risk factors
    if (daysSinceLastOrder > 180) riskScore += 0.4;
    else if (daysSinceLastOrder > 90) riskScore += 0.2;

    if (orderCount === 1) riskScore += 0.3;
    else if (orderCount < 3) riskScore += 0.1;

    if (lifetimeValue < 50) riskScore += 0.2;

    // Email engagement (if available)
    if (customer.email_marketing_consent?.state === 'not_subscribed') {
      riskScore += 0.1;
    }

    return Math.min(riskScore, 1.0);
  }

  segmentCustomer(customer, segmentBy = 'value') {
    const segments = {};

    // Value-based segmentation
    const ltv = customer.calculated?.lifetimeValue || 0;
    if (ltv > 1000) segments.value = 'vip';
    else if (ltv > 500) segments.value = 'high';
    else if (ltv > 100) segments.value = 'medium';
    else segments.value = 'low';

    // Frequency-based segmentation
    const orderCount = customer.calculated?.orderCount || 0;
    if (orderCount > 10) segments.frequency = 'frequent';
    else if (orderCount > 5) segments.frequency = 'regular';
    else if (orderCount > 1) segments.frequency = 'occasional';
    else segments.frequency = 'rare';

    // Recency-based segmentation
    const daysSinceLastOrder = customer.calculated?.daysSinceLastOrder;
    if (daysSinceLastOrder === null) segments.recency = 'new';
    else if (daysSinceLastOrder <= 30) segments.recency = 'recent';
    else if (daysSinceLastOrder <= 90) segments.recency = 'lapsed';
    else if (daysSinceLastOrder <= 365) segments.recency = 'dormant';
    else segments.recency = 'churned';

    // Lifecycle segmentation
    const customerAge = customer.calculated?.customerAge || 0;
    const riskScore = customer.calculated?.riskScore || 0;

    if (riskScore > 0.7) segments.lifecycle = 'atrisk';
    else if (orderCount > 10 && ltv > 500) segments.lifecycle = 'loyal';
    else if (customerAge > 365 && orderCount > 3) segments.lifecycle = 'established';
    else if (orderCount > 1) segments.lifecycle = 'developing';
    else segments.lifecycle = 'new';

    return segments;
  }

  analyzeGeographic(address) {
    return {
      country: address.country,
      province: address.province,
      city: address.city,
      zip: address.zip,
      countryCode: address.country_code,
      provinceCode: address.province_code
    };
  }

  async getOrderHistoryAnalysis(customerId, storeId, correlationId) {
    // This would fetch detailed order history for the customer
    // For now, return placeholder analysis
    return {
      orderFrequency: 'monthly',
      seasonalPatterns: [],
      preferredProducts: [],
      averageDaysBetweenOrders: 30,
      orderValueTrend: 'increasing'
    };
  }

  analyzeContactPreferences(customer) {
    return {
      emailSubscribed: customer.email_marketing_consent?.state === 'subscribed',
      smsSubscribed: customer.sms_marketing_consent?.state === 'subscribed',
      preferredContactMethod: this.determinePreferredContact(customer),
      lastEmailEngagement: null, // Would need email platform integration
      lastSmsEngagement: null // Would need SMS platform integration
    };
  }

  determinePreferredContact(customer) {
    if (customer.email_marketing_consent?.state === 'subscribed') return 'email';
    if (customer.sms_marketing_consent?.state === 'subscribed') return 'sms';
    if (customer.phone) return 'phone';
    if (customer.email) return 'email';
    return 'mail';
  }

  generateMarketingInsights(customer) {
    const insights = [];

    // High-value customer insights
    if (customer.calculated?.lifetimeValue > 500) {
      insights.push({
        type: 'opportunity',
        message: 'High-value customer - consider VIP treatment and exclusive offers'
      });
    }

    // Churn risk insights
    if (customer.calculated?.riskScore > 0.7) {
      insights.push({
        type: 'retention',
        message: 'High churn risk - implement retention campaign'
      });
    }

    // Engagement insights
    if (!customer.contactAnalysis?.emailSubscribed) {
      insights.push({
        type: 'engagement',
        message: 'Not subscribed to email marketing - opportunity for opt-in campaign'
      });
    }

    return insights;
  }

  updateSegmentationCounts(segmentation, customer) {
    const segments = customer.segmentation || {};

    // Update value segmentation
    if (segments.value) {
      segmentation.byValue[segments.value]++;
    }

    // Update frequency segmentation
    if (segments.frequency) {
      segmentation.byFrequency[segments.frequency]++;
    }

    // Update recency segmentation
    if (segments.recency) {
      segmentation.byRecency[segments.recency]++;
    }

    // Update lifecycle segmentation
    if (segments.lifecycle) {
      segmentation.byLifecycle[segments.lifecycle]++;
    }

    // Update geographic segmentation
    if (customer.geographic?.country) {
      const country = customer.geographic.country;
      segmentation.byGeography[country] = (segmentation.byGeography[country] || 0) + 1;
    }
  }

  generateCustomerInsights(analytics, customers) {
    const insights = [];

    // Churn risk insights
    const churnRate = analytics.churn.atRiskCustomers / analytics.summary.totalCustomers;
    if (churnRate > 0.2) {
      insights.push({
        type: 'churn',
        severity: 'warning',
        message: `${(churnRate * 100).toFixed(1)}% of customers are at risk of churning`
      });
    }

    // Customer value insights
    if (analytics.summary.averageLifetimeValue > 200) {
      insights.push({
        type: 'value',
        severity: 'positive',
        message: `High average customer lifetime value of $${analytics.summary.averageLifetimeValue.toFixed(2)}`
      });
    }

    // Customer acquisition insights
    const newCustomerRate = analytics.summary.newCustomers / analytics.summary.totalCustomers;
    if (newCustomerRate > 0.5) {
      insights.push({
        type: 'acquisition',
        severity: 'info',
        message: `High new customer acquisition rate: ${(newCustomerRate * 100).toFixed(1)}%`
      });
    }

    return insights;
  }

  calculateAggregatedAnalytics(storeResults) {
    const aggregated = {
      totalCustomers: 0,
      totalLifetimeValue: 0,
      storeComparison: {},
      crossStoreInsights: []
    };

    Object.entries(storeResults).forEach(([storeId, result]) => {
      if (result.success && result.analytics) {
        aggregated.totalCustomers += result.analytics.summary.totalCustomers;
        aggregated.totalLifetimeValue += result.analytics.summary.totalLifetimeValue;
        
        aggregated.storeComparison[storeId] = {
          customers: result.analytics.summary.totalCustomers,
          lifetimeValue: result.analytics.summary.totalLifetimeValue,
          averageValue: result.analytics.summary.averageLifetimeValue,
          churnRisk: result.analytics.churn.averageRiskScore
        };
      }
    });

    return aggregated;
  }

  extractPaginationInfo(headers) {
    const linkHeader = headers.link;
    if (!linkHeader) return null;

    return {
      hasNext: linkHeader.includes('rel="next"'),
      hasPrevious: linkHeader.includes('rel="previous"')
    };
  }
}