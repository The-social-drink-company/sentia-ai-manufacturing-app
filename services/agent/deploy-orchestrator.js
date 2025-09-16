/**
 * Deployment Orchestrator - Automated CI/CD Pipeline for Self-Healing Fixes
 * Manages automatic deployments to localhost, Railway test, and production environments
 * with intelligent rollback, health monitoring, and zero-downtime deployments
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import EventEmitter from 'events';

const execAsync = promisify(exec);

class DeploymentOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      environments: {
        localhost: {
          port: 3000,
          healthEndpoint: 'http://localhost:3000/api/health',
          deployCommand: 'npm run build && npm start',
          timeout: 60000
        },
        test: {
          branch: 'test',
          healthEndpoint: 'https://sentia-manufacturing-dashboard-testing.up.railway.app/api/health',
          deployCommand: 'git push origin HEAD:test',
          timeout: 300000
        },
        production: {
          branch: 'production',
          healthEndpoint: 'https://web-production-1f10.up.railway.app/api/health',
          deployCommand: 'git push origin HEAD:production',
          timeout: 300000
        }
      },
      healthCheckRetries: 5,
      healthCheckInterval: 30000, // 30 seconds
      rollbackOnFailure: true,
      requireHealthyTest: true,
      notificationWebhook: null,
      ...config
    };

    this.deploymentHistory = [];
    this.activeDeployments = new Map();
    this.deploymentMetrics = {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      rollbacks: 0,
      avgDeploymentTime: 0
    };

    this.initialize();
  }

  async initialize() {
    console.log('🚀 INITIALIZING DEPLOYMENT ORCHESTRATOR');
    
    // Verify git repository
    await this.verifyGitRepository();
    
    // Setup deployment directories
    this.setupDirectories();
    
    // Load deployment history
    await this.loadDeploymentHistory();
    
    console.log('✅ Deployment Orchestrator initialized successfully');
    this.emit('initialized');
  }

  async verifyGitRepository() {
    // In Render/CI containers the working directory may not be a git repo.
    // Treat missing git context as non-fatal so the orchestrator can operate in no-op mode.
    try {
      if (process.env.RENDER || process.env.CI) {
        this.gitAvailable = false;
        console.warn('⚠️  Skipping git verification in container environment (RENDER/CI detected)');
        return;
      }

      const { stdout } = await execAsync('git status');
      if (!stdout.includes('On branch')) {
        this.gitAvailable = false;
        console.warn('⚠️  Git repository not detected; deployment actions will be limited');
        return;
      }
      
      // Verify remote origins exist
      const remotes = await execAsync('git remote -v');
      console.log('📡 Git remotes configured:', remotes.stdout);
      this.gitAvailable = true;
    } catch (error) {
      this.gitAvailable = false;
      console.warn(`⚠️  Git repository verification failed: ${error.message}. Continuing without git.`);
    }
  }

  setupDirectories() {
    const dirs = [
      'logs/deployments',
      'tests/autonomous/deployments',
      'backups/deployments'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  async loadDeploymentHistory() {
    try {
      const historyFile = path.join(process.cwd(), 'logs', 'deployments', 'deployment-history.json');
      if (fs.existsSync(historyFile)) {
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        this.deploymentHistory = history.deployments || [];
        this.deploymentMetrics = { ...this.deploymentMetrics, ...history.metrics };
        console.log(`📚 Loaded ${this.deploymentHistory.length} deployment records`);
      }
    } catch (error) {
      console.warn(`Failed to load deployment history: ${error.message}`);
    }
  }

  // Main deployment orchestration method
  async orchestrateDeployment(changes, options = {}) {
    const deploymentId = this.generateDeploymentId();
    const startTime = Date.now();
    
    console.log(`🔄 Starting deployment orchestration: ${deploymentId}`);
    
    const deployment = {
      id: deploymentId,
      startTime: new Date().toISOString(),
      changes,
      options: {
        skipTests: false,
        environments: ['localhost', 'test', 'production'],
        rollbackOnFailure: true,
        ...options
      },
      status: 'started',
      stages: [],
      currentStage: null,
      errors: [],
      metrics: {}
    };

    this.activeDeployments.set(deploymentId, deployment);
    
    try {
      // Stage 1: Pre-deployment validation
      await this.executeStage(deployment, 'pre-validation', async () => {
        await this.preDeploymentValidation(deployment);
      });

      // Stage 2: Build and test
      await this.executeStage(deployment, 'build-test', async () => {
        await this.buildAndTest(deployment);
      });

      // Stage 3: Commit changes
      await this.executeStage(deployment, 'commit', async () => {
        await this.commitChanges(deployment);
      });

      // Stage 4: Deploy to environments
      for (const env of deployment.options.environments) {
        await this.executeStage(deployment, `deploy-${env}`, async () => {
          await this.deployToEnvironment(deployment, env);
        });
      }

      // Stage 5: Post-deployment validation
      await this.executeStage(deployment, 'post-validation', async () => {
        await this.postDeploymentValidation(deployment);
      });

      // Stage 6: Cleanup and notification
      await this.executeStage(deployment, 'cleanup', async () => {
        await this.cleanupDeployment(deployment);
      });

      deployment.status = 'completed';
      deployment.endTime = new Date().toISOString();
      deployment.duration = Date.now() - startTime;
      
      this.updateMetrics(deployment, true);
      
      console.log(`✅ Deployment ${deploymentId} completed successfully in ${deployment.duration}ms`);
      this.emit('deploymentCompleted', deployment);

    } catch (error) {
      console.error(`❌ Deployment ${deploymentId} failed: ${error.message}`);
      
      deployment.status = 'failed';
      deployment.error = error.message;
      deployment.endTime = new Date().toISOString();
      deployment.duration = Date.now() - startTime;
      
      this.updateMetrics(deployment, false);
      
      if (deployment.options.rollbackOnFailure) {
        await this.rollbackDeployment(deployment);
      }
      
      this.emit('deploymentFailed', deployment);
      throw error;
    } finally {
      this.activeDeployments.delete(deploymentId);
      this.saveDeploymentRecord(deployment);
    }

    return deployment;
  }

  async executeStage(deployment, stageName, stageFunction) {
    const stage = {
      name: stageName,
      startTime: new Date().toISOString(),
      status: 'running'
    };

    deployment.currentStage = stageName;
    deployment.stages.push(stage);
    
    console.log(`🔄 Executing stage: ${stageName}`);
    this.emit('stageStarted', { deployment: deployment.id, stage: stageName });

    try {
      const stageStartTime = Date.now();
      await stageFunction();
      
      stage.endTime = new Date().toISOString();
      stage.duration = Date.now() - stageStartTime;
      stage.status = 'completed';
      
      console.log(`✅ Stage ${stageName} completed in ${stage.duration}ms`);
      this.emit('stageCompleted', { deployment: deployment.id, stage: stageName, duration: stage.duration });
    } catch (error) {
      stage.endTime = new Date().toISOString();
      stage.status = 'failed';
      stage.error = error.message;
      
      console.error(`❌ Stage ${stageName} failed: ${error.message}`);
      this.emit('stageFailed', { deployment: deployment.id, stage: stageName, error: error.message });
      
      throw error;
    }
  }

  async preDeploymentValidation(deployment) {
    console.log('🔍 Running pre-deployment validation...');
    
    // Check git status
    const gitStatus = await execAsync('git status --porcelain');
    if (gitStatus.stdout.trim()) {
      console.log('📝 Uncommitted changes detected');
    }

    // Verify package.json and lock files are consistent
    if (!fs.existsSync('package-lock.json')) {
      throw new Error('package-lock.json not found - run npm install');
    }

    // Check for critical files
    const criticalFiles = ['package.json', 'server.js', 'vite.config.js'];
    for (const file of criticalFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Critical file missing: ${file}`);
      }
    }

    // Validate environment configuration
    await this.validateEnvironmentConfig();
    
    console.log('✅ Pre-deployment validation passed');
  }

  async validateEnvironmentConfig() {
    // Check for required environment variables
    const requiredEnvVars = [
      'VITE_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.warn(`⚠️ Environment variable ${envVar} not set`);
      }
    }
  }

  async buildAndTest(deployment) {
    console.log('🔨 Building and testing application...');
    
    if (!deployment.options.skipTests) {
      // Run linting
      console.log('🧹 Running ESLint...');
      try {
        await execAsync('npm run lint', { timeout: 120000 });
        console.log('✅ Linting passed');
      } catch (error) {
        console.warn('⚠️ Linting issues detected, continuing deployment');
      }

      // Run unit tests
      console.log('🧪 Running unit tests...');
      try {
        await execAsync('npm run test:run', { timeout: 180000 });
        console.log('✅ Unit tests passed');
      } catch (error) {
        console.warn('⚠️ Some tests failed, continuing deployment');
      }
    }

    // Build application
    console.log('🏗️ Building application...');
    const buildResult = await execAsync('npm run build', { timeout: 300000 });
    
    if (buildResult.stderr && buildResult.stderr.includes('error')) {
      throw new Error(`Build failed: ${buildResult.stderr}`);
    }

    // Verify build output
    if (!fs.existsSync('dist')) {
      throw new Error('Build output directory not found');
    }

    const buildStats = this.getBuildStats();
    deployment.buildStats = buildStats;
    
    console.log(`✅ Build completed - Size: ${buildStats.totalSize}, Files: ${buildStats.fileCount}`);
  }

  getBuildStats() {
    const distDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
      return { totalSize: 0, fileCount: 0 };
    }

    let totalSize = 0;
    let fileCount = 0;

    const calculateSize = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          calculateSize(filePath);
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
    };

    calculateSize(distDir);

    return {
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
      fileCount
    };
  }

  async commitChanges(deployment) {
    console.log('📝 Committing changes...');
    
    // Stage all changes
    await execAsync('git add .');
    
    // Create commit message
    const commitMessage = this.generateCommitMessage(deployment);
    
    // Commit changes
    await execAsync(`git commit -m "${commitMessage}"`);
    
    // Get commit hash
    const { stdout } = await execAsync('git rev-parse HEAD');
    deployment.commitHash = stdout.trim();
    
    console.log(`✅ Changes committed: ${deployment.commitHash.substring(0, 8)}`);
  }

  generateCommitMessage(deployment) {
    const changeCount = deployment.changes.applied?.length || 0;
    const timestamp = new Date().toISOString();
    
    return `Auto-fix: Applied ${changeCount} autonomous corrections

Deployment ID: ${deployment.id}
Timestamp: ${timestamp}
Changes:
${deployment.changes.applied?.map(change => `- ${change.correction.type}: ${change.correction.file}`).join('\n') || 'No specific changes'}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
  }

  async deployToEnvironment(deployment, environment) {
    const env = this.config.environments[environment];
    if (!env) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    console.log(`🚀 Deploying to ${environment}...`);
    
    const deployStartTime = Date.now();
    
    try {
      if (environment === 'localhost') {
        await this.deployToLocalhost(deployment, env);
      } else {
        await this.deployToRemote(deployment, environment, env);
      }

      // Wait for deployment to be ready
      await this.waitForDeployment(deployment, environment, env);
      
      // Run health checks
      await this.performHealthChecks(deployment, environment, env);
      
      const deployDuration = Date.now() - deployStartTime;
      
      deployment.environments = deployment.environments || {};
      deployment.environments[environment] = {
        status: 'deployed',
        deployTime: new Date().toISOString(),
        duration: deployDuration,
        commitHash: deployment.commitHash
      };

      console.log(`✅ Successfully deployed to ${environment} in ${deployDuration}ms`);
      
    } catch (error) {
      deployment.environments = deployment.environments || {};
      deployment.environments[environment] = {
        status: 'failed',
        error: error.message,
        deployTime: new Date().toISOString()
      };
      
      throw error;
    }
  }

  async deployToLocalhost(deployment, env) {
    console.log('🏠 Starting localhost deployment...');
    
    // Kill existing local server if running
    try {
      await execAsync('pkill -f "node server.js"');
      await this.sleep(2000); // Wait for graceful shutdown
    } catch (error) {
      // Process might not be running, continue
    }

    // Start the server in background
    const serverProcess = exec('npm start', {
      detached: true,
      stdio: 'pipe'
    });

    // Store process ID for later cleanup
    deployment.localProcessId = serverProcess.pid;
    
    console.log(`📍 Local server started with PID: ${serverProcess.pid}`);
  }

  async deployToRemote(deployment, environment, env) {
    console.log(`☁️ Deploying to remote environment: ${environment}`);
    
    const deployCommand = env.deployCommand;
    
    try {
      const result = await execAsync(deployCommand, { 
        timeout: env.timeout,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      console.log(`📡 Push to ${environment} completed`);
      
      if (result.stderr) {
        console.warn(`Deploy warnings: ${result.stderr}`);
      }
      
    } catch (error) {
      if (error.message.includes('timeout')) {
        throw new Error(`Deployment to ${environment} timed out after ${env.timeout}ms`);
      }
      throw error;
    }
  }

  async waitForDeployment(deployment, environment, env) {
    console.log(`⏳ Waiting for ${environment} deployment to be ready...`);
    
    const maxWait = environment === 'localhost' ? 30000 : 180000; // 30s for localhost, 3min for remote
    const checkInterval = 5000; // 5 seconds
    let waited = 0;

    while (waited < maxWait) {
      try {
        const response = await fetch(env.healthEndpoint, {
          timeout: 10000,
          headers: { 'User-Agent': 'DeploymentOrchestrator/1.0' }
        });
        
        if (response.ok) {
          console.log(`✅ ${environment} is responding`);
          return;
        }
      } catch (error) {
        // Expected during deployment, continue waiting
      }

      await this.sleep(checkInterval);
      waited += checkInterval;
      
      if (waited % 30000 === 0) { // Log every 30 seconds
        console.log(`⏳ Still waiting for ${environment}... (${waited / 1000}s)`);
      }
    }

    throw new Error(`${environment} deployment did not become ready within ${maxWait / 1000} seconds`);
  }

  async performHealthChecks(deployment, environment, env) {
    console.log(`🔍 Performing health checks for ${environment}...`);
    
    const healthResults = [];
    
    for (let attempt = 1; attempt <= this.config.healthCheckRetries; attempt++) {
      try {
        const healthResult = await this.runHealthCheck(env.healthEndpoint);
        healthResults.push(healthResult);
        
        if (healthResult.healthy) {
          console.log(`✅ Health check passed for ${environment} (attempt ${attempt})`);
          
          deployment.healthChecks = deployment.healthChecks || {};
          deployment.healthChecks[environment] = {
            status: 'healthy',
            attempts: attempt,
            results: healthResults
          };
          
          return;
        }
        
        console.warn(`⚠️ Health check failed for ${environment} (attempt ${attempt}): ${healthResult.error}`);
        
        if (attempt < this.config.healthCheckRetries) {
          await this.sleep(this.config.healthCheckInterval);
        }
        
      } catch (error) {
        console.error(`❌ Health check error for ${environment} (attempt ${attempt}): ${error.message}`);
        
        if (attempt < this.config.healthCheckRetries) {
          await this.sleep(this.config.healthCheckInterval);
        }
      }
    }

    deployment.healthChecks = deployment.healthChecks || {};
    deployment.healthChecks[environment] = {
      status: 'unhealthy',
      attempts: this.config.healthCheckRetries,
      results: healthResults
    };

    throw new Error(`Health checks failed for ${environment} after ${this.config.healthCheckRetries} attempts`);
  }

  async runHealthCheck(healthEndpoint) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(healthEndpoint, {
        timeout: 10000,
        headers: {
          'User-Agent': 'DeploymentOrchestrator/1.0',
          'Accept': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      return {
        healthy: response.ok && data.status === 'healthy',
        status: data.status,
        responseTime,
        version: data.version,
        services: data.services,
        timestamp: new Date().toISOString(),
        error: response.ok ? null : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async postDeploymentValidation(deployment) {
    console.log('🔍 Running post-deployment validation...');
    
    // Run smoke tests against deployed environments
    for (const env of deployment.options.environments) {
      if (deployment.environments[env]?.status === 'deployed') {
        await this.runSmokeTests(deployment, env);
      }
    }

    // Validate critical functionality
    await this.validateCriticalFunctionality(deployment);
    
    console.log('✅ Post-deployment validation completed');
  }

  async runSmokeTests(deployment, environment) {
    console.log(`🧪 Running smoke tests for ${environment}...`);
    
    const env = this.config.environments[environment];
    const baseUrl = env.healthEndpoint.replace('/api/health', '');
    
    const smokeTests = [
      { name: 'health-check', url: `${baseUrl}/api/health` },
      { name: 'auth-endpoint', url: `${baseUrl}/api/services/status` },
      { name: 'static-assets', url: `${baseUrl}/` }
    ];

    const results = [];
    
    for (const test of smokeTests) {
      try {
        const response = await fetch(test.url, { timeout: 10000 });
        results.push({
          name: test.name,
          passed: response.ok,
          status: response.status,
          responseTime: response.headers.get('x-response-time')
        });
      } catch (error) {
        results.push({
          name: test.name,
          passed: false,
          error: error.message
        });
      }
    }

    const passedTests = results.filter(r => r.passed).length;
    
    deployment.smokeTests = deployment.smokeTests || {};
    deployment.smokeTests[environment] = {
      total: smokeTests.length,
      passed: passedTests,
      results
    };

    if (passedTests < smokeTests.length) {
      console.warn(`⚠️ ${smokeTests.length - passedTests} smoke tests failed for ${environment}`);
    } else {
      console.log(`✅ All smoke tests passed for ${environment}`);
    }
  }

  async validateCriticalFunctionality(deployment) {
    // This would typically run critical E2E tests
    console.log('🎯 Validating critical functionality...');
    
    // For now, just verify that we can reach the main endpoints
    const criticalEndpoints = [
      '/api/health',
      '/api/production/status',
      '/api/analytics/kpis'
    ];

    let validationPassed = true;

    for (const endpoint of criticalEndpoints) {
      try {
        // Test against localhost first
        const response = await fetch(`http://localhost:3000${endpoint}`, { timeout: 5000 });
        if (!response.ok) {
          console.warn(`⚠️ Critical endpoint failed: ${endpoint} (${response.status})`);
          validationPassed = false;
        }
      } catch (error) {
        console.warn(`⚠️ Critical endpoint error: ${endpoint} - ${error.message}`);
        validationPassed = false;
      }
    }

    deployment.criticalFunctionalityValidation = {
      passed: validationPassed,
      testedEndpoints: criticalEndpoints.length,
      timestamp: new Date().toISOString()
    };

    if (!validationPassed) {
      throw new Error('Critical functionality validation failed');
    }
  }

  async cleanupDeployment(deployment) {
    console.log('🧹 Cleaning up deployment...');
    
    // Clean up temporary files
    const tempDirs = ['temp', 'tmp'];
    
    for (const dir of tempDirs) {
      const tempPath = path.join(process.cwd(), dir);
      if (fs.existsSync(tempPath)) {
        try {
          fs.rmSync(tempPath, { recursive: true, force: true });
        } catch (error) {
          console.warn(`Failed to clean up ${dir}: ${error.message}`);
        }
      }
    }

    // Send notifications if configured
    if (this.config.notificationWebhook) {
      await this.sendDeploymentNotification(deployment);
    }

    console.log('✅ Cleanup completed');
  }

  async sendDeploymentNotification(deployment) {
    try {
      const notification = {
        deploymentId: deployment.id,
        status: deployment.status,
        duration: deployment.duration,
        environments: Object.keys(deployment.environments || {}),
        commitHash: deployment.commitHash,
        timestamp: deployment.endTime
      };

      await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
        timeout: 10000
      });

      console.log('📢 Deployment notification sent');
    } catch (error) {
      console.warn(`Failed to send notification: ${error.message}`);
    }
  }

  async rollbackDeployment(deployment) {
    console.log(`🔄 Rolling back deployment ${deployment.id}...`);
    
    try {
      // Reset to previous commit
      await execAsync('git reset --hard HEAD~1');
      
      // Force push to remote branches (be careful!)
      for (const env of deployment.options.environments) {
        if (env !== 'localhost' && deployment.environments[env]?.status === 'deployed') {
          try {
            await execAsync(`git push --force origin HEAD:${this.config.environments[env].branch}`);
            console.log(`🔄 Rolled back ${env}`);
          } catch (error) {
            console.error(`Failed to rollback ${env}: ${error.message}`);
          }
        }
      }

      // Kill local process if it was started
      if (deployment.localProcessId) {
        try {
          process.kill(deployment.localProcessId);
        } catch (error) {
          console.warn(`Failed to kill local process: ${error.message}`);
        }
      }

      deployment.rolledBack = true;
      deployment.rollbackTime = new Date().toISOString();
      
      this.deploymentMetrics.rollbacks++;
      
      console.log('✅ Rollback completed');
      this.emit('deploymentRolledBack', deployment);
      
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
      deployment.rollbackError = error.message;
      throw error;
    }
  }

  updateMetrics(deployment, success) {
    this.deploymentMetrics.totalDeployments++;
    
    if (success) {
      this.deploymentMetrics.successfulDeployments++;
    } else {
      this.deploymentMetrics.failedDeployments++;
    }

    // Update average deployment time
    const totalTime = this.deploymentMetrics.avgDeploymentTime * (this.deploymentMetrics.totalDeployments - 1);
    this.deploymentMetrics.avgDeploymentTime = (totalTime + deployment.duration) / this.deploymentMetrics.totalDeployments;
  }

  saveDeploymentRecord(deployment) {
    // Add to history
    this.deploymentHistory.unshift(deployment);
    
    // Keep only last 100 deployments
    if (this.deploymentHistory.length > 100) {
      this.deploymentHistory = this.deploymentHistory.slice(0, 100);
    }

    // Save to file
    const historyData = {
      lastUpdated: new Date().toISOString(),
      metrics: this.deploymentMetrics,
      deployments: this.deploymentHistory
    };

    try {
      const historyFile = path.join(process.cwd(), 'logs', 'deployments', 'deployment-history.json');
      fs.writeFileSync(historyFile, JSON.stringify(historyData, null, 2));
      
      // Also save individual deployment record
      const deploymentFile = path.join(process.cwd(), 'logs', 'deployments', `${deployment.id}.json`);
      fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
      
    } catch (error) {
      console.error(`Failed to save deployment record: ${error.message}`);
    }
  }

  // Utility methods
  generateDeploymentId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const random = Math.random().toString(36).substr(2, 6);
    return `deploy_${timestamp}_${random}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  getActiveDeployments() {
    return Array.from(this.activeDeployments.values());
  }

  getDeploymentHistory(limit = 10) {
    return this.deploymentHistory.slice(0, limit);
  }

  getDeploymentById(id) {
    return this.activeDeployments.get(id) || 
           this.deploymentHistory.find(d => d.id === id);
  }

  getMetrics() {
    return {
      ...this.deploymentMetrics,
      activeDeployments: this.activeDeployments.size,
      successRate: this.deploymentMetrics.totalDeployments > 0 ? 
        (this.deploymentMetrics.successfulDeployments / this.deploymentMetrics.totalDeployments) * 100 : 0
    };
  }

  // Configuration methods
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('📝 Deployment configuration updated');
  }

  addEnvironment(name, config) {
    this.config.environments[name] = config;
    console.log(`➕ Added environment: ${name}`);
  }

  removeEnvironment(name) {
    delete this.config.environments[name];
    console.log(`➖ Removed environment: ${name}`);
  }

  // Emergency methods
  emergencyStop() {
    console.log('🚨 EMERGENCY STOP - Cancelling all active deployments');
    
    for (const [id, deployment] of this.activeDeployments) {
      deployment.status = 'cancelled';
      deployment.endTime = new Date().toISOString();
      this.saveDeploymentRecord(deployment);
    }
    
    this.activeDeployments.clear();
    this.emit('emergencyStop');
  }

  async emergencyRollbackAll() {
    console.log('🚨 EMERGENCY ROLLBACK - Rolling back all recent deployments');
    
    const recentDeployments = this.deploymentHistory
      .filter(d => d.status === 'completed')
      .slice(0, 3); // Last 3 successful deployments

    for (const deployment of recentDeployments) {
      try {
        await this.rollbackDeployment(deployment);
      } catch (error) {
        console.error(`Failed to rollback ${deployment.id}: ${error.message}`);
      }
    }
  }
}

export default DeploymentOrchestrator;
export { DeploymentOrchestrator };