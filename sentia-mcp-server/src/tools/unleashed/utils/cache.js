/**
 * Unleashed Cache Utility
 * 
 * Intelligent caching system for Unleashed API responses with TTL management,
 * cache invalidation, and performance optimization.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import NodeCache from 'node-cache';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class UnleashedCache {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      defaultTTL: config.defaultTTL || 300, // 5 minutes
      productsTTL: config.productsTTL || 900, // 15 minutes
      inventoryTTL: config.inventoryTTL || 60, // 1 minute
      ordersTTL: config.ordersTTL || 180, // 3 minutes
      suppliersTTL: config.suppliersTTL || 1800, // 30 minutes
      customersTTL: config.customersTTL || 1800, // 30 minutes
      maxKeys: config.maxKeys || 1000,
      checkPeriod: config.checkPeriod || 120 // 2 minutes
    };
    
    this.cache = null;
    this.isInitialized = false;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    logger.info('Unleashed Cache utility initialized', {
      enabled: this.config.enabled,
      defaultTTL: this.config.defaultTTL
    });
  }

  async initialize() {
    try {
      logger.info('Initializing Unleashed Cache...');
      
      if (this.config.enabled) {
        this.cache = new NodeCache({
          stdTTL: this.config.defaultTTL,
          maxKeys: this.config.maxKeys,
          checkperiod: this.config.checkPeriod,
          useClones: false // For better performance
        });
        
        // Set up event listeners
        this.cache.on('set', (key, value) => {
          this.stats.sets++;
          logger.debug('Cache set', { key, size: JSON.stringify(value).length });
        });
        
        this.cache.on('del', (key, value) => {
          this.stats.deletes++;
          logger.debug('Cache delete', { key });
        });
        
        this.cache.on('expired', (key, value) => {
          logger.debug('Cache expired', { key });
        });
        
        this.cache.on('flush', () => {
          logger.info('Cache flushed');
        });
      }
      
      this.isInitialized = true;
      logger.info('Unleashed Cache initialized successfully', {
        enabled: this.config.enabled,
        maxKeys: this.config.maxKeys
      });
      
      return true;

    } catch (error) {
      logger.error('Failed to initialize Cache', { error: error.message });
      throw error;
    }
  }

  async get(key) {
    try {
      if (!this.config.enabled || !this.cache) {
        this.stats.misses++;
        return null;
      }
      
      const value = this.cache.get(key);
      
      if (value !== undefined) {
        this.stats.hits++;
        logger.debug('Cache hit', { key });
        return value;
      } else {
        this.stats.misses++;
        logger.debug('Cache miss', { key });
        return null;
      }

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      if (!this.config.enabled || !this.cache) {
        return false;
      }
      
      // Determine TTL based on key type or use provided TTL
      const cacheTTL = ttl || this.determineTTL(key);
      
      const success = this.cache.set(key, value, cacheTTL);
      
      if (success) {
        logger.debug('Cache set successful', {
          key,
          ttl: cacheTTL,
          size: JSON.stringify(value).length
        });
      } else {
        this.stats.errors++;
        logger.warn('Cache set failed', { key });
      }
      
      return success;

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  async delete(key) {
    try {
      if (!this.config.enabled || !this.cache) {
        return false;
      }
      
      const success = this.cache.del(key);
      
      if (success) {
        logger.debug('Cache delete successful', { key });
      }
      
      return success > 0;

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  async flush() {
    try {
      if (!this.config.enabled || !this.cache) {
        return false;
      }
      
      this.cache.flushAll();
      logger.info('Cache flushed successfully');
      
      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0
      };
      
      return true;

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache flush error', { error: error.message });
      return false;
    }
  }

  async has(key) {
    try {
      if (!this.config.enabled || !this.cache) {
        return false;
      }
      
      return this.cache.has(key);

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache has error', { key, error: error.message });
      return false;
    }
  }

  async keys() {
    try {
      if (!this.config.enabled || !this.cache) {
        return [];
      }
      
      return this.cache.keys();

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache keys error', { error: error.message });
      return [];
    }
  }

  async getTTL(key) {
    try {
      if (!this.config.enabled || !this.cache) {
        return 0;
      }
      
      return this.cache.getTtl(key);

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache getTTL error', { key, error: error.message });
      return 0;
    }
  }

  determineTTL(key) {
    // Determine appropriate TTL based on cache key patterns
    if (key.includes('products')) {
      return this.config.productsTTL;
    } else if (key.includes('inventory')) {
      return this.config.inventoryTTL;
    } else if (key.includes('orders')) {
      return this.config.ordersTTL;
    } else if (key.includes('suppliers')) {
      return this.config.suppliersTTL;
    } else if (key.includes('customers')) {
      return this.config.customersTTL;
    } else {
      return this.config.defaultTTL;
    }
  }

  invalidatePattern(pattern) {
    try {
      if (!this.config.enabled || !this.cache) {
        return 0;
      }
      
      const keys = this.cache.keys();
      const matchingKeys = keys.filter(key => 
        key.includes(pattern) || new RegExp(pattern).test(key)
      );
      
      let deletedCount = 0;
      for (const key of matchingKeys) {
        if (this.cache.del(key)) {
          deletedCount++;
        }
      }
      
      logger.info('Cache pattern invalidated', {
        pattern,
        keysDeleted: deletedCount
      });
      
      return deletedCount;

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache pattern invalidation error', {
        pattern,
        error: error.message
      });
      return 0;
    }
  }

  // Cache warming methods
  async warmCache(dataLoader, cacheKey, ttl = null) {
    try {
      logger.debug('Warming cache', { cacheKey });
      
      const data = await dataLoader();
      if (data) {
        await this.set(cacheKey, data, ttl);
        logger.debug('Cache warmed successfully', { cacheKey });
        return true;
      }
      
      return false;

    } catch (error) {
      logger.error('Cache warming failed', {
        cacheKey,
        error: error.message
      });
      return false;
    }
  }

  // Performance optimization methods
  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  getStats() {
    const hitRate = this.getHitRate();
    const keyCount = this.cache ? this.cache.keys().length : 0;
    
    return {
      ...this.stats,
      hitRate: parseFloat(hitRate.toFixed(2)),
      keyCount,
      enabled: this.config.enabled,
      maxKeys: this.config.maxKeys
    };
  }

  getDetailedStats() {
    const basicStats = this.getStats();
    
    if (!this.cache) {
      return basicStats;
    }
    
    const keys = this.cache.keys();
    const keysByType = {
      products: keys.filter(k => k.includes('products')).length,
      inventory: keys.filter(k => k.includes('inventory')).length,
      orders: keys.filter(k => k.includes('orders')).length,
      suppliers: keys.filter(k => k.includes('suppliers')).length,
      customers: keys.filter(k => k.includes('customers')).length,
      other: keys.filter(k => !['products', 'inventory', 'orders', 'suppliers', 'customers']
        .some(type => k.includes(type))).length
    };
    
    return {
      ...basicStats,
      keysByType,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  estimateMemoryUsage() {
    if (!this.cache) {
      return 0;
    }
    
    try {
      const keys = this.cache.keys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = this.cache.get(key);
        if (value) {
          totalSize += JSON.stringify(value).length;
        }
      }
      
      return totalSize;

    } catch (error) {
      logger.error('Memory usage estimation failed', { error: error.message });
      return 0;
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      enabled: this.config.enabled,
      keyCount: this.cache ? this.cache.keys().length : 0,
      hitRate: this.getHitRate(),
      stats: this.stats
    };
  }

  async cleanup() {
    try {
      logger.info('Cleaning up Cache...');
      
      if (this.cache) {
        this.cache.flushAll();
        this.cache.close();
        this.cache = null;
      }
      
      this.isInitialized = false;
      
      logger.info('Cache cleanup completed');
      
    } catch (error) {
      logger.error('Error during Cache cleanup', { error: error.message });
    }
  }
}