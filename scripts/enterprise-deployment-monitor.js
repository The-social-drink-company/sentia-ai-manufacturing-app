#!/usr/bin/env node

/**
 * Enterprise Railway Deployment Health Monitor
 * Real-time monitoring and alerting system for all Railway environments
 */

import https from 'https';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

class EnterpriseDeploymentMonitor {
  constructor() {
    this.environments = {
      development: {
        name: 'Development',
        url: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
        healthEndpoint: '/api/health',
        token: process.env.RAILWAY_TOKEN_DEVELOPMENT,
        sla: 99.5
      },
      testing: {
        name: 'Testing/UAT', 
        url: 'https://sentia-manufacturing-dashboard-testing.up.railway.app',
        healthEndpoint: '/api/health',
        token: process.env.RAILWAY_TOKEN_TESTING,
        sla: 99.9
      },
      production: {
        name: 'Production',
        url: 'https://web-production-1f10.up.railway.app',
        healthEndpoint: '/api/health',
        token: process.env.RAILWAY_TOKEN_PRODUCTION,
        sla: 99.99
      }
    };
    
    this.monitoring = {
      interval: 30000, // 30 seconds
      timeout: 10000,  // 10 seconds
      retries: 3,
      alertThreshold: 3 // consecutive failures
    };

    this.alerts = {
      consecutiveFailures: {},
      downtimeStart: {},
      lastStatus: {}
    };
  }

  async checkEnvironmentHealth(envName, config) {
    const startTime = Date.now();
    
    try {
      // Test main application
      const appStatus = await this.testEndpoint(`${config.url}`, 'GET');
      
      // Test API health endpoint
      const apiStatus = await this.testEndpoint(`${config.url}${config.healthEndpoint}`, 'GET');
      
      // Test authentication endpoints
      const authStatus = await this.testEndpoint(`${config.url}/api/auth/status`, 'GET');
      
      const responseTime = Date.now() - startTime;
      
      const healthReport = {
        environment: envName,
        timestamp: new Date().toISOString(),
        status: 'HEALTHY',
        responseTime,
        checks: {
          application: appStatus,
          api: apiStatus,
          authentication: authStatus
        },
        sla: {
          target: config.sla,
          uptime: this.calculateUptime(envName)
        }
      };

      // Reset failure counter on success
      this.alerts.consecutiveFailures[envName] = 0;
      this.alerts.lastStatus[envName] = 'HEALTHY';
      
      return healthReport;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Increment failure counter
      this.alerts.consecutiveFailures[envName] = 
        (this.alerts.consecutiveFailures[envName] || 0) + 1;
      
      // Track downtime start
      if (this.alerts.lastStatus[envName] !== 'FAILED') {
        this.alerts.downtimeStart[envName] = Date.now();
      }
      
      this.alerts.lastStatus[envName] = 'FAILED';
      
      const healthReport = {
        environment: envName,
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        responseTime,
        error: error.message,
        consecutiveFailures: this.alerts.consecutiveFailures[envName],
        downtimeDuration: this.calculateDowntime(envName),
        sla: {
          target: config.sla,
          uptime: this.calculateUptime(envName)
        }
      };
      
      // Trigger alerts if threshold reached
      if (this.alerts.consecutiveFailures[envName] >= this.monitoring.alertThreshold) {
        await this.triggerAlert(healthReport);
      }
      
      return healthReport;
    }
  }

  async testEndpoint(url, method = 'GET') {
    return new Promise(_(resolve, _reject) => {
      const request = https.request(url, { method, timeout: this.monitoring.timeout }, (res) => {
        const chunks = [];
        
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', _() => {
          const body = Buffer.concat(chunks).toString();
          
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              responseLength: body.length,
              headers: res.headers
            });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });
      
      request.on('timeout', _() => {
        request.destroy();
        reject(new Error(`Request timeout after ${this.monitoring.timeout}ms`));
      });
      
      request.on('error', reject);
      request.end();
    });
  }

  calculateUptime(envName) {
    // Simplified uptime calculation - in production this would use persistent storage
    const failureRate = (this.alerts.consecutiveFailures[envName] || 0) / 100;
    return Math.max(95, 100 - failureRate);
  }

  calculateDowntime(envName) {
    if (!this.alerts.downtimeStart[envName]) return 0;
    return Date.now() - this.alerts.downtimeStart[envName];
  }

  async triggerAlert(healthReport) {
    const alertMessage = {
      level: 'CRITICAL',
      environment: healthReport.environment,
      message: `${healthReport.environment} environment is experiencing ${healthReport.consecutiveFailures} consecutive failures`,
      timestamp: healthReport.timestamp,
      details: {
        error: healthReport.error,
        downtime: `${(healthReport.downtimeDuration / 1000).toFixed(0)}s`,
        responseTime: `${healthReport.responseTime}ms`,
        slaImpact: `Current uptime: ${healthReport.sla.uptime.toFixed(2)}% (Target: ${healthReport.sla.target}%)`
      },
      actions: [
        'Check Railway deployment logs',
        'Verify environment variables',
        'Validate build process',
        'Consider emergency rollback'
      ]
    };

    console.error('🚨 CRITICAL ALERT:', JSON.stringify(alertMessage, null, 2));
    
    // In production: send to Slack, PagerDuty, email, etc.
    await this.saveAlert(alertMessage);
  }

  async saveAlert(alert) {
    try {
      const alertsDir = path.join(process.cwd(), 'logs', 'alerts');
      await fs.mkdir(alertsDir, { recursive: true });
      
      const alertFile = path.join(alertsDir, `alert_${Date.now()}.json`);
      await fs.writeFile(alertFile, JSON.stringify(alert, null, 2));
    } catch (error) {
      console.error('Failed to save alert:', error.message);
    }
  }

  async generateHealthReport() {
    const reports = [];
    
    for (const [envName, config] of Object.entries(this.environments)) {
      const report = await this.checkEnvironmentHealth(envName, config);
      reports.push(report);
    }
    
    const overallStatus = reports.every(r => r.status === 'HEALTHY') ? 'HEALTHY' : 'DEGRADED';
    
    const summary = {
      timestamp: new Date().toISOString(),
      overallStatus,
      environments: reports,
      summary: {
        healthy: reports.filter(r => r.status === 'HEALTHY').length,
        failed: reports.filter(r => r.status === 'FAILED').length,
        averageResponseTime: reports.reduce((sum, r) => sum + r.responseTime, 0) / reports.length
      }
    };
    
    // Save detailed report
    await this.saveHealthReport(summary);
    
    // Display summary
    this.displayHealthSummary(summary);
    
    return summary;
  }

  async saveHealthReport(report) {
    try {
      const reportsDir = path.join(process.cwd(), 'logs', 'health');
      await fs.mkdir(reportsDir, { recursive: true });
      
      const reportFile = path.join(reportsDir, `health_${Date.now()}.json`);
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Failed to save health report:', error.message);
    }
  }

  displayHealthSummary(report) {
    console.log('\n🏥 ENTERPRISE HEALTH MONITOR REPORT');
    console.log('=====================================');
    console.log(`Overall Status: ${report.overallStatus === 'HEALTHY' ? '✅' : '❌'} ${report.overallStatus}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Environments: ${report.summary.healthy}/${report.environments.length} healthy`);
    console.log(`Average Response Time: ${report.summary.averageResponseTime.toFixed(0)}ms\n`);
    
    for (const env of report.environments) {
      const statusIcon = env.status === 'HEALTHY' ? '✅' : '❌';
      console.log(`${statusIcon} ${env.environment.toUpperCase()}`);
      console.log(`   Status: ${env.status}`);
      console.log(`   Response Time: ${env.responseTime}ms`);
      
      if (env.checks) {
        console.log(`   Application: ${env.checks.application?.status || 'N/A'}`);
        console.log(`   API: ${env.checks.api?.status || 'N/A'}`);
        console.log(`   Auth: ${env.checks.authentication?.status || 'N/A'}`);
      }
      
      if (env.error) {
        console.log(`   Error: ${env.error}`);
      }
      
      if (env.consecutiveFailures > 0) {
        console.log(`   Consecutive Failures: ${env.consecutiveFailures}`);
      }
      
      console.log(`   SLA: ${env.sla.uptime.toFixed(2)}% (Target: ${env.sla.target}%)\n`);
    }
  }

  async startContinuousMonitoring() {
    console.log('🔄 Starting Enterprise Deployment Monitor...');
    console.log(`Monitoring ${Object.keys(this.environments).length} environments every ${this.monitoring.interval/1000}s`);
    
    // Initial report
    await this.generateHealthReport();
    
    // Continuous monitoring
    setInterval(async _() => {
      try {
        await this.generateHealthReport();
      } catch (error) {
        console.error('Monitoring error:', error.message);
      }
    }, this.monitoring.interval);
  }

  async runSingleCheck() {
    console.log('🔍 Running single health check...');
    return await this.generateHealthReport();
  }
}

// CLI Interface
async function main() {
  const monitor = new EnterpriseDeploymentMonitor();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  switch (command) {
    case 'monitor':
      await monitor.startContinuousMonitoring();
      break;
    case 'check':
      await monitor.runSingleCheck();
      break;
    default:
      console.log('Usage: node enterprise-deployment-monitor.js [monitor|check]');
      console.log('  monitor: Start continuous monitoring');
      console.log('  check:   Run single health check (default)');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default EnterpriseDeploymentMonitor;