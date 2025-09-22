import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getDatabaseConfig, getMCPConfig, getAPIBaseURL } from './config/database-config.js';
import { healthCheckService } from './services/health-check-service.js';
import { validateBackendEnvironment } from './src/utils/env-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
if (!process.env.RENDER) {
  dotenv.config();
}

// TASK-002: Validate environment variables on startup
validateBackendEnvironment();

// Determine current branch/environment
const BRANCH = process.env.RENDER_GIT_BRANCH || process.env.BRANCH || process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;

console.log('='.repeat(70));
console.log('SENTIA MANUFACTURING DASHBOARD - UNIFIED SERVER');
console.log('='.repeat(70));
console.log(`Branch: ${BRANCH}`);
console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`Port: ${PORT}`);
console.log('='.repeat(70));

// Get configurations
const dbConfig = getDatabaseConfig();
const mcpConfig = getMCPConfig();
const apiBaseUrl = getAPIBaseURL();

console.log(`Database: ${dbConfig.database}`);
console.log(`MCP Server: ${mcpConfig.url}`);
console.log(`API Base: ${apiBaseUrl}`);
console.log('='.repeat(70));

// Initialize Prisma with correct database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbConfig.connectionString
    }
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    console.log('✅ Database connected successfully');
    console.log('Database info:', result[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Test MCP server connection
async function testMCPConnection() {
  try {
    const response = await axios.get(`${mcpConfig.url}/health`, {
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${mcpConfig.auth.jwt_secret}`
      }
    });
    console.log('✅ MCP Server connected successfully');
    console.log('MCP Server status:', response.data);
    return true;
  } catch (error) {
    console.error('⚠️ MCP Server connection failed:', error.message);
    console.log('MCP Server may be starting up or unavailable');
    return false;
  }
}

// Initialize Express app
const app = express();

// SECURITY FIX: Enhanced CSP configuration to resolve violations
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Required for Tailwind CSS and styled-components
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net" // For any CDN stylesheets
      ],
      scriptSrc: [
        "'self'",
        // Temporarily allow unsafe-eval for React development builds
        // TODO: Remove in production and use proper bundling
        "'unsafe-eval'",
        "https://clerk.financeflo.ai",
        "https://robust-snake-50.clerk.accounts.dev",
        "https://js.clerk.dev", // Clerk's main script domain
        "https://clerk.com",
        "https://api.clerk.dev"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com",
        "https://fonts.googleapis.com",
        "data:" // For base64 encoded fonts
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:", 
        "blob:",
        "https://images.clerk.dev", // Clerk profile images
        "https://img.clerk.com"
      ],
      connectSrc: [
        "'self'",
        "https://clerk.financeflo.ai",
        "https://robust-snake-50.clerk.accounts.dev",
        "https://api.clerk.dev",
        "https://api.clerk.com",
        "wss://clerk.financeflo.ai", // WebSocket connections
        "wss://robust-snake-50.clerk.accounts.dev",
        mcpConfig.url,
        mcpConfig.websocketUrl,
        apiBaseUrl,
        // Allow connections to the same origin for API calls
        "'self'"
      ],
      frameSrc: [
        "'self'", 
        "https://clerk.financeflo.ai", 
        "https://robust-snake-50.clerk.accounts.dev",
        "https://js.clerk.dev"
      ],
      objectSrc: ["'none'"], // Disable object/embed for security
      baseUri: ["'self'"], // Restrict base URI
      formAction: ["'self'"], // Restrict form actions
      upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
    }
  },
  crossOriginEmbedderPolicy: false,
  // Additional security headers
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// TASK-003: CORS configuration fix for all deployment environments
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      // Production domains
      'https://deployrend.financeflo.ai',
      'https://sentiaprod.financeflo.ai',
      'https://sentia.onrender.com',
      'https://sentia-manufacturing-production.onrender.com',
      
      // Testing domains
      'https://sentia-testing.onrender.com',
      'https://sentia-manufacturing-testing.onrender.com',
      
      // Development domains
      'https://sentia-manufacturing-development.onrender.com',
      'https://deployrend.financeflo.ai',
      
      // Local development
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      
      // Clerk domains for authentication
      'https://clerk.financeflo.ai',
      'https://robust-snake-50.clerk.accounts.dev'
    ];

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint with comprehensive monitoring
app.get('/health', async (req, res) => {
  try {
    const health = await healthCheckService.getOverallHealth();

    // Determine HTTP status code
    let statusCode = 200;
    if (health.status === 'unhealthy') {
      statusCode = 503;
    } else if (health.status === 'degraded') {
      statusCode = 200; // Still return 200 for degraded to avoid unnecessary alerts
    }

    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simplified health check for load balancers
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness check
app.get('/health/ready', async (req, res) => {
  try {
    // Quick database check
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message, timestamp: new Date().toISOString() });
  }
});

// API endpoint to get current configuration
app.get('/api/config', (req, res) => {
  res.json({
    environment: BRANCH,
    database: dbConfig.database,
    mcp_server: mcpConfig.url,
    api_base: apiBaseUrl,
    features: {
      authentication: 'clerk',
      ai_enabled: true,
      mcp_integration: true,
      real_time_updates: true
    }
  });
});

// Proxy requests to MCP server
app.use('/api/mcp', async (req, res) => {
  try {
    const mcpUrl = `${mcpConfig.url}${req.path}`;
    const response = await axios({
      method: req.method,
      url: mcpUrl,
      data: req.body,
      headers: {
        ...req.headers,
        'Authorization': `Bearer ${mcpConfig.auth.jwt_secret}`,
        'X-Environment': BRANCH,
        'X-Database': dbConfig.database
      },
      timeout: mcpConfig.timeout
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('MCP proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'MCP server request failed',
      message: error.message
    });
  }
});

// Database query endpoint (for testing)
app.get('/api/db/test', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT
        current_database() as database,
        current_user as user,
        version() as version,
        now() as timestamp
    `;

    res.json({
      success: true,
      environment: BRANCH,
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API routes placeholder
app.use('/api', (req, res, next) => {
  // Import and use your API routes here
  // For now, return a status message
  if (req.path === '/') {
    res.json({
      message: 'Sentia Manufacturing API',
      environment: BRANCH,
      database: dbConfig.database,
      mcp_server: mcpConfig.url,
      timestamp: new Date().toISOString()
    });
  } else {
    next();
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  app.use(express.static(path.join(__dirname, 'dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message,
    environment: BRANCH
  });
});

// Start server
async function startServer() {
  try {
    // Test connections
    console.log('\nTesting connections...');
    await testDatabaseConnection();
    await testMCPConnection();

    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(70));
      console.log('SERVER STARTED SUCCESSFULLY');
      console.log('='.repeat(70));
      console.log(`Environment: ${BRANCH}`);
      console.log(`Database: ${dbConfig.database}`);
      console.log(`MCP Server: ${mcpConfig.url}`);
      console.log(`Listening on: http://0.0.0.0:${PORT}`);
      console.log('='.repeat(70));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);

  try {
    // Clean up health check service
    await healthCheckService.cleanup();
    console.log('Health check service cleaned up');

    // Disconnect database
    await prisma.$disconnect();
    console.log('Database disconnected');

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

