#!/usr/bin/env node

/**
 * Advanced Health Check Script for Sentia MCP Server
 * 
 * Comprehensive health validation including:
 * - Server responsiveness
 * - Database connectivity
 * - Integration services status
 * - Memory and performance metrics
 * - Security monitoring
 * 
 * Used by Docker HEALTHCHECK and monitoring systems
 */

import { createLogger } from '../src/utils/logger.js';
import { SERVER_CONFIG } from '../src/config/server-config.js';
import http from 'http';
import { URL } from 'url';
import process from 'process';

const logger = createLogger();

/**
 * Health check configuration
 */
const HEALTH_CONFIG = {
  timeout: 10000, // 10 seconds
  retries: 3,
  endpoints: {
    main: `http://localhost:${SERVER_CONFIG.server.port}/health`,
    api: `http://localhost:${SERVER_CONFIG.server.port + 1}/health`,
    metrics: `http://localhost:${SERVER_CONFIG.server.port}/api/metrics`
  },
  thresholds: {
    maxMemoryUsageMB: 2048, // 2GB
    maxResponseTimeMs: 5000, // 5 seconds
    minUptimeMs: 10000 // 10 seconds minimum uptime
  }
};

/**
 * Health check result tracking
 */
class HealthCheckResult {
  constructor() {
    this.status = 'healthy';
    this.checks = {};
    this.metrics = {};
    this.errors = [];
    this.warnings = [];
    this.timestamp = new Date().toISOString();
  }

  addCheck(name, status, details = {}) {
    this.checks[name] = {
      status,
      details,
      timestamp: new Date().toISOString()
    };

    if (status === 'unhealthy') {
      this.status = 'unhealthy';
      this.errors.push(`${name}: ${details.error || 'Check failed'}`);
    } else if (status === 'degraded') {
      if (this.status === 'healthy') {
        this.status = 'degraded';
      }
      this.warnings.push(`${name}: ${details.warning || 'Performance degraded'}`);
    }
  }

  addMetric(name, value, unit = '') {
    this.metrics[name] = { value, unit, timestamp: new Date().toISOString() };
  }

  getExitCode() {
    switch (this.status) {
      case 'healthy': return 0;
      case 'degraded': return 0; // Still healthy for Docker
      case 'unhealthy': return 1;
      default: return 1;
    }
  }

  toJSON() {
    return {
      status: this.status,
      checks: this.checks,
      metrics: this.metrics,
      errors: this.errors,
      warnings: this.warnings,
      timestamp: this.timestamp
    };
  }
}

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, timeout = HEALTH_CONFIG.timeout) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const startTime = Date.now();

    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'GET',
      timeout: timeout
    }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data: parsedData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data: data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Check server endpoints
 */
async function checkServerEndpoints(result) {
  for (const [name, url] of Object.entries(HEALTH_CONFIG.endpoints)) {
    try {
      const response = await makeRequest(url, 5000);
      
      if (response.statusCode === 200) {
        result.addCheck(`endpoint_${name}`, 'healthy', {
          responseTime: response.responseTime,
          statusCode: response.statusCode
        });
        
        result.addMetric(`${name}_response_time`, response.responseTime, 'ms');
        
        // Check response time threshold
        if (response.responseTime > HEALTH_CONFIG.thresholds.maxResponseTimeMs) {
          result.addCheck(`endpoint_${name}_performance`, 'degraded', {
            warning: `Slow response time: ${response.responseTime}ms`,
            threshold: HEALTH_CONFIG.thresholds.maxResponseTimeMs
          });
        }
      } else {
        result.addCheck(`endpoint_${name}`, 'unhealthy', {
          error: `HTTP ${response.statusCode}`,
          responseTime: response.responseTime
        });
      }
    } catch (error) {
      result.addCheck(`endpoint_${name}`, 'unhealthy', {
        error: error.message
      });
    }
  }
}

/**
 * Check system metrics
 */
async function checkSystemMetrics(result) {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime() * 1000; // Convert to milliseconds

    // Memory metrics
    const memoryUsageMB = Math.round(memoryUsage.rss / 1024 / 1024);
    result.addMetric('memory_usage', memoryUsageMB, 'MB');
    result.addMetric('heap_used', Math.round(memoryUsage.heapUsed / 1024 / 1024), 'MB');
    result.addMetric('heap_total', Math.round(memoryUsage.heapTotal / 1024 / 1024), 'MB');

    // CPU metrics
    result.addMetric('cpu_user', Math.round(cpuUsage.user / 1000), 'ms');
    result.addMetric('cpu_system', Math.round(cpuUsage.system / 1000), 'ms');

    // Uptime metrics
    result.addMetric('uptime', Math.round(uptime), 'ms');

    // Health checks based on thresholds
    if (memoryUsageMB > HEALTH_CONFIG.thresholds.maxMemoryUsageMB) {
      result.addCheck('memory_usage', 'degraded', {
        warning: `High memory usage: ${memoryUsageMB}MB`,
        threshold: HEALTH_CONFIG.thresholds.maxMemoryUsageMB
      });
    } else {
      result.addCheck('memory_usage', 'healthy', {
        memoryUsageMB,
        threshold: HEALTH_CONFIG.thresholds.maxMemoryUsageMB
      });
    }

    if (uptime < HEALTH_CONFIG.thresholds.minUptimeMs) {
      result.addCheck('uptime', 'degraded', {
        warning: `Server recently restarted: ${Math.round(uptime/1000)}s ago`,
        threshold: Math.round(HEALTH_CONFIG.thresholds.minUptimeMs/1000)
      });
    } else {
      result.addCheck('uptime', 'healthy', {
        uptimeSeconds: Math.round(uptime/1000)
      });
    }

  } catch (error) {
    result.addCheck('system_metrics', 'unhealthy', {
      error: error.message
    });
  }
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnectivity(result) {
  if (!SERVER_CONFIG.database?.url) {
    result.addCheck('database', 'degraded', {
      warning: 'No database URL configured'
    });
    return;
  }

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: SERVER_CONFIG.database.url,
      max: 1,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 1000
    });

    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      const queryResult = await client.query('SELECT NOW() as current_time, version() as db_version');
      const responseTime = Date.now() - startTime;
      
      result.addCheck('database', 'healthy', {
        responseTime,
        version: queryResult.rows[0]?.db_version?.split(' ')[0]
      });
      
      result.addMetric('database_response_time', responseTime, 'ms');
    } finally {
      client.release();
    }
    
    await pool.end();
  } catch (error) {
    result.addCheck('database', 'unhealthy', {
      error: error.message
    });
  }
}

/**
 * Check integration services status
 */
async function checkIntegrationServices(result) {
  try {
    // Check if we can access the metrics endpoint for integration status
    const response = await makeRequest(HEALTH_CONFIG.endpoints.metrics, 3000);
    
    if (response.statusCode === 200 && response.data) {
      const integrations = response.data.integrations || {};
      const integrationCount = Object.keys(integrations).length;
      
      result.addMetric('active_integrations', integrationCount, 'count');
      
      if (integrationCount > 0) {
        result.addCheck('integrations', 'healthy', {
          count: integrationCount,
          services: Object.keys(integrations)
        });
      } else {
        result.addCheck('integrations', 'degraded', {
          warning: 'No active integrations detected'
        });
      }
    } else {
      result.addCheck('integrations', 'degraded', {
        warning: 'Unable to fetch integration metrics'
      });
    }
  } catch (error) {
    result.addCheck('integrations', 'degraded', {
      warning: `Integration check failed: ${error.message}`
    });
  }
}

/**
 * Check security monitoring status
 */
async function checkSecurityStatus(result) {
  try {
    // Check for any security alerts or issues
    const securityConfig = {
      authEnabled: SERVER_CONFIG.security?.authRequired || false,
      rateLimitEnabled: SERVER_CONFIG.security?.rateLimiting?.enabled || false,
      encryptionEnabled: SERVER_CONFIG.security?.encryption?.enabled || false
    };

    const securityScore = Object.values(securityConfig).filter(Boolean).length;
    
    result.addMetric('security_features_enabled', securityScore, 'count');
    
    if (securityScore >= 2) {
      result.addCheck('security', 'healthy', {
        featuresEnabled: securityScore,
        config: securityConfig
      });
    } else {
      result.addCheck('security', 'degraded', {
        warning: `Only ${securityScore} security features enabled`,
        config: securityConfig
      });
    }
  } catch (error) {
    result.addCheck('security', 'degraded', {
      warning: `Security check failed: ${error.message}`
    });
  }
}

/**
 * Main health check function
 */
async function performHealthCheck() {
  const result = new HealthCheckResult();
  
  try {
    // Run all health checks in parallel for better performance
    await Promise.all([
      checkServerEndpoints(result),
      checkSystemMetrics(result),
      checkDatabaseConnectivity(result),
      checkIntegrationServices(result),
      checkSecurityStatus(result)
    ]);

    return result;
  } catch (error) {
    result.addCheck('health_check_system', 'unhealthy', {
      error: `Health check system failure: ${error.message}`
    });
    return result;
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  
  try {
    const result = await performHealthCheck();
    const duration = Date.now() - startTime;
    
    result.addMetric('health_check_duration', duration, 'ms');
    
    // Output results
    if (process.env.HEALTH_CHECK_VERBOSE === 'true' || process.env.NODE_ENV === 'development') {
      console.log('=== Sentia MCP Server Health Check ===');
      console.log(`Status: ${result.status.toUpperCase()}`);
      console.log(`Duration: ${duration}ms`);
      console.log('');
      
      if (result.errors.length > 0) {
        console.log('ERRORS:');
        result.errors.forEach(error => console.log(`  - ${error}`));
        console.log('');
      }
      
      if (result.warnings.length > 0) {
        console.log('WARNINGS:');
        result.warnings.forEach(warning => console.log(`  - ${warning}`));
        console.log('');
      }
      
      console.log('CHECKS:');
      Object.entries(result.checks).forEach(([name, check]) => {
        console.log(`  ${name}: ${check.status.toUpperCase()}`);
      });
      
      console.log('');
      console.log('METRICS:');
      Object.entries(result.metrics).forEach(([name, metric]) => {
        console.log(`  ${name}: ${metric.value}${metric.unit}`);
      });
    } else {
      // Minimal output for production
      console.log(JSON.stringify(result.toJSON()));
    }
    
    // Log to system logger
    if (result.status === 'healthy') {
      logger.debug('Health check passed', result.toJSON());
    } else if (result.status === 'degraded') {
      logger.warn('Health check shows degraded performance', result.toJSON());
    } else {
      logger.error('Health check failed', result.toJSON());
    }
    
    process.exit(result.getExitCode());
    
  } catch (error) {
    console.error('Fatal error during health check:', error.message);
    logger.error('Health check system failure', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Handle signals gracefully
process.on('SIGTERM', () => {
  console.log('Health check interrupted by SIGTERM');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Health check interrupted by SIGINT');
  process.exit(1);
});

// Set timeout for entire health check
setTimeout(() => {
  console.error('Health check timeout exceeded');
  process.exit(1);
}, HEALTH_CONFIG.timeout);

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { performHealthCheck, HealthCheckResult };