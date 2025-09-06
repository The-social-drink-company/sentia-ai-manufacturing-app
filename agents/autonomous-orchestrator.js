#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  CYCLE_INTERVAL: 5 * 60 * 1000, // 5 minutes
  BRANCHES: ['development', 'test', 'production'],
  AGENTS: [
    'code-quality-agent.js',
    'security-audit-agent.js',
    'performance-optimization-agent.js',
    'deployment-health-agent.js',
    'dependency-update-agent.js',
    'test-automation-agent.js',
    'documentation-agent.js',
    'database-optimization-agent.js',
    'api-monitoring-agent.js',
    'ui-accessibility-agent.js'
  ],
  MAX_CONCURRENT_AGENTS: 3,
  AUTO_MERGE_CONFIDENCE_THRESHOLD: 0.95,
  RAILWAY_DEPLOYMENT: true,
  NIXPACKS_BUILD: true,
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000
};

// Metrics tracking
const metrics = {
  totalRuns: 0,
  successfulFixes: 0,
  failedAttempts: 0,
  autoMerges: 0,
  prsCreated: 0,
  deploymentsTriggered: 0,
  startTime: Date.now()
};

// Active agents tracking
const activeAgents = new Set();

class AutonomousOrchestrator {
  constructor() {
    this.currentCycle = 0;
    this.isRunning = false;
    this.currentBranch = null;
  }

  async initialize() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🤖 24/7 AUTONOMOUS AGENT ORCHESTRATOR v2.0 🤖           ║
║                                                              ║
║     Continuous Integration & Deployment System              ║
║     Auto-commits every 5 minutes across all branches        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    console.log('🚀 Initializing 24/7 Autonomous Agent Orchestrator...');

    // Check Railway CLI
    try {
      const { stdout } = await execAsync('railway --version');
      console.log(`📦 Railway CLI detected: ${stdout.trim()}`);
    } catch (error) {
      console.log('⚠️ Railway CLI not found. Deployment features will be limited.');
    }

    // Ensure agents directory exists
    await fs.mkdir(path.join(__dirname), { recursive: true });

    console.log('✅ Orchestrator initialized successfully');
    console.log('🎯 Starting continuous autonomous operation...');
  }

  async runAgent(agentFile, branch) {
    const agentPath = path.join(__dirname, agentFile);
    
    // Check if agent file exists
    try {
      await fs.access(agentPath);
    } catch (error) {
      console.error(`❌ Agent file not found: ${agentPath}`);
      metrics.failedAttempts++;
      return null;
    }

    return new Promise((resolve) => {
      console.log(`🤖 Running ${agentFile} on ${branch}...`);
      activeAgents.add(agentFile);

      // Use dynamic import for ES modules with file:// URL on Windows
      const importPath = process.platform === 'win32' 
        ? `file:///${agentPath.replace(/\\/g, '/')}`
        : agentPath;
      
      import(importPath)
        .then(async (module) => {
          try {
            if (module.default && typeof module.default.run === 'function') {
              const result = await module.default.run(branch);
              metrics.successfulFixes++;
              activeAgents.delete(agentFile);
              resolve(result);
            } else {
              console.error(`❌ ${agentFile} does not export a valid run function`);
              metrics.failedAttempts++;
              activeAgents.delete(agentFile);
              resolve(null);
            }
          } catch (error) {
            console.error(`❌ ${agentFile} execution error:`, error.message);
            metrics.failedAttempts++;
            activeAgents.delete(agentFile);
            resolve(null);
          }
        })
        .catch((error) => {
          console.error(`❌ ${agentFile} import error:`, error.message);
          metrics.failedAttempts++;
          activeAgents.delete(agentFile);
          resolve(null);
        });
    });
  }

  async switchBranch(branch) {
    try {
      // First, stash any changes
      await execAsync('git stash');
      
      // Check if branch exists locally
      const { stdout: branches } = await execAsync('git branch');
      if (branches.includes(branch)) {
        await execAsync(`git checkout ${branch}`);
      } else {
        // Create branch from remote
        await execAsync(`git checkout -b ${branch} origin/${branch}`);
      }
      
      // Pull latest changes
      await execAsync(`git pull origin ${branch}`);
      
      this.currentBranch = branch;
      console.log(`✅ Switched to branch: ${branch}`);
      return true;
    } catch (error) {
      console.error(`❌ Error switching to branch ${branch}:`, error.message);
      return false;
    }
  }

  async commitAndPush(branch, changes) {
    if (!changes || changes.length === 0) return false;

    try {
      const timestamp = new Date().toISOString();
      const commitMessage = `🤖 Automated fixes - ${branch} - ${timestamp}\\n\\nChanges:\\n${changes.join('\\n')}`;
      
      await execAsync('git add -A');
      await execAsync(`git commit -m "${commitMessage}"`);
      await execAsync(`git push origin ${branch}`);
      
      console.log(`✅ Changes committed and pushed to ${branch}`);
      return true;
    } catch (error) {
      console.error(`❌ Error committing changes:`, error.message);
      return false;
    }
  }

  async createPullRequest(sourceBranch, targetBranch, changes) {
    try {
      const title = `🤖 Automated PR: ${sourceBranch} → ${targetBranch}`;
      const body = `## Automated Changes\\n\\n${changes.join('\\n')}\\n\\n*Generated by 24/7 Autonomous Agent System*`;
      
      const { stdout } = await execAsync(
        `gh pr create --title "${title}" --body "${body}" --base ${targetBranch} --head ${sourceBranch}`
      );
      
      console.log(`✅ Pull request created: ${stdout.trim()}`);
      metrics.prsCreated++;
      return stdout.trim();
    } catch (error) {
      console.error(`❌ Error creating PR:`, error.message);
      return null;
    }
  }

  async triggerRailwayDeployment(branch) {
    if (!CONFIG.RAILWAY_DEPLOYMENT) return;

    try {
      const serviceName = branch === 'production' ? 'production' : 
                         branch === 'test' ? 'test' : 'development';
      
      await execAsync(`railway up --service ${serviceName}`);
      console.log(`✅ Railway deployment triggered for ${branch}`);
      metrics.deploymentsTriggered++;
    } catch (error) {
      console.warn(`⚠️ Deployment trigger failed:`, error.message);
    }
  }

  async runCycle() {
    this.currentCycle++;
    console.log(`\\n🔄 Starting Cycle #${this.currentCycle} - ${new Date().toISOString()}`);

    for (const branch of CONFIG.BRANCHES) {
      console.log(`\\n📌 Processing branch: ${branch}`);
      
      if (!await this.switchBranch(branch)) {
        continue;
      }

      const changes = [];
      const agentPromises = [];

      // Run agents with concurrency limit
      for (let i = 0; i < CONFIG.AGENTS.length; i += CONFIG.MAX_CONCURRENT_AGENTS) {
        const batch = CONFIG.AGENTS.slice(i, i + CONFIG.MAX_CONCURRENT_AGENTS);
        const batchPromises = batch.map(agent => this.runAgent(agent, branch));
        const results = await Promise.all(batchPromises);
        
        results.forEach((result, index) => {
          if (result && result.changes) {
            changes.push(...result.changes);
          }
        });
      }

      // Commit and push if there are changes
      if (changes.length > 0) {
        await this.commitAndPush(branch, changes);
        
        // Create PR if not on production
        if (branch === 'development') {
          await this.createPullRequest(branch, 'test', changes);
        } else if (branch === 'test') {
          await this.createPullRequest(branch, 'production', changes);
        }
        
        // Trigger deployment
        await this.triggerRailwayDeployment(branch);
      }
    }

    console.log(`\\n✅ Cycle #${this.currentCycle} completed`);
    metrics.totalRuns++;
  }

  async healthCheck() {
    const uptime = Date.now() - metrics.startTime;
    const report = {
      uptime: Math.floor(uptime / 1000),
      currentCycle: this.currentCycle,
      activeAgents: activeAgents.size,
      metrics: { ...metrics },
      timestamp: new Date().toISOString()
    };
    
    console.log(`📊 Health Report:`, JSON.stringify(report, null, 2));
    
    // Write to health file
    await fs.writeFile(
      path.join(__dirname, 'health.json'),
      JSON.stringify(report, null, 2)
    );
  }

  async start() {
    await this.initialize();
    this.isRunning = true;

    // Start health monitoring
    const healthInterval = setInterval(() => {
      this.healthCheck();
    }, CONFIG.HEALTH_CHECK_INTERVAL);

    // Main execution loop
    while (this.isRunning) {
      try {
        await this.runCycle();
        
        // Wait for next cycle
        console.log(`⏳ Waiting ${CONFIG.CYCLE_INTERVAL / 1000} seconds for next cycle...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.CYCLE_INTERVAL));
      } catch (error) {
        console.error('❌ Critical error in main loop:', error);
        metrics.failedAttempts++;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      }
    }

    clearInterval(healthInterval);
  }

  stop() {
    console.log('🛑 Stopping orchestrator...');
    this.isRunning = false;
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\\n📌 Received SIGINT, shutting down gracefully...');
  orchestrator.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n📌 Received SIGTERM, shutting down gracefully...');
  orchestrator.stop();
  process.exit(0);
});

// Start the orchestrator
const orchestrator = new AutonomousOrchestrator();
orchestrator.start().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});