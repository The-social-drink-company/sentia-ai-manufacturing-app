// Performance Monitoring API Routes
// Provides insights into database query performance and caching

import express from 'express';
import prismaEnhanced from '../../lib/prisma-enhanced.js';
import queryOptimizer from '../../services/database/query-optimizer.js';
import redisCache from '../../services/cache/redis-cache.js';
import { requireAuth, requireAdmin } from '../middleware/clerkAuth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/performance/stats
 * Get overall performance statistics
 */
router.get(_'/stats',
  _requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const prismaStats = prismaEnhanced.getPerformanceStats();
    const optimizerInsights = queryOptimizer.getOptimizationInsights();
    const redisStats = redisCache.getStats();

    res.json({
      success: true,
      data: {
        database: {
          queries: prismaStats.queries,
          avgQueryTime: `${Math.round(prismaStats.avgQueryTime)}ms`,
          cacheHitRate: `${(prismaStats.hitRate * 100).toFixed(1)}%`,
          cacheHits: prismaStats.cacheHits,
          cacheMisses: prismaStats.cacheMisses,
          slowQueries: prismaStats.slowQueries
        },
        cache: {
          l1: prismaStats.cache.l1,
          l2: prismaStats.cache.l2,
          l3: prismaStats.cache.l3,
          redis: redisStats.redis
        },
        optimizer: optimizerInsights.metrics,
        recommendations: optimizerInsights.recommendations,
        insights: optimizerInsights.insights
      }
    });
  })
);

/**
 * GET /api/performance/cache
 * Get detailed cache statistics
 */
router.get(_'/cache',
  _requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const cacheStats = prismaEnhanced.cache.getStats();
    const redisStats = redisCache.getStats();

    res.json({
      success: true,
      data: {
        multiTier: {
          l1: {
            ...cacheStats.l1,
            description: 'Hot data cache (10s TTL)'
          },
          l2: {
            ...cacheStats.l2,
            description: 'Warm data cache (60s TTL)'
          },
          l3: {
            ...cacheStats.l3,
            description: 'Reference data cache (5m TTL)'
          }
        },
        redis: redisStats,
        performance: cacheStats.performance
      }
    });
  })
);

/**
 * POST /api/performance/cache/clear
 * Clear all caches
 */
router.post(_'/cache/clear',
  _requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { tier } = req.body;

    if (tier === 'all' || !tier) {
      prismaEnhanced.clearCache();
      await redisCache.flush('*');

      res.json({
        success: true,
        message: 'All caches cleared successfully'
      });
    } else {
      // Clear specific tier
      prismaEnhanced.cache[`${tier}Cache`]?.flushAll();

      res.json({
        success: true,
        message: `Cache tier ${tier} cleared successfully`
      });
    }
  })
);

/**
 * GET /api/performance/queries
 * Get query pattern analysis
 */
router.get(_'/queries',
  _requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const insights = queryOptimizer.getOptimizationInsights();

    res.json({
      success: true,
      data: {
        patterns: Array.from(insights.insights),
        metrics: insights.metrics,
        recommendations: insights.recommendations
      }
    });
  })
);

/**
 * POST /api/performance/prefetch
 * Trigger cache prefetch
 */
router.post(_'/prefetch',
  _requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const results = await queryOptimizer.prefetchCommonData();

    res.json({
      success: true,
      message: 'Cache prefetch completed',
      data: results
    });
  })
);

/**
 * POST /api/performance/analyze
 * Analyze a specific query
 */
router.post(_'/analyze',
  _requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { model, operation, query } = req.body;

    if (!model || !operation) {
      return res.status(400).json({
        success: false,
        error: 'Model and operation are required'
      });
    }

    const startTime = Date.now();

    try {
      // Execute query with timing
      const result = await prismaEnhanced[model][operation](query);
      const executionTime = Date.now() - startTime;

      // Analyze query
      const suggestions = queryOptimizer.analyzeQuery(model, operation, query);
      const complexity = queryOptimizer.calculateQueryComplexity(query || {});

      res.json({
        success: true,
        data: {
          executionTime: `${executionTime}ms`,
          complexity,
          resultCount: Array.isArray(result) ? result.length : 1,
          suggestions,
          optimized: suggestions.length === 0
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
        executionTime: `${Date.now() - startTime}ms`
      });
    }
  })
);

/**
 * GET /api/performance/health
 * Get database and cache health status
 */
router.get(_'/health',
  asyncHandler(async (req, res) => {
    const health = {
      database: 'unknown',
      cache: 'unknown',
      redis: 'unknown'
    };

    // Check database
    try {
      await prismaEnhanced.$queryRaw`SELECT 1`;
      health.database = 'healthy';
    } catch (error) {
      health.database = 'unhealthy';
    }

    // Check cache
    const cacheStats = prismaEnhanced.cache.getStats();
    health.cache = cacheStats.l1.keys > 0 || cacheStats.l2.keys > 0 || cacheStats.l3.keys > 0
      ? 'healthy'
      : 'empty';

    // Check Redis
    health.redis = redisCache.isConnected ? 'healthy' : 'disconnected';

    const overall = health.database === 'healthy' &&
                   (health.cache === 'healthy' || health.cache === 'empty')
                   ? 'healthy'
                   : 'degraded';

    res.json({
      success: true,
      status: overall,
      components: health,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/performance/reset
 * Reset performance metrics
 */
router.post(_'/reset',
  _requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    queryOptimizer.resetMetrics();

    res.json({
      success: true,
      message: 'Performance metrics reset successfully'
    });
  })
);

export default router;