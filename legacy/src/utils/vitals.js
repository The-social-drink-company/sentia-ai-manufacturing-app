// Web Vitals Collection Utility
// Captures Core Web Vitals metrics for performance monitoring

import { devLog } from '../lib/devLog';

/**
 * Collects web vitals metrics and sends to telemetry endpoint
 * @param {Object} metric - Web vital metric data
 */
export function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  
  // Use sendBeacon if available (preferred for reliability)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/metrics/vitals', body);
  } else {
    // Fallback to fetch
    fetch('/api/metrics/vitals', {
      body,
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).catch(() => {
      // Silently fail - don't break the app for metrics
    });
  }
}

/**
 * Initialize web vitals collection
 * Only runs in production or when explicitly enabled
 */
export async function initVitals() {
  // Only collect vitals in production or when enabled
  const shouldCollect = process.env.NODE_ENV === 'production' || 
                       process.env.VITE_COLLECT_VITALS === 'true';
  
  if (!shouldCollect) {
    devLog.log('Web vitals collection disabled');
    return;
  }

  try {
    // Dynamically import web-vitals to avoid affecting bundle size in dev
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
    
    // Collect Core Web Vitals
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
    
    devLog.log('Web vitals collection initialized');
  } catch (error) {
    devLog.warn('Failed to initialize web vitals:', error);
  }
}

/**
 * Report custom performance metrics
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {Object} labels - Additional labels
 */
export function reportCustomMetric(name, value, labels = {}) {
  const metric = {
    name,
    value,
    labels: {
      ...labels,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent.substring(0, 100) // Truncated for privacy
    }
  };
  
  sendToAnalytics(metric);
}

/**
 * Measure and report navigation timing
 */
export function reportNavigationTiming() {
  if (!window.performance || !window.performance.timing) {
    return;
  }
  
  const timing = window.performance.timing;
  const navigationStart = timing.navigationStart;
  
  // Calculate key timing metrics
  const metrics = {
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    tcp: timing.connectEnd - timing.connectStart,
    request: timing.responseStart - timing.requestStart,
    response: timing.responseEnd - timing.responseStart,
    dom: timing.domComplete - timing.domLoading,
    pageLoad: timing.loadEventEnd - navigationStart
  };
  
  // Report each metric
  Object.entries(metrics).forEach(([name, value]) => {
    if (value > 0) {
      reportCustomMetric(`navigation_${name}`, value, {
        type: 'navigation_timing'
      });
    }
  });
}

/**
 * Monitor resource loading performance
 */
export function monitorResourceTiming() {
  if (!window.performance || !window.performance.getEntriesByType) {
    return;
  }
  
  // Monitor resource timing
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      // Only monitor critical resources
      if (entry.initiatorType === 'script' || 
          entry.initiatorType === 'css' ||
          entry.initiatorType === 'img') {
        
        reportCustomMetric('resource_timing', entry.duration, {
          type: 'resource',
          name: entry.name.split('/').pop(), // Get filename only
          initiatorType: entry.initiatorType,
          size: entry.transferSize || entry.decodedBodySize
        });
      }
    });
  });
  
  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (error) {
    devLog.warn('Resource timing monitoring not supported:', error);
  }
}

/**
 * Monitor long tasks (tasks > 50ms)
 */
export function monitorLongTasks() {
  if (!window.PerformanceObserver) {
    return;
  }
  
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      reportCustomMetric('long_task', entry.duration, {
        type: 'long_task',
        startTime: entry.startTime
      });
    });
  });
  
  try {
    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    devLog.warn('Long task monitoring not supported:', error);
  }
}

/**
 * Initialize all performance monitoring
 */
export function initPerformanceMonitoring() {
  // Initialize after page load
  if (document.readyState === 'complete') {
    initVitals();
    reportNavigationTiming();
    monitorResourceTiming();
    monitorLongTasks();
  } else {
    window.addEventListener('load', () => {
      initVitals();
      reportNavigationTiming();
      monitorResourceTiming();
      monitorLongTasks();
    });
  }
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
  initPerformanceMonitoring();
}
