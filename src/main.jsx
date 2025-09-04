import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

// Log web vitals for performance monitoring
function sendToAnalytics(metric) {
  console.log(`[Web Vitals] ${metric.name}:`, metric.value)
}

// Measure Core Web Vitals
getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)

console.log('🚀 Starting Sentia Manufacturing Dashboard with full features...');
console.log('Environment:', import.meta.env.MODE);
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'Default');
console.log('Clerk available:', !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

console.log('✅ Sentia Manufacturing Dashboard rendered successfully');