#!/usr/bin/env node

/**
 * 24/7 Autonomous Testing Service Manager
 * Ensures the autonomous testing system runs continuously
 * Monitors health and restarts the scheduler if it fails
 * Provides enterprise-grade reliability for continuous deployment
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ServiceManager {
  constructor() {
    this.schedulerProcess = null;
    this.healthCheckInterval = null;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.lastRestart = null;
    this.startTime = Date.now();
    this.logFile = path.join(__dirname, 'logs', 'service-manager.log');
    
    // 24/7 service configuration
    this.config = {
      healthCheckIntervalMs: 60000, // Check every minute
      maxInactivityMs: 15 * 60 * 1000, // 15 minutes max inactivity
      restartCooldownMs: 30000, // 30 seconds between restarts
      enableAutoRestart: true,
      enableHealthMonitoring: true
    };
    
    this.ensureLogDirectory();
    this.setupExitHandlers();
    this.startService();
  }

  async ensureLogDirectory() {
    const logsDir = path.join(__dirname, 'logs');
    try {
      await fs.mkdir(logsDir, { recursive: true });
    } catch (error) {
      // Directory already exists or created successfully
    }
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [SERVICE-MANAGER] [${level}] ${message}\\n`;
    
    console.log(`[SERVICE-MANAGER] ${message}`);
    
    try {
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to service manager log:', error);
    }
  }

  setupExitHandlers() {
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.log('Received SIGINT - shutting down gracefully...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      this.log('Received SIGTERM - shutting down gracefully...');
      this.shutdown();
    });

    process.on('uncaughtException', (error) => {
      this.log(`Uncaught exception: ${error.message}`, 'ERROR');
      this.log(`Stack trace: ${error.stack}`, 'ERROR');
      // Don't exit - try to continue running
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.log(`Unhandled promise rejection at ${promise}: ${reason}`, 'ERROR');
      // Don't exit - try to continue running
    });
  }

  async startService() {
    this.log('🚀 Starting 24/7 Autonomous Testing Service Manager');
    this.log(`Configuration: Health check every ${this.config.healthCheckIntervalMs/1000}s`);
    this.log(`Max inactivity: ${this.config.maxInactivityMs/1000/60} minutes`);
    this.log('🤖 Continuous deployment to Railway every 10 minutes');
    
    await this.startScheduler();
    this.startHealthMonitoring();
    
    this.log('✅ Service Manager is now running 24/7');
    this.log('📊 Monitoring autonomous testing system health...');
    this.log('🔄 Auto-restart enabled for maximum uptime');
  }

  async startScheduler() {
    if (this.schedulerProcess) {
      this.log('Scheduler already running, terminating existing process...');
      this.schedulerProcess.kill();
      await this.waitForProcessEnd(this.schedulerProcess);
    }

    this.log('Starting autonomous testing scheduler...');
    
    const schedulerPath = path.join(__dirname, 'autonomous-scheduler.js');
    
    this.schedulerProcess = spawn('node', [schedulerPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: __dirname,
      env: {
        ...process.env,
        AUTONOMOUS_SERVICE_MODE: '24_7',
        SERVICE_MANAGER_PID: process.pid
      }
    });

    this.schedulerProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      this.log(`[SCHEDULER] ${output}`);
    });

    this.schedulerProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      this.log(`[SCHEDULER-ERROR] ${output}`, 'WARN');
    });

    this.schedulerProcess.on('close', (code) => {
      this.log(`Scheduler process exited with code ${code}`, code === 0 ? 'INFO' : 'ERROR');
      this.schedulerProcess = null;
      
      if (this.config.enableAutoRestart && code !== 0) {
        this.handleSchedulerFailure();
      }
    });

    this.schedulerProcess.on('error', (error) => {
      this.log(`Failed to start scheduler: ${error.message}`, 'ERROR');
      this.schedulerProcess = null;
      
      if (this.config.enableAutoRestart) {
        this.handleSchedulerFailure();
      }
    });

    this.log(`✅ Scheduler started with PID ${this.schedulerProcess.pid}`);
  }

  async handleSchedulerFailure() {
    this.restartCount++;
    this.lastRestart = Date.now();
    
    if (this.restartCount >= this.maxRestarts) {
      this.log(`❌ Maximum restart limit reached (${this.maxRestarts}). Service manager shutting down.`, 'ERROR');
      process.exit(1);
    }

    const cooldownSeconds = this.config.restartCooldownMs / 1000;
    this.log(`⏳ Scheduler failed. Waiting ${cooldownSeconds}s before restart attempt ${this.restartCount}/${this.maxRestarts}...`, 'WARN');
    
    setTimeout(() => {
      this.log('🔄 Attempting to restart scheduler...');
      this.startScheduler();
    }, this.config.restartCooldownMs);
  }

  startHealthMonitoring() {
    if (!this.config.enableHealthMonitoring) {
      this.log('Health monitoring disabled');
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);

    this.log(`💓 Health monitoring started (${this.config.healthCheckIntervalMs/1000}s intervals)`);
  }

  async performHealthCheck() {
    try {
      // Check if scheduler process is still running
      if (!this.schedulerProcess || this.schedulerProcess.killed) {
        this.log('⚠️  Scheduler process not running - attempting restart', 'WARN');
        await this.startScheduler();
        return;
      }

      // Check scheduler health status file
      const statusPath = path.join(__dirname, 'logs', 'scheduler-status.json');
      
      try {
        const statusContent = await fs.readFile(statusPath, 'utf8');
        const status = JSON.parse(statusContent);
        
        // Check if scheduler has been inactive too long
        if (status.lastExecution) {
          const lastExecution = new Date(status.lastExecution);
          const inactivityMs = Date.now() - lastExecution.getTime();
          
          if (inactivityMs > this.config.maxInactivityMs) {
            this.log(`⚠️  Scheduler inactive for ${Math.round(inactivityMs/1000/60)} minutes - restarting`, 'WARN');
            await this.startScheduler();
            return;
          }
        }

        // Log health status
        if (status.healthy) {
          this.log(`💚 Health check passed - Scheduler healthy (${status.executionCount} executions, uptime: ${Math.round(status.uptime/1000/60)}min)`);
        } else {
          this.log(`🟡 Health check: Scheduler unhealthy but running (${status.consecutiveFailures} consecutive failures)`, 'WARN');
        }

      } catch (statusError) {
        this.log(`⚠️  Could not read scheduler status: ${statusError.message}`, 'WARN');
      }

    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'ERROR');
    }
  }

  async waitForProcessEnd(process) {
    return new Promise((resolve) => {
      if (!process || process.killed) {
        resolve();
        return;
      }
      
      process.on('close', () => resolve());
      process.on('exit', () => resolve());
      
      // Force kill after 5 seconds
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    });
  }

  async getServiceStatus() {
    const uptime = Date.now() - this.startTime;
    
    return {
      serviceManager: {
        running: true,
        uptime,
        restartCount: this.restartCount,
        lastRestart: this.lastRestart,
        schedulerPid: this.schedulerProcess?.pid || null,
        schedulerRunning: !!(this.schedulerProcess && !this.schedulerProcess.killed)
      },
      config: this.config
    };
  }

  async shutdown() {
    this.log('🛑 Initiating graceful shutdown...');
    
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Stop scheduler
    if (this.schedulerProcess && !this.schedulerProcess.killed) {
      this.log('Stopping scheduler process...');
      this.schedulerProcess.kill('SIGTERM');
      await this.waitForProcessEnd(this.schedulerProcess);
    }

    this.log('✅ Service Manager shutdown complete');
    process.exit(0);
  }
}

// Start the 24/7 service manager
const serviceManager = new ServiceManager();

// Export for external access
export default serviceManager;