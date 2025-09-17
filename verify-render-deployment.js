#!/usr/bin/env node
/**
 * Render Deployment Verification Script
 * Checks the deployment status and helps diagnose issues
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const RENDER_URL = 'https://sentia-manufacturing-development.onrender.com';

console.log('='.repeat(70));
console.log('RENDER DEPLOYMENT VERIFICATION');
console.log('='.repeat(70));
console.log('Target URL:', RENDER_URL);
console.log('Time:', new Date().toISOString());
console.log('');

async function checkEndpoint(path, description) {
  const url = `${RENDER_URL}${path}`;
  console.log(`\nChecking ${description}...`);
  console.log('URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/json',
        'User-Agent': 'Render-Deployment-Checker'
      },
      timeout: 10000
    });

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    console.log('✅ Status:', response.status, response.statusText);
    console.log('   Content-Type:', contentType);
    console.log('   Content-Length:', contentLength || 'chunked');

    // Check response content
    if (response.ok) {
      const text = await response.text();

      if (path === '/') {
        // Check for proper React app
        if (text.includes('<div id="root">')) {
          console.log('   ✅ React root element found');
        } else {
          console.log('   ⚠️ React root element NOT found');
        }

        if (text.includes('/js/index-')) {
          console.log('   ✅ JavaScript bundle references found');
        } else {
          console.log('   ⚠️ JavaScript bundle references NOT found');
        }

        if (text.includes('/assets/')) {
          console.log('   ✅ CSS asset references found');
        } else {
          console.log('   ⚠️ CSS asset references NOT found');
        }

        // Check for brown page indicators
        if (text.includes('background:brown') || text.includes('background: brown')) {
          console.log('   ❌ BROWN PAGE DETECTED!');
        }
      } else if (path === '/api/health') {
        // Parse JSON response
        try {
          const data = JSON.parse(text);
          console.log('   API Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');

          if (data.database) {
            console.log('   Database:', data.database.status);
          }
          if (data.server) {
            console.log('   Server:', data.server);
          }
        } catch (e) {
          console.log('   Response preview:', text.substring(0, 200));
        }
      } else {
        console.log('   Response preview:', text.substring(0, 200));
      }
    } else {
      const errorText = await response.text();
      console.log('   ❌ Error response:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);

    if (error.code === 'ETIMEDOUT') {
      console.log('   The server took too long to respond (timeout)');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   The domain could not be resolved');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   Connection refused - server may be down');
    }
  }
}

async function runChecks() {
  // Check main page
  await checkEndpoint('/', 'Main Application');

  // Check API health
  await checkEndpoint('/api/health', 'API Health Check');

  // Check static assets
  await checkEndpoint('/js/index-eUvznO12.js', 'JavaScript Bundle');
  await checkEndpoint('/assets/index-BYigNjGC.css', 'CSS Bundle');

  // Check new personnel endpoint
  await checkEndpoint('/api/personnel', 'Personnel API Endpoint');

  console.log('\n' + '='.repeat(70));
  console.log('ENVIRONMENT VARIABLES CHECK');
  console.log('='.repeat(70));

  console.log('\nLocal Environment Variables:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (local)' : 'NOT SET');
  console.log('VITE_CLERK_PUBLISHABLE_KEY:', process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
  console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

  console.log('\n⚠️ Note: These are local values. Render has its own environment variables.');
  console.log('Check Render Dashboard > Environment to verify production values.');

  console.log('\n' + '='.repeat(70));
  console.log('TROUBLESHOOTING GUIDE');
  console.log('='.repeat(70));

  console.log('\nIf you see a brown page:');
  console.log('1. Check browser console (F12) for JavaScript errors');
  console.log('2. Check Network tab to see if JS/CSS files are loading');
  console.log('3. Verify MIME types are correct (JS: application/javascript)');
  console.log('4. Check Render logs: Dashboard > Logs');

  console.log('\nRequired Render Environment Variables:');
  console.log('- DATABASE_URL (auto-set by Render PostgreSQL)');
  console.log('- VITE_CLERK_PUBLISHABLE_KEY');
  console.log('- CLERK_SECRET_KEY');
  console.log('- NODE_ENV=production');

  console.log('\n' + '='.repeat(70));
  console.log('Verification complete!');
  console.log('='.repeat(70));
}

// Run all checks
runChecks().catch(console.error);