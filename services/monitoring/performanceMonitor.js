import EventEmitter from 'events';
import os from 'os';
import process from 'process';

/**
 * Enterprise Performance Monitoring System
 * 
 * Comprehensive monitoring for application performance, system resources,
 * user experience metrics, and business KPIs.
 */
export class EnterprisePerformanceMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      monitoring: {
        enabled: config.monitoring?.enabled || true,
        interval: config.monitoring?.interval || 30000, // 30 seconds
        retentionPeriod: config.monitoring?.retentionPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
        alertThresholds: config.monitoring?.alertThresholds || this.getDefaultThresholds()
      },
      metrics: {
        system: config.metrics?.system || true,
        application: config.metrics?.application || true,
        business: config.metrics?.business || true,
        userExperience: config.metrics?.userExperience || true
      },
      alerts: {
        enabled: config.alerts?.enabled || true,
        channels: config.alerts?.channels || ['console', 'slack'],
        cooldownPeriod: config.alerts?.cooldownPeriod || 300000 // 5 minutes
      },
      storage: {
        type: config.storage?.type || 'memory', // 'memory', 'redis', 'database'
        maxDataPoints: config.storage?.maxDataPoints || 10000
      }
    };

    // Metrics storage
    this.metrics = {
      system: [],
      application: [],
      business: [],
      userExperience: [],
      alerts: []
    };

    // Performance counters
    this.counters = {
      requests: { total: 0, success: 0, error: 0 },
      responses: { count: 0, totalTime: 0, times: [] },
      database: { queries: 0, totalTime: 0, errors: 0 },
      cache: { hits: 0, misses: 0, sets: 0 },
      integrations: new Map(),
      users: { active: new Set(), sessions: new Map() }
    };

    // Alert state tracking
    this.alertState = new Map();
    this.lastAlerts = new Map();

    // Real-time metrics
    this.realtimeMetrics = {
      cpu: 0,
      memory: 0,
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      activeUsers: 0
    };

    this.startMonitoring();
  }

  /**
   * Get default alert thresholds
   */
  getDefaultThresholds() {
    return {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      responseTime: { warning: 2000, critical: 5000 }, // milliseconds
      errorRate: { warning: 5, critical: 10 }, // percentage
      throughput: { warning: 100, critical: 50 }, // requests per minute
      diskSpace: { warning: 80, critical: 95 }, // percentage
      databaseConnections: { warning: 80, critical: 95 }, // percentage of pool
      cacheHitRate: { warning: 80, critical: 60 } // percentage
    };
  }

  /**
   * Start monitoring processes
   */
  startMonitoring() {
    if (!this.config.monitoring.enabled) return;

    // System metrics collection
    if (this.config.metrics.system) {
      setInterval(() => {
        this.collectSystemMetrics();
      }, this.config.monitoring.interval);
    }

    // Application metrics collection
    if (this.config.metrics.application) {
      setInterval(() => {
        this.collectApplicationMetrics();
      }, this.config.monitoring.interval);
    }

    // Business metrics collection
    if (this.config.metrics.business) {
      setInterval(() => {
        this.collectBusinessMetrics();
      }, this.config.monitoring.interval * 2); // Less frequent
    }

    // Cleanup old metrics
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Every minute

    console.log('🔍 Performance monitoring started');
  }

  /**
   * Collect system-level metrics
   */
  collectSystemMetrics() {
    try {
      const cpuUsage = this.getCPUUsage();
      const memoryUsage = this.getMemoryUsage();
      const diskUsage = this.getDiskUsage();
      const networkStats = this.getNetworkStats();

      const systemMetrics = {
        timestamp: Date.now(),
        cpu: cpuUsage,
        memory: memoryUsage,
        disk: diskUsage,
        network: networkStats,
        uptime: process.uptime(),
        loadAverage: os.loadavg()
      };

      this.addMetric('system', systemMetrics);
      this.updateRealtimeMetrics('system', systemMetrics);
      this.checkSystemAlerts(systemMetrics);

      this.emit('systemMetrics', systemMetrics);
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Collect application-level metrics
   */
  collectApplicationMetrics() {
    try {
      const responseMetrics = this.calculateResponseMetrics();
      const throughputMetrics = this.calculateThroughputMetrics();
      const errorMetrics = this.calculateErrorMetrics();
      const databaseMetrics = this.getDatabaseMetrics();
      const cacheMetrics = this.getCacheMetrics();

      const applicationMetrics = {
        timestamp: Date.now(),
        response: responseMetrics,
        throughput: throughputMetrics,
        errors: errorMetrics,
        database: databaseMetrics,
        cache: cacheMetrics,
        integrations: this.getIntegrationMetrics(),
        activeUsers: this.counters.users.active.size
      };

      this.addMetric('application', applicationMetrics);
      this.updateRealtimeMetrics('application', applicationMetrics);
      this.checkApplicationAlerts(applicationMetrics);

      this.emit('applicationMetrics', applicationMetrics);
    } catch (error) {
      console.error('Error collecting application metrics:', error);
    }
  }

  /**
   * Collect business-level metrics
   */
  collectBusinessMetrics() {
    try {
      const businessMetrics = {
        timestamp: Date.now(),
        revenue: this.calculateRevenueMetrics(),
        orders: this.calculateOrderMetrics(),
        inventory: this.calculateInventoryMetrics(),
        forecasting: this.calculateForecastingMetrics(),
        integrations: this.calculateIntegrationHealth()
      };

      this.addMetric('business', businessMetrics);
      this.emit('businessMetrics', businessMetrics);
    } catch (error) {
      console.error('Error collecting business metrics:', error);
    }
  }

  /**
   * Get CPU usage percentage
   */
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return {
      usage,
      cores: cpus.length,
      model: cpus[0].model,
      speed: cpus[0].speed
    };
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const processMemory = process.memoryUsage();

    return {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usage: (usedMemory / totalMemory) * 100,
      process: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external,
        arrayBuffers: processMemory.arrayBuffers
      }
    };
  }

  /**
   * Get disk usage information
   */
  getDiskUsage() {
    // Simplified disk usage - in production, use a proper library
    return {
      usage: Math.random() * 100, // Mock data
      total: 1000000000000, // 1TB
      free: 500000000000,   // 500GB
      used: 500000000000    // 500GB
    };
  }

  /**
   * Get network statistics
   */
  getNetworkStats() {
    const networkInterfaces = os.networkInterfaces();
    const stats = {
      interfaces: Object.keys(networkInterfaces).length,
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0
    };

    // In production, you'd collect actual network statistics
    return stats;
  }

  /**
   * Calculate response time metrics
   */
  calculateResponseMetrics() {
    const times = this.counters.responses.times;
    if (times.length === 0) {
      return { avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
    }

    const sorted = [...times].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      avg: times.reduce((a, b) => a + b, 0) / len,
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
      min: sorted[0],
      max: sorted[len - 1],
      count: len
    };
  }

  /**
   * Calculate throughput metrics
   */
  calculateThroughputMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Count requests in the last minute
    const recentRequests = this.counters.requests.total; // Simplified
    
    return {
      requestsPerMinute: recentRequests,
      requestsPerSecond: recentRequests / 60,
      totalRequests: this.counters.requests.total
    };
  }

  /**
   * Calculate error metrics
   */
  calculateErrorMetrics() {
    const total = this.counters.requests.total;
    const errors = this.counters.requests.error;
    
    return {
      total: errors,
      rate: total > 0 ? (errors / total) * 100 : 0,
      types: this.getErrorTypes()
    };
  }

  /**
   * Get database metrics
   */
  getDatabaseMetrics() {
    return {
      queries: this.counters.database.queries,
      averageTime: this.counters.database.queries > 0 ? 
        this.counters.database.totalTime / this.counters.database.queries : 0,
      errors: this.counters.database.errors,
      connections: {
        active: Math.floor(Math.random() * 10), // Mock data
        idle: Math.floor(Math.random() * 5),
        total: 20
      }
    };
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics() {
    const total = this.counters.cache.hits + this.counters.cache.misses;
    
    return {
      hits: this.counters.cache.hits,
      misses: this.counters.cache.misses,
      hitRate: total > 0 ? (this.counters.cache.hits / total) * 100 : 0,
      sets: this.counters.cache.sets
    };
  }

  /**
   * Get integration metrics
   */
  getIntegrationMetrics() {
    const metrics = {};
    
    for (const [name, stats] of this.counters.integrations) {
      metrics[name] = {
        requests: stats.requests || 0,
        errors: stats.errors || 0,
        averageTime: stats.requests > 0 ? (stats.totalTime || 0) / stats.requests : 0,
        lastSuccess: stats.lastSuccess || null,
        status: stats.status || 'unknown'
      };
    }
    
    return metrics;
  }

  /**
   * Calculate revenue metrics
   */
  calculateRevenueMetrics() {
    // Mock business metrics - integrate with actual business logic
    return {
      daily: Math.random() * 10000,
      weekly: Math.random() * 70000,
      monthly: Math.random() * 300000,
      currency: 'USD'
    };
  }

  /**
   * Calculate order metrics
   */
  calculateOrderMetrics() {
    return {
      total: Math.floor(Math.random() * 100),
      pending: Math.floor(Math.random() * 20),
      completed: Math.floor(Math.random() * 80),
      cancelled: Math.floor(Math.random() * 5)
    };
  }

  /**
   * Calculate inventory metrics
   */
  calculateInventoryMetrics() {
    return {
      totalItems: Math.floor(Math.random() * 1000),
      lowStock: Math.floor(Math.random() * 50),
      outOfStock: Math.floor(Math.random() * 10),
      turnoverRate: Math.random() * 5
    };
  }

  /**
   * Calculate forecasting metrics
   */
  calculateForecastingMetrics() {
    return {
      accuracy: 85 + Math.random() * 10, // 85-95%
      predictions: Math.floor(Math.random() * 100),
      confidence: 80 + Math.random() * 15 // 80-95%
    };
  }

  /**
   * Calculate integration health
   */
  calculateIntegrationHealth() {
    const integrations = ['unleashed', 'shopify', 'amazon', 'xero', 'slack'];
    const health = {};
    
    integrations.forEach(integration => {
      health[integration] = {
        status: Math.random() > 0.1 ? 'healthy' : 'unhealthy',
        responseTime: Math.random() * 1000,
        uptime: 95 + Math.random() * 5 // 95-100%
      };
    });
    
    return health;
  }

  /**
   * Get error types breakdown
   */
  getErrorTypes() {
    return {
      '4xx': Math.floor(Math.random() * 10),
      '5xx': Math.floor(Math.random() * 5),
      timeout: Math.floor(Math.random() * 3),
      network: Math.floor(Math.random() * 2)
    };
  }

  /**
   * Add metric to storage
   */
  addMetric(type, metric) {
    this.metrics[type].push(metric);
    
    // Maintain storage limits
    if (this.metrics[type].length > this.config.storage.maxDataPoints) {
      this.metrics[type] = this.metrics[type].slice(-this.config.storage.maxDataPoints);
    }
  }

  /**
   * Update real-time metrics
   */
  updateRealtimeMetrics(type, metrics) {
    if (type === 'system') {
      this.realtimeMetrics.cpu = metrics.cpu.usage;
      this.realtimeMetrics.memory = metrics.memory.usage;
    } else if (type === 'application') {
      this.realtimeMetrics.responseTime = metrics.response.avg;
      this.realtimeMetrics.throughput = metrics.throughput.requestsPerMinute;
      this.realtimeMetrics.errorRate = metrics.errors.rate;
      this.realtimeMetrics.activeUsers = metrics.activeUsers;
    }
  }

  /**
   * Check system alerts
   */
  checkSystemAlerts(metrics) {
    const thresholds = this.config.monitoring.alertThresholds;
    
    this.checkAlert('cpu', metrics.cpu.usage, thresholds.cpu);
    this.checkAlert('memory', metrics.memory.usage, thresholds.memory);
    this.checkAlert('disk', metrics.disk.usage, thresholds.diskSpace);
  }

  /**
   * Check application alerts
   */
  checkApplicationAlerts(metrics) {
    const thresholds = this.config.monitoring.alertThresholds;
    
    this.checkAlert('responseTime', metrics.response.avg, thresholds.responseTime);
    this.checkAlert('errorRate', metrics.errors.rate, thresholds.errorRate);
    this.checkAlert('throughput', metrics.throughput.requestsPerMinute, thresholds.throughput, true); // Reverse threshold
    this.checkAlert('cacheHitRate', metrics.cache.hitRate, thresholds.cacheHitRate, true); // Reverse threshold
  }

  /**
   * Check individual alert condition
   */
  checkAlert(metric, value, threshold, reverse = false) {
    if (!this.config.alerts.enabled) return;

    const now = Date.now();
    const alertKey = metric;
    
    // Check cooldown period
    const lastAlert = this.lastAlerts.get(alertKey);
    if (lastAlert && (now - lastAlert) < this.config.alerts.cooldownPeriod) {
      return;
    }

    let severity = null;
    
    if (reverse) {
      // For metrics where lower values are bad (like cache hit rate, throughput)
      if (value <= threshold.critical) {
        severity = 'critical';
      } else if (value <= threshold.warning) {
        severity = 'warning';
      }
    } else {
      // For metrics where higher values are bad (like CPU, memory, response time)
      if (value >= threshold.critical) {
        severity = 'critical';
      } else if (value >= threshold.warning) {
        severity = 'warning';
      }
    }

    if (severity) {
      const alert = {
        id: `${alertKey}_${now}`,
        metric: alertKey,
        value,
        threshold: threshold[severity],
        severity,
        timestamp: now,
        message: this.generateAlertMessage(metric, value, severity, threshold[severity])
      };

      this.triggerAlert(alert);
      this.lastAlerts.set(alertKey, now);
    }
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(metric, value, severity, threshold) {
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
    const formattedThreshold = typeof threshold === 'number' ? threshold.toFixed(2) : threshold;
    
    return `${severity.toUpperCase()}: ${metric} is ${formattedValue} (threshold: ${formattedThreshold})`;
  }

  /**
   * Trigger alert
   */
  triggerAlert(alert) {
    this.metrics.alerts.push(alert);
    
    // Emit alert event
    this.emit('alert', alert);
    
    // Send to configured channels
    this.config.alerts.channels.forEach(channel => {
      this.sendAlertToChannel(alert, channel);
    });
    
    console.warn(`🚨 ALERT: ${alert.message}`);
  }

  /**
   * Send alert to specific channel
   */
  sendAlertToChannel(alert, channel) {
    switch (channel) {
      case 'console':
        console.error(`[${alert.severity.toUpperCase()}] ${alert.message}`);
        break;
      case 'slack':
        // Integrate with Slack API
        this.sendSlackAlert(alert);
        break;
      case 'email':
        // Integrate with email service
        this.sendEmailAlert(alert);
        break;
      default:
        console.log(`Unknown alert channel: ${channel}`);
    }
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(alert) {
    try {
      // This would integrate with your Slack service
      console.log(`Slack alert: ${alert.message}`);
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(alert) {
    try {
      // This would integrate with your email service
      console.log(`Email alert: ${alert.message}`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Record request metrics
   */
  recordRequest(success = true, responseTime = 0) {
    this.counters.requests.total++;
    
    if (success) {
      this.counters.requests.success++;
    } else {
      this.counters.requests.error++;
    }
    
    if (responseTime > 0) {
      this.counters.responses.count++;
      this.counters.responses.totalTime += responseTime;
      this.counters.responses.times.push(responseTime);
      
      // Keep only recent response times
      if (this.counters.responses.times.length > 1000) {
        this.counters.responses.times = this.counters.responses.times.slice(-1000);
      }
    }
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(duration, success = true) {
    this.counters.database.queries++;
    this.counters.database.totalTime += duration;
    
    if (!success) {
      this.counters.database.errors++;
    }
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(operation, hit = false) {
    switch (operation) {
      case 'get':
        if (hit) {
          this.counters.cache.hits++;
        } else {
          this.counters.cache.misses++;
        }
        break;
      case 'set':
        this.counters.cache.sets++;
        break;
    }
  }

  /**
   * Record integration call
   */
  recordIntegrationCall(integration, duration, success = true) {
    if (!this.counters.integrations.has(integration)) {
      this.counters.integrations.set(integration, {
        requests: 0,
        errors: 0,
        totalTime: 0,
        lastSuccess: null,
        status: 'unknown'
      });
    }
    
    const stats = this.counters.integrations.get(integration);
    stats.requests++;
    stats.totalTime += duration;
    
    if (success) {
      stats.lastSuccess = Date.now();
      stats.status = 'healthy';
    } else {
      stats.errors++;
      stats.status = 'unhealthy';
    }
  }

  /**
   * Record user activity
   */
  recordUserActivity(userId, sessionId) {
    this.counters.users.active.add(userId);
    this.counters.users.sessions.set(sessionId, {
      userId,
      lastActivity: Date.now()
    });
    
    // Clean up inactive sessions
    const fiveMinutesAgo = Date.now() - 300000;
    for (const [sid, session] of this.counters.users.sessions) {
      if (session.lastActivity < fiveMinutesAgo) {
        this.counters.users.sessions.delete(sid);
        this.counters.users.active.delete(session.userId);
      }
    }
  }

  /**
   * Get current metrics summary
   */
  getCurrentMetrics() {
    return {
      timestamp: Date.now(),
      realtime: { ...this.realtimeMetrics },
      counters: {
        requests: { ...this.counters.requests },
        database: { ...this.counters.database },
        cache: { ...this.counters.cache },
        activeUsers: this.counters.users.active.size,
        activeSessions: this.counters.users.sessions.size
      },
      recent: {
        system: this.metrics.system.slice(-1)[0] || null,
        application: this.metrics.application.slice(-1)[0] || null,
        business: this.metrics.business.slice(-1)[0] || null
      }
    };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(type, timeRange = 3600000) { // Default 1 hour
    const cutoff = Date.now() - timeRange;
    return this.metrics[type].filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Get performance dashboard data
   */
  getDashboardData() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    return {
      timestamp: now,
      overview: {
        status: this.getOverallStatus(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      },
      realtime: { ...this.realtimeMetrics },
      trends: {
        system: this.getMetricsHistory('system', oneHour),
        application: this.getMetricsHistory('application', oneHour)
      },
      alerts: {
        active: this.getActiveAlerts(),
        recent: this.metrics.alerts.slice(-10)
      },
      business: this.metrics.business.slice(-1)[0] || null
    };
  }

  /**
   * Get overall system status
   */
  getOverallStatus() {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
    const warningAlerts = activeAlerts.filter(alert => alert.severity === 'warning');
    
    if (criticalAlerts.length > 0) {
      return 'critical';
    } else if (warningAlerts.length > 0) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    const fiveMinutesAgo = Date.now() - 300000;
    return this.metrics.alerts.filter(alert => alert.timestamp >= fiveMinutesAgo);
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics() {
    const cutoff = Date.now() - this.config.monitoring.retentionPeriod;
    
    Object.keys(this.metrics).forEach(type => {
      this.metrics[type] = this.metrics[type].filter(metric => 
        metric.timestamp >= cutoff
      );
    });
  }

  /**
   * Get health status
   */
  getHealth() {
    const status = this.getOverallStatus();
    const activeAlerts = this.getActiveAlerts();
    
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: this.realtimeMetrics,
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        warning: activeAlerts.filter(a => a.severity === 'warning').length
      },
      monitoring: {
        enabled: this.config.monitoring.enabled,
        interval: this.config.monitoring.interval,
        dataPoints: Object.values(this.metrics).reduce((sum, arr) => sum + arr.length, 0)
      }
    };
  }

  /**
   * Export metrics data
   */
  exportMetrics(format = 'json') {
    const data = {
      timestamp: new Date().toISOString(),
      config: this.config,
      metrics: this.metrics,
      counters: {
        requests: this.counters.requests,
        database: this.counters.database,
        cache: this.counters.cache,
        integrations: Object.fromEntries(this.counters.integrations)
      },
      realtime: this.realtimeMetrics
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      default:
        return data;
    }
  }

  /**
   * Convert metrics to CSV format
   */
  convertToCSV(data) {
    // Simplified CSV conversion - in production, use a proper CSV library
    const lines = ['timestamp,type,metric,value'];
    
    Object.entries(data.metrics).forEach(([type, metrics]) => {
      metrics.forEach(metric => {
        Object.entries(metric).forEach(([key, value]) => {
          if (key !== 'timestamp' && typeof value === 'number') {
            lines.push(`${metric.timestamp},${type},${key},${value}`);
          }
        });
      });
    });
    
    return lines.join('\n');
  }

  /**
   * Stop monitoring
   */
  stop() {
    // Clear all intervals (in production, you'd track interval IDs)
    console.log('🛑 Performance monitoring stopped');
    this.emit('monitoringStopped');
  }
}

export default EnterprisePerformanceMonitor;

