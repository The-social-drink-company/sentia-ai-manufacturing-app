import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthRole } from '../../auth/ClerkAuthProvider';
import { AlertCircle, Shield, Clock, Loader2 } from 'lucide-react'

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requiredRole = null,
  requiredPermission = null,
  requiredRoleAtLeast = null,
  requiredFeature = null,
  fallback = null,
  requiredRoles = [] // Support for multiple roles
}) {
  const { 
    isLoaded, 
    isSignedIn, 
    user,
    role,
    hasPermission,
    isAdmin,
    isManager
  } = useAuthRole();
  const location = useLocation();

  // Loading states
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Checking authentication...
          </p>
        </div>
      </div>
    )
  }

  // Not signed in - redirect to sign-in page
  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return <UnauthorizedAccess 
      reason="Admin access required" 
      userRole={role}
      requiredRole="admin"
      fallback={fallback}
    />
  }

  // Check specific role requirement
  if (requiredRole && role !== requiredRole && !isAdmin) {
    return <UnauthorizedAccess 
      reason="Specific role required" 
      userRole={role}
      requiredRole={requiredRole}
      fallback={fallback}
    />
  }

  // Check multiple roles requirement
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(role) || isAdmin;
    if (!hasRequiredRole) {
      return <UnauthorizedAccess 
        reason="Required role not found" 
        userRole={role}
        requiredRole={requiredRoles.join(' or ')}
        fallback={fallback}
      />
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <UnauthorizedAccess 
      reason="Missing required permission" 
      userRole={role}
      requiredPermission={requiredPermission}
      fallback={fallback}
    />
  }

  // All checks passed - render children
  return <>{children}</>
}

// Unauthorized access component
function UnauthorizedAccess({ 
  reason, 
  userRole, 
  requiredRole, 
  requiredPermission, 
  requiredFeature, 
  fallback 
}) {
  // If a custom fallback component is provided, use it
  if (fallback) {
    return fallback
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {reason}
          </p>
          
          {/* Show access details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Your Role:</span>
                <span className="text-gray-900 dark:text-white capitalize">{userRole || 'Unknown'}</span>
              </div>
              
              {requiredRole && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Required Role:</span>
                  <span className="text-gray-900 dark:text-white capitalize">{requiredRole}</span>
                </div>
              )}
              
              {requiredPermission && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Required Permission:</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs">{requiredPermission}</span>
                </div>
              )}
              
              {requiredFeature && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Required Feature:</span>
                  <span className="text-gray-900 dark:text-white">{requiredFeature}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Go Back
            </button>
          </div>
          
          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

// Export additional utility components for convenience
export { UnauthorizedAccess }