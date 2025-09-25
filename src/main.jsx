import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppFull from './App.jsx'
import AppSimple from './AppSimple.jsx'
import { logInfo, logError, logDebug } from './utils/logger.js'

const selectAppComponent = () => {
  if (import.meta.env?.VITE_USE_SIMPLE_APP === 'true') {
    logInfo('[main] Using simplified App for local development')
    return AppSimple
  }

  return AppFull
}

const mountApplication = () => {
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

  const App = selectAppComponent()
  logInfo('[main] Bootstrapping Sentia application')
  const root = createRoot(container)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    logDebug('[main] DOMContentLoaded event received')
    mountApplication()
  })
} else {
  mountApplication()
}

window.addEventListener('error', (event) => {
  logError('[main] Global error event', event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  logError('[main] Unhandled promise rejection', event.reason)
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => {
        registration
          .unregister()
          .then(() => logDebug('[main] Unregistered service worker', registration.scope))
          .catch(() => {})
      })
    })
    .catch(() => {})
}
