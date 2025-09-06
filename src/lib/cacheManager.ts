// Enterprise caching strategy with multiple storage layers

import type { CacheEntry, CacheStats } from '../stores/types';

// Cache configuration
interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTTL: number; // Default time-to-live in milliseconds
  enableCompression: boolean;
  enableEncryption: boolean;
  storageQuota: number; // Storage quota for IndexedDB/localStorage
}

// Storage adapter interface
interface StorageAdapter {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, entry: CacheEntry): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

// Memory cache adapter
class MemoryCacheAdapter implements StorageAdapter {
  private cache: Map<string, CacheEntry> = new Map();

  async get(key: string): Promise<CacheEntry | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async size(): Promise<number> {
    return this.cache.size;
  }
}

// LocalStorage cache adapter
class LocalStorageCacheAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = 'sentia-cache-') {
    this.prefix = prefix;
  }

  async get(key: string): Promise<CacheEntry | null> {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      // Handle storage quota exceeded
      console.warn('localStorage quota exceeded, clearing old entries');
      await this.clearOldEntries();
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(entry));
      } catch {
        throw new Error('Failed to store in localStorage');
      }
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(this.prefix + key));
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }

  private async clearOldEntries(): Promise<void> {
    const keys = await this.keys();
    const entries = await Promise.all(
      keys.map(async key => ({
        key,
        entry: await this.get(key),
      }))
    );

    // Sort by timestamp and remove oldest 25%
    const validEntries = entries
      .filter(({ entry }) => entry !== null)
      .sort((a, b) => a.entry!.timestamp.getTime() - b.entry!.timestamp.getTime());

    const toRemove = validEntries.slice(0, Math.floor(validEntries.length * 0.25));
    await Promise.all(toRemove.map(({ key }) => this.delete(key)));
  }
}

// IndexedDB cache adapter
class IndexedDBCacheAdapter implements StorageAdapter {
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'sentia-cache', storeName: string = 'cache', version: number = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
      };
    });
  }

  async get(key: string): Promise<CacheEntry | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            // Parse timestamp back to Date object
            result.timestamp = new Date(result.timestamp);
          }
          resolve(result || null);
        };
      });
    } catch {
      return null;
    }
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ ...entry, key });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(): Promise<string[]> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async size(): Promise<number> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// Multi-tier cache manager
export class CacheManager {
  private memoryCache: StorageAdapter;
  private persistentCache: StorageAdapter;
  private config: CacheConfig;
  private stats: CacheStats;
  private compressionSupported: boolean;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 10000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      enableCompression: true,
      enableEncryption: false,
      storageQuota: 100 * 1024 * 1024, // 100MB
      ...config,
    };

    this.memoryCache = new MemoryCacheAdapter();
    this.persistentCache = this.initializePersistentStorage();
    
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      lastCleanup: new Date(),
    };

    // Check compression support
    this.compressionSupported = 'CompressionStream' in window && 'DecompressionStream' in window;
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  // Initialize persistent storage (IndexedDB with localStorage fallback)
  private initializePersistentStorage(): StorageAdapter {
    try {
      if ('indexedDB' in window) {
        return new IndexedDBCacheAdapter();
      }
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage');
    }
    
    return new LocalStorageCacheAdapter();
  }

  // Get data from cache
  async get<T = any>(key: string): Promise<T | null> {
    try {
      // Try memory cache first (L1)
      let entry = await this.memoryCache.get(key);
      
      if (entry) {
        // Check if expired
        if (this.isExpired(entry)) {
          await this.memoryCache.delete(key);
          entry = null;
        } else {
          this.updateStats('hit');
          return await this.deserializeData<T>(entry.data);
        }
      }

      // Try persistent cache (L2)
      entry = await this.persistentCache.get(key);
      
      if (entry) {
        if (this.isExpired(entry)) {
          await this.persistentCache.delete(key);
          this.updateStats('miss');
          return null;
        } else {
          // Promote to memory cache
          await this.memoryCache.set(key, entry);
          this.updateStats('hit');
          return await this.deserializeData<T>(entry.data);
        }
      }

      this.updateStats('miss');
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.updateStats('miss');
      return null;
    }
  }

  // Set data in cache
  async set<T = any>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
      priority?: 'high' | 'medium' | 'low';
      persistOnly?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const {
        ttl = this.config.defaultTTL,
        tags = [],
        priority = 'medium',
        persistOnly = false,
      } = options;

      const serializedData = await this.serializeData(data);
      const size = this.calculateSize(serializedData);

      const entry: CacheEntry = {
        key,
        data: serializedData,
        timestamp: new Date(),
        ttl,
        tags,
        size,
      };

      // Always store in persistent cache
      await this.persistentCache.set(key, entry);

      // Store in memory cache unless persistOnly is true
      if (!persistOnly && priority !== 'low') {
        // Check memory constraints
        if (await this.canFitInMemory(size)) {
          await this.memoryCache.set(key, entry);
        }
      }

      this.updateStats('set', size);
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  // Delete from cache
  async delete(key: string): Promise<void> {
    await Promise.all([
      this.memoryCache.delete(key),
      this.persistentCache.delete(key),
    ]);
  }

  // Clear cache
  async clear(): Promise<void> {
    await Promise.all([
      this.memoryCache.clear(),
      this.persistentCache.clear(),
    ]);

    this.stats = {
      ...this.stats,
      totalEntries: 0,
      totalSize: 0,
      evictionCount: 0,
    };
  }

  // Clear by tags
  async clearByTags(tags: string[]): Promise<void> {
    const [memoryKeys, persistentKeys] = await Promise.all([
      this.memoryCache.keys(),
      this.persistentCache.keys(),
    ]);

    const allKeys = [...new Set([...memoryKeys, ...persistentKeys])];
    
    const keysToDelete = await Promise.all(
      allKeys.map(async key => {
        const entry = await this.get(key);
        return entry && entry.tags?.some(tag => tags.includes(tag)) ? key : null;
      })
    );

    const validKeys = keysToDelete.filter(Boolean) as string[];
    await Promise.all(validKeys.map(key => this.delete(key)));
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Check if data can fit in memory cache
  private async canFitInMemory(dataSize: number): Promise<boolean> {
    const currentSize = await this.getMemoryCacheSize();
    
    if (currentSize + dataSize > this.config.maxSize) {
      // Try to evict some entries
      await this.evictFromMemory();
      const newSize = await this.getMemoryCacheSize();
      return newSize + dataSize <= this.config.maxSize;
    }
    
    return true;
  }

  // Get memory cache size
  private async getMemoryCacheSize(): Promise<number> {
    const keys = await this.memoryCache.keys();
    let totalSize = 0;
    
    for (const key of keys) {
      const entry = await this.memoryCache.get(key);
      if (entry) {
        totalSize += entry.size;
      }
    }
    
    return totalSize;
  }

  // Evict entries from memory cache (LRU strategy)
  private async evictFromMemory(): Promise<void> {
    const keys = await this.memoryCache.keys();
    const entries = await Promise.all(
      keys.map(async key => ({
        key,
        entry: await this.memoryCache.get(key),
      }))
    );

    // Sort by timestamp (oldest first) and remove 25%
    const validEntries = entries
      .filter(({ entry }) => entry !== null)
      .sort((a, b) => a.entry!.timestamp.getTime() - b.entry!.timestamp.getTime());

    const toEvict = validEntries.slice(0, Math.floor(validEntries.length * 0.25));
    
    await Promise.all(
      toEvict.map(({ key }) => this.memoryCache.delete(key))
    );

    this.stats.evictionCount += toEvict.length;
  }

  // Check if entry is expired
  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const entryTime = new Date(entry.timestamp).getTime();
    return now - entryTime > entry.ttl;
  }

  // Serialize data (with optional compression)
  private async serializeData(data: any): Promise<any> {
    let serialized = data;

    // Apply compression if enabled and supported
    if (this.config.enableCompression && this.compressionSupported) {
      try {
        const jsonString = JSON.stringify(data);
        if (jsonString.length > 1024) { // Only compress if > 1KB
          serialized = await this.compressData(jsonString);
        }
      } catch (error) {
        console.warn('Compression failed, storing uncompressed:', error);
      }
    }

    return serialized;
  }

  // Deserialize data (with optional decompression)
  private async deserializeData<T>(data: any): Promise<T> {
    if (this.isCompressed(data)) {
      try {
        const decompressed = await this.decompressData(data);
        return JSON.parse(decompressed);
      } catch (error) {
        console.error('Decompression failed:', error);
        throw error;
      }
    }

    return data;
  }

  // Compress data using CompressionStream
  private async compressData(data: string): Promise<{ compressed: true; data: Uint8Array }> {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(new TextEncoder().encode(data));
    writer.close();

    const chunks: Uint8Array[] = [];
    let result;
    
    while (!(result = await reader.read()).done) {
      chunks.push(result.value);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return { compressed: true, data: combined };
  }

  // Decompress data using DecompressionStream
  private async decompressData(compressedData: { compressed: true; data: Uint8Array }): Promise<string> {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(compressedData.data);
    writer.close();

    const chunks: Uint8Array[] = [];
    let result;
    
    while (!(result = await reader.read()).done) {
      chunks.push(result.value);
    }

    // Combine and decode
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder().decode(combined);
  }

  // Check if data is compressed
  private isCompressed(data: any): boolean {
    return typeof data === 'object' && data?.compressed === true && data?.data instanceof Uint8Array;
  }

  // Calculate data size
  private calculateSize(data: any): number {
    if (this.isCompressed(data)) {
      return data.data.length;
    }
    
    try {
      return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
    } catch {
      return 0;
    }
  }

  // Update cache statistics
  private updateStats(operation: 'hit' | 'miss' | 'set', size: number = 0): void {
    const total = this.stats.hitRate + this.stats.missRate;
    
    switch (operation) {
      case 'hit':
        this.stats.hitRate++;
        break;
      case 'miss':
        this.stats.missRate++;
        break;
      case 'set':
        this.stats.totalEntries++;
        this.stats.totalSize += size;
        break;
    }
  }

  // Start periodic cleanup
  private startPeriodicCleanup(): void {
    setInterval(async () => {
      await this.cleanup();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  // Cleanup expired entries
  async cleanup(): Promise<void> {
    const [memoryKeys, persistentKeys] = await Promise.all([
      this.memoryCache.keys(),
      this.persistentCache.keys(),
    ]);

    const allKeys = [...new Set([...memoryKeys, ...persistentKeys])];
    const expiredKeys: string[] = [];

    for (const key of allKeys) {
      const entry = await this.persistentCache.get(key);
      if (entry && this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    await Promise.all(expiredKeys.map(key => this.delete(key)));

    this.stats.lastCleanup = new Date();
    console.log(`Cache cleanup completed: removed ${expiredKeys.length} expired entries`);
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager({
  maxSize: 100 * 1024 * 1024, // 100MB memory cache
  maxEntries: 50000,
  defaultTTL: 60 * 60 * 1000, // 1 hour default TTL
  enableCompression: true,
});

// Service Worker registration for PWA support
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New service worker version available');
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  
  return null;
};

// Cache utilities
export const cacheUtils = {
  // Preload critical data
  preloadCriticalData: async (keys: Array<{ key: string; fetcher: () => Promise<any> }>) => {
    const promises = keys.map(async ({ key, fetcher }) => {
      const cached = await cacheManager.get(key);
      if (!cached) {
        try {
          const data = await fetcher();
          await cacheManager.set(key, data, { priority: 'high', ttl: 60 * 60 * 1000 });
        } catch (error) {
          console.error(`Failed to preload data for key ${key}:`, error);
        }
      }
    });

    await Promise.all(promises);
  },

  // Warm cache with background requests
  warmCache: async (keys: string[], fetchers: Record<string, () => Promise<any>>) => {
    // Use requestIdleCallback if available
    const scheduleWork = (work: () => Promise<void>) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => work());
      } else {
        setTimeout(() => work(), 0);
      }
    };

    keys.forEach(key => {
      const fetcher = fetchers[key];
      if (fetcher) {
        scheduleWork(async () => {
          try {
            const data = await fetcher();
            await cacheManager.set(key, data, { priority: 'low', ttl: 30 * 60 * 1000 });
          } catch (error) {
            console.warn(`Failed to warm cache for key ${key}:`, error);
          }
        });
      }
    });
  },

  // Get cache status
  getCacheStatus: async () => {
    const stats = cacheManager.getStats();
    const memorySupport = 'indexedDB' in window;
    const compressionSupport = 'CompressionStream' in window;
    const serviceWorkerSupport = 'serviceWorker' in navigator;

    return {
      stats,
      support: {
        indexedDB: memorySupport,
        compression: compressionSupport,
        serviceWorker: serviceWorkerSupport,
      },
      performance: {
        hitRate: stats.hitRate / (stats.hitRate + stats.missRate) || 0,
        efficiency: stats.totalSize > 0 ? stats.totalEntries / stats.totalSize : 0,
      },
    };
  },

  // Export cache data for debugging
  exportCache: async (): Promise<Record<string, any>> => {
    // This would export cache contents for debugging
    // Implementation would depend on specific debugging needs
    return {};
  },

  // Import cache data
  importCache: async (data: Record<string, any>): Promise<void> => {
    // This would import cache contents
    // Implementation would depend on specific import format
  },
};