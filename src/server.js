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

import process from 'node:process'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { rateLimit } from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readdirSync } from 'fs'
import winston from 'winston'
import { v4 as uuidv4 } from 'uuid'
import { Pool } from 'pg'

// Load environment variables
config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Server Configuration
const SERVER_CONFIG = {
  name: process.env.MCP_SERVER_NAME || 'sentia-manufacturing-mcp',
  version: '3.0.0',
  port: parseInt(process.env.MCP_SERVER_PORT) || 3001,
  environment: process.env.NODE_ENV || 'development',
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'https://sentia-manufacturing-development.onrender.com',
      'https://sentia-manufacturing-testing.onrender.com',
      'https://sentia-manufacturing-production.onrender.com',
      'http://localhost:3000',
    ],
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-dev',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  },
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
  },
}

// Enhanced Winston Logger with Correlation IDs
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        correlationId,
        ...meta,
      })
    })
  ),
  defaultMeta: { service: 'sentia-mcp-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// Database Pool
const dbPool = new Pool({
  connectionString: SERVER_CONFIG.database.url,
  max: SERVER_CONFIG.database.maxConnections,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: SERVER_CONFIG.environment === 'production' ? { rejectUnauthorized: false } : false,
})

/**
 * Main MCP Server Class
 * Handles tool registration, execution, and transport management
 */
class SentiaMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    )

    this.tools = new Map()
    this.resources = new Map()
    this.prompts = new Map()
    this.connections = new Map()
    this.metrics = {
      requests: 0,
      errors: 0,
      toolExecutions: 0,
      averageResponseTime: 0,
      uptime: Date.now(),
    }

    this.setupToolHandlers()
    this.setupResourceHandlers()
    this.setupPromptHandlers()
    this.loadTools()
    this.initializeExpress()
  }

  /**
   * Set up MCP tool handlers
   */
  setupToolHandlers() {
    this.server.setRequestHandler('tools/list', async () => {
      const toolsList = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema || { type: 'object', properties: {} },
      }))

      logger.info('Tools list requested', {
        correlationId: uuidv4(),
        toolsCount: toolsList.length,
      })

      return { tools: toolsList }
    })

    this.server.setRequestHandler('tools/call', async request => {
      const correlationId = uuidv4()
      const startTime = Date.now()

      try {
        const { name, arguments: args } = request.params

        logger.info('Tool execution started', {
          correlationId,
          toolName: name,
          arguments: args,
        })

        if (!this.tools.has(name)) {
          throw new Error(`Tool ${name} not found`)
        }

        const tool = this.tools.get(name)

        // Validate parameters if schema exists
        if (tool.inputSchema) {
          this.validateToolParameters(args, tool.inputSchema)
        }

        // Execute tool with enhanced context
        const result = await tool.execute({
          ...args,
          correlationId,
          timestamp: new Date().toISOString(),
          environment: SERVER_CONFIG.environment,
        })

        const executionTime = Date.now() - startTime
        this.updateMetrics('toolExecution', executionTime)

        logger.info('Tool execution completed', {
          correlationId,
          toolName: name,
          executionTime,
          success: true,
        })

        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error) {
        const executionTime = Date.now() - startTime
        this.updateMetrics('error', executionTime)

        logger.error('Tool execution failed', {
          correlationId,
          toolName: request.params.name,
          error: error.message,
          stack: error.stack,
          executionTime,
        })

        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool: ${error.message}`,
            },
          ],
          isError: true,
        }
      }
    })
  }

  /**
   * Set up MCP resource handlers for file operations
   */
  setupResourceHandlers() {
    this.server.setRequestHandler('resources/list', async () => {
      return {
        resources: Array.from(this.resources.keys()).map(uri => ({
          uri,
          name: this.resources.get(uri).name,
          description: this.resources.get(uri).description,
          mimeType: this.resources.get(uri).mimeType,
        })),
      }
    })

    this.server.setRequestHandler('resources/read', async request => {
      const { uri } = request.params
      const correlationId = uuidv4()

      try {
        if (!this.resources.has(uri)) {
          throw new Error(`Resource ${uri} not found`)
        }

        const resource = this.resources.get(uri)
        const content = await resource.read()

        logger.info('Resource read', {
          correlationId,
          uri,
          contentType: resource.mimeType,
        })

        return {
          contents: [
            {
              uri,
              mimeType: resource.mimeType,
              text: content,
            },
          ],
        }
      } catch (error) {
        logger.error('Resource read failed', {
          correlationId,
          uri,
          error: error.message,
        })

        throw error
      }
    })
  }

  /**
   * Set up MCP prompt handlers for common operations
   */
  setupPromptHandlers() {
    this.server.setRequestHandler('prompts/list', async () => {
      return {
        prompts: Array.from(this.prompts.values()).map(prompt => ({
          name: prompt.name,
          description: prompt.description,
          arguments: prompt.arguments || [],
        })),
      }
    })

    this.server.setRequestHandler('prompts/get', async request => {
      const { name, arguments: args } = request.params
      const correlationId = uuidv4()

      try {
        if (!this.prompts.has(name)) {
          throw new Error(`Prompt ${name} not found`)
        }

        const prompt = this.prompts.get(name)
        const messages = await prompt.generate(args)

        logger.info('Prompt generated', {
          correlationId,
          promptName: name,
          messagesCount: messages.length,
        })

        return { messages }
      } catch (error) {
        logger.error('Prompt generation failed', {
          correlationId,
          promptName: name,
          error: error.message,
        })

        throw error
      }
    })
  }

  /**
   * Dynamically load tools from tools directory
   */
  async loadTools() {
    const toolsDir = join(__dirname, '..', 'tools')

    try {
      const toolFiles = this.findToolFiles(toolsDir)

      logger.info('Loading tools', {
        toolsDirectory: toolsDir,
        foundFiles: toolFiles.length,
      })

      for (const toolFile of toolFiles) {
        try {
          const toolModule = await import(toolFile)
          const tool = toolModule.default || toolModule

          if (tool && tool.name && typeof tool.execute === 'function') {
            this.tools.set(tool.name, {
              name: tool.name,
              description: tool.description || `Execute ${tool.name}`,
              inputSchema: tool.inputSchema,
              execute: tool.execute.bind(tool),
              category: tool.category || 'general',
              version: tool.version || '1.0.0',
            })

            logger.info('Tool loaded successfully', {
              toolName: tool.name,
              category: tool.category,
              file: toolFile,
            })
          } else {
            logger.warn('Invalid tool format', { file: toolFile })
          }
        } catch (error) {
          logger.error('Failed to load tool', {
            file: toolFile,
            error: error.message,
          })
        }
      }

      logger.info('Tool loading completed', {
        totalTools: this.tools.size,
        categories: [...new Set(Array.from(this.tools.values()).map(t => t.category))],
      })
    } catch (error) {
      logger.error('Tools directory scan failed', {
        directory: toolsDir,
        error: error.message,
      })
    }

    // Load default system tools
    this.loadSystemTools()
    this.loadPromptTemplates()
  }

  /**
   * Recursively find tool files
   */
  findToolFiles(dir) {
    const files = []

    try {
      const entries = readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
          files.push(...this.findToolFiles(fullPath))
        } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      logger.warn('Directory scan failed', { directory: dir, error: error.message })
    }

    return files
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
          includeConnections: { type: 'boolean', default: true },
        },
      },
      execute: async params => {
        const status = await this.getSystemStatus(params)
        return status
      },
    })

    // Tool Registry Tool
    this.tools.set('list-tools', {
      name: 'list-tools',
      description: 'List all available tools with detailed information',
      category: 'system',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Filter by category' },
        },
      },
      execute: async params => {
        let tools = Array.from(this.tools.values())

        if (params.category) {
          tools = tools.filter(tool => tool.category === params.category)
        }

        return {
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            category: tool.category,
            version: tool.version,
            hasSchema: !!tool.inputSchema,
          })),
          categories: [...new Set(Array.from(this.tools.values()).map(t => t.category))],
          totalCount: tools.length,
        }
      },
    })

    // Database Query Tool
    this.tools.set('database-query', {
      name: 'database-query',
      description: 'Execute read-only database queries for analytics',
      category: 'database',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'SQL query to execute' },
          params: { type: 'array', description: 'Query parameters' },
        },
        required: ['query'],
      },
      execute: async params => {
        return await this.executeReadOnlyQuery(params.query, params.params || [])
      },
    })
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
        { name: 'context', description: 'Additional context or constraints' },
      ],
      generate: async args => {
        const { metric, timeframe, context } = args

        return [
          {
            role: 'system',
            content: {
              type: 'text',
              text: `You are an expert manufacturing analyst specializing in ${metric} optimization. 
                     Provide detailed insights based on ${timeframe} data analysis.
                     ${context ? `Additional context: ${context}` : ''}`,
            },
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
                     5. Implementation timeline and expected ROI`,
            },
          },
        ]
      },
    })

    // Working Capital Optimization Prompt
    this.prompts.set('working-capital-optimization', {
      name: 'working-capital-optimization',
      description: 'Generate working capital optimization analysis prompts',
      arguments: [
        { name: 'currentCCC', description: 'Current cash conversion cycle in days' },
        { name: 'targetCCC', description: 'Target cash conversion cycle in days' },
        { name: 'constraints', description: 'Business constraints or limitations' },
      ],
      generate: async args => {
        const { currentCCC, targetCCC, constraints } = args

        return [
          {
            role: 'system',
            content: {
              type: 'text',
              text: `You are a CFO advisor specializing in working capital optimization for manufacturing companies.
                     Focus on actionable strategies to improve cash flow and operational efficiency.`,
            },
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
                     6. Expected cash flow impact`,
            },
          },
        ]
      },
    })
  }

  /**
   * Initialize Express server for HTTP transport and health endpoints
   */
  initializeExpress() {
    this.app = express()

    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      })
    )

    // CORS configuration
    this.app.use(
      cors({
        origin: SERVER_CONFIG.cors.origins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
      })
    )

    // Compression and parsing
    this.app.use(compression())
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // Rate limiting
    const limiter = rateLimit({
      windowMs: SERVER_CONFIG.security.rateLimitWindow,
      max: SERVER_CONFIG.security.rateLimitMax,
      message: {
        error: 'Too many requests',
        retryAfter: Math.ceil(SERVER_CONFIG.security.rateLimitWindow / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
    this.app.use('/api/', limiter)

    // Correlation ID middleware
    this.app.use((req, res, next) => {
      req.correlationId = req.headers['x-correlation-id'] || uuidv4()
      res.setHeader('X-Correlation-ID', req.correlationId)
      next()
    })

    // Request logging
    this.app.use((req, res, next) => {
      logger.info('HTTP request', {
        correlationId: req.correlationId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      })
      next()
    })

    this.setupRoutes()
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
          includeConnections: true,
        })

        res.json({
          status: health.status,
          timestamp: new Date().toISOString(),
          version: SERVER_CONFIG.version,
          environment: SERVER_CONFIG.environment,
          ...health,
        })
      } catch (error) {
        logger.error('Health check failed', {
          correlationId: req.correlationId,
          error: error.message,
        })

        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString(),
        })
      }
    })

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json({
        ...this.metrics,
        uptime: Date.now() - this.metrics.uptime,
        timestamp: new Date().toISOString(),
      })
    })

    // Tool execution endpoint
    this.app.post('/api/tools/:toolName', this.authenticateRequest.bind(this), async (req, res) => {
      const { toolName } = req.params
      const correlationId = req.correlationId
      const startTime = Date.now()

      try {
        if (!this.tools.has(toolName)) {
          return res.status(404).json({
            error: `Tool ${toolName} not found`,
            correlationId,
          })
        }

        const tool = this.tools.get(toolName)

        // Validate parameters
        if (tool.inputSchema) {
          this.validateToolParameters(req.body, tool.inputSchema)
        }

        const result = await tool.execute({
          ...req.body,
          correlationId,
          timestamp: new Date().toISOString(),
          environment: SERVER_CONFIG.environment,
        })

        const executionTime = Date.now() - startTime
        this.updateMetrics('toolExecution', executionTime)

        res.json({
          success: true,
          result,
          executionTime,
          correlationId,
        })
      } catch (error) {
        const executionTime = Date.now() - startTime
        this.updateMetrics('error', executionTime)

        logger.error('HTTP tool execution failed', {
          correlationId,
          toolName,
          error: error.message,
          stack: error.stack,
        })

        res.status(500).json({
          success: false,
          error: error.message,
          correlationId,
          executionTime,
        })
      }
    })

    // Tools list endpoint
    this.app.get('/api/tools', (req, res) => {
      const { category } = req.query
      let tools = Array.from(this.tools.values())

      if (category) {
        tools = tools.filter(tool => tool.category === category)
      }

      res.json({
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          version: tool.version,
          hasSchema: !!tool.inputSchema,
        })),
        categories: [...new Set(Array.from(this.tools.values()).map(t => t.category))],
        totalCount: tools.length,
      })
    })

    // SSE endpoint for real-time updates
    this.app.get('/api/events', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      })

      const connectionId = uuidv4()
      this.connections.set(connectionId, res)

      // Send welcome message
      res.write(
        `data: ${JSON.stringify({
          type: 'connection',
          connectionId,
          message: 'Connected to MCP Server events',
          timestamp: new Date().toISOString(),
        })}\n\n`
      )

      // Handle client disconnect
      req.on('close', () => {
        this.connections.delete(connectionId)
        logger.info('SSE connection closed', { connectionId })
      })

      // Keep-alive ping
      const keepAlive = setInterval(() => {
        res.write(
          `data: ${JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString(),
          })}\n\n`
        )
      }, 30000)

      req.on('close', () => {
        clearInterval(keepAlive)
      })
    })
  }

  /**
   * JWT Authentication middleware
   */
  async authenticateRequest(req, res, next) {
    try {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // In development, allow unauthenticated requests
        if (SERVER_CONFIG.environment === 'development') {
          return next()
        }

        return res.status(401).json({
          error: 'Authentication required',
          correlationId: req.correlationId,
        })
      }

      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, SERVER_CONFIG.security.jwtSecret)

      req.user = decoded
      next()
    } catch (error) {
      logger.warn('Authentication failed', {
        correlationId: req.correlationId,
        error: error.message,
      })

      res.status(401).json({
        error: 'Invalid token',
        correlationId: req.correlationId,
      })
    }
  }

  /**
   * Validate tool parameters against schema
   */
  validateToolParameters(params, schema) {
    // Basic schema validation - in production use a proper JSON schema validator
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in params)) {
          throw new Error(`Missing required parameter: ${field}`)
        }
      }
    }

    // Type validation for properties
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in params) {
          const value = params[field]
          const expectedType = fieldSchema.type

          if (expectedType === 'string' && typeof value !== 'string') {
            throw new Error(`Parameter ${field} must be a string`)
          }
          if (expectedType === 'number' && typeof value !== 'number') {
            throw new Error(`Parameter ${field} must be a number`)
          }
          if (expectedType === 'boolean' && typeof value !== 'boolean') {
            throw new Error(`Parameter ${field} must be a boolean`)
          }
          if (expectedType === 'array' && !Array.isArray(value)) {
            throw new Error(`Parameter ${field} must be an array`)
          }
        }
      }
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(params = {}) {
    const { includeMetrics = true, includeConnections = true } = params

    try {
      // Database health check
      const dbHealth = await this.checkDatabaseHealth()

      const status = {
        status: dbHealth.connected ? 'healthy' : 'degraded',
        server: {
          uptime: Date.now() - this.metrics.uptime,
          version: SERVER_CONFIG.version,
          environment: SERVER_CONFIG.environment,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
          },
          cpu: process.cpuUsage(),
        },
        database: dbHealth,
        tools: {
          total: this.tools.size,
          categories: [...new Set(Array.from(this.tools.values()).map(t => t.category))],
        },
      }

      if (includeMetrics) {
        status.metrics = { ...this.metrics }
      }

      if (includeConnections) {
        status.connections = {
          active: this.connections.size,
          total: this.metrics.requests,
        }
      }

      return status
    } catch (error) {
      logger.error('System status check failed', { error: error.message })
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Check database connectivity and performance
   */
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now()
      const result = await dbPool.query('SELECT NOW(), version()')
      const latency = Date.now() - startTime

      return {
        connected: true,
        latency,
        timestamp: result.rows[0].now,
        version: result.rows[0].version,
        poolSize: dbPool.totalCount,
        idleConnections: dbPool.idleCount,
        waitingClients: dbPool.waitingCount,
      }
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Execute read-only database queries
   */
  async executeReadOnlyQuery(query, params = []) {
    // Ensure query is read-only
    const readOnlyPattern = /^\s*(SELECT|WITH|EXPLAIN)\s+/i
    if (!readOnlyPattern.test(query.trim())) {
      throw new Error('Only read-only queries are allowed')
    }

    try {
      const startTime = Date.now()
      const result = await dbPool.query(query, params)
      const executionTime = Date.now() - startTime

      logger.info('Database query executed', {
        query: query.substring(0, 100),
        rowCount: result.rowCount,
        executionTime,
      })

      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        executionTime,
        fields: result.fields?.map(f => ({ name: f.name, type: f.dataTypeID })),
      }
    } catch (error) {
      logger.error('Database query failed', {
        query: query.substring(0, 100),
        error: error.message,
      })

      throw new Error(`Database query failed: ${error.message}`)
    }
  }

  /**
   * Update server metrics
   */
  updateMetrics(type, duration = 0) {
    this.metrics.requests++

    if (type === 'error') {
      this.metrics.errors++
    } else if (type === 'toolExecution') {
      this.metrics.toolExecutions++
    }

    // Update average response time
    if (duration > 0) {
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime + duration) / 2
    }
  }

  /**
   * Broadcast events to SSE connections
   */
  broadcastEvent(event) {
    const eventData = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    })

    for (const [connectionId, res] of this.connections) {
      try {
        res.write(`data: ${eventData}\n\n`)
      } catch (error) {
        logger.warn('Failed to send SSE event', { connectionId, error: error.message })
        this.connections.delete(connectionId)
      }
    }
  }

  /**
   * Start the MCP server with dual transport support
   */
  async start() {
    try {
      // Start HTTP server
      const httpServer = this.app.listen(SERVER_CONFIG.port, () => {
        logger.info('MCP Server started', {
          port: SERVER_CONFIG.port,
          environment: SERVER_CONFIG.environment,
          version: SERVER_CONFIG.version,
          toolsLoaded: this.tools.size,
        })
      })

      // Handle graceful shutdown
      this.setupGracefulShutdown(httpServer)

      // Setup stdio transport for Claude Desktop
      if (process.env.MCP_TRANSPORT === 'stdio' || !process.env.MCP_TRANSPORT) {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        logger.info('MCP stdio transport connected')
      }

      return httpServer
    } catch (error) {
      logger.error('Failed to start MCP server', { error: error.message })
      throw error
    }
  }

  /**
   * Setup graceful shutdown handling
   */
  setupGracefulShutdown(httpServer) {
    const shutdown = async signal => {
      logger.info('Graceful shutdown initiated', { signal })

      // Close HTTP server
      httpServer.close(() => {
        logger.info('HTTP server closed')
      })

      // Close database connections
      await dbPool.end()
      logger.info('Database connections closed')

      // Close all SSE connections
      for (const [connectionId, res] of this.connections) {
        try {
          res.end()
          // eslint-disable-next-line no-unused-vars
        } catch (error) {
          // Error intentionally caught to prevent shutdown failure
          logger.warn('Error closing SSE connection', { connectionId })
        }
      }
      this.connections.clear()

      logger.info('Graceful shutdown completed')
      process.exit(0)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack })
      shutdown('uncaughtException')
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise })
      shutdown('unhandledRejection')
    })
  }
}

// Export the server class for testing and extension
export { SentiaMCPServer }

// Start the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SentiaMCPServer()
  server.start().catch(error => {
    logger.error('Server startup failed', { error: error.message })
    process.exit(1)
  })
}
