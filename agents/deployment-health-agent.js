#!/usr/bin/env node

/**
 * Deployment Health Agent
 * Monitors Railway deployments and ensures health across all environments
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

class DeploymentHealthAgent {
  constructor() {
    this.branch = process.env.BRANCH || 'development';
    this.fixesApplied = [];
    this.deploymentUrls = {
      development: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
      test: 'https://sentia-manufacturing-dashboard-test.up.railway.app',
      production: 'https://sentia-manufacturing-dashboard-production.up.railway.app'
    };
  }

  async run() {
    console.log(`🚀 Deployment Health Agent monitoring ${this.branch}...`);
    
    const issues = await this.detectDeploymentIssues();
    
    if (issues.length > 0) {
      await this.applyDeploymentFixes(issues);
      return this.generateReport();
    }
    
    return { fixApplied: false };
  }

  async detectDeploymentIssues() {
    const issues = [];
    
    // Check Railway deployment status
    try {
      const { stdout } = await execAsync('railway status 2>&1 || true');
      
      if (stdout.includes('No service linked')) {
        issues.push({
          type: 'railway-not-linked',
          fixable: true
        });
      } else if (stdout.includes('Deploy failed')) {
        issues.push({
          type: 'deployment-failed',
          fixable: true
        });
      }
    } catch (error) {
      // Railway CLI might not be installed
      console.warn('Railway CLI check failed:', error.message);
    }
    
    // Check application health endpoints
    for (const [env, url] of Object.entries(this.deploymentUrls)) {
      try {
        const response = await fetch(`${url}/api/health`, {
          timeout: 10000
        });
        
        if (!response.ok) {
          issues.push({
            type: 'unhealthy-endpoint',
            environment: env,
            statusCode: response.status,
            fixable: true
          });
        }
      } catch (error) {
        issues.push({
          type: 'unreachable-deployment',
          environment: env,
          error: error.message,
          fixable: true
        });
      }
    }
    
    // Check for missing environment variables
    try {
      const requiredEnvVars = [
        'VITE_CLERK_PUBLISHABLE_KEY',
        'DATABASE_URL',
        'NODE_ENV'
      ];
      
      const envContent = await fs.readFile('.env', 'utf-8').catch(() => '');
      const missingVars = requiredEnvVars.filter(v => !envContent.includes(v));
      
      if (missingVars.length > 0) {
        issues.push({
          type: 'missing-env-vars',
          variables: missingVars,
          fixable: true
        });
      }
    } catch {
      // .env file might not exist
    }
    
    // Check Nixpacks configuration
    try {
      await fs.access('nixpacks.toml');
    } catch {
      issues.push({
        type: 'missing-nixpacks-config',
        fixable: true
      });
    }
    
    // Check build artifacts
    try {
      const { stdout } = await execAsync('ls -la dist/ 2>/dev/null | wc -l');
      const fileCount = parseInt(stdout.trim()) || 0;
      
      if (fileCount < 5) {
        issues.push({
          type: 'missing-build-artifacts',
          fixable: true
        });
      }
    } catch {
      issues.push({
        type: 'missing-build-artifacts',
        fixable: true
      });
    }
    
    return issues;
  }

  async applyDeploymentFixes(issues) {
    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'railway-not-linked':
            await this.linkRailwayService();
            break;
            
          case 'deployment-failed':
            await this.retriggerDeployment();
            break;
            
          case 'unhealthy-endpoint':
          case 'unreachable-deployment':
            await this.fixHealthEndpoint(issue);
            break;
            
          case 'missing-env-vars':
            await this.createEnvTemplate(issue);
            break;
            
          case 'missing-nixpacks-config':
            await this.createNixpacksConfig();
            break;
            
          case 'missing-build-artifacts':
            await this.rebuildApplication();
            break;
        }
      } catch (error) {
        console.error(`Failed to fix ${issue.type}: ${error.message}`);
      }
    }
  }

  async linkRailwayService() {
    try {
      // Attempt to link Railway service
      await execAsync(`railway link --service ${this.branch}`);
      this.fixesApplied.push({
        type: 'Railway service link',
        description: `Linked Railway service for ${this.branch}`,
        files: []
      });
    } catch (error) {
      console.error('Failed to link Railway service:', error.message);
    }
  }

  async retriggerDeployment() {
    try {
      // Trigger new deployment
      await execAsync('railway up');
      this.fixesApplied.push({
        type: 'Deployment trigger',
        description: 'Retriggered Railway deployment',
        files: []
      });
    } catch (error) {
      console.error('Failed to trigger deployment:', error.message);
    }
  }

  async fixHealthEndpoint(issue) {
    try {
      // Create or fix health endpoint
      const healthRoute = `
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});`;

      const serverFile = 'server.js';
      const content = await fs.readFile(serverFile, 'utf-8');
      
      if (!content.includes('/health')) {
        const updated = content.replace(
          "app.use('/api'",
          healthRoute + "\n\napp.use('/api'"
        );
        
        await fs.writeFile(serverFile, updated);
        this.fixesApplied.push({
          type: 'Health endpoint',
          description: 'Added health check endpoint',
          files: [serverFile]
        });
      }
    } catch (error) {
      console.error('Failed to fix health endpoint:', error.message);
    }
  }

  async createEnvTemplate(issue) {
    try {
      const envTemplate = `# Sentia Manufacturing Dashboard Environment Variables

# Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
${this.branch === 'development' ? 'DEV_DATABASE_URL=postgresql://user:password@host:5432/dev_database' : ''}
${this.branch === 'test' ? 'TEST_DATABASE_URL=postgresql://user:password@host:5432/test_database' : ''}

# Application
NODE_ENV=${this.branch === 'production' ? 'production' : 'development'}
PORT=3000
VITE_API_BASE_URL=${this.deploymentUrls[this.branch]}/api

# Redis (optional)
REDIS_URL=redis://localhost:6379

# API Keys (optional)
AMAZON_SP_API_KEY=
SHOPIFY_API_KEY=
UNLEASHED_API_KEY=
`;

      await fs.writeFile('.env.template', envTemplate);
      this.fixesApplied.push({
        type: 'Environment template',
        description: 'Created environment variables template',
        files: ['.env.template']
      });
    } catch (error) {
      console.error('Failed to create env template:', error.message);
    }
  }

  async createNixpacksConfig() {
    try {
      const nixpacksConfig = `[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-9_x"]

[phases.install]
cmds = ["npm ci --legacy-peer-deps"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "${this.branch === 'production' ? 'production' : 'development'}"
NPM_CONFIG_PRODUCTION = "false"

[staticAssets]
"dist" = "dist"
`;

      await fs.writeFile('nixpacks.toml', nixpacksConfig);
      this.fixesApplied.push({
        type: 'Nixpacks configuration',
        description: 'Created Nixpacks build configuration for Railway',
        files: ['nixpacks.toml']
      });
    } catch (error) {
      console.error('Failed to create Nixpacks config:', error.message);
    }
  }

  async rebuildApplication() {
    try {
      // Run build
      await execAsync('npm run build');
      this.fixesApplied.push({
        type: 'Application rebuild',
        description: 'Rebuilt application artifacts',
        files: ['dist/']
      });
    } catch (error) {
      console.error('Failed to rebuild application:', error.message);
    }
  }

  generateReport() {
    const confidence = this.calculateConfidence();
    
    return {
      fixApplied: this.fixesApplied.length > 0,
      description: `Applied ${this.fixesApplied.length} deployment fixes`,
      files: [...new Set(this.fixesApplied.flatMap(f => f.files))],
      confidence,
      details: this.fixesApplied
    };
  }

  calculateConfidence() {
    let totalConfidence = 0;
    let count = 0;
    
    for (const fix of this.fixesApplied) {
      switch (fix.type) {
        case 'Railway service link':
        case 'Deployment trigger':
          totalConfidence += 0.85;
          break;
        case 'Health endpoint':
          totalConfidence += 0.95;
          break;
        case 'Environment template':
        case 'Nixpacks configuration':
          totalConfidence += 0.90;
          break;
        case 'Application rebuild':
          totalConfidence += 0.88;
          break;
        default:
          totalConfidence += 0.80;
      }
      count++;
    }
    
    return count > 0 ? totalConfidence / count : 0;
  }
}

// Main execution
async function main() {
  const agent = new DeploymentHealthAgent();
  const result = await agent.run();
  
  // Output JSON result for orchestrator
  console.log(JSON.stringify(result));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});