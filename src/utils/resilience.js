/**
 * Resilience and fallback mechanisms for robust operation
 */

import { devLog } from '../lib/devLog.js';

// Circuit breaker implementation
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
  
  async execute(fn, fallback) {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        devLog.warn('Circuit breaker is OPEN, using fallback');
        return fallback ? fallback() : Promise.reject(new Error('Circuit breaker is OPEN'));
      }
    }
    
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
        )
      ]);
      
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      if (fallback) {
        devLog.warn('Operation failed, using fallback:', error.message);
        return fallback();
      }
      
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
        devLog.info('Circuit breaker recovered to CLOSED state');
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      devLog.error('Circuit breaker tripped to OPEN state');
    }
  }
  
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
}

// Retry mechanism with exponential backoff
export class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
  }
  
  async execute(fn, onRetry) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries) {
          const delay = Math.min(
            this.initialDelay * Math.pow(this.backoffMultiplier, attempt),
            this.maxDelay
          );
          
          if (onRetry) {
            onRetry(attempt + 1, delay, error);
          }
          
          devLog.warn(`Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

// Local storage with fallback to memory
export class ResilientStorage {
  constructor(prefix = 'app') {
    this.prefix = prefix;
    this.memoryStorage = new Map();
    this.isLocalStorageAvailable = this.checkLocalStorage();
  }
  
  checkLocalStorage() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      devLog.warn('LocalStorage not available, using memory storage');
      return false;
    }
  }
  
  get(key) {
    const fullKey = `${this.prefix}_${key}`;
    
    try {
      if (this.isLocalStorageAvailable) {
        const item = localStorage.getItem(fullKey);
        if (item) {
          const parsed = JSON.parse(item);
          
          // Check expiration
          if (parsed.expires && Date.now() > parsed.expires) {
            this.remove(key);
            return null;
          }
          
          return parsed.value;
        }
      }
    } catch (error) {
      devLog.error('Error reading from localStorage:', error);
    }
    
    // Fallback to memory storage
    const memItem = this.memoryStorage.get(fullKey);
    if (memItem) {
      if (memItem.expires && Date.now() > memItem.expires) {
        this.memoryStorage.delete(fullKey);
        return null;
      }
      return memItem.value;
    }
    
    return null;
  }
  
  set(key, value, ttl = null) {
    const fullKey = `${this.prefix}_${key}`;
    const item = {
      value,
      expires: ttl ? Date.now() + ttl : null
    };
    
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.setItem(fullKey, JSON.stringify(item));
      }
    } catch (error) {
      devLog.error('Error writing to localStorage:', error);
    }
    
    // Always store in memory as backup
    this.memoryStorage.set(fullKey, item);
  }
  
  remove(key) {
    const fullKey = `${this.prefix}_${key}`;
    
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.removeItem(fullKey);
      }
    } catch (error) {
      devLog.error('Error removing from localStorage:', error);
    }
    
    this.memoryStorage.delete(fullKey);
  }
  
  clear() {
    try {
      if (this.isLocalStorageAvailable) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      devLog.error('Error clearing localStorage:', error);
    }
    
    this.memoryStorage.clear();
  }
}

// Network status monitor
export class NetworkMonitor {
  constructor(onStatusChange) {
    this.online = navigator.onLine;
    this.onStatusChange = onStatusChange;
    this.slowConnectionThreshold = 500; // kb/s
    
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Monitor connection quality
    if ('connection' in navigator) {
      this.connection = navigator.connection;
      this.connection.addEventListener('change', () => this.checkConnectionQuality());
    }
  }
  
  handleOnline() {
    this.online = true;
    if (this.onStatusChange) {
      this.onStatusChange({ online: true, quality: this.getConnectionQuality() });
    }
  }
  
  handleOffline() {
    this.online = false;
    if (this.onStatusChange) {
      this.onStatusChange({ online: false, quality: 'offline' });
    }
  }
  
  getConnectionQuality() {
    if (!this.online) return 'offline';
    if (!this.connection) return 'unknown';
    
    const { downlink, effectiveType } = this.connection;
    
    if (effectiveType === '4g' && downlink > 5) return 'excellent';
    if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1)) return 'good';
    if (effectiveType === '3g' || downlink > this.slowConnectionThreshold / 1000) return 'fair';
    return 'poor';
  }
  
  checkConnectionQuality() {
    const quality = this.getConnectionQuality();
    if (this.onStatusChange) {
      this.onStatusChange({ online: this.online, quality });
    }
  }
  
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

// Request queue for offline support
export class OfflineQueue {
  constructor(storage) {
    this.storage = storage || new ResilientStorage('offline_queue');
    this.queue = this.loadQueue();
    this.processing = false;
  }
  
  loadQueue() {
    return this.storage.get('requests') || [];
  }
  
  saveQueue() {
    this.storage.set('requests', this.queue);
  }
  
  add(request) {
    this.queue.push({
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...request
    });
    this.saveQueue();
  }
  
  async process(executor) {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const processed = [];
    
    for (const request of this.queue) {
      try {
        await executor(request);
        processed.push(request.id);
      } catch (error) {
        devLog.error('Failed to process queued request:', error);
        break; // Stop processing on failure
      }
    }
    
    // Remove processed requests
    this.queue = this.queue.filter(req => !processed.includes(req.id));
    this.saveQueue();
    this.processing = false;
  }
  
  clear() {
    this.queue = [];
    this.saveQueue();
  }
}

// Graceful degradation for feature detection
export class FeatureDetector {
  constructor() {
    this.features = this.detectFeatures();
  }
  
  detectFeatures() {
    return {
      localStorage: this.hasLocalStorage(),
      sessionStorage: this.hasSessionStorage(),
      indexedDB: 'indexedDB' in window,
      webWorkers: 'Worker' in window,
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      webGL: this.hasWebGL(),
      webSockets: 'WebSocket' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      mutationObserver: 'MutationObserver' in window,
      fetch: 'fetch' in window,
      promises: 'Promise' in window,
      async: this.hasAsyncAwait(),
      cssGrid: this.hasCSSGrid(),
      customElements: 'customElements' in window,
      shadowDOM: 'attachShadow' in Element.prototype,
      webAssembly: 'WebAssembly' in window
    };
  }
  
  hasLocalStorage() {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  hasSessionStorage() {
    try {
      const test = '__test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  hasWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }
  
  hasAsyncAwait() {
    try {
      // Safe async/await detection without eval
      return (async function() {}).constructor === (async function() {}).constructor;
    } catch {
      return false;
    }
  }
  
  hasCSSGrid() {
    return CSS.supports('display', 'grid');
  }
  
  isSupported(feature) {
    return this.features[feature] || false;
  }
  
  getMissingFeatures(required) {
    return required.filter(feature => !this.isSupported(feature));
  }
}

// Error boundary helper for React
export class ErrorBoundary {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  static logErrorToService(error, errorInfo) {
    // Log to external service
    devLog.error('Error caught by boundary:', error, errorInfo);
    
    // Send to monitoring service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }
}

// Progressive enhancement loader
export class ProgressiveEnhancer {
  constructor() {
    this.enhancements = [];
  }
  
  add(test, enhance, fallback) {
    this.enhancements.push({ test, enhance, fallback });
  }
  
  async apply() {
    for (const { test, enhance, fallback } of this.enhancements) {
      try {
        if (test()) {
          await enhance();
        } else if (fallback) {
          await fallback();
        }
      } catch (error) {
        devLog.error('Enhancement failed:', error);
        if (fallback) {
          await fallback();
        }
      }
    }
  }
}

export default {
  CircuitBreaker,
  RetryManager,
  ResilientStorage,
  NetworkMonitor,
  OfflineQueue,
  FeatureDetector,
  ErrorBoundary,
  ProgressiveEnhancer
};