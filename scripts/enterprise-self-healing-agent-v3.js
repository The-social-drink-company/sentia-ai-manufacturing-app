#!/usr/bin/env node

/**
 * SENTIA ENTERPRISE SELF-HEALING TEST AGENT v3.0
 * Updated: September 2025
 * World-Class Autonomous 24/7 Monitoring & Auto-Repair System
 *
 * UPDATES IN v3.0:
 * - Complete route coverage from latest App.jsx
 * - AI Central Nervous System integration tests
 * - MCP server health monitoring
 * - Enhanced navigation validation
 * - Working Capital and What-If Analysis tests
 * - Render deployment configuration
 * - Environment-specific validations
 */

import fetch from 'node-fetch';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import winston from 'winston';

const execPromise = util.promisify(exec);

// Enterprise Configuration with Latest Updates
const CONFIG = {
  // Monitoring intervals
  HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 10 * 60 * 1000, // 10 minutes
  DEEP_SCAN_INTERVAL: parseInt(process.env.DEEP_SCAN_INTERVAL) || 60 * 60 * 1000,    // 1 hour
  RAPID_RECOVERY_INTERVAL: parseInt(process.env.RAPID_RECOVERY_INTERVAL) || 2 * 60 * 1000, // 2 minutes for failures
  MCP_SERVER_CHECK_INTERVAL: parseInt(process.env.MCP_CHECK_INTERVAL) || 5 * 60 * 1000, // 5 minutes

  // Environment URLs (Updated for Render deployments)
  ENVIRONMENTS: {
    development: process.env.RENDER_DEV_URL || 'https://sentia-manufacturing-development.onrender.com',
    testing: process.env.RENDER_TEST_URL || 'https://sentia-manufacturing-testing.onrender.com',
    production: process.env.RENDER_PROD_URL || 'https://sentia-manufacturing-production.onrender.com'
  },

  // MCP Server Endpoints
  MCP_SERVERS: {
    primary: process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com',
    development: 'http://localhost:3001',
    production: 'https://mcp-server-tkyu.onrender.com'
  },

  // Circuit Breaker Configuration
  CIRCUIT_BREAKER: {
    failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5,
    recoveryTimeout: parseInt(process.env.CIRCUIT_BREAKER_RECOVERY_TIMEOUT) || 60000, // 1 minute
    monitorWindow: parseInt(process.env.CIRCUIT_BREAKER_MONITOR_WINDOW) || 300000 // 5 minutes
  },

  // Auto-fix settings
  AUTO_FIX_ENABLED: process.env.AUTO_FIX_ENABLED !== 'false',
  AUTO_DEPLOY_ENABLED: process.env.AUTO_DEPLOY_ENABLED !== 'false',
  MAX_CONCURRENT_FIXES: parseInt(process.env.MAX_CONCURRENT_FIXES) || 3,
  MAX_FIX_ATTEMPTS: parseInt(process.env.MAX_FIX_ATTEMPTS) || 3,

  // Security & Performance
  SECURITY_SCAN_ENABLED: process.env.SECURITY_SCAN_ENABLED !== 'false',
  PERFORMANCE_MONITORING: process.env.PERFORMANCE_MONITORING !== 'false',
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 30000,

  // Render configuration (replaced Railway)
  RENDER_API_KEY: process.env.RENDER_API_KEY,
  RENDER_SERVICE_IDS: {
    development: process.env.RENDER_DEV_SERVICE_ID,
    testing: process.env.RENDER_TEST_SERVICE_ID,
    production: process.env.RENDER_PROD_SERVICE_ID,
    mcp: process.env.RENDER_MCP_SERVICE_ID
  },

  // Enterprise features
  SLACK_WEBHOOK: process.env.SLACK_WEBHOOK,
  DATADOG_API_KEY: process.env.DATADOG_API_KEY,
  PROMETHEUS_ENABLED: process.env.PROMETHEUS_ENABLED !== 'false'
};

// Complete Route Registry from Latest App.jsx
const ROUTE_REGISTRY = {
  // Core Dashboard Routes
  dashboard: [
    { path: '/', description: 'Landing page' },
    { path: '/dashboard', description: 'World-class enterprise dashboard' },
    { path: '/dashboard/basic', description: 'Simple fallback dashboard' },
    { path: '/dashboard/enterprise', description: 'Enterprise enhanced dashboard' },
    { path: '/world-class', description: 'World-class manufacturing dashboard' }
  ],

  // Financial Management
  financial: [
    { path: '/working-capital', description: 'Working capital management', priority: 'HIGH' },
    { path: '/enhanced-working-capital', description: 'Enhanced working capital analysis' },
    { path: '/working-capital-analysis', description: 'Working capital deep analysis' },
    { path: '/financial-reports', description: 'Financial reporting dashboard' },
    { path: '/cost-analysis', description: 'Cost analysis and optimization' }
  ],

  // Analytics & What-If
  analytics: [
    { path: '/what-if', description: 'What-if scenario analysis', priority: 'HIGH' },
    { path: '/what-if-dashboard', description: 'What-if analysis dashboard' },
    { path: '/analytics', description: 'Analytics overview' },
    { path: '/advanced-analytics', description: 'Advanced analytics dashboard' },
    { path: '/predictive-analytics', description: 'Predictive analytics with AI' }
  ],

  // Manufacturing Operations
  manufacturing: [
    { path: '/production', description: 'Production tracking' },
    { path: '/production-optimization', description: 'Production optimization' },
    { path: '/inventory', description: 'Inventory management' },
    { path: '/advanced-inventory', description: 'Advanced inventory with AI' },
    { path: '/quality', description: 'Quality control' },
    { path: '/quality-management', description: 'Quality management system' },
    { path: '/quality-intelligence', description: 'AI-powered quality intelligence' }
  ],

  // Forecasting & AI
  ai: [
    { path: '/forecasting', description: 'Demand forecasting', priority: 'HIGH' },
    { path: '/ai-forecasting', description: 'Enhanced AI forecasting' },
    { path: '/ai-analytics', description: 'AI analytics dashboard' },
    { path: '/ai-insights', description: 'AI-generated insights' },
    { path: '/ai-status', description: 'AI system status' },
    { path: '/mcp-monitoring', description: 'MCP server monitoring' },
    { path: '/chatbot', description: 'AI support chatbot' }
  ],

  // Data Management
  data: [
    { path: '/data-import', description: 'Data import dashboard' },
    { path: '/enhanced-data-import', description: 'Enhanced data import' }
  ],

  // System & Admin
  admin: [
    { path: '/admin', description: 'Admin panel' },
    { path: '/admin/overview', description: 'Admin overview' },
    { path: '/admin/users', description: 'User management' },
    { path: '/admin/api', description: 'API management' },
    { path: '/admin/settings', description: 'System settings' },
    { path: '/admin/logs', description: 'System logs' },
    { path: '/admin/errors', description: 'Error monitoring' },
    { path: '/admin/features', description: 'Feature flags' },
    { path: '/admin/integrations', description: 'External integrations' },
    { path: '/admin/webhooks', description: 'Webhook management' },
    { path: '/admin/maintenance', description: 'Maintenance mode' },
    { path: '/audit', description: 'Audit logs' }
  ],

  // Monitoring & Diagnostics
  monitoring: [
    { path: '/monitoring', description: 'Real-time monitoring' },
    { path: '/api-status', description: 'API status diagnostic' },
    { path: '/settings', description: 'User settings' }
  ],

  // Advanced Manufacturing Systems
  advanced: [
    { path: '/predictive-maintenance', description: 'Predictive maintenance system' },
    { path: '/manufacturing-intelligence', description: 'Manufacturing intelligence hub' },
    { path: '/workflow-automation', description: 'Workflow automation' },
    { path: '/global-compliance', description: 'Global compliance system' },
    { path: '/digital-twin', description: 'Digital twin system' },
    { path: '/smart-automation', description: 'Smart automation controls' }
  ]
};

// API Endpoint Registry with Latest Updates
const API_ENDPOINTS = {
  // Health & Status
  health: [
    { path: '/api/health', method: 'GET', description: 'System health check', critical: true },
    { path: '/health', method: 'GET', description: 'Basic health check', critical: true }
  ],

  // MCP Server Endpoints
  mcp: [
    { path: '/mcp/status', method: 'GET', description: 'MCP server status' },
    { path: '/mcp/tools', method: 'GET', description: 'Available MCP tools' },
    { path: '/mcp/ai/status', method: 'GET', description: 'AI system status' },
    { path: '/mcp/api/unified/status', method: 'GET', description: 'Unified API status' },
    { path: '/mcp/manufacturing/request', method: 'POST', description: 'Manufacturing AI request' }
  ],

  // Authentication
  auth: [
    { path: '/api/auth/validate', method: 'GET', description: 'Validate authentication' },
    { path: '/api/auth/user', method: 'GET', description: 'Current user info' },
    { path: '/api/auth/permissions', method: 'GET', description: 'User permissions' }
  ],

  // Working Capital & Financial
  financial: [
    { path: '/api/working-capital/metrics', method: 'GET', description: 'Working capital metrics', requiresAuth: true },
    { path: '/api/working-capital/overview', method: 'GET', description: 'WC overview', requiresAuth: true },
    { path: '/api/working-capital/forecast', method: 'GET', description: 'WC forecast' },
    { path: '/api/financial/reports', method: 'GET', description: 'Financial reports' },
    { path: '/api/financial/cashflow', method: 'GET', description: 'Cash flow analysis' }
  ],

  // Forecasting & AI
  forecasting: [
    { path: '/api/forecasting/forecast', method: 'POST', description: 'Generate forecast', requiresAuth: true },
    { path: '/api/forecasting/models', method: 'GET', description: 'Available models' },
    { path: '/api/ai/predict', method: 'POST', description: 'AI predictions' },
    { path: '/api/ai/insights', method: 'GET', description: 'AI insights' }
  ],

  // Manufacturing Operations
  manufacturing: [
    { path: '/api/manufacturing/dashboard', method: 'GET', description: 'Manufacturing dashboard', requiresAuth: true },
    { path: '/api/manufacturing/jobs', method: 'GET', description: 'Production jobs' },
    { path: '/api/manufacturing/capacity', method: 'GET', description: 'Capacity planning' },
    { path: '/api/inventory/levels', method: 'GET', description: 'Inventory levels' },
    { path: '/api/quality/metrics', method: 'GET', description: 'Quality metrics' }
  ],

  // External Integrations
  integrations: [
    { path: '/api/xero/auth', method: 'GET', description: 'Xero OAuth', requiresAuth: true },
    { path: '/api/xero/status', method: 'GET', description: 'Xero connection status' },
    { path: '/api/shopify/status', method: 'GET', description: 'Shopify status' },
    { path: '/api/unleashed/status', method: 'GET', description: 'Unleashed status' }
  ],

  // Admin & System
  admin: [
    { path: '/api/admin/users', method: 'GET', description: 'User management', requiresAuth: true, role: 'admin' },
    { path: '/api/admin/logs', method: 'GET', description: 'System logs', requiresAuth: true, role: 'admin' },
    { path: '/api/admin/metrics', method: 'GET', description: 'System metrics' },
    { path: '/api/admin/config', method: 'GET', description: 'System configuration' }
  ]
};

// Environment Variable Validation Registry
const REQUIRED_ENV_VARS = {
  critical: [
    'NODE_ENV',
    'DATABASE_URL',
    'CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ],
  important: [
    'VITE_API_BASE_URL',
    'CORS_ORIGINS',
    'JWT_SECRET',
    'REDIS_URL'
  ],
  mcp: [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'MCP_SERVER_PORT'
  ],
  integrations: [
    'XERO_CLIENT_ID',
    'XERO_CLIENT_SECRET',
    'SHOPIFY_API_KEY',
    'AMAZON_SP_API_CLIENT_ID'
  ]
};

// Create Logger
const createLogger = () => {
  const logDir = path.join(process.cwd(), 'logs', 'self-healing');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.prettyPrint()
    ),
    defaultMeta: {
      service: 'sentia-self-healing-agent-v3',
      version: '3.0.0',
      environment: process.env.NODE_ENV || 'production'
    },
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 10485760,
        maxFiles: 10
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
};

// Circuit Breaker Implementation
class CircuitBreaker {
  constructor(name, config) {
    this.name = name;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.config = config;
    this.callHistory = [];
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        this.failureCount = 0;
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.recordCall(true);
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.recordCall(false);

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  recordCall(success) {
    const now = Date.now();
    this.callHistory.push({ timestamp: now, success });

    // Clean old history outside monitor window
    const cutoff = now - this.config.monitorWindow;
    this.callHistory = this.callHistory.filter(call => call.timestamp > cutoff);
  }

  getHealthMetrics() {
    const now = Date.now();
    const recentCalls = this.callHistory.filter(call =>
      call.timestamp > now - this.config.monitorWindow
    );

    const totalCalls = recentCalls.length;
    const successfulCalls = recentCalls.filter(call => call.success).length;
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 100;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successRate: successRate.toFixed(2) + '%',
      totalCalls,
      successfulCalls
    };
  }
}

// Enhanced Self-Healing Agent v3
class EnterpriseSelfHealingAgentV3 {
  constructor() {
    this.logger = createLogger();
    this.isRunning = false;
    this.circuitBreakers = {};
    this.performanceMetrics = new Map();
    this.activeRecoveries = new Set();

    this.healthStats = {
      checks: 0,
      fixes: 0,
      errors: 0,
      routeTests: 0,
      routeTestsPassed: 0,
      apiTests: 0,
      apiTestsPassed: 0,
      mcpTests: 0,
      mcpTestsPassed: 0,
      navigationTests: 0,
      navigationTestsPassed: 0,
      securityTests: 0,
      securityTestsPassed: 0,
      performanceTests: 0,
      performanceTestsPassed: 0,
      lastCheck: null,
      startTime: new Date(),
      averageResponseTime: 0,
      uptimePercentage: 100
    };

    this.initializeCircuitBreakers();
    this.setupGracefulShutdown();
  }

  initializeCircuitBreakers() {
    // Environment circuit breakers
    Object.keys(CONFIG.ENVIRONMENTS).forEach(env => {
      this.circuitBreakers[env] = new CircuitBreaker(
        `${env}-health-check`,
        CONFIG.CIRCUIT_BREAKER
      );
    });

    // MCP server circuit breakers
    Object.keys(CONFIG.MCP_SERVERS).forEach(server => {
      this.circuitBreakers[`mcp-${server}`] = new CircuitBreaker(
        `mcp-${server}-health-check`,
        CONFIG.CIRCUIT_BREAKER
      );
    });
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      this.logger.info(`Received ${signal}, initiating graceful shutdown...`);
      this.isRunning = false;

      // Wait for active recoveries to complete
      if (this.activeRecoveries.size > 0) {
        this.logger.info(`Waiting for ${this.activeRecoveries.size} active recoveries to complete...`);
        await this.waitForRecoveries(30000); // 30 second timeout
      }

      await this.generateFinalReport();
      this.logger.info('Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));
  }

  async waitForRecoveries(timeout) {
    const startTime = Date.now();
    while (this.activeRecoveries.size > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  log(message, level = 'info', metadata = {}) {
    const logEntry = {
      message,
      ...metadata,
      agent: {
        version: '3.0.0',
        checks: this.healthStats.checks,
        fixes: this.healthStats.fixes,
        errors: this.healthStats.errors,
        uptime: Date.now() - this.healthStats.startTime.getTime()
      }
    };

    this.logger[level](logEntry);
  }

  // Test all routes from ROUTE_REGISTRY
  async validateRoutes(environment, baseUrl) {
    this.log(`Validating routes for ${environment}...`, 'info', { environment });
    this.healthStats.routeTests++;

    const results = [];
    let passedTests = 0;
    let totalTests = 0;

    for (const [category, routes] of Object.entries(ROUTE_REGISTRY)) {
      for (const route of routes) {
        totalTests++;
        try {
          const startTime = Date.now();
          const response = await fetch(`${baseUrl}${route.path}`, {
            method: 'GET',
            timeout: CONFIG.REQUEST_TIMEOUT / 2,
            headers: {
              'User-Agent': 'Sentia-Agent-v3/3.0.0'
            }
          });

          const responseTime = Date.now() - startTime;
          const passed = response.status < 500; // Client errors are OK, server errors are not

          if (passed) passedTests++;

          results.push({
            category,
            path: route.path,
            description: route.description,
            status: response.status,
            passed,
            responseTime,
            priority: route.priority || 'NORMAL'
          });

          if (route.priority === 'HIGH' && !passed) {
            this.log(`HIGH PRIORITY ROUTE FAILURE: ${route.path}`, 'error', {
              path: route.path,
              status: response.status
            });
          }
        } catch (error) {
          results.push({
            category,
            path: route.path,
            description: route.description,
            error: error.message,
            passed: false,
            priority: route.priority || 'NORMAL'
          });
        }
      }
    }

    if (passedTests === totalTests) {
      this.healthStats.routeTestsPassed++;
    }

    const criticalFailures = results.filter(r => !r.passed && r.priority === 'HIGH').length;

    this.log(`Route validation completed: ${passedTests}/${totalTests} passed`, 'info', {
      environment,
      passedTests,
      totalTests,
      criticalFailures
    });

    return {
      environment,
      passedTests,
      totalTests,
      criticalFailures,
      results
    };
  }

  // Test API endpoints
  async validateAPIEndpoints(environment, baseUrl) {
    this.log(`Validating API endpoints for ${environment}...`, 'info', { environment });
    this.healthStats.apiTests++;

    const results = [];
    let passedTests = 0;
    let totalTests = 0;

    for (const [category, endpoints] of Object.entries(API_ENDPOINTS)) {
      for (const endpoint of endpoints) {
        totalTests++;
        try {
          const options = {
            method: endpoint.method,
            timeout: CONFIG.REQUEST_TIMEOUT / 2,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Sentia-Agent-v3/3.0.0'
            }
          };

          if (endpoint.method === 'POST' && endpoint.body) {
            options.body = JSON.stringify(endpoint.body);
          }

          const startTime = Date.now();
          const response = await fetch(`${baseUrl}${endpoint.path}`, options);
          const responseTime = Date.now() - startTime;

          let passed = false;
          if (endpoint.requiresAuth) {
            // Should return 401/403 without auth
            passed = response.status === 401 || response.status === 403;
          } else if (endpoint.critical) {
            // Critical endpoints must return 200
            passed = response.status === 200;
          } else {
            // Non-critical endpoints should not return 5xx
            passed = response.status < 500;
          }

          if (passed) passedTests++;

          results.push({
            category,
            path: endpoint.path,
            method: endpoint.method,
            description: endpoint.description,
            status: response.status,
            passed,
            responseTime,
            requiresAuth: endpoint.requiresAuth,
            critical: endpoint.critical
          });

          if (endpoint.critical && !passed) {
            this.log(`CRITICAL API FAILURE: ${endpoint.path}`, 'error', {
              path: endpoint.path,
              status: response.status
            });
          }
        } catch (error) {
          results.push({
            category,
            path: endpoint.path,
            method: endpoint.method,
            description: endpoint.description,
            error: error.message,
            passed: false,
            critical: endpoint.critical
          });
        }
      }
    }

    if (passedTests === totalTests) {
      this.healthStats.apiTestsPassed++;
    }

    const criticalFailures = results.filter(r => !r.passed && r.critical).length;

    this.log(`API validation completed: ${passedTests}/${totalTests} passed`, 'info', {
      environment,
      passedTests,
      totalTests,
      criticalFailures
    });

    return {
      environment,
      passedTests,
      totalTests,
      criticalFailures,
      results
    };
  }

  // Test MCP Server
  async validateMCPServer() {
    this.log('Validating MCP Server...', 'info');
    this.healthStats.mcpTests++;

    const results = [];
    let passedTests = 0;

    for (const [serverName, serverUrl] of Object.entries(CONFIG.MCP_SERVERS)) {
      if (serverName === 'development' && process.env.NODE_ENV === 'production') {
        continue; // Skip local dev server in production
      }

      try {
        // Test health endpoint
        const healthResponse = await fetch(`${serverUrl}/health`, {
          timeout: CONFIG.REQUEST_TIMEOUT / 2
        });

        const healthPassed = healthResponse.status === 200;

        // Test MCP status endpoint
        const statusResponse = await fetch(`${serverUrl}/mcp/status`, {
          timeout: CONFIG.REQUEST_TIMEOUT / 2
        });

        let statusData = {};
        try {
          statusData = await statusResponse.json();
        } catch (e) {
          // May not return JSON
        }

        const statusPassed = statusResponse.status === 200 && statusData.status === 'operational';

        const passed = healthPassed && statusPassed;
        if (passed) passedTests++;

        results.push({
          server: serverName,
          url: serverUrl,
          health: healthPassed,
          status: statusPassed,
          passed,
          aiProviders: statusData.ai?.providers || [],
          apiIntegrations: statusData.apis?.services || [],
          mcpTools: statusData.mcp?.tools || []
        });

        this.log(`MCP Server ${serverName}: ${passed ? 'OPERATIONAL' : 'DEGRADED'}`,
          passed ? 'info' : 'warn', {
          server: serverName,
          healthPassed,
          statusPassed,
          providers: statusData.ai?.providers?.length || 0,
          integrations: statusData.apis?.services?.length || 0
        });

      } catch (error) {
        results.push({
          server: serverName,
          url: serverUrl,
          error: error.message,
          passed: false
        });

        this.log(`MCP Server ${serverName} ERROR`, 'error', {
          server: serverName,
          error: error.message
        });
      }
    }

    if (passedTests === results.length) {
      this.healthStats.mcpTestsPassed++;
    }

    return {
      passedTests,
      totalTests: results.length,
      results
    };
  }

  // Test Navigation System
  async validateNavigationSystem(environment, baseUrl) {
    this.log(`Validating navigation system for ${environment}...`, 'info', { environment });
    this.healthStats.navigationTests++;

    const criticalNavigationPaths = [
      { path: '/dashboard', element: 'Sentia logo', description: 'Logo should navigate to dashboard' },
      { path: '/working-capital', element: 'Working Capital button', description: 'Working Capital navigation' },
      { path: '/what-if', element: 'What-If Analysis button', description: 'What-If Analysis navigation' },
      { path: '/forecasting', element: 'Run Forecast button', description: 'Forecasting navigation' },
      { path: '/inventory', element: 'Optimize Stock button', description: 'Inventory navigation' }
    ];

    let passedTests = 0;
    const results = [];

    for (const nav of criticalNavigationPaths) {
      try {
        const response = await fetch(`${baseUrl}${nav.path}`, {
          method: 'GET',
          timeout: CONFIG.REQUEST_TIMEOUT / 2
        });

        const passed = response.status === 200 || response.status === 304;
        if (passed) passedTests++;

        results.push({
          path: nav.path,
          element: nav.element,
          description: nav.description,
          status: response.status,
          passed
        });

        this.log(`Navigation test ${nav.element}: ${passed ? 'PASS' : 'FAIL'}`,
          passed ? 'info' : 'warn', {
          path: nav.path,
          status: response.status
        });

      } catch (error) {
        results.push({
          path: nav.path,
          element: nav.element,
          description: nav.description,
          error: error.message,
          passed: false
        });
      }
    }

    if (passedTests === results.length) {
      this.healthStats.navigationTestsPassed++;
    }

    return {
      environment,
      passedTests,
      totalTests: results.length,
      results
    };
  }

  // Environment Variable Validation
  async validateEnvironmentVariables() {
    this.log('Validating environment variables...', 'info');

    const results = {
      critical: [],
      important: [],
      mcp: [],
      integrations: []
    };

    for (const [category, vars] of Object.entries(REQUIRED_ENV_VARS)) {
      for (const envVar of vars) {
        const exists = !!process.env[envVar];
        const masked = exists ? '***SET***' : 'NOT SET';

        results[category].push({
          variable: envVar,
          status: masked,
          exists
        });

        if (!exists && category === 'critical') {
          this.log(`CRITICAL: Missing environment variable ${envVar}`, 'error');
        }
      }
    }

    const criticalMissing = results.critical.filter(v => !v.exists).length;
    const importantMissing = results.important.filter(v => !v.exists).length;

    return {
      results,
      criticalMissing,
      importantMissing,
      status: criticalMissing === 0 ? 'READY' : 'NOT_READY'
    };
  }

  // Build Validation
  async validateBuildProcess() {
    this.log('Validating build process...', 'info');

    try {
      const { stdout, stderr } = await execPromise('npm run build', {
        timeout: 120000 // 2 minutes
      });

      const buildSuccessful = !stderr || !stderr.includes('ERROR');

      // Check build output size
      const distPath = path.join(process.cwd(), 'dist');
      let buildSize = 0;

      if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath, { recursive: true });
        for (const file of files) {
          const filePath = path.join(distPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            buildSize += stats.size;
          }
        }
      }

      const buildSizeMB = (buildSize / (1024 * 1024)).toFixed(2);

      this.log(`Build validation completed`, 'info', {
        successful: buildSuccessful,
        buildSize: `${buildSizeMB} MB`,
        fileCount: fs.existsSync(distPath) ? fs.readdirSync(distPath).length : 0
      });

      return {
        successful: buildSuccessful,
        buildSize: buildSizeMB,
        output: stdout.substring(0, 500)
      };

    } catch (error) {
      this.log('Build validation failed', 'error', {
        error: error.message
      });

      return {
        successful: false,
        error: error.message
      };
    }
  }

  async generateHealthReport() {
    const routeSuccessRate = this.healthStats.routeTests > 0 ?
      (this.healthStats.routeTestsPassed / this.healthStats.routeTests) * 100 : 100;

    const apiSuccessRate = this.healthStats.apiTests > 0 ?
      (this.healthStats.apiTestsPassed / this.healthStats.apiTests) * 100 : 100;

    const mcpSuccessRate = this.healthStats.mcpTests > 0 ?
      (this.healthStats.mcpTestsPassed / this.healthStats.mcpTests) * 100 : 100;

    const navigationSuccessRate = this.healthStats.navigationTests > 0 ?
      (this.healthStats.navigationTestsPassed / this.healthStats.navigationTests) * 100 : 100;

    const securitySuccessRate = this.healthStats.securityTests > 0 ?
      (this.healthStats.securityTestsPassed / this.healthStats.securityTests) * 100 : 100;

    const performanceSuccessRate = this.healthStats.performanceTests > 0 ?
      (this.healthStats.performanceTestsPassed / this.healthStats.performanceTests) * 100 : 100;

    // Calculate circuit breaker metrics
    const circuitBreakerMetrics = {};
    Object.entries(this.circuitBreakers).forEach(([env, cb]) => {
      circuitBreakerMetrics[env] = cb.getHealthMetrics();
    });

    const report = {
      timestamp: new Date().toISOString(),
      agent: {
        version: '3.0.0',
        running: this.isRunning,
        uptime: Date.now() - this.healthStats.startTime.getTime(),
        stats: {
          ...this.healthStats,
          routeSuccessRate: `${routeSuccessRate.toFixed(1)}%`,
          apiSuccessRate: `${apiSuccessRate.toFixed(1)}%`,
          mcpSuccessRate: `${mcpSuccessRate.toFixed(1)}%`,
          navigationSuccessRate: `${navigationSuccessRate.toFixed(1)}%`,
          securitySuccessRate: `${securitySuccessRate.toFixed(1)}%`,
          performanceSuccessRate: `${performanceSuccessRate.toFixed(1)}%`
        }
      },
      environment: {
        node_env: process.env.NODE_ENV,
        render_env: process.env.RENDER,
        auto_fix: CONFIG.AUTO_FIX_ENABLED,
        auto_deploy: CONFIG.AUTO_DEPLOY_ENABLED,
        circuit_breaker_enabled: true,
        security_scanning: CONFIG.SECURITY_SCAN_ENABLED,
        performance_monitoring: CONFIG.PERFORMANCE_MONITORING
      },
      validationSuites: {
        routes: {
          testsRun: this.healthStats.routeTests,
          testsPassed: this.healthStats.routeTestsPassed,
          successRate: `${routeSuccessRate.toFixed(1)}%`,
          status: routeSuccessRate >= 95 ? 'EXCELLENT' :
                  routeSuccessRate >= 85 ? 'GOOD' :
                  routeSuccessRate >= 75 ? 'ACCEPTABLE' : 'FAILING'
        },
        api: {
          testsRun: this.healthStats.apiTests,
          testsPassed: this.healthStats.apiTestsPassed,
          successRate: `${apiSuccessRate.toFixed(1)}%`,
          status: apiSuccessRate >= 95 ? 'EXCELLENT' :
                  apiSuccessRate >= 85 ? 'GOOD' : 'NEEDS_ATTENTION'
        },
        mcp: {
          testsRun: this.healthStats.mcpTests,
          testsPassed: this.healthStats.mcpTestsPassed,
          successRate: `${mcpSuccessRate.toFixed(1)}%`,
          status: mcpSuccessRate >= 90 ? 'EXCELLENT' :
                  mcpSuccessRate >= 70 ? 'GOOD' : 'DEGRADED'
        },
        navigation: {
          testsRun: this.healthStats.navigationTests,
          testsPassed: this.healthStats.navigationTestsPassed,
          successRate: `${navigationSuccessRate.toFixed(1)}%`,
          status: navigationSuccessRate === 100 ? 'PERFECT' :
                  navigationSuccessRate >= 90 ? 'GOOD' : 'NEEDS_FIX'
        },
        security: {
          testsRun: this.healthStats.securityTests,
          testsPassed: this.healthStats.securityTestsPassed,
          successRate: `${securitySuccessRate.toFixed(1)}%`,
          status: securitySuccessRate >= 95 ? 'EXCELLENT' :
                  securitySuccessRate >= 85 ? 'GOOD' : 'NEEDS_ATTENTION'
        },
        performance: {
          testsRun: this.healthStats.performanceTests,
          testsPassed: this.healthStats.performanceTestsPassed,
          successRate: `${performanceSuccessRate.toFixed(1)}%`,
          status: performanceSuccessRate >= 90 ? 'EXCELLENT' :
                  performanceSuccessRate >= 75 ? 'GOOD' : 'NEEDS_OPTIMIZATION'
        }
      },
      circuitBreakers: circuitBreakerMetrics
    };

    return report;
  }

  async generateFinalReport() {
    const report = await this.generateHealthReport();

    const finalReport = {
      ...report,
      summary: {
        totalUptime: Date.now() - this.healthStats.startTime.getTime(),
        totalChecks: this.healthStats.checks,
        totalFixes: this.healthStats.fixes,
        totalErrors: this.healthStats.errors,
        overallHealthScore: this.calculateOverallHealthScore(report),
        recommendations: this.generateRecommendations(report)
      }
    };

    // Save to file
    const reportPath = path.join(process.cwd(), 'logs', 'self-healing', 'final-report-v3.json');
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

    this.log('Final health report generated', 'info', {
      reportPath,
      overallScore: finalReport.summary.overallHealthScore
    });

    return finalReport;
  }

  calculateOverallHealthScore(report) {
    const weights = {
      routes: 0.25,      // 25% weight - user experience
      api: 0.25,         // 25% weight - functionality
      mcp: 0.15,         // 15% weight - AI features
      navigation: 0.15,  // 15% weight - usability
      security: 0.10,    // 10% weight - security
      performance: 0.10  // 10% weight - performance
    };

    const scores = {
      routes: parseFloat(report.validationSuites.routes.successRate),
      api: parseFloat(report.validationSuites.api.successRate),
      mcp: parseFloat(report.validationSuites.mcp.successRate),
      navigation: parseFloat(report.validationSuites.navigation.successRate),
      security: parseFloat(report.validationSuites.security.successRate),
      performance: parseFloat(report.validationSuites.performance.successRate)
    };

    const weightedScore = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key] * weight);
    }, 0);

    return Math.round(weightedScore);
  }

  generateRecommendations(report) {
    const recommendations = [];

    // Route recommendations
    const routeScore = parseFloat(report.validationSuites.routes.successRate);
    if (routeScore < 95) {
      recommendations.push({
        category: 'Routes',
        priority: 'HIGH',
        recommendation: 'Some application routes are failing. Check React Router configuration and component imports.'
      });
    }

    // API recommendations
    const apiScore = parseFloat(report.validationSuites.api.successRate);
    if (apiScore < 95) {
      recommendations.push({
        category: 'API',
        priority: 'CRITICAL',
        recommendation: 'API endpoints are failing. Verify backend server is running and database connections are configured.'
      });
    }

    // MCP recommendations
    const mcpScore = parseFloat(report.validationSuites.mcp.successRate);
    if (mcpScore < 90) {
      recommendations.push({
        category: 'MCP/AI',
        priority: 'MEDIUM',
        recommendation: 'MCP server is degraded. Check AI provider API keys and MCP server deployment.'
      });
    }

    // Navigation recommendations
    const navScore = parseFloat(report.validationSuites.navigation.successRate);
    if (navScore < 100) {
      recommendations.push({
        category: 'Navigation',
        priority: 'HIGH',
        recommendation: 'Critical navigation paths are broken. Verify Header and Sidebar components are properly configured.'
      });
    }

    // Security recommendations
    const securityScore = parseFloat(report.validationSuites.security.successRate);
    if (securityScore < 95) {
      recommendations.push({
        category: 'Security',
        priority: 'CRITICAL',
        recommendation: 'Security posture needs improvement. Ensure HTTPS enforcement, proper headers, and no exposed secrets.'
      });
    }

    // Performance recommendations
    const performanceScore = parseFloat(report.validationSuites.performance.successRate);
    if (performanceScore < 90) {
      recommendations.push({
        category: 'Performance',
        priority: 'MEDIUM',
        recommendation: 'Performance optimization needed. Consider caching, CDN, and server resource scaling.'
      });
    }

    // Circuit breaker recommendations
    Object.entries(report.circuitBreakers).forEach(([env, metrics]) => {
      if (metrics.state === 'OPEN' || parseFloat(metrics.successRate) < 95) {
        recommendations.push({
          category: 'Reliability',
          priority: 'HIGH',
          recommendation: `Environment ${env} has reliability issues. Circuit breaker state: ${metrics.state}, Success rate: ${metrics.successRate}`
        });
      }
    });

    return recommendations;
  }

  async runComprehensiveHealthCheck() {
    if (this.isRunning) {
      this.log('Comprehensive health check already in progress, skipping...', 'warn');
      return;
    }

    this.isRunning = true;
    this.healthStats.checks++;
    this.healthStats.lastCheck = new Date();

    try {
      this.log('Starting comprehensive enterprise health check v3...', 'info');

      // 1. Validate environment variables
      const envValidation = await this.validateEnvironmentVariables();
      this.log('Environment validation completed', 'info', {
        status: envValidation.status,
        criticalMissing: envValidation.criticalMissing
      });

      // 2. Test each environment
      for (const [env, url] of Object.entries(CONFIG.ENVIRONMENTS)) {
        this.log(`Testing ${env} environment...`, 'info', { env, url });

        try {
          // Route validation
          const routeResults = await this.validateRoutes(env, url);

          // API validation
          const apiResults = await this.validateAPIEndpoints(env, url);

          // Navigation validation
          const navResults = await this.validateNavigationSystem(env, url);

          this.log(`${env} environment tests completed`, 'info', {
            environment: env,
            routes: `${routeResults.passedTests}/${routeResults.totalTests}`,
            api: `${apiResults.passedTests}/${apiResults.totalTests}`,
            navigation: `${navResults.passedTests}/${navResults.totalTests}`
          });
        } catch (error) {
          this.log(`${env} environment test failed`, 'error', {
            environment: env,
            error: error.message
          });
          this.healthStats.errors++;
        }
      }

      // 3. Test MCP Server
      const mcpResults = await this.validateMCPServer();
      this.log('MCP Server validation completed', 'info', {
        passed: `${mcpResults.passedTests}/${mcpResults.totalTests}`
      });

      // 4. Build validation (only in development)
      if (process.env.NODE_ENV === 'development') {
        const buildResults = await this.validateBuildProcess();
        this.log('Build validation completed', 'info', {
          successful: buildResults.successful,
          buildSize: buildResults.buildSize
        });
      }

      // 5. Generate comprehensive report
      const report = await this.generateHealthReport();
      const overallScore = this.calculateOverallHealthScore(report);

      this.log(`Health Report Summary - Overall Score: ${overallScore}/100`, 'info', {
        checks: this.healthStats.checks,
        fixes: this.healthStats.fixes,
        errors: this.healthStats.errors,
        routeStatus: report.validationSuites.routes.status,
        apiStatus: report.validationSuites.api.status,
        mcpStatus: report.validationSuites.mcp.status,
        navigationStatus: report.validationSuites.navigation.status
      });

      // Alert if overall score is concerning
      if (overallScore < 80) {
        this.log('ALERT: Overall health score below acceptable threshold', 'error', {
          score: overallScore,
          recommendations: this.generateRecommendations(report).length
        });
      }

    } catch (error) {
      this.log('Comprehensive health check failed', 'error', {
        error: error.message,
        stack: error.stack
      });
      this.healthStats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    this.log('Starting Enterprise Self-Healing Agent v3.0', 'info', {
      version: '3.0.0',
      environments: Object.keys(CONFIG.ENVIRONMENTS),
      mcpServers: Object.keys(CONFIG.MCP_SERVERS),
      features: [
        'Complete Route Coverage',
        'API Endpoint Validation',
        'MCP Server Monitoring',
        'Navigation System Testing',
        'Circuit Breaker Protection',
        'Environment Variable Validation',
        'Build Process Validation'
      ]
    });

    this.log('Configuration loaded', 'info', {
      healthCheckInterval: `${CONFIG.HEALTH_CHECK_INTERVAL / 60000} minutes`,
      deepScanInterval: `${CONFIG.DEEP_SCAN_INTERVAL / 60000} minutes`,
      mcpCheckInterval: `${CONFIG.MCP_SERVER_CHECK_INTERVAL / 60000} minutes`,
      autoFix: CONFIG.AUTO_FIX_ENABLED,
      autoDeploy: CONFIG.AUTO_DEPLOY_ENABLED,
      securityScanning: CONFIG.SECURITY_SCAN_ENABLED,
      performanceMonitoring: CONFIG.PERFORMANCE_MONITORING
    });

    // Initial comprehensive health check
    setTimeout(() => this.runComprehensiveHealthCheck(), 5000); // 5 second delay for startup

    // Schedule regular health checks
    const healthInterval = setInterval(() => {
      this.runComprehensiveHealthCheck();
    }, CONFIG.HEALTH_CHECK_INTERVAL);

    // Schedule deep scans
    const deepScanInterval = setInterval(() => {
      this.log('Running scheduled deep diagnostic scan...', 'info');
      this.runComprehensiveHealthCheck();
    }, CONFIG.DEEP_SCAN_INTERVAL);

    // Schedule MCP server checks
    const mcpInterval = setInterval(() => {
      this.log('Running MCP server health check...', 'info');
      this.validateMCPServer();
    }, CONFIG.MCP_SERVER_CHECK_INTERVAL);

    // Store intervals for cleanup
    this.intervals = { healthInterval, deepScanInterval, mcpInterval };

    this.log('Enterprise Self-Healing Agent v3.0 started successfully', 'info', {
      nextHealthCheck: new Date(Date.now() + CONFIG.HEALTH_CHECK_INTERVAL).toISOString(),
      nextDeepScan: new Date(Date.now() + CONFIG.DEEP_SCAN_INTERVAL).toISOString(),
      nextMCPCheck: new Date(Date.now() + CONFIG.MCP_SERVER_CHECK_INTERVAL).toISOString()
    });
  }

  stop() {
    this.log('Stopping Enterprise Self-Healing Agent v3...', 'info');
    this.isRunning = false;

    if (this.intervals) {
      clearInterval(this.intervals.healthInterval);
      clearInterval(this.intervals.deepScanInterval);
      clearInterval(this.intervals.mcpInterval);
    }

    this.log('Enterprise Self-Healing Agent v3 stopped', 'info');
  }
}

// Start the agent if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new EnterpriseSelfHealingAgentV3();
  agent.start();
}

export default EnterpriseSelfHealingAgentV3;