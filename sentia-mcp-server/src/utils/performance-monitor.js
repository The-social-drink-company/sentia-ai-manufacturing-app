/**
 * Advanced Performance Monitoring System
 * 
 * Comprehensive performance monitoring with response time analysis,
 * memory leak detection, GC monitoring, and performance benchmarking
 * for the CapLiquify MCP Server.
 * 
 * Features:
 * - Response time percentile analysis (P50, P95, P99)
 * - Memory leak detection and alerts
 * - Garbage collection monitoring
 * - Database query performance tracking
 * - Network latency measurement
 * - Performance regression detection
 * - Automated optimization recommendations
 */

import { EventEmitter } from 'events';
import { performance, PerformanceObserver } from 'perf_hooks';
import v8 from 'v8';
import { createLogger } from './logger.js';
import { monitoring } from './monitoring.js';

const logger = createLogger();

/**
 * Advanced Performance Monitor
 */
export class PerformanceMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled !== false,
      responseTimeThresholds: {
        warning: config.warningThreshold || 1000, // 1 second
        critical: config.criticalThreshold || 5000 // 5 seconds
      },
      memoryThresholds: {
        warning: config.memoryWarning || 80, // 80%
        critical: config.memoryCritical || 95 // 95%
      },
      sampleRate: config.sampleRate || 1.0, // 100% sampling by default
      retentionMs: config.retentionMs || 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };

    // Performance tracking storage
    this.responseTimeSamples = [];
    this.memorySnapshots = [];
    this.gcEvents = [];
    this.performanceMarks = new Map();
    this.databaseQueries = [];
    this.networkRequests = [];
    
    // Performance baselines
    this.baselines = {
      responseTime: { p50: 0, p95: 0, p99: 0 },
      memoryUsage: { avg: 0, max: 0 },
      gcFrequency: { avg: 0 }
    };

    // Leak detection
    this.memoryLeakDetector = new MemoryLeakDetector(this.config);
    this.gcMonitor = new GCMonitor(this.config);
    
    this.initialize();
  }

  /**
   * Initialize performance monitoring
   */
  async initialize() {
    if (!this.config.enabled) {
      logger.info('Performance monitoring disabled');
      return;
    }

    try {
      // Setup performance observers
      this.setupPerformanceObservers();
      
      // Start monitoring processes
      this.startMemoryMonitoring();
      this.startPerformanceAnalysis();
      this.startLeakDetection();
      
      // Setup cleanup
      this.startCleanup();

      logger.info('Performance monitoring initialized successfully', {
        responseTimeThresholds: this.config.responseTimeThresholds,
        memoryThresholds: this.config.memoryThresholds,
        sampleRate: this.config.sampleRate
      });

      this.emit('performance:initialized');
    } catch (error) {
      logger.error('Failed to initialize performance monitoring', { error });
      throw error;
    }
  }

  /**
   * Setup Node.js performance observers
   */
  setupPerformanceObservers() {
    // HTTP request performance observer
    const httpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        this.recordHttpPerformance(entry);
      }
    });
    httpObserver.observe({ entryTypes: ['http'] });

    // DNS lookup performance observer
    const dnsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        this.recordNetworkPerformance('dns', entry);
      }
    });
    dnsObserver.observe({ entryTypes: ['dns'] });

    // Custom marks and measures observer
    const marksObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        this.recordCustomPerformance(entry);
      }
    });
    marksObserver.observe({ entryTypes: ['mark', 'measure'] });
  }

  /**
   * Record HTTP request performance
   */
  recordHttpPerformance(entry) {
    if (!this.shouldSample()) return;

    const perfData = {
      timestamp: Date.now(),
      duration: entry.duration,
      name: entry.name,
      type: 'http',
      url: entry.detail?.url,
      method: entry.detail?.method,
      statusCode: entry.detail?.statusCode
    };

    this.responseTimeSamples.push(perfData);
    
    // Check thresholds
    this.checkPerformanceThresholds('response_time', entry.duration);
    
    // Update monitoring metrics
    monitoring.setMetric('performance.http.response_time', entry.duration, {
      method: perfData.method || 'unknown',
      status_code: perfData.statusCode?.toString() || 'unknown'
    });

    this.emit('performance:http', perfData);
  }

  /**
   * Record network performance
   */
  recordNetworkPerformance(type, entry) {
    if (!this.shouldSample()) return;

    const perfData = {
      timestamp: Date.now(),
      duration: entry.duration,
      type: type,
      name: entry.name,
      detail: entry.detail
    };

    this.networkRequests.push(perfData);
    
    monitoring.setMetric(`performance.network.${type}`, entry.duration);
    
    this.emit('performance:network', perfData);
  }

  /**
   * Record custom performance marks/measures
   */
  recordCustomPerformance(entry) {
    const perfData = {
      timestamp: Date.now(),
      duration: entry.duration || 0,
      name: entry.name,
      type: entry.entryType,
      startTime: entry.startTime
    };

    if (entry.entryType === 'measure') {
      this.checkPerformanceThresholds('custom_operation', entry.duration);
      monitoring.setMetric('performance.custom.duration', entry.duration, {
        operation: entry.name
      });
    }

    this.emit('performance:custom', perfData);
  }

  /**
   * Start a performance measurement
   */
  startMeasurement(name, metadata = {}) {
    const markName = `${name}_start`;
    performance.mark(markName);
    
    this.performanceMarks.set(name, {
      startMark: markName,
      startTime: performance.now(),
      metadata
    });

    return name; // Return measurement ID
  }

  /**
   * End a performance measurement
   */
  endMeasurement(name, additionalMetadata = {}) {
    const measurement = this.performanceMarks.get(name);
    if (!measurement) {
      logger.warn('Measurement not found', { name });
      return null;
    }

    const endMarkName = `${name}_end`;
    performance.mark(endMarkName);
    
    const measureName = `${name}_duration`;
    performance.measure(measureName, measurement.startMark, endMarkName);
    
    const duration = performance.now() - measurement.startTime;
    
    // Clean up marks
    this.performanceMarks.delete(name);
    performance.clearMarks(measurement.startMark);
    performance.clearMarks(endMarkName);
    performance.clearMeasures(measureName);

    const result = {
      name,
      duration,
      metadata: { ...measurement.metadata, ...additionalMetadata },
      timestamp: Date.now()
    };

    this.emit('performance:measurement', result);
    return result;
  }

  /**
   * Measure async operation performance
   */
  async measureAsync(name, asyncFn, metadata = {}) {
    const measurementId = this.startMeasurement(name, metadata);
    
    try {
      const result = await asyncFn();
      this.endMeasurement(measurementId, { success: true });
      return result;
    } catch (error) {
      this.endMeasurement(measurementId, { success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(query, duration, metadata = {}) {
    if (!this.shouldSample()) return;

    const queryData = {
      timestamp: Date.now(),
      query: this.sanitizeQuery(query),
      duration,
      success: metadata.success !== false,
      database: metadata.database || 'default',
      operation: this.extractQueryOperation(query),
      rowCount: metadata.rowCount,
      error: metadata.error
    };

    this.databaseQueries.push(queryData);
    
    // Update metrics
    monitoring.setMetric('performance.database.query_time', duration, {
      operation: queryData.operation,
      database: queryData.database,
      success: queryData.success.toString()
    });

    // Check for slow queries
    if (duration > 1000) { // 1 second threshold
      this.emit('performance:slow_query', queryData);
    }

    this.emit('performance:database', queryData);
  }

  /**
   * Sanitize SQL query for logging (remove sensitive data)
   */
  sanitizeQuery(query) {
    if (typeof query !== 'string') return 'Non-string query';
    
    // Replace potential sensitive values with placeholders
    return query
      .replace(/('([^'\\]|\\.)*')/g, "'***'") // Replace string literals
      .replace(/(\d+)/g, 'N') // Replace numbers
      .substring(0, 200); // Limit length
  }

  /**
   * Extract operation type from SQL query
   */
  extractQueryOperation(query) {
    if (typeof query !== 'string') return 'unknown';
    
    const firstWord = query.trim().split(/\s+/)[0]?.toLowerCase();
    return ['select', 'insert', 'update', 'delete', 'create', 'drop', 'alter'].includes(firstWord) 
      ? firstWord 
      : 'other';
  }

  /**
   * Calculate response time percentiles
   */
  calculateResponseTimePercentiles(samples = this.responseTimeSamples) {
    if (samples.length === 0) {
      return { p50: 0, p95: 0, p99: 0, count: 0 };
    }

    const durations = samples.map(s => s.duration).sort((a, b) => a - b);
    const len = durations.length;

    return {
      p50: durations[Math.floor(len * 0.5)],
      p95: durations[Math.floor(len * 0.95)],
      p99: durations[Math.floor(len * 0.99)],
      min: durations[0],
      max: durations[len - 1],
      avg: durations.reduce((a, b) => a + b, 0) / len,
      count: len
    };
  }

  /**
   * Calculate database performance metrics
   */
  calculateDatabaseMetrics(queries = this.databaseQueries) {
    if (queries.length === 0) {
      return { message: 'No database queries recorded' };
    }

    const durations = queries.map(q => q.duration).sort((a, b) => a - b);
    const successfulQueries = queries.filter(q => q.success);
    const operationStats = {};

    // Calculate per-operation statistics
    queries.forEach(query => {
      if (!operationStats[query.operation]) {
        operationStats[query.operation] = { count: 0, totalDuration: 0, errors: 0 };
      }
      
      const stats = operationStats[query.operation];
      stats.count++;
      stats.totalDuration += query.duration;
      if (!query.success) stats.errors++;
    });

    // Calculate averages
    Object.values(operationStats).forEach(stats => {
      stats.avgDuration = stats.totalDuration / stats.count;
      stats.errorRate = stats.errors / stats.count;
    });

    return {
      totalQueries: queries.length,
      successRate: successfulQueries.length / queries.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianDuration: durations[Math.floor(durations.length * 0.5)],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      slowQueries: queries.filter(q => q.duration > 1000).length,
      operationStats
    };
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    setInterval(() => {
      this.collectMemorySnapshot();
    }, 30000); // Every 30 seconds

    // Initial snapshot
    this.collectMemorySnapshot();
  }

  /**
   * Collect memory usage snapshot
   */
  collectMemorySnapshot() {
    const memUsage = process.memoryUsage();
    const timestamp = Date.now();
    
    const snapshot = {
      timestamp,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapUsedPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
    };

    this.memorySnapshots.push(snapshot);
    
    // Check memory thresholds
    this.checkPerformanceThresholds('memory_usage', snapshot.heapUsedPercent);
    
    // Update metrics
    monitoring.setMetric('performance.memory.heap_used_percent', snapshot.heapUsedPercent);
    monitoring.setMetric('performance.memory.heap_used_mb', snapshot.heapUsed / 1024 / 1024);
    monitoring.setMetric('performance.memory.rss_mb', snapshot.rss / 1024 / 1024);

    this.emit('performance:memory', snapshot);
  }

  /**
   * Check performance thresholds and emit alerts
   */
  checkPerformanceThresholds(metricType, value) {
    let thresholds;
    
    switch (metricType) {
      case 'response_time':
      case 'custom_operation':
        thresholds = this.config.responseTimeThresholds;
        break;
      case 'memory_usage':
        thresholds = this.config.memoryThresholds;
        break;
      default:
        return;
    }

    if (value > thresholds.critical) {
      this.emit('performance:alert', {
        type: metricType,
        level: 'critical',
        value,
        threshold: thresholds.critical,
        timestamp: Date.now()
      });
    } else if (value > thresholds.warning) {
      this.emit('performance:alert', {
        type: metricType,
        level: 'warning',
        value,
        threshold: thresholds.warning,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Start performance analysis
   */
  startPerformanceAnalysis() {
    // Analyze performance every 5 minutes
    setInterval(() => {
      this.analyzePerformanceTrends();
    }, 5 * 60 * 1000);

    // Initial analysis after 1 minute
    setTimeout(() => {
      this.analyzePerformanceTrends();
    }, 60000);
  }

  /**
   * Analyze performance trends and detect regressions
   */
  analyzePerformanceTrends() {
    try {
      const responseTimeMetrics = this.calculateResponseTimePercentiles();
      const databaseMetrics = this.calculateDatabaseMetrics();
      const memoryTrend = this.analyzeMemoryTrend();

      // Update baselines if this is first analysis or significant time has passed
      if (this.shouldUpdateBaselines()) {
        this.updateBaselines(responseTimeMetrics, databaseMetrics, memoryTrend);
      }

      // Detect performance regressions
      const regressions = this.detectPerformanceRegressions(responseTimeMetrics, databaseMetrics);
      
      if (regressions.length > 0) {
        this.emit('performance:regression', regressions);
      }

      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations(
        responseTimeMetrics, 
        databaseMetrics, 
        memoryTrend
      );

      this.emit('performance:analysis', {
        responseTime: responseTimeMetrics,
        database: databaseMetrics,
        memory: memoryTrend,
        regressions,
        recommendations,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Performance analysis failed', { error });
    }
  }

  /**
   * Analyze memory usage trends
   */
  analyzeMemoryTrend() {
    if (this.memorySnapshots.length < 2) {
      return { trend: 'insufficient_data', samples: this.memorySnapshots.length };
    }

    const recent = this.memorySnapshots.slice(-10); // Last 10 snapshots
    const heapValues = recent.map(s => s.heapUsed);
    
    // Calculate trend
    const firstValue = heapValues[0];
    const lastValue = heapValues[heapValues.length - 1];
    const percentChange = ((lastValue - firstValue) / firstValue) * 100;
    
    let trend = 'stable';
    if (percentChange > 10) trend = 'increasing';
    else if (percentChange < -10) trend = 'decreasing';

    return {
      trend,
      percentChange,
      current: recent[recent.length - 1].heapUsedPercent,
      average: heapValues.reduce((a, b) => a + b, 0) / heapValues.length,
      samples: recent.length
    };
  }

  /**
   * Detect performance regressions
   */
  detectPerformanceRegressions(responseTimeMetrics, databaseMetrics) {
    const regressions = [];

    // Check response time regression
    if (this.baselines.responseTime.p95 > 0) {
      const regressionThreshold = this.baselines.responseTime.p95 * 1.5; // 50% increase
      if (responseTimeMetrics.p95 > regressionThreshold) {
        regressions.push({
          type: 'response_time',
          metric: 'p95',
          current: responseTimeMetrics.p95,
          baseline: this.baselines.responseTime.p95,
          regression: ((responseTimeMetrics.p95 - this.baselines.responseTime.p95) / this.baselines.responseTime.p95) * 100
        });
      }
    }

    // Check database performance regression
    if (databaseMetrics.avgDuration && this.baselines.databasePerformance?.avgDuration > 0) {
      const dbRegressionThreshold = this.baselines.databasePerformance.avgDuration * 1.3; // 30% increase
      if (databaseMetrics.avgDuration > dbRegressionThreshold) {
        regressions.push({
          type: 'database_performance',
          metric: 'avg_duration',
          current: databaseMetrics.avgDuration,
          baseline: this.baselines.databasePerformance.avgDuration,
          regression: ((databaseMetrics.avgDuration - this.baselines.databasePerformance.avgDuration) / this.baselines.databasePerformance.avgDuration) * 100
        });
      }
    }

    return regressions;
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(responseTimeMetrics, databaseMetrics, memoryTrend) {
    const recommendations = [];

    // Response time recommendations
    if (responseTimeMetrics.p95 > 2000) { // 2 seconds
      recommendations.push({
        type: 'response_time',
        priority: 'high',
        message: 'High response times detected. Consider implementing caching or optimizing slow operations.',
        metrics: { p95: responseTimeMetrics.p95 }
      });
    }

    // Database performance recommendations
    if (databaseMetrics.slowQueries > 0) {
      recommendations.push({
        type: 'database',
        priority: 'medium',
        message: `${databaseMetrics.slowQueries} slow database queries detected. Review query performance and add indexes.`,
        metrics: { slowQueries: databaseMetrics.slowQueries }
      });
    }

    // Memory usage recommendations
    if (memoryTrend.trend === 'increasing' && memoryTrend.percentChange > 20) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Memory usage is consistently increasing. Potential memory leak detected.',
        metrics: { trendPercent: memoryTrend.percentChange }
      });
    }

    return recommendations;
  }

  /**
   * Check if baselines should be updated
   */
  shouldUpdateBaselines() {
    // Update baselines every 24 hours or if they haven't been set
    const lastUpdate = this.baselines.lastUpdate || 0;
    const updateInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    return (Date.now() - lastUpdate) > updateInterval;
  }

  /**
   * Update performance baselines
   */
  updateBaselines(responseTimeMetrics, databaseMetrics, memoryTrend) {
    this.baselines = {
      responseTime: {
        p50: responseTimeMetrics.p50,
        p95: responseTimeMetrics.p95,
        p99: responseTimeMetrics.p99
      },
      databasePerformance: {
        avgDuration: databaseMetrics.avgDuration || 0,
        successRate: databaseMetrics.successRate || 1
      },
      memoryUsage: {
        avg: memoryTrend.average || 0,
        current: memoryTrend.current || 0
      },
      lastUpdate: Date.now()
    };

    logger.info('Performance baselines updated', this.baselines);
  }

  /**
   * Start leak detection
   */
  startLeakDetection() {
    this.memoryLeakDetector.start();
    this.gcMonitor.start();
  }

  /**
   * Start cleanup processes
   */
  startCleanup() {
    // Clean up old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up old performance data
   */
  cleanupOldData() {
    const cutoff = Date.now() - this.config.retentionMs;

    // Clean up response time samples
    this.responseTimeSamples = this.responseTimeSamples.filter(s => s.timestamp > cutoff);
    
    // Clean up memory snapshots
    this.memorySnapshots = this.memorySnapshots.filter(s => s.timestamp > cutoff);
    
    // Clean up database queries
    this.databaseQueries = this.databaseQueries.filter(q => q.timestamp > cutoff);
    
    // Clean up network requests
    this.networkRequests = this.networkRequests.filter(r => r.timestamp > cutoff);

    logger.debug('Performance data cleanup completed', {
      responseTimeSamples: this.responseTimeSamples.length,
      memorySnapshots: this.memorySnapshots.length,
      databaseQueries: this.databaseQueries.length,
      networkRequests: this.networkRequests.length
    });
  }

  /**
   * Check if we should sample this request
   */
  shouldSample() {
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      responseTime: this.calculateResponseTimePercentiles(),
      database: this.calculateDatabaseMetrics(),
      memory: this.analyzeMemoryTrend(),
      baselines: this.baselines,
      sampleCounts: {
        responseTime: this.responseTimeSamples.length,
        memory: this.memorySnapshots.length,
        database: this.databaseQueries.length,
        network: this.networkRequests.length
      },
      config: this.config
    };
  }
}

/**
 * Memory Leak Detector
 */
class MemoryLeakDetector {
  constructor(config) {
    this.config = config;
    this.logger = createLogger();
    this.snapshots = [];
    this.isDetecting = false;
  }

  start() {
    if (this.isDetecting) return;
    
    this.isDetecting = true;
    
    // Take memory snapshots every 10 minutes for leak detection
    setInterval(() => {
      this.takeSnapshot();
    }, 10 * 60 * 1000);

    this.logger.info('Memory leak detector started');
  }

  takeSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      heapStatistics: this.getHeapStatistics()
    };

    this.snapshots.push(snapshot);
    
    // Keep only last 24 snapshots (4 hours of data)
    if (this.snapshots.length > 24) {
      this.snapshots = this.snapshots.slice(-24);
    }

    // Analyze for leaks
    if (this.snapshots.length >= 6) { // Need at least 1 hour of data
      this.analyzeLeak();
    }
  }

  getHeapStatistics() {
    try {
      return v8.getHeapStatistics();
    } catch (error) {
      return null;
    }
  }

  analyzeLeak() {
    const recentSnapshots = this.snapshots.slice(-6); // Last hour
    const heapGrowth = this.calculateHeapGrowth(recentSnapshots);
    
    if (heapGrowth.isLeaking) {
      this.logger.warn('Potential memory leak detected', {
        growthRate: heapGrowth.growthRate,
        totalIncrease: heapGrowth.totalIncrease,
        timespan: heapGrowth.timespan
      });
    }
  }

  calculateHeapGrowth(snapshots) {
    if (snapshots.length < 2) return { isLeaking: false };

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    
    const heapIncrease = last.memoryUsage.heapUsed - first.memoryUsage.heapUsed;
    const timespan = last.timestamp - first.timestamp;
    const growthRate = heapIncrease / timespan * 1000 * 60; // bytes per minute

    // Consider it a leak if heap grows more than 1MB per minute consistently
    const isLeaking = growthRate > 1024 * 1024 && heapIncrease > 10 * 1024 * 1024;

    return {
      isLeaking,
      growthRate,
      totalIncrease: heapIncrease,
      timespan
    };
  }
}

/**
 * Garbage Collection Monitor
 */
class GCMonitor {
  constructor(config) {
    this.config = config;
    this.logger = createLogger();
    this.gcEvents = [];
    this.observer = null;
  }

  start() {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.recordGCEvent(entry);
        }
      });
      
      this.observer.observe({ entryTypes: ['gc'] });
      this.logger.info('GC monitoring started');
    } catch (error) {
      this.logger.warn('GC monitoring not available', { error: error.message });
    }
  }

  recordGCEvent(entry) {
    const gcEvent = {
      timestamp: Date.now(),
      duration: entry.duration,
      kind: entry.detail?.kind,
      flags: entry.detail?.flags
    };

    this.gcEvents.push(gcEvent);
    
    // Keep only recent events
    if (this.gcEvents.length > 1000) {
      this.gcEvents = this.gcEvents.slice(-1000);
    }

    // Log long GC pauses
    if (entry.duration > 100) { // 100ms
      this.logger.warn('Long GC pause detected', {
        duration: entry.duration,
        kind: entry.detail?.kind
      });
    }

    monitoring.setMetric('performance.gc.duration', entry.duration, {
      kind: entry.detail?.kind?.toString() || 'unknown'
    });
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export const {
  startMeasurement,
  endMeasurement,
  measureAsync,
  recordDatabaseQuery,
  calculateResponseTimePercentiles,
  getPerformanceSummary
} = performanceMonitor;