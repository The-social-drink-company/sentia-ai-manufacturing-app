// PRODUCTION-READY SERVER FOR RAILWAY DEPLOYMENT
const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const isDevelopment = process.env.NODE_ENV === 'development';

// Essential middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins in production for now
    callback(null, true);
  },
  credentials: true
}));

// Comprehensive request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (CRITICAL for Railway)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    message: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mock API endpoints (so the app doesn't crash when calling APIs)
app.get('/api/working-capital/*', (req, res) => {
  console.log('Working capital API called:', req.path);
  res.json({
    data: {},
    message: 'Demo mode - no backend configured'
  });
});

app.get('/api/*', (req, res) => {
  console.log('API called:', req.path);
  res.json({
    message: 'API endpoint not configured',
    path: req.path
  });
});

// CRITICAL: Serve static files from dist directory
const distPath = path.join(__dirname, 'dist');
console.log('Serving static files from:', distPath);
console.log('Directory exists:', require('fs').existsSync(distPath));

// Serve static files with proper headers
app.use(express.static(distPath, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// CRITICAL: Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  console.log('Serving index.html for:', req.path);
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('index.html not found at:', indexPath);
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Deployment Error</h1>
          <p>The application files were not found. Please check the build process.</p>
          <p>Looking for: ${indexPath}</p>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('  SENTIA MANUFACTURING DASHBOARD');
  console.log('========================================');
  console.log(`  Server running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`  Static files: ${distPath}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});