import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import { createClerkClient } from '@clerk/backend';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import UnleashedService from './services/unleashedService.js';
import logger, { logInfo, logError, logWarn } from './services/logger.js';
import { metricsMiddleware, getMetrics, recordUnleashedApiRequest } from './services/metrics.js';
// Import data import services conditionally to prevent startup crashes
let dbService = null;
let queueService = null;

// Function to load data import services
async function loadDataImportServices() {
  try {
    dbService = (await import('./src/services/db/index.js')).default;
    logInfo('Database service loaded successfully');
  } catch (error) {
    logWarn('Database service not available - data import features disabled', error);
  }

  try {
    queueService = (await import('./src/services/queueService.js')).default;
    logInfo('Queue service loaded successfully');
  } catch (error) {
    logWarn('Queue service not available - using synchronous processing', error);
  }
}

// Load working capital service
let workingCapitalService = null;
async function loadWorkingCapitalService() {
  try {
    const WorkingCapitalService = (await import('./src/services/finance/workingCapital.js')).default;
    workingCapitalService = new WorkingCapitalService();
    logInfo('Working Capital service loaded successfully');
  } catch (error) {
    logWarn('Working Capital service not available', error);
  }
}
const { Pool } = pkg;

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Railway proxy - required for proper rate limiting and security
app.set('trust proxy', 1);

// Initialize Clerk client
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const VITE_CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
let clerkClient = null;

if (!CLERK_SECRET_KEY) {
  logWarn('CLERK_SECRET_KEY environment variable not found - authentication features will be disabled');
  console.log('WARNING: CLERK_SECRET_KEY missing - authentication disabled');
  console.log('To fix: Set CLERK_SECRET_KEY in Railway environment variables');
} else {
  try {
    clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
    logInfo('Clerk client initialized successfully');
  } catch (error) {
    logError('Failed to initialize Clerk client', error);
    console.log('ERROR: Failed to initialize Clerk - authentication disabled');
  }
}

if (!VITE_CLERK_PUBLISHABLE_KEY) {
  logWarn('VITE_CLERK_PUBLISHABLE_KEY environment variable not found - frontend authentication will be disabled');
  console.log('WARNING: VITE_CLERK_PUBLISHABLE_KEY missing - frontend may show blank screen');
  console.log('To fix: Set VITE_CLERK_PUBLISHABLE_KEY in Railway environment variables');
}

// Database connection pool for Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DEV_DATABASE_URL,
  ssl: process.env.DATABASE_URL ? {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_SSL_CA || undefined
  } : false
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.unleashedsoftware.com"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV, XLSX, and JSON files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Metrics middleware
app.use(metricsMiddleware);

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logWarn('Validation failed', { errors: errors.array(), path: req.path });
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Serve static files from React build FIRST
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  logInfo('Health check requested');
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Diagnostic endpoint for deployment troubleshooting
app.get('/diagnostics', (req, res) => {
  const diagnostics = {
    server: {
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development'
    },
    environment: {
      clerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      clerkPublishableKey: !!process.env.VITE_CLERK_PUBLISHABLE_KEY,
      databaseUrl: !!process.env.DATABASE_URL,
      unleashedApiId: !!process.env.UNLEASHED_API_ID,
      unleashedApiKey: !!process.env.UNLEASHED_API_KEY,
      corsOrigins: process.env.CORS_ORIGINS || 'not set',
      port: process.env.PORT || 5000
    },
    services: {
      clerk: !!clerkClient,
      unleashed: !!unleashedService,
      workingCapital: !!workingCapitalService,
      dataImport: !!dbService,
      queue: !!queueService
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(diagnostics);
});

// Metrics endpoint for monitoring
app.get('/metrics', getMetrics);

// Middleware to verify authentication and admin status
const requireAuth = async (req, res, next) => {
  // If Clerk is not available, skip authentication in production
  if (!clerkClient) {
    logWarn('Authentication skipped - Clerk client not available');
    req.user = { id: 'anonymous', emailAddresses: [{ emailAddress: 'anonymous@localhost' }] };
    return next();
  }
  
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = await clerkClient.verifyToken(token);
    const user = await clerkClient.users.getUser(payload.sub);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.publicMetadata?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// RBAC middleware for working capital functionality
const requireFinancialAccess = (req, res, next) => {
  const userRole = req.user?.publicMetadata?.role;
  const allowedRoles = ['admin', 'cfo', 'financial_manager', 'financial_analyst'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ 
      error: 'Financial access required',
      requiredRoles: allowedRoles,
      userRole: userRole || 'unknown'
    });
  }
  next();
};

const requireFinancialManagement = (req, res, next) => {
  const userRole = req.user?.publicMetadata?.role;
  const allowedRoles = ['admin', 'cfo', 'financial_manager'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ 
      error: 'Financial management access required',
      requiredRoles: allowedRoles,
      userRole: userRole || 'unknown'
    });
  }
  next();
};

const requireExecutiveAccess = (req, res, next) => {
  const userRole = req.user?.publicMetadata?.role;
  const allowedRoles = ['admin', 'ceo', 'cfo'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ 
      error: 'Executive access required',
      requiredRoles: allowedRoles,
      userRole: userRole || 'unknown'
    });
  }
  next();
};

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', environment: process.env.NODE_ENV });
});

// Protected API route example (Clerk authentication enabled)
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ 
    message: 'This is a protected route - authentication required',
    userId: req.user.id,
    email: req.user.emailAddresses?.[0]?.emailAddress
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL && !process.env.DEV_DATABASE_URL) {
      return res.json({ 
        success: false, 
        error: 'No database configured',
        details: 'DATABASE_URL or DEV_DATABASE_URL environment variable not set',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      timestamp: result.rows[0].now,
      database: process.env.DATABASE_URL ? 'Connected to Neon PostgreSQL' : 'Connected to local PostgreSQL'
    });
  } catch (error) {
    logError('Database connection error', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Jobs API endpoints
app.get('/api/jobs', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL && !process.env.DEV_DATABASE_URL) {
      return res.json({ success: true, jobs: [] });
    }
    
    const result = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 20');
    res.json({ success: true, jobs: result.rows });
  } catch (error) {
    logError('Jobs API error', error);
    res.json({ success: true, jobs: [] });
  }
});

app.post('/api/jobs', [
  body('name').isString().isLength({ min: 1, max: 255 }).trim(),
  body('description').optional().isString().isLength({ max: 1000 }).trim(),
  body('quantity').isInt({ min: 1, max: 1000000 }),
  body('due_date').optional().isISO8601().toDate(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, description, quantity, due_date } = req.body;
    const result = await pool.query(
      'INSERT INTO jobs (name, description, quantity, due_date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, quantity, due_date, 'test-user']
    );
    logInfo('Job created successfully', { jobId: result.rows[0].id, name });
    res.json({ success: true, job: result.rows[0] });
  } catch (error) {
    logError('Failed to create job', error);
    res.status(500).json({ success: false, error: 'Failed to create job' });
  }
});

// Resources API endpoints
app.get('/api/resources', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL && !process.env.DEV_DATABASE_URL) {
      return res.json({ success: true, resources: [] });
    }
    
    const result = await pool.query('SELECT * FROM resources ORDER BY name');
    res.json({ success: true, resources: result.rows });
  } catch (error) {
    logError('Resources API error', error);
    res.json({ success: true, resources: [] });
  }
});

// Schedules API endpoints
app.get('/api/schedules', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, j.name as job_name, r.name as resource_name 
      FROM schedules s
      JOIN jobs j ON s.job_id = j.id
      JOIN resources r ON s.resource_id = r.id
      ORDER BY s.start_time DESC
      LIMIT 50
    `);
    res.json({ success: true, schedules: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin RBAC middleware
const requireAdminAccess = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRole = req.user.publicMetadata?.role || 'viewer';
    const userPermissions = req.user.publicMetadata?.permissions || [];
    
    // Admin role has all permissions
    if (userRole === 'admin') {
      return next();
    }
    
    // Check if user has specific permission
    if (permission && !userPermissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userRole,
        userPermissions
      });
    }
    
    next();
  };
};

// Admin API endpoints
app.get('/api/admin/users', requireAuth, requireAdminAccess('manage_users'), async (req, res) => {
  try {
    if (!clerkClient) {
      return res.json({ success: true, users: [], message: 'Clerk client not available - no users to display' });
    }
    
    const userList = await clerkClient.users.getUserList({
      limit: 100,
      orderBy: '-created_at'
    });
    res.json({ success: true, users: userList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// System Health Dashboard
app.get('/api/admin/health', requireAuth, requireAdminAccess('view_system_health'), async (req, res) => {
  try {
    const healthData = {
      server: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      },
      database: {
        status: 'unknown',
        connected: false
      },
      services: {
        clerk: !!clerkClient,
        unleashed: !!unleashedService,
        workingCapital: !!workingCapitalService,
        dataImport: !!dbService,
        queue: !!queueService
      }
    };

    // Test database connection
    try {
      const dbResult = await pool.query('SELECT NOW()');
      healthData.database = {
        status: 'healthy',
        connected: true,
        timestamp: dbResult.rows[0].now
      };
    } catch (error) {
      healthData.database = {
        status: 'error',
        connected: false,
        error: error.message
      };
    }

    res.json({ success: true, health: healthData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// System Settings Management
app.get('/api/admin/settings', requireAuth, requireAdminAccess('manage_system_settings'), async (req, res) => {
  try {
    const settings = {
      system: {
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
      },
      database: {
        url: process.env.DATABASE_URL ? '[CONFIGURED]' : '[NOT SET]',
        ssl: process.env.DATABASE_URL ? true : false
      },
      clerk: {
        configured: !!process.env.CLERK_SECRET_KEY
      },
      unleashed: {
        configured: !!(process.env.UNLEASHED_API_ID && process.env.UNLEASHED_API_KEY)
      }
    };

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Feature Flags Management
app.get('/api/admin/feature-flags', requireAuth, requireAdminAccess('manage_feature_flags'), async (req, res) => {
  try {
    // Mock feature flags - replace with real implementation
    const featureFlags = [
      {
        id: 1,
        name: 'working_capital_module',
        description: 'Enable Working Capital Management module',
        enabled: !!workingCapitalService,
        environment: 'all'
      },
      {
        id: 2,
        name: 'data_import_module',
        description: 'Enable Data Import functionality',
        enabled: !!dbService,
        environment: 'all'
      },
      {
        id: 3,
        name: 'unleashed_integration',
        description: 'Enable Unleashed API integration',
        enabled: !!unleashedService,
        environment: 'all'
      },
      {
        id: 4,
        name: 'queue_processing',
        description: 'Enable background queue processing',
        enabled: !!queueService,
        environment: 'all'
      }
    ];

    res.json({ success: true, featureFlags });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/feature-flags/:flagId/toggle', requireAuth, requireAdminAccess('manage_feature_flags'), async (req, res) => {
  try {
    const { flagId } = req.params;
    const { enabled } = req.body;
    
    // Mock implementation - replace with real feature flag storage
    res.json({ 
      success: true, 
      message: `Feature flag ${flagId} ${enabled ? 'enabled' : 'disabled'}`,
      flagId: parseInt(flagId),
      enabled
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Integrations Management
app.get('/api/admin/integrations', requireAuth, requireAdminAccess('manage_integrations'), async (req, res) => {
  try {
    const integrations = [
      {
        id: 1,
        name: 'Unleashed Software',
        type: 'inventory',
        status: unleashedService ? 'connected' : 'disconnected',
        lastSync: new Date(),
        config: {
          baseUrl: 'https://api.unleashedsoftware.com',
          configured: !!(process.env.UNLEASHED_API_ID && process.env.UNLEASHED_API_KEY)
        }
      },
      {
        id: 2,
        name: 'Clerk Authentication',
        type: 'auth',
        status: clerkClient ? 'connected' : 'disconnected',
        lastSync: new Date(),
        config: {
          configured: !!process.env.CLERK_SECRET_KEY
        }
      }
    ];

    res.json({ success: true, integrations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/integrations/:integrationId/test', requireAuth, requireAdminAccess('manage_integrations'), async (req, res) => {
  try {
    const { integrationId } = req.params;
    
    if (integrationId === '1' && unleashedService) {
      // Test Unleashed connection
      const testResult = await unleashedService.testConnection();
      return res.json({ success: true, testResult });
    }
    
    if (integrationId === '2' && clerkClient) {
      // Test Clerk connection
      try {
        await clerkClient.users.getUserList({ limit: 1 });
        return res.json({ success: true, testResult: { status: 'connected', message: 'Clerk API accessible' } });
      } catch (error) {
        return res.json({ success: false, testResult: { status: 'error', message: error.message } });
      }
    }
    
    res.json({ success: false, error: 'Integration not found or not configured' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logs and Error Explorer
app.get('/api/admin/logs', requireAuth, requireAdminAccess('view_logs'), async (req, res) => {
  try {
    const { level = 'all', limit = 100, offset = 0 } = req.query;
    
    // Mock implementation - replace with real log storage
    const logs = [
      {
        id: 1,
        timestamp: new Date(),
        level: 'info',
        message: 'Server started successfully',
        service: 'server',
        metadata: { port: process.env.PORT || 5000 }
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 5000),
        level: 'warn',
        message: 'Database connection slow',
        service: 'database',
        metadata: { responseTime: 1200 }
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 10000),
        level: 'error',
        message: 'Failed to connect to external service',
        service: 'integrations',
        metadata: { service: 'unleashed', attempts: 3 }
      }
    ];

    res.json({ 
      success: true, 
      logs: logs.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
      total: logs.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Maintenance Tools
app.get('/api/admin/maintenance/status', requireAuth, requireAdminAccess('manage_maintenance'), async (req, res) => {
  try {
    const maintenanceStatus = {
      database: {
        size: 'calculating...',
        lastBackup: null,
        maintenanceMode: false
      },
      cache: {
        enabled: false,
        size: 0
      },
      cleanup: {
        lastRun: null,
        nextScheduled: null
      }
    };

    res.json({ success: true, maintenance: maintenanceStatus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/maintenance/database/backup', requireAuth, requireAdminAccess('manage_maintenance'), async (req, res) => {
  try {
    // Mock backup operation - replace with real implementation
    const backupId = `backup_${Date.now()}`;
    
    res.json({ 
      success: true, 
      message: 'Database backup initiated',
      backupId,
      status: 'in_progress'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/maintenance/cleanup', requireAuth, requireAdminAccess('manage_maintenance'), async (req, res) => {
  try {
    // Mock cleanup operation - replace with real implementation
    const cleanupResults = {
      tempFiles: 0,
      oldLogs: 0,
      expiredSessions: 0
    };
    
    res.json({ 
      success: true, 
      message: 'System cleanup completed',
      results: cleanupResults
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/invitations', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Get invitations from database
    const result = await pool.query(`
      SELECT i.*, u.email_addresses->0->>'email_address' as invited_by_email
      FROM invitations i
      LEFT JOIN users u ON i.invited_by = u.clerk_id
      ORDER BY i.created_at DESC
    `);
    res.json({ success: true, invitations: result.rows });
  } catch (error) {
    // If invitations table doesn't exist yet, return empty array
    res.json({ success: true, invitations: [] });
  }
});

app.post('/api/admin/invite', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, role } = req.body;
    
    // Create invitation record (you'll need to create invitations table)
    try {
      await pool.query(`
        INSERT INTO invitations (email, role, invited_by, status, created_at)
        VALUES ($1, $2, $3, 'sent', NOW())
      `, [email, role, req.user.id]);
    } catch (dbError) {
      // If table doesn't exist, create it first
      await pool.query(`
        CREATE TABLE IF NOT EXISTS invitations (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          invited_by VARCHAR(255),
          status VARCHAR(50) DEFAULT 'sent',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query(`
        INSERT INTO invitations (email, role, invited_by, status, created_at)
        VALUES ($1, $2, $3, 'sent', NOW())
      `, [email, role, req.user.id]);
    }
    
    // Here you could integrate with an email service to send the actual invitation
    res.json({ success: true, message: 'Invitation sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/users/:userId/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!clerkClient) {
      return res.json({ success: false, error: 'Clerk client not available - cannot approve users' });
    }
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        approved: true,
        role: 'user'
      }
    });
    
    res.json({ success: true, message: 'User approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/users/:userId/revoke', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!clerkClient) {
      return res.json({ success: false, error: 'Clerk client not available - cannot revoke users' });
    }
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        approved: false,
        role: 'user'
      }
    });
    
    res.json({ success: true, message: 'User access revoked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/invitations/:invitationId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    await pool.query('DELETE FROM invitations WHERE id = $1', [invitationId]);
    
    res.json({ success: true, message: 'Invitation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unleashed API endpoints
let unleashedService;
try {
  unleashedService = new UnleashedService();
  logInfo('Unleashed API service initialized successfully');
} catch (error) {
  logError('Failed to initialize Unleashed API service', error);
  console.log('WARNING: Unleashed API service not available - check UNLEASHED_API_ID and UNLEASHED_API_KEY environment variables');
  unleashedService = null;
}

app.get('/api/unleashed/test', async (req, res) => {
  if (!unleashedService) {
    return res.status(503).json({ 
      success: false, 
      error: 'Unleashed API service not available - check configuration' 
    });
  }
  
  const startTime = Date.now();
  try {
    logInfo('Testing Unleashed API connection');
    const result = await unleashedService.testConnection();
    const duration = Date.now() - startTime;
    
    recordUnleashedApiRequest('test', result.success ? 'success' : 'failure', duration);
    logInfo(`Unleashed API test completed in ${duration}ms`, { success: result.success });
    
    res.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    recordUnleashedApiRequest('test', 'error', duration);
    logError('Unleashed API test failed', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    
    const data = await unleashedService.getProducts(page, pageSize);
    res.json({
      success: true,
      data: data.Items || [],
      total: data.Total || 0,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/products/:productGuid', async (req, res) => {
  try {
    const data = await unleashedService.getProduct(req.params.productGuid);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/stock', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    
    const data = await unleashedService.getStockOnHand(page, pageSize);
    res.json({
      success: true,
      data: data.Items || [],
      total: data.Total || 0,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/sales-orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const orderStatus = req.query.status || null;
    
    const data = await unleashedService.getSalesOrders(page, pageSize, orderStatus);
    res.json({
      success: true,
      data: data.Items || [],
      total: data.Total || 0,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/sales-orders/:orderGuid', async (req, res) => {
  try {
    const data = await unleashedService.getSalesOrder(req.params.orderGuid);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/purchase-orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    
    const data = await unleashedService.getPurchaseOrders(page, pageSize);
    res.json({
      success: true,
      data: data.Items || [],
      total: data.Total || 0,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    
    const data = await unleashedService.getCustomers(page, pageSize);
    res.json({
      success: true,
      data: data.Items || [],
      total: data.Total || 0,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/suppliers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    
    const data = await unleashedService.getSuppliers(page, pageSize);
    res.json({
      success: true,
      data: data.Items || [],
      total: data.Total || 0,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/warehouses', async (req, res) => {
  try {
    const data = await unleashedService.getWarehouses();
    res.json({
      success: true,
      data: data.Items || [],
      total: data.Items?.length || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/bill-of-materials', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    
    const data = await unleashedService.getBillOfMaterials(page, pageSize);
    res.json({
      success: true,
      data: data.Items || [],
      total: data.Total || 0,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/unleashed/stock-adjustments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    
    const data = await unleashedService.getStockAdjustments(page, pageSize);
    res.json({
      success: true,
      data: data.Items || [],
      total: data.Total || 0,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Working Capital API Endpoints

// Working Capital Projections
app.post('/api/working-capital/projections', requireAuth, requireFinancialAccess, [
  body('horizonMonths').optional().isInt({ min: 1, max: 24 }).withMessage('Horizon must be between 1-24 months'),
  body('currency').optional().isIn(['GBP', 'EUR', 'USD']).withMessage('Invalid currency'),
  body('scenarios').optional().isArray().withMessage('Scenarios must be an array'),
  handleValidationErrors
], async (req, res) => {
  try {
    if (!workingCapitalService) {
      return res.status(503).json({
        success: false,
        error: 'Working Capital service not available'
      });
    }

    const {
      horizonMonths = 12,
      startMonth = new Date(),
      currency = 'GBP',
      scenarios = ['baseline']
    } = req.body;

    logInfo('Working capital projection requested', { 
      userId: req.user.id,
      horizonMonths, 
      scenarios: scenarios.length 
    });

    const projectionParams = {
      horizonMonths,
      startMonth: new Date(startMonth),
      currency,
      scenarios
    };

    const results = await workingCapitalService.project(projectionParams);
    
    res.json({
      success: true,
      data: results,
      generatedAt: new Date(),
      requestId: results.runId
    });
  } catch (error) {
    logError('Working capital projection failed', error);
    res.status(500).json({
      success: false,
      error: 'Projection calculation failed',
      details: error.message
    });
  }
});

// Scenario Analysis
app.post('/api/working-capital/scenarios', requireAuth, requireFinancialAccess, [
  body('baselineParams').notEmpty().withMessage('Baseline parameters required'),
  body('overrides').optional().isArray().withMessage('Overrides must be an array'),
  handleValidationErrors
], async (req, res) => {
  try {
    if (!workingCapitalService) {
      return res.status(503).json({
        success: false,
        error: 'Working Capital service not available'
      });
    }

    const { baselineParams, overrides = [] } = req.body;

    logInfo('Scenario analysis requested', { 
      userId: req.user.id,
      scenarios: overrides.length + 1 // baseline + overrides
    });

    const results = await workingCapitalService.scenarios(baselineParams, overrides);
    
    res.json({
      success: true,
      data: results,
      generatedAt: new Date()
    });
  } catch (error) {
    logError('Scenario analysis failed', error);
    res.status(500).json({
      success: false,
      error: 'Scenario analysis failed',
      details: error.message
    });
  }
});

// Policy Optimization
app.post('/api/working-capital/optimize', requireAuth, requireFinancialManagement, [
  body('baseline').notEmpty().withMessage('Baseline scenario required'),
  handleValidationErrors
], async (req, res) => {
  try {
    if (!workingCapitalService) {
      return res.status(503).json({
        success: false,
        error: 'Working Capital service not available'
      });
    }

    const { baseline } = req.body;

    logInfo('Policy optimization requested', { 
      userId: req.user.id 
    });

    const optimizationResults = await workingCapitalService.optimizePolicies(baseline);
    
    res.json({
      success: true,
      data: optimizationResults,
      generatedAt: new Date()
    });
  } catch (error) {
    logError('Policy optimization failed', error);
    res.status(500).json({
      success: false,
      error: 'Policy optimization failed',
      details: error.message
    });
  }
});

// System Diagnostics
app.get('/api/working-capital/diagnostics', requireAuth, requireFinancialManagement, async (req, res) => {
  try {
    if (!workingCapitalService) {
      return res.status(503).json({
        success: false,
        error: 'Working Capital service not available'
      });
    }

    logInfo('System diagnostics requested', { 
      userId: req.user.id 
    });

    const diagnostics = await workingCapitalService.diagnostics();
    
    res.json({
      success: true,
      data: diagnostics,
      generatedAt: new Date()
    });
  } catch (error) {
    logError('System diagnostics failed', error);
    res.status(500).json({
      success: false,
      error: 'System diagnostics failed',
      details: error.message
    });
  }
});

// Get Historical Projections (Read-only)
app.get('/api/working-capital/projections/history', requireAuth, requireFinancialAccess, async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Database service not available'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
    const offset = (page - 1) * pageSize;
    
    await dbService.initialize();
    const prisma = dbService.getClient();
    
    const [projections, totalCount] = await Promise.all([
      prisma.wCProjection.findMany({
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: pageSize,
        select: {
          id: true,
          run_id: true,
          month: true,
          cash_in: true,
          cash_out: true,
          net_change: true,
          ending_cash: true,
          scenario: true,
          currency_code: true,
          createdAt: true
        }
      }),
      prisma.wCProjection.count()
    ]);
    
    logInfo('Historical projections retrieved', { 
      userId: req.user.id,
      count: projections.length 
    });
    
    res.json({
      success: true,
      data: {
        projections,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      }
    });
  } catch (error) {
    logError('Failed to retrieve historical projections', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve historical data',
      details: error.message
    });
  }
});

// Get KPI Trends
app.get('/api/working-capital/kpis/trends', requireAuth, requireFinancialAccess, async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Database service not available'
      });
    }

    const months = parseInt(req.query.months) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    await dbService.initialize();
    const prisma = dbService.getClient();
    
    const kpis = await prisma.wCKPIs.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        dso: true,
        dpo: true,
        dio: true,
        ccc: true,
        inv_turnover: true,
        wc_turnover: true,
        min_cash: true,
        facility_utilization: true,
        createdAt: true,
        scenario: true
      }
    });
    
    logInfo('KPI trends retrieved', { 
      userId: req.user.id,
      months,
      dataPoints: kpis.length 
    });
    
    res.json({
      success: true,
      data: {
        trends: kpis,
        summary: {
          dateRange: { start: startDate, end: new Date() },
          dataPoints: kpis.length,
          scenarios: [...new Set(kpis.map(k => k.scenario))]
        }
      }
    });
  } catch (error) {
    logError('Failed to retrieve KPI trends', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve KPI trends',
      details: error.message
    });
  }
});

// AR/AP Policy Management
app.get('/api/working-capital/policies/ar', requireAuth, requireFinancialAccess, async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Database service not available'
      });
    }

    await dbService.initialize();
    const prisma = dbService.getClient();
    
    const policies = await prisma.aRPolicy.findMany({
      where: {
        OR: [
          { active_to: null },
          { active_to: { gte: new Date() } }
        ]
      },
      include: {
        sales_channel: {
          select: {
            name: true,
            channelType: true,
            marketCode: true
          }
        }
      },
      orderBy: { active_from: 'desc' }
    });
    
    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    logError('Failed to retrieve AR policies', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve AR policies',
      details: error.message
    });
  }
});

app.get('/api/working-capital/policies/ap', requireAuth, requireFinancialAccess, async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Database service not available'
      });
    }

    await dbService.initialize();
    const prisma = dbService.getClient();
    
    const policies = await prisma.aPPolicy.findMany({
      where: {
        OR: [
          { active_to: null },
          { active_to: { gte: new Date() } }
        ]
      },
      orderBy: { active_from: 'desc' }
    });
    
    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    logError('Failed to retrieve AP policies', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve AP policies',
      details: error.message
    });
  }
});

// Update AR Policy (Financial Management required)
app.post('/api/working-capital/policies/ar', requireAuth, requireFinancialManagement, [
  body('channel_id').isUUID().withMessage('Valid channel ID required'),
  body('terms').isArray().withMessage('Terms must be an array'),
  body('bad_debt_pct').isFloat({ min: 0, max: 1 }).withMessage('Bad debt percentage must be between 0-1'),
  body('fees_pct').isFloat({ min: 0, max: 1 }).withMessage('Fees percentage must be between 0-1'),
  handleValidationErrors
], async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Database service not available'
      });
    }

    const { channel_id, terms, bad_debt_pct, fees_pct, description } = req.body;
    
    await dbService.initialize();
    const prisma = dbService.getClient();
    
    // Close existing active policy
    await prisma.aRPolicy.updateMany({
      where: {
        channel_id: channel_id,
        active_to: null
      },
      data: {
        active_to: new Date()
      }
    });
    
    // Create new policy
    const newPolicy = await prisma.aRPolicy.create({
      data: {
        channel_id,
        terms: JSON.stringify(terms),
        bad_debt_pct: parseFloat(bad_debt_pct),
        fees_pct: parseFloat(fees_pct),
        description: description || '',
        active_from: new Date(),
        created_by: req.user.id
      },
      include: {
        sales_channel: {
          select: {
            name: true,
            channelType: true
          }
        }
      }
    });
    
    logInfo('AR policy updated', { 
      userId: req.user.id,
      channelId: channel_id,
      policyId: newPolicy.id
    });
    
    res.json({
      success: true,
      data: newPolicy,
      message: 'AR policy updated successfully'
    });
  } catch (error) {
    logError('Failed to update AR policy', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update AR policy',
      details: error.message
    });
  }
});

// Data Import API Endpoints

// File upload endpoint
app.post('/api/import/upload', upload.single('file'), async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Data import service not available'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { dataType, mappingConfig } = req.body;
    
    logInfo('File upload received', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      dataType
    });

    // Create import job record
    await dbService.initialize();
    const prisma = dbService.getClient();
    
    const importJob = await prisma.import_job.create({
      data: {
        filename: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        data_type: dataType,
        status: 'uploaded',
        mapping_config: mappingConfig ? JSON.parse(mappingConfig) : null,
        uploaded_at: new Date(),
        total_rows: 0,
        processed_rows: 0,
        error_rows: 0,
        warnings: []
      }
    });

    res.json({
      success: true,
      importJobId: importJob.id,
      filename: req.file.originalname,
      fileSize: req.file.size,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    logError('File upload failed', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed',
      details: error.message
    });
  }
});

// Preview uploaded file data
app.get('/api/import/preview/:importJobId', async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Data import service not available'
      });
    }

    const { importJobId } = req.params;
    const rowLimit = parseInt(req.query.limit) || 10;
    
    await dbService.initialize();
    const prisma = dbService.getClient();
    
    const importJob = await prisma.import_job.findUnique({
      where: { id: parseInt(importJobId) }
    });
    
    if (!importJob) {
      return res.status(404).json({
        success: false,
        error: 'Import job not found'
      });
    }
    
    const filePath = importJob.file_path;
    let previewData = [];
    let headers = [];
    
    try {
      if (importJob.file_type.includes('csv') || importJob.file_type.includes('text')) {
        // Parse CSV
        const results = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (headersList) => {
              headers = headersList;
            })
            .on('data', (data) => {
              if (results.length < rowLimit) {
                results.push(data);
              }
            })
            .on('end', resolve)
            .on('error', reject);
        });
        previewData = results;
      } else if (importJob.file_type.includes('excel') || importJob.file_type.includes('spreadsheet')) {
        // Parse Excel
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          headers = jsonData[0];
          previewData = jsonData.slice(1, rowLimit + 1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
        }
      } else if (importJob.file_type.includes('json')) {
        // Parse JSON
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          headers = Object.keys(jsonData[0]);
          previewData = jsonData.slice(0, rowLimit);
        }
      }
      
      res.json({
        success: true,
        headers,
        preview: previewData,
        totalRows: previewData.length,
        importJobId: parseInt(importJobId),
        filename: importJob.filename
      });
    } catch (parseError) {
      logError('File parsing failed', parseError);
      res.status(500).json({
        success: false,
        error: 'Failed to parse file',
        details: parseError.message
      });
    }
  } catch (error) {
    logError('Preview generation failed', error);
    res.status(500).json({
      success: false,
      error: 'Preview generation failed',
      details: error.message
    });
  }
});

// Start data processing/validation
app.post('/api/import/process/:importJobId', async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Data import service not available'
      });
    }

    const { importJobId } = req.params;
    const { mappingConfig, validationRules } = req.body;
    
    await dbService.initialize();
    const prisma = dbService.getClient();
    
    // Update import job with processing configuration
    await prisma.import_job.update({
      where: { id: parseInt(importJobId) },
      data: {
        mapping_config: mappingConfig,
        validation_rules: validationRules
      }
    });
    
    if (!queueService) {
      return res.status(503).json({
        success: false,
        error: 'Queue service not available'
      });
    }
    
    // Initialize queue service if not already done
    await queueService.initialize();
    
    // Add import job to processing queue
    const queueResult = await queueService.addImportJob(parseInt(importJobId), {
      mappingConfig,
      validationRules
    });
    
    logInfo('Import processing queued', { importJobId, queueJobId: queueResult.jobId });
    
    res.json({
      success: true,
      message: 'Import processing started',
      importJobId: parseInt(importJobId),
      queueJobId: queueResult.jobId,
      status: 'queued'
    });
  } catch (error) {
    logError('Import processing failed to start', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start import processing',
      details: error.message
    });
  }
});

// Start validation process
app.post('/api/import/validate/:importJobId', async (req, res) => {
  try {
    const { importJobId } = req.params;
    const { validationConfig } = req.body;
    
    if (!queueService) {
      return res.status(503).json({
        success: false,
        error: 'Queue service not available'
      });
    }
    
    // Initialize queue service if not already done
    await queueService.initialize();
    
    // Add validation job to queue
    const queueResult = await queueService.addValidationJob(parseInt(importJobId), validationConfig);
    
    logInfo('Validation processing queued', { importJobId, queueJobId: queueResult.jobId });
    
    res.json({
      success: true,
      message: 'Validation processing started',
      importJobId: parseInt(importJobId),
      queueJobId: queueResult.jobId,
      status: 'queued'
    });
  } catch (error) {
    logError('Validation processing failed to start', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start validation processing',
      details: error.message
    });
  }
});

// Preview validation (sample validation)
app.post('/api/import/validate-preview', async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Data import service not available'
      });
    }

    const { importJobId, validationRules, customRules, sampleSize = 10 } = req.body;
    
    await dbService.initialize();
    const prisma = dbService.getClient();
    
    // Get sample validation results
    const validationResults = await prisma.validation_result.findMany({
      where: { import_job_id: importJobId },
      take: sampleSize,
      orderBy: { row_number: 'asc' }
    });
    
    if (validationResults.length === 0) {
      return res.json({
        success: false,
        error: 'No data available for preview validation'
      });
    }
    
    // Run validation on sample data
    const ValidationEngine = (await import('./src/services/validationEngine.js')).default;
    const validationEngine = new ValidationEngine();
    
    const importJob = await prisma.import_job.findUnique({
      where: { id: importJobId }
    });
    
    let validRows = 0;
    let errorRows = 0;
    let warningRows = 0;
    const errors = [];
    const warnings = [];
    
    for (const result of validationResults) {
      const validation = await validationEngine.validateRow(
        result.original_data,
        importJob.data_type,
        result.row_number
      );
      
      if (validation.isValid) {
        validRows++;
      } else {
        errorRows++;
        errors.push(...validation.errors);
      }
      
      if (validation.warnings.length > 0) {
        warningRows++;
        warnings.push(...validation.warnings);
      }
    }
    
    res.json({
      success: true,
      results: {
        totalRows: validationResults.length,
        validRows,
        errorRows,
        warningRows,
        summary: {
          errors: errors.slice(0, 20), // Limit for preview
          warnings: warnings.slice(0, 20)
        }
      }
    });
  } catch (error) {
    logError('Validation preview failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run validation preview',
      details: error.message
    });
  }
});

// Get queue statistics
app.get('/api/queue/stats', async (req, res) => {
  try {
    if (!queueService) {
      return res.json({
        success: true,
        stats: {
          available: false,
          message: 'Queue service not available'
        }
      });
    }
    
    const stats = await queueService.getQueueStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logError('Failed to get queue stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics',
      details: error.message
    });
  }
});

// Get import job status
app.get('/api/import/status/:importJobId', async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Data import service not available'
      });
    }

    const { importJobId } = req.params;
    
    await dbService.initialize();
    const prisma = dbService.getClient();
    
    const importJob = await prisma.import_job.findUnique({
      where: { id: parseInt(importJobId) }
    });
    
    if (!importJob) {
      return res.status(404).json({
        success: false,
        error: 'Import job not found'
      });
    }
    
    res.json({
      success: true,
      importJob: {
        id: importJob.id,
        filename: importJob.filename,
        status: importJob.status,
        dataType: importJob.data_type,
        totalRows: importJob.total_rows,
        processedRows: importJob.processed_rows,
        errorRows: importJob.error_rows,
        warnings: importJob.warnings,
        uploadedAt: importJob.uploaded_at,
        processedAt: importJob.processed_at,
        completedAt: importJob.completed_at
      }
    });
  } catch (error) {
    logError('Failed to get import status', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get import status',
      details: error.message
    });
  }
});

// Get import jobs list
app.get('/api/import/jobs', async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Data import service not available'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    
    await dbService.initialize();
    const prisma = dbService.getClient();
    
    const [jobs, totalCount] = await Promise.all([
      prisma.import_job.findMany({
        orderBy: { uploaded_at: 'desc' },
        skip: offset,
        take: pageSize
      }),
      prisma.import_job.count()
    ]);
    
    res.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        filename: job.filename,
        status: job.status,
        dataType: job.data_type,
        fileSize: job.file_size,
        totalRows: job.total_rows,
        processedRows: job.processed_rows,
        errorRows: job.error_rows,
        uploadedAt: job.uploaded_at,
        completedAt: job.completed_at
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error) {
    logError('Failed to get import jobs', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get import jobs',
      details: error.message
    });
  }
});

// Get validation results for import job
app.get('/api/import/results/:importJobId', async (req, res) => {
  try {
    if (!dbService) {
      return res.status(503).json({
        success: false,
        error: 'Data import service not available'
      });
    }

    const { importJobId } = req.params;
    
    await dbService.initialize();
    const prisma = dbService.getClient();
    
    const [importJob, validationResults] = await Promise.all([
      prisma.import_job.findUnique({
        where: { id: parseInt(importJobId) }
      }),
      prisma.validation_result.findMany({
        where: { import_job_id: parseInt(importJobId) },
        orderBy: { row_number: 'asc' }
      })
    ]);
    
    if (!importJob) {
      return res.status(404).json({
        success: false,
        error: 'Import job not found'
      });
    }
    
    res.json({
      success: true,
      importJob: {
        id: importJob.id,
        filename: importJob.filename,
        status: importJob.status,
        totalRows: importJob.total_rows,
        processedRows: importJob.processed_rows,
        errorRows: importJob.error_rows
      },
      validationResults: validationResults.map(result => ({
        id: result.id,
        rowNumber: result.row_number,
        status: result.status,
        errors: result.errors,
        warnings: result.warnings,
        originalData: result.original_data,
        processedData: result.processed_data
      }))
    });
  } catch (error) {
    logError('Failed to get validation results', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get validation results',
      details: error.message
    });
  }
});

// Catch-all route for React Router (must be LAST after all API routes)
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, _next) => {
  logError('Unhandled server error', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Load and initialize services
Promise.all([
  loadDataImportServices(),
  loadWorkingCapitalService()
]).then(async () => {
  // Initialize queue service on startup if available
  if (queueService) {
    queueService.initialize().catch(error => {
      logWarn('Queue service initialization failed - continuing without queues', error);
    });
  }
  
  // Initialize working capital service
  if (workingCapitalService) {
    workingCapitalService.initialize().catch(error => {
      logWarn('Working Capital service initialization failed', error);
    });
  }
}).catch(error => {
  logWarn('Failed to load services', error);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logInfo('SIGTERM received, shutting down gracefully...');
  if (queueService) {
    await queueService.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logInfo('SIGINT received, shutting down gracefully...');
  if (queueService) {
    await queueService.shutdown();
  }
  process.exit(0);
});

// Start server - Railway deployment force rebuild
app.listen(PORT, () => {
  logInfo(`Server started on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'Connected to Neon' : 'Using local database',
    timestamp: new Date().toISOString()
  });
  
  // Keep essential startup logs for immediate visibility
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected to Neon' : 'Using local database'}`);
});