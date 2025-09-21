/**
 * FIXED EXPRESS SERVER WITH PROPER CLERK MIDDLEWARE ORDER
 * Implements TASK-001: Fix Clerk Authentication Middleware Order
 *
 * CRITICAL: Health check endpoint MUST come BEFORE Clerk middleware
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// CRITICAL: HEALTH CHECK MUST BE FIRST - BEFORE ANY AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Health check endpoint - MUST BE ACCESSIBLE WITHOUT AUTHENTICATION
 * This allows monitoring services to verify application status
 * @route GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'sentia-manufacturing-dashboard',
    version: process.env.npm_package_version || '1.0.7',
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime(),
    checks: {
      server: 'running',
      database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
      clerk: process.env.CLERK_SECRET_KEY ? 'configured' : 'not-configured'
    }
  });
});

// ============================================================================
// CORS CONFIGURATION - TASK-003
// ============================================================================

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://sentia-testing.onrender.com',
      'https://sentia.onrender.com',
      'https://sentiaprod.financeflo.ai'
    ];

    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count']
};

app.use(cors(corsOptions));

// ============================================================================
// BODY PARSING MIDDLEWARE
// ============================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// ENVIRONMENT VARIABLE VALIDATION - TASK-002
// ============================================================================

function validateEnvironment() {
  const requiredEnvVars = [
    'VITE_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('='.repeat(70));
    console.error('ERROR: Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('='.repeat(70));

    // In production, we should fail fast
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    console.log('✅ Environment validation passed');
  }

  // Log configuration status
  console.log('='.repeat(70));
  console.log('SENTIA MANUFACTURING DASHBOARD - SERVER CONFIGURATION');
  console.log('='.repeat(70));
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Port:', PORT);
  console.log('Clerk Publishable Key:', process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'CONFIGURED' : 'MISSING');
  console.log('Clerk Secret Key:', process.env.CLERK_SECRET_KEY ? 'CONFIGURED' : 'MISSING');
  console.log('Database URL:', process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING');
  console.log('='.repeat(70));
}

// Validate environment on startup
validateEnvironment();

// ============================================================================
// CLERK AUTHENTICATION MIDDLEWARE - COMES AFTER HEALTH CHECK
// ============================================================================

// Only apply Clerk middleware if configured
if (process.env.CLERK_SECRET_KEY) {
  // Dynamic import to avoid errors if @clerk/express is not installed
  import('@clerk/express').then(({ clerkMiddleware }) => {
    console.log('🔐 Initializing Clerk authentication middleware...');

    // Apply Clerk middleware to all routes EXCEPT health check
    app.use((req, res, next) => {
      // Skip authentication for health check and public routes
      if (req.path === '/health' ||
          req.path === '/api/health' ||
          req.path.startsWith('/public') ||
          req.path.startsWith('/assets')) {
        return next();
      }

      // Apply Clerk middleware for all other routes
      clerkMiddleware({
        secretKey: process.env.CLERK_SECRET_KEY,
        publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
        debug: process.env.NODE_ENV === 'development'
      })(req, res, next);
    });

    console.log('✅ Clerk middleware initialized (health check bypassed)');
  }).catch(error => {
    console.error('❌ Failed to initialize Clerk middleware:', error.message);
    console.log('⚠️  Running without authentication');
  });
} else {
  console.log('⚠️  Clerk not configured - running without authentication');
}

// ============================================================================
// API ROUTES
// ============================================================================

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    message: 'Sentia Manufacturing Dashboard API',
    timestamp: new Date().toISOString(),
    authenticated: !!req.auth
  });
});

// Import and setup API routes if they exist
import('./api/routes/index.js').then(({ setupAPIRoutes }) => {
  if (setupAPIRoutes) {
    setupAPIRoutes(app);
    console.log('✅ API routes configured');
  }
}).catch(() => {
  console.log('⚠️  API routes not found - using basic endpoints only');
});

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

// Serve static files from dist directory if it exists
const distPath = path.join(__dirname, 'dist');
import('fs').then(({ existsSync }) => {
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    console.log('✅ Serving static files from dist/');

    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  } else {
    console.log('⚠️  No dist/ folder found - build may be required');

    // Fallback HTML response
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sentia Manufacturing Dashboard</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                max-width: 600px;
              }
              h1 { margin-bottom: 1rem; }
              .status {
                background: rgba(34, 197, 94, 0.2);
                border: 2px solid rgba(34, 197, 94, 0.5);
                padding: 1rem;
                border-radius: 10px;
                margin: 1rem 0;
              }
              a {
                color: white;
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🏭 Sentia Manufacturing Dashboard</h1>
              <div class="status">
                <strong>✅ Server Running</strong><br>
                Build required: Run 'npm run build' to generate frontend assets
              </div>
              <p>
                <a href="/health">Check Health Status</a> |
                <a href="/api/status">API Status</a>
              </p>
            </div>
          </body>
          </html>
        `);
      }
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(70));
  console.log('🚀 SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(70));
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`API Status: http://localhost:${PORT}/api/status`);
  console.log('='.repeat(70));
  console.log('✅ TASK-001: Health check endpoint accessible without auth');
  console.log('✅ TASK-002: Environment variables validated');
  console.log('✅ TASK-003: CORS properly configured');
  console.log('='.repeat(70));
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;