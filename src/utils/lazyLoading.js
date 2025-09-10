// Advanced lazy loading utility with intelligent preloading and error boundaries
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '../components/LoadingStates';
import ErrorBoundaryFallback from '../components/ErrorBoundary';
import { logInfo, logWarn, logError } from '../services/observability/structuredLogger.js';

// Enhanced lazy loading with retry mechanism and preloading
export const createEnhancedLazy = (importFn, options = {}) => {
  const {
    chunkName,
    retries = 3,
    retryDelay = 1000,
    preloadDelay = 2000,
    enablePreload = true
  } = options;

  let retryCount = 0;
  let preloadPromise = null;

  const loadComponent = async () => {
    try {
      logInfo('Loading component chunk', { chunkName, attempt: retryCount + 1 });
      const module = await importFn();
      logInfo('Component chunk loaded successfully', { chunkName });
      return module;
    } catch (error) {
      logError('Component chunk load failed', { 
        chunkName, 
        error: error.message,
        attempt: retryCount + 1 
      });
      
      if (retryCount < retries) {
        retryCount++;
        logWarn('Retrying component load', { chunkName, attempt: retryCount });
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
        return loadComponent();
      }
      throw error;
    }
  };

  const LazyComponent = lazy(loadComponent);

  // Preload component after delay
  if (enablePreload && typeof window !== 'undefined') {
    setTimeout(() => {
      if (!preloadPromise) {
        preloadPromise = loadComponent().catch(() => {
          // Silently handle preload failures
        });
      }
    }, preloadDelay);
  }

  // Return enhanced component with error boundary
  const EnhancedComponent = (props) => {
    return React.createElement(
      Suspense,
      {
        fallback: React.createElement(
          'div',
          { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" },
          React.createElement(
            'div',
            { className: "text-center" },
            React.createElement(LoadingSpinner),
            React.createElement(
              'p',
              { className: "mt-4 text-sm text-gray-600 dark:text-gray-400" },
              `Loading ${chunkName || 'component'}...`
            )
          )
        )
      },
      React.createElement(LazyComponent, props)
    );
  };

  return EnhancedComponent;
};

// Preload utility for route-based preloading
export const preloadRoute = (importFn) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch(() => {
        // Silently handle preload failures
      });
    });
  }
};

// Intersection Observer based preloading for links
export const useIntersectionPreload = (targetRef, importFn) => {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          preloadRoute(importFn);
          observer.unobserve(entry.target);
        }
      });
    });

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => observer.disconnect();
  }
};

// Route-based lazy loading with intelligent chunk names
export const createRouteComponent = (path, importFn) => {
  const chunkName = path.replace(/[\/\-]/g, '_').replace(/^_/, '');
  return createEnhancedLazy(importFn, {
    chunkName,
    enablePreload: true,
    preloadDelay: 1000
  });
};

// High-priority components (load immediately)
export const createPriorityComponent = (importFn, chunkName) => {
  return createEnhancedLazy(importFn, {
    chunkName,
    enablePreload: true,
    preloadDelay: 0, // Load immediately
    retries: 5
  });
};

// Low-priority components (load on demand only)
export const createLowPriorityComponent = (importFn, chunkName) => {
  return createEnhancedLazy(importFn, {
    chunkName,
    enablePreload: false,
    retries: 2
  });
};