import PropTypes from 'prop-types'
import { useMemo, useState, useCallback } from 'react'

import { AuthContext } from '../hooks/useAuth.js'

const DEFAULT_USER = {
  id: 'demo-user',
  email: 'demo@sentia.com',
  role: 'admin',
  displayName: 'Demo User'
}

const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_USER)

  const login = useCallback(async () => {
    setUser(DEFAULT_USER)
    return { success: true }
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoaded: true,
      login,
      logout,
      getToken: async () => 'mock-token',
      authSource: 'mock',
      role: user?.role || 'viewer'
    }),
    [user, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

MockAuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default MockAuthProvider