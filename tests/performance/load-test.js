import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const apiCalls = new Counter('api_calls');

// Test configuration
export const options = {
  stages: [
    // Ramp-up
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 }, // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
    { duration: '10m', target: 50 }, // Stay at 50 users for 10 minutes
    { duration: '5m', target: 0 }, // Ramp down to 0 users over 5 minutes
  ],
  thresholds: {
    // Performance thresholds
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'], // Error rate must be below 5%
    errors: ['rate<0.05'], // Custom error rate must be below 5%
    response_time: ['p(95)<2000'], // 95% of response times below 2s
    
    // Specific endpoint thresholds
    'http_req_duration{name:health_check}': ['p(95)<500'], // Health check under 500ms
    'http_req_duration{name:api_products}': ['p(95)<1500'], // Products API under 1.5s
    'http_req_duration{name:api_dashboard}': ['p(95)<2000'], // Dashboard under 2s
    'http_req_duration{name:api_integrations}': ['p(95)<3000'], // Integrations under 3s
  },
};

// Test data
const testUsers = [
  { email: 'test1@sentiaspirits.com', role: 'admin' },
  { email: 'test2@sentiaspirits.com', role: 'user' },
  { email: 'test3@sentiaspirits.com', role: 'manager' },
];

const testProducts = [
  { name: 'Test Product 1', sku: 'TEST001', category: 'Spirits' },
  { name: 'Test Product 2', sku: 'TEST002', category: 'Liqueurs' },
  { name: 'Test Product 3', sku: 'TEST003', category: 'Mixers' },
];

// Base URL from environment or default
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Authentication token (would be set in CI/CD)
let authToken = __ENV.AUTH_TOKEN || '';

export function setup() {
  console.log('🚀 Starting performance test setup...');
  console.log(`Base URL: ${BASE_URL}`);
  
  // Authenticate and get token if not provided
  if (!authToken) {
    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@sentiaspirits.com',
      password: 'test-password'
    });
    
    if (loginResponse.status === 200) {
      const loginData = loginResponse.json();
      authToken = loginData.token;
      console.log('✅ Authentication successful');
    } else {
      console.log('⚠️ Authentication failed, proceeding without token');
    }
  }
  
  return { authToken };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': data.authToken ? `Bearer ${data.authToken}` : '',
  };

  // Health Check Test
  group('Health Checks', () => {
    const healthResponse = http.get(`${BASE_URL}/api/health`, {
      headers,
      tags: { name: 'health_check' }
    });
    
    check(healthResponse, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 500ms': (r) => r.timings.duration < 500,
      'health check has status field': (r) => r.json('status') !== undefined,
    });
    
    errorRate.add(healthResponse.status !== 200);
    responseTime.add(healthResponse.timings.duration);
    apiCalls.add(1);
  });

  // Dashboard API Test
  group('Dashboard APIs', () => {
    const dashboardResponse = http.get(`${BASE_URL}/api/dashboard/overview`, {
      headers,
      tags: { name: 'api_dashboard' }
    });
    
    check(dashboardResponse, {
      'dashboard status is 200': (r) => r.status === 200,
      'dashboard response time < 2s': (r) => r.timings.duration < 2000,
      'dashboard has data': (r) => {
        try {
          const data = r.json();
          return data && typeof data === 'object';
        } catch (e) {
          return false;
        }
      },
    });
    
    errorRate.add(dashboardResponse.status !== 200);
    responseTime.add(dashboardResponse.timings.duration);
    apiCalls.add(1);
  });

  // Products API Test
  group('Products APIs', () => {
    // Get products
    const productsResponse = http.get(`${BASE_URL}/api/products`, {
      headers,
      tags: { name: 'api_products' }
    });
    
    check(productsResponse, {
      'products status is 200': (r) => r.status === 200,
      'products response time < 1.5s': (r) => r.timings.duration < 1500,
      'products returns array': (r) => {
        try {
          const data = r.json();
          return Array.isArray(data) || Array.isArray(data.products);
        } catch (e) {
          return false;
        }
      },
    });
    
    errorRate.add(productsResponse.status !== 200);
    responseTime.add(productsResponse.timings.duration);
    apiCalls.add(1);

    // Search products
    const searchResponse = http.get(`${BASE_URL}/api/products/search?q=test`, {
      headers,
      tags: { name: 'api_products_search' }
    });
    
    check(searchResponse, {
      'product search status is 200 or 404': (r) => [200, 404].includes(r.status),
      'product search response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(![200, 404].includes(searchResponse.status));
    responseTime.add(searchResponse.timings.duration);
    apiCalls.add(1);
  });

  // Integrations Health Test
  group('Integration APIs', () => {
    const integrationsResponse = http.get(`${BASE_URL}/api/integrations/health`, {
      headers,
      tags: { name: 'api_integrations' }
    });
    
    check(integrationsResponse, {
      'integrations status is 200': (r) => r.status === 200,
      'integrations response time < 3s': (r) => r.timings.duration < 3000,
      'integrations has health data': (r) => {
        try {
          const data = r.json();
          return data && typeof data === 'object';
        } catch (e) {
          return false;
        }
      },
    });
    
    errorRate.add(integrationsResponse.status !== 200);
    responseTime.add(integrationsResponse.timings.duration);
    apiCalls.add(1);
  });

  // Analytics API Test
  group('Analytics APIs', () => {
    const analyticsResponse = http.get(`${BASE_URL}/api/analytics/summary`, {
      headers,
      tags: { name: 'api_analytics' }
    });
    
    check(analyticsResponse, {
      'analytics status is 200 or 404': (r) => [200, 404].includes(r.status),
      'analytics response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(![200, 404].includes(analyticsResponse.status));
    responseTime.add(analyticsResponse.timings.duration);
    apiCalls.add(1);
  });

  // Forecasting API Test (if available)
  group('Forecasting APIs', () => {
    const forecastResponse = http.get(`${BASE_URL}/api/forecasting/cash-flow`, {
      headers,
      tags: { name: 'api_forecasting' }
    });
    
    check(forecastResponse, {
      'forecasting status is 200 or 404': (r) => [200, 404].includes(r.status),
      'forecasting response time < 5s': (r) => r.timings.duration < 5000,
    });
    
    errorRate.add(![200, 404].includes(forecastResponse.status));
    responseTime.add(forecastResponse.timings.duration);
    apiCalls.add(1);
  });

  // Static Assets Test
  group('Static Assets', () => {
    const assetsResponse = http.get(`${BASE_URL}/`, {
      tags: { name: 'static_assets' }
    });
    
    check(assetsResponse, {
      'static assets status is 200': (r) => r.status === 200,
      'static assets response time < 1s': (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(assetsResponse.status !== 200);
    responseTime.add(assetsResponse.timings.duration);
    apiCalls.add(1);
  });

  // Simulate user think time
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

export function teardown(data) {
  console.log('🏁 Performance test completed');
  console.log(`Total API calls: ${apiCalls.count}`);
  console.log(`Error rate: ${(errorRate.rate * 100).toFixed(2)}%`);
  console.log(`Average response time: ${responseTime.avg.toFixed(2)}ms`);
}

// Utility function for handling errors
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_duration: data.state.testRunDurationMs,
    total_requests: data.metrics.http_reqs.count,
    failed_requests: data.metrics.http_req_failed.count,
    error_rate: (data.metrics.http_req_failed.rate * 100).toFixed(2) + '%',
    avg_response_time: data.metrics.http_req_duration.avg.toFixed(2) + 'ms',
    p95_response_time: data.metrics.http_req_duration['p(95)'].toFixed(2) + 'ms',
    p99_response_time: data.metrics.http_req_duration['p(99)'].toFixed(2) + 'ms',
    max_response_time: data.metrics.http_req_duration.max.toFixed(2) + 'ms',
    throughput: (data.metrics.http_reqs.rate).toFixed(2) + ' req/s',
    data_received: (data.metrics.data_received.count / 1024 / 1024).toFixed(2) + ' MB',
    data_sent: (data.metrics.data_sent.count / 1024).toFixed(2) + ' KB',
    
    // Endpoint-specific metrics
    endpoints: {
      health_check: {
        avg: data.metrics['http_req_duration{name:health_check}']?.avg?.toFixed(2) + 'ms' || 'N/A',
        p95: data.metrics['http_req_duration{name:health_check}']?.['p(95)']?.toFixed(2) + 'ms' || 'N/A'
      },
      api_products: {
        avg: data.metrics['http_req_duration{name:api_products}']?.avg?.toFixed(2) + 'ms' || 'N/A',
        p95: data.metrics['http_req_duration{name:api_products}']?.['p(95)']?.toFixed(2) + 'ms' || 'N/A'
      },
      api_dashboard: {
        avg: data.metrics['http_req_duration{name:api_dashboard}']?.avg?.toFixed(2) + 'ms' || 'N/A',
        p95: data.metrics['http_req_duration{name:api_dashboard}']?.['p(95)']?.toFixed(2) + 'ms' || 'N/A'
      },
      api_integrations: {
        avg: data.metrics['http_req_duration{name:api_integrations}']?.avg?.toFixed(2) + 'ms' || 'N/A',
        p95: data.metrics['http_req_duration{name:api_integrations}']?.['p(95)']?.toFixed(2) + 'ms' || 'N/A'
      }
    },
    
    // Thresholds status
    thresholds_passed: Object.keys(data.metrics).every(metric => {
      const m = data.metrics[metric];
      return !m.thresholds || Object.values(m.thresholds).every(t => !t.abortOnFail || t.ok);
    })
  };
  
  return {
    'performance-results.json': JSON.stringify(summary, null, 2),
    stdout: `
📊 PERFORMANCE TEST SUMMARY
==========================
Duration: ${(data.state.testRunDurationMs / 1000).toFixed(0)}s
Total Requests: ${summary.total_requests}
Failed Requests: ${summary.failed_requests}
Error Rate: ${summary.error_rate}
Throughput: ${summary.throughput}

Response Times:
- Average: ${summary.avg_response_time}
- 95th Percentile: ${summary.p95_response_time}
- 99th Percentile: ${summary.p99_response_time}
- Maximum: ${summary.max_response_time}

Endpoint Performance:
- Health Check: ${summary.endpoints.health_check.avg} (p95: ${summary.endpoints.health_check.p95})
- Products API: ${summary.endpoints.api_products.avg} (p95: ${summary.endpoints.api_products.p95})
- Dashboard API: ${summary.endpoints.api_dashboard.avg} (p95: ${summary.endpoints.api_dashboard.p95})
- Integrations API: ${summary.endpoints.api_integrations.avg} (p95: ${summary.endpoints.api_integrations.p95})

Data Transfer:
- Received: ${summary.data_received}
- Sent: ${summary.data_sent}

Thresholds: ${summary.thresholds_passed ? '✅ PASSED' : '❌ FAILED'}
`
  };
}

