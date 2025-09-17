// Sentia Manufacturing Dashboard - Render Optimized Server
// Clean server implementation for Render deployment

// Graceful shutdown handlers for Render deployment
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Error handling for production
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// MCP Server Mode (optional - set MCP_SERVER_MODE=true to enable)
if (process.env.MCP_SERVER_MODE === 'true') {
  console.log('MCP_SERVER_MODE detected - starting MCP server...');
  import('./mcp-startup.js');
  process.exit = () => {};
}

// Suppress Node.js deprecation warnings in production
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  // Only suppress punycode deprecation warnings
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return; // Silently ignore punycode deprecation
  }
  // Log other warnings normally
  console.warn(warning.name + ': ' + warning.message);
});

// Environment variable loading
import dotenv from 'dotenv';
dotenv.config();

// Database connection configuration for Render
if (process.env.NODE_ENV === 'production') {
  // Increase database connection timeout for production
  process.env.DATABASE_CONNECTION_TIMEOUT = '30000';
  process.env.DATABASE_POOL_TIMEOUT = '30000';
}

// Validate critical environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Warning: Missing environment variables:', missingVars);
  // Continue anyway for initial deployment
}

import express from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import ExcelJS from 'exceljs';
import csv from 'csv-parser';
import fs from 'fs';
import { fileURLToPath } from 'url';
// Node 18+ has global fetch
import xeroService from './services/xeroService.js';
import aiAnalyticsService from './services/aiAnalyticsService.js';
import { logInfo, logError, logWarn } from './services/observability/structuredLogger.js';
import healthMonitorService from './services/healthMonitorService.js';
import { errorHandler, expressErrorMiddleware, asyncHandler } from './services/enterprise/errorHandler.js';
import { processManager } from './services/enterprise/processManager.js';
import realtimeManager from './services/realtime/websocket-sse-manager.js';
import { createServer } from 'http';
import apiIntegrationManager from './services/integrations/api-integration-manager.js';
import routeValidator from './services/route-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable enterprise process management and resource monitoring
processManager.monitorResources();

// Add enterprise error handling middleware early in the stack
app.use(expressErrorMiddleware);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration for Render
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc)
    if (!origin) return callback(null, true);

    // Allowed origins for Render deployment
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://sentia-manufacturing-development.onrender.com',
      'https://sentia-manufacturing-testing.onrender.com',
      'https://sentia-manufacturing-production.onrender.com'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // In development, allow all origins
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page']
};

app.use(cors(corsOptions));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  }
});

// Health check endpoint (must be early for Render health checks)
app.get('/health', asyncHandler(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: global.prisma ? 'connected' : 'disconnected',
      mcp: process.env.MCP_SERVER_URL ? 'configured' : 'not_configured'
    }
  };

  res.json(health);
}));

// API Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sentia-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Import API routes
import userRoutes from './routes/userRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import forecastingRoutes from './routes/forecastingRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import whatIfRoutes from './routes/whatIfRoutes.js';
import configRoutes from './routes/configRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import prismaHealthRoute from './routes/prismaHealthRoute.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import authRoutes from './routes/authRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import qualityRoutes from './routes/qualityRoutes.js';
import workingCapitalRoutes from './routes/workingCapitalRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminDataRoutes from './api/admin-data.js';

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/forecasting', forecastingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/what-if', whatIfRoutes);
app.use('/api/config', configRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/database', prismaHealthRoute);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/working-capital', workingCapitalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin-data', adminDataRoutes);

// Xero API routes
app.use('/api/xero', xeroService.router);

// AI Analytics route
app.get('/api/ai-analytics', asyncHandler(async (req, res) => {
  try {
    const { dataType = 'overview' } = req.query;
    const analysis = await aiAnalyticsService.analyzeManufacturingData(dataType);
    res.json(analysis);
  } catch (error) {
    console.error('AI Analytics error:', error);
    res.status(500).json({
      error: 'AI analysis failed',
      message: error.message
    });
  }
}));

// Data import routes
app.post('/api/import/excel', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.worksheets[0];
    const data = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = worksheet.getRow(1).getCell(colNumber).value;
          rowData[header] = cell.value;
        });
        data.push(rowData);
      }
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Successfully imported ${data.length} rows`,
      data: data
    });
  } catch (error) {
    console.error('Excel import error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to import Excel file' });
  }
}));

// Serve static files from React build
app.use('/js', express.static(path.join(__dirname, 'dist', 'js'), {
  setHeaders: (res, filepath) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js') || filepath.endsWith('.css')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.set('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Serve the React app
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Fallback route - serve React app for client-side routing
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Global error handler (must be last)
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
(async () => {
  try {
    // Create HTTP server for WebSocket support
    const httpServer = createServer(app);

    // Initialize WebSocket if enabled
    if (process.env.ENABLE_WEBSOCKET === 'true') {
      realtimeManager.initializeWebSocket(httpServer);
      logInfo('WebSocket server initialized');
    }

    // Initialize SSE if enabled
    if (process.env.ENABLE_SSE === 'true') {
      realtimeManager.initializeSSE(app);
      logInfo('SSE endpoints initialized');
    }

    // Initialize API integrations
    const apiStatus = await apiIntegrationManager.initialize();
    logInfo('API integrations initialized', apiStatus);

    // Start server
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('========================================');
      console.log('Sentia Manufacturing Dashboard - Render Edition');
      console.log('========================================');
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API health: http://localhost:${PORT}/api/health`);
      console.log('========================================');

      logInfo('Sentia server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
      });
    });

    // Register shutdown handlers for clean database closure
    processManager.addShutdownHandler('database', async () => {
      if (global.prisma) {
        await global.prisma.$disconnect();
        logInfo('Database connections closed');
      }
    });

    // Register shutdown handler for realtime connections
    processManager.addShutdownHandler('realtime', async () => {
      realtimeManager.shutdown();
      logInfo('Realtime connections closed');
    });

  } catch (error) {
    logError('Failed to start Sentia Server', {
      error: error.message,
      stack: error.stack,
      port: PORT
    });

    // Attempt graceful shutdown
    await processManager.gracefulShutdown('startup_failure');
  }
})();

export default app;