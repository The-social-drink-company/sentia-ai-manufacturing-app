/**
 * CLEAN SERVER CONFIGURATION
 * 
 * Professional Express server with proper ESM support
 * and bulletproof static file serving.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fs from 'fs';
import realAPI from './api/real-api.js';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 10000;

// Enhanced logging middleware
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
};

// Security middleware with Clerk CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://clerk.financeflo.ai",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://clerk.financeflo.ai"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://clerk.financeflo.ai"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://clerk.financeflo.ai"
      ],
      connectSrc: [
        "'self'",
        "https://clerk.financeflo.ai",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com"
      ],
      frameSrc: [
        "'self'",
        "https://clerk.financeflo.ai"
      ]
    }
  }
}));

// Standard middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Serve static files from dist directory
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Mount real API routes - NO MOCK DATA
app.use('/api', realAPI);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sentia-manufacturing-dashboard',
    version: '2.0.0-enterprise-real-data',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    clerk: {
      configured: !!process.env.VITE_CLERK_PUBLISHABLE_KEY,
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT_SET'
    }
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'sentia-manufacturing-dashboard',
      version: '2.0.0-enterprise-real-data',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      clerk: {
        configured: !!process.env.VITE_CLERK_PUBLISHABLE_KEY
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: Math.random().toString(36).substr(2, 9)
    }
  });
});

// Catch-all handler - serve React app
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  
  // Check if React build exists
  if (fs.existsSync(indexPath)) {
    console.log(`Serving React app for: ${req.path}`);
    res.sendFile(indexPath);
  } else {
    console.log(`React build not found, serving fallback for: ${req.path}`);
    
    // Fallback HTML if React build doesn't exist
    const fallbackHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sentia Manufacturing Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            color: #333;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .logo {
            font-size: 2rem;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 20px;
        }
        .status {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            margin-bottom: 20px;
            display: inline-block;
        }
        .message {
            color: #666;
            margin-bottom: 20px;
        }
        .button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">Sentia Manufacturing</div>
        <div class="status">✅ Server Online</div>
        <div class="message">
            <p>React application is building...</p>
            <p>Please wait a moment and refresh the page.</p>
        </div>
        <button class="button" onclick="window.location.reload()">
            Refresh Page
        </button>
    </div>
</body>
</html>`;
    
    res.send(fallbackHTML);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (req.path.startsWith('/api/')) {
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).send(`
      <div style="padding: 2rem; text-align: center; font-family: system-ui;">
        <h1>Server Error</h1>
        <p>Something went wrong. Please try refreshing the page.</p>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Refresh
        </button>
      </div>
    `);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sentia Manufacturing Dashboard server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${distPath}`);
  console.log(`🔐 Clerk configured: ${!!process.env.VITE_CLERK_PUBLISHABLE_KEY}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
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
