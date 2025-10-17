import os from 'os';
import process from 'process';

class EnterpriseMonitoringSystem {
  constructor(config = {}) {
    this.metricsInterval = config.metricsInterval || 60000; // 1 minute default
    this.alertThresholds = config.alertThresholds || this.getDefaultThresholds();
    this.metricsHistory = [];
    this.alerts = [];
    this.startTime = Date.now();
    this.requestMetrics = new Map();
  }

  getDefaultThresholds() {
    return {
      cpu: {
        warning: 70,
        critical: 90
      },
      memory: {
        warning: 80,
        critical: 95
      },
      responseTime: {
        warning: 1000, // ms
        critical: 3000
      },
      errorRate: {
        warning: 5, // percentage
        critical: 10
      },
      diskUsage: {
        warning: 80,
        critical: 90
      }
    };
  }

  // System Metrics Collection
  async collectSystemMetrics() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const loadAvg = os.loadavg();

    const cpuUsage = this.calculateCPUUsage(cpus);
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        uptime: os.uptime(),
        hostname: os.hostname(),
        nodeVersion: process.version
      },
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        loadAverage: {
          '1m': loadAvg[0],
          '5m': loadAvg[1],
          '15m': loadAvg[2]
        }
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory,
        usage: memoryUsage,
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    };

    // Store metrics
    this.metricsHistory.push(metrics);

    // Keep only last 24 hours of metrics (assuming 1-minute intervals)
    if (this.metricsHistory.length > 1440) {
      this.metricsHistory.shift();
    }

    // Check for alerts
    this.checkAlerts(metrics);

    return metrics;
  }

  calculateCPUUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - ~~(100 * totalIdle / totalTick);
  }

  // Application Metrics
  recordRequest(endpoint, method, statusCode, responseTime) {
    const key = `${method}:${endpoint}`;

    if (!this.requestMetrics.has(key)) {
      this.requestMetrics.set(key, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0,
        statusCodes: {}
      });
    }

    const metrics = this.requestMetrics.get(key);
    metrics.count++;
    metrics.totalTime += responseTime;
    metrics.minTime = Math.min(metrics.minTime, responseTime);
    metrics.maxTime = Math.max(metrics.maxTime, responseTime);

    if (statusCode >= 400) {
      metrics.errors++;
    }

    metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
  }

  getApplicationMetrics() {
    const endpoints = [];

    for (const [key, metrics] of this.requestMetrics.entries()) {
      const [method, endpoint] = key.split(':');
      endpoints.push({
        endpoint,
        method,
        count: metrics.count,
        avgResponseTime: metrics.totalTime / metrics.count,
        minResponseTime: metrics.minTime === Infinity ? 0 : metrics.minTime,
        maxResponseTime: metrics.maxTime,
        errorRate: (metrics.errors / metrics.count) * 100,
        statusCodes: metrics.statusCodes
      });
    }

    // Sort by request count
    endpoints.sort((a, b) => b.count - a.count);

    return {
      uptime: Date.now() - this.startTime,
      totalRequests: endpoints.reduce((sum, e) => sum + e.count, 0),
      totalErrors: endpoints.reduce((sum, e) => sum + (e.count * e.errorRate / 100), 0),
      avgResponseTime: endpoints.length > 0
        ? endpoints.reduce((sum, e) => sum + e.avgResponseTime, 0) / endpoints.length
        : 0,
      topEndpoints: endpoints.slice(0, 10),
      slowestEndpoints: [...endpoints].sort((a, b) => b.avgResponseTime - a.avgResponseTime).slice(0, 5)
    };
  }

  // Alert Management
  checkAlerts(metrics) {
    const checks = [
      {
        name: 'CPU Usage',
        value: metrics.cpu.usage,
        thresholds: this.alertThresholds.cpu
      },
      {
        name: 'Memory Usage',
        value: metrics.memory.usage,
        thresholds: this.alertThresholds.memory
      }
    ];

    for (const check of checks) {
      if (check.value >= check.thresholds.critical) {
        this.createAlert('CRITICAL', check.name, check.value, check.thresholds.critical);
      } else if (check.value >= check.thresholds.warning) {
        this.createAlert('WARNING', check.name, check.value, check.thresholds.warning);
      }
    }
  }

  createAlert(severity, metric, value, threshold) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      metric,
      value,
      threshold,
      message: `${metric} is ${value.toFixed(2)}% (threshold: ${threshold}%)`,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Log critical alerts
    if (severity === 'CRITICAL') {
      console.error('[CRITICAL ALERT]', alert.message);
    }

    return alert;
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
    }
    return alert;
  }

  // Health Check
  async getHealthStatus() {
    const metrics = await this.collectSystemMetrics();
    const appMetrics = this.getApplicationMetrics();
    const activeAlerts = this.alerts.filter(a => !a.acknowledged);

    const healthScore = this.calculateHealthScore(metrics, appMetrics, activeAlerts);

    return {
      status: healthScore >= 80 ? 'HEALTHY' : healthScore >= 60 ? 'DEGRADED' : 'UNHEALTHY',
      score: healthScore,
      metrics: {
        system: {
          cpu: metrics.cpu.usage,
          memory: metrics.memory.usage,
          uptime: metrics.system.uptime
        },
        application: {
          requestsPerMinute: appMetrics.totalRequests / (appMetrics.uptime / 60000),
          avgResponseTime: appMetrics.avgResponseTime,
          errorRate: (appMetrics.totalErrors / appMetrics.totalRequests) * 100
        }
      },
      activeAlerts: activeAlerts.length,
      checks: {
        database: true, // Would check actual DB connection
        cache: true,     // Would check Redis/cache
        integrations: {
          xero: true,
          shopify: true,
          amazon: true,
          unleashed: true
        }
      }
    };
  }

  calculateHealthScore(systemMetrics, appMetrics, activeAlerts) {
    let score = 100;

    // Deduct for system metrics
    if (systemMetrics.cpu.usage > 90) score -= 30;
    else if (systemMetrics.cpu.usage > 70) score -= 15;

    if (systemMetrics.memory.usage > 90) score -= 30;
    else if (systemMetrics.memory.usage > 80) score -= 15;

    // Deduct for application metrics
    const errorRate = (appMetrics.totalErrors / Math.max(appMetrics.totalRequests, 1)) * 100;
    if (errorRate > 10) score -= 20;
    else if (errorRate > 5) score -= 10;

    if (appMetrics.avgResponseTime > 3000) score -= 20;
    else if (appMetrics.avgResponseTime > 1000) score -= 10;

    // Deduct for active alerts
    score -= activeAlerts.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  // Monitoring Middleware
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Capture response
      const originalSend = res.send;
      res.send = function(data) {
        res.send = originalSend;

        const responseTime = Date.now() - startTime;
        this.recordRequest(req.path, req.method, res.statusCode, responseTime);

        // Add monitoring headers
        res.set('X-Response-Time', `${responseTime}ms`);
        res.set('X-Server-ID', os.hostname());

        return res.send(data);
      }.bind(this);

      next();
    };
  }

  // Dashboard Data
  getDashboardData() {
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1] || null;
    const appMetrics = this.getApplicationMetrics();
    const activeAlerts = this.alerts.filter(a => !a.acknowledged);

    return {
      timestamp: new Date().toISOString(),
      system: currentMetrics ? {
        cpu: {
          usage: currentMetrics.cpu.usage,
          trend: this.calculateTrend('cpu.usage')
        },
        memory: {
          usage: currentMetrics.memory.usage,
          trend: this.calculateTrend('memory.usage')
        },
        uptime: currentMetrics.system.uptime
      } : null,
      application: {
        requestsPerMinute: Math.round(appMetrics.totalRequests / (appMetrics.uptime / 60000)),
        avgResponseTime: Math.round(appMetrics.avgResponseTime),
        errorRate: appMetrics.totalRequests > 0
          ? ((appMetrics.totalErrors / appMetrics.totalRequests) * 100).toFixed(2)
          : 0,
        topEndpoints: appMetrics.topEndpoints.slice(0, 5),
        slowestEndpoints: appMetrics.slowestEndpoints
      },
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'CRITICAL').length,
        warning: activeAlerts.filter(a => a.severity === 'WARNING').length,
        recent: activeAlerts.slice(0, 5)
      },
      history: {
        cpu: this.getMetricHistory('cpu.usage', 60),
        memory: this.getMetricHistory('memory.usage', 60),
        requests: this.getRequestHistory(60)
      }
    };
  }

  calculateTrend(metricPath) {
    if (this.metricsHistory.length < 2) return 'stable';

    const recent = this.metricsHistory.slice(-10);
    const values = recent.map(m => this.getNestedValue(m, metricPath));

    const avgRecent = values.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const avgPrevious = values.slice(0, 5).reduce((a, b) => a + b, 0) / 5;

    if (avgRecent > avgPrevious * 1.1) return 'increasing';
    if (avgRecent < avgPrevious * 0.9) return 'decreasing';
    return 'stable';
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  getMetricHistory(metricPath, points = 60) {
    const history = this.metricsHistory.slice(-points);
    return history.map(m => ({
      timestamp: m.timestamp,
      value: this.getNestedValue(m, metricPath)
    }));
  }

  getRequestHistory() {
    // Real request tracking requires integration with a metrics store.
    return [];
  }
}

export default EnterpriseMonitoringSystem;
