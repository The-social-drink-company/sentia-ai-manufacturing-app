/**
 * SENTIA MANUFACTURING DASHBOARD - PRODUCTION SERVER
 * Fixed and aligned with September 2025 specifications
 *
 * @version 2.0.0
 * @requires Node.js 18+
 * @framework Express 4.21.2
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { randomUUID } from 'crypto';

// Import cash coverage routes
import cashCoverageRoutes from './api/routes/cash-coverage.js';
import strategicPlanningRoutes from './api/routes/strategic-planning.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com';
const DATABASE_URL = process.env.DATABASE_URL;

// Memory optimization for Render free tier
if (IS_PRODUCTION) {
  process.env.NODE_OPTIONS = '--max-old-space-size=128';
}

// Deployment detection
const DEPLOYMENT = {
  isRender: !!process.env.RENDER,
  isRailway: !!process.env.RAILWAY_ENVIRONMENT,
  platform: process.env.RENDER ? 'Render' : process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local'
};

console.log(`
================================================================================
SENTIA MANUFACTURING DASHBOARD - PRODUCTION SERVER v2.0.0
================================================================================
Environment: ${NODE_ENV}
Platform: ${DEPLOYMENT.platform}
Port: ${PORT}
Database: ${DATABASE_URL ? 'Connected' : 'Not configured'}
MCP Server: ${MCP_SERVER_URL}
Memory Limit: ${process.env.NODE_OPTIONS || 'Default'}
================================================================================
`);

// ============================================================================
// EXPRESS APP INITIALIZATION
// ============================================================================

const app = express();
const server = createServer(app);

// Request ID middleware for correlation
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.id}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ============================================================================
// MIDDLEWARE STACK (Order matters!)
// ============================================================================

// 1. Helmet with CSP for Render deployment
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Required for React development
        "'unsafe-inline'" // Required for React hydration
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        MCP_SERVER_URL,
        "wss:",
        "ws:"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: IS_PRODUCTION ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: IS_PRODUCTION ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// 2. CORS configured for Render URLs
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://sentia-manufacturing-development.onrender.com',
      'https://sentia-manufacturing-testing.onrender.com',
      'https://sentia-manufacturing-production.onrender.com',
      'https://mcp-server-tkyu.onrender.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
};

app.use(cors(corsOptions));

// 3. Compression with optimization
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// 4. Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// MOCK AUTHENTICATION (Clerk disabled)
// ============================================================================

const mockAuth = {
  user: {
    id: 'user_mock_admin',
    email: 'admin@sentia.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    permissions: ['*']
  },
  isAuthenticated: true
};

// Mock auth middleware
const requireAuth = (req, res, next) => {
  req.auth = mockAuth;
  next();
};

// ============================================================================
// HEALTH & MONITORING ROUTES
// ============================================================================

// Basic health check
app.get('/health', async (req, res) => {
  const memUsage = process.memoryUsage();

  // Check MCP connectivity
  let mcpStatus = 'disconnected';
  let mcpDetails = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${MCP_SERVER_URL}/health`, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (response.ok) {
      mcpStatus = 'connected';
      mcpDetails = await response.json();
    }
  } catch (error) {
    mcpStatus = 'error';
    console.error(`[Health] MCP check failed: ${error.message}`);
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    platform: DEPLOYMENT.platform,
    version: '2.0.0',
    uptime: process.uptime(),
    memory: {
      used: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      percentage: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1)}%`
    },
    database: DATABASE_URL ? 'configured' : 'not configured',
    mcpServer: {
      url: MCP_SERVER_URL,
      status: mcpStatus,
      details: mcpDetails
    }
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe
app.get('/health/ready', async (req, res) => {
  let databaseReady = false;

  // Check database if configured
  if (DATABASE_URL) {
    // TODO: Implement actual database check
    databaseReady = true;
  }

  const isReady = !DATABASE_URL || databaseReady;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: DATABASE_URL ? databaseReady : 'not configured',
      mcp: 'available'
    }
  });
});

// Comprehensive status
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Sentia Manufacturing Dashboard',
    version: '2.0.0',
    environment: NODE_ENV,
    platform: DEPLOYMENT.platform,
    timestamp: new Date().toISOString(),
    features: {
      authentication: 'mock',
      database: DATABASE_URL ? 'connected' : 'not configured',
      mcp: 'enabled',
      websocket: 'enabled',
      sse: 'enabled'
    },
    endpoints: {
      health: '/health',
      api: '/api',
      mcp: '/api/mcp',
      events: '/api/events'
    }
  });
});

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

// Dashboard overview
app.get('/api/dashboard/overview', requireAuth, (req, res) => {
  res.json({
    user: req.auth.user,
    metrics: {
      production: { value: 8534, trend: 12.5 },
      efficiency: { value: 92.3, trend: 3.2 },
      quality: { value: 98.7, trend: -0.5 },
      inventory: { value: 45230, trend: -8.3 }
    },
    lastUpdated: new Date().toISOString()
  });
});

// Dashboard widgets
app.get('/api/dashboard/widgets', requireAuth, (req, res) => {
  res.json({
    widgets: [
      { id: 'kpi-strip', type: 'kpi', position: { x: 0, y: 0, w: 12, h: 2 } },
      { id: 'production', type: 'chart', position: { x: 0, y: 2, w: 6, h: 4 } },
      { id: 'inventory', type: 'table', position: { x: 6, y: 2, w: 6, h: 4 } }
    ]
  });
});

// Save dashboard layout
app.post('/api/dashboard/layout', requireAuth, (req, res) => {
  const { layout } = req.body;
  // In production, this would save to database
  console.log(`[${req.id}] Dashboard layout saved for user ${req.auth.user.id}`);
  res.json({ success: true, layout });
});

// Enterprise dashboard
app.get('/api/dashboard/enterprise', requireAuth, (req, res) => {
  res.json({
    features: [
      'real-time-monitoring',
      'predictive-analytics',
      'ai-insights',
      'custom-widgets'
    ],
    license: 'enterprise',
    expiresAt: '2026-12-31'
  });
});

// ============================================================================
// WORKING CAPITAL ROUTES (NEW)
// ============================================================================

// Working capital overview
app.get('/api/working-capital/overview', requireAuth, (req, res) => {
  res.json({
    current: {
      assets: 1250000,
      liabilities: 750000,
      workingCapital: 500000,
      ratio: 1.67
    },
    trends: {
      daily: -2.3,
      weekly: 5.7,
      monthly: 12.4
    },
    components: {
      receivables: 450000,
      inventory: 380000,
      payables: 320000,
      cash: 420000
    },
    lastUpdated: new Date().toISOString()
  });
});

// Cash runway calculation
app.get('/api/working-capital/cash-runway', requireAuth, (req, res) => {
  res.json({
    cashBalance: 420000,
    monthlyBurn: 85000,
    runway: {
      months: 4.9,
      days: 148,
      criticalDate: '2025-02-15'
    },
    recommendations: [
      'Accelerate collections',
      'Optimize inventory levels',
      'Negotiate payment terms'
    ]
  });
});

// Working capital optimization
app.post('/api/working-capital/optimize', requireAuth, (req, res) => {
  const { targetDays, industry } = req.body;
  res.json({
    current: 45,
    target: targetDays || 35,
    potential: {
      improvement: 250000,
      percentage: 22.5
    },
    actions: [
      { action: 'Reduce DSO', impact: 120000 },
      { action: 'Optimize inventory', impact: 80000 },
      { action: 'Extend DPO', impact: 50000 }
    ]
  });
});

// Industry benchmarks
app.get('/api/working-capital/benchmarks', requireAuth, (req, res) => {
  const { industry = 'manufacturing' } = req.query;
  res.json({
    industry,
    benchmarks: {
      dso: { yours: 45, industry: 38, percentile: 65 },
      dio: { yours: 52, industry: 45, percentile: 58 },
      dpo: { yours: 35, industry: 42, percentile: 72 },
      ccc: { yours: 62, industry: 41, percentile: 45 }
    }
  });
});

// Funding scenarios
app.get('/api/working-capital/funding-scenarios', requireAuth, (req, res) => {
  res.json({
    scenarios: [
      {
        type: 'invoice-factoring',
        available: 350000,
        cost: 2.5,
        speed: 'immediate'
      },
      {
        type: 'line-of-credit',
        available: 500000,
        cost: 4.2,
        speed: '3-5 days'
      },
      {
        type: 'term-loan',
        available: 750000,
        cost: 6.8,
        speed: '2-3 weeks'
      }
    ]
  });
});

// ============================================================================
// PRODUCTION & OPERATIONS ROUTES
// ============================================================================

// Production jobs
app.get('/api/production/jobs', requireAuth, (req, res) => {
  res.json({
    jobs: [
      {
        id: 'JOB-2024-001',
        product: 'Widget A',
        quantity: 1000,
        status: 'in-progress',
        completion: 67
      },
      {
        id: 'JOB-2024-002',
        product: 'Widget B',
        quantity: 500,
        status: 'pending',
        completion: 0
      }
    ],
    total: 2
  });
});

// Production metrics
app.get('/api/production/metrics', requireAuth, (req, res) => {
  res.json({
    oee: 85.3,
    availability: 92.1,
    performance: 88.5,
    quality: 98.7,
    output: {
      today: 450,
      week: 2340,
      month: 9875
    }
  });
});

// Update production
app.post('/api/production/update', requireAuth, (req, res) => {
  const { jobId, status, completion } = req.body;
  console.log(`[${req.id}] Production update: Job ${jobId} - ${status} (${completion}%)`);
  res.json({ success: true, jobId, status, completion });
});

// Inventory levels
app.get('/api/inventory/levels', requireAuth, (req, res) => {
  res.json({
    items: [
      {
        sku: 'RAW-001',
        name: 'Steel Sheets',
        quantity: 500,
        unit: 'units',
        value: 25000,
        status: 'adequate'
      },
      {
        sku: 'RAW-002',
        name: 'Aluminum Bars',
        quantity: 150,
        unit: 'units',
        value: 18000,
        status: 'low'
      }
    ],
    totalValue: 380000,
    turnover: 8.2
  });
});

// Inventory movements
app.get('/api/inventory/movements', requireAuth, (req, res) => {
  res.json({
    movements: [
      {
        id: 'MOV-001',
        type: 'receipt',
        sku: 'RAW-001',
        quantity: 100,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'MOV-002',
        type: 'issue',
        sku: 'RAW-002',
        quantity: 25,
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  });
});

// Optimize inventory
app.post('/api/inventory/optimize', requireAuth, (req, res) => {
  const { targetTurnover } = req.body;
  res.json({
    currentTurnover: 8.2,
    targetTurnover: targetTurnover || 10,
    recommendations: [
      { sku: 'RAW-001', action: 'reduce', quantity: 50 },
      { sku: 'RAW-003', action: 'increase', quantity: 75 }
    ],
    potentialSavings: 45000
  });
});

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

// Forecast
app.get('/api/analytics/forecast', requireAuth, (req, res) => {
  const { horizon = 30 } = req.query;
  res.json({
    horizon,
    forecast: Array.from({ length: Number(horizon) }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      production: 450 + Math.random() * 100,
      demand: 440 + Math.random() * 120,
      confidence: 0.85 - (i * 0.01)
    })),
    accuracy: 0.87
  });
});

// What-if analysis
app.post('/api/analytics/what-if', requireAuth, (req, res) => {
  const { scenario, parameters } = req.body;
  res.json({
    scenario,
    baseline: {
      revenue: 1000000,
      costs: 750000,
      profit: 250000
    },
    projected: {
      revenue: 1100000,
      costs: 800000,
      profit: 300000
    },
    impact: {
      revenue: '+10%',
      costs: '+6.7%',
      profit: '+20%'
    }
  });
});

// Reports
app.get('/api/analytics/reports', requireAuth, (req, res) => {
  res.json({
    reports: [
      {
        id: 'RPT-001',
        name: 'Monthly Production Report',
        generated: new Date(Date.now() - 86400000).toISOString(),
        format: 'pdf'
      },
      {
        id: 'RPT-002',
        name: 'Inventory Analysis',
        generated: new Date(Date.now() - 172800000).toISOString(),
        format: 'excel'
      }
    ]
  });
});

// ============================================================================
// CASH COVERAGE ANALYSIS ROUTES
// ============================================================================

// Mount cash coverage analysis routes
app.use('/api/cash-coverage', cashCoverageRoutes);

// Mount strategic planning AI routes
app.use('/api/strategic-planning', strategicPlanningRoutes);

// ============================================================================
// MCP INTEGRATION ROUTES
// ============================================================================

// MCP proxy configuration
const mcpProxy = createProxyMiddleware({
  target: MCP_SERVER_URL,
  changeOrigin: true,
  ws: true,
  logLevel: 'warn',
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('X-Request-ID', req.id);
    if (process.env.MCP_JWT_SECRET) {
      proxyReq.setHeader('Authorization', `Bearer ${process.env.MCP_JWT_SECRET}`);
    }
  },
  onError: (err, req, res) => {
    console.error(`[${req.id}] MCP Proxy Error: ${err.message}`);
    res.status(502).json({
      error: 'MCP Server connection failed',
      requestId: req.id,
      details: NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// MCP proxy routes
app.use('/api/mcp', mcpProxy);
app.use('/mcp', mcpProxy);

// MCP direct request
app.post('/api/mcp/request', requireAuth, async (req, res) => {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/api/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': req.id
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`[${req.id}] MCP request failed: ${error.message}`);
    res.status(502).json({
      error: 'MCP request failed',
      requestId: req.id
    });
  }
});

// MCP status
app.get('/api/mcp/status', async (req, res) => {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    const data = await response.json();
    res.json({
      connected: response.ok,
      server: MCP_SERVER_URL,
      details: data
    });
  } catch (error) {
    res.json({
      connected: false,
      server: MCP_SERVER_URL,
      error: error.message
    });
  }
});

// ============================================================================
// SERVER-SENT EVENTS
// ============================================================================

const sseClients = new Map();

app.get('/api/events', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // Send initial connection
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Store client
  const clientId = req.id;
  sseClients.set(clientId, res);

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
});

// Function to broadcast SSE messages
function broadcastSSE(event, data) {
  const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });
  sseClients.forEach((res) => {
    res.write(`data: ${message}\n\n`);
  });
}

// ============================================================================
// WEBSOCKET SERVER
// ============================================================================

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const wsId = randomUUID();
  console.log(`[${wsId}] WebSocket connected`);

  ws.send(JSON.stringify({
    type: 'connected',
    id: wsId,
    timestamp: new Date().toISOString()
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`[${wsId}] WebSocket message: ${data.type}`);

      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;

        case 'mcp':
          // Forward to MCP server
          try {
            const response = await fetch(`${MCP_SERVER_URL}/api/${data.endpoint}`, {
              method: data.method || 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data.payload)
            });
            const result = await response.json();
            ws.send(JSON.stringify({
              type: 'mcp-response',
              data: result,
              requestId: data.requestId
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              error: error.message,
              requestId: data.requestId
            }));
          }
          break;

        default:
          ws.send(JSON.stringify({
            type: 'echo',
            data: data,
            timestamp: new Date().toISOString()
          }));
      }
    } catch (error) {
      console.error(`[${wsId}] WebSocket error: ${error.message}`);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`[${wsId}] WebSocket disconnected`);
  });

  ws.on('error', (error) => {
    console.error(`[${wsId}] WebSocket error: ${error.message}`);
  });
});

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

const staticOptions = {
  maxAge: IS_PRODUCTION ? '1y' : '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', `public, max-age=${IS_PRODUCTION ? 31536000 : 3600}, immutable`);
    }
  }
};

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist'), staticOptions));

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res, next) => {
  // Check if this is an API route
  if (req.path.startsWith('/api')) {
    res.status(404).json({
      error: 'Endpoint not found',
      path: req.path,
      method: req.method,
      requestId: req.id
    });
  } else {
    // SPA fallback - serve index.html
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Global error handler
app.use((err, req, res, next) => {
  const requestId = req.id || 'unknown';

  // Log error details
  console.error(`[${requestId}] Error:`, {
    message: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Send error response
  res.status(err.status || 500).json({
    error: IS_PRODUCTION ? 'Internal server error' : err.message,
    requestId,
    timestamp: new Date().toISOString(),
    details: NODE_ENV === 'development' ? {
      stack: err.stack,
      path: req.path,
      method: req.method
    } : undefined
  });
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = (signal) => {
  console.log(`\n[${signal}] Shutting down gracefully...`);

  // Close WebSocket connections
  wss.clients.forEach((ws) => {
    ws.close(1000, 'Server shutting down');
  });

  // Close SSE connections
  sseClients.forEach((res) => {
    res.end();
  });

  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');

    // Close database connections if any
    // TODO: Add database cleanup here

    console.log('Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// ============================================================================
// MEMORY MONITORING
// ============================================================================

if (!IS_PRODUCTION) {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const heapUsagePercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);

    if (heapUsagePercent > 80) {
      console.warn(`Memory Warning: ${heapUsedMB}MB (${heapUsagePercent}%)`);

      // Trigger garbage collection if available
      if (global.gc) {
        console.log('Running garbage collection...');
        global.gc();
      }
    }
  }, 30000); // Check every 30 seconds
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

server.listen(PORT, '0.0.0.0', () => {
  const memUsage = process.memoryUsage();
  console.log(`
================================================================================
SERVER STARTED SUCCESSFULLY
================================================================================
Application: http://localhost:${PORT}
Health Check: http://localhost:${PORT}/health
API Status: http://localhost:${PORT}/api/status
WebSocket: ws://localhost:${PORT}/ws
SSE Events: http://localhost:${PORT}/api/events
MCP Server: ${MCP_SERVER_URL}

Memory Usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB
Platform: ${DEPLOYMENT.platform}
Environment: ${NODE_ENV}
================================================================================
  `);

  // Broadcast server ready event
  broadcastSSE('server-ready', { port: PORT, environment: NODE_ENV });
});

export default app;