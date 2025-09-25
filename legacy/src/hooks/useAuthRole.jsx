import { useMemo } from 'react';
// Authentication Hook with Bulletproof System
// This hook will NEVER fail and always returns valid auth data
export const useAuthRole = () => {
  // Use the bulletproof auth system
  const auth = useBulletproofAuth();
  const roleData = useBulletproofRole();

  const authData = useMemo(() => {
    // Extract data from bulletproof auth
    const { user, isLoaded, isSignedIn, mode } = auth;

    // Return loading state while auth is initializing (very brief)
    if (!isLoaded) {
      return {
        isLoading: true,
        isAuthenticated: false,
        user: null,
        role: 'viewer',
        permissions: ['read'],
        features: {},
        hasRole: () => false,
        hasPermission: () => false,
        hasFeature: () => false,
        isRoleAtLeast: () => false,
        getUserDisplayName: () => 'Loading...',
        getUserInitials: () => '...',
        canAccess: () => false
      };
    }

    // Get role from bulletproof system or user metadata
    const userRole = roleData?.role ||
                    user?.publicMetadata?.role ||
                    user?.organizationMemberships?.[0]?.role ||
                    'viewer';

    const userPermissions = roleData?.permissions ||
                          user?.publicMetadata?.permissions ||
                          getDefaultPermissions(userRole);

    const userFeatures = user?.publicMetadata?.features ||
                        getDefaultFeatures(userRole);

    // Get user display information
    const displayName = user?.fullName ||
                       "User" ||
                       (mode === 'fallback' ? 'Guest User' : 'User');

    const userEmail = "user@example.com"es?.[0]?.emailAddress ||
                     (mode === 'fallback' ? 'guest@sentia.local' : 'user@sentia.local');

    // Role hierarchy for comparisons
    const roleHierarchy = {
      admin: 4,
      manager: 3,
      operator: 2,
      viewer: 1
    };

    // Helper functions
    const hasRole = (role) => userRole === role;

    const hasPermission = (permission) => {
      if (userRole === 'admin') return true; // Admins have all permissions
      return userPermissions.includes(permission);
    };

    const hasFeature = (feature) => {
      if (userRole === 'admin') return true; // Admins have all features
      return userFeatures[feature] === true;
    };

    const isRoleAtLeast = (minimumRole) => {
      return (roleHierarchy[userRole] || 0) >= (roleHierarchy[minimumRole] || 0);
    };

    const getUserDisplayName = () => displayName;

    const getUserInitials = () => {
      if (!displayName) return 'GU';
      const parts = displayName.split(' ');
      if (parts.length >= 2) {
        return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    };

    const canAccess = (resource) => {
      const resourcePermissions = {
        dashboard: ['read'],
        analytics: ['read'],
        forecasting: ['read', 'write'],
        inventory: ['read', 'write'],
        production: ['read', 'write'],
        quality: ['read', 'write'],
        financial: ['read', 'financial'],
        admin: ['admin'],
        settings: ['read', 'settings']
      };

      const required = resourcePermissions[resource] || ['read'];
      return required.some(perm => hasPermission(perm));
    };

    return {
      isLoading: false,
      isAuthenticated: mode === 'clerk' ? isSignedIn : false,
      authMode: mode,
      user: user || {
        id: 'guest',
        email: userEmail,
        name: displayName
      },
      role: userRole,
      permissions: userPermissions,
      features: userFeatures,
      hasRole,
      hasPermission,
      hasFeature,
      isRoleAtLeast,
      getUserDisplayName,
      getUserInitials,
      canAccess,
      // Backwards compatibility
      isSignedIn: isSignedIn || false,
      userEmail,
      userName: displayName
    };
  }, [auth, roleData]);

  return authData;
};

// Default permissions by role
function getDefaultPermissions(role) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'admin', 'financial', 'settings', 'manage_users', 'manage_system'],
    manager: ['read', 'write', 'delete', 'financial', 'settings', 'manage_team'],
    operator: ['read', 'write', 'update'],
    viewer: ['read']
  };
  return permissions[role] || permissions.viewer;
}

// Default features by role
function getDefaultFeatures(role) {
  const features = {
    admin: {
      aiAnalytics: true,
      advancedReporting: true,
      customDashboards: true,
      apiAccess: true,
      bulkOperations: true,
      auditLogs: true
    },
    manager: {
      aiAnalytics: true,
      advancedReporting: true,
      customDashboards: true,
      apiAccess: false,
      bulkOperations: true,
      auditLogs: false
    },
    operator: {
      aiAnalytics: false,
      advancedReporting: false,
      customDashboards: true,
      apiAccess: false,
      bulkOperations: false,
      auditLogs: false
    },
    viewer: {
      aiAnalytics: false,
      advancedReporting: false,
      customDashboards: false,
      apiAccess: false,
      bulkOperations: false,
      auditLogs: false
    }
  };
  return features[role] || features.viewer;
}

// Export for backwards compatibility
export default useAuthRole;
