#!/usr/bin/env node

/**
 * Railway Deployment Script for Enterprise Self-Healing Agent v2.0
 * Deploys the self-healing agent as a separate Railway service for 24/7 monitoring
 */

import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

class SelfHealingAgentDeployer {
  constructor() {
    this.projectId = process.env.RAILWAY_PROJECT_ID || 'b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f';
    this.railwayToken = process.env.RAILWAY_TOKEN;
    this.serviceName = 'sentia-self-healing-agent';
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] [DEPLOY] ${message}`);
  }

  async checkRailwayAuth() {
    try {
      const { stdout } = await execPromise('railway whoami');
      this.log(`Railway authenticated: ${stdout.trim()}`);
      return true;
    } catch (error) {
      this.log('Railway not authenticated. Please run: railway login', 'ERROR');
      return false;
    }
  }

  async createServiceDirectory() {
    const serviceDir = path.join(process.cwd(), 'railway-self-healing-service');
    
    if (fs.existsSync(serviceDir)) {
      this.log('Cleaning existing service directory...');
      fs.rmSync(serviceDir, { recursive: true, force: true });
    }

    fs.mkdirSync(serviceDir, { recursive: true });
    this.log(`Created service directory: ${serviceDir}`);

    // Copy necessary files
    const filesToCopy = [
      'scripts/enterprise-self-healing-agent.js',
      'scripts/package.json'
    ];

    for (const file of filesToCopy) {
      const srcPath = path.join(process.cwd(), file);
      const destPath = path.join(serviceDir, path.basename(file));
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        this.log(`Copied ${file} to service directory`);
      }
    }

    // Create Railway config
    const railwayConfig = {
      build: {
        builder: 'nixpacks'
      },
      deploy: {
        startCommand: 'node enterprise-self-healing-agent.js',
        restartPolicyType: 'always'
      }
    };

    fs.writeFileSync(
      path.join(serviceDir, 'railway.toml'),
      this.tomlStringify(railwayConfig)
    );

    return serviceDir;
  }

  tomlStringify(obj) {
    let toml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        toml += `[${key}]\n`;
        for (const [subKey, subValue] of Object.entries(value)) {
          if (typeof subValue === 'string') {
            toml += `${subKey} = "${subValue}"\n`;
          } else {
            toml += `${subKey} = ${subValue}\n`;
          }
        }
        toml += '\n';
      }
    }
    
    return toml;
  }

  async deployToRailway(serviceDir) {
    try {
      this.log('Deploying Self-Healing Agent to Railway...');
      
      // Change to service directory
      process.chdir(serviceDir);
      
      // Initialize Railway project (if needed)
      try {
        await execPromise('railway link', {
          env: { 
            ...process.env, 
            RAILWAY_TOKEN: this.railwayToken,
            RAILWAY_PROJECT_ID: this.projectId
          }
        });
        this.log('Railway project linked');
      } catch (error) {
        this.log('Railway already linked or link failed, continuing...', 'WARN');
      }

      // Set environment variables
      const envVars = {
        NODE_ENV: 'production',
        AUTO_FIX_ENABLED: 'true',
        AUTO_DEPLOY_ENABLED: 'true',
        SECURITY_SCAN_ENABLED: 'true',
        PERFORMANCE_MONITORING: 'true',
        HEALTH_CHECK_INTERVAL: '600000',
        DEEP_SCAN_INTERVAL: '3600000',
        CIRCUIT_BREAKER_FAILURE_THRESHOLD: '5',
        CIRCUIT_BREAKER_RECOVERY_TIMEOUT: '60000',
        LOG_LEVEL: 'info',
        RAILWAY_DEVELOPMENT_URL: 'https://daring-reflection-development.up.railway.app',
        RAILWAY_TESTING_URL: 'https://sentia-manufacturing-dashboard-testing.up.railway.app',
        RAILWAY_PRODUCTION_URL: 'https://web-production-1f10.up.railway.app'
      };

      this.log('Setting environment variables...');
      for (const [key, value] of Object.entries(envVars)) {
        try {
          await execPromise(`railway variables set ${key}="${value}"`, {
            env: { 
              ...process.env, 
              RAILWAY_TOKEN: this.railwayToken 
            }
          });
          this.log(`Set ${key}=${value}`);
        } catch (error) {
          this.log(`Failed to set ${key}: ${error.message}`, 'WARN');
        }
      }

      // Deploy the service
      this.log('Deploying service to Railway...');
      const { stdout, stderr } = await execPromise('railway up', {
        env: { 
          ...process.env, 
          RAILWAY_TOKEN: this.railwayToken 
        },
        timeout: 300000 // 5 minute timeout
      });

      this.log('Deployment output:', 'INFO');
      console.log(stdout);
      if (stderr) {
        console.log('Deployment warnings:', stderr);
      }

      return true;
    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async getDeploymentInfo() {
    try {
      const { stdout } = await execPromise('railway status', {
        env: { 
          ...process.env, 
          RAILWAY_TOKEN: this.railwayToken 
        }
      });
      
      this.log('Railway Service Status:');
      console.log(stdout);
      
      return stdout;
    } catch (error) {
      this.log(`Failed to get deployment info: ${error.message}`, 'ERROR');
      return null;
    }
  }

  async start24x7Monitoring() {
    this.log('🚀 Starting Enterprise Self-Healing Agent v2.0 Deployment...');
    
    // Step 1: Check Railway authentication
    const isAuthenticated = await this.checkRailwayAuth();
    if (!isAuthenticated) {
      this.log('Please authenticate with Railway first:', 'ERROR');
      this.log('1. railway login', 'INFO');
      this.log('2. Set RAILWAY_TOKEN environment variable', 'INFO');
      return false;
    }

    // Step 2: Create service directory and files
    const serviceDir = await this.createServiceDirectory();
    
    // Step 3: Deploy to Railway
    const deployed = await this.deployToRailway(serviceDir);
    if (!deployed) {
      this.log('Deployment failed', 'ERROR');
      return false;
    }

    // Step 4: Get deployment information
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    const deploymentInfo = await this.getDeploymentInfo();
    
    if (deploymentInfo) {
      this.log('✅ Enterprise Self-Healing Agent v2.0 deployed successfully!', 'SUCCESS');
      this.log('🔄 24/7 monitoring is now active across all environments', 'SUCCESS');
      this.log('📊 The agent will validate mock data elimination every 10 minutes', 'INFO');
      this.log('🔧 Auto-recovery is enabled for service failures', 'INFO');
      this.log('📋 Check logs via: railway logs', 'INFO');
    }

    // Cleanup
    process.chdir('..');
    // fs.rmSync(serviceDir, { recursive: true, force: true });
    
    return true;
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new SelfHealingAgentDeployer();
  deployer.start24x7Monitoring()
    .then(success => {
      if (success) {
        console.log('\n🎉 Self-Healing Agent deployment completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Self-Healing Agent deployment failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Deployment error:', error.message);
      process.exit(1);
    });
}

export default SelfHealingAgentDeployer;