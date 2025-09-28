#!/usr/bin/env node

/**
 * RENDER START SCRIPT - ENTERPRISE OPTIMIZED
 * Fortune 500-Level Server Startup for Sentia Manufacturing Dashboard
 * Handles graceful startup, health checks, and monitoring
 */

import { spawn, execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Startup Configuration
const STARTUP_CONFIG = {
  production: {
    memoryLimit: 2048,
    gcInterval: 300000, // 5 minutes
    healthCheckInterval: 30000, // 30 seconds
    maxRestarts: 3,
    restartDelay: 5000
  },
  testing: {
    memoryLimit: 1536,
    gcInterval: 180000, // 3 minutes
    healthCheckInterval: 15000, // 15 seconds
    maxRestarts: 5,
    restartDelay: 3000
  },
  development: {
    memoryLimit: 1024,
    gcInterval: 120000, // 2 minutes
    healthCheckInterval: 10000, // 10 seconds
    maxRestarts: 10,
    restartDelay: 1000
  },
  hotfix: {
    memoryLimit: 1024,
    gcInterval: 300000, // 5 minutes
    healthCheckInterval: 30000, // 30 seconds
    maxRestarts: 3,
    restartDelay: 5000
  }
};

const NODE_ENV = process.env.NODE_ENV || 'production';
const BRANCH = process.env.BRANCH || 'production';
const PORT = process.env.PORT || 10000;

console.log(`
========================================
SENTIA MANUFACTURING - RENDER STARTUP
========================================
Environment: ${NODE_ENV}
Branch: ${BRANCH}
Port: ${PORT}
Memory Limit: ${STARTUP_CONFIG[NODE_ENV]?.memoryLimit || 2048}MB
Startup Time: ${new Date().toISOString()}
========================================
`);

class RenderStartupManager {
  constructor() {
    this.config = STARTUP_CONFIG[NODE_ENV] || STARTUP_CONFIG.production;
    this.restartCount = 0;
    this.serverProcess = null;
    this.healthCheckTimer = null;
    this.gcTimer = null;
    this.startTime = Date.now();
    this.isShuttingDown = false;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async preStartupChecks() {
    this.log('Performing pre-startup checks...');

    // Check if server file exists
    const serverFile = join(ROOT_DIR, 'server-enterprise-complete.js');
    if (!existsSync(serverFile)) {
      throw new Error('Server file not found: server-enterprise-complete.js');
    }

    // Check if build directory exists
    const buildDir = join(ROOT_DIR, 'dist');
    if (!existsSync(buildDir)) {
      this.log('Build directory not found, server will run without static files', 'warn');
    }

    // Check Node.js memory availability
    const memStats = process.memoryUsage();
    this.log(`Available memory: ${Math.round(memStats.heapTotal / 1024 / 1024)}MB`);

    // Verify environment variables
    this.checkEnvironmentVariables();

    this.log('Pre-startup checks completed', 'success');
  }

  checkEnvironmentVariables() {
    const requiredVars = ['NODE_ENV', 'PORT'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      this.log(`Missing environment variables: ${missingVars.join(', ')}`, 'warn');
    }

    // Check database URL
    if (!process.env.DATABASE_URL) {
      this.log('DATABASE_URL not set - database features may not work', 'warn');
    }

    // Check Clerk configuration
    if (!process.env.VITE_CLERK_PUBLISHABLE_KEY) {
      this.log('Clerk authentication not configured', 'warn');
    }

    this.log('Environment variable check completed');
  }

  async startServer() {
    this.log('Starting server...');

    const nodeOptions = [
      `--max-old-space-size=${this.config.memoryLimit}`,
      '--expose-gc'
    ];

    try {
      this.serverProcess = spawn('node', [
        ...nodeOptions,
        'server-enterprise-complete.js'
      ], {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_OPTIONS: nodeOptions.join(' ')
        }
      });

      this.serverProcess.on('error', (error) => {
        this.log(`Server process error: ${error.message}`, 'error');
        this.handleServerCrash();
      });

      this.serverProcess.on('exit', (code, signal) => {
        if (!this.isShuttingDown) {
          this.log(`Server exited with code ${code}, signal ${signal}`, 'warn');
          this.handleServerCrash();
        }
      });

      // Wait for server to start
      await this.waitForServerReady();

      this.log('Server started successfully', 'success');
      this.startMonitoring();

    } catch (error) {
      throw new Error(`Failed to start server: ${error.message}`);
    }
  }

  async waitForServerReady() {
    this.log('Waiting for server to be ready...');

    const maxAttempts = 30;
    const delay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Try to connect to health endpoint
        const response = await fetch(`http://localhost:${PORT}/health`);
        if (response.ok) {
          this.log('Server health check passed', 'success');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }

      if (attempt < maxAttempts) {
        this.log(`Server not ready, attempt ${attempt}/${maxAttempts}, retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Server failed to become ready within timeout period');
  }

  startMonitoring() {
    this.log('Starting monitoring systems...');

    // Health check monitoring
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // Garbage collection monitoring
    this.gcTimer = setInterval(() => {
      this.performGarbageCollection();
    }, this.config.gcInterval);

    // Memory usage monitoring
    setInterval(() => {
      this.logMemoryUsage();
    }, 60000); // Every minute

    this.log('Monitoring systems started', 'success');
  }

  async performHealthCheck() {
    try {
      const response = await fetch(`http://localhost:${PORT}/health`, {
        timeout: 5000
      });

      if (!response.ok) {
        this.log(`Health check failed: HTTP ${response.status}`, 'warn');
      }
    } catch (error) {
      this.log(`Health check error: ${error.message}`, 'warn');
    }
  }

  performGarbageCollection() {
    if (global.gc) {
      try {
        const before = process.memoryUsage();
        global.gc();
        const after = process.memoryUsage();

        const freedMemory = (before.heapUsed - after.heapUsed) / 1024 / 1024;
        if (freedMemory > 10) { // Only log if significant memory was freed
          this.log(`Garbage collection freed ${Math.round(freedMemory)}MB`);
        }
      } catch (error) {
        this.log(`Garbage collection error: ${error.message}`, 'warn');
      }
    }
  }

  logMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    // Log warning if memory usage is high
    if (heapUsedMB > this.config.memoryLimit * 0.8) {
      this.log(`High memory usage: ${heapUsedMB}MB/${this.config.memoryLimit}MB`, 'warn');
    }

    // Create memory report
    const memoryReport = {
      timestamp: new Date().toISOString(),
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      rss: rssMB,
      external: Math.round(usage.external / 1024 / 1024),
      uptime: Math.round((Date.now() - this.startTime) / 1000)
    };

    // Write memory report for monitoring
    try {
      writeFileSync(
        join(ROOT_DIR, 'memory-report.json'),
        JSON.stringify(memoryReport, null, 2)
      );
    } catch (error) {
      // Ignore write errors
    }
  }

  handleServerCrash() {
    if (this.isShuttingDown) return;

    this.restartCount++;
    this.log(`Server crashed, restart attempt ${this.restartCount}/${this.config.maxRestarts}`, 'warn');

    if (this.restartCount >= this.config.maxRestarts) {
      this.log('Maximum restart attempts reached, server will not restart', 'error');
      process.exit(1);
    }

    // Clean up timers
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    if (this.gcTimer) clearInterval(this.gcTimer);

    // Restart server after delay
    setTimeout(() => {
      this.log('Attempting server restart...');
      this.startServer().catch(error => {
        this.log(`Server restart failed: ${error.message}`, 'error');
        process.exit(1);
      });
    }, this.config.restartDelay);
  }

  setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach(signal => {
      process.on(signal, () => {
        this.log(`Received ${signal}, shutting down gracefully...`);
        this.shutdown();
      });
    });

    process.on('uncaughtException', (error) => {
      this.log(`Uncaught exception: ${error.message}`, 'error');
      this.shutdown();
    });

    process.on('unhandledRejection', (reason) => {
      this.log(`Unhandled rejection: ${reason}`, 'error');
      this.shutdown();
    });
  }

  shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.log('Initiating graceful shutdown...');

    // Clear monitoring timers
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    if (this.gcTimer) clearInterval(this.gcTimer);

    // Terminate server process
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');

      // Force kill after timeout
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          this.log('Force killing server process', 'warn');
          this.serverProcess.kill('SIGKILL');
        }
      }, 10000); // 10 second timeout
    }

    // Exit after cleanup
    setTimeout(() => {
      this.log('Shutdown complete');
      process.exit(0);
    }, 5000);
  }

  async generateStartupReport() {
    const report = {
      startupId: `startup-${Date.now()}`,
      environment: NODE_ENV,
      branch: BRANCH,
      port: PORT,
      config: this.config,
      startTime: new Date(this.startTime).toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch
    };

    try {
      writeFileSync(join(ROOT_DIR, 'startup-report.json'), JSON.stringify(report, null, 2));
      this.log('Startup report generated');
    } catch (error) {
      this.log('Failed to write startup report', 'warn');
    }

    return report;
  }
}

// Main startup execution
async function main() {
  const manager = new RenderStartupManager();

  try {
    await manager.preStartupChecks();
    manager.setupGracefulShutdown();
    await manager.startServer();
    await manager.generateStartupReport();

    console.log(`
========================================
STARTUP SUCCESSFUL ✅
========================================
Server is running on port ${PORT}
Environment: ${NODE_ENV}
Branch: ${BRANCH}
Health Check: http://localhost:${PORT}/health
========================================
    `);

    // Keep the process alive
    process.stdin.resume();

  } catch (error) {
    console.log(`
========================================
STARTUP FAILED ❌
========================================
Error: ${error.message}
Check startup logs above for details.
========================================
    `);

    process.exit(1);
  }
}

// Execute main function
main().catch(error => {
  console.error('Unexpected startup error:', error);
  process.exit(1);
});