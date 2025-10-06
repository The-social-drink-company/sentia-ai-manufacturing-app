/**
 * Core Monitoring Infrastructure
 * 
 * Comprehensive monitoring system providing application monitoring,
 * business metrics, system metrics, and real-time dashboards
 * for the Sentia Manufacturing MCP Server.
 * 
 * Features:
 * - Application health monitoring
 * - Performance metrics collection
 * - Resource usage tracking
 * - Business intelligence metrics
 * - Real-time metric streaming
 * - Alert integration
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { cpus, freemem, totalmem, loadavg } from 'os';
import { createLogger } from './logger.js';
import { SERVER_CONFIG } from '../config/server-config.js';

const logger = createLogger();

/**
 * Core Monitoring System
 */
export class MonitoringSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled !== false,
      collectSystemMetrics: config.collectSystemMetrics !== false,
      collectToolMetrics: config.collectToolMetrics !== false,
      metricsRetentionMs: config.metricsRetentionMs || 7 * 24 * 60 * 60 * 1000, // 7 days
      aggregationIntervalMs: config.aggregationIntervalMs || 60000, // 1 minute
      alertThresholds: config.alertThresholds || {},
      ...config
    };

    // Metric storage
    this.metrics = new Map();
    this.timeSeries = new Map();
    this.aggregatedMetrics = new Map();
    
    // Performance tracking
    this.performanceCounters = new Map();
    this.requestTracking = new Map();
    
    // Health status
    this.healthStatus = {
      status: 'unknown',
      uptime: 0,
      lastCheck: null,
      dependencies: new Map(),
      issues: []
    };

    // Initialize monitoring
    this.initialize();
  }

  /**
   * Initialize the monitoring system
   */
  async initialize() {
    if (!this.config.enabled) {
      logger.info('Monitoring system disabled');
      return;
    }

    try {
      // Initialize core metrics
      this.initializeMetrics();
      
      // Start metric collection
      this.startMetricCollection();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start aggregation
      this.startAggregation();
      
      // Start cleanup
      this.startCleanup();

      logger.info('Monitoring system initialized successfully', {
        systemMetrics: this.config.collectSystemMetrics,
        toolMetrics: this.config.collectToolMetrics,
        retentionMs: this.config.metricsRetentionMs
      });

      this.emit('monitoring:initialized');
    } catch (error) {
      logger.error('Failed to initialize monitoring system', { error });
      throw error;
    }
  }

  /**
   * Initialize core metrics
   */
  initializeMetrics() {
    const timestamp = Date.now();
    
    // Application metrics
    this.setMetric('app.startup_time', timestamp);
    this.setMetric('app.version', SERVER_CONFIG.server.version);
    this.setMetric('app.environment', SERVER_CONFIG.server.environment);
    
    // Initialize counters
    this.setMetric('requests.total', 0);
    this.setMetric('requests.errors', 0);
    this.setMetric('tools.executed', 0);
    this.setMetric('tools.failed', 0);
    
    // Initialize gauges
    this.setMetric('connections.active', 0);
    this.setMetric('memory.heap_used', 0);
    this.setMetric('cpu.usage_percent', 0);
  }

  /**
   * Set a metric value
   */
  setMetric(name, value, labels = {}) {
    const timestamp = Date.now();
    const metricKey = this.getMetricKey(name, labels);
    
    // Store current value
    this.metrics.set(metricKey, {
      name,
      value,
      labels,
      timestamp,
      type: this.getMetricType(name)
    });

    // Store in time series
    if (!this.timeSeries.has(metricKey)) {
      this.timeSeries.set(metricKey, []);
    }
    
    const series = this.timeSeries.get(metricKey);
    series.push({ timestamp, value });
    
    // Limit time series size
    if (series.length > 10000) {
      series.splice(0, series.length - 10000);
    }

    // Emit metric event
    this.emit('metric:updated', { name, value, labels, timestamp });
    
    // Check for alerts
    this.checkAlerts(name, value, labels);
  }

  /**
   * Increment a counter metric
   */
  incrementMetric(name, increment = 1, labels = {}) {
    const metricKey = this.getMetricKey(name, labels);
    const current = this.metrics.get(metricKey);
    const newValue = (current?.value || 0) + increment;
    this.setMetric(name, newValue, labels);
  }

  /**
   * Get a metric value
   */
  getMetric(name, labels = {}) {
    const metricKey = this.getMetricKey(name, labels);
    return this.metrics.get(metricKey);
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const result = {};
    
    for (const [key, metric] of this.metrics) {
      const groupKey = metric.name;
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(metric);
    }
    
    return result;
  }

  /**
   * Get time series data for a metric
   */
  getTimeSeries(name, labels = {}, startTime = null, endTime = null) {
    const metricKey = this.getMetricKey(name, labels);
    const series = this.timeSeries.get(metricKey) || [];
    
    let filteredSeries = series;
    
    if (startTime || endTime) {
      filteredSeries = series.filter(point => {
        if (startTime && point.timestamp < startTime) return false;
        if (endTime && point.timestamp > endTime) return false;
        return true;
      });
    }
    
    return filteredSeries;
  }

  /**
   * Record request metrics
   */
  recordRequest(req, res, responseTime) {
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString()
    };

    // Increment counters
    this.incrementMetric('requests.total', 1, labels);
    
    if (res.statusCode >= 400) {
      this.incrementMetric('requests.errors', 1, labels);
    }

    // Record response time
    this.setMetric('requests.response_time', responseTime, labels);
    
    // Update aggregated metrics
    this.updateRequestAggregations(responseTime, res.statusCode);

    logger.debug('Request metrics recorded', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime
    });
  }

  /**
   * Record tool execution metrics
   */
  recordToolExecution(toolName, status, duration, metadata = {}) {
    const labels = {
      tool: toolName,
      status: status
    };

    // Increment counters
    this.incrementMetric('tools.executed', 1, labels);
    
    if (status === 'failed') {
      this.incrementMetric('tools.failed', 1, labels);
    }

    // Record execution time
    this.setMetric('tools.execution_time', duration, labels);
    
    // Record additional metrics
    if (metadata.integration) {
      this.incrementMetric('integrations.calls', 1, { 
        integration: metadata.integration,
        status: status 
      });
    }

    // Business metrics
    if (metadata.costUSD) {
      this.incrementMetric('business.api_cost_usd', metadata.costUSD, { 
        service: metadata.service || 'unknown'
      });
    }

    logger.debug('Tool execution metrics recorded', {
      toolName,
      status,
      duration,
      metadata
    });

    this.emit('tool:execution', { toolName, status, duration, metadata });
  }

  /**
   * Update request aggregations
   */
  updateRequestAggregations(responseTime, statusCode) {
    const now = Date.now();
    const minute = Math.floor(now / 60000) * 60000;
    
    // Get or create aggregation for this minute
    const key = `requests_${minute}`;
    let agg = this.aggregatedMetrics.get(key);
    
    if (!agg) {
      agg = {
        timestamp: minute,
        count: 0,
        errors: 0,
        totalResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        statusCodes: {}
      };
      this.aggregatedMetrics.set(key, agg);
    }
    
    // Update aggregation
    agg.count++;
    agg.totalResponseTime += responseTime;
    agg.minResponseTime = Math.min(agg.minResponseTime, responseTime);
    agg.maxResponseTime = Math.max(agg.maxResponseTime, responseTime);
    
    if (statusCode >= 400) {
      agg.errors++;
    }
    
    agg.statusCodes[statusCode] = (agg.statusCodes[statusCode] || 0) + 1;
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    if (!this.config.collectSystemMetrics) return;

    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.setMetric('memory.heap_used', memUsage.heapUsed);
      this.setMetric('memory.heap_total', memUsage.heapTotal);
      this.setMetric('memory.external', memUsage.external);
      this.setMetric('memory.rss', memUsage.rss);
      
      // System memory
      this.setMetric('system.memory.free', freemem());
      this.setMetric('system.memory.total', totalmem());
      this.setMetric('system.memory.usage_percent', ((totalmem() - freemem()) / totalmem()) * 100);

      // CPU metrics
      const cpuInfo = cpus();
      this.setMetric('system.cpu.count', cpuInfo.length);
      
      // Load average (Unix-like systems only)
      try {
        const load = loadavg();
        this.setMetric('system.load.1min', load[0]);
        this.setMetric('system.load.5min', load[1]);
        this.setMetric('system.load.15min', load[2]);
      } catch (error) {
        // Load average not available on this platform
      }

      // Process metrics
      this.setMetric('process.uptime', process.uptime());
      this.setMetric('process.pid', process.pid);
      
      // Event loop lag
      const start = performance.now();
      setImmediate(() => {
        const lag = performance.now() - start;
        this.setMetric('process.event_loop_lag', lag);
      });

    } catch (error) {
      logger.error('Failed to collect system metrics', { error });
    }
  }

  /**
   * Check alert thresholds
   */
  checkAlerts(metricName, value, labels = {}) {
    const thresholds = this.config.alertThresholds[metricName];
    if (!thresholds) return;

    for (const threshold of thresholds) {
      if (this.evaluateThreshold(value, threshold)) {
        this.emit('alert:triggered', {
          metric: metricName,
          value,
          labels,
          threshold,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Evaluate threshold condition
   */
  evaluateThreshold(value, threshold) {
    switch (threshold.operator) {
      case 'gt': return value > threshold.value;
      case 'gte': return value >= threshold.value;
      case 'lt': return value < threshold.value;
      case 'lte': return value <= threshold.value;
      case 'eq': return value === threshold.value;
      case 'ne': return value !== threshold.value;
      default: return false;
    }
  }

  /**
   * Update health status
   */
  async updateHealthStatus() {
    const startTime = performance.now();
    
    try {
      const healthChecks = await this.runHealthChecks();
      const issues = healthChecks.filter(check => !check.healthy);
      
      this.healthStatus = {
        status: issues.length === 0 ? 'healthy' : (issues.some(i => i.critical) ? 'critical' : 'degraded'),
        uptime: process.uptime(),
        lastCheck: new Date().toISOString(),
        dependencies: new Map(healthChecks.map(check => [check.name, check])),
        issues: issues.map(issue => ({
          component: issue.name,
          message: issue.error || issue.message,
          critical: issue.critical
        }))
      };

      // Record health metrics
      this.setMetric('health.status', this.healthStatus.status === 'healthy' ? 1 : 0);
      this.setMetric('health.issues_count', issues.length);
      this.setMetric('health.check_duration', performance.now() - startTime);

      this.emit('health:updated', this.healthStatus);

    } catch (error) {
      logger.error('Health check failed', { error });
      
      this.healthStatus = {
        status: 'critical',
        uptime: process.uptime(),
        lastCheck: new Date().toISOString(),
        dependencies: new Map(),
        issues: [{
          component: 'health_system',
          message: error.message,
          critical: true
        }]
      };
    }
  }

  /**
   * Run health checks for all dependencies
   */
  async runHealthChecks() {
    const checks = [
      this.checkMemoryUsage(),
      this.checkEventLoopLag(),
      this.checkDiskSpace(),
      this.checkDatabaseConnection(),
      this.checkExternalServices()
    ];

    const results = await Promise.allSettled(checks);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: `check_${index}`,
          healthy: false,
          critical: true,
          error: result.reason?.message || 'Unknown error',
          responseTime: 0
        };
      }
    });
  }

  /**
   * Check memory usage
   */
  async checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    return {
      name: 'memory',
      healthy: heapPercent < 90,
      critical: heapPercent > 95,
      value: heapPercent,
      unit: 'percent',
      message: `Heap usage: ${heapPercent.toFixed(1)}%`
    };
  }

  /**
   * Check event loop lag
   */
  async checkEventLoopLag() {
    return new Promise((resolve) => {
      const start = performance.now();
      setImmediate(() => {
        const lag = performance.now() - start;
        resolve({
          name: 'event_loop',
          healthy: lag < 100,
          critical: lag > 1000,
          value: lag,
          unit: 'ms',
          message: `Event loop lag: ${lag.toFixed(1)}ms`
        });
      });
    });
  }

  /**
   * Check disk space (basic check)
   */
  async checkDiskSpace() {
    // This is a simplified check - in production, you'd want to check actual disk usage
    return {
      name: 'disk_space',
      healthy: true,
      critical: false,
      message: 'Disk space check not implemented'
    };
  }

  /**
   * Check database connection
   */
  async checkDatabaseConnection() {
    try {
      // This would check the actual database connection
      // For now, we'll assume it's healthy if DATABASE_URL is configured
      const hasDbUrl = !!SERVER_CONFIG.database.url;
      
      return {
        name: 'database',
        healthy: hasDbUrl,
        critical: !hasDbUrl,
        message: hasDbUrl ? 'Database URL configured' : 'Database URL not configured'
      };
    } catch (error) {
      return {
        name: 'database',
        healthy: false,
        critical: true,
        error: error.message
      };
    }
  }

  /**
   * Check external services
   */
  async checkExternalServices() {
    // Check if external service credentials are configured
    const services = [
      'anthropic', 'openai', 'xero', 'shopify', 'amazon', 'unleashed'
    ];
    
    const healthyServices = services.filter(service => {
      const config = SERVER_CONFIG.integrations[service];
      return config && (config.apiKey || config.clientId);
    });

    return {
      name: 'external_services',
      healthy: healthyServices.length > 0,
      critical: healthyServices.length === 0,
      value: healthyServices.length,
      message: `${healthyServices.length}/${services.length} services configured`
    };
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    return this.healthStatus;
  }

  /**
   * Start metric collection intervals
   */
  startMetricCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Initial collection
    this.collectSystemMetrics();
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    // Health check every 60 seconds
    setInterval(() => {
      this.updateHealthStatus();
    }, 60000);

    // Initial health check
    setTimeout(() => this.updateHealthStatus(), 1000);
  }

  /**
   * Start metric aggregation
   */
  startAggregation() {
    setInterval(() => {
      this.aggregateMetrics();
    }, this.config.aggregationIntervalMs);
  }

  /**
   * Start cleanup processes
   */
  startCleanup() {
    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Aggregate metrics for efficient querying
   */
  aggregateMetrics() {
    // This is a simplified aggregation
    // In production, you'd want more sophisticated aggregation logic
    const now = Date.now();
    const currentMetrics = this.getAllMetrics();
    
    // Store hourly aggregations
    const hourKey = Math.floor(now / (60 * 60 * 1000));
    this.aggregatedMetrics.set(`hourly_${hourKey}`, {
      timestamp: hourKey * 60 * 60 * 1000,
      metrics: currentMetrics,
      aggregatedAt: now
    });
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics() {
    const cutoff = Date.now() - this.config.metricsRetentionMs;
    
    // Clean up time series data
    for (const [key, series] of this.timeSeries) {
      const filtered = series.filter(point => point.timestamp > cutoff);
      if (filtered.length !== series.length) {
        this.timeSeries.set(key, filtered);
      }
    }

    // Clean up aggregated metrics
    for (const [key, metric] of this.aggregatedMetrics) {
      if (metric.timestamp < cutoff) {
        this.aggregatedMetrics.delete(key);
      }
    }

    logger.debug('Metrics cleanup completed', {
      timeSeriesCount: this.timeSeries.size,
      aggregatedCount: this.aggregatedMetrics.size
    });
  }

  /**
   * Get metric key for storage
   */
  getMetricKey(name, labels = {}) {
    const labelStr = Object.keys(labels)
      .sort()
      .map(key => `${key}:${labels[key]}`)
      .join(',');
    
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Get metric type
   */
  getMetricType(name) {
    if (name.includes('.total') || name.includes('.count') || name.includes('.executed')) {
      return 'counter';
    }
    if (name.includes('.time') || name.includes('.duration') || name.includes('.lag')) {
      return 'histogram';
    }
    return 'gauge';
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics() {
    const lines = [];
    const metricGroups = this.getAllMetrics();

    for (const [metricName, metrics] of Object.entries(metricGroups)) {
      const firstMetric = metrics[0];
      const metricType = firstMetric.type;
      
      // Add metric type comment
      lines.push(`# TYPE ${metricName} ${metricType}`);
      
      // Add metric values
      for (const metric of metrics) {
        const labelStr = Object.keys(metric.labels).length > 0 
          ? `{${Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
          : '';
        
        lines.push(`${metricName}${labelStr} ${metric.value} ${metric.timestamp}`);
      }
      
      lines.push(''); // Empty line between metrics
    }

    return lines.join('\n');
  }

  /**
   * Get monitoring system status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      metricsCount: this.metrics.size,
      timeSeriesCount: this.timeSeries.size,
      aggregatedCount: this.aggregatedMetrics.size,
      healthStatus: this.healthStatus,
      uptime: process.uptime(),
      config: {
        collectSystemMetrics: this.config.collectSystemMetrics,
        collectToolMetrics: this.config.collectToolMetrics,
        retentionMs: this.config.metricsRetentionMs
      }
    };
  }
}

// Create singleton instance
export const monitoring = new MonitoringSystem(SERVER_CONFIG.monitoring || {});

// Export middleware for Express
export const monitoringMiddleware = (req, res, next) => {
  const startTime = performance.now();
  
  // Track active connections
  monitoring.incrementMetric('connections.active');
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = performance.now() - startTime;
    monitoring.recordRequest(req, res, responseTime);
    monitoring.incrementMetric('connections.active', -1);
    originalEnd.apply(this, args);
  };
  
  next();
};

// Export utility functions
export const {
  setMetric,
  incrementMetric,
  getMetric,
  getAllMetrics,
  getTimeSeries,
  recordToolExecution,
  getHealthStatus,
  exportPrometheusMetrics,
  getStatus
} = monitoring;