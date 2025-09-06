/**
 * Frontend Performance Utilities
 * Implements lazy loading, code splitting, and performance monitoring
 */

import { devLog } from '../lib/devLog';

// Web Vitals monitoring - disabled to prevent import errors
export const measureWebVitals = (onPerfEntry) => {
  // Web vitals monitoring temporarily disabled
  // Can be re-enabled by uncommenting the code below and ensuring web-vitals is properly configured
  /*
  if (onPerfEntry && onPerfEntry instanceof Function) {
    try {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(onPerfEntry);
        getFID(onPerfEntry);
        getFCP(onPerfEntry);
        getLCP(onPerfEntry);
        getTTFB(onPerfEntry);
      }).catch(() => {
        devLog.warn('web-vitals not available');
      });
    } catch (err) {
      devLog.warn('web-vitals not available, skipping performance monitoring');
    }
  }
  */
};

// Performance observer for custom metrics
export const createPerformanceObserver = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log to analytics or monitoring service
        devLog.log('Performance Entry:', {
          name: entry.name,
          type: entry.entryType,
          duration: entry.duration,
          startTime: entry.startTime
        });
      }
    });
    
    observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'measure'] });
    return observer;
  }
  return null;
};

// Image lazy loading with Intersection Observer
export const lazyLoadImages = (selector = 'img[data-lazy]') => {
  if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll(selector);
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.lazy;
          img.removeAttribute('data-lazy');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
    
    images.forEach(img => imageObserver.observe(img));
    return imageObserver;
  }
  return null;
};

// Debounce utility for expensive operations
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility for rate limiting
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Request idle callback wrapper for non-critical tasks
export const scheduleIdleTask = (callback, options = {}) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  } else {
    // Fallback to setTimeout
    return setTimeout(callback, 1);
  }
};

// Prefetch critical resources
export const prefetchResources = (urls) => {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
};

// Memory leak detection
export const detectMemoryLeaks = () => {
  if ('performance' in window && 'memory' in performance) {
    const checkMemory = () => {
      const memoryInfo = performance.memory;
      const usedHeapSize = memoryInfo.usedJSHeapSize;
      const totalHeapSize = memoryInfo.totalJSHeapSize;
      const limit = memoryInfo.jsHeapSizeLimit;
      
      const percentUsed = (usedHeapSize / limit) * 100;
      
      if (percentUsed > 90) {
        devLog.warn('High memory usage detected:', {
          used: `${(usedHeapSize / 1048576).toFixed(2)} MB`,
          total: `${(totalHeapSize / 1048576).toFixed(2)} MB`,
          limit: `${(limit / 1048576).toFixed(2)} MB`,
          percentUsed: `${percentUsed.toFixed(2)}%`
        });
      }
    };
    
    // Check every 30 seconds
    return setInterval(checkMemory, 30000);
  }
  return null;
};

// Virtual scrolling helper for large lists
export class VirtualScroller {
  constructor(container, itemHeight, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.items = [];
    this.scrollTop = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    
    this.onScroll = this.onScroll.bind(this);
    this.container.addEventListener('scroll', this.onScroll);
  }
  
  setItems(items) {
    this.items = items;
    this.render();
  }
  
  onScroll() {
    this.scrollTop = this.container.scrollTop;
    this.render();
  }
  
  render() {
    const containerHeight = this.container.clientHeight;
    this.visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    this.visibleEnd = Math.ceil((this.scrollTop + containerHeight) / this.itemHeight);
    
    // Add buffer for smooth scrolling
    const buffer = 5;
    const start = Math.max(0, this.visibleStart - buffer);
    const end = Math.min(this.items.length, this.visibleEnd + buffer);
    
    // Clear and render visible items
    this.container.innerHTML = '';
    
    // Add spacer for scrolled items
    if (start > 0) {
      const spacer = document.createElement('div');
      spacer.style.height = `${start * this.itemHeight}px`;
      this.container.appendChild(spacer);
    }
    
    // Render visible items
    for (let i = start; i < end; i++) {
      const element = this.renderItem(this.items[i], i);
      this.container.appendChild(element);
    }
    
    // Add spacer for remaining items
    if (end < this.items.length) {
      const spacer = document.createElement('div');
      spacer.style.height = `${(this.items.length - end) * this.itemHeight}px`;
      this.container.appendChild(spacer);
    }
  }
  
  destroy() {
    this.container.removeEventListener('scroll', this.onScroll);
  }
}

// Resource timing API wrapper
export const getResourceTimings = (type = 'all') => {
  if ('performance' in window) {
    const resources = performance.getEntriesByType('resource');
    
    if (type === 'all') {
      return resources;
    }
    
    return resources.filter(resource => {
      if (type === 'slow') {
        return resource.duration > 500;
      }
      if (type === 'api') {
        return resource.name.includes('/api/');
      }
      if (type === 'images') {
        return resource.initiatorType === 'img';
      }
      if (type === 'scripts') {
        return resource.initiatorType === 'script';
      }
      return true;
    });
  }
  return [];
};

// Bundle size monitoring
export const monitorBundleSize = async () => {
  if ('navigator' in window && 'connection' in navigator) {
    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;
    
    // Adjust behavior based on connection speed
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      // Load minimal resources
      return 'minimal';
    } else if (effectiveType === '3g') {
      // Load standard resources
      return 'standard';
    } else {
      // Load all resources
      return 'full';
    }
  }
  return 'full';
};

// Performance marks and measures
export const perfMark = (name) => {
  if ('performance' in window) {
    performance.mark(name);
  }
};

export const perfMeasure = (name, startMark, endMark) => {
  if ('performance' in window) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure ? measure.duration : null;
    } catch (e) {
      devLog.error('Performance measurement failed:', e);
      return null;
    }
  }
  return null;
};

// First Contentful Paint (FCP) observer
export const observeFCP = (callback) => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          callback(entry.startTime);
          observer.disconnect();
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });
    return observer;
  }
  return null;
};

// Export performance report
export const generatePerformanceReport = () => {
  if (!('performance' in window)) {
    return null;
  }
  
  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  const resources = getResourceTimings('slow');
  
  return {
    navigation: {
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnection: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domComplete - navigation.domInteractive,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart
    },
    paint: paint.reduce((acc, entry) => {
      acc[entry.name] = entry.startTime;
      return acc;
    }, {}),
    slowResources: resources.map(r => ({
      name: r.name.split('/').pop(),
      duration: Math.round(r.duration),
      size: r.transferSize,
      type: r.initiatorType
    })),
    memory: performance.memory ? {
      used: `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
    } : null
  };
};

export default {
  measureWebVitals,
  createPerformanceObserver,
  lazyLoadImages,
  debounce,
  throttle,
  scheduleIdleTask,
  prefetchResources,
  detectMemoryLeaks,
  VirtualScroller,
  getResourceTimings,
  monitorBundleSize,
  perfMark,
  perfMeasure,
  observeFCP,
  generatePerformanceReport
};