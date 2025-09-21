/**
 * Advanced Performance Monitoring System
 * Tracks real-time performance metrics, memory usage, and optimization opportunities
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // Core Web Vitals
      cls: null,
      fid: null,
      fcp: null,
      lcp: null,
      ttfb: null,
      
      // Custom metrics
      bundleLoadTime: null,
      componentRenderTime: {},
      memoryUsage: null,
      cacheHitRate: 0,
      
      // 3D performance
      threeJSLoadTime: null,
      threeJSMemoryUsage: null,
      
      // Chart performance
      chartRenderTime: {},
      chartDataProcessingTime: {},
      
      // Network performance
      apiResponseTime: {},
      networkErrors: 0
    };
    
    this.observers = new Map();
    this.startTime = performance.now();
    this.isMonitoring = false;
    
    this.init();
  }
  
  init() {
    if (typeof window === 'undefined') return;
    
    this.startMonitoring();
    this.setupWebVitals();
    this.setupMemoryMonitoring();
    this.setupNetworkMonitoring();
    this.setupCustomMetrics();
  }
  
  startMonitoring() {
    this.isMonitoring = true;
    console.log('Performance Monitor: Started monitoring');
    
    // Report metrics every 30 seconds
    this.reportInterval = setInterval(() => {
      this.reportMetrics();
    }, 30000);
  }
  
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    console.log('Performance Monitor: Stopped monitoring');
  }
  
  setupWebVitals() {
    // Cumulative Layout Shift (CLS)
    getCLS((metric) => {
      this.metrics.cls = metric.value;
      this.reportMetric('CLS', metric.value);
    });
    
    // First Input Delay (FID)
    getFID((metric) => {
      this.metrics.fid = metric.value;
      this.reportMetric('FID', metric.value);
    });
    
    // First Contentful Paint (FCP)
    getFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.reportMetric('FCP', metric.value);
    });
    
    // Largest Contentful Paint (LCP)
    getLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.reportMetric('LCP', metric.value);
    });
    
    // Time to First Byte (TTFB)
    getTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.reportMetric('TTFB', metric.value);
    });
  }
  
  setupMemoryMonitoring() {
    if (!performance.memory) return;
    
    const updateMemoryUsage = () => {
      this.metrics.memoryUsage = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        usage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
      
      // Alert if memory usage is high
      if (this.metrics.memoryUsage.usage > 80) {
        this.reportMetric('MEMORY_WARNING', this.metrics.memoryUsage.usage);
      }
    };
    
    // Update memory usage every 10 seconds
    setInterval(updateMemoryUsage, 10000);
    updateMemoryUsage();
  }
  
  setupNetworkMonitoring() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const url = args[0];
        this.metrics.apiResponseTime[url] = duration;
        
        if (duration > 5000) { // Slow requests
          this.reportMetric('SLOW_API_REQUEST', { url, duration });
        }
        
        return response;
      } catch (error) {
        this.metrics.networkErrors++;
        this.reportMetric('NETWORK_ERROR', { url: args[0], error: error.message });
        throw error;
      }
    };
  }
  
  setupCustomMetrics() {
    // Monitor bundle load time
    window.addEventListener('load', () => {
      const loadTime = performance.now() - this.startTime;
      this.metrics.bundleLoadTime = loadTime;
      this.reportMetric('BUNDLE_LOAD_TIME', loadTime);
    });
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.reportMetric('LONG_TASK', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        }
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longTask', longTaskObserver);
      } catch (error) {
        console.warn('Performance Monitor: Long task observer not supported');
      }
    }
  }
  
  // Component-specific monitoring
  measureComponentRender(componentName, renderFn) {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    this.metrics.componentRenderTime[componentName] = renderTime;
    
    if (renderTime > 16) { // Longer than one frame
      this.reportMetric('SLOW_COMPONENT_RENDER', { componentName, renderTime });
    }
    
    return result;
  }
  
  // 3D performance monitoring
  measure3DPerformance(componentName, loadFn) {
    const startTime = performance.now();
    
    return loadFn().then(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      this.metrics.threeJSLoadTime = loadTime;
      
      if (performance.memory) {
        this.metrics.threeJSMemoryUsage = performance.memory.usedJSHeapSize;
      }
      
      this.reportMetric('3D_LOAD_TIME', { componentName, loadTime });
    });
  }
  
  // Chart performance monitoring
  measureChartRender(chartType, dataSize, renderFn) {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    this.metrics.chartRenderTime[chartType] = renderTime;
    
    if (renderTime > 100) { // Slow chart render
      this.reportMetric('SLOW_CHART_RENDER', { chartType, dataSize, renderTime });
    }
    
    return result;
  }
  
  // Cache performance monitoring
  updateCacheMetrics(hits, misses) {
    const total = hits + misses;
    this.metrics.cacheHitRate = total > 0 ? (hits / total) * 100 : 0;
    
    if (this.metrics.cacheHitRate < 50) { // Low cache hit rate
      this.reportMetric('LOW_CACHE_HIT_RATE', this.metrics.cacheHitRate);
    }
  }
  
  // Performance recommendations
  getPerformanceRecommendations() {
    const recommendations = [];
    
    // CLS recommendations
    if (this.metrics.cls > 0.25) {
      recommendations.push({
        type: 'CLS',
        severity: 'high',
        message: 'High Cumulative Layout Shift detected. Consider optimizing image dimensions and avoiding dynamic content insertion.',
        impact: 'User Experience'
      });
    }
    
    // LCP recommendations
    if (this.metrics.lcp > 4000) {
      recommendations.push({
        type: 'LCP',
        severity: 'high',
        message: 'Slow Largest Contentful Paint. Optimize images, reduce JavaScript bundle size, or implement lazy loading.',
        impact: 'Page Load Speed'
      });
    }
    
    // Memory recommendations
    if (this.metrics.memoryUsage && this.metrics.memoryUsage.usage > 70) {
      recommendations.push({
        type: 'MEMORY',
        severity: 'medium',
        message: 'High memory usage detected. Consider implementing component cleanup and memory optimization.',
        impact: 'Performance & Stability'
      });
    }
    
    // Bundle size recommendations
    if (this.metrics.bundleLoadTime > 3000) {
      recommendations.push({
        type: 'BUNDLE_SIZE',
        severity: 'high',
        message: 'Slow bundle load time. Consider code splitting, lazy loading, and bundle optimization.',
        impact: 'Initial Load Time'
      });
    }
    
    return recommendations;
  }
  
  // Report individual metrics
  reportMetric(type, value) {
    if (!this.isMonitoring) return;
    
    const metric = {
      type,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // Send to analytics service
    this.sendToAnalytics(metric);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric [${type}]:`, value);
    }
  }
  
  // Report all metrics
  reportMetrics() {
    if (!this.isMonitoring) return;
    
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: this.metrics,
      recommendations: this.getPerformanceRecommendations(),
      sessionDuration: performance.now() - this.startTime
    };
    
    this.sendToAnalytics(report);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Report:', report);
    }
  }
  
  // Send metrics to analytics service
  async sendToAnalytics(data) {
    try {
      // Send to your analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.warn('Performance Monitor: Failed to send analytics:', error);
    }
  }
  
  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      recommendations: this.getPerformanceRecommendations(),
      sessionDuration: performance.now() - this.startTime
    };
  }
  
  // Performance score calculation
  getPerformanceScore() {
    let score = 100;
    
    // CLS penalty
    if (this.metrics.cls > 0.25) score -= 20;
    else if (this.metrics.cls > 0.1) score -= 10;
    
    // LCP penalty
    if (this.metrics.lcp > 4000) score -= 20;
    else if (this.metrics.lcp > 2500) score -= 10;
    
    // FID penalty
    if (this.metrics.fid > 300) score -= 15;
    else if (this.metrics.fid > 100) score -= 5;
    
    // Memory penalty
    if (this.metrics.memoryUsage && this.metrics.memoryUsage.usage > 80) score -= 15;
    else if (this.metrics.memoryUsage && this.metrics.memoryUsage.usage > 60) score -= 5;
    
    // Bundle load time penalty
    if (this.metrics.bundleLoadTime > 5000) score -= 10;
    else if (this.metrics.bundleLoadTime > 3000) score -= 5;
    
    return Math.max(0, score);
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

// React hook for component performance monitoring
export const usePerformanceMonitor = (componentName) => {
  const measureRender = (renderFn) => {
    return performanceMonitor.measureComponentRender(componentName, renderFn);
  };
  
  const measureAsync = (asyncFn) => {
    const startTime = performance.now();
    return asyncFn().finally(() => {
      const endTime = performance.now();
      performanceMonitor.reportMetric('ASYNC_OPERATION', {
        component: componentName,
        duration: endTime - startTime
      });
    });
  };
  
  return { measureRender, measureAsync };
};

// Chart performance monitoring hook
export const useChartPerformanceMonitor = (chartType) => {
  const measureChartRender = (dataSize, renderFn) => {
    return performanceMonitor.measureChartRender(chartType, dataSize, renderFn);
  };
  
  return { measureChartRender };
};

// 3D performance monitoring hook
export const use3DPerformanceMonitor = (componentName) => {
  const measure3DLoad = (loadFn) => {
    return performanceMonitor.measure3DPerformance(componentName, loadFn);
  };
  
  return { measure3DLoad };
};
