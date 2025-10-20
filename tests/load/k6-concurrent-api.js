/**
 * k6 Load Test: Concurrent API Requests
 *
 * BMAD-MULTITENANT-003 Story 3: Load Testing Infrastructure
 *
 * Scenario: 100 concurrent tenants making API requests at 1000 RPS
 * to validate middleware performance under production load.
 *
 * Usage: k6 run tests/load/k6-concurrent-api.js
 *
 * @module tests/load/k6-concurrent-api
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const apiLatency = new Trend('api_latency');
const tenantsActive = new Counter('tenants_active');

// Load test configuration
export const options = {
  // Scenario: 100 concurrent tenants, 1000 RPS sustained
  scenarios: {
    concurrent_api_load: {
      executor: 'constant-arrival-rate',
      rate: 1000,              // 1000 iterations/second (RPS)
      timeUnit: '1s',
      duration: '2m',          // 2 minute test
      preAllocatedVUs: 50,     // Pre-allocate 50 VUs
      maxVUs: 100,             // Scale up to 100 VUs if needed
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% under 200ms
    errors: ['rate<0.001'],            // Error rate < 0.1%
    api_latency: ['p(50)<50', 'p(95)<200', 'p(99)<500'], // Latency targets
  },
};

// Environment variables
const API_URL = __ENV.API_URL || 'http://localhost:5000';

// Mock tenant data (100 tenants)
const tenants = [];
for (let i = 1; i <= 100; i++) {
  tenants.push({
    id: `tenant_${i}`,
    clerkOrgId: `org_test_${i}`,
    token: `mock_token_${i}`,
  });
}

// API endpoints to test (weighted distribution)
const endpoints = [
  { path: '/api/products', weight: 0.4, method: 'GET' },           // 40% reads
  { path: '/api/sales', weight: 0.3, method: 'GET' },              // 30% reads
  { path: '/api/forecasts', weight: 0.1, method: 'GET' },          // 10% reads
  { path: '/api/products', weight: 0.15, method: 'POST' },         // 15% writes
  { path: '/api/sales', weight: 0.05, method: 'POST' },            // 5% writes
];

// Select weighted random endpoint
function selectEndpoint() {
  const rand = Math.random();
  let cumulative = 0;

  for (const endpoint of endpoints) {
    cumulative += endpoint.weight;
    if (rand <= cumulative) {
      return endpoint;
    }
  }

  return endpoints[0]; // Fallback
}

export default function () {
  // Select random tenant (simulate 100 concurrent tenants)
  const tenant = tenants[Math.floor(Math.random() * tenants.length)];
  tenantsActive.add(1);

  // Select endpoint based on weighted distribution
  const endpoint = selectEndpoint();

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tenant.token}`,
      'X-Organization-ID': tenant.clerkOrgId,
    },
  };

  let res;
  const start = Date.now();

  if (endpoint.method === 'GET') {
    res = http.get(`${API_URL}${endpoint.path}`, params);
  } else if (endpoint.method === 'POST') {
    const payload = generatePayload(endpoint.path);
    res = http.post(`${API_URL}${endpoint.path}`, JSON.stringify(payload), params);
  }

  const duration = Date.now() - start;
  apiLatency.add(duration);

  // Validate response
  const success = check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true || body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (success) {
    successRate.add(1);
    errorRate.add(0);
  } else {
    successRate.add(0);
    errorRate.add(1);
    console.error(`API request failed: ${endpoint.method} ${endpoint.path} - ${res.status}`);
  }

  // No sleep - constant arrival rate handled by k6
}

// Generate realistic payload for POST requests
function generatePayload(path) {
  if (path === '/api/products') {
    return {
      sku: `LOAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Load Test Product ${Date.now()}`,
      unitCost: Math.round(Math.random() * 100 * 100) / 100,
      unitPrice: Math.round(Math.random() * 200 * 100) / 100,
    };
  } else if (path === '/api/sales') {
    return {
      productId: `product_${Math.floor(Math.random() * 100)}`,
      orderId: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      saleDate: new Date().toISOString().split('T')[0],
      channel: ['shopify_uk', 'shopify_usa', 'amazon'][Math.floor(Math.random() * 3)],
      quantity: Math.floor(Math.random() * 50) + 1,
      unitPrice: Math.round(Math.random() * 200 * 100) / 100,
    };
  }

  return {};
}

export function handleSummary(data) {
  return {
    'load-test-results/concurrent-api-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';

  let summary = '\n';
  summary += `${indent}Concurrent API Load Test Summary\n`;
  summary += `${indent}${'='.repeat(60)}\n\n`;

  // HTTP metrics
  summary += `${indent}HTTP Metrics:\n`;
  summary += `${indent}  Total Requests:     ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Request Rate:       ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  summary += `${indent}  Target Rate:        1000 req/s\n`;
  const ratePass = data.metrics.http_reqs.values.rate >= 950; // 95% of target
  summary += `${indent}  Status:             ${ratePass ? '✅ PASS' : '❌ FAIL'}\n\n`;

  // Latency metrics
  summary += `${indent}Latency:\n`;
  summary += `${indent}  p50:                ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms (target: <50ms)\n`;
  summary += `${indent}  p95:                ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms (target: <200ms)\n`;
  summary += `${indent}  p99:                ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms (target: <500ms)\n`;
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  summary += `${indent}  Status:             ${p95 < 200 ? '✅ PASS' : '❌ FAIL'}\n\n`;

  // Error rate
  if (data.metrics.errors) {
    const errorRate = data.metrics.errors.values.rate;
    summary += `${indent}Error Rate:\n`;
    summary += `${indent}  Rate:               ${(errorRate * 100).toFixed(3)}%\n`;
    summary += `${indent}  Target:             < 0.1%\n`;
    const passed = errorRate < 0.001;
    summary += `${indent}  Status:             ${passed ? '✅ PASS' : '❌ FAIL'}\n\n`;
  }

  // Success rate
  if (data.metrics.success) {
    const successRate = data.metrics.success.values.rate;
    summary += `${indent}Success Rate:\n`;
    summary += `${indent}  Rate:               ${(successRate * 100).toFixed(2)}%\n`;
    summary += `${indent}  Target:             > 99.9%\n`;
    const passed = successRate > 0.999;
    summary += `${indent}  Status:             ${passed ? '✅ PASS' : '❌ FAIL'}\n\n`;
  }

  summary += `${indent}${'='.repeat(60)}\n`;

  return summary;
}
