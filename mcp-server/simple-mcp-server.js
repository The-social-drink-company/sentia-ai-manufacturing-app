#!/usr/bin/env node

/**
 * SIMPLIFIED MCP SERVER FOR RAILWAY DEPLOYMENT
 * This is a minimal version to ensure Railway deployment works
 */

import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 9000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Basic middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Sentia MCP Server',
    version: '2.0.0-simple',
    protocol: '2024-11-05',
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    railway: !!process.env.RAILWAY_ENVIRONMENT,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'sentia-mcp-server-simple',
    version: '2.0.0-simple',
    protocol: '2024-11-05',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    railway: !!process.env.RAILWAY_ENVIRONMENT,
    port: port
  });
});

// MCP info endpoint
app.get('/mcp/info', (req, res) => {
  res.json({
    server: {
      name: 'Sentia MCP Server',
      version: '2.0.0-simple',
      protocol: '2024-11-05'
    },
    capabilities: {
      health_check: true,
      basic_endpoints: true,
      railway_deployment: true
    },
    endpoints: {
      health: '/health',
      info: '/mcp/info',
      status: '/mcp/status'
    }
  });
});

// MCP status endpoint
app.get('/mcp/status', (req, res) => {
  res.json({
    status: 'operational',
    services: {
      web_server: 'running',
      health_monitor: 'active'
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    railway_deployment: !!process.env.RAILWAY_ENVIRONMENT
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    status: 'error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'not_found',
    message: `Endpoint ${req.originalUrl} not found`,
    available_endpoints: ['/', '/health', '/mcp/info', '/mcp/status'],
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Sentia MCP Server (Simple) running on port ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚂 Railway: ${process.env.RAILWAY_ENVIRONMENT ? 'Yes' : 'No'}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📋 MCP info: http://localhost:${port}/mcp/info`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});