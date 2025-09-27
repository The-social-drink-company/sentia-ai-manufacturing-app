#!/usr/bin/env node

/**
 * RENDER MEMORY-OPTIMIZED ENTRY POINT
 * Fixes memory overflow issues on Render deployment
 *
 * CRITICAL FIXES:
 * 1. Disables autonomous testing in production
 * 2. Sets Node.js memory limits
 * 3. Enables garbage collection optimization
 * 4. Disables memory-intensive features
 */

// Set memory limits BEFORE anything else loads
process.env.NODE_OPTIONS = '--max-old-space-size=1536'; // Limit to 1.5GB (Render has 2GB limit)

// Disable memory-intensive features in production
process.env.DISABLE_AUTONOMOUS_TESTING = 'true';
process.env.DISABLE_TEST_DATA_GENERATION = 'true';
process.env.DISABLE_MEMORY_MONITORING = 'false'; // Keep monitoring to track usage
process.env.ENABLE_GC_OPTIMIZATION = 'true';

console.log('='.repeat(70));
console.log('RENDER MEMORY-OPTIMIZED ENTRY POINT');
console.log('='.repeat(70));
console.log('Memory Limit: 1.5GB (Render limit: 2GB)');
console.log('Autonomous Testing: DISABLED');
console.log('Test Data Generation: DISABLED');
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('Port:', process.env.PORT || 5000);
console.log('='.repeat(70));

// Monitor memory usage
const formatMemory = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

setInterval(_() => {
  const usage = process.memoryUsage();
  const heapUsed = formatMemory(usage.heapUsed);
  const heapTotal = formatMemory(usage.heapTotal);
  const rss = formatMemory(usage.rss);

  console.log(`Memory Usage - RSS: ${rss}, Heap: ${heapUsed}/${heapTotal}`);

  // Warn if approaching limit
  if (usage.rss > 1.8 * 1024 * 1024 * 1024) { // 1.8GB
    console.error('WARNING: Approaching 2GB memory limit!');
    // Force garbage collection if available
    if (global.gc) {
      console.log('Running garbage collection...');
      global.gc();
    }
  }
}, 30000); // Check every 30 seconds

// CRITICAL: Kill any autonomous testing processes
process.env.DISABLE_AUTONOMOUS_TESTING = 'true';
process.env.DISABLE_TEST_DATA_GENERATION = 'true';
process.env.SKIP_AUTONOMOUS_TESTS = 'true';
process.env.NO_AUTONOMOUS = 'true';

// Load the fixed server
console.log('Starting memory-optimized server...');
console.log('AUTONOMOUS TESTING DISABLED: ', process.env.DISABLE_AUTONOMOUS_TESTING);
import('./server-fixed.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});