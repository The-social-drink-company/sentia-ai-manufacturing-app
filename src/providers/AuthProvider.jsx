import {
  ClerkLoaded,
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  useAuth as useClerkAuth,
  useUser,
} from '@clerk/clerk-react'
import { createContext, useCallback, useContext, useMemo } from 'react'

import { logError, logWarn } from '../utils/logger.js'

const AuthContext = createContext(null)

const redirectToLogin = () => {
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    window.location.assign('/login')
  } else {
    logWarn('Attempted to redirect to /login outside of a browser environment')
  }
}

function mapClerkUser(user) {
  if (!user) {
    return null
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? ''
  const role = user.publicMetadata?.role

  return {
    id: user.id,
    firstName: user.firstName ?? user.username ?? 'Sentia',
    lastName: user.lastName ?? '',
    email: primaryEmail,
    role: typeof role === 'string' ? role : 'viewer',
  }
}

function ClerkSessionProvider({ children }) {
  const { isLoaded, isSignedIn, user } = useUser()
  const clerkAuth = useClerkAuth()

  const signOut = useCallback(async () => {
    await clerkAuth.signOut()
  }, [clerkAuth])

  const signIn = useCallback(() => {
    redirectToLogin()
    return Promise.resolve()
  }, [])

  const value = useMemo(
    () => ({
      mode: 'clerk',
      isAuthenticated: isSignedIn,
      user: mapClerkUser(user),
      signIn,
      signOut,
    }),
    [isSignedIn, signIn, signOut, user]
  )

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sentia Manufacturing</h2>
          <p className="text-gray-600">Authenticating with production Clerk...</p>
          <div className="mt-4">
            <div className="inline-flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const signedOutValue = {
  mode: 'clerk',
  isAuthenticated: false,
  user: null,
  signIn: () => {
    redirectToLogin()
    return Promise.resolve()
  },
  signOut: () => Promise.resolve(),
}

function MissingClerkConfiguration() {
  logError('Clerk publishable key not found. Authentication cannot be initialized.')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Authentication Misconfigured</h1>
        <p className="text-gray-600 mb-6">
          Clerk environment keys are required for this application. Set `VITE_CLERK_PUBLISHABLE_KEY` and reload the page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
        >
          Reload after configuring Clerk
        </button>
      </div>
    </div>
  )
}

export function AuthProvider({ children }) {
  const publishableKey = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    return <MissingClerkConfiguration />
  }

  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/login">
      <SignedIn>
        <ClerkLoaded>
          <ClerkSessionProvider>{children}</ClerkSessionProvider>
        </ClerkLoaded>
      </SignedIn>
      <SignedOut>
        <AuthContext.Provider value={signedOutValue}>
          <RedirectToSignIn />
        </AuthContext.Provider>
      </SignedOut>
    </ClerkProvider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }

  return context
}

export { AuthContext }
