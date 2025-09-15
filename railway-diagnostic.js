#!/usr/bin/env node

/**
 * Railway Deployment Diagnostic Tool
 * Run this to diagnose Railway deployment issues
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('='.repeat(60));
console.log('RAILWAY DEPLOYMENT DIAGNOSTIC');
console.log('='.repeat(60));

// 1. Check environment variables
console.log('\n1. ENVIRONMENT VARIABLES:');
console.log('-'.repeat(40));
console.log('PORT:', process.env.PORT || 'NOT SET (CRITICAL!)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'not set');
console.log('RAILWAY_PROJECT_ID:', process.env.RAILWAY_PROJECT_ID || 'not set');
console.log('RAILWAY_SERVICE_ID:', process.env.RAILWAY_SERVICE_ID || 'not set');

// 2. Check file structure
console.log('\n2. FILE STRUCTURE:');
console.log('-'.repeat(40));
const criticalFiles = [
  'railway-ultimate.js',
  'railway.json',
  'nixpacks.toml',
  'package.json',
  'dist/index.html',
  'node_modules/express/package.json'
];

criticalFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✓' : '✗'} ${file}`);
});

// 3. Check nixpacks configuration
console.log('\n3. NIXPACKS CONFIGURATION:');
console.log('-'.repeat(40));
const nixpacksPath = path.join(__dirname, 'nixpacks.toml');
if (fs.existsSync(nixpacksPath)) {
  const content = fs.readFileSync(nixpacksPath, 'utf8');
  console.log('nixpacks.toml content:');
  console.log(content);

  // Check for Caddy
  if (content.includes('caddy') || content.includes('Caddy')) {
    console.log('⚠️  WARNING: Caddy detected in nixpacks.toml!');
  }

  // Check for staticAssets
  if (!content.includes('staticAssets')) {
    console.log('⚠️  WARNING: staticAssets not configured!');
  } else if (!content.includes('enabled = false')) {
    console.log('⚠️  WARNING: staticAssets not disabled!');
  }
} else {
  console.log('✗ nixpacks.toml not found!');
}

// 4. Check Node.js version
console.log('\n4. NODE.JS VERSION:');
console.log('-'.repeat(40));
console.log('Node version:', process.version);
console.log('NPM version:', execSync('npm --version').toString().trim());

// 5. Test port binding
console.log('\n5. PORT BINDING TEST:');
console.log('-'.repeat(40));
const testPort = process.env.PORT || 3000;
console.log(`Testing port ${testPort}...`);

import('express').then(({ default: express }) => {
  const app = express();

  app.get('/test', (req, res) => {
    res.json({ status: 'ok' });
  });

  const server = app.listen(testPort, '0.0.0.0', () => {
    console.log(`✓ Successfully bound to 0.0.0.0:${testPort}`);
    server.close();

    // 6. Summary
    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(60));

    const issues = [];

    if (!process.env.PORT) {
      issues.push('PORT environment variable not set by Railway');
    }

    if (!fs.existsSync(path.join(__dirname, 'dist/index.html'))) {
      issues.push('React build not found (dist/index.html missing)');
    }

    if (!fs.existsSync(nixpacksPath)) {
      issues.push('nixpacks.toml configuration missing');
    }

    if (issues.length > 0) {
      console.log('ISSUES FOUND:');
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
    } else {
      console.log('✓ No critical issues detected');
    }

    console.log('\nRECOMMENDATIONS:');
    console.log('1. Ensure Railway sets PORT environment variable');
    console.log('2. Check Railway logs for Caddy vs Node.js conflicts');
    console.log('3. Verify health check endpoint responds quickly');
    console.log('4. Consider using railway-emergency.js if issues persist');

    process.exit(0);
  }).on('error', (err) => {
    console.log(`✗ Failed to bind to port ${testPort}:`, err.message);
    process.exit(1);
  });
}).catch(err => {
  console.error('Failed to import express:', err);
  process.exit(1);
});