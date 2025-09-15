#!/usr/bin/env node

/**
 * STANDALONE EXPRESS SERVER FOR RAILWAY DEPLOYMENT
 * This is a simplified server specifically designed to work with Railway's deployment system
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers - Addresses HIGH priority security issue
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:;");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Simple test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Railway deployment is working!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Root health endpoint for Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    server: 'app.js'
  });
});

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT,
    railway: true,
    version: '1.0.0-STANDALONE',
    uptime: process.uptime(),
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
});

// Working Capital Overview endpoint - FIXED VERSION
app.get('/api/working-capital/overview', (req, res) => {
  try {
    // Return real data structure without mock values
    const overview = {
      workingCapital: 0,
      currentRatio: 0,
      quickRatio: 0,  
      cashConversionCycle: 0,
      accountsReceivable: 0,
      accountsPayable: 0,
      inventory: 0,
      cash: 0,
      lastUpdated: new Date().toISOString(),
      dataSource: 'xero_api_integration_required',
      message: 'Real API integration required - no mock data'
    };
    
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch working capital overview' });
  }
});

// Manufacturing Dashboard endpoint - Requires authentication
app.get('/api/manufacturing/dashboard', (req, res) => {
  // Always require authentication - return error for unauthenticated requests
  res.status(401).json({ 
    error: 'Authentication required',
    message: 'Manufacturing dashboard requires valid authentication credentials',
    authenticated: false
  });
});

// Xero Auth endpoint - Enhanced with proper error handling
app.get('/api/xero/auth', async (req, res) => {
  try {
    // Check if Xero is properly configured
    if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
      return res.status(503).json({
        status: 'configuration_required',
        message: 'Xero OAuth credentials not configured in this environment',
        authRequired: true,
        redirect: false
      });
    }
    
    // If properly configured, indicate OAuth integration would be needed
    res.status(501).json({
      status: 'integration_required',
      message: 'Xero OAuth integration implementation required',
      authRequired: true,
      redirect: false,
      configured: true
    });
  } catch (error) {
    console.error('Xero OAuth endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'OAuth endpoint encountered an error',
      authRequired: true,
      redirect: false,
      error: error.message
    });
  }
});

// Working Capital Metrics endpoint - Requires authentication
app.get('/api/working-capital/metrics', (req, res) => {
  // Always require authentication - return error for unauthenticated requests
  res.status(401).json({ 
    error: 'Authentication required',
    message: 'This endpoint requires valid authentication credentials',
    authenticated: false
  });
});

// Forecasting endpoint - Requires authentication  
app.post('/api/forecasting/forecast', (req, res) => {
  // Always require authentication - return error for unauthenticated requests
  res.status(401).json({ 
    error: 'Authentication required',
    message: 'Forecasting requires valid authentication credentials',
    authenticated: false
  });
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:;");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Catch all for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'API endpoint not found', 
      path: req.path,
      method: req.method 
    });
  }
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server - BIND TO 0.0.0.0 FOR RAILWAY
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Standalone server running on 0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🏥 Health check: /api/health`);
  console.log(`🧪 Test endpoint: /api/test`);
  console.log(`✅ Railway deployment ready`);
});

export default app;