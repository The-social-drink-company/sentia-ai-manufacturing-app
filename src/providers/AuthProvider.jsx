import {
  ClerkLoaded,
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  useAuth as useClerkAuth,
  useUser,
} from '@clerk/clerk-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { logInfo, logWarn } from '../utils/logger.js'

const STORAGE_KEY = 'sentia-mock-auth-v1'
const DEFAULT_USER = {
  id: 'sentia-operator',
  firstName: 'Sentia',
  lastName: 'Operator',
  email: 'operator@sentia.local',
  role: 'manager',
}

const AuthContext = createContext(null)

const hasBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const shouldForceMock = () => import.meta.env?.VITE_FORCE_MOCK_AUTH === 'true'
const hasClerkConfig = () => {
  const publishableKey = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY
  return Boolean(publishableKey && publishableKey.length > 0 && publishableKey !== 'your-clerk-publishable-key-here')
}

const redirectToLogin = () => {
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    window.location.assign('/login')
  } else {
    logWarn('Attempted to redirect to /login outside of a browser environment')
  }
}

function loadStoredUser() {
  if (!hasBrowserStorage()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    return JSON.parse(raw)
  } catch (error) {
    logWarn('Unable to parse stored auth state', error)
    return null
  }
}

function persistUser(user) {
  if (!hasBrowserStorage()) {
    return
  }

  try {
    if (!user) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch (error) {
    logWarn('Unable to persist auth state', error)
  }
}

function MockAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (shouldForceMock()) {
      return DEFAULT_USER
    }

    return loadStoredUser()
  })

  useEffect(() => {
    if (!hasBrowserStorage()) {
      return
    }

    persistUser(user)
  }, [user])

  const signIn = useCallback((payload = {}) => {
    const nextUser = {
      ...DEFAULT_USER,
      ...payload,
      id: payload.id ?? DEFAULT_USER.id,
      role: payload.role ?? DEFAULT_USER.role,
    }

    logInfo('Mock sign-in complete', nextUser)
    setUser(nextUser)
    return Promise.resolve(nextUser)
  }, [])

  const signOut = useCallback(_() => {
    logInfo('Mock sign-out complete')
    setUser(null)
    return Promise.resolve()
  }, [])

  const value = useMemo(
    () => ({
      mode: 'mock',
      isAuthenticated: Boolean(user),
      user,
      signIn,
      signOut,
    }),
    [signIn, signOut, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
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

  const signOut = useCallback(async _() => {
    await clerkAuth.signOut()
  }, [clerkAuth])

  const signIn = useCallback(_() => {
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

function ClerkAuthProvider({ children }) {
  const publishableKey = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    logWarn('Clerk publishable key not found, falling back to mock authentication')
    return <MockAuthProvider>{children}</MockAuthProvider>
  }

  try {
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
  } catch (error) {
    logWarn('Clerk initialization failed, falling back to mock authentication', error)
    return <MockAuthProvider>{children}</MockAuthProvider>
  }
}

export function AuthProvider({ children }) {
  if (!shouldForceMock() && hasClerkConfig()) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>
  }

  return <MockAuthProvider>{children}</MockAuthProvider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }

  return context
}

export { AuthContext }




