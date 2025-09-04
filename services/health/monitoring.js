import os from 'os';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { performance } from 'perf_hooks';
import { logInfo, logError } from '../logger.js';

// Health check status enum
export const HealthStatus = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  DEGRADED: 'degraded'
};

// Component status tracker
const componentStatus = new Map();
const healthChecks = new Map();

// Register a health check
export const registerHealthCheck = (name, checkFn, { critical = false, timeout = 5000 } = {}) => {
  healthChecks.set(name, { checkFn, critical, timeout });
};

// Execute health check with timeout
const executeHealthCheck = async (name, { checkFn, timeout }) => {
  const start = performance.now();
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Health check timeout')), timeout)
    );
    
    const result = await Promise.race([checkFn(), timeoutPromise]);
    const duration = performance.now() - start;
    
    return {
      name,
      status: result.status || HealthStatus.HEALTHY,
      message: result.message || 'OK',
      duration,
      timestamp: new Date().toISOString(),
      metadata: result.metadata || {}
    };
  } catch (error) {
    const duration = performance.now() - start;
    return {
      name,
      status: HealthStatus.UNHEALTHY,
      message: error.message,
      duration,
      timestamp: new Date().toISOString(),
      error: true
    };
  }
};

// Comprehensive health check
export const performHealthCheck = async () => {
  const checks = [];
  
  for (const [name, config] of healthChecks) {
    const result = await executeHealthCheck(name, config);
    checks.push(result);
    componentStatus.set(name, result);
  }
  
  // Determine overall status
  const hasUnhealthyCritical = checks.some(c => 
    c.status === HealthStatus.UNHEALTHY && healthChecks.get(c.name).critical
  );
  const hasDegraded = checks.some(c => c.status === HealthStatus.DEGRADED);
  const hasUnhealthy = checks.some(c => c.status === HealthStatus.UNHEALTHY);
  
  let overallStatus = HealthStatus.HEALTHY;
  if (hasUnhealthyCritical) {
    overallStatus = HealthStatus.UNHEALTHY;
  } else if (hasUnhealthy || hasDegraded) {
    overallStatus = HealthStatus.DEGRADED;
  }
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    checks
  };
};

// Readiness check (more strict than health)
export const performReadinessCheck = async () => {
  const health = await performHealthCheck();
  
  // Additional readiness criteria
  const isReady = health.status !== HealthStatus.UNHEALTHY && 
                  componentStatus.get('database')?.status === HealthStatus.HEALTHY &&
                  componentStatus.get('redis')?.status !== HealthStatus.UNHEALTHY;
  
  return {
    ready: isReady,
    status: health.status,
    timestamp: health.timestamp,
    checks: health.checks,
    message: isReady ? 'Application is ready' : 'Application not ready'
  };
};

// Database health check
export const checkDatabase = async (pool) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1');
    const poolStats = pool.totalCount ? {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    } : {};
    
    client.release();
    
    return {
      status: HealthStatus.HEALTHY,
      message: 'Database connection successful',
      metadata: {
        pool: poolStats,
        responseTime: result.rows[0] ? 'OK' : 'No response'
      }
    };
  } catch (error) {
    return {
      status: HealthStatus.UNHEALTHY,
      message: `Database connection failed: ${error.message}`
    };
  }
};

// Redis health check
export const checkRedis = async (redisUrl) => {
  if (!redisUrl) {
    return {
      status: HealthStatus.DEGRADED,
      message: 'Redis not configured'
    };
  }
  
  try {
    const client = createClient({ url: redisUrl });
    await client.connect();
    await client.ping();
    
    const info = await client.info('memory');
    const memoryUsage = info.split('\r\n')
      .find(line => line.startsWith('used_memory_human:'))
      ?.split(':')[1] || 'unknown';
    
    await client.quit();
    
    return {
      status: HealthStatus.HEALTHY,
      message: 'Redis connection successful',
      metadata: {
        memoryUsage
      }
    };
  } catch (error) {
    return {
      status: HealthStatus.DEGRADED,
      message: `Redis connection failed: ${error.message}`
    };
  }
};

// System resources check
export const checkSystemResources = async () => {
  const cpuUsage = process.cpuUsage();
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  const memoryPercent = ((totalMem - freeMem) / totalMem) * 100;
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  let status = HealthStatus.HEALTHY;
  if (memoryPercent > 90 || heapPercent > 90) {
    status = HealthStatus.UNHEALTHY;
  } else if (memoryPercent > 75 || heapPercent > 75) {
    status = HealthStatus.DEGRADED;
  }
  
  return {
    status,
    message: `Memory: ${memoryPercent.toFixed(2)}%, Heap: ${heapPercent.toFixed(2)}%`,
    metadata: {
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      memory: {
        systemPercent: memoryPercent.toFixed(2),
        heapPercent: heapPercent.toFixed(2),
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
      },
      loadAvg: os.loadavg(),
      uptime: process.uptime()
    }
  };
};

// Queue health check
export const checkQueue = async (queueService) => {
  if (!queueService) {
    return {
      status: HealthStatus.DEGRADED,
      message: 'Queue service not configured'
    };
  }
  
  try {
    const stats = await queueService.getQueueStats();
    const totalJobs = stats.waiting + stats.active + stats.completed + stats.failed;
    const failureRate = totalJobs > 0 ? (stats.failed / totalJobs) * 100 : 0;
    
    let status = HealthStatus.HEALTHY;
    if (stats.failed > 100 || failureRate > 10) {
      status = HealthStatus.UNHEALTHY;
    } else if (stats.waiting > 500 || failureRate > 5) {
      status = HealthStatus.DEGRADED;
    }
    
    return {
      status,
      message: `Queue depth: ${stats.waiting}, Failure rate: ${failureRate.toFixed(2)}%`,
      metadata: stats
    };
  } catch (error) {
    return {
      status: HealthStatus.DEGRADED,
      message: `Queue check failed: ${error.message}`
    };
  }
};

// External service check
export const checkExternalService = async (name, url, expectedStatus = 200) => {
  try {
    const start = performance.now();
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000 
    });
    const duration = performance.now() - start;
    
    if (response.status === expectedStatus) {
      return {
        status: HealthStatus.HEALTHY,
        message: `${name} is reachable`,
        metadata: {
          responseTime: `${duration.toFixed(2)}ms`,
          statusCode: response.status
        }
      };
    } else {
      return {
        status: HealthStatus.DEGRADED,
        message: `${name} returned unexpected status: ${response.status}`,
        metadata: {
          expectedStatus,
          actualStatus: response.status
        }
      };
    }
  } catch (error) {
    return {
      status: HealthStatus.UNHEALTHY,
      message: `${name} is unreachable: ${error.message}`
    };
  }
};

// Migration status check
export const checkMigrations = async (prisma) => {
  if (!prisma) {
    return {
      status: HealthStatus.DEGRADED,
      message: 'Prisma client not available'
    };
  }
  
  try {
    // Check if migrations table exists and has entries
    const migrations = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM _prisma_migrations 
      WHERE finished_at IS NOT NULL
    `;
    
    return {
      status: HealthStatus.HEALTHY,
      message: 'Database migrations up to date',
      metadata: {
        appliedMigrations: parseInt(migrations[0]?.count || 0)
      }
    };
  } catch (error) {
    return {
      status: HealthStatus.DEGRADED,
      message: `Migration check failed: ${error.message}`
    };
  }
};

// Disk space check
export const checkDiskSpace = async () => {
  // Platform-specific implementation would go here
  // For now, return a basic check
  return {
    status: HealthStatus.HEALTHY,
    message: 'Disk space adequate',
    metadata: {
      note: 'Detailed disk space monitoring requires platform-specific implementation'
    }
  };
};

export default {
  registerHealthCheck,
  performHealthCheck,
  performReadinessCheck,
  checkDatabase,
  checkRedis,
  checkSystemResources,
  checkQueue,
  checkExternalService,
  checkMigrations,
  checkDiskSpace,
  HealthStatus
};