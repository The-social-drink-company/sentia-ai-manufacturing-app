/**
 * Anthropic Analytics Module
 * 
 * Comprehensive usage analytics and quality metrics for Claude AI integration:
 * - Usage tracking and performance metrics
 * - Quality scoring for responses
 * - Cost per analysis monitoring
 * - Response time analytics
 * - Error rate monitoring
 * - Business intelligence insights
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../../../utils/logger.js';
import NodeCache from 'node-cache';

const logger = createLogger();

/**
 * Analytics and Monitoring for Anthropic Integration
 */
export class AnthropicAnalytics {
  constructor(config = {}) {
    this.config = {
      retentionPeriod: config.retentionPeriod || 30 * 24 * 60 * 60 * 1000, // 30 days
      aggregationInterval: config.aggregationInterval || 60 * 60 * 1000, // 1 hour
      qualityThreshold: config.qualityThreshold || 0.8,
      performanceThreshold: config.performanceThreshold || 30000, // 30 seconds
      ...config
    };

    // Analytics storage
    this.metrics = {
      usage: {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        uniqueUsers: new Set(),
        toolUsage: new Map()
      },
      quality: {
        averageScore: 0,
        qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
        userSatisfaction: 0,
        feedbackCount: 0
      },
      performance: {
        fastRequests: 0, // < 10s
        mediumRequests: 0, // 10-30s
        slowRequests: 0, // > 30s
        timeoutRequests: 0,
        averageTokensPerSecond: 0
      },
      errors: {
        totalErrors: 0,
        errorTypes: new Map(),
        errorRate: 0,
        lastError: null
      },
      business: {
        analysisTypes: new Map(),
        departmentUsage: new Map(),
        timeOfDayUsage: new Array(24).fill(0),
        dayOfWeekUsage: new Array(7).fill(0),
        monthlyTrends: new Map()
      }
    };

    // Time series data storage
    this.timeSeries = new Map();
    
    // Session tracking
    this.sessions = new Map();
    
    // Performance cache
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

    // Initialize time series collectors
    this.initializeTimeSeriesCollectors();
    
    // Start periodic aggregation
    this.startPeriodicAggregation();
  }

  /**
   * Initialize the analytics system
   */
  async initialize() {
    try {
      logger.info('Initializing Anthropic Analytics...');
      
      // Load historical data if available
      await this.loadHistoricalData();
      
      // Setup monitoring
      this.setupMonitoring();
      
      logger.info('Anthropic Analytics initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize analytics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Track request execution
   */
  trackExecution(toolName, status, metadata = {}) {
    const timestamp = Date.now();
    const executionData = {
      toolName,
      status, // 'started', 'completed', 'failed'
      timestamp,
      ...metadata
    };

    // Update usage metrics
    this.updateUsageMetrics(executionData);
    
    // Update performance metrics
    if (status === 'completed' || status === 'failed') {
      this.updatePerformanceMetrics(executionData);
    }
    
    // Update business metrics
    this.updateBusinessMetrics(executionData);
    
    // Update error metrics if failed
    if (status === 'failed') {
      this.updateErrorMetrics(executionData);
    }
    
    // Store in time series
    this.addToTimeSeries('executions', executionData);
    
    logger.debug('Execution tracked', {
      toolName,
      status,
      timestamp
    });
  }

  /**
   * Track request quality and user feedback
   */
  trackQuality(toolName, qualityData) {
    const qualityScore = this.calculateQualityScore(qualityData);
    
    this.metrics.quality.feedbackCount++;
    
    // Update average score
    const totalScore = (this.metrics.quality.averageScore * (this.metrics.quality.feedbackCount - 1)) + qualityScore;
    this.metrics.quality.averageScore = totalScore / this.metrics.quality.feedbackCount;
    
    // Update quality distribution
    const category = this.categorizeQuality(qualityScore);
    this.metrics.quality.qualityDistribution[category]++;
    
    // Store detailed quality data
    this.addToTimeSeries('quality', {
      toolName,
      qualityScore,
      category,
      timestamp: Date.now(),
      ...qualityData
    });

    logger.info('Quality tracked', {
      toolName,
      qualityScore: qualityScore.toFixed(2),
      category,
      averageScore: this.metrics.quality.averageScore.toFixed(2)
    });
  }

  /**
   * Track user session
   */
  trackSession(sessionId, userId, metadata = {}) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        userId,
        startTime: Date.now(),
        requests: 0,
        tools: new Set(),
        totalCost: 0,
        ...metadata
      });
      
      this.metrics.usage.uniqueUsers.add(userId);
    }
    
    return this.sessions.get(sessionId);
  }

  /**
   * Update session with request data
   */
  updateSession(sessionId, requestData) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.requests++;
      session.tools.add(requestData.toolName);
      session.totalCost += requestData.cost || 0;
      session.lastActivity = Date.now();
      
      return session;
    }
    return null;
  }

  /**
   * Calculate comprehensive quality score
   */
  calculateQualityScore(qualityData) {
    let score = 0;
    let factors = 0;

    // Response completeness (0-1)
    if (qualityData.completeness !== undefined) {
      score += qualityData.completeness;
      factors++;
    }

    // Response accuracy (0-1)
    if (qualityData.accuracy !== undefined) {
      score += qualityData.accuracy;
      factors++;
    }

    // Response relevance (0-1)
    if (qualityData.relevance !== undefined) {
      score += qualityData.relevance;
      factors++;
    }

    // User satisfaction (1-5 scale, normalized to 0-1)
    if (qualityData.userRating !== undefined) {
      score += (qualityData.userRating - 1) / 4;
      factors++;
    }

    // Technical quality factors
    if (qualityData.structuredOutput !== undefined) {
      score += qualityData.structuredOutput ? 1 : 0.5;
      factors++;
    }

    if (qualityData.actionableRecommendations !== undefined) {
      score += qualityData.actionableRecommendations ? 1 : 0.3;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5; // Default to neutral if no factors
  }

  /**
   * Categorize quality score
   */
  categorizeQuality(score) {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'fair';
    return 'poor';
  }

  /**
   * Update usage metrics
   */
  updateUsageMetrics(data) {
    this.metrics.usage.totalRequests++;
    
    if (data.status === 'completed') {
      this.metrics.usage.successfulRequests++;
      
      if (data.tokensUsed) {
        this.metrics.usage.totalTokens += data.tokensUsed;
      }
      
      if (data.cost) {
        this.metrics.usage.totalCost += data.cost;
      }
    } else if (data.status === 'failed') {
      this.metrics.usage.failedRequests++;
    }

    // Track tool usage
    if (data.toolName) {
      const current = this.metrics.usage.toolUsage.get(data.toolName) || 0;
      this.metrics.usage.toolUsage.set(data.toolName, current + 1);
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(data) {
    if (data.executionTime) {
      // Update average response time
      const totalTime = (this.metrics.performance.fastRequests + 
                        this.metrics.performance.mediumRequests + 
                        this.metrics.performance.slowRequests) * 
                        this.metrics.usage.averageResponseTime + data.executionTime;
      
      const totalRequests = this.metrics.performance.fastRequests + 
                           this.metrics.performance.mediumRequests + 
                           this.metrics.performance.slowRequests + 1;
      
      this.metrics.usage.averageResponseTime = totalTime / totalRequests;

      // Categorize response time
      if (data.executionTime < 10000) {
        this.metrics.performance.fastRequests++;
      } else if (data.executionTime < 30000) {
        this.metrics.performance.mediumRequests++;
      } else {
        this.metrics.performance.slowRequests++;
      }

      // Calculate tokens per second
      if (data.tokensUsed && data.executionTime > 0) {
        const tokensPerSecond = (data.tokensUsed / data.executionTime) * 1000;
        this.metrics.performance.averageTokensPerSecond = 
          (this.metrics.performance.averageTokensPerSecond + tokensPerSecond) / 2;
      }
    }

    if (data.status === 'timeout') {
      this.metrics.performance.timeoutRequests++;
    }
  }

  /**
   * Update business intelligence metrics
   */
  updateBusinessMetrics(data) {
    // Track analysis types
    if (data.analysisType) {
      const current = this.metrics.business.analysisTypes.get(data.analysisType) || 0;
      this.metrics.business.analysisTypes.set(data.analysisType, current + 1);
    }

    // Track department usage
    if (data.department) {
      const current = this.metrics.business.departmentUsage.get(data.department) || 0;
      this.metrics.business.departmentUsage.set(data.department, current + 1);
    }

    // Track time patterns
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    this.metrics.business.timeOfDayUsage[hour]++;
    this.metrics.business.dayOfWeekUsage[dayOfWeek]++;

    // Track monthly trends
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyCount = this.metrics.business.monthlyTrends.get(monthKey) || 0;
    this.metrics.business.monthlyTrends.set(monthKey, monthlyCount + 1);
  }

  /**
   * Update error metrics
   */
  updateErrorMetrics(data) {
    this.metrics.errors.totalErrors++;
    
    if (data.error) {
      const errorType = this.categorizeError(data.error);
      const current = this.metrics.errors.errorTypes.get(errorType) || 0;
      this.metrics.errors.errorTypes.set(errorType, current + 1);
      
      this.metrics.errors.lastError = {
        type: errorType,
        message: data.error,
        timestamp: data.timestamp,
        toolName: data.toolName
      };
    }

    // Calculate error rate
    this.metrics.errors.errorRate = 
      this.metrics.errors.totalErrors / this.metrics.usage.totalRequests;
  }

  /**
   * Categorize error types
   */
  categorizeError(error) {
    const errorMessage = error.toLowerCase();
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return 'rate_limit';
    }
    if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
      return 'authentication';
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('504')) {
      return 'timeout';
    }
    if (errorMessage.includes('quota') || errorMessage.includes('budget')) {
      return 'quota_exceeded';
    }
    if (errorMessage.includes('model') || errorMessage.includes('400')) {
      return 'invalid_request';
    }
    if (errorMessage.includes('server') || errorMessage.includes('500')) {
      return 'server_error';
    }
    
    return 'unknown';
  }

  /**
   * Get comprehensive analytics report
   */
  getAnalyticsReport(options = {}) {
    const timeRange = options.timeRange || '24h';
    const includeTimeSeries = options.includeTimeSeries || false;

    const report = {
      summary: {
        totalRequests: this.metrics.usage.totalRequests,
        successRate: this.calculateSuccessRate(),
        averageResponseTime: Math.round(this.metrics.usage.averageResponseTime),
        averageQualityScore: Math.round(this.metrics.quality.averageScore * 100) / 100,
        totalCost: Math.round(this.metrics.usage.totalCost * 10000) / 10000,
        uniqueUsers: this.metrics.usage.uniqueUsers.size,
        errorRate: Math.round(this.metrics.errors.errorRate * 10000) / 100
      },
      usage: {
        toolUsage: Object.fromEntries(this.metrics.usage.toolUsage),
        analysisTypes: Object.fromEntries(this.metrics.business.analysisTypes),
        departmentUsage: Object.fromEntries(this.metrics.business.departmentUsage)
      },
      performance: {
        responseTimeDistribution: {
          fast: this.metrics.performance.fastRequests,
          medium: this.metrics.performance.mediumRequests,
          slow: this.metrics.performance.slowRequests,
          timeout: this.metrics.performance.timeoutRequests
        },
        averageTokensPerSecond: Math.round(this.metrics.performance.averageTokensPerSecond)
      },
      quality: {
        distribution: this.metrics.quality.qualityDistribution,
        averageScore: this.metrics.quality.averageScore,
        feedbackCount: this.metrics.quality.feedbackCount
      },
      trends: {
        hourlyUsage: this.metrics.business.timeOfDayUsage,
        weeklyUsage: this.metrics.business.dayOfWeekUsage,
        monthlyTrends: Object.fromEntries(this.metrics.business.monthlyTrends)
      },
      errors: {
        totalErrors: this.metrics.errors.totalErrors,
        errorTypes: Object.fromEntries(this.metrics.errors.errorTypes),
        errorRate: this.metrics.errors.errorRate,
        lastError: this.metrics.errors.lastError
      },
      generatedAt: new Date().toISOString(),
      timeRange: timeRange
    };

    if (includeTimeSeries) {
      report.timeSeries = this.getTimeSeriesData(timeRange);
    }

    return report;
  }

  /**
   * Get usage statistics for monitoring
   */
  getUsageStats() {
    return {
      current: {
        requests: this.metrics.usage.totalRequests,
        successRate: this.calculateSuccessRate(),
        averageResponseTime: this.metrics.usage.averageResponseTime,
        qualityScore: this.metrics.quality.averageScore,
        errorRate: this.metrics.errors.errorRate
      },
      recent: this.getRecentStats(),
      trending: this.getTrendingAnalysis(),
      alerts: this.generateAlerts()
    };
  }

  /**
   * Calculate success rate
   */
  calculateSuccessRate() {
    if (this.metrics.usage.totalRequests === 0) return 0;
    return (this.metrics.usage.successfulRequests / this.metrics.usage.totalRequests) * 100;
  }

  /**
   * Get recent statistics (last hour)
   */
  getRecentStats() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentExecutions = this.getTimeSeriesData('1h');
    
    return {
      requests: recentExecutions.length,
      averageResponseTime: this.calculateAverageFromTimeSeries(recentExecutions, 'executionTime'),
      errorCount: recentExecutions.filter(e => e.status === 'failed').length
    };
  }

  /**
   * Get trending analysis
   */
  getTrendingAnalysis() {
    return {
      popularTools: this.getTopItems(this.metrics.usage.toolUsage, 5),
      popularAnalysisTypes: this.getTopItems(this.metrics.business.analysisTypes, 5),
      peakUsageHours: this.getPeakUsageHours(),
      growthRate: this.calculateGrowthRate()
    };
  }

  /**
   * Generate alerts based on metrics
   */
  generateAlerts() {
    const alerts = [];

    // High error rate alert
    if (this.metrics.errors.errorRate > 0.1) { // 10% error rate
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `High error rate detected: ${(this.metrics.errors.errorRate * 100).toFixed(1)}%`,
        threshold: 10,
        current: this.metrics.errors.errorRate * 100
      });
    }

    // Slow response time alert
    if (this.metrics.usage.averageResponseTime > this.config.performanceThreshold) {
      alerts.push({
        type: 'performance',
        severity: 'medium',
        message: `Average response time exceeds threshold: ${Math.round(this.metrics.usage.averageResponseTime)}ms`,
        threshold: this.config.performanceThreshold,
        current: this.metrics.usage.averageResponseTime
      });
    }

    // Low quality score alert
    if (this.metrics.quality.averageScore < this.config.qualityThreshold) {
      alerts.push({
        type: 'quality',
        severity: 'medium',
        message: `Quality score below threshold: ${this.metrics.quality.averageScore.toFixed(2)}`,
        threshold: this.config.qualityThreshold,
        current: this.metrics.quality.averageScore
      });
    }

    return alerts;
  }

  // Helper methods
  getTopItems(map, count) {
    return Array.from(map.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([key, value]) => ({ name: key, count: value }));
  }

  getPeakUsageHours() {
    return this.metrics.business.timeOfDayUsage
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  calculateGrowthRate() {
    // Simplified growth rate calculation
    const recentTrends = Array.from(this.metrics.business.monthlyTrends.values());
    if (recentTrends.length < 2) return 0;
    
    const latest = recentTrends[recentTrends.length - 1];
    const previous = recentTrends[recentTrends.length - 2];
    
    return previous > 0 ? ((latest - previous) / previous) * 100 : 0;
  }

  calculateAverageFromTimeSeries(data, field) {
    const values = data.filter(d => d[field]).map(d => d[field]);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  // Time series methods
  initializeTimeSeriesCollectors() {
    this.timeSeries.set('executions', []);
    this.timeSeries.set('quality', []);
    this.timeSeries.set('performance', []);
    this.timeSeries.set('errors', []);
  }

  addToTimeSeries(series, data) {
    const seriesData = this.timeSeries.get(series) || [];
    seriesData.push(data);
    
    // Keep only recent data (within retention period)
    const cutoff = Date.now() - this.config.retentionPeriod;
    const filtered = seriesData.filter(d => d.timestamp > cutoff);
    
    this.timeSeries.set(series, filtered);
  }

  getTimeSeriesData(timeRange) {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const duration = ranges[timeRange] || ranges['24h'];
    const cutoff = Date.now() - duration;

    const result = {};
    for (const [series, data] of this.timeSeries) {
      result[series] = data.filter(d => d.timestamp > cutoff);
    }

    return result;
  }

  startPeriodicAggregation() {
    setInterval(() => {
      this.performPeriodicAggregation();
    }, this.config.aggregationInterval);
  }

  performPeriodicAggregation() {
    // Aggregate and clean up old data
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    for (const [series, data] of this.timeSeries) {
      const filtered = data.filter(d => d.timestamp > cutoff);
      this.timeSeries.set(series, filtered);
    }

    logger.debug('Periodic analytics aggregation completed');
  }

  setupMonitoring() {
    // Setup any additional monitoring hooks
    logger.debug('Analytics monitoring setup completed');
  }

  async loadHistoricalData() {
    // Load historical analytics data from storage
    // In a real implementation, load from database
    logger.debug('Historical analytics data loaded');
  }

  /**
   * Export analytics data
   */
  exportData(format = 'json') {
    const data = this.getAnalyticsReport({ includeTimeSeries: true });
    
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  convertToCSV(data) {
    // Simple CSV conversion for key metrics
    const metrics = [
      ['Metric', 'Value'],
      ['Total Requests', data.summary.totalRequests],
      ['Success Rate', `${data.summary.successRate}%`],
      ['Average Response Time', `${data.summary.averageResponseTime}ms`],
      ['Average Quality Score', data.summary.averageQualityScore],
      ['Total Cost', `$${data.summary.totalCost}`],
      ['Error Rate', `${data.summary.errorRate}%`]
    ];

    return metrics.map(row => row.join(',')).join('\n');
  }

  /**
   * Cleanup analytics data
   */
  cleanup() {
    this.cache.close();
    
    logger.info('Analytics cleanup completed', {
      totalRequests: this.metrics.usage.totalRequests,
      successRate: this.calculateSuccessRate().toFixed(1),
      averageQuality: this.metrics.quality.averageScore.toFixed(2)
    });
  }
}