/**
 * REAL ENTERPRISE SERVER - NO MOCK DATA
 * All endpoints return real data or proper errors
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import { clerkMiddleware, requireAuth } from '@clerk/express';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const prisma = new PrismaClient();

// Real environment validation
const requiredEnvVars = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('ERROR: Missing required environment variables:', missingEnvVars);
  console.error('Server cannot start without proper configuration.');
  process.exit(1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://clerk.financeflo.ai", "https://*.clerk.accounts.dev"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://clerk.financeflo.ai", "https://*.clerk.accounts.dev"]
    }
  }
}));

app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Clerk authentication middleware
app.use(clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY
}));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint - REAL status
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Sentia Manufacturing Dashboard',
      version: '2.0.0',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Service unavailable'
    });
  }
});

// API Status - REAL service status
app.get('/api/status', async (req, res) => {
  const status = {
    services: {
      database: false,
      authentication: false,
      cache: false
    },
    integrations: {
      xero: false,
      shopify: false,
      amazon: false,
      unleashed: false
    },
    timestamp: new Date().toISOString()
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    status.services.database = true;
  } catch (error) {
    console.error('Database check failed:', error);
  }

  // Check authentication
  status.services.authentication = !!process.env.CLERK_SECRET_KEY;

  // Check integrations (based on environment variables)
  status.integrations.xero = !!process.env.XERO_CLIENT_ID;
  status.integrations.shopify = !!process.env.SHOPIFY_API_KEY;
  status.integrations.amazon = !!process.env.AMAZON_SELLER_ID;
  status.integrations.unleashed = !!process.env.UNLEASHED_API_ID;

  res.json(status);
});

// Protected route example - requires authentication
app.get('/api/dashboard/summary', requireAuth(), async (req, res) => {
  try {
    // Get real user from Clerk
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch real data from database
    const [metrics, recentActivity] = await Promise.all([
      prisma.metric.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        metrics: metrics[0] || null,
        recentActivity,
        userId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Real forecasting endpoint - requires actual data
app.get('/api/forecasting/enhanced', requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Check if we have historical data
    const historicalData = await prisma.salesData.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 365
    });

    if (historicalData.length < 30) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data',
        message: 'At least 30 days of historical data required for forecasting'
      });
    }

    // Real forecasting would go here with actual AI model
    // For now, return error indicating AI not configured
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'AI service not configured',
        message: 'Forecasting requires AI model configuration'
      });
    }

    // If AI is configured, perform real forecasting
    // This would call actual AI service
    res.status(501).json({
      success: false,
      error: 'Not implemented',
      message: 'Real AI forecasting implementation pending'
    });
  } catch (error) {
    console.error('Forecasting error:', error);
    res.status(500).json({
      success: false,
      error: 'Forecasting failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Working capital - real financial data
app.get('/api/financial/working-capital', requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;

    const financialData = await prisma.financialRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!financialData) {
      return res.status(404).json({
        success: false,
        error: 'No financial data found',
        message: 'Please import your financial data first'
      });
    }

    res.json({
      success: true,
      data: financialData
    });
  } catch (error) {
    console.error('Working capital error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch working capital data'
    });
  }
});

// Integration endpoints - return real status
app.get('/api/:integration(xero|shopify|amazon|unleashed)/status', (req, res) => {
  const integration = req.params.integration;
  const configKeys = {
    xero: ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'],
    shopify: ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET'],
    amazon: ['AMAZON_SELLER_ID', 'AMAZON_MWS_TOKEN'],
    unleashed: ['UNLEASHED_API_ID', 'UNLEASHED_API_KEY']
  };

  const requiredKeys = configKeys[integration];
  const isConfigured = requiredKeys.every(key => !!process.env[key]);

  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      error: 'Integration not configured',
      message: `${integration.charAt(0).toUpperCase() + integration.slice(1)} API credentials not set`,
      configured: false
    });
  }

  res.json({
    success: true,
    configured: true,
    integration,
    message: 'Integration configured but not connected',
    note: 'Real API connection implementation required'
  });
});

// All other integration endpoints return not implemented
app.get('/api/:integration(xero|shopify|amazon|unleashed)/:endpoint', requireAuth(), (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    message: 'This endpoint requires real API integration implementation',
    integration: req.params.integration,
    endpoint: req.params.endpoint
  });
});

// Security endpoints - real implementation needed
app.get('/api/security/status', (req, res) => {
  res.json({
    success: true,
    data: {
      mfaEnabled: false,
      rbacEnabled: false,
      auditLoggingEnabled: false,
      message: 'Security features require implementation',
      configured: {
        clerk: !!process.env.CLERK_SECRET_KEY,
        database: !!process.env.DATABASE_URL
      }
    }
  });
});

// Monitoring endpoints - real metrics
app.get('/api/monitoring/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    database: null
  };

  try {
    const dbStatus = await prisma.$queryRaw`SELECT COUNT(*) as connections FROM pg_stat_activity`;
    metrics.database = dbStatus[0];
  } catch (error) {
    metrics.database = { error: 'Failed to query database metrics' };
  }

  res.json({
    success: true,
    data: metrics
  });
});

// Serve static files in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Start server with proper database connection
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n========================================');
      console.log('🚀 SENTIA MANUFACTURING DASHBOARD');
      console.log('   REAL IMPLEMENTATION - NO MOCK DATA');
      console.log('========================================');
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
      console.log(`Authentication: ${process.env.CLERK_SECRET_KEY ? 'Configured' : 'Not configured'}`);
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;