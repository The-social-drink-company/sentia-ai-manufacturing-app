/**
 * Unified Multi-Level Cache System
 * 
 * Enterprise-grade caching infrastructure supporting:
 * - Multi-level caching (L1: Memory, L2: Redis, L3: Database)
 * - Intelligent cache strategies (LRU, LFU, TTL-based)
 * - Cache warming and invalidation
 * - Compression and serialization
 * - Performance monitoring and analytics
 * 
 * @version 4.0.0
 */

import NodeCache from 'node-cache';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { promisify } from 'util';
import zlib from 'zlib';
import crypto from 'crypto';
import { createLogger } from './logger.js';
import { monitoring } from './monitoring.js';
import { getCacheConfig } from '../config/services/cache-config.js';

const logger = createLogger();
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Unified Cache Manager
 * Implements multi-level caching with intelligent strategies
 */
export class CacheManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      ...getCacheConfig(),
      ...config
    };

    // Cache levels
    this.l1Cache = null; // Memory cache
    this.l2Cache = null; // Redis cache
    this.l3Cache = null; // Database cache
    
    // Cache statistics
    this.stats = {
      l1: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
      l2: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
      l3: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
      total: { hits: 0, misses: 0, operations: 0 }
    };

    // Cache strategies
    this.strategies = new Map();
    this.warmupQueue = new Set();
    this.invalidationRules = new Map();
    
    this.initialized = false;
    this.initializeCache();
  }

  /**
   * Initialize multi-level cache system
   */
  async initializeCache() {
    try {
      // Initialize L1 Cache (Memory)
      await this.initializeL1Cache();
      
      // Initialize L2 Cache (Redis)
      await this.initializeL2Cache();
      
      // Initialize L3 Cache (Database)
      await this.initializeL3Cache();
      
      // Setup cache strategies
      this.setupCacheStrategies();
      
      // Setup monitoring
      this.setupMonitoring();
      
      // Setup cache warming
      this.setupCacheWarming();
      
      this.initialized = true;
      this.emit('cache:initialized');
      
      logger.info('Multi-level cache system initialized', {
        l1: !!this.l1Cache,
        l2: !!this.l2Cache,
        l3: !!this.l3Cache,
        strategies: this.strategies.size
      });

    } catch (error) {
      logger.error('Cache initialization failed', { error });
      throw error;
    }
  }

  /**
   * Initialize L1 Memory Cache
   */
  async initializeL1Cache() {
    const memoryConfig = this.config.memory;
    
    this.l1Cache = new NodeCache({
      stdTTL: memoryConfig.defaultTTL || 300,
      checkperiod: memoryConfig.checkPeriod || 120,
      maxKeys: memoryConfig.maxSize || 1000,
      deleteOnExpire: true,
      useClones: false // Better performance, handle mutations carefully
    });

    // Setup L1 event listeners
    this.l1Cache.on('set', (key, value) => {
      this.stats.l1.sets++;
      this.stats.l1.size = this.l1Cache.keys().length;
      this.emit('cache:l1:set', { key, size: JSON.stringify(value).length });
    });

    this.l1Cache.on('get', (key, value) => {
      if (value !== undefined) {
        this.stats.l1.hits++;
        this.emit('cache:l1:hit', { key });
      } else {
        this.stats.l1.misses++;
        this.emit('cache:l1:miss', { key });
      }
    });

    this.l1Cache.on('del', (key) => {
      this.stats.l1.deletes++;
      this.stats.l1.size = this.l1Cache.keys().length;
      this.emit('cache:l1:delete', { key });
    });

    this.l1Cache.on('expired', (key, value) => {
      this.emit('cache:l1:expired', { key });
    });

    logger.info('L1 Memory cache initialized', {
      maxSize: memoryConfig.maxSize,
      defaultTTL: memoryConfig.defaultTTL
    });
  }

  /**
   * Initialize L2 Redis Cache
   */
  async initializeL2Cache() {
    if (!this.config.redis || !this.config.redis.url) {
      logger.info('Redis not configured, skipping L2 cache');
      return;
    }

    try {
      const redisConfig = this.config.redis;
      
      // Create Redis client with clustering support
      if (redisConfig.cluster && redisConfig.cluster.enableCluster) {
        this.l2Cache = new Redis.Cluster(redisConfig.cluster.nodes, {
          redisOptions: {
            password: redisConfig.password,
            family: redisConfig.family || 4,
            connectTimeout: redisConfig.connectTimeout || 10000,
            lazyConnect: true
          },
          ...redisConfig.cluster.options
        });
      } else {
        this.l2Cache = new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: redisConfig.db || 0,
          family: redisConfig.family || 4,
          connectTimeout: redisConfig.connectTimeout || 10000,
          commandTimeout: redisConfig.commandTimeout || 5000,
          retryDelayOnFailover: redisConfig.retryDelayOnFailover || 100,
          maxRetriesPerRequest: redisConfig.maxRetriesPerRequest || 3,
          lazyConnect: true,
          enableAutoPipelining: redisConfig.enableAutoPipelining || false
        });
      }

      // Setup Redis event listeners
      this.l2Cache.on('connect', () => {
        logger.info('Redis L2 cache connected');
        this.emit('cache:l2:connected');
      });

      this.l2Cache.on('error', (error) => {
        logger.error('Redis L2 cache error', { error: error.message });
        this.emit('cache:l2:error', { error });
      });

      this.l2Cache.on('reconnecting', () => {
        logger.info('Redis L2 cache reconnecting');
        this.emit('cache:l2:reconnecting');
      });

      // Test connection
      await this.l2Cache.ping();
      
      logger.info('L2 Redis cache initialized', {
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db
      });

    } catch (error) {
      logger.error('L2 Redis cache initialization failed', { error });
      this.l2Cache = null;
    }
  }

  /**
   * Initialize L3 Database Cache
   */
  async initializeL3Cache() {
    // L3 cache implementation would depend on specific database setup
    // For now, we'll implement a simple fallback mechanism
    this.l3Cache = {
      enabled: false,
      // This would be implemented with actual database connection
      // get: async (key) => null,
      // set: async (key, value, ttl) => false,
      // delete: async (key) => false
    };
    
    logger.info('L3 Database cache placeholder initialized');
  }

  /**
   * Setup cache strategies for different data types
   */
  setupCacheStrategies() {
    // Financial data strategy (Xero)
    this.strategies.set('financial', {
      levels: ['l1', 'l2'],
      l1TTL: 300,    // 5 minutes
      l2TTL: 1800,   // 30 minutes
      compression: true,
      warming: true,
      invalidationRules: ['financial_update', 'tenant_change']
    });

    // E-commerce data strategy (Shopify)
    this.strategies.set('ecommerce', {
      levels: ['l1', 'l2'],
      l1TTL: 180,    // 3 minutes
      l2TTL: 900,    // 15 minutes
      compression: true,
      warming: true,
      invalidationRules: ['inventory_update', 'product_change']
    });

    // Marketplace data strategy (Amazon)
    this.strategies.set('marketplace', {
      levels: ['l1', 'l2'],
      l1TTL: 300,    // 5 minutes
      l2TTL: 3600,   // 1 hour
      compression: true,
      warming: false,
      invalidationRules: ['listing_update', 'inventory_sync']
    });

    // AI analysis strategy
    this.strategies.set('ai_analysis', {
      levels: ['l1', 'l2'],
      l1TTL: 600,    // 10 minutes
      l2TTL: 3600,   // 1 hour
      compression: true,
      warming: true,
      invalidationRules: ['data_refresh', 'model_update']
    });

    // Manufacturing data strategy (Unleashed)
    this.strategies.set('manufacturing', {
      levels: ['l1', 'l2'],
      l1TTL: 120,    // 2 minutes
      l2TTL: 600,    // 10 minutes
      compression: true,
      warming: true,
      invalidationRules: ['production_update', 'inventory_change']
    });

    // API response strategy
    this.strategies.set('api_response', {
      levels: ['l1'],
      l1TTL: 60,     // 1 minute
      l2TTL: 300,    // 5 minutes
      compression: false,
      warming: false,
      invalidationRules: ['api_change']
    });

    logger.info('Cache strategies configured', {
      strategies: Array.from(this.strategies.keys())
    });
  }

  /**
   * Setup cache monitoring
   */
  setupMonitoring() {
    // Monitor cache performance every minute
    setInterval(() => {
      this.collectMetrics();
    }, 60000);

    // Monitor cache health every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 300000);

    // Cleanup old data every hour
    setInterval(() => {
      this.performCleanup();
    }, 3600000);
  }

  /**
   * Setup cache warming
   */
  setupCacheWarming() {
    // Process warming queue every 30 seconds
    setInterval(() => {
      this.processWarmupQueue();
    }, 30000);
  }

  /**
   * Get data from cache with multi-level fallback
   */
  async get(key, strategy = 'default') => {
    this.stats.total.operations++;
    
    try {
      const cacheStrategy = this.strategies.get(strategy) || this.getDefaultStrategy();
      const levels = cacheStrategy.levels || ['l1', 'l2'];
      
      // Try each cache level in order
      for (const level of levels) {
        const result = await this.getFromLevel(key, level);
        if (result !== null) {
          this.stats.total.hits++;
          
          // Promote to higher cache levels
          await this.promoteToHigherLevels(key, result, level, levels, cacheStrategy);
          
          const data = await this.deserializeData(result, cacheStrategy.compression);
          this.emit('cache:hit', { key, level, strategy });
          
          return data;
        }
      }
      
      this.stats.total.misses++;
      this.emit('cache:miss', { key, strategy });
      return null;

    } catch (error) {
      logger.error('Cache get failed', { key, strategy, error: error.message });
      return null;
    }
  }

  /**
   * Set data in cache across multiple levels
   */
  async set(key, value, strategy = 'default', customTTL = null) {
    try {
      const cacheStrategy = this.strategies.get(strategy) || this.getDefaultStrategy();
      const levels = cacheStrategy.levels || ['l1', 'l2'];
      
      const serializedData = await this.serializeData(value, cacheStrategy.compression);
      
      // Set in all configured levels
      const promises = levels.map(level => {
        const ttl = customTTL || this.getTTLForLevel(level, cacheStrategy);
        return this.setInLevel(key, serializedData, level, ttl);
      });
      
      await Promise.allSettled(promises);
      
      this.emit('cache:set', { key, strategy, levels });
      return true;

    } catch (error) {
      logger.error('Cache set failed', { key, strategy, error: error.message });
      return false;
    }
  }

  /**
   * Delete data from all cache levels
   */
  async delete(key) {
    try {
      const promises = [];
      
      if (this.l1Cache) {
        promises.push(Promise.resolve(this.l1Cache.del(key)));
      }
      
      if (this.l2Cache) {
        promises.push(this.l2Cache.del(key));
      }
      
      if (this.l3Cache && this.l3Cache.enabled) {
        promises.push(this.l3Cache.delete(key));
      }
      
      await Promise.allSettled(promises);
      
      this.emit('cache:delete', { key });
      return true;

    } catch (error) {
      logger.error('Cache delete failed', { key, error: error.message });
      return false;
    }
  }

  /**
   * Invalidate cache based on rules
   */
  async invalidate(rule, context = {}) {
    try {
      const affectedKeys = await this.findKeysForInvalidation(rule, context);
      
      const deletePromises = affectedKeys.map(key => this.delete(key));
      await Promise.allSettled(deletePromises);
      
      logger.info('Cache invalidation completed', {
        rule,
        affectedKeys: affectedKeys.length,
        context
      });
      
      this.emit('cache:invalidated', { rule, affectedKeys, context });
      return affectedKeys.length;

    } catch (error) {
      logger.error('Cache invalidation failed', { rule, error: error.message });
      return 0;
    }
  }

  /**
   * Warm cache with commonly accessed data
   */
  async warmCache(keys, strategy = 'default') {
    try {
      for (const keyConfig of keys) {
        this.warmupQueue.add({
          key: keyConfig.key,
          dataLoader: keyConfig.loader,
          strategy: keyConfig.strategy || strategy,
          priority: keyConfig.priority || 1
        });
      }
      
      logger.info('Cache warming queued', {
        keys: keys.length,
        strategy,
        queueSize: this.warmupQueue.size
      });
      
      return true;

    } catch (error) {
      logger.error('Cache warming failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get data from specific cache level
   */
  async getFromLevel(key, level) {
    switch (level) {
      case 'l1':
        if (this.l1Cache) {
          return this.l1Cache.get(key) || null;
        }
        break;
        
      case 'l2':
        if (this.l2Cache) {
          try {
            return await this.l2Cache.get(key);
          } catch (error) {
            logger.warn('L2 cache get failed', { key, error: error.message });
          }
        }
        break;
        
      case 'l3':
        if (this.l3Cache && this.l3Cache.enabled) {
          try {
            return await this.l3Cache.get(key);
          } catch (error) {
            logger.warn('L3 cache get failed', { key, error: error.message });
          }
        }
        break;
    }
    
    return null;
  }

  /**
   * Set data in specific cache level
   */
  async setInLevel(key, value, level, ttl) {
    switch (level) {
      case 'l1':
        if (this.l1Cache) {
          return this.l1Cache.set(key, value, ttl);
        }
        break;
        
      case 'l2':
        if (this.l2Cache) {
          try {
            if (ttl) {
              await this.l2Cache.setex(key, ttl, value);
            } else {
              await this.l2Cache.set(key, value);
            }
            return true;
          } catch (error) {
            logger.warn('L2 cache set failed', { key, error: error.message });
          }
        }
        break;
        
      case 'l3':
        if (this.l3Cache && this.l3Cache.enabled) {
          try {
            return await this.l3Cache.set(key, value, ttl);
          } catch (error) {
            logger.warn('L3 cache set failed', { key, error: error.message });
          }
        }
        break;
    }
    
    return false;
  }

  /**
   * Promote data to higher cache levels
   */
  async promoteToHigherLevels(key, value, currentLevel, levels, strategy) {
    const currentIndex = levels.indexOf(currentLevel);
    const higherLevels = levels.slice(0, currentIndex);
    
    for (const level of higherLevels) {
      const ttl = this.getTTLForLevel(level, strategy);
      await this.setInLevel(key, value, level, ttl);
    }
  }

  /**
   * Get TTL for specific cache level
   */
  getTTLForLevel(level, strategy) {
    switch (level) {
      case 'l1':
        return strategy.l1TTL || 300;
      case 'l2':
        return strategy.l2TTL || 900;
      case 'l3':
        return strategy.l3TTL || 3600;
      default:
        return 300;
    }
  }

  /**
   * Serialize data with optional compression
   */
  async serializeData(data, useCompression = false) {
    try {
      let serialized = JSON.stringify(data);
      
      if (useCompression && serialized.length > 1024) {
        const compressed = await gzip(Buffer.from(serialized));
        return {
          data: compressed.toString('base64'),
          compressed: true,
          originalSize: serialized.length,
          compressedSize: compressed.length
        };
      }
      
      return {
        data: serialized,
        compressed: false,
        originalSize: serialized.length
      };

    } catch (error) {
      logger.error('Data serialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Deserialize data with decompression support
   */
  async deserializeData(serializedData, expectCompression = false) {
    try {
      if (typeof serializedData === 'string') {
        return JSON.parse(serializedData);
      }
      
      if (serializedData.compressed) {
        const compressed = Buffer.from(serializedData.data, 'base64');
        const decompressed = await gunzip(compressed);
        return JSON.parse(decompressed.toString());
      }
      
      return JSON.parse(serializedData.data);

    } catch (error) {
      logger.error('Data deserialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Find keys for invalidation based on rules
   */
  async findKeysForInvalidation(rule, context) {
    const affectedKeys = [];
    
    // Get keys from all cache levels
    const allKeys = await this.getAllKeys();
    
    // Apply invalidation rules
    for (const key of allKeys) {
      if (this.shouldInvalidateKey(key, rule, context)) {
        affectedKeys.push(key);
      }
    }
    
    return affectedKeys;
  }

  /**
   * Get all keys from all cache levels
   */
  async getAllKeys() {
    const keys = new Set();
    
    // L1 keys
    if (this.l1Cache) {
      this.l1Cache.keys().forEach(key => keys.add(key));
    }
    
    // L2 keys
    if (this.l2Cache) {
      try {
        const l2Keys = await this.l2Cache.keys('*');
        l2Keys.forEach(key => keys.add(key));
      } catch (error) {
        logger.warn('Failed to get L2 keys', { error: error.message });
      }
    }
    
    return Array.from(keys);
  }

  /**
   * Check if key should be invalidated based on rule
   */
  shouldInvalidateKey(key, rule, context) {
    // Implement invalidation logic based on key patterns and rules
    const keyParts = key.split(':');
    
    switch (rule) {
      case 'financial_update':
        return keyParts.includes('xero') || keyParts.includes('financial');
        
      case 'inventory_update':
        return keyParts.includes('inventory') || keyParts.includes('stock');
        
      case 'product_change':
        return keyParts.includes('product') || keyParts.includes('shopify');
        
      case 'tenant_change':
        return context.tenantId && keyParts.includes(context.tenantId);
        
      default:
        return false;
    }
  }

  /**
   * Process cache warming queue
   */
  async processWarmupQueue() {
    if (this.warmupQueue.size === 0) return;
    
    const items = Array.from(this.warmupQueue).slice(0, 5); // Process 5 items at a time
    
    for (const item of items) {
      try {
        const data = await item.dataLoader();
        await this.set(item.key, data, item.strategy);
        
        this.warmupQueue.delete(item);
        this.emit('cache:warmed', { key: item.key, strategy: item.strategy });
        
      } catch (error) {
        logger.error('Cache warming failed for item', {
          key: item.key,
          error: error.message
        });
        
        // Remove failed items from queue
        this.warmupQueue.delete(item);
      }
    }
  }

  /**
   * Collect cache metrics
   */
  collectMetrics() {
    try {
      // Calculate hit rates
      const totalRequests = this.stats.total.hits + this.stats.total.misses;
      const hitRate = totalRequests > 0 ? (this.stats.total.hits / totalRequests) * 100 : 0;
      
      // L1 Cache metrics
      if (this.l1Cache) {
        const l1Stats = this.l1Cache.getStats();
        monitoring.setMetric('cache.l1.hit_rate', (l1Stats.hits / (l1Stats.hits + l1Stats.misses)) * 100);
        monitoring.setMetric('cache.l1.keys', l1Stats.keys);
        monitoring.setMetric('cache.l1.memory_usage', l1Stats.vsize);
      }
      
      // L2 Cache metrics
      if (this.l2Cache) {
        monitoring.setMetric('cache.l2.connected', this.l2Cache.status === 'ready' ? 1 : 0);
      }
      
      // Overall metrics
      monitoring.setMetric('cache.overall.hit_rate', hitRate);
      monitoring.setMetric('cache.overall.operations', this.stats.total.operations);
      monitoring.setMetric('cache.warmup_queue_size', this.warmupQueue.size);
      
      this.emit('cache:metrics', {
        hitRate,
        stats: this.stats,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Cache metrics collection failed', { error: error.message });
    }
  }

  /**
   * Perform cache health check
   */
  async performHealthCheck() {
    const health = {
      l1: { status: 'unknown', latency: 0 },
      l2: { status: 'unknown', latency: 0 },
      l3: { status: 'unknown', latency: 0 },
      overall: 'healthy'
    };

    try {
      // L1 Health Check
      if (this.l1Cache) {
        const start = Date.now();
        const testKey = '__health_check_l1__';
        this.l1Cache.set(testKey, 'test', 10);
        const retrieved = this.l1Cache.get(testKey);
        this.l1Cache.del(testKey);
        
        health.l1.status = retrieved === 'test' ? 'healthy' : 'degraded';
        health.l1.latency = Date.now() - start;
      }

      // L2 Health Check
      if (this.l2Cache) {
        try {
          const start = Date.now();
          await this.l2Cache.ping();
          health.l2.status = 'healthy';
          health.l2.latency = Date.now() - start;
        } catch (error) {
          health.l2.status = 'unhealthy';
          logger.warn('L2 cache health check failed', { error: error.message });
        }
      }

      // Overall health assessment
      if (health.l1.status === 'unhealthy' && health.l2.status === 'unhealthy') {
        health.overall = 'critical';
      } else if (health.l1.status === 'degraded' || health.l2.status === 'degraded') {
        health.overall = 'degraded';
      }

      this.emit('cache:health', health);
      
      monitoring.setMetric('cache.health.l1_latency', health.l1.latency);
      monitoring.setMetric('cache.health.l2_latency', health.l2.latency);

    } catch (error) {
      logger.error('Cache health check failed', { error: error.message });
      health.overall = 'critical';
    }
  }

  /**
   * Perform cache cleanup
   */
  async performCleanup() {
    try {
      // L1 cleanup is automatic via node-cache
      
      // L2 cleanup for expired keys (if not handled by Redis)
      if (this.l2Cache) {
        // Redis handles expiration automatically, but we could implement
        // additional cleanup logic here if needed
      }
      
      // Clear old warmup queue items
      const oldItems = Array.from(this.warmupQueue).filter(item => 
        item.timestamp && (Date.now() - item.timestamp) > 3600000 // 1 hour old
      );
      
      oldItems.forEach(item => this.warmupQueue.delete(item));
      
      this.emit('cache:cleanup', {
        clearedWarmupItems: oldItems.length,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Cache cleanup failed', { error: error.message });
    }
  }

  /**
   * Get default cache strategy
   */
  getDefaultStrategy() {
    return {
      levels: ['l1', 'l2'],
      l1TTL: 300,
      l2TTL: 900,
      compression: false,
      warming: false,
      invalidationRules: []
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.total.hits + this.stats.total.misses > 0 
        ? ((this.stats.total.hits / (this.stats.total.hits + this.stats.total.misses)) * 100).toFixed(2) + '%'
        : '0%',
      strategies: Array.from(this.strategies.keys()),
      warmupQueueSize: this.warmupQueue.size,
      initialized: this.initialized
    };
  }

  /**
   * Clear all caches
   */
  async clearAll() {
    try {
      const promises = [];
      
      if (this.l1Cache) {
        promises.push(Promise.resolve(this.l1Cache.flushAll()));
      }
      
      if (this.l2Cache) {
        promises.push(this.l2Cache.flushall());
      }
      
      await Promise.allSettled(promises);
      
      // Reset statistics
      this.stats = {
        l1: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
        l2: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
        l3: { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 },
        total: { hits: 0, misses: 0, operations: 0 }
      };
      
      this.emit('cache:cleared');
      
      logger.info('All caches cleared');
      return true;

    } catch (error) {
      logger.error('Cache clear failed', { error: error.message });
      return false;
    }
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Export utility functions
export const {
  get: getCache,
  set: setCache,
  delete: deleteCache,
  invalidate: invalidateCache,
  warmCache,
  getStats: getCacheStats,
  clearAll: clearAllCaches
} = cacheManager;

export default CacheManager;