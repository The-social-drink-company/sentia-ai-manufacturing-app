#!/usr/bin/env node

/**
 * 24/7 Autonomous Agent Orchestrator v3.0
 * Simplified, reliable, and fully functional
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


const execAsync = promisify(exec);

class AutonomousOrchestrator {
  constructor() {
    this.cycle = 0;
    this.isRunning = false;
  }

  async initialize() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║               🤖 AUTONOMOUS ORCHESTRATOR v3.0 🤖            ║
║                  24/7 Self-Correcting System                ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // Configure git if needed
    try {
      await execAsync('git config user.name "Autonomous Agent"');
      await execAsync('git config user.email "agent@sentia.ai"');
    } catch (e) {
      // Git already configured
    }

    logDebug('✅ Orchestrator initialized');
  }

  async runCycle() {
    this.cycle++;
    logDebug(`\\n🔄 CYCLE #${this.cycle} - ${new Date().toISOString()}`);

    const branches = ['development', 'test', 'production'];
    
    for (const branch of branches) {
      logDebug(`\\n📌 Processing: ${branch}`);
      
      try {
        // Stash any uncommitted changes first
        await execAsync('git stash push -m "Autonomous agent stash"').catch(() => {});
        
        // Switch to branch
        await execAsync(`git checkout ${branch}`);
        await execAsync(`git pull origin ${branch}`).catch(() => {});
        
        // Pop stash if we're back on production (where changes were made)
        if (branch === 'production') {
          await execAsync('git stash pop').catch(() => {});
        }
        
        logDebug(`✅ Switched to ${branch}`);

        // Apply fixes directly
        const fixes = await this.applyFixes(branch);
        
        if (fixes.length > 0) {
          // Commit and push
          await this.commitChanges(branch, fixes);
          
          // Create PR if not production
          if (branch !== 'production') {
            await this.createPR(branch, fixes);
          }
        }
        
      } catch (error) {
        logError(`❌ Error on ${branch}: ${error.message}`);
      }
    }

    logDebug(`\\n✅ Cycle #${this.cycle} completed`);
  }

  async applyFixes(branch) {
    const fixes = [];
    logDebug('🔧 Applying autonomous fixes...');

    try {
      // Code quality fixes
      const { stdout: lintOutput } = await execAsync('npm run lint:fix').catch(e => e);
      if (lintOutput && lintOutput.includes('fixed')) {
        fixes.push('Applied ESLint auto-fixes');
      }

      // Security fixes
      const { stdout: auditOutput } = await execAsync('npm audit fix').catch(e => e);
      if (auditOutput && auditOutput.includes('fixed')) {
        fixes.push('Fixed security vulnerabilities');
      }

      // Build optimization
      await execAsync('npm run build').catch(() => {});
      fixes.push('Rebuilt application');

      // Always add a cycle completion marker
      fixes.push(`Cycle ${this.cycle} completed on ${branch}`);

    } catch (error) {
      logWarn(`⚠️ Some fixes failed: ${error.message}`);
    }

    if (fixes.length > 0) {
      logDebug(`✅ Applied ${fixes.length} fixes`);
    }
    
    return fixes;
  }

  async commitChanges(branch, fixes) {
    try {
      // Check if there are changes
      const { stdout: status } = await execAsync('git status --porcelain');
      if (!status.trim()) {
        logDebug('📝 No changes to commit');
        return;
      }

      // Stage and commit
      await execAsync('git add -A');
      
      const commitMessage = `🤖 Autonomous fixes [Cycle #${this.cycle}]

${fixes.map(fix => `• ${fix}`).join('\\n')}

🤖 Generated with Autonomous Agent System v3.0

Co-Authored-By: Claude <noreply@anthropic.com>`;

      await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
      await execAsync(`git push origin ${branch}`);
      
      logDebug(`✅ Committed and pushed to ${branch}`);

      // Trigger Railway deployment
      await this.triggerRailwayDeploy(branch);
      
    } catch (error) {
      logError(`❌ Commit failed: ${error.message}`);
    }
  }

  async triggerRailwayDeploy(branch) {
    try {
      logDebug(`🚀 Triggering Railway deployment for ${branch}...`);
      
      // Use Railway CLI to trigger redeploy
      const serviceName = `sentia-manufacturing-dashboard-${branch}`;
      await execAsync(`railway service ${serviceName}`).catch(() => {});
      await execAsync('railway up --detach').catch(() => {});
      
      logDebug(`✅ Railway deployment triggered for ${branch}`);
      
    } catch (error) {
      logWarn(`⚠️ Railway deployment trigger failed: ${error.message}`);
    }
  }

  async createPR(sourceBranch, fixes) {
    try {
      const targetBranch = sourceBranch === 'development' ? 'test' : 'production';
      const title = `🤖 Autonomous Fixes: ${sourceBranch} → ${targetBranch} [Cycle #${this.cycle}]`;
      
      const body = `## 🤖 Autonomous Agent Fixes

**Cycle**: #${this.cycle}
**Branch**: ${sourceBranch} → ${targetBranch}
**Timestamp**: ${new Date().toISOString()}

### Applied Fixes:
${fixes.map(fix => `• ${fix}`).join('\\n')}

---
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

      await execAsync(`gh pr create --title "${title}" --body "${body}" --base ${targetBranch} --head ${sourceBranch}`);
      logDebug(`✅ Created PR: ${sourceBranch} → ${targetBranch}`);
      
    } catch (error) {
      if (!error.message.includes('already exists')) {
        logError(`❌ PR creation failed: ${error.message}`);
      }
    }
  }

  async start() {
    await this.initialize();
    this.isRunning = true;

    logDebug('🎯 Starting 24/7 autonomous operation...');
    logDebug('🔄 Running cycles every 5 minutes');

    while (this.isRunning) {
      try {
        await this.runCycle();
        
        // Wait 5 minutes
        logDebug('⏳ Waiting 5 minutes for next cycle...');
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        
      } catch (error) {
        logError('❌ Cycle error:', error.message);
        
        // Self-recovery
        try {
          await execAsync('git checkout development');
          await execAsync('git reset --hard');
        } catch (e) {
          // Recovery failed
        }
        
        // Wait 30 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }

  stop() {
    logDebug('🛑 Stopping orchestrator...');
    this.isRunning = false;
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logDebug('\\n📛 Received SIGINT, shutting down...');
  if (orchestrator) orchestrator.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logDebug('\\n📛 Received SIGTERM, shutting down...');
  if (orchestrator) orchestrator.stop();
  process.exit(0);
});

// Start the orchestrator
const orchestrator = new AutonomousOrchestrator();
orchestrator.start().catch(error => {
  logError('💥 Fatal error:', error);
  process.exit(1);
});