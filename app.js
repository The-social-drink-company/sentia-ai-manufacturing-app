#!/usr/bin/env node

/**
 * STANDALONE EXPRESS SERVER FOR RAILWAY DEPLOYMENT
 * This is a simplified server specifically designed to work with Railway's deployment system
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Health endpoint
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

// Manufacturing Dashboard endpoint - FIXED VERSION
app.get('/api/manufacturing/dashboard', (req, res) => {
  try {
    const dashboard = {
      status: 'operational',
      productionLines: {
        active: 0,
        idle: 0,
        maintenance: 0
      },
      kpis: {
        overallEfficiency: 0,
        throughput: 0,
        qualityScore: 0,
        downtime: 0
      },
      alerts: [],
      lastUpdated: new Date().toISOString(),
      dataSource: 'real_manufacturing_system',
      message: 'Manufacturing system integration required'
    };
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch manufacturing dashboard' });
  }
});

// Xero Auth endpoint
app.get('/api/xero/auth', (req, res) => {
  res.status(501).json({ 
    error: 'Xero OAuth integration required',
    message: 'Please configure Xero API credentials',
    authUrl: null
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Standalone server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🏥 Health check: /api/health`);
  console.log(`🧪 Test endpoint: /api/test`);
});

module.exports = app;