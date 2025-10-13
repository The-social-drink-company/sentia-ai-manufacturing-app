/**
 * Amazon Analytics Engine
 * 
 * Advanced business intelligence and cross-marketplace analytics for Amazon
 * with performance tracking, optimization suggestions, and market insights.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon Analytics Engine Class
 */
export class AmazonAnalytics {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      crossMarketplaceAnalysis: options.crossMarketplaceAnalysis !== false,
      performanceTracking: options.performanceTracking !== false,
      optimizationSuggestions: options.optimizationSuggestions !== false,
      retentionPeriod: options.retentionPeriod || 90, // days
      ...options
    };

    // Analytics data storage
    this.operationHistory = [];
    this.performanceMetrics = new Map();
    this.marketplaceInsights = new Map();
    this.optimizationOpportunities = [];

    logger.info('Amazon Analytics Engine initialized', {
      enabled: this.options.enabled,
      crossMarketplaceAnalysis: this.options.crossMarketplaceAnalysis,
      performanceTracking: this.options.performanceTracking
    });
  }

  /**
   * Track operation execution and performance
   */
  async trackOperation(toolName, params, result, responseTime) {
    if (!this.options.enabled) {
      return;
    }

    try {
      const operationData = {
        id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        toolName,
        marketplace: params.marketplaceId,
        timestamp: new Date().toISOString(),
        responseTime,
        success: result.success,
        errorType: result.error ? this.categorizeError(result.error) : null,
        dataSize: this.estimateDataSize(result),
        params: this.sanitizeParams(params)
      };

      // Store operation
      this.operationHistory.push(operationData);

      // Update performance metrics
      if (this.options.performanceTracking) {
        this.updatePerformanceMetrics(toolName, params.marketplaceId, operationData);
      }

      // Update marketplace insights
      if (this.options.crossMarketplaceAnalysis) {
        this.updateMarketplaceInsights(params.marketplaceId, operationData);
      }

      // Generate optimization suggestions
      if (this.options.optimizationSuggestions) {
        this.generateOptimizationSuggestions(operationData);
      }

      // Clean up old data
      this.cleanupOldData();

      logger.debug('Operation tracked', {
        toolName,
        marketplace: params.marketplaceId,
        success: result.success,
        responseTime
      });

    } catch (error) {
      logger.error('Failed to track operation', {
        error: error.message,
        toolName
      });
    }
  }

  /**
   * Generate cross-marketplace analytics report
   */
  async generateCrossMarketplaceReport(marketplaces, dateRange, correlationId) {
    try {
      logger.info('Generating cross-marketplace report', {
        correlationId,
        marketplaces,
        dateRange
      });

      const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.endDate ? new Date(dateRange.endDate) : new Date();

      // Filter operations by date range and marketplaces
      const relevantOps = this.operationHistory.filter(op => {
        const opDate = new Date(op.timestamp);
        return opDate >= startDate && opDate <= endDate && 
               (!marketplaces || marketplaces.includes(op.marketplace));
      });

      const report = {
        overview: this.generateOverviewAnalytics(relevantOps),
        performance: this.generatePerformanceAnalytics(relevantOps),
        marketplaceComparison: this.generateMarketplaceComparison(relevantOps, marketplaces),
        trends: this.generateTrendAnalytics(relevantOps),
        optimization: this.generateOptimizationReport(relevantOps),
        recommendations: this.generateRecommendations(relevantOps),
        generatedAt: new Date().toISOString(),
        correlationId
      };

      return report;

    } catch (error) {
      logger.error('Failed to generate cross-marketplace report', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate overview analytics
   */
  generateOverviewAnalytics(operations) {
    const overview = {
      totalOperations: operations.length,
      successRate: 0,
      averageResponseTime: 0,
      totalDataProcessed: 0,
      operationsByTool: {},
      operationsByMarketplace: {},
      timeRange: {
        start: operations.length > 0 ? operations[0].timestamp : null,
        end: operations.length > 0 ? operations[operations.length - 1].timestamp : null
      }
    };

    if (operations.length === 0) {
      return overview;
    }

    // Calculate success rate
    const successfulOps = operations.filter(op => op.success);
    overview.successRate = (successfulOps.length / operations.length) * 100;

    // Calculate average response time
    const totalResponseTime = operations.reduce((sum, op) => sum + op.responseTime, 0);
    overview.averageResponseTime = totalResponseTime / operations.length;

    // Calculate total data processed
    overview.totalDataProcessed = operations.reduce((sum, op) => sum + (op.dataSize || 0), 0);

    // Group by tool
    operations.forEach(op => {
      overview.operationsByTool[op.toolName] = (overview.operationsByTool[op.toolName] || 0) + 1;
    });

    // Group by marketplace
    operations.forEach(op => {
      overview.operationsByMarketplace[op.marketplace] = (overview.operationsByMarketplace[op.marketplace] || 0) + 1;
    });

    return overview;
  }

  /**
   * Generate performance analytics
   */
  generatePerformanceAnalytics(operations) {
    const performance = {
      averageResponseTimes: {},
      errorRates: {},
      throughput: {},
      bottlenecks: [],
      fastestOperations: [],
      slowestOperations: []
    };

    // Group operations by tool
    const operationsByTool = this.groupBy(operations, 'toolName');

    Object.entries(operationsByTool).forEach(([tool, ops]) => {
      // Average response time
      const totalTime = ops.reduce((sum, op) => sum + op.responseTime, 0);
      performance.averageResponseTimes[tool] = totalTime / ops.length;

      // Error rate
      const errors = ops.filter(op => !op.success).length;
      performance.errorRates[tool] = (errors / ops.length) * 100;

      // Throughput (operations per hour)
      const timeSpan = this.getTimeSpanHours(ops);
      performance.throughput[tool] = timeSpan > 0 ? ops.length / timeSpan : 0;
    });

    // Find fastest and slowest operations
    const sortedByResponseTime = [...operations].sort((a, b) => a.responseTime - b.responseTime);
    performance.fastestOperations = sortedByResponseTime.slice(0, 5).map(op => ({
      tool: op.toolName,
      marketplace: op.marketplace,
      responseTime: op.responseTime,
      timestamp: op.timestamp
    }));
    performance.slowestOperations = sortedByResponseTime.slice(-5).map(op => ({
      tool: op.toolName,
      marketplace: op.marketplace,
      responseTime: op.responseTime,
      timestamp: op.timestamp
    }));

    // Identify bottlenecks
    Object.entries(performance.averageResponseTimes).forEach(([tool, avgTime]) => {
      if (avgTime > 5000) { // 5 seconds threshold
        performance.bottlenecks.push({
          tool,
          averageResponseTime: avgTime,
          severity: avgTime > 10000 ? 'high' : 'medium'
        });
      }
    });

    return performance;
  }

  /**
   * Generate marketplace comparison analytics
   */
  generateMarketplaceComparison(operations, marketplaces) {
    const comparison = {
      marketplaces: {},
      crossMarketplaceInsights: {
        mostActiveMarketplace: null,
        fastestMarketplace: null,
        mostReliableMarketplace: null
      }
    };

    // Group operations by marketplace
    const operationsByMarketplace = this.groupBy(operations, 'marketplace');

    Object.entries(operationsByMarketplace).forEach(([marketplace, ops]) => {
      const successfulOps = ops.filter(op => op.success);
      const totalResponseTime = ops.reduce((sum, op) => sum + op.responseTime, 0);

      comparison.marketplaces[marketplace] = {
        totalOperations: ops.length,
        successRate: (successfulOps.length / ops.length) * 100,
        averageResponseTime: totalResponseTime / ops.length,
        operationsByTool: this.groupBy(ops, 'toolName'),
        mostUsedTool: this.getMostFrequent(ops, 'toolName'),
        errorRate: ((ops.length - successfulOps.length) / ops.length) * 100
      };
    });

    // Find insights
    const marketplaceEntries = Object.entries(comparison.marketplaces);
    
    if (marketplaceEntries.length > 0) {
      // Most active
      comparison.crossMarketplaceInsights.mostActiveMarketplace = 
        marketplaceEntries.reduce((a, b) => 
          a[1].totalOperations > b[1].totalOperations ? a : b
        )[0];

      // Fastest
      comparison.crossMarketplaceInsights.fastestMarketplace = 
        marketplaceEntries.reduce((a, b) => 
          a[1].averageResponseTime < b[1].averageResponseTime ? a : b
        )[0];

      // Most reliable
      comparison.crossMarketplaceInsights.mostReliableMarketplace = 
        marketplaceEntries.reduce((a, b) => 
          a[1].successRate > b[1].successRate ? a : b
        )[0];
    }

    return comparison;
  }

  /**
   * Generate trend analytics
   */
  generateTrendAnalytics(operations) {
    const trends = {
      dailyOperations: {},
      hourlyDistribution: Array(24).fill(0),
      performanceTrends: {
        responseTime: [],
        successRate: []
      },
      toolUsageTrends: {}
    };

    // Daily operations
    operations.forEach(op => {
      const date = op.timestamp.split('T')[0];
      trends.dailyOperations[date] = (trends.dailyOperations[date] || 0) + 1;
    });

    // Hourly distribution
    operations.forEach(op => {
      const hour = new Date(op.timestamp).getHours();
      trends.hourlyDistribution[hour]++;
    });

    // Performance trends (weekly aggregation)
    const weeklyData = this.aggregateByWeek(operations);
    Object.entries(weeklyData).forEach(([week, ops]) => {
      const successfulOps = ops.filter(op => op.success);
      const avgResponseTime = ops.reduce((sum, op) => sum + op.responseTime, 0) / ops.length;
      const successRate = (successfulOps.length / ops.length) * 100;

      trends.performanceTrends.responseTime.push({ week, value: avgResponseTime });
      trends.performanceTrends.successRate.push({ week, value: successRate });
    });

    // Tool usage trends
    const toolsByWeek = {};
    Object.entries(weeklyData).forEach(([week, ops]) => {
      toolsByWeek[week] = this.groupBy(ops, 'toolName');
    });

    // Convert to trend format
    const allTools = [...new Set(operations.map(op => op.toolName))];
    allTools.forEach(tool => {
      trends.toolUsageTrends[tool] = Object.entries(toolsByWeek).map(([week, tools]) => ({
        week,
        value: (tools[tool] || []).length
      }));
    });

    return trends;
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(operations) {
    const optimization = {
      opportunities: [...this.optimizationOpportunities],
      cacheEfficiency: this.calculateCacheEfficiency(operations),
      apiUsageOptimization: this.analyzeApiUsage(operations),
      performanceOptimization: this.identifyPerformanceOptimizations(operations)
    };

    return optimization;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(operations) {
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };

    // Performance recommendations
    const avgResponseTime = operations.reduce((sum, op) => sum + op.responseTime, 0) / operations.length;
    if (avgResponseTime > 3000) {
      recommendations.immediate.push({
        type: 'performance',
        priority: 'high',
        message: 'Average response time is high. Consider implementing caching or optimizing queries.',
        metric: `${avgResponseTime.toFixed(0)}ms average response time`
      });
    }

    // Error rate recommendations
    const errorRate = (operations.filter(op => !op.success).length / operations.length) * 100;
    if (errorRate > 5) {
      recommendations.immediate.push({
        type: 'reliability',
        priority: 'high',
        message: 'Error rate is high. Review error patterns and implement better error handling.',
        metric: `${errorRate.toFixed(1)}% error rate`
      });
    }

    // Usage pattern recommendations
    const toolUsage = this.groupBy(operations, 'toolName');
    const mostUsedTool = Object.entries(toolUsage).reduce((a, b) => a[1].length > b[1].length ? a : b);
    if (mostUsedTool[1].length > operations.length * 0.6) {
      recommendations.shortTerm.push({
        type: 'optimization',
        priority: 'medium',
        message: `Tool '${mostUsedTool[0]}' is heavily used. Consider implementing dedicated caching or optimization.`,
        metric: `${((mostUsedTool[1].length / operations.length) * 100).toFixed(1)}% of operations`
      });
    }

    return recommendations;
  }

  /**
   * Update performance metrics for a tool/marketplace combination
   */
  updatePerformanceMetrics(toolName, marketplace, operationData) {
    const key = `${toolName}:${marketplace}`;
    
    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, {
        totalOperations: 0,
        successfulOperations: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        lastUpdated: null
      });
    }

    const metrics = this.performanceMetrics.get(key);
    metrics.totalOperations++;
    if (operationData.success) {
      metrics.successfulOperations++;
    }
    metrics.totalResponseTime += operationData.responseTime;
    metrics.averageResponseTime = metrics.totalResponseTime / metrics.totalOperations;
    metrics.lastUpdated = operationData.timestamp;

    this.performanceMetrics.set(key, metrics);
  }

  /**
   * Update marketplace insights
   */
  updateMarketplaceInsights(marketplace, operationData) {
    if (!this.marketplaceInsights.has(marketplace)) {
      this.marketplaceInsights.set(marketplace, {
        totalOperations: 0,
        toolUsage: {},
        performanceProfile: {
          fastestTool: null,
          slowestTool: null,
          mostReliableTool: null
        },
        lastActivity: null
      });
    }

    const insights = this.marketplaceInsights.get(marketplace);
    insights.totalOperations++;
    insights.toolUsage[operationData.toolName] = (insights.toolUsage[operationData.toolName] || 0) + 1;
    insights.lastActivity = operationData.timestamp;

    this.marketplaceInsights.set(marketplace, insights);
  }

  /**
   * Generate optimization suggestions based on operation data
   */
  generateOptimizationSuggestions(operationData) {
    // High response time
    if (operationData.responseTime > 5000) {
      this.optimizationOpportunities.push({
        id: `opt-${Date.now()}`,
        type: 'performance',
        tool: operationData.toolName,
        marketplace: operationData.marketplace,
        suggestion: 'Consider implementing caching for this operation',
        impact: 'high',
        metric: `${operationData.responseTime}ms response time`,
        timestamp: new Date().toISOString()
      });
    }

    // Keep only recent opportunities (last 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.optimizationOpportunities = this.optimizationOpportunities.filter(
      opp => new Date(opp.timestamp).getTime() > dayAgo
    );
  }

  /**
   * Calculate cache efficiency
   */
  calculateCacheEfficiency(operations) {
    const cacheHits = operations.filter(op => op.params._cacheMetadata?.fromCache).length;
    const totalOps = operations.length;
    
    return {
      hitRate: totalOps > 0 ? (cacheHits / totalOps) * 100 : 0,
      totalOperations: totalOps,
      cacheHits,
      cacheMisses: totalOps - cacheHits
    };
  }

  /**
   * Analyze API usage patterns
   */
  analyzeApiUsage(operations) {
    return {
      totalApiCalls: operations.length,
      uniqueEndpoints: new Set(operations.map(op => op.toolName)).size,
      averageCallsPerHour: this.getTimeSpanHours(operations) > 0 ? operations.length / this.getTimeSpanHours(operations) : 0,
      peakUsageHour: this.findPeakUsageHour(operations)
    };
  }

  /**
   * Identify performance optimization opportunities
   */
  identifyPerformanceOptimizations(operations) {
    const optimizations = [];
    
    // Find slow operations
    const slowOps = operations.filter(op => op.responseTime > 3000);
    if (slowOps.length > 0) {
      optimizations.push({
        type: 'slow_operations',
        count: slowOps.length,
        recommendation: 'Optimize slow operations with caching or query optimization'
      });
    }

    // Find frequent failures
    const failedOps = operations.filter(op => !op.success);
    if (failedOps.length > operations.length * 0.05) {
      optimizations.push({
        type: 'high_failure_rate',
        count: failedOps.length,
        recommendation: 'Implement better error handling and retry mechanisms'
      });
    }

    return optimizations;
  }

  /**
   * Get analytics status
   */
  getStatus() {
    return {
      enabled: this.options.enabled,
      operationsTracked: this.operationHistory.length,
      performanceMetrics: this.performanceMetrics.size,
      marketplaceInsights: this.marketplaceInsights.size,
      optimizationOpportunities: this.optimizationOpportunities.length,
      retentionPeriod: this.options.retentionPeriod
    };
  }

  /**
   * Clean up old data based on retention period
   */
  cleanupOldData() {
    const cutoffDate = new Date(Date.now() - this.options.retentionPeriod * 24 * 60 * 60 * 1000);
    
    this.operationHistory = this.operationHistory.filter(
      op => new Date(op.timestamp) > cutoffDate
    );
  }

  // Helper methods

  sanitizeParams(params) {
    const sanitized = { ...params };
    delete sanitized.accessToken;
    delete sanitized.refreshToken;
    delete sanitized.clientSecret;
    return sanitized;
  }

  categorizeError(error) {
    if (typeof error === 'string') {
      if (error.includes('rate limit')) return 'RATE_LIMITED';
      if (error.includes('auth')) return 'AUTH_ERROR';
      if (error.includes('network')) return 'NETWORK_ERROR';
    }
    return 'UNKNOWN';
  }

  estimateDataSize(result) {
    try {
      return JSON.stringify(result).length;
    } catch {
      return 0;
    }
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  getMostFrequent(array, key) {
    const frequency = {};
    array.forEach(item => {
      frequency[item[key]] = (frequency[item[key]] || 0) + 1;
    });
    return Object.entries(frequency).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  getTimeSpanHours(operations) {
    if (operations.length < 2) return 0;
    const start = new Date(operations[0].timestamp);
    const end = new Date(operations[operations.length - 1].timestamp);
    return (end - start) / (1000 * 60 * 60);
  }

  findPeakUsageHour(operations) {
    const hourCounts = Array(24).fill(0);
    operations.forEach(op => {
      const hour = new Date(op.timestamp).getHours();
      hourCounts[hour]++;
    });
    return hourCounts.indexOf(Math.max(...hourCounts));
  }

  aggregateByWeek(operations) {
    return this.groupBy(operations, op => {
      const date = new Date(op.timestamp);
      const week = this.getWeekNumber(date);
      return `${date.getFullYear()}-W${week}`;
    });
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }
}