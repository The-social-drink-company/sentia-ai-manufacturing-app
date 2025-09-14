// NUCLEAR RAILWAY SERVER - CommonJS Version
// This WILL work on Railway

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = parseInt(process.env.PORT) || 5000;

console.log(`
========================================
RAILWAY NUCLEAR DEPLOYMENT SERVER (CJS)
========================================
Starting at: ${new Date().toISOString()}
PORT from env: ${process.env.PORT}
Using PORT: ${PORT}
NODE_ENV: ${process.env.NODE_ENV}
Railway: ${process.env.RAILWAY_ENVIRONMENT || 'not detected'}
========================================
`);

// AGGRESSIVE ERROR HANDLING
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION - SERVER STILL RUNNING:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION - SERVER STILL RUNNING:', err);
});

// Basic middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health checks
app.get('/health', (req, res) => {
  console.log('HEALTH CHECK HIT');
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  console.log('API HEALTH CHECK HIT');
  res.status(200).json({
    status: 'healthy',
    service: 'sentia-dashboard',
    timestamp: new Date().toISOString()
  });
});

// Dashboard endpoints
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
    revenue: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Revenue',
        data: [2100000, 2250000, 2400000, 2550000, 2700000, 2847500]
      }]
    }
  });
});

app.get('/api/dashboard/activities', (req, res) => {
  res.json([{
    id: 1,
    type: 'production',
    message: 'System operational',
    timestamp: new Date().toISOString(),
    status: 'success'
  }]);
});

// Try to serve static files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log(`SERVING STATIC FILES FROM: ${distPath}`);
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send(getFallbackHTML());
      }
    }
  });
} else {
  console.log('NO DIST FOLDER - SERVING FALLBACK');

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.status(200).send(getFallbackHTML());
    }
  });
}

function getFallbackHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sentia Dashboard - Railway</title>
      <style>
        body {
          font-family: system-ui;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .status {
          background: rgba(255,255,255,0.2);
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        a { color: #ffd700; }
      </style>
    </head>
    <body>
      <h1>🚀 Sentia Manufacturing Dashboard</h1>
      <div class="status">
        <h2>✅ Railway Server Running!</h2>
        <p>Server Time: ${new Date().toISOString()}</p>
        <p>Port: ${PORT}</p>
        <p>Environment: ${process.env.NODE_ENV || 'production'}</p>
      </div>
      <div class="status">
        <h3>API Endpoints:</h3>
        <ul>
          <li><a href="/health">/health</a> - Health Check</li>
          <li><a href="/api/health">/api/health</a> - API Health</li>
          <li><a href="/api/dashboard/kpis">/api/dashboard/kpis</a> - KPIs</li>
          <li><a href="/api/dashboard/charts">/api/dashboard/charts</a> - Charts</li>
        </ul>
      </div>
    </body>
    </html>
  `;
}

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
========================================
✅ SERVER STARTED SUCCESSFULLY (CJS)
========================================
Listening on: http://0.0.0.0:${PORT}
Health: http://localhost:${PORT}/health
API: http://localhost:${PORT}/api/health
========================================
  `);

  // Heartbeat
  setInterval(() => {
    console.log(`[HEARTBEAT] Server alive on port ${PORT} at ${new Date().toISOString()}`);
  }, 30000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

console.log('Railway server initialization complete');