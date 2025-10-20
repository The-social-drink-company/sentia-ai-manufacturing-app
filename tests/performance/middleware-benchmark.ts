/**
 * Multi-Tenant Middleware Performance Benchmark
 *
 * BMAD-MULTITENANT-003 Story 2: Performance Baseline
 *
 * Measures middleware performance and establishes baseline metrics:
 * - tenantMiddleware latency: Target <8ms (p95)
 * - featureMiddleware latency: Target <1ms (p95)
 * - rbacMiddleware latency: Target <1ms (p95)
 * - Total middleware chain: Target <10ms (p95)
 *
 * @module tests/performance/middleware-benchmark
 */

import autocannon from 'autocannon'
import express from 'express'
import { createServer } from 'http'
import { tenantMiddleware } from '../../server/middleware/tenant.middleware'
import { requireFeature } from '../../server/middleware/feature.middleware'
import { requireRole } from '../../server/middleware/rbac.middleware'

// Performance metrics collection
interface PerformanceMetrics {
  middlewareName: string
  p50: number
  p95: number
  p99: number
  mean: number
  requests: number
  duration: number
}

const metrics: PerformanceMetrics[] = []

/**
 * Create test Express app with middleware
 */
function createTestApp(): express.Application {
  const app = express()
  app.use(express.json())

  // Baseline: No middleware (control)
  app.get('/api/baseline', (req, res) => {
    res.json({ success: true, message: 'Baseline (no middleware)' })
  })

  // Test 1: Tenant middleware only
  app.get('/api/tenant-only', tenantMiddleware, (req, res) => {
    res.json({ success: true, message: 'Tenant middleware only' })
  })

  // Test 2: Tenant + Feature middleware
  app.get(
    '/api/tenant-feature',
    tenantMiddleware,
    requireFeature('ai_forecasting'),
    (req, res) => {
      res.json({ success: true, message: 'Tenant + Feature middleware' })
    }
  )

  // Test 3: Tenant + RBAC middleware
  app.get(
    '/api/tenant-rbac',
    tenantMiddleware,
    requireRole('member'),
    (req, res) => {
      res.json({ success: true, message: 'Tenant + RBAC middleware' })
    }
  )

  // Test 4: Full middleware chain (tenant + feature + RBAC)
  app.get(
    '/api/full-chain',
    tenantMiddleware,
    requireFeature('ai_forecasting'),
    requireRole('admin'),
    (req, res) => {
      res.json({ success: true, message: 'Full middleware chain' })
    }
  )

  return app
}

/**
 * Run autocannon benchmark on a specific endpoint
 */
async function runBenchmark(
  url: string,
  middlewareName: string,
  headers: Record<string, string>
): Promise<PerformanceMetrics> {
  console.log(`\n📊 Benchmarking: ${middlewareName}`)
  console.log(`   Endpoint: ${url}`)

  const result = await autocannon({
    url,
    connections: 10, // 10 concurrent connections
    duration: 10, // 10 seconds
    headers,
    method: 'GET'
  })

  const metric: PerformanceMetrics = {
    middlewareName,
    p50: result.latency.p50,
    p95: result.latency.p95,
    p99: result.latency.p99,
    mean: result.latency.mean,
    requests: result.requests.total,
    duration: result.duration
  }

  metrics.push(metric)

  console.log(`   ✅ Complete:`)
  console.log(`      Requests: ${result.requests.total}`)
  console.log(`      p50: ${result.latency.p50}ms`)
  console.log(`      p95: ${result.latency.p95}ms`)
  console.log(`      p99: ${result.latency.p99}ms`)

  return metric
}

/**
 * Generate performance baseline report
 */
function generateReport() {
  console.log('\n\n═══════════════════════════════════════════════════════════')
  console.log('   MULTI-TENANT MIDDLEWARE PERFORMANCE BASELINE REPORT')
  console.log('═══════════════════════════════════════════════════════════\n')

  console.log('📊 Latency Metrics (milliseconds):')
  console.log('┌─────────────────────────────┬─────────┬─────────┬─────────┬─────────┐')
  console.log('│ Middleware                  │   p50   │   p95   │   p99   │  Mean   │')
  console.log('├─────────────────────────────┼─────────┼─────────┼─────────┼─────────┤')

  for (const metric of metrics) {
    const name = metric.middlewareName.padEnd(27)
    const p50 = metric.p50.toFixed(2).padStart(7)
    const p95 = metric.p95.toFixed(2).padStart(7)
    const p99 = metric.p99.toFixed(2).padStart(7)
    const mean = metric.mean.toFixed(2).padStart(7)

    console.log(`│ ${name} │ ${p50} │ ${p95} │ ${p99} │ ${mean} │`)
  }

  console.log('└─────────────────────────────┴─────────┴─────────┴─────────┴─────────┘\n')

  // Calculate middleware overhead
  const baseline = metrics.find(m => m.middlewareName === 'Baseline (no middleware)')
  const tenantOnly = metrics.find(m => m.middlewareName === 'Tenant middleware only')
  const tenantFeature = metrics.find(m => m.middlewareName === 'Tenant + Feature middleware')
  const tenantRbac = metrics.find(m => m.middlewareName === 'Tenant + RBAC middleware')
  const fullChain = metrics.find(m => m.middlewareName === 'Full middleware chain')

  if (baseline && tenantOnly && tenantFeature && tenantRbac && fullChain) {
    console.log('📈 Middleware Overhead Analysis:\n')

    const tenantOverhead = tenantOnly.p95 - baseline.p95
    const featureOverhead = tenantFeature.p95 - tenantOnly.p95
    const rbacOverhead = tenantRbac.p95 - tenantOnly.p95
    const fullChainOverhead = fullChain.p95 - baseline.p95

    console.log(`   Tenant Middleware:        ${tenantOverhead.toFixed(2)}ms (p95 overhead)`)
    console.log(`   Feature Middleware:       ${featureOverhead.toFixed(2)}ms (p95 overhead)`)
    console.log(`   RBAC Middleware:          ${rbacOverhead.toFixed(2)}ms (p95 overhead)`)
    console.log(`   Full Chain (total):       ${fullChainOverhead.toFixed(2)}ms (p95 overhead)\n`)

    // Target validation
    console.log('🎯 Target Validation:\n')

    const checks = [
      { name: 'Tenant middleware', actual: tenantOverhead, target: 8, pass: tenantOverhead < 8 },
      { name: 'Feature middleware', actual: featureOverhead, target: 1, pass: featureOverhead < 1 },
      { name: 'RBAC middleware', actual: rbacOverhead, target: 1, pass: rbacOverhead < 1 },
      { name: 'Full chain', actual: fullChainOverhead, target: 10, pass: fullChainOverhead < 10 }
    ]

    for (const check of checks) {
      const status = check.pass ? '✅ PASS' : '❌ FAIL'
      const actual = check.actual.toFixed(2).padStart(6)
      const target = check.target.toString().padStart(2)
      console.log(`   ${status} - ${check.name.padEnd(20)} ${actual}ms / ${target}ms target`)
    }

    // Overall assessment
    const allPass = checks.every(c => c.pass)
    console.log('\n' + '═'.repeat(60))
    if (allPass) {
      console.log('   ✅ ALL PERFORMANCE TARGETS MET')
    } else {
      console.log('   ⚠️  PERFORMANCE TARGETS NOT MET - OPTIMIZATION REQUIRED')
    }
    console.log('═'.repeat(60) + '\n')
  }

  // Throughput summary
  console.log('⚡ Throughput Summary:\n')
  for (const metric of metrics) {
    const rps = (metric.requests / metric.duration).toFixed(0)
    console.log(`   ${metric.middlewareName.padEnd(30)} ${rps.padStart(6)} req/sec`)
  }

  console.log('\n')
}

/**
 * Main benchmark execution
 */
async function main() {
  console.log('🚀 Starting Multi-Tenant Middleware Performance Benchmark')
  console.log('   Duration: 10 seconds per endpoint')
  console.log('   Connections: 10 concurrent')
  console.log('   Method: GET\n')

  // Create and start test server
  const app = createTestApp()
  const server = createServer(app)
  const PORT = 9999

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`✅ Test server started on port ${PORT}`)
      resolve()
    })
  })

  try {
    // Mock Clerk authentication headers
    const headers = {
      'Authorization': 'Bearer sess_test123',
      'X-Organization-ID': 'org_test123',
      'Content-Type': 'application/json'
    }

    // Run benchmarks
    await runBenchmark(`http://localhost:${PORT}/api/baseline`, 'Baseline (no middleware)', {})
    await runBenchmark(`http://localhost:${PORT}/api/tenant-only`, 'Tenant middleware only', headers)
    await runBenchmark(`http://localhost:${PORT}/api/tenant-feature`, 'Tenant + Feature middleware', headers)
    await runBenchmark(`http://localhost:${PORT}/api/tenant-rbac`, 'Tenant + RBAC middleware', headers)
    await runBenchmark(`http://localhost:${PORT}/api/full-chain`, 'Full middleware chain', headers)

    // Generate report
    generateReport()
  } finally {
    // Shutdown server
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('✅ Test server shutdown')
        resolve()
      })
    })
  }
}

// Export for programmatic usage
export { runBenchmark, generateReport, createTestApp }

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Benchmark failed:', error)
    process.exit(1)
  })
}
