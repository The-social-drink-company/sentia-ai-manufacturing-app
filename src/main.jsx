import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
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

// Clerk authentication is handled in App.jsx

devLog.info('Starting Sentia Manufacturing Dashboard...');
devLog.info('Environment:', import.meta.env.MODE);
devLog.info('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'Default');

// Add global error handler
window.addEventListener('error', (event) => {
  devLog.error('Global error:', {
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

window.addEventListener('unhandledrejection', (event) => {
  devLog.error('Unhandled promise rejection:', {
    reason: event.reason?.message || event.reason,
    stack: event.reason?.stack,
    promise: event.promise
  })
  
  // Prevent the default behavior (logging to console)
  if (event.reason?.message?.includes('background.bundle.js') || 
      event.reason?.toString?.()?.includes('background.bundle.js')) {
    devLog.warn('Suppressing browser extension error:', event.reason)
    event.preventDefault()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

devLog.info('Sentia Manufacturing Dashboard rendered successfully');