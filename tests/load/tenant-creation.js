/**
 * k6 Load Test: Tenant Creation Storm
 *
 * BMAD-MULTITENANT-003 Story 3: Load Testing Infrastructure
 * Scenario 1: Tenant Creation Storm (50 tenants/minute)
 *
 * Tests the system's ability to handle rapid tenant provisioning:
 * - Creates PostgreSQL schema per tenant
 * - Provisions 9 tenant tables
 * - Creates indexes
 * - Creates default company
 *
 * Usage:
 *   k6 run tests/load/tenant-creation.js
 *
 * Environment Variables:
 *   API_URL - Backend API URL (default: http://localhost:5000)
 *   ADMIN_TOKEN - Admin authentication token
 *   DURATION - Test duration (default: 60s)
 *   VUS - Virtual users (default: 10)
 *
 * @module tests/load/tenant-creation
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const tenantCreationFailures = new Rate('tenant_creation_failures')

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 VUs
    { duration: '1m', target: 10 },  // Stay at 10 VUs (creates ~50 tenants/min)
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
    errors: ['rate<0.05'],             // Custom error rate under 5%
    tenant_creation_failures: ['rate<0.01'], // Tenant creation failure under 1%
  },
}

// Test configuration
const API_URL = __ENV.API_URL || 'http://localhost:5000'
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || 'test_admin_token_for_load_testing'
const DURATION = __ENV.DURATION || '60s'

/**
 * Generate unique tenant data for each virtual user iteration
 */
function generateTenantData() {
  const timestamp = Date.now()
  const vu = __VU
  const iter = __ITER

  return {
    name: `Load Test Tenant ${vu}-${iter}`,
    slug: `loadtest-tenant-${vu}-${iter}-${timestamp}`,
    clerkOrganizationId: `org_loadtest_${vu}_${iter}_${timestamp}`,
    subscriptionTier: 'professional',
    subscriptionStatus: 'active',
    maxUsers: 50,
    maxEntities: 10000,
    features: {
      basic_forecasting: true,
      ai_forecasting: true,
      advanced_reports: true,
      bulk_import: true,
      api_access: true
    }
  }
}

/**
 * Main test scenario
 */
export default function () {
  const tenant = generateTenantData()

  // Create tenant
  const createResponse = http.post(
    `${API_URL}/api/tenants`,
    JSON.stringify(tenant),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      tags: { name: 'CreateTenant' },
    }
  )

  // Check response
  const createSuccess = check(createResponse, {
    'status is 201': (r) => r.status === 201,
    'has tenant id': (r) => JSON.parse(r.body).tenant?.id !== undefined,
    'has schema name': (r) => JSON.parse(r.body).tenant?.schemaName !== undefined,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  })

  // Track errors
  errorRate.add(!createSuccess)
  tenantCreationFailures.add(createResponse.status !== 201)

  // If creation successful, verify tenant is accessible
  if (createSuccess) {
    const tenantData = JSON.parse(createResponse.body).tenant
    const tenantId = tenantData.id

    // Wait a bit for schema provisioning to complete
    sleep(0.5)

    // Verify tenant by fetching metadata
    const verifyResponse = http.get(
      `${API_URL}/api/tenants/${tenantId}`,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'X-Organization-ID': tenant.clerkOrganizationId,
        },
        tags: { name: 'VerifyTenant' },
      }
    )

    const verifySuccess = check(verifyResponse, {
      'verify status is 200': (r) => r.status === 200,
      'tenant schema exists': (r) => JSON.parse(r.body).tenant?.schemaName !== undefined,
      'verify time < 500ms': (r) => r.timings.duration < 500,
    })

    errorRate.add(!verifySuccess)

    // Small delay between iterations to simulate realistic load
    sleep(1)
  } else {
    // If creation failed, log and wait before retry
    console.error(`Tenant creation failed: ${createResponse.status} - ${createResponse.body}`)
    sleep(2)
  }
}

/**
 * Setup function - runs once at the start
 */
export function setup() {
  console.log('='.repeat(60))
  console.log('k6 Load Test: Tenant Creation Storm')
  console.log('='.repeat(60))
  console.log(`API URL: ${API_URL}`)
  console.log(`Target: 50 tenants/minute`)
  console.log(`Duration: ${DURATION}`)
  console.log('='.repeat(60))

  // Health check
  const healthResponse = http.get(`${API_URL}/api/health`)
  if (healthResponse.status !== 200) {
    throw new Error(`API health check failed: ${healthResponse.status}`)
  }

  console.log('✅ API health check passed')
  return { startTime: Date.now() }
}

/**
 * Teardown function - runs once at the end
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log('='.repeat(60))
  console.log('Load Test Complete')
  console.log(`Duration: ${duration.toFixed(2)}s`)
  console.log('='.repeat(60))
  console.log('Note: Clean up test tenants manually if needed')
  console.log('  SQL: DELETE FROM tenants WHERE name LIKE \'Load Test Tenant%\';')
  console.log('='.repeat(60))
}

/**
 * Summary handler - custom metrics reporting
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-tenant-creation-report.json': JSON.stringify(data, null, 2),
  }
}

// Helper function for text summary
function textSummary(data, options = {}) {
  const indent = options.indent || ''
  const enableColors = options.enableColors || false

  let summary = '\n'
  summary += indent + '='.repeat(60) + '\n'
  summary += indent + 'Tenant Creation Storm - Test Summary\n'
  summary += indent + '='.repeat(60) + '\n\n'

  // Request metrics
  const httpReqs = data.metrics.http_reqs
  if (httpReqs) {
    summary += indent + `Total Requests: ${httpReqs.values.count}\n`
    summary += indent + `Request Rate: ${httpReqs.values.rate.toFixed(2)} req/s\n\n`
  }

  // Response time
  const httpDuration = data.metrics.http_req_duration
  if (httpDuration) {
    summary += indent + 'Response Time:\n'
    summary += indent + `  Mean: ${httpDuration.values.avg.toFixed(2)} ms\n`
    summary += indent + `  P95: ${httpDuration.values['p(95)'].toFixed(2)} ms\n`
    summary += indent + `  P99: ${httpDuration.values['p(99)'].toFixed(2)} ms\n\n`
  }

  // Error rates
  const httpFailed = data.metrics.http_req_failed
  if (httpFailed) {
    const failRate = (httpFailed.values.rate * 100).toFixed(2)
    summary += indent + `Failed Requests: ${failRate}%\n\n`
  }

  // Custom metrics
  if (data.metrics.errors) {
    const errRate = (data.metrics.errors.values.rate * 100).toFixed(2)
    summary += indent + `Custom Error Rate: ${errRate}%\n`
  }

  if (data.metrics.tenant_creation_failures) {
    const failRate = (data.metrics.tenant_creation_failures.values.rate * 100).toFixed(2)
    summary += indent + `Tenant Creation Failures: ${failRate}%\n`
  }

  summary += indent + '='.repeat(60) + '\n'

  return summary
}
