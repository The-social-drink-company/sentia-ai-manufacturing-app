import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const DEFAULT_USER = {
  id: 'sentia-ops-demo',
  email: 'ops@sentia-demo.com',
  role: 'admin',
  displayName: 'Sentia Operations'
}

const AuthContext = createContext({
  user: DEFAULT_USER,
  isAuthenticated: true,
  login: () => undefined,
  logout: () => undefined
})

export const useAuth = () => useContext(AuthContext)

export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_USER)

  const login = useCallback((nextUser) => {
    setUser(nextUser ?? DEFAULT_USER)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout
    }),
    [login, logout, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
