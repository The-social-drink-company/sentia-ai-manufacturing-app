/**
 * Enterprise Process Manager
 * Handles port management, process lifecycle, and clean shutdowns
 */

import net from 'net';
import { spawn } from 'child_process';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

export class EnterpriseProcessManager {
  constructor() {
    this.activeProcesses = new Map();
    this.portBindings = new Map();
    this.shutdownHandlers = [];
    this.isShuttingDown = false;
  }

  // Check if a port is available
  async isPortAvailable(port, host = 'localhost') {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, host, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }

  // Find an available port starting from a preferred port
  async findAvailablePort(preferredPort, host = 'localhost', maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const port = preferredPort + i;
      const available = await this.isPortAvailable(port, host);
      
      if (available) {
        logInfo(`Found available port: ${port}`, {
          preferredPort,
          actualPort: port,
          attempts: i + 1
        });
        return port;
      }
    }
    
    throw new Error(`No available ports found starting from ${preferredPort} after ${maxAttempts} attempts`);
  }

  // Kill processes using a specific port (Windows)
  async killProcessOnPort(port) {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Find process using the port
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      
      if (!stdout.trim()) {
        logInfo(`No processes found using port ${port}`);
        return true;
      }
      
      // Extract PIDs
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          pids.add(pid);
        }
      }
      
      // Kill the processes
      for (const pid of pids) {
        try {
          await execAsync(`taskkill /F /PID ${pid}`);
          logInfo(`Killed process ${pid} using port ${port}`);
        } catch (error) {
          logWarn(`Failed to kill process ${pid}`, { error: error.message });
        }
      }
      
      // Wait a moment for ports to be freed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (error) {
      logError('Failed to kill processes on port', {
        port,
        error: error.message
      });
      return false;
    }
  }

  // Ensure a port is available, killing processes if necessary
  async ensurePortAvailable(port, host = 'localhost', forceKill = false) {
    const available = await this.isPortAvailable(port, host);
    
    if (available) {
      logInfo(`Port ${port} is available`);
      return port;
    }
    
    if (forceKill) {
      logWarn(`Port ${port} is in use, attempting to free it`);
      await this.killProcessOnPort(port);
      
      // Check if it's now available
      const nowAvailable = await this.isPortAvailable(port, host);
      if (nowAvailable) {
        logInfo(`Successfully freed port ${port}`);
        return port;
      }
    }
    
    // Try to find an alternative port
    logWarn(`Port ${port} unavailable, finding alternative`);
    return this.findAvailablePort(port, host);
  }

  // Start a server with proper port management
  async startServer(server, preferredPort, host = 'localhost', serviceName = 'server') {
    try {
      // Ensure port is available
      const port = await this.ensurePortAvailable(preferredPort, host, true);
      
      return new Promise((resolve, _reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Server ${serviceName} failed to start within 30 seconds`));
        }, 30000);
        
        server.listen(port, host, () => {
          clearTimeout(timeout);
          this.portBindings.set(serviceName, { port, host, server });
          
          logInfo(`${serviceName} started successfully`, {
            port,
            host,
            pid: process.pid
          });
          
          resolve({ port, host });
        });
        
        server.on(_'error', (error) => {
          clearTimeout(timeout);
          
          if (error.code === 'EADDRINUSE') {
            logError(`Port ${port} still in use for ${serviceName}`, {
              error: error.message,
              port,
              serviceName
            });
            
            // Try with a different port
            this.findAvailablePort(port + 1, host)
              .then(newPort => {
                _server.listen(newPort, host, () => {
                  this.portBindings.set(serviceName, { port: newPort, host, server });
                  resolve({ port: newPort, host });
                });
              })
              .catch(reject);
          } else {
            reject(error);
          }
        });
      });
    } catch (error) {
      logError(`Failed to start ${serviceName}`, {
        error: error.message,
        preferredPort,
        host
      });
      throw error;
    }
  }

  // Register a shutdown handler
  addShutdownHandler(name, handler) {
    this.shutdownHandlers.push({ name, handler });
    logInfo(`Registered shutdown handler: ${name}`);
  }

  // Execute graceful shutdown
  async gracefulShutdown(reason = 'unknown') {
    if (this.isShuttingDown) {
      logWarn('Shutdown already in progress');
      return;
    }
    
    this.isShuttingDown = true;
    logInfo(`Starting graceful shutdown`, { reason });
    
    const shutdownPromises = [];
    
    // Close all registered servers
    for (const [serviceName, binding] of this.portBindings.entries()) {
      shutdownPromises.push(
        this.closeServer(serviceName, binding.server)
      );
    }
    
    // Execute custom shutdown handlers
    for (const { name, handler } of this.shutdownHandlers) {
      shutdownPromises.push(
        this.executeShutdownHandler(name, handler)
      );
    }
    
    try {
      // Wait for all shutdowns to complete (with timeout)
      await Promise.race([
        Promise.all(shutdownPromises),
        new Promise((_, _reject) => 
          setTimeout(() => reject(new Error('Shutdown timeout')), 30000)
        )
      ]);
      
      logInfo('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logError('Graceful shutdown failed', { error: error.message });
      process.exit(1);
    }
  }

  async closeServer(serviceName, server) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        logWarn(`Server ${serviceName} shutdown timeout`);
        resolve();
      }, 15000);
      
      server.close(() => {
        clearTimeout(timeout);
        logInfo(`Server ${serviceName} closed`);
        resolve();
      });
    });
  }

  async executeShutdownHandler(name, handler) {
    try {
      logInfo(`Executing shutdown handler: ${name}`);
      await Promise.resolve(handler());
      logInfo(`Shutdown handler completed: ${name}`);
    } catch (error) {
      logError(`Shutdown handler failed: ${name}`, {
        error: error.message
      });
    }
  }

  // Setup process event handlers
  setupProcessHandlers() {
    process.on(_'SIGTERM', () => {
      logInfo('Received SIGTERM');
      this.gracefulShutdown('SIGTERM');
    });
    
    process.on(_'SIGINT', () => {
      logInfo('Received SIGINT (Ctrl+C)');
      this.gracefulShutdown('SIGINT');
    });
    
    process.on(_'uncaughtException', (error) => {
      logError('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      this.gracefulShutdown('uncaught_exception');
    });
    
    process.on(_'unhandledRejection', (reason, promise) => {
      logError('Unhandled rejection', {
        reason: reason?.message || reason,
        promise: promise.toString()
      });
      // Don't exit on unhandled rejections, just log them
    });
  }

  // Health check for process manager
  getHealthStatus() {
    const bindings = Array.from(this.portBindings.entries()).map(([name, binding]) => ({
      service: name,
      port: binding.port,
      host: binding.host,
      status: binding.server.listening ? 'listening' : 'closed'
    }));
    
    return {
      status: 'healthy',
      pid: process.pid,
      uptime: process.uptime(),
      shutdownHandlers: this.shutdownHandlers.length,
      portBindings: bindings,
      isShuttingDown: this.isShuttingDown
    };
  }

  // Development helper: clean start
  async cleanStart() {
    logInfo('Performing clean development start');
    
    // Common development ports to clean
    const commonPorts = [3000, 5000, 5001, 5002, 8000, 8080, 9000, 9001];
    
    for (const port of commonPorts) {
      const available = await this.isPortAvailable(port);
      if (!available) {
        logInfo(`Cleaning up port ${port}`);
        await this.killProcessOnPort(port);
      }
    }
    
    logInfo('Clean start completed');
  }

  // Resource monitoring
  monitorResources() {
    const interval = setInterval(() => {
      const memory = process.memoryUsage();
      const cpu = process.cpuUsage();
      
      // Log memory usage if it's high
      const memoryMB = Math.round(memory.heapUsed / 1024 / 1024);
      if (memoryMB > 512) { // More than 512MB
        logWarn('High memory usage detected', {
          heapUsedMB: memoryMB,
          heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
          rssMB: Math.round(memory.rss / 1024 / 1024)
        });
      }
      
      // Check for active port bindings
      for (const [serviceName, binding] of this.portBindings.entries()) {
        if (!binding.server.listening) {
          logWarn(`Service ${serviceName} is no longer listening on port ${binding.port}`);
        }
      }
    }, 60000); // Check every minute
    
    // Clean up interval on shutdown
    this.addShutdownHandler(_'resource-monitor', () => {
      clearInterval(interval);
    });
  }
}

// Create singleton instance
export const processManager = new EnterpriseProcessManager();

// Auto-setup process handlers
processManager.setupProcessHandlers();

export default processManager;