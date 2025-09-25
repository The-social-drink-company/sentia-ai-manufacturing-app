import { useEffect, useState, useCallback } from 'react'
import { useClerk, useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { AuthContext } from '../hooks/useAuth.js'
import { logInfo, logWarn } from '../utils/logger.js'

export const ClerkAuthProvider = ({ children }) => {
  const { signOut } = useClerk()
  const { user, isLoaded, isSignedIn } = useUser()
  const { getToken } = useClerkAuth()
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isLoaded: false,
    role: 'guest'
  })

  useEffect(() => {
    if (isLoaded) {
      const userProfile = user ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        displayName: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || '',
        role: user.publicMetadata?.role || 'viewer',
        permissions: user.publicMetadata?.permissions || []
      } : null

      setAuthState({
        user: userProfile,
        isAuthenticated: !!isSignedIn,
        isLoaded: true,
        role: user?.publicMetadata?.role || 'guest'
      })

      if (isSignedIn) {
        logInfo('[ClerkAuthProvider] User authenticated', { userId: user.id, role: user.publicMetadata?.role })
      }
    }
  }, [user, isLoaded, isSignedIn])

  const logout = useCallback(async () => {
    try {
      await signOut()
      logInfo('[ClerkAuthProvider] User signed out')
    } catch (error) {
      logWarn('[ClerkAuthProvider] Logout error', error)
    }
  }, [signOut])

  const login = useCallback(async (redirectTo = '/dashboard') => {
    logInfo('[ClerkAuthProvider] Login initiated, redirecting to Clerk sign-in')
    // Login is handled by Clerk's SignIn component
    return { redirectTo }
  }, [])

  const value = {
    ...authState,
    login,
    logout,
    getToken,
    authSource: 'clerk'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default ClerkAuthProvider