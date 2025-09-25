import React, { useState, useEffect, useRef } from 'react'
import { SignIn, useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation, Link } from 'react-router-dom'

class ErrorBoundaryWrapper extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SignIn Error]:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

const LoadingShell = ({ errorMessage, onRetry }) => (
  <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4'>
    <div className='bg-white p-8 rounded-lg shadow-xl max-w-md w-full'>
      <div className='text-center'>
        <div className='mb-4'>
          <div className='w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto'>
            <span className='text-white text-2xl font-bold'>S</span>
          </div>
        </div>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Sentia Manufacturing</h1>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2' />
          <div className='h-4 bg-gray-200 rounded w-1/2 mx-auto' />
        </div>
        {errorMessage ? (
          <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm'>
            <p>{errorMessage}</p>
            <button
              type='button'
              onClick={onRetry}
              className='block w-full mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700'
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </div>
  </div>
)

const SignInFallback = () => (
  <div className='bg-white p-8 rounded-lg shadow-xl'>
    <div className='text-center'>
      <div className='text-red-500 text-4xl mb-4' aria-hidden='true'>!</div>
      <h2 className='text-xl font-bold text-gray-900 mb-2'>Sign In Error</h2>
      <p className='text-gray-600 mb-4'>Unable to load sign-in form. Please try again.</p>
      <button
        type='button'
        onClick={() => window.location.reload()}
        className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
      >
        Reload Page
      </button>
    </div>
  </div>
)

const LogoHeader = () => (
  <div className='text-center mb-8'>
    <div className='mb-4'>
      <div className='w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto'>
        <span className='text-white text-3xl font-bold'>S</span>
      </div>
    </div>
    <h1 className='text-3xl font-bold text-gray-900'>Welcome Back</h1>
    <p className='text-gray-600 mt-2'>Sign in to Sentia Manufacturing Dashboard</p>
  </div>
)

const parseRedirect = (location) => {
  const pathname = location?.state?.from?.pathname
  if (pathname && typeof pathname === 'string') {
    return pathname
  }
  return '/dashboard'
}

const useClerkReadiness = ({ onTimeout }) => {
  const [isReady, setIsReady] = useState(false)
  const timeoutTriggeredRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsReady(false)
      return undefined
    }

    const checkClerkReady = () => {
      const clerk = window.Clerk
      if (clerk && (clerk.isReady?.() || clerk.loaded)) {
        setIsReady(true)
        return true
      }
      return false
    }

    if (checkClerkReady()) {
      return undefined
    }

    const interval = window.setInterval(() => {
      if (checkClerkReady()) {
        window.clearInterval(interval)
        window.clearTimeout(timeoutId)
      }
    }, 100)

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(interval)
      if (!timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true
        onTimeout?.()
      }
    }, 10_000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeoutId)
    }
  }, [onTimeout])

  return isReady
}

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()
  const from = parseRedirect(location)
  const [signInError, setSignInError] = useState(null)

  const isClerkReady = useClerkReadiness({
    onTimeout: () => setSignInError('Authentication service is taking longer than expected')
  })

  useEffect(() => {
    if (isClerkReady && signInError) {
      setSignInError(null)
    }
  }, [isClerkReady, signInError])

  if (isLoaded && isSignedIn) {
    return <Navigate to={from} replace />
  }

  if (!isLoaded || !isClerkReady) {
    return <LoadingShell errorMessage={signInError} onRetry={() => window.location.reload()} />
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <LogoHeader />
        <ErrorBoundaryWrapper fallback={<SignInFallback />}>
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-xl',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border border-gray-300 hover:border-blue-500 transition-colors',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
                footerActionLink: 'text-blue-600 hover:text-blue-700',
                identityPreviewEditButton: 'text-blue-600 hover:text-blue-700',
                formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                formFieldLabel: 'text-gray-700',
                identityPreviewText: 'text-gray-700',
                formHeaderTitle: 'text-2xl font-bold',
                alertText: 'text-red-600',
                formFieldSuccessText: 'text-green-600'
              },
              layout: {
                socialButtonsPlacement: 'bottom',
                socialButtonsVariant: 'blockButton'
              }
            }}
            redirectUrl={from}
            afterSignInUrl={from}
            signUpUrl='/sign-up'
          />
        </ErrorBoundaryWrapper>
        <div className='mt-6 text-center'>
          <p className='text-sm text-gray-600'>
            Don&apos;t have an account?{' '}
            <Link to='/sign-up' className='text-blue-600 hover:text-blue-700 font-medium'>
              Sign up
            </Link>
          </p>
          <p className='text-sm text-gray-500 mt-4'>
            <Link to='/' className='hover:text-gray-700'>
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
