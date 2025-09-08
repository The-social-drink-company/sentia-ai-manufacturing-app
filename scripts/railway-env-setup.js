#!/usr/bin/env node

/**
 * Railway Environment Auto-Setup Script
 * Automatically configures environment variables for Railway deployments
 * Usage: node scripts/railway-env-setup.js [environment]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Environment configuration
const ENVIRONMENTS = {
  development: {
    service: 'sentia-manufacturing-dashboard-development',
    variables: {
      NODE_ENV: 'development',
      PORT: '8080',
      VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk',
      CLERK_SECRET_KEY: 'sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq',
      VITE_API_BASE_URL: '/api',
      CORS_ORIGINS: '*',
      RAILWAY_ENVIRONMENT_NAME: 'development',
      DATABASE_URL: '${{Postgres.DATABASE_URL}}',
      ENABLE_DEBUG_ENDPOINTS: 'true',
      LOG_LEVEL: 'debug'
    }
  },
  test: {
    service: 'sentia-manufacturing-dashboard-testing',
    variables: {
      NODE_ENV: 'test',
      PORT: '8080',
      VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk',
      CLERK_SECRET_KEY: 'sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq',
      VITE_API_BASE_URL: '/api',
      CORS_ORIGINS: '*',
      RAILWAY_ENVIRONMENT_NAME: 'test',
      DATABASE_URL: '${{Postgres.DATABASE_URL}}',
      ENABLE_DEBUG_ENDPOINTS: 'true',
      LOG_LEVEL: 'info'
    }
  },
  production: {
    service: 'sentia-manufacturing-dashboard-production',
    variables: {
      NODE_ENV: 'production',
      PORT: '8080',
      VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk',
      CLERK_SECRET_KEY: 'sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq',
      VITE_API_BASE_URL: '/api',
      CORS_ORIGINS: '*',
      RAILWAY_ENVIRONMENT_NAME: 'production',
      DATABASE_URL: '${{Postgres.DATABASE_URL}}',
      ENABLE_DEBUG_ENDPOINTS: 'false',
      LOG_LEVEL: 'error'
    }
  }
};

/**
 * Execute Railway CLI command with error handling
 */
function execRailway(command, options = {}) {
  try {
    console.log(`Executing: railway ${command}`);
    const result = execSync(`railway ${command}`, {
      stdio: 'pipe',
      encoding: 'utf8',
      ...options
    });
    return result.trim();
  } catch (error) {
    console.error(`Railway command failed: ${error.message}`);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    throw error;
  }
}

/**
 * Check if Railway CLI is installed and authenticated
 */
function checkRailwaySetup() {
  console.log('Checking Railway CLI setup...');
  
  try {
    // Check if railway CLI is available
    const version = execRailway('--version');
    console.log(`Railway CLI version: ${version}`);
    
    // Check authentication
    const whoami = execRailway('whoami');
    console.log(`Authenticated as: ${whoami}`);
    
    return true;
  } catch (error) {
    console.error('Railway CLI setup issue:', error.message);
    console.log('\nSetup instructions:');
    console.log('1. Install Railway CLI: npm install -g @railway/cli');
    console.log('2. Login to Railway: railway login');
    console.log('3. Link project: railway link [project-id]');
    return false;
  }
}

/**
 * Set environment variables for a Railway service
 */
function setEnvironmentVariables(environment, variables) {
  console.log(`\nSetting environment variables for ${environment}...`);
  
  const serviceName = ENVIRONMENTS[environment].service;
  
  // Switch to the correct service
  try {
    execRailway(`service ${serviceName}`);
    console.log(`Switched to service: ${serviceName}`);
  } catch (error) {
    console.error(`Failed to switch to service ${serviceName}:`, error.message);
    throw error;
  }
  
  // Set each environment variable
  let successCount = 0;
  let errorCount = 0;
  
  for (const [key, value] of Object.entries(variables)) {
    try {
      execRailway(`variables set ${key}="${value}"`);
      console.log(`✓ Set ${key}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to set ${key}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\nEnvironment setup complete for ${environment}:`);
  console.log(`✓ ${successCount} variables set successfully`);
  if (errorCount > 0) {
    console.log(`✗ ${errorCount} variables failed`);
  }
  
  return { successCount, errorCount };
}

/**
 * Deploy the service after environment setup
 */
function deployService(environment) {
  console.log(`\nDeploying ${environment} service...`);
  
  try {
    const serviceName = ENVIRONMENTS[environment].service;
    execRailway(`service ${serviceName}`);
    
    // Trigger a deployment
    const result = execRailway('up --detach');
    console.log(`✓ Deployment triggered for ${environment}`);
    console.log(`Deployment ID: ${result}`);
    
    return true;
  } catch (error) {
    console.error(`✗ Deployment failed for ${environment}:`, error.message);
    return false;
  }
}

/**
 * Verify service health after deployment
 */
function verifyServiceHealth(environment) {
  console.log(`\nVerifying ${environment} service health...`);
  
  const healthUrls = {
    development: 'https://sentia-manufacturing-dashboard-development.up.railway.app/api/health',
    test: 'https://sentiatest.financeflo.ai/api/health',
    production: 'https://sentia-manufacturing-dashboard-production.up.railway.app/api/health'
  };
  
  const healthUrl = healthUrls[environment];
  if (!healthUrl) {
    console.error(`No health URL configured for ${environment}`);
    return false;
  }
  
  console.log(`Health check URL: ${healthUrl}`);
  console.log('Note: Health check verification requires manual testing after deployment completes');
  
  return true;
}

/**
 * Main setup function
 */
async function setupRailwayEnvironment(targetEnvironment = null) {
  console.log('=== Railway Environment Auto-Setup ===\n');
  
  // Check Railway CLI setup
  if (!checkRailwaySetup()) {
    process.exit(1);
  }
  
  // Determine which environments to setup
  const environmentsToSetup = targetEnvironment 
    ? [targetEnvironment]
    : Object.keys(ENVIRONMENTS);
  
  // Validate environment names
  for (const env of environmentsToSetup) {
    if (!ENVIRONMENTS[env]) {
      console.error(`Invalid environment: ${env}`);
      console.log(`Available environments: ${Object.keys(ENVIRONMENTS).join(', ')}`);
      process.exit(1);
    }
  }
  
  console.log(`Setting up environments: ${environmentsToSetup.join(', ')}\n`);
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  // Setup each environment
  for (const env of environmentsToSetup) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`SETTING UP: ${env.toUpperCase()}`);
      console.log(`${'='.repeat(50)}`);
      
      const variables = ENVIRONMENTS[env].variables;
      const result = setEnvironmentVariables(env, variables);
      
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;
      
      // Deploy the service
      if (result.errorCount === 0) {
        deployService(env);
        verifyServiceHealth(env);
      } else {
        console.log(`Skipping deployment for ${env} due to environment variable errors`);
      }
      
    } catch (error) {
      console.error(`Failed to setup ${env}:`, error.message);
      totalErrors++;
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SETUP SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total variables set: ${totalSuccess}`);
  console.log(`Total errors: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('\n✅ All environments configured successfully!');
    console.log('\nNext steps:');
    console.log('1. Wait for deployments to complete (2-3 minutes)');
    console.log('2. Test health endpoints manually');
    console.log('3. Verify admin panel functionality');
  } else {
    console.log('\n⚠️  Some errors occurred during setup');
    console.log('Please review the output above and retry failed operations');
  }
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const environment = args[0];
  
  if (environment && !ENVIRONMENTS[environment]) {
    console.error(`Invalid environment: ${environment}`);
    console.log(`Available environments: ${Object.keys(ENVIRONMENTS).join(', ')}`);
    console.log('\nUsage:');
    console.log('  node scripts/railway-env-setup.js                 # Setup all environments');
    console.log('  node scripts/railway-env-setup.js development     # Setup specific environment');
    process.exit(1);
  }
  
  setupRailwayEnvironment(environment).catch(error => {
    console.error('Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  setupRailwayEnvironment,
  ENVIRONMENTS
};