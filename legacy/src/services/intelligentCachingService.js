import { devLog } from '../lib/devLog.js';

// Intelligent Caching Service - Enterprise Grade
class IntelligentCachingService {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
    this.config = {
      maxSize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      compressionThreshold: 1024 // 1KB
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };

    this.startCleanupTask();
  }

  set(key, value, ttl = this.config.defaultTTL, tags = []) {
    try {
      // Compress large values
      const serialized = JSON.stringify(value);
      const compressed = serialized.length > this.config.compressionThreshold ? 
        this.compress(serialized) : serialized;

      const entry = {
        value: compressed,
        compressed: serialized.length > this.config.compressionThreshold,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        tags
      };

      // Evict if cache is full
      if (this.cache.size >= this.config.maxSize) {
        this.evictLRU();
      }

      this.cache.set(key, entry);
      this.metadata.set(key, {
        size: serialized.length,
        created: Date.now(),
        lastAccessed: Date.now()
      });

      this.stats.sets++;
      return true;
    } catch (error) {
      devLog.error('Cache set error:', error);
      return false;
    }
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    const metadata = this.metadata.get(key);
    if (metadata) {
      metadata.lastAccessed = Date.now();
    }

    this.stats.hits++;

    // Decompress if needed
    try {
      const value = entry.compressed ? 
        this.decompress(entry.value) : entry.value;
      return JSON.parse(value);
    } catch (error) {
      devLog.error('Cache get error:', error);
      this.delete(key);
      return null;
    }
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    this.metadata.delete(key);
    return deleted;
  }

  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, metadata] of this.metadata.entries()) {
      if (metadata.lastAccessed < oldestTime) {
        oldestTime = metadata.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  evictByTag(tag) {
    let evicted = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        this.delete(key);
        evicted++;
      }
    }
    return evicted;
  }

  compress(data) {
    // Simple compression - in production use proper compression library
    return data; // Placeholder for compression
  }

  decompress(data) {
    // Simple decompression - in production use proper decompression library
    return data; // Placeholder for decompression
  }

  startCleanupTask() {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      devLog.log(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 ? 
      (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      memoryUsage: this.getMemoryUsage()
    };
  }

  getMemoryUsage() {
    let totalSize = 0;
    for (const [key, metadata] of this.metadata.entries()) {
      totalSize += metadata.size;
    }
    return totalSize;
  }

  clear() {
    this.cache.clear();
    this.metadata.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  }
}

// Create singleton instance
const intelligentCache = new IntelligentCachingService();
export default intelligentCache;

