
import performanceMonitor from '../services/performance/PerformanceMonitor.js';

if (typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor;
}

export { performanceMonitor };

