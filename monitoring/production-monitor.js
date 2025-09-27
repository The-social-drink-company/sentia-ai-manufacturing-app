/**
 * Production Monitoring System
 * Real-time monitoring and alerting for production environment
 */

import express from 'express';
const router = express.Router();
import WebSocket from 'ws';
import os from 'os';
import { performance } from 'perf_hooks';

// Monitoring configuration
const MONITORING_CONFIG = {
  checkInterval: 30000, // 30 seconds
  alertThresholds: {
    cpu: 85,
    memory: 90,
    responseTime: 2000,
    errorRate: 5,
    diskUsage: 85
  },
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  alertChannels: ['email', 'slack', 'pagerduty']
};

// Metrics storage
class MetricsStore {
  constructor() {
    this.metrics = {
      system: [],
      application: [],
      business: [],
      alerts: []
    };
    this.startTime = Date.now();
  }

  addMetric(category, metric) {
    const timestamp = Date.now();
    const data = { ...metric, timestamp };
    
    this.metrics[category].push(data);
    
    // Clean old metrics
    this.cleanOldMetrics(category);
    
    // Check for alerts
    this.checkAlertConditions(category, data);
    
    return data;
  }

  cleanOldMetrics(category) {
    const cutoff = Date.now() - MONITORING_CONFIG.retentionPeriod;
    this.metrics[category] = this.metrics[category].filter(m => m.timestamp > cutoff);
  }

  checkAlertConditions(category, metric) {
    const alerts = [];
    
    if (category === 'system') {
      if (metric.cpu > MONITORING_CONFIG.alertThresholds.cpu) {
        alerts.push({
          level: 'critical',
          type: 'cpu_high',
          message: `CPU usage at ${metric.cpu}%`,
          value: metric.cpu,
          threshold: MONITORING_CONFIG.alertThresholds.cpu
        });
      }
      
      if (metric.memory > MONITORING_CONFIG.alertThresholds.memory) {
        alerts.push({
          level: 'critical',
          type: 'memory_high',
          message: `Memory usage at ${metric.memory}%`,
          value: metric.memory,
          threshold: MONITORING_CONFIG.alertThresholds.memory
        });
      }
    }
    
    if (category === 'application') {
      if (metric.responseTime > MONITORING_CONFIG.alertThresholds.responseTime) {
        alerts.push({
          level: 'warning',
          type: 'response_slow',
          message: `Response time ${metric.responseTime}ms`,
          value: metric.responseTime,
          threshold: MONITORING_CONFIG.alertThresholds.responseTime
        });
      }
      
      if (metric.errorRate > MONITORING_CONFIG.alertThresholds.errorRate) {
        alerts.push({
          level: 'critical',
          type: 'error_rate_high',
          message: `Error rate at ${metric.errorRate}%`,
          value: metric.errorRate,
          threshold: MONITORING_CONFIG.alertThresholds.errorRate
        });
      }
    }
    
    // Send alerts
    alerts.forEach(alert => {
      this.sendAlert(alert);
      this.metrics.alerts.push({ ...alert, timestamp: Date.now() });
    });
  }

  sendAlert(alert) {
    MONITORING_CONFIG.alertChannels.forEach(channel => {
      switch (channel) {
        case 'email':
          this.sendEmailAlert(alert);
          break;
        case 'slack':
          this.sendSlackAlert(alert);
          break;
        case 'pagerduty':
          this.sendPagerDutyAlert(alert);
          break;
      }
    });
  }

  sendEmailAlert(alert) {
    // Email alert implementation
    console.log(`[EMAIL ALERT] ${alert.level.toUpperCase()}: ${alert.message}`);
  }

  sendSlackAlert(alert) {
    // Slack webhook implementation
    if (process.env.SLACK_WEBHOOK_URL) {
      fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *${alert.level.toUpperCase()} ALERT*`,
          attachments: [{
            color: alert.level === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Type', value: alert.type, short: true },
              { title: 'Message', value: alert.message, short: true },
              { title: 'Value', value: alert.value, short: true },
              { title: 'Threshold', value: alert.threshold, short: true }
            ],
            timestamp: Math.floor(Date.now() / 1000)
          }]
        })
      }).catch(err => console.error('Slack alert failed:', err));
    }
  }

  sendPagerDutyAlert(alert) {
    // PagerDuty integration
    if (process.env.PAGERDUTY_INTEGRATION_KEY && alert.level === 'critical') {
      fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token token=${process.env.PAGERDUTY_INTEGRATION_KEY}`
        },
        body: JSON.stringify({
          routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
          event_action: 'trigger',
          payload: {
            summary: alert.message,
            severity: alert.level,
            source: 'sentia-manufacturing-dashboard',
            custom_details: {
              type: alert.type,
              value: alert.value,
              threshold: alert.threshold
            }
          }
        })
      }).catch(err => console.error('PagerDuty alert failed:', err));
    }
  }

  getMetrics(category, duration = 3600000) {
    const cutoff = Date.now() - duration;
    return this.metrics[category].filter(m => m.timestamp > cutoff);
  }

  getAggregatedMetrics(category, aggregation = 'avg', duration = 3600000) {
    const metrics = this.getMetrics(category, duration);
    if (metrics.length === 0) return null;
    
    const values = metrics.map(m => m.value || 0);
    
    switch (aggregation) {
      case 'avg':
        return values.reduce((a, _b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'sum':
        return values.reduce((a, _b) => a + b, 0);
      default:
        return null;
    }
  }
}

// Initialize metrics store
const metricsStore = new MetricsStore();

// System metrics collector
class SystemMonitor {
  static collectMetrics() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // Calculate CPU usage
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
    const cpuUsage = 100 - ~~(100 * idle / total);
    
    return {
      cpu: cpuUsage,
      memory: Math.round((usedMemory / totalMemory) * 100),
      memoryUsed: usedMemory,
      memoryTotal: totalMemory,
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname()
    };
  }
}

// Application metrics collector
class ApplicationMonitor {
  constructor() {
    this.requests = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  recordRequest(method, path, responseTime, statusCode) {
    const request = {
      method,
      path,
      responseTime,
      statusCode,
      timestamp: Date.now()
    };
    
    this.requests.push(request);
    
    // Clean old requests
    const cutoff = Date.now() - 3600000; // Keep last hour
    this.requests = this.requests.filter(r => r.timestamp > cutoff);
    
    if (statusCode >= 500) {
      this.errors.push(request);
      this.errors = this.errors.filter(e => e.timestamp > cutoff);
    }
  }

  getMetrics() {
    const now = Date.now();
    const recentRequests = this.requests.filter(r => r.timestamp > now - 60000);
    const recentErrors = this.errors.filter(e => e.timestamp > now - 60000);
    
    const responseTimes = recentRequests.map(r => r.responseTime);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, _b) => a + b, 0) / responseTimes.length 
      : 0;
    
    return {
      requestsPerMinute: recentRequests.length,
      errorsPerMinute: recentErrors.length,
      errorRate: recentRequests.length > 0 
        ? (recentErrors.length / recentRequests.length) * 100 
        : 0,
      responseTime: Math.round(avgResponseTime),
      uptime: Math.floor((now - this.startTime) / 1000),
      totalRequests: this.requests.length,
      totalErrors: this.errors.length
    };
  }
}

// Business metrics collector
class BusinessMonitor {
  static async collectMetrics() {
    try {
      // Placeholder for business metrics collection
      // In production, this would query the database
      return {
        activeUsers: Math.floor(Math.random() * 1000),
        ordersToday: Math.floor(Math.random() * 500),
        revenue: Math.floor(Math.random() * 100000),
        inventoryValue: Math.floor(Math.random() * 1000000),
        productionEfficiency: 85 + Math.random() * 10,
        qualityScore: 90 + Math.random() * 8,
        onTimeDelivery: 92 + Math.random() * 6
      };
    } catch (error) {
      console.error('Failed to collect business metrics:', error);
      return null;
    }
  }
}

// Initialize monitors
const appMonitor = new ApplicationMonitor();

// Middleware to track requests
const requestTracker = (req, res, _next) => {
  const startTime = performance.now();
  
  res.on(_'finish', () => {
    const responseTime = performance.now() - startTime;
    appMonitor.recordRequest(
      req.method,
      req.path,
      responseTime,
      res.statusCode
    );
  });
  
  next();
};

// Start monitoring loop
setInterval(async () => {
  // Collect system metrics
  const systemMetrics = SystemMonitor.collectMetrics();
  metricsStore.addMetric('system', systemMetrics);
  
  // Collect application metrics
  const appMetrics = appMonitor.getMetrics();
  metricsStore.addMetric('application', appMetrics);
  
  // Collect business metrics
  const businessMetrics = await BusinessMonitor.collectMetrics();
  if (businessMetrics) {
    metricsStore.addMetric('business', businessMetrics);
  }
}, MONITORING_CONFIG.checkInterval);

// API Routes
router.get(_'/metrics/current', (req, res) => {
  const system = metricsStore.getMetrics('system', 300000);
  const application = metricsStore.getMetrics('application', 300000);
  const business = metricsStore.getMetrics('business', 300000);
  
  res.json({
    timestamp: Date.now(),
    system: system[system.length - 1] || null,
    application: application[application.length - 1] || null,
    business: business[business.length - 1] || null
  });
});

router.get(_'/metrics/history', (req, res) => {
  const duration = parseInt(req.query.duration) || 3600000;
  
  res.json({
    timestamp: Date.now(),
    duration,
    system: metricsStore.getMetrics('system', duration),
    application: metricsStore.getMetrics('application', duration),
    business: metricsStore.getMetrics('business', duration)
  });
});

router.get(_'/metrics/alerts', (req, res) => {
  const duration = parseInt(req.query.duration) || 86400000; // 24 hours
  
  res.json({
    timestamp: Date.now(),
    alerts: metricsStore.getMetrics('alerts', duration)
  });
});

router.get(_'/metrics/dashboard', (req, res) => {
  const system = metricsStore.getMetrics('system', 300000);
  const application = metricsStore.getMetrics('application', 300000);
  const business = metricsStore.getMetrics('business', 300000);
  const alerts = metricsStore.getMetrics('alerts', 3600000);
  
  res.json({
    timestamp: Date.now(),
    status: alerts.filter(a => a.level === 'critical').length > 0 ? 'critical' : 
            alerts.length > 0 ? 'warning' : 'healthy',
    current: {
      system: system[system.length - 1] || null,
      application: application[application.length - 1] || null,
      business: business[business.length - 1] || null
    },
    alerts: alerts.slice(-10), // Last 10 alerts
    uptime: Math.floor((Date.now() - metricsStore.startTime) / 1000)
  });
});

// WebSocket support for real-time monitoring
const setupWebSocket = (_server) => {
  const wss = new WebSocket.Server({ server, path: '/monitoring/ws' });
  
  wss.on(_'connection', _(ws) => {
    console.log('Monitoring WebSocket connected');
    
    // Send current metrics immediately
    const sendMetrics = () => {
      const system = metricsStore.getMetrics('system', 60000);
      const application = metricsStore.getMetrics('application', 60000);
      
      ws.send(JSON.stringify({
        type: 'metrics',
        data: {
          system: system[system.length - 1] || null,
          application: application[application.length - 1] || null,
          timestamp: Date.now()
        }
      }));
    };
    
    // Send metrics every 5 seconds
    const interval = setInterval(sendMetrics, 5000);
    sendMetrics();
    
    ws.on(_'close', () => {
      clearInterval(interval);
      console.log('Monitoring WebSocket disconnected');
    });
  });
};

export {
  router,
  requestTracker,
  setupWebSocket,
  metricsStore,
  appMonitor
};