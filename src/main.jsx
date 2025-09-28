import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'
import AppSimple from './AppSimple.jsx'

// Clerk publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsuZmluYW5jZWZsby5haSQ'

console.log('Initializing Clerk with key:', PUBLISHABLE_KEY ? 'Found' : 'Missing')

// Emergency wrapper to handle Clerk failures
function AppWithFallback() {
  const [clerkError, setClerkError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Give Clerk 3 seconds to load
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    // Check if Clerk is responding
    const checkClerk = async () => {
      try {
        // Attempt to verify Clerk is loaded
        if (window.Clerk) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Clerk initialization error:', error)
        setClerkError(true)
        setLoading(false)
      }
    }

    checkClerk()
    return () => clearTimeout(timeout)
  }, [])

  // If Clerk fails, show simple app
  if (clerkError || (!loading && !window.Clerk)) {
    console.warn('Clerk not available, loading simple version')
    return <AppSimple />
  }

  // Show loading while checking Clerk
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading Sentia Manufacturing...</h2>
          <p className="text-gray-600">Initializing enterprise systems...</p>
        </div>
      </div>
    )
  }

  // Normal Clerk flow
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <App />
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithFallback />
  </StrictMode>,
)
