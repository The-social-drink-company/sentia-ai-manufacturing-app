#!/usr/bin/env node

/**
 * HEALTH CHECK MONITORING SCRIPT
 * Tests all health check endpoints across all environments
 */

import axios from 'axios';

const ENVIRONMENTS = {
  development: 'https://sentia-manufacturing-development.onrender.com',
  testing: 'https://sentia-manufacturing-testing.onrender.com',
  production: 'https://sentia-manufacturing-production.onrender.com'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Status icons
const icons = {
  success: `${colors.green}✓${colors.reset}`,
  warning: `${colors.yellow}⚠${colors.reset}`,
  error: `${colors.red}✗${colors.reset}`,
  info: `${colors.cyan}ℹ${colors.reset}`
};

// Format status with color
function formatStatus(status) {
  switch (status) {
    case 'healthy':
      return `${colors.green}${status}${colors.reset}`;
    case 'degraded':
      return `${colors.yellow}${status}${colors.reset}`;
    case 'unhealthy':
      return `${colors.red}${status}${colors.reset}`;
    default:
      return status;
  }
}

// Test a single endpoint
async function testEndpoint(name, url, timeout = 10000) {
  const startTime = Date.now();

  try {
    const response = await axios.get(url, {
      timeout,
      validateStatus: () => true // Accept any status
    });

    const responseTime = Date.now() - startTime;
    const status = response.status;

    if (status === 200) {
      return {
        success: true,
        status,
        data: response.data,
        responseTime
      };
    } else if (status === 503) {
      return {
        success: false,
        status,
        data: response.data,
        responseTime,
        message: 'Service unavailable'
      };
    } else {
      return {
        success: false,
        status,
        data: response.data,
        responseTime,
        message: `Unexpected status: ${status}`
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Connection refused',
        message: 'Service is not running',
        responseTime
      };
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Timeout',
        message: `Request timeout after ${timeout}ms`,
        responseTime
      };
    } else {
      return {
        success: false,
        error: error.code || 'Unknown',
        message: error.message,
        responseTime
      };
    }
  }
}

// Test all health endpoints for an environment
async function testEnvironment(envName, baseUrl) {
  console.log(`\n${colors.bright}${colors.blue}Testing ${envName.toUpperCase()}${colors.reset}`);
  console.log('='.repeat(60));

  const endpoints = [
    { name: 'Main Health', path: '/health' },
    { name: 'Liveness', path: '/health/live' },
    { name: 'Readiness', path: '/health/ready' },
    { name: 'API Config', path: '/api/config' },
    { name: 'Database Test', path: '/api/db/test' }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint.path}`;
    process.stdout.write(`  ${endpoint.name.padEnd(15)}`);

    const result = await testEndpoint(endpoint.name, url);
    results.push({ ...result, endpoint: endpoint.name });

    if (result.success) {
      console.log(`${icons.success} ${colors.green}OK${colors.reset} (${result.responseTime}ms)`);

      // Show detailed status for main health endpoint
      if (endpoint.path === '/health' && result.data) {
        const health = result.data;
        console.log(`    Overall: ${formatStatus(health.status)}`);

        if (health.components) {
          // Database
          if (health.components.database) {
            const db = health.components.database;
            const icon = db.status === 'healthy' ? icons.success :
                         db.status === 'degraded' ? icons.warning : icons.error;
            console.log(`    ${icon} Database: ${formatStatus(db.status)}`);
            if (db.metadata?.database) {
              console.log(`       ${db.metadata.database} (${db.metadata.connections} connections)`);
            }
          }

          // MCP Server
          if (health.components.mcp_server) {
            const mcp = health.components.mcp_server;
            const icon = mcp.status === 'healthy' ? icons.success :
                         mcp.status === 'degraded' ? icons.warning : icons.error;
            console.log(`    ${icon} MCP Server: ${formatStatus(mcp.status)}`);
            if (mcp.message && mcp.status !== 'healthy') {
              console.log(`       ${mcp.message}`);
            }
          }

          // API Integrations
          if (health.components.api_integrations) {
            const apis = health.components.api_integrations;
            const icon = apis.status === 'healthy' ? icons.success :
                         apis.status === 'degraded' ? icons.warning : icons.error;
            console.log(`    ${icon} APIs: ${formatStatus(apis.status)}`);
            if (apis.metadata?.configured) {
              console.log(`       Configured: ${apis.metadata.configured}`);
            }
          }

          // System Resources
          if (health.components.system_resources) {
            const sys = health.components.system_resources;
            const icon = sys.status === 'healthy' ? icons.success :
                         sys.status === 'degraded' ? icons.warning : icons.error;
            console.log(`    ${icon} System: ${formatStatus(sys.status)}`);
            if (sys.metadata?.memory) {
              console.log(`       Memory: ${sys.metadata.memory.heapUsagePercent}% used`);
            }
            if (sys.metadata?.uptime) {
              console.log(`       Uptime: ${sys.metadata.uptime.formatted}`);
            }
          }
        }
      }
    } else {
      console.log(`${icons.error} ${colors.red}FAIL${colors.reset} - ${result.message || result.error}`);
    }
  }

  return results;
}

// Main monitoring function
async function monitorHealth() {
  console.log(`${colors.bright}${colors.cyan}SENTIA MANUFACTURING DASHBOARD - HEALTH MONITOR${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const allResults = {};

  // Test each environment
  for (const [envName, baseUrl] of Object.entries(ENVIRONMENTS)) {
    allResults[envName] = await testEnvironment(envName, baseUrl);
  }

  // Summary
  console.log(`\n${colors.bright}${colors.cyan}SUMMARY${colors.reset}`);
  console.log('='.repeat(60));

  for (const [envName, results] of Object.entries(allResults)) {
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / total;

    const statusIcon = successful === total ? icons.success :
                       successful > 0 ? icons.warning : icons.error;
    const statusColor = successful === total ? colors.green :
                        successful > 0 ? colors.yellow : colors.red;

    console.log(`${statusIcon} ${colors.bright}${envName.toUpperCase()}${colors.reset}: ` +
                `${statusColor}${successful}/${total} passed${colors.reset} ` +
                `(avg ${Math.round(avgResponseTime)}ms)`);

    // Show failed endpoints
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      failed.forEach(f => {
        console.log(`    ${icons.error} ${f.endpoint}: ${f.message || f.error}`);
      });
    }
  }

  console.log('\n' + '='.repeat(60));

  // Overall status
  const allSuccessful = Object.values(allResults).every(results =>
    results.every(r => r.success)
  );

  if (allSuccessful) {
    console.log(`${icons.success} ${colors.green}${colors.bright}ALL HEALTH CHECKS PASSED${colors.reset}`);
    process.exit(0);
  } else {
    const hasAnySuccess = Object.values(allResults).some(results =>
      results.some(r => r.success)
    );

    if (hasAnySuccess) {
      console.log(`${icons.warning} ${colors.yellow}${colors.bright}SOME HEALTH CHECKS FAILED${colors.reset}`);
      console.log('Services may be starting up or experiencing issues');
      process.exit(1);
    } else {
      console.log(`${icons.error} ${colors.red}${colors.bright}ALL HEALTH CHECKS FAILED${colors.reset}`);
      console.log('Services appear to be down');
      process.exit(2);
    }
  }
}

// Run monitoring
monitorHealth().catch(error => {
  console.error(`${icons.error} Monitor script error:`, error.message);
  process.exit(3);
});