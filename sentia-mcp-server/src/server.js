/**
 * Sentia Manufacturing MCP Server - Main Implementation
 * 
 * Enterprise-grade Model Context Protocol server with comprehensive
 * business intelligence capabilities for manufacturing operations.
 * 
 * Features:
 * - Full MCP SDK integration with dual transport support
 * - Dynamic tool loading and execution
 * - Enterprise security with JWT authentication
 * - Comprehensive monitoring and metrics
 * - Production-ready error handling and logging
 * 
 * @version 3.0.0
 * @author Sentia Manufacturing Team
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { WebSocketServer } from 'ws';
import http from 'http';

// Import local modules
import { SERVER_CONFIG, isContainerEnvironment, getContainerPlatform } from './config/server-config.js';
import { createLogger } from './utils/logger.js';
import { globalErrorHandler } from './utils/error-handler.js';
import dashboardRoutes from './routes/dashboard-integration.js';
import { handleDashboardErrors } from './middleware/dashboard-integration.js';

// Import new authentication and security modules
import { authenticateRequest, requireAuthentication, requireRole } from './middleware/auth.js';
import { requirePermissions, requireToolPermissions } from './middleware/permissions.js';
import { securityMonitoringMiddleware } from './middleware/security-monitoring.js';
import { auditLogger, AUDIT_EVENTS, AUDIT_SEVERITY } from './utils/audit-logger.js';

// Import existing integration modules
import { registerShopifyTools } from './tools/shopify-integration.js';
import { xeroTools, initializeXeroIntegration } from './tools/xero-integration.js';
import { registerAmazonTools } from './tools/amazon-integration.js';
import { registerAnthropicTools } from './tools/anthropic-integration.js';
import { registerUnleashedTools } from './tools/unleashed-integration.js';
import { registerOpenAITools } from './tools/openai-integration.js';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logger instance
const logger = createLogger();

// Database Pool - Optional initialization
let dbPool = null;
if (SERVER_CONFIG.database.url) {
  try {
    dbPool = new Pool({
      connectionString: SERVER_CONFIG.database.url,
      max: SERVER_CONFIG.database.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: SERVER_CONFIG.server.environment === 'production' ? { rejectUnauthorized: false } : false
    });
    logger.info('Database pool initialized');
  } catch (error) {
    logger.warn('Database pool initialization failed', { error: error.message });
    dbPool = null;
  }
} else {
  logger.warn('No database URL provided - database features disabled');
}

/**
 * Main MCP Server Class
 * Handles tool registration, execution, and transport management
 */
export class SentiaMCPServer {
  constructor() {
    // Initialize MCP server with basic configuration
    this.server = new Server(
      {
        name: SERVER_CONFIG.server.name,
        version: SERVER_CONFIG.server.version
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    this.tools = new Map();
    this.prompts = new Map();
    this.connections = new Map();
    this.metrics = {
      requests: 0,
      errors: 0,
      toolExecutions: 0,
      averageResponseTime: 0,
      uptime: Date.now()
    };
    
    // Load tools first, then setup handlers after tools are ready
    this.loadTools();
    this.initializeExpress();
  }

  /**
   * Set up MCP tool handlers
   */
  setupToolHandlers() {
    try {
      // Validate server instance exists
      if (!this.server) {
        throw new Error('MCP server instance not initialized');
      }

      // Validate tools collection exists
      if (!this.tools) {
        throw new Error('Tools collection not initialized');
      }

      logger.info('Registering MCP request handlers', {
        serverInitialized: !!this.server,
        toolsCount: this.tools.size
      });

      this.server.setRequestHandler(ListToolsRequestSchema, async () => {
        const toolsList = Array.from(this.tools.values()).map(tool => {
          // Validate each tool has required properties
          if (!tool || typeof tool !== 'object') {
            logger.warn('Invalid tool object found', { tool });
            return null;
          }

          return {
            name: tool.name || 'unknown',
            description: tool.description || 'No description available',
            inputSchema: tool.inputSchema || { type: 'object', properties: {} }
          };
        }).filter(Boolean); // Remove null entries

        logger.info('Tools list requested', { 
          correlationId: uuidv4(),
          toolsCount: toolsList.length 
        });

        return { tools: toolsList };
      });

      this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const correlationId = uuidv4();
        const startTime = Date.now();
        
        try {
          // Validate request parameters
          if (!request || !request.params) {
            throw new Error('Invalid request format - missing params');
          }

          const { name, arguments: args } = request.params;
          
          if (!name || typeof name !== 'string') {
            throw new Error('Invalid tool name provided');
          }

          logger.info('Tool execution started', {
            correlationId,
            toolName: name,
            arguments: args
          });

          if (!this.tools.has(name)) {
            throw new Error(`Tool ${name} not found`);
          }

          const tool = this.tools.get(name);
          
          // Validate tool has execute method
          if (!tool || typeof tool.execute !== 'function') {
            throw new Error(`Tool ${name} is missing execute method`);
          }

          // Validate parameters if schema exists
          if (tool.inputSchema) {
            this.validateToolParameters(args, tool.inputSchema);
          }

          // Execute tool with enhanced context
          const result = await tool.execute({
            ...args,
            correlationId,
            timestamp: new Date().toISOString(),
            environment: SERVER_CONFIG.server.environment
          });

          const executionTime = Date.now() - startTime;
          this.updateMetrics('toolExecution', executionTime);

          logger.info('Tool execution completed', {
            correlationId,
            toolName: name,
            executionTime,
            success: true
          });

          return {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
              }
            ]
          };

        } catch (error) {
          const executionTime = Date.now() - startTime;
          this.updateMetrics('error', executionTime);

          logger.error('Tool execution failed', {
            correlationId,
            toolName: request?.params?.name || 'unknown',
            error: error.message,
            stack: error.stack,
            executionTime
          });

          return {
            content: [
              {
                type: 'text',
                text: `Error executing tool: ${error.message}`
              }
            ],
            isError: true
          };
        }
      });

      logger.info('MCP tool handlers registered successfully', {
        toolsCount: this.tools.size
      });

    } catch (error) {
      logger.error('Failed to setup tool handlers', {
        error: error.message,
        stack: error.stack,
        serverInitialized: !!this.server,
        toolsInitialized: !!this.tools
      });
      throw error; // Re-throw to prevent server from starting with broken handlers
    }
  }



  /**
   * Dynamically load tools from tools directory
   */
  async loadTools() {
    const toolsDir = join(__dirname, 'tools');
    
    try {
      const toolFiles = this.findToolFiles(toolsDir);
      
      logger.info('Loading tools', { 
        toolsDirectory: toolsDir,
        foundFiles: toolFiles.length 
      });

      for (const toolFile of toolFiles) {
        try {
          // Convert Windows path to proper file:// URL for ES module import
          const toolFileUrl = `file://${toolFile.replace(/\\/g, '/')}`;
          const toolModule = await import(toolFileUrl);
          const tool = toolModule.default || toolModule;
          
          if (tool && tool.name && typeof tool.execute === 'function') {
            // Additional validation for tool properties
            if (typeof tool.name !== 'string' || tool.name.trim() === '') {
              logger.warn('Tool has invalid name', { file: toolFile, name: tool.name });
              continue;
            }

            if (typeof tool.execute !== 'function') {
              logger.warn('Tool execute method is not a function', { file: toolFile, name: tool.name });
              continue;
            }

            this.tools.set(tool.name, {
              name: tool.name,
              description: tool.description || `Execute ${tool.name}`,
              inputSchema: tool.inputSchema,
              execute: tool.execute.bind(tool),
              category: tool.category || 'general',
              version: tool.version || '1.0.0'
            });

            logger.info('Tool loaded successfully', {
              toolName: tool.name,
              category: tool.category,
              file: toolFile
            });
          } else {
            logger.warn('Invalid tool format - missing name or execute method', { 
              file: toolFile,
              hasName: !!(tool && tool.name),
              hasExecute: !!(tool && typeof tool.execute === 'function'),
              toolType: typeof tool
            });
          }
        } catch (error) {
          logger.error('Failed to load tool', {
            file: toolFile,
            error: error.message
          });
        }
      }

      logger.info('Tool loading completed', {
        totalTools: this.tools.size,
        categories: [...new Set(Array.from(this.tools.values()).map(t => t.category))]
      });

    } catch (error) {
      logger.error('Tools directory scan failed', {
        directory: toolsDir,
        error: error.message
      });
    }

    // Load default system tools
    this.loadSystemTools();
    this.loadPromptTemplates();
    
    // Load integration tools
    await this.loadIntegrationTools();
  }

  /**
   * Recursively find tool files
   */
  findToolFiles(dir) {
    const files = [];
    
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...this.findToolFiles(fullPath));
        } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      logger.warn('Directory scan failed', { directory: dir, error: error.message });
    }
    
    return files;
  }

  /**
   * Load built-in system tools
   */
  loadSystemTools() {
    // System Status Tool
    this.tools.set('system-status', {
      name: 'system-status',
      description: 'Get comprehensive system health and performance metrics',
      category: 'system',
      inputSchema: {
        type: 'object',
        properties: {
          includeMetrics: { type: 'boolean', default: true },
          includeConnections: { type: 'boolean', default: true }
        }
      },
      execute: async (params) => {
        const status = await this.getSystemStatus(params);
        return status;
      }
    });

    // Tool Registry Tool
    this.tools.set('list-tools', {
      name: 'list-tools',
      description: 'List all available tools with detailed information',
      category: 'system',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Filter by category' }
        }
      },
      execute: async (params) => {
        let tools = Array.from(this.tools.values());
        
        if (params.category) {
          tools = tools.filter(tool => tool.category === params.category);
        }

        return {
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            category: tool.category,
            version: tool.version,
            hasSchema: !!tool.inputSchema
          })),
          categories: [...new Set(Array.from(this.tools.values()).map(t => t.category))],
          totalCount: tools.length
        };
      }
    });

    // Database Query Tool
    this.tools.set('database-query', {
      name: 'database-query',
      description: 'Execute read-only database queries for analytics',
      category: 'database',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'SQL query to execute' },
          params: { type: 'array', description: 'Query parameters' }
        },
        required: ['query']
      },
      execute: async (params) => {
        return await this.executeReadOnlyQuery(params.query, params.params || []);
      }
    });
  }

  /**
   * Load integration tools (Shopify, Xero, etc.)
   */
  async loadIntegrationTools() {
    try {
      logger.info('Loading integration tools...');

      // Load Shopify integration
      try {
        await registerShopifyTools(this);
        logger.info('Shopify integration loaded successfully');
      } catch (error) {
        logger.warn('Failed to load Shopify integration', { error: error.message });
      }

      // Load Xero integration
      try {
        await initializeXeroIntegration();
        xeroTools.forEach(tool => this.addTool(tool));
        logger.info('Xero integration loaded successfully');
      } catch (error) {
        logger.warn('Failed to load Xero integration', { error: error.message });
      }

      // Load Amazon integration
      try {
        await registerAmazonTools(this);
        logger.info('Amazon integration loaded successfully');
      } catch (error) {
        logger.warn('Failed to load Amazon integration', { error: error.message });
      }

      // Load Anthropic integration
      try {
        await registerAnthropicTools(this);
        logger.info('Anthropic integration loaded successfully');
      } catch (error) {
        logger.warn('Failed to load Anthropic integration', { error: error.message });
      }

      // Load OpenAI integration
      try {
        await registerOpenAITools(this);
        logger.info('OpenAI integration loaded successfully');
      } catch (error) {
        logger.warn('Failed to load OpenAI integration', { error: error.message });
      }

      // Load Unleashed integration
      try {
        await registerUnleashedTools(this);
        logger.info('Unleashed integration loaded successfully');
      } catch (error) {
        logger.warn('Failed to load Unleashed integration', { error: error.message });
      }

      logger.info('Integration tools loading completed');

    } catch (error) {
      logger.error('Failed to load integration tools', {
        error: error.message
      });
    }
  }

  /**
   * Load prompt templates for common operations
   */
  loadPromptTemplates() {
    // Manufacturing Analysis Prompt
    this.prompts.set('manufacturing-analysis', {
      name: 'manufacturing-analysis',
      description: 'Generate detailed manufacturing analysis prompts',
      arguments: [
        { name: 'metric', description: 'The metric to analyze (OEE, quality, throughput, etc.)' },
        { name: 'timeframe', description: 'Analysis timeframe (daily, weekly, monthly)' },
        { name: 'context', description: 'Additional context or constraints' }
      ],
      generate: async (args) => {
        const { metric, timeframe, context } = args;
        
        return [
          {
            role: 'system',
            content: {
              type: 'text',
              text: `You are an expert manufacturing analyst specializing in ${metric} optimization. 
                     Provide detailed insights based on ${timeframe} data analysis.
                     ${context ? `Additional context: ${context}` : ''}`
            }
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze the ${metric} performance over the past ${timeframe} and provide:
                     1. Key trends and patterns
                     2. Performance against industry benchmarks
                     3. Root cause analysis of any issues
                     4. Specific improvement recommendations
                     5. Implementation timeline and expected ROI`
            }
          }
        ];
      }
    });

    // Working Capital Optimization Prompt
    this.prompts.set('working-capital-optimization', {
      name: 'working-capital-optimization',
      description: 'Generate working capital optimization analysis prompts',
      arguments: [
        { name: 'currentCCC', description: 'Current cash conversion cycle in days' },
        { name: 'targetCCC', description: 'Target cash conversion cycle in days' },
        { name: 'constraints', description: 'Business constraints or limitations' }
      ],
      generate: async (args) => {
        const { currentCCC, targetCCC, constraints } = args;
        
        return [
          {
            role: 'system',
            content: {
              type: 'text',
              text: `You are a CFO advisor specializing in working capital optimization for manufacturing companies.
                     Focus on actionable strategies to improve cash flow and operational efficiency.`
            }
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze working capital optimization opportunities:
                     Current CCC: ${currentCCC} days
                     Target CCC: ${targetCCC} days
                     Constraints: ${constraints || 'None specified'}
                     
                     Provide:
                     1. DSO optimization strategies
                     2. DPO extension opportunities
                     3. DIO reduction recommendations
                     4. Implementation roadmap with quick wins
                     5. Risk mitigation strategies
                     6. Expected cash flow impact`
            }
          }
        ];
      }
    });
  }

  /**
   * Initialize Express server for HTTP transport and health endpoints
   */
  initializeExpress() {
    this.app = express();

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: SERVER_CONFIG.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
    }));

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: SERVER_CONFIG.security.rateLimitWindow,
      max: SERVER_CONFIG.security.rateLimitMax,
      message: {
        error: 'Too many requests',
        retryAfter: Math.ceil(SERVER_CONFIG.security.rateLimitWindow / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Correlation ID middleware
    this.app.use((req, res, next) => {
      req.correlationId = req.headers['x-correlation-id'] || uuidv4();
      res.setHeader('X-Correlation-ID', req.correlationId);
      next();
    });

    // Security monitoring middleware (includes development bypass)
    this.app.use(securityMonitoringMiddleware);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info('HTTP request', {
        correlationId: req.correlationId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
      next();
    });

    this.setupRoutes();
    this.setupDashboardIntegration();
  }

  /**
   * Set up Express routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.getSystemStatus({ 
          includeMetrics: true,
          includeConnections: true 
        });
        
        res.json({
          status: health.status,
          timestamp: new Date().toISOString(),
          version: SERVER_CONFIG.server.version,
          environment: SERVER_CONFIG.server.environment,
          ...health
        });
      } catch (error) {
        logger.error('Health check failed', {
          correlationId: req.correlationId,
          error: error.message
        });
        
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json({
        ...this.metrics,
        uptime: Date.now() - this.metrics.uptime,
        timestamp: new Date().toISOString()
      });
    });

    // Tool execution endpoint with enhanced security
    this.app.post('/api/tools/:toolName', 
      this.authenticateRequest.bind(this),
      requireToolPermissions(), // Add tool permission checking
      async (req, res) => {
        const { toolName } = req.params;
        const correlationId = req.correlationId;
        const startTime = Date.now();

        try {
          // Log tool execution attempt
          await auditLogger.logEvent(AUDIT_EVENTS.TOOL_EXECUTION_START, {
            toolName,
            parameters: Object.keys(req.body || {}),
            userAgent: req.headers['user-agent']
          }, {
            severity: AUDIT_SEVERITY.LOW,
            userId: req.user?.id,
            sessionId: req.user?.sessionId,
            correlationId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            resource: 'tool',
            action: 'execute'
          });

          if (!this.tools.has(toolName)) {
            await auditLogger.logEvent(AUDIT_EVENTS.TOOL_EXECUTION_FAILURE, {
              toolName,
              reason: 'tool_not_found'
            }, {
              severity: AUDIT_SEVERITY.MEDIUM,
              userId: req.user?.id,
              correlationId,
              outcome: 'failure'
            });

            return res.status(404).json({
              error: `Tool ${toolName} not found`,
              correlationId
            });
          }

          const tool = this.tools.get(toolName);
          
          // Validate parameters
          if (tool.inputSchema) {
            this.validateToolParameters(req.body, tool.inputSchema);
          }

          const result = await tool.execute({
            ...req.body,
            correlationId,
            timestamp: new Date().toISOString(),
            environment: SERVER_CONFIG.server.environment,
            user: req.user,
            authContext: req.authContext
          });

          const executionTime = Date.now() - startTime;
          this.updateMetrics('toolExecution', executionTime);

          // Log successful execution
          await auditLogger.logEvent(AUDIT_EVENTS.TOOL_EXECUTION_SUCCESS, {
            toolName,
            executionTime,
            resultSize: typeof result === 'string' ? result.length : JSON.stringify(result).length
          }, {
            severity: AUDIT_SEVERITY.LOW,
            userId: req.user?.id,
            sessionId: req.user?.sessionId,
            correlationId,
            outcome: 'success'
          });

          res.json({
            success: true,
            result,
            executionTime,
            correlationId
          });

        } catch (error) {
          const executionTime = Date.now() - startTime;
          this.updateMetrics('error', executionTime);

          // Log failed execution
          await auditLogger.logEvent(AUDIT_EVENTS.TOOL_EXECUTION_FAILURE, {
            toolName,
            error: error.message,
            executionTime
          }, {
            severity: AUDIT_SEVERITY.MEDIUM,
            userId: req.user?.id,
            sessionId: req.user?.sessionId,
            correlationId,
            outcome: 'failure'
          });

          logger.error('HTTP tool execution failed', {
            correlationId,
            toolName,
            userId: req.user?.id,
            error: error.message,
            stack: error.stack
          });

          res.status(500).json({
            success: false,
            error: error.message,
            correlationId,
            executionTime
          });
        }
      });

    // Tools list endpoint
    this.app.get('/api/tools', (req, res) => {
      const { category } = req.query;
      let tools = Array.from(this.tools.values());
      
      if (category) {
        tools = tools.filter(tool => tool.category === category);
      }

      res.json({
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          version: tool.version,
          hasSchema: !!tool.inputSchema
        })),
        categories: [...new Set(Array.from(this.tools.values()).map(t => t.category))],
        totalCount: tools.length
      });
    });

    // SSE endpoint for real-time updates
    this.app.get('/api/events', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const connectionId = uuidv4();
      this.connections.set(connectionId, res);

      // Send welcome message
      res.write(`data: ${JSON.stringify({
        type: 'connection',
        connectionId,
        message: 'Connected to MCP Server events',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Handle client disconnect
      req.on('close', () => {
        this.connections.delete(connectionId);
        logger.info('SSE connection closed', { connectionId });
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
    });

    // WebSocket upgrade endpoint for real-time connections
    this.app.get('/ws', (req, res) => {
      // This endpoint will be upgraded to WebSocket by the WebSocket server
      res.status(426).json({
        error: 'Upgrade Required',
        message: 'This endpoint requires WebSocket protocol upgrade',
        upgrade: 'websocket'
      });
    });
  }

  /**
   * Set up dashboard integration routes and middleware
   */
  setupDashboardIntegration() {
    // Make server instance available to routes
    this.app.locals.server = this;
    
    // Dashboard integration routes
    this.app.use('/api/dashboard', dashboardRoutes);
    
    // Dashboard-specific error handling
    this.app.use('/api/dashboard', handleDashboardErrors);
    
    logger.info('Dashboard integration configured', {
      routes: [
        '/api/dashboard/health',
        '/api/dashboard/tools',
        '/api/dashboard/metrics',
        '/api/dashboard/events'
      ]
    });
  }

  /**
   * Enhanced Authentication middleware (replaced with new security system)
   * CRITICAL: Development bypass maintained for fast development workflow
   */
  async authenticateRequest(req, res, next) {
    // Use the new authentication middleware
    return authenticateRequest(req, res, next);
  }

  /**
   * Validate tool parameters against schema
   */
  validateToolParameters(params, schema) {
    // Basic schema validation - in production use a proper JSON schema validator
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in params)) {
          throw new Error(`Missing required parameter: ${field}`);
        }
      }
    }

    // Type validation for properties
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in params) {
          const value = params[field];
          const expectedType = fieldSchema.type;
          
          if (expectedType === 'string' && typeof value !== 'string') {
            throw new Error(`Parameter ${field} must be a string`);
          }
          if (expectedType === 'number' && typeof value !== 'number') {
            throw new Error(`Parameter ${field} must be a number`);
          }
          if (expectedType === 'boolean' && typeof value !== 'boolean') {
            throw new Error(`Parameter ${field} must be a boolean`);
          }
          if (expectedType === 'array' && !Array.isArray(value)) {
            throw new Error(`Parameter ${field} must be an array`);
          }
        }
      }
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(params = {}) {
    const { includeMetrics = true, includeConnections = true } = params;
    
    try {
      // Database health check
      const dbHealth = await this.checkDatabaseHealth();
      
      const status = {
        status: dbHealth.connected ? 'healthy' : 'degraded',
        server: {
          uptime: Date.now() - this.metrics.uptime,
          version: SERVER_CONFIG.server.version,
          environment: SERVER_CONFIG.server.environment,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
          },
          cpu: process.cpuUsage()
        },
        database: dbHealth,
        tools: {
          total: this.tools.size,
          categories: [...new Set(Array.from(this.tools.values()).map(t => t.category))]
        }
      };

      if (includeMetrics) {
        status.metrics = { ...this.metrics };
      }

      if (includeConnections) {
        status.connections = {
          active: this.connections.size,
          total: this.metrics.requests
        };
      }

      return status;

    } catch (error) {
      logger.error('System status check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check database connectivity and performance
   */
  async checkDatabaseHealth() {
    if (!dbPool) {
      return {
        connected: false,
        error: 'Database pool not initialized',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const startTime = Date.now();
      const result = await dbPool.query('SELECT NOW(), version()');
      const latency = Date.now() - startTime;

      return {
        connected: true,
        latency,
        timestamp: result.rows[0].now,
        version: result.rows[0].version,
        poolSize: dbPool.totalCount,
        idleConnections: dbPool.idleCount,
        waitingClients: dbPool.waitingCount
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute read-only database queries
   */
  async executeReadOnlyQuery(query, params = []) {
    if (!dbPool) {
      throw new Error('Database not available - pool not initialized');
    }

    // Ensure query is read-only
    const readOnlyPattern = /^\s*(SELECT|WITH|EXPLAIN)\s+/i;
    if (!readOnlyPattern.test(query.trim())) {
      throw new Error('Only read-only queries are allowed');
    }

    try {
      const startTime = Date.now();
      const result = await dbPool.query(query, params);
      const executionTime = Date.now() - startTime;

      logger.info('Database query executed', {
        query: query.substring(0, 100),
        rowCount: result.rowCount,
        executionTime
      });

      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        executionTime,
        fields: result.fields?.map(f => ({ name: f.name, type: f.dataTypeID }))
      };

    } catch (error) {
      logger.error('Database query failed', {
        query: query.substring(0, 100),
        error: error.message
      });

      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  /**
   * Update server metrics
   */
  updateMetrics(type, duration = 0) {
    this.metrics.requests++;
    
    if (type === 'error') {
      this.metrics.errors++;
    } else if (type === 'toolExecution') {
      this.metrics.toolExecutions++;
    }

    // Update average response time
    if (duration > 0) {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime + duration) / 2;
    }
  }

  /**
   * Broadcast events to SSE connections
   */
  broadcastEvent(event) {
    const eventData = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString()
    });

    for (const [connectionId, res] of this.connections) {
      try {
        res.write(`data: ${eventData}\n\n`);
      } catch (error) {
        logger.warn('Failed to send SSE event', { connectionId, error: error.message });
        this.connections.delete(connectionId);
      }
    }
  }

  /**
   * Start the MCP server with dual transport support
   */
  async start() {
    try {
      logger.info('Starting MCP Server...', {
        port: SERVER_CONFIG.server.port,
        host: SERVER_CONFIG.server.host,
        environment: SERVER_CONFIG.server.environment,
        version: SERVER_CONFIG.server.version,
        toolsLoaded: this.tools.size
      });

      // Setup tool handlers after tools are loaded but before starting HTTP server
      logger.info('Setting up MCP tool handlers...');
      this.setupToolHandlers();
      logger.info('Tool handlers configured successfully');

      // Create HTTP server with proper promise handling
      const httpServer = await new Promise((resolve, reject) => {
        const server = http.createServer(this.app);
        
        server.listen(SERVER_CONFIG.server.port, SERVER_CONFIG.server.host, () => {
          logger.info('HTTP server listening', {
            port: SERVER_CONFIG.server.port,
            host: SERVER_CONFIG.server.host,
            pid: process.pid
          });
          resolve(server);
        });

        server.on('error', (error) => {
          logger.error('HTTP server error', { error: error.message });
          reject(error);
        });

        // Set server timeout to prevent hanging connections
        server.timeout = 30000; // 30 seconds
        server.keepAliveTimeout = 5000; // 5 seconds
        server.headersTimeout = 10000; // 10 seconds
      });

      // Set up WebSocket server
      const wss = new WebSocketServer({ 
        server: httpServer,
        path: '/ws',
        perMessageDeflate: false
      });

      // WebSocket connection handling
      wss.on('connection', (ws, request) => {
        const connectionId = uuidv4();
        logger.info('WebSocket connection established', { 
          connectionId,
          origin: request.headers.origin,
          userAgent: request.headers['user-agent']
        });

        // Store WebSocket connection
        this.connections.set(connectionId, ws);

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connection',
          connectionId,
          message: 'Connected to MCP Server WebSocket',
          timestamp: new Date().toISOString()
        }));

        // Handle incoming messages
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            logger.info('WebSocket message received', { connectionId, type: message.type });
            
            // Echo back for now - can be extended for real-time tool execution
            ws.send(JSON.stringify({
              type: 'response',
              data: message,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            logger.error('WebSocket message parse error', { 
              connectionId, 
              error: error.message 
            });
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Invalid message format',
              timestamp: new Date().toISOString()
            }));
          }
        });

        // Handle connection close
        ws.on('close', (code, reason) => {
          this.connections.delete(connectionId);
          logger.info('WebSocket connection closed', { 
            connectionId, 
            code, 
            reason: reason.toString() 
          });
        });

        // Handle errors
        ws.on('error', (error) => {
          logger.error('WebSocket error', { 
            connectionId, 
            error: error.message 
          });
          this.connections.delete(connectionId);
        });

        // Keep-alive ping
        const pingInterval = setInterval(() => {
          if (ws.readyState === ws.OPEN) {
            ws.ping();
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);

        ws.on('close', () => {
          clearInterval(pingInterval);
        });
      });

      logger.info('WebSocket server initialized', {
        path: '/ws',
        perMessageDeflate: false
      });

      logger.info('MCP Server started successfully', {
        port: SERVER_CONFIG.server.port,
        host: SERVER_CONFIG.server.host,
        environment: SERVER_CONFIG.server.environment,
        version: SERVER_CONFIG.server.version,
        toolsLoaded: this.tools.size,
        pid: process.pid,
        nodeVersion: process.version
      });

      // Log system startup event (with error handling)
      try {
        await auditLogger.logEvent(AUDIT_EVENTS.SYSTEM_START, {
          port: SERVER_CONFIG.server.port,
          host: SERVER_CONFIG.server.host,
          environment: SERVER_CONFIG.server.environment,
          version: SERVER_CONFIG.server.version,
          toolsLoaded: this.tools.size,
          authenticationEnabled: SERVER_CONFIG.security.authentication.enabled,
          developmentBypass: SERVER_CONFIG.security.authentication.developmentBypass
        }, {
          severity: AUDIT_SEVERITY.MEDIUM,
          outcome: 'success'
        });
      } catch (auditError) {
        logger.warn('Failed to log system startup audit event', { 
          error: auditError.message 
        });
      }

      // Keep the event loop alive
      const keepAliveInterval = setInterval(() => {
        logger.debug('Server heartbeat', { 
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          connections: this.connections.size
        });
      }, 30000); // Every 30 seconds

      // Store interval for cleanup
      this.keepAliveInterval = keepAliveInterval;

      // Handle graceful shutdown
      this.setupGracefulShutdown(httpServer);

      // Setup stdio transport only for Claude Desktop (not in container environments)
      // Container platforms should only use HTTP transport
      const inContainer = isContainerEnvironment();
      const containerPlatform = getContainerPlatform();
      const shouldUseStdio = process.env.MCP_TRANSPORT === 'stdio' && !inContainer;
      
      if (shouldUseStdio) {
        try {
          const transport = new StdioServerTransport();
          await this.server.connect(transport);
          logger.info('MCP stdio transport connected for Claude Desktop');
        } catch (error) {
          logger.warn('Failed to connect stdio transport, continuing with HTTP only', { 
            error: error.message 
          });
        }
      } else if (inContainer) {
        logger.info('Container environment detected - using HTTP transport only', {
          transport: process.env.MCP_TRANSPORT,
          platform: containerPlatform,
          containerEnvironment: inContainer
        });
      } else {
        logger.info('Local environment detected - HTTP transport ready', {
          transport: process.env.MCP_TRANSPORT || 'http'
        });
      }

      return httpServer;

    } catch (error) {
      logger.error('Failed to start MCP server', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Setup graceful shutdown handling with enhanced crash reporting
   */
  setupGracefulShutdown(httpServer) {
    const shutdown = async (signal) => {
      console.log('\n=== SHUTDOWN INITIATED ===');
      console.log('Signal:', signal);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Uptime:', Math.round(process.uptime()) + 's');
      
      logger.info('Graceful shutdown initiated', { 
        signal,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connections: this.connections.size
      });

      try {
        // Clear keep-alive interval
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          logger.info('Keep-alive interval cleared');
        }

        // Close HTTP server
        httpServer.close(() => {
          logger.info('HTTP server closed');
        });

        // Close database connections
        if (dbPool) {
          await dbPool.end();
          logger.info('Database connections closed');
        }

        // Close all SSE connections
        for (const [connectionId, res] of this.connections) {
          try {
            res.end();
          } catch (error) {
            logger.warn('Error closing SSE connection', { connectionId });
          }
        }
        this.connections.clear();

        logger.info('Graceful shutdown completed');
        console.log('=== SHUTDOWN COMPLETE ===\n');
        process.exit(0);
      } catch (shutdownError) {
        console.error('Error during shutdown:', shutdownError);
        logger.error('Shutdown error', { error: shutdownError.message, stack: shutdownError.stack });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Enhanced uncaught exception handler
    process.on('uncaughtException', (error) => {
      const crashInfo = {
        timestamp: new Date().toISOString(),
        signal: 'uncaughtException',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code
        },
        server: {
          uptime: process.uptime(),
          connections: this.connections.size,
          tools: this.tools.size,
          metrics: this.metrics
        },
        process: {
          pid: process.pid,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };
      
      console.error('\n=== UNCAUGHT EXCEPTION IN SERVER ===');
      console.error('Error:', error.name + ':', error.message);
      console.error('Stack:', error.stack);
      console.error('Server state:', crashInfo.server);
      console.error('=====================================\n');
      
      logger.error('Uncaught exception in MCP server', crashInfo);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      const rejectionInfo = {
        timestamp: new Date().toISOString(),
        signal: 'unhandledRejection',
        reason: reason instanceof Error ? {
          name: reason.name,
          message: reason.message,
          stack: reason.stack
        } : String(reason),
        promise: promise.toString(),
        server: {
          uptime: process.uptime(),
          connections: this.connections.size,
          tools: this.tools.size
        }
      };
      
      console.error('\n=== UNHANDLED REJECTION IN SERVER ===');
      console.error('Reason:', rejectionInfo.reason);
      console.error('Promise:', rejectionInfo.promise);
      console.error('Server state:', rejectionInfo.server);
      console.error('======================================\n');
      
      logger.error('Unhandled rejection in MCP server', rejectionInfo);
      shutdown('unhandledRejection');
    });
  }
}

console.log('[DEBUG] SentiaMCPServer class defined successfully');

// Start the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[DEBUG] Reached main execution point - Starting MCP Server directly from server.js');
  
  // Enhanced startup with crash reporting
  const server = new SentiaMCPServer();
  
  server.start().catch((error) => {
    console.error('\n=== DIRECT STARTUP FAILURE ===');
    console.error('File:', import.meta.url);
    console.error('Error:', error.name + ':', error.message);
    console.error('Stack:', error.stack);
    console.error('Process:', {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
    console.error('===============================\n');
    
    logger.error('Server startup failed from direct execution', { 
      error: error.message,
      stack: error.stack,
      process: {
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version
      }
    });
    
    setTimeout(() => {
      console.error('Exiting due to startup failure');
      process.exit(1);
    }, 1000);
  });
}