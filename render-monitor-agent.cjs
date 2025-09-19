// RENDER MONITOR AGENT - 24/7 Autonomous Monitoring System
// Continuously monitors Render deployments and maintains system health

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  // Render deployment URLs to monitor
  deployments: {
    development: {
      url: 'https://sentia-manufacturing-development.onrender.com',
      healthEndpoint: '/health',
      expectedStatus: 200,
      timeout: 30000,
      retryAttempts: 3
    },
    testing: {
      url: 'https://sentia-manufacturing-testing.onrender.com',
      healthEndpoint: '/health',
      expectedStatus: 200,
      timeout: 30000,
      retryAttempts: 3
    },
    production: {
      url: 'https://sentia-manufacturing-production.onrender.com',
      healthEndpoint: '/health',
      expectedStatus: 200,
      timeout: 30000,
      retryAttempts: 3
    },
    mcp_server: {
      url: 'https://mcp-server-tkyu.onrender.com',
      healthEndpoint: '/health',
      expectedStatus: 200,
      timeout: 30000,
      retryAttempts: 3
    }
  },

  // Monitoring intervals (milliseconds)
  intervals: {
    healthCheck: 60000,        // Check every minute
    deepCheck: 300000,          // Deep check every 5 minutes
    reportGeneration: 3600000,  // Generate report every hour
    autoRecovery: 180000        // Attempt recovery every 3 minutes if down
  },

  // Alert thresholds
  thresholds: {
    responseTime: 5000,         // Alert if response > 5 seconds
    errorRate: 0.1,            // Alert if error rate > 10%
    downtime: 300000,          // Critical alert after 5 minutes downtime
    memoryUsage: 0.9,          // Alert if memory > 90%
    cpuUsage: 0.8              // Alert if CPU > 80%
  },

  // Notification settings
  notifications: {
    logFile: './monitoring/logs/render-monitor.log',
    statusFile: './monitoring/monitoring-status.json',
    alertFile: './monitoring/alerts.json'
  }
};

// Monitoring state
const STATE = {
  startTime: new Date(),
  deploymentStatus: {},
  metrics: {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    recoveryAttempts: 0,
    alerts: []
  },
  lastReport: null
};

// Utility functions
class MonitoringUtils {
  static async makeHttpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.get(url, {
        timeout: options.timeout || 30000,
        ...options
      }, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            responseTime: Date.now() - startTime
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  static async writeLog(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    try {
      await fs.appendFile(CONFIG.notifications.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write log:', error);
    }

    // Also log to console
    console.log(logEntry.trim());
  }

  static async saveStatus() {
    try {
      await fs.writeFile(
        CONFIG.notifications.statusFile,
        JSON.stringify({
          state: STATE,
          timestamp: new Date().toISOString()
        }, null, 2)
      );
    } catch (error) {
      console.error('Failed to save status:', error);
    }
  }

  static async createAlert(deployment, issue, severity = 'WARNING') {
    const alert = {
      timestamp: new Date().toISOString(),
      deployment,
      issue,
      severity,
      resolved: false
    };

    STATE.metrics.alerts.push(alert);

    try {
      await fs.writeFile(
        CONFIG.notifications.alertFile,
        JSON.stringify(STATE.metrics.alerts, null, 2)
      );
    } catch (error) {
      console.error('Failed to save alert:', error);
    }

    await this.writeLog(`ALERT: ${deployment} - ${issue}`, severity);

    return alert;
  }
}

// Monitoring functions
class RenderMonitor {
  static async checkDeploymentHealth(name, config) {
    const url = `${config.url}${config.healthEndpoint}`;
    STATE.metrics.totalChecks++;

    try {
      await MonitoringUtils.writeLog(`Checking ${name}: ${url}`);

      const response = await MonitoringUtils.makeHttpRequest(url, {
        timeout: config.timeout
      });

      const isHealthy = response.status === config.expectedStatus;
      const status = {
        name,
        url: config.url,
        healthy: isHealthy,
        status: response.status,
        responseTime: response.responseTime,
        lastCheck: new Date().toISOString(),
        uptime: STATE.deploymentStatus[name]?.uptime || 0,
        downtime: STATE.deploymentStatus[name]?.downtime || 0
      };

      // Parse health response if JSON
      try {
        if (response.body) {
          const healthData = JSON.parse(response.body);
          status.details = healthData;
        }
      } catch (e) {
        // Not JSON, that's okay
      }

      // Update metrics
      if (isHealthy) {
        STATE.metrics.successfulChecks++;

        // Clear any existing alerts for this deployment
        STATE.metrics.alerts = STATE.metrics.alerts.map(alert => {
          if (alert.deployment === name && !alert.resolved) {
            alert.resolved = true;
            alert.resolvedAt = new Date().toISOString();
          }
          return alert;
        });

        // Update uptime
        if (STATE.deploymentStatus[name]?.lastCheckHealthy) {
          status.uptime += Date.now() - new Date(STATE.deploymentStatus[name].lastCheck).getTime();
        }
      } else {
        STATE.metrics.failedChecks++;

        // Create alert if not already exists
        const existingAlert = STATE.metrics.alerts.find(
          a => a.deployment === name && !a.resolved
        );

        if (!existingAlert) {
          await MonitoringUtils.createAlert(
            name,
            `Health check failed - Status: ${response.status}`,
            response.status >= 500 ? 'CRITICAL' : 'WARNING'
          );
        }

        // Update downtime
        if (!STATE.deploymentStatus[name]?.lastCheckHealthy) {
          status.downtime += Date.now() - new Date(STATE.deploymentStatus[name]?.lastCheck || Date.now()).getTime();
        }
      }

      // Check response time threshold
      if (response.responseTime > CONFIG.thresholds.responseTime) {
        await MonitoringUtils.createAlert(
          name,
          `Slow response time: ${response.responseTime}ms`,
          'WARNING'
        );
      }

      status.lastCheckHealthy = isHealthy;
      STATE.deploymentStatus[name] = status;

      await MonitoringUtils.writeLog(
        `${name} health check: ${isHealthy ? 'PASS' : 'FAIL'} (${response.status}, ${response.responseTime}ms)`
      );

      return status;

    } catch (error) {
      STATE.metrics.failedChecks++;

      const status = {
        name,
        url: config.url,
        healthy: false,
        error: error.message,
        lastCheck: new Date().toISOString(),
        lastCheckHealthy: false,
        uptime: STATE.deploymentStatus[name]?.uptime || 0,
        downtime: (STATE.deploymentStatus[name]?.downtime || 0) +
                  (Date.now() - new Date(STATE.deploymentStatus[name]?.lastCheck || Date.now()).getTime())
      };

      STATE.deploymentStatus[name] = status;

      await MonitoringUtils.createAlert(
        name,
        `Health check error: ${error.message}`,
        'CRITICAL'
      );

      await MonitoringUtils.writeLog(
        `${name} health check failed: ${error.message}`,
        'ERROR'
      );

      return status;
    }
  }

  static async performDeepCheck(name, config) {
    await MonitoringUtils.writeLog(`Performing deep check for ${name}`);

    const checks = {
      api: false,
      database: false,
      services: false
    };

    try {
      // Check API status endpoint if exists
      const apiUrl = `${config.url}/api/status`;
      try {
        const apiResponse = await MonitoringUtils.makeHttpRequest(apiUrl, {
          timeout: 10000
        });
        checks.api = apiResponse.status === 200;
      } catch (e) {
        checks.api = false;
      }

      // Check database status
      const dbUrl = `${config.url}/api/health/database`;
      try {
        const dbResponse = await MonitoringUtils.makeHttpRequest(dbUrl, {
          timeout: 10000
        });
        checks.database = dbResponse.status === 200;
      } catch (e) {
        checks.database = false;
      }

      // Check services status
      const servicesUrl = `${config.url}/api/health/services`;
      try {
        const servicesResponse = await MonitoringUtils.makeHttpRequest(servicesUrl, {
          timeout: 10000
        });
        checks.services = servicesResponse.status === 200;
      } catch (e) {
        checks.services = false;
      }

      await MonitoringUtils.writeLog(
        `Deep check ${name}: API=${checks.api}, DB=${checks.database}, Services=${checks.services}`
      );

      return checks;

    } catch (error) {
      await MonitoringUtils.writeLog(`Deep check failed for ${name}: ${error.message}`, 'ERROR');
      return checks;
    }
  }

  static async attemptRecovery(name, config) {
    STATE.metrics.recoveryAttempts++;
    await MonitoringUtils.writeLog(`Attempting recovery for ${name}`, 'WARNING');

    try {
      // Attempt 1: Wake up the service with a simple request
      await MonitoringUtils.makeHttpRequest(config.url, {
        timeout: 60000
      });

      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if service is back up
      const healthCheck = await this.checkDeploymentHealth(name, config);

      if (healthCheck.healthy) {
        await MonitoringUtils.writeLog(`Recovery successful for ${name}`, 'INFO');
        return true;
      }

      // Attempt 2: Try multiple endpoints to wake the service
      const endpoints = ['/', '/api/health', '/health', '/api/status'];
      for (const endpoint of endpoints) {
        try {
          await MonitoringUtils.makeHttpRequest(`${config.url}${endpoint}`, {
            timeout: 30000
          });
        } catch (e) {
          // Continue trying
        }
      }

      await new Promise(resolve => setTimeout(resolve, 10000));

      // Final health check
      const finalCheck = await this.checkDeploymentHealth(name, config);

      if (finalCheck.healthy) {
        await MonitoringUtils.writeLog(`Recovery successful for ${name} after multiple attempts`, 'INFO');
        return true;
      }

      await MonitoringUtils.writeLog(`Recovery failed for ${name}`, 'ERROR');
      return false;

    } catch (error) {
      await MonitoringUtils.writeLog(`Recovery attempt failed for ${name}: ${error.message}`, 'ERROR');
      return false;
    }
  }

  static async generateReport() {
    const uptime = Date.now() - STATE.startTime.getTime();
    const uptimeHours = Math.floor(uptime / 3600000);
    const uptimeMinutes = Math.floor((uptime % 3600000) / 60000);

    const report = {
      timestamp: new Date().toISOString(),
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      deployments: STATE.deploymentStatus,
      metrics: {
        ...STATE.metrics,
        successRate: STATE.metrics.totalChecks > 0
          ? (STATE.metrics.successfulChecks / STATE.metrics.totalChecks * 100).toFixed(2) + '%'
          : '0%',
        activeAlerts: STATE.metrics.alerts.filter(a => !a.resolved).length,
        resolvedAlerts: STATE.metrics.alerts.filter(a => a.resolved).length
      },
      summary: {
        healthyDeployments: Object.values(STATE.deploymentStatus).filter(d => d.healthy).length,
        unhealthyDeployments: Object.values(STATE.deploymentStatus).filter(d => !d.healthy).length,
        averageResponseTime: Object.values(STATE.deploymentStatus)
          .filter(d => d.responseTime)
          .reduce((sum, d) => sum + d.responseTime, 0) /
          Object.values(STATE.deploymentStatus).filter(d => d.responseTime).length || 0
      }
    };

    STATE.lastReport = report;

    await MonitoringUtils.writeLog(
      `Report: ${report.summary.healthyDeployments}/${Object.keys(CONFIG.deployments).length} healthy, ` +
      `Success rate: ${report.metrics.successRate}, ` +
      `Active alerts: ${report.metrics.activeAlerts}`
    );

    // Save report to file
    try {
      const reportFile = `./monitoring/logs/report-${new Date().toISOString().split('T')[0]}.json`;
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Failed to save report:', error);
    }

    return report;
  }
}

// Main monitoring loop
class MonitoringAgent {
  constructor() {
    this.intervals = {};
    this.isRunning = false;
  }

  async initialize() {
    // Ensure monitoring directories exist
    try {
      await fs.mkdir('./monitoring/logs', { recursive: true });
      await fs.mkdir('./monitoring', { recursive: true });
    } catch (error) {
      console.error('Failed to create monitoring directories:', error);
    }

    await MonitoringUtils.writeLog('='.repeat(60));
    await MonitoringUtils.writeLog('RENDER MONITOR AGENT STARTING');
    await MonitoringUtils.writeLog(`Monitoring ${Object.keys(CONFIG.deployments).length} deployments`);
    await MonitoringUtils.writeLog('='.repeat(60));

    // Initial health check for all deployments
    for (const [name, config] of Object.entries(CONFIG.deployments)) {
      await RenderMonitor.checkDeploymentHealth(name, config);
    }

    await MonitoringUtils.saveStatus();
  }

  start() {
    if (this.isRunning) {
      console.log('Monitoring agent is already running');
      return;
    }

    this.isRunning = true;

    // Health check interval
    this.intervals.healthCheck = setInterval(async () => {
      for (const [name, config] of Object.entries(CONFIG.deployments)) {
        await RenderMonitor.checkDeploymentHealth(name, config);
      }
      await MonitoringUtils.saveStatus();
    }, CONFIG.intervals.healthCheck);

    // Deep check interval
    this.intervals.deepCheck = setInterval(async () => {
      for (const [name, config] of Object.entries(CONFIG.deployments)) {
        await RenderMonitor.performDeepCheck(name, config);
      }
    }, CONFIG.intervals.deepCheck);

    // Auto-recovery interval
    this.intervals.autoRecovery = setInterval(async () => {
      for (const [name, status] of Object.entries(STATE.deploymentStatus)) {
        if (!status.healthy && status.downtime > CONFIG.thresholds.downtime) {
          await RenderMonitor.attemptRecovery(name, CONFIG.deployments[name]);
        }
      }
    }, CONFIG.intervals.autoRecovery);

    // Report generation interval
    this.intervals.reportGeneration = setInterval(async () => {
      await RenderMonitor.generateReport();
    }, CONFIG.intervals.reportGeneration);

    MonitoringUtils.writeLog('Monitoring agent started successfully');
  }

  stop() {
    if (!this.isRunning) {
      console.log('Monitoring agent is not running');
      return;
    }

    this.isRunning = false;

    // Clear all intervals
    for (const interval of Object.values(this.intervals)) {
      clearInterval(interval);
    }

    this.intervals = {};

    MonitoringUtils.writeLog('Monitoring agent stopped');
  }

  async getStatus() {
    return {
      running: this.isRunning,
      state: STATE,
      config: CONFIG
    };
  }
}

// Express server for monitoring dashboard
let express, cors;
try {
  express = require('express');
  cors = require('cors');
} catch (error) {
  console.error('Express/CORS not available. Running in standalone mode.');
  // Run without web dashboard if express not available
  express = null;
  cors = null;
}

// Initialize monitoring agent
const agent = new MonitoringAgent();

// Initialize Express app if available
let app;
const PORT = process.env.MONITOR_PORT || 3005;

if (express) {
  app = express();

  if (cors) {
    app.use(cors());
  }
  app.use(express.json());

  // API endpoints
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      agent: agent.isRunning ? 'running' : 'stopped',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/status', async (req, res) => {
    const status = await agent.getStatus();
    res.json(status);
  });

  app.get('/deployments', (req, res) => {
    res.json(STATE.deploymentStatus);
  });

  app.get('/metrics', (req, res) => {
    res.json(STATE.metrics);
  });

  app.get('/report', (req, res) => {
    if (STATE.lastReport) {
      res.json(STATE.lastReport);
    } else {
      res.status(404).json({ error: 'No report available yet' });
    }
  });

  app.post('/start', (req, res) => {
    agent.start();
    res.json({ message: 'Monitoring agent started' });
  });

  app.post('/stop', (req, res) => {
    agent.stop();
    res.json({ message: 'Monitoring agent stopped' });
  });

  app.post('/check/:deployment', async (req, res) => {
    const { deployment } = req.params;

    if (!CONFIG.deployments[deployment]) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const result = await RenderMonitor.checkDeploymentHealth(
      deployment,
      CONFIG.deployments[deployment]
    );

    res.json(result);
  });
}

// Start server and monitoring agent
async function main() {
  await agent.initialize();
  agent.start();

  // Only start web server if Express is available
  if (express) {
    app.listen(PORT, () => {
      console.log(`Render Monitor Agent running on port ${PORT}`);
      console.log(`Dashboard: http://localhost:${PORT}/status`);
      console.log('='.repeat(60));
      console.log('24/7 AUTONOMOUS MONITORING ACTIVE');
      console.log('='.repeat(60));
    });
  } else {
    console.log('='.repeat(60));
    console.log('24/7 AUTONOMOUS MONITORING ACTIVE (Standalone Mode)');
    console.log('Web dashboard unavailable - Express not installed');
    console.log('='.repeat(60));
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    agent.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    agent.stop();
    process.exit(0);
  });
}

// Start the monitoring agent
main().catch(error => {
  console.error('Failed to start monitoring agent:', error);
  process.exit(1);
});

module.exports = { MonitoringAgent, RenderMonitor };