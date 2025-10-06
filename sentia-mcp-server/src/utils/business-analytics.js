/**
 * Business Analytics and Intelligence System
 * 
 * Comprehensive business metrics collection and analysis for manufacturing
 * operations, providing insights into tool execution, integration performance,
 * cost analysis, user behavior, and capacity planning.
 * 
 * Features:
 * - Tool execution analytics with success rates
 * - Integration performance tracking
 * - Cost analysis for AI API usage
 * - User behavior patterns and usage trends
 * - Capacity planning insights
 * - Revenue and operational metrics
 * - Manufacturing KPI tracking
 * - Predictive business intelligence
 */

import { EventEmitter } from 'events';
import { createLogger } from './logger.js';
import { monitoring } from './monitoring.js';
import { SERVER_CONFIG } from '../config/server-config.js';

const logger = createLogger();

/**
 * Business Analytics Engine
 */
export class BusinessAnalytics extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled !== false,
      retentionDays: config.retentionDays || 90,
      costTracking: config.costTracking !== false,
      userAnalytics: config.userAnalytics !== false,
      manufacturingKPIs: config.manufacturingKPIs !== false,
      aggregationIntervalMs: config.aggregationIntervalMs || 300000, // 5 minutes
      ...config
    };

    // Business data storage
    this.toolExecutions = [];
    this.integrationMetrics = [];
    this.costMetrics = [];
    this.userSessions = new Map();
    this.businessEvents = [];
    this.manufacturingMetrics = [];
    
    // Aggregated business intelligence
    this.dailyMetrics = new Map();
    this.weeklyMetrics = new Map();
    this.monthlyMetrics = new Map();
    
    // Business rules and thresholds
    this.businessRules = {
      costPerRequest: {
        anthropic: 0.001, // $0.001 per request
        openai: 0.002,    // $0.002 per request
        xero: 0.0001,     // $0.0001 per API call
        shopify: 0.0001,
        amazon: 0.0005,
        unleashed: 0.0002
      },
      performanceThresholds: {
        toolSuccessRate: 0.95,    // 95% success rate
        avgResponseTime: 2000,    // 2 seconds
        userSatisfaction: 0.8     // 80% satisfaction
      },
      capacityLimits: {
        dailyToolExecutions: 10000,
        concurrentUsers: 100,
        apiCallsPerHour: 1000
      }
    };

    this.initialize();
  }

  /**
   * Initialize business analytics
   */
  async initialize() {
    if (!this.config.enabled) {
      logger.info('Business analytics disabled');
      return;
    }

    try {
      // Start data collection
      this.startMetricCollection();
      
      // Start aggregation processes
      this.startAggregation();
      
      // Start analysis and insights
      this.startAnalysis();
      
      // Start cleanup
      this.startCleanup();

      logger.info('Business analytics initialized successfully', {
        retentionDays: this.config.retentionDays,
        costTracking: this.config.costTracking,
        userAnalytics: this.config.userAnalytics
      });

      this.emit('analytics:initialized');
    } catch (error) {
      logger.error('Failed to initialize business analytics', { error });
      throw error;
    }
  }

  /**
   * Record tool execution for business analytics
   */
  recordToolExecution(toolName, status, duration, metadata = {}) {
    const timestamp = Date.now();
    
    const execution = {
      timestamp,
      toolName,
      status, // 'success', 'failed', 'timeout'
      duration,
      userId: metadata.userId,
      correlationId: metadata.correlationId,
      integration: metadata.integration,
      businessValue: this.calculateBusinessValue(toolName, status, metadata),
      cost: this.calculateCost(toolName, metadata),
      complexity: this.assessComplexity(toolName, metadata),
      ...metadata
    };

    this.toolExecutions.push(execution);
    
    // Update real-time metrics
    this.updateRealTimeMetrics('tool_execution', execution);
    
    // Check business thresholds
    this.checkBusinessThresholds(execution);

    this.emit('analytics:tool_execution', execution);
    
    logger.debug('Tool execution recorded for analytics', {
      toolName,
      status,
      duration,
      businessValue: execution.businessValue,
      cost: execution.cost
    });
  }

  /**
   * Record integration performance metrics
   */
  recordIntegrationMetrics(integration, operation, metrics) {
    const timestamp = Date.now();
    
    const integrationMetric = {
      timestamp,
      integration,
      operation,
      responseTime: metrics.responseTime,
      status: metrics.status,
      dataVolume: metrics.dataVolume || 0,
      cost: this.calculateIntegrationCost(integration, metrics),
      businessImpact: this.assessBusinessImpact(integration, operation, metrics),
      qualityScore: this.calculateQualityScore(metrics),
      ...metrics
    };

    this.integrationMetrics.push(integrationMetric);
    
    // Update monitoring system
    monitoring.setMetric('business.integration.response_time', metrics.responseTime, {
      integration,
      operation,
      status: metrics.status
    });
    
    monitoring.setMetric('business.integration.cost', integrationMetric.cost, {
      integration
    });

    this.emit('analytics:integration', integrationMetric);
  }

  /**
   * Record user session and behavior
   */
  recordUserSession(userId, action, metadata = {}) {
    const timestamp = Date.now();
    
    // Get or create user session
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        userId,
        sessionStart: timestamp,
        actions: [],
        toolsUsed: new Set(),
        totalValue: 0
      });
    }

    const session = this.userSessions.get(userId);
    
    const userAction = {
      timestamp,
      action,
      value: this.calculateActionValue(action, metadata),
      ...metadata
    };

    session.actions.push(userAction);
    session.totalValue += userAction.value;
    session.lastActivity = timestamp;
    
    if (metadata.toolName) {
      session.toolsUsed.add(metadata.toolName);
    }

    // Update user analytics metrics
    monitoring.setMetric('business.user.session_value', session.totalValue, {
      userId
    });
    
    monitoring.setMetric('business.user.tools_used', session.toolsUsed.size, {
      userId
    });

    this.emit('analytics:user_action', { userId, action: userAction, session });
  }

  /**
   * Record business event
   */
  recordBusinessEvent(eventType, eventData, metadata = {}) {
    const timestamp = Date.now();
    
    const businessEvent = {
      timestamp,
      eventType,
      eventData,
      businessValue: this.calculateEventValue(eventType, eventData),
      impact: this.assessEventImpact(eventType, eventData),
      ...metadata
    };

    this.businessEvents.push(businessEvent);
    
    // Update business metrics
    monitoring.setMetric('business.events.total', 1, {
      event_type: eventType
    });
    
    this.emit('analytics:business_event', businessEvent);
    
    logger.info('Business event recorded', {
      eventType,
      businessValue: businessEvent.businessValue,
      impact: businessEvent.impact
    });
  }

  /**
   * Record manufacturing KPI
   */
  recordManufacturingKPI(kpiType, value, metadata = {}) {
    if (!this.config.manufacturingKPIs) return;

    const timestamp = Date.now();
    
    const kpi = {
      timestamp,
      kpiType,
      value,
      unit: metadata.unit || 'units',
      target: metadata.target,
      variance: metadata.target ? ((value - metadata.target) / metadata.target) * 100 : null,
      businessImpact: this.calculateKPIBusinessImpact(kpiType, value, metadata),
      ...metadata
    };

    this.manufacturingMetrics.push(kpi);
    
    // Update monitoring metrics
    monitoring.setMetric(`business.manufacturing.${kpiType}`, value, {
      department: metadata.department || 'unknown',
      shift: metadata.shift || 'unknown'
    });

    // Check if KPI is within target range
    if (kpi.target && Math.abs(kpi.variance) > 10) { // 10% variance threshold
      this.emit('analytics:kpi_variance', kpi);
    }

    this.emit('analytics:manufacturing_kpi', kpi);
  }

  /**
   * Calculate business value of tool execution
   */
  calculateBusinessValue(toolName, status, metadata = {}) {
    if (status !== 'success') return 0;

    // Base values for different tool categories
    const toolValues = {
      // Financial tools
      'xero-financial-reports': 50,
      'xero-invoices': 25,
      'xero-create-invoice': 100,
      
      // E-commerce tools
      'shopify-orders': 30,
      'shopify-products': 20,
      'shopify-analytics': 75,
      
      // Manufacturing tools
      'unleashed-production-orders': 80,
      'unleashed-inventory': 60,
      'unleashed-purchase-orders': 70,
      
      // AI analysis tools
      'anthropic-financial-analysis': 150,
      'anthropic-strategic-planning': 200,
      'openai-forecasting': 120,
      'openai-optimization': 100,
      
      // Amazon marketplace
      'amazon-orders': 40,
      'amazon-inventory': 35,
      'amazon-advertising': 90
    };

    let baseValue = toolValues[toolName] || 10; // Default value
    
    // Apply multipliers based on metadata
    if (metadata.dataVolume) {
      // More data processed = higher value
      baseValue *= Math.min(1 + (metadata.dataVolume / 1000), 3); // Cap at 3x
    }
    
    if (metadata.automationLevel) {
      // Higher automation = higher value
      baseValue *= (1 + metadata.automationLevel);
    }

    return Math.round(baseValue);
  }

  /**
   * Calculate cost for tool execution
   */
  calculateCost(toolName, metadata = {}) {
    if (!this.config.costTracking) return 0;

    // Extract integration from tool name
    const integration = toolName.split('-')[0];
    const baseCost = this.businessRules.costPerRequest[integration] || 0.0001;
    
    let totalCost = baseCost;
    
    // Add costs based on usage
    if (metadata.tokensUsed) {
      // AI services charge per token
      totalCost += (metadata.tokensUsed / 1000) * 0.002; // $0.002 per 1K tokens
    }
    
    if (metadata.dataTransferred) {
      // Add bandwidth costs
      totalCost += (metadata.dataTransferred / 1024 / 1024) * 0.001; // $0.001 per MB
    }

    return Math.round(totalCost * 1000000) / 1000000; // Round to 6 decimal places
  }

  /**
   * Calculate integration-specific costs
   */
  calculateIntegrationCost(integration, metrics) {
    const baseCost = this.businessRules.costPerRequest[integration] || 0.0001;
    
    let cost = baseCost;
    
    // Add volume-based costs
    if (metrics.recordsProcessed) {
      cost += metrics.recordsProcessed * 0.00001; // $0.00001 per record
    }
    
    // Add time-based costs for long operations
    if (metrics.responseTime > 5000) { // 5 seconds
      cost += (metrics.responseTime / 1000) * 0.0001; // $0.0001 per second
    }

    return Math.round(cost * 1000000) / 1000000;
  }

  /**
   * Assess complexity of operation
   */
  assessComplexity(toolName, metadata = {}) {
    let complexity = 1; // Base complexity
    
    // Factors that increase complexity
    if (metadata.dataVolume > 1000) complexity += 1;
    if (metadata.multiStepProcess) complexity += 2;
    if (metadata.requiresAnalysis) complexity += 1;
    if (metadata.crossIntegration) complexity += 1;
    
    return Math.min(complexity, 5); // Cap at 5
  }

  /**
   * Assess business impact of integration operation
   */
  assessBusinessImpact(integration, operation, metrics) {
    let impact = 'low';
    
    // High impact operations
    const highImpactOperations = [
      'create-invoice', 'process-payment', 'update-inventory',
      'create-order', 'financial-analysis', 'strategic-planning'
    ];
    
    if (highImpactOperations.some(op => operation.includes(op))) {
      impact = 'high';
    } else if (metrics.recordsProcessed > 100) {
      impact = 'medium';
    }

    return impact;
  }

  /**
   * Calculate quality score for operation
   */
  calculateQualityScore(metrics) {
    let score = 100; // Start with perfect score
    
    // Deduct points for issues
    if (metrics.status !== 'success') score -= 50;
    if (metrics.responseTime > 5000) score -= 20; // Slow response
    if (metrics.errorRate > 0.05) score -= 30; // High error rate
    if (metrics.dataAccuracy < 0.95) score -= 25; // Low accuracy
    
    return Math.max(score, 0); // Don't go below 0
  }

  /**
   * Calculate value of user action
   */
  calculateActionValue(action, metadata = {}) {
    const actionValues = {
      'login': 5,
      'tool_execution': 10,
      'data_export': 15,
      'report_generation': 25,
      'analysis_request': 30,
      'configuration_change': 20,
      'integration_setup': 50
    };

    return actionValues[action] || 1;
  }

  /**
   * Calculate business value of events
   */
  calculateEventValue(eventType, eventData) {
    const eventValues = {
      'new_user_registration': 100,
      'integration_connected': 200,
      'workflow_automated': 150,
      'efficiency_improvement': 75,
      'cost_saving_identified': 125,
      'error_resolved': 50,
      'performance_optimization': 80
    };

    let baseValue = eventValues[eventType] || 10;
    
    // Apply multipliers based on event data
    if (eventData.savings) {
      baseValue += eventData.savings * 0.1; // 10% of savings as value
    }
    
    if (eventData.usersAffected) {
      baseValue *= Math.min(1 + (eventData.usersAffected / 10), 3);
    }

    return Math.round(baseValue);
  }

  /**
   * Assess impact of business events
   */
  assessEventImpact(eventType, eventData) {
    const highImpactEvents = [
      'integration_connected', 'workflow_automated', 'major_error_resolved'
    ];
    
    const mediumImpactEvents = [
      'efficiency_improvement', 'cost_saving_identified', 'performance_optimization'
    ];

    if (highImpactEvents.includes(eventType)) return 'high';
    if (mediumImpactEvents.includes(eventType)) return 'medium';
    return 'low';
  }

  /**
   * Calculate business impact of manufacturing KPIs
   */
  calculateKPIBusinessImpact(kpiType, value, metadata = {}) {
    const kpiImpacts = {
      'production_efficiency': value * 100, // $100 per percentage point
      'quality_score': value * 50,
      'downtime_hours': value * -500, // -$500 per hour of downtime
      'waste_percentage': value * -200, // -$200 per percentage of waste
      'employee_productivity': value * 75,
      'order_fulfillment_rate': value * 80
    };

    return kpiImpacts[kpiType] || 0;
  }

  /**
   * Update real-time business metrics
   */
  updateRealTimeMetrics(metricType, data) {
    const timestamp = Date.now();
    const hour = Math.floor(timestamp / (60 * 60 * 1000));
    
    // Update hourly aggregations
    const hourKey = `${metricType}_${hour}`;
    let hourlyData = this.dailyMetrics.get(hourKey);
    
    if (!hourlyData) {
      hourlyData = {
        timestamp: hour * 60 * 60 * 1000,
        type: metricType,
        count: 0,
        totalValue: 0,
        totalCost: 0,
        successRate: 0,
        avgDuration: 0
      };
      this.dailyMetrics.set(hourKey, hourlyData);
    }

    // Update aggregated data
    hourlyData.count++;
    if (data.businessValue) hourlyData.totalValue += data.businessValue;
    if (data.cost) hourlyData.totalCost += data.cost;
    if (data.duration) {
      hourlyData.avgDuration = ((hourlyData.avgDuration * (hourlyData.count - 1)) + data.duration) / hourlyData.count;
    }
    
    // Calculate success rate
    if (metricType === 'tool_execution') {
      const successCount = data.status === 'success' ? 1 : 0;
      hourlyData.successRate = ((hourlyData.successRate * (hourlyData.count - 1)) + successCount) / hourlyData.count;
    }
  }

  /**
   * Check business thresholds and emit alerts
   */
  checkBusinessThresholds(execution) {
    // Check cost thresholds
    if (execution.cost > 0.01) { // $0.01 threshold
      this.emit('analytics:high_cost', {
        toolName: execution.toolName,
        cost: execution.cost,
        threshold: 0.01
      });
    }

    // Check performance thresholds
    if (execution.duration > this.businessRules.performanceThresholds.avgResponseTime) {
      this.emit('analytics:slow_execution', {
        toolName: execution.toolName,
        duration: execution.duration,
        threshold: this.businessRules.performanceThresholds.avgResponseTime
      });
    }
  }

  /**
   * Start metric collection processes
   */
  startMetricCollection() {
    // Collect business metrics every minute
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 60000);

    // Initial collection
    setTimeout(() => this.collectBusinessMetrics(), 5000);
  }

  /**
   * Collect current business metrics
   */
  collectBusinessMetrics() {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);

    // Tool execution metrics
    const recentExecutions = this.toolExecutions.filter(e => e.timestamp > lastHour);
    const successfulExecutions = recentExecutions.filter(e => e.status === 'success');
    
    monitoring.setMetric('business.tools.execution_rate', recentExecutions.length);
    monitoring.setMetric('business.tools.success_rate', successfulExecutions.length / Math.max(recentExecutions.length, 1));
    
    // Cost metrics
    const totalCost = recentExecutions.reduce((sum, e) => sum + (e.cost || 0), 0);
    monitoring.setMetric('business.cost.hourly_total', totalCost);
    
    // Business value metrics
    const totalValue = recentExecutions.reduce((sum, e) => sum + (e.businessValue || 0), 0);
    monitoring.setMetric('business.value.hourly_total', totalValue);
    
    // User activity metrics
    const activeUsers = new Set(recentExecutions.map(e => e.userId).filter(Boolean)).size;
    monitoring.setMetric('business.users.active_hourly', activeUsers);
  }

  /**
   * Start aggregation processes
   */
  startAggregation() {
    // Daily aggregation
    setInterval(() => {
      this.aggregateDailyMetrics();
    }, 24 * 60 * 60 * 1000); // Daily

    // Weekly aggregation
    setInterval(() => {
      this.aggregateWeeklyMetrics();
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }

  /**
   * Aggregate daily business metrics
   */
  aggregateDailyMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const tomorrowMs = todayMs + (24 * 60 * 60 * 1000);

    // Filter data for today
    const todayExecutions = this.toolExecutions.filter(e => 
      e.timestamp >= todayMs && e.timestamp < tomorrowMs
    );

    const dailyMetric = {
      date: today.toISOString().split('T')[0],
      timestamp: todayMs,
      totalExecutions: todayExecutions.length,
      successfulExecutions: todayExecutions.filter(e => e.status === 'success').length,
      totalCost: todayExecutions.reduce((sum, e) => sum + (e.cost || 0), 0),
      totalValue: todayExecutions.reduce((sum, e) => sum + (e.businessValue || 0), 0),
      uniqueUsers: new Set(todayExecutions.map(e => e.userId).filter(Boolean)).size,
      topTools: this.getTopTools(todayExecutions),
      avgDuration: this.calculateAvgDuration(todayExecutions)
    };

    this.dailyMetrics.set(dailyMetric.date, dailyMetric);
    
    logger.info('Daily metrics aggregated', {
      date: dailyMetric.date,
      executions: dailyMetric.totalExecutions,
      value: dailyMetric.totalValue,
      cost: dailyMetric.totalCost
    });
  }

  /**
   * Get top tools by usage
   */
  getTopTools(executions, limit = 10) {
    const toolCounts = {};
    
    executions.forEach(e => {
      toolCounts[e.toolName] = (toolCounts[e.toolName] || 0) + 1;
    });

    return Object.entries(toolCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([tool, count]) => ({ tool, count }));
  }

  /**
   * Calculate average duration
   */
  calculateAvgDuration(executions) {
    if (executions.length === 0) return 0;
    
    const totalDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0);
    return totalDuration / executions.length;
  }

  /**
   * Start analysis processes
   */
  startAnalysis() {
    // Business intelligence analysis every hour
    setInterval(() => {
      this.generateBusinessInsights();
    }, 60 * 60 * 1000); // Hourly

    // Initial analysis
    setTimeout(() => this.generateBusinessInsights(), 10000);
  }

  /**
   * Generate business insights and recommendations
   */
  generateBusinessInsights() {
    try {
      const insights = {
        timestamp: Date.now(),
        period: 'last_24_hours',
        toolAnalysis: this.analyzeToolPerformance(),
        costAnalysis: this.analyzeCosts(),
        userBehavior: this.analyzeUserBehavior(),
        manufacturingKPIs: this.analyzeManufacturingKPIs(),
        recommendations: []
      };

      // Generate recommendations based on analysis
      insights.recommendations = this.generateRecommendations(insights);

      this.emit('analytics:insights', insights);
      
      logger.info('Business insights generated', {
        toolsAnalyzed: Object.keys(insights.toolAnalysis.byTool || {}).length,
        totalCost: insights.costAnalysis.totalCost,
        recommendations: insights.recommendations.length
      });

    } catch (error) {
      logger.error('Failed to generate business insights', { error });
    }
  }

  /**
   * Analyze tool performance
   */
  analyzeToolPerformance() {
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const recentExecutions = this.toolExecutions.filter(e => e.timestamp > last24h);

    const analysis = {
      totalExecutions: recentExecutions.length,
      overallSuccessRate: 0,
      byTool: {},
      byIntegration: {},
      performanceTrends: {}
    };

    // Overall success rate
    const successful = recentExecutions.filter(e => e.status === 'success').length;
    analysis.overallSuccessRate = successful / Math.max(recentExecutions.length, 1);

    // By tool analysis
    const toolGroups = this.groupBy(recentExecutions, 'toolName');
    for (const [tool, executions] of Object.entries(toolGroups)) {
      const successCount = executions.filter(e => e.status === 'success').length;
      analysis.byTool[tool] = {
        count: executions.length,
        successRate: successCount / executions.length,
        avgDuration: this.calculateAvgDuration(executions),
        totalValue: executions.reduce((sum, e) => sum + (e.businessValue || 0), 0),
        totalCost: executions.reduce((sum, e) => sum + (e.cost || 0), 0)
      };
    }

    // By integration analysis
    const integrationGroups = this.groupBy(recentExecutions, 'integration');
    for (const [integration, executions] of Object.entries(integrationGroups)) {
      if (!integration) continue;
      
      const successCount = executions.filter(e => e.status === 'success').length;
      analysis.byIntegration[integration] = {
        count: executions.length,
        successRate: successCount / executions.length,
        avgDuration: this.calculateAvgDuration(executions)
      };
    }

    return analysis;
  }

  /**
   * Analyze costs
   */
  analyzeCosts() {
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const recentExecutions = this.toolExecutions.filter(e => e.timestamp > last24h);

    const totalCost = recentExecutions.reduce((sum, e) => sum + (e.cost || 0), 0);
    const costByIntegration = {};

    // Group costs by integration
    recentExecutions.forEach(e => {
      if (e.integration && e.cost) {
        costByIntegration[e.integration] = (costByIntegration[e.integration] || 0) + e.cost;
      }
    });

    return {
      totalCost,
      costByIntegration,
      avgCostPerExecution: totalCost / Math.max(recentExecutions.length, 1),
      costTrend: this.calculateCostTrend(),
      projectedMonthlyCost: totalCost * 30 // Rough projection
    };
  }

  /**
   * Analyze user behavior
   */
  analyzeUserBehavior() {
    const activeUsers = Array.from(this.userSessions.values());
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    
    const recentUsers = activeUsers.filter(u => u.lastActivity > last24h);

    return {
      totalActiveUsers: recentUsers.length,
      avgSessionValue: recentUsers.reduce((sum, u) => sum + u.totalValue, 0) / Math.max(recentUsers.length, 1),
      avgToolsPerUser: recentUsers.reduce((sum, u) => sum + u.toolsUsed.size, 0) / Math.max(recentUsers.length, 1),
      topUsers: recentUsers
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5)
        .map(u => ({ userId: u.userId, value: u.totalValue, toolsUsed: u.toolsUsed.size }))
    };
  }

  /**
   * Analyze manufacturing KPIs
   */
  analyzeManufacturingKPIs() {
    if (!this.config.manufacturingKPIs) return { enabled: false };

    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const recentKPIs = this.manufacturingMetrics.filter(k => k.timestamp > last24h);

    const kpiGroups = this.groupBy(recentKPIs, 'kpiType');
    const analysis = {};

    for (const [kpiType, kpis] of Object.entries(kpiGroups)) {
      const values = kpis.map(k => k.value);
      const latest = kpis[kpis.length - 1];
      
      analysis[kpiType] = {
        latestValue: latest.value,
        trend: this.calculateTrend(values),
        variance: latest.variance,
        businessImpact: kpis.reduce((sum, k) => sum + (k.businessImpact || 0), 0)
      };
    }

    return analysis;
  }

  /**
   * Generate business recommendations
   */
  generateRecommendations(insights) {
    const recommendations = [];

    // Tool performance recommendations
    if (insights.toolAnalysis.overallSuccessRate < this.businessRules.performanceThresholds.toolSuccessRate) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Improve Tool Success Rate',
        description: `Overall tool success rate is ${(insights.toolAnalysis.overallSuccessRate * 100).toFixed(1)}%, below target of ${(this.businessRules.performanceThresholds.toolSuccessRate * 100)}%`,
        action: 'Review failing tools and implement error handling improvements'
      });
    }

    // Cost optimization recommendations
    if (insights.costAnalysis.projectedMonthlyCost > 100) { // $100/month threshold
      recommendations.push({
        type: 'cost',
        priority: 'medium',
        title: 'Cost Optimization Opportunity',
        description: `Projected monthly cost is $${insights.costAnalysis.projectedMonthlyCost.toFixed(2)}`,
        action: 'Review high-cost integrations and optimize usage patterns'
      });
    }

    // User engagement recommendations
    if (insights.userBehavior.avgToolsPerUser < 3) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        title: 'Increase User Tool Adoption',
        description: `Users are only using ${insights.userBehavior.avgToolsPerUser.toFixed(1)} tools on average`,
        action: 'Provide training or guidance to help users discover more tools'
      });
    }

    return recommendations;
  }

  /**
   * Helper function to group array by property
   */
  groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property];
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Calculate cost trend
   */
  calculateCostTrend() {
    // Simplified trend calculation
    const last48h = Date.now() - (48 * 60 * 60 * 1000);
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    
    const older = this.toolExecutions.filter(e => e.timestamp > last48h && e.timestamp <= last24h);
    const recent = this.toolExecutions.filter(e => e.timestamp > last24h);
    
    const olderCost = older.reduce((sum, e) => sum + (e.cost || 0), 0);
    const recentCost = recent.reduce((sum, e) => sum + (e.cost || 0), 0);
    
    if (olderCost === 0) return 'no_data';
    
    const change = ((recentCost - olderCost) / olderCost) * 100;
    
    if (change > 20) return 'increasing';
    if (change < -20) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate trend for values
   */
  calculateTrend(values) {
    if (values.length < 2) return 'no_data';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Start cleanup processes
   */
  startCleanup() {
    // Clean up old data daily
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Clean up old business analytics data
   */
  cleanupOldData() {
    const cutoff = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);

    // Clean up tool executions
    this.toolExecutions = this.toolExecutions.filter(e => e.timestamp > cutoff);
    
    // Clean up integration metrics
    this.integrationMetrics = this.integrationMetrics.filter(m => m.timestamp > cutoff);
    
    // Clean up business events
    this.businessEvents = this.businessEvents.filter(e => e.timestamp > cutoff);
    
    // Clean up manufacturing metrics
    this.manufacturingMetrics = this.manufacturingMetrics.filter(m => m.timestamp > cutoff);
    
    // Clean up old user sessions
    for (const [userId, session] of this.userSessions) {
      if (session.lastActivity < cutoff) {
        this.userSessions.delete(userId);
      }
    }

    logger.debug('Business analytics data cleanup completed', {
      toolExecutions: this.toolExecutions.length,
      integrationMetrics: this.integrationMetrics.length,
      activeSessions: this.userSessions.size
    });
  }

  /**
   * Get business analytics summary
   */
  getAnalyticsSummary() {
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const recentExecutions = this.toolExecutions.filter(e => e.timestamp > last24h);

    return {
      period: 'last_24_hours',
      summary: {
        totalExecutions: recentExecutions.length,
        successRate: recentExecutions.filter(e => e.status === 'success').length / Math.max(recentExecutions.length, 1),
        totalCost: recentExecutions.reduce((sum, e) => sum + (e.cost || 0), 0),
        totalValue: recentExecutions.reduce((sum, e) => sum + (e.businessValue || 0), 0),
        activeUsers: new Set(recentExecutions.map(e => e.userId).filter(Boolean)).size,
        topTools: this.getTopTools(recentExecutions, 5)
      },
      config: this.config,
      dataSize: {
        toolExecutions: this.toolExecutions.length,
        integrationMetrics: this.integrationMetrics.length,
        businessEvents: this.businessEvents.length,
        userSessions: this.userSessions.size
      }
    };
  }
}

// Create singleton instance
export const businessAnalytics = new BusinessAnalytics();

// Export utility functions
export const {
  recordToolExecution,
  recordIntegrationMetrics,
  recordUserSession,
  recordBusinessEvent,
  recordManufacturingKPI,
  getAnalyticsSummary
} = businessAnalytics;