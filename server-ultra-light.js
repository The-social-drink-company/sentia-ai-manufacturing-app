/**
 * Ultra-lightweight server optimized for Render deployments
 * Memory footprint: < 50MB target
 * Features: Minimal dependencies, aggressive GC, memory monitoring
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Memory optimization settings
const MEMORY_CHECK_INTERVAL = 30000; // 30 seconds
const GC_THRESHOLD = 75; // Trigger GC at 75% heap usage
const MAX_HEAP_MB = 100; // Maximum heap size in MB

console.log('='.repeat(50));
console.log('ULTRA-LIGHT SERVER - MEMORY OPTIMIZED');
console.log('='.repeat(50));
console.log(`Port: ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Memory Limit: ${MAX_HEAP_MB}MB`);
console.log('='.repeat(50));

// Minimal JSON parsing with strict limits
app.use(express.json({
  limit: '100kb',
  strict: true,
  type: 'application/json'
}));

// Health check with memory stats
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const heapPercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);
  const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);

  res.json({
    status: heapPercent < 80 ? 'healthy' : 'warning',
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedMB,
      heapTotalMB,
      heapPercent: `${heapPercent}%`,
      rssMB
    },
    uptime: process.uptime()
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Sentia Manufacturing',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve static files with aggressive caching
const staticOptions = {
  maxAge: '24h',
  etag: true,
  lastModified: true,
  index: false,
  dotfiles: 'ignore',
  redirect: false
};

app.use(express.static(path.join(__dirname, 'dist'), staticOptions));

// React router fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), {
    headers: {
      'Cache-Control': 'public, max-age=3600'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Memory management
let memoryCheckInterval;

function checkMemory() {
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const heapMB = memUsage.heapUsed / 1024 / 1024;

  // Log memory stats
  if (heapPercent > 70) {
    console.log(`Memory: ${heapMB.toFixed(2)}MB (${heapPercent.toFixed(1)}%)`);
  }

  // Trigger GC if available and threshold exceeded
  if (global.gc && heapPercent > GC_THRESHOLD) {
    console.log('Triggering garbage collection...');
    global.gc();

    // Check memory after GC
    setTimeout(() => {
      const afterGC = process.memoryUsage();
      const newPercent = (afterGC.heapUsed / afterGC.heapTotal) * 100;
      console.log(`After GC: ${newPercent.toFixed(1)}%`);
    }, 1000);
  }

  // Emergency restart if memory is critical
  if (heapMB > MAX_HEAP_MB) {
    console.error(`CRITICAL: Memory exceeded ${MAX_HEAP_MB}MB. Restarting...`);
    process.exit(1); // Let Render restart the service
  }
}

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);

  // Initial memory report
  const mem = process.memoryUsage();
  console.log(`Initial memory: ${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB`);

  // Start memory monitoring
  memoryCheckInterval = setInterval(checkMemory, MEMORY_CHECK_INTERVAL);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');

  // Clear intervals
  if (memoryCheckInterval) {
    clearInterval(memoryCheckInterval);
  }

  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Force shutting down');
    process.exit(1);
  }, 10000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;