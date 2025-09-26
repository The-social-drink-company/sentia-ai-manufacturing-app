/* eslint-disable react-refresh/only-export-components */
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

const shouldForceMock = () => import.meta.env?.VITE_FORCE_MOCK_AUTH === 'true'
const hasClerkConfig = () => Boolean(import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY)

function loadStoredUser() {
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

  const signOut = useCallback(() => {
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

  const signOut = useCallback(async () => {
    await clerkAuth.signOut()
  }, [clerkAuth])

  const signIn = useCallback(() => {
    window.location.assign('/login')
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
    return <div className="auth-loading">Loading account�</div>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const signedOutValue = {
  mode: 'clerk',
  isAuthenticated: false,
  user: null,
  signIn: () => {
    window.location.assign('/login')
    return Promise.resolve()
  },
  signOut: () => Promise.resolve(),
}

function ClerkAuthProvider({ children }) {
  const publishableKey = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY

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
