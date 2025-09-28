#!/usr/bin/env node

/**
 * Autonomous System Watchdog - 24/7 Reliability Guardian
 * Ensures autonomous testing system runs continuously with automatic recovery
 * Monitors system health and restarts failed components
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutonomousWatchdog {
  constructor() {
    this.components = new Map();
    this.healthChecks = new Map();
    this.lastHealthCheck = null;
    this.watchdogStartTime = Date.now();
    this.logFile = path.join(__dirname, '..', '..', 'tests', 'autonomous', 'logs', 'watchdog.log');
    
    this.initializeComponents();
    this.startWatchdog();
  }

  initializeComponents() {
    // Define critical system components
    this.components.set('scheduler', {
      name: 'Autonomous Scheduler',
      scriptPath: path.join(__dirname, '..', '..', 'tests', 'autonomous', 'autonomous-scheduler.js'),
      process: null,
      restartCount: 0,
      lastRestart: null,
      maxRestarts: 5, // Max 5 restarts per hour
      isEssential: true,
      healthCheckInterval: 60000, // 1 minute
      startupDelay: 5000
    });

    this.components.set('monitoring', {
      name: 'Monitoring Server',
      scriptPath: path.join(__dirname, '..', '..', 'monitoring-server.js'),
      process: null,
      restartCount: 0,
      lastRestart: null,
      maxRestarts: 3,
      isEssential: true,
      healthCheckInterval: 120000, // 2 minutes
      startupDelay: 3000
    });

    this.components.set('mainApp', {
      name: 'Main Application',
      command: 'npm run dev:server',
      process: null,
      restartCount: 0,
      lastRestart: null,
      maxRestarts: 3,
      isEssential: true,
      healthCheckInterval: 180000, // 3 minutes
      startupDelay: 10000
    });
  }

  async startWatchdog() {
    await this.log('Autonomous Watchdog starting 24/7 monitoring...', 'INFO');
    
    // Start all essential components
    for (const [id, component] of this.components) {
      if (component.isEssential) {
        await this.startComponent(id);
        await this.delay(component.startupDelay);
      }
    }

    // Start periodic health monitoring
    this.startHealthMonitoring();
    
    // Start resource monitoring
    this.startResourceMonitoring();
    
    // Handle graceful shutdown
    this.setupShutdownHandlers();
    
    await this.log('Watchdog fully operational - 24/7 monitoring active', 'INFO');
  }

  async startComponent(componentId) {
    const component = this.components.get(componentId);
    if (!component) return false;

    try {
      await this.log(`Starting ${component.name}...`, 'INFO');
      
      let process;
      if (component.scriptPath) {
        process = spawn('node', [component.scriptPath], {
          stdio: 'pipe',
          detached: false
        });
      } else if (component.command) {
        process = spawn('npm', component.command.split(' ').slice(1), {
          cwd: path.join(__dirname, '..', '..'),
          stdio: 'pipe',
          detached: false
        });
      }

      if (!process) {
        throw new Error('Failed to spawn process');
      }

      component.process = process;
      component.pid = process.pid;
      
      // Handle process output
      process.stdout.on(_'data', _(data) => {
        this.log(`[${component.name}] ${data.toString().trim()}`, 'DEBUG');
      });

      process.stderr.on(_'data', _(data) => {
        this.log(`[${component.name}] ERROR: ${data.toString().trim()}`, 'ERROR');
      });

      // Handle process exit
      process.on(_'exit', async (code, signal) => {
        await this.log(`${component.name} exited with code ${code}, signal ${signal}`, 'WARN');
        component.process = null;
        component.pid = null;
        
        // Auto-restart if not intentional shutdown
        if (code !== 0 && !this.isShuttingDown) {
          await this.handleComponentFailure(componentId);
        }
      });

      process.on(_'error', async _(error) => {
        await this.log(`${component.name} process error: ${error.message}`, 'ERROR');
        await this.handleComponentFailure(componentId);
      });

      await this.log(`${component.name} started successfully (PID: ${process.pid})`, 'INFO');
      return true;
      
    } catch (error) {
      await this.log(`Failed to start ${component.name}: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async handleComponentFailure(componentId) {
    const component = this.components.get(componentId);
    if (!component) return;

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Reset restart count if last restart was over an hour ago
    if (component.lastRestart && (now - component.lastRestart) > oneHour) {
      component.restartCount = 0;
    }

    component.restartCount++;
    component.lastRestart = now;

    await this.log(`Component failure: ${component.name} (restart #${component.restartCount})`, 'WARN');

    if (component.restartCount >= component.maxRestarts) {
      await this.log(`${component.name} exceeded max restarts, marking as failed`, 'ERROR');
      component.isFailed = true;
      
      // Trigger emergency recovery if essential component
      if (component.isEssential) {
        await this.triggerEmergencyRecovery(componentId);
      }
      return;
    }

    // Exponential backoff delay
    const delay = Math.min(5000 * Math.pow(2, component.restartCount - 1), 60000);
    await this.log(`Restarting ${component.name} in ${delay}ms...`, 'INFO');
    
    setTimeout(async _() => {
      const success = await this.startComponent(componentId);
      if (!success) {
        await this.handleComponentFailure(componentId);
      }
    }, delay);
  }

  async triggerEmergencyRecovery(componentId) {
    const component = this.components.get(componentId);
    await this.log(`EMERGENCY RECOVERY: ${component.name} - attempting system-level recovery`, 'CRITICAL');
    
    try {
      // Kill any zombie processes
      if (component.pid) {
        try {
          process.kill(component.pid, 'SIGKILL');
        } catch (error) {
          // Process might already be dead
        }
      }

      // Clear component state
      component.process = null;
      component.pid = null;
      component.restartCount = 0;
      component.isFailed = false;

      // Wait longer before restart
      await this.delay(10000);

      // Attempt final restart
      const success = await this.startComponent(componentId);
      if (success) {
        await this.log(`Emergency recovery successful for ${component.name}`, 'INFO');
      } else {
        await this.log(`Emergency recovery failed for ${component.name} - manual intervention required`, 'CRITICAL');
      }
      
    } catch (error) {
      await this.log(`Emergency recovery error: ${error.message}`, 'CRITICAL');
    }
  }

  startHealthMonitoring() {
    // Check component health every 30 seconds
    setInterval(async _() => {
      await this.performHealthCheck();
    }, 30000);

    // Detailed health check every 5 minutes
    setInterval(async _() => {
      await this.performDetailedHealthCheck();
    }, 300000);
  }

  async performHealthCheck() {
    this.lastHealthCheck = new Date().toISOString();
    const healthStatus = { healthy: 0, unhealthy: 0, components: {} };

    for (const [id, component] of this.components) {
      const isHealthy = await this.checkComponentHealth(id);
      healthStatus.components[id] = {
        name: component.name,
        healthy: isHealthy,
        pid: component.pid,
        restartCount: component.restartCount,
        lastRestart: component.lastRestart
      };

      if (isHealthy) {
        healthStatus.healthy++;
      } else {
        healthStatus.unhealthy++;
        
        if (component.isEssential && !component.isFailed) {
          await this.log(`Health check failed for ${component.name} - investigating`, 'WARN');
          await this.investigateComponentHealth(id);
        }
      }
    }

    // Save health status
    await this.saveHealthStatus(healthStatus);
    
    return healthStatus;
  }

  async checkComponentHealth(componentId) {
    const component = this.components.get(componentId);
    if (!component || component.isFailed) return false;

    // Check if process exists
    if (!component.process || !component.pid) return false;

    try {
      // Check if process is still running
      process.kill(component.pid, 0);
      
      // Component-specific health checks
      switch (componentId) {
        case 'scheduler':
          return await this.checkSchedulerHealth();
        case 'monitoring':
          return await this.checkMonitoringHealth();
        case 'mainApp':
          return await this.checkMainAppHealth();
        default:
          return true; // Process exists = healthy
      }
    } catch (error) {
      // Process doesn't exist
      return false;
    }
  }

  async checkSchedulerHealth() {
    try {
      // Check if scheduler log is being updated (should update every 10 minutes)
      const logPath = path.join(__dirname, '..', '..', 'tests', 'autonomous', 'logs', 'scheduler.log');
      const stats = await fs.stat(logPath).catch(() => null);
      
      if (!stats) return false;
      
      const now = Date.now();
      const lastModified = stats.mtime.getTime();
      const minutesSinceUpdate = (now - lastModified) / (1000 * 60);
      
      // Healthy if updated within last 15 minutes (allowing some delay)
      return minutesSinceUpdate < 15;
    } catch (error) {
      return false;
    }
  }

  async checkMonitoringHealth() {
    try {
      // Check if monitoring server responds to health check
      const response = await fetch('http://localhost:6000/health', {
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async checkMainAppHealth() {
    try {
      // Check if main app API responds
      const response = await fetch('http://localhost:5000/api/health', {
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async investigateComponentHealth(componentId) {
    const component = this.components.get(componentId);
    await this.log(`Investigating ${component.name} health issues...`, 'INFO');
    
    // Check system resources
    const resourceUsage = await this.getResourceUsage();
    
    if (resourceUsage.memoryPercent > 90) {
      await this.log(`High memory usage detected: ${resourceUsage.memoryPercent}%`, 'WARN');
      await this.handleHighMemoryUsage();
    }
    
    if (resourceUsage.cpuPercent > 80) {
      await this.log(`High CPU usage detected: ${resourceUsage.cpuPercent}%`, 'WARN');
    }

    // Check disk space
    if (resourceUsage.diskPercent > 90) {
      await this.log(`Low disk space detected: ${resourceUsage.diskPercent}% used`, 'WARN');
      await this.cleanupLogFiles();
    }
  }

  startResourceMonitoring() {
    // Monitor resources every 2 minutes
    setInterval(async _() => {
      const resources = await this.getResourceUsage();
      await this.logResourceUsage(resources);
      
      if (resources.memoryPercent > 85) {
        await this.handleHighMemoryUsage();
      }
    }, 120000);
  }

  async getResourceUsage() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Get system memory info (Windows specific)
    return new Promise((resolve) => {
      exec('wmic OS get _TotalVisibleMemorySize,FreePhysicalMemory _/value', _(error, stdout) => {
        let memoryPercent = 0;
        
        if (!error) {
          const lines = stdout.split('\n').filter(line => line.includes('='));
          const total = parseInt(lines.find(l => l.includes('TotalVisibleMemorySize'))?.split('=')[1] || 0);
          const free = parseInt(lines.find(l => l.includes('FreePhysicalMemory'))?.split('=')[1] || 0);
          
          if (total > 0) {
            memoryPercent = Math.round(((total - free) / total) * 100);
          }
        }
        
        resolve({
          memoryPercent,
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          cpuPercent: 0, // Simplified for now
          diskPercent: 0 // Simplified for now
        });
      });
    });
  }

  async handleHighMemoryUsage() {
    await this.log('High memory usage detected - triggering cleanup', 'WARN');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Clean up old log files
    await this.cleanupLogFiles();
  }

  async cleanupLogFiles() {
    try {
      const logsDir = path.join(__dirname, '..', '..', 'tests', 'autonomous', 'logs');
      const files = await fs.readdir(logsDir);
      
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      
      let cleanedFiles = 0;
      
      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);
        
        // Delete files older than 1 week, except the latest of each type
        if ((now - stats.mtime.getTime()) > oneWeek && !file.includes('latest')) {
          await fs.unlink(filePath);
          cleanedFiles++;
        }
      }
      
      if (cleanedFiles > 0) {
        await this.log(`Cleaned up ${cleanedFiles} old log files`, 'INFO');
      }
    } catch (error) {
      await this.log(`Log cleanup error: ${error.message}`, 'WARN');
    }
  }

  async performDetailedHealthCheck() {
    await this.log('Performing detailed system health check...', 'INFO');
    
    const healthReport = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.watchdogStartTime,
      components: {},
      resources: await this.getResourceUsage(),
      systemStatus: 'healthy'
    };

    // Check each component in detail
    for (const [id, component] of this.components) {
      const health = await this.getDetailedComponentHealth(id);
      healthReport.components[id] = health;
      
      if (!health.healthy && component.isEssential) {
        healthReport.systemStatus = 'degraded';
      }
    }

    // Save detailed report
    await this.saveDetailedHealthReport(healthReport);
    
    return healthReport;
  }

  async getDetailedComponentHealth(componentId) {
    const component = this.components.get(componentId);
    const basic = await this.checkComponentHealth(componentId);
    
    return {
      healthy: basic,
      pid: component.pid,
      restartCount: component.restartCount,
      lastRestart: component.lastRestart,
      isFailed: component.isFailed,
      isEssential: component.isEssential
    };
  }

  async saveHealthStatus(status) {
    try {
      const statusPath = path.join(__dirname, '..', '..', 'tests', 'autonomous', 'logs', 'health-status.json');
      await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
    } catch (error) {
      await this.log(`Failed to save health status: ${error.message}`, 'ERROR');
    }
  }

  async saveDetailedHealthReport(report) {
    try {
      const reportsDir = path.join(__dirname, '..', '..', 'tests', 'autonomous', 'health-reports');
      await fs.mkdir(reportsDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(reportsDir, `health-report-${timestamp}.json`);
      
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      // Also save as latest
      const latestPath = path.join(reportsDir, 'latest-health-report.json');
      await fs.writeFile(latestPath, JSON.stringify(report, null, 2));
      
    } catch (error) {
      await this.log(`Failed to save health report: ${error.message}`, 'ERROR');
    }
  }

  async logResourceUsage(resources) {
    if (resources.memoryPercent > 0) {
      await this.log(`Resource usage - Memory: ${resources.memoryPercent}%, Heap: ${resources.heapUsed}/${resources.heapTotal}MB`, 'DEBUG');
    }
  }

  setupShutdownHandlers() {
    const shutdown = async (signal) => {
      await this.log(`Received ${signal} - shutting down watchdog...`, 'INFO');
      this.isShuttingDown = true;
      
      // Stop all managed components
      for (const [id, component] of this.components) {
        if (component.process) {
          await this.log(`Stopping ${component.name}...`, 'INFO');
          try {
            component.process.kill('SIGTERM');
            
            // Force kill after 10 seconds
            setTimeout(_() => {
              if (component.process) {
                component.process.kill('SIGKILL');
              }
            }, 10000);
          } catch (error) {
            await this.log(`Error stopping ${component.name}: ${error.message}`, 'ERROR');
          }
        }
      }
      
      await this.log('Watchdog shutdown complete', 'INFO');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGQUIT', shutdown);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [WATCHDOG] [${level}] ${message}\n`;
    
    logDebug(logEntry.trim());
    
    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.logFile);
      await fs.mkdir(logDir, { recursive: true });
      
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      logError('Failed to write to log file:', error);
    }
  }

  // Public API for external monitoring
  getStatus() {
    const components = {};
    for (const [id, component] of this.components) {
      components[id] = {
        name: component.name,
        running: !!component.process,
        pid: component.pid,
        healthy: !component.isFailed,
        restartCount: component.restartCount,
        lastRestart: component.lastRestart
      };
    }
    
    return {
      watchdogUptime: Date.now() - this.watchdogStartTime,
      lastHealthCheck: this.lastHealthCheck,
      components,
      isShuttingDown: this.isShuttingDown
    };
  }
}

// Start the watchdog
const watchdog = new AutonomousWatchdog();

// Export for testing
export default AutonomousWatchdog;