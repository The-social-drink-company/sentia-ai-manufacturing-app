/**
 * Enterprise Integration Middleware
 * Connects all enterprise components to Express application
 */

import logger from '../services/enterprise-logger.js';
import { cacheManager } from '../services/cache-manager.js';
import { rateLimiter, apiLimiter, authLimiter } from './rate-limiter.js';
import { featureFlags } from '../services/feature-flags.js';
import { performanceMonitor, performanceMiddleware } from '../monitoring/performance-monitor.js';

/**
 * Initialize all enterprise services
 */
export async function initializeEnterpriseServices() {
  const services = [];

  try {
    // Initialize logger
    logger.info('Initializing Enterprise Services', {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    // Initialize cache manager
    try {
      await cacheManager.initialize();
      services.push('cache');
      logger.info('✅ Cache manager initialized');
    } catch (error) {
      logger.error('❌ Cache manager initialization failed', { error: error.message });
    }

    // Initialize rate limiter
    try {
      await rateLimiter.initialize();
      services.push('rateLimiter');
      logger.info('✅ Rate limiter initialized');
    } catch (error) {
      logger.error('❌ Rate limiter initialization failed', { error: error.message });
    }

    // Initialize feature flags
    try {
      await featureFlags.initialize();
      services.push('featureFlags');
      logger.info('✅ Feature flags initialized');
    } catch (error) {
      logger.error('❌ Feature flags initialization failed', { error: error.message });
    }

    // Start performance monitoring
    try {
      performanceMonitor.start();
      services.push('performanceMonitor');
      logger.info('✅ Performance monitoring started');
    } catch (error) {
      logger.error('❌ Performance monitoring failed', { error: error.message });
    }

    logger.info('Enterprise services initialization complete', {
      initialized: services,
      failed: ['cache', 'rateLimiter', 'featureFlags', 'performanceMonitor'].filter(
        s => !services.includes(s)
      )
    });

    return { success: true, services };
  } catch (error) {
    logger.error('Enterprise services initialization failed', { error: error.message });
    return { success: false, error: error.message, services };
  }
}

/**
 * Apply enterprise middleware to Express app
 */
export function applyEnterpriseMiddleware(app) {
  logger.info('Applying enterprise middleware');

  // Request/response logging
  app.use(logger.middleware());
  logger.info('✅ Request logging middleware applied');

  // Performance tracking
  app.use(performanceMiddleware);
  logger.info('✅ Performance tracking middleware applied');

  // Apply rate limiting to API routes
  app.use('/api/', (req, res, next) => {
    // Skip rate limiting for health checks
    if (req.path === '/health' || req.path === '/metrics') {
      return next();
    }
    apiLimiter()(req, res, next);
  });
  logger.info('✅ API rate limiting applied');

  // Stricter rate limiting for auth endpoints
  app.use('/api/auth/', authLimiter());
  logger.info('✅ Auth rate limiting applied');

  // Cache middleware for GET requests
  app.use('/api/', (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    // Skip caching for certain paths
    const skipPaths = ['/health', '/metrics', '/auth', '/upload'];
    if (skipPaths.some(path => req.path.includes(path))) {
      return next();
    }

    cacheManager.middleware({
      ttl: 60,
      keyGenerator: (req) => `api:${req.method}:${req.originalUrl}`
    })(req, res, next);
  });
  logger.info('✅ Cache middleware applied');

  // Error logging middleware
  app.use(logger.errorMiddleware());
  logger.info('✅ Error logging middleware applied');

  logger.info('All enterprise middleware applied successfully');
}

/**
 * Create enhanced health check endpoint
 */
export function createHealthEndpoint(app) {
  app.get('/api/health/enterprise', async (req, res) => {
    const timer = logger.startTimer('health-check');

    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {},
        metrics: {}
      };

      // Check cache service
      try {
        const cacheStats = cacheManager.getStats();
        health.services.cache = {
          status: 'healthy',
          stats: cacheStats
        };
      } catch (error) {
        health.services.cache = {
          status: 'unhealthy',
          error: error.message
        };
        health.status = 'degraded';
      }

      // Check performance metrics
      try {
        const perfMetrics = performanceMonitor.getMetrics();
        health.metrics.performance = perfMetrics;
      } catch (error) {
        health.metrics.performance = { error: error.message };
      }

      // Check feature flags
      try {
        const enabledFeatures = featureFlags.getEnabledFeatures();
        health.services.featureFlags = {
          status: 'healthy',
          enabled: enabledFeatures.length
        };
      } catch (error) {
        health.services.featureFlags = {
          status: 'unhealthy',
          error: error.message
        };
      }

      // Check logger
      health.services.logger = {
        status: 'healthy',
        metrics: logger.getMetrics()
      };

      const duration = logger.endTimer(timer);
      health.responseTime = duration;

      logger.info('Health check completed', {
        status: health.status,
        duration
      });

      res.json(health);
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  logger.info('✅ Enterprise health endpoint created');
}

/**
 * Create metrics endpoint for monitoring
 */
export function createMetricsEndpoint(app) {
  app.get('/api/metrics', async (req, res) => {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        performance: performanceMonitor.getMetrics(),
        cache: cacheManager.getStats(),
        logs: logger.getMetrics(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };

      res.json(metrics);
    } catch (error) {
      logger.error('Metrics endpoint failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  logger.info('✅ Metrics endpoint created');
}

/**
 * Enhanced API wrapper with caching and logging
 */
export function wrapApiEndpoint(handler, options = {}) {
  return async (req, res, next) => {
    const timer = logger.startTimer(options.name || 'api-request');

    try {
      // Check feature flag if specified
      if (options.featureFlag) {
        if (!featureFlags.isEnabled(options.featureFlag, { userId: req.user?.id })) {
          logger.warn('Feature flag check failed', {
            flag: options.featureFlag,
            userId: req.user?.id
          });
          return res.status(403).json({
            error: 'Feature not enabled',
            feature: options.featureFlag
          });
        }
      }

      // Try cache for GET requests
      if (req.method === 'GET' && options.cache !== false) {
        const cacheKey = options.cacheKey || `api:${req.originalUrl}`;
        const cached = await cacheManager.get(cacheKey);

        if (cached) {
          logger.info('API response served from cache', {
            endpoint: req.originalUrl,
            cacheKey
          });
          res.set('X-Cache', 'HIT');
          return res.json(cached);
        }

        res.set('X-Cache', 'MISS');
      }

      // Execute handler
      const result = await handler(req, res, next);

      // Cache successful GET responses
      if (req.method === 'GET' && res.statusCode === 200 && options.cache !== false) {
        const cacheKey = options.cacheKey || `api:${req.originalUrl}`;
        const ttl = options.cacheTTL || 60;

        // Cache the result
        if (result) {
          await cacheManager.set(cacheKey, result, { ttl });
          logger.info('API response cached', {
            endpoint: req.originalUrl,
            cacheKey,
            ttl
          });
        }
      }

      const duration = logger.endTimer(timer);
      logger.info('API request completed', {
        endpoint: req.originalUrl,
        method: req.method,
        status: res.statusCode,
        duration
      });

    } catch (error) {
      const duration = logger.endTimer(timer);
      logger.error('API request failed', {
        endpoint: req.originalUrl,
        method: req.method,
        error: error.message,
        duration
      });

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  };
}

/**
 * Shutdown all enterprise services gracefully
 */
export async function shutdownEnterpriseServices() {
  logger.info('Shutting down enterprise services');

  try {
    // Stop performance monitoring
    performanceMonitor.stop();
    logger.info('Performance monitoring stopped');

    // Close cache connections
    await cacheManager.close();
    logger.info('Cache manager closed');

    // Stop rate limiter
    await rateLimiter.shutdown();
    logger.info('Rate limiter shutdown');

    // Close logger
    await logger.shutdown();

    console.log('All enterprise services shut down successfully');
  } catch (error) {
    console.error('Error during enterprise services shutdown:', error);
  }
}

// Handle process termination
process.on('SIGTERM', shutdownEnterpriseServices);
process.on('SIGINT', shutdownEnterpriseServices);

export default {
  initializeEnterpriseServices,
  applyEnterpriseMiddleware,
  createHealthEndpoint,
  createMetricsEndpoint,
  wrapApiEndpoint,
  shutdownEnterpriseServices
};