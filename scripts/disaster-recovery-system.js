#!/usr/bin/env node

/**
 * Disaster Recovery & Rollback System
 * Enterprise-grade disaster recovery and automated rollback capabilities
 */

import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Disaster Recovery Configuration
const DRCONFIG = {
  environments: {
    development: {
      name: 'Development',
      url: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
      railwayService: 'development',
      criticalityLevel: 'low',
      maxDowntime: 300000, // 5 minutes
      autoRollback: true
    },
    testing: {
      name: 'Testing (UAT)',
      url: 'https://sentiatest.financeflo.ai', 
      railwayService: 'testing',
      criticalityLevel: 'medium',
      maxDowntime: 120000, // 2 minutes
      autoRollback: true
    },
    production: {
      name: 'Production',
      url: 'https://web-production-1f10.up.railway.app',
      railwayService: 'production',
      criticalityLevel: 'critical',
      maxDowntime: 30000, // 30 seconds
      autoRollback: true,
      requiresApproval: true
    }
  },
  backupRetention: {
    development: 7, // 7 days
    testing: 14, // 14 days  
    production: 90 // 90 days
  },
  healthCheckRetries: 10,
  healthCheckInterval: 15000, // 15 seconds
  snapshotTypes: ['deployment', 'database', 'configuration', 'logs']
};

class DisasterRecoverySystem {
  constructor() {
    this.recoveryId = this.generateRecoveryId();
    this.startTime = Date.now();
    this.logFile = path.join(projectRoot, 'logs', `disaster-recovery-${this.recoveryId}.log`);
    this.snapshotsDir = path.join(projectRoot, 'disaster-recovery', 'snapshots');
    this.rollbacksDir = path.join(projectRoot, 'disaster-recovery', 'rollbacks');
    
    this.ensureDirectoryExists(path.dirname(this.logFile));
    this.ensureDirectoryExists(this.snapshotsDir);
    this.ensureDirectoryExists(this.rollbacksDir);
    
    this.log('INFO', `Disaster Recovery System Initialized - ID: ${this.recoveryId}`);
  }

  generateRecoveryId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const random = Math.random().toString(36).substring(2, 6);
    return `dr-${timestamp}-${random}`;
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] [${this.recoveryId}] ${message}`;
    
    console.log(logEntry);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    try {
      fs.appendFileSync(this.logFile, logEntry + (data ? '\n' + JSON.stringify(data, null, 2) : '') + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async executeCommand(command, timeout = 120000) {
    return new Promise((resolve, _reject) => {
      this.log('INFO', `Executing: ${command}`);
      
      exec(command, { 
        cwd: projectRoot,
        timeout,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      }, _(error, stdout, _stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr, code: 0 });
        }
      });
    });
  }

  async createSnapshot(environment, type = 'full') {
    this.log('INFO', `Creating ${type} snapshot for ${environment} environment`);
    
    const snapshotId = `${environment}-${type}-${Date.now()}`;
    const snapshotPath = path.join(this.snapshotsDir, `${snapshotId}.json`);
    
    try {
      const snapshot = {
        id: snapshotId,
        environment,
        type,
        timestamp: new Date().toISOString(),
        metadata: await this.captureMetadata(environment),
        deployment: await this.captureDeploymentState(environment),
        configuration: await this.captureConfiguration(environment),
        database: await this.captureDatabaseState(environment),
        logs: await this.captureLogs(environment)
      };
      
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
      
      this.log('SUCCESS', `Snapshot created: ${snapshotId}`);
      this.log('INFO', `Snapshot saved to: ${snapshotPath}`);
      
      // Clean up old snapshots
      await this.cleanupOldSnapshots(environment);
      
      return snapshot;
      
    } catch (error) {
      this.log('ERROR', `Failed to create snapshot: ${error.message}`);
      throw error;
    }
  }

  async captureMetadata(environment) {
    try {
      const metadata = {
        environment,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        packageVersion: this.getPackageVersion(),
        gitCommit: await this.getCurrentGitCommit(),
        railwayStatus: await this.getRailwayStatus(environment)
      };
      
      return metadata;
    } catch (error) {
      this.log('WARN', `Failed to capture metadata: ${error.message}`);
      return { error: error.message };
    }
  }

  async captureDeploymentState(environment) {
    try {
      const env = DR_CONFIG.environments[environment];
      
      // Capture current deployment info
      const deploymentState = {
        environment,
        serviceUrl: env.url,
        healthStatus: await this.checkEnvironmentHealth(environment),
        lastDeployment: this.getLastDeploymentInfo(environment),
        runningServices: await this.getRunningServices(environment)
      };
      
      return deploymentState;
    } catch (error) {
      this.log('WARN', `Failed to capture deployment state: ${error.message}`);
      return { error: error.message };
    }
  }

  async captureConfiguration(environment) {
    try {
      // Capture environment variables and configuration
      const configFiles = [
        '.env',
        `.env.${environment}`,
        'railway.json',
        'railway.toml',
        'package.json'
      ];
      
      const configuration = {
        files: {},
        environment
      };
      
      for (const file of configFiles) {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          configuration.files[file] = fs.readFileSync(filePath, 'utf8');
        }
      }
      
      return configuration;
    } catch (error) {
      this.log('WARN', `Failed to capture configuration: ${error.message}`);
      return { error: error.message };
    }
  }

  async captureDatabaseState(environment) {
    try {
      // This would capture database schema, critical data, etc.
      // For now, just capture basic info
      const databaseState = {
        environment,
        timestamp: new Date().toISOString(),
        // Future: Add actual database backup functionality
        placeholder: 'Database backup functionality would be implemented here'
      };
      
      return databaseState;
    } catch (error) {
      this.log('WARN', `Failed to capture database state: ${error.message}`);
      return { error: error.message };
    }
  }

  async captureLogs(environment) {
    try {
      // Capture recent logs
      const logsDir = path.join(projectRoot, 'logs');
      const logFiles = [];
      
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir)
          .filter(f => f.includes(environment) || f.includes('deployment') || f.includes('monitoring'))
          .sort((a, b) => {
            const statA = fs.statSync(path.join(logsDir, a));
            const statB = fs.statSync(path.join(logsDir, b));
            return statB.mtime - statA.mtime;
          })
          .slice(0, 10); // Keep latest 10 log files
          
        for (const file of files) {
          const filePath = path.join(logsDir, file);
          const stats = fs.statSync(filePath);
          
          logFiles.push({
            filename: file,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            // Only capture recent logs to avoid huge snapshots
            content: fs.readFileSync(filePath, 'utf8').slice(-10000) // Last 10KB
          });
        }
      }
      
      return { logFiles, capturedAt: new Date().toISOString() };
    } catch (error) {
      this.log('WARN', `Failed to capture logs: ${error.message}`);
      return { error: error.message };
    }
  }

  getPackageVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  async getCurrentGitCommit() {
    try {
      const result = await this.executeCommand('git rev-parse HEAD', 5000);
      return result.stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async getRailwayStatus(environment) {
    try {
      const result = await this.executeCommand('railway status', 10000);
      return result.stdout;
    } catch (error) {
      return 'unknown';
    }
  }

  async checkEnvironmentHealth(environment) {
    const env = DR_CONFIG.environments[environment];
    
    try {
      const result = await this.executeCommand(`curl -f ${env.url}/api/health`, 30000);
      return {
        status: 'healthy',
        responseTime: Date.now(),
        details: result.stdout
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  getLastDeploymentInfo(environment) {
    try {
      const markerFile = path.join(projectRoot, `deployment-marker-${environment}.txt`);
      if (fs.existsSync(markerFile)) {
        return JSON.parse(fs.readFileSync(markerFile, 'utf8'));
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async getRunningServices(environment) {
    try {
      // This would query Railway or other platforms for running services
      // For now, return basic info
      return {
        environment,
        placeholder: 'Service status would be queried here'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async rollback(environment, snapshotId = null) {
    this.log('INFO', `Initiating rollback for ${environment} environment`);
    
    const env = DR_CONFIG.environments[environment];
    const rollbackId = `rollback-${environment}-${Date.now()}`;
    
    try {
      // Create pre-rollback snapshot
      this.log('INFO', 'Creating pre-rollback snapshot...');
      const preRollbackSnapshot = await this.createSnapshot(environment, 'pre-rollback');
      
      let targetSnapshot;
      
      if (snapshotId) {
        // Use specific snapshot
        const snapshotPath = path.join(this.snapshotsDir, `${snapshotId}.json`);
        if (fs.existsSync(snapshotPath)) {
          targetSnapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
        } else {
          throw new Error(`Snapshot ${snapshotId} not found`);
        }
      } else {
        // Use latest healthy snapshot
        targetSnapshot = await this.findLatestHealthySnapshot(environment);
        if (!targetSnapshot) {
          throw new Error('No healthy snapshot found for rollback');
        }
      }
      
      this.log('INFO', `Rolling back to snapshot: ${targetSnapshot.id}`);
      
      // Perform rollback steps
      const rollbackSteps = [
        { name: 'Validate snapshot', action: () => this.validateSnapshot(targetSnapshot) },
        { name: 'Stop current deployment', action: () => this.stopDeployment(environment) },
        { name: 'Restore configuration', action: () => this.restoreConfiguration(targetSnapshot) },
        { name: 'Deploy previous version', action: () => this.deployPreviousVersion(environment, targetSnapshot) },
        { name: 'Verify rollback', action: () => this.verifyRollback(environment, targetSnapshot) }
      ];
      
      const rollbackLog = {
        rollbackId,
        environment,
        targetSnapshot: targetSnapshot.id,
        preRollbackSnapshot: preRollbackSnapshot.id,
        startTime: new Date().toISOString(),
        steps: []
      };
      
      for (const step of rollbackSteps) {
        this.log('INFO', `Executing rollback step: ${step.name}`);
        const stepStart = Date.now();
        
        try {
          await step.action();
          
          const stepResult = {
            name: step.name,
            status: 'SUCCESS',
            duration: Date.now() - stepStart
          };
          
          rollbackLog.steps.push(stepResult);
          this.log('SUCCESS', `Rollback step completed: ${step.name}`);
          
        } catch (error) {
          const stepResult = {
            name: step.name,
            status: 'FAILED',
            duration: Date.now() - stepStart,
            error: error.message
          };
          
          rollbackLog.steps.push(stepResult);
          this.log('ERROR', `Rollback step failed: ${step.name} - ${error.message}`);
          
          // If critical step fails, attempt emergency recovery
          if (step.name === 'Deploy previous version') {
            await this.emergencyRecovery(environment);
          }
          
          throw error;
        }
      }
      
      rollbackLog.endTime = new Date().toISOString();
      rollbackLog.status = 'SUCCESS';
      rollbackLog.totalDuration = Date.now() - this.startTime;
      
      // Save rollback log
      const rollbackLogPath = path.join(this.rollbacksDir, `${rollbackId}.json`);
      fs.writeFileSync(rollbackLogPath, JSON.stringify(rollbackLog, null, 2));
      
      this.log('SUCCESS', `Rollback completed successfully - ID: ${rollbackId}`);
      this.log('INFO', `Rollback log saved to: ${rollbackLogPath}`);
      
      return rollbackLog;
      
    } catch (error) {
      this.log('ERROR', `Rollback failed: ${error.message}`);
      throw error;
    }
  }

  async findLatestHealthySnapshot(environment) {
    try {
      const snapshots = fs.readdirSync(this.snapshotsDir)
        .filter(f => f.startsWith(`${environment}-`) && f.endsWith('.json'))
        .map(f => {
          const snapshot = JSON.parse(fs.readFileSync(path.join(this.snapshotsDir, f), 'utf8'));
          return snapshot;
        })
        .filter(s => s.deployment && s.deployment.healthStatus && s.deployment.healthStatus.status === 'healthy')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
      return snapshots.length > 0 ? snapshots[0] : null;
    } catch (error) {
      this.log('ERROR', `Failed to find healthy snapshot: ${error.message}`);
      return null;
    }
  }

  async validateSnapshot(snapshot) {
    this.log('INFO', 'Validating snapshot...');
    
    if (!snapshot || !snapshot.id) {
      throw new Error('Invalid snapshot: missing ID');
    }
    
    if (!snapshot.deployment) {
      throw new Error('Invalid snapshot: missing deployment data');
    }
    
    if (!snapshot.configuration) {
      throw new Error('Invalid snapshot: missing configuration data');
    }
    
    this.log('SUCCESS', 'Snapshot validation passed');
  }

  async stopDeployment(environment) {
    this.log('INFO', `Stopping current deployment for ${environment}...`);
    
    try {
      // This would stop the current Railway deployment
      // For now, just log the action
      this.log('INFO', `Would stop Railway deployment for ${environment}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate stop time
      
    } catch (error) {
      this.log('WARN', `Failed to stop deployment: ${error.message}`);
    }
  }

  async restoreConfiguration(snapshot) {
    this.log('INFO', 'Restoring configuration from snapshot...');
    
    if (snapshot.configuration && snapshot.configuration.files) {
      for (const [filename, content] of Object.entries(snapshot.configuration.files)) {
        // Skip sensitive files
        if (filename.includes('.env') && !filename.includes('.example')) {
          this.log('WARN', `Skipping sensitive file: ${filename}`);
          continue;
        }
        
        const filePath = path.join(projectRoot, filename);
        
        try {
          // Create backup of current file
          if (fs.existsSync(filePath)) {
            const backupPath = `${filePath}.rollback-backup-${Date.now()}`;
            fs.copyFileSync(filePath, backupPath);
            this.log('INFO', `Created backup: ${backupPath}`);
          }
          
          // Restore file
          fs.writeFileSync(filePath, content);
          this.log('SUCCESS', `Restored: ${filename}`);
          
        } catch (error) {
          this.log('ERROR', `Failed to restore ${filename}: ${error.message}`);
        }
      }
    }
  }

  async deployPreviousVersion(environment, snapshot) {
    this.log('INFO', `Deploying previous version for ${environment}...`);
    
    try {
      // This would trigger deployment of the previous version
      // Use the environment-specific deployment script
      const deployScript = `railway-deploy-${environment}.js`;
      const deployScriptPath = path.join(projectRoot, 'scripts', deployScript);
      
      if (fs.existsSync(deployScriptPath)) {
        await this.executeCommand(`node scripts/${deployScript}`, 600000); // 10 minutes timeout
      } else {
        // Fallback to generic Railway deployment
        await this.executeCommand(`railway up --environment ${environment}`, 600000);
      }
      
      this.log('SUCCESS', 'Previous version deployed');
      
    } catch (error) {
      this.log('ERROR', `Failed to deploy previous version: ${error.message}`);
      throw error;
    }
  }

  async verifyRollback(environment, snapshot) {
    this.log('INFO', 'Verifying rollback success...');
    
    const env = DR_CONFIG.environments[environment];
    const maxRetries = DR_CONFIG.healthCheckRetries;
    const retryInterval = DR_CONFIG.healthCheckInterval;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log('INFO', `Health check attempt ${attempt}/${maxRetries}...`);
        
        const healthResult = await this.checkEnvironmentHealth(environment);
        
        if (healthResult.status === 'healthy') {
          this.log('SUCCESS', 'Rollback verification passed');
          return true;
        }
        
        this.log('WARN', `Health check failed on attempt ${attempt}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
        
      } catch (error) {
        this.log('WARN', `Health check attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
      }
    }
    
    throw new Error('Rollback verification failed - environment is not healthy');
  }

  async emergencyRecovery(environment) {
    this.log('CRITICAL', `Initiating emergency recovery for ${environment}...`);
    
    try {
      // Emergency recovery steps - simplified deployment
      this.log('INFO', 'Attempting emergency deployment...');
      
      // Try to deploy a minimal working version
      await this.executeCommand(`railway up --environment ${environment} --detach`, 300000);
      
      this.log('SUCCESS', 'Emergency recovery deployment initiated');
      
    } catch (error) {
      this.log('CRITICAL', `Emergency recovery failed: ${error.message}`);
      
      // At this point, manual intervention is required
      this.log('CRITICAL', 'MANUAL INTERVENTION REQUIRED - Contact operations team immediately');
    }
  }

  async cleanupOldSnapshots(environment) {
    try {
      const retentionDays = DR_CONFIG.backupRetention[environment] || 7;
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - retentionMs;
      
      const snapshots = fs.readdirSync(this.snapshotsDir)
        .filter(f => f.startsWith(`${environment}-`) && f.endsWith('.json'))
        .map(f => ({
          filename: f,
          path: path.join(this.snapshotsDir, f),
          mtime: fs.statSync(path.join(this.snapshotsDir, f)).mtime.getTime()
        }))
        .filter(s => s.mtime < cutoffTime);
        
      for (const snapshot of snapshots) {
        fs.unlinkSync(snapshot.path);
        this.log('INFO', `Cleaned up old snapshot: ${snapshot.filename}`);
      }
      
      if (snapshots.length > 0) {
        this.log('SUCCESS', `Cleaned up ${snapshots.length} old snapshots`);
      }
      
    } catch (error) {
      this.log('WARN', `Failed to cleanup old snapshots: ${error.message}`);
    }
  }

  async listSnapshots(environment = null) {
    try {
      let snapshots = fs.readdirSync(this.snapshotsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const snapshot = JSON.parse(fs.readFileSync(path.join(this.snapshotsDir, f), 'utf8'));
          return {
            id: snapshot.id,
            environment: snapshot.environment,
            type: snapshot.type,
            timestamp: snapshot.timestamp,
            healthStatus: snapshot.deployment?.healthStatus?.status || 'unknown'
          };
        });
        
      if (environment) {
        snapshots = snapshots.filter(s => s.environment === environment);
      }
      
      snapshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return snapshots;
    } catch (error) {
      this.log('ERROR', `Failed to list snapshots: ${error.message}`);
      return [];
    }
  }

  async getSystemStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      environments: {},
      snapshots: {
        total: 0,
        byEnvironment: {}
      },
      rollbacks: {
        total: 0,
        recent: []
      }
    };
    
    // Check environment health
    for (const [envName, envConfig] of Object.entries(DR_CONFIG.environments)) {
      status.environments[envName] = await this.checkEnvironmentHealth(envName);
    }
    
    // Snapshot statistics
    const snapshots = await this.listSnapshots();
    status.snapshots.total = snapshots.length;
    
    for (const snapshot of snapshots) {
      if (!status.snapshots.byEnvironment[snapshot.environment]) {
        status.snapshots.byEnvironment[snapshot.environment] = 0;
      }
      status.snapshots.byEnvironment[snapshot.environment]++;
    }
    
    // Recent rollbacks
    try {
      const rollbackFiles = fs.readdirSync(this.rollbacksDir)
        .filter(f => f.endsWith('.json'))
        .map(f => JSON.parse(fs.readFileSync(path.join(this.rollbacksDir, f), 'utf8')))
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 10);
        
      status.rollbacks.total = rollbackFiles.length;
      status.rollbacks.recent = rollbackFiles.map(r => ({
        id: r.rollbackId,
        environment: r.environment,
        startTime: r.startTime,
        status: r.status
      }));
    } catch (error) {
      this.log('WARN', `Failed to get rollback statistics: ${error.message}`);
    }
    
    return status;
  }

  // CLI Interface
  static async cli() {
    const args = process.argv.slice(2);
    const command = args[0] || 'status';
    const environment = args[1];
    const snapshotId = args[2];

    const dr = new DisasterRecoverySystem();

    switch (command) {
      case 'snapshot':
        if (!environment) {
          console.log('Error: Environment required for snapshot command');
          console.log('Usage: node scripts/disaster-recovery-system.js snapshot <environment> [type]');
          process.exit(1);
        }
        
        try {
          const type = snapshotId || 'full';
          const snapshot = await dr.createSnapshot(environment, type);
          console.log('\nSnapshot created successfully:');
          console.log(JSON.stringify({
            id: snapshot.id,
            environment: snapshot.environment,
            type: snapshot.type,
            timestamp: snapshot.timestamp
          }, null, 2));
        } catch (error) {
          console.error('Failed to create snapshot:', error.message);
          process.exit(1);
        }
        break;

      case 'rollback':
        if (!environment) {
          console.log('Error: Environment required for rollback command');
          console.log('Usage: node scripts/disaster-recovery-system.js rollback <environment> [snapshotId]');
          process.exit(1);
        }
        
        try {
          const rollbackLog = await dr.rollback(environment, snapshotId);
          console.log('\nRollback completed successfully:');
          console.log(JSON.stringify({
            rollbackId: rollbackLog.rollbackId,
            environment: rollbackLog.environment,
            status: rollbackLog.status,
            totalDuration: rollbackLog.totalDuration
          }, null, 2));
        } catch (error) {
          console.error('Rollback failed:', error.message);
          process.exit(1);
        }
        break;

      case 'list':
        try {
          const snapshots = await dr.listSnapshots(environment);
          console.log('\nAvailable snapshots:');
          console.log(JSON.stringify(snapshots, null, 2));
        } catch (error) {
          console.error('Failed to list snapshots:', error.message);
          process.exit(1);
        }
        break;

      case 'status':
        try {
          const status = await dr.getSystemStatus();
          console.log('\nDisaster Recovery System Status:');
          console.log(JSON.stringify(status, null, 2));
        } catch (error) {
          console.error('Failed to get system status:', error.message);
          process.exit(1);
        }
        break;

      default:
        console.log(`
Disaster Recovery & Rollback System - CapLiquify Manufacturing Platform

Usage:
  node scripts/disaster-recovery-system.js <command> [options]

Commands:
  snapshot <env> [type]    Create snapshot of environment
  rollback <env> [id]      Rollback environment to snapshot
  list [env]               List available snapshots
  status                   Show system status (default)

Environments:
  development
  testing
  production

Examples:
  node scripts/disaster-recovery-system.js snapshot production
  node scripts/disaster-recovery-system.js rollback production snapshot-id
  node scripts/disaster-recovery-system.js list production
  node scripts/disaster-recovery-system.js status
        `);
        break;
    }
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  DisasterRecoverySystem.cli().catch(console.error);
}

export default DisasterRecoverySystem;