#!/usr/bin/env node

/**
 * Railway Development Environment Deployment Script
 * Optimized for rapid iteration and autonomous testing
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ENVIRONMENT = 'development';
const SERVICE_URL = 'https://sentia-manufacturing-dashboard-development.up.railway.app';

class DevelopmentDeployment {
  constructor() {
    this.logFile = `logs/deploy-${ENVIRONMENT}-${Date.now()}.log`;
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    const logsDir = path.dirname(this.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  async executeCommand(command, timeout = 300000) {
    this.log(`Executing: ${command}`);
    try {
      const result = execSync(command, { 
        encoding: 'utf8', 
        timeout,
        stdio: ['inherit', 'pipe', 'pipe']
      });
      return result;
    } catch (error) {
      this.log(`Command failed: ${error.message}`);
      throw error;
    }
  }

  async deploy() {
    try {
      this.log('Starting development deployment...');
      
      // Check Railway CLI connection
      this.log('Checking Railway connection...');
      try {
        await this.executeCommand('railway status');
      } catch (error) {
        this.log('Railway not connected, attempting to link project...');
        // Try to link if available
        try {
          await this.executeCommand('railway link --environment development');
        } catch (linkError) {
          this.log('Warning: Unable to link Railway project automatically');
        }
      }

      // Install dependencies with cache clearing
      this.log('Installing dependencies...');
      await this.executeCommand('npm ci --no-cache');

      // Run build
      this.log('Building application...');
      await this.executeCommand('npm run build');

      // Deploy to Railway
      this.log('Deploying to Railway development environment...');
      await this.executeCommand('railway up --environment development --detach');

      // Write deployment marker
      const deploymentInfo = {
        environment: ENVIRONMENT,
        timestamp: new Date().toISOString(),
        deploymentId: `dev-${Date.now()}`,
        serviceUrl: SERVICE_URL,
        status: 'deployed'
      };

      fs.writeFileSync(`deployment-marker-${ENVIRONMENT}.txt`, JSON.stringify(deploymentInfo, null, 2));

      this.log('Development deployment completed successfully!');
      this.log(`Service URL: ${SERVICE_URL}`);
      
      return deploymentInfo;

    } catch (error) {
      this.log(`Deployment failed: ${error.message}`);
      throw error;
    }
  }
}

// Run deployment
const deployment = new DevelopmentDeployment();
deployment.deploy().catch(console.error);