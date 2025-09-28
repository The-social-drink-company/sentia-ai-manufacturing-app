/**
 * Intelligent Business Insights and Recommendations Engine
 * Enterprise-grade analytics and AI-powered business intelligence
 */

import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';
import FinancialForecastingEngine from '../ai/financial-forecasting-engine.js';
import WorkingCapitalOptimizer from '../optimization/working-capital-optimizer.js';

export class BusinessInsightsEngine {
  constructor(options = {}) {
    this.config = {
      analysisDepth: options.analysisDepth || 'comprehensive', // basic, standard, comprehensive
      insightCategories: options.insightCategories || [
        'financial', 'operational', 'strategic', 'risk', 'opportunity'
      ],
      benchmarkEnabled: options.benchmarkEnabled !== false,
      industryBenchmarks: options.industryBenchmarks || 'manufacturing',
      alertSeverityLevels: options.alertSeverityLevels || ['info', 'warning', 'critical'],
      recommendationEngine: options.recommendationEngine !== false,
      realTimeAnalysis: options.realTimeAnalysis !== false,
      ...options
    };
    
    this.forecastingEngine = new FinancialForecastingEngine();
    this.workingCapitalOptimizer = new WorkingCapitalOptimizer();
    this.insightCache = new Map();
    this.benchmarkData = new Map();
    this.alertRules = this.setupAlertRules();
  }

  /**
   * Generate comprehensive business insights
   */
  async generateBusinessIntelligence(companyData, options = {}) {
    try {
      logInfo('Generating business intelligence', { 
        companyId: companyData.companyId,
        analysisType: options.analysisType || 'full'
      });

      // Core analysis modules
      const [
        financialInsights,
        operationalInsights,
        strategicInsights,
        riskAnalysis,
        opportunityAnalysis,
        benchmarkAnalysis,
        predictiveInsights
      ] = await Promise.all([
        this.analyzeFinancialPerformance(companyData),
        this.analyzeOperationalEfficiency(companyData),
        this.analyzeStrategicPosition(companyData),
        this.analyzeRisks(companyData),
        this.identifyOpportunities(companyData),
        this.performBenchmarkAnalysis(companyData),
        this.generatePredictiveInsights(companyData)
      ]);

      // Generate actionable recommendations
      const recommendations = await this.generateRecommendations({
        financialInsights,
        operationalInsights,
        strategicInsights,
        riskAnalysis,
        opportunityAnalysis
      });

      // Create executive dashboard insights
      const executiveSummary = await this.generateExecutiveInsights({
        financialInsights,
        operationalInsights,
        strategicInsights,
        riskAnalysis,
        recommendations
      });

      // Generate alerts and notifications
      const alerts = await this.generateAlerts(companyData, {
        financialInsights,
        operationalInsights,
        riskAnalysis
      });

      return {
        companyId: companyData.companyId,
        generatedAt: new Date().toISOString(),
        analysisType: options.analysisType || 'comprehensive',
        insights: {
          financial: financialInsights,
          operational: operationalInsights,
          strategic: strategicInsights,
          risks: riskAnalysis,
          opportunities: opportunityAnalysis,
          benchmarks: benchmarkAnalysis,
          predictive: predictiveInsights
        },
        recommendations,
        executiveSummary,
        alerts,
        confidence: this.calculateOverallConfidence(companyData),
        nextAnalysisDate: this.calculateNextAnalysisDate()
      };

    } catch (error) {
      logError('Business intelligence generation failed', {
        companyId: companyData.companyId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Analyze financial performance with deep insights
   */
  async analyzeFinancialPerformance(companyData) {
    const financials = companyData.financials || {};
    const historical = companyData.historicalFinancials || [];
    
    // Revenue analysis
    const revenueAnalysis = await this.analyzeRevenue(financials, historical);
    
    // Profitability analysis
    const profitabilityAnalysis = await this.analyzeProfitability(financials, historical);
    
    // Cash flow analysis
    const cashFlowAnalysis = await this.analyzeCashFlow(companyData.cashFlow, historical);
    
    // Working capital analysis
    const workingCapitalAnalysis = await this.analyzeWorkingCapital(financials);
    
    // Leverage and solvency analysis
    const leverageAnalysis = await this.analyzeLeverage(financials);
    
    return {
      overall: {
        health: this.calculateFinancialHealth(financials),
        trend: this.calculateFinancialTrend(historical),
        stability: this.calculateFinancialStability(financials, historical)
      },
      revenue: revenueAnalysis,
      profitability: profitabilityAnalysis,
      cashFlow: cashFlowAnalysis,
      workingCapital: workingCapitalAnalysis,
      leverage: leverageAnalysis,
      keyMetrics: this.calculateKeyFinancialMetrics(financials),
      insights: this.generateFinancialInsights(financials, historical)
    };
  }

  /**
   * Analyze operational efficiency
   */
  async analyzeOperationalEfficiency(companyData) {
    const production = companyData.production || {};
    const inventory = companyData.inventory || {};
    const quality = companyData.quality || {};
    const resources = companyData.resources || {};

    // Production efficiency analysis
    const productionEfficiency = await this.analyzeProductionEfficiency(production);
    
    // Inventory management analysis
    const inventoryEfficiency = await this.analyzeInventoryEfficiency(inventory);
    
    // Quality performance analysis
    const qualityPerformance = await this.analyzeQualityPerformance(quality);
    
    // Resource utilization analysis
    const resourceUtilization = await this.analyzeResourceUtilization(resources);
    
    return {
      overall: {
        efficiency: this.calculateOverallOperationalEfficiency([
          productionEfficiency,
          inventoryEfficiency,
          qualityPerformance,
          resourceUtilization
        ]),
        trend: this.calculateOperationalTrend(companyData),
        benchmarkPosition: await this.getOperationalBenchmarkPosition(companyData)
      },
      production: productionEfficiency,
      inventory: inventoryEfficiency,
      quality: qualityPerformance,
      resources: resourceUtilization,
      insights: this.generateOperationalInsights(companyData)
    };
  }

  /**
   * Analyze strategic position and competitive advantage
   */
  async analyzeStrategicPosition(companyData) {
    const market = companyData.marketData || {};
    const competitors = companyData.competitorData || [];
    const products = companyData.products || [];

    return {
      marketPosition: {
        marketShare: market.marketShare || 0,
        growthRate: this.calculateMarketGrowthRate(market),
        competitivePosition: await this.assessCompetitivePosition(competitors, companyData),
        marketTrends: this.analyzeMarketTrends(market)
      },
      productPortfolio: {
        diversification: this.calculateProductDiversification(products),
        lifecycle: this.analyzeProductLifecycle(products),
        profitability: this.analyzeProductProfitability(products),
        innovation: this.assessInnovationCapability(companyData)
      },
      capabilities: {
        core: this.identifyCoreCapabilities(companyData),
        competitive: this.identifyCompetitiveAdvantages(companyData),
        gaps: this.identifyCapabilityGaps(companyData, competitors)
      },
      strategic: {
        swot: await this.performSWOTAnalysis(companyData, market, competitors),
        scenarios: await this.generateStrategicScenarios(companyData),
        recommendations: await this.generateStrategicRecommendations(companyData)
      }
    };
  }

  /**
   * Comprehensive risk analysis
   */
  async analyzeRisks(companyData) {
    return {
      financial: await this.analyzeFinancialRisks(companyData),
      operational: await this.analyzeOperationalRisks(companyData),
      strategic: await this.analyzeStrategicRisks(companyData),
      regulatory: await this.analyzeRegulatoryRisks(companyData),
      market: await this.analyzeMarketRisks(companyData),
      cyber: await this.analyzeCyberRisks(companyData),
      overall: {
        riskScore: 0, // Calculated from individual components
        riskLevel: 'medium',
        topRisks: [],
        mitigation: []
      }
    };
  }

  /**
   * Identify growth and improvement opportunities
   */
  async identifyOpportunities(companyData) {
    const opportunities = [];

    // Revenue growth opportunities
    const revenueOpps = await this.identifyRevenueOpportunities(companyData);
    opportunities.push(...revenueOpps);

    // Cost reduction opportunities
    const costOpps = await this.identifyCostReductionOpportunities(companyData);
    opportunities.push(...costOpps);

    // Efficiency improvement opportunities
    const efficiencyOpps = await this.identifyEfficiencyOpportunities(companyData);
    opportunities.push(...efficiencyOpps);

    // Market expansion opportunities
    const marketOpps = await this.identifyMarketOpportunities(companyData);
    opportunities.push(...marketOpps);

    // Technology opportunities
    const techOpps = await this.identifyTechnologyOpportunities(companyData);
    opportunities.push(...techOpps);

    return {
      total: opportunities.length,
      byCategory: this.categorizeOpportunities(opportunities),
      prioritized: this.prioritizeOpportunities(opportunities),
      quickWins: opportunities.filter(opp => opp.timeframe === 'short' && opp.difficulty === 'low'),
      strategic: opportunities.filter(opp => opp.impact === 'high' && opp.timeframe === 'long')
    };
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations(analysisResults) {
    const recommendations = [];

    // Financial recommendations
    if (analysisResults.financialInsights) {
      const finRecs = await this.generateFinancialRecommendations(analysisResults.financialInsights);
      recommendations.push(...finRecs);
    }

    // Operational recommendations
    if (analysisResults.operationalInsights) {
      const opRecs = await this.generateOperationalRecommendations(analysisResults.operationalInsights);
      recommendations.push(...opRecs);
    }

    // Strategic recommendations
    if (analysisResults.strategicInsights) {
      const stratRecs = await this.generateStrategicRecommendations(analysisResults.strategicInsights);
      recommendations.push(...stratRecs);
    }

    // Risk mitigation recommendations
    if (analysisResults.riskAnalysis) {
      const riskRecs = await this.generateRiskMitigationRecommendations(analysisResults.riskAnalysis);
      recommendations.push(...riskRecs);
    }

    return {
      total: recommendations.length,
      byPriority: this.groupRecommendationsByPriority(recommendations),
      byCategory: this.groupRecommendationsByCategory(recommendations),
      actionable: recommendations.filter(rec => rec.actionable && rec.feasibility > 0.7),
      immediate: recommendations.filter(rec => rec.timeframe === 'immediate' || rec.timeframe === 'short'),
      strategic: recommendations.filter(rec => rec.timeframe === 'long' && rec.impact === 'high')
    };
  }

  /**
   * Generate executive-level insights
   */
  async generateExecutiveInsights(analysisResults) {
    return {
      keyTakeaways: [
        this.generateFinancialTakeaway(analysisResults.financialInsights),
        this.generateOperationalTakeaway(analysisResults.operationalInsights),
        this.generateStrategicTakeaway(analysisResults.strategicInsights),
        this.generateRiskTakeaway(analysisResults.riskAnalysis)
      ].filter(Boolean),
      
      performance: {
        overall: this.calculateOverallPerformance(analysisResults),
        trend: this.calculatePerformanceTrend(analysisResults),
        outlook: this.generateOutlook(analysisResults)
      },
      
      priorities: {
        immediate: this.identifyImmediatePriorities(analysisResults),
        quarterly: this.identifyQuarterlyPriorities(analysisResults),
        annual: this.identifyAnnualPriorities(analysisResults)
      },
      
      metrics: {
        kpis: this.generateExecutiveKPIs(analysisResults),
        benchmarks: this.generateBenchmarkComparisons(analysisResults),
        targets: this.generatePerformanceTargets(analysisResults)
      },
      
      alerts: {
        critical: this.identifyCriticalAlerts(analysisResults),
        opportunities: this.identifyKeyOpportunities(analysisResults),
        risks: this.identifyKeyRisks(analysisResults)
      }
    };
  }

  /**
   * Generate intelligent alerts
   */
  async generateAlerts(companyData, analysisResults) {
    const alerts = [];

    // Financial alerts
    const finAlerts = this.generateFinancialAlerts(analysisResults.financialInsights);
    alerts.push(...finAlerts);

    // Operational alerts
    const opAlerts = this.generateOperationalAlerts(analysisResults.operationalInsights);
    alerts.push(...opAlerts);

    // Risk alerts
    const riskAlerts = this.generateRiskAlerts(analysisResults.riskAnalysis);
    alerts.push(...riskAlerts);

    return {
      total: alerts.length,
      bySeverity: this.groupAlertsBySeverity(alerts),
      byCategory: this.groupAlertsByCategory(alerts),
      actionRequired: alerts.filter(alert => alert.actionRequired),
      trending: this.identifyTrendingAlerts(alerts)
    };
  }

  /**
   * Revenue analysis with growth insights
   */
  async analyzeRevenue(financials, historical) {
    const currentRevenue = financials.revenue || 0;
    const previousRevenue = historical.length > 0 ? historical[historical.length - 1].revenue : 0;
    const growthRate = previousRevenue > 0 ? (currentRevenue - previousRevenue) / previousRevenue : 0;
    
    return {
      current: currentRevenue,
      growth: {
        rate: growthRate,
        trend: growthRate > 0.1 ? 'strong' : growthRate > 0.05 ? 'moderate' : 'weak',
        sustainability: this.assessRevenueGrowthSustainability(historical)
      },
      composition: this.analyzeRevenueComposition(financials),
      seasonality: this.analyzeRevenueSeasonality(historical),
      predictability: this.assessRevenuePredictability(historical),
      quality: this.assessRevenueQuality(financials),
      insights: [
        growthRate > 0.15 ? 'Exceptional revenue growth - consider scaling operations' : null,
        growthRate < 0 ? 'Revenue decline detected - immediate action required' : null,
        this.identifyRevenuePatterns(historical)
      ].filter(Boolean)
    };
  }

  /**
   * Setup intelligent alert rules
   */
  setupAlertRules() {
    return {
      financial: [
        { metric: 'cashFlow', condition: 'negative', severity: 'critical', message: 'Negative cash flow detected' },
        { metric: 'workingCapital', condition: 'below_threshold', threshold: 0.1, severity: 'warning', message: 'Working capital below healthy levels' },
        { metric: 'debtToEquity', condition: 'above_threshold', threshold: 2.0, severity: 'warning', message: 'High debt-to-equity ratio' }
      ],
      operational: [
        { metric: 'productionEfficiency', condition: 'below_threshold', threshold: 0.8, severity: 'warning', message: 'Production efficiency below target' },
        { metric: 'qualityRate', condition: 'below_threshold', threshold: 0.95, severity: 'warning', message: 'Quality rate below acceptable level' }
      ],
      strategic: [
        { metric: 'marketShare', condition: 'declining_trend', severity: 'warning', message: 'Market share declining trend detected' },
        { metric: 'customerSatisfaction', condition: 'below_threshold', threshold: 0.8, severity: 'critical', message: 'Customer satisfaction critically low' }
      ]
    };
  }

  // Helper methods for specific calculations and analysis
  calculateFinancialHealth(financials) {
    // Implement comprehensive financial health scoring
    const metrics = [
      this.normalizeLiquidityScore(financials),
      this.normalizeProfitabilityScore(financials),
      this.normalizeLeverageScore(financials),
      this.normalizeEfficiencyScore(financials)
    ];
    
    const avgScore = metrics.reduce((sum, _score) => sum + score, 0) / metrics.length;
    
    return {
      score: avgScore,
      grade: avgScore > 0.8 ? 'excellent' : avgScore > 0.6 ? 'good' : avgScore > 0.4 ? 'fair' : 'poor',
      components: {
        liquidity: metrics[0],
        profitability: metrics[1],
        leverage: metrics[2],
        efficiency: metrics[3]
      }
    };
  }

  calculateOverallConfidence(companyData) {
    // Calculate confidence based on data quality and completeness
    const dataQualityFactors = [
      companyData.financials ? 0.3 : 0,
      companyData.historicalFinancials?.length > 12 ? 0.2 : 0.1,
      companyData.production ? 0.2 : 0,
      companyData.inventory ? 0.15 : 0,
      companyData.quality ? 0.15 : 0
    ];
    
    const totalConfidence = dataQualityFactors.reduce((sum, _factor) => sum + factor, 0);
    
    return Math.min(totalConfidence, 0.95); // Cap at 95% confidence
  }

  calculateNextAnalysisDate() {
    // Determine optimal next analysis date based on business volatility
    const days = this.config.realTimeAnalysis ? 1 : 7; // Daily for real-time, weekly otherwise
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }
}

export default BusinessInsightsEngine;