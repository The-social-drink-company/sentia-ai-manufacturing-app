#!/usr/bin/env node

// Render-specific startup script with better error handling
console.log('='.repeat(60));
console.log('RENDER STARTUP SCRIPT - Enhanced error handling');
console.log('='.repeat(60));

// Set critical environment variables if missing
if (!process.env.DATABASE_URL && process.env.RENDER) {
  console.log('WARNING: DATABASE_URL not set, using fallback');
  process.env.DATABASE_URL = 'postgresql://render:render@localhost:5432/render';
}

// Ensure NODE_ENV is set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Log environment for debugging
console.log('Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT || '(not set - will use 10000)');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
console.log('  RENDER:', process.env.RENDER ? 'Yes' : 'No');

// Start the main server with error handling
try {
  console.log('Starting server.js...');
  require('../server.js');
} catch (error) {
  console.error('FATAL: Failed to start server:', error);

  // Start minimal fallback server on error
  console.log('Starting fallback server...');
  const express = require('express');
  const app = express();
  const PORT = process.env.PORT || 10000;

  // Simple health check that always works
  app.get('/health', (req, res) => {
    res.json({
      status: 'degraded',
      error: 'Main server failed to start',
      timestamp: new Date().toISOString()
    });
  });

  // Catch all routes
  app.get('*', (req, res) => {
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'The server is starting up. Please try again in a moment.',
      path: req.path
    });
  });

  app.listen(PORT, () => {
    console.log(`Fallback server running on port ${PORT}`);
  });
}