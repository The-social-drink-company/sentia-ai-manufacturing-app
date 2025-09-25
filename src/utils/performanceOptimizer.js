/**
 * Advanced Performance Optimizer for Enterprise Manufacturing Dashboard
 * Implements cutting-edge performance optimization techniques
 */

import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { logDebug, logInfo, logWarn, logError } from 'logger';


// Performance monitoring utilities
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.thresholds = {
      componentRender: 16, // 60fps target
      apiResponse: 1000,   // 1 second max
      bundleLoad: 3000,    // 3 seconds max
      memoryUsage: 100     // 100MB threshold
    };
  }

  // Start performance measurement
  startMeasure(name, category = 'general') {
    const startTime = performance.now();
    this.metrics.set(name, {
      startTime,
      category,
      timestamp: new Date().toISOString()
    });
    
    // Use Performance Observer API for detailed metrics
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === name) {
            this.recordMetric(name, entry.duration, category);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
      this.observers.set(name, observer);
    }
    
    performance.mark(`${name}-start`);
  }

  // End performance measurement
  endMeasure(name) {
    const metric = this.metrics.get(name);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    this.recordMetric(name, duration, metric.category);
    
    // Cleanup
    const observer = this.observers.get(name);
    if (observer) {
      observer.disconnect();
      this.observers.delete(name);
    }
    
    return duration;
  }

  // Record performance metric
  recordMetric(name, duration, category) {
    const threshold = this.thresholds[category] || this.thresholds.general;
    const isSlowPerformance = duration > threshold;
    
    const metricData = {
      name,
      duration,
      category,
      timestamp: new Date().toISOString(),
      isSlowPerformance,
      threshold
    };

    // Store in performance buffer
    if (!window.performanceBuffer) {
      window.performanceBuffer = [];
    }
    window.performanceBuffer.push(metricData);

    // Log slow performance
    if (isSlowPerformance) {
      logWarn(`Slow performance detected: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }

    // Send to analytics if configured
    if (window.analytics && typeof window.analytics.track === 'function') {
      window.analytics.track('Performance Metric', metricData);
    }
  }

  // Get performance summary
  getSummary() {
    const buffer = window.performanceBuffer || [];
    const summary = {
      totalMeasurements: buffer.length,
      slowPerformanceCount: buffer.filter(m => m.isSlowPerformance).length,
      averageDuration: buffer.reduce((sum, m) => sum + m.duration, 0) / buffer.length,
      categories: {}
    };

    // Group by category
    buffer.forEach(metric => {
      if (!summary.categories[metric.category]) {
        summary.categories[metric.category] = {
          count: 0,
          totalDuration: 0,
          slowCount: 0
        };
      }
      
      const cat = summary.categories[metric.category];
      cat.count++;
      cat.totalDuration += metric.duration;
      if (metric.isSlowPerformance) cat.slowCount++;
    });

    // Calculate averages
    Object.keys(summary.categories).forEach(category => {
      const cat = summary.categories[category];
      cat.averageDuration = cat.totalDuration / cat.count;
      cat.slowPercentage = (cat.slowCount / cat.count) * 100;
    });

    return summary;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Memory optimization utilities
export class MemoryOptimizer {
  constructor() {
    this.componentCache = new WeakMap();
    this.cleanupTasks = new Set();
    this.memoryThreshold = 100 * 1024 * 1024; // 100MB
  }

  // Monitor memory usage
  monitorMemory() {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      const usage = {
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        limit: memInfo.jsHeapSizeLimit,
        percentage: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100
      };

      if (usage.used > this.memoryThreshold) {
        logWarn('High memory usage detected:', usage);
        this.triggerCleanup();
      }

      return usage;
    }
    return null;
  }

  // Register cleanup task
  registerCleanup(task) {
    this.cleanupTasks.add(task);
  }

  // Trigger memory cleanup
  triggerCleanup() {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        logError('Cleanup task failed:', error);
      }
    });
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  // Optimize component for memory
  optimizeComponent(Component, options = {}) {
    const { 
      memoize = true, 
      cleanupOnUnmount = true,
      trackMemory = false 
    } = options;

    let OptimizedComponent = Component;

    if (memoize) {
      OptimizedComponent = memo(Component);
    }

    if (cleanupOnUnmount || trackMemory) {
      OptimizedComponent = (props) => {
        const componentRef = useRef();
        
        useEffect(() => {
          if (trackMemory) {
            performanceMonitor.startMeasure(`component-${Component.name}`, 'componentRender');
          }
          
          return () => {
            if (trackMemory) {
              performanceMonitor.endMeasure(`component-${Component.name}`);
            }
            
            if (cleanupOnUnmount && componentRef.current) {
              // Cleanup component-specific resources
              this.cleanupComponent(componentRef.current);
            }
          };
        }, []);

        return <Component ref={componentRef} {...props} />;
      };
    }

    return OptimizedComponent;
  }

  // Cleanup component resources
  cleanupComponent(componentRef) {
    // Cancel any pending timers
    if (componentRef.timers) {
      componentRef.timers.forEach(timer => clearTimeout(timer));
    }

    // Cancel any pending intervals
    if (componentRef.intervals) {
      componentRef.intervals.forEach(interval => clearInterval(interval));
    }

    // Cleanup event listeners
    if (componentRef.eventListeners) {
      componentRef.eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    }

    // Cleanup WebGL contexts
    if (componentRef.webglContexts) {
      componentRef.webglContexts.forEach(context => {
        const extension = context.getExtension('WEBGL_lose_context');
        if (extension) extension.loseContext();
      });
    }
  }
}

// Global memory optimizer instance
export const memoryOptimizer = new MemoryOptimizer();

// Bundle optimization utilities
export class BundleOptimizer {
  constructor() {
    this.loadedChunks = new Set();
    this.preloadQueue = [];
    this.criticalResources = new Set();
  }

  // Preload critical resources
  preloadCritical(resources) {
    resources.forEach(resource => {
      this.criticalResources.add(resource);
      this.preloadResource(resource, 'high');
    });
  }

  // Preload resource with priority
  preloadResource(url, priority = 'low') {
    if (this.loadedChunks.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = this.getResourceType(url);
    
    if (priority === 'high') {
      link.setAttribute('importance', 'high');
    }

    link.onload = () => {
      this.loadedChunks.add(url);
    };

    document.head.appendChild(link);
  }

  // Get resource type from URL
  getResourceType(url) {
    if (url.endsWith('.js')) return 'script';
    if (url.endsWith('.css')) return 'style';
    if (url.match(/\.(woff2?|ttf|eot)$/)) return 'font';
    if (url.match(/\.(jpg|jpeg|png|webp|svg)$/)) return 'image';
    return 'fetch';
  }

  // Implement intelligent code splitting
  createIntelligentLazyComponent(importFunc, options = {}) {
    const {
      preload = false,
      priority = 'low',
      fallback = null,
      errorBoundary = true
    } = options;

    return memo((props) => {
      const [Component, setComponent] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

      useEffect(() => {
        performanceMonitor.startMeasure('lazy-component-load', 'bundleLoad');
        
        importFunc()
          .then(module => {
            setComponent(() => module.default || module);
            performanceMonitor.endMeasure('lazy-component-load');
          })
          .catch(err => {
            setError(err);
            logError('Failed to load component:', err);
          })
          .finally(() => {
            setLoading(false);
          });
      }, []);

      if (loading) {
        return fallback || <div>Loading...</div>;
      }

      if (error) {
        if (errorBoundary) {
          throw error;
        }
        return <div>Failed to load component</div>;
      }

      return Component ? <Component {...props} /> : null;
    });
  }
}

// Global bundle optimizer instance
export const bundleOptimizer = new BundleOptimizer();

// Performance hooks
export const usePerformanceTracking = (componentName) => {
  useEffect(() => {
    performanceMonitor.startMeasure(componentName, 'componentRender');
    return () => {
      performanceMonitor.endMeasure(componentName);
    };
  }, [componentName]);
};

export const useMemoryOptimization = (options = {}) => {
  const { trackMemory = true, autoCleanup = true } = options;
  
  useEffect(() => {
    let memoryInterval;
    
    if (trackMemory) {
      memoryInterval = setInterval(() => {
        memoryOptimizer.monitorMemory();
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (memoryInterval) {
        clearInterval(memoryInterval);
      }
      
      if (autoCleanup) {
        memoryOptimizer.triggerCleanup();
      }
    };
  }, [trackMemory, autoCleanup]);
};

// Optimized component factory
export const createOptimizedComponent = (Component, options = {}) => {
  const {
    memo: shouldMemo = true,
    performance = true,
    memory = true,
    name = Component.name || 'AnonymousComponent'
  } = options;

  let OptimizedComponent = Component;

  // Apply memoization
  if (shouldMemo) {
    OptimizedComponent = memo(OptimizedComponent);
  }

  // Apply performance and memory optimization
  if (performance || memory) {
    OptimizedComponent = memoryOptimizer.optimizeComponent(OptimizedComponent, {
      memoize: false, // Already applied above
      cleanupOnUnmount: memory,
      trackMemory: performance
    });
  }

  return OptimizedComponent;
};

// Export performance utilities
export default {
  performanceMonitor,
  memoryOptimizer,
  bundleOptimizer,
  usePerformanceTracking,
  useMemoryOptimization,
  createOptimizedComponent
};
