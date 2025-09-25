import { createContext, useContext, useEffect, useState } from 'react'
import { useClerk, useUser } from '@clerk/clerk-react'

const AuthContext = createContext(null)

export const ClerkAuthProvider = ({ children }) => {
  const { signOut } = useClerk()
  const { user, isLoaded, isSignedIn } = useUser()
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isLoaded: false,
    role: 'guest'
  })

  useEffect(() => {
    if (isLoaded) {
      setAuthState({
        user: user ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          displayName: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || '',
          role: user.publicMetadata?.role || 'viewer'
        } : null,
        isAuthenticated: !!isSignedIn,
        isLoaded: true,
        role: user?.publicMetadata?.role || 'guest'
      })
    }
  }, [user, isLoaded, isSignedIn])

  const logout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const value = {
    ...authState,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within ClerkAuthProvider')
  }
  return context
}