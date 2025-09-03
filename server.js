import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import { createClerkClient } from '@clerk/backend';
const { Pool } = pkg;

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Clerk client
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_VAYZffZP043cqbgUJQgAPmCTziMcZVbfTPfXUIKlrx';
const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

// Database connection pool for Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DEV_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build FIRST
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', environment: process.env.NODE_ENV });
});

// Protected API route example (Clerk auth disabled for initial deployment)
app.get('/api/protected', (req, res) => {
  res.json({ 
    message: 'This is a protected route (auth disabled for initial deployment)',
    userId: 'test-user'
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      timestamp: result.rows[0].now,
      database: 'Connected to Neon PostgreSQL'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: error.message 
    });
  }
});

// Jobs API endpoints
app.get('/api/jobs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 20');
    res.json({ success: true, jobs: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { name, description, quantity, due_date } = req.body;
    const result = await pool.query(
      'INSERT INTO jobs (name, description, quantity, due_date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, quantity, due_date, 'test-user']
    );
    res.json({ success: true, job: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Resources API endpoints
app.get('/api/resources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources ORDER BY name');
    res.json({ success: true, resources: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

// Middleware to verify authentication and admin status
const requireAuth = async (req, res, next) => {
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

// Admin API endpoints
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
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

// Catch-all route for React Router (must be LAST after all API routes)
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected to Neon' : 'Using local database'}`);
});