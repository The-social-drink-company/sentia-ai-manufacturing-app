#!/usr/bin/env node

/**
 * Enterprise Monitoring & Alerting System
 * Real-time monitoring for Sentia Manufacturing Dashboard across all environments
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Monitoring Configuration
const MONITORING_CONFIG = {
  environments: {
    development: {
      name: 'Development',
      url: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
      healthEndpoint: '/api/health',
      criticality: 'low',
      alertDelay: 300000 // 5 minutes
    },
    testing: {
      name: 'Testing (UAT)',
      url: 'https://sentiatest.financeflo.ai',
      healthEndpoint: '/api/health',
      criticality: 'medium',
      alertDelay: 120000 // 2 minutes
    },
    production: {
      name: 'Production',
      url: 'https://web-production-1f10.up.railway.app',
      healthEndpoint: '/api/health',
      criticality: 'critical',
      alertDelay: 30000 // 30 seconds
    }
  },
  thresholds: {
    responseTime: 2000, // 2 seconds
    availability: 99.5, // 99.5% uptime
    errorRate: 1.0, // 1% error rate
    cpuUsage: 80, // 80% CPU
    memoryUsage: 80 // 80% Memory
  },
  checkInterval: 30000, // 30 seconds
  alertChannels: ['console', 'file', 'webhook'], // Future: email, slack, etc.
  retentionPeriod: 7 * 24 * 60 * 60 * 1000 // 7 days
};

class EnterpriseMonitoring {
  constructor() {
    this.monitoringId = this.generateMonitoringId();
    this.startTime = Date.now();
    this.logFile = path.join(projectRoot, 'logs', `monitoring-${this.monitoringId}.log`);
    this.metricsFile = path.join(projectRoot, 'logs', `metrics-${Date.now()}.json`);
    this.alertsFile = path.join(projectRoot, 'logs', 'alerts.json');
    
    this.ensureDirectoryExists(path.dirname(this.logFile));
    
    this.metrics = {
      monitoringId: this.monitoringId,
      startTime: new Date().toISOString(),
      environments: {},
      alerts: [],
      systemHealth: 'UNKNOWN'
    };

    this.activeAlerts = new Map();
    this.healthHistory = new Map();
    
    this.log('INFO', `Enterprise Monitoring System Started - ID: ${this.monitoringId}`);
  }

  generateMonitoringId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const random = Math.random().toString(36).substring(2, 6);
    return `mon-${timestamp}-${random}`;
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    try {
      fs.appendFileSync(this.logFile, logEntry + (data ? '\n' + JSON.stringify(data, null, 2) : '') + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async checkHealth(environment) {
    const env = MONITORING_CONFIG.environments[environment];
    const startTime = Date.now();
    
    try {
      // HTTP Health Check
      const response = await this.makeHttpRequest(env.url + env.healthEndpoint, 10000);
      const responseTime = Date.now() - startTime;
      
      const healthData = {
        environment,
        timestamp: new Date().toISOString(),
        status: 'HEALTHY',
        responseTime,
        httpStatus: response.status,
        details: response.data,
        checks: {
          http: responseTime < MONITORING_CONFIG.thresholds.responseTime ? 'PASS' : 'FAIL',
          database: response.data?.database === 'connected' ? 'PASS' : 'FAIL',
          services: response.data?.services ? 'PASS' : 'WARN'
        }
      };

      // Store health history
      if (!this.healthHistory.has(environment)) {
        this.healthHistory.set(environment, []);
      }
      
      const history = this.healthHistory.get(environment);
      history.push(healthData);
      
      // Keep only last 100 checks
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      this.metrics.environments[environment] = healthData;
      
      // Clear any existing alerts for this environment
      this.clearAlert(environment, 'HEALTH_CHECK');
      
      return healthData;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const healthData = {
        environment,
        timestamp: new Date().toISOString(),
        status: 'UNHEALTHY',
        responseTime,
        error: error.message,
        checks: {
          http: 'FAIL',
          database: 'UNKNOWN',
          services: 'UNKNOWN'
        }
      };

      this.metrics.environments[environment] = healthData;
      
      // Trigger alert
      this.triggerAlert(environment, 'HEALTH_CHECK', `Health check failed: ${error.message}`, env.criticality);
      
      return healthData;
    }
  }

  async makeHttpRequest(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      try {
        const result = execSync(`curl -s -w "\\n%{http_code}" "${url}"`, {
          encoding: 'utf8',
          timeout
        });
        
        const lines = result.trim().split('\n');
        const httpStatus = parseInt(lines[lines.length - 1]);
        const body = lines.slice(0, -1).join('\n');
        
        let data;
        try {
          data = JSON.parse(body);
        } catch (e) {
          data = { body };
        }
        
        resolve({
          status: httpStatus,
          data,
          responseTime: Date.now() - startTime
        });
      } catch (error) {
        reject(new Error(`HTTP request failed: ${error.message}`));
      }
    });
  }

  triggerAlert(environment, type, message, severity) {
    const alertKey = `${environment}-${type}`;
    
    // Check if alert already exists (avoid spam)
    if (this.activeAlerts.has(alertKey)) {
      return;
    }
    
    const alert = {
      id: this.generateAlertId(),
      environment,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      status: 'ACTIVE'
    };
    
    this.activeAlerts.set(alertKey, alert);
    this.metrics.alerts.push(alert);
    
    this.log('ALERT', `${severity.toUpperCase()} ALERT [${environment}]: ${message}`, alert);
    
    // Send alert through configured channels
    this.sendAlert(alert);
    
    // Save alerts to file
    this.saveAlerts();
  }

  clearAlert(environment, type) {
    const alertKey = `${environment}-${type}`;
    
    if (this.activeAlerts.has(alertKey)) {
      const alert = this.activeAlerts.get(alertKey);
      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date().toISOString();
      
      this.activeAlerts.delete(alertKey);
      this.log('INFO', `Alert resolved [${environment}]: ${type}`);
      
      this.saveAlerts();
    }
  }

  generateAlertId() {
    return 'alert-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  }

  sendAlert(alert) {
    // Console logging (always enabled)
    console.log(`🚨 ${alert.severity.toUpperCase()} ALERT: ${alert.message}`);
    
    // File logging
    if (MONITORING_CONFIG.alertChannels.includes('file')) {
      const alertLogFile = path.join(projectRoot, 'logs', 'alerts.log');
      const alertEntry = `[${alert.timestamp}] [${alert.severity}] [${alert.environment}] ${alert.message}\n`;
      fs.appendFileSync(alertLogFile, alertEntry);
    }
    
    // Future integrations: Slack, email, PagerDuty, etc.
    if (MONITORING_CONFIG.alertChannels.includes('webhook')) {
      // Webhook integration would go here
      this.log('INFO', 'Webhook alert sent', alert);
    }
  }

  saveAlerts() {
    try {
      fs.writeFileSync(this.alertsFile, JSON.stringify({
        activeAlerts: Array.from(this.activeAlerts.values()),
        alertHistory: this.metrics.alerts
      }, null, 2));
    } catch (error) {
      this.log('ERROR', 'Failed to save alerts', error);
    }
  }

  calculateSystemHealth() {
    const environments = Object.values(this.metrics.environments);
    
    if (environments.length === 0) {
      return 'UNKNOWN';
    }
    
    const healthyCount = environments.filter(env => env.status === 'HEALTHY').length;
    const totalCount = environments.length;
    const healthPercentage = (healthyCount / totalCount) * 100;
    
    if (healthPercentage === 100) {
      return 'HEALTHY';
    } else if (healthPercentage >= 80) {
      return 'DEGRADED';
    } else {
      return 'CRITICAL';
    }
  }

  async runMonitoringCycle() {
    this.log('INFO', 'Starting monitoring cycle');
    
    const promises = Object.keys(MONITORING_CONFIG.environments).map(env => 
      this.checkHealth(env)
    );
    
    try {
      await Promise.allSettled(promises);
      
      // Calculate overall system health
      this.metrics.systemHealth = this.calculateSystemHealth();
      this.metrics.lastUpdate = new Date().toISOString();
      
      // Save metrics
      fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
      
      this.log('INFO', `Monitoring cycle completed - System Health: ${this.metrics.systemHealth}`);
      
      // Log environment status summary
      Object.entries(this.metrics.environments).forEach(([env, data]) => {
        const status = data.status === 'HEALTHY' ? '✅' : '❌';
        const responseTime = data.responseTime ? `${data.responseTime}ms` : 'N/A';
        this.log('INFO', `${status} ${env.toUpperCase()}: ${data.status} (${responseTime})`);
      });
      
    } catch (error) {
      this.log('ERROR', 'Monitoring cycle failed', error);
    }
  }

  async startContinuousMonitoring() {
    this.log('INFO', `Starting continuous monitoring with ${MONITORING_CONFIG.checkInterval / 1000}s intervals`);
    
    // Run initial cycle
    await this.runMonitoringCycle();
    
    // Set up recurring monitoring
    const intervalId = setInterval(async () => {
      await this.runMonitoringCycle();
    }, MONITORING_CONFIG.checkInterval);
    
    // Graceful shutdown handling
    process.on('SIGINT', () => {
      this.log('INFO', 'Shutting down monitoring system...');
      clearInterval(intervalId);
      process.exit(0);
    });
    
    this.log('INFO', 'Continuous monitoring started. Press Ctrl+C to stop.');
  }

  generateStatusReport() {
    const report = {
      timestamp: new Date().toISOString(),
      systemHealth: this.metrics.systemHealth,
      environments: this.metrics.environments,
      activeAlerts: Array.from(this.activeAlerts.values()),
      summary: {
        totalEnvironments: Object.keys(MONITORING_CONFIG.environments).length,
        healthyEnvironments: Object.values(this.metrics.environments).filter(e => e.status === 'HEALTHY').length,
        activeAlertCount: this.activeAlerts.size,
        uptimePercentage: this.calculateUptimePercentage()
      }
    };
    
    return report;
  }

  calculateUptimePercentage() {
    // Calculate uptime based on health history
    let totalChecks = 0;
    let healthyChecks = 0;
    
    this.healthHistory.forEach((history) => {
      totalChecks += history.length;
      healthyChecks += history.filter(check => check.status === 'HEALTHY').length;
    });
    
    if (totalChecks === 0) return 0;
    return ((healthyChecks / totalChecks) * 100).toFixed(2);
  }

  // CLI Interface
  static async cli() {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';

    const monitor = new EnterpriseMonitoring();

    switch (command) {
      case 'start':
      case 'continuous':
        await monitor.startContinuousMonitoring();
        break;
        
      case 'check':
        await monitor.runMonitoringCycle();
        break;
        
      case 'status':
        const report = monitor.generateStatusReport();
        console.log(JSON.stringify(report, null, 2));
        break;
        
      case 'health':
        const environment = args[1] || 'development';
        const health = await monitor.checkHealth(environment);
        console.log(JSON.stringify(health, null, 2));
        break;
        
      default:
        console.log(`
Enterprise Monitoring System - Sentia Manufacturing Dashboard

Usage:
  node scripts/monitoring-system.js <command> [options]

Commands:
  start       Start continuous monitoring (default)
  check       Run single monitoring cycle
  status      Generate status report
  health <env> Check health of specific environment

Examples:
  node scripts/monitoring-system.js start
  node scripts/monitoring-system.js check
  node scripts/monitoring-system.js health production
        `);
        break;
    }
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  EnterpriseMonitoring.cli().catch(console.error);
}

export default EnterpriseMonitoring;