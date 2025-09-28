/**
 * BulletproofAuthProvider - consolidated Clerk authentication with graceful fallbacks.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ClerkProvider, useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


// Authentication context that always has a value
const AuthContext = createContext(null);

// No fallback - Clerk authentication required
const NO_AUTH_STATE = {
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  user: null,
  signOut: () => Promise.resolve(),
  getToken: () => Promise.resolve(null),
  mode: 'clerk-required'
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Initializing authentication...</p>
    </div>
  </div>
);

const AuthError = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Authentication Issue</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          We were unable to connect to Clerk. Please check your configuration and try again.
        </p>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-words">
          {error}
        </p>
      </div>
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          type="button"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          type="button"
        >
          Reload Page
        </button>
      </div>
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Need assistance? Confirm environment variables and Render configuration before retrying.
        </p>
      </div>
    </div>
  </div>
);

function InternalAuthProvider({ children }) {
  const clerkAuth = useClerkAuth();
  const { user } = useClerkUser();

  const combinedAuth = {
    ...clerkAuth,
    user,
    mode: 'clerk'
  };

  return <AuthContext.Provider value={combinedAuth}>{children}</AuthContext.Provider>;
}

// Main bulletproof auth provider
export function BulletproofAuthProvider({ children }) {
  const [authMode, setAuthMode] = useState('initializing');
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);

  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  // Accept both production (pk_live_) and test (pk_test_) keys
  const isValidKey = Boolean(
    clerkKey &&
    clerkKey.length > 10 &&
    (clerkKey.startsWith('pk_live_') || clerkKey.startsWith('pk_test_')) &&
    !clerkKey.includes('your_key_here')
  );

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setAuthMode('initializing');
  }, []);

  const initialize = useCallback(() => {
    setError(null);

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (authMode === 'initializing') {
        setAuthMode('clerk');
      }
    }, 2000);

    if (!isValidKey) {
      setError('Clerk configuration is invalid. Please check VITE_CLERK_PUBLISHABLE_KEY.');
      setAuthMode('error');
    } else {
      setAuthMode('clerk');
    }

    return () => clearTimeout(timeoutId);
  }, [isValidKey, authMode]);

  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  // Show error screen if we have an error
  if (error || authMode === 'error') {
    return <AuthError error={error} onRetry={handleRetry} />;
  }

  // Show loading only briefly during initialization
  if (authMode === 'initializing') {
    return <LoadingScreen />;
  }

  // Use Clerk if available and valid
  if (authMode === 'clerk' && isValidKey) {
    try {
      return (
        <ClerkProvider
          publishableKey={clerkKey}
          navigate={(to) => {
            if (typeof window !== 'undefined' && window.history) {
              window.history.pushState({}, '', to);
              // Trigger a popstate event to notify React Router
              window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
            }
          }}
        >
          <InternalAuthProvider>{children}</InternalAuthProvider>
        </ClerkProvider>
      );
    } catch (err) {
      logError('ClerkProvider failed to initialize:', err);
      setError(err.message);
      setAuthMode('error');
      return <AuthError error={err.message} onRetry={handleRetry} />;
    }
  }

  // No auth available - return null
  return null;
}

export function useBulletproofAuth() {
  // Try to get auth from context first
  const contextAuth = useContext(AuthContext);

  if (contextAuth) {
    return contextAuth;
  }

  // Return NO_AUTH_STATE as fallback
  return NO_AUTH_STATE;
}

export function useAuthRole() {
  const auth = useBulletproofAuth();

  if (!auth) {
    return {
      role: null,
      permissions: [],
      hasPermission: () => false,
      isAdmin: false,
      isManager: false,
      isOperator: false,
      isViewer: false,
      isLoading: true,
      user: null
    };
  }

  const role = auth.user?.publicMetadata?.role || 'viewer';
  const permissions = getPermissionsForRole(role);

  return {
    role: role,
    permissions,
    hasPermission: (permission) => permissions.includes(permission),
    isAdmin: role === 'admin',
    isManager: role === 'manager' || role === 'admin',
    isOperator: role === 'operator' || role === 'manager' || role === 'admin',
    isViewer: true, // Everyone has viewer permissions
    isLoading: !auth.isLoaded,
    user: auth.user
  };
}

function getPermissionsForRole(role) {
  const rolePermissions = {
    admin: ['view', 'edit', 'delete', 'manage_users', 'manage_system', 'financial_management', 'production_control', 'quality_control', 'inventory_management'],
    manager: ['view', 'edit', 'financial_management', 'production_control', 'quality_control', 'inventory_management'],
    operator: ['view', 'edit', 'production_control', 'quality_control'],
    viewer: ['view']
  };

  return rolePermissions[role] || rolePermissions.viewer;
}

export { AuthContext };