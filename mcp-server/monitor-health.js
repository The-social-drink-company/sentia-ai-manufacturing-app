#!/usr/bin/env node

/**
 * MCP Server Health Monitor
 * Monitors health status of all MCP server deployments
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

const environments = {
  production: {
    name: 'Production',
    url: 'https://sentia-mcp-server.railway.app',
    healthEndpoint: '/health',
    providersEndpoint: '/api/providers'
  },
  test: {
    name: 'Test',
    url: 'https://test-sentia-mcp-server.railway.app',
    healthEndpoint: '/health',
    providersEndpoint: '/api/providers'
  },
  development: {
    name: 'Development',
    url: 'https://dev-sentia-mcp-server.railway.app',
    healthEndpoint: '/health',
    providersEndpoint: '/api/providers'
  }
};

const checkHealth = async (env, config) => {
  console.log(chalk.blue(`\nChecking ${config.name} environment...`));
  console.log(chalk.gray(`URL: ${config.url}`));
  
  try {
    // Check health endpoint
    const healthResponse = await fetch(`${config.url}${config.healthEndpoint}`, {
      timeout: 5000
    });
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok && healthData.status === 'healthy') {
      console.log(chalk.green('✓ Health Check: PASSED'));
      console.log(chalk.gray(`  Environment: ${healthData.environment || 'N/A'}`));
      console.log(chalk.gray(`  Version: ${healthData.version || 'N/A'}`));
      console.log(chalk.gray(`  Uptime: ${healthData.uptime || 'N/A'}`));
    } else {
      console.log(chalk.red('✗ Health Check: FAILED'));
      console.log(chalk.red(`  Status: ${healthData.status || 'Unknown'}`));
    }
    
    // Check providers endpoint
    const providersResponse = await fetch(`${config.url}${config.providersEndpoint}`, {
      timeout: 5000
    });
    const providersData = await providersResponse.json();
    
    if (providersResponse.ok && providersData.providers) {
      console.log(chalk.green('✓ Providers Check: AVAILABLE'));
      providersData.providers.forEach(provider => {
        const statusColor = provider.status === 'connected' ? chalk.green : chalk.red;
        console.log(`  ${statusColor('•')} ${provider.name}: ${provider.status}`);
      });
    } else {
      console.log(chalk.red('✗ Providers Check: UNAVAILABLE'));
    }
    
    return true;
  } catch (error) {
    console.log(chalk.red('✗ Connection FAILED'));
    console.log(chalk.red(`  Error: ${error.message}`));
    return false;
  }
};

const monitorAll = async () => {
  console.log(chalk.bold.cyan('\n========================================'));
  console.log(chalk.bold.cyan('MCP Server Health Monitor'));
  console.log(chalk.bold.cyan('========================================'));
  console.log(chalk.gray(`Timestamp: ${new Date().toISOString()}`));
  
  const results = [];
  
  for (const [env, config] of Object.entries(environments)) {
    const isHealthy = await checkHealth(env, config);
    results.push({ env: config.name, healthy: isHealthy });
  }
  
  // Summary
  console.log(chalk.bold.cyan('\n========================================'));
  console.log(chalk.bold.cyan('Summary'));
  console.log(chalk.bold.cyan('========================================'));
  
  const healthyCount = results.filter(r => r.healthy).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    const status = result.healthy ? chalk.green('✓ ONLINE') : chalk.red('✗ OFFLINE');
    console.log(`${result.env}: ${status}`);
  });
  
  console.log(chalk.bold(`\nOverall: ${healthyCount}/${totalCount} environments healthy`));
  
  if (healthyCount === totalCount) {
    console.log(chalk.green.bold('\nAll systems operational!'));
    process.exit(0);
  } else if (healthyCount > 0) {
    console.log(chalk.yellow.bold('\nSome systems degraded'));
    process.exit(1);
  } else {
    console.log(chalk.red.bold('\nAll systems offline!'));
    process.exit(2);
  }
};

// Check if specific environment is requested
const envArg = process.argv[2];
if (envArg && environments[envArg]) {
  checkHealth(envArg, environments[envArg]).then(isHealthy => {
    process.exit(isHealthy ? 0 : 1);
  });
} else if (envArg) {
  console.log(chalk.red(`Unknown environment: ${envArg}`));
  console.log(chalk.gray('Available environments: production, test, development'));
  process.exit(1);
} else {
  // Monitor all environments
  monitorAll();
}