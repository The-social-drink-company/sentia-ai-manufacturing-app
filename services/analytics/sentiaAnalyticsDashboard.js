import { EventEmitter } from 'events';
import logger, { logInfo, logError, logWarn } from '../logger.js';
import SentiaIntegrationLayer from '../mcp/sentiaIntegrationLayer.js';
import AIEnsembleForecastingService from '../../src/services/aiEnsembleForecasting.js';
import SentiaSupplyChainIntelligence from '../ai/supplyChainIntelligence.js';
import SentiaComputerVisionQuality from '../ai/computerVisionQuality.js';

/**
 * Sentia Advanced Analytics Dashboard
 * AI-powered business intelligence for functional botanical beverages
 * Integrates Unleashed production data and Xero financial data for comprehensive insights
 */
class SentiaAnalyticsDashboard extends EventEmitter {
  constructor() {
    super();
    
    // Core integrations
    this.integrationLayer = new SentiaIntegrationLayer();
    this.forecastingService = new AIEnsembleForecastingService();
    this.supplyChain = new SentiaSupplyChainIntelligence();
    this.qualitySystem = new SentiaComputerVisionQuality();
    
    // Analytics engines
    this.analyticsEngines = {
      product: this.initializeProductAnalytics(),
      financial: this.initializeFinancialAnalytics(),
      operational: this.initializeOperationalAnalytics(),
      botanical: this.initializeBotanicalAnalytics(),
      customer: this.initializeCustomerAnalytics(),
      market: this.initializeMarketAnalytics()
    };

    // Dashboard configurations
    this.dashboardConfigs = {
      executive: this.createExecutiveDashboard(),
      operations: this.createOperationsDashboard(),
      financial: this.createFinancialDashboard(),
      quality: this.createQualityDashboard(),
      supply_chain: this.createSupplyChainDashboard(),
      botanical: this.createBotanicalDashboard(),
      sales: this.createSalesDashboard()
    };

    // Real-time metrics
    this.realTimeMetrics = {
      production: new Map(),
      sales: new Map(),
      quality: new Map(),
      financial: new Map(),
      botanical: new Map()
    };

    // Analytics cache
    this.analyticsCache = {
      insights: new Map(),
      reports: new Map(),
      forecasts: new Map(),
      recommendations: new Map()
    };

    // Performance tracking
    this.performance = {
      kpis: new Map(),
      trends: new Map(),
      alerts: new Map(),
      achievements: new Map()
    };

    this.initializeAnalytics();
    logInfo('Sentia Advanced Analytics Dashboard initialized');
  }

  /**
   * Initialize analytics system
   */
  async initializeAnalytics() {
    try {
      // Setup integration layer
      await this.integrationLayer.initializeIntegration();
      
      // Initialize KPI tracking
      this.initializeKPITracking();
      
      // Setup real-time analytics
      this.startRealTimeAnalytics();
      
      // Initialize dashboard data
      await this.loadInitialDashboardData();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      logInfo('Sentia Analytics Dashboard initialization complete');
    } catch (error) {
      logError('Analytics dashboard initialization failed:', error);
    }
  }

  /**
   * Initialize KPI tracking for functional beverages
   */
  initializeKPITracking() {
    const kpis = {
      // Production KPIs
      'overall_equipment_effectiveness': { target: 85, current: 0, trend: 'stable' },
      'production_throughput': { target: 5000, unit: 'bottles/day', current: 0, trend: 'stable' },
      'botanical_yield_rate': { target: 95, unit: '%', current: 0, trend: 'stable' },
      'quality_pass_rate': { target: 98, unit: '%', current: 0, trend: 'stable' },
      'gaba_potency_consistency': { target: 98, unit: '%', current: 0, trend: 'stable' },
      
      // Financial KPIs
      'gross_margin': { target: 65, unit: '%', current: 0, trend: 'stable' },
      'revenue_per_bottle': { target: 8.50, unit: 'GBP', current: 0, trend: 'stable' },
      'botanical_cost_ratio': { target: 25, unit: '%', current: 0, trend: 'stable' },
      'cash_conversion_cycle': { target: 45, unit: 'days', current: 0, trend: 'stable' },
      
      // Customer & Market KPIs
      'customer_acquisition_cost': { target: 15, unit: 'GBP', current: 0, trend: 'stable' },
      'customer_lifetime_value': { target: 150, unit: 'GBP', current: 0, trend: 'stable' },
      'repeat_purchase_rate': { target: 35, unit: '%', current: 0, trend: 'stable' },
      'market_share_functional_drinks': { target: 5, unit: '%', current: 0, trend: 'stable' },
      
      // Supply Chain KPIs
      'supplier_on_time_delivery': { target: 95, unit: '%', current: 0, trend: 'stable' },
      'botanical_quality_score': { target: 95, unit: '%', current: 0, trend: 'stable' },
      'inventory_turnover': { target: 8, unit: 'times/year', current: 0, trend: 'stable' },
      'supply_chain_risk_score': { target: 20, unit: 'risk points', current: 0, trend: 'stable' },
      
      // Sustainability KPIs
      'sustainable_sourcing_rate': { target: 90, unit: '%', current: 0, trend: 'stable' },
      'carbon_footprint_per_bottle': { target: 0.5, unit: 'kg CO2e', current: 0, trend: 'stable' },
      'packaging_recyclability': { target: 100, unit: '%', current: 0, trend: 'stable' },
      'waste_reduction_rate': { target: 15, unit: '%', current: 0, trend: 'stable' }
    };

    Object.entries(kpis).forEach(_([kpi, _config]) => {
      this.performance.kpis.set(kpi, {
        ...config,
        history: [],
        lastUpdated: new Date(),
        alerts: []
      });
    });

    logInfo(`Initialized ${Object.keys(kpis).length} KPIs for functional beverage analytics`);
  }

  /**
   * Create Executive Dashboard configuration
   */
  createExecutiveDashboard() {
    return {
      id: 'executive',
      name: 'Executive Overview',
      description: 'High-level business performance for Sentia functional beverages',
      widgets: [
        {
          type: 'kpi-grid',
          title: 'Key Performance Indicators',
          size: { w: 12, h: 4 },
          config: {
            kpis: [
              'revenue_per_bottle',
              'gross_margin',
              'customer_lifetime_value',
              'market_share_functional_drinks',
              'overall_equipment_effectiveness',
              'botanical_quality_score'
            ],
            showTrends: true,
            showTargets: true
          }
        },
        {
          type: 'gaba-product-performance',
          title: 'GABA Product Line Performance',
          size: { w: 8, h: 6 },
          config: {
            products: ['GABA_RED', 'GABA_GOLD', 'GABA_BLACK'],
            metrics: ['sales_volume', 'revenue', 'margin', 'market_feedback'],
            timeRange: '90d'
          }
        },
        {
          type: 'financial-health-score',
          title: 'Financial Health Score',
          size: { w: 4, h: 6 },
          config: {
            components: ['profitability', 'cash_flow', 'growth', 'efficiency'],
            visualization: 'gauge'
          }
        },
        {
          type: 'market-expansion-tracker',
          title: 'Market Expansion',
          size: { w: 6, h: 5 },
          config: {
            regions: ['UK', 'EU', 'USA'],
            channels: ['Amazon', 'Shopify', 'Retail'],
            showOpportunities: true
          }
        },
        {
          type: 'strategic-alerts',
          title: 'Strategic Alerts',
          size: { w: 6, h: 5 },
          config: {
            alertTypes: ['financial', 'operational', 'market', 'regulatory'],
            priorityFilter: 'high',
            maxAlerts: 8
          }
        }
      ],
      refreshInterval: 60000, // 1 minute
      accessLevel: 'executive'
    };
  }

  /**
   * Create Botanical Analytics Dashboard
   */
  createBotanicalDashboard() {
    return {
      id: 'botanical',
      name: 'Botanical Intelligence',
      description: 'Comprehensive analytics for botanical ingredients and GABA effectiveness',
      widgets: [
        {
          type: 'botanical-potency-tracker',
          title: 'Botanical Potency Analytics',
          size: { w: 8, h: 6 },
          config: {
            botanicals: [
              'ashwagandha', 'passionflower', 'magnolia_bark',
              'lemon_balm', 'schisandra', 'hops',
              'ginseng', 'ginkgo', 'linden'
            ],
            metrics: ['potency', 'consistency', 'quality_score', 'cost_effectiveness'],
            visualization: 'heatmap'
          }
        },
        {
          type: 'gaba-efficacy-analysis',
          title: 'GABA Efficacy Analysis',
          size: { w: 4, h: 6 },
          config: {
            products: ['GABA_RED', 'GABA_GOLD', 'GABA_BLACK'],
            efficacyMetrics: ['gaba_concentration', 'bio_availability', 'synergistic_effects'],
            targetConcentration: 750 // mg per bottle
          }
        },
        {
          type: 'supplier-botanical-quality',
          title: 'Supplier Quality Matrix',
          size: { w: 6, h: 8 },
          config: {
            suppliers: 'all_botanical_suppliers',
            qualityMetrics: ['consistency', 'potency', 'purity', 'certification'],
            visualization: 'matrix',
            showRiskAssessment: true
          }
        },
        {
          type: 'seasonal-botanical-trends',
          title: 'Seasonal Quality Trends',
          size: { w: 6, h: 8 },
          config: {
            timeRange: '2y',
            showSeasonality: true,
            predictiveAnalysis: true,
            qualityFactors: ['weather', 'harvest_timing', 'storage_conditions']
          }
        },
        {
          type: 'botanical-cost-optimization',
          title: 'Cost Optimization Insights',
          size: { w: 6, h: 4 },
          config: {
            optimizationFactors: ['bulk_pricing', 'quality_tiers', 'supplier_diversification'],
            showRecommendations: true,
            costSavingsTarget: 10 // %
          }
        },
        {
          type: 'regulatory-compliance-tracker',
          title: 'Regulatory Compliance',
          size: { w: 6, h: 4 },
          config: {
            regulations: ['EU_Novel_Foods', 'FDA_GRAS', 'UK_FSA', 'organic_certifications'],
            complianceStatus: 'real_time',
            showUpcoming: true
          }
        }
      ],
      refreshInterval: 30000,
      accessLevel: 'operations'
    };
  }

  /**
   * Create Financial Dashboard with Xero integration
   */
  createFinancialDashboard() {
    return {
      id: 'financial',
      name: 'Financial Performance',
      description: 'Comprehensive financial analytics powered by Xero integration',
      widgets: [
        {
          type: 'profit-loss-analysis',
          title: 'Profit & Loss Analysis',
          size: { w: 8, h: 6 },
          config: {
            dataSource: 'xero',
            breakdownBy: ['product_line', 'sales_channel', 'region'],
            timeComparison: ['month_over_month', 'year_over_year'],
            showForecasting: true
          }
        },
        {
          type: 'cash-flow-forecast',
          title: 'Cash Flow Forecast',
          size: { w: 4, h: 6 },
          config: {
            forecastPeriod: '12_months',
            includeSeasonality: true,
            scenario: 'base',
            alertThresholds: { critical: 30000, warning: 50000 }
          }
        },
        {
          type: 'product-profitability',
          title: 'Product Profitability Analysis',
          size: { w: 6, h: 8 },
          config: {
            products: ['GABA_RED', 'GABA_GOLD', 'GABA_BLACK'],
            costBreakdown: ['botanical_costs', 'manufacturing', 'packaging', 'distribution'],
            marginAnalysis: true,
            benchmarking: 'functional_beverages'
          }
        },
        {
          type: 'working-capital-efficiency',
          title: 'Working Capital Efficiency',
          size: { w: 6, h: 8 },
          config: {
            components: ['accounts_receivable', 'inventory', 'accounts_payable'],
            cycleTimes: true,
            optimization: true,
            industry_benchmark: 'beverages'
          }
        },
        {
          type: 'financial-ratios',
          title: 'Key Financial Ratios',
          size: { w: 4, h: 4 },
          config: {
            ratios: ['current_ratio', 'quick_ratio', 'debt_to_equity', 'return_on_assets'],
            industryComparison: true,
            trendAnalysis: '24_months'
          }
        },
        {
          type: 'cost-variance-analysis',
          title: 'Cost Variance Analysis',
          size: { w: 8, h: 4 },
          config: {
            costCategories: ['botanical_ingredients', 'labor', 'overhead', 'distribution'],
            budgetComparison: true,
            alertOnVariance: 5 // %
          }
        }
      ],
      refreshInterval: 300000, // 5 minutes
      accessLevel: 'financial'
    };
  }

  /**
   * Start real-time analytics processing
   */
  startRealTimeAnalytics() {
    const analyticsInterval = 15000; // 15 seconds

    setInterval(async () => {
      try {
        // Update real-time metrics
        await this.updateRealTimeMetrics();
        
        // Refresh KPIs
        await this.refreshKPIs();
        
        // Generate insights
        await this.generateInsights();
        
        // Check for alerts
        this.checkAlerts();
        
        // Update forecasts
        await this.updateForecasts();
        
        this.emit('analyticsUpdated', {
          timestamp: new Date(),
          metricsUpdated: this.realTimeMetrics.size,
          kpisRefreshed: this.performance.kpis.size,
          alertsActive: this.performance.alerts.size
        });
        
      } catch (error) {
        logError('Real-time analytics update failed:', error);
      }
    }, analyticsInterval);

    logInfo('Real-time analytics processing started');
  }

  /**
   * Update real-time metrics from integrated systems
   */
  async updateRealTimeMetrics() {
    try {
      // Get latest data from integration layer
      const sentiaData = await this.integrationLayer.querySentiaData({
        includeProduction: true,
        includeFinancials: true,
        includeAnalytics: true,
        timeRange: { hours: 24 }
      });

      if (sentiaData && sentiaData.data) {
        // Update production metrics
        this.updateProductionMetrics(sentiaData.data.production);
        
        // Update financial metrics
        this.updateFinancialMetrics(sentiaData.data.financial);
        
        // Update quality metrics
        this.updateQualityMetrics();
        
        // Update botanical metrics
        await this.updateBotanicalMetrics();
      }

    } catch (error) {
      logError('Failed to update real-time metrics:', error);
    }
  }

  /**
   * Generate comprehensive business insights
   */
  async generateInsights() {
    const insights = {
      timestamp: new Date(),
      productPerformance: await this.analyzeProductPerformance(),
      operationalEfficiency: await this.analyzeOperationalEfficiency(),
      financialHealth: await this.analyzeFinancialHealth(),
      marketOpportunities: await this.identifyMarketOpportunities(),
      botanicalOptimization: await this.analyzeBotanicalOptimization(),
      riskFactors: await this.assessRiskFactors(),
      strategicRecommendations: []
    };

    // Generate AI-powered recommendations
    insights.strategicRecommendations = await this.generateStrategicRecommendations(insights);
    
    // Cache insights
    this.analyticsCache.insights.set('latest', insights);
    
    return insights;
  }

  /**
   * Analyze GABA product performance
   */
  async analyzeProductPerformance() {
    const analysis = {
      gabaRed: await this.analyzeGABAProduct('RED'),
      gabaGold: await this.analyzeGABAProduct('GOLD'),  
      gabaBlack: await this.analyzeGABAProduct('BLACK'),
      overallTrends: {},
      marketPosition: {},
      competitiveAnalysis: {}
    };

    // Cross-product analysis
    analysis.overallTrends = this.analyzeCrossProductTrends(analysis);
    
    // Market positioning
    analysis.marketPosition = this.analyzeMarketPosition(analysis);
    
    return analysis;
  }

  /**
   * Analyze individual GABA product
   */
  async analyzeGABAProduct(variant) {
    const productKey = `GABA_${variant}`;
    
    // Get production data
    const productionData = this.realTimeMetrics.production.get(productKey) || {};
    
    // Get sales data
    const salesData = this.realTimeMetrics.sales.get(productKey) || {};
    
    // Get quality data
    const qualityData = this.realTimeMetrics.quality.get(productKey) || {};
    
    // Analyze botanical effectiveness
    const botanicalEffectiveness = await this.analyzeBotanicalEffectiveness(variant);
    
    return {
      variant,
      production: {
        volume: productionData.totalVolume || 0,
        efficiency: productionData.efficiency || 0,
        qualityRate: productionData.qualityPassRate || 0,
        costPerUnit: productionData.costPerUnit || 0
      },
      sales: {
        revenue: salesData.totalRevenue || 0,
        volume: salesData.totalVolume || 0,
        growthRate: salesData.growthRate || 0,
        customerSatisfaction: salesData.satisfaction || 0
      },
      quality: {
        gabaConsistency: qualityData.gabaConsistency || 0,
        botanicalQuality: qualityData.botanicalQuality || 0,
        overallScore: qualityData.overallScore || 0
      },
      botanicalEffectiveness,
      profitability: this.calculateProductProfitability(productKey),
      marketShare: this.calculateMarketShare(productKey),
      customerFeedback: await this.analyzeCustomerFeedback(productKey),
      recommendations: this.generateProductRecommendations(productKey)
    };
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(dashboardId) {
    const config = this.dashboardConfigs[dashboardId];
    
    if (!config) {
      throw new Error(`Dashboard configuration not found: ${dashboardId}`);
    }

    const dashboardData = {
      id: dashboardId,
      name: config.name,
      description: config.description,
      lastUpdated: new Date(),
      widgets: [],
      globalMetrics: this.getGlobalMetrics(),
      alerts: this.getActiveAlerts(),
      recommendations: this.getRecommendations()
    };

    // Populate widget data
    for (const widgetConfig of config.widgets) {
      const widgetData = await this.getWidgetData(widgetConfig);
      dashboardData.widgets.push({
        ...widgetConfig,
        data: widgetData,
        lastUpdated: new Date()
      });
    }

    return dashboardData;
  }

  /**
   * Get widget data based on type
   */
  async getWidgetData(widgetConfig) {
    switch (widgetConfig.type) {
      case 'kpi-grid':
        return this.getKPIGridData(widgetConfig.config);
      
      case 'gaba-product-performance':
        return this.getGABAProductPerformanceData(widgetConfig.config);
      
      case 'botanical-potency-tracker':
        return this.getBotanicalPotencyData(widgetConfig.config);
      
      case 'financial-health-score':
        return this.getFinancialHealthData(widgetConfig.config);
      
      case 'profit-loss-analysis':
        return this.getProfitLossData(widgetConfig.config);
      
      case 'supplier-botanical-quality':
        return this.getSupplierQualityData(widgetConfig.config);
      
      default:
        return { error: `Unknown widget type: ${widgetConfig.type}` };
    }
  }

  /**
   * Get KPI grid data
   */
  getKPIGridData(config) {
    const kpiData = [];
    
    for (const kpiId of config.kpis) {
      const kpi = this.performance.kpis.get(kpiId);
      if (kpi) {
        kpiData.push({
          id: kpiId,
          name: kpiId.replace(/_/g, ' ').toUpperCase(),
          current: kpi.current,
          target: kpi.target,
          unit: kpi.unit,
          trend: kpi.trend,
          performance: this.calculateKPIPerformance(kpi),
          history: config.showTrends ? kpi.history.slice(-30) : [],
          alert: kpi.alerts.length > 0 ? kpi.alerts[0] : null
        });
      }
    }
    
    return { kpis: kpiData };
  }

  /**
   * Get GABA product performance data
   */
  async getGABAProductPerformanceData(config) {
    const productData = [];
    
    for (const product of config.products) {
      const analysis = await this.analyzeGABAProduct(product.replace('GABA_', ''));
      productData.push({
        product,
        name: `SENTIA ${product.replace('_', ' ')}`,
        metrics: {
          salesVolume: analysis.sales.volume,
          revenue: analysis.sales.revenue,
          margin: analysis.profitability.grossMargin,
          marketFeedback: analysis.customerFeedback.overallRating
        },
        trends: this.getProductTrends(product, config.timeRange),
        alerts: this.getProductAlerts(product)
      });
    }
    
    return { products: productData };
  }

  /**
   * Get botanical potency tracking data
   */
  async getBotanicalPotencyData(config) {
    const botanicalData = [];
    
    for (const botanical of config.botanicals) {
      const potencyData = this.realTimeMetrics.botanical.get(botanical) || {};
      const supplierData = await this.supplyChain.assessSupplierRisk(
        this.supplyChain.botanicalSuppliers[botanical]?.primary,
        botanical
      );
      
      botanicalData.push({
        botanical,
        name: botanical.replace(/_/g, ' ').toUpperCase(),
        potency: potencyData.averagePotency || 0,
        consistency: potencyData.consistencyScore || 0,
        qualityScore: potencyData.qualityScore || 0,
        costEffectiveness: potencyData.costPerUnit || 0,
        supplierRisk: supplierData?.riskLevel || 'unknown',
        trend: potencyData.trend || 'stable'
      });
    }
    
    return { botanicals: botanicalData };
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveReport() {
    const report = {
      title: 'Sentia Executive Business Report',
      generatedAt: new Date(),
      period: this.getReportPeriod(),
      
      executiveSummary: {
        keyHighlights: [],
        criticalIssues: [],
        opportunities: [],
        financialSnapshot: {}
      },
      
      productPerformance: await this.analyzeProductPerformance(),
      
      financialPerformance: {
        revenue: this.getFinancialMetric('total_revenue'),
        profitability: this.getFinancialMetric('gross_profit_margin'),
        cashFlow: this.getFinancialMetric('operating_cash_flow'),
        workingCapital: this.getFinancialMetric('working_capital_efficiency')
      },
      
      operationalMetrics: {
        production: this.getOperationalMetric('production_efficiency'),
        quality: this.getOperationalMetric('quality_performance'),
        supplyChain: this.getOperationalMetric('supply_chain_performance')
      },
      
      marketInsights: {
        customerGrowth: this.getMarketMetric('customer_acquisition'),
        marketShare: this.getMarketMetric('market_position'),
        competitivePosition: this.getMarketMetric('competitive_analysis')
      },
      
      strategicRecommendations: await this.generateStrategicRecommendations(),
      
      appendices: {
        kpiDetails: this.getKPIDetails(),
        riskAssessment: this.getRiskAssessment(),
        forecastData: this.getForecastData()
      }
    };
    
    // Cache the report
    this.analyticsCache.reports.set('executive_latest', report);
    
    return report;
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Handle integration layer events
    this.integrationLayer.on(_'unleashedSyncCompleted', _(data) => {
      this.handleUnleashedUpdate(data);
    });

    this.integrationLayer.on(_'xeroSyncCompleted', _(data) => {
      this.handleXeroUpdate(data);
    });

    // Handle quality system events
    this.qualitySystem.on(_'qualityAlert', _(alert) => {
      this.handleQualityAlert(alert);
    });

    // Handle supply chain events
    this.supplyChain.on(_'riskAlert', _(alert) => {
      this.handleSupplyChainAlert(alert);
    });
  }

  /**
   * Get overall system health
   */
  getSystemHealth() {
    return {
      integrationHealth: this.integrationLayer.getIntegrationStatus(),
      analyticsHealth: {
        realTimeMetrics: this.realTimeMetrics.size > 0,
        kpisUpdated: Array.from(this.performance.kpis.values())
          .filter(kpi => Date.now() - kpi.lastUpdated.getTime() < 300000).length,
        cacheHealth: {
          insights: this.analyticsCache.insights.size,
          reports: this.analyticsCache.reports.size,
          forecasts: this.analyticsCache.forecasts.size
        }
      },
      overallScore: this.calculateOverallHealthScore()
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    // Shutdown integrated systems
    await this.integrationLayer.shutdown();
    await this.forecastingService.shutdown();
    await this.supplyChain.shutdown();
    await this.qualitySystem.shutdown();
    
    // Clear analytics cache
    this.analyticsCache.insights.clear();
    this.analyticsCache.reports.clear();
    this.analyticsCache.forecasts.clear();
    this.analyticsCache.recommendations.clear();
    
    // Clear real-time metrics
    this.realTimeMetrics.production.clear();
    this.realTimeMetrics.sales.clear();
    this.realTimeMetrics.quality.clear();
    this.realTimeMetrics.financial.clear();
    this.realTimeMetrics.botanical.clear();
    
    // Clear performance tracking
    this.performance.kpis.clear();
    this.performance.trends.clear();
    this.performance.alerts.clear();
    this.performance.achievements.clear();
    
    logInfo('Sentia Analytics Dashboard shutdown complete');
  }
}

export default SentiaAnalyticsDashboard;