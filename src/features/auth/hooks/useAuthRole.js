import useEnvironmentAuth from '@/hooks/useEnvironmentAuth'

/**
 * Custom hook for role-based access control
 * Provides utility functions for checking user permissions
 */
export function useAuthRole() {
  const { isLoaded, isSignedIn, sessionClaims } = useEnvironmentAuth()

  const userRole = sessionClaims?.metadata?.role || 'viewer'

  const roleHierarchy = {
    viewer: 0,
    operator: 1,
    manager: 2,
    admin: 3,
  }

  const hasRole = requiredRole => {
    if (!isLoaded || !isSignedIn) return false
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
  }

  const hasPermission = permission => {
    if (!isLoaded || !isSignedIn) return false

    const permissions = sessionClaims?.metadata?.permissions || []
    return permissions.includes(permission)
  }

  const canAccess = resource => {
    const accessMap = {
      dashboard: ['viewer', 'operator', 'manager', 'admin'],
      workingCapital: ['manager', 'admin'],
      whatIf: ['manager', 'admin'],
      production: ['operator', 'manager', 'admin'],
      inventory: ['operator', 'manager', 'admin'],
      admin: ['admin'],
      reports: ['manager', 'admin'],
      settings: ['admin'],
    }

    const allowedRoles = accessMap[resource] || []
    return allowedRoles.includes(userRole)
  }

  return {
    userRole,
    hasRole,
    hasPermission,
    canAccess,
    isAdmin: userRole === 'admin',
    isManager: userRole === 'manager' || userRole === 'admin',
    isOperator: roleHierarchy[userRole] >= roleHierarchy.operator,
    isViewer: isSignedIn,
  }
}
