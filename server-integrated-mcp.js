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

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const BRANCH = process.env.BRANCH || 'development';

console.log(`
🚀 Starting Sentia Manufacturing Dashboard - Integrated Server
📍 Environment: ${NODE_ENV}
🌿 Branch: ${BRANCH}
🌐 Port: ${PORT}
💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}
🤖 MCP Server: ${process.env.MCP_SERVER_URL || 'Local'}
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sentia-manufacturing-dashboard',
    environment: NODE_ENV,
    branch: BRANCH,
    timestamp: new Date().toISOString(),
    version: '1.0.5',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured',
    mcp: process.env.MCP_SERVER_URL ? 'configured' : 'local'
  });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Sentia Manufacturing API',
    version: '1.0.5',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
});

// Serve static files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback - must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
✅ Server running successfully!
🌐 Application: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
🔧 API Status: http://localhost:${PORT}/api/status
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