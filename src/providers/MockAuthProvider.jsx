import PropTypes from 'prop-types'
import { useMemo, useState } from 'react'

import { AuthContext } from '../hooks/useAuth.js'

const DEFAULT_USER = {
  id: 'demo-user',
  email: 'demo@sentia.com',
  role: 'admin',
  displayName: 'Demo User'
}

const MockAuthProvider = ({ children }) => {
  const [user] = useState(DEFAULT_USER)

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: true,
      isLoaded: true,
      login: () => {},
      logout: () => {},
      getToken: async () => 'mock-token',
      authSource: 'mock'
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

MockAuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default MockAuthProvider
