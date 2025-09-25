/**
 * SENTIA MANUFACTURING DASHBOARD - MAIN ENTRY WITH CLERK AUTHENTICATION
 */

import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ClerkAuthProvider from './services/auth/ClerkAuthProvider.jsx'
import { logDebug, logInfo, logError } from './utils/logger'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    logError('[main] Error boundary captured exception', { error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100'>
          <div className='max-w-md p-8 bg-white rounded-lg shadow-lg'>
            <div className='text-center'>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                Something went wrong
              </h2>
              <p className='text-gray-600 mb-4'>
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function mountApplication() {
  const container = document.getElementById('root')

  if (!container) {
    logError('[main] Root element not found; aborting mount')
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: system-ui;">
        <h1 style="color: #9b1c1c;">Application failed to load</h1>
        <p>Please refresh the page or contact support.</p>
      </div>
    `
    return
  }

  logInfo('[main] Mounting Sentia Manufacturing Dashboard with Clerk authentication')

  const root = createRoot(container)
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <ClerkAuthProvider>
          <App />
        </ClerkAuthProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApplication)
} else {
  mountApplication()
}

window.addEventListener('error', (event) => {
  logError('[main] Global error event', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  logError('[main] Unhandled promise rejection', event.reason)
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister()
          .then(() => logDebug('[main] Unregistered service worker', registration.scope))
          .catch(() => {})
      })
    })
    .catch(() => {})
}
