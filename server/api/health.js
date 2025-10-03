/**
 * COMPREHENSIVE HEALTH CHECK API
 *
 * Enterprise-grade health monitoring for all system components
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import os from 'os';
import { performance } from 'perf_hooks';

const router = express.Router();
const prisma = new PrismaClient();

// Health status levels
const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
};

/**
 * System Health Checker
 */
class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.lastCheckTime = null;
    this.checkInterval = 30000; // 30 seconds
    this.setupChecks();
  }

  setupChecks() {
    // Database check
    this.registerCheck('database', async () => {
      try {
        const start = performance.now();
        await prisma.$queryRaw`SELECT 1 as health`;
        const latency = performance.now() - start;

        return {
          status: HealthStatus.HEALTHY,
          latency: Math.round(latency),
          details: 'Database connection successful',
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          error: error.message,
          details: 'Database connection failed',
        };
      }
    });


    // Memory check
    this.registerCheck('memory', async () => {
      const used = process.memoryUsage();
      const total = os.totalmem();
      const free = os.freemem();
      const percentUsed = ((total - free) / total) * 100;

      let status = HealthStatus.HEALTHY;
      if (percentUsed > 90) {
        status = HealthStatus.UNHEALTHY;
      } else if (percentUsed > 80) {
        status = HealthStatus.DEGRADED;
      }

      return {
        status,
        usage: {
          system: {
            total: Math.round(total / 1024 / 1024),
            free: Math.round(free / 1024 / 1024),
            used: Math.round((total - free) / 1024 / 1024),
            percentUsed: Math.round(percentUsed),
          },
          process: {
            rss: Math.round(used.rss / 1024 / 1024),
            heapTotal: Math.round(used.heapTotal / 1024 / 1024),
            heapUsed: Math.round(used.heapUsed / 1024 / 1024),
            external: Math.round(used.external / 1024 / 1024),
          },
        },
        details: `Memory usage: ${Math.round(percentUsed)}%`,
      };
    });

    // CPU check
    this.registerCheck('cpu', async () => {
      const cpus = os.cpus();
      const loadAvg = os.loadavg();
      const avgLoad = loadAvg[0]; // 1 minute average

      let status = HealthStatus.HEALTHY;
      if (avgLoad > cpus.length * 0.9) {
        status = HealthStatus.UNHEALTHY;
      } else if (avgLoad > cpus.length * 0.7) {
        status = HealthStatus.DEGRADED;
      }

      return {
        status,
        metrics: {
          cores: cpus.length,
          model: cpus[0].model,
          loadAverage: {
            '1m': loadAvg[0].toFixed(2),
            '5m': loadAvg[1].toFixed(2),
            '15m': loadAvg[2].toFixed(2),
          },
        },
        details: `Load average: ${avgLoad.toFixed(2)}`,
      };
    });

    // Disk check
    this.registerCheck('disk', async () => {
      // Note: This is a simplified check. In production, use a proper disk monitoring library
      const diskSpace = {
        available: os.freemem(),
        total: os.totalmem(),
      };
      const percentUsed = ((diskSpace.total - diskSpace.available) / diskSpace.total) * 100;

      let status = HealthStatus.HEALTHY;
      if (percentUsed > 95) {
        status = HealthStatus.UNHEALTHY;
      } else if (percentUsed > 85) {
        status = HealthStatus.DEGRADED;
      }

      return {
        status,
        usage: {
          total: Math.round(diskSpace.total / 1024 / 1024 / 1024),
          available: Math.round(diskSpace.available / 1024 / 1024 / 1024),
          percentUsed: Math.round(percentUsed),
        },
        details: `Disk usage: ${Math.round(percentUsed)}%`,
      };
    });

    // Data pipeline check
    this.registerCheck('data_pipeline', async () => {
      try {
        // Check if we have recent data
        const recentData = await prisma.productionMetrics.findFirst({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (recentData) {
          return {
            status: HealthStatus.HEALTHY,
            lastUpdate: recentData.createdAt,
            details: 'Data pipeline is active',
          };
        } else {
          return {
            status: HealthStatus.DEGRADED,
            details: 'No recent data in pipeline',
          };
        }
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          error: error.message,
          details: 'Data pipeline check failed',
        };
      }
    });
  }

  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async runCheck(name) {
    const checkFunction = this.checks.get(name);
    if (!checkFunction) {
      return {
        status: HealthStatus.UNHEALTHY,
        error: `Check '${name}' not found`,
      };
    }

    try {
      const start = performance.now();
      const result = await checkFunction();
      const duration = performance.now() - start;

      return {
        ...result,
        duration: Math.round(duration),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async runAllChecks() {
    const results = {
      status: HealthStatus.HEALTHY,
      timestamp: new Date().toISOString(),
      checks: {},
    };

    // Run all checks in parallel
    const checkPromises = Array.from(this.checks.keys()).map(async (name) => {
      const result = await this.runCheck(name);
      return { name, result };
    });

    const checkResults = await Promise.allSettled(checkPromises);

    // Process results
    for (const promiseResult of checkResults) {
      if (promiseResult.status === 'fulfilled') {
        const { name, result } = promiseResult.value;
        results.checks[name] = result;

        // Update overall status
        if (result.status === HealthStatus.UNHEALTHY) {
          results.status = HealthStatus.UNHEALTHY;
        } else if (result.status === HealthStatus.DEGRADED && results.status !== HealthStatus.UNHEALTHY) {
          results.status = HealthStatus.DEGRADED;
        }
      } else {
        // Check failed to execute
        results.checks['unknown'] = {
          status: HealthStatus.UNHEALTHY,
          error: promiseResult.reason,
        };
        results.status = HealthStatus.UNHEALTHY;
      }
    }

    this.lastCheckTime = new Date();
    return results;
  }

  async getReadiness() {
    // Check if all critical services are ready
    const criticalChecks = ['database'];
    const results = {
      ready: true,
      timestamp: new Date().toISOString(),
      checks: {},
    };

    for (const checkName of criticalChecks) {
      const result = await this.runCheck(checkName);
      results.checks[checkName] = result;

      if (result.status === HealthStatus.UNHEALTHY) {
        results.ready = false;
      }
    }

    return results;
  }

  async getLiveness() {
    // Simple liveness check - if we can respond, we're alive
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
    };
  }
}

// Create health checker instance
const healthChecker = new HealthChecker();

/**
 * Health Check Routes
 */

// Basic health endpoint (for load balancers)
router.get('/health', async (req, res) => {
  try {
    const health = await healthChecker.runAllChecks();
    const statusCode = health.status === HealthStatus.HEALTHY ? 200 :
                       health.status === HealthStatus.DEGRADED ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: HealthStatus.UNHEALTHY,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Kubernetes readiness probe
router.get('/ready', async (req, res) => {
  try {
    const readiness = await healthChecker.getReadiness();
    res.status(readiness.ready ? 200 : 503).json(readiness);
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Kubernetes liveness probe
router.get('/alive', async (req, res) => {
  try {
    const liveness = await healthChecker.getLiveness();
    res.status(200).json(liveness);
  } catch (error) {
    res.status(503).json({
      alive: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed health check for specific component
router.get('/health/:component', async (req, res) => {
  try {
    const { component } = req.params;
    const result = await healthChecker.runCheck(component);

    const statusCode = result.status === HealthStatus.HEALTHY ? 200 :
                       result.status === HealthStatus.DEGRADED ? 200 : 503;

    res.status(statusCode).json({
      component,
      ...result,
    });
  } catch (error) {
    res.status(503).json({
      component: req.params.component,
      status: HealthStatus.UNHEALTHY,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// System metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: {
        user: process.cpuUsage().user,
        system: process.cpuUsage().system,
      },
      system: {
        platform: os.platform(),
        release: os.release(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      process: {
        pid: process.pid,
        version: process.version,
        argv: process.argv,
        execPath: process.execPath,
        env: process.env.NODE_ENV,
      },
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
export { healthChecker, HealthStatus };