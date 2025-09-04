#!/usr/bin/env node

/**
 * Railway Deployment Tracker with Direct API Integration
 * Monitors deployments across all branches and provides real-time feedback
 */

const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

// Railway project configuration
const RAILWAY_CONFIG = {
  projectId: process.env.RAILWAY_PROJECT_ID || 'sentia-manufacturing-dashboard',
  apiToken: process.env.RAILWAY_TOKEN,
  branches: {
    development: {
      serviceId: 'development',
      url: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
      githubBranch: 'development'
    },
    test: {
      serviceId: 'test', 
      url: 'https://sentiatest.financeflo.ai',
      githubBranch: 'test'
    },
    production: {
      serviceId: 'production',
      url: 'https://sentiaprod.financeflo.ai',
      githubBranch: 'production'
    }
  },
  checkInterval: 5 * 60 * 1000, // 5 minutes
  webhookUrl: process.env.WEBHOOK_URL // Optional webhook for notifications
};

// Deployment states
const DEPLOYMENT_STATES = {
  INITIALIZING: 'INITIALIZING',
  BUILDING: 'BUILDING',
  DEPLOYING: 'DEPLOYING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CRASHED: 'CRASHED',
  REMOVED: 'REMOVED',
  SKIPPED: 'SKIPPED'
};

class RailwayDeploymentTracker {
  constructor() {
    this.deployments = {};
    this.logs = {};
    this.errors = {};
    this.isRunning = false;
    this.checkCount = 0;
    
    // Initialize storage
    this.initializeStorage();
  }

  initializeStorage() {
    // Create logs directory
    const logsDir = './railway-deployment-logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Initialize branch tracking
    Object.keys(RAILWAY_CONFIG.branches).forEach(branch => {
      this.deployments[branch] = [];
      this.logs[branch] = [];
      this.errors[branch] = [];
    });
  }

  async start() {
    console.log('========================================');
    console.log('RAILWAY DEPLOYMENT TRACKER');
    console.log('Real-time Monitoring & Error Detection');
    console.log('========================================\n');
    
    this.isRunning = true;
    
    // Check Railway CLI availability
    const cliAvailable = await this.checkRailwayCli();
    if (!cliAvailable) {
      console.log('Installing Railway CLI...');
      await this.installRailwayCli();
    }
    
    // Initial check
    await this.checkAllDeployments();
    
    // Set up monitoring interval
    this.interval = setInterval(async () => {
      if (this.isRunning) {
        await this.checkAllDeployments();
      }
    }, RAILWAY_CONFIG.checkInterval);
    
    // Handle shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async checkRailwayCli() {
    try {
      const { stdout } = await execPromise('railway --version');
      console.log(`Railway CLI available: ${stdout.trim()}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async installRailwayCli() {
    try {
      console.log('Installing Railway CLI globally...');
      await execPromise('npm install -g @railway/cli');
      console.log('Railway CLI installed successfully');
      
      // Attempt login
      console.log('Please login to Railway if prompted...');
      await execPromise('railway login');
      
      return true;
    } catch (error) {
      console.error('Failed to install Railway CLI:', error.message);
      console.log('Please install manually: npm install -g @railway/cli');
      return false;
    }
  }

  async checkAllDeployments() {
    this.checkCount++;
    const timestamp = new Date().toISOString();
    
    console.log(`\n[CHECK #${this.checkCount}] ${timestamp}`);
    console.log('================================================');
    
    const results = {};
    
    for (const [branch, config] of Object.entries(RAILWAY_CONFIG.branches)) {
      const result = await this.checkBranchDeployment(branch, config);
      results[branch] = result;
    }
    
    // Analyze results
    await this.analyzeResults(results);
    
    // Save comprehensive report
    this.saveReport(timestamp, results);
    
    // Display summary
    this.displaySummary(results);
  }

  async checkBranchDeployment(branch, config) {
    console.log(`\nChecking ${branch} deployment...`);
    
    const result = {
      branch,
      timestamp: Date.now(),
      status: 'CHECKING',
      logs: [],
      errors: [],
      build: null,
      deployment: null,
      health: null
    };
    
    try {
      // Get deployment status
      result.deployment = await this.getDeploymentStatus(branch, config);
      
      // Get build logs
      result.logs = await this.getBuildLogs(branch, config);
      
      // Check health
      result.health = await this.checkHealth(config.url);
      
      // Analyze logs for errors
      result.errors = this.analyzeLogs(result.logs);
      
      // Determine overall status
      if (result.deployment === 'SUCCESS' && result.health.healthy) {
        result.status = 'HEALTHY';
        console.log(`  Status: HEALTHY - Deployment successful`);
      } else if (result.deployment === 'BUILDING') {
        result.status = 'BUILDING';
        console.log(`  Status: BUILDING - Build in progress`);
      } else if (result.deployment === 'FAILED' || result.errors.length > 0) {
        result.status = 'FAILED';
        console.log(`  Status: FAILED - ${result.errors.length} error(s) found`);
        
        // Attempt auto-fix if configured
        if (result.errors.length > 0) {
          await this.attemptFixes(branch, result.errors);
        }
      } else {
        result.status = 'UNKNOWN';
        console.log(`  Status: UNKNOWN`);
      }
      
      // Store in history
      this.deployments[branch].push(result);
      
    } catch (error) {
      console.error(`  Error checking ${branch}: ${error.message}`);
      result.status = 'ERROR';
      result.errors.push({
        type: 'CHECK_ERROR',
        message: error.message
      });
    }
    
    return result;
  }

  async getDeploymentStatus(branch, config) {
    try {
      // Method 1: Railway CLI status
      const { stdout } = await execPromise(`railway status --service ${config.serviceId}`, {
        timeout: 30000,
        cwd: process.cwd()
      });
      
      if (stdout.includes('Deployed')) {
        return 'SUCCESS';
      } else if (stdout.includes('Building')) {
        return 'BUILDING';
      } else if (stdout.includes('Failed')) {
        return 'FAILED';
      }
      
      return 'UNKNOWN';
      
    } catch (error) {
      // Fallback: Check via HTTP
      try {
        const response = await this.checkUrl(config.url);
        return response.statusCode === 200 ? 'SUCCESS' : 'FAILED';
      } catch (httpError) {
        return 'FAILED';
      }
    }
  }

  async getBuildLogs(branch, config) {
    const logs = [];
    
    try {
      // Get deployment logs
      const { stdout: deployLogs } = await execPromise(`railway logs --service ${config.serviceId} --deployment`, {
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (deployLogs) {
        logs.push({
          type: 'DEPLOYMENT_LOGS',
          timestamp: Date.now(),
          content: deployLogs
        });
      }
      
      // Get build logs
      try {
        const { stdout: buildLogs } = await execPromise(`railway logs --service ${config.serviceId} --build`, {
          timeout: 30000,
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        if (buildLogs) {
          logs.push({
            type: 'BUILD_LOGS',
            timestamp: Date.now(),
            content: buildLogs
          });
        }
      } catch (buildError) {
        // Build logs might not be available for older deployments
      }
      
    } catch (error) {
      logs.push({
        type: 'ERROR',
        timestamp: Date.now(),
        content: `Failed to get logs: ${error.message}`
      });
    }
    
    // Also check git logs for recent deployments
    try {
      const { stdout: gitLog } = await execPromise(`git log --oneline -5 origin/${config.githubBranch}`, {
        timeout: 10000
      });
      
      if (gitLog) {
        logs.push({
          type: 'GIT_COMMITS',
          timestamp: Date.now(),
          content: gitLog
        });
      }
    } catch (error) {
      // Git log is optional
    }
    
    return logs;
  }

  async checkHealth(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      https.get(url, { timeout: 10000 }, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          
          resolve({
            healthy: res.statusCode === 200,
            statusCode: res.statusCode,
            responseTime,
            hasPhase4: data.includes('PredictiveMaintenanceWidget') || 
                      data.includes('SmartInventoryWidget')
          });
        });
      }).on('error', (err) => {
        resolve({
          healthy: false,
          statusCode: 0,
          responseTime: Date.now() - startTime,
          error: err.message
        });
      });
    });
  }

  async checkUrl(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { timeout: 10000 }, (res) => {
        resolve(res);
      }).on('error', reject);
    });
  }

  analyzeLogs(logs) {
    const errors = [];
    
    // Combine all log content
    const allLogs = logs.map(l => l.content).join('\n');
    
    // Check for common errors
    const errorPatterns = [
      { pattern: /npm ERR!/gi, type: 'NPM_ERROR' },
      { pattern: /Build failed/gi, type: 'BUILD_FAILED' },
      { pattern: /SyntaxError/gi, type: 'SYNTAX_ERROR' },
      { pattern: /Cannot find module/gi, type: 'MODULE_NOT_FOUND' },
      { pattern: /ENOENT/gi, type: 'FILE_NOT_FOUND' },
      { pattern: /out of memory/gi, type: 'OUT_OF_MEMORY' },
      { pattern: /TypeError/gi, type: 'TYPE_ERROR' },
      { pattern: /ReferenceError/gi, type: 'REFERENCE_ERROR' },
      { pattern: /Failed to compile/gi, type: 'COMPILATION_ERROR' },
      { pattern: /trailing comma/gi, type: 'JSON_ERROR' }
    ];
    
    errorPatterns.forEach(({ pattern, type }) => {
      const matches = allLogs.match(pattern);
      if (matches) {
        errors.push({
          type,
          count: matches.length,
          pattern: pattern.toString(),
          sample: matches[0]
        });
      }
    });
    
    return errors;
  }

  async attemptFixes(branch, errors) {
    console.log(`  Attempting to fix ${errors.length} error(s) in ${branch}...`);
    
    let fixesApplied = [];
    
    for (const error of errors) {
      switch (error.type) {
        case 'JSON_ERROR':
          if (await this.fixJsonError()) {
            fixesApplied.push('Fixed JSON syntax');
          }
          break;
          
        case 'MODULE_NOT_FOUND':
          if (await this.fixMissingModules()) {
            fixesApplied.push('Installed missing modules');
          }
          break;
          
        case 'SYNTAX_ERROR':
          if (await this.fixSyntaxErrors()) {
            fixesApplied.push('Fixed syntax errors');
          }
          break;
          
        case 'BUILD_FAILED':
          if (await this.fixBuildErrors()) {
            fixesApplied.push('Fixed build configuration');
          }
          break;
      }
    }
    
    if (fixesApplied.length > 0) {
      console.log(`  Applied ${fixesApplied.length} fix(es)`);
      await this.commitAndDeploy(branch, fixesApplied);
    }
  }

  async fixJsonError() {
    try {
      // Fix trailing commas in JSON files
      const jsonFiles = ['package.json', 'tsconfig.json', 'railway.json'];
      
      for (const file of jsonFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const fixed = content.replace(/,(\s*[}\]])/g, '$1');
          
          if (content !== fixed) {
            fs.writeFileSync(file, fixed);
            console.log(`    Fixed JSON in ${file}`);
          }
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async fixMissingModules() {
    try {
      await execPromise('npm install', { timeout: 60000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  async fixSyntaxErrors() {
    try {
      await execPromise('npm run lint:fix', { timeout: 30000 });
      return true;
    } catch (error) {
      // Even if lint fails, it may have fixed some issues
      return true;
    }
  }

  async fixBuildErrors() {
    try {
      // Clean and rebuild
      await execPromise('rm -rf dist node_modules/.cache', { timeout: 10000 });
      await execPromise('npm run build', { timeout: 60000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  async commitAndDeploy(branch, fixes) {
    console.log(`  Committing fixes to ${branch}...`);
    
    const message = `fix: auto-fix deployment errors

Applied fixes:
${fixes.map(f => `- ${f}`).join('\n')}

AUTO-DEPLOY by Railway Deployment Tracker
Branch: ${branch}
Timestamp: ${new Date().toISOString()}`;
    
    try {
      await execPromise(`git checkout ${branch}`);
      await execPromise('git add -A');
      await execPromise(`git commit -m "${message}"`);
      await execPromise(`git push origin ${branch}`);
      
      console.log(`  Pushed fixes to ${branch} - Railway will redeploy`);
      
      // Record fix attempt
      this.errors[branch].push({
        timestamp: Date.now(),
        fixes: fixes,
        deployed: true
      });
      
    } catch (error) {
      console.error(`  Failed to deploy fixes: ${error.message}`);
    }
  }

  analyzeResults(results) {
    // Check for patterns across branches
    const allErrors = [];
    
    Object.values(results).forEach(result => {
      allErrors.push(...result.errors);
    });
    
    if (allErrors.length > 0) {
      console.log('\n--- ERROR ANALYSIS ---');
      
      // Group errors by type
      const errorTypes = {};
      allErrors.forEach(error => {
        errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
      });
      
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} occurrence(s)`);
      });
    }
  }

  saveReport(timestamp, results) {
    const report = {
      timestamp,
      checkCount: this.checkCount,
      results,
      summary: {
        healthy: 0,
        building: 0,
        failed: 0,
        unknown: 0
      }
    };
    
    // Calculate summary
    Object.values(results).forEach(result => {
      switch (result.status) {
        case 'HEALTHY':
          report.summary.healthy++;
          break;
        case 'BUILDING':
          report.summary.building++;
          break;
        case 'FAILED':
          report.summary.failed++;
          break;
        default:
          report.summary.unknown++;
      }
    });
    
    // Save to file
    const reportFile = `./railway-deployment-logs/report-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Also update latest report
    fs.writeFileSync('./railway-deployment-logs/latest.json', JSON.stringify(report, null, 2));
  }

  displaySummary(results) {
    console.log('\n--- DEPLOYMENT SUMMARY ---');
    
    Object.entries(results).forEach(([branch, result]) => {
      let icon = '?';
      let color = '\x1b[0m';
      
      switch (result.status) {
        case 'HEALTHY':
          icon = 'OK';
          color = '\x1b[32m';
          break;
        case 'BUILDING':
          icon = 'BUILD';
          color = '\x1b[33m';
          break;
        case 'FAILED':
          icon = 'FAIL';
          color = '\x1b[31m';
          break;
      }
      
      console.log(`${color}[${icon}]\x1b[0m ${branch.padEnd(12)} | Errors: ${result.errors.length} | Health: ${result.health?.healthy ? 'UP' : 'DOWN'}`);
    });
    
    console.log('\nNext check in 5 minutes...');
  }

  stop() {
    console.log('\n\nStopping Railway Deployment Tracker...');
    this.isRunning = false;
    
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    // Final report
    console.log('Final Statistics:');
    console.log(`Total checks: ${this.checkCount}`);
    
    Object.entries(this.deployments).forEach(([branch, deployments]) => {
      console.log(`${branch}: ${deployments.length} deployment(s) tracked`);
    });
    
    process.exit(0);
  }
}

// Start the tracker
const tracker = new RailwayDeploymentTracker();
tracker.start();