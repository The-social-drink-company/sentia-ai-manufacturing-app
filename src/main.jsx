import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App-simple-environment.jsx'

// Global error handler
window.addEventListener('error', event => {
  console.error('[Global Error]', event.error)
  showErrorFallback('JavaScript Error', event.error.message)
})

window.addEventListener('unhandledrejection', event => {
  console.error('[Unhandled Promise Rejection]', event.reason)
  showErrorFallback('Promise Rejection', event.reason)
})

function showErrorFallback(title, message) {
  const root = document.getElementById('root')
  if (root && !root.innerHTML.includes('Configuration Error')) {
    root.innerHTML = `
      <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center; background: #0f172a; color: #e2e8f0; font-family: system-ui;">
        <div style="text-align: center; max-width: 600px; padding: 2rem;">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">${title}</h1>
          <p style="margin-bottom: 1rem;">${message}</p>
          <p style="font-size: 0.875rem; color: #94a3b8;">Check browser console for details.</p>
          <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Reload Page</button>
        </div>
      </div>
    `
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
