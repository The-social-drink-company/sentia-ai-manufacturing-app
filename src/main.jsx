import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Try to load performance monitoring if available
try {
  import('./utils/performance.js').then(({ measureWebVitals, createPerformanceObserver, detectMemoryLeaks, scheduleIdleTask }) => {
    // Initialize performance monitoring
    const perfObserver = createPerformanceObserver();

    // Start memory leak detection in development
    if (import.meta.env.DEV) {
      detectMemoryLeaks();
    }

    // Measure and report web vitals
    if (measureWebVitals) {
      measureWebVitals((metric) => {
        // Log to console in development
        if (import.meta.env.DEV) {
          console.log('Web Vital:', metric);
        }
        
        // Send to analytics in production
        if (window.gtag) {
          window.gtag('event', metric.name, {
            value: Math.round(metric.value),
            metric_id: metric.id,
            metric_value: metric.value,
            metric_delta: metric.delta,
          });
        }
      });
    }

    // Schedule non-critical tasks for idle time
    if (scheduleIdleTask) {
      scheduleIdleTask(() => {
        // Prefetch commonly used routes
        import('./pages/Dashboard.jsx').catch(() => {});
        import('./pages/WorkingCapitalDashboard.jsx').catch(() => {});
      }, { timeout: 2000 });
    }
  }).catch(err => {
    console.warn('Performance monitoring not available:', err);
  });
} catch (err) {
  console.warn('Performance monitoring not available');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)