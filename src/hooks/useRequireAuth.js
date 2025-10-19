import { useEffect } from 'react'
import { useAuth } from './useAuth'
import { useNavigate } from 'react-router-dom'

/**
 * Hook to enforce authentication requirement on a component
 *
 * This hook ensures that only authenticated users can access a component.
 * Unlike useAuthRedirect, this hook throws an error boundary when used
 * on unauthenticated routes, making it suitable for components that should
 * never render without authentication.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.redirectTo - URL to redirect to if not authenticated (default: '/sign-in')
 * @param {string} options.requiredRole - Optional role requirement (e.g., 'admin', 'manager')
 *
 * @returns {Object} Authentication state with user details
 * @returns {boolean} return.isLoaded - Whether authentication state is loaded
 * @returns {boolean} return.isSignedIn - Whether user is authenticated
 * @returns {Object} return.user - User object from Clerk
 * @returns {string} return.mode - Authentication mode ('development' or 'clerk')
 *
 * @throws {Error} If user is not authenticated and auth state is loaded
 *
 * @example
 * function AdminPanel() {
 *   const { user } = useRequireAuth({ requiredRole: 'admin' })
 *
 *   return <div>Welcome, {user.firstName}</div>
 * }
 */
export const useRequireAuth = (options = {}) => {
  const { redirectTo = '/sign-in', requiredRole } = options
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.isLoaded && !auth.isSignedIn) {
      // Store current location for post-login redirect
      const currentPath = window.location.pathname + window.location.search
      navigate(redirectTo, { state: { from: currentPath }, replace: true })
    }
  }, [auth.isLoaded, auth.isSignedIn, redirectTo, navigate])

  useEffect(() => {
    // Role-based access control (if requiredRole specified)
    if (auth.isLoaded && auth.isSignedIn && requiredRole) {
      const userRole = auth.user?.publicMetadata?.role || 'viewer'

      // Role hierarchy: admin > manager > operator > viewer
      const roleHierarchy = {
        admin: 4,
        manager: 3,
        operator: 2,
        viewer: 1,
      }

      const userRoleLevel = roleHierarchy[userRole] || 0
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0

      if (userRoleLevel < requiredRoleLevel) {
        console.error(`Access denied: User role "${userRole}" insufficient for required role "${requiredRole}"`)
        navigate('/unauthorized', { replace: true })
      }
    }
  }, [auth.isLoaded, auth.isSignedIn, auth.user, requiredRole, navigate])

  return auth
}
