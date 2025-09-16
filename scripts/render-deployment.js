#!/usr/bin/env node

/**
 * Enterprise Render Deployment Script
 * Handles deployment to Render platform across all environments
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RenderDeployment {
  constructor() {
    this.environments = {
      development: {
        name: 'sentia-manufacturing-development',
        branch: 'development',
        url: 'https://sentia-manufacturing-development.onrender.com',
        envFile: '.env.development'
      },
      testing: {
        name: 'sentia-manufacturing-testing',
        branch: 'test',
        url: 'https://sentia-manufacturing-testing.onrender.com',
        envFile: '.env.testing'
      },
      production: {
        name: 'sentia-manufacturing-production',
        branch: 'production',
        url: 'https://sentia-manufacturing-production.onrender.com',
        envFile: '.env.production'
      }
    };

    this.requiredEnvVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'CLERK_SECRET_KEY',
      'VITE_CLERK_PUBLISHABLE_KEY',
      'REDIS_URL'
    ];
  }

  /**
   * Main deployment function
   */
  async deploy(environment, options = {}) {
    console.log(`Starting deployment to ${environment}...`);

    try {
      // Validate environment
      if (!this.environments[environment]) {
        throw new Error(`Invalid environment: ${environment}`);
      }

      const env = this.environments[environment];

      // Pre-deployment checks
      await this.preDeploymentChecks(environment);

      // Run tests if not skipped
      if (!options.skipTests) {
        await this.runTests();
      }

      // Build application
      await this.buildApplication();

      // Validate build
      await this.validateBuild();

      // Check environment variables
      await this.checkEnvironmentVariables(environment);

      // Deploy to Render
      await this.deployToRender(env);

      // Post-deployment verification
      await this.postDeploymentVerification(env);

      // Run database migrations
      if (!options.skipMigrations) {
        await this.runMigrations(environment);
      }

      // Health check
      await this.healthCheck(env.url);

      console.log(`Deployment to ${environment} completed successfully!`);
      console.log(`Application URL: ${env.url}`);

      return true;
    } catch (error) {
      console.error(`Deployment failed: ${error.message}`);

      // Rollback if needed
      if (options.autoRollback) {
        await this.rollback(environment);
      }

      throw error;
    }
  }

  /**
   * Pre-deployment checks
   */
  async preDeploymentChecks(environment) {
    console.log('Running pre-deployment checks...');

    // Check Git status
    const gitStatus = execSync('git status --porcelain').toString();
    if (gitStatus && environment === 'production') {
      throw new Error('Uncommitted changes detected. Commit or stash changes before deploying to production.');
    }

    // Check current branch
    const currentBranch = execSync('git branch --show-current').toString().trim();
    const expectedBranch = this.environments[environment].branch;

    if (currentBranch !== expectedBranch && environment === 'production') {
      throw new Error(`Must be on ${expectedBranch} branch to deploy to ${environment}`);
    }

    // Check Node version
    const nodeVersion = process.version;
    const requiredVersion = '18.0.0';
    if (nodeVersion < `v${requiredVersion}`) {
      throw new Error(`Node.js ${requiredVersion} or higher required. Current: ${nodeVersion}`);
    }

    console.log('Pre-deployment checks passed');
  }

  /**
   * Run tests
   */
  async runTests() {
    console.log('Running tests...');

    try {
      execSync('npm run test:run', { stdio: 'inherit' });
      console.log('Tests passed');
    } catch (error) {
      throw new Error('Tests failed. Fix failing tests before deployment.');
    }
  }

  /**
   * Build application
   */
  async buildApplication() {
    console.log('Building application...');

    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('Build completed');
    } catch (error) {
      throw new Error('Build failed. Check build errors and try again.');
    }
  }

  /**
   * Validate build
   */
  async validateBuild() {
    console.log('Validating build...');

    const distPath = path.join(__dirname, '..', 'dist');

    try {
      const stats = await fs.stat(distPath);
      if (!stats.isDirectory()) {
        throw new Error('Build directory not found');
      }

      // Check critical files
      const criticalFiles = [
        'index.html',
        'assets'
      ];

      for (const file of criticalFiles) {
        const filePath = path.join(distPath, file);
        try {
          await fs.access(filePath);
        } catch {
          throw new Error(`Critical file missing: ${file}`);
        }
      }

      // Check bundle size
      const indexPath = path.join(distPath, 'index.html');
      const indexContent = await fs.readFile(indexPath, 'utf8');
      const jsFiles = indexContent.match(/src="\/assets\/[^"]+\.js"/g) || [];

      let totalSize = 0;
      for (const jsFile of jsFiles) {
        const fileName = jsFile.match(/assets\/([^"]+)/)[1];
        const filePath = path.join(distPath, 'assets', fileName);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      const maxSize = 2 * 1024 * 1024; // 2MB
      if (totalSize > maxSize) {
        console.warn(`Warning: Bundle size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds recommended maximum`);
      }

      console.log('Build validation passed');
    } catch (error) {
      throw new Error(`Build validation failed: ${error.message}`);
    }
  }

  /**
   * Check environment variables
   */
  async checkEnvironmentVariables(environment) {
    console.log('Checking environment variables...');

    const envFile = this.environments[environment].envFile;
    const envPath = path.join(__dirname, '..', envFile);

    try {
      const envContent = await fs.readFile(envPath, 'utf8');
      const envVars = {};

      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });

      // Check required variables
      const missing = [];
      for (const varName of this.requiredEnvVars) {
        if (!envVars[varName]) {
          missing.push(varName);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }

      console.log('Environment variables verified');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Environment file not found: ${envFile}`);
      }
      throw error;
    }
  }

  /**
   * Deploy to Render
   */
  async deployToRender(env) {
    console.log(`Deploying to Render (${env.name})...`);

    try {
      // Push to Git branch
      console.log(`Pushing to ${env.branch} branch...`);
      execSync(`git push origin ${env.branch}`, { stdio: 'inherit' });

      console.log('Deployment triggered on Render');
      console.log('Waiting for deployment to complete...');

      // Render auto-deploys from Git push
      // Wait for deployment to complete
      await this.waitForDeployment(env.url, 300); // 5 minutes timeout

      console.log('Deployment successful');
    } catch (error) {
      throw new Error(`Render deployment failed: ${error.message}`);
    }
  }

  /**
   * Wait for deployment to complete
   */
  async waitForDeployment(url, timeoutSeconds) {
    const startTime = Date.now();
    const timeout = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`${url}/api/health`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'healthy') {
            return true;
          }
        }
      } catch {
        // Service not ready yet
      }

      // Wait 10 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    throw new Error('Deployment timeout - service did not become healthy');
  }

  /**
   * Post-deployment verification
   */
  async postDeploymentVerification(env) {
    console.log('Running post-deployment verification...');

    const checks = [
      { name: 'Homepage', path: '/' },
      { name: 'API Health', path: '/api/health' },
      { name: 'Dashboard', path: '/dashboard' }
    ];

    for (const check of checks) {
      try {
        const response = await fetch(`${env.url}${check.path}`);
        if (!response.ok && check.name !== 'Dashboard') { // Dashboard requires auth
          throw new Error(`${check.name} returned ${response.status}`);
        }
        console.log(`  ${check.name}: OK`);
      } catch (error) {
        throw new Error(`Post-deployment check failed for ${check.name}: ${error.message}`);
      }
    }

    console.log('Post-deployment verification passed');
  }

  /**
   * Run database migrations
   */
  async runMigrations(environment) {
    console.log('Running database migrations...');

    try {
      execSync(`NODE_ENV=${environment} npm run db:migrate:deploy`, {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: environment }
      });
      console.log('Migrations completed');
    } catch (error) {
      console.warn('Migration failed - may need manual intervention');
    }
  }

  /**
   * Health check
   */
  async healthCheck(url) {
    console.log('Performing health check...');

    try {
      const response = await fetch(`${url}/api/health`);
      const data = await response.json();

      if (data.status !== 'healthy') {
        throw new Error('Health check failed');
      }

      console.log('Health check passed');
      console.log('Service details:', data);
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Rollback deployment
   */
  async rollback(environment) {
    console.log(`Rolling back ${environment} deployment...`);

    try {
      // Get previous commit
      const previousCommit = execSync('git rev-parse HEAD~1').toString().trim();

      // Reset to previous commit
      execSync(`git reset --hard ${previousCommit}`);

      // Force push to trigger rollback
      const branch = this.environments[environment].branch;
      execSync(`git push --force origin ${branch}`);

      console.log('Rollback initiated');
    } catch (error) {
      console.error(`Rollback failed: ${error.message}`);
    }
  }
}

// CLI execution
if (import.meta.url === `file://${__filename}`) {
  const deployment = new RenderDeployment();

  const args = process.argv.slice(2);
  const environment = args[0] || 'development';

  const options = {
    skipTests: args.includes('--skip-tests'),
    skipMigrations: args.includes('--skip-migrations'),
    autoRollback: args.includes('--auto-rollback')
  };

  deployment.deploy(environment, options)
    .then(() => {
      console.log('Deployment completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Deployment failed:', error.message);
      process.exit(1);
    });
}

export default RenderDeployment;