import compression from 'compression';
import { performance } from 'perf_hooks';
import { 
  registerHealthCheck, 
  checkDatabase, 
  checkRedis, 
  checkSystemResources,
  checkQueue,
  performHealthCheck,
  performReadinessCheck 
} from '../health/monitoring.js';
import {
  correlationIdMiddleware,
  requestLoggingMiddleware,
  errorLoggingMiddleware,
  logInfo,
  logError
} from '../observability/structuredLogger.js';
import { 
  sloMiddleware, 
  trackClientLatency,
  sloTracker 
} from '../observability/sloMetrics.js';
import { setupSecurity } from '../security/middleware.js';
import { metricsMiddleware } from '../metrics.js';

// Graceful shutdown handler
class GracefulShutdown {
  constructor() {
    this.isShuttingDown = false;
    this.connections = new Set();
    this.server = null;
  }
  
  init(server) {
    this.server = server;
    
    // Track connections
    server.on(_'connection', _(connection) => {
      this.connections.add(connection);
      
      connection.on(_'close', () => {
        this.connections.delete(connection);
      });
    });
    
    // Handle shutdown signals
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    
    // Handle uncaught errors
    process.on(_'uncaughtException', _(error) => {
      logError('Uncaught exception', error);
      this.shutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on(_'unhandledRejection', _(reason, _promise) => {
      logError('Unhandled rejection', new Error(String(reason)), {
        promise: String(promise)
      });
    });
  }
  
  async shutdown(signal) {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    const shutdownTimeout = parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT) || 30000;
    
    logInfo(`Graceful shutdown initiated by ${signal}`, {
      signal,
      timeout: shutdownTimeout
    });
    
    // Stop accepting new connections
    if (this.server) {
      this.server.close(() => {
        logInfo('Server stopped accepting new connections');
      });
    }
    
    // Set shutdown timeout
    const shutdownTimer = setTimeout(() => {
      logError('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, shutdownTimeout);
    
    try {
      // Wait for existing connections to close
      await this.closeConnections();
      
      // Cleanup resources
      await this.cleanup();
      
      clearTimeout(shutdownTimer);
      logInfo('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logError('Error during graceful shutdown', error);
      clearTimeout(shutdownTimer);
      process.exit(1);
    }
  }
  
  async closeConnections() {
    const drainTimeout = parseInt(process.env.DRAIN_TIMEOUT) || 15000;
    const startTime = Date.now();
    
    // Close all connections gracefully
    for (const connection of this.connections) {
      connection.end();
    }
    
    // Wait for connections to close
    while (this.connections.size > 0) {
      if (Date.now() - startTime > drainTimeout) {
        // Force close remaining connections
        for (const connection of this.connections) {
          connection.destroy();
        }
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    logInfo('All connections closed', {
      duration: Date.now() - startTime
    });
  }
  
  async cleanup() {
    // Add cleanup tasks here
    logInfo('Cleanup completed');
  }
}

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }
  
  measureMiddleware(name) {
    return (req, res, _next) => {
      const start = performance.now();
      
      res.on(_'finish', () => {
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
      });
      
      next();
    };
  }
  
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name);
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  getStats(name) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) {
      return null;
    }
    
    const sorted = [...values].sort((a, _b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, _b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  getAllStats() {
    const stats = {};
    for (const [name, _] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    return {
      uptime: Date.now() - this.startTime,
      metrics: stats
    };
  }
}

// Initialize enhanced server setup
export const setupEnhancedServer = async (app, { _pool, _redisUrl, _queueService, prisma }) => {
  const gracefulShutdown = new GracefulShutdown();
  const performanceMonitor = new PerformanceMonitor();
  
  // Register health checks
  registerHealthCheck('database', () => checkDatabase(pool), { critical: true });
  registerHealthCheck('redis', () => checkRedis(redisUrl), { critical: false });
  registerHealthCheck('system', () => checkSystemResources(), { critical: false });
  
  if (queueService) {
    registerHealthCheck('queue', () => checkQueue(queueService), { critical: false });
  }
  
  // Apply security middleware
  setupSecurity(app);
  
  // Apply compression
  if (process.env.ENABLE_COMPRESSION === 'true') {
    app.use(compression({
      threshold: 1024, // Only compress responses > 1KB
      level: 6 // Balance between speed and compression
    }));
  }
  
  // Apply observability middleware
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(metricsMiddleware);
  app.use(sloMiddleware);
  app.use(performanceMonitor.measureMiddleware('total_request'));
  
  // Enhanced health endpoint
  app.get(_'/health', async _(req, res) => {
    try {
      const health = await performHealthCheck();
      const statusCode = health.status === 'healthy' ? 200 : 
                         health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      logError('Health check failed', error);
      res.status(503).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  });
  
  // Enhanced readiness endpoint
  app.get(_'/ready', async _(req, res) => {
    try {
      const readiness = await performReadinessCheck();
      const statusCode = readiness.ready ? 200 : 503;
      
      res.status(statusCode).json(readiness);
    } catch (error) {
      logError('Readiness check failed', error);
      res.status(503).json({
        ready: false,
        error: error.message
      });
    }
  });
  
  // Client latency tracking endpoint
  app.post('/api/client-metrics', trackClientLatency);
  
  // Performance stats endpoint
  app.get(_'/api/performance', _(req, res) => {
    res.json(performanceMonitor.getAllStats());
  });
  
  // SLO dashboard endpoint
  app.get(_'/api/slo-dashboard', _(req, res) => {
    res.json(sloTracker.getSLODashboard());
  });
  
  // Maintenance mode middleware
  app.use(_(req, res, _next) => {
    if (process.env.MAINTENANCE_MODE === 'true') {
      const allowedIPs = process.env.MAINTENANCE_ALLOWED_IPS?.split(',') || [];
      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (!allowedIPs.includes(clientIP)) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: process.env.MAINTENANCE_MESSAGE || 'System maintenance in progress'
        });
      }
    }
    next();
  });
  
  // Error logging middleware (should be last)
  app.use(errorLoggingMiddleware);
  
  // Return enhanced server controls
  return {
    gracefulShutdown,
    performanceMonitor,
    healthCheck: performHealthCheck,
    readinessCheck: performReadinessCheck,
    sloTracker
  };
};

// Circuit breaker implementation
export class CircuitBreaker {
  constructor(options = {}) {
    this.threshold = options.threshold || parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5;
    this.timeout = options.timeout || parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 60000;
    this.resetTimeout = options.resetTimeout || parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT) || 30000;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.nextAttempt = Date.now();
    this.successCount = 0;
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await this.callWithTimeout(fn, this.timeout);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  async callWithTimeout(fn, timeout) {
    return Promise.race([
      fn(),
      new Promise((_, _reject) => 
        setTimeout(() => reject(new Error('Circuit breaker timeout')), timeout)
      )
    ]);
  }
  
  onSuccess() {
    this.failures = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.threshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        logInfo('Circuit breaker closed');
      }
    }
  }
  
  onFailure() {
    this.failures++;
    this.successCount = 0;
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      logWarn('Circuit breaker opened', {
        failures: this.failures,
        nextAttempt: new Date(this.nextAttempt).toISOString()
      });
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null
    };
  }
}

// Cache manager
export class CacheManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL) || 300;
    this.enabled = process.env.ENABLE_CACHE === 'true';
  }
  
  async get(key) {
    if (!this.enabled || !this.redis) {
      return null;
    }
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logError('Cache get error', error, { key });
      return null;
    }
  }
  
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled || !this.redis) {
      return;
    }
    
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logError('Cache set error', error, { key });
    }
  }
  
  async invalidate(pattern) {
    if (!this.enabled || !this.redis) {
      return;
    }
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logError('Cache invalidate error', error, { pattern });
    }
  }
  
  // Cache middleware
  middleware(keyFn, ttl = this.defaultTTL) {
    return async (req, res, _next) => {
      if (!this.enabled) {
        return next();
      }
      
      const key = typeof keyFn === 'function' ? keyFn(req) : keyFn;
      const cached = await this.get(key);
      
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
      
      res.setHeader('X-Cache', 'MISS');
      
      // Capture response
      const originalSend = res.json;
      res.json = (_data) => {
        res.json = originalSend;
        
        // Cache successful responses
        if (res.statusCode === 200) {
          this.set(key, data, ttl);
        }
        
        return res.json(data);
      };
      
      next();
    };
  }
}

export default {
  setupEnhancedServer,
  GracefulShutdown,
  PerformanceMonitor,
  CircuitBreaker,
  CacheManager
};