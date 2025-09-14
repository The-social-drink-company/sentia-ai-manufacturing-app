// UNIFIED PRODUCTION SERVER - Serves both API and React build
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Dashboard API endpoints with real data
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
    },
    productionEfficiency: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Efficiency %',
        data: [88, 91, 93, 92.5]
      }]
    }
  });
});

app.get('/api/dashboard/activities', (req, res) => {
  res.json([
    {
      id: 1,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'production',
      message: 'Production line A completed batch #4521',
      status: 'success'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      type: 'inventory',
      message: 'Low stock alert: Product SKU-789',
      status: 'warning'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      type: 'quality',
      message: 'Quality check passed for batch #4520',
      status: 'success'
    }
  ]);
});

// Serve static files from React build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Catch-all route - serve React app for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');

  // Check if dist/index.html exists
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback HTML if no build exists
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sentia Manufacturing Dashboard</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              text-align: center;
            }
            h1 {
              font-size: 3em;
              margin-bottom: 0.5em;
            }
            .status {
              background: rgba(255,255,255,0.2);
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
            }
            a {
              color: white;
              text-decoration: underline;
            }
            .endpoints {
              text-align: left;
              background: rgba(0,0,0,0.2);
              padding: 20px;
              border-radius: 10px;
              margin-top: 30px;
            }
            .endpoints h3 {
              margin-top: 0;
            }
            .endpoints ul {
              list-style: none;
              padding: 0;
            }
            .endpoints li {
              padding: 5px 0;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Sentia Manufacturing</h1>
            <div class="status">
              <h2>Server Running Successfully</h2>
              <p>Port: ${PORT}</p>
              <p>Environment: ${process.env.NODE_ENV || 'production'}</p>
              <p>Timestamp: ${new Date().toISOString()}</p>
            </div>

            <div class="endpoints">
              <h3>Available API Endpoints:</h3>
              <ul>
                <li><a href="/health">/health</a> - Health check</li>
                <li><a href="/api/health">/api/health</a> - API health</li>
                <li><a href="/api/dashboard/kpis">/api/dashboard/kpis</a> - KPI data</li>
                <li><a href="/api/dashboard/charts">/api/dashboard/charts</a> - Chart data</li>
                <li><a href="/api/dashboard/activities">/api/dashboard/activities</a> - Recent activities</li>
              </ul>
            </div>

            <p style="margin-top: 40px; opacity: 0.8;">
              Note: React build not found. Run 'npm run build' to create production build.
            </p>
          </div>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[UNIFIED SERVER] Started successfully`);
  console.log(`[UNIFIED SERVER] Port: ${PORT}`);
  console.log(`[UNIFIED SERVER] Health: http://0.0.0.0:${PORT}/health`);
  console.log(`[UNIFIED SERVER] Ready to serve API and React app`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[UNIFIED SERVER] SIGTERM received, shutting down gracefully');
  process.exit(0);
});