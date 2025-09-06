/**
 * Performance optimization hooks and utilities
 * Provides memoization, debouncing, throttling, and performance monitoring
 */

import { 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useMemo,
  useLayoutEffect
} from 'react';

/**
 * Debounce hook for input handlers
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook for scroll/resize handlers
 */
export const useThrottle = (callback, delay = 100) => {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef();

  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= delay) {
      callback(...args);
      lastRun.current = now;
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - timeSinceLastRun);
    }
  }, [callback, delay]);
};

/**
 * Lazy initial state hook
 */
export const useLazyInitialState = (expensiveOperation) => {
  const [state, setState] = useState(() => {
    // Only run expensive operation once on mount
    return expensiveOperation();
  });

  return [state, setState];
};

/**
 * Performance monitor hook
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const renderTime = useRef(0);
  const mounted = useRef(Date.now());

  useLayoutEffect(() => {
    renderCount.current++;
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      renderTime.current = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        if (renderTime.current > 16) { // Longer than one frame (60fps)
          console.warn(
            `[Performance] ${componentName} took ${renderTime.current.toFixed(2)}ms to render (render #${renderCount.current})`
          );
        }
      }
    };
  });

  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === 'development') {
        const lifetime = Date.now() - mounted.current;
        console.log(
          `[Performance] ${componentName} unmounted after ${lifetime}ms and ${renderCount.current} renders`
        );
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    renderTime: renderTime.current
  };
};

/**
 * Virtual scrolling hook for large lists
 */
export const useVirtualScroll = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 3
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = useMemo(() => {
    return Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  }, [scrollTop, itemHeight, overscan]);

  const endIndex = useMemo(() => {
    return Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex
  };
};

/**
 * Intersection observer hook for lazy loading
 */
export const useIntersectionObserver = ({
  threshold = 0,
  rootMargin = '0px',
  triggerOnce = false
} = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    if (!targetRef.current) return;
    if (triggerOnce && hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting;
        setIsIntersecting(intersecting);
        
        if (intersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(targetRef.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasIntersected]);

  return { ref: targetRef, isIntersecting, hasIntersected };
};

/**
 * Progressive image loading hook
 */
export const useProgressiveImage = (lowQualitySrc, highQualitySrc) => {
  const [src, setSrc] = useState(lowQualitySrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSrc(lowQualitySrc);
    setIsLoading(true);

    const img = new Image();
    img.src = highQualitySrc;
    
    img.onload = () => {
      setSrc(highQualitySrc);
      setIsLoading(false);
    };

    return () => {
      img.onload = null;
    };
  }, [lowQualitySrc, highQualitySrc]);

  return { src, isLoading, blur: isLoading };
};

/**
 * Web Worker hook for expensive computations
 */
export const useWebWorker = (workerFunction) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const run = useCallback((data) => {
    setLoading(true);
    setError(null);

    const blob = new Blob(
      [`self.onmessage = function(e) { 
        self.postMessage((${workerFunction.toString()})(e.data)); 
      }`],
      { type: 'application/javascript' }
    );

    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e) => {
      setResult(e.data);
      setLoading(false);
      URL.revokeObjectURL(workerUrl);
    };

    workerRef.current.onerror = (e) => {
      setError(e);
      setLoading(false);
      URL.revokeObjectURL(workerUrl);
    };

    workerRef.current.postMessage(data);
  }, [workerFunction]);

  return { result, error, loading, run };
};

/**
 * Memoized event handler hook
 */
export const useMemoizedHandler = (handler, deps = []) => {
  const handlerRef = useRef(handler);

  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  return useCallback((...args) => {
    return handlerRef.current(...args);
  }, deps);
};

/**
 * Request idle callback hook for non-critical updates
 */
export const useIdleCallback = (callback, options = {}) => {
  const callbackRef = useRef(callback);
  const idleCallbackId = useRef(null);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      idleCallbackId.current = window.requestIdleCallback(
        () => callbackRef.current(),
        options
      );
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      const timeoutId = setTimeout(() => callbackRef.current(), 1);
      idleCallbackId.current = timeoutId;
    }

    return () => {
      if ('cancelIdleCallback' in window && idleCallbackId.current) {
        window.cancelIdleCallback(idleCallbackId.current);
      } else if (idleCallbackId.current) {
        clearTimeout(idleCallbackId.current);
      }
    };
  }, [options]);
};

/**
 * Memory cache hook with size limit
 */
export const useMemoryCache = (maxSize = 50) => {
  const cache = useRef(new Map());
  const accessOrder = useRef([]);

  const get = useCallback((key) => {
    if (cache.current.has(key)) {
      // Move to end (most recently used)
      const index = accessOrder.current.indexOf(key);
      if (index > -1) {
        accessOrder.current.splice(index, 1);
      }
      accessOrder.current.push(key);
      return cache.current.get(key);
    }
    return null;
  }, []);

  const set = useCallback((key, value) => {
    // Remove oldest if at max size
    if (cache.current.size >= maxSize && !cache.current.has(key)) {
      const oldest = accessOrder.current.shift();
      cache.current.delete(oldest);
    }

    cache.current.set(key, value);
    
    // Update access order
    const index = accessOrder.current.indexOf(key);
    if (index > -1) {
      accessOrder.current.splice(index, 1);
    }
    accessOrder.current.push(key);
  }, [maxSize]);

  const clear = useCallback(() => {
    cache.current.clear();
    accessOrder.current = [];
  }, []);

  return { get, set, clear, size: cache.current.size };
};

/**
 * Batch update hook to reduce re-renders
 */
export const useBatchUpdate = (initialState = {}) => {
  const [state, setState] = useState(initialState);
  const pendingUpdates = useRef({});
  const timeoutRef = useRef();

  const batchUpdate = useCallback((updates) => {
    Object.assign(pendingUpdates.current, updates);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        ...pendingUpdates.current
      }));
      pendingUpdates.current = {};
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate];
};

// Export all hooks
export default {
  useDebounce,
  useThrottle,
  useLazyInitialState,
  usePerformanceMonitor,
  useVirtualScroll,
  useIntersectionObserver,
  useProgressiveImage,
  useWebWorker,
  useMemoizedHandler,
  useIdleCallback,
  useMemoryCache,
  useBatchUpdate
};