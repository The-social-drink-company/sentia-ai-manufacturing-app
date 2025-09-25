import { createContext, useContext } from 'react'

export const DEFAULT_AUTH_VALUE = {
  user: null,
  isAuthenticated: false,
  login: () => undefined,
  logout: () => undefined
}

export const AuthContext = createContext(DEFAULT_AUTH_VALUE)

export const useAuth = () => useContext(AuthContext)
