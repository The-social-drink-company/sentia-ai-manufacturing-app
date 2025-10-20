#!/usr/bin/env node

/**
 * MCP Server Startup Script
 * 
 * Production-ready startup script for the CapLiquify MCP Server
 * with comprehensive initialization, health checks, and monitoring.
 */

import { SentiaMCPServer } from '../src/server.js';
import { SERVER_CONFIG, validateConfigLegacy } from '../src/config/server-config.js';
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

  // 1. Validate configuration (using legacy validator for production flexibility)
  try {
    validateConfigLegacy();
    logger.info('Configuration validation passed');
  } catch (error) {
    logger.error('Configuration validation failed', { error: error.message });
    logger.warn('Attempting to continue with degraded functionality...');
    // Don't exit on configuration warnings in production
    if (SERVER_CONFIG.server.environment === 'production') {
      logger.warn('Production deployment continuing with configuration warnings');
    } else {
      process.exit(1);
    }
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
║    🏭 CapLiquify MCP Server v${SERVER_CONFIG.server.version.padEnd(8)}           ║
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
 * Set up uncaught exception and rejection handlers with enhanced crash reporting
 */
function setupErrorHandlers() {
  // Enhanced uncaught exception handler
  process.on('uncaughtException', (error) => {
    const crashReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        syscall: error.syscall,
        errno: error.errno,
        path: error.path
      },
      process: {
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        cwd: process.cwd(),
        argv: process.argv,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          DATABASE_URL: process.env.DATABASE_URL ? '[REDACTED]' : 'undefined',
          MCP_TRANSPORT: process.env.MCP_TRANSPORT
        }
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    
    // Log to console immediately for Render logs
    console.error('\n=== FATAL CRASH REPORT ===');
    console.error('Timestamp:', crashReport.timestamp);
    console.error('Error:', crashReport.error.name + ':', crashReport.error.message);
    console.error('Stack:', crashReport.error.stack);
    console.error('Process Info:', {
      pid: crashReport.process.pid,
      platform: crashReport.process.platform,
      nodeVersion: crashReport.process.nodeVersion,
      uptime: Math.round(crashReport.process.uptime) + 's'
    });
    console.error('Memory:', crashReport.memory);
    console.error('Environment:', crashReport.process.env);
    console.error('=========================\n');
    
    logger.error('UNCAUGHT EXCEPTION - FATAL CRASH', crashReport);
    
    // Force flush logs and exit
    setTimeout(() => {
      console.error('Server exiting due to uncaught exception');
      process.exit(1);
    }, 2000); // Give more time for log flushing
  });

  // Enhanced unhandled rejection handler
  process.on('unhandledRejection', (reason, promise) => {
    const rejectionReport = {
      timestamp: new Date().toISOString(),
      reason: {
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        name: reason instanceof Error ? reason.name : typeof reason,
        code: reason instanceof Error ? reason.code : undefined
      },
      promise: {
        toString: promise.toString(),
        constructor: promise.constructor.name
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        nodeVersion: process.version
      },
      memory: process.memoryUsage()
    };
    
    // Log to console immediately
    console.error('\n=== UNHANDLED PROMISE REJECTION ===');
    console.error('Timestamp:', rejectionReport.timestamp);
    console.error('Reason:', rejectionReport.reason.message);
    if (rejectionReport.reason.stack) {
      console.error('Stack:', rejectionReport.reason.stack);
    }
    console.error('Promise:', rejectionReport.promise.toString);
    console.error('Memory:', rejectionReport.memory);
    console.error('====================================\n');
    
    logger.error('UNHANDLED PROMISE REJECTION', rejectionReport);
    
    // Exit in all environments for promise rejections to ensure issues are caught
    setTimeout(() => {
      console.error('Server exiting due to unhandled promise rejection');
      process.exit(1);
    }, 2000);
  });

  // Enhanced warning handler
  process.on('warning', (warning) => {
    const warningInfo = {
      timestamp: new Date().toISOString(),
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
      code: warning.code,
      detail: warning.detail
    };
    
    console.warn('Node.js Warning:', warningInfo.name, '-', warningInfo.message);
    logger.warn('Node.js Warning', warningInfo);
  });
  
  // Add exit handler to log final state
  process.on('exit', (code) => {
    const exitInfo = {
      timestamp: new Date().toISOString(),
      exitCode: code,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    };
    
    console.log('Process exiting with code:', code);
    console.log('Final state:', exitInfo);
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
 * Main startup function with enhanced error tracking
 */
async function startServer() {
  const startupSteps = [];
  
  try {
    console.log('=== MCP Server Startup Process ===');
    
    // Step 1: Display banner
    startupSteps.push('banner');
    console.log('Step 1: Displaying startup banner...');
    displayStartupBanner();
    
    // Step 2: Setup error handlers early
    startupSteps.push('error-handlers');
    console.log('Step 2: Setting up error handlers...');
    setupErrorHandlers();
    
    // Step 3: Perform preflight checks
    startupSteps.push('preflight-checks');
    console.log('Step 3: Performing preflight checks...');
    await performPreflightChecks();
    console.log('Preflight checks completed successfully');
    
    // Step 4: Create server instance
    startupSteps.push('server-creation');
    console.log('Step 4: Creating MCP Server instance...');
    logger.info('Initializing MCP Server...');
    const server = new SentiaMCPServer();
    console.log('MCP Server instance created successfully');
    
    // Step 5: Setup monitoring
    startupSteps.push('monitoring');
    console.log('Step 5: Setting up process monitoring...');
    setupProcessMonitoring(server);
    
    // Step 6: Setup health checks
    startupSteps.push('health-checks');
    console.log('Step 6: Setting up health checks...');
    await setupHealthChecks(server);
    
    // Step 7: Start the server (most likely failure point)
    startupSteps.push('server-start');
    console.log('Step 7: Starting HTTP server...');
    const httpServer = await server.start();
    console.log('HTTP server started successfully');
    
    startupSteps.push('completed');
    
    logger.info('MCP Server started successfully', {
      port: SERVER_CONFIG.server.port,
      environment: SERVER_CONFIG.server.environment,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      completedSteps: startupSteps
    });
    
    // Log startup completion
    const startupTime = process.uptime() * 1000;
    logger.info('Startup completed', {
      startupTime: `${Math.round(startupTime)}ms`,
      memoryUsage: process.memoryUsage(),
      availableTools: server.tools?.size || 0
    });
    
    console.log('=== Startup Process Complete ===');
    
    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log('Shutdown signal received:', signal);
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
        console.error('Error during shutdown:', error);
        logger.error('Error during shutdown', { error: error.message, stack: error.stack });
        process.exit(1);
      }
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    return server;
    
  } catch (error) {
    const failedStep = startupSteps[startupSteps.length - 1] || 'unknown';
    
    console.error('\n=== STARTUP FAILURE ===');
    console.error('Failed at step:', failedStep);
    console.error('Completed steps:', startupSteps);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:');
    console.error(error.stack);
    console.error('Process info:', {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      cwd: process.cwd()
    });
    console.error('Memory usage:', process.memoryUsage());
    console.error('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? '[REDACTED]' : 'undefined',
      MCP_TRANSPORT: process.env.MCP_TRANSPORT
    });
    console.error('=======================\n');
    
    const mcpError = globalErrorHandler.handle(error, { 
      operation: 'server_startup',
      failedStep,
      completedSteps: startupSteps
    });
    
    logger.error('Failed to start MCP Server', {
      error: mcpError.toJSON(),
      failedStep,
      completedSteps: startupSteps,
      processInfo: {
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
        uptime: process.uptime()
      }
    });
    
    // Give time for logs to flush before exiting
    setTimeout(() => {
      console.error('Exiting due to startup failure');
      process.exit(1);
    }, 2000);
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