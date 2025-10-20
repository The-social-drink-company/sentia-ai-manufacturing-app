/**
 * Analytics Module - OpenAI Integration
 * 
 * Usage analytics, performance monitoring, and insights tracking.
 * Provides comprehensive analytics for OpenAI tool usage and effectiveness.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class OpenAIAnalytics {
  constructor() {
    this.metrics = {
      toolUsage: new Map(),
      userSessions: new Map(),
      errorTracking: new Map(),
      performanceMetrics: [],
      satisfactionScores: []
    };
    
    this.startTime = Date.now();
    this.isInitialized = false;
    
    logger.info('OpenAI Analytics initialized');
  }

  async initialize() {
    try {
      logger.info('Initializing OpenAI Analytics...');
      
      this.setupMetricsCollection();
      this.initializePerformanceTracking();
      
      this.isInitialized = true;
      logger.info('OpenAI Analytics initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize OpenAI Analytics', { error: error.message });
      throw error;
    }
  }

  setupMetricsCollection() {
    // Initialize metric collection structures
    this.metrics.toolUsage.set('total_requests', 0);
    this.metrics.toolUsage.set('successful_requests', 0);
    this.metrics.toolUsage.set('failed_requests', 0);
    
    logger.debug('Metrics collection setup completed');
  }

  initializePerformanceTracking() {
    // Setup performance monitoring
    this.performanceBaseline = {
      avgResponseTime: 0,
      avgTokensPerRequest: 0,
      avgCostPerRequest: 0,
      successRate: 100
    };
    
    logger.debug('Performance tracking initialized');
  }

  trackToolUsage(toolName, metadata = {}) {
    try {
      const timestamp = new Date().toISOString();
      
      // Increment total requests
      const currentTotal = this.metrics.toolUsage.get('total_requests') || 0;
      this.metrics.toolUsage.set('total_requests', currentTotal + 1);
      
      // Track tool-specific usage
      const toolKey = `tool_${toolName}`;
      const currentToolUsage = this.metrics.toolUsage.get(toolKey) || {
        count: 0,
        first_used: timestamp,
        last_used: timestamp,
        avg_response_time: 0,
        success_rate: 100,
        total_tokens: 0,
        total_cost: 0
      };
      
      currentToolUsage.count += 1;
      currentToolUsage.last_used = timestamp;
      
      // Update averages if metadata provided
      if (metadata.responseTime) {
        currentToolUsage.avg_response_time = 
          (currentToolUsage.avg_response_time * (currentToolUsage.count - 1) + metadata.responseTime) / currentToolUsage.count;
      }
      
      if (metadata.tokens) {
        currentToolUsage.total_tokens += metadata.tokens;
      }
      
      if (metadata.cost) {
        currentToolUsage.total_cost += metadata.cost;
      }
      
      this.metrics.toolUsage.set(toolKey, currentToolUsage);
      
      logger.debug('Tool usage tracked', {
        tool: toolName,
        totalUsage: currentToolUsage.count,
        avgResponseTime: currentToolUsage.avg_response_time
      });

    } catch (error) {
      logger.error('Failed to track tool usage', { error: error.message, toolName });
    }
  }

  trackError(toolName, error, context = {}) {
    try {
      const timestamp = new Date().toISOString();
      const errorKey = `${toolName}_errors`;
      
      // Increment failed requests
      const currentFailed = this.metrics.toolUsage.get('failed_requests') || 0;
      this.metrics.toolUsage.set('failed_requests', currentFailed + 1);
      
      // Track tool-specific errors
      const currentErrors = this.metrics.errorTracking.get(errorKey) || [];
      currentErrors.push({
        timestamp,
        error: error.message,
        type: error.name || 'Unknown',
        context
      });
      
      // Keep only last 100 errors per tool
      if (currentErrors.length > 100) {
        currentErrors.splice(0, currentErrors.length - 100);
      }
      
      this.metrics.errorTracking.set(errorKey, currentErrors);
      
      // Update tool success rate
      const toolKey = `tool_${toolName}`;
      const toolMetrics = this.metrics.toolUsage.get(toolKey);
      if (toolMetrics) {
        const totalRequests = toolMetrics.count;
        const errorCount = currentErrors.length;
        toolMetrics.success_rate = ((totalRequests - errorCount) / totalRequests) * 100;
        this.metrics.toolUsage.set(toolKey, toolMetrics);
      }
      
      logger.debug('Error tracked', {
        tool: toolName,
        errorType: error.name,
        totalErrors: currentErrors.length
      });

    } catch (trackingError) {
      logger.error('Failed to track error', { 
        error: trackingError.message, 
        originalError: error.message,
        toolName 
      });
    }
  }

  trackPerformance(toolName, metrics) {
    try {
      const performanceRecord = {
        timestamp: new Date().toISOString(),
        tool: toolName,
        response_time: metrics.responseTime || 0,
        tokens_used: metrics.tokensUsed || 0,
        cost: metrics.cost || 0,
        success: metrics.success !== false,
        user_satisfaction: metrics.userSatisfaction || null
      };
      
      this.metrics.performanceMetrics.push(performanceRecord);
      
      // Keep only last 1000 performance records
      if (this.metrics.performanceMetrics.length > 1000) {
        this.metrics.performanceMetrics.splice(0, this.metrics.performanceMetrics.length - 1000);
      }
      
      // Track user satisfaction if provided
      if (metrics.userSatisfaction) {
        this.metrics.satisfactionScores.push({
          timestamp: performanceRecord.timestamp,
          tool: toolName,
          score: metrics.userSatisfaction,
          feedback: metrics.userFeedback || null
        });
      }
      
      logger.debug('Performance tracked', {
        tool: toolName,
        responseTime: metrics.responseTime,
        success: metrics.success
      });

    } catch (error) {
      logger.error('Failed to track performance', { error: error.message, toolName });
    }
  }

  getStats() {
    try {
      const uptime = Date.now() - this.startTime;
      const totalRequests = this.metrics.toolUsage.get('total_requests') || 0;
      const successfulRequests = this.metrics.toolUsage.get('successful_requests') || 0;
      const failedRequests = this.metrics.toolUsage.get('failed_requests') || 0;
      
      // Calculate overall success rate
      const overallSuccessRate = totalRequests > 0 ? 
        ((totalRequests - failedRequests) / totalRequests) * 100 : 100;
      
      // Get tool usage breakdown
      const toolBreakdown = {};
      for (const [key, value] of this.metrics.toolUsage) {
        if (key.startsWith('tool_')) {
          const toolName = key.replace('tool_', '');
          toolBreakdown[toolName] = value;
        }
      }
      
      // Calculate performance averages
      const recentMetrics = this.metrics.performanceMetrics.slice(-100); // Last 100 requests
      const avgPerformance = this.calculateAveragePerformance(recentMetrics);
      
      // Get satisfaction scores
      const recentSatisfaction = this.metrics.satisfactionScores.slice(-50); // Last 50 scores
      const avgSatisfaction = recentSatisfaction.length > 0 ?
        recentSatisfaction.reduce((sum, score) => sum + score.score, 0) / recentSatisfaction.length : null;
      
      return {
        uptime_ms: uptime,
        uptime_hours: uptime / (1000 * 60 * 60),
        total_requests: totalRequests,
        successful_requests: totalRequests - failedRequests,
        failed_requests: failedRequests,
        success_rate: overallSuccessRate,
        requests_per_hour: totalRequests / (uptime / (1000 * 60 * 60)),
        tool_breakdown: toolBreakdown,
        performance: avgPerformance,
        user_satisfaction: {
          average_score: avgSatisfaction,
          total_ratings: recentSatisfaction.length,
          recent_scores: recentSatisfaction.slice(-10).map(s => s.score)
        },
        error_summary: this.getErrorSummary(),
        trends: this.calculateTrends()
      };

    } catch (error) {
      logger.error('Failed to get analytics stats', { error: error.message });
      return {
        uptime_ms: Date.now() - this.startTime,
        error: 'Failed to calculate statistics'
      };
    }
  }

  calculateAveragePerformance(metrics) {
    if (metrics.length === 0) {
      return {
        avg_response_time: 0,
        avg_tokens_used: 0,
        avg_cost: 0,
        samples: 0
      };
    }
    
    const totals = metrics.reduce((acc, metric) => ({
      response_time: acc.response_time + (metric.response_time || 0),
      tokens_used: acc.tokens_used + (metric.tokens_used || 0),
      cost: acc.cost + (metric.cost || 0)
    }), { response_time: 0, tokens_used: 0, cost: 0 });
    
    return {
      avg_response_time: totals.response_time / metrics.length,
      avg_tokens_used: totals.tokens_used / metrics.length,
      avg_cost: totals.cost / metrics.length,
      samples: metrics.length
    };
  }

  getErrorSummary() {
    const errorSummary = {
      total_errors: 0,
      error_types: {},
      tools_with_errors: []
    };
    
    for (const [key, errors] of this.metrics.errorTracking) {
      if (Array.isArray(errors)) {
        errorSummary.total_errors += errors.length;
        
        const toolName = key.replace('_errors', '');
        errorSummary.tools_with_errors.push({
          tool: toolName,
          error_count: errors.length,
          latest_error: errors[errors.length - 1]?.timestamp
        });
        
        // Count error types
        errors.forEach(error => {
          const type = error.type || 'Unknown';
          errorSummary.error_types[type] = (errorSummary.error_types[type] || 0) + 1;
        });
      }
    }
    
    return errorSummary;
  }

  calculateTrends() {
    const recent = this.metrics.performanceMetrics.slice(-50);
    const older = this.metrics.performanceMetrics.slice(-100, -50);
    
    if (recent.length === 0 || older.length === 0) {
      return { status: 'insufficient_data' };
    }
    
    const recentAvg = this.calculateAveragePerformance(recent);
    const olderAvg = this.calculateAveragePerformance(older);
    
    const responseTimeTrend = this.calculateTrendDirection(
      olderAvg.avg_response_time, 
      recentAvg.avg_response_time
    );
    
    const costTrend = this.calculateTrendDirection(
      olderAvg.avg_cost, 
      recentAvg.avg_cost
    );
    
    return {
      response_time: responseTimeTrend,
      cost: costTrend,
      period: 'last_100_requests'
    };
  }

  calculateTrendDirection(oldValue, newValue) {
    if (oldValue === 0) return 'no_baseline';
    
    const changePercent = ((newValue - oldValue) / oldValue) * 100;
    
    if (Math.abs(changePercent) < 5) return 'stable';
    return changePercent > 0 ? 'increasing' : 'decreasing';
  }

  getUserInsights() {
    const stats = this.getStats();
    const insights = [];
    
    // Performance insights
    if (stats.performance.avg_response_time > 5000) {
      insights.push({
        type: 'performance',
        severity: 'warning',
        message: 'Average response time is high (>5 seconds)',
        recommendation: 'Consider optimizing prompts or using faster models'
      });
    }
    
    // Success rate insights
    if (stats.success_rate < 95) {
      insights.push({
        type: 'reliability',
        severity: 'warning',
        message: `Success rate is ${stats.success_rate.toFixed(1)}% (below 95%)`,
        recommendation: 'Review error patterns and improve error handling'
      });
    }
    
    // Cost insights
    if (stats.performance.avg_cost > 0.10) {
      insights.push({
        type: 'cost',
        severity: 'info',
        message: 'Average cost per request is high',
        recommendation: 'Consider using more cost-effective models for simpler tasks'
      });
    }
    
    // Usage insights
    const mostUsedTool = Object.entries(stats.tool_breakdown)
      .sort(([,a], [,b]) => b.count - a.count)[0];
    
    if (mostUsedTool) {
      insights.push({
        type: 'usage',
        severity: 'info',
        message: `Most used tool: ${mostUsedTool[0]} (${mostUsedTool[1].count} requests)`,
        recommendation: 'Consider optimizing or caching responses for frequently used tools'
      });
    }
    
    return insights;
  }

  exportAnalytics(format = 'json') {
    try {
      const data = {
        export_timestamp: new Date().toISOString(),
        stats: this.getStats(),
        raw_metrics: {
          tool_usage: Object.fromEntries(this.metrics.toolUsage),
          error_tracking: Object.fromEntries(this.metrics.errorTracking),
          performance_metrics: this.metrics.performanceMetrics.slice(-500), // Last 500 records
          satisfaction_scores: this.metrics.satisfactionScores.slice(-100) // Last 100 scores
        },
        insights: this.getUserInsights()
      };
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else if (format === 'csv') {
        return this.convertToCSV(data);
      }
      
      return data;

    } catch (error) {
      logger.error('Failed to export analytics', { error: error.message });
      return null;
    }
  }

  convertToCSV(data) {
    // Simple CSV conversion for performance metrics
    const headers = ['timestamp', 'tool', 'response_time', 'tokens_used', 'cost', 'success'];
    const rows = data.raw_metrics.performance_metrics.map(metric => [
      metric.timestamp,
      metric.tool,
      metric.response_time,
      metric.tokens_used,
      metric.cost,
      metric.success
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  async cleanup() {
    try {
      logger.info('Cleaning up OpenAI Analytics...');
      
      // Keep only essential data (last 30 days)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      cutoffISOString = cutoff.toISOString();
      
      // Clean performance metrics
      this.metrics.performanceMetrics = this.metrics.performanceMetrics.filter(
        metric => metric.timestamp >= cutoffISOString
      );
      
      // Clean satisfaction scores
      this.metrics.satisfactionScores = this.metrics.satisfactionScores.filter(
        score => score.timestamp >= cutoffISOString
      );
      
      // Clean error tracking (keep last 50 errors per tool)
      for (const [key, errors] of this.metrics.errorTracking) {
        if (Array.isArray(errors) && errors.length > 50) {
          this.metrics.errorTracking.set(key, errors.slice(-50));
        }
      }
      
      logger.info('OpenAI Analytics cleanup completed', {
        performanceRecords: this.metrics.performanceMetrics.length,
        satisfactionRecords: this.metrics.satisfactionScores.length
      });
      
    } catch (error) {
      logger.error('Error during OpenAI Analytics cleanup', { error: error.message });
    }
  }
}