// RAILWAY PRODUCTION SERVER - FINAL VERSION
// This server is specifically designed for Railway deployment
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Railway provides PORT, we MUST use it
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Railway requires binding to all interfaces

console.log('================================');
console.log('RAILWAY FINAL SERVER STARTING');
console.log(`PORT from environment: ${process.env.PORT}`);
console.log(`Using PORT: ${PORT}`);
console.log(`Binding to HOST: ${HOST}`);
console.log('================================');

// Enable CORS for all origins in development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// CRITICAL: Health check endpoint MUST work for Railway
app.get('/health', (req, res) => {
  console.log('[HEALTH CHECK] Responding to health check');
  res.status(200).json({
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    server: 'railway-final'
  });
});

// Secondary health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'railway-final',
    port: PORT
  });
});

// Dashboard API endpoints
app.get('/api/dashboard/kpis', (req, res) => {
  console.log('[API] Serving KPI data');
  res.json({
    revenue: {
      value: 2847500,
      change: 15.3,
      trend: 'up',
      label: 'Total Revenue'
    },
    production: {
      value: 92.5,
      change: 3.2,
      trend: 'up',
      label: 'Production Efficiency %'
    },
    inventory: {
      value: 45,
      change: -8.1,
      trend: 'down',
      label: 'Days of Inventory'
    },
    quality: {
      value: 99.2,
      change: 0.5,
      trend: 'up',
      label: 'Quality Score %'
    }
  });
});

app.get('/api/dashboard/charts', (req, res) => {
  console.log('[API] Serving chart data');
  res.json({
    salesTrend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Sales ($)',
        data: [450000, 480000, 470000, 510000, 530000, 580000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }]
    },
    productionEfficiency: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Efficiency %',
        data: [88, 91, 93, 92.5],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)'
      }]
    },
    inventoryLevels: {
      labels: ['Raw Materials', 'Work in Progress', 'Finished Goods'],
      datasets: [{
        label: 'Units',
        data: [15000, 8500, 22000],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ]
      }]
    }
  });
});

app.get('/api/dashboard/activities', (req, res) => {
  console.log('[API] Serving activities data');
  res.json([
    {
      id: 1,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'production',
      message: 'Production line A completed batch #4521 - 1,000 units produced',
      status: 'success',
      user: 'System'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      type: 'inventory',
      message: 'Low stock alert: Product SKU-789 below reorder point',
      status: 'warning',
      user: 'Inventory System'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      type: 'quality',
      message: 'Quality check passed for batch #4520 - 99.5% pass rate',
      status: 'success',
      user: 'QC Team'
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      type: 'order',
      message: 'New order received: #ORD-2025-1847 - 500 units',
      status: 'info',
      user: 'Sales System'
    }
  ]);
});

// Try to serve React build if it exists
const distPath = path.join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);

if (distExists) {
  console.log('[STATIC] Serving React build from dist/');
  app.use(express.static(distPath));

  // Serve index.html for all non-API routes (React Router)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else {
  console.log('[STATIC] No dist/ folder found, serving fallback HTML');

  // Fallback HTML when no build exists
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sentia Manufacturing Dashboard</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 800px;
            }
            h1 {
              font-size: 3rem;
              margin-bottom: 1rem;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            }
            .status-card {
              background: rgba(255,255,255,0.1);
              backdrop-filter: blur(10px);
              border-radius: 1rem;
              padding: 2rem;
              margin: 2rem 0;
              border: 1px solid rgba(255,255,255,0.2);
            }
            .status-item {
              display: flex;
              justify-content: space-between;
              padding: 0.5rem 0;
              border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .status-item:last-child {
              border-bottom: none;
            }
            .badge {
              background: rgba(34, 197, 94, 0.9);
              padding: 0.25rem 0.75rem;
              border-radius: 0.5rem;
              font-size: 0.875rem;
              font-weight: 600;
            }
            .api-list {
              text-align: left;
              margin-top: 2rem;
            }
            .api-list h3 {
              margin-bottom: 1rem;
            }
            .api-list a {
              color: white;
              text-decoration: none;
              display: block;
              padding: 0.75rem;
              background: rgba(255,255,255,0.1);
              margin: 0.5rem 0;
              border-radius: 0.5rem;
              transition: all 0.3s;
            }
            .api-list a:hover {
              background: rgba(255,255,255,0.2);
              transform: translateX(5px);
            }
            .api-list code {
              font-family: 'Courier New', monospace;
              background: rgba(0,0,0,0.2);
              padding: 0.125rem 0.25rem;
              border-radius: 0.25rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏭 Sentia Manufacturing</h1>
            <p style="font-size: 1.25rem; opacity: 0.9;">Enterprise Dashboard Server</p>

            <div class="status-card">
              <div class="status-item">
                <span>Server Status</span>
                <span class="badge">RUNNING</span>
              </div>
              <div class="status-item">
                <span>Port</span>
                <span>${PORT}</span>
              </div>
              <div class="status-item">
                <span>Environment</span>
                <span>${process.env.NODE_ENV || 'production'}</span>
              </div>
              <div class="status-item">
                <span>Server Version</span>
                <span>railway-final.cjs</span>
              </div>
              <div class="status-item">
                <span>Timestamp</span>
                <span>${new Date().toLocaleString()}</span>
              </div>
            </div>

            <div class="api-list">
              <h3>📊 Available API Endpoints</h3>
              <a href="/health">
                <code>GET /health</code> - System health check
              </a>
              <a href="/api/health">
                <code>GET /api/health</code> - API health status
              </a>
              <a href="/api/dashboard/kpis">
                <code>GET /api/dashboard/kpis</code> - Key performance indicators
              </a>
              <a href="/api/dashboard/charts">
                <code>GET /api/dashboard/charts</code> - Dashboard chart data
              </a>
              <a href="/api/dashboard/activities">
                <code>GET /api/dashboard/activities</code> - Recent activities feed
              </a>
            </div>

            <p style="margin-top: 3rem; opacity: 0.7; font-size: 0.875rem;">
              React application not built. Run <code>npm run build</code> to create production build.
            </p>
          </div>
        </body>
      </html>
    `);
  });
}

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server with explicit host binding for Railway
const server = app.listen(PORT, HOST, () => {
  console.log('================================');
  console.log('RAILWAY FINAL SERVER STARTED');
  console.log(`Listening on: ${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log('Ready to handle requests...');
  console.log('================================');
});

// Handle server errors
server.on('error', (error) => {
  console.error('[SERVER ERROR]', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM signal received, closing server...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] SIGINT signal received, closing server...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

// Keep alive for Railway
setInterval(() => {
  console.log(`[HEARTBEAT] Server alive at ${new Date().toISOString()}`);
}, 60000); // Log every minute