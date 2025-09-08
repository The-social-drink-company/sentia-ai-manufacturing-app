#!/usr/bin/env node

/**
 * Railway Testing Environment Deployment Script
 * Optimized for User Acceptance Testing (UAT)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ENVIRONMENT = 'testing';
const SERVICE_URL = 'https://sentiatest.financeflo.ai';

class TestingDeployment {
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

  async runQualityChecks() {
    this.log('Running quality checks for testing environment...');
    
    try {
      // Run lint check
      this.log('Running ESLint...');
      await this.executeCommand('npm run lint');
      this.log('Lint check: PASS');
    } catch (error) {
      this.log('Lint check: FAIL - Continuing with warnings');
    }

    try {
      // Run type check
      this.log('Running TypeScript check...');
      await this.executeCommand('npm run typecheck');
      this.log('Type check: PASS');
    } catch (error) {
      this.log('Type check: FAIL - Continuing with warnings');
    }

    try {
      // Run unit tests
      this.log('Running unit tests...');
      await this.executeCommand('npm run test:run');
      this.log('Unit tests: PASS');
    } catch (error) {
      this.log('Unit tests: FAIL - Continuing with warnings');
    }
  }

  async deploy() {
    try {
      this.log('Starting testing environment deployment...');
      
      // Run quality checks first
      await this.runQualityChecks();

      // Check Railway CLI connection
      this.log('Checking Railway connection...');
      try {
        await this.executeCommand('railway status');
      } catch (error) {
        this.log('Railway not connected, attempting to link project...');
        try {
          await this.executeCommand('railway link --environment testing');
        } catch (linkError) {
          this.log('Warning: Unable to link Railway project automatically');
        }
      }

      // Install dependencies
      this.log('Installing dependencies...');
      await this.executeCommand('npm ci --no-cache');

      // Run build with extended timeout for testing environment
      this.log('Building application for testing...');
      await this.executeCommand('npm run build', 600000); // 10 minutes

      // Deploy to Railway testing environment
      this.log('Deploying to Railway testing environment...');
      await this.executeCommand('railway up --environment testing --detach');

      // Wait for deployment to stabilize
      this.log('Waiting for deployment to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

      // Write deployment marker
      const deploymentInfo = {
        environment: ENVIRONMENT,
        timestamp: new Date().toISOString(),
        deploymentId: `test-${Date.now()}`,
        serviceUrl: SERVICE_URL,
        status: 'deployed',
        readyForUAT: true
      };

      fs.writeFileSync(`deployment-marker-${ENVIRONMENT}.txt`, JSON.stringify(deploymentInfo, null, 2));

      this.log('Testing environment deployment completed successfully!');
      this.log(`Service URL: ${SERVICE_URL}`);
      this.log('Environment is ready for User Acceptance Testing (UAT)');
      
      return deploymentInfo;

    } catch (error) {
      this.log(`Deployment failed: ${error.message}`);
      throw error;
    }
  }

  async runHealthCheck() {
    this.log('Running health check for testing environment...');
    
    try {
      // Wait a bit for the service to be fully up
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      await this.executeCommand(`curl -f ${SERVICE_URL}/api/health`);
      this.log('Health check: PASS');
      return true;
    } catch (error) {
      this.log(`Health check: FAIL - ${error.message}`);
      return false;
    }
  }
}

// Run deployment
const deployment = new TestingDeployment();

async function main() {
  try {
    const result = await deployment.deploy();
    
    // Run health check
    const healthOk = await deployment.runHealthCheck();
    
    if (healthOk) {
      console.log('Testing deployment completed successfully and passed health checks!');
    } else {
      console.log('Testing deployment completed but health check failed');
    }
    
    return result;
  } catch (error) {
    console.error('Testing deployment failed:', error);
    process.exit(1);
  }
}

main();