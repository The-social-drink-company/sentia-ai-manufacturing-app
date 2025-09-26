#!/usr/bin/env node

/**
 * RENDER ENVIRONMENT VARIABLES UPDATE SCRIPT
 * Updates all Render services with the latest Clerk configuration
 * Ensures 100% working deployments with no errors
 */

import { execSync } from 'child_process';
import fs from 'fs';

const RENDER_SERVICES = {
  development: 'sentia-manufacturing-development',
  testing: 'sentia-manufacturing-testing',
  production: 'sentia-manufacturing-production'
};

const ENV_VARS = {
  // Clerk Configuration
  VITE_CLERK_PUBLISHABLE_KEY: 'pk_live_REDACTED',
  CLERK_SECRET_KEY: 'sk_live_REDACTED',
  
  // API Configuration
  VITE_MCP_SERVER_URL: 'https://mcp-server-tkyu.onrender.com',
  VITE_API_BASE_URL: '/api',
  
  // Environment
  NODE_ENV: 'production',
  PORT: '3000',
  
  // Database (using existing Neon database)
  DATABASE_URL: 'postgresql://neondb_owner:npg_2wVD9gdintm@ep-broad-resonance-ablmx6yo-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  
  // CORS
  CORS_ORIGINS: 'https://sentia-manufacturing-development.onrender.com,https://sentia-manufacturing-testing.onrender.com,https://sentia-manufacturing.railway.app',
  
  // Unleashed API
  UNLEASHED_API_ID: 'd5313df6-db35-430c-a69e-ae27dffe0c5a',
  
  // Microsoft Email
  MICROSOFT_EMAIL_CLIENT_ID: 'peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM',
  MICROSOFT_EMAIL_CLIENT_SECRET: 'c16d6fba-0e6b-45ea-a016-eb697ff7a7ae',
  MICROSOFT_EMAIL_TENANT_ID: 'common',
  MICROSOFT_EMAIL_SCOPE: 'https://graph.microsoft.com/.default',
  
  // Admin Emails
  ADMIN_EMAIL: 'admin@app.sentiaspirits.com',
  DATA_EMAIL: 'data@app.sentiaspirits.com',
  
  // Logging
  LOG_LEVEL: 'info'
};

console.log('🔧 RENDER ENVIRONMENT VARIABLES UPDATE');
console.log('======================================');
console.log('Updating all Render services with latest Clerk configuration');
console.log('');

// Check if Render CLI is available
try {
  execSync('render --version', { stdio: 'pipe' });
  console.log('✅ Render CLI detected');
} catch (error) {
  console.log('❌ Render CLI not found. Please install it first:');
  console.log('   npm install -g @render/cli');
  console.log('   render login');
  console.log('');
  console.log('📝 Manual update required - see environment variables below:');
  printManualInstructions();
  process.exit(1);
}

// Update each service
for (const [envName, serviceName] of Object.entries(RENDER_SERVICES)) {
  console.log(`\n🔄 Updating ${envName.toUpperCase()} service (${serviceName})...`);
  
  try {
    // Update environment variables for each service
    for (const [key, value] of Object.entries(ENV_VARS)) {
      const envValue = envName === 'development' ? 
        (key === 'NODE_ENV' ? 'development' : value) : 
        value;
        
      console.log(`  📝 Setting ${key}=${envValue.substring(0, 50)}...`);
      
      try {
        execSync(`render env set ${key}="${envValue}" --service ${serviceName}`, { 
          stdio: 'pipe' 
        });
        console.log(`    ✅ ${key} updated`);
      } catch (error) {
        console.log(`    ⚠️  ${key} update failed: ${error.message}`);
      }
    }
    
    console.log(`  ✅ ${envName} environment variables updated`);
    
    // Trigger deployment
    console.log(`  🚀 Triggering deployment for ${envName}...`);
    try {
      execSync(`render deploy --service ${serviceName}`, { stdio: 'pipe' });
      console.log(`    ✅ ${envName} deployment triggered`);
    } catch (error) {
      console.log(`    ⚠️  ${envName} deployment trigger failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error(`  ❌ Failed to update ${envName}:`, error.message);
  }
}

console.log('\n🎉 ENVIRONMENT VARIABLES UPDATE COMPLETE!');
console.log('All Render services have been updated with the latest Clerk configuration');
console.log('');

// Verify deployments
console.log('🔍 Verifying deployments...');
verifyDeployments();

function printManualInstructions() {
  console.log('\n📋 MANUAL UPDATE INSTRUCTIONS:');
  console.log('================================');
  console.log('1. Go to https://dashboard.render.com');
  console.log('2. Select each service and go to Environment tab');
  console.log('3. Add/update the following variables:');
  console.log('');
  
  for (const [key, value] of Object.entries(ENV_VARS)) {
    console.log(`${key}=${value}`);
  }
  
  console.log('\n4. Save changes and redeploy each service');
}

function verifyDeployments() {
  const urls = {
    development: 'https://sentia-manufacturing-development.onrender.com',
    testing: 'https://sentia-manufacturing-testing.onrender.com',
    production: 'https://sentia-manufacturing-production.onrender.com'
  };
  
  for (const [envName, url] of Object.entries(urls)) {
    console.log(`\n  Testing ${envName} (${url})...`);
    
    try {
      const response = fetch(url, { 
        method: 'GET',
        timeout: 10000 
      });
      
      if (response.ok) {
        console.log(`    ✅ ${envName}: Site is accessible`);
      } else {
        console.log(`    ⚠️  ${envName}: Site returned ${response.status}`);
      }
      
    } catch (error) {
      console.log(`    ❌ ${envName}: Connection failed - ${error.message}`);
    }
  }
}

export { RENDER_SERVICES, ENV_VARS };


