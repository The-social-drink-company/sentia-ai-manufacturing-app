/**
 * RAILWAY ULTIMATE SERVER - NUCLEAR SOLUTION
 * This is THE ONLY server file Railway will use
 * Designed specifically to fix Railway deployment issues
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRITICAL: Get PORT from Railway - DO NOT use parseInt as Railway may pass strings
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('========================================');
console.log('RAILWAY ULTIMATE SERVER - NUCLEAR EDITION');
console.log('========================================');
console.log(`Environment Variables:`);
console.log(`  PORT from env: ${process.env.PORT}`);
console.log(`  Using PORT: ${PORT}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  Railway env: ${process.env.RAILWAY_ENVIRONMENT}`);
console.log('========================================');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// CRITICAL HEALTH CHECK ENDPOINTS FOR RAILWAY
// ============================================

// Root health check - Railway looks for this
// CRITICAL: Must respond quickly to avoid timeout
app.get('/health', (req, res) => {
  console.log('[HEALTH CHECK] Responding to /health');
  // Send response immediately - no async operations
  res.status(200).json({
    status: 'healthy',
    server: 'railway-ultimate',
    port: PORT,
    timestamp: new Date().toISOString(),
    env_port: process.env.PORT || 'not_set'
  });
});

// Alternative health check
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    server: 'railway-ultimate',
    version: '1.0.0'
  });
});

// ============================================
// TEST ENDPOINTS
// ============================================

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Railway Ultimate Server is working!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Root route
app.get('/', (req, res) => {
  const distIndexPath = path.join(__dirname, 'dist', 'index.html');

  // Check if React build exists
  if (fs.existsSync(distIndexPath)) {
    console.log('[SERVE] Serving React app from dist/index.html');
    res.sendFile(distIndexPath);
  } else {
    console.log('[SERVE] No dist folder, serving fallback HTML');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sentia Manufacturing Dashboard</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 600px;
            }
            h1 {
              font-size: 3rem;
              margin-bottom: 1rem;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            }
            .status {
              background: rgba(255,255,255,0.1);
              backdrop-filter: blur(10px);
              border-radius: 1rem;
              padding: 2rem;
              margin: 2rem 0;
              border: 1px solid rgba(255,255,255,0.2);
            }
            .success {
              background: rgba(34, 197, 94, 0.2);
              border-color: rgba(34, 197, 94, 0.5);
            }
            .endpoints {
              text-align: left;
              margin-top: 2rem;
            }
            .endpoints a {
              color: white;
              text-decoration: none;
              display: block;
              padding: 0.75rem;
              background: rgba(255,255,255,0.1);
              margin: 0.5rem 0;
              border-radius: 0.5rem;
              transition: all 0.3s;
            }
            .endpoints a:hover {
              background: rgba(255,255,255,0.2);
              transform: translateX(5px);
            }
            code {
              font-family: monospace;
              background: rgba(0,0,0,0.2);
              padding: 0.125rem 0.25rem;
              border-radius: 0.25rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Sentia Manufacturing</h1>
            <div class="status success">
              <h2>✅ Server Running Successfully!</h2>
              <p>Railway Ultimate Server - Nuclear Edition</p>
              <p>Port: ${PORT}</p>
              <p>Time: ${new Date().toLocaleString()}</p>
            </div>

            <div class="endpoints">
              <h3>Test These Endpoints:</h3>
              <a href="/health">
                <code>/health</code> - Main health check
              </a>
              <a href="/api/health">
                <code>/api/health</code> - API health check
              </a>
              <a href="/api/test">
                <code>/api/test</code> - Test endpoint
              </a>
            </div>

            <div class="status" style="margin-top: 2rem;">
              <h3>Environment Status:</h3>
              <p>PORT: ${process.env.PORT || 'Not set by Railway'}</p>
              <p>NODE_ENV: ${process.env.NODE_ENV || 'Not set'}</p>
              <p>React Build: ${fs.existsSync(path.join(__dirname, 'dist')) ? '✅ Found' : '❌ Missing'}</p>
            </div>
          </div>
        </body>
      </html>
    `);
  }
});

// ============================================
// DASHBOARD API ENDPOINTS
// ============================================

app.get('/api/dashboard/kpis', (req, res) => {
  res.json({
    revenue: { value: 2847500, change: 15.3, trend: 'up' },
    production: { value: 92.5, change: 3.2, trend: 'up' },
    inventory: { value: 45, change: -8.1, trend: 'down' },
    quality: { value: 99.2, change: 0.5, trend: 'up' }
  });
});

app.get('/api/dashboard/charts', (req, res) => {
  res.json({
    salesTrend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Sales',
        data: [450000, 480000, 470000, 510000, 530000, 580000]
      }]
    }
  });
});

// ============================================
// STATIC FILES
// ============================================

// Serve static files from dist
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('[STATIC] Serving static files from dist/');
  app.use(express.static(distPath));
}

// Serve static files from public
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  console.log('[STATIC] Serving static files from public/');
  app.use(express.static(publicPath));
}

// ============================================
// CATCH-ALL FOR SPA
// ============================================

app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      path: req.path
    });
  }

  // Try to serve index.html for client-side routing
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found');
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, HOST, (err) => {
  if (err) {
    console.error('Failed to bind to port:', err);
    process.exit(1);
  }
  console.log('========================================');
  console.log('🚀 RAILWAY ULTIMATE SERVER STARTED');
  console.log(`🌐 Listening on: http://${HOST}:${PORT}`);
  console.log(`❤️  Health check: http://${HOST}:${PORT}/health`);
  console.log('========================================');
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ SERVER ERROR:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use!`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Keep-alive heartbeat - log every 30 seconds for Railway
setInterval(() => {
  const now = new Date().toISOString();
  console.log(`[HEARTBEAT] ${now} - Server alive on port ${PORT}`);
}, 30000); // Every 30 seconds

// Log unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

export default app;