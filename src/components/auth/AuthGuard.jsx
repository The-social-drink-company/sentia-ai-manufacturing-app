import { useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'
import { Alert, AlertDescription } from '../ui'

/**
 * AuthGuard Component
 * Protects routes requiring authentication and specific roles
 */
export function AuthGuard({ children, requiredRole, fallbackPath = '/sign-in' }) {
  const { isLoaded, isSignedIn, sessionClaims } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authenticating...</h2>
          <div className="inline-flex items-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Check for required role
  if (requiredRole) {
    const userRole = sessionClaims?.metadata?.role || 'viewer'
    const roleHierarchy = {
      viewer: 0,
      operator: 1,
      manager: 2,
      admin: 3
    }

    if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              You don't have permission to access this page. Required role: {requiredRole}
            </AlertDescription>
          </Alert>
        </div>
      )
    }
  }

  return children
}