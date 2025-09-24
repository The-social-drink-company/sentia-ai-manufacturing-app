/**
 * Advanced 3D Component Lazy Loading
 * Implements viewport-based loading, memory management, and progressive enhancement
 * Target: 800kB bundle size reduction for FactoryDigitalTwin
 */

import React, { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

// 3D-specific loading states
const ThreeJSLoadingSpinner = () => (
  <div className="min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Loading 3D Visualization
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Initializing Three.js engine...
        </p>
      </div>
    </div>
  </div>
);

// Memory management utilities
const createMemoryManager = () => {
  const loadedComponents = new Set();
  const cleanupCallbacks = new Map();
  
  return {
    registerComponent: (componentId, cleanup) => {
      loadedComponents.add(componentId);
      if (cleanup) cleanupCallbacks.set(componentId, cleanup);
    },
    unregisterComponent: (componentId) => {
      loadedComponents.delete(componentId);
      const cleanup = cleanupCallbacks.get(componentId);
      if (cleanup) {
        cleanup();
        cleanupCallbacks.delete(componentId);
      }
    },
    cleanup: () => {
      cleanupCallbacks.forEach(cleanup => cleanup());
      cleanupCallbacks.clear();
      loadedComponents.clear();
    },
    getLoadedCount: () => loadedComponents.size
  };
};

// Global memory manager instance
const memoryManager = createMemoryManager();

// Enhanced 3D lazy loading with viewport detection
export const create3DLazyComponent = (importFn, options = {}) => {
  const {
    componentId,
    viewportMargin = '200px',
    enablePreload = false,
    maxMemoryUsage = 3, // Max 3 3D components loaded simultaneously
    fallback = <ThreeJSLoadingSpinner />,
    onLoad,
    onError,
    onUnload
  } = options;

  const LazyComponent = lazy(importFn);

  const Viewport3DComponent = (props) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [memoryWarning, setMemoryWarning] = useState(false);
    const ref = useRef();

    // Viewport intersection observer
    const { ref: viewportRef, inView, entry } = useInView({
      threshold: 0.1,
      rootMargin: viewportMargin,
      triggerOnce: false // Allow re-triggering for memory management
    });

    // Memory management
    useEffect(() => {
      if (inView && !isLoaded) {
        const currentLoaded = memoryManager.getLoadedCount();
        
        if (currentLoaded >= maxMemoryUsage) {
          setMemoryWarning(true);
          // Don't load if memory limit reached
          return;
        }

        setMemoryWarning(false);
        setIsLoaded(true);
        memoryManager.registerComponent(componentId);
        onLoad?.();
      } else if (!inView && isLoaded) {
        // Unload when out of viewport to save memory
        setIsLoaded(false);
        memoryManager.unregisterComponent(componentId);
        onUnload?.();
      }
    }, [inView, isLoaded, componentId, maxMemoryUsage, onLoad, onUnload]);

    // Error boundary for 3D components
    const handleError = useCallback((error) => {
      setHasError(true);
      memoryManager.unregisterComponent(componentId);
      onError?.(error);
    }, [componentId, onError]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        memoryManager.unregisterComponent(componentId);
      };
    }, [componentId]);

    if (hasError) {
      return (
        <div className="min-h-[400px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-red-600 dark:text-red-400 font-medium">
              3D Visualization Failed to Load
            </p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoaded(false);
              }}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (memoryWarning) {
      return (
        <div className="min-h-[400px] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-yellow-600 dark:text-yellow-400 font-medium">
              Memory Limit Reached
            </p>
            <p className="text-sm text-yellow-500 dark:text-yellow-400">
              Scroll to view this 3D component
            </p>
          </div>
        </div>
      );
    }

    return (
      <div ref={viewportRef} className="w-full">
        {isLoaded ? (
          <Suspense 0>
            <ErrorBoundary onError={handleError}>
              <LazyComponent {...props} />
            </ErrorBoundary>
          </Suspense>
        ) : (
          <div className="w-full h-full">
            {fallback}
            <div className="absolute inset-0 flex items-center justify-center opacity-0">
              <p className="text-xs text-gray-400">
                Scroll to load 3D visualization
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return Viewport3DComponent;
};

// Error boundary for 3D components
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Component Error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-red-600 dark:text-red-400 font-medium">
              3D Rendering Error
            </p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Progressive 3D enhancement - loads basic version first
export const createProgressive3DComponent = (basicImportFn, enhancedImportFn, options = {}) => {
  const {
    enableProgressive = true,
    progressiveDelay = 1000,
    ...otherOptions
  } = options;

  const BasicComponent = create3DLazyComponent(basicImportFn, {
    ...otherOptions,
    enablePreload: false
  });

  const EnhancedComponent = create3DLazyComponent(enhancedImportFn, {
    ...otherOptions,
    enablePreload: true
  });

  const ProgressiveComponent = (props) => {
    const [useEnhanced, setUseEnhanced] = useState(!enableProgressive);

    useEffect(() => {
      if (enableProgressive) {
        const timer = setTimeout(() => {
          setUseEnhanced(true);
        }, progressiveDelay);
        return () => clearTimeout(timer);
      }
    }, [enableProgressive, progressiveDelay]);

    return useEnhanced ? <EnhancedComponent {...props} /> : <BasicComponent {...props} />;
  };

  return ProgressiveComponent;
};

// Memory monitoring hook
export const use3DMemoryMonitor = () => {
  const [memoryStats, setMemoryStats] = useState({
    loadedComponents: 0,
    memoryUsage: 0,
    warnings: []
  });

  useEffect(() => {
    const updateStats = () => {
      setMemoryStats({
        loadedComponents: memoryManager.getLoadedCount(),
        memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0,
        warnings: []
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return memoryStats;
};

// Global cleanup utility
export const cleanup3DComponents = () => {
  memoryManager.cleanup();
};

export default {
  create3DLazyComponent,
  createProgressive3DComponent,
  use3DMemoryMonitor,
  cleanup3DComponents
};
