import React, { useEffect, useState, useRef } from 'react'
import { SignUp, useAuth } from '@clerk/clerk-react'
import { Link, Navigate, useLocation } from 'react-router-dom'

const LoadingShell = ({ errorMessage, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
    <div className="bg-slate-900/60 backdrop-blur-sm p-8 rounded-xl shadow-xl max-w-md w-full border border-slate-800">
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
            <span className="text-emerald-300 text-2xl font-semibold">S</span>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Sentia Manufacturing</h1>
        <p className="text-sm text-slate-300">Preparing secure account creation…</p>
        {errorMessage ? (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-left text-sm text-rose-200">
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 w-full rounded bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </div>
  </div>
)

const useClerkReadiness = ({ onTimeout }) => {
  const [isReady, setIsReady] = useState(false)
  const timeoutTriggeredRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const checkReady = () => {
      const clerk = window.Clerk
      if (clerk && (clerk.isReady?.() || clerk.loaded)) {
        setIsReady(true)
        return true
      }
      return false
    }

    if (checkReady()) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      if (checkReady()) {
        window.clearInterval(intervalId)
        window.clearTimeout(timeoutId)
      }
    }, 100)

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId)
      if (!timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true
        onTimeout?.()
      }
    }, 10_000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [onTimeout])

  return isReady
}

const SignupPage = () => {
  const location = useLocation()
  const { isLoaded, isSignedIn } = useAuth()
  const [loadError, setLoadError] = useState(null)

  const redirectTo = location?.state?.from?.pathname || '/dashboard'

  const isClerkReady = useClerkReadiness({
    onTimeout: () => setLoadError('Account service is taking longer than expected to initialise')
  })

  useEffect(() => {
    if (isClerkReady && loadError) {
      setLoadError(null)
    }
  }, [isClerkReady, loadError])

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectTo} replace />
  }

  if (!isLoaded || !isClerkReady) {
    return <LoadingShell errorMessage={loadError} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center space-y-3">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/40">
            <span className="text-emerald-300 text-3xl font-semibold">S</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-white">Request your Sentia account</h1>
            <p className="text-sm text-slate-300">Create secure access to the manufacturing intelligence platform.</p>
          </div>
        </header>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-transparent shadow-none border-0 p-0',
                formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-400 focus:ring-2 focus:ring-emerald-300',
                footerActionLink: 'text-emerald-300 hover:text-emerald-200',
                formFieldLabel: 'text-slate-200',
                formFieldInput: 'bg-slate-950/60 border-slate-700 text-slate-100 focus:border-emerald-400 focus:ring-emerald-400',
                headerTitle: 'text-2xl font-semibold text-white',
                headerSubtitle: 'text-slate-300',
                socialButtonsBlockButton: 'border border-slate-700 hover:border-emerald-400 text-slate-100'
              }
            }}
            redirectUrl={redirectTo}
            afterSignUpUrl={redirectTo}
            signInUrl="/login"
          />
        </div>
        <p className="text-center text-sm text-slate-400">
          Already have access?{' '}
          <Link to="/login" className="text-emerald-300 hover:text-emerald-200 font-medium">
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignupPage
