/**
 * Health Check API Endpoints
 * Validates database connectivity and system health
 */

import express from 'express';
import neonDB from '../database/neonConnection.js';

const router = express.Router();

/**
 * Basic health check
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sentia-manufacturing-dashboard',
    branch: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development'
  });
});

/**
 * Detailed health check with database connectivity
 */
router.get('/health/detailed', async (req, res) => {
  const startTime = Date.now();
  
  const health = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    service: 'sentia-manufacturing-dashboard',
    branch: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    checks: {}
  };
  
  try {
    // Check API server
    health.checks.api = {
      status: 'healthy',
      message: 'API server responding'
    };
    
    // Check database connectivity
    const dbHealth = await neonDB.healthCheck();
    health.checks.database = {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      pool: dbHealth.pool,
      prisma: dbHealth.prisma,
      query: dbHealth.query,
      latency: dbHealth.latency,
      stats: dbHealth.stats,
      error: dbHealth.error
    };
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    health.checks.memory = {
      status: 'healthy',
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
    };
    
    // Check uptime
    health.checks.uptime = {
      status: 'healthy',
      seconds: Math.round(process.uptime()),
      formatted: formatUptime(process.uptime())
    };
    
    // Overall status
    health.status = health.checks.database.status === 'healthy' ? 'healthy' : 'degraded';
    health.responseTime = Date.now() - startTime + 'ms';
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
    
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    health.responseTime = Date.now() - startTime + 'ms';
    res.status(503).json(health);
  }
});

/**
 * Database-specific health check
 */
router.get('/health/database', async (req, res) => {
  try {
    const branch = req.query.branch || null;
    const dbHealth = await neonDB.healthCheck(branch);
    
    const statusCode = dbHealth.healthy ? 200 : 503;
    res.status(statusCode).json(dbHealth);
  } catch (error) {
    res.status(503).json({
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Database warmup endpoint
 */
router.post('/health/warmup', async (req, res) => {
  try {
    const branch = req.body.branch || null;
    await neonDB.warmupConnection(branch);
    
    res.status(200).json({
      status: 'success',
      message: 'Database connection warmed up',
      branch: branch || neonDB.getCurrentBranch(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Warmup failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Database reconnect endpoint
 */
router.post('/health/reconnect', async (req, res) => {
  try {
    const branch = req.body.branch || null;
    await neonDB.reconnect(branch);
    
    res.status(200).json({
      status: 'success',
      message: 'Database reconnected',
      branch: branch || neonDB.getCurrentBranch(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Reconnection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get connection statistics
 */
router.get('/health/stats', (req, res) => {
  const branch = req.query.branch || null;
  const stats = neonDB.getStats(branch);
  
  res.status(200).json({
    stats,
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness probe for Railway
 */
router.get('/ready', async (req, res) => {
  try {
    // Quick database check
    const result = await neonDB.executeQuery('SELECT 1', [], { 
      retries: 1, 
      timeout: 5000 
    });
    
    if (result.success) {
      res.status(200).send('Ready');
    } else {
      res.status(503).send('Not Ready');
    }
  } catch (error) {
    res.status(503).send('Not Ready');
  }
});

/**
 * Liveness probe for Railway
 */
router.get('/live', (req, res) => {
  res.status(200).send('Alive');
});

/**
 * Format uptime to human-readable string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

export default router;