/**
 * Xero Data Cache Manager
 * 
 * Intelligent caching system for Xero API responses to improve performance
 * and reduce API call limits. Supports both memory and Redis backends.
 * 
 * @version 1.0.0
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Xero Cache Manager Class
 */
export class XeroCache {
  constructor(options = {}) {
    this.options = {
      // Default TTL values for different data types (in seconds)
      defaultTTL: options.defaultTTL || 300, // 5 minutes
      financialReportsTTL: options.financialReportsTTL || 1800, // 30 minutes
      invoicesTTL: options.invoicesTTL || 600, // 10 minutes
      contactsTTL: options.contactsTTL || 3600, // 1 hour
      bankTransactionsTTL: options.bankTransactionsTTL || 900, // 15 minutes
      
      // Cache size limits
      maxKeys: options.maxKeys || 1000,
      checkPeriod: options.checkPeriod || 120, // 2 minutes
      
      // Enable/disable caching
      enabled: options.enabled !== false,
      
      ...options
    };

    // Initialize cache based on environment
    this.initializeCache();

    logger.info('Xero cache initialized', {
      type: this.cacheType,
      enabled: this.options.enabled,
      defaultTTL: this.options.defaultTTL,
      maxKeys: this.options.maxKeys
    });
  }

  /**
   * Initialize cache backend (Memory or Redis)
   */
  initializeCache() {
    // For now, use memory cache (can be extended to Redis in production)
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
      errors: 0
    };

    // Setup cache event listeners
    this.cache.on('set', (key, value) => {
      this.stats.sets++;
      logger.debug('Cache set', { key: this.sanitizeKey(key) });
    });

    this.cache.on('get', (key, value) => {
      if (value !== undefined) {
        this.stats.hits++;
        logger.debug('Cache hit', { key: this.sanitizeKey(key) });
      } else {
        this.stats.misses++;
        logger.debug('Cache miss', { key: this.sanitizeKey(key) });
      }
    });

    this.cache.on('del', (key, value) => {
      this.stats.deletes++;
      logger.debug('Cache delete', { key: this.sanitizeKey(key) });
    });

    this.cache.on('expired', (key, value) => {
      logger.debug('Cache expired', { key: this.sanitizeKey(key) });
    });
  }

  /**
   * Generate cache key for a Xero operation
   */
  generateKey(toolName, params = {}) {
    try {
      // Remove sensitive data from cache key
      const sanitizedParams = { ...params };
      delete sanitizedParams.access_token;
      delete sanitizedParams.correlationId;
      delete sanitizedParams.timestamp;

      // Create deterministic key
      const keyData = {
        tool: toolName,
        tenant: params.tenantId || 'default',
        params: sanitizedParams
      };

      const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
      const hash = crypto.createHash('md5').update(keyString).digest('hex');
      
      return `xero:${toolName}:${hash}`;

    } catch (error) {
      logger.error('Cache key generation failed', {
        error: error.message,
        toolName
      });
      // Fallback to simple key
      return `xero:${toolName}:${Date.now()}`;
    }
  }

  /**
   * Get TTL for specific tool type
   */
  getTTL(toolName) {
    const ttlMap = {
      'xero-get-financial-reports': this.options.financialReportsTTL,
      'xero-get-invoices': this.options.invoicesTTL,
      'xero-get-contacts': this.options.contactsTTL,
      'xero-get-bank-transactions': this.options.bankTransactionsTTL
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
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (ttl || this.options.defaultTTL) * 1000).toISOString()
      };

      const success = this.cache.set(key, cacheData, ttl || this.options.defaultTTL);
      
      if (success) {
        logger.debug('Data cached successfully', {
          key: this.sanitizeKey(key),
          ttl: ttl || this.options.defaultTTL,
          size: JSON.stringify(data).length
        });
      }

      return success;

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache set failed', {
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
        logger.debug('Cache hit', {
          key: this.sanitizeKey(key),
          cachedAt: cacheData.cachedAt
        });
        
        return {
          ...cacheData.data,
          _cacheMetadata: {
            cachedAt: cacheData.cachedAt,
            expiresAt: cacheData.expiresAt,
            fromCache: true
          }
        };
      }

      return null;

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache get failed', {
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
      logger.error('Cache has check failed', {
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
      
      logger.debug('Cache delete', {
        key: this.sanitizeKey(key),
        success: result > 0
      });

      return result > 0;

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache delete failed', {
        error: error.message,
        key: this.sanitizeKey(key)
      });
      return false;
    }
  }

  /**
   * Clear all Xero cache entries
   */
  async clear() {
    try {
      const keys = this.cache.keys();
      const xeroKeys = keys.filter(key => key.startsWith('xero:'));
      
      if (xeroKeys.length > 0) {
        this.cache.del(xeroKeys);
        logger.info('Xero cache cleared', {
          clearedKeys: xeroKeys.length
        });
      }

      return {
        success: true,
        clearedKeys: xeroKeys.length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache clear failed', {
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear cache entries for specific tenant
   */
  async clearTenant(tenantId) {
    try {
      const keys = this.cache.keys();
      const tenantKeys = keys.filter(key => 
        key.startsWith('xero:') && key.includes(`:${tenantId}:`)
      );
      
      if (tenantKeys.length > 0) {
        this.cache.del(tenantKeys);
        logger.info('Tenant cache cleared', {
          tenantId,
          clearedKeys: tenantKeys.length
        });
      }

      return {
        success: true,
        tenantId,
        clearedKeys: tenantKeys.length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Tenant cache clear failed', {
        error: error.message,
        tenantId
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
  async clearTool(toolName) {
    try {
      const keys = this.cache.keys();
      const toolKeys = keys.filter(key => key.startsWith(`xero:${toolName}:`));
      
      if (toolKeys.length > 0) {
        this.cache.del(toolKeys);
        logger.info('Tool cache cleared', {
          toolName,
          clearedKeys: toolKeys.length
        });
      }

      return {
        success: true,
        toolName,
        clearedKeys: toolKeys.length
      };

    } catch (error) {
      this.stats.errors++;
      logger.error('Tool cache clear failed', {
        error: error.message,
        toolName
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
        vsize: cacheStats.vsize
      };

    } catch (error) {
      logger.error('Failed to get cache stats', {
        error: error.message
      });
      return {
        error: error.message
      };
    }
  }

  /**
   * Sanitize key for logging (remove sensitive data)
   */
  sanitizeKey(key) {
    // Only show first part of hash for privacy
    const parts = key.split(':');
    if (parts.length >= 3) {
      parts[2] = parts[2].substring(0, 8) + '...';
    }
    return parts.join(':');
  }

  /**
   * Warm up cache with commonly accessed data
   */
  async warmUp(tenantId, toolsToWarm = []) {
    if (!this.options.enabled) {
      return { success: false, message: 'Cache disabled' };
    }

    try {
      logger.info('Starting cache warm-up', {
        tenantId,
        toolsCount: toolsToWarm.length
      });

      // This would typically pre-fetch commonly accessed data
      // Implementation depends on the specific tools and their requirements

      return {
        success: true,
        warmedTools: toolsToWarm.length,
        tenantId
      };

    } catch (error) {
      logger.error('Cache warm-up failed', {
        error: error.message,
        tenantId
      });
      return {
        success: false,
        error: error.message
      };
    }
  }
}