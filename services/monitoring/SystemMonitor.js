/**
 * System Monitoring Service
 * 
 * Comprehensive monitoring for the CapLiquify Manufacturing Platform system.
 * Tracks performance metrics, health checks, error rates, and system resources.
 * 
 * Features:
 * - Real-time performance monitoring
 * - Health checks for all external services
 * - Error rate tracking and alerting
 * - Resource utilization monitoring
 * - Custom metrics collection
 * - Alert management with escalation
 */

import { PrismaClient } from '@prisma/client';
import { createUnifiedApiClient } from '../integration/UnifiedApiClient.js';
import { getApiKeyManager } from '../security/ApiKeyManager.js';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

const prisma = new PrismaClient();

class SystemMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = new Map();
    this.healthChecks = new Map();
    this.alerts = new Map();
    this.monitoringInterval = 60000; // 1 minute
    this.isMonitoring = false;
  }

  /**
   * Start system monitoring
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      logWarn('System monitoring already running');
      return;
    }

    this.isMonitoring = true;
    logInfo('Starting system monitoring', {
      interval: this.monitoringInterval,
      startTime: new Date().toISOString()
    });

    // Initial health check
    await this.performHealthChecks();

    // Start monitoring intervals
    this.startPerformanceMonitoring();
    this.startHealthCheckMonitoring();
    this.startResourceMonitoring();

    logInfo('System monitoring started successfully');
  }

  /**
   * Stop system monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    logInfo('System monitoring stopped');
  }

  /**
   * Start performance monitoring interval
   */
  startPerformanceMonitoring() {
    setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        await this.collectPerformanceMetrics();
      } catch (error) {
        logError('Performance monitoring error', {
          error: error.message
        });
      }
    }, this.monitoringInterval);
  }

  /**
   * Start health check monitoring interval
   */
  startHealthCheckMonitoring() {
    setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        await this.performHealthChecks();
      } catch (error) {
        logError('Health check monitoring error', {
          error: error.message
        });
      }
    }, this.monitoringInterval * 5); // Every 5 minutes
  }

  /**
   * Start resource monitoring interval
   */
  startResourceMonitoring() {
    setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        await this.collectResourceMetrics();
      } catch (error) {
        logError('Resource monitoring error', {
          error: error.message
        });
      }
    }, this.monitoringInterval * 2); // Every 2 minutes
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      const now = Date.now();
      const uptime = now - this.startTime;

      // Database query performance
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - dbStart;

      // API response times (sample recent requests)
      const recentApiLogs = await prisma.auditLog.findMany({
        where: {
          operation: {
            startsWith: 'API_'
          },
          timestamp: {
            gte: new Date(now - this.monitoringInterval)
          }
        },
        take: 100,
        orderBy: {
          timestamp: 'desc'
        }
      });

      const avgApiResponseTime = recentApiLogs.length > 0
        ? recentApiLogs.reduce((sum, log) => {
            const details = JSON.parse(log.details || '{}');
            return sum + (details.responseTime || 0);
          }, 0) / recentApiLogs.length
        : 0;

      const metrics = {
        timestamp: new Date().toISOString(),
        uptime,
        database: {
          responseTime: dbResponseTime,
          status: dbResponseTime < 1000 ? 'healthy' : 'slow'
        },
        api: {
          averageResponseTime: avgApiResponseTime,
          requestCount: recentApiLogs.length,
          status: avgApiResponseTime < 2000 ? 'healthy' : 'slow'
        },
        system: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };

      this.metrics.set('performance', metrics);

      // Store metrics in database
      await this.storeMetrics('performance', metrics);

      // Check for performance alerts
      await this.checkPerformanceAlerts(metrics);

      logInfo('Performance metrics collected', {
        dbResponseTime,
        avgApiResponseTime,
        requestCount: recentApiLogs.length
      });

    } catch (error) {
      logError('Failed to collect performance metrics', {
        error: error.message
      });
    }
  }

  /**
   * Perform health checks for all services
   */
  async performHealthChecks() {
    try {
      const healthChecks = {
        timestamp: new Date().toISOString(),
        database: await this.checkDatabaseHealth(),
        apiServices: await this.checkApiServicesHealth(),
        apiKeys: await this.checkApiKeysHealth(),
        overall: 'healthy'
      };

      // Determine overall health
      const hasUnhealthy = Object.values(healthChecks).some(check => 
        typeof check === 'object' && check.status === 'unhealthy'
      );
      
      healthChecks.overall = hasUnhealthy ? 'unhealthy' : 'healthy';

      this.healthChecks.set('current', healthChecks);

      // Store health check results
      await this.storeMetrics('health', healthChecks);

      // Check for health alerts
      await this.checkHealthAlerts(healthChecks);

      logInfo('Health checks completed', {
        overall: healthChecks.overall,
        timestamp: healthChecks.timestamp
      });

      return healthChecks;

    } catch (error) {
      logError('Failed to perform health checks', {
        error: error.message
      });

      const failedHealthCheck = {
        timestamp: new Date().toISOString(),
        overall: 'unhealthy',
        error: error.message
      };

      this.healthChecks.set('current', failedHealthCheck);
      return failedHealthCheck;
    }
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT COUNT(*) FROM "User"`;
      const responseTime = Date.now() - start;

      return {
        status: responseTime < 2000 ? 'healthy' : 'slow',
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logError('Database health check failed', {
        error: error.message
      });

      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Check API services health
   */
  async checkApiServicesHealth() {
    const apiClient = createUnifiedApiClient();
    const services = ['xero', 'shopify_uk', 'shopify_usa', 'amazon_uk', 'amazon_usa', 'unleashed'];
    const healthResults = {};

    for (const service of services) {
      try {
        const health = await apiClient.checkServiceHealth(service);
        healthResults[service] = {
          status: health.status,
          responseTime: health.responseTime,
          lastCheck: new Date().toISOString()
        };
      } catch (error) {
        healthResults[service] = {
          status: 'unhealthy',
          error: error.message,
          lastCheck: new Date().toISOString()
        };
      }
    }

    return healthResults;
  }

  /**
   * Check API keys health
   */
  async checkApiKeysHealth() {
    try {
      const apiKeyManager = getApiKeyManager();
      const healthReport = await apiKeyManager.validateApiKeyHealth();

      return {
        status: healthReport.errors.length > 0 ? 'unhealthy' : 
                healthReport.warnings.length > 0 ? 'warning' : 'healthy',
        totalKeys: healthReport.totalKeys,
        warnings: healthReport.warnings.length,
        errors: healthReport.errors.length,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Collect system resource metrics
   */
  async collectResourceMetrics() {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const resourceMetrics = {
        timestamp: new Date().toISOString(),
        memory: {
          rss: memoryUsage.rss,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          usage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          usage: ((cpuUsage.user + cpuUsage.system) / 1000000) // Convert to seconds
        },
        uptime: process.uptime(),
        pid: process.pid
      };

      this.metrics.set('resources', resourceMetrics);

      // Store resource metrics
      await this.storeMetrics('resources', resourceMetrics);

      // Check for resource alerts
      await this.checkResourceAlerts(resourceMetrics);

      logInfo('Resource metrics collected', {
        memoryUsage: resourceMetrics.memory.usage.toFixed(2) + '%',
        uptime: resourceMetrics.uptime
      });

    } catch (error) {
      logError('Failed to collect resource metrics', {
        error: error.message
      });
    }
  }

  /**
   * Store metrics in database
   */
  async storeMetrics(type, data) {
    try {
      await prisma.systemMetric.create({
        data: {
          type,
          data: JSON.stringify(data),
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development'
        }
      });
    } catch (error) {
      logError('Failed to store metrics', {
        type,
        error: error.message
      });
    }
  }

  /**
   * Check performance alerts
   */
  async checkPerformanceAlerts(metrics) {
    const alerts = [];

    // Database response time alert
    if (metrics.database.responseTime > 5000) {
      alerts.push({
        type: 'PERFORMANCE_DB_SLOW',
        severity: 'high',
        message: `Database response time is ${metrics.database.responseTime}ms`,
        threshold: 5000,
        value: metrics.database.responseTime
      });
    }

    // API response time alert
    if (metrics.api.averageResponseTime > 10000) {
      alerts.push({
        type: 'PERFORMANCE_API_SLOW',
        severity: 'medium',
        message: `Average API response time is ${metrics.api.averageResponseTime}ms`,
        threshold: 10000,
        value: metrics.api.averageResponseTime
      });
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  /**
   * Check health alerts
   */
  async checkHealthAlerts(healthChecks) {
    const alerts = [];

    // Overall health alert
    if (healthChecks.overall === 'unhealthy') {
      alerts.push({
        type: 'HEALTH_SYSTEM_UNHEALTHY',
        severity: 'critical',
        message: 'System health check failed',
        details: healthChecks
      });
    }

    // Database health alert
    if (healthChecks.database?.status === 'unhealthy') {
      alerts.push({
        type: 'HEALTH_DATABASE_DOWN',
        severity: 'critical',
        message: 'Database is unhealthy',
        details: healthChecks.database
      });
    }

    // API services health alerts
    if (healthChecks.apiServices) {
      Object.entries(healthChecks.apiServices).forEach(([service, health]) => {
        if (health.status === 'unhealthy') {
          alerts.push({
            type: 'HEALTH_API_SERVICE_DOWN',
            severity: 'high',
            message: `API service ${service} is unhealthy`,
            service,
            details: health
          });
        }
      });
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  /**
   * Check resource alerts
   */
  async checkResourceAlerts(resourceMetrics) {
    const alerts = [];

    // Memory usage alert
    if (resourceMetrics.memory.usage > 90) {
      alerts.push({
        type: 'RESOURCE_MEMORY_HIGH',
        severity: 'high',
        message: `Memory usage is ${resourceMetrics.memory.usage.toFixed(2)}%`,
        threshold: 90,
        value: resourceMetrics.memory.usage
      });
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  /**
   * Process and store alert
   */
  async processAlert(alert) {
    try {
      const alertKey = `${alert.type}_${Date.now()}`;
      
      // Check if similar alert exists recently (prevent spam)
      const recentAlert = await prisma.systemAlert.findFirst({
        where: {
          type: alert.type,
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        }
      });

      if (recentAlert) {
        logInfo('Similar alert exists recently, skipping', {
          type: alert.type,
          lastAlert: recentAlert.timestamp
        });
        return;
      }

      // Store alert
      await prisma.systemAlert.create({
        data: {
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          details: JSON.stringify(alert),
          isResolved: false,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development'
        }
      });

      this.alerts.set(alertKey, alert);

      logWarn('System alert generated', {
        type: alert.type,
        severity: alert.severity,
        message: alert.message
      });

      // TODO: Implement alert notification (email, Slack, etc.)
      await this.sendAlertNotification(alert);

    } catch (error) {
      logError('Failed to process alert', {
        alert: alert.type,
        error: error.message
      });
    }
  }

  /**
   * Send alert notification (placeholder for future implementation)
   */
  async sendAlertNotification(alert) {
    // TODO: Implement notification system (email, Slack, webhook, etc.)
    logInfo('Alert notification would be sent', {
      type: alert.type,
      severity: alert.severity,
      message: alert.message
    });
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    const currentHealth = this.healthChecks.get('current');
    const currentMetrics = this.metrics.get('performance');
    const currentResources = this.metrics.get('resources');

    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      isMonitoring: this.isMonitoring,
      health: currentHealth,
      performance: currentMetrics,
      resources: currentResources,
      alertCount: this.alerts.size
    };
  }

  /**
   * Get monitoring dashboard data
   */
  async getMonitoringDashboard(timeframe = '24h') {
    try {
      const timeframeDays = timeframe.includes('h') 
        ? parseInt(timeframe) / 24 
        : parseInt(timeframe.replace('d', ''));
      
      const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

      // Get recent metrics
      const metrics = await prisma.systemMetric.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 1000
      });

      // Get recent alerts
      const alerts = await prisma.systemAlert.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      const dashboard = {
        timeframe,
        period: `${startDate.toISOString()} to ${new Date().toISOString()}`,
        currentStatus: this.getSystemStatus(),
        metrics: {
          total: metrics.length,
          byType: {}
        },
        alerts: {
          total: alerts.length,
          bySeverity: {},
          byType: {},
          recent: alerts.slice(0, 10)
        },
        trends: this.calculateTrends(metrics)
      };

      // Group metrics by type
      metrics.forEach(metric => {
        dashboard.metrics.byType[metric.type] = 
          (dashboard.metrics.byType[metric.type] || 0) + 1;
      });

      // Group alerts by severity and type
      alerts.forEach(alert => {
        dashboard.alerts.bySeverity[alert.severity] = 
          (dashboard.alerts.bySeverity[alert.severity] || 0) + 1;
        
        dashboard.alerts.byType[alert.type] = 
          (dashboard.alerts.byType[alert.type] || 0) + 1;
      });

      return dashboard;

    } catch (error) {
      logError('Failed to get monitoring dashboard', {
        timeframe,
        error: error.message
      });
      throw new Error('Monitoring dashboard generation failed');
    }
  }

  /**
   * Calculate trends from metrics data
   */
  calculateTrends(metrics) {
    const trends = {
      performance: {},
      resources: {},
      health: {}
    };

    // Group metrics by type and calculate averages
    const metricsByType = {};
    metrics.forEach(metric => {
      if (!metricsByType[metric.type]) {
        metricsByType[metric.type] = [];
      }
      metricsByType[metric.type].push(JSON.parse(metric.data));
    });

    // Calculate performance trends
    if (metricsByType.performance) {
      const perfMetrics = metricsByType.performance;
      trends.performance = {
        avgDbResponseTime: perfMetrics.reduce((sum, m) => 
          sum + (m.database?.responseTime || 0), 0) / perfMetrics.length,
        avgApiResponseTime: perfMetrics.reduce((sum, m) => 
          sum + (m.api?.averageResponseTime || 0), 0) / perfMetrics.length,
        totalRequests: perfMetrics.reduce((sum, m) => 
          sum + (m.api?.requestCount || 0), 0)
      };
    }

    // Calculate resource trends
    if (metricsByType.resources) {
      const resMetrics = metricsByType.resources;
      trends.resources = {
        avgMemoryUsage: resMetrics.reduce((sum, m) => 
          sum + (m.memory?.usage || 0), 0) / resMetrics.length,
        maxMemoryUsage: Math.max(...resMetrics.map(m => m.memory?.usage || 0)),
        avgUptime: resMetrics.reduce((sum, m) => 
          sum + (m.uptime || 0), 0) / resMetrics.length
      };
    }

    return trends;
  }
}

// Singleton instance
let systemMonitor = null;

/**
 * Get or create system monitor instance
 */
export function getSystemMonitor() {
  if (!systemMonitor) {
    systemMonitor = new SystemMonitor();
  }
  return systemMonitor;
}

/**
 * Initialize and start system monitoring
 */
export async function initializeSystemMonitoring() {
  const monitor = getSystemMonitor();
  await monitor.startMonitoring();
  return monitor;
}

export default SystemMonitor;