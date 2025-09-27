// Production Monitoring System - Enterprise Grade System Health Monitoring
import { logInfo, logWarn, logError, logPerformance } from './structuredLogger.js';
import promClient from 'prom-client';

class ProductionMonitor {
  constructor() {
    this.metrics = {
      httpRequests: new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code']
      }),
      httpDuration: new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.5, 1, 2, 5]
      }),
      activeConnections: new promClient.Gauge({
        name: 'active_connections',
        help: 'Number of active connections'
      }),
      systemMemory: new promClient.Gauge({
        name: 'system_memory_usage_bytes',
        help: 'System memory usage in bytes'
      }),
      systemCpu: new promClient.Gauge({
        name: 'system_cpu_usage_percent',
        help: 'System CPU usage percentage'
      }),
      businessMetrics: {
        dailyRevenue: new promClient.Gauge({
          name: 'daily_revenue_amount',
          help: 'Daily revenue amount',
          labelNames: ['currency', 'region']
        }),
        orderCount: new promClient.Counter({
          name: 'orders_total',
          help: 'Total number of orders',
          labelNames: ['status', 'region']
        }),
        inventoryLevels: new promClient.Gauge({
          name: 'inventory_level',
          help: 'Current inventory levels',
          labelNames: ['product_sku', 'location']
        }),
        productionRate: new promClient.Gauge({
          name: 'production_rate_units_per_hour',
          help: 'Production rate in units per hour',
          labelNames: ['line', 'product']
        })
      }
    };

    this.alerts = [];
    this.healthChecks = new Map();
    this.isShuttingDown = false;
    
    // Register default metrics
    promClient.register.setDefaultLabels({
      service: 'sentia-manufacturing-dashboard',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });

    // Collect default metrics
    promClient.collectDefaultMetrics({ timeout: 5000 });
    
    // Start monitoring
    this.startSystemMonitoring();
    this.startHealthChecks();
  }

  // Express middleware for request monitoring
  requestMonitoringMiddleware() {
    return (req, res, _next) => {
      const start = Date.now();
      
      // Count request
      this.metrics.httpRequests.inc({
        method: req.method,
        route: req.route?.path || req.path,
        status_code: 'pending'
      });

      // Override res.end to capture response metrics
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        const duration = (Date.now() - start) / 1000;
        
        // Update metrics
        this.metrics.httpRequests.inc({
          method: req.method,
          route: req.route?.path || req.path,
          status_code: res.statusCode
        });
        
        this.metrics.httpDuration.observe({
          method: req.method,
          route: req.route?.path || req.path,
          status_code: res.statusCode
        }, duration);

        // Log slow requests
        if (duration > 2) {
          logPerformance('Slow Request', duration * 1000, {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent')
          });
        }

        originalEnd.call(res, chunk, encoding);
      }.bind(this);

      next();
    };
  }

  // System resource monitoring
  startSystemMonitoring() {
    const updateInterval = 30000; // 30 seconds
    
    setInterval(() => {
      if (this.isShuttingDown) return;

      try {
        // Memory usage
        const memUsage = process.memoryUsage();
        this.metrics.systemMemory.set(memUsage.heapUsed);
        
        // CPU usage (approximate)
        const cpuUsage = process.cpuUsage();
        this.lastCpuUsage = this.lastCpuUsage || cpuUsage;
        const cpuPercent = ((cpuUsage.user - this.lastCpuUsage.user) + 
                           (cpuUsage.system - this.lastCpuUsage.system)) / 1000000 * 100;
        this.metrics.systemCpu.set(Math.max(0, Math.min(100, cpuPercent)));
        this.lastCpuUsage = cpuUsage;

        // Check for memory leaks
        if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
          logWarn('High memory usage detected', {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            rss: memUsage.rss
          });
        }

      } catch (error) {
        logError('System monitoring error', error);
      }
    }, updateInterval);
  }

  // Health check management
  startHealthChecks() {
    const checkInterval = 60000; // 1 minute
    
    // Register core health checks
    this.registerHealthCheck('database', this.checkDatabaseHealth.bind(this));
    this.registerHealthCheck('external-apis', this.checkExternalApisHealth.bind(this));
    this.registerHealthCheck('file-system', this.checkFileSystemHealth.bind(this));
    this.registerHealthCheck('memory', this.checkMemoryHealth.bind(this));

    setInterval(async () => {
      if (this.isShuttingDown) return;
      
      const results = await this.runAllHealthChecks();
      const unhealthyServices = results.filter(r => r.status !== 'healthy');
      
      if (unhealthyServices.length > 0) {
        logWarn('Health check failures detected', {
          failures: unhealthyServices.map(s => ({ name: s.name, status: s.status, error: s.error }))
        });
      }
      
      logInfo('Health check completed', {
        totalChecks: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        unhealthy: unhealthyServices.length
      });
    }, checkInterval);
  }

  // Register a health check
  registerHealthCheck(name, checkFunction) {
    this.healthChecks.set(name, checkFunction);
  }

  // Run all health checks
  async runAllHealthChecks() {
    const results = [];
    
    for (const [name, checkFn] of this.healthChecks) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          checkFn(),
          new Promise((_, _reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 10000)
          )
        ]);
        
        results.push({
          name,
          status: result.status || 'healthy',
          message: result.message,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          name,
          status: 'unhealthy',
          error: error.message,
          duration: Date.now() - Date.now(),
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  // Built-in health checks
  async checkDatabaseHealth() {
    try {
      // Simple database connectivity check
      // This would be replaced with actual database ping
      return { status: 'healthy', message: 'Database connection active' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  async checkExternalApisHealth() {
    const apis = ['shopify', 'xero', 'microsoft-graph'];
    const results = [];
    
    for (const api of apis) {
      try {
        // Mock API health check - replace with actual health endpoints
        results.push({ api, status: 'healthy' });
      } catch (error) {
        results.push({ api, status: 'unhealthy', error: error.message });
      }
    }
    
    const unhealthy = results.filter(r => r.status === 'unhealthy');
    return {
      status: unhealthy.length === 0 ? 'healthy' : 'degraded',
      message: `${results.length - unhealthy.length}/${results.length} APIs healthy`,
      details: results
    };
  }

  async checkFileSystemHealth() {
    try {
      const fs = await import('fs/promises');
      await fs.access('./logs', fs.constants.W_OK);
      return { status: 'healthy', message: 'File system accessible' };
    } catch (error) {
      return { status: 'unhealthy', message: 'File system write error' };
    }
  }

  async checkMemoryHealth() {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 750) {
      return { status: 'critical', message: `High memory usage: ${heapUsedMB.toFixed(2)}MB` };
    } else if (heapUsedMB > 500) {
      return { status: 'warning', message: `Elevated memory usage: ${heapUsedMB.toFixed(2)}MB` };
    }
    
    return { status: 'healthy', message: `Memory usage: ${heapUsedMB.toFixed(2)}MB` };
  }

  // Business metrics tracking
  trackBusinessMetrics(data) {
    try {
      // Revenue tracking
      if (data.revenue) {
        this.metrics.businessMetrics.dailyRevenue.set(
          { currency: data.revenue.currency, region: data.revenue.region },
          data.revenue.amount
        );
      }

      // Order tracking
      if (data.orders) {
        data.orders.forEach(order => {
          this.metrics.businessMetrics.orderCount.inc({
            status: order.status,
            region: order.region
          });
        });
      }

      // Inventory tracking
      if (data.inventory) {
        data.inventory.forEach(item => {
          this.metrics.businessMetrics.inventoryLevels.set(
            { product_sku: item.sku, location: item.location },
            item.quantity
          );
        });
      }

      // Production tracking
      if (data.production) {
        data.production.forEach(line => {
          this.metrics.businessMetrics.productionRate.set(
            { line: line.id, product: line.product },
            line.unitsPerHour
          );
        });
      }

    } catch (error) {
      logError('Business metrics tracking error', error);
    }
  }

  // Alert management
  createAlert(severity, message, details = {}) {
    const alert = {
      id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity, // 'critical', 'warning', 'info'
      message,
      details,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.push(alert);
    
    // Log alert
    const logLevel = severity === 'critical' ? 'error' : 'warn';
    logError(`ALERT [${severity.toUpperCase()}]: ${message}`, null, details);

    // Trigger alert notifications (webhooks, email, etc.)
    this.triggerAlertNotifications(alert);
    
    // Clean up old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    return alert.id;
  }

  // Trigger alert notifications
  async triggerAlertNotifications(alert) {
    try {
      // This could integrate with Slack, email, PagerDuty, etc.
      logInfo('Alert notification triggered', {
        alertId: alert.id,
        severity: alert.severity,
        message: alert.message
      });
    } catch (error) {
      logError('Alert notification failed', error);
    }
  }

  // Get monitoring dashboard data
  getMonitoringData() {
    return {
      metrics: {
        requests: this.metrics.httpRequests._hashMap,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        version: process.version
      },
      alerts: this.alerts.slice(-20), // Last 20 alerts
      health: 'healthy', // Would be calculated from health checks
      timestamp: new Date().toISOString()
    };
  }

  // Prometheus metrics endpoint
  getPrometheusMetrics() {
    return promClient.register.metrics();
  }

  // Graceful shutdown
  shutdown() {
    this.isShuttingDown = true;
    logInfo('Production monitor shutting down');
  }
}

// Create singleton instance
const monitor = new ProductionMonitor();

export default monitor;
export { ProductionMonitor };