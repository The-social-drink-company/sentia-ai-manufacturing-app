#!/usr/bin/env node

/**
 * Emergency Railway Environment Fix Script
 * 
 * This script fixes the Railway production environment by setting the correct
 * environment variables directly through the Railway CLI.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));

function setRailwayEnvVar(key, value, environment = 'production') {
  try {
    const command = `railway variables set ${key}="${value}" --environment ${environment}`;
    console.log(`Setting ${key} for ${environment}...`);
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ Set ${key}`);
  } catch (error) {
    console.error(`❌ Failed to set ${key}:`, error.message);
  }
}

async function fixRailwayEnvironment() {
  console.log('🔧 Fixing Railway Production Environment Variables...');
  
  const prodVars = railwayConfig.environments.production.variables;
  
  // Critical environment variables for production
  const criticalVars = [
    'NODE_ENV',
    'RAILWAY_ENVIRONMENT', 
    'PORT',
    'DATABASE_URL',
    'VITE_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'CORS_ORIGINS'
  ];
  
  console.log('Setting critical production environment variables...');
  
  for (const varName of criticalVars) {
    if (prodVars[varName]) {
      setRailwayEnvVar(varName, prodVars[varName]);
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('🚀 Railway environment fix completed!');
  console.log('💡 Redeploy the service for changes to take effect.');
}

// Check if railway CLI is available
try {
  execSync('railway --version', { stdio: 'pipe' });
  fixRailwayEnvironment();
} catch (error) {
  console.error('❌ Railway CLI not found. Please install and login first:');
  console.error('npm install -g @railway/cli');
  console.error('railway login');
}