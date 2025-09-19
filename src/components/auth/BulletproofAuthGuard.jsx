/**
 * BULLETPROOF AUTH GUARD
 * 
 * This component ensures users are authenticated before accessing protected routes.
 * It works with both Clerk authentication and fallback demo mode.
 */

import React from 'react';
import { useAuth } from '../../auth/BulletproofClerkProvider';
import { LoadingSpinner } from '../LoadingStates';

const BulletproofAuthGuard = ({ children, fallback = null, requireAuth = true }) => {
  const auth = useAuth();

  // Show loading spinner while auth is loading
  if (auth.isLoading) {
    return <LoadingSpinner />;
  }

  // If authentication is required but user is not signed in
  if (requireAuth && !auth.isSignedIn) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access this page.
          </p>
          <button
            onClick={() => window.location.href = '/sign-in'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Render children if auth requirements are met
  return children;
};

export default BulletproofAuthGuard;
