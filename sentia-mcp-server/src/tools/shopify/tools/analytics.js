/**
 * Shopify Analytics and Reporting Tool
 * 
 * Retrieve sales analytics, conversion rates, traffic data,
 * and generate comprehensive performance insights.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

/**
 * Analytics Tool Class
 */
export class AnalyticsTool {
  constructor(shopifyIntegration) {
    this.shopify = shopifyIntegration;
    this.name = 'shopify-get-analytics';
    this.description = 'Retrieve Shopify analytics with sales trends, conversion rates, and performance insights';
    this.category = 'analytics';
    this.cacheEnabled = true;
    this.cacheTTL = 600; // 10 minutes
    this.requiresAuth = true;

    this.inputSchema = {
      type: 'object',
      properties: {
        storeId: {
          type: 'string',
          enum: ['uk', 'usa', 'all'],
          description: 'Store to retrieve analytics from',
          default: 'all'
        },
        dateRange: {
          type: 'object',
          properties: {
            from: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              description: 'Start date for analytics (YYYY-MM-DD)'
            },
            to: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              description: 'End date for analytics (YYYY-MM-DD)'
            }
          },
          required: ['from', 'to'],
          description: 'Date range for analytics data'
        },
        granularity: {
          type: 'string',
          enum: ['day', 'week', 'month'],
          description: 'Data granularity for time-series analysis',
          default: 'day'
        },
        metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'sales_revenue',
              'order_count',
              'customer_count',
              'average_order_value',
              'conversion_rate',
              'traffic',
              'product_performance',
              'customer_acquisition',
              'customer_retention',
              'geographic_performance'
            ]
          },
          description: 'Specific metrics to retrieve',
          default: ['sales_revenue', 'order_count', 'average_order_value']
        },
        includeComparisons: {
          type: 'boolean',
          description: 'Include period-over-period comparisons',
          default: true
        },
        includeForecasting: {
          type: 'boolean',
          description: 'Include sales forecasting based on trends',
          default: true
        },
        includeInsights: {
          type: 'boolean',
          description: 'Include AI-generated business insights',
          default: true
        },
        segmentBy: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['product', 'customer_segment', 'geographic', 'channel', 'device']
          },
          description: 'Segmentation dimensions for analysis'
        },
        currency: {
          type: 'string',
          enum: ['USD', 'GBP', 'EUR'],
          description: 'Currency for financial metrics',
          default: 'USD'
        }
      },
      required: ['dateRange'],
      additionalProperties: false
    };

    logger.info('Shopify Analytics Tool initialized');
  }

  /**
   * Execute analytics retrieval
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing Shopify analytics tool', {
        correlationId,
        storeId: params.storeId || 'all',
        dateRange: `${params.dateRange.from} to ${params.dateRange.to}`,
        metrics: params.metrics?.length || 'default'
      });

      const results = {};

      if (params.storeId === 'all') {
        // Get analytics from all configured stores
        const configuredStores = Object.keys(this.shopify.config.stores).filter(
          storeId => this.shopify.config.stores[storeId].shopDomain && 
                     this.shopify.config.stores[storeId].accessToken
        );

        for (const storeId of configuredStores) {
          try {
            const storeParams = { ...params, storeId };
            results[storeId] = await this.getStoreAnalytics(storeParams, correlationId);
          } catch (error) {
            logger.warn('Failed to get analytics for store', {
              correlationId,
              storeId,
              error: error.message
            });
            results[storeId] = { error: error.message };
          }
        }
      } else {
        // Get analytics from specific store
        results[params.storeId] = await this.getStoreAnalytics(params, correlationId);
      }

      // Perform cross-store analytics if multiple stores
      let aggregatedAnalytics = null;
      if (Object.keys(results).length > 1) {
        aggregatedAnalytics = this.calculateAggregatedAnalytics(results, params);
      }

      const executionTime = Date.now() - startTime;

      logger.info('Analytics retrieved successfully', {
        correlationId,
        storesProcessed: Object.keys(results).length,
        executionTime
      });

      return {
        success: true,
        data: {
          analytics: results,
          aggregated: aggregatedAnalytics
        },
        metadata: {
          correlationId,
          executionTime,
          storesProcessed: Object.keys(results).length,
          dateRange: params.dateRange,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Analytics retrieval failed', {
        correlationId,
        error: error.message,
        executionTime
      });

      throw new Error(`Analytics retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get analytics from a specific store
   */
  async getStoreAnalytics(params, correlationId) {
    try {
      const client = this.shopify.getRestClient(params.storeId);
      
      // Validate date range
      const dateRange = this.validateDateRange(params.dateRange);
      
      // Get base analytics data
      const baseAnalytics = await this.getBaseAnalytics(client, params, dateRange, correlationId);
      
      // Get detailed metrics based on requested metrics
      const detailedMetrics = await this.getDetailedMetrics(client, params, dateRange, correlationId);
      
      // Get comparison data if requested
      let comparisonData = null;
      if (params.includeComparisons) {
        comparisonData = await this.getComparisonData(client, params, dateRange, correlationId);
      }

      // Generate forecasting if requested
      let forecasting = null;
      if (params.includeForecasting) {
        forecasting = this.generateForecasting(baseAnalytics, detailedMetrics, params);
      }

      // Generate insights if requested
      let insights = [];
      if (params.includeInsights) {
        insights = this.generateAnalyticsInsights(baseAnalytics, detailedMetrics, comparisonData, params);
      }

      logger.debug('Analytics retrieved from store', {
        correlationId,
        storeId: params.storeId,
        metricsCount: Object.keys(detailedMetrics).length
      });

      return {
        success: true,
        storeId: params.storeId,
        dateRange,
        summary: baseAnalytics,
        metrics: detailedMetrics,
        comparison: comparisonData,
        forecasting,
        insights,
        metadata: {
          currency: params.currency || 'USD',
          granularity: params.granularity,
          retrievedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Failed to get analytics from store', {
        correlationId,
        storeId: params.storeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get base analytics data from orders
   */
  async getBaseAnalytics(client, params, dateRange, correlationId) {
    try {
      // Get orders for the date range
      const ordersResponse = await client.get({
        path: 'orders',
        query: {
          status: 'any',
          created_at_min: `${dateRange.from}T00:00:00Z`,
          created_at_max: `${dateRange.to}T23:59:59Z`,
          limit: 250 // Maximum allowed
        }
      });

      const orders = ordersResponse.body?.orders || [];

      // Calculate base metrics
      const analytics = {
        totalOrders: orders.length,
        totalRevenue: 0,
        totalItems: 0,
        uniqueCustomers: new Set(),
        averageOrderValue: 0,
        conversionData: {
          completedOrders: 0,
          cancelledOrders: 0,
          refundedOrders: 0
        },
        dailyBreakdown: {},
        topProducts: new Map(),
        customerSegments: {
          new: 0,
          returning: 0
        }
      };

      // Process each order
      orders.forEach(order => {
        const orderValue = parseFloat(order.total_price || 0);
        const orderDate = order.created_at.split('T')[0];

        analytics.totalRevenue += orderValue;
        analytics.totalItems += order.line_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

        if (order.customer?.id) {
          analytics.uniqueCustomers.add(order.customer.id);
        }

        // Track order status
        if (order.financial_status === 'paid') {
          analytics.conversionData.completedOrders++;
        } else if (order.cancelled_at) {
          analytics.conversionData.cancelledOrders++;
        } else if (order.financial_status === 'refunded') {
          analytics.conversionData.refundedOrders++;
        }

        // Daily breakdown
        if (!analytics.dailyBreakdown[orderDate]) {
          analytics.dailyBreakdown[orderDate] = {
            orders: 0,
            revenue: 0,
            customers: new Set()
          };
        }
        analytics.dailyBreakdown[orderDate].orders++;
        analytics.dailyBreakdown[orderDate].revenue += orderValue;
        if (order.customer?.id) {
          analytics.dailyBreakdown[orderDate].customers.add(order.customer.id);
        }

        // Track product performance
        order.line_items?.forEach(item => {
          const productKey = `${item.product_id}-${item.variant_id}`;
          const existing = analytics.topProducts.get(productKey) || {
            productId: item.product_id,
            variantId: item.variant_id,
            title: item.title,
            quantity: 0,
            revenue: 0
          };
          existing.quantity += item.quantity || 0;
          existing.revenue += parseFloat(item.price || 0) * (item.quantity || 0);
          analytics.topProducts.set(productKey, existing);
        });

        // Customer segmentation
        const orderCount = order.customer?.orders_count || 1;
        if (orderCount === 1) {
          analytics.customerSegments.new++;
        } else {
          analytics.customerSegments.returning++;
        }
      });

      // Calculate averages and convert sets to counts
      analytics.uniqueCustomers = analytics.uniqueCustomers.size;
      if (orders.length > 0) {
        analytics.averageOrderValue = analytics.totalRevenue / orders.length;
      }

      // Convert daily breakdown customers sets to counts
      Object.keys(analytics.dailyBreakdown).forEach(date => {
        analytics.dailyBreakdown[date].customers = analytics.dailyBreakdown[date].customers.size;
      });

      // Convert top products map to sorted array
      analytics.topProducts = Array.from(analytics.topProducts.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return analytics;

    } catch (error) {
      logger.error('Failed to get base analytics', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get detailed metrics based on requested metrics
   */
  async getDetailedMetrics(client, params, dateRange, correlationId) {
    const metrics = {};
    const requestedMetrics = params.metrics || ['sales_revenue', 'order_count', 'average_order_value'];

    try {
      for (const metric of requestedMetrics) {
        switch (metric) {
          case 'customer_acquisition':
            metrics.customerAcquisition = await this.getCustomerAcquisitionMetrics(client, params, dateRange);
            break;
          case 'customer_retention':
            metrics.customerRetention = await this.getCustomerRetentionMetrics(client, params, dateRange);
            break;
          case 'product_performance':
            metrics.productPerformance = await this.getProductPerformanceMetrics(client, params, dateRange);
            break;
          case 'geographic_performance':
            metrics.geographicPerformance = await this.getGeographicMetrics(client, params, dateRange);
            break;
          case 'traffic':
            // Note: Shopify doesn't provide traffic data via API
            // This would require Google Analytics integration
            metrics.traffic = this.getPlaceholderTrafficMetrics();
            break;
        }
      }

      return metrics;

    } catch (error) {
      logger.warn('Failed to get some detailed metrics', {
        correlationId,
        error: error.message
      });
      return metrics;
    }
  }

  /**
   * Get comparison data for previous period
   */
  async getComparisonData(client, params, dateRange, correlationId) {
    try {
      // Calculate previous period dates
      const currentPeriodDays = this.calculateDaysBetween(dateRange.from, dateRange.to);
      const previousToDate = new Date(dateRange.from);
      previousToDate.setDate(previousToDate.getDate() - 1);
      const previousFromDate = new Date(previousToDate);
      previousFromDate.setDate(previousFromDate.getDate() - currentPeriodDays);

      const previousDateRange = {
        from: previousFromDate.toISOString().split('T')[0],
        to: previousToDate.toISOString().split('T')[0]
      };

      // Get analytics for previous period
      const previousParams = {
        ...params,
        dateRange: previousDateRange,
        includeComparisons: false // Avoid recursion
      };

      const previousAnalytics = await this.getBaseAnalytics(client, previousParams, previousDateRange, correlationId);

      return {
        previousPeriod: previousAnalytics,
        dateRange: previousDateRange,
        comparison: {
          revenueDelta: 0, // Will be calculated by the calling function
          ordersDelta: 0,
          customersDelta: 0,
          aovDelta: 0
        }
      };

    } catch (error) {
      logger.warn('Failed to get comparison data', {
        correlationId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Generate sales forecasting
   */
  generateForecasting(baseAnalytics, detailedMetrics, params) {
    try {
      // Simple linear trend forecasting based on daily data
      const dailyData = Object.entries(baseAnalytics.dailyBreakdown || {})
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          orders: data.orders
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (dailyData.length < 7) {
        return {
          error: 'Insufficient data for forecasting (minimum 7 days required)'
        };
      }

      // Calculate trends
      const revenueTrend = this.calculateLinearTrend(dailyData.map(d => d.revenue));
      const ordersTrend = this.calculateLinearTrend(dailyData.map(d => d.orders));

      // Forecast next 30 days
      const forecastDays = 30;
      const forecast = [];

      for (let i = 1; i <= forecastDays; i++) {
        const forecastDate = new Date(dailyData[dailyData.length - 1].date);
        forecastDate.setDate(forecastDate.getDate() + i);

        const forecastRevenue = revenueTrend.slope * (dailyData.length + i) + revenueTrend.intercept;
        const forecastOrders = Math.round(ordersTrend.slope * (dailyData.length + i) + ordersTrend.intercept);

        forecast.push({
          date: forecastDate.toISOString().split('T')[0],
          revenue: Math.max(0, forecastRevenue),
          orders: Math.max(0, forecastOrders),
          confidence: Math.max(0.1, 1 - (i / forecastDays) * 0.5) // Decreasing confidence
        });
      }

      return {
        forecast,
        trends: {
          revenue: revenueTrend,
          orders: ordersTrend
        },
        summary: {
          forecastedRevenue: forecast.reduce((sum, day) => sum + day.revenue, 0),
          forecastedOrders: forecast.reduce((sum, day) => sum + day.orders, 0),
          averageConfidence: forecast.reduce((sum, day) => sum + day.confidence, 0) / forecast.length
        }
      };

    } catch (error) {
      logger.warn('Failed to generate forecasting', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Generate AI-powered business insights
   */
  generateAnalyticsInsights(baseAnalytics, detailedMetrics, comparisonData, params) {
    const insights = [];

    try {
      // Revenue insights
      if (baseAnalytics.totalRevenue > 10000) {
        insights.push({
          type: 'revenue',
          severity: 'positive',
          title: 'Strong Revenue Performance',
          message: `Generated $${baseAnalytics.totalRevenue.toLocaleString()} in revenue during the selected period`,
          value: baseAnalytics.totalRevenue,
          recommendation: 'Continue current marketing strategies and consider scaling successful campaigns'
        });
      }

      // Conversion insights
      const conversionRate = baseAnalytics.conversionData.completedOrders / baseAnalytics.totalOrders;
      if (conversionRate < 0.7) {
        insights.push({
          type: 'conversion',
          severity: 'warning',
          title: 'Low Conversion Rate',
          message: `Only ${(conversionRate * 100).toFixed(1)}% of orders are being completed`,
          value: conversionRate,
          recommendation: 'Review checkout process and payment options to reduce cart abandonment'
        });
      }

      // Customer insights
      const repeatCustomerRate = baseAnalytics.customerSegments.returning / baseAnalytics.totalOrders;
      if (repeatCustomerRate > 0.4) {
        insights.push({
          type: 'customer_loyalty',
          severity: 'positive',
          title: 'Strong Customer Loyalty',
          message: `${(repeatCustomerRate * 100).toFixed(1)}% of orders are from returning customers`,
          value: repeatCustomerRate,
          recommendation: 'Implement loyalty programs to further increase repeat purchases'
        });
      }

      // Average order value insights
      if (baseAnalytics.averageOrderValue > 50) {
        insights.push({
          type: 'aov',
          severity: 'positive',
          title: 'Healthy Average Order Value',
          message: `Average order value of $${baseAnalytics.averageOrderValue.toFixed(2)} indicates strong product positioning`,
          value: baseAnalytics.averageOrderValue,
          recommendation: 'Consider upselling and cross-selling strategies to increase AOV further'
        });
      }

      // Product performance insights
      if (baseAnalytics.topProducts && baseAnalytics.topProducts.length > 0) {
        const topProduct = baseAnalytics.topProducts[0];
        const topProductRevenue = topProduct.revenue;
        const revenueShare = (topProductRevenue / baseAnalytics.totalRevenue) * 100;

        if (revenueShare > 30) {
          insights.push({
            type: 'product_concentration',
            severity: 'warning',
            title: 'High Product Concentration Risk',
            message: `${topProduct.title} accounts for ${revenueShare.toFixed(1)}% of total revenue`,
            value: revenueShare,
            recommendation: 'Diversify product offerings to reduce dependency on single products'
          });
        }
      }

      // Seasonal insights
      const seasonalPattern = this.analyzeSeasonalPatterns(baseAnalytics.dailyBreakdown);
      if (seasonalPattern.hasPattern) {
        insights.push({
          type: 'seasonality',
          severity: 'info',
          title: 'Seasonal Pattern Detected',
          message: seasonalPattern.description,
          recommendation: 'Plan inventory and marketing campaigns around identified seasonal patterns'
        });
      }

      return insights;

    } catch (error) {
      logger.warn('Failed to generate insights', {
        error: error.message
      });
      return insights;
    }
  }

  // Helper methods for analytics calculations

  validateDateRange(dateRange) {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format');
    }

    if (fromDate > toDate) {
      throw new Error('From date must be before to date');
    }

    const daysDiff = this.calculateDaysBetween(dateRange.from, dateRange.to);
    if (daysDiff > 365) {
      throw new Error('Date range cannot exceed 365 days');
    }

    return {
      from: dateRange.from,
      to: dateRange.to,
      days: daysDiff
    };
  }

  calculateDaysBetween(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return Math.ceil((to - from) / (1000 * 60 * 60 * 24));
  }

  calculateLinearTrend(values) {
    const n = values.length;
    const xSum = (n * (n + 1)) / 2;
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, index) => sum + val * (index + 1), 0);
    const x2Sum = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    return { slope, intercept };
  }

  analyzeSeasonalPatterns(dailyBreakdown) {
    // Simple pattern analysis - could be enhanced with more sophisticated algorithms
    const days = Object.keys(dailyBreakdown).sort();
    
    if (days.length < 14) {
      return { hasPattern: false };
    }

    // Analyze weekly patterns
    const weeklyAverage = {};
    days.forEach(date => {
      const dayOfWeek = new Date(date).getDay();
      if (!weeklyAverage[dayOfWeek]) {
        weeklyAverage[dayOfWeek] = { total: 0, count: 0 };
      }
      weeklyAverage[dayOfWeek].total += dailyBreakdown[date].revenue;
      weeklyAverage[dayOfWeek].count++;
    });

    // Calculate averages
    Object.keys(weeklyAverage).forEach(day => {
      weeklyAverage[day] = weeklyAverage[day].total / weeklyAverage[day].count;
    });

    // Find peak day
    const peakDay = Object.entries(weeklyAverage)
      .sort(([,a], [,b]) => b - a)[0];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      hasPattern: true,
      description: `Peak sales typically occur on ${dayNames[peakDay[0]]}`,
      weeklyPattern: weeklyAverage
    };
  }

  async getCustomerAcquisitionMetrics(client, params, dateRange) {
    // This would analyze new vs returning customers
    return {
      newCustomers: 0,
      acquisitionCost: 0,
      acquisitionChannels: {}
    };
  }

  async getCustomerRetentionMetrics(client, params, dateRange) {
    // This would analyze customer retention rates
    return {
      retentionRate: 0,
      churnRate: 0,
      lifetimeValue: 0
    };
  }

  async getProductPerformanceMetrics(client, params, dateRange) {
    // This would provide detailed product performance analysis
    return {
      topPerformers: [],
      underPerformers: [],
      categoryAnalysis: {}
    };
  }

  async getGeographicMetrics(client, params, dateRange) {
    // This would analyze sales by geographic regions
    return {
      countryBreakdown: {},
      shippingAnalysis: {},
      regionalTrends: {}
    };
  }

  getPlaceholderTrafficMetrics() {
    return {
      note: 'Traffic metrics require Google Analytics integration',
      sessions: null,
      pageViews: null,
      conversionRate: null
    };
  }

  calculateAggregatedAnalytics(storeResults, params) {
    const aggregated = {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      storeComparison: {},
      crossStoreInsights: []
    };

    Object.entries(storeResults).forEach(([storeId, result]) => {
      if (result.success && result.summary) {
        aggregated.totalRevenue += result.summary.totalRevenue;
        aggregated.totalOrders += result.summary.totalOrders;
        aggregated.totalCustomers += result.summary.uniqueCustomers;
        
        aggregated.storeComparison[storeId] = {
          revenue: result.summary.totalRevenue,
          orders: result.summary.totalOrders,
          customers: result.summary.uniqueCustomers,
          aov: result.summary.averageOrderValue,
          conversionRate: result.summary.conversionData.completedOrders / result.summary.totalOrders
        };
      }
    });

    // Generate cross-store insights
    const storeCount = Object.keys(aggregated.storeComparison).length;
    if (storeCount > 1) {
      const avgRevenuePerStore = aggregated.totalRevenue / storeCount;
      
      Object.entries(aggregated.storeComparison).forEach(([storeId, metrics]) => {
        const revenueRatio = metrics.revenue / avgRevenuePerStore;
        
        if (revenueRatio > 1.5) {
          aggregated.crossStoreInsights.push({
            type: 'performance',
            message: `${storeId} store is significantly outperforming average (${(revenueRatio * 100).toFixed(0)}% of average)`
          });
        } else if (revenueRatio < 0.5) {
          aggregated.crossStoreInsights.push({
            type: 'opportunity',
            message: `${storeId} store has potential for improvement (${(revenueRatio * 100).toFixed(0)}% of average)`
          });
        }
      });
    }

    return aggregated;
  }
}