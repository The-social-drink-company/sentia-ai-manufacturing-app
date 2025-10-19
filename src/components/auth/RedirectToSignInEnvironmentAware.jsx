import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import LoadingScreen from '@/components/LoadingScreen'

const isDevelopmentMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

const RedirectToSignInEnvironmentAware = ({ redirectUrl, ...props }) => {
  const [RedirectToSignIn, setRedirectToSignIn] = useState(null)
  const [loading, setLoading] = useState(!isDevelopmentMode)

  useEffect(() => {
    if (isDevelopmentMode) {
      // Development mode - redirect to dashboard instead of sign-in
      console.log(
        '[RedirectToSignInEnvironmentAware] Development mode - redirecting to dashboard instead of sign-in'
      )
      setLoading(false)
      return
    }

    // Production mode - load real Clerk RedirectToSignIn
    const loadClerkRedirect = async () => {
      try {
        console.log('[RedirectToSignInEnvironmentAware] Loading Clerk RedirectToSignIn...')
        const clerkAuth = await import('@clerk/clerk-react')
        setRedirectToSignIn(() => clerkAuth.RedirectToSignIn)
      } catch (error) {
        console.error(
          '[RedirectToSignInEnvironmentAware] Failed to load Clerk RedirectToSignIn:',
          error
        )
        // Fallback to dashboard redirect if Clerk fails
        setRedirectToSignIn(null)
      } finally {
        setLoading(false)
      }
    }

    loadClerkRedirect()
  }, [])

  if (loading) {
    return <LoadingScreen message="Loading Authentication..." />
  }

  if (isDevelopmentMode || !RedirectToSignIn) {
    // Development mode - redirect to dashboard instead of sign-in
    console.log('[RedirectToSignInEnvironmentAware] Bypassing sign-in, redirecting to dashboard')
    return <Navigate to="/app/dashboard" replace />
  }

  // Production mode - use real Clerk RedirectToSignIn
  return <RedirectToSignIn redirectUrl={redirectUrl} {...props} />
}

export default RedirectToSignInEnvironmentAware
