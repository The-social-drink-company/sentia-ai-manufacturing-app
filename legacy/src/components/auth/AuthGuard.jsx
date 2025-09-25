import React from 'react';

import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const AuthGuard = ({ children, requiredRole = null }) => {
  const { data: session, status } = ();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated' || !session) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (requiredRole && session.user?.role !== requiredRole) {
    const hasRequiredRole = checkUserRole(session.user, requiredRole);
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
            <Navigate to="/dashboard" replace />
          </div>
        </div>
      );
    }
  }

  return children;
};

function checkUserRole(user, requiredRole) {
  if (!user || !user.role) return false;
  
  const roleHierarchy = {
    'guest': 0,
    'user': 1,
    'data_manager': 2,
    'admin': 3,
    'master_admin': 4
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

export default AuthGuard;
