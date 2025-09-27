/**
 * COMPREHENSIVE HEALTH CHECK SERVICE
 * Validates all system components and handles errors gracefully
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getDatabaseConfig, getMCPConfig } from '../config/database-config.js';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


// Health check status constants
const STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

// Component status tracker
class ComponentHealth {
  constructor(name) {
    this.name = name;
    this.status = STATUS.UNKNOWN;
    this.message = null;
    this.metadata = {};
    this.lastChecked = null;
    this.responseTime = null;
  }

  setHealthy(metadata = {}) {
    this.status = STATUS.HEALTHY;
    this.message = 'Component is functioning normally';
    this.metadata = metadata;
    this.lastChecked = new Date().toISOString();
    return this;
  }

  setDegraded(message, metadata = {}) {
    this.status = STATUS.DEGRADED;
    this.message = message;
    this.metadata = metadata;
    this.lastChecked = new Date().toISOString();
    return this;
  }

  setUnhealthy(message, error = null) {
    this.status = STATUS.UNHEALTHY;
    this.message = message;
    this.metadata = { error: error?.message || 'Unknown error' };
    this.lastChecked = new Date().toISOString();
    return this;
  }

  toJSON() {
    return {
      name: this.name,
      status: this.status,
      message: this.message,
      metadata: this.metadata,
      lastChecked: this.lastChecked,
      responseTime: this.responseTime
    };
  }
}

// Main Health Check Service
export class HealthCheckService {
  constructor() {
    this.dbConfig = getDatabaseConfig();
    this.mcpConfig = getMCPConfig();
    this.prisma = null;
    this.healthCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  // Initialize Prisma client
  async initializePrisma() {
    if (!this.prisma) {
      try {
        this.prisma = new PrismaClient({
          datasources: {
            db: {
              url: this.dbConfig.connectionString
            }
          },
          log: ['error', 'warn']
        });
        await this.prisma.$connect();
      } catch (error) {
        logError('Failed to initialize Prisma:', error.message);
        this.prisma = null;
      }
    }
    return this.prisma;
  }

  // Check database health
  async checkDatabase() {
    const health = new ComponentHealth('database');
    const startTime = Date.now();

    try {
      const prisma = await this.initializePrisma();

      if (!prisma) {
        return health.setUnhealthy('Database client initialization failed');
      }

      // Test basic connectivity - cast BigInt values to text to avoid JavaScript BigInt issues
      const result = await prisma.$queryRaw`
        SELECT
          current_database() as database,
          version() as version,
          pg_is_in_recovery() as is_replica,
          pg_database_size(current_database())::text as size_bytes,
          (SELECT count(*)::text FROM pg_stat_activity WHERE datname = current_database()) as connections
      `;

      const dbInfo = result[0];
      health.responseTime = Date.now() - startTime;

      // Check connection count - parse string to number
      const connections = parseInt(dbInfo.connections, 10) || 0;
      const maxConnections = 100; // Typical max for basic tier
      const connectionUsage = (connections / maxConnections) * 100;

      if (connectionUsage > 90) {
        return health.setDegraded('High connection usage', {
          database: dbInfo.database,
          connections: connections,
          connectionUsage: `${connectionUsage.toFixed(1)}%`,
          isReplica: dbInfo.is_replica
        });
      }

      // Check extensions
      const extensions = await prisma.$queryRaw`
        SELECT extname FROM pg_extension
        WHERE extname IN ('vector', 'uuid-ossp', 'pg_stat_statements')
      `;

      return health.setHealthy({
        database: dbInfo.database,
        version: dbInfo.version.split(' ')[0],
        sizeGB: (parseInt(dbInfo.size_bytes, 10) / 1024 / 1024 / 1024).toFixed(2),
        connections: connections,
        connectionUsage: `${connectionUsage.toFixed(1)}%`,
        isReplica: dbInfo.is_replica,
        extensions: extensions.map(e => e.extname),
        responseTimeMs: health.responseTime
      });

    } catch (error) {
      health.responseTime = Date.now() - startTime;
      logError('Database health check failed:', error.message);

      // Categorize the error
      if (error.message.includes('P1001') || error.message.includes('ECONNREFUSED')) {
        return health.setUnhealthy('Database connection refused - server may be down', error);
      } else if (error.message.includes('P1002') || error.message.includes('timeout')) {
        return health.setUnhealthy('Database connection timeout - network issue or high load', error);
      } else if (error.message.includes('P1003') || error.message.includes('does not exist')) {
        return health.setUnhealthy('Database does not exist', error);
      } else if (error.message.includes('authentication')) {
        return health.setUnhealthy('Database authentication failed', error);
      } else {
        return health.setUnhealthy('Database check failed', error);
      }
    }
  }

  // Check MCP server health
  async checkMCPServer() {
    const health = new ComponentHealth('mcp_server');
    const startTime = Date.now();

    try {
      const response = await axios.get(`${this.mcpConfig.url}/health`, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${this.mcpConfig.auth.jwt_secret}`,
          'X-Environment': this.mcpConfig.environment
        },
        validateStatus: () => true // Don't throw on non-2xx
      });

      health.responseTime = Date.now() - startTime;

      if (response.status === 200) {
        return health.setHealthy({
          url: this.mcpConfig.url,
          version: response.data?.version || 'unknown',
          status: response.data?.status || 'operational',
          services: response.data?.services || {},
          responseTimeMs: health.responseTime
        });
      } else if (response.status === 503) {
        return health.setDegraded('MCP server is starting up or under maintenance', {
          url: this.mcpConfig.url,
          httpStatus: response.status,
          message: response.data?.message
        });
      } else if (response.status === 401 || response.status === 403) {
        return health.setDegraded('MCP server authentication issue', {
          url: this.mcpConfig.url,
          httpStatus: response.status
        });
      } else {
        return health.setDegraded(`MCP server returned status ${response.status}`, {
          url: this.mcpConfig.url,
          httpStatus: response.status
        });
      }

    } catch (error) {
      health.responseTime = Date.now() - startTime;

      if (error.code === 'ECONNREFUSED') {
        return health.setDegraded('MCP server is not running or not accessible', {
          url: this.mcpConfig.url,
          error: 'Connection refused'
        });
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return health.setDegraded('MCP server request timeout', {
          url: this.mcpConfig.url,
          error: 'Request timeout'
        });
      } else if (error.code === 'ENOTFOUND') {
        return health.setUnhealthy('MCP server URL not found', error);
      } else {
        return health.setDegraded('MCP server check failed', {
          url: this.mcpConfig.url,
          error: error.message
        });
      }
    }
  }

  // Check external API integrations
  async checkAPIIntegrations() {
    const health = new ComponentHealth('api_integrations');
    const integrations = {};

    // Check Clerk (if configured)
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const response = await axios.get('https://api.clerk.dev/v1/users?limit=1', {
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`
          },
          timeout: 3000
        });
        integrations.clerk = response.status === 200 ? 'connected' : 'error';
      } catch (error) {
        integrations.clerk = 'unavailable';
      }
    } else {
      integrations.clerk = 'not_configured';
    }

    // Check other integrations (without making actual calls to preserve rate limits)
    integrations.xero = process.env.XERO_CLIENT_ID ? 'configured' : 'not_configured';
    integrations.shopify = process.env.SHOPIFY_UK_API_KEY ? 'configured' : 'not_configured';
    integrations.unleashed = process.env.UNLEASHED_API_KEY ? 'configured' : 'not_configured';
    integrations.openai = process.env.OPENAI_API_KEY ? 'configured' : 'not_configured';
    integrations.anthropic = process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured';

    const configured = Object.values(integrations).filter(s => s !== 'not_configured').length;
    const total = Object.keys(integrations).length;

    if (configured === 0) {
      return health.setDegraded('No API integrations configured', { integrations });
    } else if (configured < total / 2) {
      return health.setDegraded('Some API integrations not configured', { integrations });
    } else {
      return health.setHealthy({ integrations, configured: `${configured}/${total}` });
    }
  }

  // Check system resources
  async checkSystemResources() {
    const health = new ComponentHealth('system_resources');

    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Check memory usage
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

      const metadata = {
        uptime: {
          seconds: Math.floor(uptime),
          formatted: this.formatUptime(uptime)
        },
        memory: {
          heapUsedMB: heapUsedMB.toFixed(2),
          heapTotalMB: heapTotalMB.toFixed(2),
          heapUsagePercent: heapUsagePercent.toFixed(1),
          rssMB: (memUsage.rss / 1024 / 1024).toFixed(2)
        },
        nodejs: {
          version: process.version,
          platform: process.platform,
          arch: process.arch
        }
      };

      if (heapUsagePercent > 90) {
        return health.setDegraded('High memory usage detected', metadata);
      } else if (heapUsagePercent > 75) {
        return health.setDegraded('Moderate memory usage', metadata);
      } else {
        return health.setHealthy(metadata);
      }

    } catch (error) {
      return health.setUnhealthy('Failed to check system resources', error);
    }
  }

  // Format uptime to human-readable string
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

  // Get overall system health
  async getOverallHealth() {
    const startTime = Date.now();

    // Check if we have cached results
    const cacheKey = 'overall_health';
    const cached = this.healthCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    // Run all health checks in parallel
    const [database, mcpServer, apiIntegrations, systemResources] = await Promise.all([
      this.checkDatabase(),
      this.checkMCPServer(),
      this.checkAPIIntegrations(),
      this.checkSystemResources()
    ]);

    // Determine overall status
    const components = [database, mcpServer, apiIntegrations, systemResources];
    const unhealthy = components.filter(c => c.status === STATUS.UNHEALTHY).length;
    const degraded = components.filter(c => c.status === STATUS.DEGRADED).length;

    let overallStatus = STATUS.HEALTHY;
    let overallMessage = 'All systems operational';

    if (unhealthy > 0) {
      overallStatus = STATUS.UNHEALTHY;
      overallMessage = `${unhealthy} component(s) unhealthy`;
    } else if (degraded > 0) {
      overallStatus = STATUS.DEGRADED;
      overallMessage = `${degraded} component(s) degraded`;
    }

    const result = {
      status: overallStatus,
      message: overallMessage,
      timestamp: new Date().toISOString(),
      environment: process.env.BRANCH || process.env.NODE_ENV || 'unknown',
      responseTime: Date.now() - startTime,
      components: {
        database: database.toJSON(),
        mcp_server: mcpServer.toJSON(),
        api_integrations: apiIntegrations.toJSON(),
        system_resources: systemResources.toJSON()
      }
    };

    // Cache the result
    this.healthCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });

    return result;
  }

  // Clean up resources
  async cleanup() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
    this.healthCache.clear();
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();

// Export default
export default HealthCheckService;