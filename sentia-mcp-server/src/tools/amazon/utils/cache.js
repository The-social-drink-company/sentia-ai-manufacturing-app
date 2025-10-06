/**
 * Amazon Cache Manager
 * 
 * Intelligent caching system for Amazon SP-API responses to improve performance
 * and reduce API call limits with marketplace-specific strategies.
 * 
 * @version 1.0.0
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon Cache Manager Class
 */
export class AmazonCache {
  constructor(options = {}) {
    this.options = {
      // Default TTL values for different data types (in seconds)
      defaultTTL: options.defaultTTL || 600, // 10 minutes
      ordersTTL: options.ordersTTL || 300, // 5 minutes
      productsTTL: options.productsTTL || 1800, // 30 minutes
      inventoryTTL: options.inventoryTTL || 300, // 5 minutes
      reportsTTL: options.reportsTTL || 3600, // 1 hour
      listingsTTL: options.listingsTTL || 900, // 15 minutes
      advertisingTTL: options.advertisingTTL || 1800, // 30 minutes
      
      // Cache size limits
      maxKeys: options.maxKeys || 1000,
      checkPeriod: options.checkPeriod || 120, // 2 minutes
      
      // Enable/disable caching
      enabled: options.enabled !== false,
      
      ...options
    };

    // Initialize cache
    this.initializeCache();

    logger.info('Amazon cache initialized', {
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
      marketplaceStats: {}
    };

    // Setup cache event listeners
    this.cache.on('set', (key, value) => {
      this.stats.sets++;
      const marketplaceId = this.extractMarketplaceId(key);
      this.updateMarketplaceStats(marketplaceId, 'sets');
      logger.debug('Amazon cache set', { key: this.sanitizeKey(key) });
    });

    this.cache.on('get', (key, value) => {
      const marketplaceId = this.extractMarketplaceId(key);
      if (value !== undefined) {
        this.stats.hits++;
        this.updateMarketplaceStats(marketplaceId, 'hits');
        logger.debug('Amazon cache hit', { key: this.sanitizeKey(key), marketplaceId });
      } else {
        this.stats.misses++;
        this.updateMarketplaceStats(marketplaceId, 'misses');
        logger.debug('Amazon cache miss', { key: this.sanitizeKey(key), marketplaceId });
      }
    });

    this.cache.on('del', (key, value) => {
      this.stats.deletes++;
      const marketplaceId = this.extractMarketplaceId(key);
      this.updateMarketplaceStats(marketplaceId, 'deletes');
      logger.debug('Amazon cache delete', { key: this.sanitizeKey(key) });
    });

    this.cache.on('expired', (key, value) => {
      logger.debug('Amazon cache expired', { key: this.sanitizeKey(key) });
    });
  }

  /**
   * Generate cache key for an Amazon operation
   */
  generateKey(toolName, params = {}) {
    try {
      // Remove sensitive data from cache key
      const sanitizedParams = { ...params };
      delete sanitizedParams.accessToken;
      delete sanitizedParams.refreshToken;
      delete sanitizedParams.correlationId;
      delete sanitizedParams.timestamp;

      // Create deterministic key
      const keyData = {
        tool: toolName,
        marketplace: params.marketplaceId || 'default',
        params: sanitizedParams
      };

      const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
      const hash = crypto.createHash('md5').update(keyString).digest('hex');
      
      return `amazon:${params.marketplaceId || 'default'}:${toolName}:${hash}`;

    } catch (error) {
      logger.error('Amazon cache key generation failed', {
        error: error.message,
        toolName
      });
      // Fallback to simple key
      return `amazon:${params.marketplaceId || 'default'}:${toolName}:${Date.now()}`;
    }
  }

  /**
   * Get TTL for specific tool type
   */
  getTTL(toolName) {
    const ttlMap = {
      'amazon-get-orders': this.options.ordersTTL,
      'amazon-get-products': this.options.productsTTL,
      'amazon-get-inventory': this.options.inventoryTTL,
      'amazon-get-reports': this.options.reportsTTL,
      'amazon-manage-listings': this.options.listingsTTL,
      'amazon-advertising-data': this.options.advertisingTTL
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
        marketplaceId: this.extractMarketplaceId(key),
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (ttl || this.options.defaultTTL) * 1000).toISOString()
      };

      const success = this.cache.set(key, cacheData, ttl || this.options.defaultTTL);
      
      if (success) {
        logger.debug('Amazon data cached successfully', {
          key: this.sanitizeKey(key),
          ttl: ttl || this.options.defaultTTL,
          size: JSON.stringify(data).length,
          marketplaceId: cacheData.marketplaceId
        });
      }

      return success;

    } catch (error) {
      this.stats.errors++;
      logger.error('Amazon cache set failed', {
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
        logger.debug('Amazon cache hit', {
          key: this.sanitizeKey(key),
          cachedAt: cacheData.cachedAt,
          marketplaceId: cacheData.marketplaceId
        });
        
        return {
          ...cacheData.data,
          _cacheMetadata: {
            cachedAt: cacheData.cachedAt,
            expiresAt: cacheData.expiresAt,
            marketplaceId: cacheData.marketplaceId,
            fromCache: true
          }
        };
      }

      return null;

    } catch (error) {
      this.stats.errors++;
      logger.error('Amazon cache get failed', {
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
      logger.error('Amazon cache has check failed', {
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
      
      logger.debug('Amazon cache delete', {
        key: this.sanitizeKey(key),
        success: result > 0
      });

      return result > 0;

    } catch (error) {
      this.stats.errors++;
      logger.error('Amazon cache delete failed', {
        error: error.message,
        key: this.sanitizeKey(key)
      });
      return false;
    }
  }

  /**
   * Clear all Amazon cache entries
   */
  async clear() {
    try {
      const keys = this.cache.keys();
      const amazonKeys = keys.filter(key => key.startsWith('amazon:'));
      
      if (amazonKeys.length > 0) {
        this.cache.del(amazonKeys);
        logger.info('Amazon cache cleared', {
          clearedKeys: amazonKeys.length
        });
      }

      return {
        success: true,
        clearedKeys: amazonKeys.length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Amazon cache clear failed', {
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear cache entries for specific marketplace
   */
  async clearMarketplace(marketplaceId) {
    try {
      const keys = this.cache.keys();
      const marketplaceKeys = keys.filter(key => 
        key.startsWith('amazon:') && key.includes(`:${marketplaceId}:`)
      );
      
      if (marketplaceKeys.length > 0) {
        this.cache.del(marketplaceKeys);
        logger.info('Amazon marketplace cache cleared', {
          marketplaceId,
          clearedKeys: marketplaceKeys.length
        });
      }

      return {
        success: true,
        marketplaceId,
        clearedKeys: marketplaceKeys.length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Amazon marketplace cache clear failed', {
        error: error.message,
        marketplaceId
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
  async clearTool(toolName, marketplaceId = null) {
    try {
      const keys = this.cache.keys();
      let toolKeys;
      
      if (marketplaceId) {
        toolKeys = keys.filter(key => key.startsWith(`amazon:${marketplaceId}:${toolName}:`));
      } else {
        toolKeys = keys.filter(key => key.includes(`:${toolName}:`));
      }
      
      if (toolKeys.length > 0) {
        this.cache.del(toolKeys);
        logger.info('Amazon tool cache cleared', {
          toolName,
          marketplaceId,
          clearedKeys: toolKeys.length
        });
      }

      return {
        success: true,
        toolName,
        marketplaceId,
        clearedKeys: toolKeys.length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Amazon tool cache clear failed', {
        error: error.message,
        toolName,
        marketplaceId
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
        marketplaceStats: this.stats.marketplaceStats,
        enabled: this.options.enabled,
        type: this.cacheType
      };

    } catch (error) {
      logger.error('Failed to get Amazon cache stats', {
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
   * Cache health check
   */
  async healthCheck() {
    try {
      const testKey = 'amazon:health:test';
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
      logger.error('Amazon cache health check failed', {
        error: error.message
      });
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Extract marketplace ID from cache key
   */
  extractMarketplaceId(key) {
    const parts = key.split(':');
    return parts.length > 1 ? parts[1] : 'unknown';
  }

  /**
   * Update marketplace-specific statistics
   */
  updateMarketplaceStats(marketplaceId, operation) {
    if (!this.stats.marketplaceStats[marketplaceId]) {
      this.stats.marketplaceStats[marketplaceId] = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0
      };
    }
    this.stats.marketplaceStats[marketplaceId][operation]++;
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
      marketplaceId: parts[1] || 'unknown',
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

  /**
   * Warm up cache with commonly accessed data
   */
  async warmUp(marketplaceId, toolsToWarm = []) {
    if (!this.options.enabled) {
      return { success: false, message: 'Cache disabled' };
    }

    try {
      logger.info('Starting Amazon cache warm-up', {
        marketplaceId,
        toolsCount: toolsToWarm.length
      });

      // This would typically pre-fetch commonly accessed data
      // Implementation depends on the specific tools and their requirements

      return {
        success: true,
        warmedTools: toolsToWarm.length,
        marketplaceId
      };

    } catch (error) {
      logger.error('Amazon cache warm-up failed', {
        error: error.message,
        marketplaceId
      });
      return {
        success: false,
        error: error.message
      };
    }
  }
}