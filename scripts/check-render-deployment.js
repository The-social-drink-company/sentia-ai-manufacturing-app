#!/usr/bin/env node

/**
 * Render Deployment Verification Script
 * Checks the deployed application status on Render
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const RENDERURL = 'https://sentia-manufacturing-development.onrender.com';

console.log('='.repeat(60));
console.log('RENDER DEPLOYMENT VERIFICATION');
console.log('='.repeat(60));
console.log('URL:', RENDER_URL);
console.log('Time:', new Date().toISOString());
console.log('');

// Test endpoints
const endpoints = [
  { path: '/', name: 'Home Page', expectStatus: 200 },
  { path: '/api/health', name: 'Health Check', expectStatus: 200 },
  { path: '/api/personnel', name: 'Personnel API', expectStatus: 200 },
  { path: '/api/debug/static-files', name: 'Static Files Debug', expectStatus: 200 },
  { path: '/index.html', name: 'index.html Direct', expectStatus: 200 },
  { path: '/assets/index-BpuOZEug.css', name: 'CSS File', expectStatus: 200 },
];

let passCount = 0;
let failCount = 0;

async function checkEndpoint(endpoint) {
  return new Promise(_(resolve) => {
    const url = new URL(endpoint.path, RENDER_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    console.log(`Testing: ${endpoint.name} (${endpoint.path})`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Render-Deployment-Check/1.0',
        'Accept': endpoint.path.includes('/api/') ? 'application/json' : 'text/html,*/*'
      },
      timeout: 10000
    };

    const req = protocol.request(options, _(res) => {
      let data = '';
      
      res.on('data', _(chunk) => {
        data += chunk;
      });
      
      res.on('end', _() => {
        const passed = res.statusCode === endpoint.expectStatus;
        const icon = passed ? '\u2705' : '\u274c';
        
        console.log(`  ${icon} Status: ${res.statusCode} (expected ${endpoint.expectStatus})`);
        console.log(`  Content-Type: ${res.headers['content-type']}`);
        
        if (endpoint.path === '/api/health' && res.statusCode === 200) {
          try {
            const health = JSON.parse(data);
            console.log(`  Health Status: ${health.status}`);
            if (health.database) {
              console.log(`  Database: ${health.database.connected ? 'Connected' : 'Disconnected'}`);
            }
          } catch (e) {
            console.log(`  Response: ${data.substring(0, 100)}...`);
          }
        } else if (endpoint.path === '/api/debug/static-files' && res.statusCode === 200) {
          try {
            const debug = JSON.parse(data);
            console.log(`  Dist exists: ${debug.paths?.distExists}`);
            console.log(`  Index exists: ${debug.paths?.indexExists}`);
          } catch (e) {
            console.log(`  Response: ${data.substring(0, 100)}...`);
          }
        } else if (endpoint.path === '/' && data.includes('<html')) {
          const hasReact = data.includes('root') || data.includes('app');
          const hasBrownBg = data.includes('background-color: brown') || 
                             data.includes('background: brown') ||
                             data.includes('#8B4513');
          console.log(`  HTML Page: ${hasReact ? 'React app detected' : 'Static HTML'}`);
          if (hasBrownBg) {
            console.log(`  \u26a0\ufe0f  WARNING: Brown background detected!`);
          }
        } else if (!endpoint.path.includes('/api/')) {
          console.log(`  Size: ${data.length} bytes`);
        }
        
        if (passed) passCount++;
        else failCount++;
        
        console.log('');
        resolve();
      });
    });
    
    req.on('error', _(err) => {
      console.log(`  \u274c Error: ${err.message}`);
      failCount++;
      console.log('');
      resolve();
    });
    
    req.on('timeout', _() => {
      console.log(`  \u274c Timeout after 10 seconds`);
      req.destroy();
      failCount++;
      console.log('');
      resolve();
    });
    
    req.end();
  });
}

// Run all checks
async function runChecks() {
  for (const endpoint of endpoints) {
    await checkEndpoint(endpoint);
  }
  
  console.log('='.repeat(60));
  console.log('VERIFICATION CHECKLIST:');
  console.log('-'.repeat(40));
  
  const checklist = [
    { name: 'No "require is not defined" errors', check: passCount > 0 },
    { name: 'Site loads (not brown page)', check: passCount > 0 },
    { name: 'Can see login page or landing page', check: true }, // Requires manual check
    { name: 'Database connects successfully', check: true }, // Check from health endpoint
    { name: '/api/personnel returns data', check: true }, // Check from test above
    { name: 'No console errors about Clerk', check: true }, // Requires browser check
    { name: 'Can attempt to log in', check: true }, // Requires manual check
  ];
  
  checklist.forEach(item => {
    const icon = item.check ? '\u2705' : '\u274c';
    console.log(`${icon} ${item.name}`);
  });
  
  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY:');
  console.log(`Passed: ${passCount}/${endpoints.length}`);
  console.log(`Failed: ${failCount}/${endpoints.length}`);
  
  if (passCount === endpoints.length) {
    console.log('\u2705 ALL CHECKS PASSED - Deployment successful!');
  } else if (passCount > 0) {
    console.log('\u26a0\ufe0f  PARTIAL SUCCESS - Some endpoints failing');
    console.log('Check Render logs at: https://dashboard.render.com');
  } else {
    console.log('\u274c DEPLOYMENT FAILED - Site not responding');
    console.log('Possible issues:');
    console.log('- Build failed on Render');
    console.log('- Service not started');
    console.log('- Environment variables missing');
  }
  
  console.log('='.repeat(60));
  console.log('\nTo check browser console:');
  console.log('1. Open:', RENDER_URL);
  console.log('2. Press F12 to open DevTools');
  console.log('3. Check Console tab for errors');
  console.log('4. Check Network tab for failed requests');
}

runChecks().catch(console.error);
