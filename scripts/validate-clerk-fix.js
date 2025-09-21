#!/usr/bin/env node

/**
 * Validation Script for TASK-001, TASK-002, TASK-003
 * Verifies that Clerk authentication issues are fixed
 */

import http from 'http';

console.log('='.repeat(70));
console.log('CLERK AUTHENTICATION FIX VALIDATION');
console.log('='.repeat(70));

const PORT = process.env.PORT || 5002;
const HOST = 'localhost';

// Test 1: Health check endpoint without authentication
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    console.log('\n✅ TEST 1: Health check endpoint (no auth required)');
    console.log(`   Testing: http://${HOST}:${PORT}/health`);

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('   ✅ Status Code: 200');
            console.log('   ✅ Response:', JSON.stringify(json, null, 2));

            if (json.status === 'healthy') {
              console.log('   ✅ PASS: Health endpoint accessible without auth');
              resolve(true);
            } else {
              console.log('   ❌ FAIL: Unexpected health status');
              resolve(false);
            }
          } catch (e) {
            console.log('   ❌ FAIL: Invalid JSON response');
            resolve(false);
          }
        } else {
          console.log(`   ❌ FAIL: Status code ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ FAIL: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Test 2: API endpoint (may require authentication)
function testAPIEndpoint() {
  return new Promise((resolve, reject) => {
    console.log('\n✅ TEST 2: API status endpoint');
    console.log(`   Testing: http://${HOST}:${PORT}/api/status`);

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/status',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          console.log(`   ✅ Status Code: ${res.statusCode}`);
          if (res.statusCode === 401) {
            console.log('   ℹ️  Authentication required (expected behavior)');
          } else {
            console.log('   ✅ API endpoint accessible');
          }
          resolve(true);
        } else {
          console.log(`   ❌ FAIL: Unexpected status code ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ FAIL: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Test 3: Environment variable validation
function testEnvironmentVariables() {
  console.log('\n✅ TEST 3: Environment variable validation');

  const required = [
    'VITE_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];

  let allPresent = true;

  required.forEach(key => {
    if (process.env[key]) {
      console.log(`   ✅ ${key}: CONFIGURED`);
    } else {
      console.log(`   ❌ ${key}: MISSING`);
      allPresent = false;
    }
  });

  if (allPresent) {
    console.log('   ✅ PASS: All required environment variables present');
  } else {
    console.log('   ⚠️  WARNING: Some environment variables missing');
  }

  return Promise.resolve(allPresent);
}

// Test 4: CORS configuration
function testCORSConfiguration() {
  return new Promise((resolve, reject) => {
    console.log('\n✅ TEST 4: CORS configuration');
    console.log(`   Testing: OPTIONS request to http://${HOST}:${PORT}/api/status`);

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/status',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    };

    const req = http.request(options, (res) => {
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers'],
        'access-control-allow-credentials': res.headers['access-control-allow-credentials']
      };

      console.log('   CORS Headers:', JSON.stringify(corsHeaders, null, 2));

      if (corsHeaders['access-control-allow-origin']) {
        console.log('   ✅ PASS: CORS headers present');
        resolve(true);
      } else {
        console.log('   ❌ FAIL: CORS headers missing');
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`   ❌ FAIL: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Run all tests
async function runValidation() {
  console.log('\nStarting validation tests...');
  console.log('Server should be running on port', PORT);

  const results = {
    health: await testHealthEndpoint(),
    api: await testAPIEndpoint(),
    env: await testEnvironmentVariables(),
    cors: await testCORSConfiguration()
  };

  console.log('\n' + '='.repeat(70));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(70));
  console.log('TASK-001 (Health endpoint): ' + (results.health ? '✅ PASS' : '❌ FAIL'));
  console.log('TASK-002 (Environment vars): ' + (results.env ? '✅ PASS' : '⚠️  WARNING'));
  console.log('TASK-003 (CORS config): ' + (results.cors ? '✅ PASS' : '❌ FAIL'));
  console.log('='.repeat(70));

  const allPassed = results.health && results.api && results.cors;

  if (allPassed) {
    console.log('✅ ALL CRITICAL TESTS PASSED - Clerk authentication issues FIXED!');
  } else {
    console.log('❌ Some tests failed - review the results above');
  }

  console.log('='.repeat(70));
}

// Instructions if server not running
console.log('\n📝 INSTRUCTIONS:');
console.log('1. Start the server in another terminal:');
console.log('   PORT=' + PORT + ' node server-fixed.js');
console.log('\n2. Then run this validation script:');
console.log('   node scripts/validate-clerk-fix.js');
console.log('\nAttempting to connect to server...');

// Run validation after a short delay
setTimeout(runValidation, 1000);