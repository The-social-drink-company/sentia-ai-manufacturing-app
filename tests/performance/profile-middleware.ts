/**
 * Multi-Tenant Middleware Profiling Script
 *
 * BMAD-MULTITENANT-003 Story 2: Performance Baseline
 *
 * Profiles memory usage, CPU utilization, and connection pooling
 * for the multi-tenant middleware system.
 *
 * Usage:
 * - Memory: clinic doctor -- node tests/performance/profile-middleware.ts
 * - CPU: clinic flame -- node tests/performance/profile-middleware.ts
 * - Event Loop: clinic bubbleprof -- node tests/performance/profile-middleware.ts
 *
 * @module tests/performance/profile-middleware
 */

import express from 'express'
import { createServer } from 'http'
import { tenantMiddleware } from '../../server/middleware/tenant.middleware'
import { requireFeature } from '../../server/middleware/feature.middleware'
import { requireRole } from '../../server/middleware/rbac.middleware'
import autocannon from 'autocannon'

/**
 * Create Express app with full middleware stack
 */
function createApp(): express.Application {
  const app = express()
  app.use(express.json())

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' })
  })

  // Full middleware chain endpoint
  app.get(
    '/api/products',
    tenantMiddleware,
    requireFeature('basic_forecasting'),
    requireRole('viewer'),
    (req, res) => {
      res.json({
        success: true,
        data: [
          { id: 1, sku: 'TEST-001', name: 'Test Product 1' },
          { id: 2, sku: 'TEST-002', name: 'Test Product 2' },
          { id: 3, sku: 'TEST-003', name: 'Test Product 3' }
        ]
      })
    }
  )

  return app
}

/**
 * Collect system metrics
 */
function collectMetrics() {
  const memUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()

  return {
    timestamp: new Date().toISOString(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round((memUsage.arrayBuffers || 0) / 1024 / 1024) // MB
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000), // milliseconds
      system: Math.round(cpuUsage.system / 1000) // milliseconds
    }
  }
}

/**
 * Generate profiling report
 */
function generateProfilingReport(metrics: any[]) {
  console.log('\n\n═══════════════════════════════════════════════════════════')
  console.log('   MULTI-TENANT MIDDLEWARE PROFILING REPORT')
  console.log('═══════════════════════════════════════════════════════════\n')

  // Memory analysis
  const memSnapshots = metrics.map(m => m.memory)
  const avgHeapUsed = memSnapshots.reduce((sum, m) => sum + m.heapUsed, 0) / memSnapshots.length
  const maxHeapUsed = Math.max(...memSnapshots.map(m => m.heapUsed))
  const avgRSS = memSnapshots.reduce((sum, m) => sum + m.rss, 0) / memSnapshots.length

  console.log('💾 Memory Usage:\n')
  console.log(`   Average Heap Used:     ${avgHeapUsed.toFixed(2)} MB`)
  console.log(`   Peak Heap Used:        ${maxHeapUsed.toFixed(2)} MB`)
  console.log(`   Average RSS:           ${avgRSS.toFixed(2)} MB`)
  console.log(`   Target Heap:           < 150 MB (healthy)\n`)

  // CPU analysis
  const cpuSnapshots = metrics.map(m => m.cpu)
  const totalUserCPU = cpuSnapshots[cpuSnapshots.length - 1].user - cpuSnapshots[0].user
  const totalSystemCPU = cpuSnapshots[cpuSnapshots.length - 1].system - cpuSnapshots[0].system
  const duration = metrics.length * 2 // seconds (2s interval)

  console.log('⚙️  CPU Utilization:\n')
  console.log(`   User CPU Time:         ${totalUserCPU}ms`)
  console.log(`   System CPU Time:       ${totalSystemCPU}ms`)
  console.log(`   Total Duration:        ${duration}s`)
  console.log(`   Avg CPU per Request:   < 10ms (target)\n`)

  // Assessment
  const heapHealthy = avgHeapUsed < 150
  const memoryStatus = heapHealthy ? '✅ HEALTHY' : '⚠️  HIGH USAGE'

  console.log('🎯 Performance Assessment:\n')
  console.log(`   Memory Status:         ${memoryStatus}`)
  console.log(`   Heap Usage:            ${avgHeapUsed.toFixed(2)} MB / 150 MB target`)

  console.log('\n' + '═'.repeat(60) + '\n')
}

/**
 * Main profiling execution
 */
async function main() {
  console.log('🔍 Starting Multi-Tenant Middleware Profiling')
  console.log('   Profiling Duration: 60 seconds')
  console.log('   Load: 100 req/sec\n')

  const app = createApp()
  const server = createServer(app)
  const PORT = 9998

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`✅ Profiling server started on port ${PORT}`)
      resolve()
    })
  })

  // Collect metrics every 2 seconds
  const metrics: any[] = []
  let intervalId: NodeJS.Timeout | null = null

  try {
    // Start metrics collection
    intervalId = setInterval(() => {
      metrics.push(collectMetrics())
      console.log(`📊 Collected metrics snapshot ${metrics.length}`)
    }, 2000)

    // Run load test
    console.log('\n🚀 Starting load test (60 seconds)...\n')

    const result = await autocannon({
      url: `http://localhost:${PORT}/api/products`,
      connections: 10,
      duration: 60,
      headers: {
        'Authorization': 'Bearer sess_test123',
        'X-Organization-ID': 'org_test123'
      }
    })

    console.log('\n✅ Load test complete')
    console.log(`   Requests: ${result.requests.total}`)
    console.log(`   p95 Latency: ${result.latency.p95}ms`)

    // Stop metrics collection
    if (intervalId) {
      clearInterval(intervalId)
    }

    // Generate report
    generateProfilingReport(metrics)
  } finally {
    if (intervalId) {
      clearInterval(intervalId)
    }

    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('✅ Profiling server shutdown')
        resolve()
      })
    })
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Profiling failed:', error)
    process.exit(1)
  })
}
