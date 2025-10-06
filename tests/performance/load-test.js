/**
 * K6 Load Testing Script for Sentia Manufacturing Dashboard
 * Comprehensive load testing with realistic user scenarios
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestCount = new Counter('request_count');
const activeUsers = new Gauge('active_users');

// Load test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 25 },   // Ramp up to 25 users
    { duration: '5m', target: 25 },   // Stay at 25 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '3m', target: 0 },    // Ramp down to 0 users
  ],
  
  thresholds: {
    // Response time thresholds
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    
    // Error rate thresholds
    http_req_failed: ['rate<0.05'], // Less than 5% errors
    error_rate: ['rate<0.05'],
    
    // Custom metric thresholds
    response_time: ['p(95)<2000'],
    request_count: ['count>1000'],
  },
  
  // Test metadata
  ext: {
    loadimpact: {
      projectID: 'sentia-manufacturing',
      name: 'Load Test - Manufacturing Dashboard'
    }
  }
};

// Base URL configuration
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

// User scenarios and endpoints
const scenarios = {
  dashboard_user: {
    weight: 40,
    endpoints: [
      { path: '/', name: 'Homepage' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/api/dashboard/data', name: 'Dashboard Data' },
      { path: '/health', name: 'Health Check' }
    ]
  },
  
  forecasting_user: {
    weight: 25,
    endpoints: [
      { path: '/forecasting', name: 'Forecasting Page' },
      { path: '/api/forecasting/data', name: 'Forecasting Data' },
      { path: '/api/analytics/demand', name: 'Demand Analytics' }
    ]
  },
  
  financial_user: {
    weight: 20,
    endpoints: [
      { path: '/working-capital', name: 'Working Capital' },
      { path: '/what-if', name: 'What-If Analysis' },
      { path: '/api/financial/reports', name: 'Financial Reports' }
    ]
  },
  
  inventory_user: {
    weight: 15,
    endpoints: [
      { path: '/inventory', name: 'Inventory Management' },
      { path: '/production', name: 'Production Tracking' },
      { path: '/api/inventory/levels', name: 'Inventory Levels' }
    ]
  }
};

// Helper functions
function makeRequest(url, name) {
  const startTime = Date.now();
  
  const response = http.get(url, {
    headers: {
      'User-Agent': 'k6-load-test/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive'
    },
    timeout: '30s'
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Record custom metrics
  requestCount.add(1);
  responseTime.add(duration);
  errorRate.add(response.status >= 400);
  activeUsers.add(1);
  
  // Check response
  const checkResult = check(response, {
    [`${name} - Status is 200`]: (r) => r.status === 200,
    [`${name} - Response time < 5s`]: (r) => r.timings.duration < 5000,
    [`${name} - Content length > 0`]: (r) => r.body.length > 0,
    [`${name} - No server errors`]: (r) => r.status < 500,
  });
  
  if (!checkResult) {
    console.log(`❌ ${name} failed - Status: ${response.status}, Duration: ${duration}ms`);
  }
  
  return response;
}

function selectScenario() {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const [scenario, config] of Object.entries(scenarios)) {
    cumulative += config.weight;
    if (random <= cumulative) {
      return config;
    }
  }
  
  return scenarios.dashboard_user; // Fallback
}

function simulateThinkTime() {
  // Simulate realistic user think time (1-5 seconds)
  const thinkTime = Math.random() * 4 + 1;
  sleep(thinkTime);
}

// Main test function
export default function () {
  const scenario = selectScenario();
  const sessionId = `session_${__VU}_${__ITER}`;
  
  group('User Session', function () {
    // Simulate a user session with multiple page visits
    const pagesVisited = Math.floor(Math.random() * 3) + 2; // 2-4 pages per session
    
    for (let i = 0; i < pagesVisited; i++) {
      const endpoint = scenario.endpoints[Math.floor(Math.random() * scenario.endpoints.length)];
      const url = `${BASE_URL}${endpoint.path}`;
      
      group(`Visit ${endpoint.name}`, function () {
        makeRequest(url, endpoint.name);
      });
      
      // Don't sleep after the last request
      if (i < pagesVisited - 1) {
        simulateThinkTime();
      }
    }
  });
  
  // Session end - longer pause before next session
  sleep(Math.random() * 3 + 2); // 2-5 seconds between sessions
}

// Setup function - runs once before all iterations
export function setup() {
  console.log('🚀 Starting load test against:', BASE_URL);
  
  // Verify the application is accessible
  const response = http.get(`${BASE_URL}/health`);
  
  if (response.status !== 200) {
    throw new Error(`Application not accessible. Health check returned ${response.status}`);
  }
  
  console.log('✅ Application health check passed');
  
  return {
    startTime: Date.now(),
    baseUrl: BASE_URL
  };
}

// Teardown function - runs once after all iterations
export function teardown(data) {
  const endTime = Date.now();
  const duration = (endTime - data.startTime) / 1000;
  
  console.log(`🏁 Load test completed in ${duration.toFixed(2)} seconds`);
}

// Custom summary report
export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
    'summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Performance assertions for CI/CD
export function checkPerformanceThresholds(data) {
  const thresholds = {
    avgResponseTime: 1000,  // 1 second
    p95ResponseTime: 2000,  // 2 seconds
    p99ResponseTime: 5000,  // 5 seconds
    errorRate: 0.05,        // 5%
    minThroughput: 50       // 50 RPS
  };
  
  const metrics = data.metrics;
  const issues = [];
  
  // Check average response time
  if (metrics.http_req_duration.values.avg > thresholds.avgResponseTime) {
    issues.push(`Average response time (${metrics.http_req_duration.values.avg.toFixed(2)}ms) exceeds threshold (${thresholds.avgResponseTime}ms)`);
  }
  
  // Check P95 response time
  if (metrics.http_req_duration.values['p(95)'] > thresholds.p95ResponseTime) {
    issues.push(`P95 response time (${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms) exceeds threshold (${thresholds.p95ResponseTime}ms)`);
  }
  
  // Check P99 response time
  if (metrics.http_req_duration.values['p(99)'] > thresholds.p99ResponseTime) {
    issues.push(`P99 response time (${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms) exceeds threshold (${thresholds.p99ResponseTime}ms)`);
  }
  
  // Check error rate
  if (metrics.http_req_failed.values.rate > thresholds.errorRate) {
    issues.push(`Error rate (${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%) exceeds threshold (${thresholds.errorRate * 100}%)`);
  }
  
  // Check throughput
  const throughput = metrics.http_reqs.values.rate;
  if (throughput < thresholds.minThroughput) {
    issues.push(`Throughput (${throughput.toFixed(2)} RPS) below threshold (${thresholds.minThroughput} RPS)`);
  }
  
  if (issues.length > 0) {
    console.log('❌ Performance issues detected:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    return false;
  }
  
  console.log('✅ All performance thresholds met');
  return true;
}