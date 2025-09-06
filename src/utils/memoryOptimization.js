
// Memory Optimization and Leak Detection for Sentia Dashboard
import { devLog } from '../lib/devLog.js';

class MemoryMonitor {
  constructor() {
    this.observers = [];
    this.memoryUsage = [];
    this.maxEntries = 100;
    this.isMonitoring = false;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor memory usage every 30 seconds
    this.memoryInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 30000);

    // Set up performance observers
    this.setupPerformanceObservers();
    
    devLog.log('Memory monitoring started');
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    devLog.log('Memory monitoring stopped');
  }

  recordMemoryUsage() {
    if (!window.performance || !window.performance.memory) return;

    const memory = window.performance.memory;
    const usage = {
      timestamp: Date.now(),
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };

    this.memoryUsage.push(usage);
    
    // Keep only recent entries
    if (this.memoryUsage.length > this.maxEntries) {
      this.memoryUsage = this.memoryUsage.slice(-this.maxEntries);
    }

    // Check for potential memory leaks
    this.detectMemoryLeaks();
  }

  detectMemoryLeaks() {
    if (this.memoryUsage.length < 10) return;

    const recent = this.memoryUsage.slice(-10);
    const trend = this.calculateTrend(recent.map(entry => entry.used));

    if (trend > 0.1) { // 10% increase trend
      devLog.warn('Potential memory leak detected:', {
        trend: trend * 100 + '%',
        currentUsage: this.formatBytes(recent[recent.length - 1].used),
        memoryHistory: recent
      });

      // Trigger garbage collection if available
      if (window.gc) {
        window.gc();
      }
    }
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    
    return (last - first) / first;
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  setupPerformanceObservers() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            devLog.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        }
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        devLog.log('Long task observer not supported');
      }
    }
  }

  getMemoryReport() {
    const current = this.memoryUsage[this.memoryUsage.length - 1];
    const oldest = this.memoryUsage[0];
    
    return {
      current: current ? {
        used: this.formatBytes(current.used),
        total: this.formatBytes(current.total),
        limit: this.formatBytes(current.limit),
        usagePercentage: Math.round((current.used / current.total) * 100)
      } : null,
      trend: oldest && current ? {
        change: this.formatBytes(current.used - oldest.used),
        percentage: Math.round(((current.used - oldest.used) / oldest.used) * 100)
      } : null,
      history: this.memoryUsage
    };
  }
}

// React hook for memory optimization
export const useMemoryOptimization = () => {
  const [memoryMonitor] = useState(() => new MemoryMonitor());

  useEffect(() => {
    memoryMonitor.startMonitoring();
    
    return () => {
      memoryMonitor.stopMonitoring();
    };
  }, [memoryMonitor]);

  return {
    getMemoryReport: () => memoryMonitor.getMemoryReport(),
    forceGarbageCollection: () => {
      if (window.gc) window.gc();
    }
  };
};

// Memory-optimized component wrapper
export const withMemoryOptimization = (Component) => {
  return memo(forwardRef((props, ref) => {
    const componentRef = useRef();
    const mountTimeRef = useRef(Date.now());

    useEffect(() => {
      // Component mounted
      const mountTime = mountTimeRef.current;
      
      return () => {
        // Component unmounting - cleanup check
        const lifetime = Date.now() - mountTime;
        if (lifetime > 300000) { // 5 minutes
          devLog.log(`Long-lived component unmounting: ${Component.name}, lifetime: ${lifetime}ms`);
        }
      };
    }, []);

    return <Component ref={ref || componentRef} {...props} />;
  }));
};

// Global memory monitor instance
const globalMemoryMonitor = new MemoryMonitor();

export { MemoryMonitor, globalMemoryMonitor };
