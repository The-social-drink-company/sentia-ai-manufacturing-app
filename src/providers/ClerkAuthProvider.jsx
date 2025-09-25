import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react'
import { useCallback, useMemo } from 'react'
import { AuthContext } from '../hooks/useAuth.js'

const ClerkAuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser()
  const { getToken } = useClerkAuth()
  const { signOut } = useClerk()

  const login = useCallback(async () => {
    // Clerk handles login through its own UI components
    return null
  }, [])

  const logout = useCallback(async () => {
    await signOut()
  }, [signOut])

  const value = useMemo(() => {
    if (!isLoaded) {
      return {
        user: null,
        role: 'guest',
        isAuthenticated: false,
        isLoaded: false,
        login,
        logout,
        getToken,
        authSource: 'clerk'
      }
    }

    if (!isSignedIn || !user) {
      return {
        user: null,
        role: 'guest',
        isAuthenticated: false,
        isLoaded: true,
        login,
        logout,
        getToken,
        authSource: 'clerk'
      }
    }

    const role = user.publicMetadata?.role || 'operator'
    const permissions = user.publicMetadata?.permissions || []

    return {
      user: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        displayName: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || 'User',
        role,
        permissions,
        avatar: user.imageUrl,
        metadata: user.publicMetadata || {}
      },
      role,
      isAuthenticated: true,
      isLoaded: true,
      login,
      logout,
      getToken,
      authSource: 'clerk'
    }
  }, [getToken, isLoaded, isSignedIn, login, logout, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default ClerkAuthProvider