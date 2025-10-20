#!/usr/bin/env node

/**
 * MCP Server Startup Script
 * 
 * Production-ready startup script for the CapLiquify MCP Server
 * with comprehensive initialization, health checks, and monitoring.
 */

import { SentiaMCPServer } from '../src/server.js';
import { CONFIG, validateConfig } from '../src/config/server-config.js';
import { globalErrorHandler } from '../src/utils/error-handler.js';
import { createLogger } from '../src/utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger();

/**
 * Pre-flight checks before starting the server
 */
async function performPreflightChecks() {
  logger.info('Performing preflight checks...');

  // 1. Validate configuration
  try {
    validateConfig();
    logger.info('Configuration validation passed');
  } catch (error) {
    logger.error('Configuration validation failed', { error: error.message });
    process.exit(1);
  }

  // 2. Check required directories
  const requiredDirs = [
    CONFIG.logging.file.directory,
    CONFIG.resources.tempDirectory,
    'tools'
  ];

  for (const dir of requiredDirs) {
    const dirPath = join(process.cwd(), dir);
    if (!existsSync(dirPath)) {
      try {
        mkdirSync(dirPath, { recursive: true });
        logger.info('Created directory', { directory: dirPath });
      } catch (error) {
        logger.error('Failed to create directory', { 
          directory: dirPath, 
          error: error.message 
        });
        process.exit(1);
      }
    }
  }

  // 3. Check environment variables for production
  if (CONFIG.server.environment === 'production') {
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET'
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
      logger.error('Missing required environment variables for production', { 
        missing 
      });
      process.exit(1);
    }
  }

  // 4. Test database connectivity
  if (CONFIG.database.url) {
    try {
      const { Pool } = await import('pg');
      const testPool = new Pool({
        connectionString: CONFIG.database.url,
        max: 1,
        connectionTimeoutMillis: 5000
      });

      const client = await testPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      await testPool.end();
      
      logger.info('Database connectivity test passed');
    } catch (error) {
      logger.error('Database connectivity test failed', { 
        error: error.message 
      });
      
      if (CONFIG.server.environment === 'production') {
        process.exit(1);
      } else {
        logger.warn('Continuing without database in non-production environment');
      }
    }
  }

  logger.info('All preflight checks passed');
}

/**
 * Display startup banner with configuration summary
 */
function displayStartupBanner() {
  const banner = `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║    🏭 CapLiquify MCP Server v${CONFIG.server.version.padEnd(8)}           ║
║                                                                ║
║    Environment: ${CONFIG.server.environment.padEnd(12)} Transport: ${(CONFIG.transport.type || 'dual').padEnd(8)}    ║
║    Port: ${CONFIG.server.port.toString().padEnd(8)} Host: ${CONFIG.server.host.padEnd(15)}           ║
║                                                                ║
║    🔧 Model Context Protocol Server for Manufacturing         ║
║    🤖 AI-Powered Business Intelligence & Automation           ║
║    📊 Real-time Analytics & Optimization                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;

  console.log(banner);
  
  logger.info('Starting MCP Server', {
    version: CONFIG.server.version,
    environment: CONFIG.server.environment,
    port: CONFIG.server.port,
    host: CONFIG.server.host,
    transport: CONFIG.transport.type,
    pid: process.pid
  });
}

/**
 * Set up process monitoring and health checks
 */
function setupProcessMonitoring(server) {
  // Memory monitoring
  const memoryCheckInterval = setInterval(() => {
    const usage = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };

    // Log warning if memory usage is high
    if (memoryMB.heapUsed > 1000) { // 1GB threshold
      logger.warn('High memory usage detected', { memory: memoryMB });
    }

    // Log memory stats every 5 minutes in debug mode
    if (CONFIG.logging.level === 'debug') {
      logger.debug('Memory usage', { memory: memoryMB });
    }
  }, 60000); // Check every minute

  // CPU monitoring
  let lastCpuUsage = process.cpuUsage();
  const cpuCheckInterval = setInterval(() => {
    const currentUsage = process.cpuUsage(lastCpuUsage);
    lastCpuUsage = process.cpuUsage();

    const cpuPercent = {
      user: Math.round((currentUsage.user / 1000000) * 100) / 100, // Convert to seconds
      system: Math.round((currentUsage.system / 1000000) * 100) / 100
    };

    if (CONFIG.logging.level === 'debug') {
      logger.debug('CPU usage', { cpu: cpuPercent });
    }
  }, 60000);

  // Cleanup on shutdown
  process.on('SIGTERM', () => {
    clearInterval(memoryCheckInterval);
    clearInterval(cpuCheckInterval);
  });

  process.on('SIGINT', () => {
    clearInterval(memoryCheckInterval);
    clearInterval(cpuCheckInterval);
  });
}

/**
 * Set up uncaught exception and rejection handlers
 */
function setupErrorHandlers() {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception - Server will exit', {
      error: error.message,
      stack: error.stack,
      pid: process.pid
    });
    
    // Give logger time to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
      pid: process.pid
    });
    
    // Don't exit on unhandled rejections in production, just log
    if (CONFIG.server.environment !== 'production') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });

  process.on('warning', (warning) => {
    logger.warn('Node.js Warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });
}

/**
 * Health check endpoint for load balancers
 */
async function setupHealthChecks(server) {
  // Simple HTTP health check on different port
  const healthPort = CONFIG.server.port + 100;
  
  try {
    const express = await import('express');
    const healthApp = express.default();
    
    healthApp.get('/health', async (req, res) => {
      try {
        const status = await server.getSystemStatus({
          includeMetrics: false,
          includeConnections: false
        });
        
        if (status.status === 'healthy') {
          res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        } else {
          res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
        }
      } catch (error) {
        res.status(503).json({ 
          status: 'error', 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    healthApp.listen(healthPort, () => {
      logger.info('Health check endpoint started', { port: healthPort });
    });
  } catch (error) {
    logger.warn('Failed to start health check endpoint', { error: error.message });
  }
}

/**
 * Main startup function
 */
async function startServer() {
  try {
    // Display banner
    displayStartupBanner();
    
    // Setup error handlers early
    setupErrorHandlers();
    
    // Perform preflight checks
    await performPreflightChecks();
    
    // Create and start server
    logger.info('Initializing MCP Server...');
    const server = new SentiaMCPServer();
    
    // Setup monitoring
    setupProcessMonitoring(server);
    
    // Setup health checks
    await setupHealthChecks(server);
    
    // Start the server
    const httpServer = await server.start();
    
    logger.info('MCP Server started successfully', {
      port: CONFIG.server.port,
      environment: CONFIG.server.environment,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    });
    
    // Log startup completion
    const startupTime = process.uptime() * 1000;
    logger.info('Startup completed', {
      startupTime: `${Math.round(startupTime)}ms`,
      memoryUsage: process.memoryUsage(),
      availableTools: server.tools?.size || 0
    });
    
    // Graceful shutdown handling
    const shutdown = async (signal) => {
      logger.info('Received shutdown signal', { signal });
      
      try {
        // Stop accepting new connections
        httpServer.close(() => {
          logger.info('HTTP server closed');
        });
        
        // Wait a moment for existing requests to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      }
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    return server;
    
  } catch (error) {
    const mcpError = globalErrorHandler.handle(error, { operation: 'server_startup' });
    
    logger.error('Failed to start MCP Server', {
      error: mcpError.toJSON()
    });
    
    process.exit(1);
  }
}

/**
 * CLI argument parsing
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--port':
        options.port = parseInt(args[++i]);
        break;
      case '--env':
      case '--environment':
        options.environment = args[++i];
        break;
      case '--log-level':
        options.logLevel = args[++i];
        break;
      case '--config':
        options.configFile = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node start-mcp-server.js [options]

Options:
  --port <number>        Server port (default: 3001)
  --env <environment>    Environment (development|testing|production)
  --log-level <level>    Log level (debug|info|warn|error)
  --config <file>        Configuration file path
  --help, -h             Show this help message

Environment Variables:
  MCP_SERVER_PORT        Server port
  NODE_ENV              Environment
  LOG_LEVEL             Logging level
  DATABASE_URL          PostgreSQL connection string
  JWT_SECRET            JWT signing secret
  
Examples:
  node start-mcp-server.js
  node start-mcp-server.js --port 3001 --env production
  node start-mcp-server.js --log-level debug
        `);
        process.exit(0);
        break;
    }
  }
  
  return options;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArguments();
  
  // Override config with CLI options
  if (options.port) CONFIG.server.port = options.port;
  if (options.environment) CONFIG.server.environment = options.environment;
  if (options.logLevel) CONFIG.logging.level = options.logLevel;
  
  // Start the server
  startServer().catch((error) => {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  });
}

export { startServer, performPreflightChecks };