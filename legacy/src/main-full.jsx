import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/sidebar.css'

// Simple development logger
const devLog = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
}

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

devLog.info('Starting Sentia Manufacturing Dashboard (Full App, No Auth)...')
devLog.info('Environment:', import.meta.env.MODE)
devLog.info('Base URL:', import.meta.env.BASE_URL)

// Add global error handler for debugging
window.addEventListener('error', (event) => {
  devLog.error('Global error:', {
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno
  })
})

window.addEventListener('unhandledrejection', (event) => {
  devLog.error('Unhandled promise rejection:', event.reason)
})

// Render app without Clerk authentication
const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <Suspense fallback={null}>
    <App />
  </Suspense>
)

devLog.info('Sentia Manufacturing Dashboard rendered successfully (No Auth Mode)')
