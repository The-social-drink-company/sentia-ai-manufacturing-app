#!/usr/bin/env node

/**
 * Personnel API Test Script
 * Verifies the /api/personnel endpoint is working correctly
 */

import http from 'http';

const PORT = process.env.PORT || 5000;
const HOST = 'localhost';

console.log('='.repeat(60));
console.log('👥 PERSONNEL API TEST');
console.log('='.repeat(60));
console.log('');

// Test functions
async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    console.log(`🔗 Testing: http://${HOST}:${PORT}${path}`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout after 5 seconds'));
    });

    req.end();
  });
}

async function testEndpoint(path, description) {
  try {
    console.log(`\n📋 Test: ${description}`);
    console.log('-'.repeat(40));

    const response = await makeRequest(path);

    console.log(`📊 Status: ${response.statusCode}`);
    console.log(`📦 Content-Type: ${response.headers['content-type']}`);

    // Parse JSON response
    try {
      const json = JSON.parse(response.body);
      console.log(`✅ Valid JSON response`);
      console.log(`📈 Response structure:`);
      console.log(`   - success: ${json.success}`);
      console.log(`   - data: ${Array.isArray(json.data) ? `Array with ${json.data.length} items` : typeof json.data}`);

      if (json.data && json.data.length > 0) {
        console.log(`   - First item keys: ${Object.keys(json.data[0]).join(', ')}`);
      }

      if (json.message) {
        console.log(`   - message: ${json.message}`);
      }

      if (json.error) {
        console.log(`   - error: ${json.error}`);
      }

      return true;
    } catch (parseError) {
      console.error(`❌ Failed to parse JSON:`, parseError.message);
      console.log(`📄 Raw response: ${response.body.substring(0, 200)}...`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log(`\n🚀 Testing Personnel API on http://${HOST}:${PORT}`);
  console.log('Make sure the server is running: npm run dev:server\n');

  let allPassed = true;

  // Test 1: Simple test endpoint
  const test1 = await testEndpoint(
    '/api/personnel/test',
    'Simple test endpoint'
  );
  allPassed = allPassed && test1;

  // Test 2: Get all personnel
  const test2 = await testEndpoint(
    '/api/personnel',
    'Get all personnel (no filter)'
  );
  allPassed = allPassed && test2;

  // Test 3: Filter by operator role
  const test3 = await testEndpoint(
    '/api/personnel?role=operator',
    'Filter by operator role'
  );
  allPassed = allPassed && test3;

  // Test 4: Filter by admin role
  const test4 = await testEndpoint(
    '/api/personnel?role=admin',
    'Filter by admin role'
  );
  allPassed = allPassed && test4;

  // Test 5: Filter by multiple roles
  const test5 = await testEndpoint(
    '/api/personnel?role=operator&role=manager',
    'Filter by multiple roles'
  );
  allPassed = allPassed && test5;

  console.log('\n' + '='.repeat(60));

  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('\nThe Personnel API is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Deploy to Render: git push origin development');
    console.log('2. Test on Render: https://your-app.onrender.com/api/personnel');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\nTroubleshooting:');
    console.log('1. Check if server is running: npm run dev:server');
    console.log('2. Check server logs for errors');
    console.log('3. Verify database connection');
    console.log('4. Check if fallback data is being returned');
  }

  console.log('='.repeat(60));
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});