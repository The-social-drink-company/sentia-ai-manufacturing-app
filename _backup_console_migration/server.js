import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { rateLimiter, apiLimiter, authLimiter } from './middleware/rate-limiter.js';
import { cacheService } from './src/services/cache/redisCacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(_filename);

// Load environment variables
if (!process.env.RENDER) {
  dotenv.config();
}

// Memory optimization: Set Node.js memory limits
if (process.env.NODE_ENV === 'production') {
  // Set max old space size to 128MB for Render's free tier
  process.env.NODE_OPTIONS = '--max-old-space-size=128';
}

// Determine current environment
const BRANCH = process.env.RENDER_GIT_BRANCH || process.env.BRANCH || process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;

console.log('='.repeat(50));
console.log('SENTIA MANUFACTURING - MEMORY OPTIMIZED');
console.log('='.repeat(50));
console.log(`Environment: ${BRANCH}`);
console.log(`Port: ${PORT}`);
console.log(`Memory Limit: ${process.env.NODE_OPTIONS || 'default'}`);
console.log('='.repeat(50));

// Initialize Express app with memory optimizations
const app = express();

// Memory optimization: Enable compression early
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress files larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// SECURITY: Enhanced CSP configuration (memory optimized)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Required for Tailwind CSS
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Temporary for React dev builds
        "https://clerk.financeflo.ai",
        "https://robust-snake-50.clerk.accounts.dev",
        "https://js.clerk.dev",
        "https://api.clerk.dev"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com",
        "data:"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://clerk.financeflo.ai",
        "https://robust-snake-50.clerk.accounts.dev",
        "https://api.clerk.dev",
        "wss://clerk.financeflo.ai"
      ],
      frameSrc: [
        "'self'", 
        "https://clerk.financeflo.ai", 
        "https://js.clerk.dev"
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration (memory optimized)
const corsOptions = {
  origin: [
    'https://deployrend.financeflo.ai',
    'https://testingrend.financeflo.ai', 
    'https://prodrend.financeflo.ai',
    'https://clerk.financeflo.ai',
    'https://robust-snake-50.clerk.accounts.dev'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// Note: Rate limiting will be initialized in startup function

// Memory optimization: Limit request size
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoints (before authentication)
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const heapUsagePercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);
  const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);
  
  // Determine status based on memory usage
  let status = 'healthy';
  if (heapUsagePercent > 85) {
    status = 'degraded';
  } else if (heapUsagePercent > 95) {
    status = 'unhealthy';
  }
  
  res.json({
    status,
    timestamp: new Date().toISOString(),
    environment: BRANCH,
    memory: {
      heapUsedMB,
      heapTotalMB,
      heapUsagePercent: `${heapUsagePercent}%`,
      rssMB
    },
    uptime: process.uptime()
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// Memory optimization: Garbage collection endpoint (development only)
if (BRANCH === 'development') {
  app.post('/admin/gc', (req, res) => {
    if (global.gc) {
      global.gc();
      res.json({ 
        message: 'Garbage collection triggered',
        memory: process.memoryUsage()
      });
    } else {
      res.status(500).json({ 
        error: 'Garbage collection not available. Start with --expose-gc flag.' 
      });
    }
  });
}

// API routes (minimal for memory optimization)
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Sentia Manufacturing Dashboard',
    version: '1.0.0',
    environment: BRANCH,
    timestamp: new Date().toISOString()
  });
});

// CRITICAL FIX: Serve static files BEFORE catch-all route
const staticOptions = {
  maxAge: BRANCH === 'production' ? '1y' : '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Cache static assets aggressively
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};

app.use(express.static(path.join(__dirname, 'dist'), staticOptions));

// Catch-all handler for React Router (MUST BE LAST)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Memory optimization: Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Don't leak error details in production
  const isDev = BRANCH === 'development';
  res.status(500).json({
    error: isDev ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Memory optimization: Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Memory monitoring (development only)
if (BRANCH === 'development') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const heapUsagePercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);
    
    if (heapUsagePercent > 80) {
      console.warn(`⚠️  High memory usage: ${heapUsedMB}MB (${heapUsagePercent}%)`);
    }
  }, 30000); // Check every 30 seconds
}

// Async startup function
async function startServer() {
  try {
    // Initialize caching service
    await cacheService.initialize();
    console.log('⚡ Cache service initialized');

    // Initialize rate limiting
    await rateLimiter.initialize();
    console.log('🔒 Rate limiting initialized');

    // Apply rate limiting to API routes
    app.use('/api/', apiLimiter());
    app.use('/auth/', authLimiter());
    console.log('🛡️  Rate limiting middleware applied');

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${BRANCH}`);
      console.log(`💾 Memory monitoring: ${BRANCH === 'development' ? 'enabled' : 'disabled'}`);

      // Initial memory report
      const memUsage = process.memoryUsage();
      console.log(`📊 Initial memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
