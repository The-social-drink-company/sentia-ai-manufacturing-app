// Optimized Lazy Loading with Prefetching and Priority Loading
// Reduces initial bundle size and improves performance

import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '../components/LoadingStates';

// Cache for loaded components
const componentCache = new Map();

// Priority queue for component loading
const loadingQueue = {
  high: [],
  medium: [],
  low: []
};

// Network speed detection
const getNetworkSpeed = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    if (connection.effectiveType === '4g') return 'fast';
    if (connection.effectiveType === '3g') return 'medium';
    return 'slow';
  }
  return 'unknown';
};

// Intersection Observer for viewport-based loading
const observerOptions = {
  rootMargin: '50px',
  threshold: 0.01
};

const componentObserver = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const componentLoader = entry.target.getAttribute('data-component-loader');
          if (componentLoader && loadingQueue.medium.includes(componentLoader)) {
            prefetchComponent(componentLoader);
          }
        }
      });
    }, observerOptions)
  : null;

// Create an optimized lazy component with smart loading
export const createOptimizedLazyComponent = (
  importFunc,
  options = {}
) => {
  const {
    componentName = 'Component',
    priority = 'medium',
    preload = false,
    retryCount = 3,
    retryDelay = 1000,
    fallback = <LoadingSpinner />,
    errorFallback = null,
    chunkName = null
  } = options;

  // Add webpack magic comment for chunk naming
  const enhancedImportFunc = () => {
    const importPromise = chunkName
      ? importFunc().then(module => {
          // webpack magic comment for chunk naming
          return module;
        })
      : importFunc();

    return importPromise.catch(error => {
      console.error(`Failed to load component ${componentName}:`, error);

      // Implement retry logic
      if (retryCount > 0) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(createOptimizedLazyComponent(importFunc, {
              ...options,
              retryCount: retryCount - 1
            })());
          }, retryDelay);
        });
      }

      // If we have an error fallback, use it
      if (errorFallback) {
        return { default: errorFallback };
      }

      throw error;
    });
  };

  // Create the lazy component
  const LazyComponent = lazy(enhancedImportFunc);

  // Cache the component
  componentCache.set(componentName, LazyComponent);

  // Add to loading queue based on priority
  if (priority === 'high' || preload) {
    loadingQueue.high.push(componentName);
    // Preload high-priority components immediately
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        enhancedImportFunc();
      });
    } else {
      setTimeout(() => enhancedImportFunc(), 0);
    }
  } else {
    loadingQueue[priority].push(componentName);
  }

  // Return wrapped component with Suspense
  const WrappedComponent = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `Lazy(${componentName})`;
  WrappedComponent.preload = enhancedImportFunc;

  return WrappedComponent;
};

// Prefetch a component based on user intent
export const prefetchComponent = (componentName) => {
  const component = componentCache.get(componentName);
  if (component && component.preload) {
    component.preload();
  }
};

// Prefetch components based on route
export const prefetchRouteComponents = (routeName) => {
  const routeComponents = {
    '/dashboard': ['SimpleDashboard', 'WorldClassDashboard'],
    '/working-capital': ['WorkingCapital', 'EnhancedWorkingCapital'],
    '/what-if': ['WhatIfAnalysis', 'WhatIfAnalysisDashboard'],
    '/inventory': ['InventoryManagement', 'AdvancedInventoryManagement'],
    '/production': ['ProductionTracking', 'ProductionOptimization'],
    '/quality': ['QualityControl', 'QualityManagementSystem'],
    '/forecasting': ['DemandForecasting', 'EnhancedAIForecasting'],
    '/admin': ['AdminPanel']
  };

  const components = routeComponents[routeName] || [];
  components.forEach(prefetchComponent);
};

// Smart prefetching based on user behavior
export const setupSmartPrefetching = () => {
  if (typeof window === 'undefined') return;

  // Prefetch on link hover
  document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      prefetchRouteComponents(href);
    }
  });

  // Prefetch based on network speed
  const networkSpeed = getNetworkSpeed();
  if (networkSpeed === 'fast') {
    // Prefetch medium priority components on fast networks
    setTimeout(() => {
      loadingQueue.medium.forEach(prefetchComponent);
    }, 5000);
  }

  // Cleanup old cached components periodically
  setInterval(() => {
    if (componentCache.size > 50) {
      // Remove least recently used components
      const entriesToRemove = componentCache.size - 30;
      const entries = Array.from(componentCache.entries());
      for (let i = 0; i < entriesToRemove; i++) {
        componentCache.delete(entries[i][0]);
      }
    }
  }, 60000); // Every minute
};

// Priority-based component creators
export const createHighPriorityComponent = (importFunc, componentName) =>
  createOptimizedLazyComponent(importFunc, {
    componentName,
    priority: 'high',
    preload: true,
    retryCount: 5
  });

export const createMediumPriorityComponent = (importFunc, componentName) =>
  createOptimizedLazyComponent(importFunc, {
    componentName,
    priority: 'medium',
    preload: false,
    retryCount: 3
  });

export const createLowPriorityComponent = (importFunc, componentName) =>
  createOptimizedLazyComponent(importFunc, {
    componentName,
    priority: 'low',
    preload: false,
    retryCount: 2
  });

// Route-specific component creator with chunk naming
export const createRouteComponent = (routeName, importFunc, options = {}) =>
  createOptimizedLazyComponent(importFunc, {
    componentName: routeName,
    priority: 'medium',
    chunkName: `route-${routeName}`,
    ...options
  });

// Initialize smart prefetching on app load
if (typeof window !== 'undefined') {
  window.addEventListener('load', setupSmartPrefetching);
}

export default {
  createOptimizedLazyComponent,
  createHighPriorityComponent,
  createMediumPriorityComponent,
  createLowPriorityComponent,
  createRouteComponent,
  prefetchComponent,
  prefetchRouteComponents,
  setupSmartPrefetching
};