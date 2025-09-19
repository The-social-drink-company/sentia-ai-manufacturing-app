#!/usr/bin/env node

/**
 * Comprehensive MCP Server Test Suite
 * Tests all endpoints, API integrations, and AI functionality
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

const MCP_SERVER_URL = 'https://mcp-server-tkyu.onrender.com';
const TEST_RESULTS = {
  passed: [],
  failed: [],
  warnings: []
};

// Color helpers
const success = (msg) => console.log(chalk.green('✓'), msg);
const error = (msg) => console.log(chalk.red('✗'), msg);
const warning = (msg) => console.log(chalk.yellow('⚠'), msg);
const info = (msg) => console.log(chalk.blue('ℹ'), msg);
const header = (msg) => console.log(chalk.bold.cyan(`\n${msg}\n${'='.repeat(50)}`));

// Test helper function
async function testEndpoint(name, url, options = {}) {
  try {
    info(`Testing ${name}...`);
    const response = await fetch(url, options);
    const data = await response.text();

    if (response.ok) {
      success(`${name} - Status: ${response.status}`);
      TEST_RESULTS.passed.push(name);

      // Try to parse JSON
      try {
        const json = JSON.parse(data);
        console.log(chalk.gray(JSON.stringify(json, null, 2).substring(0, 200)));
        return { success: true, data: json };
      } catch {
        console.log(chalk.gray(data.substring(0, 200)));
        return { success: true, data };
      }
    } else {
      error(`${name} - Status: ${response.status}`);
      TEST_RESULTS.failed.push(`${name} (${response.status})`);
      return { success: false, status: response.status };
    }
  } catch (err) {
    error(`${name} - Error: ${err.message}`);
    TEST_RESULTS.failed.push(`${name} (${err.message})`);
    return { success: false, error: err.message };
  }
}

// Main test suite
async function runTests() {
  console.log(chalk.bold.magenta(`
╔════════════════════════════════════════════════════════╗
║     MCP Server Comprehensive Test Suite               ║
║     Server: ${MCP_SERVER_URL}                         ║
║     Date: ${new Date().toISOString()}                 ║
╚════════════════════════════════════════════════════════╝
  `));

  // 1. Health & Basic Endpoints
  header('1. HEALTH & BASIC ENDPOINTS');

  await testEndpoint('Health Check', `${MCP_SERVER_URL}/health`);
  await testEndpoint('Root Endpoint', `${MCP_SERVER_URL}/`);
  await testEndpoint('API Info', `${MCP_SERVER_URL}/api/info`);

  // 2. MCP Protocol Endpoints
  header('2. MCP PROTOCOL ENDPOINTS');

  await testEndpoint('MCP Initialize', `${MCP_SERVER_URL}/mcp/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      protocolVersion: '2024-11-05',
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    })
  });

  await testEndpoint('MCP List Tools', `${MCP_SERVER_URL}/mcp/tools/list`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  // 3. AI Provider Status
  header('3. AI PROVIDER STATUS');

  const aiStatus = await testEndpoint('AI Status', `${MCP_SERVER_URL}/api/ai/status`);

  if (aiStatus.success && aiStatus.data) {
    if (aiStatus.data.providers) {
      info('AI Providers Configured:');
      Object.entries(aiStatus.data.providers).forEach(([key, value]) => {
        if (value.status === 'active') {
          success(`  ${key}: ${value.name} - ACTIVE`);
        } else {
          warning(`  ${key}: ${value.name} - ${value.status || 'NOT CONFIGURED'}`);
        }
      });
    }
  }

  // 4. API Integrations Status
  header('4. API INTEGRATIONS STATUS');

  const apiStatus = await testEndpoint('API Integrations', `${MCP_SERVER_URL}/api/integrations/status`);

  if (apiStatus.success && apiStatus.data) {
    if (apiStatus.data.services) {
      info('External Services:');
      Object.entries(apiStatus.data.services).forEach(([key, value]) => {
        const status = value.status || 'unknown';
        if (status === 'connected' || status === 'configured') {
          success(`  ${key}: ${value.name} - ${status.toUpperCase()}`);
        } else {
          warning(`  ${key}: ${value.name} - ${status.toUpperCase()}`);
        }
      });
    }
  }

  // 5. Manufacturing Endpoints
  header('5. MANUFACTURING ENDPOINTS');

  await testEndpoint('Inventory Status', `${MCP_SERVER_URL}/api/inventory/status`);
  await testEndpoint('Production Status', `${MCP_SERVER_URL}/api/production/status`);
  await testEndpoint('Demand Forecast', `${MCP_SERVER_URL}/api/forecasting/status`);

  // 6. Xero Integration Test
  header('6. XERO INTEGRATION TEST');

  const xeroTest = await testEndpoint('Xero Connection', `${MCP_SERVER_URL}/api/xero/test`);

  if (!xeroTest.success) {
    warning('Xero integration may need OAuth authentication setup');
  }

  // 7. Unleashed Integration Test
  header('7. UNLEASHED INTEGRATION TEST');

  const unleashedTest = await testEndpoint('Unleashed Test', `${MCP_SERVER_URL}/api/unleashed/test`);

  // 8. WebSocket Connection Test
  header('8. WEBSOCKET CONNECTION TEST');

  info('WebSocket test requires a WebSocket client - skipping in basic test');
  TEST_RESULTS.warnings.push('WebSocket test skipped - requires WebSocket client');

  // 9. Performance Tests
  header('9. PERFORMANCE TESTS');

  const startTime = Date.now();
  const healthResponses = [];

  info('Running 10 concurrent health checks...');

  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(fetch(`${MCP_SERVER_URL}/health`));
  }

  try {
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / 10;

    success(`Completed 10 requests in ${totalTime}ms (avg: ${avgTime.toFixed(2)}ms)`);

    if (avgTime < 100) {
      success('Performance: EXCELLENT');
    } else if (avgTime < 500) {
      success('Performance: GOOD');
    } else if (avgTime < 1000) {
      warning('Performance: ACCEPTABLE');
    } else {
      error('Performance: SLOW');
    }
  } catch (err) {
    error(`Performance test failed: ${err.message}`);
  }

  // 10. Security Headers Test
  header('10. SECURITY HEADERS TEST');

  const securityResponse = await fetch(`${MCP_SERVER_URL}/health`);
  const headers = securityResponse.headers;

  const securityHeaders = [
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
    'strict-transport-security'
  ];

  securityHeaders.forEach(header => {
    if (headers.get(header)) {
      success(`${header}: ${headers.get(header)}`);
    } else {
      warning(`Missing security header: ${header}`);
      TEST_RESULTS.warnings.push(`Missing security header: ${header}`);
    }
  });

  // Test Summary
  header('TEST SUMMARY');

  const totalTests = TEST_RESULTS.passed.length + TEST_RESULTS.failed.length;
  const passRate = ((TEST_RESULTS.passed.length / totalTests) * 100).toFixed(1);

  console.log(chalk.bold(`
  ┌────────────────────────────────────────────┐
  │  Total Tests: ${totalTests.toString().padEnd(28)}│
  │  Passed: ${chalk.green(TEST_RESULTS.passed.length.toString().padEnd(34))}│
  │  Failed: ${chalk.red(TEST_RESULTS.failed.length.toString().padEnd(34))}│
  │  Warnings: ${chalk.yellow(TEST_RESULTS.warnings.length.toString().padEnd(32))}│
  │  Pass Rate: ${passRate}%${' '.repeat(27 - passRate.length)}│
  └────────────────────────────────────────────┘
  `));

  if (TEST_RESULTS.failed.length > 0) {
    error('\nFailed Tests:');
    TEST_RESULTS.failed.forEach(test => {
      console.log(chalk.red(`  • ${test}`));
    });
  }

  if (TEST_RESULTS.warnings.length > 0) {
    warning('\nWarnings:');
    TEST_RESULTS.warnings.forEach(warn => {
      console.log(chalk.yellow(`  • ${warn}`));
    });
  }

  // Overall Status
  console.log('\n');
  if (TEST_RESULTS.failed.length === 0) {
    console.log(chalk.bold.green('✓ MCP SERVER IS FULLY OPERATIONAL!'));
  } else if (TEST_RESULTS.failed.length <= 3) {
    console.log(chalk.bold.yellow('⚠ MCP SERVER IS PARTIALLY OPERATIONAL'));
    console.log(chalk.yellow('Some endpoints may need configuration or are optional'));
  } else {
    console.log(chalk.bold.red('✗ MCP SERVER HAS CRITICAL ISSUES'));
    console.log(chalk.red('Please check the failed tests and server logs'));
  }

  // Recommendations
  header('RECOMMENDATIONS');

  if (TEST_RESULTS.failed.length > 0) {
    info('To fix failed tests:');
    console.log('  1. Check environment variables in Render dashboard');
    console.log('  2. Verify API keys are correctly set');
    console.log('  3. Check server logs for detailed error messages');
    console.log('  4. Ensure all required services are configured');
  }

  if (TEST_RESULTS.warnings.length > 0) {
    info('To address warnings:');
    console.log('  1. Configure missing security headers if needed');
    console.log('  2. Set up OAuth for Xero if using financial features');
    console.log('  3. Enable WebSocket support for real-time features');
  }
}

// Run the tests
runTests().catch(err => {
  console.error(chalk.bold.red('Test suite failed to run:'), err);
  process.exit(1);
});