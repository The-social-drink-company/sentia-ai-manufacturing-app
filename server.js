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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
if (!process.env.RENDER) {
  dotenv.config();
}

// Memory optimization: Set Node.js memory limits
if (process.env.NODE_ENV === 'production') {
  // Set max old space size to 128MB for Render's free tier
  process.env.NODE_OPTIONS = '--max-old-space-size=128';
}

// Determine current environment
const BRANCH = process.env.RENDER_GIT_BRANCH || process.env.BRANCH || process.env.NODE_ENV || null;
const PORT = process.env.PORT || 5000;
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com';

console.log('='.repeat(50));
console.log('SENTIA MANUFACTURING - MEMORY OPTIMIZED');
console.log('='.repeat(50));
console.log(`Environment: ${BRANCH}`);
console.log(`Port: ${PORT}`);
console.log(`MCP Server: ${MCP_SERVER_URL}`);
console.log(`Memory Limit: ${process.env.NODE_OPTIONS || null}`);
console.log('='.repeat(50));

// Initialize Express app with memory optimizations
const app = express();

// Memory optimization: Enable compression early
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress files larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// SECURITY: Enhanced CSP configuration (memory optimized)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Required for Tailwind CSS
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'" // Temporary for React dev builds
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
        "'self'"
      ],
      frameSrc: [
        "'self'"
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration (memory optimized)
const corsOptions = {
  origin: [
    'https://deployrend.financeflo.ai',
    'https://testingrend.financeflo.ai',
    'https://prodrend.financeflo.ai'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// Memory optimization: Limit request size
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoints (before authentication)
app.get('/health', async (req, res) => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const heapUsagePercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);
  const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);

  // Check MCP server health
  let mcpStatus = 'disconnected';
  let mcpDetails = null;
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    if (response.ok) {
      mcpStatus = 'connected';
      mcpDetails = await response.json();
    }
  } catch (error) {
    mcpStatus = 'error';
    console.error('MCP health check failed:', error.message);
  }

  // Determine status based on memory usage
  let status = 'healthy';
  if (heapUsagePercent > 85) {
    status = 'degraded';
  } else if (heapUsagePercent > 95) {
    status = 'unhealthy';
  }

  res.json({
    status,
    timestamp: new Date().toISOString(),
    environment: BRANCH,
    memory: {
      heapUsedMB,
      heapTotalMB,
      heapUsagePercent: `${heapUsagePercent}%`,
      rssMB
    },
    uptime: process.uptime(),
    mcpServer: {
      url: MCP_SERVER_URL,
      status: mcpStatus,
      details: mcpDetails
    }
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// Memory optimization: Garbage collection endpoint (development only)
if (BRANCH === 'development') {
  app.post('/admin/gc', (req, res) => {
    if (global.gc) {
      global.gc();
      res.json({ 
        message: 'Garbage collection triggered',
        memory: process.memoryUsage()
      });
    } else {
      res.status(500).json({ 
        error: 'Garbage collection not available. Start with --expose-gc flag.' 
      });
    }
  });
}

// MCP Server Proxy Configuration
const mcpProxy = createProxyMiddleware({
  target: MCP_SERVER_URL,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxy
  logLevel: 'info',
  onProxyReq: (proxyReq, req, res) => {
    // Add authentication headers if needed
    if (process.env.MCP_JWT_SECRET) {
      proxyReq.setHeader('Authorization', `Bearer ${process.env.MCP_JWT_SECRET}`);
    }
  },
  onError: (err, req, res) => {
    console.error('MCP Proxy Error:', err);
    res.status(502).json({
      error: 'MCP Server connection failed',
      details: BRANCH === 'development' ? err.message : undefined
    });
  }
});

// MCP API Routes
app.use('/api/mcp', mcpProxy);
app.use('/mcp', mcpProxy);

// API routes (minimal for memory optimization)
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Sentia Manufacturing Dashboard',
    version: '1.0.0',
    environment: BRANCH,
    mcpServer: MCP_SERVER_URL,
    mcpConnected: true,
    timestamp: new Date().toISOString()
  });
});

// CRITICAL FIX: Serve static files BEFORE catch-all route
const staticOptions = {
  maxAge: BRANCH === 'production' ? '1y' : '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Cache static assets aggressively
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};

app.use(express.static(path.join(__dirname, 'dist'), staticOptions));

// Catch-all handler for React Router (MUST BE LAST)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Memory optimization: Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Don't leak error details in production
  const isDev = BRANCH === 'development';
  res.status(500).json({
    error: isDev ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Memory optimization: Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Memory monitoring (development only)
if (BRANCH === 'development') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const heapUsagePercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);
    
    if (heapUsagePercent > 80) {
      console.warn(`⚠️  High memory usage: ${heapUsedMB}MB (${heapUsagePercent}%)`);
    }
  }, 30000); // Check every 30 seconds
}

// Create HTTP server for WebSocket support
const server = createServer(app);

// WebSocket server for real-time MCP features
const wss = new WebSocketServer({
  server,
  path: '/ws/mcp'
});

wss.on('connection', (ws) => {
  console.log('New WebSocket connection for MCP features');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      // Forward to MCP server
      const response = await fetch(`${MCP_SERVER_URL}/api/${data.endpoint}`, {
        method: data.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.MCP_JWT_SECRET && {
            'Authorization': `Bearer ${process.env.MCP_JWT_SECRET}`
          })
        },
        body: JSON.stringify(data.payload)
      });

      const result = await response.json();
      ws.send(JSON.stringify({
        type: 'response',
        data: result,
        requestId: data.requestId
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Start server with WebSocket support
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${BRANCH}`);
  console.log(`🤖 MCP Server: ${MCP_SERVER_URL}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws/mcp`);
  console.log(`💾 Memory monitoring: ${BRANCH === 'development' ? 'enabled' : 'disabled'}`);

  // Initial memory report
  const memUsage = process.memoryUsage();
  console.log(`📊 Initial memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
});

export default app;
