/**
 * Xero Data Cache Manager
 * 
 * Enhanced intelligent caching system for Xero API responses using the unified
 * multi-level cache infrastructure for improved performance and efficiency.
 * 
 * @version 2.0.0 - Integrated with unified cache system
 */

import crypto from 'crypto';
import { createLogger } from '../../../utils/logger.js';
import { cacheManager } from '../../../utils/cache.js';
import { performanceOptimizer } from '../../../utils/performance.js';

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
      
      // Enable/disable caching
      enabled: options.enabled !== false,
      
      // Cache strategy configuration
      useUnifiedCache: options.useUnifiedCache !== false,
      strategy: options.strategy || 'financial',
      
      ...options
    };

    // Use unified cache system
    this.cache = cacheManager;
    this.performance = performanceOptimizer;
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      apiCallsSaved: 0,
      totalResponseTime: 0
    };

    this.initialized = true;

    logger.info('Enhanced Xero cache initialized with unified system', {
      enabled: this.options.enabled,
      strategy: this.options.strategy,
      useUnifiedCache: this.options.useUnifiedCache,
      defaultTTL: this.options.defaultTTL
    });
  }

  /**
   * Initialize cache with unified system integration
   */
  async initializeUnifiedCache() {
    if (!this.options.useUnifiedCache) {
      logger.info('Unified cache integration disabled for Xero cache');
      return;
    }

    try {
      // Wait for unified cache system to be ready
      if (!this.cache.initialized) {
        await new Promise(resolve => {
          this.cache.on('cache:initialized', resolve);
        });
      }

      logger.info('Xero cache integrated with unified cache system');
    } catch (error) {
      logger.error('Failed to integrate with unified cache system', { error });
      throw error;
    }
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
   * Set data in cache using unified system
   */
  async set(key, data, ttl = null) {
    if (!this.options.enabled) {
      return false;
    }

    const startTime = Date.now();

    try {
      // Enhance data with metadata
      const enhancedData = {
        data,
        cachedAt: new Date().toISOString(),
        source: 'xero',
        version: '2.0.0',
        size: JSON.stringify(data).length
      };

      // Use unified cache system with financial strategy
      const success = await this.cache.set(key, enhancedData, this.options.strategy, ttl);
      
      if (success) {
        this.stats.sets++;
        const duration = Date.now() - startTime;
        this.stats.totalResponseTime += duration;

        logger.debug('Xero data cached successfully via unified system', {
          key: this.sanitizeKey(key),
          ttl: ttl || this.getTTL('default'),
          size: enhancedData.size,
          duration,
          strategy: this.options.strategy
        });
      }

      return success;

    } catch (error) {
      this.stats.errors++;
      logger.error('Xero cache set failed', {
        error: error.message,
        key: this.sanitizeKey(key)
      });
      return false;
    }
  }

  /**
   * Get data from cache using unified system
   */
  async get(key) {
    if (!this.options.enabled) {
      return null;
    }

    const startTime = Date.now();

    try {
      // Get from unified cache system with financial strategy
      const cacheData = await this.cache.get(key, this.options.strategy);
      
      if (cacheData && cacheData.data) {
        this.stats.hits++;
        this.stats.apiCallsSaved++;
        const duration = Date.now() - startTime;
        this.stats.totalResponseTime += duration;

        logger.debug('Xero cache hit via unified system', {
          key: this.sanitizeKey(key),
          cachedAt: cacheData.cachedAt,
          strategy: this.options.strategy,
          duration,
          cacheLevel: cacheData._cacheMetadata?.level
        });
        
        return {
          ...cacheData.data,
          _cacheMetadata: {
            ...cacheData._cacheMetadata,
            cachedAt: cacheData.cachedAt,
            source: cacheData.source,
            fromCache: true,
            xeroCache: true
          }
        };
      }

      this.stats.misses++;
      logger.debug('Xero cache miss', {
        key: this.sanitizeKey(key),
        strategy: this.options.strategy
      });

      return null;

    } catch (error) {
      this.stats.errors++;
      logger.error('Xero cache get failed', {
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
   * Delete specific key from cache using unified system
   */
  async delete(key) {
    if (!this.options.enabled) {
      return false;
    }

    try {
      const result = await this.cache.delete(key);
      
      if (result) {
        this.stats.deletes++;
      }

      logger.debug('Xero cache delete via unified system', {
        key: this.sanitizeKey(key),
        success: result
      });

      return result;

    } catch (error) {
      this.stats.errors++;
      logger.error('Xero cache delete failed', {
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
   * Get enhanced cache statistics from unified system
   */
  async getStats() {
    try {
      // Get unified cache stats
      const unifiedStats = this.cache.getStats();
      
      // Calculate Xero-specific metrics
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
      const averageResponseTime = this.stats.sets > 0 ? this.stats.totalResponseTime / this.stats.sets : 0;
      
      return {
        // Xero-specific stats
        xero: {
          ...this.stats,
          hitRate: hitRate.toFixed(2) + '%',
          averageResponseTime: averageResponseTime.toFixed(2) + 'ms',
          apiCallsSaved: this.stats.apiCallsSaved,
          estimatedCostSavings: (this.stats.apiCallsSaved * 0.001).toFixed(3) + ' USD'
        },
        
        // Unified cache system stats
        unified: {
          overall: unifiedStats,
          strategy: this.options.strategy,
          useUnifiedCache: this.options.useUnifiedCache
        },
        
        // Configuration
        config: {
          enabled: this.options.enabled,
          strategy: this.options.strategy,
          defaultTTL: this.options.defaultTTL,
          financialReportsTTL: this.options.financialReportsTTL,
          invoicesTTL: this.options.invoicesTTL,
          contactsTTL: this.options.contactsTTL,
          bankTransactionsTTL: this.options.bankTransactionsTTL
        }
      };

    } catch (error) {
      logger.error('Failed to get Xero cache stats', {
        error: error.message
      });
      return {
        error: error.message,
        xero: this.stats
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
   * Warm up cache with commonly accessed data using unified system
   */
  async warmUp(tenantId, toolsToWarm = []) {
    if (!this.options.enabled) {
      return { success: false, message: 'Cache disabled' };
    }

    try {
      logger.info('Starting Xero cache warm-up via unified system', {
        tenantId,
        toolsCount: toolsToWarm.length,
        strategy: this.options.strategy
      });

      // Prepare warming keys for commonly accessed Xero data
      const warmingKeys = toolsToWarm.map(tool => ({
        key: this.generateKey(tool.name, { tenantId, ...tool.params }),
        loader: tool.dataLoader,
        strategy: this.options.strategy,
        priority: tool.priority || 1
      }));

      // Use unified cache warming system
      const result = await this.cache.warmCache(warmingKeys, this.options.strategy);

      return {
        success: result,
        warmedTools: toolsToWarm.length,
        tenantId,
        strategy: this.options.strategy
      };

    } catch (error) {
      logger.error('Xero cache warm-up failed', {
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
   * Invalidate Xero cache based on tenant or data type
   */
  async invalidateByRule(rule, context = {}) {
    if (!this.options.enabled) {
      return 0;
    }

    try {
      // Use unified cache invalidation system
      const invalidatedCount = await this.cache.invalidate(rule, {
        ...context,
        source: 'xero',
        strategy: this.options.strategy
      });

      logger.info('Xero cache invalidation completed', {
        rule,
        invalidatedCount,
        context
      });

      return invalidatedCount;

    } catch (error) {
      logger.error('Xero cache invalidation failed', {
        rule,
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Get cache performance metrics for optimization
   */
  async getPerformanceMetrics() {
    try {
      const stats = await this.getStats();
      
      return {
        efficiency: {
          hitRate: parseFloat(stats.xero.hitRate),
          apiCallsSaved: stats.xero.apiCallsSaved,
          averageResponseTime: parseFloat(stats.xero.averageResponseTime)
        },
        cost: {
          estimatedSavings: stats.xero.estimatedCostSavings,
          currency: 'USD'
        },
        recommendations: this.generateCacheRecommendations(stats),
        strategy: this.options.strategy,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to get Xero cache performance metrics', {
        error: error.message
      });
      return {
        error: error.message
      };
    }
  }

  /**
   * Generate cache optimization recommendations
   */
  generateCacheRecommendations(stats) {
    const recommendations = [];
    const hitRate = parseFloat(stats.xero.hitRate);
    const avgResponseTime = parseFloat(stats.xero.averageResponseTime);

    if (hitRate < 80) {
      recommendations.push({
        type: 'hit_rate',
        priority: 'high',
        message: 'Consider implementing cache warming for frequently accessed Xero data',
        currentValue: hitRate + '%',
        targetValue: '>85%'
      });
    }

    if (avgResponseTime > 50) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Cache response time could be improved with L1 cache optimization',
        currentValue: avgResponseTime + 'ms',
        targetValue: '<30ms'
      });
    }

    if (stats.xero.apiCallsSaved < 100) {
      recommendations.push({
        type: 'usage',
        priority: 'low',
        message: 'Consider extending cache TTL for stable financial data',
        currentValue: stats.xero.apiCallsSaved + ' calls saved',
        targetValue: '>200 calls saved'
      });
    }

    return recommendations;
  }

  /**
   * Enhanced cache key generation with strategy support
   */
  generateKeyWithStrategy(toolName, params = {}, strategy = null) {
    const cacheStrategy = strategy || this.options.strategy;
    const baseKey = this.generateKey(toolName, params);
    
    return `${cacheStrategy}:${baseKey}`;
  }

  /**
   * Optimize cache for Xero-specific patterns
   */
  async optimizeForXero() {
    try {
      const stats = await this.getStats();
      const recommendations = this.generateCacheRecommendations(stats);
      
      // Apply optimizations based on recommendations
      let optimizationsApplied = 0;
      
      for (const rec of recommendations) {
        switch (rec.type) {
          case 'hit_rate':
            // Implement cache warming for financial reports
            await this.warmCommonFinancialData();
            optimizationsApplied++;
            break;
            
          case 'performance':
            // Optimize cache strategy
            this.options.strategy = 'financial'; // Ensure using financial strategy
            optimizationsApplied++;
            break;
        }
      }

      logger.info('Xero cache optimization completed', {
        recommendations: recommendations.length,
        optimizationsApplied,
        strategy: this.options.strategy
      });

      return {
        success: true,
        recommendations,
        optimizationsApplied,
        strategy: this.options.strategy
      };

    } catch (error) {
      logger.error('Xero cache optimization failed', {
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Warm common financial data for improved performance
   */
  async warmCommonFinancialData() {
    const commonDataTypes = [
      { name: 'xero-get-financial-reports', priority: 1 },
      { name: 'xero-get-invoices', priority: 2 },
      { name: 'xero-get-contacts', priority: 3 }
    ];

    return await this.warmUp('default', commonDataTypes);
  }
}

// Export singleton instance
export const xeroCache = new XeroCache();

// Export utility functions for backward compatibility
export const {
  generateKey,
  getTTL,
  set: setXeroCache,
  get: getXeroCache,
  delete: deleteXeroCache,
  getStats: getXeroCacheStats
} = xeroCache;