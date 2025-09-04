#!/usr/bin/env node

/**
 * Comprehensive Monitoring and Self-Correction System
 * Monitors all specified URLs and implements agentic feedback loop
 * with automatic corrective actions for deployment issues
 */

import axios from 'axios';
import { spawn, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // URLs to monitor
  urls: [
    {
      name: 'Railway Production',
      url: 'https://sentia-manufacturing-dashboard-production.up.railway.app',
      aliases: ['https://sentiaprod.financeflo.ai'],
      environment: 'production'
    },
    {
      name: 'Railway Development', 
      url: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
      aliases: ['https://sentiadeploy.financeflo.ai'],
      environment: 'development'
    },
    {
      name: 'Railway Test',
      url: 'https://sentiatest.financeflo.ai',
      aliases: [],
      environment: 'test'
    },
    {
      name: 'Localhost 3000',
      url: 'http://localhost:3000',
      aliases: [],
      environment: 'local'
    },
    {
      name: 'Localhost 3002',
      url: 'http://localhost:3002',
      aliases: [],
      environment: 'local'
    },
    {
      name: 'Localhost 3003',
      url: 'http://localhost:3003',
      aliases: [],
      environment: 'local'
    }
  ],
  
  // Monitoring settings
  checkInterval: 5 * 60 * 1000, // 5 minutes
  requestTimeout: 30000, // 30 seconds
  maxRetries: 3,
  retryBackoff: [2000, 5000, 10000], // Exponential backoff in ms
  
  // Phase 4 feature detection
  phase4Features: [
    'PredictiveMaintenanceWidget',
    'SmartInventoryWidget',
    'predictive-maintenance',
    'smart-inventory',
    'maintenance-alerts',
    'inventory-optimization'
  ],
  
  // Expected APIs
  expectedApis: [
    '/api/health',
    '/api/predictive-maintenance',
    '/api/smart-inventory',
    '/api/dashboard/widgets'
  ],
  
  // Logging
  logLevel: 'info',
  logFile: 'monitoring.log',
  statusFile: 'monitoring-status.json'
};

class MonitoringAgent {
  constructor() {
    this.isRunning = false;
    this.status = {
      startTime: new Date(),
      lastCheck: null,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      correctionsMade: 0,
      urlStatuses: {},
      currentActions: []
    };
    
    // Initialize URL statuses
    CONFIG.urls.forEach(urlConfig => {
      this.status.urlStatuses[urlConfig.url] = {
        name: urlConfig.name,
        environment: urlConfig.environment,
        status: 'unknown',
        lastCheck: null,
        consecutiveFailures: 0,
        phase4FeaturesDetected: false,
        apiHealth: {},
        deploymentTimestamp: null,
        lastError: null,
        correctionHistory: []
      };
    });
  }

  async start() {
    this.log('info', 'Starting Comprehensive Monitoring and Self-Correction System');
    this.log('info', `Monitoring ${CONFIG.urls.length} URLs with ${CONFIG.checkInterval/1000}s intervals`);
    
    this.isRunning = true;
    
    // Initial check
    await this.performMonitoringCycle();
    
    // Schedule regular checks
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, CONFIG.checkInterval);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
    
    this.log('info', 'Monitoring system started successfully');
  }

  async stop() {
    this.log('info', 'Stopping monitoring system...');
    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    await this.saveStatus();
    this.log('info', 'Monitoring system stopped');
    process.exit(0);
  }

  async performMonitoringCycle() {
    if (!this.isRunning) return;
    
    this.log('info', 'Starting monitoring cycle');
    this.status.lastCheck = new Date();
    this.status.totalChecks++;
    
    const promises = CONFIG.urls.map(urlConfig => 
      this.checkUrl(urlConfig).catch(error => {
        this.log('error', `Failed to check ${urlConfig.name}: ${error.message}`);
        return null;
      })
    );
    
    const results = await Promise.all(promises);
    
    // Analyze results and determine actions
    await this.analyzeResults(results.filter(Boolean));
    
    // Save current status
    await this.saveStatus();
    
    // Check if all URLs are healthy with Phase 4 features
    const allHealthy = this.checkAllUrlsHealthy();
    if (allHealthy) {
      this.log('success', 'SUCCESS: All URLs showing correct Phase 4 features!');
    }
    
    this.log('info', 'Monitoring cycle completed');
  }

  async checkUrl(urlConfig) {
    const urlStatus = this.status.urlStatuses[urlConfig.url];
    this.log('debug', `Checking ${urlConfig.name}: ${urlConfig.url}`);
    
    try {
      // Primary URL check
      const result = await this.performUrlCheck(urlConfig.url, urlConfig);
      
      // Check aliases if primary fails
      if (!result.success && urlConfig.aliases.length > 0) {
        this.log('info', `Primary URL failed, checking aliases for ${urlConfig.name}`);
        for (const alias of urlConfig.aliases) {
          const aliasResult = await this.performUrlCheck(alias, urlConfig);
          if (aliasResult.success) {
            result.success = true;
            result.phase4Features = aliasResult.phase4Features;
            result.apiHealth = aliasResult.apiHealth;
            break;
          }
        }
      }
      
      // Update status
      urlStatus.lastCheck = new Date();
      urlStatus.status = result.success ? 'healthy' : 'unhealthy';
      urlStatus.phase4FeaturesDetected = result.phase4Features;
      urlStatus.apiHealth = result.apiHealth;
      urlStatus.lastError = result.error;
      
      if (result.success) {
        urlStatus.consecutiveFailures = 0;
        this.status.successfulChecks++;
      } else {
        urlStatus.consecutiveFailures++;
        this.status.failedChecks++;
      }
      
      return { urlConfig, result, urlStatus };
      
    } catch (error) {
      this.log('error', `Error checking ${urlConfig.name}: ${error.message}`);
      urlStatus.status = 'error';
      urlStatus.lastError = error.message;
      urlStatus.consecutiveFailures++;
      this.status.failedChecks++;
      
      return { urlConfig, result: { success: false, error: error.message }, urlStatus };
    }
  }

  async performUrlCheck(url, urlConfig) {
    try {
      const response = await axios.get(url, {
        timeout: CONFIG.requestTimeout,
        validateStatus: (status) => status < 500, // Accept 4xx but not 5xx
        headers: {
          'User-Agent': 'Sentia-Monitoring-Agent/1.0'
        }
      });
      
      if (response.status >= 400) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          phase4Features: false,
          apiHealth: {}
        };
      }
      
      const html = response.data;
      
      // Check for blank screen or loading issues
      if (this.isBlankScreen(html)) {
        return {
          success: false,
          error: 'Blank screen detected',
          phase4Features: false,
          apiHealth: {}
        };
      }
      
      // Check Phase 4 features
      const phase4Features = this.detectPhase4Features(html);
      
      // Check API health
      const apiHealth = await this.checkApiHealth(url);
      
      return {
        success: true,
        phase4Features,
        apiHealth,
        deploymentTimestamp: this.extractDeploymentTimestamp(html)
      };
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED' && url.includes('localhost')) {
        return {
          success: false,
          error: 'Local server not running',
          phase4Features: false,
          apiHealth: {}
        };
      }
      
      throw error;
    }
  }

  isBlankScreen(html) {
    // Check for common blank screen indicators
    const blankScreenIndicators = [
      html.length < 1000,
      !html.includes('<div'),
      !html.includes('react'),
      html.includes('Loading...') && html.length < 5000,
      !html.includes('dashboard')
    ];
    
    return blankScreenIndicators.filter(Boolean).length >= 2;
  }

  detectPhase4Features(html) {
    let detectedFeatures = 0;
    
    CONFIG.phase4Features.forEach(feature => {
      if (html.includes(feature) || html.toLowerCase().includes(feature.toLowerCase())) {
        detectedFeatures++;
      }
    });
    
    // Consider Phase 4 features present if at least 50% are detected
    return detectedFeatures >= Math.ceil(CONFIG.phase4Features.length * 0.5);
  }

  async checkApiHealth(baseUrl) {
    const apiHealth = {};
    
    for (const apiPath of CONFIG.expectedApis) {
      try {
        const response = await axios.get(`${baseUrl}${apiPath}`, {
          timeout: 10000,
          validateStatus: (status) => status < 500
        });
        
        apiHealth[apiPath] = {
          status: response.status < 400 ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - response.config.metadata?.startTime || 0
        };
      } catch (error) {
        apiHealth[apiPath] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    return apiHealth;
  }

  extractDeploymentTimestamp(html) {
    // Try to extract deployment timestamp from HTML meta tags or comments
    const timestampMatches = html.match(/deployment[_-]?time[\"':\s]*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/i);
    if (timestampMatches) {
      return new Date(timestampMatches[1]);
    }
    return null;
  }

  async analyzeResults(results) {
    for (const { urlConfig, result, urlStatus } of results) {
      if (!result.success || !result.phase4Features) {
        await this.triggerCorrectiveAction(urlConfig, urlStatus, result);
      }
    }
  }

  async triggerCorrectiveAction(urlConfig, urlStatus, result) {
    this.log('warning', `Triggering corrective action for ${urlConfig.name}`);
    this.status.currentActions.push(`Correcting ${urlConfig.name}`);
    
    try {
      if (urlConfig.environment === 'local') {
        await this.handleLocalServerIssues(urlConfig, urlStatus, result);
      } else {
        await this.handleRemoteDeploymentIssues(urlConfig, urlStatus, result);
      }
      
      this.status.correctionsMade++;
      urlStatus.correctionHistory.push({
        timestamp: new Date(),
        action: 'corrective_action_applied',
        reason: result.error || 'Missing Phase 4 features'
      });
      
    } catch (error) {
      this.log('error', `Failed to apply corrective action for ${urlConfig.name}: ${error.message}`);
    } finally {
      this.status.currentActions = this.status.currentActions.filter(
        action => action !== `Correcting ${urlConfig.name}`
      );
    }
  }

  async handleLocalServerIssues(urlConfig, urlStatus, result) {
    this.log('info', `Handling local server issues for ${urlConfig.name}`);
    
    if (result.error === 'Local server not running') {
      // Try to start local development server
      if (urlConfig.url.includes(':3000')) {
        await this.startLocalServer('npm run dev:client');
      } else if (urlConfig.url.includes(':3002') || urlConfig.url.includes(':3003')) {
        // Check if there are other development configurations
        await this.startLocalServer('npm run dev');
      }
    } else if (result.error === 'Blank screen detected') {
      // Restart development server
      await this.restartLocalServer();
    }
  }

  async handleRemoteDeploymentIssues(urlConfig, urlStatus, result) {
    this.log('info', `Handling remote deployment issues for ${urlConfig.name}`);
    
    if (result.error === 'Blank screen detected' || !result.phase4Features) {
      // Trigger Railway redeploy
      await this.triggerRailwayRedeploy(urlConfig.environment);
    }
    
    if (result.error?.includes('HTTP 5')) {
      // Server error - check and fix server issues
      await this.fixServerIssues();
    }
  }

  async startLocalServer(command) {
    this.log('info', `Starting local server: ${command}`);
    
    return new Promise((resolve, reject) => {
      const process = spawn('npm', command.split(' ').slice(1), {
        cwd: __dirname,
        stdio: 'pipe',
        shell: true
      });
      
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Local:') || output.includes('ready')) {
          this.log('success', 'Local server started successfully');
          resolve();
        }
      });
      
      process.stderr.on('data', (data) => {
        this.log('debug', `Server output: ${data.toString()}`);
      });
      
      setTimeout(() => {
        if (output.includes('Local:') || output.includes('ready')) {
          resolve();
        } else {
          reject(new Error('Server startup timeout'));
        }
      }, 30000);
    });
  }

  async restartLocalServer() {
    this.log('info', 'Restarting local server');
    
    try {
      // Kill existing processes (Windows compatible)
      await execAsync('taskkill /f /im node.exe /t').catch(() => {});
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Restart
      await this.startLocalServer('npm run dev');
      
    } catch (error) {
      this.log('error', `Failed to restart local server: ${error.message}`);
    }
  }

  async triggerRailwayRedeploy(environment) {
    this.log('info', `Triggering Railway redeploy for ${environment} environment`);
    
    try {
      // Create a small commit to trigger redeploy
      const timestamp = new Date().toISOString();
      const deployTriggerFile = `.railway-deploy-${environment}-${Date.now()}`;
      
      await fs.writeFile(deployTriggerFile, `Deploy trigger: ${timestamp}`);
      
      // Commit and push
      await execAsync(`git add ${deployTriggerFile}`);
      await execAsync(`git commit -m "trigger: ${environment} redeploy - ${timestamp}

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"`);
      
      if (environment === 'development') {
        await execAsync('git push origin development');
      } else if (environment === 'test') {
        await execAsync('git push origin test');
      } else if (environment === 'production') {
        await execAsync('git push origin production');
      }
      
      // Clean up trigger file
      setTimeout(async () => {
        try {
          await fs.unlink(deployTriggerFile);
          await execAsync(`git add ${deployTriggerFile}`);
          await execAsync(`git commit -m "cleanup: remove deploy trigger file"`);
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 60000);
      
      this.log('success', `Railway redeploy triggered for ${environment}`);
      
    } catch (error) {
      this.log('error', `Failed to trigger Railway redeploy: ${error.message}`);
    }
  }

  async fixServerIssues() {
    this.log('info', 'Attempting to fix server issues');
    
    try {
      // Check for common issues and fix them
      
      // 1. Install dependencies
      await execAsync('npm install');
      
      // 2. Build project
      await execAsync('npm run build');
      
      // 3. Check for port conflicts
      await this.resolvePortConflicts();
      
      // 4. Verify environment variables
      await this.verifyEnvironmentVariables();
      
      this.log('success', 'Server issues fixed');
      
    } catch (error) {
      this.log('error', `Failed to fix server issues: ${error.message}`);
    }
  }

  async resolvePortConflicts() {
    try {
      // Kill processes on common ports (Windows compatible)
      const ports = [3000, 3001, 3002, 3003, 5000, 5001];
      
      for (const port of ports) {
        try {
          await execAsync(`netstat -ano | findstr :${port}`).then(async (result) => {
            const lines = result.stdout.split('\n');
            for (const line of lines) {
              const match = line.match(/\s+(\d+)$/);
              if (match) {
                await execAsync(`taskkill /PID ${match[1]} /F`);
              }
            }
          });
        } catch (e) {
          // Ignore if no process on port
        }
      }
      
    } catch (error) {
      this.log('debug', `Port cleanup error: ${error.message}`);
    }
  }

  async verifyEnvironmentVariables() {
    try {
      const envFile = path.join(__dirname, '.env');
      const envExists = await fs.access(envFile).then(() => true).catch(() => false);
      
      if (!envExists) {
        // Copy from template
        const templateFile = path.join(__dirname, '.env.template');
        const templateExists = await fs.access(templateFile).then(() => true).catch(() => false);
        
        if (templateExists) {
          await fs.copyFile(templateFile, envFile);
          this.log('info', 'Environment file created from template');
        }
      }
      
    } catch (error) {
      this.log('debug', `Environment verification error: ${error.message}`);
    }
  }

  checkAllUrlsHealthy() {
    const statuses = Object.values(this.status.urlStatuses);
    
    return statuses.every(status => 
      status.status === 'healthy' && 
      status.phase4FeaturesDetected === true
    );
  }

  async saveStatus() {
    try {
      const statusData = {
        ...this.status,
        lastSaved: new Date()
      };
      
      await fs.writeFile(
        CONFIG.statusFile,
        JSON.stringify(statusData, null, 2)
      );
    } catch (error) {
      this.log('error', `Failed to save status: ${error.message}`);
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data })
    };
    
    // Console output with colors
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[37m',   // White
      reset: '\x1b[0m'
    };
    
    const color = colors[level] || colors.info;
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    // File logging
    this.appendToLogFile(logEntry);
  }

  async appendToLogFile(logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(CONFIG.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  // Status reporting
  getStatusReport() {
    const { urlStatuses } = this.status;
    const totalUrls = Object.keys(urlStatuses).length;
    const healthyUrls = Object.values(urlStatuses).filter(s => s.status === 'healthy').length;
    const urlsWithPhase4 = Object.values(urlStatuses).filter(s => s.phase4FeaturesDetected).length;
    
    return {
      overall: {
        healthy: healthyUrls === totalUrls,
        phase4Complete: urlsWithPhase4 === totalUrls,
        uptime: Date.now() - this.status.startTime.getTime(),
        successRate: (this.status.successfulChecks / Math.max(this.status.totalChecks, 1)) * 100
      },
      urls: urlStatuses,
      stats: {
        totalChecks: this.status.totalChecks,
        successfulChecks: this.status.successfulChecks,
        failedChecks: this.status.failedChecks,
        correctionsMade: this.status.correctionsMade
      }
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new MonitoringAgent();
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--status') || args.includes('-s')) {
    // Show status and exit
    try {
      const status = JSON.parse(await fs.readFile(CONFIG.statusFile, 'utf8'));
      console.log('\n--- MONITORING STATUS ---');
      console.log(JSON.stringify(status, null, 2));
      process.exit(0);
    } catch (error) {
      console.log('No status file found or error reading status');
      process.exit(1);
    }
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Sentia Manufacturing Dashboard - Monitoring Agent

Usage:
  node monitoring-agent.js [options]

Options:
  --help, -h     Show this help message
  --status, -s   Show current monitoring status
  
The agent will run continuously, monitoring all specified URLs every 5 minutes.
It will automatically attempt to fix issues and ensure Phase 4 features are deployed.

Press Ctrl+C to stop the monitoring agent.
    `);
    process.exit(0);
  }
  
  // Start monitoring
  await agent.start();
}

export default MonitoringAgent;