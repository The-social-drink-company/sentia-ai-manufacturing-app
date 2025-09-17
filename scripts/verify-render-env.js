#!/usr/bin/env node

/**
 * Render Environment Verification Script
 * Checks all critical environment variables for Render deployment
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('='.repeat(60));
console.log('RENDER DEPLOYMENT ENVIRONMENT CHECK');
console.log('='.repeat(60));
console.log('');

// Check deployment environment
const isRender = !!process.env.RENDER;
const isProduction = process.env.NODE_ENV === 'production';
console.log('Deployment Platform:', isRender ? 'RENDER' : 'LOCAL');
console.log('Environment:', process.env.NODE_ENV || 'not set');
console.log('Port:', process.env.PORT || 'not set');
console.log('');

// Check required environment variables
console.log('CRITICAL ENVIRONMENT VARIABLES:');
console.log('-'.repeat(40));

const criticalVars = [
  { name: 'DATABASE_URL', category: 'Database' },
  { name: 'VITE_CLERK_PUBLISHABLE_KEY', category: 'Auth Frontend' },
  { name: 'CLERK_SECRET_KEY', category: 'Auth Backend' },
  { name: 'NODE_ENV', category: 'Environment' },
  { name: 'PORT', category: 'Server' }
];

let allCriticalSet = true;
criticalVars.forEach(({ name, category }) => {
  const value = process.env[name];
  if (value) {
    const masked = value.length > 40 
      ? value.substring(0, 20) + '...' + value.substring(value.length - 10)
      : value;
    console.log(`\u2705 ${category} - ${name}: ${masked}`);
  } else {
    console.log(`\u274c ${category} - ${name}: NOT SET`);
    allCriticalSet = false;
  }
});

console.log('');
console.log('RENDER-SPECIFIC VARIABLES:');
console.log('-'.repeat(40));

const renderVars = [
  'RENDER',
  'RENDER_EXTERNAL_URL',
  'RENDER_SERVICE_NAME',
  'RENDER_INSTANCE_ID',
  'RENDER_GIT_COMMIT'
];

renderVars.forEach(name => {
  const value = process.env[name];
  console.log(`${name}: ${value || 'NOT SET'}`);
});

console.log('');
console.log('BUILD ARTIFACTS CHECK:');
console.log('-'.repeat(40));

// Check for dist folder
const distPath = join(__dirname, '..', 'dist');
const distExists = fs.existsSync(distPath);
console.log(`dist folder: ${distExists ? '\u2705 EXISTS' : '\u274c MISSING'}`);

if (distExists) {
  const indexExists = fs.existsSync(join(distPath, 'index.html'));
  const assetsExists = fs.existsSync(join(distPath, 'assets'));
  const jsExists = fs.existsSync(join(distPath, 'js'));
  
  console.log(`  - index.html: ${indexExists ? '\u2705' : '\u274c'}`);
  console.log(`  - assets/: ${assetsExists ? '\u2705' : '\u274c'}`);
  console.log(`  - js/: ${jsExists ? '\u2705' : '\u274c'}`);
  
  if (indexExists) {
    const stats = fs.statSync(join(distPath, 'index.html'));
    console.log(`  - index.html size: ${stats.size} bytes`);
  }
}

console.log('');
console.log('RECOMMENDED RENDER SETTINGS:');
console.log('-'.repeat(40));
console.log('Build Command: npm ci --legacy-peer-deps && npm run build');
console.log('Start Command: node server.js');
console.log('Health Check Path: /api/health');
console.log('Environment Variables to Set:');
console.log('  - DATABASE_URL (from Render PostgreSQL)');
console.log('  - VITE_CLERK_PUBLISHABLE_KEY');
console.log('  - CLERK_SECRET_KEY');
console.log('  - NODE_ENV=production');

console.log('');
console.log('='.repeat(60));

if (!isRender) {
  console.log('\u26a0️  Running locally - Deploy to Render to verify production');
} else if (allCriticalSet) {
  console.log('\u2705 ALL CRITICAL VARIABLES SET - Ready for deployment');
} else {
  console.log('\u274c MISSING CRITICAL VARIABLES - Check Render dashboard');
}

console.log('='.repeat(60));
