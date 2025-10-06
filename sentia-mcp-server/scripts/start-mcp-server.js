#!/usr/bin/env node

/**
 * MCP Server Startup Script
 * 
 * Production-ready startup script for the Sentia Manufacturing MCP Server
 * with comprehensive initialization, health checks, and monitoring.
 */

import { SentiaMCPServer } from '../src/server.js';
import { SERVER_CONFIG, validateConfig } from '../src/config/server-config.js';
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
    SERVER_CONFIG.logging.file.directory,
    SERVER_CONFIG.resources.tempDirectory,
    'src/tools'
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
  if (SERVER_CONFIG.server.environment === 'production') {
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

  // 4. Test database connectivity (optional)
  if (SERVER_CONFIG.database.url) {
    try {
      const { Pool } = await import('pg');
      const testPool = new Pool({
        connectionString: SERVER_CONFIG.database.url,
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
      
      // UPDATED: Be more permissive in production - log error but continue
      // Many integrations can work without database
      if (SERVER_CONFIG.server.environment === 'production') {
        logger.warn('Production deployment continuing without database - some features may be limited');
      } else {
        logger.warn('Continuing without database in non-production environment');
      }
    }
  } else {
    logger.warn('No database URL configured - running without database functionality');
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
║    🏭 Sentia Manufacturing MCP Server v${SERVER_CONFIG.server.version.padEnd(8)}           ║
║                                                                ║
║    Environment: ${SERVER_CONFIG.server.environment.padEnd(12)} Transport: ${(SERVER_CONFIG.transport.type || 'dual').padEnd(8)}    ║
║    Port: ${SERVER_CONFIG.server.port.toString().padEnd(8)} Host: ${SERVER_CONFIG.server.host.padEnd(15)}           ║
║                                                                ║
║    🔧 Model Context Protocol Server for Manufacturing         ║
║    🤖 AI-Powered Business Intelligence & Automation           ║
║    📊 Real-time Analytics & Optimization                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;

  console.log(banner);
  
  logger.info('Starting MCP Server', {
    version: SERVER_CONFIG.server.version,
    environment: SERVER_CONFIG.server.environment,
    port: SERVER_CONFIG.server.port,
    host: SERVER_CONFIG.server.host,
    transport: SERVER_CONFIG.transport.type,
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
    if (SERVER_CONFIG.logging.level === 'debug') {
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

    if (SERVER_CONFIG.logging.level === 'debug') {
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
    if (SERVER_CONFIG.server.environment !== 'production') {
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
 * Setup health monitoring (using main server's health endpoint)
 */
async function setupHealthChecks(server) {
  // Health checks are handled by the main server's /health endpoint
  // No need for separate health check server
  logger.info('Health checks configured', { 
    endpoint: `http://localhost:${SERVER_CONFIG.server.port}/health`,
    port: SERVER_CONFIG.server.port 
  });
  
  // Validate server health endpoint is working
  try {
    const status = await server.getSystemStatus({
      includeMetrics: false,
      includeConnections: false
    });
    logger.info('Health check validation passed', { status: status.status });
  } catch (error) {
    logger.warn('Health check validation failed', { error: error.message });
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
      port: SERVER_CONFIG.server.port,
      environment: SERVER_CONFIG.server.environment,
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
  if (options.port) SERVER_CONFIG.server.port = options.port;
  if (options.environment) SERVER_CONFIG.server.environment = options.environment;
  if (options.logLevel) SERVER_CONFIG.logging.level = options.logLevel;
  
  // Start the server
  startServer().catch((error) => {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  });
}

export { startServer, performPreflightChecks };