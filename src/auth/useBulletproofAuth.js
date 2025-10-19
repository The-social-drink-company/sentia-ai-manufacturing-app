import { useContext } from 'react'

import { AuthContext, FALLBACK_AUTH_STATE, getPermissionsForRole } from './bulletproofAuthContext'

export function useBulletproofAuth() {
  const contextAuth = useContext(AuthContext)

  if (contextAuth) {
    return contextAuth
  }

  return FALLBACK_AUTH_STATE
}

export function useAuthMode() {
  const auth = useBulletproofAuth()
  return auth.mode || 'unknown'
}

export function useAuthRole() {
  const auth = useBulletproofAuth()

  const role = auth.user?.publicMetadata?.role || 'viewer'
  const permissions = getPermissionsForRole(role)

  return {
    role,
    permissions,
    hasPermission: permission => permissions.includes(permission),
    isAdmin: role === 'admin',
    isManager: role === 'manager' || role === 'admin',
    isAuthenticated: auth.isSignedIn,
  }
}
