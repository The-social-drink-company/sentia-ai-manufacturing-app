/**
 * Global Test Setup Configuration
 * Sets up testing environment for all test suites
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

// Global test state
global.testMetrics = {
  startTime: null,
  endTime: null,
  testCounts: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Setup test results directory
const TEST_RESULTS_DIR = './test-results';

beforeAll(async () => {
  console.log('🚀 Starting Sentia MCP Server Test Suite');
  global.testMetrics.startTime = performance.now();
  
  // Ensure test results directory exists
  try {
    await fs.mkdir(TEST_RESULTS_DIR, { recursive: true });
  } catch (error) {
    console.warn('Could not create test results directory:', error.message);
  }
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  
  // Disable external API calls in test mode
  process.env.DISABLE_EXTERNAL_APIS = 'true';
  
  console.log('✅ Global test setup completed');
});

afterAll(async () => {
  global.testMetrics.endTime = performance.now();
  const duration = (global.testMetrics.endTime - global.testMetrics.startTime) / 1000;
  
  console.log('📊 Test Suite Summary:');
  console.log(`   Duration: ${duration.toFixed(2)}s`);
  console.log(`   Total Tests: ${global.testMetrics.testCounts.total}`);
  console.log(`   Passed: ${global.testMetrics.testCounts.passed}`);
  console.log(`   Failed: ${global.testMetrics.testCounts.failed}`);
  console.log(`   Skipped: ${global.testMetrics.testCounts.skipped}`);
  
  // Save test metrics
  try {
    const metricsPath = path.join(TEST_RESULTS_DIR, 'test-metrics.json');
    await fs.writeFile(metricsPath, JSON.stringify({
      ...global.testMetrics,
      duration: duration
    }, null, 2));
  } catch (error) {
    console.warn('Could not save test metrics:', error.message);
  }
  
  console.log('🏁 Test suite completed');
});

beforeEach(() => {
  global.testMetrics.testCounts.total++;
});

afterEach((testInfo) => {
  if (testInfo.result?.state === 'pass') {
    global.testMetrics.testCounts.passed++;
  } else if (testInfo.result?.state === 'fail') {
    global.testMetrics.testCounts.failed++;
  } else if (testInfo.result?.state === 'skip') {
    global.testMetrics.testCounts.skipped++;
  }
});

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    url: '/',
    headers: {},
    body: {},
    query: {},
    params: {},
    ...overrides
  }),
  
  createMockResponse: () => {
    const res = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.data = data; return this; },
      send: function(data) { this.data = data; return this; },
      end: function() { return this; },
      statusCode: 200,
      data: null
    };
    return res;
  },
  
  mockConsole: () => {
    const originalConsole = { ...console };
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    return () => Object.assign(console, originalConsole);
  }
};

// Export for use in test files
export { TEST_RESULTS_DIR };