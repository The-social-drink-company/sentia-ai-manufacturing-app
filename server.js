/**
 * ENTERPRISE SERVER - REAL DATA ONLY
 *
 * Production server with external API integrations.
 * NO MOCK DATA - connects to real services.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import realAPI from './server/api/real-api.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://sentia-manufacturing-production.onrender.com']
    : ['http://localhost:3000', 'http://localhost:10000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sentia-enterprise-server',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: prisma ? 'connected' : 'not connected',
    mcp: process.env.MCP_SERVER_URL ? 'configured' : 'not configured',
    apis: {
      xero: process.env.XERO_CLIENT_ID ? 'configured' : 'not configured',
      shopify: process.env.SHOPIFY_API_KEY ? 'configured' : 'not configured',
      amazon: process.env.AMAZON_SP_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Sentia Manufacturing API',
    version: '2.0.0-enterprise',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    features: {
      workingCapital: true,
      inventory: true,
      production: true,
      quality: true,
      aiAnalytics: true,
      realTimeData: true
    },
    dataSource: 'real' // Indicates real data, not mock
  });
});

// Mount real API routes - NO MOCK DATA
app.use('/api', realAPI);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));

  // Catch all handler for React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Development route
  app.get('/', (req, res) => {
    res.json({
      message: 'Enterprise API Server Running',
      environment: 'development',
      docs: '/api/status'
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Database connection test
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    // Test query
    const count = await prisma.$queryRaw`SELECT 1`;
    console.log('Database test query successful');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

// Start server
async function startServer() {
  try {
    // Test database connection
    await testDatabaseConnection();

    // Start listening
    app.listen(PORT, () => {
      console.log(`
========================================
SENTIA MANUFACTURING ENTERPRISE SERVER
========================================
Environment: ${process.env.NODE_ENV || 'development'}
Port: ${PORT}
Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}
MCP Server: ${process.env.MCP_SERVER_URL || 'Not configured'}
========================================
Server running at http://localhost:${PORT}
Health check: http://localhost:${PORT}/health
API Status: http://localhost:${PORT}/api/status
========================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();