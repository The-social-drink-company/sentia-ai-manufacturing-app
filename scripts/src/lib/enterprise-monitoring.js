// Enterprise Monitoring and Alerting System
import EventEmitter from 'events';
import os from 'os';

class EnterpriseMonitoringSystem extends EventEmitter {
  constructor() {
    super();
    this.metrics = new Map();
    this.alerts = [];
    this.isRunning = false;
    this.monitoringInterval = null;
  }

  // System health monitoring
  async collectSystemMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem()
      },
      application: {
        activeConnections: 0, // TODO: Track from Express
        totalRequests: 0,     // TODO: Track from middleware
        errorRate: 0,         // TODO: Calculate from logs
        responseTime: 0       // TODO: Track from middleware
      }
    };

    this.metrics.set('system', metrics);
    return metrics;
  }

  // Database performance monitoring
  async collectDatabaseMetrics() {
    // TODO: Implement PostgreSQL metrics collection
    const dbMetrics = {
      timestamp: new Date().toISOString(),
      connections: {
        active: 0,
        idle: 0,
        total: 0
      },
      performance: {
        slowQueries: 0,
        avgQueryTime: 0,
        lockWaits: 0
      }
    };

    this.metrics.set('database', dbMetrics);
    return dbMetrics;
  }

  // API performance monitoring
  async collectApiMetrics() {
    const apiMetrics = {
      timestamp: new Date().toISOString(),
      amazon: {
        requestCount: 0,
        errorCount: 0,
        rateLimitHits: 0,
        avgResponseTime: 0
      },
      shopify: {
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0
      },
      unleashed: {
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0
      }
    };

    this.metrics.set('apis', apiMetrics);
    return apiMetrics;
  }

  // Alert evaluation
  evaluateAlerts(metrics) {
    const alerts = [];

    // CPU usage alert
    if (metrics.system.loadAverage[0] > 2.0) {
      alerts.push({
        severity: 'warning',
        type: 'high_cpu',
        message: `High CPU load: ${metrics.system.loadAverage[0].toFixed(2)}`,
        timestamp: new Date().toISOString()
      });
    }

    // Memory usage alert
    const memoryUsagePercent = (metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 80) {
      alerts.push({
        severity: 'critical',
        type: 'high_memory',
        message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }

    // Free memory alert
    const freeMemoryPercent = (metrics.system.freeMemory / metrics.system.totalMemory) * 100;
    if (freeMemoryPercent < 10) {
      alerts.push({
        severity: 'critical',
        type: 'low_memory',
        message: `Low system memory: ${freeMemoryPercent.toFixed(1)}% free`,
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  }

  // Send alert notifications
  async sendAlert(alert) {
    console.log(`[ALERT] [${alert.severity.toUpperCase()}] ${alert.message}`);
    
    // TODO: Implement email/Slack notifications
    // TODO: Store alerts in database
    
    this.alerts.push(alert);
    this.emit('alert', alert);
  }

  // Start monitoring
  start(intervalMs = 30000) {
    if (this.isRunning) {
      console.log('[MONITOR] Monitoring system already running');
      return;
    }

    this.isRunning = true;
    console.log('[MONITOR] Starting enterprise monitoring system');

    this.monitoringInterval = setInterval(async () => {
      try {
        const systemMetrics = await this.collectSystemMetrics();
        const dbMetrics = await this.collectDatabaseMetrics();
        const apiMetrics = await this.collectApiMetrics();

        const alerts = this.evaluateAlerts(systemMetrics);
        
        for (const alert of alerts) {
          await this.sendAlert(alert);
        }

        // Emit metrics for real-time dashboard updates
        this.emit('metrics', {
          system: systemMetrics,
          database: dbMetrics,
          apis: apiMetrics,
          alerts: this.alerts.slice(-10) // Last 10 alerts
        });

      } catch (error) {
        console.error('[MONITOR] Error collecting metrics:', error);
      }
    }, intervalMs);
  }

  // Stop monitoring
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    console.log('[MONITOR] Enterprise monitoring system stopped');
  }

  // Get current metrics
  getCurrentMetrics() {
    return {
      system: this.metrics.get('system'),
      database: this.metrics.get('database'),
      apis: this.metrics.get('apis'),
      alerts: this.alerts.slice(-20) // Last 20 alerts
    };
  }

  // Health check endpoint
  getHealthStatus() {
    const metrics = this.getCurrentMetrics();
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
    
    return {
      status: criticalAlerts > 0 ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      criticalAlerts,
      totalAlerts: this.alerts.length,
      isMonitoring: this.isRunning
    };
  }
}

// Singleton instance
const monitoringSystem = new EnterpriseMonitoringSystem();

export default monitoringSystem;
export { EnterpriseMonitoringSystem };