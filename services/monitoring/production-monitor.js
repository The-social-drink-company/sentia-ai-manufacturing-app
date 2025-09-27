#!/usr/bin/env node

/**
 * Production Monitoring and Alerting System
 * Monitors system health, data sync status, and user activity
 */

import { PrismaClient } from '@prisma/client';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';
import { dataSyncScheduler } from '../scheduler/data-sync-scheduler.js';
import { amazonSPAPI } from '../api/amazon-sp-api-config.js';

const prisma = new PrismaClient();

class ProductionMonitor {
  constructor() {
    this.alertThresholds = {
      database: {
        maxConnectionTime: 5000, // 5 seconds
        maxQueryTime: 10000 // 10 seconds
      },
      dataSync: {
        maxFailures: 3, // consecutive failures
        maxDelayHours: 8 // hours without successful sync
      },
      system: {
        maxMemoryUsage: 85, // percentage
        maxCpuUsage: 80, // percentage
        minDiskSpace: 10 // GB
      },
      users: {
        maxFailedLogins: 5, // per hour per user
        inactiveAdminDays: 7 // days
      }
    };

    this.monitoringData = {
      startTime: new Date(),
      healthChecks: [],
      alerts: [],
      metrics: {
        database: {},
        apis: {},
        sync: {},
        system: {},
        users: {}
      }
    };

    this.alertHandlers = new Map();
    this.isMonitoring = false;
    this.monitorInterval = null;
  }

  async initialize() {
    try {
      logInfo('Initializing Production Monitor');
      
      // Set up alert handlers
      this.setupAlertHandlers();
      
      // Start monitoring
      await this.startMonitoring();
      
      logInfo('Production Monitor initialized successfully');
      
    } catch (error) {
      logError('Failed to initialize Production Monitor', error);
      throw error;
    }
  }

  setupAlertHandlers() {
    // Email alert handler (placeholder)
    this.alertHandlers.set(_'email', async _(alert) => {
      logWarn('Email alert triggered', alert);
      // Implement actual email sending logic
    });

    // Slack alert handler (placeholder)
    this.alertHandlers.set(_'slack', async _(alert) => {
      logWarn('Slack alert triggered', alert);
      // Implement actual Slack notification logic
    });

    // SMS alert handler (placeholder)
    this.alertHandlers.set(_'sms', async _(alert) => {
      logWarn('SMS alert triggered', alert);
      // Implement actual SMS sending logic
    });

    logInfo('Alert handlers configured');
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      logWarn('Production monitor already running');
      return;
    }

    // Perform initial health check
    await this.performComprehensiveHealthCheck();

    // Start periodic monitoring (every 5 minutes)
    this.monitorInterval = setInterval(async () => {
      try {
        await this.performRoutineMonitoring();
      } catch (error) {
        logError('Routine monitoring failed', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    this.isMonitoring = true;
    logInfo('Production monitoring started');
  }

  async performComprehensiveHealthCheck() {
    logInfo('Performing comprehensive health check');

    const healthCheck = {
      timestamp: new Date(),
      database: await this.checkDatabaseHealth(),
      apis: await this.checkAPIHealth(),
      dataSync: await this.checkDataSyncHealth(),
      system: await this.checkSystemHealth(),
      users: await this.checkUserHealth(),
      overall: 'unknown'
    };

    // Determine overall health
    const components = [
      healthCheck.database,
      healthCheck.apis,
      healthCheck.dataSync,
      healthCheck.system,
      healthCheck.users
    ];

    const healthyCount = components.filter(c => c.status === 'healthy').length;
    const warningCount = components.filter(c => c.status === 'warning').length;
    const criticalCount = components.filter(c => c.status === 'critical').length;

    if (criticalCount > 0) {
      healthCheck.overall = 'critical';
    } else if (warningCount > 0) {
      healthCheck.overall = 'warning';
    } else if (healthyCount === components.length) {
      healthCheck.overall = 'healthy';
    } else {
      healthCheck.overall = 'degraded';
    }

    // Store health check result
    this.monitoringData.healthChecks.unshift(healthCheck);
    
    // Keep only last 100 health checks
    if (this.monitoringData.healthChecks.length > 100) {
      this.monitoringData.healthChecks = this.monitoringData.healthChecks.slice(0, 100);
    }

    // Generate alerts for critical issues
    await this.processHealthCheckAlerts(healthCheck);

    logInfo('Health check completed', { 
      overall: healthCheck.overall,
      components: components.length,
      healthy: healthyCount,
      warnings: warningCount,
      critical: criticalCount
    });

    return healthCheck;
  }

  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      await prisma.$queryRaw`SELECT 1 as test`;
      const connectionTime = Date.now() - startTime;

      // Check query performance
      const queryStartTime = Date.now();
      const userCount = await prisma.user.count();
      const queryTime = Date.now() - queryStartTime;

      // Get database statistics if available
      let dbStats = {};
      try {
        const stats = await prisma.$queryRaw`
          SELECT 
            pg_database_size(current_database()) as size,
            (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
        `;
        if (stats && stats.length > 0) {
          dbStats = stats[0];
        }
      } catch (error) {
        // Ignore stats errors
      }

      const health = {
        status: 'healthy',
        connectionTime,
        queryTime,
        userCount,
        ...dbStats,
        issues: []
      };

      // Check for performance issues
      if (connectionTime > this.alertThresholds.database.maxConnectionTime) {
        health.status = 'warning';
        health.issues.push(`Slow database connection: ${connectionTime}ms`);
      }

      if (queryTime > this.alertThresholds.database.maxQueryTime) {
        health.status = 'warning';
        health.issues.push(`Slow query performance: ${queryTime}ms`);
      }

      this.monitoringData.metrics.database = health;
      return health;

    } catch (error) {
      logError('Database health check failed', error);
      
      const health = {
        status: 'critical',
        error: error.message,
        issues: ['Database connection failed']
      };
      
      this.monitoringData.metrics.database = health;
      return health;
    }
  }

  async checkAPIHealth() {
    const apiHealth = {
      status: 'healthy',
      services: {},
      issues: []
    };

    // Check Amazon SP-API
    try {
      const amazonStatus = amazonSPAPI.getConnectionStatus();
      apiHealth.services.amazon = {
        configured: amazonStatus.configured,
        connected: amazonStatus.connected,
        status: amazonStatus.connected ? 'healthy' : (amazonStatus.configured ? 'warning' : 'not_configured')
      };

      if (!amazonStatus.configured) {
        apiHealth.issues.push('Amazon SP-API not configured');
        if (apiHealth.status === 'healthy') apiHealth.status = 'warning';
      } else if (!amazonStatus.connected) {
        apiHealth.issues.push('Amazon SP-API not connected');
        apiHealth.status = 'warning';
      }

    } catch (error) {
      apiHealth.services.amazon = { status: 'critical', error: error.message };
      apiHealth.issues.push(`Amazon SP-API error: ${error.message}`);
      apiHealth.status = 'critical';
    }

    // Check other APIs (placeholder)
    apiHealth.services.shopify = { status: 'not_implemented' };
    apiHealth.services.unleashed = { status: 'not_implemented' };
    apiHealth.services.xero = { status: 'not_implemented' };

    this.monitoringData.metrics.apis = apiHealth;
    return apiHealth;
  }

  async checkDataSyncHealth() {
    try {
      const syncStatus = dataSyncScheduler.getScheduleStatus();
      const recentSyncs = dataSyncScheduler.getSyncHistory(10);

      const health = {
        status: 'healthy',
        schedulerRunning: syncStatus.schedulerRunning,
        activeSchedules: Object.keys(syncStatus.schedules).length,
        recentSyncs: recentSyncs.length,
        issues: []
      };

      if (!syncStatus.schedulerRunning) {
        health.status = 'critical';
        health.issues.push('Data sync scheduler not running');
      }

      // Check for consecutive failures
      const recentFailures = recentSyncs.filter(sync => !sync.success);
      if (recentFailures.length >= this.alertThresholds.dataSync.maxFailures) {
        health.status = 'warning';
        health.issues.push(`${recentFailures.length} consecutive sync failures`);
      }

      // Check for stale data (no successful sync in X hours)
      if (recentSyncs.length > 0) {
        const lastSuccessfulSync = recentSyncs.find(sync => sync.success);
        if (lastSuccessfulSync) {
          const hoursSinceLastSync = (Date.now() - new Date(lastSuccessfulSync.startTime).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastSync > this.alertThresholds.dataSync.maxDelayHours) {
            health.status = 'warning';
            health.issues.push(`No successful sync in ${Math.round(hoursSinceLastSync)} hours`);
          }
        }
      }

      health.syncHistory = recentSyncs.slice(0, 5); // Include recent history

      this.monitoringData.metrics.sync = health;
      return health;

    } catch (error) {
      logError('Data sync health check failed', error);
      
      const health = {
        status: 'critical',
        error: error.message,
        issues: ['Unable to check sync status']
      };
      
      this.monitoringData.metrics.sync = health;
      return health;
    }
  }

  async checkSystemHealth() {
    try {
      const health = {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        issues: []
      };

      // Calculate memory usage percentage
      const memoryUsagePercent = (health.memory.heapUsed / health.memory.heapTotal) * 100;
      health.memoryUsagePercent = Math.round(memoryUsagePercent);

      if (memoryUsagePercent > this.alertThresholds.system.maxMemoryUsage) {
        health.status = 'warning';
        health.issues.push(`High memory usage: ${Math.round(memoryUsagePercent)}%`);
      }

      // Check environment
      health.environment = {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        arch: process.arch
      };

      this.monitoringData.metrics.system = health;
      return health;

    } catch (error) {
      logError('System health check failed', error);
      
      const health = {
        status: 'critical',
        error: error.message,
        issues: ['System health check failed']
      };
      
      this.monitoringData.metrics.system = health;
      return health;
    }
  }

  async checkUserHealth() {
    try {
      const health = {
        status: 'healthy',
        issues: []
      };

      // Get user statistics
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: { isActive: true }
      });
      const adminUsers = await prisma.user.count({
        where: { is_admin: true, isActive: true }
      });

      // Check for users who haven't logged in recently
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const inactiveAdmins = await prisma.user.count({
        where: {
          is_admin: true,
          isActive: true,
          OR: [
            { last_login: { lt: sevenDaysAgo } },
            { last_login: null }
          ]
        }
      });

      health.stats = {
        totalUsers,
        activeUsers,
        adminUsers,
        inactiveAdmins
      };

      // Generate warnings
      if (adminUsers === 0) {
        health.status = 'critical';
        health.issues.push('No active admin users');
      } else if (inactiveAdmins > 0) {
        health.status = 'warning';
        health.issues.push(`${inactiveAdmins} admin users inactive for 7+ days`);
      }

      if (totalUsers === 0) {
        health.status = 'critical';
        health.issues.push('No users in system');
      }

      this.monitoringData.metrics.users = health;
      return health;

    } catch (error) {
      logError('User health check failed', error);
      
      const health = {
        status: 'critical',
        error: error.message,
        issues: ['User health check failed']
      };
      
      this.monitoringData.metrics.users = health;
      return health;
    }
  }

  async processHealthCheckAlerts(healthCheck) {
    const criticalIssues = [];
    const warningIssues = [];

    // Collect all issues
    Object.values(healthCheck).forEach(component => {
      if (component && component.issues) {
        if (component.status === 'critical') {
          criticalIssues.push(...component.issues);
        } else if (component.status === 'warning') {
          warningIssues.push(...component.issues);
        }
      }
    });

    // Generate alerts for critical issues
    if (criticalIssues.length > 0) {
      await this.generateAlert('critical', 'System Critical Issues', criticalIssues);
    }

    // Generate alerts for warnings (but limit frequency)
    if (warningIssues.length > 0) {
      await this.generateAlert('warning', 'System Warnings', warningIssues);
    }
  }

  async generateAlert(severity, title, issues) {
    const alert = {
      id: `alert-${Date.now()}`,
      severity,
      title,
      issues,
      timestamp: new Date(),
      resolved: false
    };

    // Store alert
    this.monitoringData.alerts.unshift(alert);

    // Keep only last 50 alerts
    if (this.monitoringData.alerts.length > 50) {
      this.monitoringData.alerts = this.monitoringData.alerts.slice(0, 50);
    }

    // Send notifications
    if (severity === 'critical') {
      await this.sendAlert(alert);
    }

    logWarn('Alert generated', alert);
    return alert;
  }

  async sendAlert(alert) {
    // Send to all configured alert handlers
    for (const [handlerName, handler] of this.alertHandlers) {
      try {
        await handler(alert);
        logInfo(`Alert sent via ${handlerName}`, { alertId: alert.id });
      } catch (error) {
        logError(`Failed to send alert via ${handlerName}`, error);
      }
    }
  }

  async performRoutineMonitoring() {
    // Lighter weight monitoring for periodic checks
    const quickCheck = {
      timestamp: new Date(),
      database: await this.quickDatabaseCheck(),
      apis: await this.quickAPICheck(),
      sync: await this.checkDataSyncHealth()
    };

    // Store quick check result
    this.monitoringData.healthChecks.unshift(quickCheck);

    // Generate alerts if needed
    if (quickCheck.database?.status === 'critical' || 
        quickCheck.apis?.status === 'critical' ||
        quickCheck.sync?.status === 'critical') {
      await this.generateAlert('critical', 'Routine Monitoring Alert', 
        [quickCheck.database, quickCheck.apis, quickCheck.sync]
          .filter(c => c?.status === 'critical')
          .flatMap(c => c.issues || [])
      );
    }
  }

  async quickDatabaseCheck() {
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'healthy' : 'warning',
        responseTime,
        issues: responseTime >= 1000 ? [`Slow database response: ${responseTime}ms`] : []
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        issues: ['Database connection failed']
      };
    }
  }

  async quickAPICheck() {
    const amazonStatus = amazonSPAPI.getConnectionStatus();
    
    return {
      status: amazonStatus.connected ? 'healthy' : 'warning',
      amazon: amazonStatus.connected,
      issues: !amazonStatus.connected ? ['Amazon SP-API not connected'] : []
    };
  }

  getMonitoringStatus() {
    const latestHealthCheck = this.monitoringData.healthChecks[0];
    
    return {
      isMonitoring: this.isMonitoring,
      startTime: this.monitoringData.startTime,
      uptime: Date.now() - this.monitoringData.startTime.getTime(),
      totalHealthChecks: this.monitoringData.healthChecks.length,
      totalAlerts: this.monitoringData.alerts.length,
      latestHealthCheck,
      recentAlerts: this.monitoringData.alerts.slice(0, 5),
      metrics: this.monitoringData.metrics
    };
  }

  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.isMonitoring = false;
    logInfo('Production monitoring stopped');
  }
}

export const productionMonitor = new ProductionMonitor();