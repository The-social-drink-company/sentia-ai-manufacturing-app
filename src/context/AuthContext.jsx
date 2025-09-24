import { devLog } from '../lib/devLog.js';
import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useAuthRole } from '../hooks/useAuthRole.jsx'

// Auth state structure
const initialState = {
  // Core auth state
  isAuthenticated: false,
  isLoading: true,
  user: null,
  role: null,
  permissions: [],
  features: {},
  
  // Session management
  sessions: [],
  currentSessionId: null,
  
  // Security status
  securityStatus: null,
  passwordStatus: null,
  
  // UI state
  showSecurityAlert: false,
  securityMessage: null,
  
  // Errors
  error: null
}

// Action types
const AuthActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_SECURITY_STATUS: 'SET_SECURITY_STATUS', 
  SET_PASSWORD_STATUS: 'SET_PASSWORD_STATUS',
  SET_SESSIONS: 'SET_SESSIONS',
  SET_SECURITY_ALERT: 'SET_SECURITY_ALERT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGOUT: 'LOGOUT'
}

// Reducer function
function authReducer(state, action) {
  switch (action.type) {
    case AuthActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload }
      
    case AuthActionTypes.SET_USER:
      return {
        ...state,
        isAuthenticated: !!action.payload,
        user: action.payload?.user || null,
        role: action.payload?.role || null,
        permissions: action.payload?.permissions || [],
        features: action.payload?.features || {},
        isLoading: false
      }
      
    case AuthActionTypes.SET_SECURITY_STATUS:
      return { ...state, securityStatus: action.payload }
      
    case AuthActionTypes.SET_PASSWORD_STATUS:
      return { ...state, passwordStatus: action.payload }
      
    case AuthActionTypes.SET_SESSIONS:
      return { ...state, sessions: action.payload }
      
    case AuthActionTypes.SET_SECURITY_ALERT:
      return {
        ...state,
        showSecurityAlert: action.payload.show,
        securityMessage: action.payload.message
      }
      
    case AuthActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false }
      
    case AuthActionTypes.CLEAR_ERROR:
      return { ...state, error: null }
      
    case AuthActionTypes.LOGOUT:
      return { ...initialState, isLoading: false }
      
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Context provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const { getToken, signOut } = useAuth()
  const authRole = useAuthRole()

  // Sync with useAuthRole hook
  useEffect(() => {
    dispatch({
      type: AuthActionTypes.SET_USER,
      payload: authRole.isLoading ? null : {
        user: authRole.user,
        role: authRole.role,
        permissions: authRole.permissions,
        features: authRole.features
      }
    })
  }, [
    authRole.isLoading, 
    authRole.user, 
    authRole.role, 
    authRole.permissions, 
    authRole.features
  ])

  // Fetch security status
  const fetchSecurityStatus = async () => {
    try {
      const token = await getToken()
      if (!token) return

      const response = await fetch('/api/auth/security/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        dispatch({
          type: AuthActionTypes.SET_SECURITY_STATUS,
          payload: data.security
        })
        
        // Check for security alerts
        if (data.security.accountLocked) {
          dispatch({
            type: AuthActionTypes.SET_SECURITY_ALERT,
            payload: {
              show: true,
              message: 'Your account has been temporarily locked due to security reasons.'
            }
          })
        } else if (data.security.failedLoginCount > 2) {
          dispatch({
            type: AuthActionTypes.SET_SECURITY_ALERT,
            payload: {
              show: true,
              message: `${data.security.failedLoginCount} failed login attempts detected on your account.`
            }
          })
        }
      }
    } catch (error) {
      devLog.error('Failed to fetch security status:', error)
    }
  }

  // Fetch password status
  const fetchPasswordStatus = async () => {
    try {
      const token = await getToken()
      if (!token) return

      const response = await fetch('/api/auth/password/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        dispatch({
          type: AuthActionTypes.SET_PASSWORD_STATUS,
          payload: data.passwordAge
        })
        
        // Check for password expiry warning
        if (data.passwordAge.needsChange) {
          dispatch({
            type: AuthActionTypes.SET_SECURITY_ALERT,
            payload: {
              show: true,
              message: data.passwordAge.isExpired 
                ? 'Your password has expired and must be changed.'
                : `Your password will expire in ${data.passwordAge.daysUntilExpiry} days.`
            }
          })
        }
      }
    } catch (error) {
      devLog.error('Failed to fetch password status:', error)
    }
  }

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const token = await getToken()
      if (!token) return

      const response = await fetch('/api/auth/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        dispatch({
          type: AuthActionTypes.SET_SESSIONS,
          payload: data.sessions
        })
      }
    } catch (error) {
      devLog.error('Failed to fetch sessions:', error)
    }
  }

  // Initialize data when user is authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      fetchSecurityStatus()
      fetchPasswordStatus()
      fetchSessions()
    }
  }, [state.isAuthenticated, state.user])

  // Revoke session
  const revokeSession = async (sessionId) => {
    try {
      const token = await getToken()
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        // Update sessions list
        dispatch({
          type: AuthActionTypes.SET_SESSIONS,
          payload: state.sessions.filter(s => s.id !== sessionId)
        })
        return { success: true }
      } else {
        throw new Error('Failed to revoke session')
      }
    } catch (error) {
      dispatch({
        type: AuthActionTypes.SET_ERROR,
        payload: 'Failed to revoke session'
      })
      return { success: false, error: error.message }
    }
  }

  // Revoke all other sessions
  const revokeAllOtherSessions = async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/auth/sessions?except_current=true', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        // Refresh sessions
        await fetchSessions()
        return { success: true }
      } else {
        throw new Error('Failed to revoke sessions')
      }
    } catch (error) {
      dispatch({
        type: AuthActionTypes.SET_ERROR,
        payload: 'Failed to revoke sessions'
      })
      return { success: false, error: error.message }
    }
  }

  // Logout with session cleanup
  const logout = async () => {
    try {
      // Revoke all sessions
      const token = await getToken()
      if (token) {
        await fetch('/api/auth/sessions', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      
      // Clerk signout
      await signOut()
      
      dispatch({ type: AuthActionTypes.LOGOUT })
    } catch (error) {
      devLog.error('Logout failed:', error)
      // Force logout even if API calls fail
      dispatch({ type: AuthActionTypes.LOGOUT })
      await signOut()
    }
  }

  // Clear security alert
  const clearSecurityAlert = () => {
    dispatch({
      type: AuthActionTypes.SET_SECURITY_ALERT,
      payload: { show: false, message: null }
    })
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: AuthActionTypes.CLEAR_ERROR })
  }

  // Refresh all auth data
  const refreshAuthData = async () => {
    if (state.isAuthenticated) {
      await Promise.all([
        fetchSecurityStatus(),
        fetchPasswordStatus(), 
        fetchSessions()
      ])
    }
  }

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    revokeSession,
    revokeAllOtherSessions,
    logout,
    clearSecurityAlert,
    clearError,
    refreshAuthData,
    
    // Auth role methods (passthrough for convenience)
    hasRole: authRole.hasRole,
    hasPermission: authRole.hasPermission,
    hasFeature: authRole.hasFeature,
    isRoleAtLeast: authRole.isRoleAtLeast,
    canAccess: authRole.canAccess,
    getUserDisplayName: authRole.getUserDisplayName,
    getUserInitials: authRole.getUserInitials
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuthContext() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}

// Export action types for external use
export { AuthActionTypes }

export default AuthContext