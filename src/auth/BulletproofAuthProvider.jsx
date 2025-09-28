/**
 * BulletproofAuthProvider - consolidated Clerk authentication with graceful fallbacks.
 */

<<<<<<< HEAD
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ClerkProvider, useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


// Authentication context that always has a value
const AuthContext = createContext(null);

// No fallback - Clerk authentication required
const NO_AUTH_STATE = {
  isLoaded: true,
=======
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from '@clerk/clerk-react';

export const DEFAULT_AUTH_STATE = {
  isLoaded: false,
>>>>>>> development
  isSignedIn: false,
  userId: null,
  sessionId: null,
  user: null,
<<<<<<< HEAD
  signOut: () => Promise.resolve(),
  getToken: () => Promise.resolve(null),
  mode: 'clerk-required'
=======
  signOut: async () => {},
  getToken: async () => null,
  mode: 'unavailable',
>>>>>>> development
};

const AuthContext = createContext(DEFAULT_AUTH_STATE);

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

const isValidClerkKey = (key) =>
  typeof key === 'string' &&
  (key.startsWith('pk_live_') || key.startsWith('pk_test_')) &&
  key.length > 20 &&
  !key.includes('undefined') &&
  !key.includes('YOUR_KEY') &&
  !key.includes('your_key_here');

function ClerkAuthIntegration({ children }) {
  const clerkAuth = useClerkAuth();
  const clerkUser = useClerkUser();

  const combinedAuth = useMemo(
    () => ({
      ...DEFAULT_AUTH_STATE,
      ...clerkAuth,
      user: clerkUser?.user ?? null,
      isLoaded: Boolean(clerkAuth?.isLoaded),
      isSignedIn: Boolean(clerkAuth?.isSignedIn),
      mode: 'clerk',
    }),
    [clerkAuth, clerkUser?.user]
  );

  return <AuthContext.Provider value={combinedAuth}>{children}</AuthContext.Provider>;
}

<<<<<<< HEAD
// No fallback auth provider - Clerk is required

// Main bulletproof auth provider
=======
>>>>>>> development
export function BulletproofAuthProvider({ children }) {
  const [authMode, setAuthMode] = useState('initializing');
  const [error, setError] = useState(null);

  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
<<<<<<< HEAD

  // Accept both production (pk_live_) and test (pk_test_) keys
  const isValidKey = Boolean(
    clerkKey &&
    (clerkKey.startsWith('pk_live_') || clerkKey.startsWith('pk_test_')) &&
    clerkKey.length > 20 &&
    !clerkKey.includes('undefined') &&
    !clerkKey.includes('YOUR_KEY') &&
    !clerkKey.includes('your_key_here')
  );
=======
  const keyIsValid = isValidClerkKey(clerkKey);
>>>>>>> development

  const initialize = useCallback(() => {
    setError(null);

<<<<<<< HEAD
    // Set a timeout to prevent infinite loading
    // No timeout fallback - Clerk is required

    // Check if we should use Clerk or fallback
    if (isValidKey) {
      // Only use Clerk - no fallback
      logInfo('Valid Clerk key detected, initializing Clerk...');
      console.info('Key info:', {
        keyStart: clerkKey?.substring(0, 30) + '...',
        keyLength: clerkKey?.length,
        domain: 'clerk.financeflo.ai'
      });
      // Force Clerk mode
      setAuthMode('clerk');
    } else {
      logError('Invalid Clerk key - authentication required');
      console.error('Clerk key status:', {
        hasKey: !!clerkKey,
        keyStart: clerkKey?.substring(0, 20),
        keyLength: clerkKey?.length
      });
      setError('Clerk authentication is required. Please check your configuration.');
      setAuthMode('error');
    }

    // No cleanup needed
  }, [isValidKey, retryCount]);
=======
    if (!keyIsValid) {
      setAuthMode('error');
      setError(
        'Clerk publishable key missing or invalid. Set VITE_CLERK_PUBLISHABLE_KEY with a pk_live_ or pk_test_ value.'
      );
      return;
    }

    setAuthMode('clerk');
  }, [keyIsValid]);
>>>>>>> development

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleRetry = useCallback(() => {
    initialize();
  }, [initialize]);

<<<<<<< HEAD
  // Show error screen if we have an error
  if (error || authMode === 'error') {
    return <AuthError error={error} onRetry={handleRetry} />;
  }

  // Show loading only briefly during initialization
=======
>>>>>>> development
  if (authMode === 'initializing') {
    return <LoadingScreen />;
  }

<<<<<<< HEAD
  // Use Clerk if available and valid
  if (authMode === 'clerk' && isValidKey) {
    try {
      return (
        <ClerkProvider
          publishableKey={clerkKey}
          fallbackRedirectUrl="/dashboard"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none"
            }
          }}
        >
          <ClerkAuthIntegration>{children}</ClerkAuthIntegration>
        </ClerkProvider>
      );
    } catch (err) {
      logError('Clerk initialization error:', err);
      setAuthMode('fallback');
    }
  }

  // No fallback - Clerk is required
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Required</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Clerk authentication is not properly configured. Please check your environment variables.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
=======
  if (authMode === 'clerk' && keyIsValid) {
    return (
      <ClerkProvider
        publishableKey={clerkKey}
        fallbackRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'shadow-none',
          },
        }}
      >
        <ClerkAuthIntegration>{children}</ClerkAuthIntegration>
      </ClerkProvider>
    );
  }

  const message =
    error ?? 'Authentication system is not available. Please ensure Clerk is properly configured.';

  return <AuthError error={message} onRetry={handleRetry} />;
>>>>>>> development
}

export function useBulletproofAuth() {
<<<<<<< HEAD
  // Try to get auth from context first
  const contextAuth = useContext(AuthContext);

  // If we have context auth, return it
  if (contextAuth) {
    return contextAuth;
  }

  // Note: Removed direct Clerk hook usage to prevent context errors

  // No auth available - return null
  return null;
=======
  const auth = useContext(AuthContext);
  return auth ?? DEFAULT_AUTH_STATE;
>>>>>>> development
}

export function useAuthMode() {
  const auth = useBulletproofAuth();
  return auth.mode ?? 'unavailable';
}

export function useAuthRole() {
  const auth = useBulletproofAuth();

<<<<<<< HEAD
  if (!auth) {
    return {
      role: null,
      permissions: [],
      hasPermission: () => false,
      isAdmin: false,
      isManager: false,
      isAuthenticated: false,
      isLoading: false,
      user: null
    };
  }

  const role = auth.user?.publicMetadata?.role || 'viewer';
  const permissions = getPermissionsForRole(role);
=======
  const role = auth.user?.publicMetadata?.role ?? 'viewer';
  const normalizedRole = typeof role === 'string' ? role : 'viewer';
  const permissions = getPermissionsForRole(normalizedRole);
>>>>>>> development

  return {
    role: normalizedRole,
    permissions,
<<<<<<< HEAD
    hasPermission: (permission) => permissions.includes(permission),
    isAdmin: role === 'admin',
    isManager: role === 'manager' || role === 'admin',
    isAuthenticated: auth.isSignedIn,
    isLoading: !auth.isLoaded,
    user: auth.user
=======
    hasPermission: (permission) =>
      normalizedRole === 'master_admin' ||
      normalizedRole === 'admin' ||
      permissions.includes('*') ||
      permissions.includes(permission),
    isAdmin: normalizedRole === 'admin' || normalizedRole === 'master_admin',
    isManager:
      normalizedRole === 'manager' ||
      normalizedRole === 'admin' ||
      normalizedRole === 'master_admin',
    isAuthenticated: Boolean(auth.isSignedIn),
    isLoading: !auth.isLoaded,
    user: auth.user,
>>>>>>> development
  };
}

function getPermissionsForRole(role) {
  const permissions = {
    master_admin: ['*'],
    admin: ['*'],
    manager: ['read', 'write', 'update', 'delete', 'manage_team'],
    operator: ['read', 'write', 'update'],
    viewer: ['read'],
  };

  return permissions[role] ?? permissions.viewer;
}

export default BulletproofAuthProvider;
