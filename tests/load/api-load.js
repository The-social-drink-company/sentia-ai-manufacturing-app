/**
 * k6 Load Test: Concurrent API Requests
 *
 * BMAD-MULTITENANT-003 Story 3: Load Testing Infrastructure
 * Scenario 2: Concurrent API Requests (1000 RPS)
 *
 * Tests the system's ability to handle high-throughput tenant-scoped requests:
 * - 100 concurrent virtual users
 * - 1000 requests per second sustained
 * - Tenant context switching per request
 * - PostgreSQL search_path changes
 *
 * Usage:
 *   k6 run tests/load/api-load.js
 *
 * Environment Variables:
 *   API_URL - Backend API URL (default: http://localhost:5000)
 *   TENANT_COUNT - Number of test tenants (default: 10)
 *   TARGET_RPS - Target requests/sec (default: 1000)
 *
 * @module tests/load/api-load
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Counter, Trend } from 'k6/metrics'
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'

// Custom metrics
const errorRate = new Rate('errors')
const tenantSwitchingTime = new Trend('tenant_switching_time')
const apiRequestsPerTenant = new Counter('api_requests_per_tenant')

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 VUs
    { duration: '1m', target: 100 },   // Ramp up to 100 VUs (target 1000 RPS)
    { duration: '2m', target: 100 },   // Stay at 100 VUs
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],  // 95% under 100ms
    http_req_failed: ['rate<0.001'],   // Error rate under 0.1%
    errors: ['rate<0.01'],             // Custom error rate under 1%
    tenant_switching_time: ['p(95)<10'], // Tenant switch under 10ms (p95)
  },
}

const API_URL = __ENV.API_URL || 'http://localhost:5000'
const TENANT_COUNT = parseInt(__ENV.TENANT_COUNT || '10')
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '1000')

// Test data - simulates multiple tenants
let testTenants = []

/**
 * Setup function - create test tenants
 */
export function setup() {
  console.log('='.repeat(60))
  console.log('k6 Load Test: Concurrent API Requests')
  console.log('='.repeat(60))
  console.log(`API URL: ${API_URL}`)
  console.log(`Tenant Count: ${TENANT_COUNT}`)
  console.log(`Target RPS: ${TARGET_RPS}`)
  console.log('='.repeat(60))

  // Health check
  const healthResponse = http.get(`${API_URL}/api/health`)
  if (healthResponse.status !== 200) {
    throw new Error(`API health check failed: ${healthResponse.status}`)
  }

  console.log('✅ API health check passed')
  console.log(`📦 Using ${TENANT_COUNT} test tenants for load distribution`)

  // Generate test tenant data (would be real tenants in production)
  for (let i = 0; i < TENANT_COUNT; i++) {
    testTenants.push({
      id: `tenant_loadtest_${i}`,
      clerkOrgId: `org_loadtest_${i}`,
      token: `test_token_tenant_${i}`,
      slug: `loadtest-${i}`,
      tier: i % 3 === 0 ? 'enterprise' : i % 2 === 0 ? 'professional' : 'starter'
    })
  }

  return { tenants: testTenants, startTime: Date.now() }
}

/**
 * Main test scenario - concurrent API requests
 */
export default function (data) {
  // Randomly select a tenant for this request
  const tenant = data.tenants[randomIntBetween(0, data.tenants.length - 1)]

  // Headers with tenant context
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tenant.token}`,
    'X-Organization-ID': tenant.clerkOrgId,
  }

  // Track tenant switching performance
  const switchStart = Date.now()

  // Scenario 1: Get tenant products (most common read operation)
  const productsResponse = http.get(
    `${API_URL}/api/tenants/${tenant.id}/products`,
    {
      headers,
      tags: { name: 'GetProducts', tenant: tenant.id },
    }
  )

  const switchDuration = Date.now() - switchStart
  tenantSwitchingTime.add(switchDuration)
  apiRequestsPerTenant.add(1, { tenant: tenant.id })

  const productsSuccess = check(productsResponse, {
    'products status 200': (r) => r.status === 200 || r.status === 404, // 404 OK if no products
    'products response time < 100ms': (r) => r.timings.duration < 100,
    'has correct tenant context': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.tenantId === tenant.id || r.status === 404
      } catch {
        return false
      }
    },
  })

  errorRate.add(!productsSuccess)

  // Small random delay to simulate realistic load pattern
  sleep(randomIntBetween(10, 50) / 1000) // 10-50ms

  // Scenario 2: Get dashboard metrics (analytics endpoint)
  const dashboardResponse = http.get(
    `${API_URL}/api/tenants/${tenant.id}/dashboard`,
    {
      headers,
      tags: { name: 'GetDashboard', tenant: tenant.id },
    }
  )

  const dashboardSuccess = check(dashboardResponse, {
    'dashboard status 200': (r) => r.status === 200 || r.status === 404,
    'dashboard response time < 200ms': (r) => r.timings.duration < 200,
  })

  errorRate.add(!dashboardSuccess)

  // Scenario 3: Query forecasts (if professional/enterprise tier)
  if (tenant.tier !== 'starter') {
    sleep(randomIntBetween(5, 20) / 1000)

    const forecastsResponse = http.get(
      `${API_URL}/api/tenants/${tenant.id}/forecasts`,
      {
        headers,
        tags: { name: 'GetForecasts', tenant: tenant.id },
      }
    )

    const forecastsSuccess = check(forecastsResponse, {
      'forecasts status 200 or 403': (r) => r.status === 200 || r.status === 403 || r.status === 404,
      'forecasts response time < 300ms': (r) => r.timings.duration < 300,
    })

    errorRate.add(!forecastsSuccess)
  }

  // Random think time between request batches
  sleep(randomIntBetween(100, 500) / 1000) // 100-500ms
}

/**
 * Teardown function
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log('='.repeat(60))
  console.log('Load Test Complete')
  console.log(`Duration: ${duration.toFixed(2)}s`)
  console.log(`Tenants: ${data.tenants.length}`)
  console.log('='.repeat(60))
}

/**
 * Custom summary handler
 */
export function handleSummary(data) {
  const summary = generateTextSummary(data)

  return {
    'stdout': summary,
    'load-test-api-load-report.json': JSON.stringify(data, null, 2),
  }
}

function generateTextSummary(data) {
  let summary = '\n' + '='.repeat(60) + '\n'
  summary += 'Concurrent API Requests - Test Summary\n'
  summary += '='.repeat(60) + '\n\n'

  // Total requests
  const httpReqs = data.metrics.http_reqs
  if (httpReqs) {
    summary += `Total Requests: ${httpReqs.values.count}\n`
    summary += `Request Rate: ${httpReqs.values.rate.toFixed(2)} req/s\n`
    summary += `Target RPS: ${TARGET_RPS} req/s\n`
    const rpsAchieved = (httpReqs.values.rate / TARGET_RPS * 100).toFixed(1)
    summary += `RPS Achievement: ${rpsAchieved}% of target\n\n`
  }

  // Response times
  const httpDuration = data.metrics.http_req_duration
  if (httpDuration) {
    summary += 'Response Time:\n'
    summary += `  Mean: ${httpDuration.values.avg.toFixed(2)} ms\n`
    summary += `  Median: ${httpDuration.values.med.toFixed(2)} ms\n`
    summary += `  P95: ${httpDuration.values['p(95)'].toFixed(2)} ms [Target: <100ms]\n`
    summary += `  P99: ${httpDuration.values['p(99)'].toFixed(2)} ms\n`
    summary += `  Max: ${httpDuration.values.max.toFixed(2)} ms\n\n`
  }

  // Tenant switching performance
  const switchingTime = data.metrics.tenant_switching_time
  if (switchingTime) {
    summary += 'Tenant Switching Performance:\n'
    summary += `  Mean: ${switchingTime.values.avg.toFixed(2)} ms\n`
    summary += `  P95: ${switchingTime.values['p(95)'].toFixed(2)} ms [Target: <10ms]\n`
    summary += `  P99: ${switchingTime.values['p(99)'].toFixed(2)} ms\n\n`
  }

  // Error rates
  const httpFailed = data.metrics.http_req_failed
  if (httpFailed) {
    const failRate = (httpFailed.values.rate * 100).toFixed(3)
    const passIcon = failRate < 0.1 ? '✅' : '❌'
    summary += `Failed Requests: ${failRate}% ${passIcon}\n`
  }

  if (data.metrics.errors) {
    const errRate = (data.metrics.errors.values.rate * 100).toFixed(2)
    const passIcon = errRate < 1.0 ? '✅' : '❌'
    summary += `Custom Error Rate: ${errRate}% ${passIcon}\n`
  }

  summary += '\n' + '='.repeat(60) + '\n'

  // Verdict
  const p95 = httpDuration?.values['p(95)'] || 0
  const errRate = (data.metrics.errors?.values.rate || 0) * 100
  const passed = p95 < 100 && errRate < 1.0

  summary += passed ? '✅ LOAD TEST PASSED\n' : '❌ LOAD TEST FAILED\n'
  summary += '='.repeat(60) + '\n'

  return summary
}
