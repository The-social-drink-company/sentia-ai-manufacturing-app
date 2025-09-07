/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and custom performance metrics
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { trackMetric } from '../../../services/monitoring/sentryConfig.js';

class WebVitalsMonitor {
  constructor() {
    this.metrics = new Map();
    this.customMetrics = new Map();
    this.observers = new Set();
    this.isInitialized = false;
    this.reportingEndpoint = '/api/monitoring/web-vitals';
    this.batchSize = 10;
    this.reportBatch = [];
    this.reportInterval = 30000; // 30 seconds
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Core Web Vitals monitoring
    this.initCoreWebVitals();
    
    // Custom performance metrics
    this.initCustomMetrics();
    
    // Navigation timing
    this.initNavigationTiming();
    
    // Resource timing
    this.initResourceTiming();
    
    // Long tasks monitoring
    this.initLongTasksMonitoring();
    
    // Memory usage monitoring
    this.initMemoryMonitoring();
    
    // Start periodic reporting
    this.startPeriodicReporting();
    
    this.isInitialized = true;
    console.log('Web Vitals monitoring initialized');
  }

  /**
   * Core Web Vitals
   */
  initCoreWebVitals() {
    // Largest Contentful Paint
    getLCP((metric) => {
      this.recordMetric('LCP', metric.value, {
        rating: this.getRating(metric.value, [2500, 4000]),
        entries: metric.entries.length,
        url: window.location.href
      });
    });

    // First Input Delay
    getFID((metric) => {
      this.recordMetric('FID', metric.value, {
        rating: this.getRating(metric.value, [100, 300]),
        entries: metric.entries.length,
        url: window.location.href
      });
    });

    // Cumulative Layout Shift
    getCLS((metric) => {
      this.recordMetric('CLS', metric.value, {
        rating: this.getRating(metric.value, [0.1, 0.25]),
        entries: metric.entries.length,
        url: window.location.href
      });
    });

    // First Contentful Paint
    getFCP((metric) => {
      this.recordMetric('FCP', metric.value, {
        rating: this.getRating(metric.value, [1800, 3000]),
        entries: metric.entries.length,
        url: window.location.href
      });
    });

    // Time to First Byte
    getTTFB((metric) => {
      this.recordMetric('TTFB', metric.value, {
        rating: this.getRating(metric.value, [800, 1800]),
        entries: metric.entries.length,
        url: window.location.href
      });
    });
  }

  /**
   * Custom performance metrics
   */
  initCustomMetrics() {
    // React component render times
    this.measureReactRenderTimes();
    
    // API response times
    this.measureAPIResponseTimes();
    
    // Chart rendering times
    this.measureChartRenderTimes();
    
    // Dashboard load times
    this.measureDashboardLoadTimes();
  }

  measureReactRenderTimes() {
    if (window.React && window.React.unstable_Profiler) {
      // This would be integrated with React Profiler API
      console.log('React render time monitoring available');
    }
  }

  measureAPIResponseTimes() {
    // Intercept fetch calls
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordMetric('API_Response_Time', duration, {
          url: typeof url === 'string' ? url : url.url,
          status: response.status,
          method: args[1]?.method || 'GET'
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordMetric('API_Response_Time', duration, {
          url: typeof url === 'string' ? url : url.url,
          error: error.message,
          method: args[1]?.method || 'GET'
        });
        
        throw error;
      }
    };
  }

  measureChartRenderTimes() {
    // Monitor Recharts rendering performance
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.querySelector('.recharts-wrapper')) {
              const startTime = performance.now();
              
              requestAnimationFrame(() => {
                const endTime = performance.now();
                this.recordMetric('Chart_Render_Time', endTime - startTime, {
                  chartType: node.className
                });
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.add(observer);
  }

  measureDashboardLoadTimes() {
    // Measure time to interactive for dashboard
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const loadTime = performance.now();
        this.recordMetric('Dashboard_Load_Time', loadTime, {
          type: 'time_to_interactive'
        });
      });
    }
  }

  /**
   * Navigation Timing
   */
  initNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation');
      
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        
        this.recordMetric('DNS_Lookup_Time', nav.domainLookupEnd - nav.domainLookupStart);
        this.recordMetric('TCP_Connection_Time', nav.connectEnd - nav.connectStart);
        this.recordMetric('TLS_Negotiation_Time', nav.secureConnectionStart ? nav.connectEnd - nav.secureConnectionStart : 0);
        this.recordMetric('Server_Response_Time', nav.responseStart - nav.requestStart);
        this.recordMetric('DOM_Processing_Time', nav.domContentLoadedEventStart - nav.responseEnd);
        this.recordMetric('Resource_Load_Time', nav.loadEventStart - nav.domContentLoadedEventEnd);
      }
    }
  }

  /**
   * Resource Timing
   */
  initResourceTiming() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.recordResourceMetric(entry);
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.add(resourceObserver);
    }
  }

  recordResourceMetric(entry) {
    const resourceType = this.getResourceType(entry.name);
    const duration = entry.responseEnd - entry.startTime;
    
    this.recordMetric(`Resource_Load_Time_${resourceType}`, duration, {
      url: entry.name,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    });

    // Track largest resources
    if (duration > 1000) { // Resources taking more than 1 second
      this.recordMetric('Slow_Resource', duration, {
        url: entry.name,
        type: resourceType,
        size: entry.transferSize || 0
      });
    }
  }

  getResourceType(url) {
    if (url.includes('.js')) return 'JavaScript';
    if (url.includes('.css')) return 'CSS';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'Image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'Font';
    if (url.includes('/api/')) return 'API';
    return 'Other';
  }

  /**
   * Long Tasks Monitoring
   */
  initLongTasksMonitoring() {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'longtask') {
              this.recordMetric('Long_Task', entry.duration, {
                name: entry.name,
                startTime: entry.startTime,
                attribution: entry.attribution?.[0]?.name || 'unknown'
              });
            }
          });
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.add(longTaskObserver);
      } catch (e) {
        console.warn('Long tasks monitoring not supported');
      }
    }
  }

  /**
   * Memory Usage Monitoring
   */
  initMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        
        this.recordMetric('Memory_Used', memory.usedJSHeapSize, {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          utilization: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        });

        // Alert if memory usage is high
        const utilization = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (utilization > 80) {
          this.recordMetric('High_Memory_Usage', utilization, {
            used: memory.usedJSHeapSize,
            limit: memory.jsHeapSizeLimit
          });
        }
      }, 60000); // Every minute
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connection: this.getConnectionInfo()
      }
    };

    this.metrics.set(`${name}-${Date.now()}`, metric);
    this.reportBatch.push(metric);

    // Send to Sentry
    trackMetric(name, value, 'millisecond', {
      ...metadata,
      url: window.location.href
    });

    // Batch reporting
    if (this.reportBatch.length >= this.batchSize) {
      this.sendBatch();
    }
  }

  /**
   * Get connection information
   */
  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }
    return null;
  }

  /**
   * Get performance rating
   */
  getRating(value, thresholds) {
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting() {
    setInterval(() => {
      if (this.reportBatch.length > 0) {
        this.sendBatch();
      }
      this.generatePerformanceReport();
    }, this.reportInterval);
  }

  /**
   * Send batch of metrics to server
   */
  async sendBatch() {
    if (this.reportBatch.length === 0) return;

    const batch = [...this.reportBatch];
    this.reportBatch = [];

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: batch })
      });
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
      // Add back to batch for retry
      this.reportBatch.unshift(...batch);
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: Object.fromEntries(this.metrics),
      summary: {
        totalMetrics: this.metrics.size,
        avgLoadTime: this.calculateAverageLoadTime(),
        performanceScore: this.calculatePerformanceScore()
      }
    };

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'performance_report', {
        custom_map: { metric_1: 'performance_score' },
        metric_1: report.summary.performanceScore
      });
    }

    return report;
  }

  calculateAverageLoadTime() {
    const loadTimes = Array.from(this.metrics.values())
      .filter(m => m.name.includes('Load_Time'))
      .map(m => m.value);
    
    return loadTimes.length > 0 
      ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length 
      : 0;
  }

  calculatePerformanceScore() {
    // Simplified performance score based on Core Web Vitals
    const coreVitals = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];
    const scores = [];

    coreVitals.forEach(vital => {
      const metric = Array.from(this.metrics.values())
        .find(m => m.name === vital);
      
      if (metric) {
        let score = 100;
        switch (vital) {
          case 'LCP':
            score = metric.value <= 2500 ? 100 : metric.value <= 4000 ? 50 : 0;
            break;
          case 'FID':
            score = metric.value <= 100 ? 100 : metric.value <= 300 ? 50 : 0;
            break;
          case 'CLS':
            score = metric.value <= 0.1 ? 100 : metric.value <= 0.25 ? 50 : 0;
            break;
          case 'FCP':
            score = metric.value <= 1800 ? 100 : metric.value <= 3000 ? 50 : 0;
            break;
          case 'TTFB':
            score = metric.value <= 800 ? 100 : metric.value <= 1800 ? 50 : 0;
            break;
        }
        scores.push(score);
      }
    });

    return scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  }

  /**
   * Manual metric tracking
   */
  trackCustomMetric(name, value, metadata = {}) {
    this.recordMetric(`Custom_${name}`, value, metadata);
  }

  /**
   * Mark feature usage
   */
  markFeatureUsage(featureName, metadata = {}) {
    this.recordMetric('Feature_Usage', 1, {
      feature: featureName,
      ...metadata
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(type, target, metadata = {}) {
    this.recordMetric('User_Interaction', 1, {
      type,
      target,
      ...metadata
    });
  }

  /**
   * Cleanup observers
   */
  destroy() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    this.metrics.clear();
  }
}

// Create and export singleton instance
const webVitalsMonitor = new WebVitalsMonitor();

// Export individual functions for easy use
export const {
  trackCustomMetric,
  markFeatureUsage,
  trackInteraction,
  generatePerformanceReport
} = webVitalsMonitor;

export default webVitalsMonitor;