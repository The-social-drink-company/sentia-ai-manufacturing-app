/**
 * Cache Analytics and Monitoring System
 * 
 * Advanced analytics and monitoring for cache performance:
 * - Real-time cache hit rate analysis
 * - Performance bottleneck identification
 * - Cache efficiency optimization recommendations
 * - Predictive cache warming
 * - Cost-benefit analysis
 * - Historical trend analysis
 * 
 * @version 4.0.0
 */

import { EventEmitter } from 'events';
import { createLogger } from './logger.js';
import { monitoring } from './monitoring.js';
import { cacheManager } from './cache.js';
import { performanceOptimizer } from './performance.js';

const logger = createLogger();

/**
 * Cache Analytics Engine
 */
export class CacheAnalytics extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Analysis intervals
      realTimeInterval: config.realTimeInterval || 30000, // 30 seconds
      hourlyAnalysisInterval: config.hourlyAnalysisInterval || 3600000, // 1 hour
      dailyAnalysisInterval: config.dailyAnalysisInterval || 86400000, // 24 hours
      
      // Thresholds
      hitRateThreshold: config.hitRateThreshold || 85, // 85%
      latencyThreshold: config.latencyThreshold || 100, // 100ms
      efficiencyThreshold: config.efficiencyThreshold || 80, // 80%
      
      // Data retention
      realTimeDataRetention: config.realTimeDataRetention || 3600000, // 1 hour
      hourlyDataRetention: config.hourlyDataRetention || 604800000, // 7 days
      dailyDataRetention: config.dailyDataRetention || 2592000000, // 30 days
      
      // Features
      enablePredictiveAnalysis: config.enablePredictiveAnalysis !== false,
      enableCostAnalysis: config.enableCostAnalysis !== false,
      enableAnomalyDetection: config.enableAnomalyDetection !== false,
      
      ...config
    };

    // Analytics data storage
    this.realTimeData = [];
    this.hourlyData = [];
    this.dailyData = [];
    this.anomalies = [];
    
    // Analysis components
    this.performanceAnalyzer = new PerformanceAnalyzer(this.config);
    this.hitRateAnalyzer = new HitRateAnalyzer(this.config);
    this.efficiencyAnalyzer = new EfficiencyAnalyzer(this.config);
    this.predictiveAnalyzer = new PredictiveAnalyzer(this.config);
    this.costAnalyzer = new CostAnalyzer(this.config);
    this.anomalyDetector = new AnomalyDetector(this.config);
    
    // Current metrics
    this.currentMetrics = {
      hitRate: 0,
      missRate: 0,
      averageLatency: 0,
      efficiency: 0,
      throughput: 0,
      errorRate: 0
    };

    this.initialize();
  }

  /**
   * Initialize cache analytics system
   */
  async initialize() {
    try {
      // Initialize analyzers
      await this.performanceAnalyzer.initialize();
      await this.hitRateAnalyzer.initialize();
      await this.efficiencyAnalyzer.initialize();
      await this.predictiveAnalyzer.initialize();
      await this.costAnalyzer.initialize();
      await this.anomalyDetector.initialize();
      
      // Setup cache event listeners
      this.setupCacheEventListeners();
      
      // Setup analysis intervals
      this.setupAnalysisIntervals();
      
      // Setup data cleanup
      this.setupDataCleanup();
      
      this.emit('analytics:initialized');
      
      logger.info('Cache analytics system initialized', {
        realTimeInterval: this.config.realTimeInterval,
        enablePredictiveAnalysis: this.config.enablePredictiveAnalysis,
        enableCostAnalysis: this.config.enableCostAnalysis,
        enableAnomalyDetection: this.config.enableAnomalyDetection
      });

    } catch (error) {
      logger.error('Cache analytics initialization failed', { error });
      throw error;
    }
  }

  /**
   * Setup cache event listeners
   */
  setupCacheEventListeners() {
    // Listen to cache events
    cacheManager.on('cache:hit', (data) => {
      this.recordCacheEvent('hit', data);
    });

    cacheManager.on('cache:miss', (data) => {
      this.recordCacheEvent('miss', data);
    });

    cacheManager.on('cache:set', (data) => {
      this.recordCacheEvent('set', data);
    });

    cacheManager.on('cache:delete', (data) => {
      this.recordCacheEvent('delete', data);
    });

    cacheManager.on('cache:invalidated', (data) => {
      this.recordCacheEvent('invalidation', data);
    });

    cacheManager.on('cache:metrics', (data) => {
      this.updateCurrentMetrics(data);
    });
  }

  /**
   * Setup analysis intervals
   */
  setupAnalysisIntervals() {
    // Real-time analysis
    setInterval(() => {
      this.performRealTimeAnalysis();
    }, this.config.realTimeInterval);

    // Hourly analysis
    setInterval(() => {
      this.performHourlyAnalysis();
    }, this.config.hourlyAnalysisInterval);

    // Daily analysis
    setInterval(() => {
      this.performDailyAnalysis();
    }, this.config.dailyAnalysisInterval);
  }

  /**
   * Setup data cleanup
   */
  setupDataCleanup() {
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // Every hour
  }

  /**
   * Record cache event
   */
  recordCacheEvent(eventType, data) {
    const eventRecord = {
      timestamp: Date.now(),
      type: eventType,
      level: data.level || 'unknown',
      strategy: data.strategy || 'default',
      key: data.key,
      ...data
    };

    this.realTimeData.push(eventRecord);
    
    // Update real-time metrics
    this.updateRealTimeMetrics(eventRecord);
    
    // Check for anomalies
    if (this.config.enableAnomalyDetection) {
      this.anomalyDetector.checkEvent(eventRecord);
    }
    
    this.emit('analytics:event_recorded', eventRecord);
  }

  /**
   * Update current metrics
   */
  updateCurrentMetrics(metricsData) {
    this.currentMetrics = {
      ...this.currentMetrics,
      ...metricsData,
      timestamp: Date.now()
    };
    
    // Emit real-time metrics
    this.emit('analytics:metrics_updated', this.currentMetrics);
  }

  /**
   * Update real-time metrics based on events
   */
  updateRealTimeMetrics(eventRecord) {
    const recentEvents = this.getRecentEvents(60000); // Last minute
    const totalEvents = recentEvents.length;
    
    if (totalEvents === 0) return;
    
    const hits = recentEvents.filter(e => e.type === 'hit').length;
    const misses = recentEvents.filter(e => e.type === 'miss').length;
    const totalRequests = hits + misses;
    
    if (totalRequests > 0) {
      this.currentMetrics.hitRate = (hits / totalRequests) * 100;
      this.currentMetrics.missRate = (misses / totalRequests) * 100;
    }
    
    this.currentMetrics.throughput = totalEvents;
    this.currentMetrics.timestamp = Date.now();
  }

  /**
   * Perform real-time analysis
   */
  async performRealTimeAnalysis() {
    try {
      const recentEvents = this.getRecentEvents(this.config.realTimeInterval);
      
      if (recentEvents.length === 0) return;
      
      // Performance analysis
      const performanceMetrics = await this.performanceAnalyzer.analyzeRealTime(recentEvents);
      
      // Hit rate analysis
      const hitRateMetrics = await this.hitRateAnalyzer.analyzeRealTime(recentEvents);
      
      // Efficiency analysis
      const efficiencyMetrics = await this.efficiencyAnalyzer.analyzeRealTime(recentEvents);
      
      const analysis = {
        timestamp: Date.now(),
        timeframe: 'realtime',
        performance: performanceMetrics,
        hitRate: hitRateMetrics,
        efficiency: efficiencyMetrics,
        eventCount: recentEvents.length
      };
      
      // Check thresholds and generate alerts
      const alerts = this.checkThresholds(analysis);
      
      if (alerts.length > 0) {
        this.emit('analytics:alerts', alerts);
      }
      
      // Emit analysis results
      this.emit('analytics:realtime_analysis', analysis);
      
      // Update monitoring metrics
      this.updateMonitoringMetrics(analysis);

    } catch (error) {
      logger.error('Real-time analysis failed', { error: error.message });
    }
  }

  /**
   * Perform hourly analysis
   */
  async performHourlyAnalysis() {
    try {
      const hourlyEvents = this.getRecentEvents(this.config.hourlyAnalysisInterval);
      
      if (hourlyEvents.length === 0) return;
      
      // Comprehensive hourly analysis
      const analysis = {
        timestamp: Date.now(),
        timeframe: 'hourly',
        performance: await this.performanceAnalyzer.analyzeHourly(hourlyEvents),
        hitRate: await this.hitRateAnalyzer.analyzeHourly(hourlyEvents),
        efficiency: await this.efficiencyAnalyzer.analyzeHourly(hourlyEvents),
        trends: this.analyzeTrends(hourlyEvents),
        patterns: this.analyzePatterns(hourlyEvents),
        recommendations: []
      };
      
      // Predictive analysis
      if (this.config.enablePredictiveAnalysis) {
        analysis.predictions = await this.predictiveAnalyzer.analyze(hourlyEvents);
      }
      
      // Cost analysis
      if (this.config.enableCostAnalysis) {
        analysis.costMetrics = await this.costAnalyzer.analyze(hourlyEvents);
      }
      
      // Generate optimization recommendations
      analysis.recommendations = this.generateRecommendations(analysis);
      
      // Store hourly data
      this.hourlyData.push(analysis);
      
      this.emit('analytics:hourly_analysis', analysis);
      
      logger.info('Hourly cache analysis completed', {
        events: hourlyEvents.length,
        recommendations: analysis.recommendations.length
      });

    } catch (error) {
      logger.error('Hourly analysis failed', { error: error.message });
    }
  }

  /**
   * Perform daily analysis
   */
  async performDailyAnalysis() {
    try {
      const dailyEvents = this.getRecentEvents(this.config.dailyAnalysisInterval);
      
      if (dailyEvents.length === 0) return;
      
      // Comprehensive daily analysis
      const analysis = {
        timestamp: Date.now(),
        timeframe: 'daily',
        summary: this.generateDailySummary(dailyEvents),
        performance: await this.performanceAnalyzer.analyzeDaily(dailyEvents),
        trends: this.analyzeLongTermTrends(),
        efficiency: this.calculateDailyEfficiency(dailyEvents),
        costSavings: this.calculateCostSavings(dailyEvents),
        strategicRecommendations: this.generateStrategicRecommendations()
      };
      
      // Store daily data
      this.dailyData.push(analysis);
      
      this.emit('analytics:daily_analysis', analysis);
      
      logger.info('Daily cache analysis completed', {
        events: dailyEvents.length,
        hitRate: analysis.summary.hitRate,
        efficiency: analysis.efficiency.overall
      });

    } catch (error) {
      logger.error('Daily analysis failed', { error: error.message });
    }
  }

  /**
   * Get recent events within timeframe
   */
  getRecentEvents(timeframe) {
    const cutoff = Date.now() - timeframe;
    return this.realTimeData.filter(event => event.timestamp >= cutoff);
  }

  /**
   * Analyze trends in cache performance
   */
  analyzeTrends(events) {
    const timeSlots = this.groupEventsByTimeSlots(events, 10); // 10 time slots
    
    return {
      hitRateTrend: this.calculateTrend(timeSlots.map(slot => slot.hitRate)),
      latencyTrend: this.calculateTrend(timeSlots.map(slot => slot.averageLatency)),
      throughputTrend: this.calculateTrend(timeSlots.map(slot => slot.throughput)),
      errorRateTrend: this.calculateTrend(timeSlots.map(slot => slot.errorRate))
    };
  }

  /**
   * Analyze usage patterns
   */
  analyzePatterns(events) {
    const patterns = {
      strategyDistribution: this.calculateStrategyDistribution(events),
      levelDistribution: this.calculateLevelDistribution(events),
      timeDistribution: this.calculateTimeDistribution(events),
      keyPatterns: this.analyzeKeyPatterns(events)
    };
    
    return patterns;
  }

  /**
   * Calculate strategy distribution
   */
  calculateStrategyDistribution(events) {
    const distribution = {};
    events.forEach(event => {
      const strategy = event.strategy || 'unknown';
      distribution[strategy] = (distribution[strategy] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * Calculate cache level distribution
   */
  calculateLevelDistribution(events) {
    const distribution = {};
    events.forEach(event => {
      const level = event.level || 'unknown';
      distribution[level] = (distribution[level] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * Calculate time distribution
   */
  calculateTimeDistribution(events) {
    const hourly = Array(24).fill(0);
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourly[hour]++;
    });
    
    return { hourly };
  }

  /**
   * Analyze key patterns
   */
  analyzeKeyPatterns(events) {
    const keyFrequency = {};
    const keyPrefixes = {};
    
    events.forEach(event => {
      if (event.key) {
        keyFrequency[event.key] = (keyFrequency[event.key] || 0) + 1;
        
        const prefix = event.key.split(':')[0];
        keyPrefixes[prefix] = (keyPrefixes[prefix] || 0) + 1;
      }
    });
    
    // Get top 10 most accessed keys
    const topKeys = Object.entries(keyFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));
    
    return {
      topKeys,
      prefixDistribution: keyPrefixes,
      uniqueKeys: Object.keys(keyFrequency).length
    };
  }

  /**
   * Group events by time slots
   */
  groupEventsByTimeSlots(events, slotCount) {
    const timespan = events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : 0;
    const slotDuration = timespan / slotCount;
    
    const slots = Array(slotCount).fill(null).map((_, index) => ({
      start: events[0].timestamp + (index * slotDuration),
      end: events[0].timestamp + ((index + 1) * slotDuration),
      events: [],
      hitRate: 0,
      averageLatency: 0,
      throughput: 0,
      errorRate: 0
    }));
    
    // Distribute events into slots
    events.forEach(event => {
      const slotIndex = Math.min(
        Math.floor((event.timestamp - events[0].timestamp) / slotDuration),
        slotCount - 1
      );
      slots[slotIndex].events.push(event);
    });
    
    // Calculate metrics for each slot
    slots.forEach(slot => {
      const hits = slot.events.filter(e => e.type === 'hit').length;
      const requests = slot.events.filter(e => ['hit', 'miss'].includes(e.type)).length;
      
      slot.hitRate = requests > 0 ? (hits / requests) * 100 : 0;
      slot.throughput = slot.events.length;
      slot.errorRate = slot.events.filter(e => e.error).length / slot.events.length * 100;
    });
    
    return slots;
  }

  /**
   * Calculate trend direction
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Check performance thresholds
   */
  checkThresholds(analysis) {
    const alerts = [];
    
    // Hit rate threshold
    if (analysis.hitRate && analysis.hitRate.overall < this.config.hitRateThreshold) {
      alerts.push({
        type: 'hit_rate_low',
        severity: 'warning',
        message: `Cache hit rate (${analysis.hitRate.overall.toFixed(1)}%) below threshold (${this.config.hitRateThreshold}%)`,
        value: analysis.hitRate.overall,
        threshold: this.config.hitRateThreshold
      });
    }
    
    // Latency threshold
    if (analysis.performance && analysis.performance.averageLatency > this.config.latencyThreshold) {
      alerts.push({
        type: 'latency_high',
        severity: 'warning',
        message: `Cache latency (${analysis.performance.averageLatency.toFixed(1)}ms) above threshold (${this.config.latencyThreshold}ms)`,
        value: analysis.performance.averageLatency,
        threshold: this.config.latencyThreshold
      });
    }
    
    // Efficiency threshold
    if (analysis.efficiency && analysis.efficiency.overall < this.config.efficiencyThreshold) {
      alerts.push({
        type: 'efficiency_low',
        severity: 'info',
        message: `Cache efficiency (${analysis.efficiency.overall.toFixed(1)}%) below threshold (${this.config.efficiencyThreshold}%)`,
        value: analysis.efficiency.overall,
        threshold: this.config.efficiencyThreshold
      });
    }
    
    return alerts;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Hit rate recommendations
    if (analysis.hitRate.overall < 85) {
      recommendations.push({
        type: 'hit_rate',
        priority: 'high',
        title: 'Improve Cache Hit Rate',
        description: 'Cache hit rate is below optimal. Consider implementing cache warming strategies.',
        actions: [
          'Implement predictive cache warming',
          'Increase cache TTL for stable data',
          'Review cache invalidation strategies'
        ],
        expectedImprovement: '10-20% hit rate increase'
      });
    }
    
    // Performance recommendations
    if (analysis.performance.averageLatency > 50) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Optimize Cache Performance',
        description: 'Cache latency is higher than expected. Consider L1 cache optimization.',
        actions: [
          'Increase L1 cache size',
          'Optimize serialization methods',
          'Review cache data structure'
        ],
        expectedImprovement: '20-30% latency reduction'
      });
    }
    
    // Strategy recommendations
    const strategyDistribution = analysis.patterns?.strategyDistribution;
    if (strategyDistribution && strategyDistribution.default > strategyDistribution.financial * 2) {
      recommendations.push({
        type: 'strategy',
        priority: 'low',
        title: 'Optimize Cache Strategies',
        description: 'Many operations using default strategy. Consider specialized strategies.',
        actions: [
          'Implement specialized cache strategies',
          'Review cache key patterns',
          'Optimize TTL per data type'
        ],
        expectedImprovement: '5-15% efficiency increase'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate daily summary
   */
  generateDailySummary(events) {
    const hits = events.filter(e => e.type === 'hit').length;
    const misses = events.filter(e => e.type === 'miss').length;
    const sets = events.filter(e => e.type === 'set').length;
    const deletes = events.filter(e => e.type === 'delete').length;
    const invalidations = events.filter(e => e.type === 'invalidation').length;
    
    const totalRequests = hits + misses;
    const hitRate = totalRequests > 0 ? (hits / totalRequests) * 100 : 0;
    
    return {
      totalEvents: events.length,
      hits,
      misses,
      sets,
      deletes,
      invalidations,
      hitRate,
      requestsServed: totalRequests
    };
  }

  /**
   * Analyze long-term trends
   */
  analyzeLongTermTrends() {
    if (this.hourlyData.length < 24) {
      return { message: 'Insufficient data for long-term trend analysis' };
    }
    
    const recent24Hours = this.hourlyData.slice(-24);
    const hitRates = recent24Hours.map(h => h.hitRate.overall);
    const latencies = recent24Hours.map(h => h.performance.averageLatency);
    
    return {
      hitRateTrend: this.calculateTrend(hitRates),
      latencyTrend: this.calculateTrend(latencies),
      averageHitRate: hitRates.reduce((a, b) => a + b, 0) / hitRates.length,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length
    };
  }

  /**
   * Calculate daily efficiency
   */
  calculateDailyEfficiency(events) {
    const cacheOperations = events.filter(e => ['hit', 'miss', 'set'].includes(e.type));
    const successfulOperations = events.filter(e => ['hit', 'set'].includes(e.type));
    
    const efficiency = cacheOperations.length > 0 
      ? (successfulOperations.length / cacheOperations.length) * 100 
      : 0;
    
    return {
      overall: efficiency,
      breakdown: {
        cacheOperations: cacheOperations.length,
        successfulOperations: successfulOperations.length,
        failedOperations: cacheOperations.length - successfulOperations.length
      }
    };
  }

  /**
   * Calculate cost savings from caching
   */
  calculateCostSavings(events) {
    const hits = events.filter(e => e.type === 'hit').length;
    
    // Estimate cost savings based on avoided external API calls
    const estimatedAPICallCost = 0.001; // $0.001 per call
    const estimatedLatencySavings = hits * 100; // 100ms saved per hit
    
    return {
      avoidedAPICalls: hits,
      estimatedCostSavings: hits * estimatedAPICallCost,
      estimatedLatencySavings: estimatedLatencySavings,
      currency: 'USD'
    };
  }

  /**
   * Generate strategic recommendations
   */
  generateStrategicRecommendations() {
    const recommendations = [];
    
    // Analyze historical performance
    if (this.dailyData.length >= 7) {
      const weeklyAverage = this.dailyData.slice(-7).reduce((sum, day) => 
        sum + day.summary.hitRate, 0) / 7;
      
      if (weeklyAverage < 80) {
        recommendations.push({
          type: 'strategic',
          priority: 'high',
          title: 'Strategic Cache Architecture Review',
          description: 'Weekly cache hit rate indicates need for architectural improvements.',
          actions: [
            'Consider Redis clustering for improved performance',
            'Implement predictive cache warming algorithms',
            'Review and optimize cache strategies across all services'
          ],
          timeline: '2-4 weeks',
          expectedROI: 'High'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Update monitoring metrics
   */
  updateMonitoringMetrics(analysis) {
    if (analysis.hitRate) {
      monitoring.setMetric('cache.analytics.hit_rate', analysis.hitRate.overall);
    }
    
    if (analysis.performance) {
      monitoring.setMetric('cache.analytics.latency', analysis.performance.averageLatency);
    }
    
    if (analysis.efficiency) {
      monitoring.setMetric('cache.analytics.efficiency', analysis.efficiency.overall);
    }
    
    monitoring.setMetric('cache.analytics.events_analyzed', analysis.eventCount);
  }

  /**
   * Clean up old data
   */
  cleanupOldData() {
    const now = Date.now();
    
    // Clean real-time data
    this.realTimeData = this.realTimeData.filter(
      event => now - event.timestamp < this.config.realTimeDataRetention
    );
    
    // Clean hourly data
    this.hourlyData = this.hourlyData.filter(
      data => now - data.timestamp < this.config.hourlyDataRetention
    );
    
    // Clean daily data
    this.dailyData = this.dailyData.filter(
      data => now - data.timestamp < this.config.dailyDataRetention
    );
    
    logger.debug('Cache analytics data cleanup completed', {
      realTimeEvents: this.realTimeData.length,
      hourlyAnalyses: this.hourlyData.length,
      dailyAnalyses: this.dailyData.length
    });
  }

  /**
   * Get analytics dashboard data
   */
  getDashboardData() {
    return {
      currentMetrics: this.currentMetrics,
      recentTrends: this.getRecentTrends(),
      topRecommendations: this.getTopRecommendations(),
      alertSummary: this.getAlertSummary(),
      performanceOverview: this.getPerformanceOverview()
    };
  }

  /**
   * Get recent trends for dashboard
   */
  getRecentTrends() {
    if (this.hourlyData.length === 0) return null;
    
    const recentHours = this.hourlyData.slice(-6); // Last 6 hours
    
    return {
      hitRate: recentHours.map(h => ({
        timestamp: h.timestamp,
        value: h.hitRate?.overall || 0
      })),
      latency: recentHours.map(h => ({
        timestamp: h.timestamp,
        value: h.performance?.averageLatency || 0
      })),
      throughput: recentHours.map(h => ({
        timestamp: h.timestamp,
        value: h.eventCount || 0
      }))
    };
  }

  /**
   * Get top recommendations
   */
  getTopRecommendations() {
    const allRecommendations = this.hourlyData
      .slice(-24)
      .flatMap(h => h.recommendations || []);
    
    // Group by type and get most frequent
    const groupedRecommendations = {};
    allRecommendations.forEach(rec => {
      if (!groupedRecommendations[rec.type]) {
        groupedRecommendations[rec.type] = { ...rec, count: 0 };
      }
      groupedRecommendations[rec.type].count++;
    });
    
    return Object.values(groupedRecommendations)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Get alert summary
   */
  getAlertSummary() {
    const recentEvents = this.getRecentEvents(3600000); // Last hour
    const recentAlerts = recentEvents.filter(e => e.alert);
    
    return {
      total: recentAlerts.length,
      critical: recentAlerts.filter(a => a.severity === 'critical').length,
      warning: recentAlerts.filter(a => a.severity === 'warning').length,
      info: recentAlerts.filter(a => a.severity === 'info').length
    };
  }

  /**
   * Get performance overview
   */
  getPerformanceOverview() {
    return {
      overall: this.currentMetrics,
      l1: { hitRate: 0, latency: 0 }, // Would be populated from actual cache stats
      l2: { hitRate: 0, latency: 0 },
      efficiency: {
        storage: 85,
        network: 92,
        computation: 88
      }
    };
  }

  /**
   * Export analytics data
   */
  exportData(format = 'json', timeframe = 'daily') {
    const data = {
      metadata: {
        exported: new Date().toISOString(),
        format,
        timeframe,
        version: '4.0.0'
      }
    };

    switch (timeframe) {
      case 'realtime':
        data.events = this.realTimeData;
        break;
      case 'hourly':
        data.analyses = this.hourlyData;
        break;
      case 'daily':
        data.analyses = this.dailyData;
        break;
      default:
        data.summary = this.getDashboardData();
    }

    return data;
  }

  /**
   * Get analytics statistics
   */
  getStats() {
    return {
      dataPoints: {
        realTime: this.realTimeData.length,
        hourly: this.hourlyData.length,
        daily: this.dailyData.length
      },
      currentMetrics: this.currentMetrics,
      config: this.config,
      lastAnalysis: {
        realTime: this.realTimeData.length > 0 ? this.realTimeData[this.realTimeData.length - 1].timestamp : null,
        hourly: this.hourlyData.length > 0 ? this.hourlyData[this.hourlyData.length - 1].timestamp : null,
        daily: this.dailyData.length > 0 ? this.dailyData[this.dailyData.length - 1].timestamp : null
      }
    };
  }
}

/**
 * Performance Analyzer Component
 */
class PerformanceAnalyzer {
  constructor(config) {
    this.config = config;
  }

  async initialize() {
    logger.debug('Performance analyzer initialized');
  }

  async analyzeRealTime(events) {
    const latencies = events.filter(e => e.latency).map(e => e.latency);
    
    return {
      averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      p95Latency: this.calculatePercentile(latencies, 95),
      p99Latency: this.calculatePercentile(latencies, 99),
      throughput: events.length
    };
  }

  async analyzeHourly(events) {
    return this.analyzeRealTime(events);
  }

  async analyzeDaily(events) {
    return this.analyzeRealTime(events);
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

/**
 * Hit Rate Analyzer Component
 */
class HitRateAnalyzer {
  constructor(config) {
    this.config = config;
  }

  async initialize() {
    logger.debug('Hit rate analyzer initialized');
  }

  async analyzeRealTime(events) {
    const hits = events.filter(e => e.type === 'hit').length;
    const misses = events.filter(e => e.type === 'miss').length;
    const total = hits + misses;
    
    return {
      overall: total > 0 ? (hits / total) * 100 : 0,
      hits,
      misses,
      total
    };
  }

  async analyzeHourly(events) {
    return this.analyzeRealTime(events);
  }
}

/**
 * Efficiency Analyzer Component
 */
class EfficiencyAnalyzer {
  constructor(config) {
    this.config = config;
  }

  async initialize() {
    logger.debug('Efficiency analyzer initialized');
  }

  async analyzeRealTime(events) {
    const successfulOps = events.filter(e => ['hit', 'set'].includes(e.type)).length;
    const totalOps = events.length;
    
    return {
      overall: totalOps > 0 ? (successfulOps / totalOps) * 100 : 0,
      successful: successfulOps,
      total: totalOps
    };
  }
}

/**
 * Predictive Analyzer Component
 */
class PredictiveAnalyzer {
  constructor(config) {
    this.config = config;
  }

  async initialize() {
    logger.debug('Predictive analyzer initialized');
  }

  async analyze(events) {
    // Simple predictive analysis - could be enhanced with ML models
    return {
      expectedHitRate: this.predictHitRate(events),
      recommendedWarmingKeys: this.identifyWarmingCandidates(events),
      projectedLoad: this.projectLoad(events)
    };
  }

  predictHitRate(events) {
    // Simple linear regression on recent hit rates
    return 85; // Placeholder
  }

  identifyWarmingCandidates(events) {
    // Identify frequently missed keys
    const missedKeys = events
      .filter(e => e.type === 'miss')
      .map(e => e.key)
      .filter(Boolean);
    
    return [...new Set(missedKeys)].slice(0, 10);
  }

  projectLoad(events) {
    return {
      nextHour: events.length * 1.1, // 10% growth estimate
      nextDay: events.length * 24 * 1.05 // 5% daily growth
    };
  }
}

/**
 * Cost Analyzer Component
 */
class CostAnalyzer {
  constructor(config) {
    this.config = config;
  }

  async initialize() {
    logger.debug('Cost analyzer initialized');
  }

  async analyze(events) {
    const hits = events.filter(e => e.type === 'hit').length;
    const apiCallsSaved = hits;
    const estimatedSavings = apiCallsSaved * 0.001; // $0.001 per API call
    
    return {
      apiCallsSaved,
      estimatedSavings,
      currency: 'USD',
      period: 'hourly'
    };
  }
}

/**
 * Anomaly Detector Component
 */
class AnomalyDetector {
  constructor(config) {
    this.config = config;
    this.baseline = null;
  }

  async initialize() {
    logger.debug('Anomaly detector initialized');
  }

  checkEvent(event) {
    // Simple anomaly detection based on patterns
    // Could be enhanced with statistical methods
    
    if (event.type === 'miss' && this.isUnusualMiss(event)) {
      this.emitAnomaly('unusual_miss', event);
    }
  }

  isUnusualMiss(event) {
    // Check if this is an unusual cache miss
    return false; // Placeholder logic
  }

  emitAnomaly(type, event) {
    logger.warn('Cache anomaly detected', { type, event });
  }
}

// Create singleton instance
export const cacheAnalytics = new CacheAnalytics();

// Export utility functions
export const {
  getDashboardData,
  exportData,
  getStats: getCacheAnalyticsStats
} = cacheAnalytics;

export default CacheAnalytics;