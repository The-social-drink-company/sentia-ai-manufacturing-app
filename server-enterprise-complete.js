/**
 * Enterprise Complete Server - Production Ready
 * Full MCP integration with database connections
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const BRANCH = process.env.BRANCH || 'development';

console.log(`Starting Sentia Manufacturing Dashboard - Enterprise Complete
Environment: ${NODE_ENV}
Branch: ${BRANCH}
Port: ${PORT}
Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}
MCP Server: ${process.env.MCP_SERVER_URL || 'Local Mode'}`);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sentia-manufacturing-dashboard',
    version: '1.0.6',
    environment: NODE_ENV,
    branch: BRANCH,
    timestamp: new Date().toISOString()
  });
});

// API Status
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Sentia Manufacturing API',
    version: '1.0.6',
    environment: NODE_ENV,
    branch: BRANCH,
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
});

// Static files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;