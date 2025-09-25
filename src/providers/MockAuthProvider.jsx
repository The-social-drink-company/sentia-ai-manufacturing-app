import { useState, useMemo, useCallback, useEffect } from 'react'
import { AuthContext } from '../hooks/useAuth.js'
import { logInfo, logWarn } from '../utils/logger.js'

const STORAGE_KEY = 'sentia-mock-auth-v1'

const DEFAULT_USER = {
  id: 'mock-admin-user',
  email: 'admin@sentia-demo.com',
  displayName: 'Sentia Admin',
  role: 'admin',
  permissions: [
    'dashboard.read',
    'dashboard.write',
    'working-capital.read',
    'working-capital.write',
    'inventory.read',
    'inventory.write',
    'production.read',
    'production.write',
    'settings.read',
    'settings.write'
  ],
  authProvider: 'mock'
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
  } catch (error) {
    logWarn('[MockAuthProvider] Failed to read cached session', error)
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
  } catch (error) {
    logWarn('[MockAuthProvider] Failed to persist session cache', error)
  }
}

const MockAuthProvider = ({ children }) => {
  const [state, setState] = useState(() => readInitialState())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Simulate async loading
    setTimeout(() => {
      setIsLoaded(true)
      logInfo('[MockAuthProvider] Mock auth loaded', { user: state.user?.email })
    }, 100)
  }, [])

  useEffect(() => {
    persistState(state)
  }, [state])

  const login = useCallback(async (details = {}) => {
    const nextUser = {
      ...DEFAULT_USER,
      ...details,
      id: details.id || details.email || DEFAULT_USER.id,
      email: details.email || DEFAULT_USER.email,
      displayName: details.displayName || details.name || DEFAULT_USER.displayName,
      role: details.role || DEFAULT_USER.role
    }

    logInfo('[MockAuthProvider] User signed in', { email: nextUser.email, role: nextUser.role })
    setState({ user: nextUser, isAuthenticated: true })
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    logInfo('[MockAuthProvider] User signed out')
    setState({ user: null, isAuthenticated: false })
  }, [])

  const getToken = useCallback(async () => 'mock-jwt-token', [])

  const value = useMemo(
    () => ({
      user: state.isAuthenticated ? state.user : null,
      isAuthenticated: state.isAuthenticated,
      isLoaded,
      login,
      logout,
      getToken,
      authSource: 'mock',
      role: state.user?.role || 'guest'
    }),
    [getToken, isLoaded, login, logout, state]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default MockAuthProvider