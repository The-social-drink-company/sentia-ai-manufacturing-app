import { createClient } from 'redis';
import crypto from 'crypto';
import { logInfo, logError, logDebug } from '../observability/structuredLogger.js';
import { performance } from 'perf_hooks';

/**
 * Redis Caching Service with performance optimizations
 */
export class CacheService {
  constructor(options = {}) {
    this.redisUrl = options.redisUrl || process.env.REDIS_URL;
    this.defaultTTL = parseInt(process.env.API_CACHE_TTL_SECONDS) || 120;
    this.maxBytes = parseInt(process.env.API_CACHE_MAX_BYTES) || 10485760; // 10MB
    this.enabled = process.env.ENABLE_CACHE !== 'false';
    this.enableEtag = process.env.ENABLE_ETAG === 'true';
    
    this.client = null;
    this.connected = false;
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      bytesStored: 0,
      avgLatency: 0
    };
    
    // Single-flight map to prevent duplicate expensive operations
    this.singleFlight = new Map();
    this.singleFlightTTL = parseInt(process.env.WORKER_SINGLEFLIGHT_TTL_MS) || 300000; // 5 minutes
  }
  
  async connect() {
    if (!this.enabled || !this.redisUrl) {
      logInfo('Cache service disabled or Redis URL not configured');
      return;
    }
    
    try {
      this.client = createClient({ url: this.redisUrl });
      
      this.client.on(_'error', _(err) => {
        logError('Redis client error', err);
        this.connected = false;
        this.metrics.errors++;
      });
      
      this.client.on(_'connect', () => {
        logInfo('Redis client connected');
        this.connected = true;
      });
      
      await this.client.connect();
      
      // Test connection
      await this.client.ping();
      
      logInfo('Cache service initialized successfully');
    } catch (error) {
      logError('Failed to connect to Redis', error);
      this.connected = false;
    }
  }
  
  /**
   * Generate cache key with user/entity scoping
   */
  generateKey(namespace, params = {}, userId = null, entityId = null) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          obj[key] = params[key];
        }
        return obj;
      }, {});
    
    const parts = [
      namespace,
      userId || 'public',
      entityId || 'global',
      crypto.createHash('md5').update(JSON.stringify(sortedParams)).digest('hex')
    ];
    
    return parts.join(':');
  }
  
  /**
   * Get cached value with stale-while-revalidate support
   */
  async get(key, options = {}) {
    if (!this.connected || !this.enabled) {
      this.metrics.misses++;
      return null;
    }
    
    const start = performance.now();
    
    try {
      const cached = await this.client.get(key);
      const latency = performance.now() - start;
      this.updateAvgLatency(latency);
      
      if (cached) {
        this.metrics.hits++;
        const data = JSON.parse(cached);
        
        // Check if stale but within grace period
        if (options.staleWhileRevalidate && data.expires) {
          const now = Date.now();
          const staleTime = data.expires;
          const graceTime = staleTime + (options.graceSeconds || 60) * 1000;
          
          if (now > staleTime && now < graceTime) {
            // Return stale data but trigger background refresh
            this.refreshInBackground(key, options);
          }
        }
        
        logDebug('Cache hit', { key, latency });
        return data.value;
      }
      
      this.metrics.misses++;
      return null;
    } catch (error) {
      this.metrics.errors++;
      logError('Cache get error', error, { key });
      return null;
    }
  }
  
  /**
   * Set cached value with TTL and size limits
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.connected || !this.enabled) {
      return;
    }
    
    try {
      const data = {
        value,
        expires: Date.now() + ttl * 1000,
        cached: new Date().toISOString()
      };
      
      const serialized = JSON.stringify(data);
      const bytes = Buffer.byteLength(serialized);
      
      // Check size limit
      if (bytes > this.maxBytes) {
        logWarn('Cache value exceeds size limit', { key, bytes, maxBytes: this.maxBytes });
        return;
      }
      
      await this.client.setex(key, ttl, serialized);
      this.metrics.bytesStored += bytes;
      
      logDebug('Cache set', { key, ttl, bytes });
    } catch (error) {
      this.metrics.errors++;
      logError('Cache set error', error, { key });
    }
  }
  
  /**
   * Delete cached value(s)
   */
  async invalidate(pattern) {
    if (!this.connected || !this.enabled) {
      return;
    }
    
    try {
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        logInfo('Cache invalidated', { pattern, keysDeleted: keys.length });
      }
    } catch (error) {
      this.metrics.errors++;
      logError('Cache invalidate error', error, { pattern });
    }
  }
  
  /**
   * Single-flight pattern to prevent duplicate expensive operations
   */
  async singleFlight(key, fn) {
    // Check if operation is already in flight
    if (this.singleFlight.has(key)) {
      logDebug('Single-flight: waiting for existing operation', { key });
      return this.singleFlight.get(key);
    }
    
    // Create new promise for this operation
    const promise = fn().finally(() => {
      // Clean up after TTL
      setTimeout(() => {
        this.singleFlight.delete(key);
      }, this.singleFlightTTL);
    });
    
    this.singleFlight.set(key, promise);
    return promise;
  }
  
  /**
   * Cache middleware for Express routes
   */
  middleware(namespace, options = {}) {
    return async (req, res, _next) => {
      if (!this.enabled) {
        return next();
      }
      
      // Skip non-GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      // Generate cache key
      const key = this.generateKey(
        namespace,
        { ...req.query, ...req.params },
        req.user?.id,
        req.headers['x-entity-id']
      );
      
      // Check cache
      const cached = await this.get(key, options);
      
      if (cached) {
        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', key);
        
        // Handle ETag if enabled
        if (this.enableEtag) {
          const etag = this.generateEtag(cached);
          res.setHeader('ETag', etag);
          
          if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
          }
        }
        
        return res.json(cached);
      }
      
      // Cache miss - capture response
      res.setHeader('X-Cache', 'MISS');
      
      const originalJson = res.json;
      res.json = (data) => {
        res.json = originalJson;
        
        // Cache successful responses
        if (res.statusCode === 200) {
          const ttl = options.ttl || this.defaultTTL;
          this.set(key, data, ttl);
          
          // Add ETag if enabled
          if (this.enableEtag) {
            const etag = this.generateEtag(data);
            res.setHeader('ETag', etag);
          }
        }
        
        return res.json(data);
      };
      
      next();
    };
  }
  
  /**
   * Generate ETag for response data
   */
  generateEtag(data) {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    return `"${hash}"`;
  }
  
  /**
   * Refresh cache in background (for stale-while-revalidate)
   */
  async refreshInBackground(key, options) {
    // This would trigger the actual refresh logic
    logDebug('Background refresh triggered', { key });
    // Implementation would depend on your specific needs
  }
  
  /**
   * Update average latency metric
   */
  updateAvgLatency(latency) {
    const weight = 0.1; // Exponential moving average weight
    if (this.metrics.avgLatency === 0) {
      this.metrics.avgLatency = latency;
    } else {
      this.metrics.avgLatency = this.metrics.avgLatency * (1 - weight) + latency * weight;
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
      : 0;
    
    return {
      ...this.metrics,
      hitRate: hitRate.toFixed(2) + '%',
      avgLatencyMs: this.metrics.avgLatency.toFixed(2),
      connected: this.connected,
      enabled: this.enabled
    };
  }
  
  /**
   * Clear all cached data (use with caution)
   */
  async flush() {
    if (!this.connected || !this.enabled) {
      return;
    }
    
    try {
      await this.client.flushdb();
      logInfo('Cache flushed');
    } catch (error) {
      logError('Cache flush error', error);
    }
  }
  
  /**
   * Gracefully disconnect
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
      logInfo('Cache service disconnected');
    }
  }
}

/**
 * Pagination helper with caps
 */
export const paginationMiddleware = (options = {}) => {
  const maxPageSize = parseInt(process.env.API_MAX_PAGE_SIZE) || 500;
  const defaultPageSize = parseInt(process.env.API_DEFAULT_PAGE_SIZE) || 50;
  
  return (req, res, next) => {
    // Parse pagination params
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || defaultPageSize;
    
    // Apply caps
    page = Math.max(1, page);
    limit = Math.min(maxPageSize, Math.max(1, limit));
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Attach to request
    req.pagination = {
      page,
      limit,
      offset,
      maxPageSize,
      defaultPageSize
    };
    
    // Helper function to generate pagination metadata
    res.setPaginationHeaders = (totalCount) => {
      const totalPages = Math.ceil(totalCount / limit);
      
      res.setHeader('X-Page', page);
      res.setHeader('X-Page-Size', limit);
      res.setHeader('X-Total-Count', totalCount);
      res.setHeader('X-Total-Pages', totalPages);
      
      // Link headers for navigation
      const links = [];
      const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
      const queryParams = new URLSearchParams(req.query);
      
      // First page
      if (page > 1) {
        queryParams.set('page', 1);
        links.push(`<${baseUrl}?${queryParams}>; rel="first"`);
      }
      
      // Previous page
      if (page > 1) {
        queryParams.set('page', page - 1);
        links.push(`<${baseUrl}?${queryParams}>; rel="prev"`);
      }
      
      // Next page
      if (page < totalPages) {
        queryParams.set('page', page + 1);
        links.push(`<${baseUrl}?${queryParams}>; rel="next"`);
      }
      
      // Last page
      if (page < totalPages) {
        queryParams.set('page', totalPages);
        links.push(`<${baseUrl}?${queryParams}>; rel="last"`);
      }
      
      if (links.length > 0) {
        res.setHeader('Link', links.join(', '));
      }
    };
    
    next();
  };
};

/**
 * Sparse fieldsets middleware for payload optimization
 */
export const sparseFieldsMiddleware = () => {
  return (req, res, next) => {
    const fields = req.query.fields;
    
    if (fields) {
      // Parse comma-separated fields
      const fieldList = fields.split(',').map(f => f.trim());
      
      // Attach field selector to request
      req.sparseFields = fieldList;
      
      // Helper function to filter response data
      res.filterFields = (data) => {
        if (!req.sparseFields) return data;
        
        const filterObject = (obj) => {
          const filtered = {};
          req.sparseFields.forEach(field => {
            if (field.includes('.')) {
              // Handle nested fields
              const [parent, ...rest] = field.split('.');
              if (obj[parent]) {
                if (!filtered[parent]) filtered[parent] = {};
                const nestedField = rest.join('.');
                const nestedValue = getNestedValue(obj[parent], nestedField);
                if (nestedValue !== undefined) {
                  setNestedValue(filtered[parent], nestedField, nestedValue);
                }
              }
            } else if (obj[field] !== undefined) {
              filtered[field] = obj[field];
            }
          });
          return filtered;
        };
        
        if (Array.isArray(data)) {
          return data.map(filterObject);
        }
        return filterObject(data);
      };
    }
    
    next();
  };
};

// Helper functions for nested field access
function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce(_(curr, key) => {
    if (!curr[key]) curr[key] = {};
    return curr[key];
  }, obj);
  target[lastKey] = value;
}

// Create singleton instance
export const cacheService = new CacheService();

export default {
  CacheService,
  cacheService,
  paginationMiddleware,
  sparseFieldsMiddleware
};