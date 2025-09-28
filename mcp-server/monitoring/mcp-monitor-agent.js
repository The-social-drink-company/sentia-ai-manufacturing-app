/**
 * MCP Server Monitoring Agent
 * Real-time monitoring and health checking for the Sentia Manufacturing MCP Server
 * Updated with latest enterprise logging and Render deployment configuration
 */

import express from 'express';
import WebSocket from 'ws';
// Node 18+ has global fetch
import { EventEmitter } from 'events';
import winston from 'winston';
import os from 'os';
import { performance } from 'perf_hooks';

// Create structured logger for monitoring
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'mcp-monitor-agent',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname()
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/mcp-monitor-error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/mcp-monitor-combined.log'
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Structured logging helpers (matching main server pattern)
const logInfo = (message, meta = {}) => {
  if (process.env.NODE_ENV === 'development') {
    logger.info(message, meta);
  }
};

const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

const logError = (message, error) => {
  logger.error(message, {
    error: error?.message || error,
    stack: error?.stack,
    code: error?.code
  });
};

class MCPMonitorAgent extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      mcpServerUrl: config.mcpServerUrl || process.env.MCP_SERVER_URL || 'http://localhost:3001',
      mainServerUrl: config.mainServerUrl || process.env.MAIN_SERVER_URL || 'http://localhost:5000',
      renderUrl: config.renderUrl || process.env.RENDER_EXTERNAL_URL || 'https://sentia-manufacturing-dashboard.onrender.com',
      checkInterval: config.checkInterval || 30000, // 30 seconds
      alertThreshold: config.alertThreshold || 3, // Alert after 3 consecutive failures
      wsReconnectInterval: config.wsReconnectInterval || 5000,
      metricsRetention: config.metricsRetention || 3600000, // 1 hour
      ...config
    };

    this.state = {
      isRunning: false,
      lastCheck: null,
      consecutiveFailures: 0,
      uptime: 0,
      startTime: Date.now()
    };

    this.metrics = {
      checks: [],
      errors: [],
      performance: [],
      alerts: [],
      systemHealth: {}
    };

    this.services = {
      mcpServer: { status: 'unknown', lastCheck: null },
      mainServer: { status: 'unknown', lastCheck: null },
      database: { status: 'unknown', lastCheck: null },
      redis: { status: 'unknown', lastCheck: null },
      aiProviders: {
        claude: { status: 'unknown', lastCheck: null },
        openai: { status: 'unknown', lastCheck: null },
        gemini: { status: 'unknown', lastCheck: null }
      },
      externalAPIs: {
        xero: { status: 'unknown', lastCheck: null },
        shopify: { status: 'unknown', lastCheck: null },
        unleashed: { status: 'unknown', lastCheck: null }
      }
    };

    this.ws = null;
    this.checkTimer = null;
    this.app = null;
    this.server = null;
  }

  /**
   * Start the monitoring agent
   */
  async start() {
    if (this.state.isRunning) {
      logWarn('Monitor agent already running');
      return;
    }

    try {
      logInfo('Starting MCP Monitor Agent', this.config);

      // Initialize monitoring dashboard
      await this.initializeDashboard();

      // Connect to MCP WebSocket
      await this.connectWebSocket();

      // Start periodic health checks
      this.startHealthChecks();

      // Initialize system metrics collection
      this.startMetricsCollection();

      this.state.isRunning = true;
      this.state.startTime = Date.now();

      this.emit('started');
      logInfo('MCP Monitor Agent started successfully');

    } catch (error) {
      logError('Failed to start monitor agent', error);
      throw error;
    }
  }

  /**
   * Initialize monitoring dashboard
   */
  async initializeDashboard() {
    this.app = express();
    this.app.use(express.json());

    // CORS for Render deployment
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5000',
        'https://sentia-manufacturing-dashboard.onrender.com',
        'https://mcp-server-tkyu.onrender.com'
      ];

      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // Health endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Math.floor((Date.now() - this.state.startTime) / 1000),
        services: this.services,
        lastCheck: this.state.lastCheck,
        timestamp: new Date().toISOString()
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const recentMetrics = {
        ...this.metrics,
        checks: this.metrics.checks.slice(-100),
        errors: this.metrics.errors.slice(-50),
        performance: this.metrics.performance.slice(-100)
      };

      res.json({
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.state.startTime) / 1000),
        metrics: recentMetrics,
        systemHealth: this.getSystemHealth()
      });
    });

    // Alerts endpoint
    this.app.get('/alerts', (req, res) => {
      res.json({
        active: this.metrics.alerts.filter(a => !a.resolved),
        recent: this.metrics.alerts.slice(-20),
        timestamp: new Date().toISOString()
      });
    });

    // Service status endpoint
    this.app.get('/services/:service', (req, res) => {
      const service = this.services[req.params.service];
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json({
        service: req.params.service,
        ...service,
        history: this.getServiceHistory(req.params.service),
        timestamp: new Date().toISOString()
      });
    });

    // Dashboard UI
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    const port = process.env.MONITOR_PORT || 3002;
    this.server = this.app.listen(port, () => {
      logInfo(`Monitor dashboard running on port ${port}`);
    });
  }

  /**
   * Connect to MCP WebSocket
   */
  async connectWebSocket() {
    const wsUrl = this.config.mcpServerUrl.replace('http', 'ws') + '/ws';

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        logInfo('WebSocket connected to MCP server');
        this.services.mcpServer.status = 'connected';
        this.services.mcpServer.lastCheck = Date.now();
        this.emit('ws-connected');
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          logError('Failed to parse WebSocket message', error);
        }
      });

      this.ws.on('error', (error) => {
        logError('WebSocket error', error);
        this.services.mcpServer.status = 'error';
        this.services.mcpServer.error = error.message;
      });

      this.ws.on('close', () => {
        logWarn('WebSocket disconnected');
        this.services.mcpServer.status = 'disconnected';

        // Reconnect after interval
        setTimeout(() => {
          if (this.state.isRunning) {
            this.connectWebSocket();
          }
        }, this.config.wsReconnectInterval);
      });

    } catch (error) {
      logError('Failed to connect WebSocket', error);
      this.services.mcpServer.status = 'error';
      this.services.mcpServer.error = error.message;

      // Retry connection
      setTimeout(() => {
        if (this.state.isRunning) {
          this.connectWebSocket();
        }
      }, this.config.wsReconnectInterval);
    }
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(message) {
    const { type, data, timestamp } = message;

    switch (type) {
      case 'health':
        this.updateServiceHealth('mcpServer', data);
        break;

      case 'ai-response':
        this.updateAIProviderStatus(data.provider, 'active');
        break;

      case 'api-call':
        this.updateAPIStatus(data.service, data.status);
        break;

      case 'error':
        this.recordError(data);
        break;

      case 'performance':
        this.recordPerformance(data);
        break;

      default:
        logInfo('Received WebSocket message', { type, timestamp });
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    this.checkTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.checkInterval);

    // Perform initial check
    this.performHealthCheck();
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const startTime = performance.now();
    const results = {};

    try {
      // Check MCP Server
      results.mcpServer = await this.checkMCPServer();

      // Check Main Server
      results.mainServer = await this.checkMainServer();

      // Check Database
      results.database = await this.checkDatabase();

      // Check Redis
      results.redis = await this.checkRedis();

      // Check AI Providers
      results.aiProviders = await this.checkAIProviders();

      // Check External APIs
      results.externalAPIs = await this.checkExternalAPIs();

      // Update service statuses
      this.updateServiceStatuses(results);

      // Record metrics
      const duration = performance.now() - startTime;
      this.recordHealthCheck(results, duration);

      // Check for alerts
      this.checkAlertConditions(results);

      this.state.lastCheck = Date.now();
      this.state.consecutiveFailures = 0;

      this.emit('health-check', results);

    } catch (error) {
      logError('Health check failed', error);
      this.state.consecutiveFailures++;

      if (this.state.consecutiveFailures >= this.config.alertThreshold) {
        this.createAlert('critical', 'Health check failures exceeded threshold', {
          consecutiveFailures: this.state.consecutiveFailures
        });
      }
    }
  }

  /**
   * Check MCP Server health
   */
  async checkMCPServer() {
    try {
      const response = await fetch(`${this.config.mcpServerUrl}/health`, {
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: 'healthy',
          responseTime: data.responseTime || 0,
          version: data.version,
          features: data.features
        };
      } else {
        return {
          status: 'unhealthy',
          statusCode: response.status,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        status: 'unreachable',
        error: error.message
      };
    }
  }

  /**
   * Check Main Server health
   */
  async checkMainServer() {
    try {
      const response = await fetch(`${this.config.mainServerUrl}/api/health/enterprise`, {
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status || 'healthy',
          uptime: data.uptime,
          services: data.services
        };
      } else {
        return {
          status: 'unhealthy',
          statusCode: response.status
        };
      }
    } catch (error) {
      return {
        status: 'unreachable',
        error: error.message
      };
    }
  }

  /**
   * Check Database connectivity
   */
  async checkDatabase() {
    try {
      const response = await fetch(`${this.config.mainServerUrl}/api/services/status`, {
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.database?.status || 'unknown',
          connection: data.database?.connection || 'unknown'
        };
      }

      return { status: 'unknown' };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  async checkRedis() {
    // Redis check via main server status endpoint
    try {
      const response = await fetch(`${this.config.mainServerUrl}/api/services/status`, {
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.redis?.status || 'not_configured',
          connection: data.redis?.connection || 'none'
        };
      }

      return { status: 'unknown' };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Check AI Providers
   */
  async checkAIProviders() {
    const providers = {};

    // Check via MCP server status
    try {
      const response = await fetch(`${this.config.mcpServerUrl}/mcp/status`, {
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();

        providers.claude = {
          status: data.ai?.providers?.claude || 'not_configured',
          configured: !!process.env.ANTHROPIC_API_KEY
        };

        providers.openai = {
          status: data.ai?.providers?.openai || 'not_configured',
          configured: !!process.env.OPENAI_API_KEY
        };

        providers.gemini = {
          status: data.ai?.providers?.gemini || 'not_configured',
          configured: !!process.env.GOOGLE_AI_API_KEY
        };
      }
    } catch (error) {
      logError('Failed to check AI providers', error);
    }

    return providers;
  }

  /**
   * Check External APIs
   */
  async checkExternalAPIs() {
    const apis = {};

    try {
      const response = await fetch(`${this.config.mainServerUrl}/api/services/status`, {
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();

        apis.xero = {
          status: data.xero?.status || 'not_configured',
          configured: !!process.env.XERO_CLIENT_ID
        };

        apis.shopify = {
          status: data.shopify?.status || 'not_configured',
          configured: !!process.env.SHOPIFY_API_KEY
        };

        apis.unleashed = {
          status: data.unleashed?.status || 'not_configured',
          configured: !!process.env.UNLEASHED_API_ID
        };
      }
    } catch (error) {
      logError('Failed to check external APIs', error);
    }

    return apis;
  }

  /**
   * Update service statuses
   */
  updateServiceStatuses(results) {
    // Update MCP Server
    if (results.mcpServer) {
      this.services.mcpServer = {
        ...this.services.mcpServer,
        ...results.mcpServer,
        lastCheck: Date.now()
      };
    }

    // Update Main Server
    if (results.mainServer) {
      this.services.mainServer = {
        ...this.services.mainServer,
        ...results.mainServer,
        lastCheck: Date.now()
      };
    }

    // Update Database
    if (results.database) {
      this.services.database = {
        ...this.services.database,
        ...results.database,
        lastCheck: Date.now()
      };
    }

    // Update Redis
    if (results.redis) {
      this.services.redis = {
        ...this.services.redis,
        ...results.redis,
        lastCheck: Date.now()
      };
    }

    // Update AI Providers
    if (results.aiProviders) {
      Object.keys(results.aiProviders).forEach(provider => {
        this.services.aiProviders[provider] = {
          ...this.services.aiProviders[provider],
          ...results.aiProviders[provider],
          lastCheck: Date.now()
        };
      });
    }

    // Update External APIs
    if (results.externalAPIs) {
      Object.keys(results.externalAPIs).forEach(api => {
        this.services.externalAPIs[api] = {
          ...this.services.externalAPIs[api],
          ...results.externalAPIs[api],
          lastCheck: Date.now()
        };
      });
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    // Collect system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);

    // Clean old metrics every hour
    setInterval(() => {
      this.cleanOldMetrics();
    }, 3600000);
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const metrics = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      loadAvg: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem()
    };

    this.metrics.systemHealth = metrics;
    this.emit('metrics-collected', metrics);
  }

  /**
   * Get system health
   */
  getSystemHealth() {
    const health = {
      ...this.metrics.systemHealth,
      servicesHealth: this.calculateServicesHealth(),
      alertsActive: this.metrics.alerts.filter(a => !a.resolved).length,
      recentErrors: this.metrics.errors.slice(-10).length,
      uptime: Math.floor((Date.now() - this.state.startTime) / 1000)
    };

    return health;
  }

  /**
   * Calculate overall services health
   */
  calculateServicesHealth() {
    let healthy = 0;
    let unhealthy = 0;
    let unknown = 0;

    const checkService = (service) => {
      if (service.status === 'healthy' || service.status === 'active' || service.status === 'connected') {
        healthy++;
      } else if (service.status === 'unhealthy' || service.status === 'error' || service.status === 'disconnected') {
        unhealthy++;
      } else {
        unknown++;
      }
    };

    // Check all services
    checkService(this.services.mcpServer);
    checkService(this.services.mainServer);
    checkService(this.services.database);
    checkService(this.services.redis);

    Object.values(this.services.aiProviders).forEach(checkService);
    Object.values(this.services.externalAPIs).forEach(checkService);

    const total = healthy + unhealthy + unknown;

    return {
      healthy,
      unhealthy,
      unknown,
      total,
      healthPercentage: total > 0 ? Math.round((healthy / total) * 100) : 0
    };
  }

  /**
   * Record health check results
   */
  recordHealthCheck(results, duration) {
    const check = {
      timestamp: Date.now(),
      duration,
      results,
      success: this.isHealthCheckSuccessful(results)
    };

    this.metrics.checks.push(check);

    // Keep only recent checks
    if (this.metrics.checks.length > 1000) {
      this.metrics.checks = this.metrics.checks.slice(-500);
    }
  }

  /**
   * Check if health check was successful
   */
  isHealthCheckSuccessful(results) {
    return results.mcpServer?.status === 'healthy' &&
           results.mainServer?.status === 'healthy' &&
           results.database?.status !== 'error';
  }

  /**
   * Record error
   */
  recordError(error) {
    const errorEntry = {
      timestamp: Date.now(),
      message: error.message || error,
      stack: error.stack,
      service: error.service,
      severity: error.severity || 'error'
    };

    this.metrics.errors.push(errorEntry);

    // Keep only recent errors
    if (this.metrics.errors.length > 500) {
      this.metrics.errors = this.metrics.errors.slice(-250);
    }

    logError('Error recorded', error);
  }

  /**
   * Record performance metrics
   */
  recordPerformance(data) {
    const perfEntry = {
      timestamp: Date.now(),
      ...data
    };

    this.metrics.performance.push(perfEntry);

    // Keep only recent performance data
    if (this.metrics.performance.length > 1000) {
      this.metrics.performance = this.metrics.performance.slice(-500);
    }
  }

  /**
   * Check alert conditions
   */
  checkAlertConditions(results) {
    // Check MCP Server
    if (results.mcpServer?.status !== 'healthy') {
      this.createAlert('high', 'MCP Server unhealthy', results.mcpServer);
    }

    // Check Main Server
    if (results.mainServer?.status === 'unreachable') {
      this.createAlert('critical', 'Main server unreachable', results.mainServer);
    }

    // Check Database
    if (results.database?.status === 'error') {
      this.createAlert('critical', 'Database connection error', results.database);
    }

    // Check AI Providers
    const aiProvidersDown = Object.values(results.aiProviders || {})
      .filter(p => p.configured && p.status === 'error').length;

    if (aiProvidersDown > 0) {
      this.createAlert('medium', `${aiProvidersDown} AI provider(s) down`, results.aiProviders);
    }
  }

  /**
   * Create alert
   */
  createAlert(severity, message, details) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      severity,
      message,
      details,
      resolved: false
    };

    this.metrics.alerts.push(alert);

    // Keep only recent alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-50);
    }

    this.emit('alert', alert);
    logWarn('Alert created', { severity, message });
  }

  /**
   * Update service health
   */
  updateServiceHealth(service, health) {
    if (this.services[service]) {
      this.services[service] = {
        ...this.services[service],
        ...health,
        lastUpdate: Date.now()
      };
    }
  }

  /**
   * Update AI provider status
   */
  updateAIProviderStatus(provider, status) {
    if (this.services.aiProviders[provider]) {
      this.services.aiProviders[provider].status = status;
      this.services.aiProviders[provider].lastUpdate = Date.now();
    }
  }

  /**
   * Update API status
   */
  updateAPIStatus(api, status) {
    if (this.services.externalAPIs[api]) {
      this.services.externalAPIs[api].status = status;
      this.services.externalAPIs[api].lastUpdate = Date.now();
    }
  }

  /**
   * Get service history
   */
  getServiceHistory(serviceName) {
    return this.metrics.checks
      .map(check => ({
        timestamp: check.timestamp,
        status: check.results[serviceName]?.status
      }))
      .filter(entry => entry.status)
      .slice(-50);
  }

  /**
   * Clean old metrics
   */
  cleanOldMetrics() {
    const cutoff = Date.now() - this.config.metricsRetention;

    this.metrics.checks = this.metrics.checks.filter(c => c.timestamp > cutoff);
    this.metrics.errors = this.metrics.errors.filter(e => e.timestamp > cutoff);
    this.metrics.performance = this.metrics.performance.filter(p => p.timestamp > cutoff);
    this.metrics.alerts = this.metrics.alerts.filter(a => a.timestamp > cutoff || !a.resolved);

    logInfo('Old metrics cleaned', {
      checks: this.metrics.checks.length,
      errors: this.metrics.errors.length,
      performance: this.metrics.performance.length,
      alerts: this.metrics.alerts.length
    });
  }

  /**
   * Generate dashboard HTML
   */
  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Server Monitor</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            color: white;
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .card h2 {
            margin-top: 0;
            color: #333;
            font-size: 1.3em;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .status {
            padding: 8px 12px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin: 5px;
            font-size: 0.9em;
        }
        .status.healthy, .status.connected, .status.active {
            background: #10b981;
            color: white;
        }
        .status.unhealthy, .status.error, .status.disconnected {
            background: #ef4444;
            color: white;
        }
        .status.unknown, .status.not_configured {
            background: #6b7280;
            color: white;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-label {
            color: #6b7280;
            font-size: 0.95em;
        }
        .metric-value {
            font-weight: 600;
            color: #111827;
        }
        .alert {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .alert.resolved {
            opacity: 0.6;
        }
        .timestamp {
            color: #9ca3af;
            font-size: 0.85em;
            text-align: center;
            margin-top: 20px;
        }
        #auto-refresh {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 10px 20px;
            border-radius: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div id="auto-refresh">
        <label>
            <input type="checkbox" id="refresh-toggle" checked> Auto-refresh (5s)
        </label>
    </div>

    <div class="container">
        <h1>🚀 MCP Server Monitor Dashboard</h1>

        <div class="dashboard" id="dashboard">
            <div class="card">
                <h2>System Status</h2>
                <div id="system-status">Loading...</div>
            </div>

            <div class="card">
                <h2>Services Health</h2>
                <div id="services-health">Loading...</div>
            </div>

            <div class="card">
                <h2>AI Providers</h2>
                <div id="ai-providers">Loading...</div>
            </div>

            <div class="card">
                <h2>External APIs</h2>
                <div id="external-apis">Loading...</div>
            </div>

            <div class="card">
                <h2>Performance Metrics</h2>
                <div id="performance">Loading...</div>
            </div>

            <div class="card">
                <h2>Active Alerts</h2>
                <div id="alerts">Loading...</div>
            </div>
        </div>

        <div class="timestamp" id="last-update"></div>
    </div>

    <script>
        let refreshInterval;

        async function updateDashboard() {
            try {
                const health = await fetch('/health').then(r => r.json());
                const metrics = await fetch('/metrics').then(r => r.json());
                const alerts = await fetch('/alerts').then(r => r.json());

                // Update system status
                document.getElementById('system-status').innerHTML = \`
                    <div class="metric">
                        <span class="metric-label">Status</span>
                        <span class="status healthy">Running</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Uptime</span>
                        <span class="metric-value">\${formatUptime(health.uptime)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Last Check</span>
                        <span class="metric-value">\${formatTime(health.lastCheck)}</span>
                    </div>
                \`;

                // Update services health
                document.getElementById('services-health').innerHTML = \`
                    <div class="status \${health.services.mcpServer.status}">\${health.services.mcpServer.status}</div>
                    MCP Server<br>
                    <div class="status \${health.services.mainServer.status}">\${health.services.mainServer.status}</div>
                    Main Server<br>
                    <div class="status \${health.services.database.status}">\${health.services.database.status}</div>
                    Database<br>
                    <div class="status \${health.services.redis.status}">\${health.services.redis.status}</div>
                    Redis Cache
                \`;

                // Update AI providers
                const aiHtml = Object.entries(health.services.aiProviders).map(([name, provider]) =>
                    \`<div class="metric">
                        <span class="metric-label">\${name.charAt(0).toUpperCase() + name.slice(1)}</span>
                        <span class="status \${provider.status}">\${provider.status}</span>
                    </div>\`
                ).join('');
                document.getElementById('ai-providers').innerHTML = aiHtml;

                // Update external APIs
                const apiHtml = Object.entries(health.services.externalAPIs).map(([name, api]) =>
                    \`<div class="metric">
                        <span class="metric-label">\${name.charAt(0).toUpperCase() + name.slice(1)}</span>
                        <span class="status \${api.status}">\${api.status}</span>
                    </div>\`
                ).join('');
                document.getElementById('external-apis').innerHTML = apiHtml;

                // Update performance
                const systemHealth = metrics.systemHealth || {};
                document.getElementById('performance').innerHTML = \`
                    <div class="metric">
                        <span class="metric-label">Health Score</span>
                        <span class="metric-value">\${systemHealth.healthPercentage || 0}%</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Recent Errors</span>
                        <span class="metric-value">\${systemHealth.recentErrors || 0}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Active Alerts</span>
                        <span class="metric-value">\${systemHealth.alertsActive || 0}</span>
                    </div>
                \`;

                // Update alerts
                const activeAlerts = alerts.active || [];
                if (activeAlerts.length === 0) {
                    document.getElementById('alerts').innerHTML = '<p style="color: #10b981;">No active alerts</p>';
                } else {
                    const alertsHtml = activeAlerts.slice(0, 5).map(alert =>
                        \`<div class="alert">
                            <strong>\${alert.severity.toUpperCase()}</strong>: \${alert.message}
                            <br><small>\${formatTime(alert.timestamp)}</small>
                        </div>\`
                    ).join('');
                    document.getElementById('alerts').innerHTML = alertsHtml;
                }

                // Update timestamp
                document.getElementById('last-update').textContent = 'Last updated: ' + new Date().toLocaleTimeString();

            } catch (error) {
                // Silent fail - dashboard will retry on next interval
                document.getElementById('last-update').textContent = 'Update failed - retrying...';
            }
        }

        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return \`\${hours}h \${minutes}m\`;
        }

        function formatTime(timestamp) {
            if (!timestamp) return 'Never';
            return new Date(timestamp).toLocaleTimeString();
        }

        // Auto-refresh toggle
        document.getElementById('refresh-toggle').addEventListener('change', (e) => {
            if (e.target.checked) {
                refreshInterval = setInterval(updateDashboard, 5000);
            } else {
                clearInterval(refreshInterval);
            }
        });

        // Initial load and auto-refresh
        updateDashboard();
        refreshInterval = setInterval(updateDashboard, 5000);
    </script>
</body>
</html>
    `;
  }

  /**
   * Stop the monitoring agent
   */
  async stop() {
    if (!this.state.isRunning) {
      logWarn('Monitor agent not running');
      return;
    }

    try {
      // Clear timers
      if (this.checkTimer) {
        clearInterval(this.checkTimer);
        this.checkTimer = null;
      }

      // Close WebSocket
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      // Close server
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        this.server = null;
      }

      this.state.isRunning = false;
      this.emit('stopped');

      logInfo('MCP Monitor Agent stopped');

    } catch (error) {
      logError('Failed to stop monitor agent', error);
      throw error;
    }
  }
}

// Export the monitor agent
export default MCPMonitorAgent;

// Auto-start if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new MCPMonitorAgent();

  agent.on('alert', (alert) => {
    logWarn('ALERT', alert);
  });

  agent.start().catch(error => {
    logError('Failed to start monitor agent', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logInfo('Shutting down monitor agent...');
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logInfo('Shutting down monitor agent...');
    await agent.stop();
    process.exit(0);
  });
}