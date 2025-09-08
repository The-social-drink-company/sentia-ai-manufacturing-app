import { useUser } from '@clerk/clerk-react';

export function useAuthRole() {
  const { user } = useUser();
  
  // Extract role from user metadata
  const role = user?.publicMetadata?.role || user?.privateMetadata?.role || 'viewer';
  
  // Define permissions based on role hierarchy
  const roleHierarchy = {
    'admin': ['admin_access', 'manager_access', 'operator_access', 'viewer_access'],
    'manager': ['manager_access', 'operator_access', 'viewer_access'],
    'operator': ['operator_access', 'viewer_access'],
    'viewer': ['viewer_access']
  };
  
  // Check if user has a specific permission
  const hasPermission = (permission) => {
    const userPermissions = roleHierarchy[role] || [];
    return userPermissions.includes(permission);
  };
  
  // Check if user is admin
  const isAdmin = () => role === 'admin';
  
  // Check if user can access manager features
  const canAccessManagementFeatures = () => hasPermission('manager_access');
  
  // Check if user can access operator features
  const canAccessOperatorFeatures = () => hasPermission('operator_access');
  
  return {
    user,
    role,
    hasPermission,
    isAdmin,
    canAccessManagementFeatures,
    canAccessOperatorFeatures
  };
}