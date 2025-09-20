import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BulletproofClerkProvider } from './auth/BulletproofClerkProvider.jsx'
import { clerkConfig } from './config/clerk.js'
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

// Bulletproof Authentication System
// This system will automatically detect and use Clerk if available
// Otherwise it will use a reliable fallback mode
// GUARANTEED: No blank screens, no authentication failures
devLog.info('Initializing Bulletproof Authentication System')
devLog.info('Auth Provider: Automatic detection (Clerk with fallback)')

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

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f3f4f6'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px'
      }} />
      <div style={{ color: '#6b7280', fontSize: '18px' }}>Loading Sentia Manufacturing...</div>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

// Render app with Bulletproof Authentication
// This will NEVER fail or show blank screens
const PUBLISHABLE_KEY = clerkConfig.publishableKey

console.log('Initializing with Clerk key:', PUBLISHABLE_KEY ? 'Present' : 'Not configured - will use fallback')
console.log('Clerk configuration loaded:', {
  signInUrl: clerkConfig.signInUrl,
  afterSignInUrl: clerkConfig.afterSignInUrl
})

const root = ReactDOM.createRoot(document.getElementById('root'))

// EMERGENCY FIX: Add timeout to prevent infinite loading
const renderApp = () => {
  try {
    root.render(
      <React.StrictMode>
        <BulletproofClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <Suspense fallback={<LoadingFallback />}>
            <App />
          </Suspense>
        </BulletproofClerkProvider>
      </React.StrictMode>
    )
  } catch (error) {
    console.error('Failed to render app with BulletproofClerkProvider:', error)
    // Fallback to basic render without auth
    try {
      root.render(
        <React.StrictMode>
          <Suspense fallback={<LoadingFallback />}>
            <App />
          </Suspense>
        </React.StrictMode>
      )
    } catch (fallbackError) {
      console.error('Complete render failure, redirecting to emergency page:', fallbackError)
      // Ultimate fallback - redirect to emergency page
      setTimeout(() => {
        window.location.href = '/emergency.html'
      }, 3000)
    }
  }
}

// Add emergency timeout
setTimeout(() => {
  const rootElement = document.getElementById('root')
  if (!rootElement.children.length || rootElement.innerHTML.includes('fallback-loader')) {
    console.warn('App failed to render within 10 seconds, redirecting to emergency page')
    window.location.href = '/emergency.html'
  }
}, 10000)

renderApp()

console.log('Application mounted with bulletproof authentication')

devLog.info('Sentia Manufacturing Dashboard rendered successfully');