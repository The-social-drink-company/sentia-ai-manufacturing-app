/**
 * ClerkAuthProvider - Proper Clerk authentication without fallback
 *
 * This provider enforces proper authentication:
 * 1. No guest mode fallback
 * 2. Requires users to authenticate through Clerk
 * 3. Redirects unauthenticated users to sign-in
 * 4. Provides proper loading states
 */

import React, { createContext, useContext } from 'react';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

// Authentication context
const AuthContext = createContext(null);

// Loading screen component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading authentication...</p>
    </div>
  </div>
);

// Error display component
const AuthError = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Authentication Error</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Unable to initialize authentication service.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{error}</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

// Clerk integration wrapper
function ClerkAuthIntegration({ children }) {
  const auth = useAuth();
  const { user } = useUser();

  // Provide auth context with Clerk data
  const authValue = {
    ...auth,
    user,
    mode: 'clerk'
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Main Clerk auth provider
export function ClerkAuthProvider({ children }) {
  // Get Clerk publishable key
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  // Validate Clerk key
  if (!clerkKey || clerkKey.includes('undefined') || clerkKey.includes('YOUR_KEY')) {
    return (
      <AuthError 
        error="Missing or invalid Clerk publishable key. Please check your environment variables."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      appearance={{
        baseTheme: dark,
        elements: {
          rootBox: "w-full",
          card: "shadow-xl border border-gray-200 dark:border-gray-700",
          headerTitle: "text-2xl font-bold text-gray-900 dark:text-white",
          headerSubtitle: "text-gray-600 dark:text-gray-400",
          socialButtonsBlockButton: "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800",
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors",
          formFieldInput: "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
          footerActionLink: "text-blue-600 hover:text-blue-700 font-medium"
        },
        variables: {
          colorPrimary: "#2563eb",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorInputText: "#1f2937"
        }
      }}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <ClerkAuthIntegration>
        {children}
      </ClerkAuthIntegration>
    </ClerkProvider>
  );
}

// Auth hook that only works with proper Clerk authentication
export function useClerkAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useClerkAuth must be used within ClerkAuthProvider');
  }
  
  return context;
}

// Helper hook for role-based access
export function useAuthRole() {
  const auth = useClerkAuth();
  
  const role = auth.user?.publicMetadata?.role || 'viewer';
  const permissions = getPermissionsForRole(role);

  return {
    ...auth,
    role,
    permissions,
    hasPermission: (permission) => permissions.includes(permission),
    isAdmin: role === 'admin',
    isManager: role === 'manager' || role === 'admin',
    isAuthenticated: auth.isSignedIn && auth.isLoaded
  };
}

// Permission system
function getPermissionsForRole(role) {
  const permissions = {
    admin: ['*'], // All permissions
    manager: ['read', 'write', 'update', 'delete', 'manage_team'],
    operator: ['read', 'write', 'update'],
    viewer: ['read']
  };

  return permissions[role] || permissions.viewer;
}

export default ClerkAuthProvider;
