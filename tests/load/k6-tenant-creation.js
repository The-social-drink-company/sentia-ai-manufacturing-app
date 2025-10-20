/**
 * k6 Load Test: Tenant Creation Storm
 *
 * BMAD-MULTITENANT-003 Story 3: Load Testing Infrastructure
 *
 * Scenario: Simulate 50 tenants/minute creation to validate
 * schema provisioning performance under load.
 *
 * Usage: k6 run tests/load/k6-tenant-creation.js
 *
 * @module tests/load/k6-tenant-creation
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const tenantCreationDuration = new Trend('tenant_creation_duration');

// Load test configuration
export const options = {
  // Scenario: Create 50 tenants over 60 seconds (50 tenants/minute)
  scenarios: {
    tenant_creation_storm: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s', target: 10 }, // Ramp up to 10 VUs
        { duration: '40s', target: 10 }, // Hold at 10 VUs (50 tenants)
        { duration: '10s', target: 0 },  // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    errors: ['rate<0.05'],              // Error rate < 5%
    tenant_creation_duration: ['p(95)<2000'], // 95% under 2s
  },
};

// Environment variables
const API_URL = __ENV.API_URL || 'http://localhost:5000';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || 'test_admin_token';

export default function () {
  const tenantId = `tenant_${__VU}_${Date.now()}`;

  const payload = JSON.stringify({
    name: `Load Test Tenant ${__VU}`,
    slug: `load-test-${__VU}-${Date.now()}`,
    clerkOrganizationId: `org_loadtest_${__VU}_${Date.now()}`,
    subscriptionTier: 'professional',
    ownerEmail: `owner${__VU}@loadtest.com`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
    },
  };

  const start = Date.now();
  const res = http.post(`${API_URL}/api/admin/tenants`, payload, params);
  const duration = Date.now() - start;

  // Record metrics
  tenantCreationDuration.add(duration);

  // Validate response
  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'response has tenant ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && body.data.id;
      } catch (e) {
        return false;
      }
    },
    'schema provisioned': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.schemaName;
      } catch (e) {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
    console.error(`Tenant creation failed for VU ${__VU}: ${res.status} ${res.body}`);
  } else {
    errorRate.add(0);
  }

  // Sleep 1-2 seconds between requests (50 tenants/minute)
  sleep(1 + Math.random());
}

export function handleSummary(data) {
  return {
    'load-test-results/tenant-creation-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += `${indent}Tenant Creation Load Test Summary\n`;
  summary += `${indent}${'='.repeat(60)}\n\n`;

  // HTTP metrics
  summary += `${indent}HTTP Metrics:\n`;
  summary += `${indent}  Total Requests:     ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Request Rate:       ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  summary += `${indent}  p50 Duration:       ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
  summary += `${indent}  p95 Duration:       ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  p99 Duration:       ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;

  // Tenant creation metrics
  if (data.metrics.tenant_creation_duration) {
    summary += `${indent}Tenant Creation:\n`;
    summary += `${indent}  p95 Creation Time:  ${data.metrics.tenant_creation_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  Target:             < 2000ms\n`;
    const passed = data.metrics.tenant_creation_duration.values['p(95)'] < 2000;
    summary += `${indent}  Status:             ${passed ? '✅ PASS' : '❌ FAIL'}\n\n`;
  }

  // Error rate
  if (data.metrics.errors) {
    const errorRate = data.metrics.errors.values.rate;
    summary += `${indent}Error Rate:\n`;
    summary += `${indent}  Rate:               ${(errorRate * 100).toFixed(2)}%\n`;
    summary += `${indent}  Target:             < 5%\n`;
    const passed = errorRate < 0.05;
    summary += `${indent}  Status:             ${passed ? '✅ PASS' : '❌ FAIL'}\n\n`;
  }

  summary += `${indent}${'='.repeat(60)}\n`;

  return summary;
}
