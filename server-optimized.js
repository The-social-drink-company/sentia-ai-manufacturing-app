const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 10000;

// Memory optimization middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security headers with optimized CSP for React
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://clerk.sentia.financeflo.ai"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.clerk.com", "https://mcp-server-tkyu.onrender.com", "wss:"],
    },
  },
}));

// Optimize static file serving with caching
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Memory-optimized JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint with memory monitoring
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const heapUsagePercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);
  
  const status = heapUsagePercent > 85 ? 'degraded' : 'healthy';
  
  res.json({
    status,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      heapUsedMB,
      heapTotalMB,
      heapUsagePercent: `${heapUsagePercent}%`,
      rssMB: (memUsage.rss / 1024 / 1024).toFixed(2)
    },
    uptime: process.uptime()
  });
});

// API routes for working capital calculator
app.get('/api/working-capital/calculate', (req, res) => {
  res.json({
    success: true,
    data: {
      currentRatio: 2.1,
      quickRatio: 1.8,
      cashUnlockPotential: 83000,
      annualImprovement: 334000,
      cycleOptimization: 46
    }
  });
});

// Catch-all handler for React Router (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});

// Memory cleanup and garbage collection
if (global.gc) {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (heapUsagePercent > 80) {
      console.log(`[MEMORY] High usage detected: ${heapUsagePercent.toFixed(1)}% - Running GC`);
      global.gc();
    }
  }, 30000); // Check every 30 seconds
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SERVER] Received SIGINT, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Optimized server running on port ${PORT}`);
  console.log(`[MEMORY] Initial heap usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`);
});

module.exports = app;
