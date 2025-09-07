import React from 'react'
import ReactDOM from 'react-dom/client'
import AppEmergency from './AppEmergency.jsx'
import './index.css'

// Performance monitoring with web-vitals
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'

// Import development logger
import { devLog } from './lib/devLog.js'

// Log web vitals for performance monitoring
function sendToAnalytics(metric) {
  devLog.info(`Web Vitals ${metric.name}:`, metric.value)
}

// Measure Core Web Vitals with correct exports (FID replaced with INP in web-vitals v5)
try {
  onCLS(sendToAnalytics)
  onINP(sendToAnalytics)  // Interaction to Next Paint (replaces FID)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
} catch (error) {
  devLog.warn('Web vitals measurement not available:', error.message)
}

devLog.info('Starting Sentia Manufacturing Dashboard...');
devLog.info('Environment:', import.meta.env.MODE);
devLog.info('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'Default');

// Add global error handler
window.addEventListener('error', (event) => {
  devLog.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  devLog.error('Unhandled promise rejection:', event.reason)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppEmergency />
  </React.StrictMode>,
)

devLog.info('Sentia Manufacturing Dashboard rendered successfully');

// Add global error catcher for debugging
window.onerror = function(msg, url, lineNo, columnNo, error) {
  devLog.error('Global error caught:', {
    message: msg,
    source: url,
    lineno: lineNo,
    colno: columnNo,
    error: error
  });
  return false;
};