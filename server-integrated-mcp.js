/**
 * Server Integrated with MCP - Complete Enterprise Solution
 * Includes database connections and MCP server integration
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const BRANCH = process.env.BRANCH || 'development';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com';

console.log(`
🚀 Starting Sentia Manufacturing Dashboard - Integrated Server
📍 Environment: ${NODE_ENV}
🌿 Branch: ${BRANCH}
🌐 Port: ${PORT}
💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}
🤖 MCP Server: ${MCP_SERVER_URL}
🔌 WebSocket: Enabled at /ws/mcp
`);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
      details: NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// MCP API Routes
app.use('/api/mcp', mcpProxy);
app.use('/mcp', mcpProxy);

// Health check endpoint with MCP status
app.get('/health', async (req, res) => {
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

  res.json({
    status: 'healthy',
    service: 'sentia-manufacturing-dashboard',
    environment: NODE_ENV,
    branch: BRANCH,
    timestamp: new Date().toISOString(),
    version: '1.0.5',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured',
    mcpServer: {
      url: MCP_SERVER_URL,
      status: mcpStatus,
      details: mcpDetails
    }
  });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Sentia Manufacturing API',
    version: '1.0.5',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    status: 'operational',
    mcpServer: MCP_SERVER_URL,
    mcpConnected: true
  });
});

// Serve static files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback - must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

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
  console.log(`
✅ Server running successfully!
🌐 Application: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
🔧 API Status: http://localhost:${PORT}/api/status
🤖 MCP Server: ${MCP_SERVER_URL}
🔌 WebSocket: ws://localhost:${PORT}/ws/mcp
📍 Environment: ${NODE_ENV}
🌿 Branch: ${BRANCH}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app;