#!/usr/bin/env node

/**
 * Deployment Health Check Monitor
 * Continuously monitors the health of Sentia Manufacturing Dashboard deployments
 * Usage: node scripts/monitor-deployment.js
 */

import fetch from 'node-fetch';
import chalk from 'chalk';
import ora from 'ora';

const ENVIRONMENTS = {
  development: 'https://sentia-manufacturing-development.onrender.com',
  production: 'https://sentia-manufacturing-production.onrender.com',
  mcp: 'https://mcp-server-tkyu.onrender.com'
};

const ENDPOINTS = {
  health: '/health',
  api_status: '/api/status',
  auth_check: '/api/auth/check'
};

// Test results storage
const results = {
  development: {},
  production: {},
  mcp: {}
};

// Check interval (5 minutes)
const CHECKINTERVAL = 5 * 60 * 1000;

/**
 * Check if a service is healthy
 */
async function checkHealth(env, url) {
  const spinner = ora(`Checking ${env} health...`).start();
  
  try {
    const response = await fetch(`${url}/health`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Sentia-Monitor/1.0'
      }
    });
    
    const responseTime = response.headers.get('x-response-time') || 'N/A';
    
    if (response.ok) {
      const data = await response.json();
      spinner.succeed(chalk.green(`${env}: Healthy (${response.status}) - Response time: ${responseTime}ms`));
      
      results[env].health = {
        status: 'healthy',
        code: response.status,
        timestamp: new Date().toISOString(),
        responseTime,
        data
      };
      
      return true;
    } else {
      spinner.fail(chalk.red(`${env}: Unhealthy (${response.status}))`));
      results[env].health = {
        status: 'unhealthy',
        code: response.status,
        timestamp: new Date().toISOString()
      };
      return false;
    }
  } catch (error) {
    spinner.fail(chalk.red(`${env}: Failed - ${error.message}`));
    results[env].health = {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    return false;
  }
}

/**
 * Check API functionality
 */
async function checkAPI(env, url) {
  if (env === 'mcp') return; // Skip API check for MCP server
  
  const spinner = ora(`Testing ${env} API...`).start();
  
  try {
    const response = await fetch(`${url}/api/status`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Sentia-Monitor/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      spinner.succeed(chalk.green(`${env} API: Operational`));
      
      results[env].api = {
        status: 'operational',
        version: data.version,
        timestamp: new Date().toISOString()
      };
      
      return true;
    } else {
      spinner.fail(chalk.yellow(`${env} API: Degraded (${response.status}))`));
      results[env].api = {
        status: 'degraded',
        code: response.status,
        timestamp: new Date().toISOString()
      };
      return false;
    }
  } catch (error) {
    spinner.fail(chalk.red(`${env} API: Failed - ${error.message}`));
    results[env].api = {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    return false;
  }
}

/**
 * Check authentication status
 */
async function checkAuth(env, url) {
  if (env === 'mcp') return; // Skip auth check for MCP server
  
  const spinner = ora(`Checking ${env} authentication...`).start();
  
  try {
    // Check if Clerk is responding
    const response = await fetch(`${url}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Sentia-Monitor/1.0'
      }
    });
    
    const html = await response.text();
    const hasClerkKey = html.includes('pk_live') || html.includes('pk_test_');
    
    if (hasClerkKey) {
      spinner.succeed(chalk.green(`${env}: Clerk authentication configured`));
      results[env].auth = {
        status: 'configured',
        timestamp: new Date().toISOString()
      };
      return true;
    } else {
      spinner.warn(chalk.yellow(`${env}: Clerk authentication not detected`));
      results[env].auth = {
        status: 'not_configured',
        timestamp: new Date().toISOString()
      };
      return false;
    }
  } catch (error) {
    spinner.fail(chalk.red(`${env} Auth: Check failed - ${error.message}`));
    results[env].auth = {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    return false;
  }
}

/**
 * Display summary dashboard
 */
function displaySummary() {
  console.log('\n' + chalk.bold.cyan('='.repeat(60)));
  console.log(chalk.bold.cyan(' DEPLOYMENT STATUS SUMMARY'));
  console.log(chalk.bold.cyan('='.repeat(60)) + '\n');
  
  const table = [];
  
  for (const [env, url] of Object.entries(ENVIRONMENTS)) {
    const envResults = results[env];
    const status = [];
    
    // Health status
    if (envResults.health) {
      const healthIcon = envResults.health.status === 'healthy' ? '✅' : '❌';
      status.push(`Health: ${healthIcon}`);
    }
    
    // API status
    if (envResults.api) {
      const apiIcon = envResults.api.status === 'operational' ? '✅' : 
                      envResults.api.status === 'degraded' ? '⚠️' : '❌';
      status.push(`API: ${apiIcon}`);
    }
    
    // Auth status
    if (envResults.auth) {
      const authIcon = envResults.auth.status === 'configured' ? '✅' : '⚠️';
      status.push(`Auth: ${authIcon}`);
    }
    
    console.log(chalk.bold(`${env.toUpperCase()}:`));
    console.log(`  URL: ${chalk.blue(url)}`);
    console.log(`  Status: ${status.join(' | ')}`);
    
    if (envResults.health?.responseTime) {
      console.log(`  Response Time: ${chalk.green(envResults.health.responseTime + 'ms')}`);
    }
    
    if (envResults.api?.version) {
      console.log(`  Version: ${chalk.gray(envResults.api.version)}`);
    }
    
    console.log('');
  }
  
  console.log(chalk.gray(`Last checked: ${new Date().toLocaleString()}`));
  console.log(chalk.gray(`Next check in: ${CHECK_INTERVAL / 1000 / 60} minutes`));
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
  console.clear();
  console.log(chalk.bold.blue('🏭 Sentia Manufacturing Dashboard - Deployment Monitor'));
  console.log(chalk.gray('Monitoring production deployments...\n'));
  
  for (const [env, url] of Object.entries(ENVIRONMENTS)) {
    await checkHealth(env, url);
    await checkAPI(env, url);
    await checkAuth(env, url);
    console.log(''); // Add spacing between environments
  }
  
  displaySummary();
}

/**
 * Test specific features
 */
async function testFeatures() {
  console.log('\n' + chalk.bold.yellow('Feature Testing:'));
  
  const features = [
    { name: 'Working Capital', path: '/working-capital' },
    { name: 'What-If Analysis', path: '/what-if' },
    { name: 'Forecasting', path: '/forecasting' },
    { name: 'Inventory', path: '/inventory' }
  ];
  
  for (const feature of features) {
    const spinner = ora(`Testing ${feature.name}...`).start();
    
    try {
      const response = await fetch(`${ENVIRONMENTS.production}${feature.path}`, {
        timeout: 5000,
        redirect: 'manual'
      });
      
      if (response.status === 200 || response.status === 302) {
        spinner.succeed(chalk.green(`${feature.name}: Available`));
      } else {
        spinner.warn(chalk.yellow(`${feature.name}: Status ${response.status}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`${feature.name}: Failed`));
    }
  }
}

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  console.log(chalk.bold.green('Starting deployment monitoring...\n'));
  
  // Initial check
  await runHealthChecks();
  await testFeatures();
  
  // Set up periodic checks
  setInterval(async _() => {
    await runHealthChecks();
  }, CHECK_INTERVAL);
  
  // Handle graceful shutdown
  process.on('SIGINT', _() => {
    console.log('\n' + chalk.yellow('Stopping monitoring...'));
    process.exit(0);
  });
}

// Export for use in other scripts
export { checkHealth, checkAPI, checkAuth, results };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMonitoring().catch(error => {
    console.error(chalk.red('Monitoring error:'), error);
    process.exit(1);
  });
}