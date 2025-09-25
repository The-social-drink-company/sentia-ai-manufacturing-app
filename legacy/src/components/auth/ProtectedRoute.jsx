import React from 'react'
import { AlertCircle, Shield, Clock, Loader2 } from 'lucide-react'

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requiredRole = null,
  requiredPermission = null,
  requiredRoleAtLeast = null,
  requiredFeature = null,
  fallback = null
}) {
  const { 
    isLoading, 
    isAuthenticated, 
    hasRole, 
    hasPermission, 
    isRoleAtLeast,
    hasFeature,
    role,
    getUserDisplayName,
    isSignedIn
  } = useAuthRole()
  
  // Compatibility with Clerk's isLoaded - bulletproof auth is always loaded
  const isLoaded = !isLoading

  // Loading states
  if (!isLoaded || isLoading) {
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

  // Not signed in
  if (!isSignedIn || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to sign in to access this page.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check admin requirement (master_admin also has admin privileges)
  if (requireAdmin && role !== 'admin' && role !== 'master_admin') {
    return <UnauthorizedAccess 
      reason="Admin access required" 
      userRole={role}
      requiredRole="admin or master_admin"
      0
    />
  }

  // Check specific role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return <UnauthorizedAccess 
      reason="Specific role required" 
      userRole={role}
      requiredRole={requiredRole}
      0
    />
  }

  // Check minimum role level requirement  
  if (requiredRoleAtLeast && !isRoleAtLeast(requiredRoleAtLeast)) {
    return <UnauthorizedAccess 
      reason="Insufficient role level" 
      userRole={role}
      requiredRole={`${requiredRoleAtLeast} or higher`}
      0
    />
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <UnauthorizedAccess 
      reason="Missing required permission" 
      userRole={role}
      requiredPermission={requiredPermission}
      0
    />
  }

  // Check feature requirement
  if (requiredFeature && !hasFeature(requiredFeature)) {
    return <UnauthorizedAccess 
      reason="Feature not available" 
      userRole={role}
      requiredFeature={requiredFeature}
      0
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
                <span className="text-gray-900 dark:text-white capitalize">{userRole || null}</span>
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
