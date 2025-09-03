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
import UnleashedService from './services/unleashedService.js';
import logger, { logInfo, logError, logWarn } from './services/logger.js';
import { metricsMiddleware, getMetrics, recordUnleashedApiRequest } from './services/metrics.js';
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
let clerkClient = null;

if (!CLERK_SECRET_KEY) {
  logWarn('CLERK_SECRET_KEY environment variable not found - authentication features will be disabled');
  console.log('WARNING: CLERK_SECRET_KEY missing - authentication disabled');
} else {
  try {
    clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
    logInfo('Clerk client initialized successfully');
  } catch (error) {
    logError('Failed to initialize Clerk client', error);
    console.log('ERROR: Failed to initialize Clerk - authentication disabled');
  }
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

// Admin API endpoints
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
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

// Start server - Railway deployment fix
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