/**
 * Enterprise Redis Caching Service
 * High-performance caching layer with TTL, compression, and fallback strategies
 */

import { createClient } from 'redis';

class RedisCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackCache = new Map(); // Memory fallback
    this.compressionThreshold = 1024; // Compress data larger than 1KB

    // Default TTL values (in seconds)
    this.defaultTTL = {
      dashboard: 300,      // 5 minutes
      metrics: 180,        // 3 minutes
      workingCapital: 240, // 4 minutes
      inventory: 120,      // 2 minutes
      production: 60,      // 1 minute
      executive: 300,      // 5 minutes
      ai: 600,            // 10 minutes
      static: 3600,       // 1 hour
      user: 1800,         // 30 minutes
      health: 30          // 30 seconds
    };
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      if (process.env.REDIS_URL) {
        this.client = createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 10000,
            lazyConnect: true,
            reconnectStrategy: (retries) => {
              console.log(`Redis reconnection attempt ${retries}`);
              // Exponential backoff with max 3 seconds
              return Math.min(retries * 100, 3000);
            }
          },
          // Connection pooling for performance
          pool: {
            min: 2,
            max: 10,
            acquireTimeoutMillis: 30000,
            createRetryIntervalMillis: 2000
          }
        });

        // Event handlers
        this.client.on('connect', () => {
          console.log('🔴 Redis: Connection established');
        });

        this.client.on('ready', () => {
          this.isConnected = true;
          console.log('✅ Redis: Client ready');
        });

        this.client.on('error', (err) => {
          console.error('❌ Redis: Connection error:', err.message);
          this.isConnected = false;
        });

        this.client.on('end', () => {
          console.log('🔴 Redis: Connection closed');
          this.isConnected = false;
        });

        // Connect to Redis
        await this.client.connect();

        // Test connection
        await this.client.ping();
        console.log('🚀 Redis Cache Service initialized');

        // Set up periodic cleanup
        this.startPeriodicCleanup();

        return true;
      } else {
        console.log('⚠️  Redis URL not configured, using memory fallback');
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize Redis cache:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get cached value
   */
  async get(key, options = {}) {
    const fullKey = this.buildKey(key, options.namespace);

    try {
      if (this.isConnected && this.client) {
        const cached = await this.client.get(fullKey);
        if (cached) {
          const data = this.deserializeData(cached);
          this.recordCacheHit(key);
          return data;
        }
      } else {
        // Fallback to memory cache
        const cached = this.fallbackCache.get(fullKey);
        if (cached && cached.expires > Date.now()) {
          this.recordCacheHit(key);
          return cached.data;
        } else if (cached) {
          this.fallbackCache.delete(fullKey);
        }
      }

      this.recordCacheMiss(key);
      return null;
    } catch (error) {
      console.error(`Cache GET error for key ${fullKey}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key, value, ttl = null, options = {}) {
    const fullKey = this.buildKey(key, options.namespace);
    const resolvedTTL = ttl || this.getTTLForKey(key);

    try {
      const serializedData = this.serializeData(value);

      if (this.isConnected && this.client) {
        await this.client.setEx(fullKey, resolvedTTL, serializedData);

        // Set tags for efficient invalidation
        if (options.tags) {
          await this.setTags(fullKey, options.tags);
        }
      } else {
        // Fallback to memory cache
        this.fallbackCache.set(fullKey, {
          data: value,
          expires: Date.now() + (resolvedTTL * 1000)
        });

        // Prevent memory cache from growing too large
        if (this.fallbackCache.size > 1000) {
          this.cleanupMemoryCache();
        }
      }

      return true;
    } catch (error) {
      console.error(`Cache SET error for key ${fullKey}:`, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key, options = {}) {
    const fullKey = this.buildKey(key, options.namespace);

    try {
      if (this.isConnected && this.client) {
        await this.client.del(fullKey);
        await this.deleteTags(fullKey);
      } else {
        this.fallbackCache.delete(fullKey);
      }
      return true;
    } catch (error) {
      console.error(`Cache DELETE error for key ${fullKey}:`, error);
      return false;
    }
  }

  /**
   * Cache-aside pattern wrapper
   */
  async getOrSet(key, fetchFunction, ttl = null, options = {}) {
    // Try to get from cache first
    let data = await this.get(key, options);

    if (data !== null) {
      return data;
    }

    // Not in cache, fetch data
    try {
      const startTime = performance.now();
      data = await fetchFunction();
      const fetchTime = performance.now() - startTime;

      // Cache the result
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl, options);
      }

      // Record performance metrics
      this.recordFetchTime(key, fetchTime);

      return data;
    } catch (error) {
      console.error(`Error in getOrSet for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag) {
    if (!this.isConnected || !this.client) return;

    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.client.sMembers(tagKey);

      if (keys.length > 0) {
        await this.client.del(...keys);
        await this.client.del(tagKey);
        console.log(`Invalidated ${keys.length} keys for tag: ${tag}`);
      }
    } catch (error) {
      console.error(`Error invalidating tag ${tag}:`, error);
    }
  }

  /**
   * Multi-get operation
   */
  async mget(keys, options = {}) {
    if (!Array.isArray(keys) || keys.length === 0) return {};

    const fullKeys = keys.map(key => this.buildKey(key, options.namespace));
    const result = {};

    try {
      if (this.isConnected && this.client) {
        const values = await this.client.mGet(fullKeys);

        keys.forEach((originalKey, index) => {
          const value = values[index];
          if (value !== null) {
            result[originalKey] = this.deserializeData(value);
            this.recordCacheHit(originalKey);
          } else {
            this.recordCacheMiss(originalKey);
          }
        });
      } else {
        // Fallback to memory cache
        keys.forEach(key => {
          const fullKey = this.buildKey(key, options.namespace);
          const cached = this.fallbackCache.get(fullKey);
          if (cached && cached.expires > Date.now()) {
            result[key] = cached.data;
            this.recordCacheHit(key);
          } else {
            this.recordCacheMiss(key);
          }
        });
      }

      return result;
    } catch (error) {
      console.error('Multi-get error:', error);
      return {};
    }
  }

  /**
   * Build cache key with namespace
   */
  buildKey(key, namespace = 'default') {
    return `sentia:${namespace}:${key}`;
  }

  /**
   * Get TTL for specific key type
   */
  getTTLForKey(key) {
    for (const [type, ttl] of Object.entries(this.defaultTTL)) {
      if (key.includes(type)) {
        return ttl;
      }
    }
    return this.defaultTTL.dashboard; // Default fallback
  }

  /**
   * Serialize data with optional compression
   */
  serializeData(data) {
    const jsonString = JSON.stringify(data);

    // TODO: Add compression for large data
    if (jsonString.length > this.compressionThreshold) {
      // Would implement compression here if needed
      console.debug(`Large cache entry (${jsonString.length} bytes):`, jsonString.substring(0, 100) + '...');
    }

    return jsonString;
  }

  /**
   * Deserialize data
   */
  deserializeData(serialized) {
    try {
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Failed to deserialize cached data:', error);
      return null;
    }
  }

  /**
   * Set cache tags for invalidation
   */
  async setTags(key, tags) {
    if (!this.isConnected || !this.client || !Array.isArray(tags)) return;

    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        await this.client.sAdd(tagKey, key);
        await this.client.expire(tagKey, 86400); // Tags expire after 24 hours
      }
    } catch (error) {
      console.error('Error setting cache tags:', error);
    }
  }

  /**
   * Delete cache tags
   */
  async deleteTags(key) {
    if (!this.isConnected || !this.client) return;

    try {
      const tagKeys = await this.client.keys('tag:*');
      for (const tagKey of tagKeys) {
        await this.client.sRem(tagKey, key);
      }
    } catch (error) {
      console.error('Error deleting cache tags:', error);
    }
  }

  /**
   * Clean up expired entries from memory cache
   */
  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, value] of this.fallbackCache) {
      if (value.expires <= now) {
        this.fallbackCache.delete(key);
      }
    }

    // If still too large, remove oldest entries
    if (this.fallbackCache.size > 800) {
      const entries = Array.from(this.fallbackCache.entries())
        .sort((a, b) => a[1].expires - b[1].expires);

      for (let i = 0; i < 200; i++) {
        if (entries[i]) {
          this.fallbackCache.delete(entries[i][0]);
        }
      }
    }
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup() {
    setInterval(() => {
      if (!this.isConnected) {
        this.cleanupMemoryCache();
      }
    }, 60000); // Every minute
  }

  /**
   * Record cache metrics
   */
  recordCacheHit(key) {
    // Could send to monitoring service
    console.debug(`Cache HIT: ${key}`);
  }

  recordCacheMiss(key) {
    // Could send to monitoring service
    console.debug(`Cache MISS: ${key}`);
  }

  recordFetchTime(key, time) {
    // Could send to monitoring service
    console.debug(`Fetch time for ${key}: ${time.toFixed(2)}ms`);
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const stats = {
      connected: this.isConnected,
      fallbackEntries: this.fallbackCache.size,
      redisInfo: null
    };

    if (this.isConnected && this.client) {
      try {
        const info = await this.client.info('memory');
        stats.redisInfo = info;
      } catch (error) {
        console.error('Error getting Redis stats:', error);
      }
    }

    return stats;
  }

  /**
   * Clear all cache
   */
  async clear(pattern = '*') {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(`sentia:${pattern}`);
        if (keys.length > 0) {
          await this.client.del(...keys);
          console.log(`Cleared ${keys.length} cache entries`);
        }
      } else {
        this.fallbackCache.clear();
        console.log('Cleared memory cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Shutdown cache service
   */
  async shutdown() {
    try {
      if (this.client) {
        await this.client.quit();
      }
      this.fallbackCache.clear();
      console.log('Redis cache service shutdown complete');
    } catch (error) {
      console.error('Error shutting down cache:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new RedisCacheService();

// Export cache decorators for common patterns
export const withCache = (key, ttl, options = {}) => {
  return (target, propertyName, descriptor) => {
    const method = descriptor.value;

    descriptor.value = async function(...args) {
      const cacheKey = typeof key === 'function' ? key(...args) : key;

      return cacheService.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        ttl,
        options
      );
    };

    return descriptor;
  };
};

export default RedisCacheService;