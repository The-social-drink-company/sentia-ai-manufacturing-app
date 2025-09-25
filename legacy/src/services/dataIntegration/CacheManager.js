// Intelligent Cache Management System for API responses
// Features: LRU eviction, TTL expiration, memory monitoring, cache statistics

export class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize 0;
    this.defaultTTL = options.defaultTTL 0; // 5 minutes
    this.cache = new Map();
    this.accessOrder = new Map(); // For LRU tracking
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0
    };
    
    // Start cleanup timer
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }
  
  // Get value from cache
  async get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update access order for LRU
    this.accessOrder.set(key, Date.now());
    this.stats.hits++;
    
    return entry.data;
  }
  
  // Set value in cache
  async set(key, data, ttl = this.defaultTTL) {
    // Ensure we don't exceed max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    const entry = {
      data: this.deepClone(data),
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      size: this.calculateSize(data),
      accessCount: 0
    };
    
    this.cache.set(key, entry);
    this.accessOrder.set(key, Date.now());
    this.stats.sets++;
    this.updateMemoryUsage();
    
    return true;
  }
  
  // Delete from cache
  delete(key) {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    
    if (deleted) {
      this.stats.deletes++;
      this.updateMemoryUsage();
    }
    
    return deleted;
  }
  
  // Check if key exists and is not expired
  has(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  // Clear all entries
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder.clear();
    this.updateMemoryUsage();
    return size;
  }
  
  // Get cache statistics
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      ...this.stats,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) : 0,
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationRate: (this.cache.size / this.maxSize * 100).toFixed(2),
      averageEntrySize: this.cache.size > 0 ? 
        Math.round(this.stats.memoryUsage / this.cache.size) : 0
    };
  }
  
  // Get all cache keys
  keys() {
    return Array.from(this.cache.keys());
  }
  
  // Get cache entries with metadata
  entries() {
    const result = [];
    
    for (const [key, entry] of this.cache.entries()) {
      result.push({
        key,
        size: entry.size,
        createdAt: entry.createdAt,
        expiresAt: entry.expiresAt,
        isExpired: Date.now() > entry.expiresAt,
        ttl: entry.expiresAt - Date.now(),
        accessCount: entry.accessCount
      });
    }
    
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }
  
  // Evict least recently used item
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
  
  // Calculate approximate memory usage
  updateMemoryUsage() {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    
    this.stats.memoryUsage = totalSize;
  }
  
  // Calculate size of an object (approximate)
  calculateSize(obj) {
    if (obj === null || obj === undefined) {
      return 0;
    }
    
    if (typeof obj === 'string') {
      return obj.length * 2; // Unicode characters
    }
    
    if (typeof obj === 'number') {
      return 8; // 64-bit number
    }
    
    if (typeof obj === 'boolean') {
      return 4;
    }
    
    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + this.calculateSize(item), 0) + 24; // Array overhead
    }
    
    if (typeof obj === 'object') {
      let size = 24; // Object overhead
      
      for (const [key, value] of Object.entries(obj)) {
        size += this.calculateSize(key) + this.calculateSize(value);
      }
      
      return size;
    }
    
    return 0;
  }
  
  // Deep clone for cache isolation
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }
    
    if (typeof obj === 'object') {
      const cloned = {};
      for (const [key, value] of Object.entries(obj)) {
        cloned[key] = this.deepClone(value);
      }
      return cloned;
    }
    
    return obj;
  }
  
  // Cache warming - preload frequently used data
  async warm(keyDataPairs) {
    const results = [];
    
    for (const { key, data, ttl } of keyDataPairs) {
      try {
        await this.set(key, data, ttl);
        results.push({ key, success: true });
      } catch (error) {
        results.push({ key, success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  // Export cache data for persistence
  export() {
    const data = {};
    
    for (const [key, entry] of this.cache.entries()) {
      // Only export non-expired entries
      if (Date.now() < entry.expiresAt) {
        data[key] = {
          data: entry.data,
          expiresAt: entry.expiresAt,
          createdAt: entry.createdAt
        };
      }
    }
    
    return data;
  }
  
  // Import cache data from persistence
  async import(data) {
    let imported = 0;
    
    for (const [key, entry] of Object.entries(data)) {
      // Only import non-expired entries
      if (Date.now() < entry.expiresAt) {
        const ttl = entry.expiresAt - Date.now();
        await this.set(key, entry.data, ttl);
        imported++;
      }
    }
    
    return imported;
  }
  
  // Cleanup and destroy
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.clear();
  }
}

export default CacheManager;
