#!/usr/bin/env node

/**
 * Sentia Manufacturing Dashboard - Autonomous Monitoring Agent
 * 
 * Continuously monitors all deployment URLs and self-corrects issues
 * until perfect Phase 4 deployment alignment is achieved.
 * 
 * Usage: node monitoring-agent.js [--status|--help]
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const { exec, spawn } = require('child_process');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class MonitoringAgent {
  constructor() {
    this.config = {
      // All URLs to monitor
      urls: [
        // Railway Production
        { name: 'Railway Production', url: 'https://sentia-manufacturing-dashboard-production.up.railway.app', alias: 'https://sentiaprod.financeflo.ai' },
        // Railway Development  
        { name: 'Railway Development', url: 'https://sentia-manufacturing-dashboard-development.up.railway.app', alias: 'https://sentiadeploy.financeflo.ai' },
        // Railway Test
        { name: 'Railway Test', url: 'https://sentiatest.financeflo.ai' },
        // Localhost URLs
        { name: 'Localhost 3000', url: 'http://localhost:3000' },
        { name: 'Localhost 3002', url: 'http://localhost:3002' },
        { name: 'Localhost 3003', url: 'http://localhost:3003' }
      ],
      
      // Phase 4 features to verify
      requiredFeatures: [
        'PredictiveMaintenanceWidget',
        'SmartInventoryWidget', 
        'Predictive Maintenance',
        'Smart Inventory',
        'AI-Powered',
        'Advanced Manufacturing Intelligence'
      ],
      
      // API endpoints to check
      apiEndpoints: [
        '/api/status',
        '/api/maintenance/equipment',
        '/api/inventory/items'
      ],
      
      // Monitoring settings
      checkInterval: 5 * 60 * 1000, // 5 minutes
      requestTimeout: 30000, // 30 seconds
      maxRetries: 3,
      backoffMultiplier: 2
    };
    
    this.status = {
      startTime: new Date(),
      totalChecks: 0,
      successfulChecks: 0,
      corrections: [],
      lastCheck: null,
      isRunning: false,
      urls: {}
    };
    
    this.logFile = 'monitoring.log';
    this.statusFile = 'monitoring-status.json';
    
    // Initialize URL status tracking
    this.config.urls.forEach(urlConfig => {
      this.status.urls[urlConfig.name] = {
        status: 'unknown',
        lastCheck: null,
        consecutiveFailures: 0,
        corrections: [],
        responseTime: null,
        features: [],
        errors: []
      };
    });
    
    this.log('Monitoring Agent Initialized', 'info');
  }

  /**
   * Start the continuous monitoring loop
   */
  async start() {
    this.log('Starting Autonomous Monitoring Agent', 'info');
    this.status.isRunning = true;
    this.status.startTime = new Date();
    
    // Initial check
    await this.performFullCheck();
    
    // Set up continuous monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.performFullCheck();
    }, this.config.checkInterval);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    
    this.log(`Monitoring started - checking every ${this.config.checkInterval / 1000}s`, 'info');
  }

  /**
   * Perform a complete check of all URLs and trigger corrections
   */
  async performFullCheck() {
    this.log('\n=== PERFORMING FULL SYSTEM CHECK ===', 'info');
    this.status.totalChecks++;
    this.status.lastCheck = new Date();
    
    let allHealthy = true;
    
    // Check each URL
    for (const urlConfig of this.config.urls) {
      try {
        const result = await this.checkUrl(urlConfig);
        this.status.urls[urlConfig.name] = result;
        
        if (result.status !== 'healthy') {
          allHealthy = false;
          await this.attemptCorrection(urlConfig, result);
        }
      } catch (error) {
        this.log(`Error checking ${urlConfig.name}: ${error.message}`, 'error');
        allHealthy = false;
      }
    }
    
    // Update success metrics
    if (allHealthy) {
      this.status.successfulChecks++;
      this.log('✅ ALL SYSTEMS HEALTHY - Phase 4 fully deployed!', 'success');
    } else {
      this.log('⚠️  Issues detected - corrections in progress...', 'warning');
    }
    
    // Save status to file
    await this.saveStatus();
    
    // Check if we should stop (all systems perfect)
    if (allHealthy && this.allUrlsShowPhase4Features()) {
      this.log('🎉 PERFECT DEPLOYMENT ALIGNMENT ACHIEVED!', 'success');
      this.log('All URLs showing Phase 4 features correctly', 'success');
      // Don't auto-stop, continue monitoring for regressions
    }
  }

  /**
   * Check a single URL for health and Phase 4 features
   */
  async checkUrl(urlConfig) {
    const startTime = Date.now();
    const result = {
      status: 'unknown',
      lastCheck: new Date(),
      consecutiveFailures: this.status.urls[urlConfig.name]?.consecutiveFailures || 0,
      corrections: this.status.urls[urlConfig.name]?.corrections || [],
      responseTime: null,
      features: [],
      errors: [],
      httpStatus: null,
      content: ''
    };
    
    try {
      this.log(`Checking ${urlConfig.name} (${urlConfig.url})`, 'info');
      
      // Try primary URL first, then alias if it fails
      let content, httpStatus;
      try {
        const response = await this.httpRequest(urlConfig.url);
        content = response.content;
        httpStatus = response.status;
      } catch (primaryError) {
        if (urlConfig.alias) {
          this.log(`Primary URL failed, trying alias: ${urlConfig.alias}`, 'warning');
          const response = await this.httpRequest(urlConfig.alias);
          content = response.content;
          httpStatus = response.status;
        } else {
          throw primaryError;
        }
      }
      
      result.content = content;
      result.httpStatus = httpStatus;
      result.responseTime = Date.now() - startTime;
      
      // Check for blank screen
      if (!content || content.trim().length < 100) {
        result.status = 'blank';
        result.errors.push('Blank or minimal content detected');
        result.consecutiveFailures++;
        return result;
      }
      
      // Check for Phase 4 features
      const foundFeatures = this.config.requiredFeatures.filter(feature => 
        content.includes(feature)
      );
      result.features = foundFeatures;
      
      // Check API endpoints (for localhost URLs)
      if (urlConfig.url.includes('localhost')) {
        for (const endpoint of this.config.apiEndpoints) {
          try {
            const apiUrl = urlConfig.url + endpoint;
            const apiResponse = await this.httpRequest(apiUrl);
            if (apiResponse.status !== 200) {
              result.errors.push(`API endpoint ${endpoint} returned ${apiResponse.status}`);
            }
          } catch (apiError) {
            result.errors.push(`API endpoint ${endpoint} failed: ${apiError.message}`);
          }
        }
      }
      
      // Determine overall status
      if (httpStatus >= 500) {
        result.status = 'server_error';
        result.consecutiveFailures++;
      } else if (httpStatus >= 400) {
        result.status = 'client_error';
        result.consecutiveFailures++;
      } else if (foundFeatures.length < this.config.requiredFeatures.length * 0.6) {
        result.status = 'missing_features';
        result.consecutiveFailures++;
        result.errors.push(`Only ${foundFeatures.length}/${this.config.requiredFeatures.length} required features found`);
      } else {
        result.status = 'healthy';
        result.consecutiveFailures = 0; // Reset on success
      }
      
      this.log(`${urlConfig.name}: ${result.status} (${result.responseTime}ms, ${result.features.length} features)`, 
        result.status === 'healthy' ? 'success' : 'warning');
      
    } catch (error) {
      result.status = 'error';
      result.errors.push(error.message);
      result.consecutiveFailures++;
      result.responseTime = Date.now() - startTime;
      
      this.log(`${urlConfig.name}: ERROR - ${error.message}`, 'error');
    }
    
    return result;
  }

  /**
   * Attempt to correct issues with a URL
   */
  async attemptCorrection(urlConfig, result) {
    this.log(`Attempting correction for ${urlConfig.name} (${result.status})`, 'info');
    
    const correction = {
      timestamp: new Date(),
      issue: result.status,
      actions: [],
      success: false
    };
    
    try {
      // Localhost corrections
      if (urlConfig.url.includes('localhost')) {
        await this.correctLocalhost(urlConfig, result, correction);
      } 
      // Railway corrections
      else {
        await this.correctRailway(urlConfig, result, correction);
      }
      
      correction.success = true;
      this.log(`✅ Correction completed for ${urlConfig.name}`, 'success');
      
    } catch (error) {
      correction.actions.push(`FAILED: ${error.message}`);
      this.log(`❌ Correction failed for ${urlConfig.name}: ${error.message}`, 'error');
    }
    
    result.corrections.push(correction);
    this.status.corrections.push({
      url: urlConfig.name,
      ...correction
    });
  }

  /**
   * Correct localhost server issues
   */
  async correctLocalhost(urlConfig, result, correction) {
    const port = urlConfig.url.match(/:(\d+)/)?.[1];
    
    // Check if server is running
    correction.actions.push(`Checking server status on port ${port}`);
    
    if (result.status === 'error' || result.status === 'blank') {
      // Try to restart the server
      correction.actions.push('Restarting local development server');
      
      // Kill any existing process on the port
      try {
        if (process.platform === 'win32') {
          await execAsync(`netstat -ano | findstr :${port}`);
          await execAsync(`taskkill /F /PID $(netstat -ano | findstr :${port} | awk '{print $5}' | head -1)`);
        } else {
          await execAsync(`lsof -ti:${port} | xargs kill -9`);
        }
        correction.actions.push(`Killed existing process on port ${port}`);
      } catch (killError) {
        correction.actions.push(`No process found on port ${port}`);
      }
      
      // Start appropriate server based on port
      if (port === '3000' || port === '3001') {
        // React dev server
        correction.actions.push('Starting React dev server');
        const child = spawn('npm', ['run', 'dev:client'], { 
          detached: true, 
          stdio: 'ignore',
          cwd: process.cwd()
        });
        child.unref();
      } else {
        // Simple server
        correction.actions.push('Starting simple production server');
        const child = spawn('node', ['server-simple.cjs'], {
          detached: true,
          stdio: 'ignore',
          env: { ...process.env, PORT: port },
          cwd: process.cwd()
        });
        child.unref();
      }
      
      // Wait a bit for server to start
      await new Promise(resolve => setTimeout(resolve, 10000));
      correction.actions.push('Server restart initiated');
    }
    
    if (result.status === 'missing_features') {
      // Rebuild the application
      correction.actions.push('Rebuilding application');
      await execAsync('npm run build');
      correction.actions.push('Build completed');
    }
  }

  /**
   * Correct Railway deployment issues
   */
  async correctRailway(urlConfig, result, correction) {
    correction.actions.push('Triggering Railway redeployment');
    
    // Update timestamp in server file to force rebuild
    const serverFilePath = path.join(process.cwd(), 'server-simple.cjs');
    const newTimestamp = new Date().toISOString();
    
    try {
      let serverContent = fs.readFileSync(serverFilePath, 'utf8');
      serverContent = serverContent.replace(
        /\/\/ Force Railway rebuild: .*/,
        `// Force Railway rebuild: ${newTimestamp} - Auto-correction by Monitoring Agent`
      );
      fs.writeFileSync(serverFilePath, serverContent);
      correction.actions.push('Updated server timestamp');
      
      // Commit and push changes
      await execAsync('git add server-simple.cjs');
      await execAsync(`git commit -m "Auto-fix: Force Railway rebuild ${newTimestamp}"`);
      await execAsync('git push origin development');
      correction.actions.push('Changes committed and pushed to Railway');
      
      // Wait for Railway deployment (they take 2-3 minutes typically)
      correction.actions.push('Waiting for Railway deployment (3 minutes)');
      await new Promise(resolve => setTimeout(resolve, 180000));
      
    } catch (gitError) {
      correction.actions.push(`Git operation failed: ${gitError.message}`);
      throw gitError;
    }
  }

  /**
   * Check if all URLs are showing Phase 4 features
   */
  allUrlsShowPhase4Features() {
    return Object.values(this.status.urls).every(urlStatus => 
      urlStatus.status === 'healthy' && 
      urlStatus.features.length >= this.config.requiredFeatures.length * 0.8
    );
  }

  /**
   * Make HTTP request with timeout
   */
  httpRequest(url) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https');
      const module = isHttps ? https : http;
      
      const req = module.get(url, {
        timeout: this.config.requestTimeout
      }, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            content: data,
            headers: res.headers
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

  /**
   * Log message with timestamp and color
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green  
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'
    };
    
    const coloredMessage = `${colors[level] || colors.info}${message}${colors.reset}`;
    console.log(`[${timestamp}] ${coloredMessage}`);
    
    // Also write to log file
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  /**
   * Save current status to JSON file
   */
  async saveStatus() {
    try {
      const statusData = {
        ...this.status,
        uptime: Date.now() - this.status.startTime.getTime(),
        successRate: this.status.totalChecks > 0 ? 
          (this.status.successfulChecks / this.status.totalChecks * 100).toFixed(2) : '0.00'
      };
      
      fs.writeFileSync(this.statusFile, JSON.stringify(statusData, null, 2));
    } catch (error) {
      this.log(`Failed to save status: ${error.message}`, 'error');
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    const uptime = Date.now() - this.status.startTime.getTime();
    const successRate = this.status.totalChecks > 0 ? 
      (this.status.successfulChecks / this.status.totalChecks * 100).toFixed(2) : '0.00';
      
    return {
      ...this.status,
      uptime: Math.floor(uptime / 1000), // seconds
      successRate: `${successRate}%`,
      nextCheck: this.status.isRunning ? 
        new Date(Date.now() + this.config.checkInterval) : null
    };
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    this.log('Shutting down monitoring agent...', 'info');
    this.status.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.saveStatus();
    this.log('Monitoring agent stopped', 'info');
    process.exit(0);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Sentia Manufacturing Dashboard - Monitoring Agent

Usage:
  node monitoring-agent.js [options]

Options:
  --status    Show current monitoring status
  --help      Show this help message
  
  (no args)   Start continuous monitoring

The agent will monitor all deployment URLs every 5 minutes and
automatically correct issues until perfect Phase 4 deployment
alignment is achieved across all environments.
    `);
    process.exit(0);
  }
  
  if (args.includes('--status')) {
    try {
      const statusFile = 'monitoring-status.json';
      if (fs.existsSync(statusFile)) {
        const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        console.log('\n=== MONITORING STATUS ===');
        console.log(`Running: ${status.isRunning ? '✅ YES' : '❌ NO'}`);
        console.log(`Total Checks: ${status.totalChecks}`);
        console.log(`Success Rate: ${status.successRate}`);
        console.log(`Last Check: ${status.lastCheck}`);
        console.log('\nURL Status:');
        Object.entries(status.urls).forEach(([name, urlStatus]) => {
          const statusIcon = urlStatus.status === 'healthy' ? '✅' : '❌';
          console.log(`  ${statusIcon} ${name}: ${urlStatus.status} (${urlStatus.features.length} features)`);
        });
      } else {
        console.log('No monitoring status available. Start monitoring first.');
      }
    } catch (error) {
      console.error('Error reading status:', error.message);
    }
    process.exit(0);
  }
  
  // Default: start monitoring
  const agent = new MonitoringAgent();
  agent.start().catch(error => {
    console.error('Failed to start monitoring agent:', error);
    process.exit(1);
  });
}

module.exports = MonitoringAgent;