#!/usr/bin/env node

/**
 * Railway 3-Branch Deployment Script
 * Automated deployment script for development, testing, and production environments
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const environments = {
  development: {
    branch: 'development',
    domain: 'dev.sentia-manufacturing.railway.app',
    nodeEnv: 'development',
    port: 3000
  },
  testing: {
    branch: 'testing', 
    domain: 'test.sentia-manufacturing.railway.app',
    nodeEnv: 'test',
    port: 3000
  },
  production: {
    branch: 'production',
    domain: 'sentia-manufacturing.railway.app', 
    nodeEnv: 'production',
    port: 3000
  }
};

class RailwayDeployer {
  constructor() {
    this.currentEnv = null;
    this.railwayProject = null;
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check if Railway CLI is installed
    try {
      execSync('railway --version', { stdio: 'pipe' });
      console.log('✅ Railway CLI is installed');
    } catch (error) {
      console.error('❌ Railway CLI not found. Installing...');
      execSync('npm install -g @railway/cli', { stdio: 'inherit' });
    }

    // Check if logged in to Railway
    try {
      const result = execSync('railway whoami', { stdio: 'pipe' });
      console.log('✅ Logged in to Railway:', result.toString().trim());
    } catch (error) {
      console.error('❌ Not logged in to Railway. Please run: railway login');
      process.exit(1);
    }

    // Check if project is linked
    try {
      const result = execSync('railway status', { stdio: 'pipe' });
      this.railwayProject = result.toString().trim();
      console.log('✅ Railway project linked:', this.railwayProject);
    } catch (error) {
      console.error('❌ No Railway project linked. Please run: railway link');
      process.exit(1);
    }
  }

  async setEnvironmentVariables(env) {
    console.log(`🔧 Setting environment variables for ${env.branch}...`);
    
    const envVars = {
      NODE_ENV: env.nodeEnv,
      PORT: env.port.toString(),
      VITE_CLERK_PUBLISHABLE_KEY: this.getClerkKey(env.branch, 'publishable'),
      CLERK_SECRET_KEY: this.getClerkKey(env.branch, 'secret'),
      DATABASE_URL: this.getDatabaseUrl(env.branch),
      CORS_ORIGINS: `https://${env.domain}`,
      UNLEASHED_API_ID: process.env.UNLEASHED_API_ID || 'd5313df6-db35-430c-a69e-ae27dffe0c5a',
      UNLEASHED_API_KEY: process.env.UNLEASHED_API_KEY || '2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=='
    };

    for (const [key, value] of Object.entries(envVars)) {
      try {
        execSync(`railway variables set ${key}="${value}"`, { stdio: 'pipe' });
        console.log(`  ✅ Set ${key}`);
      } catch (error) {
        console.error(`  ❌ Failed to set ${key}:`, error.message);
      }
    }
  }

  getClerkKey(branch, type) {
    // Use environment-specific keys or fallback to test keys
    const key = process.env[`CLERK_${type.toUpperCase()}_KEY_${branch.toUpperCase()}`] || 
                process.env[`CLERK_${type.toUpperCase()}_KEY`] ||
                this.getDefaultClerkKey(type);
    
    if (!key) {
      console.warn(`⚠️  No Clerk ${type} key found for ${branch}. Using default.`);
      return this.getDefaultClerkKey(type);
    }
    
    return key;
  }

  getDefaultClerkKey(type) {
    const keys = {
      publishable: 'pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk',
      secret: 'sk_test_VAYZffZP043cqbgUJQgAPmCTziMcZVbfTPfXUIKlrx'
    };
    return keys[type];
  }

  getDatabaseUrl(branch) {
    const dbUrl = process.env[`DATABASE_URL_${branch.toUpperCase()}`] || 
                  process.env.DATABASE_URL ||
                  'postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
    
    return dbUrl;
  }

  async buildProject() {
    console.log('🔨 Building project...');
    
    try {
      // Install dependencies
      execSync('npm ci --prefer-offline --no-audit', { stdio: 'inherit' });
      
      // Build the project
      execSync('npm run build', { stdio: 'inherit' });
      
      console.log('✅ Build completed successfully');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  async deployToRailway(env) {
    console.log(`🚀 Deploying to ${env.branch} environment...`);
    
    try {
      // Switch to the appropriate branch
      execSync(`git checkout ${env.branch}`, { stdio: 'inherit' });
      
      // Pull latest changes
      execSync('git pull origin ' + env.branch, { stdio: 'inherit' });
      
      // Deploy to Railway
      execSync('railway up', { stdio: 'inherit' });
      
      console.log(`✅ Successfully deployed to ${env.domain}`);
    } catch (error) {
      console.error(`❌ Deployment to ${env.branch} failed:`, error.message);
      throw error;
    }
  }

  async verifyDeployment(env) {
    console.log(`🔍 Verifying deployment for ${env.branch}...`);
    
    const healthUrl = `https://${env.domain}/health`;
    const maxRetries = 10;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(healthUrl);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Health check passed for ${env.domain}`);
          console.log(`   Status: ${data.status}`);
          console.log(`   Environment: ${data.environment}`);
          return true;
        }
      } catch (error) {
        console.log(`⏳ Waiting for deployment... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        retries++;
      }
    }
    
    console.error(`❌ Health check failed for ${env.domain} after ${maxRetries} attempts`);
    return false;
  }

  async deployEnvironment(envName) {
    const env = environments[envName];
    if (!env) {
      throw new Error(`Unknown environment: ${envName}`);
    }

    console.log(`\n🚀 Starting deployment for ${envName.toUpperCase()} environment`);
    console.log(`   Branch: ${env.branch}`);
    console.log(`   Domain: ${env.domain}`);
    console.log(`   Node Environment: ${env.nodeEnv}`);

    try {
      // Set environment variables
      await this.setEnvironmentVariables(env);
      
      // Build project
      await this.buildProject();
      
      // Deploy to Railway
      await this.deployToRailway(env);
      
      // Verify deployment
      const verified = await this.verifyDeployment(env);
      
      if (verified) {
        console.log(`\n🎉 ${envName.toUpperCase()} deployment successful!`);
        console.log(`   URL: https://${env.domain}`);
        console.log(`   Health: https://${env.domain}/health`);
      } else {
        throw new Error(`Deployment verification failed for ${envName}`);
      }
      
    } catch (error) {
      console.error(`\n❌ ${envName.toUpperCase()} deployment failed:`, error.message);
      throw error;
    }
  }

  async deployAll() {
    console.log('🚀 Starting 3-branch Railway deployment...\n');
    
    await this.checkPrerequisites();
    
    const results = {};
    
    for (const envName of Object.keys(environments)) {
      try {
        await this.deployEnvironment(envName);
        results[envName] = 'success';
      } catch (error) {
        results[envName] = 'failed';
        console.error(`Failed to deploy ${envName}:`, error.message);
      }
    }
    
    // Print summary
    console.log('\n📊 Deployment Summary:');
    console.log('====================');
    for (const [env, status] of Object.entries(results)) {
      const emoji = status === 'success' ? '✅' : '❌';
      const domain = environments[env].domain;
      console.log(`${emoji} ${env.toUpperCase()}: https://${domain}`);
    }
    
    const successCount = Object.values(results).filter(s => s === 'success').length;
    const totalCount = Object.keys(results).length;
    
    if (successCount === totalCount) {
      console.log('\n🎉 All deployments successful!');
    } else {
      console.log(`\n⚠️  ${successCount}/${totalCount} deployments successful`);
      process.exit(1);
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const deployer = new RailwayDeployer();

if (args.length === 0) {
  // Deploy all environments
  deployer.deployAll().catch(console.error);
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
Railway 3-Branch Deployment Script

Usage:
  node scripts/railway-deploy.js                    # Deploy all environments
  node scripts/railway-deploy.js development       # Deploy development only
  node scripts/railway-deploy.js testing           # Deploy testing only  
  node scripts/railway-deploy.js production        # Deploy production only

Environments:
  development  - dev.sentia-manufacturing.railway.app
  testing      - test.sentia-manufacturing.railway.app
  production   - sentia-manufacturing.railway.app

Prerequisites:
  - Railway CLI installed and logged in
  - Git repository with development, testing, production branches
  - Environment variables set in Railway dashboard
  `);
} else {
  // Deploy specific environment
  const envName = args[0];
  deployer.checkPrerequisites()
    .then(() => deployer.deployEnvironment(envName))
    .catch(console.error);
}
