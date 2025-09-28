import { ClerkProvider } from '@clerk/clerk-react'
import App from './App-enterprise.jsx'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const ClerkApp = () => {
  if (!publishableKey || publishableKey.length < 20) {
    console.error('[Clerk] Invalid VITE_CLERK_PUBLISHABLE_KEY:', publishableKey)
    throw new Error('Invalid VITE_CLERK_PUBLISHABLE_KEY')
  }

  if (window.location.pathname === '/') {
    window.history.replaceState({}, '', '/sign-in')
  }

  console.log('[Clerk] Initializing with publishable key:', `${publishableKey.substring(0, 20)}...`)
  console.log('[Clerk] Full key length:', publishableKey.length)
  console.log('[Clerk] Key ends with:', publishableKey.slice(-10))

  return (
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
  )
}

export default ClerkApp
