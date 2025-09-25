import { useCallback, useEffect, useMemo, useState } from 'react'

import { AuthContext } from '../hooks/useAuth.js'

const STORAGE_KEY = 'sentia-mock-auth-v1'

const DEFAULT_USER = {
  id: 'sentia-ops-demo',
  email: 'ops@sentia-demo.com',
  displayName: 'Sentia Operations',
  role: 'admin',
  permissions: ['dashboard.read', 'working-capital.read', 'inventory.read', 'production.read']
}

const readInitialState = () => {
  if (typeof window === 'undefined') {
    return { user: DEFAULT_USER, isAuthenticated: true }
  }

  try {
    const cached = window.localStorage.getItem(STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed && typeof parsed === 'object') {
        return {
          user: parsed.user || DEFAULT_USER,
          isAuthenticated: Boolean(parsed.isAuthenticated)
        }
      }
    }
  } catch (_error) {
    // Ignore storage errors in mock mode
  }

  return { user: DEFAULT_USER, isAuthenticated: true }
}

const persistState = (state) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (state.isAuthenticated && state.user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch (_error) {
    // Ignore storage errors in mock mode
  }
}

const MockAuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => readInitialState())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    persistState(session)
  }, [session])

  const login = useCallback(async (details = {}) => {
    const nextUser = {
      ...DEFAULT_USER,
      ...details,
      id: details.id || details.email || DEFAULT_USER.id,
      email: details.email || DEFAULT_USER.email,
      displayName: details.displayName || details.name || DEFAULT_USER.displayName,
      role: details.role || DEFAULT_USER.role
    }

    setSession({ user: nextUser, isAuthenticated: true })
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    setSession({ user: null, isAuthenticated: false })
  }, [])

  const getToken = useCallback(async () => 'mock-token', [])

  const value = useMemo(
    () => ({
      user: session.isAuthenticated ? session.user : null,
      role: session.isAuthenticated ? session.user?.role || 'operator' : 'guest',
      isAuthenticated: session.isAuthenticated,
      isLoaded,
      login,
      logout,
      getToken,
      authSource: 'mock'
    }),
    [getToken, isLoaded, login, logout, session]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default MockAuthProvider
