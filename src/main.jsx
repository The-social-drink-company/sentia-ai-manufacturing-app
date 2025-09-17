import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'
import './styles/sidebar.css'

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

// Get Clerk publishable key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Log Clerk configuration status
if (!clerkPubKey) {
  console.error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables')
  devLog.warn('Clerk authentication disabled - running in guest mode')
} else {
  devLog.info('Clerk configured successfully')
  devLog.info('Clerk key prefix:', clerkPubKey.substring(0, 20) + '...')
}

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

// Render app with ClerkProvider if key exists, otherwise render directly
const root = ReactDOM.createRoot(document.getElementById('root'))

if (clerkPubKey) {
  root.render(
    <ClerkProvider
      publishableKey={clerkPubKey}
      afterSignOutUrl="/"
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
          card: 'shadow-lg'
        }
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </ClerkProvider>
  )
} else {
  // Render without Clerk if no key is provided
  root.render(
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  )
}

devLog.info('Sentia Manufacturing Dashboard rendered successfully');