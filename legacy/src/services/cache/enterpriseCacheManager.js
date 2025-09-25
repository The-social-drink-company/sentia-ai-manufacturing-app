// Enterprise Cache Manager
// Advanced Redis-based caching with fallback, invalidation strategies, and performance monitoring

import { createClient } from 'redis';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

class EnterpriseCacheManager {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalOperations: 0
    };
    this.connected = false;
    this.maxMemoryCacheSize = 1000; // Limit memory cache to 1000 entries
  }

  // Initialize Redis connection with fallback to memory cache
  async initialize() {
    try {
      if (process.env.REDIS_URL) {
        this.redisClient = createClient({
          url: process.env.REDIS_URL,
          retry_delay_on_failover: 100,
          retry_delay_on_cluster_down: 300,
          max_attempts: 3,
          connect_timeout: 10000
        });

        this.redisClient.on('error', (err) => {
          logError('Redis connection error', { error: err.message });
          this.metrics.errors++;
          this.connected = false;
        });

        this.redisClient.on('connect', () => {
          logInfo('Redis connected successfully');
          this.connected = true;
        });

        this.redisClient.on('ready', () => {
          logInfo('Redis ready for operations');
          this.connected = true;
        });

        this.redisClient.on('reconnecting', () => {
          logWarn('Redis reconnecting...');
          this.connected = false;
        });

        await this.redisClient.connect();
        logInfo('Enterprise cache manager initialized with Redis');
      } else {
        logWarn('Redis URL not provided, using memory cache only');
      }
    } catch (error) {
      logWarn('Redis initialization failed, using memory cache fallback', { 
        error: error.message 
      });
      this.connected = false;
    }

    // Start monitoring
    this.startMonitoring();
  }

  // Get cache key with namespace
  getKey(key, namespace = 'sentia') {
    return `${namespace}:${key}`;
  }

  // Set cache value with TTL
  async set(key, value, options = {}) {
    const {
      ttl = 300, // 5 minutes default
      namespace = 'sentia',
      compress = false,
      tags = []
    } = options;

    this.metrics.sets++;
    this.metrics.totalOperations++;

    const fullKey = this.getKey(key, namespace);
    
    try {
      // Prepare value for storage
      let serializedValue;
      if (typeof value === 'object') {
        serializedValue = JSON.stringify(value);
        if (compress && serializedValue.length > 1000) {
          // Could implement compression here if needed
          // serializedValue = await this.compress(serializedValue);
        }
      } else {
        serializedValue = String(value);
      }

      // Try Redis first
      if (this.connected && this.redisClient) {
        try {
          const cacheEntry = {
            data: serializedValue,
            type: typeof value,
            timestamp: Date.now(),
            ttl: ttl * 1000, // Convert to milliseconds
            tags,
            compressed: compress
          };

          await this.redisClient.setEx(fullKey, ttl, JSON.stringify(cacheEntry));
          
          // Set tags for invalidation if provided
          if (tags.length > 0) {
            const tagPromises = tags.map(tag => 
              this.redisClient.sAdd(`${namespace}:tags:${tag}`, fullKey)
            );
            await Promise.all(tagPromises);
          }

          return true;
        } catch (redisError) {
          logWarn('Redis set failed, falling back to memory cache', { 
            key: fullKey, 
            error: redisError.message 
          });
          this.metrics.errors++;
        }
      }

      // Fallback to memory cache
      this.setMemoryCache(fullKey, {
        data: serializedValue,
        type: typeof value,
        timestamp: Date.now(),
        ttl: ttl * 1000,
        tags,
        compressed: compress
      });

      return true;

    } catch (error) {
      logError('Cache set operation failed', { key: fullKey, error: error.message });
      this.metrics.errors++;
      return false;
    }
  }

  // Get cache value
  async get(key, options = {}) {
    const { namespace = 'sentia', decompress = false } = options;
    
    this.metrics.totalOperations++;
    const fullKey = this.getKey(key, namespace);

    try {
      let cacheEntry = null;

      // Try Redis first
      if (this.connected && this.redisClient) {
        try {
          const cached = await this.redisClient.get(fullKey);
          if (cached) {
            cacheEntry = JSON.parse(cached);
          }
        } catch (redisError) {
          logWarn('Redis get failed, trying memory cache', { 
            key: fullKey, 
            error: redisError.message 
          });
          this.metrics.errors++;
        }
      }

      // Fallback to memory cache
      if (!cacheEntry) {
        cacheEntry = this.getMemoryCache(fullKey);
      }

      if (!cacheEntry) {
        this.metrics.misses++;
        return null;
      }

      // Check if expired
      if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
        await this.delete(key, { namespace });
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;

      // Deserialize value
      let value = cacheEntry.data;
      if (cacheEntry.type === 'object') {
        value = JSON.parse(value);
      }

      return value;

    } catch (error) {
      logError('Cache get operation failed', { key: fullKey, error: error.message });
      this.metrics.errors++;
      this.metrics.misses++;
      return null;
    }
  }

  // Delete cache value
  async delete(key, options = {}) {
    const { namespace = 'sentia' } = options;
    
    this.metrics.deletes++;
    this.metrics.totalOperations++;

    const fullKey = this.getKey(key, namespace);

    try {
      let deleted = false;

      // Try Redis first
      if (this.connected && this.redisClient) {
        try {
          const result = await this.redisClient.del(fullKey);
          deleted = result > 0;
        } catch (redisError) {
          logWarn('Redis delete failed', { key: fullKey, error: redisError.message });
          this.metrics.errors++;
        }
      }

      // Memory cache
      if (this.memoryCache.has(fullKey)) {
        this.memoryCache.delete(fullKey);
        deleted = true;
      }

      return deleted;

    } catch (error) {
      logError('Cache delete operation failed', { key: fullKey, error: error.message });
      this.metrics.errors++;
      return false;
    }
  }

  // Invalidate by tags
  async invalidateByTags(tags, namespace = 'sentia') {
    if (!Array.isArray(tags)) tags = [tags];

    try {
      const invalidatedKeys = new Set();

      for (const tag of tags) {
        const tagKey = `${namespace}:tags:${tag}`;

        // Redis tag invalidation
        if (this.connected && this.redisClient) {
          try {
            const keys = await this.redisClient.sMembers(tagKey);
            if (keys.length > 0) {
              await this.redisClient.del(...keys);
              await this.redisClient.del(tagKey);
              keys.forEach(key => invalidatedKeys.add(key));
            }
          } catch (redisError) {
            logWarn('Redis tag invalidation failed', { tag, error: redisError.message });
          }
        }

        // Memory cache tag invalidation
        for (const [key, entry] of this.memoryCache) {
          if (entry.tags && entry.tags.includes(tag)) {
            this.memoryCache.delete(key);
            invalidatedKeys.add(key);
          }
        }
      }

      logInfo('Cache invalidated by tags', { 
        tags, 
        invalidatedCount: invalidatedKeys.size 
      });

      return Array.from(invalidatedKeys);

    } catch (error) {
      logError('Tag invalidation failed', { tags, error: error.message });
      return [];
    }
  }

  // Bulk operations
  async mget(keys, options = {}) {
    const { namespace = 'sentia' } = options;
    const fullKeys = keys.map(key => this.getKey(key, namespace));
    const results = {};

    try {
      // Try Redis first
      if (this.connected && this.redisClient && fullKeys.length > 0) {
        try {
          const redisResults = await this.redisClient.mGet(fullKeys);
          fullKeys.forEach((fullKey, index) => {
            if (redisResults[index]) {
              const cacheEntry = JSON.parse(redisResults[index]);
              if (Date.now() - cacheEntry.timestamp <= cacheEntry.ttl) {
                const key = keys[index];
                results[key] = cacheEntry.type === 'object' 
                  ? JSON.parse(cacheEntry.data)
                  : cacheEntry.data;
              }
            }
          });
        } catch (redisError) {
          logWarn('Redis mget failed', { error: redisError.message });
        }
      }

      // Fill missing values from memory cache
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!results.hasOwnProperty(key)) {
          const memoryResult = this.getMemoryCache(fullKeys[i]);
          if (memoryResult && Date.now() - memoryResult.timestamp <= memoryResult.ttl) {
            results[key] = memoryResult.type === 'object' 
              ? JSON.parse(memoryResult.data)
              : memoryResult.data;
          }
        }
      }

      return results;

    } catch (error) {
      logError('Bulk get operation failed', { keys, error: error.message });
      return {};
    }
  }

  // Memory cache operations
  setMemoryCache(key, value) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, value);
  }

  getMemoryCache(key) {
    return this.memoryCache.get(key);
  }

  // Cache warming for manufacturing data
  async warmCache() {
    logInfo('Starting cache warming for manufacturing data');

    const warmingTasks = [
      this.warmDashboardData(),
      this.warmAnalyticsData(),
      this.warmInventoryData(),
      this.warmProductionData()
    ];

    try {
      await Promise.allSettled(warmingTasks);
      logInfo('Cache warming completed');
    } catch (error) {
      logError('Cache warming failed', { error: error.message });
    }
  }

  async warmDashboardData() {
    // This would typically fetch and cache frequently accessed dashboard data
    logInfo('Warming dashboard cache');
  }

  async warmAnalyticsData() {
    // This would typically fetch and cache analytics data
    logInfo('Warming analytics cache');
  }

  async warmInventoryData() {
    // This would typically fetch and cache inventory data
    logInfo('Warming inventory cache');
  }

  async warmProductionData() {
    // This would typically fetch and cache production data
    logInfo('Warming production cache');
  }

  // Clear all cache
  async flush(namespace = 'sentia') {
    try {
      let cleared = 0;

      // Clear Redis
      if (this.connected && this.redisClient) {
        try {
          const keys = await this.redisClient.keys(`${namespace}:*`);
          if (keys.length > 0) {
            cleared += await this.redisClient.del(...keys);
          }
        } catch (redisError) {
          logWarn('Redis flush failed', { error: redisError.message });
        }
      }

      // Clear memory cache
      const memoryKeysToDelete = [];
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(`${namespace}:`)) {
          memoryKeysToDelete.push(key);
        }
      }
      
      memoryKeysToDelete.forEach(key => this.memoryCache.delete(key));
      cleared += memoryKeysToDelete.length;

      logInfo('Cache flushed', { namespace, clearedKeys: cleared });
      return cleared;

    } catch (error) {
      logError('Cache flush failed', { namespace, error: error.message });
      return 0;
    }
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.metrics.totalOperations > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
      : 0;

    return {
      ...this.metrics,
      hitRate: parseFloat(hitRate.toFixed(2)),
      memoryCache: {
        size: this.memoryCache.size,
        maxSize: this.maxMemoryCacheSize
      },
      redis: {
        connected: this.connected,
        client: !!this.redisClient
      }
    };
  }

  // Health check
  async healthCheck() {
    const stats = this.getStats();
    let status = 'healthy';
    const issues = [];

    // Check Redis connection
    if (process.env.REDIS_URL && !this.connected) {
      status = 'degraded';
      issues.push('Redis connection lost');
    }

    // Check error rate
    if (this.metrics.errors > this.metrics.totalOperations * 0.1) {
      status = 'degraded';
      issues.push('High error rate');
    }

    // Check hit rate
    if (stats.hitRate < 50 && this.metrics.totalOperations > 100) {
      issues.push('Low cache hit rate');
    }

    return {
      status,
      issues,
      stats
    };
  }

  // Start monitoring
  startMonitoring() {
    // Log statistics every 10 minutes
    setInterval(() => {
      const stats = this.getStats();
      logInfo('Cache statistics', stats);
    }, 10 * 60 * 1000);

    // Clean expired entries from memory cache every 5 minutes
    setInterval(() => {
      let cleaned = 0;
      const now = Date.now();
      
      for (const [key, entry] of this.memoryCache) {
        if (now - entry.timestamp > entry.ttl) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logInfo('Memory cache cleanup completed', { cleanedEntries: cleaned });
      }
    }, 5 * 60 * 1000);
  }

  // Graceful shutdown
  async shutdown() {
    logInfo('Shutting down cache manager...');
    
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        logInfo('Redis connection closed');
      } catch (error) {
        logError('Error closing Redis connection', { error: error.message });
      }
    }

    this.memoryCache.clear();
    this.connected = false;
    
    logInfo('Cache manager shutdown complete');
  }
}

// Singleton instance
const enterpriseCacheManager = new EnterpriseCacheManager();

export default enterpriseCacheManager;
