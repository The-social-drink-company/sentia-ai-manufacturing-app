import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(compression());
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
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
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
    Health Check: http://localhost:${port}/health
    ${isProduction ? 'Serving production build from /dist' : 'Development mode - use Vite for frontend'}
    ======================================
  `);
});

