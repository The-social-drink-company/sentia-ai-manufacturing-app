import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { measureWebVitals, createPerformanceObserver, detectMemoryLeaks, scheduleIdleTask } from './utils/performance.js'

// Initialize performance monitoring
const perfObserver = createPerformanceObserver();

// Start memory leak detection in development
if (process.env.NODE_ENV === 'development') {
  detectMemoryLeaks();
}

// Measure and report web vitals
measureWebVitals((metric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
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

// Schedule non-critical tasks for idle time
scheduleIdleTask(() => {
  // Prefetch commonly used routes
  import('./pages/Dashboard.jsx');
  import('./pages/WorkingCapitalDashboard.jsx');
}, { timeout: 2000 });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)