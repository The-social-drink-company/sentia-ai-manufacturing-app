// Enhanced Prisma Client with Query Caching and Performance Optimizations
// Implements intelligent caching, query optimization, and connection pooling

import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';
import { createHash } from 'crypto';

// Performance monitoring utilities
const performanceMetrics = {
  queries: 0,
  cacheHits: 0,
  cacheMisses: 0,
  avgQueryTime: 0,
  slowQueries: []
};

// Create multi-tier cache system
class PrismaCache {
  constructor() {
    // L1 Cache: Hot data (10 second TTL)
    this.l1Cache = new NodeCache({
      stdTTL: 10,
      checkperiod: 20,
      useClones: false
    });

    // L2 Cache: Warm data (60 second TTL)
    this.l2Cache = new NodeCache({
      stdTTL: 60,
      checkperiod: 120,
      useClones: false
    });

    // L3 Cache: Reference data (5 minute TTL)
    this.l3Cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 600,
      useClones: false
    });
  }

  generateKey(model, operation, args) {
    const data = `${model}:${operation}:${JSON.stringify(args)}`;
    return createHash('md5').update(data).digest('hex');
  }

  get(key, tier = 'all') {
    // Check L1 first (fastest)
    let result = this.l1Cache.get(key);
    if (result) {
      performanceMetrics.cacheHits++;
      return { data: result, tier: 'L1' };
    }

    // Check L2
    result = this.l2Cache.get(key);
    if (result) {
      performanceMetrics.cacheHits++;
      // Promote to L1 for faster access
      this.l1Cache.set(key, result, 10);
      return { data: result, tier: 'L2' };
    }

    // Check L3
    result = this.l3Cache.get(key);
    if (result) {
      performanceMetrics.cacheHits++;
      // Promote to L2
      this.l2Cache.set(key, result, 60);
      return { data: result, tier: 'L3' };
    }

    performanceMetrics.cacheMisses++;
    return null;
  }

  set(key, value, options = {}) {
    const { tier = 'L1', ttl } = options;

    switch(tier) {
      case 'L1':
        this.l1Cache.set(key, value, ttl || 10);
        break;
      case 'L2':
        this.l2Cache.set(key, value, ttl || 60);
        break;
      case 'L3':
        this.l3Cache.set(key, value, ttl || 300);
        break;
      default:
        this.l1Cache.set(key, value, ttl || 10);
    }
  }

  invalidate(pattern) {
    const keys = [
      ...this.l1Cache.keys(),
      ...this.l2Cache.keys(),
      ...this.l3Cache.keys()
    ];

    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.l1Cache.del(key);
        this.l2Cache.del(key);
        this.l3Cache.del(key);
      }
    });
  }

  flush() {
    this.l1Cache.flushAll();
    this.l2Cache.flushAll();
    this.l3Cache.flushAll();
  }

  getStats() {
    return {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache.getStats(),
      l3: this.l3Cache.getStats(),
      performance: performanceMetrics
    };
  }
}

// Enhanced Prisma Client with middleware
class EnhancedPrismaClient extends PrismaClient {
  constructor(options = {}) {
    // Optimize connection pool
    const enhancedOptions = {
      ...options,
      datasources: {
        db: {
          url: process.env.DATABASE_URL || options.datasources?.db?.url
        }
      },
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
      errorFormat: 'minimal'
    };

    super(enhancedOptions);

    this.cache = new PrismaCache();
    this.setupMiddleware();
    this.setupConnectionPool();
  }

  setupMiddleware() {
    // Query caching middleware
    this.$use(async (params, next) => {
      const startTime = Date.now();

      // Only cache read operations
      const cacheableOperations = [
        'findUnique', 'findFirst', 'findMany',
        'count', 'aggregate', 'groupBy'
      ];

      if (cacheableOperations.includes(params.action)) {
        const cacheKey = this.cache.generateKey(
          params.model,
          params.action,
          params.args
        );

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached) {
          console.log(`[Cache ${cached.tier}] ${params.model}.${params.action}`);
          return cached.data;
        }

        // Execute query
        const result = await next(params);

        // Intelligent caching based on model and operation
        const cacheOptions = this.getCacheStrategy(params.model, params.action);
        this.cache.set(cacheKey, result, cacheOptions);

        const queryTime = Date.now() - startTime;
        this.trackPerformance(params, queryTime);

        return result;
      }

      // For write operations, invalidate related cache
      if (['create', 'update', 'delete', 'upsert'].includes(params.action)) {
        this.cache.invalidate(params.model);
      }

      const result = await next(params);
      const queryTime = Date.now() - startTime;
      this.trackPerformance(params, queryTime);

      return result;
    });

    // Query optimization middleware
    this.$use(async (params, next) => {
      // Optimize findMany queries
      if (params.action === 'findMany' && params.args) {
        // Add default limits if not specified
        if (!params.args.take) {
          params.args.take = 100;
        }

        // Use cursor-based pagination for large datasets
        if (params.args.take > 1000) {
          console.warn(`Large query detected: ${params.model}.findMany with take=${params.args.take}`);
          params.args.take = 1000;
        }
      }

      // Optimize includes and selects
      if (params.args?.include && Object.keys(params.args.include).length > 3) {
        console.warn(`Complex query detected: ${params.model}.${params.action} with ${Object.keys(params.args.include).length} includes`);
      }

      return next(params);
    });
  }

  setupConnectionPool() {
    // Monitor connection pool health
    setInterval(() => {
      this.$metrics?.json().then(metrics => {
        if (metrics.counters.find(c => c.key === 'prisma_pool_connections_open')?.value > 20) {
          console.warn('High connection pool usage detected');
        }
      }).catch(() => {});
    }, 30000);
  }

  getCacheStrategy(model, action) {
    // Reference data (rarely changes)
    const referenceModels = ['User', 'Role', 'Permission', 'Organization'];
    if (referenceModels.includes(model)) {
      return { tier: 'L3', ttl: 300 };
    }

    // Frequently accessed data
    const hotModels = ['Inventory', 'Production', 'Order'];
    if (hotModels.includes(model)) {
      if (action === 'count' || action === 'aggregate') {
        return { tier: 'L2', ttl: 60 };
      }
      return { tier: 'L1', ttl: 10 };
    }

    // Default strategy
    return { tier: 'L1', ttl: 30 };
  }

  trackPerformance(params, queryTime) {
    performanceMetrics.queries++;
    performanceMetrics.avgQueryTime =
      (performanceMetrics.avgQueryTime * (performanceMetrics.queries - 1) + queryTime) /
      performanceMetrics.queries;

    // Track slow queries
    if (queryTime > 1000) {
      performanceMetrics.slowQueries.push({
        model: params.model,
        action: params.action,
        time: queryTime,
        timestamp: new Date().toISOString()
      });

      // Keep only last 10 slow queries
      if (performanceMetrics.slowQueries.length > 10) {
        performanceMetrics.slowQueries.shift();
      }
    }
  }

  // Batch operations for better performance
  async batchFindMany(model, ids, options = {}) {
    const chunks = [];
    const chunkSize = 100;

    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }

    const results = await Promise.all(
      chunks.map(chunk =>
        this[model].findMany({
          where: { id: { in: chunk } },
          ...options
        })
      )
    );

    return results.flat();
  }

  // Optimized count with estimation for large tables
  async estimatedCount(model, where = {}) {
    // Try exact count first with timeout
    const countPromise = this[model].count({ where });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Count timeout')), 1000)
    );

    try {
      return await Promise.race([countPromise, timeoutPromise]);
    } catch {
      // Fallback to estimation
      const sample = await this[model].findMany({
        where,
        take: 1000,
        select: { id: true }
      });

      // Estimate based on sample
      if (sample.length < 1000) {
        return sample.length;
      }

      // Use PostgreSQL statistics for estimation
      const result = await this.$queryRaw`
        SELECT reltuples::BIGINT AS estimate
        FROM pg_class
        WHERE relname = ${model.toLowerCase()}
      `;

      return result[0]?.estimate || sample.length;
    }
  }

  // Transaction with retry logic
  async transactionWithRetry(fn, maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.$transaction(fn, {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: 'ReadCommitted'
        });
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (error.code === 'P2034' || error.code === 'P2028') {
          console.log(`Transaction retry ${i + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  // Get performance statistics
  getPerformanceStats() {
    return {
      ...performanceMetrics,
      cache: this.cache.getStats(),
      hitRate: performanceMetrics.cacheHits /
        (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) || 0
    };
  }

  // Clear all caches
  clearCache() {
    this.cache.flush();
    performanceMetrics.cacheHits = 0;
    performanceMetrics.cacheMisses = 0;
    console.log('All caches cleared');
  }
}

// Create singleton instance
let prismaEnhanced;

try {
  prismaEnhanced = new EnhancedPrismaClient();

  // Test connection
  prismaEnhanced.$connect()
    .then(() => console.log('Enhanced Prisma client connected'))
    .catch(err => console.error('Enhanced Prisma connection failed:', err));
} catch (error) {
  console.error('Failed to create enhanced Prisma client:', error);
  // Fallback to basic client
  prismaEnhanced = new PrismaClient();
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prismaEnhanced.$disconnect();
});

export { prismaEnhanced, EnhancedPrismaClient, PrismaCache };
export default prismaEnhanced;