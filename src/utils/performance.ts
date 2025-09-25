// Performance optimization utilities

import { lazy, ComponentType } from 'react';

/**
 * Enhanced lazy loading with retry mechanism
 */
export const lazyWithRetry = <T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  retries: number = 3
) => {
  return lazy(() =>
    importFunction().catch((error) => {
      if (retries > 0) {
        console.warn(`Failed to load component, retrying... (${retries} attempts left)`);
        return new Promise<{ default: T }>((resolve) => {
          setTimeout(() => {
            resolve(lazyWithRetry(importFunction, retries - 1)().props.children);
          }, 1000);
        });
      }
      throw error;
    })
  );
};

/**
 * Debounce function for search and input handlers
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for scroll and resize handlers
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Intersection Observer for lazy loading elements
 */
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  static startMeasure(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
      this.measurements.set(name, performance.now());
    }
  }

  static endMeasure(name: string): number {
    if (typeof performance !== 'undefined') {
      const startTime = this.measurements.get(name);
      if (startTime) {
        const duration = performance.now() - startTime;
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        this.measurements.delete(name);
        return duration;
      }
    }
    return 0;
  }

  static logMeasures(): void {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const measures = performance.getEntriesByType('measure');
      console.table(
        measures.map(measure => ({
          name: measure.name,
          duration: `${measure.duration.toFixed(2)}ms`,
          start: `${measure.startTime.toFixed(2)}ms`
        }))
      );
    }
  }

  static clearMeasures(): void {
    if (typeof performance !== 'undefined') {
      performance.clearMeasures();
      performance.clearMarks();
      this.measurements.clear();
    }
  }
}

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = (): {
  used: number;
  total: number;
  percentage: number;
} | null => {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100, // MB
      total: Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100, // MB
      percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
    };
  }
  return null;
};

/**
 * Image optimization utilities
 */
export const createOptimizedImage = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string => {
  // For production, you might want to use a service like Cloudinary or ImageKit
  // This is a simplified version for development
  const { width, height, quality = 80, format = 'webp' } = options;
  
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality) params.set('q', quality.toString());
  if (format) params.set('f', format);
  
  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
};

/**
 * Preload critical resources
 */
export const preloadResource = (
  href: string,
  as: 'script' | 'style' | 'font' | 'image' | 'document' = 'script',
  crossorigin?: 'anonymous' | 'use-credentials'
): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) link.crossOrigin = crossorigin;
  if (as === 'font') link.type = 'font/woff2';
  document.head.appendChild(link);
};

/**
 * Bundle size analysis helper
 */
export const analyzeBundleSize = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'development') {
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
    
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  }
};

/**
 * React component performance wrapper
 */
export const withPerformanceTracking = <P extends object>(
  Component: ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    React.useEffect(() => {
      PerformanceMonitor.startMeasure(`render-${componentName}`);
      return () => {
        const duration = PerformanceMonitor.endMeasure(`render-${componentName}`);
        if (duration > 16.67) { // More than one frame at 60fps
          console.warn(`Component ${componentName} took ${duration.toFixed(2)}ms to render`);
        }
      };
    });

    return <Component {...props} />;
  };
};

/**
 * Virtual scrolling utility for large lists
 */
export const useVirtualList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );
  
  const paddingTop = visibleStart * itemHeight;
  const paddingBottom = (items.length - visibleEnd - 1) * itemHeight;
  const visibleItems = items.slice(
    Math.max(0, visibleStart - overscan),
    Math.min(items.length, visibleEnd + 1 + overscan)
  );
  
  return {
    visibleItems,
    paddingTop,
    paddingBottom,
    scrollTop,
    setScrollTop
  };
};

// Import React for hooks
import React from 'react';