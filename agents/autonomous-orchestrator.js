#!/usr/bin/env node

/**
 * 24/7 Autonomous Agent Orchestrator
 * Continuously monitors, fixes, and deploys code across all branches
 * Auto-commits, pushes, and creates PRs every 5 minutes
 */

import { spawn, exec } from 'child_process';
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
    'dependency-update-agent.js',
    'test-automation-agent.js',
    'documentation-agent.js',
    'deployment-health-agent.js',
    'database-optimization-agent.js',
    'api-monitoring-agent.js',
    'ui-accessibility-agent.js'
  ],
  MAX_CONCURRENT_AGENTS: 3,
  AUTO_MERGE_CONFIDENCE_THRESHOLD: 0.95,
  RAILWAY_DEPLOYMENT: true,
  NIXPACKS_BUILD: true
};

// Agent Status Tracking
const agentStatus = new Map();
const agentMetrics = {
  totalRuns: 0,
  successfulFixes: 0,
  failedAttempts: 0,
  autoMerges: 0,
  prsCreated: 0,
  deploymentsTriggered: 0
};

class AutonomousOrchestrator {
  constructor() {
    this.isRunning = false;
    this.currentCycle = 0;
    this.activeAgents = new Set();
    this.branchQueue = [...CONFIG.BRANCHES];
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🚀 Initializing 24/7 Autonomous Agent Orchestrator...');
    
    // Verify Git configuration
    await this.verifyGitConfig();
    
    // Check Railway/Nixpacks setup
    await this.verifyDeploymentConfig();
    
    // Initialize agent modules
    await this.loadAgents();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    console.log('✅ Orchestrator initialized successfully');
  }

  async verifyGitConfig() {
    try {
      await execAsync('git config user.name');
      await execAsync('git config user.email');
    } catch (_error) {
      // Configure git if not set
      await execAsync('git config user.name "Autonomous Agent"');
      await execAsync('git config user.email "agent@sentia-manufacturing.ai"');
    }
  }

  async verifyDeploymentConfig() {
    if (CONFIG.RAILWAY_DEPLOYMENT) {
      try {
        const { stdout } = await execAsync('railway --version');
        console.log(`📦 Railway CLI detected: ${stdout.trim()}`);
      } catch (error) {
        console.warn('⚠️ Railway CLI not found. Deployment features limited.');
      }
    }
  }

  async loadAgents() {
    for (const agentFile of CONFIG.AGENTS) {
      const agentPath = path.join(__dirname, agentFile);
      agentStatus.set(agentFile, {
        loaded: false,
        lastRun: null,
        errors: 0,
        fixes: 0
      });
      
      try {
        await fs.access(agentPath);
        agentStatus.get(agentFile).loaded = true;
      } catch (error) {
        console.warn(`⚠️ Agent not found: ${agentFile}`);
      }
    }
  }

  startHealthMonitoring() {
    setInterval(() => {
      this.reportHealth();
    }, 60000); // Report every minute
  }

  reportHealth() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const health = {
      uptime,
      currentCycle: this.currentCycle,
      activeAgents: this.activeAgents.size,
      metrics: agentMetrics,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Health Report:', JSON.stringify(health, null, 2));
  }

  async start() {
    this.isRunning = true;
    console.log('🎯 Starting continuous autonomous operation...');
    
    while (this.isRunning) {
      try {
        await this.runCycle();
        await this.sleep(CONFIG.CYCLE_INTERVAL);
      } catch (error) {
        console.error('❌ Cycle error:', error.message);
        await this.handleCycleError(error);
      }
    }
  }

  async runCycle() {
    this.currentCycle++;
    console.log(`\n🔄 Starting Cycle #${this.currentCycle} - ${new Date().toISOString()}`);
    
    for (const branch of CONFIG.BRANCHES) {
      console.log(`\n📌 Processing branch: ${branch}`);
      
      try {
        // Switch to branch
        await this.switchBranch(branch);
        
        // Pull latest changes
        await this.pullLatestChanges(branch);
        
        // Run agents concurrently with limit
        const fixes = await this.runAgentsForBranch(branch);
        
        // If fixes were made, commit and push
        if (fixes.length > 0) {
          await this.commitAndPushFixes(branch, fixes);
          
          // Create PR if not on production
          if (branch !== 'production') {
            await this.createAutoPR(branch, fixes);
          }
        }
        
        // Check for auto-merge opportunities
        await this.checkAutoMerge(branch);
        
        // Trigger deployment if needed
        await this.triggerDeployment(branch);
        
      } catch (error) {
        console.error(`❌ Error processing branch ${branch}:`, error.message);
      }
    }
    
    // Cleanup and optimization
    await this.performCycleCleanup();
  }

  async switchBranch(branch) {
    try {
      await execAsync(`git checkout ${branch}`);
      console.log(`✅ Switched to branch: ${branch}`);
    } catch (error) {
      // Try to create branch if it doesn't exist
      try {
        await execAsync(`git checkout -b ${branch} origin/${branch}`);
      } catch (createError) {
        // Branch exists locally but not checked out properly
        await execAsync(`git checkout ${branch} --force`);
      }
    }
  }

  async pullLatestChanges(branch) {
    try {
      const { stdout } = await execAsync(`git pull origin ${branch}`);
      if (!stdout.includes('Already up to date')) {
        console.log(`📥 Pulled latest changes for ${branch}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not pull latest for ${branch}: ${error.message}`);
    }
  }

  async runAgentsForBranch(branch) {
    const fixes = [];
    const agents = CONFIG.AGENTS.filter(a => agentStatus.get(a)?.loaded);
    
    // Run agents in batches
    for (let i = 0; i < agents.length; i += CONFIG.MAX_CONCURRENT_AGENTS) {
      const batch = agents.slice(i, i + CONFIG.MAX_CONCURRENT_AGENTS);
      const batchResults = await Promise.all(
        batch.map(agent => this.runAgent(agent, branch))
      );
      
      fixes.push(...batchResults.filter(Boolean));
    }
    
    return fixes;
  }

  async runAgent(agentFile, branch) {
    const agentName = path.basename(agentFile, '.js');
    console.log(`🤖 Running ${agentName} on ${branch}...`);
    
    this.activeAgents.add(agentName);
    const status = agentStatus.get(agentFile);
    
    try {
      const agentPath = path.join(__dirname, agentFile);
      const result = await this.executeAgent(agentPath, branch);
      
      if (result.fixApplied) {
        status.fixes++;
        agentMetrics.successfulFixes++;
        console.log(`✅ ${agentName} applied fix: ${result.description}`);
        return {
          agent: agentName,
          description: result.description,
          files: result.files || [],
          confidence: result.confidence || 0.8
        };
      }
      
      status.lastRun = Date.now();
      return null;
      
    } catch (error) {
      status.errors++;
      agentMetrics.failedAttempts++;
      console.error(`❌ ${agentName} error: ${error.message}`);
      return null;
    } finally {
      this.activeAgents.delete(agentName);
    }
  }

  async executeAgent(agentPath, branch) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [agentPath, branch], {
        cwd: path.dirname(__dirname),
        env: { ...process.env, AGENT_MODE: 'autonomous', BRANCH: branch }
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch {
            resolve({ fixApplied: false });
          }
        } else {
          reject(new Error(error || 'Agent execution failed'));
        }
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        child.kill();
        reject(new Error('Agent timeout'));
      }, 120000);
    });
  }

  async commitAndPushFixes(branch, fixes) {
    try {
      // Stage all changes
      await execAsync('git add -A');
      
      // Check if there are changes to commit
      const { stdout } = await execAsync('git status --porcelain');
      if (!stdout.trim()) {
        console.log('📝 No changes to commit');
        return;
      }
      
      // Generate commit message
      const commitMessage = this.generateCommitMessage(fixes);
      
      // Commit changes
      await execAsync(`git commit -m "${commitMessage}"`);
      console.log(`✅ Committed ${fixes.length} fixes`);
      
      // Push to remote
      await execAsync(`git push origin ${branch}`);
      console.log(`📤 Pushed to ${branch}`);
      
      agentMetrics.successfulFixes += fixes.length;
      
    } catch (error) {
      console.error(`❌ Commit/push error: ${error.message}`);
    }
  }

  generateCommitMessage(fixes) {
    const summary = fixes.map(f => f.agent).join(', ');
    const details = fixes.map(f => `- ${f.agent}: ${f.description}`).join('\\n');
    
    return `🤖 Auto-fix by ${fixes.length} agents [Cycle #${this.currentCycle}]\\n\\n${details}\\n\\nAutonomous Agent System v2.0`;
  }

  async createAutoPR(branch, fixes) {
    try {
      const targetBranch = branch === 'development' ? 'test' : 'production';
      const prTitle = `🤖 Autonomous Fixes: ${branch} → ${targetBranch} [Cycle #${this.currentCycle}]`;
      
      const prBody = this.generatePRBody(fixes);
      
      const { stdout } = await execAsync(
        `gh pr create --base ${targetBranch} --head ${branch} --title "${prTitle}" --body "${prBody}"`
      );
      
      console.log(`✅ Created PR: ${stdout.trim()}`);
      agentMetrics.prsCreated++;
      
    } catch (error) {
      // PR might already exist
      if (!error.message.includes('already exists')) {
        console.error(`❌ PR creation error: ${error.message}`);
      }
    }
  }

  generatePRBody(fixes) {
    const confidence = fixes.reduce((acc, f) => acc + (f.confidence || 0.8), 0) / fixes.length;
    
    return `## 🤖 Autonomous Agent Fixes

**Cycle**: #${this.currentCycle}
**Timestamp**: ${new Date().toISOString()}
**Confidence**: ${(confidence * 100).toFixed(1)}%
**Auto-merge eligible**: ${confidence >= CONFIG.AUTO_MERGE_CONFIDENCE_THRESHOLD ? 'Yes ✅' : 'No ⏸️'}

### Fixes Applied:
${fixes.map(f => `- **${f.agent}**: ${f.description}`).join('\\n')}

### Affected Files:
${[...new Set(fixes.flatMap(f => f.files || []))].map(f => `- ${f}`).join('\\n')}

### Metrics:
- Total fixes: ${fixes.length}
- Success rate: ${((agentMetrics.successfulFixes / (agentMetrics.successfulFixes + agentMetrics.failedAttempts)) * 100).toFixed(1)}%
- Uptime: ${Math.floor((Date.now() - this.startTime) / 1000 / 60)} minutes

---
*Generated by Autonomous Agent System v2.0*`;
  }

  async checkAutoMerge(branch) {
    if (branch === 'production') return;
    
    try {
      // Check open PRs for auto-merge eligibility
      const { stdout } = await execAsync(`gh pr list --head ${branch} --json number,title,mergeable`);
      const prs = JSON.parse(stdout);
      
      for (const pr of prs) {
        if (pr.mergeable === 'MERGEABLE') {
          // Check confidence threshold
          const confidence = await this.calculatePRConfidence(pr.number);
          
          if (confidence >= CONFIG.AUTO_MERGE_CONFIDENCE_THRESHOLD) {
            await execAsync(`gh pr merge ${pr.number} --auto --merge`);
            console.log(`✅ Auto-merged PR #${pr.number}`);
            agentMetrics.autoMerges++;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Auto-merge check error: ${error.message}`);
    }
  }

  async calculatePRConfidence(prNumber) {
    // Simplified confidence calculation
    // In production, this would analyze test results, code coverage, etc.
    return 0.85;
  }

  async triggerDeployment(branch) {
    if (!CONFIG.RAILWAY_DEPLOYMENT) return;
    
    try {
      if (branch === 'production' || branch === 'test') {
        const { stdout } = await execAsync(`railway up --service ${branch}`);
        console.log(`🚀 Triggered Railway deployment for ${branch}`);
        agentMetrics.deploymentsTriggered++;
      }
    } catch (error) {
      console.warn(`⚠️ Deployment trigger failed: ${error.message}`);
    }
  }

  async performCycleCleanup() {
    // Clean up old logs
    const logsDir = path.join(__dirname, 'logs');
    try {
      const logs = await fs.readdir(logsDir);
      const oldLogs = logs.filter(log => {
        const stats = fs.stat(path.join(logsDir, log));
        return Date.now() - stats.mtime > 7 * 24 * 60 * 60 * 1000; // 7 days
      });
      
      for (const log of oldLogs) {
        await fs.unlink(path.join(logsDir, log));
      }
    } catch (error) {
      // Logs directory might not exist
    }
    
    // Git maintenance
    if (this.currentCycle % 10 === 0) {
      await execAsync('git gc --auto');
      console.log('🧹 Performed git garbage collection');
    }
  }

  async handleCycleError(error) {
    console.error('🔧 Attempting self-recovery...');
    
    try {
      // Reset to clean state
      await execAsync('git reset --hard');
      await execAsync('git clean -fd');
      
      // Return to development branch
      await execAsync('git checkout development');
      await execAsync('git pull origin development');
      
      console.log('✅ Self-recovery successful');
    } catch (recoveryError) {
      console.error('❌ Self-recovery failed:', recoveryError.message);
      // Continue anyway - the system must keep running
    }
    
    // Wait before retrying
    await this.sleep(30000);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('🛑 Stopping orchestrator...');
    this.isRunning = false;
    
    // Wait for active agents to complete
    while (this.activeAgents.size > 0) {
      console.log(`⏳ Waiting for ${this.activeAgents.size} agents to complete...`);
      await this.sleep(5000);
    }
    
    console.log('✅ Orchestrator stopped');
    this.reportHealth();
  }
}

// Signal handlers for graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📛 Received SIGINT, shutting down gracefully...');
  if (orchestrator) {
    await orchestrator.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n📛 Received SIGTERM, shutting down gracefully...');
  if (orchestrator) {
    await orchestrator.stop();
  }
  process.exit(0);
});

// Main execution
let orchestrator;

async function main() {
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
  
  orchestrator = new AutonomousOrchestrator();
  await orchestrator.initialize();
  await orchestrator.start();
}

// Start the system
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});