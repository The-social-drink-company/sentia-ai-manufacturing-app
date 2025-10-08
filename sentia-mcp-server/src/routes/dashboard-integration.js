/**
 * Dashboard Integration Routes
 * 
 * API routes specifically designed for communication between the main
 * dashboard and the standalone MCP server.
 */

import express from 'express';
import { createLogger } from '../utils/logger.js';
import { 
  authenticateDashboard, 
  requirePermission,
  validateDashboardRequest,
  enhanceDashboardResponse,
  dashboardHealthCheck
} from '../middleware/dashboard-integration.js';

const router = express.Router();
const logger = createLogger();

// Apply dashboard-specific middleware to all routes
router.use(validateDashboardRequest);
router.use(enhanceDashboardResponse);

/**
 * Dashboard health check endpoint
 */
router.get('/health', dashboardHealthCheck);

/**
 * Dashboard authentication test endpoint
 */
router.get('/auth/test', authenticateDashboard, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.dashboardUser.id,
      role: req.dashboardUser.role,
      permissions: req.dashboardUser.permissions,
      source: req.dashboardUser.source
    },
    message: 'Dashboard authentication successful'
  });
});

/**
 * Tool execution endpoint for dashboard
 */
router.post('/tools/:toolName/execute', 
  authenticateDashboard,
  requirePermission('tools.execute'),
  async (req, res, next) => {
    try {
      const { toolName } = req.params;
      const { server } = req.app.locals; // MCP server instance
      
      logger.info('Dashboard tool execution request', {
        correlationId: req.correlationId,
        toolName,
        userId: req.dashboardUser.id,
        parameters: Object.keys(req.body)
      });

      if (!server.tools.has(toolName)) {
        return res.status(404).json({
          success: false,
          error: `Tool ${toolName} not found`,
          availableTools: Array.from(server.tools.keys())
        });
      }

      const tool = server.tools.get(toolName);
      
      // Validate parameters if schema exists
      if (tool.inputSchema) {
        server.validateToolParameters(req.body, tool.inputSchema);
      }

      // Execute tool with dashboard context
      const result = await tool.execute({
        ...req.body,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        environment: server.CONFIG?.server?.environment || 'development',
        source: 'dashboard',
        user: {
          id: req.dashboardUser.id,
          role: req.dashboardUser.role
        }
      });

      res.json({
        success: true,
        toolName,
        result,
        executionTime: Date.now() - req.startTime
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Batch tool execution endpoint
 */
router.post('/tools/batch',
  authenticateDashboard,
  requirePermission('tools.execute'),
  async (req, res, next) => {
    try {
      const { tools } = req.body;
      const { server } = req.app.locals;
      
      if (!Array.isArray(tools) || tools.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Tools array is required and must not be empty'
        });
      }
      
      if (tools.length > 10) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 10 tools can be executed in a batch'
        });
      }

      logger.info('Dashboard batch tool execution', {
        correlationId: req.correlationId,
        toolCount: tools.length,
        toolNames: tools.map(t => t.name),
        userId: req.dashboardUser.id
      });

      const results = [];
      
      for (const toolRequest of tools) {
        try {
          const { name, parameters = {} } = toolRequest;
          
          if (!server.tools.has(name)) {
            results.push({
              tool: name,
              success: false,
              error: `Tool ${name} not found`
            });
            continue;
          }

          const tool = server.tools.get(name);
          
          // Validate parameters
          if (tool.inputSchema) {
            server.validateToolParameters(parameters, tool.inputSchema);
          }

          const result = await tool.execute({
            ...parameters,
            correlationId: req.correlationId,
            timestamp: new Date().toISOString(),
            source: 'dashboard-batch',
            user: {
              id: req.dashboardUser.id,
              role: req.dashboardUser.role
            }
          });

          results.push({
            tool: name,
            success: true,
            result
          });

        } catch (error) {
          results.push({
            tool: toolRequest.name,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        batchId: req.correlationId,
        results,
        totalTools: tools.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get available tools for dashboard
 */
router.get('/tools',
  authenticateDashboard,
  requirePermission('tools.list'),
  (req, res) => {
    const { server } = req.app.locals;
    const { category, includeSchema } = req.query;
    
    let tools = Array.from(server.tools.values());
    
    // Filter by category if specified
    if (category) {
      tools = tools.filter(tool => tool.category === category);
    }
    
    // Format tools for dashboard consumption
    const toolsList = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      version: tool.version,
      hasSchema: !!tool.inputSchema,
      ...(includeSchema === 'true' && tool.inputSchema && { schema: tool.inputSchema })
    }));

    res.json({
      success: true,
      tools: toolsList,
      categories: [...new Set(tools.map(t => t.category))],
      totalCount: toolsList.length
    });
  }
);

/**
 * Server metrics endpoint for dashboard monitoring
 */
router.get('/metrics',
  authenticateDashboard,
  requirePermission('system.metrics'),
  async (req, res, next) => {
    try {
      const { server } = req.app.locals;
      
      const metrics = {
        server: {
          uptime: process.uptime(),
          version: server.CONFIG?.server?.version || '3.0.0',
          environment: server.CONFIG?.server?.environment || 'development',
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        },
        performance: server.metrics || {},
        tools: {
          total: server.tools.size,
          categories: [...new Set(Array.from(server.tools.values()).map(t => t.category))]
        },
        connections: {
          active: server.connections?.size || 0
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      };
      
      res.json({
        success: true,
        metrics
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Database query endpoint for dashboard analytics
 */
router.post('/database/query',
  authenticateDashboard,
  requirePermission('database.query'),
  async (req, res, next) => {
    try {
      const { query, params = [] } = req.body;
      const { server } = req.app.locals;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'SQL query is required'
        });
      }

      logger.info('Dashboard database query', {
        correlationId: req.correlationId,
        queryLength: query.length,
        paramCount: params.length,
        userId: req.dashboardUser.id
      });

      const result = await server.executeReadOnlyQuery(query, params);
      
      res.json({
        success: true,
        query: {
          sql: query.length > 100 ? query.substring(0, 100) + '...' : query,
          paramCount: params.length
        },
        result
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Real-time events endpoint for dashboard
 */
router.get('/events',
  authenticateDashboard,
  requirePermission('system.events'),
  (req, res) => {
    const { server } = req.app.locals;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const connectionId = req.correlationId;
    
    // Add to server connections if available
    if (server.connections) {
      server.connections.set(connectionId, res);
    }

    // Send welcome message
    res.write(`data: ${JSON.stringify({
      type: 'dashboard-connection',
      connectionId,
      message: 'Connected to MCP Server dashboard events',
      timestamp: new Date().toISOString(),
      user: {
        id: req.dashboardUser.id,
        role: req.dashboardUser.role
      }
    })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
      if (server.connections) {
        server.connections.delete(connectionId);
      }
      logger.info('Dashboard SSE connection closed', { 
        connectionId,
        userId: req.dashboardUser.id 
      });
    });

    // Keep-alive ping
    const keepAlive = setInterval(() => {
      res.write(`data: ${JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
      })}\n\n`);
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
    });
  }
);

/**
 * Configuration endpoint for dashboard integration settings
 */
router.get('/config',
  authenticateDashboard,
  requirePermission('system.config'),
  (req, res) => {
    const { server } = req.app.locals;
    
    // Return safe configuration information for dashboard
    const config = {
      server: {
        version: server.CONFIG?.server?.version || '3.0.0',
        environment: server.CONFIG?.server?.environment || 'development'
      },
      transport: {
        type: server.CONFIG?.transport?.type || 'dual',
        httpEnabled: server.CONFIG?.transport?.http?.enabled !== false,
        sseEnabled: server.CONFIG?.transport?.sse?.enabled !== false
      },
      features: {
        authRequired: server.CONFIG?.security?.authRequired || false,
        rateLimitingEnabled: server.CONFIG?.security?.rateLimiting?.enabled !== false,
        monitoringEnabled: server.CONFIG?.monitoring?.enabled !== false
      },
      limits: {
        maxConcurrentTools: server.CONFIG?.tools?.maxConcurrent || 10,
        toolTimeout: server.CONFIG?.tools?.timeout || 30000,
        rateLimit: server.CONFIG?.security?.rateLimitMax || 100
      }
    };
    
    res.json({
      success: true,
      config
    });
  }
);


export default router;