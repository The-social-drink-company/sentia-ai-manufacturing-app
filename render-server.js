#!/usr/bin/env node

/**
 * RENDER PRODUCTION SERVER
 * Robust server with extensive fallbacks for Render deployment
 * WITH CLERK AUTHENTICATION SUPPORT
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('='.repeat(70));
console.log('SENTIA MANUFACTURING - RENDER PRODUCTION SERVER');
console.log('='.repeat(70));
console.log('Starting time:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('Port:', process.env.PORT || 5000);
console.log('Directory:', __dirname);
console.log('Clerk Key:', process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'CONFIGURED' : 'MISSING');
console.log('MCP Server:', process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com');
console.log('='.repeat(70));

// CRITICAL: Set Clerk key for client
if (!process.env.VITE_CLERK_PUBLISHABLE_KEY) {
  process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk';
  console.log('WARNING: Using default Clerk publishable key');
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CRITICAL: Content Security Policy for Clerk Authentication
app.use((req, res, next) => {
  // Set CSP headers for Clerk to work properly
  const clerkDomains = [
    'https://*.clerk.accounts.dev',
    'https://clerk.accounts.dev',
    'https://api.clerk.dev',
    'https://*.clerk.com',
    'wss://*.clerk.accounts.dev',
    'https://img.clerk.com'
  ];

  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkDomains.join(' ')}`,
    `connect-src 'self' ${clerkDomains.join(' ')} ${process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com'}`,
    `frame-src 'self' ${clerkDomains.join(' ')}`,
    `img-src 'self' data: blob: ${clerkDomains.join(' ')}`,
    `style-src 'self' 'unsafe-inline' ${clerkDomains.join(' ')}`,
    "font-src 'self' data:",
    "worker-src 'self' blob:"
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspHeader);

  // CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint - ALWAYS WORKS
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'sentia-manufacturing',
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.5',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    deployment: {
      branch: process.env.RENDER_GIT_BRANCH || 'unknown',
      commit: process.env.RENDER_GIT_COMMIT || 'unknown',
      service: process.env.RENDER_SERVICE_NAME || 'unknown'
    }
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    api_version: 'v1',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health',
      '/api/status',
      '/api/auth/*',
      '/api/dashboard/*',
      '/api/data/*'
    ]
  });
});

// Check if dist folder exists
const distPath = join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);
const indexPath = join(distPath, 'index.html');
const indexExists = distExists && fs.existsSync(indexPath);

console.log('Build artifacts check:');
console.log('- dist folder:', distExists ? 'EXISTS' : 'MISSING');
console.log('- index.html:', indexExists ? 'EXISTS' : 'MISSING');

// Fallback HTML with Clerk initialization
const fallbackHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sentia Manufacturing Dashboard</title>
  <script>
    // Set Clerk publishable key for client
    window.VITE_CLERK_PUBLISHABLE_KEY = '${process.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk'}';
    window.VITE_MCP_SERVER_URL = '${process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com'}';
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }
    .logo {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #3b82f6, #1e40af);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .status {
      background: rgba(34, 197, 94, 0.2);
      border: 2px solid rgba(34, 197, 94, 0.5);
      border-radius: 12px;
      padding: 20px;
      margin: 30px 0;
    }
    .status.loading {
      background: rgba(251, 191, 36, 0.2);
      border-color: rgba(251, 191, 36, 0.5);
    }
    .info {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6, #1e40af);
      color: white;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      margin: 10px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    .links {
      margin-top: 30px;
    }
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      <div class="logo">S</div>
      Sentia Manufacturing
    </h1>

    <div class="status loading" id="status">
      <h2>Application Loading...</h2>
      <p style="margin-top: 10px;">
        <span class="spinner"></span>
      </p>
    </div>

    <div class="info">
      <div class="info-item">
        <strong>Environment:</strong>
        <span>${process.env.NODE_ENV || 'production'}</span>
      </div>
      <div class="info-item">
        <strong>Branch:</strong>
        <span>${process.env.RENDER_GIT_BRANCH || 'main'}</span>
      </div>
      <div class="info-item">
        <strong>Service:</strong>
        <span>${process.env.RENDER_SERVICE_NAME || 'sentia-manufacturing'}</span>
      </div>
      <div class="info-item">
        <strong>Status:</strong>
        <span id="app-status">Initializing...</span>
      </div>
    </div>

    <div class="links">
      <a href="/health" class="btn">Health Check</a>
      <a href="/api/status" class="btn">API Status</a>
      <a href="/" class="btn" onclick="window.location.reload(); return false;">Refresh</a>
    </div>

    <p style="margin-top: 30px; opacity: 0.8;">
      If the application doesn't load, please refresh the page or contact support.
    </p>
  </div>

  <script>
    // Auto-refresh after 5 seconds if still loading
    setTimeout(() => {
      const status = document.getElementById('status');
      const appStatus = document.getElementById('app-status');
      if (status.classList.contains('loading')) {
        appStatus.textContent = 'Refreshing...';
        window.location.reload();
      }
    }, 5000);

    // Check health endpoint
    fetch('/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'healthy') {
          document.getElementById('app-status').textContent = 'Server Running';
        }
      })
      .catch(() => {
        document.getElementById('app-status').textContent = 'Connection Error';
      });
  </script>
</body>
</html>`;

// Serve static files from dist folder
if (distExists) {
  console.log('Serving static files from dist folder');

  // CRITICAL: Serve static files with proper MIME types
  // Serve JS files with correct module type
  app.use('/js', express.static(join(distPath, 'js'), {
    maxAge: '1d',
    setHeaders: (res, path) => {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }));

  // Serve CSS files
  app.use('/assets', express.static(join(distPath, 'assets'), {
    maxAge: '1d',
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=UTF-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
    }
  }));

  // Special route for clerk-init.js - serve with injected environment
  app.get('/clerk-init.js', (req, res) => {
    const clerkInitScript = `
// Clerk Environment Initialization - Server Injected
(function() {
  if (typeof window === 'undefined') return;

  const clerkEnv = {
    VITE_CLERK_PUBLISHABLE_KEY: '${process.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk'}',
    VITE_MCP_SERVER_URL: '${process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com'}',
    VITE_API_BASE_URL: '${process.env.VITE_API_BASE_URL || '/api'}',
    VITE_CLERK_SIGN_IN_URL: '/sign-in',
    VITE_CLERK_SIGN_UP_URL: '/sign-up',
    VITE_CLERK_AFTER_SIGN_IN_URL: '/dashboard',
    VITE_CLERK_AFTER_SIGN_UP_URL: '/dashboard',
    VITE_CLERK_SIGN_OUT_URL: '/'
  };

  window.clerkEnv = clerkEnv;

  if (!window.import) window.import = {};
  if (!window.import.meta) window.import.meta = {};
  if (!window.import.meta.env) window.import.meta.env = {};

  Object.keys(clerkEnv).forEach(key => {
    window.import.meta.env[key] = clerkEnv[key];
  });

  console.log('[Clerk] Environment initialized');
})();`;

    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(clerkInitScript);
  });

  // Serve all static files from dist
  app.use(express.static(distPath, {
    index: false,
    maxAge: '1h',
    setHeaders: (res, path) => {
      // Set proper MIME types
      if (path.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.setHeader('Cache-Control', 'no-cache');
      } else if (path.endsWith('.js') || path.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=UTF-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      } else if (path.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
      } else if (path.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      }
    }
  }));
} else {
  console.log('Warning: dist folder not found - serving fallback');
}

// API Routes - Basic functionality
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'sentia-manufacturing',
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.5'
  });
});

app.get('/api/test-simple', (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/services/status', (req, res) => {
  res.json({
    status: 'operational',
    services: {
      database: process.env.DATABASE_URL ? 'configured' : 'not configured',
      clerk: process.env.CLERK_SECRET_KEY ? 'configured' : 'not configured',
      mcp: process.env.MCP_SERVER_URL ? 'configured' : 'not configured'
    }
  });
});

// Mock API endpoints for dashboard
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    kpis: {
      revenue: 125000,
      orders: 342,
      efficiency: 94.5,
      quality: 98.2
    },
    timestamp: new Date().toISOString()
  });
});

// Catch all route - serve index.html or fallback with Clerk env
app.get('*', (req, res) => {
  // Don't serve HTML for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  if (indexExists) {
    console.log(`Serving index.html for ${req.path}`);
    // Read index.html and inject Clerk key
    let html = fs.readFileSync(indexPath, 'utf-8');

    // Inject Clerk key into the HTML
    const clerkKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk';
    const mcpServer = process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com';

    const envScript = `
    <script>
      // Critical: Set environment variables for Clerk and other services
      window.VITE_CLERK_PUBLISHABLE_KEY = '${clerkKey}';
      window.VITE_MCP_SERVER_URL = '${mcpServer}';
      window.VITE_API_BASE_URL = '${process.env.VITE_API_BASE_URL || '/api'}';

      // Ensure import.meta.env is available for Vite modules
      if (!window.import) window.import = {};
      if (!window.import.meta) window.import.meta = {};
      if (!window.import.meta.env) window.import.meta.env = {};
      window.import.meta.env.VITE_CLERK_PUBLISHABLE_KEY = '${clerkKey}';
      window.import.meta.env.VITE_MCP_SERVER_URL = '${mcpServer}';
      window.import.meta.env.VITE_API_BASE_URL = '${process.env.VITE_API_BASE_URL || '/api'}';
    </script>
    `;

    // Inject before the first script tag or before closing head
    if (html.includes('<script type="module"')) {
      html = html.replace('<script type="module"', envScript + '<script type="module"');
    } else if (html.includes('</head>')) {
      html = html.replace('</head>', envScript + '</head>');
    } else if (html.includes('<body>')) {
      html = html.replace('<body>', '<body>' + envScript);
    }

    res.send(html);
  } else {
    console.log(`Serving fallback HTML for ${req.path}`);
    res.send(fallbackHTML);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(70));
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/health`);
  console.log(`API status: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api/status`);
  console.log(`Main app: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
  console.log('='.repeat(70));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});