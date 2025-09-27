#!/usr/bin/env node

/**
 * Render Deployment Verification Script
 * Checks all environments and ensures everything is properly configured
 */

import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);

// Environment configurations
const ENVIRONMENTS = {
  development: {
    name: 'Development',
    url: 'https://sentia-manufacturing-development.onrender.com',
    branch: 'development',
    database: 'sentia-db-development'
  },
  testing: {
    name: 'Testing/UAT',
    url: 'https://sentia-manufacturing-testing.onrender.com',
    branch: 'test',
    database: 'sentia-db-testing'
  },
  production: {
    name: 'Production',
    url: 'https://sentia-manufacturing-production.onrender.com',
    branch: 'production',
    database: 'sentia-db-production'
  }
};

// Required environment variables for each service
const REQUIREDENV_VARS = [
  'DATABASE_URL',
  'NODE_ENV',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'XERO_CLIENT_ID',
  'XERO_CLIENT_SECRET',
  'SHOPIFY_UK_API_KEY',
  'SHOPIFY_UK_ACCESS_TOKEN',
  'SHOPIFY_USA_API_KEY',
  'SHOPIFY_USA_ACCESS_TOKEN',
  'UNLEASHED_API_ID',
  'UNLEASHED_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'MCP_SERVER_URL'
];

// API endpoints to check
const HEALTHENDPOINTS = [
  '/health',
  '/api/health/database',
  '/api/integrations/status',
  '/api/mcp/health',
  '/api/auth/status'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to make HTTP requests
function checkEndpoint(url) {
  return new Promise(_(resolve, _reject) => {
    https.get(url, _(res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', _() => {
        resolve({
          status: res.statusCode,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    }).on('error', _(err) => {
      resolve({
        status: 0,
        data: err.message,
        success: false
      });
    });
  });
}

// Check if service is deployed
async function checkServiceDeployment(env) {
  console.log(`\n${colors.cyan}Checking ${env.name} deployment...${colors.reset}`);

  const result = await checkEndpoint(env.url + '/health');

  if (result.success) {
    console.log(`${colors.green}✓${colors.reset} Service is deployed and responding`);
    return true;
  } else {
    console.log(`${colors.red}✗${colors.reset} Service not responding (Status: ${result.status})`);
    return false;
  }
}

// Check all health endpoints
async function checkHealthEndpoints(env) {
  console.log(`\n${colors.cyan}Checking health endpoints for ${env.name}...${colors.reset}`);

  let allHealthy = true;

  for (const endpoint of HEALTH_ENDPOINTS) {
    const url = env.url + endpoint;
    const result = await checkEndpoint(url);

    if (result.success) {
      console.log(`${colors.green}✓${colors.reset} ${endpoint} - OK`);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${endpoint} - Failed (${result.status})`);
      allHealthy = false;
    }
  }

  return allHealthy;
}

// Check database connectivity
async function checkDatabase(env) {
  console.log(`\n${colors.cyan}Checking database for ${env.name}...${colors.reset}`);

  const result = await checkEndpoint(env.url + '/api/health/database');

  if (result.success) {
    try {
      const data = JSON.parse(result.data);
      console.log(`${colors.green}✓${colors.reset} Database connected`);
      console.log(`  - Status: ${data.status}`);
      console.log(`  - Tables: ${data.tables || 'N/A'}`);
      return true;
    } catch (e) {
      console.log(`${colors.yellow}⚠${colors.reset} Database endpoint responded but data unclear`);
      return false;
    }
  } else {
    console.log(`${colors.red}✗${colors.reset} Database not connected`);
    return false;
  }
}

// Check API integrations
async function checkIntegrations(env) {
  console.log(`\n${colors.cyan}Checking API integrations for ${env.name}...${colors.reset}`);

  const result = await checkEndpoint(env.url + '/api/integrations/status');

  if (result.success) {
    try {
      const data = JSON.parse(result.data);
      console.log(`${colors.green}✓${colors.reset} Integrations endpoint responding`);

      const integrations = ['xero', 'shopify_uk', 'shopify_usa', 'unleashed', 'mcp_server'];
      for (const integration of integrations) {
        if (data[integration] === 'connected') {
          console.log(`  ${colors.green}✓${colors.reset} ${integration}: connected`);
        } else {
          console.log(`  ${colors.yellow}⚠${colors.reset} ${integration}: ${data[integration] || 'not configured'}`);
        }
      }
      return true;
    } catch (e) {
      console.log(`${colors.yellow}⚠${colors.reset} Integration status unclear`);
      return false;
    }
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} Integration endpoint not available`);
    return false;
  }
}

// Main verification function
async function verifyEnvironment(envKey) {
  const env = ENVIRONMENTS[envKey];
  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Verifying ${env.name} Environment${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`URL: ${env.url}`);
  console.log(`Branch: ${env.branch}`);
  console.log(`Database: ${env.database}`);

  const results = {
    deployment: false,
    health: false,
    database: false,
    integrations: false
  };

  // Check if service is deployed
  results.deployment = await checkServiceDeployment(env);

  if (results.deployment) {
    // Check health endpoints
    results.health = await checkHealthEndpoints(env);

    // Check database
    results.database = await checkDatabase(env);

    // Check integrations
    results.integrations = await checkIntegrations(env);
  }

  // Summary
  console.log(`\n${colors.cyan}Summary for ${env.name}:${colors.reset}`);
  console.log(`Deployment: ${results.deployment ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Health: ${results.health ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Database: ${results.database ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Integrations: ${results.integrations ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);

  return results;
}

// Verify all environments
async function verifyAllEnvironments() {
  console.log(`${colors.blue}Render Deployment Verification Tool${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log('Checking all three environments...\n');

  const results = {};

  // Check each environment
  for (const envKey of Object.keys(ENVIRONMENTS)) {
    results[envKey] = await verifyEnvironment(envKey);
  }

  // Final summary
  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}FINAL VERIFICATION SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);

  let allGood = true;

  for (const [envKey, result] of Object.entries(results)) {
    const env = ENVIRONMENTS[envKey];
    const isHealthy = result.deployment && result.health && result.database;

    if (isHealthy) {
      console.log(`${colors.green}✓ ${env.name}: FULLY OPERATIONAL${colors.reset}`);
    } else if (result.deployment) {
      console.log(`${colors.yellow}⚠ ${env.name}: PARTIALLY OPERATIONAL${colors.reset}`);
      allGood = false;
    } else {
      console.log(`${colors.red}✗ ${env.name}: NOT DEPLOYED${colors.reset}`);
      allGood = false;
    }
  }

  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);

  if (allGood) {
    console.log(`${colors.green}SUCCESS: All environments are fully operational!${colors.reset}`);
    console.log(`${colors.green}You can now safely cancel your Neon subscription.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}WARNING: Some environments need attention.${colors.reset}`);
    console.log(`${colors.yellow}Please fix issues before canceling Neon.${colors.reset}`);
  }

  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
}

// Run verification based on command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Verify all environments
  verifyAllEnvironments().catch(console.error);
} else if (ENVIRONMENTS[args[0]]) {
  // Verify specific environment
  verifyEnvironment(args[0]).catch(console.error);
} else {
  console.log('Usage: node verify-render-deployment.js [environment]');
  console.log('Environments: development, testing, production');
  console.log('Leave empty to check all environments');
}