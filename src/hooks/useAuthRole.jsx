import { useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';

// Professional Clerk Authentication Hook
export const useAuthRole = () => {
  const { user, isLoaded, isSignedIn } = useUser();

  const authData = useMemo(() => {
    // Return loading state while Clerk is initializing
    if (!isLoaded) {
      return {
        isLoading: true,
        isAuthenticated: false,
        user: null,
        role: null,
        permissions: [],
        features: {},
        hasRole: () => false,
        hasPermission: () => false,
        hasFeature: () => false,
        isRoleAtLeast: () => false,
        getUserDisplayName: () => '',
        getUserInitials: () => '',
        canAccess: () => false
      };
    }

    // Return unauthenticated state if user is not signed in
    if (!isSignedIn || !user) {
      return {
        isLoading: false,
        isAuthenticated: false,
        user: null,
        role: null,
        permissions: [],
        features: {},
        hasRole: () => false,
        hasPermission: () => false,
        hasFeature: () => false,
        isRoleAtLeast: () => false,
        getUserDisplayName: () => '',
        getUserInitials: () => '',
        canAccess: () => false
      };
    }

    // Extract role from Clerk user metadata
    const userRole = user.publicMetadata?.role || user.organizationMemberships?.[0]?.role || 'viewer';
    const userPermissions = user.publicMetadata?.permissions || getDefaultPermissions(userRole);
    const userFeatures = user.publicMetadata?.features || getDefaultFeatures(userRole);

    // Role hierarchy: admin > manager > operator > viewer
    const roleHierarchy = {
      admin: 4,
      manager: 3, 
      operator: 2,
      viewer: 1
    };

    const hasRole = (requiredRole) => {
      return userRole === requiredRole;
    };

    const hasPermission = (permission) => {
      return userPermissions.includes(permission);
    };

    const hasFeature = (feature) => {
      return userFeatures[feature] === true;
    };

    const isRoleAtLeast = (requiredRole) => {
      const userRoleLevel = roleHierarchy[userRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
      return userRoleLevel >= requiredRoleLevel;
    };

    const getUserDisplayName = () => {
      return user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'User';
    };

    const getUserInitials = () => {
      const name = getUserDisplayName();
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const canAccess = (resourceRole) => {
      if (!resourceRole) return true;
      return isRoleAtLeast(resourceRole);
    };

    return {
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        name: getUserDisplayName(),
        role: userRole,
        permissions: userPermissions,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt
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
      canAccess
    };
  }, [user, isLoaded, isSignedIn]);

  return authData;
};

// Default permissions based on role
function getDefaultPermissions(role) {
  switch (role) {
    case 'admin':
      return ['read', 'write', 'delete', 'admin', 'export', 'working-capital', 'what-if-analysis', 'user-management'];
    case 'manager':
      return ['read', 'write', 'export', 'working-capital', 'what-if-analysis'];
    case 'operator':
      return ['read', 'write', 'export'];
    case 'viewer':
    default:
      return ['read'];
  }
}

// Default features based on role
function getDefaultFeatures(role) {
  switch (role) {
    case 'admin':
      return {
        advancedAnalytics: true,
        systemDiagnostics: true,
        userManagement: true,
        apiAccess: true,
        experimentalFeatures: true,
        debugMode: true
      };
    case 'manager':
      return {
        advancedAnalytics: true,
        systemDiagnostics: false,
        userManagement: false,
        apiAccess: true,
        experimentalFeatures: false,
        debugMode: false
      };
    case 'operator':
      return {
        advancedAnalytics: false,
        systemDiagnostics: false,
        userManagement: false,
        apiAccess: false,
        experimentalFeatures: false,
        debugMode: false
      };
    case 'viewer':
    default:
      return {
        advancedAnalytics: false,
        systemDiagnostics: false,
        userManagement: false,
        apiAccess: false,
        experimentalFeatures: false,
        debugMode: false
      };
  }
}

export default useAuthRole;