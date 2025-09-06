import { useEffect, useRef, useState, useCallback } from 'react';

// Performance monitoring hook
export const usePerformance = (componentName: string) => {
  const renderStart = useRef<number>(0);
  const [renderTime, setRenderTime] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    renderStart.current = performance.now();
  });

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - renderStart.current;
    setRenderTime(duration);

    if (duration > 16.67) { // More than one frame at 60fps
      console.warn(`Component ${componentName} took ${duration.toFixed(2)}ms to render`);
    }

    // Memory usage monitoring (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryUsage({
        used: Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100,
        total: Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100,
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
      });
    }
  });

  return { renderTime, memoryUsage };
};

// Web Vitals hook
export const useWebVitals = () => {
  const [vitals, setVitals] = useState<{
    CLS?: number;
    FID?: number;
    FCP?: number;
    LCP?: number;
    TTFB?: number;
  }>({});

  useEffect(() => {
    const loadWebVitals = async () => {
      try {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
        
        getCLS((metric) => setVitals(prev => ({ ...prev, CLS: metric.value })));
        getFID((metric) => setVitals(prev => ({ ...prev, FID: metric.value })));
        getFCP((metric) => setVitals(prev => ({ ...prev, FCP: metric.value })));
        getLCP((metric) => setVitals(prev => ({ ...prev, LCP: metric.value })));
        getTTFB((metric) => setVitals(prev => ({ ...prev, TTFB: metric.value })));
      } catch (error) {
        console.warn('Web Vitals not available:', error);
      }
    };

    loadWebVitals();
  }, []);

  return vitals;
};

// Network status hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('4g');

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionType(connection?.type || 'unknown');
        setEffectiveType(connection?.effectiveType || '4g');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    connectionType,
    effectiveType,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g'
  };
};

// Page visibility hook
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
};

// Idle detection hook
export const useIdleTimer = (timeout: number = 300000) => { // 5 minutes default
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    setIsIdle(false);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeout);
  }, [timeout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => resetTimer();
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    resetTimer(); // Initialize timer

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [resetTimer]);

  return { isIdle, resetTimer };
};

// Resource loading hook
export const useResourceTiming = () => {
  const [resourceMetrics, setResourceMetrics] = useState<PerformanceResourceTiming[]>([]);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      setResourceMetrics(prev => [...prev, ...entries]);
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  const getSlowResources = useCallback((threshold: number = 1000) => {
    return resourceMetrics.filter(resource => resource.duration > threshold);
  }, [resourceMetrics]);

  const getLargeResources = useCallback((threshold: number = 100000) => { // 100KB
    return resourceMetrics.filter(resource => resource.transferSize > threshold);
  }, [resourceMetrics]);

  return {
    resourceMetrics,
    getSlowResources,
    getLargeResources,
    totalResources: resourceMetrics.length,
    totalSize: resourceMetrics.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
    averageLoadTime: resourceMetrics.length > 0 
      ? resourceMetrics.reduce((sum, resource) => sum + resource.duration, 0) / resourceMetrics.length 
      : 0
  };
};

// Bundle size monitoring hook
export const useBundleAnalyzer = () => {
  const [bundleInfo, setBundleInfo] = useState<{
    chunks: string[];
    totalSize: number;
    gzippedSize: number;
  }>({
    chunks: [],
    totalSize: 0,
    gzippedSize: 0
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Simulate bundle analysis in development
      const analyzeBundle = async () => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const chunks = scripts.map(script => (script as HTMLScriptElement).src);
        
        setBundleInfo({
          chunks,
          totalSize: chunks.length * 50000, // Estimated
          gzippedSize: chunks.length * 15000 // Estimated
        });
      };

      analyzeBundle();
    }
  }, []);

  return bundleInfo;
};

// Long task monitoring hook
export const useLongTaskMonitoring = () => {
  const [longTasks, setLongTasks] = useState<PerformanceEntry[]>([]);

  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        setLongTasks(prev => [...prev, ...entries]);
        
        entries.forEach(entry => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms at ${entry.startTime.toFixed(2)}ms`);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Long task monitoring not supported');
      }

      return () => observer.disconnect();
    }
  }, []);

  return {
    longTasks,
    totalLongTasks: longTasks.length,
    averageDuration: longTasks.length > 0 
      ? longTasks.reduce((sum, task) => sum + task.duration, 0) / longTasks.length 
      : 0
  };
};