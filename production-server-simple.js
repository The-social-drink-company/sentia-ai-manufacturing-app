#!/usr/bin/env node

/**
 * SIMPLIFIED PRODUCTION SERVER FOR RENDER
 * Minimal server focused on serving static files and basic API endpoints
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('='.repeat(70));
console.log('SENTIA MANUFACTURING - SIMPLIFIED PRODUCTION SERVER');
console.log('='.repeat(70));
console.log('Starting time:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('Port:', process.env.PORT || 5000);
console.log('Directory:', __dirname);
console.log('='.repeat(70));

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: [
    'https://sentia-manufacturing-production.onrender.com',
    'https://sentia-manufacturing-development.onrender.com',
    'https://sentia-manufacturing-testing.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'sentia-manufacturing',
    environment: process.env.NODE_ENV || 'production',
    render: true
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.5',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Basic API endpoints for testing
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// MCP Server proxy endpoint
app.get('/api/mcp/health', async (req, res) => {
  try {
    const mcpUrl = process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com';
    const response = await fetch(`${mcpUrl}/health`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'MCP Server unavailable',
      message: error.message
    });
  }
});

// Serve static files from dist directory
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Serving static files from:', distPath);
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true
  }));
} else {
  console.log('❌ Dist directory not found:', distPath);
}

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Application not found',
      message: 'The application build files are missing'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(70));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API status: http://localhost:${PORT}/api/status`);
  console.log(`Main app: http://localhost:${PORT}`);
  console.log('='.repeat(70));
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

export default app;
