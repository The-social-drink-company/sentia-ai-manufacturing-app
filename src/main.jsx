import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import './index.css'
import { AuthProvider } from './providers/AuthProvider.jsx'
import { logInfo, logError, logDebug } from './utils/logger.js'

const mount = () => {
  const container = document.getElementById('root')

  if (!container) {
    logError('Root element not found; aborting mount')
    return
  }

  logInfo('Bootstrapping Sentia Manufacturing Dashboard')
  createRoot(container).render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  )
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    logDebug('DOMContentLoaded received')
    mount()
  })
} else {
  mount()
}

window.addEventListener('error', event => {
  logError('Global error', event.error || event.message)
})

window.addEventListener('unhandledrejection', event => {
  logError('Unhandled rejection', event.reason)
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(registrations => {
      registrations.forEach(registration => {
        registration.unregister().catch(() => {})
      })
    })
    .catch(() => {})
}
