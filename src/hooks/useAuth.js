import { createContext, useContext } from 'react'

// Unified AuthContext that works with both Clerk and Mock providers
export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoaded: false,
  login: async () => {},
  logout: async () => {},
  getToken: async () => null,
  authSource: 'mock', // 'clerk' or 'mock'
  role: 'guest'
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider (ClerkAuthProvider or MockAuthProvider)')
  }
  return context
}