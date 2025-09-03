#!/usr/bin/env node

/**
 * Railway Environment Setup Script
 * 
 * This script helps set up environment variables for Railway deployment
 * Run with: node scripts/setup-railway-env.js
 */

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 Railway Environment Setup for Sentia Manufacturing Dashboard\n');
  
  console.log('This script will help you set up environment variables for Railway deployment.');
  console.log('You will need:');
  console.log('1. Clerk API keys (from https://dashboard.clerk.com)');
  console.log('2. Database connection strings (from Neon or your database provider)');
  console.log('3. Railway CLI installed (npm install -g @railway/cli)\n');
  
  const hasRailwayCli = await checkRailwayCli();
  if (!hasRailwayCli) {
    console.log('❌ Railway CLI not found. Please install it first:');
    console.log('npm install -g @railway/cli');
    console.log('Then run: railway login');
    process.exit(1);
  }
  
  console.log('✅ Railway CLI found\n');
  
  // Get environment selection
  const environment = await question('Which environment? (development/test/production): ');
  if (!['development', 'test', 'production'].includes(environment)) {
    console.log('❌ Invalid environment. Must be development, test, or production');
    process.exit(1);
  }
  
  // Get Clerk keys
  console.log('\n📋 Clerk Authentication Setup:');
  const clerkPublishableKey = await question('Enter VITE_CLERK_PUBLISHABLE_KEY: ');
  const clerkSecretKey = await question('Enter CLERK_SECRET_KEY: ');
  
  // Get database URL
  console.log('\n🗄️ Database Setup:');
  const databaseUrl = await question('Enter DATABASE_URL: ');
  
  // Get optional variables
  console.log('\n🔧 Optional Configuration:');
  const unleashedApiId = await question('Enter UNLEASHED_API_ID (optional, press Enter to skip): ');
  const unleashedApiKey = await question('Enter UNLEASHED_API_KEY (optional, press Enter to skip): ');
  
  // Set CORS origins based on environment
  const corsOrigins = getCorsOrigins(environment);
  
  // Prepare environment variables
  const envVars = {
    'VITE_CLERK_PUBLISHABLE_KEY': clerkPublishableKey,
    'CLERK_SECRET_KEY': clerkSecretKey,
    'DATABASE_URL': databaseUrl,
    'NODE_ENV': 'production',
    'PORT': '5000',
    'CORS_ORIGINS': corsOrigins
  };
  
  if (unleashedApiId) envVars['UNLEASHED_API_ID'] = unleashedApiId;
  if (unleashedApiKey) envVars['UNLEASHED_API_KEY'] = unleashedApiKey;
  
  console.log('\n📝 Setting environment variables in Railway...');
  
  try {
    // Set environment variables using Railway CLI
    for (const [key, value] of Object.entries(envVars)) {
      console.log(`Setting ${key}...`);
      execSync(`railway variables set ${key}="${value}"`, { stdio: 'inherit' });
    }
    
    console.log('\n✅ Environment variables set successfully!');
    console.log('\n🚀 Next steps:');
    console.log('1. Go to Railway dashboard and trigger a new deployment');
    console.log('2. Check the deployment logs for any errors');
    console.log('3. Test the application at your Railway URL');
    console.log('4. Use /diagnostics endpoint to verify configuration');
    
  } catch (error) {
    console.error('❌ Error setting environment variables:', error.message);
    console.log('\nManual setup instructions:');
    console.log('1. Go to Railway dashboard');
    console.log('2. Select your service');
    console.log('3. Go to Variables tab');
    console.log('4. Add the following variables:');
    console.log('\n' + Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n'));
  }
  
  rl.close();
}

function getCorsOrigins(environment) {
  const origins = {
    development: 'https://sentiadeploy.financeflo.ai',
    test: 'https://sentiatest.financeflo.ai',
    production: 'https://sentiaprod.financeflo.ai'
  };
  return origins[environment];
}

async function checkRailwayCli() {
  try {
    execSync('railway --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

main().catch(console.error);
