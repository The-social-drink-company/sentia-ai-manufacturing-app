#!/usr/bin/env node

/**
 * Autonomous Process Manager - 24/7 Process Management for Windows
 * Ensures autonomous testing system runs continuously with process monitoring
 * Uses Windows Service approach for maximum reliability
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutonomousProcessManager {
  constructor() {
    this.managedProcesses = new Map();
    this.isShuttingDown = false;
    this.managerStartTime = Date.now();
    this.logFile = path.join(__dirname, '..', 'tests', 'autonomous', 'logs', 'process-manager.log');
    this.pidFile = path.join(__dirname, '..', 'tests', 'autonomous', 'logs', 'process-manager.pid');
    
    this.setupProcesses();
    this.start();
  }

  setupProcesses() {
    // Define processes to manage
    this.managedProcesses.set('watchdog', {
      name: 'Autonomous Watchdog',
      script: path.join(__dirname, '..', 'services', 'observability', 'autonomous-watchdog.js'),
      process: null,
      pid: null,
      restarts: 0,
      lastRestart: null,
      enabled: true,
      critical: true,
      maxMemoryMB: 500,
      startupDelay: 2000
    });

    this.managedProcesses.set('monitoring', {
      name: 'Monitoring Dashboard',
      script: path.join(__dirname, '..', 'monitoring-server.js'),
      process: null,
      pid: null,
      restarts: 0,
      lastRestart: null,
      enabled: true,
      critical: false,
      maxMemoryMB: 200,
      startupDelay: 5000
    });
  }

  async start() {
    await this.log('Autonomous Process Manager starting...');
    
    // Save our PID for monitoring
    await this.savePID();
    
    // Start all enabled processes
    for (const [id, processConfig] of this.managedProcesses) {
      if (processConfig.enabled) {
        await this.startProcess(id);
        await this.delay(processConfig.startupDelay);
      }
    }

    // Start monitoring
    this.startMonitoring();
    
    // Setup shutdown handlers
    this.setupShutdownHandlers();
    
    await this.log('Process Manager fully operational');
    
    // Keep process alive
    this.keepAlive();
  }

  async startProcess(processId) {
    const processConfig = this.managedProcesses.get(processId);
    if (!processConfig) return false;

    try {
      await this.log(`Starting ${processConfig.name}...`);

      const process = spawn('node', [processConfig.script], {
        stdio: 'pipe',
        detached: false,
        windowsHide: true // Hide console window on Windows
      });

      processConfig.process = process;
      processConfig.pid = process.pid;
      processConfig.startTime = Date.now();

      // Handle process output
      process.stdout.on('data', (data) => {
        this.log(`[${processConfig.name}] ${data.toString().trim()}`);
      });

      process.stderr.on('data', (data) => {
        this.log(`[${processConfig.name}] ERROR: ${data.toString().trim()}`);
      });

      // Handle process exit
      process.on('exit', async (code, signal) => {
        await this.log(`${processConfig.name} exited with code ${code}, signal ${signal}`);
        processConfig.process = null;
        processConfig.pid = null;

        // Auto-restart if not shutting down
        if (!this.isShuttingDown && processConfig.enabled) {
          await this.handleProcessExit(processId, code);
        }
      });

      process.on('error', async (error) => {
        await this.log(`${processConfig.name} error: ${error.message}`);
        await this.handleProcessExit(processId, -1);
      });

      await this.log(`${processConfig.name} started successfully (PID: ${process.pid})`);
      return true;

    } catch (error) {
      await this.log(`Failed to start ${processConfig.name}: ${error.message}`);
      return false;
    }
  }

  async handleProcessExit(processId, exitCode) {
    const processConfig = this.managedProcesses.get(processId);
    if (!processConfig || this.isShuttingDown) return;

    processConfig.restarts++;
    processConfig.lastRestart = Date.now();

    await this.log(`${processConfig.name} exited unexpectedly (restart #${processConfig.restarts})`);

    // Exponential backoff for restarts
    const delayMs = Math.min(5000 * Math.pow(2, processConfig.restarts - 1), 60000);
    
    if (processConfig.restarts <= 5) {
      await this.log(`Restarting ${processConfig.name} in ${delayMs}ms...`);
      
      setTimeout(async () => {
        const success = await this.startProcess(processId);
        if (!success && processConfig.critical) {
          await this.log(`Critical process ${processConfig.name} failed to restart!`, 'ERROR');
        }
      }, delayMs);
    } else {
      await this.log(`${processConfig.name} exceeded restart limit, disabling`, 'ERROR');
      processConfig.enabled = false;
    }
  }

  startMonitoring() {
    // Check process health every 30 seconds
    setInterval(async () => {
      await this.monitorProcesses();
    }, 30000);

    // Detailed health report every 5 minutes
    setInterval(async () => {
      await this.generateHealthReport();
    }, 300000);

    // Memory monitoring every 2 minutes
    setInterval(async () => {
      await this.monitorMemoryUsage();
    }, 120000);
  }

  async monitorProcesses() {
    for (const [id, processConfig] of this.managedProcesses) {
      if (!processConfig.enabled || !processConfig.pid) continue;

      try {
        // Check if process is still running
        process.kill(processConfig.pid, 0);
      } catch (error) {
        // Process doesn't exist, restart it
        await this.log(`Process ${processConfig.name} not found, restarting...`);
        processConfig.process = null;
        processConfig.pid = null;
        await this.handleProcessExit(id, -1);
      }
    }
  }

  async monitorMemoryUsage() {
    for (const [id, processConfig] of this.managedProcesses) {
      if (!processConfig.pid) continue;

      try {
        // Get memory usage for Windows
        const memoryUsage = await this.getProcessMemoryUsage(processConfig.pid);
        
        if (memoryUsage > processConfig.maxMemoryMB) {
          await this.log(`${processConfig.name} using ${memoryUsage}MB (limit: ${processConfig.maxMemoryMB}MB) - restarting...`, 'WARN');
          
          // Kill and restart the memory-heavy process
          if (processConfig.process) {
            processConfig.process.kill('SIGTERM');
          }
        }
      } catch (error) {
        // Process might not exist
      }
    }
  }

  async getProcessMemoryUsage(pid) {
    return new Promise((resolve, reject) => {
      exec(`tasklist /FI "PID eq ${pid}" /FO CSV`, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const lines = stdout.split('\\n');
        if (lines.length < 2) {
          reject(new Error('Process not found'));
          return;
        }

        const processLine = lines[1];
        const columns = processLine.split(',');
        
        if (columns.length >= 5) {
          const memoryStr = columns[4].replace(/["KB,]/g, '');
          const memoryKB = parseInt(memoryStr);
          resolve(Math.round(memoryKB / 1024)); // Convert to MB
        } else {
          reject(new Error('Could not parse memory usage'));
        }
      });
    });
  }

  async generateHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      managerUptime: Date.now() - this.managerStartTime,
      processes: {}
    };

    for (const [id, processConfig] of this.managedProcesses) {
      const memoryUsage = processConfig.pid ? await this.getProcessMemoryUsage(processConfig.pid).catch(() => 0) : 0;
      
      report.processes[id] = {
        name: processConfig.name,
        enabled: processConfig.enabled,
        running: !!processConfig.pid,
        pid: processConfig.pid,
        restarts: processConfig.restarts,
        lastRestart: processConfig.lastRestart,
        memoryUsageMB: memoryUsage,
        uptime: processConfig.startTime ? Date.now() - processConfig.startTime : 0
      };
    }

    // Save report
    const reportPath = path.join(__dirname, '..', 'tests', 'autonomous', 'logs', 'process-manager-status.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  async savePID() {
    try {
      await fs.writeFile(this.pidFile, process.pid.toString());
    } catch (error) {
      await this.log(`Failed to save PID: ${error.message}`);
    }
  }

  setupShutdownHandlers() {
    const shutdown = async (signal) => {
      await this.log(`Received ${signal} - shutting down Process Manager...`);
      this.isShuttingDown = true;

      // Stop all managed processes
      for (const [id, processConfig] of this.managedProcesses) {
        if (processConfig.process) {
          await this.log(`Stopping ${processConfig.name}...`);
          
          try {
            processConfig.process.kill('SIGTERM');
            
            // Force kill after 5 seconds
            setTimeout(() => {
              if (processConfig.process) {
                processConfig.process.kill('SIGKILL');
              }
            }, 5000);
          } catch (error) {
            await this.log(`Error stopping ${processConfig.name}: ${error.message}`);
          }
        }
      }

      // Clean up PID file
      try {
        await fs.unlink(this.pidFile);
      } catch (error) {
        // PID file might not exist
      }

      await this.log('Process Manager shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGBREAK', shutdown); // Windows-specific
  }

  keepAlive() {
    // Keep the process alive and responsive
    setInterval(() => {
      // Heartbeat - just to keep event loop active
    }, 10000);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [PROCESS-MGR] [${level}] ${message}\\n`;
    
    console.log(logEntry.trim());
    
    try {
      const logDir = path.dirname(this.logFile);
      await fs.mkdir(logDir, { recursive: true });
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // API methods for external control
  async getStatus() {
    return await this.generateHealthReport();
  }

  async restartProcess(processId) {
    const processConfig = this.managedProcesses.get(processId);
    if (!processConfig) return false;

    if (processConfig.process) {
      processConfig.process.kill('SIGTERM');
    }

    return await this.startProcess(processId);
  }

  async stopProcess(processId) {
    const processConfig = this.managedProcesses.get(processId);
    if (!processConfig || !processConfig.process) return false;

    processConfig.enabled = false;
    processConfig.process.kill('SIGTERM');
    return true;
  }
}

// Check if we're being run directly or imported
if (import.meta.url === `file://${process.argv[1]}`) {
  // Handle command line arguments
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      console.log('Checking Process Manager status...');
      // Implementation for status check
      break;
    case 'stop':
      console.log('Stopping Process Manager...');
      // Implementation for stopping
      break;
    default:
      // Start the process manager
      new AutonomousProcessManager();
  }
}

export default AutonomousProcessManager;