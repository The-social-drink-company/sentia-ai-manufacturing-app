#!/usr/bin/env node

/**
 * Railway Test Agent Deployment Script
 * Deploys the autonomous test agent as a separate Railway service
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

class RailwayDeployment {
  constructor() {
    this.projectName = 'sentia-test-agent';
    this.serviceName = 'autonomous-test-agent';
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[DEPLOY-${level}] ${message}`);
  }

  async executeCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async createRailwayProject() {
    this.log('Creating Railway project for test agent...');
    
    try {
      // Create new Railway project
      await this.executeCommand('railway', ['project', 'create', this.projectName]);
      this.log(`Railway project '${this.projectName}' created successfully`);
    } catch (error) {
      // Project might already exist
      this.log(`Project creation failed (might already exist): ${error.message}`, 'WARN');
    }
  }

  async setupRailwayEnvironment() {
    this.log('Setting up Railway environment variables...');
    
    const envVars = {
      'NODE_ENV': 'production',
      'AUTONOMOUS_SCHEDULER_MODE': 'railway',
      'ENABLE_AUTONOMOUS_TESTING': 'true',
      'AUTO_FIX_ENABLED': 'true',
      'AUTO_DEPLOY_ENABLED': 'false',
      'TEST_AGENT_PORT': '6001',
      'MAIN_APP_URL': 'https://sentia-manufacturing-dashboard-development.up.railway.app',
      'MCP_SERVER_URL': 'https://sentia-mcp-server-development.up.railway.app',
      'AUTONOMOUS_TEST_INTERVAL': '*/5 * * * *'
    };

    for (const [key, value] of Object.entries(envVars)) {
      try {
        await this.executeCommand('railway', ['variables', 'set', `${key}=${value}`]);
        this.log(`Set environment variable: ${key}`);
      } catch (error) {
        this.log(`Failed to set ${key}: ${error.message}`, 'ERROR');
      }
    }
  }

  async deployToRailway() {
    this.log('Deploying test agent to Railway...');
    
    try {
      // Deploy using the test agent configuration
      await this.executeCommand('railway', ['deploy', '--config', 'railway-test-agent.json']);
      this.log('Test agent deployed successfully to Railway');
      
      // Get the deployment URL
      const { stdout } = await this.executeCommand('railway', ['domain']);
      if (stdout.trim()) {
        this.log(`Test agent available at: ${stdout.trim()}`);
      }
    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async createMonitoringEndpoints() {
    this.log('Creating monitoring configuration...');
    
    const monitoringConfig = {
      service: 'autonomous-test-agent',
      healthCheck: {
        endpoint: '/health',
        interval: '30s',
        timeout: '10s',
        retries: 3
      },
      metrics: {
        endpoint: '/status',
        logs: '/logs'
      },
      alerting: {
        consecutiveFailures: 5,
        healthCheckFailures: 3
      }
    };

    try {
      await fs.writeFile(
        path.join(process.cwd(), 'railway-monitoring.json'),
        JSON.stringify(monitoringConfig, null, 2)
      );
      this.log('Monitoring configuration saved');
    } catch (error) {
      this.log(`Failed to save monitoring config: ${error.message}`, 'ERROR');
    }
  }

  async run() {
    try {
      this.log('Starting Railway Test Agent deployment...');
      
      await this.createRailwayProject();
      await this.setupRailwayEnvironment();
      await this.deployToRailway();
      await this.createMonitoringEndpoints();
      
      this.log('Railway Test Agent deployment completed successfully!');
      this.log('The autonomous test agent is now running 24/7 on Railway');
      
    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'ERROR');
      process.exit(1);
    }
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployment = new RailwayDeployment();
  deployment.run();
}

export default RailwayDeployment;