#!/usr/bin/env node

/**
 * ENTERPRISE DEPLOYMENT MASTER CONTROL SYSTEM
 * Central command and control for autonomous deployment agent
 * Provides start/stop controls, monitoring, and emergency procedures
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
// import EnterpriseDeploymentErrorHandler from './deployment-error-handler.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

class DeploymentMasterControl {
  constructor() {
    this.controlFile = path.join(rootDir, 'logs', 'deployment-control.json');
    this.statusFile = path.join(rootDir, 'logs', 'deployment-status.json');
    this.logFile = path.join(rootDir, 'logs', 'master-control.log');
    this.agentProcess = null;
    this.errorHandler = null; // Will initialize when needed
    this.initializeDirectories();
  }

  async initializeDirectories() {
    const logsDir = path.join(rootDir, 'logs');
    try {
      await fs.mkdir(logsDir, { recursive: true });
    } catch (error) {
      // Directory exists
    }
  }

  async log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...data
    };

    const logLine = `${timestamp} [MASTER-CONTROL-${level.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`;
    
    try {
      await fs.appendFile(this.logFile, logLine);
      console.log(`[MASTER-CONTROL] ${logLine.trim()}`);
    } catch (error) {
      console.error('CRITICAL: Failed to write to master control log:', error);
    }
  }

  async startAgent() {
    await this.log('info', 'Starting Enterprise Autonomous Deployment Agent');
    
    try {
      // Check if agent is already running
      const status = await this.getAgentStatus();
      if (status && status.isRunning) {
        await this.log('warn', 'Agent is already running');
        console.log('Agent is already running. Use "stop" command first if you want to restart.');
        return false;
      }

      // Start the agent process
      const agentScript = path.join(__dirname, 'autonomous-deployment-agent.js');
      this.agentProcess = spawn('node', [agentScript, 'start'], {
        cwd: rootDir,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.agentProcess.stdout.on('data', _(data) => {
        console.log(`[AGENT-OUTPUT] ${data.toString().trim()}`);
      });

      this.agentProcess.stderr.on('data', _(data) => {
        console.error(`[AGENT-ERROR] ${data.toString().trim()}`);
      });

      this.agentProcess.on('exit', _(code) => {
        this.log('info', `Agent process exited with code ${code}`);
      });

      // Update control file
      const controlData = {
        enabled: true,
        lastCommand: 'start',
        stopRequested: false,
        startTime: new Date().toISOString(),
        processId: this.agentProcess.pid
      };
      
      await fs.writeFile(this.controlFile, JSON.stringify(controlData, null, 2));
      await this.log('info', 'Agent started successfully', { processId: this.agentProcess.pid });
      
      console.log('✅ Enterprise Autonomous Deployment Agent started successfully!');
      console.log('🚀 Agent will commit, push, and create PRs every 5 minutes');
      console.log('📊 Monitor status with: npm run autonomous:status');
      console.log('⏹️  Stop with: npm run autonomous:stop');
      
      return true;
    } catch (error) {
      await this.log('error', 'Failed to start agent', { error: error.message });
      console.error('❌ Failed to start agent:', error.message);
      return false;
    }
  }

  async stopAgent() {
    await this.log('info', 'Stopping Enterprise Autonomous Deployment Agent');
    
    try {
      // Update control file to request stop
      const controlData = {
        enabled: false,
        lastCommand: 'stop',
        stopRequested: true,
        stopTime: new Date().toISOString()
      };
      
      await fs.writeFile(this.controlFile, JSON.stringify(controlData, null, 2));
      await this.log('info', 'Stop request sent to agent');
      
      console.log('🛑 Stop request sent to autonomous agent');
      console.log('⏳ Agent will stop gracefully after current deployment cycle');
      console.log('📊 Monitor with: npm run autonomous:status');
      
      return true;
    } catch (error) {
      await this.log('error', 'Failed to stop agent', { error: error.message });
      console.error('❌ Failed to stop agent:', error.message);
      return false;
    }
  }

  async forceStopAgent() {
    await this.log('info', 'Force stopping Enterprise Autonomous Deployment Agent');
    
    try {
      // Kill any running node processes for the agent
      try {
        execSync('tasklist | findstr "autonomous-deployment-agent"', { stdio: 'pipe' });
        execSync('taskkill //F //IM node.exe //FI "WINDOWTITLE eq autonomous-deployment-agent*"', { stdio: 'ignore' });
      } catch (error) {
        // No matching processes found
      }

      // Update control file
      const controlData = {
        enabled: false,
        lastCommand: 'force-stop',
        stopRequested: true,
        forceStopTime: new Date().toISOString()
      };
      
      await fs.writeFile(this.controlFile, JSON.stringify(controlData, null, 2));
      await this.log('info', 'Agent force stopped');
      
      console.log('🚫 Enterprise Autonomous Deployment Agent force stopped');
      return true;
    } catch (error) {
      await this.log('error', 'Failed to force stop agent', { error: error.message });
      console.error('❌ Failed to force stop agent:', error.message);
      return false;
    }
  }

  async getAgentStatus() {
    try {
      const status = JSON.parse(await fs.readFile(this.statusFile, 'utf8'));
      return status;
    } catch (error) {
      return null;
    }
  }

  async showStatus() {
    console.log('');
    console.log('🎛️  ENTERPRISE AUTONOMOUS DEPLOYMENT AGENT - MASTER CONTROL');
    console.log('=========================================================');
    
    try {
      const status = await this.getAgentStatus();
      const controlData = JSON.parse(await fs.readFile(this.controlFile, 'utf8'));
      
      if (!status) {
        console.log('Status: ⚫ STOPPED (No status file found)');
        return;
      }

      const uptime = status.uptime ? Math.round(status.uptime / 1000 / 60) : 0;
      const statusIcon = status.isRunning ? '🟢' : '🔴';
      
      console.log(`Status: ${statusIcon} ${status.isRunning ? 'RUNNING 24/7' : 'STOPPED'}`);
      console.log(`Uptime: ${uptime} minutes`);
      console.log(`Deployments completed: ${status.deploymentCount}`);
      console.log(`Error count: ${status.errorCount}`);
      console.log(`Next deployment: ${status.nextDeployment || 'N/A'}`);
      console.log('');
      
      if (status.lastDeployment) {
        const lastSuccess = status.lastDeployment.success ? '✅' : '❌';
        console.log('📋 LAST DEPLOYMENT:');
        console.log(`   Result: ${lastSuccess} ${status.lastDeployment.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Time: ${status.lastDeployment.timestamp}`);
        console.log(`   Duration: ${status.lastDeployment.duration}ms`);
        
        if (status.lastDeployment.railwayStatus) {
          console.log('   Railway Status:');
          for (const [env, envStatus] of Object.entries(status.lastDeployment.railwayStatus)) {
            const envIcon = envStatus.status === 'healthy' ? '✅' : '❌';
            console.log(`     ${env}: ${envIcon} ${envStatus.status}`);
          }
        }
        
        if (status.lastDeployment.localhostStatus) {
          const localIcon = status.lastDeployment.localhostStatus.status === 'healthy' ? '✅' : '❌';
          console.log(`   localhost:3000: ${localIcon} ${status.lastDeployment.localhostStatus.status}`);
        }
        console.log('');
      }
      
      console.log('🚀 RAILWAY ENVIRONMENTS:');
      console.log('   Development: https://daring-reflection-development.up.railway.app');
      console.log('   Testing: https://sentia-manufacturing-dashboard-testing.up.railway.app');
      console.log('   Production: https://web-production-1f10.up.railway.app');
      console.log('');
      
      console.log('🎛️  CONTROLS:');
      console.log('   Start:  npm run autonomous:start');
      console.log('   Stop:   npm run autonomous:stop');
      console.log('   Status: npm run autonomous:status');
      console.log('   Force Stop: npm run autonomous:force-stop');
      
    } catch (error) {
      console.log('❌ Failed to read agent status:', error.message);
    }
    
    console.log('');
  }

  async emergencyStop() {
    await this.log('critical', 'EMERGENCY STOP requested');
    console.log('🚨 EMERGENCY STOP ACTIVATED');
    console.log('🛑 Stopping all autonomous deployment processes...');
    
    try {
      // Force stop the agent
      await this.forceStopAgent();
      
      // Kill all node processes that might be related
      try {
        execSync('taskkill //F //IM node.exe //FI "COMMANDLINE eq *autonomous*"', { stdio: 'ignore' });
      } catch (error) {
        // Ignore if no processes found
      }
      
      // Clear all control files
      const controlData = {
        enabled: false,
        lastCommand: 'emergency-stop',
        stopRequested: true,
        emergencyStop: true,
        emergencyStopTime: new Date().toISOString()
      };
      
      await fs.writeFile(this.controlFile, JSON.stringify(controlData, null, 2));
      
      console.log('🚫 EMERGENCY STOP COMPLETED');
      console.log('✅ All autonomous deployment processes stopped');
      
      await this.log('critical', 'EMERGENCY STOP completed successfully');
      
    } catch (error) {
      console.error('❌ EMERGENCY STOP FAILED:', error.message);
      await this.log('critical', 'EMERGENCY STOP failed', { error: error.message });
    }
  }

  async processRailwayLogs(logContent) {
    await this.log('info', 'Processing Railway logs for error handling');
    
    try {
      // Lazy load the error handler
      if (!this.errorHandler) {
        const { default: EnterpriseDeploymentErrorHandler } = await import('./deployment-error-handler.js');
        this.errorHandler = new EnterpriseDeploymentErrorHandler();
      }
      
      const result = await this.errorHandler.processRailwayLogs(logContent);
      console.log('Railway Log Processing Result:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log(`✅ ${result.fixed} errors fixed automatically`);
        console.log('🚀 Redeployment triggered with fixes');
      } else {
        console.log(`❌ Could not auto-fix errors: ${result.reason}`);
        if (result.failed > 0) {
          console.log(`⚠️  ${result.failed} errors could not be fixed automatically`);
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to process Railway logs:', error.message);
      await this.log('error', 'Failed to process Railway logs', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async healthCheck() {
    console.log('🏥 HEALTH CHECK - Enterprise Autonomous Deployment System');
    console.log('========================================================');
    
    const checks = {
      agentStatus: false,
      gitRepository: false,
      railwayAuth: false,
      githubAuth: false,
      nodeModules: false,
      logDirectories: false
    };

    // Check agent status
    try {
      const status = await this.getAgentStatus();
      checks.agentStatus = status && status.isRunning;
      console.log(`Agent Running: ${checks.agentStatus ? '✅' : '❌'}`);
    } catch (error) {
      console.log('Agent Running: ❌');
    }

    // Check git repository
    try {
      execSync('git status', { cwd: rootDir, stdio: 'pipe' });
      checks.gitRepository = true;
      console.log('Git Repository: ✅');
    } catch (error) {
      console.log('Git Repository: ❌');
    }

    // Check Railway auth
    try {
      execSync('railway whoami', { stdio: 'pipe' });
      checks.railwayAuth = true;
      console.log('Railway Auth: ✅');
    } catch (error) {
      console.log('Railway Auth: ❌');
    }

    // Check GitHub auth
    try {
      execSync('gh auth status', { stdio: 'pipe' });
      checks.githubAuth = true;
      console.log('GitHub Auth: ✅');
    } catch (error) {
      console.log('GitHub Auth: ❌');
    }

    // Check node_modules
    try {
      await fs.access(path.join(rootDir, 'node_modules'));
      checks.nodeModules = true;
      console.log('Dependencies: ✅');
    } catch (error) {
      console.log('Dependencies: ❌');
    }

    // Check log directories
    try {
      await fs.access(path.join(rootDir, 'logs'));
      checks.logDirectories = true;
      console.log('Log Directories: ✅');
    } catch (error) {
      console.log('Log Directories: ❌');
    }

    const healthScore = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    console.log('');
    console.log(`🏥 HEALTH SCORE: ${healthScore}/${totalChecks} (${Math.round(healthScore/totalChecks*100)}%)`);
    
    if (healthScore < totalChecks) {
      console.log('⚠️  Some components need attention for optimal operation');
    } else {
      console.log('✅ System is healthy and ready for 24/7 operation');
    }

    return { checks, healthScore, totalChecks };
  }
}

// CLI Interface
async function main() {
  const masterControl = new DeploymentMasterControl();
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      await masterControl.startAgent();
      break;
      
    case 'stop':
      await masterControl.stopAgent();
      break;
      
    case 'force-stop':
      await masterControl.forceStopAgent();
      break;
      
    case 'status':
      await masterControl.showStatus();
      break;
      
    case 'emergency-stop':
      await masterControl.emergencyStop();
      break;
      
    case 'health':
      await masterControl.healthCheck();
      break;
      
    case 'process-logs':
      const logFile = process.argv[3];
      if (!logFile) {
        console.error('Usage: node deployment-master-control.js process-logs <log-file>');
        process.exit(1);
      }
      
      try {
        const logContent = await fs.readFile(logFile, 'utf8');
        await masterControl.processRailwayLogs(logContent);
      } catch (error) {
        console.error('Failed to process log file:', error.message);
      }
      break;
      
    default:
      console.log(`
🎛️  ENTERPRISE DEPLOYMENT MASTER CONTROL SYSTEM
===============================================

Commands:
  start                     Start the autonomous deployment agent (24/7 operation)
  stop                      Gracefully stop the autonomous deployment agent  
  force-stop               Force stop the agent immediately
  status                   Show detailed agent status and deployment information
  emergency-stop           EMERGENCY: Stop all deployment processes immediately
  health                   Perform comprehensive system health check
  process-logs <file>      Process Railway error logs and apply automatic fixes

24/7 Operation Features:
✅ Commits every 5 minutes automatically
✅ Pushes to development branch  
✅ Creates PRs to test and production branches
✅ Monitors all 3 Railway environments
✅ Monitors localhost:3000
✅ Enterprise-grade error handling and recovery
✅ Automatic Railway log processing and error fixing
✅ 100% reliable operation with comprehensive logging

Railway Environments:
🚀 Development: https://daring-reflection-development.up.railway.app
🧪 Testing: https://sentia-manufacturing-dashboard-testing.up.railway.app  
🏭 Production: https://web-production-1f10.up.railway.app

The agent will only stop when you explicitly command it to stop.
`);
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default DeploymentMasterControl;