/**
 * k6 Load Test: Mixed Workload (Read-Heavy)
 *
 * BMAD-MULTITENANT-003 Story 3: Load Testing Infrastructure
 *
 * Scenario: Realistic production workload simulation
 * - 70% reads (GET /api/products, GET /api/forecasts)
 * - 20% writes (POST /api/products, POST /api/sales)
 * - 10% analytics (GET /api/dashboard)
 *
 * Usage: k6 run tests/load/k6-mixed-workload.js
 *
 * @module tests/load/k6-mixed-workload
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const readLatency = new Trend('read_latency');
const writeLatency = new Trend('write_latency');
const analyticsLatency = new Trend('analytics_latency');
const errorsByType = new Counter('errors_by_type');

// Load test configuration
export const options = {
  // Scenario: Gradual ramp-up to production load
  scenarios: {
    mixed_workload: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 50 },   // Ramp up to 50 VUs
        { duration: '3m', target: 100 },  // Ramp up to 100 VUs
        { duration: '4m', target: 100 },  // Hold at 100 VUs (peak load)
        { duration: '1m', target: 50 },   // Ramp down to 50 VUs
        { duration: '1m', target: 0 },    // Ramp down to 0
      ],
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<200', 'p(99)<500'],
    'read_latency': ['p(95)<100'],        // Reads should be fast
    'write_latency': ['p(95)<300'],       // Writes can be slower
    'analytics_latency': ['p(95)<500'],   // Analytics can be slowest
    'errors_by_type': ['count<100'],      // Max 100 errors in 10 minutes
  },
};

// Environment variables
const API_URL = __ENV.API_URL || 'http://localhost:5000';

// Test tenant pool (simulate 100 active tenants)
const tenants = [];
for (let i = 1; i <= 100; i++) {
  tenants.push({
    id: `tenant_${i}`,
    clerkOrgId: `org_prod_${i}`,
    token: `prod_token_${i}`,
    tier: i <= 20 ? 'enterprise' : (i <= 60 ? 'professional' : 'starter'),
  });
}

export default function () {
  const tenant = tenants[Math.floor(Math.random() * tenants.length)];

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tenant.token}`,
      'X-Organization-ID': tenant.clerkOrgId,
    },
  };

  // 70% Read operations
  if (Math.random() < 0.7) {
    group('Read Operations', () => {
      // Read products
      const start1 = Date.now();
      const productsRes = http.get(`${API_URL}/api/products`, params);
      readLatency.add(Date.now() - start1);

      check(productsRes, {
        'products: status 200': (r) => r.status === 200,
        'products: has data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body.data);
          } catch (e) {
            return false;
          }
        },
      }) || errorsByType.add(1, { type: 'read_products' });

      // Read sales (50% of reads)
      if (Math.random() < 0.5) {
        const start2 = Date.now();
        const salesRes = http.get(`${API_URL}/api/sales`, params);
        readLatency.add(Date.now() - start2);

        check(salesRes, {
          'sales: status 200': (r) => r.status === 200,
        }) || errorsByType.add(1, { type: 'read_sales' });
      }

      // Read forecasts (only Professional+ tier)
      if (tenant.tier !== 'starter' && Math.random() < 0.3) {
        const start3 = Date.now();
        const forecastsRes = http.get(`${API_URL}/api/forecasts`, params);
        readLatency.add(Date.now() - start3);

        check(forecastsRes, {
          'forecasts: status 200': (r) => r.status === 200,
        }) || errorsByType.add(1, { type: 'read_forecasts' });
      }
    });
  }
  // 20% Write operations
  else if (Math.random() < 0.9) { // 0.7 + 0.2 = 0.9
    group('Write Operations', () => {
      // Create product
      const productPayload = JSON.stringify({
        sku: `MIX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: `Mixed Load Product ${Date.now()}`,
        unitCost: Math.round(Math.random() * 100 * 100) / 100,
        unitPrice: Math.round(Math.random() * 200 * 100) / 100,
      });

      const start1 = Date.now();
      const createRes = http.post(`${API_URL}/api/products`, productPayload, params);
      writeLatency.add(Date.now() - start1);

      check(createRes, {
        'create product: status 201': (r) => r.status === 201,
        'create product: has ID': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && body.data.id;
          } catch (e) {
            return false;
          }
        },
      }) || errorsByType.add(1, { type: 'write_product' });

      // Create sale (50% of writes)
      if (Math.random() < 0.5) {
        const salePayload = JSON.stringify({
          productId: `product_${Math.floor(Math.random() * 100)}`,
          orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          saleDate: new Date().toISOString().split('T')[0],
          channel: ['shopify_uk', 'shopify_usa', 'amazon'][Math.floor(Math.random() * 3)],
          quantity: Math.floor(Math.random() * 20) + 1,
          unitPrice: Math.round(Math.random() * 200 * 100) / 100,
        });

        const start2 = Date.now();
        const saleRes = http.post(`${API_URL}/api/sales`, salePayload, params);
        writeLatency.add(Date.now() - start2);

        check(saleRes, {
          'create sale: status 201': (r) => r.status === 201,
        }) || errorsByType.add(1, { type: 'write_sale' });
      }
    });
  }
  // 10% Analytics operations
  else {
    group('Analytics Operations', () => {
      const start = Date.now();
      const dashboardRes = http.get(`${API_URL}/api/dashboard`, params);
      analyticsLatency.add(Date.now() - start);

      check(dashboardRes, {
        'dashboard: status 200': (r) => r.status === 200,
        'dashboard: has metrics': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && (body.data.products || body.data.sales);
          } catch (e) {
            return false;
          }
        },
      }) || errorsByType.add(1, { type: 'analytics_dashboard' });

      // Working capital analytics (Enterprise only)
      if (tenant.tier === 'enterprise') {
        const wcRes = http.get(`${API_URL}/api/working-capital`, params);
        analyticsLatency.add(Date.now() - Date.now());

        check(wcRes, {
          'working capital: status 200': (r) => r.status === 200,
        }) || errorsByType.add(1, { type: 'analytics_wc' });
      }
    });
  }

  // Think time (realistic user behavior)
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

export function handleSummary(data) {
  return {
    'load-test-results/mixed-workload-summary.json': JSON.stringify(data),
    'load-test-results/mixed-workload-summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';

  let summary = '\n';
  summary += `${indent}Mixed Workload Load Test Summary\n`;
  summary += `${indent}${'='.repeat(60)}\n\n`;

  // HTTP metrics
  summary += `${indent}HTTP Metrics:\n`;
  summary += `${indent}  Total Requests:     ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Request Rate:       ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  summary += `${indent}  p50 Duration:       ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
  summary += `${indent}  p95 Duration:       ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  p99 Duration:       ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;

  // Latency by operation type
  summary += `${indent}Latency by Operation Type:\n`;
  if (data.metrics.read_latency) {
    summary += `${indent}  Reads (p95):        ${data.metrics.read_latency.values['p(95)'].toFixed(2)}ms (target: <100ms)\n`;
  }
  if (data.metrics.write_latency) {
    summary += `${indent}  Writes (p95):       ${data.metrics.write_latency.values['p(95)'].toFixed(2)}ms (target: <300ms)\n`;
  }
  if (data.metrics.analytics_latency) {
    summary += `${indent}  Analytics (p95):    ${data.metrics.analytics_latency.values['p(95)'].toFixed(2)}ms (target: <500ms)\n`;
  }
  summary += '\n';

  // Error analysis
  if (data.metrics.errors_by_type) {
    summary += `${indent}Errors by Type:\n`;
    summary += `${indent}  Total Errors:       ${data.metrics.errors_by_type.values.count}\n`;
    summary += `${indent}  Target:             < 100 errors\n`;
    const passed = data.metrics.errors_by_type.values.count < 100;
    summary += `${indent}  Status:             ${passed ? '✅ PASS' : '❌ FAIL'}\n\n`;
  }

  // Overall assessment
  const p95Pass = data.metrics.http_req_duration.values['p(95)'] < 200;
  const p99Pass = data.metrics.http_req_duration.values['p(99)'] < 500;
  const overallPass = p95Pass && p99Pass;

  summary += `${indent}Overall Assessment:\n`;
  summary += `${indent}  p95 < 200ms:        ${p95Pass ? '✅ PASS' : '❌ FAIL'}\n`;
  summary += `${indent}  p99 < 500ms:        ${p99Pass ? '✅ PASS' : '❌ FAIL'}\n`;
  summary += `${indent}  Status:             ${overallPass ? '✅ PRODUCTION READY' : '⚠️  OPTIMIZATION REQUIRED'}\n\n`;

  summary += `${indent}${'='.repeat(60)}\n`;

  return summary;
}

function htmlReport(data) {
  // Simple HTML report generation
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Mixed Workload Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Mixed Workload Load Test Report</h1>
  <p><strong>Date:</strong> ${new Date().toISOString()}</p>
  <p><strong>Duration:</strong> ${data.state.testRunDurationMs / 1000}s</p>

  <h2>HTTP Metrics</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Requests</td><td>${data.metrics.http_reqs.values.count}</td></tr>
    <tr><td>Request Rate</td><td>${data.metrics.http_reqs.values.rate.toFixed(2)} req/s</td></tr>
    <tr><td>p50 Duration</td><td>${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms</td></tr>
    <tr><td>p95 Duration</td><td>${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms</td></tr>
    <tr><td>p99 Duration</td><td>${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms</td></tr>
  </table>

  <h2>Performance Targets</h2>
  <table>
    <tr><th>Target</th><th>Threshold</th><th>Actual</th><th>Status</th></tr>
    <tr>
      <td>p95 Latency</td>
      <td>&lt; 200ms</td>
      <td>${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms</td>
      <td class="${data.metrics.http_req_duration.values['p(95)'] < 200 ? 'pass' : 'fail'}">
        ${data.metrics.http_req_duration.values['p(95)'] < 200 ? 'PASS' : 'FAIL'}
      </td>
    </tr>
    <tr>
      <td>p99 Latency</td>
      <td>&lt; 500ms</td>
      <td>${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms</td>
      <td class="${data.metrics.http_req_duration.values['p(99)'] < 500 ? 'pass' : 'fail'}">
        ${data.metrics.http_req_duration.values['p(99)'] < 500 ? 'PASS' : 'FAIL'}
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
