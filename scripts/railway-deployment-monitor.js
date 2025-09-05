#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const RAILWAY_URLS = {
  production: 'https://sentia-manufacturing-dashboard-production.up.railway.app',
  development: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
  test: 'https://sentiatest.financeflo.ai'
};

const BRANCHES = ['development', 'test', 'production'];

class RailwayDeploymentMonitor {
  constructor() {
    this.logFile = 'railway-deployment-logs.jsonl';
    this.isRunning = false;
  }

  async log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };
    
    console.log(`[${logEntry.timestamp}] [${level}] ${message}`);
    
    try {
      await fs.appendFile(
        this.logFile,
        JSON.stringify(logEntry) + '\n'
      );
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  async checkDeploymentStatus(branch, url) {
    try {
      const response = await fetch(url, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Railway-Monitor/1.0' }
      });
      
      const status = {
        branch,
        url,
        statusCode: response.status,
        online: response.status === 200,
        responseTime: 0
      };

      if (response.status === 200) {
        const text = await response.text();
        status.hasContent = text.length > 0;
        status.features = this.detectFeatures(text);
      }

      return status;
    } catch (error) {
      return {
        branch,
        url,
        online: false,
        error: error.message
      };
    }
  }

  detectFeatures(html) {
    const features = [];
    if (html.includes('Sentia')) features.push('sentia-branding');
    if (html.includes('dashboard')) features.push('dashboard');
    if (html.includes('SSE')) features.push('server-sent-events');
    if (html.includes('clerk')) features.push('authentication');
    if (html.includes('widget')) features.push('widgets');
    return features;
  }

  async deployToBranch(branch) {
    try {
      await this.log('INFO', `Starting deployment to ${branch}`);
      
      // Ensure we're on the correct branch
      await execAsync(`git checkout ${branch}`);
      
      // Pull latest changes
      await execAsync(`git pull origin ${branch}`);
      
      // Make a minor update to trigger deployment
      const timestamp = new Date().toISOString();
      const deploymentMarker = `deployment-marker-${branch}.txt`;
      await fs.writeFile(deploymentMarker, `Deployment triggered at ${timestamp}`);
      
      // Commit and push
      await execAsync('git add .');
      await execAsync(`git commit -m "chore: trigger deployment for ${branch} - ${timestamp}"`);
      await execAsync(`git push origin ${branch}`);
      
      await this.log('SUCCESS', `Deployed to ${branch}`);
      return true;
    } catch (error) {
      await this.log('ERROR', `Failed to deploy to ${branch}`, { error: error.message });
      return false;
    }
  }

  async runDeploymentCycle() {
    await this.log('INFO', 'Starting deployment cycle');
    
    for (const branch of BRANCHES) {
      const status = await this.checkDeploymentStatus(branch, RAILWAY_URLS[branch]);
      await this.log('STATUS', `${branch} deployment status`, status);
      
      if (!status.online || status.features?.length < 3) {
        await this.log('WARN', `${branch} needs redeployment`);
        await this.deployToBranch(branch);
      }
    }
    
    // Create PR for each branch if needed
    try {
      for (const branch of BRANCHES) {
        if (branch !== 'production') {
          const prCmd = `gh pr create --base production --head ${branch} --title "Auto-merge ${branch} to production" --body "Automated deployment sync" 2>/dev/null || true`;
          await execAsync(prCmd);
        }
      }
    } catch (error) {
      // PRs might already exist
    }
    
    await this.log('INFO', 'Deployment cycle completed');
  }

  async start() {
    this.isRunning = true;
    await this.log('INFO', 'Railway Deployment Monitor started');
    
    while (this.isRunning) {
      await this.runDeploymentCycle();
      
      // Wait 5 minutes before next cycle
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
  }

  stop() {
    this.isRunning = false;
    this.log('INFO', 'Railway Deployment Monitor stopped');
  }
}

// Start the monitor
const monitor = new RailwayDeploymentMonitor();
monitor.start().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});