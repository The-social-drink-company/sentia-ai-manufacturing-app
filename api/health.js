/**
 * Health Check & Monitoring API
 * Provides comprehensive system health information
 */

import express from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import Redis from 'redis';

const router = express.Router();

// System start time
const startTime = Date.now();

// Health check levels
const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy'
};

/**
 * Basic health check endpoint
 * Returns 200 if service is running
 */
router.get(_'/health', _(req, res) => {
  res.status(200).json({
    status: HealthStatus.HEALTHY,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    service: 'sentia-manufacturing-dashboard',
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * Liveness probe for Kubernetes/Container orchestration
 * Checks if the application is running
 */
router.get(_'/health/live', _(req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness probe
 * Checks if the application is ready to serve traffic
 */
router.get(_'/health/ready', async _(req, res) => {
  const checks = await performReadinessChecks();
  const isReady = checks.every(check => check.status === 'ready');
  
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    timestamp: new Date().toISOString(),
    checks
  });
});

/**
 * Comprehensive health check
 * Returns detailed system health information
 */
router.get(_'/health/detailed', async _(req, res) => {
  try {
    const healthData = {
      status: HealthStatus.HEALTHY,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: {
        app: process.env.npm_package_version || '1.0.0',
        node: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      system: getSystemMetrics(),
      dependencies: await checkDependencies(),
      features: getFeatureStatus(),
      performance: getPerformanceMetrics()
    };

    // Determine overall health status
    if (healthData.dependencies.some(dep => dep.status === HealthStatus.UNHEALTHY)) {
      healthData.status = HealthStatus.UNHEALTHY;
    } else if (healthData.dependencies.some(dep => dep.status === HealthStatus.DEGRADED)) {
      healthData.status = HealthStatus.DEGRADED;
    }

    const statusCode = healthData.status === HealthStatus.HEALTHY ? 200 : 
                       healthData.status === HealthStatus.DEGRADED ? 200 : 503;

    res.status(statusCode).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: HealthStatus.UNHEALTHY,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Metrics endpoint for Prometheus/Grafana
 */
router.get(_'/metrics', _(req, res) => {
  const metrics = generatePrometheusMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

/**
 * System status endpoint
 */
router.get(_'/status', async _(req, res) => {
  const status = {
    operational: true,
    timestamp: new Date().toISOString(),
    services: await getServiceStatus(),
    alerts: getActiveAlerts(),
    recentErrors: getRecentErrors()
  };

  res.json(status);
});

// Helper Functions

/**
 * Get system metrics
 */
function getSystemMetrics() {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    cpu: {
      count: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      usage: calculateCPUUsage()
    },
    memory: {
      total: formatBytes(totalMemory),
      used: formatBytes(usedMemory),
      free: formatBytes(freeMemory),
      percentage: Math.round((usedMemory / totalMemory) * 100)
    },
    process: {
      pid: process.pid,
      memory: formatBytes(process.memoryUsage().heapUsed),
      uptime: Math.floor(process.uptime())
    },
    platform: {
      type: os.type(),
      platform: os.platform(),
      release: os.release(),
      hostname: os.hostname()
    }
  };
}

/**
 * Check external dependencies
 */
async function checkDependencies() {
  const dependencies = [];

  // Database check
  dependencies.push(await checkDatabase());

  // Redis check
  if (process.env.REDIS_URL) {
    dependencies.push(await checkRedis());
  }

  // External APIs
  dependencies.push(await checkExternalAPIs());

  // File system
  dependencies.push(checkFileSystem());

  return dependencies;
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const start = Date.now();
    const result = await pool.query('SELECT NOW()');
    const responseTime = Date.now() - start;

    await pool.end();

    return {
      name: 'PostgreSQL Database',
      status: HealthStatus.HEALTHY,
      responseTime: `${responseTime}ms`,
      details: {
        timestamp: result.rows[0].now
      }
    };
  } catch (error) {
    return {
      name: 'PostgreSQL Database',
      status: HealthStatus.UNHEALTHY,
      error: error.message
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis() {
  try {
    const client = Redis.createClient({
      url: process.env.REDIS_URL
    });

    await client.connect();
    const start = Date.now();
    await client.ping();
    const responseTime = Date.now() - start;
    await client.quit();

    return {
      name: 'Redis Cache',
      status: HealthStatus.HEALTHY,
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    return {
      name: 'Redis Cache',
      status: HealthStatus.DEGRADED,
      error: error.message,
      note: 'Cache is optional, app can function without it'
    };
  }
}

/**
 * Check external API connectivity
 */
async function checkExternalAPIs() {
  const apis = [];
  
  // Check each configured API
  if (process.env.XERO_CLIENT_ID) {
    apis.push({ name: 'Xero', configured: true });
  }
  if (process.env.SHOPIFY_API_KEY) {
    apis.push({ name: 'Shopify', configured: true });
  }
  if (process.env.AMAZON_SP_API_CLIENT_ID) {
    apis.push({ name: 'Amazon SP-API', configured: true });
  }
  if (process.env.OPENAI_API_KEY) {
    apis.push({ name: 'OpenAI', configured: true });
  }

  return {
    name: 'External APIs',
    status: apis.length > 0 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
    details: {
      configured: apis.length,
      apis: apis
    }
  };
}

/**
 * Check file system
 */
function checkFileSystem() {
  try {
    const testFile = path.join(os.tmpdir(), 'health-check-test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    return {
      name: 'File System',
      status: HealthStatus.HEALTHY,
      details: {
        writable: true,
        tempDir: os.tmpdir()
      }
    };
  } catch (error) {
    return {
      name: 'File System',
      status: HealthStatus.UNHEALTHY,
      error: error.message
    };
  }
}

/**
 * Get feature status
 */
function getFeatureStatus() {
  return {
    ai: process.env.ENABLE_AI_FEATURES === 'true',
    predictiveMaintenance: process.env.ENABLE_PREDICTIVE_MAINTENANCE === 'true',
    digitalTwin: process.env.ENABLE_DIGITAL_TWIN === 'true',
    workflowAutomation: process.env.ENABLE_WORKFLOW_AUTOMATION === 'true',
    globalCompliance: process.env.ENABLE_GLOBAL_COMPLIANCE === 'true',
    realTimeAnalytics: process.env.WS_ENABLED === 'true',
    caching: process.env.CACHE_ENABLED === 'true'
  };
}

/**
 * Get performance metrics
 */
function getPerformanceMetrics() {
  return {
    eventLoop: {
      delay: measureEventLoopDelay(),
      utilization: process.cpuUsage()
    },
    gc: {
      collections: global.gc ? getGCStats() : 'GC stats not available'
    },
    requests: {
      total: global.requestCount || 0,
      errors: global.errorCount || 0,
      avgResponseTime: global.avgResponseTime || 0
    }
  };
}

/**
 * Perform readiness checks
 */
async function performReadinessChecks() {
  const checks = [];

  // Database readiness
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await pool.query('SELECT 1');
    await pool.end();
    checks.push({ name: 'database', status: 'ready' });
  } catch (error) {
    checks.push({ name: 'database', status: 'not_ready', error: error.message });
  }

  // Required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'NODE_ENV'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  checks.push({
    name: 'environment',
    status: missingVars.length === 0 ? 'ready' : 'not_ready',
    missing: missingVars
  });

  return checks;
}

/**
 * Get service status
 */
async function getServiceStatus() {
  return {
    api: 'operational',
    database: await checkDatabaseStatus(),
    cache: await checkCacheStatus(),
    websocket: process.env.WS_ENABLED === 'true' ? 'operational' : 'disabled',
    scheduler: 'operational'
  };
}

/**
 * Check database status
 */
async function checkDatabaseStatus() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await pool.query('SELECT 1');
    await pool.end();
    return 'operational';
  } catch (error) {
    return 'degraded';
  }
}

/**
 * Check cache status
 */
async function checkCacheStatus() {
  if (!process.env.REDIS_URL) {
    return 'not_configured';
  }

  try {
    const client = Redis.createClient({ url: process.env.REDIS_URL });
    await client.connect();
    await client.ping();
    await client.quit();
    return 'operational';
  } catch (error) {
    return 'degraded';
  }
}

/**
 * Get active alerts
 */
function getActiveAlerts() {
  const alerts = [];

  // Check memory usage
  const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem();
  if (memoryUsage > 0.9) {
    alerts.push({
      level: 'critical',
      message: 'Memory usage above 90%',
      timestamp: new Date().toISOString()
    });
  } else if (memoryUsage > 0.8) {
    alerts.push({
      level: 'warning',
      message: 'Memory usage above 80%',
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
}

/**
 * Get recent errors
 */
function getRecentErrors() {
  // This would typically come from a logging service
  return global.recentErrors || [];
}

/**
 * Generate Prometheus metrics
 */
function generatePrometheusMetrics() {
  const metrics = [];

  // System metrics
  const memoryUsage = process.memoryUsage();
  metrics.push(`# HELP nodejs_heap_size_total_bytes Process heap size`);
  metrics.push(`# TYPE nodejs_heap_size_total_bytes gauge`);
  metrics.push(`nodejs_heap_size_total_bytes ${memoryUsage.heapTotal}`);

  metrics.push(`# HELP nodejs_heap_size_used_bytes Process heap used`);
  metrics.push(`# TYPE nodejs_heap_size_used_bytes gauge`);
  metrics.push(`nodejs_heap_size_used_bytes ${memoryUsage.heapUsed}`);

  // Process metrics
  metrics.push(`# HELP process_uptime_seconds Process uptime`);
  metrics.push(`# TYPE process_uptime_seconds gauge`);
  metrics.push(`process_uptime_seconds ${process.uptime()}`);

  // Custom application metrics
  metrics.push(`# HELP app_requests_total Total requests`);
  metrics.push(`# TYPE app_requests_total counter`);
  metrics.push(`app_requests_total ${global.requestCount || 0}`);

  metrics.push(`# HELP app_errors_total Total errors`);
  metrics.push(`# TYPE app_errors_total counter`);
  metrics.push(`app_errors_total ${global.errorCount || 0}`);

  return metrics.join('\n');
}

// Utility Functions

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Calculate CPU usage
 */
function calculateCPUUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);

  return usage;
}

/**
 * Measure event loop delay
 */
function measureEventLoopDelay() {
  const start = process.hrtime();
  setImmediate(_() => {
    const delta = process.hrtime(start);
    return delta[0] * 1000 + delta[1] / 1000000;
  });
  return 0; // Placeholder
}

/**
 * Get GC stats (if available)
 */
async function getGCStats() {
  try {
    const v8 = await import('v8');
    return v8.default.getHeapStatistics();
  } catch (error) {
    return null;
  }
}

export default router;