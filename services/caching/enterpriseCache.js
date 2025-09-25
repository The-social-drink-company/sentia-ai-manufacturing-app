import Redis from 'ioredis';
import EventEmitter from 'events';
import crypto from 'crypto';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


/**
 * Enterprise Caching System
 * 
 * Multi-layer caching solution with Redis, in-memory caching,
 * intelligent invalidation, and performance optimization.
 */
export class EnterpriseCacheManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      redis: {
        host: config.redis?.host || process.env.REDIS_HOST || 'localhost',
        port: config.redis?.port || process.env.REDIS_PORT || 6379,
        password: config.redis?.password || process.env.REDIS_PASSWORD,
        db: config.redis?.db || 0,
        keyPrefix: config.redis?.keyPrefix || 'sentia:cache:',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      },
      memory: {
        maxSize: config.memory?.maxSize || 100 * 1024 * 1024, // 100MB
        maxItems: config.memory?.maxItems || 10000,
        ttl: config.memory?.ttl || 300000 // 5 minutes
      },
      compression: {
        enabled: config.compression?.enabled || true,
        threshold: config.compression?.threshold || 1024 // 1KB
      },
      monitoring: {
        enabled: config.monitoring?.enabled || true,
        metricsInterval: config.monitoring?.metricsInterval || 60000 // 1 minute
      }
    };

    // Initialize Redis clients
    this.redis = new Redis(this.config.redis);
    this.redisPub = new Redis(this.config.redis);
    this.redisSub = new Redis(this.config.redis);

    // In-memory cache (L1 cache)
    this.memoryCache = new Map();
    this.memoryCacheSize = 0;
    this.memoryCacheAccess = new Map(); // For LRU tracking

    // Cache statistics
    this.stats = {
      hits: { memory: 0, redis: 0, total: 0 },
      misses: { memory: 0, redis: 0, total: 0 },
      sets: { memory: 0, redis: 0, total: 0 },
      deletes: { memory: 0, redis: 0, total: 0 },
      evictions: { memory: 0, redis: 0, total: 0 },
      errors: { memory: 0, redis: 0, total: 0 },
      responseTime: { memory: [], redis: [], total: [] }
    };

    // Cache invalidation patterns
    this.invalidationPatterns = new Map();
    this.taggedKeys = new Map(); // Key -> Set of tags
    this.taggedCache = new Map(); // Tag -> Set of keys

    this.initializeRedisSubscriptions();
    this.startMemoryCleanup();
    this.startMetricsCollection();
  }

  /**
   * Get value from cache with multi-layer fallback
   */
  async get(key, options = {}) {
    const startTime = Date.now();
    const cacheKey = this.buildKey(key);
    
    try {
      // L1: Check memory cache first
      const memoryResult = this.getFromMemory(cacheKey);
      if (memoryResult !== null) {
        this.recordHit('memory', Date.now() - startTime);
        this.emit('cacheHit', { key: cacheKey, layer: 'memory', value: memoryResult });
        return memoryResult;
      }

      // L2: Check Redis cache
      const redisResult = await this.getFromRedis(cacheKey, options);
      if (redisResult !== null) {
        // Store in memory cache for faster future access
        this.setInMemory(cacheKey, redisResult, options.ttl);
        this.recordHit('redis', Date.now() - startTime);
        this.emit('cacheHit', { key: cacheKey, layer: 'redis', value: redisResult });
        return redisResult;
      }

      // Cache miss
      this.recordMiss('total', Date.now() - startTime);
      this.emit('cacheMiss', { key: cacheKey });
      return null;

    } catch (error) {
      this.recordError('total');
      this.emit('cacheError', { key: cacheKey, error: error.message, operation: 'get' });
      logError(`Cache get error for key ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with multi-layer storage
   */
  async set(key, value, options = {}) {
    const startTime = Date.now();
    const cacheKey = this.buildKey(key);
    const ttl = options.ttl || 3600; // Default 1 hour
    const tags = options.tags || [];
    
    try {
      // Serialize and optionally compress value
      const serializedValue = await this.serializeValue(value);
      
      // Set in memory cache (L1)
      this.setInMemory(cacheKey, value, ttl);
      
      // Set in Redis cache (L2)
      await this.setInRedis(cacheKey, serializedValue, ttl, options);
      
      // Handle cache tags for invalidation
      if (tags.length > 0) {
        await this.setTags(cacheKey, tags);
      }

      this.recordSet('total', Date.now() - startTime);
      this.emit('cacheSet', { key: cacheKey, ttl, tags, size: serializedValue.length });
      
      return true;

    } catch (error) {
      this.recordError('total');
      this.emit('cacheError', { key: cacheKey, error: error.message, operation: 'set' });
      logError(`Cache set error for key ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    const cacheKey = this.buildKey(key);
    
    try {
      // Delete from memory cache
      this.deleteFromMemory(cacheKey);
      
      // Delete from Redis cache
      await this.deleteFromRedis(cacheKey);
      
      // Clean up tags
      await this.removeTags(cacheKey);
      
      this.recordDelete('total');
      this.emit('cacheDelete', { key: cacheKey });
      
      return true;

    } catch (error) {
      this.recordError('total');
      this.emit('cacheError', { key: cacheKey, error: error.message, operation: 'delete' });
      logError(`Cache delete error for key ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTag(tag) {
    try {
      const keys = this.taggedCache.get(tag) || new Set();
      const deletePromises = Array.from(keys).map(key => this.delete(key));
      
      await Promise.all(deletePromises);
      
      // Publish invalidation event
      await this.redisPub.publish('cache:invalidate:tag', JSON.stringify({ tag, keys: Array.from(keys) }));
      
      this.emit('tagInvalidated', { tag, keysCount: keys.size });
      
      return keys.size;

    } catch (error) {
      this.emit('cacheError', { tag, error: error.message, operation: 'invalidateByTag' });
      logError(`Tag invalidation error for tag ${tag}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern) {
    try {
      const keys = await this.redis.keys(this.buildKey(pattern));
      const deletePromises = keys.map(key => this.redis.del(key));
      
      await Promise.all(deletePromises);
      
      // Also clear from memory cache
      for (const key of keys) {
        this.deleteFromMemory(key);
      }
      
      // Publish invalidation event
      await this.redisPub.publish('cache:invalidate:pattern', JSON.stringify({ pattern, keys }));
      
      this.emit('patternInvalidated', { pattern, keysCount: keys.length });
      
      return keys.length;

    } catch (error) {
      this.emit('cacheError', { pattern, error: error.message, operation: 'invalidateByPattern' });
      logError(`Pattern invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get or set with function execution (cache-aside pattern)
   */
  async getOrSet(key, fn, options = {}) {
    const value = await this.get(key, options);
    
    if (value !== null) {
      return value;
    }
    
    try {
      const result = await fn();
      await this.set(key, result, options);
      return result;
    } catch (error) {
      this.emit('cacheError', { key, error: error.message, operation: 'getOrSet' });
      throw error;
    }
  }

  /**
   * Batch get multiple keys
   */
  async mget(keys, options = {}) {
    const cacheKeys = keys.map(key => this.buildKey(key));
    const results = new Map();
    const missingKeys = [];
    
    // Check memory cache first
    for (const cacheKey of cacheKeys) {
      const memoryResult = this.getFromMemory(cacheKey);
      if (memoryResult !== null) {
        results.set(cacheKey, memoryResult);
      } else {
        missingKeys.push(cacheKey);
      }
    }
    
    // Get missing keys from Redis
    if (missingKeys.length > 0) {
      try {
        const redisResults = await this.redis.mget(missingKeys);
        
        for (let i = 0; i < missingKeys.length; i++) {
          const key = missingKeys[i];
          const value = redisResults[i];
          
          if (value !== null) {
            const deserializedValue = await this.deserializeValue(value);
            results.set(key, deserializedValue);
            
            // Store in memory cache
            this.setInMemory(key, deserializedValue, options.ttl);
          }
        }
      } catch (error) {
        this.emit('cacheError', { keys: missingKeys, error: error.message, operation: 'mget' });
      }
    }
    
    return results;
  }

  /**
   * Batch set multiple key-value pairs
   */
  async mset(keyValuePairs, options = {}) {
    const pipeline = this.redis.pipeline();
    const ttl = options.ttl || 3600;
    
    for (const [key, value] of keyValuePairs) {
      const cacheKey = this.buildKey(key);
      const serializedValue = await this.serializeValue(value);
      
      // Set in memory cache
      this.setInMemory(cacheKey, value, ttl);
      
      // Add to Redis pipeline
      pipeline.setex(cacheKey, ttl, serializedValue);
    }
    
    try {
      await pipeline.exec();
      this.emit('cacheMset', { count: keyValuePairs.length, ttl });
      return true;
    } catch (error) {
      this.emit('cacheError', { count: keyValuePairs.length, error: error.message, operation: 'mset' });
      return false;
    }
  }

  /**
   * Get from memory cache
   */
  getFromMemory(key) {
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      
      // Check TTL
      if (entry.expires && Date.now() > entry.expires) {
        this.deleteFromMemory(key);
        return null;
      }
      
      // Update access time for LRU
      this.memoryCacheAccess.set(key, Date.now());
      
      return entry.value;
    }
    
    return null;
  }

  /**
   * Set in memory cache
   */
  setInMemory(key, value, ttl) {
    // Check if we need to evict items
    this.evictMemoryCacheIfNeeded();
    
    const entry = {
      value,
      size: this.calculateSize(value),
      expires: ttl ? Date.now() + (ttl * 1000) : null,
      created: Date.now()
    };
    
    // Remove old entry if exists
    if (this.memoryCache.has(key)) {
      const oldEntry = this.memoryCache.get(key);
      this.memoryCacheSize -= oldEntry.size;
    }
    
    this.memoryCache.set(key, entry);
    this.memoryCacheSize += entry.size;
    this.memoryCacheAccess.set(key, Date.now());
    
    this.recordSet('memory');
  }

  /**
   * Delete from memory cache
   */
  deleteFromMemory(key) {
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      this.memoryCacheSize -= entry.size;
      this.memoryCache.delete(key);
      this.memoryCacheAccess.delete(key);
      this.recordDelete('memory');
    }
  }

  /**
   * Get from Redis cache
   */
  async getFromRedis(key, options = {}) {
    try {
      const value = await this.redis.get(key);
      if (value !== null) {
        return await this.deserializeValue(value);
      }
      return null;
    } catch (error) {
      this.recordError('redis');
      throw error;
    }
  }

  /**
   * Set in Redis cache
   */
  async setInRedis(key, value, ttl, options = {}) {
    try {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
      this.recordSet('redis');
    } catch (error) {
      this.recordError('redis');
      throw error;
    }
  }

  /**
   * Delete from Redis cache
   */
  async deleteFromRedis(key) {
    try {
      await this.redis.del(key);
      this.recordDelete('redis');
    } catch (error) {
      this.recordError('redis');
      throw error;
    }
  }

  /**
   * Set cache tags for invalidation
   */
  async setTags(key, tags) {
    // Store key -> tags mapping
    this.taggedKeys.set(key, new Set(tags));
    
    // Store tag -> keys mapping
    for (const tag of tags) {
      if (!this.taggedCache.has(tag)) {
        this.taggedCache.set(tag, new Set());
      }
      this.taggedCache.get(tag).add(key);
    }
    
    // Store in Redis for distributed invalidation
    const pipeline = this.redis.pipeline();
    for (const tag of tags) {
      pipeline.sadd(`tags:${tag}`, key);
    }
    await pipeline.exec();
  }

  /**
   * Remove cache tags
   */
  async removeTags(key) {
    const tags = this.taggedKeys.get(key);
    if (tags) {
      // Remove from local mappings
      for (const tag of tags) {
        const keys = this.taggedCache.get(tag);
        if (keys) {
          keys.delete(key);
          if (keys.size === 0) {
            this.taggedCache.delete(tag);
          }
        }
      }
      this.taggedKeys.delete(key);
      
      // Remove from Redis
      const pipeline = this.redis.pipeline();
      for (const tag of tags) {
        pipeline.srem(`tags:${tag}`, key);
      }
      await pipeline.exec();
    }
  }

  /**
   * Serialize value for storage
   */
  async serializeValue(value) {
    let serialized = JSON.stringify(value);
    
    // Compress if enabled and value is large enough
    if (this.config.compression.enabled && serialized.length > this.config.compression.threshold) {
      // Simple compression simulation (in real implementation, use zlib)
      serialized = `compressed:${serialized}`;
    }
    
    return serialized;
  }

  /**
   * Deserialize value from storage
   */
  async deserializeValue(value) {
    if (typeof value !== 'string') {
      return value;
    }
    
    // Handle compression
    if (value.startsWith('compressed:')) {
      value = value.substring(11); // Remove 'compressed:' prefix
    }
    
    try {
      return JSON.parse(value);
    } catch (error) {
      logError('Failed to deserialize cache value:', error);
      return null;
    }
  }

  /**
   * Build cache key with prefix
   */
  buildKey(key) {
    return `${this.config.redis.keyPrefix}${key}`;
  }

  /**
   * Calculate approximate size of value in bytes
   */
  calculateSize(value) {
    return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
  }

  /**
   * Evict items from memory cache if needed
   */
  evictMemoryCacheIfNeeded() {
    // Check size limit
    while (this.memoryCacheSize > this.config.memory.maxSize) {
      this.evictLRUItem();
    }
    
    // Check item count limit
    while (this.memoryCache.size >= this.config.memory.maxItems) {
      this.evictLRUItem();
    }
  }

  /**
   * Evict least recently used item from memory cache
   */
  evictLRUItem() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, accessTime] of this.memoryCacheAccess) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.deleteFromMemory(oldestKey);
      this.recordEviction('memory');
    }
  }

  /**
   * Initialize Redis subscriptions for distributed invalidation
   */
  initializeRedisSubscriptions() {
    this.redisSub.subscribe('cache:invalidate:tag', 'cache:invalidate:pattern');
    
    this.redisSub.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        
        if (channel === 'cache:invalidate:tag') {
          // Invalidate local cache for tag
          for (const key of data.keys) {
            this.deleteFromMemory(key);
          }
        } else if (channel === 'cache:invalidate:pattern') {
          // Invalidate local cache for pattern
          for (const key of data.keys) {
            this.deleteFromMemory(key);
          }
        }
      } catch (error) {
        logError('Error processing cache invalidation message:', error);
      }
    });
  }

  /**
   * Start memory cache cleanup
   */
  startMemoryCleanup() {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete = [];
      
      // Find expired entries
      for (const [key, entry] of this.memoryCache) {
        if (entry.expires && now > entry.expires) {
          keysToDelete.push(key);
        }
      }
      
      // Delete expired entries
      for (const key of keysToDelete) {
        this.deleteFromMemory(key);
      }
      
    }, 60000); // Clean up every minute
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    if (!this.config.monitoring.enabled) return;
    
    setInterval(() => {
      this.emit('metricsCollected', this.getMetrics());
    }, this.config.monitoring.metricsInterval);
  }

  /**
   * Record cache hit
   */
  recordHit(layer, responseTime = 0) {
    this.stats.hits[layer]++;
    this.stats.hits.total++;
    if (responseTime > 0) {
      this.stats.responseTime[layer].push(responseTime);
      this.stats.responseTime.total.push(responseTime);
      this.trimResponseTimes(layer);
    }
  }

  /**
   * Record cache miss
   */
  recordMiss(layer, responseTime = 0) {
    this.stats.misses[layer]++;
    this.stats.misses.total++;
    if (responseTime > 0) {
      this.stats.responseTime[layer].push(responseTime);
      this.stats.responseTime.total.push(responseTime);
      this.trimResponseTimes(layer);
    }
  }

  /**
   * Record cache set
   */
  recordSet(layer, responseTime = 0) {
    this.stats.sets[layer]++;
    this.stats.sets.total++;
    if (responseTime > 0) {
      this.stats.responseTime[layer].push(responseTime);
      this.stats.responseTime.total.push(responseTime);
      this.trimResponseTimes(layer);
    }
  }

  /**
   * Record cache delete
   */
  recordDelete(layer) {
    this.stats.deletes[layer]++;
    this.stats.deletes.total++;
  }

  /**
   * Record cache eviction
   */
  recordEviction(layer) {
    this.stats.evictions[layer]++;
    this.stats.evictions.total++;
  }

  /**
   * Record cache error
   */
  recordError(layer) {
    this.stats.errors[layer]++;
    this.stats.errors.total++;
  }

  /**
   * Trim response times array to prevent memory growth
   */
  trimResponseTimes(layer) {
    const maxSamples = 1000;
    if (this.stats.responseTime[layer].length > maxSamples) {
      this.stats.responseTime[layer] = this.stats.responseTime[layer].slice(-maxSamples);
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics() {
    const calculateAvg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const calculateP95 = (arr) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.ceil(0.95 * sorted.length) - 1;
      return sorted[index] || 0;
    };

    return {
      timestamp: new Date().toISOString(),
      hits: { ...this.stats.hits },
      misses: { ...this.stats.misses },
      sets: { ...this.stats.sets },
      deletes: { ...this.stats.deletes },
      evictions: { ...this.stats.evictions },
      errors: { ...this.stats.errors },
      hitRate: {
        memory: this.stats.hits.memory / (this.stats.hits.memory + this.stats.misses.memory) || 0,
        redis: this.stats.hits.redis / (this.stats.hits.redis + this.stats.misses.redis) || 0,
        total: this.stats.hits.total / (this.stats.hits.total + this.stats.misses.total) || 0
      },
      responseTime: {
        memory: {
          avg: calculateAvg(this.stats.responseTime.memory),
          p95: calculateP95(this.stats.responseTime.memory)
        },
        redis: {
          avg: calculateAvg(this.stats.responseTime.redis),
          p95: calculateP95(this.stats.responseTime.redis)
        },
        total: {
          avg: calculateAvg(this.stats.responseTime.total),
          p95: calculateP95(this.stats.responseTime.total)
        }
      },
      memory: {
        size: this.memoryCacheSize,
        items: this.memoryCache.size,
        maxSize: this.config.memory.maxSize,
        maxItems: this.config.memory.maxItems,
        utilization: (this.memoryCacheSize / this.config.memory.maxSize) * 100
      },
      tags: {
        count: this.taggedCache.size,
        keys: this.taggedKeys.size
      }
    };
  }

  /**
   * Clear all caches
   */
  async clear() {
    // Clear memory cache
    this.memoryCache.clear();
    this.memoryCacheAccess.clear();
    this.memoryCacheSize = 0;
    
    // Clear Redis cache (only keys with our prefix)
    const keys = await this.redis.keys(`${this.config.redis.keyPrefix}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    
    // Clear tags
    this.taggedKeys.clear();
    this.taggedCache.clear();
    
    this.emit('cacheCleared');
  }

  /**
   * Get cache health status
   */
  async getHealth() {
    try {
      // Test Redis connection
      const redisLatency = Date.now();
      await this.redis.ping();
      const redisResponseTime = Date.now() - redisLatency;
      
      const metrics = this.getMetrics();
      
      return {
        status: 'healthy',
        redis: {
          connected: true,
          responseTime: redisResponseTime
        },
        memory: {
          utilization: metrics.memory.utilization,
          items: metrics.memory.items
        },
        performance: {
          hitRate: metrics.hitRate.total,
          avgResponseTime: metrics.responseTime.total.avg
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.disconnect();
    }
    if (this.redisPub) {
      await this.redisPub.disconnect();
    }
    if (this.redisSub) {
      await this.redisSub.disconnect();
    }
  }
}

export default EnterpriseCacheManager;

