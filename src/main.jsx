import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App-enterprise.jsx'

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error)
  showErrorFallback('JavaScript Error', event.error.message)
})

window.addEventListener('unhandledrejection', (event) => {
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

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// More robust Clerk key validation
if (!publishableKey || publishableKey.length < 20) {
  console.error('[Clerk] Invalid VITE_CLERK_PUBLISHABLE_KEY:', publishableKey)
  console.log('[Clerk] Available environment variables:', Object.keys(import.meta.env))

  showErrorFallback('Authentication Configuration Error', 'Invalid or missing Clerk publishable key. Please check environment variables.')
  throw new Error('Invalid VITE_CLERK_PUBLISHABLE_KEY')
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// No initial loading - let React render immediately

console.log('[Clerk] Initializing with publishable key:', `${publishableKey.substring(0, 20)}...`)
console.log('[Clerk] Full key length:', publishableKey.length)
console.log('[Clerk] Key ends with:', publishableKey.slice(-10))

createRoot(rootElement).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      navigate={(to) => {
        window.location.href = to
      }}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#2563eb',
          colorTextOnPrimaryBackground: '#ffffff',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#1f2937',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: '0.5rem'
        },
        elements: {
          card: {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            border: '1px solid #e5e7eb'
          },
          headerTitle: {
            fontSize: '1.5rem',
            fontWeight: '600'
          },
          headerSubtitle: {
            color: '#6b7280'
          }
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
)
