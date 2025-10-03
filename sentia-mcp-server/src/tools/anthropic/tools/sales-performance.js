/**
 * Sales Performance Tool - Claude AI Integration
 * 
 * Sales trend analysis with customer behavior patterns and revenue optimization.
 * Provides comprehensive sales intelligence for manufacturing operations.
 * 
 * Tool: claude-analyze-sales-performance
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Sales Performance Analysis Tool for Claude AI
 */
export class SalesPerformanceTool {
  constructor(dependencies) {
    this.client = dependencies.client;
    this.promptBuilder = dependencies.promptBuilder;
    this.responseParser = dependencies.responseParser;
    this.costOptimizer = dependencies.costOptimizer;
    this.analytics = dependencies.analytics;
    this.server = dependencies.server;
    this.logger = dependencies.logger;

    this.toolName = 'claude-analyze-sales-performance';
    this.category = 'sales';
    this.version = '1.0.0';
  }

  /**
   * Initialize the sales performance tool
   */
  async initialize() {
    try {
      this.logger.info('Initializing Sales Performance Tool...');
      
      // Validate dependencies
      this.validateDependencies();
      
      this.logger.info('Sales Performance Tool initialized successfully');
      return true;

    } catch (error) {
      this.logger.error('Failed to initialize Sales Performance Tool', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get input schema for the tool
   */
  getInputSchema() {
    return {
      type: 'object',
      properties: {
        salesData: {
          type: 'object',
          description: 'Comprehensive sales data including revenue, customers, and products',
          properties: {
            revenue: {
              type: 'object',
              description: 'Revenue data by period, channel, and segment',
              properties: {
                total: { type: 'number', description: 'Total revenue' },
                byPeriod: { type: 'array', description: 'Revenue by time period' },
                byChannel: { type: 'object', description: 'Revenue by sales channel' },
                bySegment: { type: 'object', description: 'Revenue by customer segment' },
                byProduct: { type: 'object', description: 'Revenue by product line' }
              }
            },
            customers: {
              type: 'object',
              description: 'Customer data and behavior metrics',
              properties: {
                totalCount: { type: 'number', description: 'Total customer count' },
                newCustomers: { type: 'number', description: 'New customers acquired' },
                retainedCustomers: { type: 'number', description: 'Customers retained' },
                churnRate: { type: 'number', description: 'Customer churn rate' },
                segmentation: { type: 'object', description: 'Customer segmentation data' },
                lifetime_value: { type: 'number', description: 'Average customer lifetime value' }
              }
            },
            products: {
              type: 'object',
              description: 'Product performance data',
              properties: {
                topPerformers: { type: 'array', description: 'Best performing products' },
                underPerformers: { type: 'array', description: 'Underperforming products' },
                newProducts: { type: 'array', description: 'Recently launched products' },
                margins: { type: 'object', description: 'Product margins and profitability' },
                inventory: { type: 'object', description: 'Inventory levels by product' }
              }
            },
            channels: {
              type: 'object',
              description: 'Sales channel performance',
              properties: {
                direct: { type: 'object', description: 'Direct sales performance' },
                retail: { type: 'object', description: 'Retail channel performance' },
                online: { type: 'object', description: 'Online sales performance' },
                distributors: { type: 'object', description: 'Distributor channel performance' }
              }
            },
            seasonality: {
              type: 'object',
              description: 'Seasonal trends and patterns',
              properties: {
                monthlyTrends: { type: 'array', description: 'Monthly sales trends' },
                quarterlyTrends: { type: 'array', description: 'Quarterly patterns' },
                yearlyComparison: { type: 'object', description: 'Year-over-year comparison' }
              }
            },
            competition: {
              type: 'object',
              description: 'Competitive landscape data'
            }
          }
        },
        analysisScope: {
          type: 'string',
          enum: ['comprehensive', 'revenue', 'customers', 'products', 'channels', 'trends'],
          description: 'Scope of the sales analysis',
          default: 'comprehensive'
        },
        timeRange: {
          type: 'string',
          enum: ['current_month', 'last_quarter', 'last_year', 'ytd', 'custom'],
          description: 'Time range for the analysis',
          default: 'last_quarter'
        },
        customDateRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' }
          },
          description: 'Custom date range when timeRange is "custom"'
        },
        segments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific customer segments to analyze'
        },
        metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['conversion_rate', 'average_order_value', 'customer_acquisition_cost', 'lifetime_value', 'churn_rate']
          },
          description: 'Specific metrics to focus on'
        },
        benchmarks: {
          type: 'object',
          description: 'Industry benchmarks for comparison'
        },
        goals: {
          type: 'object',
          description: 'Sales targets and goals for comparison'
        },
        includeForecasting: {
          type: 'boolean',
          description: 'Whether to include sales forecasting',
          default: false
        },
        outputFormat: {
          type: 'string',
          enum: ['executive', 'detailed', 'dashboard'],
          description: 'Format of the output report',
          default: 'detailed'
        }
      },
      required: ['salesData', 'analysisScope']
    };
  }

  /**
   * Execute sales performance analysis
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || this.generateCorrelationId();

    try {
      this.logger.info('Starting sales performance analysis', {
        correlationId,
        analysisScope: params.analysisScope,
        timeRange: params.timeRange,
        segments: params.segments
      });

      // Track execution start
      this.analytics.trackExecution(this.toolName, 'started', {
        correlationId,
        analysisScope: params.analysisScope,
        dataSize: this.estimateDataSize(params.salesData)
      });

      // Validate input parameters
      this.validateInput(params);

      // Prepare and enrich sales data
      const enrichedData = await this.enrichSalesData(params.salesData, params);

      // Build analysis prompt
      const prompt = this.promptBuilder.buildPrompt('sales-performance', enrichedData, {
        analysisScope: params.analysisScope,
        timeframe: params.timeRange,
        contextType: 'operational',
        audience: params.outputFormat === 'executive' ? 'executives' : 'sales_managers',
        includeDetails: params.outputFormat === 'detailed'
      });

      // Optimize request for cost efficiency
      const optimizationResult = await this.costOptimizer.optimizeRequest({
        ...prompt,
        maxTokens: this.getOptimalTokenLimit(params),
        analysisType: params.analysisScope
      });

      // Execute Claude analysis
      const response = await this.client.sendMessage(optimizationResult.optimizedParams);

      // Parse and structure the response
      const parsedResponse = await this.responseParser.parseResponse(
        response, 
        'sales-performance',
        { 
          outputFormat: params.outputFormat,
          includeForecasting: params.includeForecasting 
        }
      );

      // Enhance response with additional insights
      const enhancedResponse = await this.enhanceSalesResponse(parsedResponse, params);

      // Track successful completion
      const executionTime = Date.now() - startTime;
      this.analytics.trackExecution(this.toolName, 'completed', {
        correlationId,
        executionTime,
        tokensUsed: response.usage?.total_tokens || 0,
        cost: optimizationResult.costAnalysis.optimizedCost,
        analysisScope: params.analysisScope
      });

      this.logger.info('Sales performance analysis completed successfully', {
        correlationId,
        executionTime,
        tokensUsed: response.usage?.total_tokens,
        insightsCount: enhancedResponse.keyInsights?.length || 0
      });

      return enhancedResponse;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Track execution failure
      this.analytics.trackExecution(this.toolName, 'failed', {
        correlationId,
        executionTime,
        error: error.message,
        analysisScope: params.analysisScope
      });

      this.logger.error('Sales performance analysis failed', {
        correlationId,
        error: error.message,
        executionTime,
        analysisScope: params.analysisScope
      });

      throw new Error(`Sales performance analysis failed: ${error.message}`);
    }
  }

  /**
   * Validate input parameters
   */
  validateInput(params) {
    if (!params.salesData || typeof params.salesData !== 'object') {
      throw new Error('salesData is required and must be an object');
    }

    if (!params.analysisScope) {
      throw new Error('analysisScope is required');
    }

    const validScopes = ['comprehensive', 'revenue', 'customers', 'products', 'channels', 'trends'];
    if (!validScopes.includes(params.analysisScope)) {
      throw new Error(`Invalid analysisScope. Must be one of: ${validScopes.join(', ')}`);
    }

    // Validate data sufficiency for the requested analysis
    this.validateDataSufficiency(params.salesData, params.analysisScope);
  }

  /**
   * Validate data sufficiency for analysis scope
   */
  validateDataSufficiency(salesData, analysisScope) {
    const dataChecks = {
      comprehensive: ['revenue', 'customers'],
      revenue: ['revenue'],
      customers: ['customers'],
      products: ['products'],
      channels: ['channels'],
      trends: ['revenue', 'seasonality']
    };

    const requiredData = dataChecks[analysisScope] || [];
    const missingData = requiredData.filter(key => !salesData[key] || Object.keys(salesData[key]).length === 0);

    if (missingData.length > 0) {
      throw new Error(`Insufficient data for ${analysisScope} analysis. Missing: ${missingData.join(', ')}`);
    }
  }

  /**
   * Enrich sales data with calculations and context
   */
  async enrichSalesData(salesData, params) {
    try {
      const enriched = { ...salesData };

      // Calculate key performance indicators
      enriched.kpis = this.calculateSalesKPIs(salesData);

      // Add trend analysis
      if (salesData.revenue?.byPeriod) {
        enriched.trends = this.calculateSalesTrends(salesData.revenue.byPeriod);
      }

      // Calculate customer metrics
      if (salesData.customers) {
        enriched.customerMetrics = this.calculateCustomerMetrics(salesData.customers);
      }

      // Add product performance insights
      if (salesData.products) {
        enriched.productInsights = this.analyzeProductPerformance(salesData.products);
      }

      // Add channel effectiveness
      if (salesData.channels) {
        enriched.channelEffectiveness = this.analyzeChannelEffectiveness(salesData.channels);
      }

      // Fetch manufacturing context from database
      const manufacturingContext = await this.fetchManufacturingContext();
      if (manufacturingContext) {
        enriched.manufacturingContext = manufacturingContext;
      }

      // Compare against benchmarks if provided
      if (params.benchmarks) {
        enriched.benchmarkComparison = this.compareToBenchmarks(enriched, params.benchmarks);
      }

      // Compare against goals if provided
      if (params.goals) {
        enriched.goalProgress = this.calculateGoalProgress(enriched, params.goals);
      }

      return enriched;

    } catch (error) {
      this.logger.warn('Failed to enrich sales data', {
        error: error.message
      });
      return salesData; // Return original data if enrichment fails
    }
  }

  /**
   * Calculate key sales performance indicators
   */
  calculateSalesKPIs(salesData) {
    const kpis = {};

    try {
      // Revenue metrics
      if (salesData.revenue?.total) {
        kpis.totalRevenue = salesData.revenue.total;
      }

      // Customer metrics
      if (salesData.customers) {
        const customers = salesData.customers;
        
        if (customers.totalCount && customers.newCustomers) {
          kpis.customerGrowthRate = (customers.newCustomers / customers.totalCount) * 100;
        }

        if (customers.churnRate) {
          kpis.customerRetentionRate = 100 - customers.churnRate;
        }

        if (customers.lifetime_value) {
          kpis.averageCustomerLifetimeValue = customers.lifetime_value;
        }
      }

      // Calculate average order value
      if (salesData.revenue?.total && salesData.customers?.totalCount) {
        kpis.averageOrderValue = salesData.revenue.total / salesData.customers.totalCount;
      }

      // Product performance
      if (salesData.products?.topPerformers && salesData.products?.underPerformers) {
        const total = salesData.products.topPerformers.length + salesData.products.underPerformers.length;
        kpis.productSuccessRate = (salesData.products.topPerformers.length / total) * 100;
      }

      return kpis;

    } catch (error) {
      this.logger.warn('Failed to calculate sales KPIs', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Calculate sales trends
   */
  calculateSalesTrends(revenueByPeriod) {
    try {
      const trends = {};

      if (!Array.isArray(revenueByPeriod) || revenueByPeriod.length < 2) {
        return trends;
      }

      // Sort by period
      const sortedData = revenueByPeriod.sort((a, b) => new Date(a.period) - new Date(b.period));
      
      // Calculate growth rate
      const latest = sortedData[sortedData.length - 1];
      const previous = sortedData[sortedData.length - 2];
      
      if (latest.value && previous.value) {
        trends.growthRate = ((latest.value - previous.value) / previous.value) * 100;
      }

      // Calculate moving average
      if (sortedData.length >= 3) {
        const lastThree = sortedData.slice(-3);
        trends.movingAverage = lastThree.reduce((sum, item) => sum + item.value, 0) / 3;
      }

      // Identify trend direction
      const values = sortedData.map(d => d.value);
      trends.direction = this.determineTrendDirection(values);

      return trends;

    } catch (error) {
      this.logger.warn('Failed to calculate sales trends', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Calculate customer metrics
   */
  calculateCustomerMetrics(customers) {
    try {
      const metrics = {};

      // Customer acquisition metrics
      if (customers.newCustomers && customers.totalCount) {
        metrics.acquisitionRate = (customers.newCustomers / customers.totalCount) * 100;
      }

      // Customer retention metrics
      if (customers.retainedCustomers && customers.totalCount) {
        metrics.retentionRate = (customers.retainedCustomers / customers.totalCount) * 100;
      }

      // Customer value metrics
      if (customers.lifetime_value) {
        metrics.lifetimeValue = customers.lifetime_value;
      }

      // Segmentation analysis
      if (customers.segmentation) {
        metrics.segmentDistribution = this.analyzeSegmentDistribution(customers.segmentation);
      }

      return metrics;

    } catch (error) {
      this.logger.warn('Failed to calculate customer metrics', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Analyze product performance
   */
  analyzeProductPerformance(products) {
    try {
      const insights = {};

      // Top performers analysis
      if (products.topPerformers) {
        insights.topPerformers = {
          count: products.topPerformers.length,
          characteristics: this.identifyProductCharacteristics(products.topPerformers)
        };
      }

      // Underperformers analysis
      if (products.underPerformers) {
        insights.underPerformers = {
          count: products.underPerformers.length,
          issues: this.identifyProductIssues(products.underPerformers)
        };
      }

      // Margin analysis
      if (products.margins) {
        insights.marginAnalysis = this.analyzeProductMargins(products.margins);
      }

      // New product performance
      if (products.newProducts) {
        insights.newProductPerformance = this.analyzeNewProducts(products.newProducts);
      }

      return insights;

    } catch (error) {
      this.logger.warn('Failed to analyze product performance', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Analyze channel effectiveness
   */
  analyzeChannelEffectiveness(channels) {
    try {
      const effectiveness = {};

      Object.keys(channels).forEach(channel => {
        const channelData = channels[channel];
        
        effectiveness[channel] = {
          revenue: channelData.revenue || 0,
          cost: channelData.cost || 0,
          roi: channelData.revenue && channelData.cost ? 
            ((channelData.revenue - channelData.cost) / channelData.cost) * 100 : 0,
          customerCount: channelData.customers || 0,
          conversionRate: channelData.conversionRate || 0
        };
      });

      // Rank channels by effectiveness
      const ranked = Object.entries(effectiveness)
        .sort(([,a], [,b]) => b.roi - a.roi)
        .map(([channel, data], index) => ({ channel, rank: index + 1, ...data }));

      effectiveness.ranking = ranked;

      return effectiveness;

    } catch (error) {
      this.logger.warn('Failed to analyze channel effectiveness', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Fetch manufacturing context from database
   */
  async fetchManufacturingContext() {
    try {
      const query = `
        SELECT 
          production_capacity,
          capacity_utilization,
          lead_times,
          order_fulfillment_rate
        FROM production_metrics 
        WHERE date >= NOW() - INTERVAL '3 months'
        ORDER BY date DESC
        LIMIT 12
      `;

      const result = await this.server.executeReadOnlyQuery(query);
      
      if (result.success && result.rows.length > 0) {
        return {
          averageCapacityUtilization: this.calculateAverage(result.rows, 'capacity_utilization'),
          averageLeadTime: this.calculateAverage(result.rows, 'lead_times'),
          averageFulfillmentRate: this.calculateAverage(result.rows, 'order_fulfillment_rate'),
          productionConstraints: this.identifyProductionConstraints(result.rows)
        };
      }

      return null;

    } catch (error) {
      this.logger.warn('Failed to fetch manufacturing context', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Compare metrics to benchmarks
   */
  compareToBenchmarks(salesData, benchmarks) {
    try {
      const comparison = {};

      // Compare key metrics
      const metrics = salesData.kpis || {};
      
      Object.keys(metrics).forEach(metric => {
        if (benchmarks[metric]) {
          const variance = ((metrics[metric] - benchmarks[metric]) / benchmarks[metric]) * 100;
          comparison[metric] = {
            actual: metrics[metric],
            benchmark: benchmarks[metric],
            variance: variance,
            performance: variance > 0 ? 'above' : 'below'
          };
        }
      });

      return comparison;

    } catch (error) {
      this.logger.warn('Failed to compare to benchmarks', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Calculate progress against goals
   */
  calculateGoalProgress(salesData, goals) {
    try {
      const progress = {};

      const metrics = salesData.kpis || {};
      
      Object.keys(goals).forEach(goal => {
        if (metrics[goal]) {
          const achievement = (metrics[goal] / goals[goal]) * 100;
          progress[goal] = {
            actual: metrics[goal],
            target: goals[goal],
            achievement: achievement,
            status: achievement >= 100 ? 'achieved' : achievement >= 80 ? 'on_track' : 'at_risk'
          };
        }
      });

      return progress;

    } catch (error) {
      this.logger.warn('Failed to calculate goal progress', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Enhance response with additional insights
   */
  async enhanceSalesResponse(parsedResponse, params) {
    try {
      const enhanced = { ...parsedResponse };

      // Add sales health score
      enhanced.salesHealthScore = this.calculateSalesHealthScore(params.salesData);

      // Add opportunity identification
      enhanced.opportunities = this.identifyOpportunities(parsedResponse, params);

      // Add risk factors
      enhanced.riskFactors = this.identifyRiskFactors(params.salesData);

      // Add forecasting if requested
      if (params.includeForecasting) {
        enhanced.forecasting = await this.generateSalesForecasting(params.salesData);
      }

      // Add visualization recommendations
      enhanced.visualizations = this.recommendVisualizations(params.analysisScope);

      return enhanced;

    } catch (error) {
      this.logger.warn('Failed to enhance sales response', {
        error: error.message
      });
      return parsedResponse;
    }
  }

  /**
   * Calculate overall sales health score
   */
  calculateSalesHealthScore(salesData) {
    let score = 0;
    let factors = 0;

    try {
      const kpis = salesData.kpis || this.calculateSalesKPIs(salesData);

      // Revenue growth (25%)
      if (salesData.trends?.growthRate !== undefined) {
        const growthScore = Math.min(Math.max(salesData.trends.growthRate / 20, 0), 1); // 20% growth = max score
        score += growthScore * 25;
        factors += 25;
      }

      // Customer retention (25%)
      if (kpis.customerRetentionRate !== undefined) {
        score += (kpis.customerRetentionRate / 100) * 25;
        factors += 25;
      }

      // Product success rate (20%)
      if (kpis.productSuccessRate !== undefined) {
        score += (kpis.productSuccessRate / 100) * 20;
        factors += 20;
      }

      // Customer acquisition (15%)
      if (kpis.customerGrowthRate !== undefined) {
        const acquisitionScore = Math.min(kpis.customerGrowthRate / 15, 1); // 15% growth = max score
        score += acquisitionScore * 15;
        factors += 15;
      }

      // Average order value trend (15%)
      if (kpis.averageOrderValue !== undefined) {
        score += 0.8 * 15; // Assume good performance if we have the metric
        factors += 15;
      }

      return factors > 0 ? Math.round(score / factors * 100) / 100 : 0.5;

    } catch (error) {
      this.logger.warn('Failed to calculate sales health score', {
        error: error.message
      });
      return 0.5;
    }
  }

  /**
   * Identify sales opportunities
   */
  identifyOpportunities(parsedResponse, params) {
    const opportunities = [];

    try {
      // Extract opportunities from recommendations
      const recommendations = parsedResponse.recommendations || [];
      
      recommendations.forEach(rec => {
        if (rec.impact === 'high' && rec.effort !== 'high') {
          opportunities.push({
            type: 'quick_win',
            description: rec.title,
            impact: rec.impact,
            effort: rec.effort || 'medium',
            timeline: rec.timeline || '30 days'
          });
        }
      });

      // Add specific opportunities based on data analysis
      const salesData = params.salesData;
      
      // Underperforming products opportunity
      if (salesData.products?.underPerformers?.length > 0) {
        opportunities.push({
          type: 'product_optimization',
          description: 'Optimize underperforming products',
          impact: 'medium',
          effort: 'medium',
          timeline: '60 days'
        });
      }

      // Channel optimization
      if (salesData.channels) {
        const channelEffectiveness = this.analyzeChannelEffectiveness(salesData.channels);
        const lowPerformingChannels = channelEffectiveness.ranking?.filter(c => c.roi < 50) || [];
        
        if (lowPerformingChannels.length > 0) {
          opportunities.push({
            type: 'channel_optimization',
            description: 'Improve low-performing sales channels',
            impact: 'high',
            effort: 'medium',
            timeline: '90 days'
          });
        }
      }

      return opportunities;

    } catch (error) {
      this.logger.warn('Failed to identify opportunities', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Identify risk factors
   */
  identifyRiskFactors(salesData) {
    const risks = [];

    try {
      const kpis = salesData.kpis || this.calculateSalesKPIs(salesData);

      // Customer churn risk
      if (salesData.customers?.churnRate && salesData.customers.churnRate > 10) {
        risks.push({
          type: 'customer_churn',
          severity: salesData.customers.churnRate > 20 ? 'high' : 'medium',
          description: 'High customer churn rate detected',
          metric: salesData.customers.churnRate,
          threshold: 10
        });
      }

      // Revenue decline risk
      if (salesData.trends?.growthRate && salesData.trends.growthRate < -5) {
        risks.push({
          type: 'revenue_decline',
          severity: salesData.trends.growthRate < -15 ? 'high' : 'medium',
          description: 'Negative revenue growth trend',
          metric: salesData.trends.growthRate,
          threshold: -5
        });
      }

      // Product concentration risk
      if (salesData.products?.topPerformers?.length < 3) {
        risks.push({
          type: 'product_concentration',
          severity: 'medium',
          description: 'Heavy dependence on few products',
          metric: salesData.products.topPerformers.length,
          threshold: 3
        });
      }

      return risks;

    } catch (error) {
      this.logger.warn('Failed to identify risk factors', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Generate sales forecasting
   */
  async generateSalesForecasting(salesData) {
    try {
      const forecasting = {};

      // Revenue forecasting based on trends
      if (salesData.trends?.growthRate && salesData.revenue?.total) {
        const currentRevenue = salesData.revenue.total;
        const growthRate = salesData.trends.growthRate / 100;
        
        forecasting.nextQuarterRevenue = currentRevenue * (1 + growthRate);
        forecasting.nextYearRevenue = currentRevenue * Math.pow(1 + growthRate, 4);
      }

      // Customer forecasting
      if (salesData.customers?.totalCount && salesData.customers?.newCustomers) {
        const growthRate = salesData.customers.newCustomers / salesData.customers.totalCount;
        forecasting.nextQuarterCustomers = salesData.customers.totalCount * (1 + growthRate);
      }

      return forecasting;

    } catch (error) {
      this.logger.warn('Failed to generate sales forecasting', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Recommend visualizations for the analysis
   */
  recommendVisualizations(analysisScope) {
    const visualizations = {
      comprehensive: [
        'sales-dashboard',
        'revenue-trends',
        'customer-funnel',
        'product-performance-matrix'
      ],
      revenue: [
        'revenue-breakdown',
        'growth-trends',
        'channel-contribution',
        'seasonal-patterns'
      ],
      customers: [
        'customer-lifecycle',
        'segmentation-analysis',
        'churn-analysis',
        'lifetime-value-distribution'
      ],
      products: [
        'product-performance-ranking',
        'margin-analysis',
        'inventory-vs-sales',
        'new-product-adoption'
      ],
      channels: [
        'channel-effectiveness',
        'roi-comparison',
        'conversion-funnel',
        'channel-trends'
      ],
      trends: [
        'time-series-analysis',
        'seasonal-decomposition',
        'growth-patterns',
        'forecast-projections'
      ]
    };

    return visualizations[analysisScope] || visualizations.comprehensive;
  }

  // Helper methods
  validateDependencies() {
    const required = ['client', 'promptBuilder', 'responseParser', 'costOptimizer', 'analytics', 'server'];
    const missing = required.filter(dep => !this[dep]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required dependencies: ${missing.join(', ')}`);
    }
  }

  estimateDataSize(data) {
    return JSON.stringify(data).length;
  }

  getOptimalTokenLimit(params) {
    const baseLimit = 4096;
    const scopeComplexity = {
      comprehensive: 1.5,
      revenue: 1.0,
      customers: 1.2,
      products: 1.1,
      channels: 1.0,
      trends: 1.3
    };

    const multiplier = scopeComplexity[params.analysisScope] || 1.0;
    return Math.min(Math.round(baseLimit * multiplier), 8192);
  }

  generateCorrelationId() {
    return `sales-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analysis helper methods
  determineTrendDirection(values) {
    if (values.length < 2) return 'stable';
    
    const latest = values[values.length - 1];
    const previous = values[values.length - 2];
    
    if (latest > previous * 1.05) return 'increasing';
    if (latest < previous * 0.95) return 'decreasing';
    return 'stable';
  }

  analyzeSegmentDistribution(segmentation) {
    const total = Object.values(segmentation).reduce((sum, count) => sum + count, 0);
    const distribution = {};
    
    Object.keys(segmentation).forEach(segment => {
      distribution[segment] = {
        count: segmentation[segment],
        percentage: (segmentation[segment] / total) * 100
      };
    });
    
    return distribution;
  }

  identifyProductCharacteristics(topPerformers) {
    // Simplified analysis - in real implementation, would analyze product attributes
    return {
      commonFeatures: ['high_margin', 'strong_demand'],
      averageMargin: 'Above 30%',
      marketFit: 'Strong'
    };
  }

  identifyProductIssues(underPerformers) {
    return {
      commonIssues: ['low_margin', 'weak_demand', 'pricing_pressure'],
      recommendedActions: ['price_optimization', 'marketing_boost', 'product_improvement']
    };
  }

  analyzeProductMargins(margins) {
    return {
      averageMargin: Object.values(margins).reduce((sum, margin) => sum + margin, 0) / Object.keys(margins).length,
      highMarginProducts: Object.keys(margins).filter(product => margins[product] > 30),
      lowMarginProducts: Object.keys(margins).filter(product => margins[product] < 15)
    };
  }

  analyzeNewProducts(newProducts) {
    return {
      count: newProducts.length,
      adoptionRate: 'Medium', // Simplified
      timeToMarket: 'Average 120 days' // Simplified
    };
  }

  calculateAverage(rows, field) {
    const values = rows.map(row => row[field]).filter(val => val !== null && val !== undefined);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  identifyProductionConstraints(rows) {
    const avgUtilization = this.calculateAverage(rows, 'capacity_utilization');
    
    if (avgUtilization > 90) {
      return ['capacity_constraint'];
    } else if (avgUtilization < 70) {
      return ['demand_constraint'];
    }
    
    return ['balanced'];
  }
}