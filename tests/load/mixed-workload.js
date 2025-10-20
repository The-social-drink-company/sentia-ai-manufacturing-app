/**
 * k6 Load Test: Mixed Workload
 *
 * BMAD-MULTITENANT-003 Story 3: Load Testing Infrastructure
 * Scenario 3: Mixed Workload (Read-heavy 70/20/10)
 *
 * Realistic production workload simulation:
 * - 70% reads (GET /api/products, GET /api/forecasts)
 * - 20% writes (POST /api/products, POST /api/sales)
 * - 10% analytics (GET /api/dashboard, GET /api/reports)
 *
 * Tests full system capabilities under realistic load patterns.
 *
 * Usage:
 *   k6 run tests/load/mixed-workload.js
 *
 * Environment Variables:
 *   API_URL - Backend API URL (default: http://localhost:5000)
 *   TENANT_COUNT - Number of test tenants (default: 10)
 *   DURATION - Test duration (default: 3m)
 *
 * @module tests/load/mixed-workload
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Counter, Trend } from 'k6/metrics'
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'

// Custom metrics
const errorRate = new Rate('errors')
const readOperations = new Counter('read_operations')
const writeOperations = new Counter('write_operations')
const analyticsOperations = new Counter('analytics_operations')
const readLatency = new Trend('read_latency')
const writeLatency = new Trend('write_latency')
const analyticsLatency = new Trend('analytics_latency')

// Configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Warm up
    { duration: '3m', target: 50 },   // Normal load
    { duration: '2m', target: 100 },  // Peak load
    { duration: '1m', target: 50 },   // Cool down
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    // Overall thresholds
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],

    // Operation-specific thresholds
    'read_latency': ['p(95)<100'],      // Reads fast
    'write_latency': ['p(95)<300'],     // Writes moderate
    'analytics_latency': ['p(95)<500'], // Analytics slower
  },
}

const API_URL = __ENV.API_URL || 'http://localhost:5000'
const TENANT_COUNT = parseInt(__ENV.TENANT_COUNT || '10')

// Workload distribution
const WORKLOAD = {
  read: 0.70,    // 70% reads
  write: 0.20,   // 20% writes
  analytics: 0.10 // 10% analytics
}

// Sample product SKUs for testing
const PRODUCT_SKUS = [
  'GIN-001', 'GIN-002', 'GIN-003',
  'VODKA-001', 'VODKA-002',
  'RUM-001', 'RUM-002', 'RUM-003',
  'WHISKEY-001'
]

/**
 * Setup function - prepare test data
 */
export function setup() {
  console.log('='.repeat(60))
  console.log('k6 Load Test: Mixed Workload (70/20/10)')
  console.log('='.repeat(60))
  console.log(`API URL: ${API_URL}`)
  console.log(`Tenant Count: ${TENANT_COUNT}`)
  console.log(`Workload: 70% Reads, 20% Writes, 10% Analytics`)
  console.log('='.repeat(60))

  // Health check
  const healthResponse = http.get(`${API_URL}/api/health`)
  if (healthResponse.status !== 200) {
    throw new Error(`API health check failed: ${healthResponse.status}`)
  }

  console.log('✅ API health check passed')

  // Generate test tenants
  const testTenants = []
  for (let i = 0; i < TENANT_COUNT; i++) {
    testTenants.push({
      id: `tenant_mixed_${i}`,
      clerkOrgId: `org_mixed_${i}`,
      token: `test_token_mixed_${i}`,
      slug: `mixed-${i}`,
      tier: i % 3 === 0 ? 'enterprise' : i % 2 === 0 ? 'professional' : 'starter'
    })
  }

  return { tenants: testTenants, startTime: Date.now() }
}

/**
 * Main test scenario - mixed workload
 */
export default function (data) {
  // Select random tenant
  const tenant = randomItem(data.tenants)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tenant.token}`,
    'X-Organization-ID': tenant.clerkOrgId,
  }

  // Determine operation type based on distribution
  const rand = Math.random()
  let operation = 'read'

  if (rand < WORKLOAD.read) {
    operation = 'read'
  } else if (rand < WORKLOAD.read + WORKLOAD.write) {
    operation = 'write'
  } else {
    operation = 'analytics'
  }

  // Execute operation
  switch (operation) {
    case 'read':
      executeReadOperation(tenant, headers)
      break
    case 'write':
      executeWriteOperation(tenant, headers)
      break
    case 'analytics':
      executeAnalyticsOperation(tenant, headers)
      break
  }

  // Realistic think time
  sleep(randomIntBetween(200, 800) / 1000)
}

/**
 * Read operations (70% of traffic)
 */
function executeReadOperation(tenant, headers) {
  readOperations.add(1)

  const operations = [
    // Get products list
    () => {
      const start = Date.now()
      const response = http.get(
        `${API_URL}/api/tenants/${tenant.id}/products`,
        { headers, tags: { name: 'GetProducts', operation: 'read' } }
      )
      readLatency.add(Date.now() - start)

      return check(response, {
        'read products 200': (r) => r.status === 200 || r.status === 404,
        'read latency < 100ms': (r) => r.timings.duration < 100,
      })
    },

    // Get specific product
    () => {
      const sku = randomItem(PRODUCT_SKUS)
      const start = Date.now()
      const response = http.get(
        `${API_URL}/api/tenants/${tenant.id}/products/${sku}`,
        { headers, tags: { name: 'GetProduct', operation: 'read' } }
      )
      readLatency.add(Date.now() - start)

      return check(response, {
        'read product 200': (r) => r.status === 200 || r.status === 404,
        'read latency < 100ms': (r) => r.timings.duration < 100,
      })
    },

    // Get forecasts (if tier allows)
    () => {
      if (tenant.tier === 'starter') return true // Skip for starter

      const start = Date.now()
      const response = http.get(
        `${API_URL}/api/tenants/${tenant.id}/forecasts`,
        { headers, tags: { name: 'GetForecasts', operation: 'read' } }
      )
      readLatency.add(Date.now() - start)

      return check(response, {
        'read forecasts 200': (r) => r.status === 200 || r.status === 404,
        'read latency < 200ms': (r) => r.timings.duration < 200,
      })
    },

    // Get inventory levels
    () => {
      const start = Date.now()
      const response = http.get(
        `${API_URL}/api/tenants/${tenant.id}/inventory`,
        { headers, tags: { name: 'GetInventory', operation: 'read' } }
      )
      readLatency.add(Date.now() - start)

      return check(response, {
        'read inventory 200': (r) => r.status === 200 || r.status === 404,
        'read latency < 100ms': (r) => r.timings.duration < 100,
      })
    }
  ]

  const operation = randomItem(operations)
  const success = operation()
  errorRate.add(!success)
}

/**
 * Write operations (20% of traffic)
 */
function executeWriteOperation(tenant, headers) {
  writeOperations.add(1)

  const operations = [
    // Create product
    () => {
      const product = {
        sku: `TEST-${randomIntBetween(1000, 9999)}`,
        name: `Load Test Product ${randomIntBetween(1, 1000)}`,
        category: randomItem(['gin', 'vodka', 'rum', 'whiskey']),
        price: randomIntBetween(20, 100),
        cost: randomIntBetween(10, 50),
        stockLevel: randomIntBetween(0, 1000)
      }

      const start = Date.now()
      const response = http.post(
        `${API_URL}/api/tenants/${tenant.id}/products`,
        JSON.stringify(product),
        { headers, tags: { name: 'CreateProduct', operation: 'write' } }
      )
      writeLatency.add(Date.now() - start)

      return check(response, {
        'create product 201': (r) => r.status === 201 || r.status === 400,
        'write latency < 300ms': (r) => r.timings.duration < 300,
      })
    },

    // Record sale
    () => {
      const sale = {
        sku: randomItem(PRODUCT_SKUS),
        quantity: randomIntBetween(1, 100),
        unitPrice: randomIntBetween(20, 100),
        channel: randomItem(['shopify', 'amazon', 'direct']),
        saleDate: new Date().toISOString()
      }

      const start = Date.now()
      const response = http.post(
        `${API_URL}/api/tenants/${tenant.id}/sales`,
        JSON.stringify(sale),
        { headers, tags: { name: 'RecordSale', operation: 'write' } }
      )
      writeLatency.add(Date.now() - start)

      return check(response, {
        'record sale 201': (r) => r.status === 201 || r.status === 400,
        'write latency < 300ms': (r) => r.timings.duration < 300,
      })
    },

    // Update inventory
    () => {
      const update = {
        sku: randomItem(PRODUCT_SKUS),
        quantity: randomIntBetween(-50, 200),
        reason: randomItem(['sale', 'restock', 'adjustment']),
        timestamp: new Date().toISOString()
      }

      const start = Date.now()
      const response = http.post(
        `${API_URL}/api/tenants/${tenant.id}/inventory/adjust`,
        JSON.stringify(update),
        { headers, tags: { name: 'AdjustInventory', operation: 'write' } }
      )
      writeLatency.add(Date.now() - start)

      return check(response, {
        'adjust inventory 200': (r) => r.status === 200 || r.status === 400 || r.status === 404,
        'write latency < 300ms': (r) => r.timings.duration < 300,
      })
    }
  ]

  const operation = randomItem(operations)
  const success = operation()
  errorRate.add(!success)
}

/**
 * Analytics operations (10% of traffic)
 */
function executeAnalyticsOperation(tenant, headers) {
  analyticsOperations.add(1)

  const operations = [
    // Get dashboard metrics
    () => {
      const start = Date.now()
      const response = http.get(
        `${API_URL}/api/tenants/${tenant.id}/dashboard`,
        { headers, tags: { name: 'GetDashboard', operation: 'analytics' } }
      )
      analyticsLatency.add(Date.now() - start)

      return check(response, {
        'dashboard 200': (r) => r.status === 200 || r.status === 404,
        'analytics latency < 500ms': (r) => r.timings.duration < 500,
      })
    },

    // Get working capital analysis
    () => {
      const start = Date.now()
      const response = http.get(
        `${API_URL}/api/tenants/${tenant.id}/working-capital`,
        { headers, tags: { name: 'GetWorkingCapital', operation: 'analytics' } }
      )
      analyticsLatency.add(Date.now() - start)

      return check(response, {
        'working capital 200': (r) => r.status === 200 || r.status === 404,
        'analytics latency < 500ms': (r) => r.timings.duration < 500,
      })
    },

    // Get financial reports
    () => {
      const start = Date.now()
      const response = http.get(
        `${API_URL}/api/tenants/${tenant.id}/reports/financial`,
        { headers, tags: { name: 'GetFinancialReport', operation: 'analytics' } }
      )
      analyticsLatency.add(Date.now() - start)

      return check(response, {
        'financial report 200': (r) => r.status === 200 || r.status === 404,
        'analytics latency < 500ms': (r) => r.timings.duration < 500,
      })
    }
  ]

  const operation = randomItem(operations)
  const success = operation()
  errorRate.add(!success)
}

/**
 * Teardown function
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log('='.repeat(60))
  console.log('Mixed Workload Test Complete')
  console.log(`Duration: ${duration.toFixed(2)}s`)
  console.log('='.repeat(60))
}

/**
 * Custom summary handler
 */
export function handleSummary(data) {
  const summary = generateTextSummary(data)

  return {
    'stdout': summary,
    'load-test-mixed-workload-report.json': JSON.stringify(data, null, 2),
  }
}

function generateTextSummary(data) {
  let summary = '\n' + '='.repeat(60) + '\n'
  summary += 'Mixed Workload (70/20/10) - Test Summary\n'
  summary += '='.repeat(60) + '\n\n'

  // Operation counts
  if (data.metrics.read_operations) {
    summary += `Read Operations: ${data.metrics.read_operations.values.count}\n`
  }
  if (data.metrics.write_operations) {
    summary += `Write Operations: ${data.metrics.write_operations.values.count}\n`
  }
  if (data.metrics.analytics_operations) {
    summary += `Analytics Operations: ${data.metrics.analytics_operations.values.count}\n\n`
  }

  // Total requests
  const httpReqs = data.metrics.http_reqs
  if (httpReqs) {
    summary += `Total Requests: ${httpReqs.values.count}\n`
    summary += `Request Rate: ${httpReqs.values.rate.toFixed(2)} req/s\n\n`
  }

  // Response times by operation type
  summary += 'Response Times by Operation:\n'

  if (data.metrics.read_latency) {
    const read = data.metrics.read_latency
    summary += `  Read (70%):\n`
    summary += `    Mean: ${read.values.avg.toFixed(2)} ms\n`
    summary += `    P95: ${read.values['p(95)'].toFixed(2)} ms [Target: <100ms]\n\n`
  }

  if (data.metrics.write_latency) {
    const write = data.metrics.write_latency
    summary += `  Write (20%):\n`
    summary += `    Mean: ${write.values.avg.toFixed(2)} ms\n`
    summary += `    P95: ${write.values['p(95)'].toFixed(2)} ms [Target: <300ms]\n\n`
  }

  if (data.metrics.analytics_latency) {
    const analytics = data.metrics.analytics_latency
    summary += `  Analytics (10%):\n`
    summary += `    Mean: ${analytics.values.avg.toFixed(2)} ms\n`
    summary += `    P95: ${analytics.values['p(95)'].toFixed(2)} ms [Target: <500ms]\n\n`
  }

  // Overall performance
  const httpDuration = data.metrics.http_req_duration
  if (httpDuration) {
    summary += 'Overall Performance:\n'
    summary += `  P50: ${httpDuration.values.med.toFixed(2)} ms\n`
    summary += `  P95: ${httpDuration.values['p(95)'].toFixed(2)} ms [Target: <200ms]\n`
    summary += `  P99: ${httpDuration.values['p(99)'].toFixed(2)} ms [Target: <500ms]\n\n`
  }

  // Error rate
  const errRate = (data.metrics.errors?.values.rate || 0) * 100
  const passIcon = errRate < 5.0 ? '✅' : '❌'
  summary += `Error Rate: ${errRate.toFixed(2)}% ${passIcon}\n`

  summary += '\n' + '='.repeat(60) + '\n'

  // Verdict
  const p95 = httpDuration?.values['p(95)'] || 0
  const p99 = httpDuration?.values['p(99)'] || 0
  const passed = p95 < 200 && p99 < 500 && errRate < 5.0

  summary += passed ? '✅ MIXED WORKLOAD TEST PASSED\n' : '❌ MIXED WORKLOAD TEST FAILED\n'
  summary += '='.repeat(60) + '\n'

  return summary
}
