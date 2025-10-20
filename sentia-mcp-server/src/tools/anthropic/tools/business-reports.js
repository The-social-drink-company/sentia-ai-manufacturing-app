/**
 * Business Reports Tool - Claude AI Integration
 * 
 * Executive dashboard summaries and strategic planning documents.
 * Generates comprehensive business reports for manufacturing operations.
 * 
 * Tool: claude-generate-business-reports
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Business Reports Generation Tool for Claude AI
 */
export class BusinessReportsTool {
  constructor(dependencies) {
    this.client = dependencies.client;
    this.promptBuilder = dependencies.promptBuilder;
    this.responseParser = dependencies.responseParser;
    this.costOptimizer = dependencies.costOptimizer;
    this.analytics = dependencies.analytics;
    this.server = dependencies.server;
    this.logger = dependencies.logger;

    this.toolName = 'claude-generate-business-reports';
    this.category = 'reporting';
    this.version = '1.0.0';
  }

  /**
   * Initialize the business reports tool
   */
  async initialize() {
    try {
      this.logger.info('Initializing Business Reports Tool...');
      
      // Validate dependencies
      this.validateDependencies();
      
      this.logger.info('Business Reports Tool initialized successfully');
      return true;

    } catch (error) {
      this.logger.error('Failed to initialize Business Reports Tool', {
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
        reportType: {
          type: 'string',
          enum: ['executive_summary', 'quarterly_review', 'monthly_report', 'annual_report', 'kpi_dashboard', 'custom'],
          description: 'Type of business report to generate',
          default: 'executive_summary'
        },
        businessData: {
          type: 'object',
          description: 'Comprehensive business data from multiple departments',
          properties: {
            financial: {
              type: 'object',
              description: 'Financial performance data'
            },
            operational: {
              type: 'object',
              description: 'Manufacturing and operational metrics'
            },
            sales: {
              type: 'object',
              description: 'Sales and customer data'
            },
            hr: {
              type: 'object',
              description: 'Human resources metrics'
            },
            quality: {
              type: 'object',
              description: 'Quality control and assurance data'
            },
            inventory: {
              type: 'object',
              description: 'Inventory and supply chain data'
            },
            projects: {
              type: 'object',
              description: 'Strategic projects and initiatives'
            }
          }
        },
        timeframe: {
          type: 'string',
          enum: ['current_month', 'last_month', 'current_quarter', 'last_quarter', 'ytd', 'last_year', 'custom'],
          description: 'Reporting timeframe',
          default: 'current_quarter'
        },
        customDateRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' }
          },
          description: 'Custom date range when timeframe is "custom"'
        },
        audience: {
          type: 'string',
          enum: ['board', 'executives', 'management', 'stakeholders', 'investors'],
          description: 'Target audience for the report',
          default: 'executives'
        },
        focusAreas: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['financial_performance', 'operational_efficiency', 'sales_growth', 'quality_metrics', 'strategic_initiatives', 'risk_management']
          },
          description: 'Specific areas to focus on in the report'
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'number' },
              target: { type: 'number' },
              unit: { type: 'string' }
            }
          },
          description: 'Key performance indicators to highlight'
        },
        targets: {
          type: 'object',
          description: 'Performance targets and goals'
        },
        previousPeriod: {
          type: 'object',
          description: 'Data from previous period for comparison'
        },
        industryBenchmarks: {
          type: 'object',
          description: 'Industry benchmark data for context'
        },
        customSections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              data: { type: 'object' }
            }
          },
          description: 'Custom sections to include in the report'
        },
        format: {
          type: 'string',
          enum: ['structured', 'narrative', 'dashboard', 'presentation'],
          description: 'Output format of the report',
          default: 'structured'
        },
        includeCharts: {
          type: 'boolean',
          description: 'Whether to include chart and visualization recommendations',
          default: true
        },
        includeActionItems: {
          type: 'boolean',
          description: 'Whether to include actionable recommendations',
          default: true
        }
      },
      required: ['reportType', 'businessData']
    };
  }

  /**
   * Execute business report generation
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || this.generateCorrelationId();

    try {
      this.logger.info('Starting business report generation', {
        correlationId,
        reportType: params.reportType,
        timeframe: params.timeframe,
        audience: params.audience
      });

      // Track execution start
      this.analytics.trackExecution(this.toolName, 'started', {
        correlationId,
        reportType: params.reportType,
        dataSize: this.estimateDataSize(params.businessData)
      });

      // Validate input parameters
      this.validateInput(params);

      // Prepare and enrich business data
      const enrichedData = await this.enrichBusinessData(params.businessData, params);

      // Build report generation prompt
      const prompt = this.promptBuilder.buildPrompt('business-reports', enrichedData, {
        analysisScope: params.reportType,
        timeframe: params.timeframe,
        contextType: 'strategic',
        audience: params.audience,
        includeDetails: params.format === 'structured'
      });

      // Optimize request for cost efficiency
      const optimizationResult = await this.costOptimizer.optimizeRequest({
        ...prompt,
        maxTokens: this.getOptimalTokenLimit(params),
        analysisType: params.reportType
      });

      // Execute Claude analysis
      const response = await this.client.sendMessage(optimizationResult.optimizedParams);

      // Parse and structure the response
      const parsedResponse = await this.responseParser.parseResponse(
        response, 
        'business-reports',
        { 
          outputFormat: params.format,
          includeCharts: params.includeCharts 
        }
      );

      // Enhance response with report-specific formatting
      const enhancedResponse = await this.enhanceReportResponse(parsedResponse, params);

      // Track successful completion
      const executionTime = Date.now() - startTime;
      this.analytics.trackExecution(this.toolName, 'completed', {
        correlationId,
        executionTime,
        tokensUsed: response.usage?.total_tokens || 0,
        cost: optimizationResult.costAnalysis.optimizedCost,
        reportType: params.reportType
      });

      this.logger.info('Business report generation completed successfully', {
        correlationId,
        executionTime,
        tokensUsed: response.usage?.total_tokens,
        sectionsCount: Object.keys(enhancedResponse.sections || {}).length
      });

      return enhancedResponse;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Track execution failure
      this.analytics.trackExecution(this.toolName, 'failed', {
        correlationId,
        executionTime,
        error: error.message,
        reportType: params.reportType
      });

      this.logger.error('Business report generation failed', {
        correlationId,
        error: error.message,
        executionTime,
        reportType: params.reportType
      });

      throw new Error(`Business report generation failed: ${error.message}`);
    }
  }

  /**
   * Validate input parameters
   */
  validateInput(params) {
    if (!params.businessData || typeof params.businessData !== 'object') {
      throw new Error('businessData is required and must be an object');
    }

    if (!params.reportType) {
      throw new Error('reportType is required');
    }

    const validReportTypes = ['executive_summary', 'quarterly_review', 'monthly_report', 'annual_report', 'kpi_dashboard', 'custom'];
    if (!validReportTypes.includes(params.reportType)) {
      throw new Error(`Invalid reportType. Must be one of: ${validReportTypes.join(', ')}`);
    }

    // Validate data sufficiency for report type
    this.validateDataSufficiency(params.businessData, params.reportType);
  }

  /**
   * Validate data sufficiency for report type
   */
  validateDataSufficiency(businessData, reportType) {
    const dataChecks = {
      executive_summary: ['financial', 'operational'],
      quarterly_review: ['financial', 'operational', 'sales'],
      monthly_report: ['operational', 'sales'],
      annual_report: ['financial', 'operational', 'sales', 'hr'],
      kpi_dashboard: ['financial', 'operational'],
      custom: [] // Custom reports can work with any data
    };

    const requiredData = dataChecks[reportType] || [];
    const missingData = requiredData.filter(key => !businessData[key] || Object.keys(businessData[key]).length === 0);

    if (missingData.length > 0) {
      this.logger.warn(`Some required data missing for ${reportType} report`, {
        missingData
      });
      // Don't throw error, just warn - we can still generate a report with available data
    }
  }

  /**
   * Enrich business data with additional context and calculations
   */
  async enrichBusinessData(businessData, params) {
    try {
      const enriched = { ...businessData };

      // Calculate overall performance metrics
      enriched.overallMetrics = this.calculateOverallMetrics(businessData);

      // Add trend analysis
      enriched.trends = this.calculateBusinessTrends(businessData, params.previousPeriod);

      // Add performance against targets
      if (params.targets) {
        enriched.targetPerformance = this.calculateTargetPerformance(businessData, params.targets);
      }

      // Add industry comparison
      if (params.industryBenchmarks) {
        enriched.industryComparison = this.compareToIndustry(businessData, params.industryBenchmarks);
      }

      // Fetch additional operational context
      const operationalContext = await this.fetchOperationalContext(params.timeframe);
      if (operationalContext) {
        enriched.operationalContext = operationalContext;
      }

      // Add executive insights
      enriched.executiveInsights = this.generateExecutiveInsights(enriched, params);

      // Calculate business health score
      enriched.businessHealthScore = this.calculateBusinessHealthScore(enriched);

      return enriched;

    } catch (error) {
      this.logger.warn('Failed to enrich business data', {
        error: error.message
      });
      return businessData;
    }
  }

  /**
   * Calculate overall performance metrics
   */
  calculateOverallMetrics(businessData) {
    const metrics = {};

    try {
      // Financial metrics
      if (businessData.financial) {
        metrics.financial = {
          revenue: businessData.financial.revenue || 0,
          profit: businessData.financial.netIncome || 0,
          profitMargin: businessData.financial.revenue ? 
            ((businessData.financial.netIncome || 0) / businessData.financial.revenue) * 100 : 0
        };
      }

      // Operational metrics
      if (businessData.operational) {
        metrics.operational = {
          efficiency: businessData.operational.oee || 0,
          quality: businessData.operational.qualityRate || 0,
          onTimeDelivery: businessData.operational.onTimeDelivery || 0
        };
      }

      // Sales metrics
      if (businessData.sales) {
        metrics.sales = {
          growth: businessData.sales.growthRate || 0,
          customerSatisfaction: businessData.sales.customerSatisfaction || 0,
          marketShare: businessData.sales.marketShare || 0
        };
      }

      // HR metrics
      if (businessData.hr) {
        metrics.hr = {
          employeeSatisfaction: businessData.hr.employeeSatisfaction || 0,
          turnoverRate: businessData.hr.turnoverRate || 0,
          productivity: businessData.hr.productivity || 0
        };
      }

      return metrics;

    } catch (error) {
      this.logger.warn('Failed to calculate overall metrics', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Calculate business trends
   */
  calculateBusinessTrends(currentData, previousData) {
    const trends = {};

    try {
      if (!previousData) return trends;

      // Financial trends
      if (currentData.financial && previousData.financial) {
        trends.financial = {
          revenueGrowth: this.calculateGrowthRate(
            currentData.financial.revenue, 
            previousData.financial.revenue
          ),
          profitGrowth: this.calculateGrowthRate(
            currentData.financial.netIncome,
            previousData.financial.netIncome
          )
        };
      }

      // Operational trends
      if (currentData.operational && previousData.operational) {
        trends.operational = {
          efficiencyChange: this.calculateChange(
            currentData.operational.oee,
            previousData.operational.oee
          ),
          qualityChange: this.calculateChange(
            currentData.operational.qualityRate,
            previousData.operational.qualityRate
          )
        };
      }

      return trends;

    } catch (error) {
      this.logger.warn('Failed to calculate business trends', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Calculate performance against targets
   */
  calculateTargetPerformance(businessData, targets) {
    const performance = {};

    try {
      Object.keys(targets).forEach(area => {
        if (businessData[area]) {
          performance[area] = {};
          
          Object.keys(targets[area]).forEach(metric => {
            const actual = businessData[area][metric];
            const target = targets[area][metric];
            
            if (actual !== undefined && target !== undefined) {
              const achievement = (actual / target) * 100;
              performance[area][metric] = {
                actual,
                target,
                achievement,
                status: achievement >= 100 ? 'achieved' : 
                       achievement >= 90 ? 'on_track' : 'at_risk'
              };
            }
          });
        }
      });

      return performance;

    } catch (error) {
      this.logger.warn('Failed to calculate target performance', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Compare performance to industry benchmarks
   */
  compareToIndustry(businessData, benchmarks) {
    const comparison = {};

    try {
      Object.keys(benchmarks).forEach(area => {
        if (businessData[area]) {
          comparison[area] = {};
          
          Object.keys(benchmarks[area]).forEach(metric => {
            const actual = businessData[area][metric];
            const benchmark = benchmarks[area][metric];
            
            if (actual !== undefined && benchmark !== undefined) {
              const variance = ((actual - benchmark) / benchmark) * 100;
              comparison[area][metric] = {
                actual,
                benchmark,
                variance,
                performance: variance > 0 ? 'above' : 'below'
              };
            }
          });
        }
      });

      return comparison;

    } catch (error) {
      this.logger.warn('Failed to compare to industry', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Fetch additional operational context from database
   */
  async fetchOperationalContext(timeframe) {
    try {
      const query = this.buildContextQuery(timeframe);
      const result = await this.server.executeReadOnlyQuery(query);
      
      if (result.success && result.rows.length > 0) {
        return {
          totalOrders: result.rows.reduce((sum, row) => sum + (row.orders || 0), 0),
          averageLeadTime: this.calculateAverage(result.rows, 'lead_time'),
          capacityUtilization: this.calculateAverage(result.rows, 'capacity_utilization'),
          qualityRate: this.calculateAverage(result.rows, 'quality_rate')
        };
      }

      return null;

    } catch (error) {
      this.logger.warn('Failed to fetch operational context', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Build context query based on timeframe
   */
  buildContextQuery(timeframe) {
    const timeConditions = {
      current_month: "date >= date_trunc('month', CURRENT_DATE)",
      last_month: "date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND date < date_trunc('month', CURRENT_DATE)",
      current_quarter: "date >= date_trunc('quarter', CURRENT_DATE)",
      last_quarter: "date >= date_trunc('quarter', CURRENT_DATE - INTERVAL '3 months') AND date < date_trunc('quarter', CURRENT_DATE)",
      ytd: "date >= date_trunc('year', CURRENT_DATE)",
      last_year: "date >= date_trunc('year', CURRENT_DATE - INTERVAL '1 year') AND date < date_trunc('year', CURRENT_DATE)"
    };

    const condition = timeConditions[timeframe] || timeConditions.current_quarter;

    return `
      SELECT 
        COUNT(*) as orders,
        AVG(lead_time) as lead_time,
        AVG(capacity_utilization) as capacity_utilization,
        AVG(quality_rate) as quality_rate
      FROM operational_metrics 
      WHERE ${condition}
      GROUP BY DATE(date)
      ORDER BY DATE(date) DESC
    `;
  }

  /**
   * Generate executive insights
   */
  generateExecutiveInsights(enrichedData, params) {
    const insights = [];

    try {
      // Performance insights
      const metrics = enrichedData.overallMetrics || {};
      
      if (metrics.financial?.profitMargin > 15) {
        insights.push({
          type: 'success',
          category: 'financial',
          message: 'Strong profit margins indicate healthy financial performance',
          metric: metrics.financial.profitMargin
        });
      }

      if (metrics.operational?.efficiency > 85) {
        insights.push({
          type: 'success',
          category: 'operational',
          message: 'Operational efficiency exceeds industry standards',
          metric: metrics.operational.efficiency
        });
      }

      // Warning insights
      if (metrics.sales?.growth < 5) {
        insights.push({
          type: 'warning',
          category: 'sales',
          message: 'Sales growth below target, requires attention',
          metric: metrics.sales.growth
        });
      }

      // Opportunity insights
      if (enrichedData.trends?.operational?.efficiencyChange > 5) {
        insights.push({
          type: 'opportunity',
          category: 'operational',
          message: 'Improving operational efficiency trend presents scaling opportunities',
          metric: enrichedData.trends.operational.efficiencyChange
        });
      }

      return insights;

    } catch (error) {
      this.logger.warn('Failed to generate executive insights', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Calculate overall business health score
   */
  calculateBusinessHealthScore(enrichedData) {
    let score = 0;
    let factors = 0;

    try {
      const metrics = enrichedData.overallMetrics || {};

      // Financial health (30%)
      if (metrics.financial?.profitMargin !== undefined) {
        const financialScore = Math.min(metrics.financial.profitMargin / 20, 1); // 20% margin = max score
        score += financialScore * 30;
        factors += 30;
      }

      // Operational health (25%)
      if (metrics.operational?.efficiency !== undefined) {
        const operationalScore = metrics.operational.efficiency / 100;
        score += operationalScore * 25;
        factors += 25;
      }

      // Sales health (25%)
      if (metrics.sales?.growth !== undefined) {
        const salesScore = Math.min(Math.max(metrics.sales.growth / 15, 0), 1); // 15% growth = max score
        score += salesScore * 25;
        factors += 25;
      }

      // HR health (20%)
      if (metrics.hr?.employeeSatisfaction !== undefined) {
        const hrScore = metrics.hr.employeeSatisfaction / 100;
        score += hrScore * 20;
        factors += 20;
      }

      return factors > 0 ? Math.round(score / factors * 100) / 100 : 0.5;

    } catch (error) {
      this.logger.warn('Failed to calculate business health score', {
        error: error.message
      });
      return 0.5;
    }
  }

  /**
   * Enhance response with report-specific formatting
   */
  async enhanceReportResponse(parsedResponse, params) {
    try {
      const enhanced = { ...parsedResponse };

      // Add report metadata
      enhanced.reportMetadata = {
        type: params.reportType,
        timeframe: params.timeframe,
        audience: params.audience,
        generatedAt: new Date().toISOString(),
        format: params.format
      };

      // Structure report sections based on type
      enhanced.sections = this.structureReportSections(parsedResponse, params);

      // Add visualization recommendations
      if (params.includeCharts) {
        enhanced.visualizations = this.recommendReportVisualizations(params.reportType);
      }

      // Add action items if requested
      if (params.includeActionItems) {
        enhanced.actionItems = this.generateActionItems(parsedResponse, params);
      }

      // Add export options
      enhanced.exportOptions = this.generateExportOptions(params);

      return enhanced;

    } catch (error) {
      this.logger.warn('Failed to enhance report response', {
        error: error.message
      });
      return parsedResponse;
    }
  }

  /**
   * Structure report sections based on report type
   */
  structureReportSections(parsedResponse, params) {
    const sections = {};

    try {
      switch (params.reportType) {
        case 'executive_summary':
          sections.executiveSummary = parsedResponse.executiveSummary || [];
          sections.keyMetrics = parsedResponse.keyMetrics || {};
          sections.criticalInsights = parsedResponse.keyInsights?.slice(0, 5) || [];
          sections.strategicRecommendations = parsedResponse.recommendations?.filter(r => r.priority === 'high').slice(0, 3) || [];
          break;

        case 'quarterly_review':
          sections.quarterHighlights = parsedResponse.quarterHighlights || [];
          sections.performanceAnalysis = parsedResponse.detailedAnalysis || {};
          sections.departmentReviews = parsedResponse.departmentReviews || {};
          sections.goalsAndTargets = parsedResponse.goalsAndTargets || {};
          sections.nextQuarterPlanning = parsedResponse.nextQuarterPlanning || [];
          break;

        case 'kpi_dashboard':
          sections.kpiSummary = parsedResponse.kpiSummary || {};
          sections.trendAnalysis = parsedResponse.trendAnalysis || {};
          sections.alerts = parsedResponse.alerts || [];
          sections.benchmarkComparison = parsedResponse.benchmarkComparison || {};
          break;

        default:
          // Use original structure for other report types
          return parsedResponse;
      }

      return sections;

    } catch (error) {
      this.logger.warn('Failed to structure report sections', {
        error: error.message
      });
      return parsedResponse;
    }
  }

  /**
   * Recommend visualizations for report type
   */
  recommendReportVisualizations(reportType) {
    const visualizations = {
      executive_summary: [
        'executive-kpi-dashboard',
        'financial-summary-charts',
        'trend-overview',
        'performance-scorecard'
      ],
      quarterly_review: [
        'quarterly-performance-dashboard',
        'department-comparison',
        'goal-achievement-tracking',
        'quarterly-trends'
      ],
      monthly_report: [
        'monthly-metrics-dashboard',
        'operational-efficiency-charts',
        'sales-performance-trends',
        'quality-indicators'
      ],
      annual_report: [
        'annual-performance-overview',
        'year-over-year-comparison',
        'strategic-initiative-progress',
        'stakeholder-value-creation'
      ],
      kpi_dashboard: [
        'real-time-kpi-dashboard',
        'performance-indicators',
        'alert-notifications',
        'benchmark-comparisons'
      ]
    };

    return visualizations[reportType] || visualizations.executive_summary;
  }

  /**
   * Generate action items from report content
   */
  generateActionItems(parsedResponse, params) {
    const actionItems = [];

    try {
      // Extract high-priority recommendations
      const recommendations = parsedResponse.recommendations || [];
      
      recommendations
        .filter(rec => rec.priority === 'high' || rec.priority === 'critical')
        .forEach(rec => {
          actionItems.push({
            title: rec.title,
            description: rec.description,
            priority: rec.priority,
            owner: rec.owner || 'TBD',
            dueDate: rec.timeline || '30 days',
            category: rec.category || 'general'
          });
        });

      // Add report-specific action items
      switch (params.reportType) {
        case 'executive_summary':
          actionItems.push({
            title: 'Schedule Strategic Review Meeting',
            description: 'Review executive summary findings with leadership team',
            priority: 'medium',
            owner: 'Executive Team',
            dueDate: '1 week',
            category: 'governance'
          });
          break;

        case 'quarterly_review':
          actionItems.push({
            title: 'Update Quarterly Targets',
            description: 'Revise Q+1 targets based on current performance',
            priority: 'medium',
            owner: 'Department Heads',
            dueDate: '2 weeks',
            category: 'planning'
          });
          break;
      }

      return actionItems;

    } catch (error) {
      this.logger.warn('Failed to generate action items', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Generate export options for the report
   */
  generateExportOptions(params) {
    return {
      pdf: {
        format: 'Professional Report',
        layout: params.audience === 'board' ? 'executive' : 'detailed',
        includeCharts: true
      },
      excel: {
        format: 'Data Analysis Workbook',
        sheets: ['Summary', 'Detailed Data', 'Charts'],
        includeRawData: true
      },
      powerpoint: {
        format: 'Executive Presentation',
        template: params.audience === 'board' ? 'board_template' : 'standard_template',
        slideCount: params.reportType === 'executive_summary' ? 10 : 20
      }
    };
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
    const baseLimit = 6000; // Reports typically need more tokens
    const typeComplexity = {
      executive_summary: 1.0,
      quarterly_review: 1.5,
      monthly_report: 1.2,
      annual_report: 2.0,
      kpi_dashboard: 0.8,
      custom: 1.3
    };

    const multiplier = typeComplexity[params.reportType] || 1.0;
    return Math.min(Math.round(baseLimit * multiplier), 8192);
  }

  generateCorrelationId() {
    return `business-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculation helper methods
  calculateGrowthRate(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  calculateChange(current, previous) {
    if (!previous) return 0;
    return current - previous;
  }

  calculateAverage(rows, field) {
    const values = rows.map(row => row[field]).filter(val => val !== null && val !== undefined);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }
}