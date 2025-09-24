/**
 * Emergency Clerk Provider - Simplified Implementation
 * 
 * This is a minimal, bulletproof Clerk implementation designed to:
 * 1. Get authentication working immediately
 * 2. Provide clear error messages for debugging
 * 3. Ensure client demo readiness
 * 4. Serve as fallback for enterprise implementation
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ClerkProvider, useAuth, useUser, SignIn, SignUp, UserButton } from '@clerk/clerk-react';

// Emergency Clerk configuration - minimal and reliable
const EMERGENCY_CLERK_CONFIG = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/dashboard',
  afterSignOutUrl: '/',
  
  // Simplified appearance
  appearance: {
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorInputBackground: '#f8fafc',
      borderRadius: '0.5rem'
    }
  }
};

// Emergency context for debugging
const EmergencyAuthContext = createContext(null);

// Environment validation hook
const useEnvironmentValidation = () => {
  const [validation, setValidation] = useState({
    isValid: false,
    errors: [],
    warnings: []
  });

  useEffect(() => {
    const errors = [];
    const warnings = [];

    // Check required environment variables
    if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
      errors.push('VITE_CLERK_PUBLISHABLE_KEY is missing');
    }

    // Validate publishable key format
    const pubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (pubKey && !pubKey.startsWith('pk_')) {
      errors.push('VITE_CLERK_PUBLISHABLE_KEY has invalid format');
    }

    // Check for development vs production keys
    if (pubKey && pubKey.includes('test') && import.meta.env.NODE_ENV === 'production') {
      warnings.push('Using test keys in production environment');
    }

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings
    });
  }, []);

  return validation;
};

// Emergency authentication hook
export const useEmergencyAuth = () => {
  const auth = useAuth();
  const { user } = useUser();
  const context = useContext(EmergencyAuthContext);

  return {
    ...auth,
    user,
    isReady: auth.isLoaded && context?.isInitialized,
    debugInfo: context?.debugInfo || {}
  };
};

// Error display component
const AuthError = ({ errors, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-red-50">
    <div className="max-w-md p-8 bg-white rounded-lg shadow-lg border border-red-200">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Configuration Error</h2>
        <div className="text-left mb-4">
          <p className="text-sm text-gray-600 mb-2">The following issues need to be resolved:</p>
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <button
            onClick={onRetry}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
          <p className="text-xs text-gray-500">
            Check Render environment variables and redeploy
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Loading component
const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Initializing authentication...</p>
      <p className="text-xs text-gray-500 mt-2">Emergency Clerk Provider</p>
    </div>
  </div>
);

// Debug info component (development only)
const DebugInfo = ({ debugInfo }) => {
  if (import.meta.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs max-w-xs">
      <div className="font-semibold mb-1">Clerk Debug Info:</div>
      <div>Environment: {import.meta.env.NODE_ENV}</div>
      <div>Publishable Key: {debugInfo.hasPublishableKey ? '✓' : '✗'}</div>
      <div>Clerk Loaded: {debugInfo.isClerkLoaded ? '✓' : '✗'}</div>
      <div>User Loaded: {debugInfo.isUserLoaded ? '✓' : '✗'}</div>
    </div>
  );
};

// Main Emergency Clerk Provider
export const EmergencyClerkProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const validation = useEnvironmentValidation();

  // Debug information
  const [debugInfo, setDebugInfo] = useState({
    hasPublishableKey: false,
    isClerkLoaded: false,
    isUserLoaded: false,
    initTime: Date.now()
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          hasPublishableKey: !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
        }));

        // Validate environment
        if (!validation.isValid) {
          throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
        }

        // Log warnings
        validation.warnings.forEach(warning => {
          console.warn('Clerk Warning:', warning);
        });

        // Initialize successfully
        setIsInitialized(true);
        console.log('Emergency Clerk Provider initialized successfully');

      } catch (error) {
        console.error('Emergency Clerk initialization failed:', error);
        setInitError(error);
      }
    };

    initialize();
  }, [validation]);

  // Handle initialization errors
  if (initError || !validation.isValid) {
    return (
      <AuthError 
        errors={validation.errors.length > 0 ? validation.errors : [initError?.message || 'Unknown error']}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Show loading state
  if (!isInitialized) {
    return <AuthLoading />;
  }

  // Context value for debugging
  const contextValue = {
    isInitialized,
    debugInfo,
    validation
  };

  return (
    <ClerkProvider {...EMERGENCY_CLERK_CONFIG}>
      <EmergencyAuthContext.Provider value={contextValue}>
        <ClerkLoadedWrapper>
          {children}
        </ClerkLoadedWrapper>
        <DebugInfo debugInfo={debugInfo} />
      </EmergencyAuthContext.Provider>
    </ClerkProvider>
  );
};

// Wrapper to ensure Clerk is loaded
const ClerkLoadedWrapper = ({ children }) => {
  const { isLoaded } = useAuth();
  const { isLoaded: userLoaded } = useUser();
  const context = useContext(EmergencyAuthContext);

  useEffect(() => {
    if (context) {
      context.debugInfo.isClerkLoaded = isLoaded;
      context.debugInfo.isUserLoaded = userLoaded;
    }
  }, [isLoaded, userLoaded, context]);

  if (!isLoaded) {
    return <AuthLoading />;
  }

  return children;
};

// Export authentication components
export { SignIn, SignUp, UserButton };

// Default export
export default EmergencyClerkProvider;
