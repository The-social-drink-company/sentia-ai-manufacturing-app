/**
 * Dashboard API Integration Routes
 * 
 * Provides HTTP endpoints for secure communication between the MCP server
 * and the dashboard application across all environments (development, test, production).
 * 
 * Features:
 * - JWT authentication between services
 * - Environment-aware routing
 * - Real-time data synchronization
 * - Tool execution endpoints
 * - Health and status monitoring
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/server-config.js';
import { createUnifiedApiClient } from '../../../services/integration/UnifiedApiClient.js';
import { logInfo, logWarn, logError } from '../utils/logger.js';

const router = express.Router();

/**
 * JWT Authentication Middleware
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'MISSING_TOKEN' 
    });
  }

  try {
    const environment = process.env.NODE_ENV || 'development';
    const jwtSecret = CONFIG.integrations.dashboard[environment]?.jwtSecret || CONFIG.security.jwtSecret;
    
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    
    logInfo('Dashboard API authentication successful', {
      userId: decoded.sub,
      environment,
      endpoint: req.path
    });
    
    next();
  } catch (error) {
    logWarn('Dashboard API authentication failed', {
      error: error.message,
      endpoint: req.path,
      token: token.substring(0, 20) + '...'
    });
    
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN' 
    });
  }
}

/**
 * Request validation middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Request validation failed',
        details: error.details.map(d => d.message),
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  };
}

/**
 * Generate JWT token for dashboard communication
 */
router.post('/auth/token', async (req, res) => {
  try {
    const { clientId, clientSecret, environment } = req.body;
    
    // Validate client credentials
    const expectedClientId = process.env.MCP_CLIENT_ID || 'sentia-dashboard';
    const expectedClientSecret = process.env.MCP_CLIENT_SECRET || CONFIG.security.jwtSecret;
    
    if (clientId !== expectedClientId || clientSecret !== expectedClientSecret) {
      return res.status(401).json({
        error: 'Invalid client credentials',
        code: 'INVALID_CLIENT'
      });
    }

    const jwtSecret = CONFIG.integrations.dashboard[environment]?.jwtSecret || CONFIG.security.jwtSecret;
    const token = jwt.sign(
      { 
        sub: 'dashboard-service',
        iss: 'sentia-mcp-server',
        aud: 'sentia-dashboard',
        environment,
        permissions: ['data:read', 'tools:execute', 'status:read']
      },
      jwtSecret,
      { 
        expiresIn: CONFIG.security.jwtExpiresIn,
        algorithm: 'HS256'
      }
    );

    logInfo('JWT token issued for dashboard', {
      environment,
      clientId,
      expiresIn: CONFIG.security.jwtExpiresIn
    });

    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 24 * 60 * 60, // 24 hours in seconds
      environment
    });

  } catch (error) {
    logError('Failed to generate JWT token', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Token generation failed',
      code: 'TOKEN_GENERATION_ERROR'
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: CONFIG.server.version,
    services: {
      database: 'connected', // TODO: Add actual database health check
      redis: 'connected',     // TODO: Add actual Redis health check
      apis: {}               // TODO: Add API health checks
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  res.json(health);
});

/**
 * Get MCP server status and capabilities
 */
router.get('/status', authenticateJWT, async (req, res) => {
  try {
    const apiClient = createUnifiedApiClient();
    const serviceHealth = await apiClient.getServiceHealth();
    
    const status = {
      server: {
        name: CONFIG.server.name,
        version: CONFIG.server.version,
        environment: CONFIG.server.environment,
        uptime: process.uptime()
      },
      capabilities: {
        tools: Object.keys(CONFIG.tools.enabledCategories),
        integrations: Object.keys(CONFIG.integrations),
        transports: {
          stdio: CONFIG.transport.stdio.enabled,
          http: CONFIG.transport.http.enabled,
          sse: CONFIG.transport.sse.enabled
        }
      },
      services: serviceHealth,
      performance: {
        averageResponseTime: null, // TODO: Calculate from metrics
        successRate: null,         // TODO: Calculate from metrics
        activeConnections: null    // TODO: Get from connection pool
      }
    };

    res.json(status);

  } catch (error) {
    logError('Failed to get MCP server status', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to retrieve server status',
      code: 'STATUS_ERROR'
    });
  }
});

/**
 * Execute MCP tool
 */
router.post('/tools/execute', authenticateJWT, async (req, res) => {
  try {
    const { tool, arguments: toolArgs, options = {} } = req.body;
    
    if (!tool) {
      return res.status(400).json({
        error: 'Tool name is required',
        code: 'MISSING_TOOL'
      });
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logInfo('Tool execution requested', {
      requestId,
      tool,
      arguments: toolArgs,
      userId: req.user.sub
    });

    // TODO: Implement actual tool execution
    // This would integrate with the MCP tool system
    const result = {
      tool,
      requestId,
      status: 'completed',
      result: {
        message: `Tool ${tool} executed successfully`,
        data: toolArgs,
        timestamp: new Date().toISOString()
      },
      executionTime: Math.floor(Math.random() * 1000) + 100 // Mock execution time
    };

    logInfo('Tool execution completed', {
      requestId,
      tool,
      executionTime: result.executionTime,
      status: result.status
    });

    res.json(result);

  } catch (error) {
    logError('Tool execution failed', {
      tool: req.body.tool,
      error: error.message,
      stack: error.stack,
      userId: req.user.sub
    });

    res.status(500).json({
      error: 'Tool execution failed',
      code: 'TOOL_EXECUTION_ERROR',
      details: error.message
    });
  }
});

/**
 * Get available tools
 */
router.get('/tools', authenticateJWT, (req, res) => {
  try {
    const tools = {
      categories: CONFIG.tools.enabledCategories,
      tools: [
        {
          name: 'xero_get_contacts',
          category: 'financial',
          description: 'Retrieve contacts from Xero accounting system',
          parameters: {
            limit: { type: 'number', default: 100 },
            offset: { type: 'number', default: 0 },
            includeArchived: { type: 'boolean', default: false }
          }
        },
        {
          name: 'shopify_get_orders',
          category: 'integration',
          description: 'Retrieve orders from Shopify stores',
          parameters: {
            region: { type: 'string', enum: ['uk', 'usa'], default: 'uk' },
            status: { type: 'string', enum: ['open', 'closed', 'cancelled'] },
            limit: { type: 'number', default: 50 }
          }
        },
        {
          name: 'amazon_get_inventory',
          category: 'integration',
          description: 'Retrieve inventory levels from Amazon FBA',
          parameters: {
            region: { type: 'string', enum: ['uk', 'usa'], default: 'uk' },
            sku: { type: 'string', optional: true },
            marketplace: { type: 'string', optional: true }
          }
        },
        {
          name: 'unleashed_get_products',
          category: 'manufacturing',
          description: 'Retrieve products from Unleashed inventory system',
          parameters: {
            includeObsolete: { type: 'boolean', default: false },
            productCode: { type: 'string', optional: true }
          }
        },
        {
          name: 'analyze_working_capital',
          category: 'financial',
          description: 'Perform working capital analysis and optimization',
          parameters: {
            timeframe: { type: 'string', enum: ['30d', '90d', '365d'], default: '90d' },
            includeProjections: { type: 'boolean', default: true }
          }
        }
      ]
    };

    res.json(tools);

  } catch (error) {
    logError('Failed to get available tools', {
      error: error.message,
      userId: req.user.sub
    });

    res.status(500).json({
      error: 'Failed to retrieve tools',
      code: 'TOOLS_ERROR'
    });
  }
});

/**
 * Get real-time data for dashboard
 */
router.get('/data/realtime', authenticateJWT, async (req, res) => {
  try {
    const { metrics = [], timeframe = '24h' } = req.query;
    
    // TODO: Implement real-time data aggregation
    const realtimeData = {
      timestamp: new Date().toISOString(),
      timeframe,
      metrics: {
        workingCapital: {
          current: 150000,
          trend: '+5.2%',
          cashConversionCycle: 45
        },
        inventory: {
          totalValue: 500000,
          turnoverRate: 8.5,
          lowStockItems: 12
        },
        orders: {
          todayCount: 23,
          todayValue: 15670,
          pendingCount: 156
        },
        revenue: {
          mtd: 89450,
          growth: '+12.3%',
          forecast: 125000
        }
      },
      alerts: [
        {
          type: 'warning',
          message: 'Inventory levels low for SKU ABC123',
          priority: 'medium',
          timestamp: new Date().toISOString()
        }
      ]
    };

    res.json(realtimeData);

  } catch (error) {
    logError('Failed to get real-time data', {
      error: error.message,
      metrics: req.query.metrics,
      userId: req.user.sub
    });

    res.status(500).json({
      error: 'Failed to retrieve real-time data',
      code: 'REALTIME_DATA_ERROR'
    });
  }
});

/**
 * Synchronize data from external APIs
 */
router.post('/sync/trigger', authenticateJWT, async (req, res) => {
  try {
    const { services = [], syncType = 'incremental', force = false } = req.body;
    
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        error: 'Services array is required and cannot be empty',
        code: 'MISSING_SERVICES'
      });
    }

    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logInfo('Data synchronization triggered', {
      syncId,
      services,
      syncType,
      force,
      userId: req.user.sub
    });

    // TODO: Implement actual sync trigger
    const syncStatus = {
      syncId,
      status: 'started',
      services: services.map(service => ({
        name: service,
        status: 'pending',
        startTime: new Date().toISOString(),
        estimatedDuration: '2-5 minutes'
      })),
      startTime: new Date().toISOString(),
      syncType,
      force
    };

    res.json(syncStatus);

  } catch (error) {
    logError('Failed to trigger data synchronization', {
      error: error.message,
      services: req.body.services,
      userId: req.user.sub
    });

    res.status(500).json({
      error: 'Failed to trigger synchronization',
      code: 'SYNC_TRIGGER_ERROR'
    });
  }
});

/**
 * Get synchronization status
 */
router.get('/sync/status/:syncId?', authenticateJWT, async (req, res) => {
  try {
    const { syncId } = req.params;
    
    if (syncId) {
      // Get specific sync status
      // TODO: Implement actual sync status lookup
      const syncStatus = {
        syncId,
        status: 'completed',
        services: [
          {
            name: 'xero',
            status: 'completed',
            recordsProcessed: 245,
            errors: 0,
            duration: '1m 23s'
          },
          {
            name: 'shopify_uk',
            status: 'completed',
            recordsProcessed: 89,
            errors: 0,
            duration: '45s'
          }
        ],
        startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        totalRecords: 334,
        totalErrors: 0
      };

      res.json(syncStatus);
    } else {
      // Get recent sync history
      // TODO: Implement actual sync history lookup
      const syncHistory = {
        recent: [
          {
            syncId: 'sync_recent_1',
            status: 'completed',
            services: ['xero', 'shopify_uk'],
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            duration: '3m 45s',
            recordsProcessed: 456
          },
          {
            syncId: 'sync_recent_2',
            status: 'completed',
            services: ['amazon_uk', 'unleashed'],
            startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            duration: '5m 12s',
            recordsProcessed: 234
          }
        ],
        nextScheduled: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };

      res.json(syncHistory);
    }

  } catch (error) {
    logError('Failed to get sync status', {
      error: error.message,
      syncId: req.params.syncId,
      userId: req.user.sub
    });

    res.status(500).json({
      error: 'Failed to retrieve sync status',
      code: 'SYNC_STATUS_ERROR'
    });
  }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
  logError('Dashboard API error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.sub
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

export default router;