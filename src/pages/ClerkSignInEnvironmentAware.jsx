import { useEffect, useState } from 'react'
import { useLocation, Navigate } from 'react-router-dom'

const isDevelopmentMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

const ClerkSignInEnvironmentAware = () => {
  const location = useLocation()
  const [authComponents, setAuthComponents] = useState(null)
  const [loading, setLoading] = useState(!isDevelopmentMode)

  // In development mode, redirect immediately to dashboard
  if (isDevelopmentMode) {
    console.log('[Development] Sign-in bypassed, redirecting to dashboard')
    return <Navigate to="/app/dashboard" replace />
  }

  useEffect(() => {
    const loadAuthComponents = async () => {
      try {
        // Only load Clerk components in production mode
        const clerkAuth = await import('@clerk/clerk-react')
        setAuthComponents({
          SignIn: clerkAuth.SignIn,
          SignUp: clerkAuth.SignUp,
        })
      } catch (error) {
        console.error('[ClerkSignIn] Failed to load Clerk components:', error)
        // Fallback to development mode if Clerk fails to load
        setAuthComponents(null)
      } finally {
        setLoading(false)
      }
    }

    if (!isDevelopmentMode) {
      loadAuthComponents()
    }
  }, [])

  const isSignUp = location.pathname === '/app/sign-up'

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

  if (!authComponents) {
    // Fallback if Clerk components failed to load
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Authentication Unavailable
          </h2>
          <p className="text-gray-600 text-center mb-4">
            Authentication system is not available. Please try again later.
          </p>
          <button
            onClick={() => (window.location.href = '/app/dashboard')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const { SignIn, SignUp } = authComponents

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white lg:flex-row">
      <div className="flex flex-1 flex-col justify-center space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10">
        <p className="text-xs uppercase tracking-[0.4em] text-sky-400">Sentia Manufacturing</p>
        <h1 className="text-4xl font-semibold tracking-tight">Welcome back</h1>
        <p className="max-w-md text-sm text-slate-300">
          Secure access to the manufacturing command centre. Review liquidity, production, and
          quality metrics with AI-powered guidance.
        </p>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>• Real-time working capital analytics</li>
          <li>• Production and quality alerts in one place</li>
          <li>• AI assistant for scenario planning</li>
        </ul>
      </div>
      <div className="flex flex-1 items-center justify-center bg-slate-900/80 p-10">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/90 p-6 shadow-2xl">
          {isSignUp ? <SignUp /> : <SignIn />}
        </div>
      </div>
    </div>
  )
}

export default ClerkSignInEnvironmentAware
