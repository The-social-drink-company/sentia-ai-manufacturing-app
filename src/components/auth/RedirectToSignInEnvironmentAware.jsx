import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
            Loading Authentication...
          </p>
        </div>
      </div>
    )
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
