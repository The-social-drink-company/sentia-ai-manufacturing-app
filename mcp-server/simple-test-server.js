#!/usr/bin/env node

/**
 * Simple test server for Railway deployment verification
 * This tests if the basic Node.js/Express setup works on Railway
 */

import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 9001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'sentia-mcp-test-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: port,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint  
app.get('/', (req, res) => {
  res.json({
    message: 'Sentia MCP Server Test - Railway Deployment',
    status: 'operational',
    endpoints: {
      health: '/health'
    }
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Sentia MCP Test Server running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});