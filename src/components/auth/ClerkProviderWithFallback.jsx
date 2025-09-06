import { devLog } from '../lib/devLog.js';

/**
 * ClerkProvider with Fallback UI
 * Handles authentication states and provides fallback when Clerk is not available
 */

import React, { useState, useEffect, Suspense } from 'react';
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import clerkConfig from '../../services/auth/clerkConfig';
import ErrorBoundary from '../ErrorBoundary';

/**
 * Loading component during authentication initialization
 */
const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Initializing authentication...</p>
    </div>
  </div>
);

/**
 * Fallback UI when Clerk is not available
 */
const ClerkFallback = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Authentication service is currently unavailable. Running in public mode.
            </p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

/**
 * Authentication wrapper component
 */
const AuthWrapper = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after mount
    setIsHydrated(true);
  }, []);

  // During SSR or initial hydration
  if (!isHydrated) {
    return <AuthLoading />;
  }

  // Clerk is still loading
  if (!isLoaded) {
    return <AuthLoading />;
  }

  return children;
};

/**
 * Main ClerkProvider wrapper with fallback
 */
const ClerkProviderWithFallback = ({ children }) => {
  const [clerkReady, setClerkReady] = useState(false);
  const [clerkError, setClerkError] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const initializeClerk = async () => {
      try {
        // Get Clerk configuration
        const clerkConfig = window.clerkConfig || {};
        const configuration = clerkConfig.getConfig ? clerkConfig.getConfig() : null;
        
        if (!configuration || !configuration.publishableKey) {
          devLog.warn('[ClerkProvider] No publishable key found, running without authentication');
          setClerkError('No authentication configuration');
          return;
        }

        setConfig(configuration);
        
        // Initialize Clerk
        const initialized = await clerkConfig.initialize();
        
        if (initialized) {
          setClerkReady(true);
        } else {
          setClerkError('Failed to initialize authentication');
        }
      } catch (error) {
        devLog.error('[ClerkProvider] Initialization error:', error);
        setClerkError(error.message);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      initializeClerk();
    }
  }, []);

  // Handle server-side rendering
  if (typeof window === 'undefined') {
    return <AuthLoading />;
  }

  // Clerk initialization failed - show fallback
  if (clerkError) {
    devLog.warn('[ClerkProvider] Using fallback mode:', clerkError);
    return (
      <ErrorBoundary>
        <ClerkFallback>{children}</ClerkFallback>
      </ErrorBoundary>
    );
  }

  // Clerk not ready yet
  if (!clerkReady || !config) {
    return <AuthLoading />;
  }

  // Clerk is ready - provide authentication
  return (
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={config.publishableKey}
        navigate={(to) => window.location.href = to}
        appearance={config.appearance}
        allowedRedirectOrigins={config.allowedRedirectOrigins}
        afterSignInUrl={config.afterSignInUrl}
        afterSignUpUrl={config.afterSignUpUrl}
        afterSignOutUrl={config.afterSignOutUrl}
      >
        <Suspense fallback={<AuthLoading />}>
          <AuthWrapper>{children}</AuthWrapper>
        </Suspense>
      </ClerkProvider>
    </ErrorBoundary>
  );
};

/**
 * Hook to check authentication status with fallback
 */
export const useClerkAuth = () => {
  const [authState, setAuthState] = useState({
    isLoaded: false,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    isFallback: false
  });

  useEffect(() => {
    // Check if Clerk is available
    if (typeof window !== 'undefined' && window.Clerk) {
      try {
        const auth = window.Clerk.session;
        setAuthState({
          isLoaded: true,
          isSignedIn: !!auth,
          userId: auth?.userId || null,
          sessionId: auth?.id || null,
          isFallback: false
        });
      } catch (error) {
        devLog.error('[useClerkAuth] Error getting auth state:', error);
        setAuthState({
          isLoaded: true,
          isSignedIn: false,
          userId: null,
          sessionId: null,
          isFallback: true
        });
      }
    } else {
      // Clerk not available - fallback mode
      setAuthState({
        isLoaded: true,
        isSignedIn: false,
        userId: null,
        sessionId: null,
        isFallback: true
      });
    }
  }, []);

  return authState;
};

/**
 * Protected route component
 */
export const ProtectedRoute = ({ children, fallback = null }) => {
  const { isLoaded, isSignedIn, isFallback } = useClerkAuth();

  // Still loading
  if (!isLoaded) {
    return <AuthLoading />;
  }

  // In fallback mode - show content with warning
  if (isFallback) {
    return (
      <>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 text-sm">
          <p className="text-yellow-700">Authentication unavailable - limited access</p>
        </div>
        {fallback || children}
      </>
    );
  }

  // Not signed in - redirect to sign in
  if (!isSignedIn) {
    window.location.href = '/sign-in';
    return <AuthLoading />;
  }

  // Signed in - show protected content
  return children;
};

/**
 * Public route component
 */
export const PublicRoute = ({ children }) => {
  return children;
};

export default ClerkProviderWithFallback;