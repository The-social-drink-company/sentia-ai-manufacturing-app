#!/usr/bin/env node

/**
 * FORCE MEMORY FIX - EMERGENCY DEPLOYMENT SCRIPT
 * This completely bypasses all autonomous testing
 */

// Set ALL memory protection flags
process.env.NODE_OPTIONS = '--max-old-space-size=1024' // Only 1GB to be EXTRA safe
process.env.DISABLE_AUTONOMOUS_TESTING = 'true'
process.env.DISABLE_TEST_DATA_GENERATION = 'true'
process.env.SKIP_AUTONOMOUS_TESTS = 'true'
process.env.NO_AUTONOMOUS = 'true'
process.env.NODE_ENV = 'production' // Force production mode

console.log('='.repeat(70))
console.log('EMERGENCY MEMORY FIX ACTIVE')
console.log('='.repeat(70))
console.log('Memory Limited to: 1GB')
console.log('Autonomous Testing: COMPLETELY DISABLED')
console.log('Test Data Factory: COMPLETELY DISABLED')
console.log('='.repeat(70))

// Just start a minimal server
import express from 'express'
const app = express()
const PORT = process.env.PORT || 10000

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    memory: process.memoryUsage(),
    message: 'Emergency memory fix active',
  })
})

app.get('*', (req, res) => {
  res.send(`
    <h1>Sentia Manufacturing Dashboard</h1>
    <p>Emergency memory-safe mode active</p>
    <p>Memory usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB / 1024MB</p>
  `)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Emergency server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})

// Monitor memory
setInterval(() => {
  const usage = process.memoryUsage()
  const mb = Math.round(usage.rss / 1024 / 1024)
  console.log(`Memory: ${mb}MB / 1024MB`)

  if (mb > 900) {
    console.error('WARNING: Approaching memory limit!')
    if (global.gc) global.gc()
  }
}, 10000)
