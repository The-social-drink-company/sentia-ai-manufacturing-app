/**
 * Enterprise Caching Strategy Implementation
 * Multi-layer caching with Redis and in-memory fallback
 */

import { createClient } from 'redis';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { EventEmitter } from 'events';

class CacheManager extends EventEmitter {
  constructor() {
    super();

    // Cache layers
    this.memoryCache = null;
    this.redisClient = null;

    // Configuration
    this.config = {
      memory: {
        stdTTL: 600, // 10 minutes default
        checkperiod: 120, // Check for expired keys every 2 minutes
        maxKeys: 10000,
        useClones: false // Better performance
      },
      redis: {
        defaultTTL: 3600, // 1 hour default
        maxRetries: 3,
        retryDelay: 1000
      },
      patterns: {
        user: { ttl: 300, prefix: 'user:' },
        product: { ttl: 600, prefix: 'product:' },
        forecast: { ttl: 1800, prefix: 'forecast:' },
        dashboard: { ttl: 60, prefix: 'dashboard:' },
        api: { ttl: 300, prefix: 'api:' },
        query: { ttl: 900, prefix: 'query:' },
        session: { ttl: 1800, prefix: 'session:' }
      }
    };

    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };

    this.initialized = false;
  }

  /**
   * Initialize cache manager
   */
  async initialize() {
    try {
      // Initialize memory cache
      this.memoryCache = new NodeCache(this.config.memory);
      this.setupMemoryCacheEvents();

      // Initialize Redis if available
      if (process.env.REDIS_URL) {
        await this.initializeRedis();
      } else {
        console.log('Cache: Using memory-only mode (Redis not configured)');
      }

      // Start cache warming if configured
      if (process.env.CACHE_WARM_ON_START === 'true') {
        await this.warmCache();
      }

      this.initialized = true;
      this.emit('initialized');

      console.log('Cache manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize cache manager:', error);
      // Continue with memory-only mode
      this.initialized = true;
    }
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Redis reconnection limit exceeded');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    // Redis event handlers
    this.redisClient.on('error', (err) => {
      console.error('Redis error:', err);
      this.stats.errors++;
      this.emit('redis-error', err);
    });

    this.redisClient.on('connect', () => {
      console.log('Redis connected');
      this.emit('redis-connected');
    });

    this.redisClient.on('ready', () => {
      console.log('Redis ready');
      this.emit('redis-ready');
    });

    await this.redisClient.connect();
  }

  /**
   * Setup memory cache events
   */
  setupMemoryCacheEvents() {
    this.memoryCache.on('set', (key) => {
      this.emit('cache-set', { layer: 'memory', key });
    });

    this.memoryCache.on('del', (key) => {
      this.emit('cache-delete', { layer: 'memory', key });
    });

    this.memoryCache.on('expired', (key) => {
      this.emit('cache-expired', { layer: 'memory', key });
    });
  }

  /**
   * Get value from cache
   */
  async get(key, options = {}) {
    const startTime = Date.now();

    try {
      // Check memory cache first
      const memoryValue = this.memoryCache.get(key);
      if (memoryValue !== undefined) {
        this.stats.hits++;
        this.emit('cache-hit', { layer: 'memory', key, duration: Date.now() - startTime });
        return memoryValue;
      }

      // Check Redis if available
      if (this.redisClient?.isReady) {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          const value = JSON.parse(redisValue);

          // Populate memory cache
          if (options.populateMemory !== false) {
            this.memoryCache.set(key, value);
          }

          this.stats.hits++;
          this.emit('cache-hit', { layer: 'redis', key, duration: Date.now() - startTime });
          return value;
        }
      }

      // Cache miss
      this.stats.misses++;
      this.emit('cache-miss', { key, duration: Date.now() - startTime });

      // Execute loader function if provided
      if (options.loader) {
        const value = await options.loader();
        if (value !== undefined) {
          await this.set(key, value, options);
        }
        return value;
      }

      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      this.stats.errors++;

      // Execute loader as fallback
      if (options.loader) {
        return await options.loader();
      }

      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, options = {}) {
    const startTime = Date.now();

    try {
      const ttl = options.ttl || this.getDefaultTTL(key);

      // Set in memory cache
      this.memoryCache.set(key, value, ttl);

      // Set in Redis if available
      if (this.redisClient?.isReady) {
        const serialized = JSON.stringify(value);
        await this.redisClient.setEx(key, ttl, serialized);
      }

      this.stats.sets++;
      this.emit('cache-set', { key, ttl, duration: Date.now() - startTime });

      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete from cache
   */
  async del(key) {
    try {
      // Delete from memory
      this.memoryCache.del(key);

      // Delete from Redis
      if (this.redisClient?.isReady) {
        await this.redisClient.del(key);
      }

      this.stats.deletes++;
      this.emit('cache-delete', { key });

      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    try {
      // Delete from memory cache
      const memoryKeys = this.memoryCache.keys();
      const regex = new RegExp(pattern.replace('*', '.*'));
      const matchingKeys = memoryKeys.filter(key => regex.test(key));

      for (const key of matchingKeys) {
        this.memoryCache.del(key);
      }

      // Delete from Redis
      if (this.redisClient?.isReady) {
        const redisKeys = await this.redisClient.keys(pattern);
        if (redisKeys.length > 0) {
          await this.redisClient.del(redisKeys);
        }
      }

      this.emit('cache-pattern-delete', { pattern, count: matchingKeys.length });

      return matchingKeys.length;
    } catch (error) {
      console.error(`Cache pattern delete error for ${pattern}:`, error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async flush() {
    try {
      // Clear memory cache
      this.memoryCache.flushAll();

      // Clear Redis
      if (this.redisClient?.isReady) {
        await this.redisClient.flushDb();
      }

      this.emit('cache-flush');
      console.log('Cache flushed successfully');

      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get or set cache value
   */
  async getOrSet(key, loader, options = {}) {
    const value = await this.get(key);

    if (value !== null) {
      return value;
    }

    const loadedValue = await loader();

    if (loadedValue !== undefined) {
      await this.set(key, loadedValue, options);
    }

    return loadedValue;
  }

  /**
   * Memoize function
   */
  memoize(fn, options = {}) {
    const keyPrefix = options.keyPrefix || fn.name || 'memoized';

    return async (...args) => {
      const key = this.generateKey(keyPrefix, ...args);

      return await this.getOrSet(key, () => fn(...args), options);
    };
  }

  /**
   * Cache warming
   */
  async warmCache() {
    console.log('Warming cache...');

    const warmupTasks = [
      // Add your cache warming tasks here
      this.warmProducts(),
      this.warmDashboard(),
      this.warmForecasts()
    ];

    await Promise.allSettled(warmupTasks);

    console.log('Cache warming completed');
    this.emit('cache-warmed');
  }

  async warmProducts() {
    // Implementation depends on your data source
    try {
      // Example: fetch and cache frequently accessed products
      const products = await this.fetchTopProducts();
      for (const product of products) {
        await this.set(`product:${product.id}`, product, { ttl: 3600 });
      }
    } catch (error) {
      console.error('Failed to warm product cache:', error);
    }
  }

  async warmDashboard() {
    // Implementation depends on your dashboard data
    try {
      // Example: pre-cache dashboard metrics
      const metrics = await this.fetchDashboardMetrics();
      await this.set('dashboard:metrics', metrics, { ttl: 300 });
    } catch (error) {
      console.error('Failed to warm dashboard cache:', error);
    }
  }

  async warmForecasts() {
    // Implementation depends on your forecast data
    try {
      // Example: cache recent forecasts
      const forecasts = await this.fetchRecentForecasts();
      await this.set('forecast:recent', forecasts, { ttl: 1800 });
    } catch (error) {
      console.error('Failed to warm forecast cache:', error);
    }
  }

  /**
   * Generate cache key
   */
  generateKey(prefix, ...args) {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(args))
      .digest('hex');

    return `${prefix}:${hash}`;
  }

  /**
   * Get default TTL for key pattern
   */
  getDefaultTTL(key) {
    for (const [pattern, config] of Object.entries(this.config.patterns)) {
      if (key.startsWith(config.prefix)) {
        return config.ttl;
      }
    }

    return this.config.redis.defaultTTL;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memoryStats = this.memoryCache.getStats();

    return {
      ...this.stats,
      memory: {
        keys: memoryStats.keys,
        hits: memoryStats.hits,
        misses: memoryStats.misses,
        ksize: memoryStats.ksize,
        vsize: memoryStats.vsize
      },
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      redis: {
        connected: this.redisClient?.isReady || false
      }
    };
  }

  /**
   * Express middleware for HTTP caching
   */
  middleware(options = {}) {
    const defaultTTL = options.ttl || 60;
    const keyGenerator = options.keyGenerator || ((req) => `api:${req.method}:${req.url}`);

    return async (req, res, next) => {
      // Skip caching for non-GET requests by default
      if (options.methods && !options.methods.includes(req.method)) {
        return next();
      }

      if (!options.methods && req.method !== 'GET') {
        return next();
      }

      const key = keyGenerator(req);

      try {
        // Check cache
        const cachedResponse = await this.get(key);

        if (cachedResponse) {
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Key', key);

          // Set cached headers
          if (cachedResponse.headers) {
            Object.entries(cachedResponse.headers).forEach(([name, value]) => {
              res.set(name, value);
            });
          }

          return res.status(cachedResponse.status || 200).json(cachedResponse.body);
        }

        // Cache MISS - intercept response
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', key);

        const originalJson = res.json;
        res.json = async function(body) {
          // Cache successful responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const ttl = options.ttlResolver ? options.ttlResolver(req, res) : defaultTTL;

            await this.set(key, {
              status: res.statusCode,
              headers: res.getHeaders(),
              body
            }, { ttl });
          }

          return originalJson.call(res, body);
        }.bind(this);

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateTags(tags) {
    const patterns = tags.map(tag => `*:${tag}:*`);

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }

    this.emit('cache-tags-invalidated', { tags });
  }

  /**
   * TTL update for existing key
   */
  async touch(key, ttl) {
    try {
      // Update memory cache TTL
      const value = this.memoryCache.get(key);
      if (value !== undefined) {
        this.memoryCache.ttl(key, ttl);
      }

      // Update Redis TTL
      if (this.redisClient?.isReady) {
        await this.redisClient.expire(key, ttl);
      }

      return true;
    } catch (error) {
      console.error(`Cache touch error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async has(key) {
    // Check memory first
    if (this.memoryCache.has(key)) {
      return true;
    }

    // Check Redis
    if (this.redisClient?.isReady) {
      const exists = await this.redisClient.exists(key);
      return exists === 1;
    }

    return false;
  }

  /**
   * Get remaining TTL
   */
  async ttl(key) {
    // Check memory first
    const memoryTTL = this.memoryCache.getTtl(key);
    if (memoryTTL) {
      return Math.floor((memoryTTL - Date.now()) / 1000);
    }

    // Check Redis
    if (this.redisClient?.isReady) {
      return await this.redisClient.ttl(key);
    }

    return -1;
  }

  /**
   * Batch get operation
   */
  async mget(keys) {
    const results = {};

    // Get from memory
    const memoryResults = this.memoryCache.mget(keys);
    Object.assign(results, memoryResults);

    // Get missing keys from Redis
    const missingKeys = keys.filter(key => results[key] === undefined);

    if (missingKeys.length > 0 && this.redisClient?.isReady) {
      const redisResults = await this.redisClient.mGet(missingKeys);

      missingKeys.forEach((key, index) => {
        if (redisResults[index]) {
          results[key] = JSON.parse(redisResults[index]);
        }
      });
    }

    return results;
  }

  /**
   * Batch set operation
   */
  async mset(items, options = {}) {
    const ttl = options.ttl || this.config.redis.defaultTTL;
    const promises = [];

    for (const [key, value] of Object.entries(items)) {
      promises.push(this.set(key, value, { ttl }));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Close connections
   */
  async close() {
    this.memoryCache.close();

    if (this.redisClient) {
      await this.redisClient.quit();
    }

    this.emit('closed');
  }

  // Mock methods for warming (replace with actual implementations)
  async fetchTopProducts() {
    return [];
  }

  async fetchDashboardMetrics() {
    return {};
  }

  async fetchRecentForecasts() {
    return [];
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Export cache decorators
export function Cacheable(options = {}) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const key = cacheManager.generateKey(
        `${target.constructor.name}:${propertyKey}`,
        ...args
      );

      return await cacheManager.getOrSet(
        key,
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

export function CacheEvict(pattern) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const result = await originalMethod.apply(this, args);
      await cacheManager.delPattern(pattern);
      return result;
    };

    return descriptor;
  };
}

export default cacheManager;