#!/usr/bin/env node

/**
 * Build Progress Monitor
 * Tracks memory usage during build stages
 */

const formatBytes = bytes => {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const logMemory = stage => {
  const usage = process.memoryUsage()
  console.log(`[${stage}] Memory Usage:`)
  console.log(`  RSS: ${formatBytes(usage.rss)}`)
  console.log(`  Heap Used: ${formatBytes(usage.heapUsed)}`)
  console.log(`  Heap Total: ${formatBytes(usage.heapTotal)}`)
  console.log(`  External: ${formatBytes(usage.external)}`)
  console.log('---')
}

// Log memory at different stages
console.log('=== BUILD MEMORY MONITOR ===')
logMemory('START')

// Monitor during the build
setInterval(() => {
  logMemory('PROGRESS')
}, 5000)

// Ensure we log on exit
process.on('exit', () => {
  logMemory('END')
})

console.log('Memory monitoring active...')
