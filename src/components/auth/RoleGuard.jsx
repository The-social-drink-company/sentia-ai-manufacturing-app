import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { ShieldExclamationIcon, LockClosedIcon } from '@heroicons/react/24/outline';

/**
 * RoleGuard Component - Protects routes based on user roles
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route
 * @param {ReactNode} children - Child components to render if authorized
 * @param {string} fallbackPath - Path to redirect if unauthorized (default: /unauthorized)
 * @param {boolean} requireAuth - Whether authentication is required (default: true)
 */
const RoleGuard = ({
  allowedRoles = [],
  children,
  fallbackPath = '/unauthorized',
  requireAuth = true,
  customMessage = null
}) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const location = useLocation();

  // Get user role from public metadata or default to 'viewer'
  const userRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role || 'viewer';

  // Define role hierarchy for permission inheritance
  const roleHierarchy = {
    admin: ['admin', 'manager', 'operator', 'viewer'],
    manager: ['manager', 'operator', 'viewer'],
    operator: ['operator', 'viewer'],
    viewer: ['viewer']
  };

  // Check if user has required role based on hierarchy
  const hasRequiredRole = () => {
    if (!allowedRoles || allowedRoles.length === 0) return true;

    const userPermissions = roleHierarchy[userRole] || [];
    return allowedRoles.some(role => userPermissions.includes(role));
  };

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Check if authentication is required but user is not signed in
  if (requireAuth && !isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (!hasRequiredRole()) {
    // If custom unauthorized component is provided
    if (fallbackPath === 'component') {
      return (
        <UnauthorizedAccess
          userRole={userRole}
          requiredRoles={allowedRoles}
          customMessage={customMessage}
        />
      );
    }

    // Otherwise redirect to fallback path
    return <Navigate to={fallbackPath} state={{ from: location, reason: 'insufficient_role' }} replace />;
  }

  // User is authorized, render children
  return <>{children}</>;
};

/**
 * UnauthorizedAccess Component - Shows when user lacks required permissions
 */
const UnauthorizedAccess = ({ userRole, requiredRoles, customMessage }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-red-900 px-4"
    >
      <div className="max-w-md w-full">
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-red-600/20 rounded-full mb-6"
          >
            <ShieldExclamationIcon className="h-12 w-12 text-red-400" />
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>

          <p className="text-gray-300 mb-6">
            {customMessage || `You need one of the following roles to access this page:`}
          </p>

          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Required roles:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {requiredRoles.map(role => (
                <span
                  key={role}
                  className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Your current role: <span className="text-red-400 font-medium">{userRole}</span>
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>

            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>

            <button
              onClick={() => window.location.href = '/settings'}
              className="w-full px-4 py-2 bg-transparent hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors text-sm"
            >
              Request Access
            </button>
          </div>
        </motion.div>

        <p className="text-center text-gray-500 text-xs mt-6">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </motion.div>
  );
};

// Export a hook for programmatic role checking
export const useRoleGuard = (allowedRoles = []) => {
  const { user, isSignedIn } = useUser();
  const userRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role || 'viewer';

  const roleHierarchy = {
    admin: ['admin', 'manager', 'operator', 'viewer'],
    manager: ['manager', 'operator', 'viewer'],
    operator: ['operator', 'viewer'],
    viewer: ['viewer']
  };

  const hasRole = (roles) => {
    if (!roles || roles.length === 0) return true;
    const userPermissions = roleHierarchy[userRole] || [];
    return roles.some(role => userPermissions.includes(role));
  };

  return {
    userRole,
    isSignedIn,
    hasRole: hasRole(allowedRoles),
    canAccess: (roles) => hasRole(roles)
  };
};

export default RoleGuard;