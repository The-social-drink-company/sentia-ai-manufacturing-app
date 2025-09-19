// Test script to verify Render deployment fixes

import fetch from 'node-fetch';

const ENDPOINTS = {
  development: 'https://sentia-manufacturing-development.onrender.com',
  testing: 'https://sentia-manufacturing-testing.onrender.com',
  production: 'https://sentia-manufacturing-production.onrender.com'
};

async function testEndpoint(url, path) {
  try {
    const response = await fetch(`${url}${path}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (isJson) {
      const data = await response.json();
      return {
        success: true,
        status: response.status,
        contentType,
        data
      };
    } else {
      const text = await response.text();
      return {
        success: false,
        status: response.status,
        contentType,
        error: 'Response is not JSON',
        preview: text.substring(0, 200)
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests(environment = 'development') {
  const baseUrl = ENDPOINTS[environment];
  if (!baseUrl) {
    console.error('Invalid environment. Use: development, testing, or production');
    return;
  }

  console.log(`\nTesting ${environment.toUpperCase()} deployment: ${baseUrl}`);
  console.log('='.repeat(60));

  // Test critical endpoints
  const tests = [
    { path: '/health', expected: 'JSON health status' },
    { path: '/api/health', expected: 'API health check' },
    { path: '/api/test', expected: 'Test endpoint' },
    { path: '/api/dashboard/overview', expected: 'Dashboard data' },
    { path: '/api/working-capital/overview', expected: 'Working capital data' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`Testing ${test.path}... `);
    const result = await testEndpoint(baseUrl, test.path);

    if (result.success && result.contentType.includes('application/json')) {
      console.log('PASS (JSON response)');
      passed++;
    } else if (result.contentType && result.contentType.includes('text/html')) {
      console.log('FAIL (HTML response - should be JSON)');
      console.log('  Content-Type:', result.contentType);
      console.log('  Preview:', result.preview?.substring(0, 100));
      failed++;
    } else {
      console.log('FAIL');
      console.log('  Error:', result.error || 'Non-JSON response');
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('SUCCESS: All endpoints returning JSON as expected!');
  } else {
    console.log('FAILURE: Some endpoints still returning HTML instead of JSON');
    console.log('Deploy the fixes and test again.');
  }
}

// Get environment from command line or default to development
const env = process.argv[2] || 'development';
runTests(env);