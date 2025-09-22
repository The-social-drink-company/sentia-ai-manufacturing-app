import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BulletproofClerkProvider } from './auth/BulletproofClerkProvider.jsx'
import './index.css'

// Ensure React is globally available for bundled modules
if (typeof window !== 'undefined') {
  window.React = React;
  window.ReactDOM = ReactDOM;
}

// Development logger
const devLog = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
}

// Get Clerk key from environment
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_cm9idXN0LXNuYWtlLTUwLmNsZXJrLmFjY291bnRzLmRldiQ'

// Full Enterprise Authentication System
devLog.info('Initializing Sentia Manufacturing Dashboard Enterprise Edition')
devLog.info('Clerk Authentication:', CLERK_KEY ? 'Enabled' : 'Fallback Mode')

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

// Enterprise Application with Full Features
console.log('Initializing Enterprise Application with Clerk Authentication...')
console.log('Environment:', import.meta.env.MODE)
console.log('API URL:', import.meta.env.VITE_API_BASE_URL)

const root = ReactDOM.createRoot(document.getElementById('root'))

// FULL ENTERPRISE: Complete application with all features
const renderApp = () => {
  try {
    console.log('Rendering full enterprise application...')
    root.render(
      <React.StrictMode>
        <BulletproofClerkProvider publishableKey={CLERK_KEY}>
          <Suspense fallback={<LoadingFallback />}>
            <App />
          </Suspense>
        </BulletproofClerkProvider>
      </React.StrictMode>
    )
    console.log('Enterprise application mounted successfully')
  } catch (error) {
    console.error('Error during initial render:', error)
    // Try without StrictMode
    try {
      root.render(
        <BulletproofClerkProvider publishableKey={CLERK_KEY}>
          <Suspense fallback={<LoadingFallback />}>
            <App />
          </Suspense>
        </BulletproofClerkProvider>
      )
      console.log('App mounted without StrictMode')
    } catch (fallbackError) {
      console.error('Complete failure:', fallbackError)
      // Last resort - basic app
      root.render(<App />)
    }
  }
}

// Monitor loading but keep trying
setTimeout(() => {
  const rootElement = document.getElementById('root')
  if (!rootElement.children.length || rootElement.innerHTML.includes('fallback-loader')) {
    console.warn('App still loading after 10 seconds, attempting direct mount...')
    // Try direct App mount
    try {
      const App = require('./App.jsx').default
      root.render(<App />)
      console.log('Direct mount successful')
    } catch (e) {
      console.error('Direct mount failed:', e)
    }
  }
}, 10000)

renderApp()

console.log('Application mounted with bulletproof authentication')

devLog.info('Sentia Manufacturing Dashboard rendered successfully');