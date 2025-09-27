import crypto from 'crypto';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


class CacheService {
  constructor(options = {}) {
    this.config = {
      maxSize: options.maxSize || 100,
      ttl: options.ttl || 3600000, // 1 hour default TTL
      checkInterval: options.checkInterval || 60000 // Clean every minute
    };
    
    this.cache = new Map();
    this.accessTimes = new Map();
    this.sizes = new Map();
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), this.config.checkInterval);
  }

  // Generate cache key from request parameters
  generateKey(params) {
    const normalized = this.normalizeParams(params);
    const content = JSON.stringify(normalized);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  normalizeParams(params) {
    // Sort keys for consistent hashing
    const sorted = {};
    Object.keys(params).sort().forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        sorted[key] = params[key];
      }
    });
    return sorted;
  }

  // Get cached result
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const entry = this.cache.get(key);
    const now = Date.now();

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < now) {
      this.delete(key);
      return null;
    }

    // Update access time for LRU
    this.accessTimes.set(key, now);
    
    // Return clone to prevent mutations
    return JSON.parse(JSON.stringify(entry.data));
  }

  // Set cache entry
  set(key, data, ttl = null) {
    const now = Date.now();
    const expiresAt = ttl ? now + ttl : now + this.config.ttl;
    
    // Calculate size (rough estimate)
    const size = JSON.stringify(data).length;
    
    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry = {
      data: JSON.parse(JSON.stringify(data)), // Store clone
      createdAt: now,
      expiresAt,
      hits: 0
    };

    this.cache.set(key, entry);
    this.accessTimes.set(key, now);
    this.sizes.set(key, size);
    
    return true;
  }

  // Delete cache entry
  delete(key) {
    const deleted = this.cache.delete(key);
    this.accessTimes.delete(key);
    this.sizes.delete(key);
    return deleted;
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.sizes.clear();
  }

  // Check if key exists and is valid
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry.expiresAt && entry.expiresAt < now) {
      this.delete(key);
      return false;
    }

    return true;
  }

  // Evict least recently used entry
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  // Get cache statistics
  getStats() {
    const stats = {
      entries: this.cache.size,
      maxSize: this.config.maxSize,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null,
      hitRate: 0
    };

    let totalHits = 0;
    let totalRequests = 0;
    let oldestTime = Infinity;
    let newestTime = 0;

    for (const [key, entry] of this.cache.entries()) {
      const size = this.sizes.get(key) || 0;
      stats.totalSize += size;
      
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        stats.oldestEntry = new Date(entry.createdAt);
      }
      
      if (entry.createdAt > newestTime) {
        newestTime = entry.createdAt;
        stats.newestEntry = new Date(entry.createdAt);
      }

      totalHits += entry.hits || 0;
      totalRequests += (entry.hits || 0) + 1;
    }

    if (totalRequests > 0) {
      stats.hitRate = totalHits / totalRequests;
    }

    return stats;
  }

  // Batch get multiple keys
  getBatch(keys) {
    const results = {};
    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        results[key] = value;
      }
    }
    return results;
  }

  // Batch set multiple entries
  setBatch(entries, ttl = null) {
    const results = {};
    for (const [key, data] of Object.entries(entries)) {
      results[key] = this.set(key, data, ttl);
    }
    return results;
  }

  // Warm cache with precomputed results
  async warmCache(warmupFunction, keys) {
    const promises = keys.map(async key => {
      if (!this.has(key)) {
        try {
          const data = await warmupFunction(key);
          if (data) {
            this.set(key, data);
          }
        } catch (error) {
          logError(`Failed to warm cache for key ${key}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  // Invalidate cache entries matching pattern
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  // Destroy cache service
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

export default CacheService;