#!/usr/bin/env node

/**
 * Comprehensive Railway Deployment Pipeline
 * Deploys both main application and autonomous services
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

class RailwayPipeline {
  constructor() {
    this.environments = {
      development: {
        token: 'f97b65ad-c306-410a-9d5d-5f5fdc098620',
        mainAppUrl: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
        mcpUrl: 'https://web-production-99691282.up.railway.app', // Shared MCP server
        testAgentUrl: 'https://sentia-test-agent-development.up.railway.app'
      },
      testing: {
        token: '02e0c7f6-9ca1-4355-af52-ee9eec0b3545',
        mainAppUrl: 'https://sentiatest.financeflo.ai',
        mcpUrl: 'https://web-production-99691282.up.railway.app', // Shared MCP server
        testAgentUrl: 'https://sentia-test-agent-testing.up.railway.app'
      },
      production: {
        token: '3e0053fc-ea90-49ec-9708-e09d58cad4a0',
        mainAppUrl: 'https://web-production-1f10.up.railway.app',
        mcpUrl: 'https://web-production-99691282.up.railway.app', // Shared MCP server
        testAgentUrl: 'https://sentia-test-agent-production.up.railway.app'
      }
    };
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[RAILWAY-PIPELINE-${level}] ${message}`);
  }

  async executeCommand(command, args = [], env = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, ...env }
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

  async deployMainApplication(environment) {
    this.log(`Deploying main application to ${environment}...`);
    
    const envConfig = this.environments[environment];
    if (!envConfig || !envConfig.token) {
      throw new Error(`No configuration found for environment: ${environment}`);
    }

    try {
      // Set Railway token for this deployment
      const railwayEnv = { RAILWAY_TOKEN: envConfig.token };
      
      // Deploy main application
      await this.executeCommand('railway', ['deploy', '--environment', environment], railwayEnv);
      
      this.log(`Main application deployed successfully to ${environment}`);
      return envConfig.mainAppUrl;
    } catch (error) {
      this.log(`Main application deployment failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async deployMCPServer(environment) {
    this.log(`Deploying MCP server to ${environment}...`);
    
    const envConfig = this.environments[environment];
    const railwayEnv = { RAILWAY_TOKEN: envConfig.token };

    try {
      // Create MCP service if it doesn't exist
      await this.executeCommand('railway', [
        'service', 'create', 'mcp-server',
        '--config', 'railway-mcp.json',
        '--environment', environment
      ], railwayEnv);

      this.log(`MCP server deployed successfully to ${environment}`);
      return envConfig.mcpUrl;
    } catch (error) {
      this.log(`MCP server deployment failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async deployTestAgent(environment) {
    this.log(`Deploying autonomous test agent to ${environment}...`);
    
    const envConfig = this.environments[environment];
    const railwayEnv = { RAILWAY_TOKEN: envConfig.token };

    try {
      // Create test agent service if it doesn't exist
      await this.executeCommand('railway', [
        'service', 'create', 'autonomous-test-agent',
        '--config', 'railway-test-agent.json',
        '--environment', environment
      ], railwayEnv);

      this.log(`Autonomous test agent deployed successfully to ${environment}`);
      return envConfig.testAgentUrl;
    } catch (error) {
      this.log(`Test agent deployment failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async verifyDeployments(environment) {
    this.log(`Verifying deployments for ${environment}...`);
    
    const envConfig = this.environments[environment];
    const verifications = [];

    // Check main application
    try {
      const { stdout } = await this.executeCommand('curl', ['-f', `${envConfig.mainAppUrl}/api/health`]);
      verifications.push({ service: 'main-app', status: 'healthy', url: envConfig.mainAppUrl });
    } catch (error) {
      verifications.push({ service: 'main-app', status: 'unhealthy', error: error.message });
    }

    // Check MCP server
    try {
      const { stdout } = await this.executeCommand('curl', ['-f', `${envConfig.mcpUrl}/health`]);
      verifications.push({ service: 'mcp-server', status: 'healthy', url: envConfig.mcpUrl });
    } catch (error) {
      verifications.push({ service: 'mcp-server', status: 'unhealthy', error: error.message });
    }

    // Check test agent
    try {
      const { stdout } = await this.executeCommand('curl', ['-f', `${envConfig.testAgentUrl}/health`]);
      verifications.push({ service: 'test-agent', status: 'healthy', url: envConfig.testAgentUrl });
    } catch (error) {
      verifications.push({ service: 'test-agent', status: 'unhealthy', error: error.message });
    }

    return verifications;
  }

  async deployEnvironment(environment) {
    this.log(`Starting complete deployment to ${environment}...`);
    
    const results = {
      environment,
      timestamp: new Date().toISOString(),
      deployments: {},
      verifications: [],
      success: false
    };

    try {
      // Deploy all services
      results.deployments.mainApp = await this.deployMainApplication(environment);
      results.deployments.mcpServer = await this.deployMCPServer(environment);
      results.deployments.testAgent = await this.deployTestAgent(environment);

      // Wait for services to start
      this.log('Waiting for services to start...', 'INFO');
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Verify deployments
      results.verifications = await this.verifyDeployments(environment);
      
      // Check if all services are healthy
      const allHealthy = results.verifications.every(v => v.status === 'healthy');
      results.success = allHealthy;

      if (allHealthy) {
        this.log(`All services deployed successfully to ${environment}!`, 'SUCCESS');
      } else {
        this.log(`Some services failed health checks in ${environment}`, 'WARN');
      }

    } catch (error) {
      this.log(`Deployment to ${environment} failed: ${error.message}`, 'ERROR');
      results.error = error.message;
    }

    // Save deployment report
    await this.saveDeploymentReport(results);
    return results;
  }

  async saveDeploymentReport(results) {
    const reportPath = path.join(process.cwd(), 'deployment-reports', `${results.environment}-${Date.now()}.json`);
    
    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
      this.log(`Deployment report saved: ${reportPath}`);
    } catch (error) {
      this.log(`Failed to save deployment report: ${error.message}`, 'ERROR');
    }
  }

  async run() {
    const environment = process.argv[2] || 'development';
    
    if (!['development', 'testing', 'production'].includes(environment)) {
      this.log(`Invalid environment: ${environment}. Use: development, testing, or production`, 'ERROR');
      process.exit(1);
    }

    this.log(`Starting Railway deployment pipeline for ${environment}...`);
    
    try {
      const results = await this.deployEnvironment(environment);
      
      if (results.success) {
        this.log('Deployment pipeline completed successfully!', 'SUCCESS');
        this.log(`Main App: ${results.deployments.mainApp}`);
        this.log(`MCP Server: ${results.deployments.mcpServer}`);
        this.log(`Test Agent: ${results.deployments.testAgent}`);
      } else {
        this.log('Deployment pipeline completed with issues', 'WARN');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`Deployment pipeline failed: ${error.message}`, 'ERROR');
      process.exit(1);
    }
  }
}

// Run pipeline if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const pipeline = new RailwayPipeline();
  pipeline.run();
}

export default RailwayPipeline;