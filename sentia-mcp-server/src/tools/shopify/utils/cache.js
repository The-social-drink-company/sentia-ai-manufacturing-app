/**
 * Shopify Cache Manager
 * 
 * Intelligent caching system for Shopify API responses to improve performance
 * and reduce API call limits. Supports store-specific caching strategies.
 * 
 * @version 1.0.0
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Shopify Cache Manager Class
 */
export class ShopifyCache {
  constructor(options = {}) {
    this.options = {
      // Default TTL values for different data types (in seconds)
      defaultTTL: options.defaultTTL || 300, // 5 minutes
      ordersTTL: options.ordersTTL || 60, // 1 minute
      productsTTL: options.productsTTL || 900, // 15 minutes
      customersTTL: options.customersTTL || 1800, // 30 minutes
      inventoryTTL: options.inventoryTTL || 300, // 5 minutes
      analyticsTTL: options.analyticsTTL || 600, // 10 minutes
      
      // Cache size limits
      maxKeys: options.maxKeys || 2000,
      checkPeriod: options.checkPeriod || 120, // 2 minutes
      
      // Enable/disable caching
      enabled: options.enabled !== false,
      
      ...options
    };

    // Initialize cache
    this.initializeCache();

    logger.info('Shopify cache initialized', {
      type: this.cacheType,
      enabled: this.options.enabled,
      defaultTTL: this.options.defaultTTL,
      maxKeys: this.options.maxKeys
    });
  }

  /**
   * Initialize cache backend
   */
  initializeCache() {
    // Memory-based caching (can be extended to Redis for production)
    this.cacheType = 'memory';
    this.cache = new NodeCache({
      stdTTL: this.options.defaultTTL,
      checkperiod: this.options.checkPeriod,
      maxKeys: this.options.maxKeys,
      deleteOnExpire: true,
      useClones: false // For better performance, but be careful with object mutations
    });

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      storeStats: {}
    };

    // Setup cache event listeners
    this.cache.on('set', (key, value) => {
      this.stats.sets++;
      const storeId = this.extractStoreId(key);
      this.updateStoreStats(storeId, 'sets');
      logger.debug('Shopify cache set', { key: this.sanitizeKey(key) });
    });

    this.cache.on('get', (key, value) => {
      const storeId = this.extractStoreId(key);
      if (value !== undefined) {
        this.stats.hits++;
        this.updateStoreStats(storeId, 'hits');
        logger.debug('Shopify cache hit', { key: this.sanitizeKey(key), storeId });
      } else {
        this.stats.misses++;
        this.updateStoreStats(storeId, 'misses');
        logger.debug('Shopify cache miss', { key: this.sanitizeKey(key), storeId });
      }
    });

    this.cache.on('del', (key, value) => {
      this.stats.deletes++;
      const storeId = this.extractStoreId(key);
      this.updateStoreStats(storeId, 'deletes');
      logger.debug('Shopify cache delete', { key: this.sanitizeKey(key) });
    });

    this.cache.on('expired', (key, value) => {
      logger.debug('Shopify cache expired', { key: this.sanitizeKey(key) });
    });
  }

  /**
   * Generate cache key for a Shopify operation
   */
  generateKey(toolName, params = {}) {
    try {
      // Remove sensitive data from cache key
      const sanitizedParams = { ...params };
      delete sanitizedParams.accessToken;
      delete sanitizedParams.correlationId;
      delete sanitizedParams.timestamp;

      // Create deterministic key
      const keyData = {
        tool: toolName,
        store: params.storeId || 'default',
        params: sanitizedParams
      };

      const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
      const hash = crypto.createHash('md5').update(keyString).digest('hex');
      
      return `shopify:${params.storeId || 'default'}:${toolName}:${hash}`;

    } catch (error) {
      logger.error('Shopify cache key generation failed', {
        error: error.message,
        toolName
      });
      // Fallback to simple key
      return `shopify:${params.storeId || 'default'}:${toolName}:${Date.now()}`;
    }
  }

  /**
   * Get TTL for specific tool type
   */
  getTTL(toolName) {
    const ttlMap = {
      'shopify-get-orders': this.options.ordersTTL,
      'shopify-get-products': this.options.productsTTL,
      'shopify-get-customers': this.options.customersTTL,
      'shopify-get-inventory': this.options.inventoryTTL,
      'shopify-get-analytics': this.options.analyticsTTL
    };

    return ttlMap[toolName] || this.options.defaultTTL;
  }

  /**
   * Set data in cache
   */
  async set(key, data, ttl = null) {
    if (!this.options.enabled) {
      return false;
    }

    try {
      const cacheData = {
        data,
        storeId: this.extractStoreId(key),
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (ttl || this.options.defaultTTL) * 1000).toISOString()
      };

      const success = this.cache.set(key, cacheData, ttl || this.options.defaultTTL);
      
      if (success) {
        logger.debug('Shopify data cached successfully', {
          key: this.sanitizeKey(key),
          ttl: ttl || this.options.defaultTTL,
          size: JSON.stringify(data).length,
          storeId: cacheData.storeId
        });
      }

      return success;

    } catch (error) {
      this.stats.errors++;
      logger.error('Shopify cache set failed', {
        error: error.message,
        key: this.sanitizeKey(key)
      });
      return false;
    }
  }

  /**
   * Get data from cache
   */
  async get(key) {
    if (!this.options.enabled) {
      return null;
    }

    try {
      const cacheData = this.cache.get(key);
      
      if (cacheData && cacheData.data) {
        logger.debug('Shopify cache hit', {
          key: this.sanitizeKey(key),
          cachedAt: cacheData.cachedAt,
          storeId: cacheData.storeId
        });
        
        return {
          ...cacheData.data,
          _cacheMetadata: {
            cachedAt: cacheData.cachedAt,
            expiresAt: cacheData.expiresAt,
            storeId: cacheData.storeId,
            fromCache: true
          }
        };
      }

      return null;

    } catch (error) {
      this.stats.errors++;
      logger.error('Shopify cache get failed', {
        error: error.message,
        key: this.sanitizeKey(key)
      });
      return null;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key) {
    if (!this.options.enabled) {
      return false;
    }

    try {
      return this.cache.has(key);
    } catch (error) {
      logger.error('Shopify cache has check failed', {
        error: error.message,
        key: this.sanitizeKey(key)
      });
      return false;
    }
  }

  /**
   * Delete specific key from cache
   */
  async delete(key) {
    if (!this.options.enabled) {
      return false;
    }

    try {
      const result = this.cache.del(key);
      
      logger.debug('Shopify cache delete', {
        key: this.sanitizeKey(key),
        success: result > 0
      });

      return result > 0;

    } catch (error) {
      this.stats.errors++;
      logger.error('Shopify cache delete failed', {
        error: error.message,
        key: this.sanitizeKey(key)
      });
      return false;
    }
  }

  /**
   * Clear all Shopify cache entries
   */
  async clear() {
    try {
      const keys = this.cache.keys();
      const shopifyKeys = keys.filter(key => key.startsWith('shopify:'));
      
      if (shopifyKeys.length > 0) {
        this.cache.del(shopifyKeys);
        logger.info('Shopify cache cleared', {
          clearedKeys: shopifyKeys.length
        });
      }

      return {
        success: true,
        clearedKeys: shopifyKeys.length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Shopify cache clear failed', {
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear cache entries for specific store
   */
  async clearStore(storeId) {
    try {
      const keys = this.cache.keys();
      const storeKeys = keys.filter(key => 
        key.startsWith('shopify:') && key.includes(`:${storeId}:`)
      );
      
      if (storeKeys.length > 0) {
        this.cache.del(storeKeys);
        logger.info('Shopify store cache cleared', {
          storeId,
          clearedKeys: storeKeys.length
        });
      }

      return {
        success: true,
        storeId,
        clearedKeys: storeKeys.length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Shopify store cache clear failed', {
        error: error.message,
        storeId
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear cache entries for specific tool
   */
  async clearTool(toolName, storeId = null) {
    try {
      const keys = this.cache.keys();
      let toolKeys;
      
      if (storeId) {
        toolKeys = keys.filter(key => key.startsWith(`shopify:${storeId}:${toolName}:`));
      } else {
        toolKeys = keys.filter(key => key.includes(`:${toolName}:`));
      }
      
      if (toolKeys.length > 0) {
        this.cache.del(toolKeys);
        logger.info('Shopify tool cache cleared', {
          toolName,
          storeId,
          clearedKeys: toolKeys.length
        });
      }

      return {
        success: true,
        toolName,
        storeId,
        clearedKeys: toolKeys.length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Shopify tool cache clear failed', {
        error: error.message,
        toolName,
        storeId
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const cacheStats = this.cache.getStats();
      
      return {
        ...this.stats,
        keys: cacheStats.keys,
        hits: cacheStats.hits || this.stats.hits,
        misses: cacheStats.misses || this.stats.misses,
        hitRate: this.stats.hits + this.stats.misses > 0 
          ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
          : '0%',
        ksize: cacheStats.ksize,
        vsize: cacheStats.vsize,
        storeStats: this.stats.storeStats,
        enabled: this.options.enabled,
        type: this.cacheType
      };

    } catch (error) {
      logger.error('Failed to get Shopify cache stats', {
        error: error.message
      });
      return {
        error: error.message
      };
    }
  }

  /**
   * Get cache entries by pattern
   */
  async getKeysByPattern(pattern) {
    try {
      const keys = this.cache.keys();
      return keys.filter(key => {
        // Simple pattern matching - could be enhanced with regex
        return key.includes(pattern);
      });
    } catch (error) {
      logger.error('Failed to get keys by pattern', {
        error: error.message,
        pattern
      });
      return [];
    }
  }

  /**
   * Warm up cache with commonly accessed data
   */
  async warmUp(storeId, toolsToWarm = []) {
    if (!this.options.enabled) {
      return { success: false, message: 'Cache disabled' };
    }

    try {
      logger.info('Starting Shopify cache warm-up', {
        storeId,
        toolsCount: toolsToWarm.length
      });

      // This would typically pre-fetch commonly accessed data
      // Implementation depends on the specific tools and their requirements

      return {
        success: true,
        warmedTools: toolsToWarm.length,
        storeId
      };

    } catch (error) {
      logger.error('Shopify cache warm-up failed', {
        error: error.message,
        storeId
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cache health check
   */
  async healthCheck() {
    try {
      const testKey = 'shopify:health:test';
      const testData = { timestamp: new Date().toISOString() };
      
      // Test set
      const setResult = await this.set(testKey, testData, 10);
      if (!setResult) {
        throw new Error('Cache set operation failed');
      }

      // Test get
      const getData = await this.get(testKey);
      if (!getData || getData.timestamp !== testData.timestamp) {
        throw new Error('Cache get operation failed');
      }

      // Test delete
      const deleteResult = await this.delete(testKey);
      if (!deleteResult) {
        throw new Error('Cache delete operation failed');
      }

      return {
        healthy: true,
        message: 'Cache is functioning properly',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Shopify cache health check failed', {
        error: error.message
      });
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper methods

  /**
   * Extract store ID from cache key
   */
  extractStoreId(key) {
    const parts = key.split(':');
    return parts.length > 1 ? parts[1] : 'unknown';
  }

  /**
   * Update store-specific statistics
   */
  updateStoreStats(storeId, operation) {
    if (!this.stats.storeStats[storeId]) {
      this.stats.storeStats[storeId] = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0
      };
    }
    this.stats.storeStats[storeId][operation]++;
  }

  /**
   * Sanitize key for logging (remove sensitive data)
   */
  sanitizeKey(key) {
    // Only show first part of hash for privacy
    const parts = key.split(':');
    if (parts.length >= 4) {
      parts[3] = parts[3].substring(0, 8) + '...';
    }
    return parts.join(':');
  }

  /**
   * Get cache key info
   */
  analyzeKey(key) {
    const parts = key.split(':');
    return {
      platform: parts[0] || 'unknown',
      storeId: parts[1] || 'unknown',
      tool: parts[2] || 'unknown',
      hash: parts[3] || 'unknown'
    };
  }

  /**
   * Estimate cache memory usage
   */
  estimateMemoryUsage() {
    try {
      const keys = this.cache.keys();
      let totalSize = 0;
      
      keys.forEach(key => {
        const data = this.cache.get(key);
        if (data) {
          totalSize += JSON.stringify(data).length;
        }
      });

      return {
        keys: keys.length,
        estimatedSizeBytes: totalSize,
        estimatedSizeMB: (totalSize / 1024 / 1024).toFixed(2)
      };

    } catch (error) {
      logger.error('Failed to estimate cache memory usage', {
        error: error.message
      });
      return {
        error: error.message
      };
    }
  }
}