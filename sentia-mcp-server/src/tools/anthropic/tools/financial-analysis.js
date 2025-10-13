/**
 * Financial Analysis Tool - Claude AI Integration
 * 
 * Comprehensive financial statement analysis with trend identification and forecasting.
 * Provides deep business intelligence for manufacturing financial operations.
 * 
 * Tool: claude-analyze-financial-data
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Financial Analysis Tool for Claude AI
 */
export class FinancialAnalysisTool {
  constructor(dependencies) {
    this.client = dependencies.client;
    this.promptBuilder = dependencies.promptBuilder;
    this.responseParser = dependencies.responseParser;
    this.costOptimizer = dependencies.costOptimizer;
    this.analytics = dependencies.analytics;
    this.server = dependencies.server;
    this.logger = dependencies.logger;

    this.toolName = 'claude-analyze-financial-data';
    this.category = 'financial';
    this.version = '1.0.0';
  }

  /**
   * Initialize the financial analysis tool
   */
  async initialize() {
    try {
      this.logger.info('Initializing Financial Analysis Tool...');
      
      // Validate dependencies
      this.validateDependencies();
      
      this.logger.info('Financial Analysis Tool initialized successfully');
      return true;

    } catch (error) {
      this.logger.error('Failed to initialize Financial Analysis Tool', {
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
        financialData: {
          type: 'object',
          description: 'Financial data including statements, ratios, and historical trends',
          properties: {
            incomeStatement: {
              type: 'object',
              description: 'Income statement data with revenue, expenses, and profit metrics'
            },
            balanceSheet: {
              type: 'object',
              description: 'Balance sheet data with assets, liabilities, and equity'
            },
            cashFlowStatement: {
              type: 'object',
              description: 'Cash flow statement with operating, investing, and financing activities'
            },
            ratios: {
              type: 'object',
              description: 'Financial ratios including liquidity, profitability, and efficiency metrics'
            },
            historicalData: {
              type: 'array',
              description: 'Historical financial data for trend analysis'
            },
            industryBenchmarks: {
              type: 'object',
              description: 'Industry benchmark data for comparative analysis'
            }
          }
        },
        analysisType: {
          type: 'string',
          enum: ['comprehensive', 'profitability', 'liquidity', 'efficiency', 'growth', 'risk'],
          description: 'Type of financial analysis to perform',
          default: 'comprehensive'
        },
        timeframe: {
          type: 'string',
          enum: ['current', 'quarterly', 'annual', 'trend'],
          description: 'Timeframe for the analysis',
          default: 'current'
        },
        focusAreas: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['revenue', 'costs', 'margins', 'cash_flow', 'working_capital', 'debt', 'returns']
          },
          description: 'Specific areas to focus the analysis on'
        },
        comparisonPeriods: {
          type: 'array',
          items: { type: 'string' },
          description: 'Periods to compare against (e.g., ["2023", "2022"])'
        },
        outputFormat: {
          type: 'string',
          enum: ['executive', 'detailed', 'dashboard'],
          description: 'Format of the output report',
          default: 'detailed'
        },
        includeForecasting: {
          type: 'boolean',
          description: 'Whether to include financial forecasting',
          default: false
        },
        riskAssessment: {
          type: 'boolean',
          description: 'Whether to include risk assessment',
          default: true
        }
      },
      required: ['financialData', 'analysisType']
    };
  }

  /**
   * Execute financial analysis
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || this.generateCorrelationId();

    try {
      this.logger.info('Starting financial analysis', {
        correlationId,
        analysisType: params.analysisType,
        timeframe: params.timeframe,
        focusAreas: params.focusAreas
      });

      // Track execution start
      this.analytics.trackExecution(this.toolName, 'started', {
        correlationId,
        analysisType: params.analysisType,
        dataSize: this.estimateDataSize(params.financialData)
      });

      // Validate input parameters
      this.validateInput(params);

      // Prepare and enrich financial data
      const enrichedData = await this.enrichFinancialData(params.financialData);

      // Build analysis prompt
      const prompt = this.promptBuilder.buildPrompt('financial-analysis', enrichedData, {
        analysisScope: params.analysisType,
        timeframe: params.timeframe,
        contextType: 'financial',
        audience: params.outputFormat === 'executive' ? 'executives' : 'analysts',
        includeDetails: params.outputFormat === 'detailed'
      });

      // Optimize request for cost efficiency
      const optimizationResult = await this.costOptimizer.optimizeRequest({
        ...prompt,
        maxTokens: this.getOptimalTokenLimit(params),
        analysisType: params.analysisType
      });

      // Execute Claude analysis
      const response = await this.client.sendMessage(optimizationResult.optimizedParams);

      // Parse and structure the response
      const parsedResponse = await this.responseParser.parseResponse(
        response, 
        'financial-analysis',
        { 
          outputFormat: params.outputFormat,
          includeForecasting: params.includeForecasting 
        }
      );

      // Enhance response with additional insights
      const enhancedResponse = await this.enhanceFinancialResponse(parsedResponse, params);

      // Track successful completion
      const executionTime = Date.now() - startTime;
      this.analytics.trackExecution(this.toolName, 'completed', {
        correlationId,
        executionTime,
        tokensUsed: response.usage?.total_tokens || 0,
        cost: optimizationResult.costAnalysis.optimizedCost,
        analysisType: params.analysisType
      });

      this.logger.info('Financial analysis completed successfully', {
        correlationId,
        executionTime,
        tokensUsed: response.usage?.total_tokens,
        recommendationsCount: enhancedResponse.recommendations?.length || 0
      });

      return enhancedResponse;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Track execution failure
      this.analytics.trackExecution(this.toolName, 'failed', {
        correlationId,
        executionTime,
        error: error.message,
        analysisType: params.analysisType
      });

      this.logger.error('Financial analysis failed', {
        correlationId,
        error: error.message,
        executionTime,
        analysisType: params.analysisType
      });

      throw new Error(`Financial analysis failed: ${error.message}`);
    }
  }

  /**
   * Validate input parameters
   */
  validateInput(params) {
    if (!params.financialData || typeof params.financialData !== 'object') {
      throw new Error('financialData is required and must be an object');
    }

    if (!params.analysisType) {
      throw new Error('analysisType is required');
    }

    const validAnalysisTypes = ['comprehensive', 'profitability', 'liquidity', 'efficiency', 'growth', 'risk'];
    if (!validAnalysisTypes.includes(params.analysisType)) {
      throw new Error(`Invalid analysisType. Must be one of: ${validAnalysisTypes.join(', ')}`);
    }

    // Validate that we have sufficient data for the requested analysis
    this.validateDataSufficiency(params.financialData, params.analysisType);
  }

  /**
   * Validate data sufficiency for analysis type
   */
  validateDataSufficiency(financialData, analysisType) {
    const dataChecks = {
      comprehensive: ['incomeStatement', 'balanceSheet'],
      profitability: ['incomeStatement'],
      liquidity: ['balanceSheet', 'cashFlowStatement'],
      efficiency: ['incomeStatement', 'balanceSheet'],
      growth: ['historicalData'],
      risk: ['balanceSheet', 'cashFlowStatement']
    };

    const requiredData = dataChecks[analysisType] || [];
    const missingData = requiredData.filter(key => !financialData[key] || Object.keys(financialData[key]).length === 0);

    if (missingData.length > 0) {
      throw new Error(`Insufficient data for ${analysisType} analysis. Missing: ${missingData.join(', ')}`);
    }
  }

  /**
   * Enrich financial data with calculations and context
   */
  async enrichFinancialData(financialData) {
    try {
      const enriched = { ...financialData };

      // Calculate additional financial ratios if not provided
      if (!enriched.ratios && enriched.incomeStatement && enriched.balanceSheet) {
        enriched.ratios = this.calculateFinancialRatios(enriched.incomeStatement, enriched.balanceSheet);
      }

      // Add trend calculations if historical data exists
      if (enriched.historicalData && enriched.historicalData.length > 1) {
        enriched.trends = this.calculateTrends(enriched.historicalData);
      }

      // Add industry context if benchmarks are available
      if (enriched.industryBenchmarks) {
        enriched.industryComparison = this.compareToIndustry(enriched, enriched.industryBenchmarks);
      }

      // Fetch additional context from database if available
      const additionalContext = await this.fetchAdditionalContext(enriched);
      if (additionalContext) {
        enriched.manufacturingContext = additionalContext;
      }

      return enriched;

    } catch (error) {
      this.logger.warn('Failed to enrich financial data', {
        error: error.message
      });
      return financialData; // Return original data if enrichment fails
    }
  }

  /**
   * Calculate financial ratios
   */
  calculateFinancialRatios(incomeStatement, balanceSheet) {
    const ratios = {};

    try {
      // Profitability ratios
      if (incomeStatement.revenue && incomeStatement.netIncome) {
        ratios.netProfitMargin = (incomeStatement.netIncome / incomeStatement.revenue) * 100;
      }

      if (incomeStatement.revenue && incomeStatement.grossProfit) {
        ratios.grossProfitMargin = (incomeStatement.grossProfit / incomeStatement.revenue) * 100;
      }

      // Liquidity ratios
      if (balanceSheet.currentAssets && balanceSheet.currentLiabilities) {
        ratios.currentRatio = balanceSheet.currentAssets / balanceSheet.currentLiabilities;
      }

      // Efficiency ratios
      if (incomeStatement.revenue && balanceSheet.totalAssets) {
        ratios.assetTurnover = incomeStatement.revenue / balanceSheet.totalAssets;
      }

      // Leverage ratios
      if (balanceSheet.totalDebt && balanceSheet.totalEquity) {
        ratios.debtToEquity = balanceSheet.totalDebt / balanceSheet.totalEquity;
      }

      return ratios;

    } catch (error) {
      this.logger.warn('Failed to calculate financial ratios', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Calculate trends from historical data
   */
  calculateTrends(historicalData) {
    try {
      const trends = {};
      
      if (historicalData.length < 2) return trends;

      // Sort by period
      const sortedData = historicalData.sort((a, b) => new Date(a.period) - new Date(b.period));
      
      // Calculate revenue growth
      if (sortedData[0].revenue && sortedData[sortedData.length - 1].revenue) {
        const firstRevenue = sortedData[0].revenue;
        const lastRevenue = sortedData[sortedData.length - 1].revenue;
        trends.revenueGrowth = ((lastRevenue - firstRevenue) / firstRevenue) * 100;
      }

      // Calculate margin trends
      const margins = sortedData
        .filter(d => d.netIncome && d.revenue)
        .map(d => (d.netIncome / d.revenue) * 100);
      
      if (margins.length > 1) {
        trends.marginTrend = margins[margins.length - 1] - margins[0];
      }

      return trends;

    } catch (error) {
      this.logger.warn('Failed to calculate trends', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Compare metrics to industry benchmarks
   */
  compareToIndustry(financialData, benchmarks) {
    try {
      const comparison = {};

      if (financialData.ratios && benchmarks) {
        // Compare key ratios to industry averages
        Object.keys(financialData.ratios).forEach(ratio => {
          if (benchmarks[ratio]) {
            const variance = ((financialData.ratios[ratio] - benchmarks[ratio]) / benchmarks[ratio]) * 100;
            comparison[ratio] = {
              company: financialData.ratios[ratio],
              industry: benchmarks[ratio],
              variance: variance,
              performance: variance > 0 ? 'above' : 'below'
            };
          }
        });
      }

      return comparison;

    } catch (error) {
      this.logger.warn('Failed to compare to industry', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Fetch additional context from database
   */
  async fetchAdditionalContext(financialData) {
    try {
      // Query manufacturing-specific financial metrics
      const query = `
        SELECT 
          manufacturing_efficiency,
          inventory_turnover,
          production_costs,
          quality_costs
        FROM manufacturing_metrics 
        WHERE date >= NOW() - INTERVAL '12 months'
        ORDER BY date DESC
        LIMIT 12
      `;

      const result = await this.server.executeReadOnlyQuery(query);
      
      if (result.success && result.rows.length > 0) {
        return {
          manufacturingEfficiency: result.rows.map(r => r.manufacturing_efficiency),
          inventoryTurnover: result.rows.map(r => r.inventory_turnover),
          productionCosts: result.rows.map(r => r.production_costs),
          qualityCosts: result.rows.map(r => r.quality_costs)
        };
      }

      return null;

    } catch (error) {
      this.logger.warn('Failed to fetch additional context', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Enhance response with additional insights
   */
  async enhanceFinancialResponse(parsedResponse, params) {
    try {
      const enhanced = { ...parsedResponse };

      // Add financial health score
      enhanced.financialHealthScore = this.calculateFinancialHealthScore(params.financialData);

      // Add actionable insights based on analysis type
      enhanced.actionableInsights = this.generateActionableInsights(parsedResponse, params);

      // Add risk factors if risk assessment is enabled
      if (params.riskAssessment) {
        enhanced.riskFactors = this.identifyRiskFactors(params.financialData);
      }

      // Add forecasting if requested
      if (params.includeForecasting) {
        enhanced.forecasting = await this.generateForecasting(params.financialData);
      }

      // Add visualization recommendations
      enhanced.visualizations = this.recommendVisualizations(params.analysisType);

      return enhanced;

    } catch (error) {
      this.logger.warn('Failed to enhance financial response', {
        error: error.message
      });
      return parsedResponse;
    }
  }

  /**
   * Calculate overall financial health score
   */
  calculateFinancialHealthScore(financialData) {
    let score = 0;
    let factors = 0;

    try {
      const ratios = financialData.ratios || {};

      // Profitability (weight: 30%)
      if (ratios.netProfitMargin !== undefined) {
        score += Math.min(ratios.netProfitMargin / 15, 1) * 30; // 15% margin = full score
        factors += 30;
      }

      // Liquidity (weight: 25%)
      if (ratios.currentRatio !== undefined) {
        const liquidityScore = ratios.currentRatio >= 2 ? 1 : ratios.currentRatio / 2;
        score += liquidityScore * 25;
        factors += 25;
      }

      // Efficiency (weight: 25%)
      if (ratios.assetTurnover !== undefined) {
        score += Math.min(ratios.assetTurnover / 2, 1) * 25; // 2x turnover = full score
        factors += 25;
      }

      // Leverage (weight: 20%)
      if (ratios.debtToEquity !== undefined) {
        const leverageScore = ratios.debtToEquity <= 0.5 ? 1 : Math.max(0, 1 - (ratios.debtToEquity - 0.5));
        score += leverageScore * 20;
        factors += 20;
      }

      return factors > 0 ? Math.round(score / factors * 100) / 100 : 0.5;

    } catch (error) {
      this.logger.warn('Failed to calculate financial health score', {
        error: error.message
      });
      return 0.5; // Neutral score on error
    }
  }

  /**
   * Generate actionable insights
   */
  generateActionableInsights(parsedResponse, params) {
    const insights = [];

    try {
      // Extract key metrics from recommendations
      const recommendations = parsedResponse.recommendations || [];
      
      recommendations.forEach(rec => {
        if (rec.priority === 'high' || rec.priority === 'critical') {
          insights.push({
            category: 'immediate_action',
            insight: rec.title,
            impact: rec.impact || 'high',
            effort: rec.effort || 'medium',
            timeline: rec.timeline || '30 days'
          });
        }
      });

      // Add specific insights based on analysis type
      switch (params.analysisType) {
        case 'liquidity':
          insights.push({
            category: 'cash_management',
            insight: 'Focus on accounts receivable collection and inventory optimization',
            impact: 'high',
            effort: 'medium',
            timeline: '60 days'
          });
          break;
        case 'profitability':
          insights.push({
            category: 'margin_improvement',
            insight: 'Analyze cost structure and pricing strategies',
            impact: 'high',
            effort: 'high',
            timeline: '90 days'
          });
          break;
      }

      return insights;

    } catch (error) {
      this.logger.warn('Failed to generate actionable insights', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Identify risk factors
   */
  identifyRiskFactors(financialData) {
    const risks = [];

    try {
      const ratios = financialData.ratios || {};

      // Liquidity risk
      if (ratios.currentRatio && ratios.currentRatio < 1.5) {
        risks.push({
          type: 'liquidity',
          severity: ratios.currentRatio < 1 ? 'high' : 'medium',
          description: 'Current ratio below recommended levels',
          metric: ratios.currentRatio,
          threshold: 1.5
        });
      }

      // Profitability risk
      if (ratios.netProfitMargin && ratios.netProfitMargin < 5) {
        risks.push({
          type: 'profitability',
          severity: ratios.netProfitMargin < 0 ? 'critical' : 'medium',
          description: 'Profit margins below industry standards',
          metric: ratios.netProfitMargin,
          threshold: 5
        });
      }

      // Leverage risk
      if (ratios.debtToEquity && ratios.debtToEquity > 1) {
        risks.push({
          type: 'leverage',
          severity: ratios.debtToEquity > 2 ? 'high' : 'medium',
          description: 'High debt-to-equity ratio',
          metric: ratios.debtToEquity,
          threshold: 1
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
   * Generate financial forecasting
   */
  async generateForecasting(financialData) {
    try {
      // Simple trend-based forecasting
      const trends = financialData.trends || {};
      const forecasting = {};

      if (trends.revenueGrowth) {
        const currentRevenue = financialData.incomeStatement?.revenue || 0;
        forecasting.nextYearRevenue = currentRevenue * (1 + trends.revenueGrowth / 100);
      }

      if (trends.marginTrend) {
        const currentMargin = financialData.ratios?.netProfitMargin || 0;
        forecasting.nextYearMargin = currentMargin + trends.marginTrend;
      }

      return forecasting;

    } catch (error) {
      this.logger.warn('Failed to generate forecasting', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Recommend visualizations for the analysis
   */
  recommendVisualizations(analysisType) {
    const visualizations = {
      comprehensive: [
        'financial-dashboard',
        'ratio-trends',
        'profitability-waterfall',
        'balance-sheet-composition'
      ],
      profitability: [
        'profit-margin-trends',
        'revenue-breakdown',
        'cost-analysis',
        'profitability-benchmarks'
      ],
      liquidity: [
        'cash-flow-analysis',
        'working-capital-trends',
        'liquidity-ratios',
        'cash-conversion-cycle'
      ],
      efficiency: [
        'asset-turnover-analysis',
        'efficiency-ratios',
        'productivity-metrics',
        'resource-utilization'
      ],
      growth: [
        'growth-trends',
        'revenue-projections',
        'market-expansion',
        'investment-analysis'
      ],
      risk: [
        'risk-matrix',
        'scenario-analysis',
        'stress-testing',
        'risk-indicators'
      ]
    };

    return visualizations[analysisType] || visualizations.comprehensive;
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
    const analysisComplexity = {
      comprehensive: 1.5,
      profitability: 1.0,
      liquidity: 1.0,
      efficiency: 1.2,
      growth: 1.3,
      risk: 1.4
    };

    const multiplier = analysisComplexity[params.analysisType] || 1.0;
    return Math.min(Math.round(baseLimit * multiplier), 8192);
  }

  generateCorrelationId() {
    return `fin-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}