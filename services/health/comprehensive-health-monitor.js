/**
 * COMPREHENSIVE HEALTH MONITORING SYSTEM
 * Fortune 500-Level Health Checks for Sentia Manufacturing Dashboard
 * Provides detailed health status for all system components
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import os from 'os';
import fs from 'fs';
import { performance } from 'perf_hooks';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


class HealthMonitor {
  constructor() {
    this.prisma = new PrismaClient();
    this.healthChecks = new Map();
    this.lastHealthCheck = null;
    this.healthHistory = [];
    this.maxHistorySize = 100;
  }

  // Core health check methods
  async checkDatabaseHealth() {
    const startTime = performance.now();

    try {
      // Test basic connection
      await this.prisma.$connect();

      // Test query execution
      const result = await this.prisma.$queryRaw`SELECT 1 as health_check`;

      // Test vector extension (if available)
      let vectorSupport = false;
      try {
        await this.prisma.$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'vector'`;
        vectorSupport = true;
      } catch (error) {
        // Vector extension not available
      }

      const responseTime = performance.now() - startTime;

      return {
        status: 'healthy',
        connected: true,
        responseTime: Math.round(responseTime),
        vectorSupport,
        queryResult: result.length > 0,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        responseTime: performance.now() - startTime,
        lastChecked: new Date().toISOString()
      };
    }
  }

  async checkMCPServerHealth() {
    const mcpUrl = process.env.MCP_SERVER_URL;

    if (!mcpUrl) {
      return {
        status: 'not_configured',
        configured: false,
        message: 'MCP_SERVER_URL not set'
      };
    }

    const startTime = performance.now();

    try {
      // Try to connect to MCP health endpoint
      const response = await axios.get(`${mcpUrl}/health`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const responseTime = performance.now() - startTime;

      return {
        status: 'healthy',
        connected: true,
        url: mcpUrl,
        responseTime: Math.round(responseTime),
        mcpVersion: response.data?.version || 'unknown',
        capabilities: response.data?.capabilities || [],
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        url: mcpUrl,
        error: error.message,
        responseTime: Math.round(performance.now() - startTime),
        lastChecked: new Date().toISOString()
      };
    }
  }

  async checkClerkAuthHealth() {
    const clerkPublishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!clerkPublishableKey || !clerkSecretKey) {
      return {
        status: 'not_configured',
        configured: false,
        message: 'Clerk keys not configured'
      };
    }

    try {
      // Basic configuration check
      const isLiveEnvironment = clerkPublishableKey.startsWith('pk_live_');
      const hasValidDomain = !!process.env.VITE_CLERK_DOMAIN;

      return {
        status: 'healthy',
        configured: true,
        environment: isLiveEnvironment ? 'production' : 'development',
        domain: process.env.VITE_CLERK_DOMAIN || 'not_configured',
        webhookConfigured: !!process.env.CLERK_WEBHOOK_SECRET,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        configured: false,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  async checkExternalAPIHealth() {
    const apis = [
      {
        name: 'Xero',
        configured: !!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET),
        testUrl: 'https://api.xero.com/api.xro/2.0/Organisation'
      },
      {
        name: 'Shopify UK',
        configured: !!(process.env.SHOPIFY_UK_ACCESS_TOKEN && process.env.SHOPIFY_UK_SHOP_URL),
        testUrl: `https://${process.env.SHOPIFY_UK_SHOP_URL}/admin/api/2023-10/shop.json`
      },
      {
        name: 'Shopify USA',
        configured: !!(process.env.SHOPIFY_USA_ACCESS_TOKEN && process.env.SHOPIFY_USA_SHOP_URL),
        testUrl: `https://${process.env.SHOPIFY_USA_SHOP_URL}/admin/api/2023-10/shop.json`
      },
      {
        name: 'Unleashed',
        configured: !!(process.env.UNLEASHED_API_ID && process.env.UNLEASHED_API_KEY),
        testUrl: 'https://api.unleashedsoftware.com/Companies'
      },
      {
        name: 'OpenAI',
        configured: !!process.env.OPENAI_API_KEY,
        testUrl: null // Don't test API key validity to avoid charges
      },
      {
        name: 'Anthropic',
        configured: !!process.env.ANTHROPIC_API_KEY,
        testUrl: null // Don't test API key validity to avoid charges
      }
    ];

    const results = {};

    for (const api of apis) {
      if (!api.configured) {
        results[api.name.toLowerCase()] = {
          status: 'not_configured',
          configured: false,
          message: `${api.name} credentials not set`
        };
        continue;
      }

      if (!api.testUrl) {
        results[api.name.toLowerCase()] = {
          status: 'configured',
          configured: true,
          message: `${api.name} credentials available`
        };
        continue;
      }

      // For now, just mark as configured
      // In production, you might want to test actual connectivity
      results[api.name.toLowerCase()] = {
        status: 'configured',
        configured: true,
        message: `${api.name} configured but not tested`
      };
    }

    return results;
  }

  getSystemHealth() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    return {
      status: 'healthy',
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100) // %
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        loadAverage: os.loadavg()
      },
      system: {
        platform: os.platform(),
        architecture: os.arch(),
        nodeVersion: process.version,
        uptime: Math.round(uptime),
        uptimeFormatted: this.formatUptime(uptime)
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        branch: process.env.BRANCH,
        port: process.env.PORT
      }
    };
  }

  formatUptime(seconds) {
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

  calculateOverallHealth(checks) {
    const statuses = Object.values(checks).map(check => {
      if (typeof check === 'object' && check.status) {
        return check.status;
      }
      return 'unknown';
    });

    const healthyCount = statuses.filter(status => status === 'healthy' || status === 'configured').length;
    const totalCount = statuses.length;
    const unhealthyCount = statuses.filter(status => status === 'unhealthy').length;

    if (unhealthyCount > 0) {
      return 'degraded';
    }

    if (healthyCount === totalCount) {
      return 'healthy';
    }

    return 'warning';
  }

  async runComprehensiveHealthCheck() {
    const startTime = performance.now();

    try {
      const [database, mcpServer, clerkAuth, externalAPIs, system] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkMCPServerHealth(),
        this.checkClerkAuthHealth(),
        this.checkExternalAPIHealth(),
        Promise.resolve(this.getSystemHealth())
      ]);

      const healthData = {
        overall: 'healthy', // Will be calculated
        timestamp: new Date().toISOString(),
        checkDuration: Math.round(performance.now() - startTime),
        service: {
          name: 'sentia-manufacturing-dashboard',
          version: '1.0.10',
          environment: process.env.NODE_ENV || 'development',
          branch: process.env.BRANCH || 'development'
        },
        components: {
          database,
          mcpServer,
          clerkAuth,
          externalAPIs,
          system
        }
      };

      // Calculate overall health
      healthData.overall = this.calculateOverallHealth(healthData.components);

      // Store in history
      this.lastHealthCheck = healthData;
      this.healthHistory.push({
        timestamp: healthData.timestamp,
        overall: healthData.overall,
        checkDuration: healthData.checkDuration
      });

      // Trim history to max size
      if (this.healthHistory.length > this.maxHistorySize) {
        this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
      }

      return healthData;

    } catch (error) {
      return {
        overall: 'unhealthy',
        timestamp: new Date().toISOString(),
        checkDuration: Math.round(performance.now() - startTime),
        error: error.message,
        service: {
          name: 'sentia-manufacturing-dashboard',
          version: '1.0.10',
          environment: process.env.NODE_ENV || 'development'
        }
      };
    }
  }

  // Express middleware for health endpoints
  getHealthMiddleware() {
    return {
      // Basic health check
      basic: async (req, res) => {
        try {
          const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'sentia-manufacturing-dashboard',
            version: '1.0.10'
          };

          res.status(200).json(health);
        } catch (error) {
          res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },

      // Comprehensive health check
      detailed: async (req, res) => {
        try {
          const health = await this.runComprehensiveHealthCheck();
          const statusCode = health.overall === 'healthy' ? 200 :
                            health.overall === 'warning' ? 200 : 503;

          res.status(statusCode).json(health);
        } catch (error) {
          res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },

      // Health history endpoint
      history: async (req, res) => {
        try {
          res.status(200).json({
            current: this.lastHealthCheck,
            history: this.healthHistory,
            historySize: this.healthHistory.length,
            maxHistorySize: this.maxHistorySize
          });
        } catch (error) {
          res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },

      // Liveness probe (for Kubernetes-style health checks)
      liveness: async (req, res) => {
        res.status(200).json({
          status: 'alive',
          timestamp: new Date().toISOString()
        });
      },

      // Readiness probe
      readiness: async (req, res) => {
        try {
          // Quick readiness checks
          const dbHealth = await this.checkDatabaseHealth();
          const isReady = dbHealth.status === 'healthy' || dbHealth.status === 'not_configured';

          if (isReady) {
            res.status(200).json({
              status: 'ready',
              timestamp: new Date().toISOString()
            });
          } else {
            res.status(503).json({
              status: 'not_ready',
              reason: 'Database not available',
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          res.status(503).json({
            status: 'not_ready',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    };
  }

  // Cleanup method
  async cleanup() {
    try {
      await this.prisma.$disconnect();
    } catch (error) {
      logError('Error during health monitor cleanup:', error);
    }
  }
}

export default HealthMonitor;