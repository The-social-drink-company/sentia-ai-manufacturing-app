import { createContext, useContext, useState, useMemo } from 'react'

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
})

export const useAuth = () => useContext(AuthContext)

const MockAuthProvider = ({ children }) => {
  const [user] = useState({
    id: 'demo-user',
    email: 'demo@sentia.com',
    role: 'admin',
    displayName: 'Demo User'
  })

  const value = useMemo(() => ({
    user,
    isAuthenticated: true,
    isLoaded: true,
    login: () => {},
    logout: () => {}
  }), [user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default MockAuthProvider