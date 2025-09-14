import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.5'
  });
});

// API endpoint for Railway health checks
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sentia-manufacturing-dashboard',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from dist directory in production
if (isProduction) {
  const distPath = path.join(__dirname, 'dist');

  // Check if dist directory exists
  if (fs.existsSync(distPath)) {
    console.log(`✅ Serving static files from ${distPath}`);

    // Serve static files
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));

    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(503).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Sentia - Building</title>
              <style>
                body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .container { text-align: center; color: white; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🚀 Sentia Manufacturing Dashboard</h1>
                <p>Application is building. Please refresh in a moment.</p>
              </div>
            </body>
            </html>
          `);
        }
      } else {
        res.status(404).json({ error: 'API endpoint not found' });
      }
    });
  } else {
    console.warn(`⚠️ Warning: dist directory not found at ${distPath}`);
    console.log('📦 Falling back to build status page');

    // Serve a build status page if dist doesn't exist
    app.get('*', (req, res) => {
      if (req.path === '/health' || req.path === '/api/health') {
        return; // Let health checks pass through
      }
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sentia - Deployment in Progress</title>
          <style>
            body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { text-align: center; color: white; padding: 2rem; background: rgba(255,255,255,0.1); border-radius: 10px; }
            .status { margin-top: 1rem; padding: 0.5rem 1rem; background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.5); border-radius: 20px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Sentia Manufacturing Dashboard</h1>
            <p>Deployment in progress. The application will be available shortly.</p>
            <div class="status">⏳ Building React Application</div>
            <p style="margin-top: 2rem; opacity: 0.8;">Please refresh this page in a few moments.</p>
          </div>
        </body>
        </html>
      `);
    });
  }
} else {
  // Development mode - proxy to Vite dev server
  app.get('/', (req, res) => {
    res.json({
      message: 'Sentia Manufacturing Dashboard API Server',
      environment: 'development',
      frontend: 'http://localhost:3000',
      api: 'http://localhost:5000'
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: isProduction ? 'An error occurred' : err.message
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`
    ======================================
    Sentia Manufacturing Dashboard Server
    ======================================
    Environment: ${process.env.NODE_ENV || 'development'}
    Port: ${port}
    PORT env var: ${process.env.PORT || 'not set'}
    Health Check: http://localhost:${port}/health
    ${isProduction ? 'Serving production build from /dist' : 'Development mode - use Vite for frontend'}
    ======================================
  `);

  // Log every 30 seconds to show server is alive
  setInterval(() => {
    console.log(`[${new Date().toISOString()}] Server alive on port ${port}`);
  }, 30000);
});

