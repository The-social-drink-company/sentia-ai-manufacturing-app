import { createContext, useContext } from 'react'

const DEFAULT_AUTH_CONTEXT = {
  user: null,
  isAuthenticated: false,
  isLoaded: false,
  login: () => {},
  logout: async () => {},
  getToken: async () => null,
  authSource: 'unknown'
}

export const AuthContext = createContext(DEFAULT_AUTH_CONTEXT)

export const useAuth = () => useContext(AuthContext)
