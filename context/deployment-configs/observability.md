# Observability Configuration

## Overview
This document outlines the comprehensive observability strategy for the CapLiquify Manufacturing Platform, including logging, metrics, alerts, and dashboards.

## Logging Strategy

### Log Levels and Usage
```javascript
// Log level configuration by environment
const logLevels = {
  development: 'debug',
  test: 'info', 
  production: 'warn'
};

// Log categories
const logCategories = {
  http: 'HTTP requests and responses',
  auth: 'Authentication and authorization',
  db: 'Database operations',
  queue: 'Job queue processing',
  business: 'Business logic operations',
  security: 'Security events',
  error: 'Application errors'
};
```

### Structured Logging Format
```javascript
// Winston logger configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        environment: process.env.NODE_ENV,
        service: 'sentia-dashboard',
        correlationId: meta.correlationId,
        userId: meta.userId,
        ...meta
      });
    })
  ),
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' 
        ? winston.format.simple() 
        : winston.format.json()
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Request correlation middleware
export const correlationMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  logger.info('HTTP Request', {
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Response', {
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length')
    });
  });
  
  next();
};
```

### Business Event Logging
```javascript
// Business event logger
export const businessLogger = {
  jobStarted: (jobType, jobId, userId) => {
    logger.info('Job Started', {
      category: 'business',
      event: 'job_started',
      jobType,
      jobId,
      userId,
      timestamp: new Date().toISOString()
    });
  },
  
  jobCompleted: (jobType, jobId, userId, duration, result) => {
    logger.info('Job Completed', {
      category: 'business',
      event: 'job_completed',
      jobType,
      jobId,
      userId,
      duration,
      result: result.status,
      timestamp: new Date().toISOString()
    });
  },
  
  userAction: (action, userId, metadata = {}) => {
    logger.info('User Action', {
      category: 'business',
      event: 'user_action',
      action,
      userId,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }
};
```

## Metrics Collection

### Application Metrics
```javascript
// Prometheus metrics setup
import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const jobProcessingDuration = new promClient.Histogram({
  name: 'job_processing_duration_seconds',
  help: 'Job processing duration in seconds',
  labelNames: ['job_type', 'status'],
  buckets: [1, 5, 10, 30, 60, 300],
  registers: [register]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections_total',
  help: 'Number of active database connections',
  registers: [register]
});

const queueDepth = new promClient.Gauge({
  name: 'queue_depth_total',
  help: 'Number of jobs in queue',
  labelNames: ['queue_name'],
  registers: [register]
});

// Business metrics
const forecastAccuracy = new promClient.Gauge({
  name: 'forecast_accuracy_percentage',
  help: 'Forecast accuracy percentage',
  labelNames: ['forecast_type'],
  registers: [register]
});

const workingCapitalCalculations = new promClient.Counter({
  name: 'working_capital_calculations_total',
  help: 'Total working capital calculations performed',
  labelNames: ['calculation_type'],
  registers: [register]
});

// Metrics middleware
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestsTotal.labels(req.method, route, res.statusCode).inc();
    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
  });
  
  next();
};

// Metrics endpoint
export const metricsEndpoint = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};
```

### Queue Metrics
```javascript
// BullMQ metrics collection
import { Queue } from 'bullmq';

export class QueueMetrics {
  constructor(queues) {
    this.queues = queues;
    this.collectMetrics();
  }
  
  async collectMetrics() {
    setInterval(async () => {
      for (const [name, queue] of Object.entries(this.queues)) {
        try {
          const waiting = await queue.getWaiting();
          const active = await queue.getActive();
          const completed = await queue.getCompleted();
          const failed = await queue.getFailed();
          
          queueDepth.labels(name).set(waiting.length + active.length);
          
          logger.debug('Queue Metrics', {
            queue: name,
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length
          });
        } catch (error) {
          logger.error('Error collecting queue metrics', {
            queue: name,
            error: error.message
          });
        }
      }
    }, 30000); // Every 30 seconds
  }
}
```

### Health Check Implementation
```javascript
// Health check service
export class HealthCheckService {
  constructor(dependencies) {
    this.dependencies = dependencies;
  }
  
  async checkHealth() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
      services: {},
      metrics: {}
    };
    
    // Database health
    try {
      const dbStart = Date.now();
      await this.dependencies.prisma.$queryRaw`SELECT 1`;
      results.services.database = {
        status: 'healthy',
        responseTime: `${Date.now() - dbStart}ms`
      };
    } catch (error) {
      results.services.database = {
        status: 'unhealthy',
        error: error.message
      };
      results.status = 'unhealthy';
    }
    
    // Redis health
    try {
      const redisStart = Date.now();
      await this.dependencies.redis.ping();
      results.services.redis = {
        status: 'healthy',
        responseTime: `${Date.now() - redisStart}ms`
      };
    } catch (error) {
      results.services.redis = {
        status: 'unhealthy',
        error: error.message
      };
      results.status = 'unhealthy';
    }
    
    // Queue health
    try {
      const queueHealths = {};
      for (const [name, queue] of Object.entries(this.dependencies.queues)) {
        const waiting = await queue.getWaiting();
        const active = await queue.getActive();
        queueHealths[name] = {
          waiting: waiting.length,
          active: active.length,
          status: waiting.length < 1000 ? 'healthy' : 'warning'
        };
      }
      results.services.queues = {
        status: 'healthy',
        details: queueHealths
      };
    } catch (error) {
      results.services.queues = {
        status: 'unhealthy',
        error: error.message
      };
    }
    
    // System metrics
    results.metrics = {
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      cpu: process.cpuUsage()
    };
    
    return results;
  }
}
```

## Alerting Configuration

### Alert Rules
```yaml
alerts:
  # Critical Alerts
  service_down:
    condition: "health_check_status != 'healthy'"
    duration: 2 minutes
    severity: critical
    channels: [slack, email, sms]
    
  high_error_rate:
    condition: "error_rate > 5%"
    duration: 5 minutes
    severity: critical
    channels: [slack, email]
    
  database_connection_failure:
    condition: "database_status != 'healthy'"
    duration: 1 minute
    severity: critical
    channels: [slack, email, sms]
    
  # Warning Alerts  
  high_response_time:
    condition: "p95_response_time > 2000ms"
    duration: 10 minutes
    severity: warning
    channels: [slack]
    
  queue_backlog:
    condition: "queue_depth > 1000"
    duration: 15 minutes
    severity: warning
    channels: [slack]
    
  high_memory_usage:
    condition: "memory_usage > 85%"
    duration: 10 minutes
    severity: warning
    channels: [slack]
    
  # Info Alerts
  deployment_success:
    condition: "deployment_status == 'success'"
    duration: immediate
    severity: info
    channels: [slack]
    
  unusual_traffic:
    condition: "request_rate > 2x_baseline"
    duration: 20 minutes
    severity: info
    channels: [slack]
```

### Alert Implementation
```javascript
// Alert manager service
export class AlertManager {
  constructor(channels) {
    this.channels = channels;
    this.alertHistory = new Map();
  }
  
  async sendAlert(alert) {
    const alertKey = `${alert.rule}_${alert.severity}`;
    const lastSent = this.alertHistory.get(alertKey);
    
    // Rate limiting to prevent spam
    if (lastSent && Date.now() - lastSent < alert.cooldown) {
      return;
    }
    
    this.alertHistory.set(alertKey, Date.now());
    
    const message = {
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      service: 'sentia-dashboard',
      runbook: alert.runbook,
      metrics: alert.metrics
    };
    
    // Send to configured channels
    for (const channel of alert.channels) {
      try {
        await this.channels[channel].send(message);
        logger.info('Alert sent', {
          alert: alertKey,
          channel,
          severity: alert.severity
        });
      } catch (error) {
        logger.error('Failed to send alert', {
          alert: alertKey,
          channel,
          error: error.message
        });
      }
    }
  }
}

// Slack notification channel
export class SlackChannel {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }
  
  async send(alert) {
    const color = {
      critical: '#ff0000',
      warning: '#ffaa00',
      info: '#0099ff'
    }[alert.severity] || '#666666';
    
    const payload = {
      channel: alert.severity === 'critical' ? '#alerts' : '#monitoring',
      username: 'Sentia Dashboard',
      icon_emoji: ':warning:',
      attachments: [{
        color,
        title: alert.title,
        text: alert.description,
        fields: [
          { title: 'Environment', value: alert.environment, short: true },
          { title: 'Service', value: alert.service, short: true },
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Time', value: alert.timestamp, short: true }
        ],
        actions: alert.runbook ? [{
          type: 'button',
          text: 'View Runbook',
          url: alert.runbook
        }] : undefined
      }]
    };
    
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }
  }
}
```

## Dashboard Configuration

### Metrics Dashboard Queries
```javascript
// Dashboard metric queries
export const dashboardQueries = {
  // Performance metrics
  responseTime: {
    query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
    title: 'API Response Time (P95)',
    unit: 'seconds'
  },
  
  requestRate: {
    query: 'rate(http_requests_total[5m])',
    title: 'Request Rate',
    unit: 'requests/sec'
  },
  
  errorRate: {
    query: 'rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])',
    title: 'Error Rate',
    unit: 'percentage'
  },
  
  // Business metrics
  jobProcessingTime: {
    query: 'histogram_quantile(0.95, rate(job_processing_duration_seconds_bucket[10m]))',
    title: 'Job Processing Time (P95)',
    unit: 'seconds'
  },
  
  queueDepth: {
    query: 'queue_depth_total',
    title: 'Queue Depth',
    unit: 'jobs'
  },
  
  activeUsers: {
    query: 'active_users_total',
    title: 'Active Users',
    unit: 'users'
  },
  
  // Infrastructure metrics
  cpuUsage: {
    query: 'avg(rate(cpu_usage_seconds_total[5m])) * 100',
    title: 'CPU Usage',
    unit: 'percentage'
  },
  
  memoryUsage: {
    query: 'memory_usage_bytes / memory_total_bytes * 100',
    title: 'Memory Usage',
    unit: 'percentage'
  },
  
  databaseConnections: {
    query: 'active_connections_total',
    title: 'Database Connections',
    unit: 'connections'
  }
};
```

### Custom Dashboard Components
```javascript
// Real-time metrics component
export class MetricsWidget {
  constructor(containerId, metricConfig) {
    this.container = document.getElementById(containerId);
    this.config = metricConfig;
    this.chart = null;
    this.init();
  }
  
  init() {
    this.setupChart();
    this.startPolling();
  }
  
  setupChart() {
    // Chart.js configuration for real-time metrics
    const ctx = this.container.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: this.config.title,
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'time',
            time: {
              displayFormats: {
                minute: 'HH:mm'
              }
            }
          },
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  }
  
  async startPolling() {
    setInterval(async () => {
      try {
        const response = await fetch(`/api/metrics/${this.config.metric}`);
        const data = await response.json();
        
        this.updateChart(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    }, 30000); // Update every 30 seconds
  }
  
  updateChart(data) {
    const now = new Date();
    
    this.chart.data.labels.push(now);
    this.chart.data.datasets[0].data.push(data.value);
    
    // Keep only last 20 data points
    if (this.chart.data.labels.length > 20) {
      this.chart.data.labels.shift();
      this.chart.data.datasets[0].data.shift();
    }
    
    this.chart.update('none');
  }
}
```

## Log Analysis and Monitoring

### Log Aggregation Strategy
```javascript
// Log aggregation service
export class LogAggregator {
  constructor(sources) {
    this.sources = sources;
    this.patterns = {
      errorPattern: /ERROR|FATAL/,
      slowQueryPattern: /query.*took.*[0-9]+ms/,
      authFailurePattern: /authentication.*failed/i,
      rateLimitPattern: /rate.*limit.*exceeded/i
    };
  }
  
  async analyzeLogs(timeRange = '1h') {
    const analysis = {
      summary: {
        totalEntries: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0
      },
      patterns: {},
      topErrors: [],
      performanceIssues: []
    };
    
    for (const source of this.sources) {
      const logs = await this.fetchLogs(source, timeRange);
      
      for (const entry of logs) {
        analysis.summary.totalEntries++;
        
        // Categorize by level
        switch (entry.level) {
          case 'error':
            analysis.summary.errorCount++;
            break;
          case 'warn':
            analysis.summary.warningCount++;
            break;
          case 'info':
            analysis.summary.infoCount++;
            break;
        }
        
        // Pattern matching
        for (const [name, pattern] of Object.entries(this.patterns)) {
          if (pattern.test(entry.message)) {
            analysis.patterns[name] = (analysis.patterns[name] || 0) + 1;
          }
        }
        
        // Extract errors for trending
        if (entry.level === 'error') {
          const errorKey = entry.stack?.split('\n')[0] || entry.message;
          const existing = analysis.topErrors.find(e => e.error === errorKey);
          if (existing) {
            existing.count++;
          } else {
            analysis.topErrors.push({
              error: errorKey,
              count: 1,
              lastSeen: entry.timestamp
            });
          }
        }
      }
    }
    
    // Sort top errors by frequency
    analysis.topErrors.sort((a, b) => b.count - a.count);
    analysis.topErrors = analysis.topErrors.slice(0, 10);
    
    return analysis;
  }
  
  async fetchLogs(source, timeRange) {
    // Implementation depends on log source (Railway, file, etc.)
    // This would fetch logs from the specified source
    return [];
  }
}
```

### Automated Incident Response
```javascript
// Incident response automation
export class IncidentResponseService {
  constructor(alertManager, escalationRules) {
    this.alertManager = alertManager;
    this.escalationRules = escalationRules;
    this.activeIncidents = new Map();
  }
  
  async handleAlert(alert) {
    const incidentKey = `${alert.service}_${alert.rule}`;
    
    if (this.activeIncidents.has(incidentKey)) {
      // Existing incident - escalate if needed
      await this.escalateIncident(incidentKey, alert);
    } else {
      // New incident
      await this.createIncident(incidentKey, alert);
    }
  }
  
  async createIncident(key, alert) {
    const incident = {
      id: key,
      alert,
      created: Date.now(),
      status: 'open',
      escalationLevel: 0,
      actions: []
    };
    
    this.activeIncidents.set(key, incident);
    
    // Immediate automated actions
    await this.performAutomatedActions(incident);
    
    // Send initial alert
    await this.alertManager.sendAlert({
      ...alert,
      title: `NEW INCIDENT: ${alert.title}`,
      description: `Incident ${key} has been created. Automated response initiated.`,
      channels: ['slack', 'email']
    });
  }
  
  async performAutomatedActions(incident) {
    const actions = this.escalationRules[incident.alert.severity]?.actions || [];
    
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'restart_service':
            await this.restartService(action.service);
            incident.actions.push({ type: 'restart', timestamp: Date.now(), status: 'success' });
            break;
            
          case 'scale_up':
            await this.scaleService(action.service, action.instances);
            incident.actions.push({ type: 'scale_up', timestamp: Date.now(), status: 'success' });
            break;
            
          case 'enable_maintenance':
            await this.enableMaintenanceMode();
            incident.actions.push({ type: 'maintenance', timestamp: Date.now(), status: 'success' });
            break;
        }
      } catch (error) {
        incident.actions.push({ 
          type: action.type, 
          timestamp: Date.now(), 
          status: 'failed', 
          error: error.message 
        });
      }
    }
  }
}
```

## Monitoring Runbooks

### Common Issues and Responses

#### High Error Rate
```markdown
## High Error Rate Runbook

### Symptoms
- Error rate > 5% for 5+ minutes
- Multiple 5xx responses in logs

### Investigation Steps
1. Check recent deployments (last 2 hours)
2. Review error logs for patterns
3. Check database connectivity
4. Verify external API status

### Immediate Actions
1. If recent deployment: Consider rollback
2. If database issues: Check connection pool
3. If external API: Enable circuit breaker
4. Scale up if traffic spike

### Recovery Steps
1. Identify root cause
2. Apply fix or rollback
3. Monitor error rate for 15 minutes
4. Update stakeholders
```

#### Database Connection Issues
```markdown
## Database Connection Issues Runbook

### Symptoms
- Database health check failing
- Connection timeout errors
- Pool exhaustion warnings

### Investigation Steps
1. Check Neon database status
2. Review connection pool metrics
3. Analyze slow query logs
4. Check network connectivity

### Immediate Actions
1. Restart database connections
2. Increase connection pool if needed
3. Kill long-running queries
4. Scale down non-essential workers

### Recovery Steps
1. Optimize problematic queries
2. Review connection pool settings
3. Monitor for 30 minutes
4. Document findings
```

## Performance Monitoring

### SLA Monitoring
```javascript
// SLA monitoring service
export class SLAMonitor {
  constructor(targets) {
    this.targets = targets;
    this.measurements = new Map();
  }
  
  recordMeasurement(metric, value, labels = {}) {
    const key = `${metric}_${JSON.stringify(labels)}`;
    
    if (!this.measurements.has(key)) {
      this.measurements.set(key, []);
    }
    
    const measurements = this.measurements.get(key);
    measurements.push({
      value,
      timestamp: Date.now()
    });
    
    // Keep only last 24 hours
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.measurements.set(key, 
      measurements.filter(m => m.timestamp > dayAgo)
    );
  }
  
  calculateSLA(metric, timeWindow = '24h') {
    const key = `${metric}_${{}}`;
    const measurements = this.measurements.get(key) || [];
    
    if (measurements.length === 0) return null;
    
    const target = this.targets[metric];
    const passing = measurements.filter(m => 
      this.meetsSLA(m.value, target)
    );
    
    return {
      metric,
      timeWindow,
      target: target.target,
      current: (passing.length / measurements.length) * 100,
      measurements: measurements.length,
      passing: passing.length,
      failing: measurements.length - passing.length
    };
  }
  
  meetsSLA(value, target) {
    switch (target.operator) {
      case '<': return value < target.target;
      case '<=': return value <= target.target;
      case '>': return value > target.target;
      case '>=': return value >= target.target;
      default: return value === target.target;
    }
  }
}

// SLA targets
const slaTargets = {
  response_time: { target: 2, operator: '<', unit: 'seconds' },
  availability: { target: 99.9, operator: '>=', unit: 'percentage' },
  error_rate: { target: 1, operator: '<', unit: 'percentage' },
  job_success_rate: { target: 95, operator: '>=', unit: 'percentage' }
};
```

This comprehensive observability configuration provides deep insights into system performance, user behavior, and business metrics while enabling proactive incident response and continuous improvement of the CapLiquify Manufacturing Platform.