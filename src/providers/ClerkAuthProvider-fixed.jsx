/**
 * CLEAN CLERK AUTHENTICATION PROVIDER
 * 
 * Professional, production-ready Clerk authentication system
 * with NO fallbacks, NO mock auth, and NO guest mode.
 */

import React, { createContext, useContext } from 'react';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Validate Clerk configuration
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. ' +
    'Please add your Clerk publishable key to the environment variables.'
  );
}

// Clerk configuration
const clerkConfig = {
  publishableKey: CLERK_PUBLISHABLE_KEY,
  appearance: {
    baseTheme: dark,
    variables: {
      colorPrimary: '#667eea',
      colorBackground: '#1a1a1a',
      colorInputBackground: '#2d2d2d',
      colorInputText: '#ffffff',
      colorText: '#ffffff',
      colorTextSecondary: '#a0a0a0',
      borderRadius: '8px',
    },
    elements: {
      formButtonPrimary: {
        backgroundColor: '#667eea',
        '&:hover': {
          backgroundColor: '#5a6fd8',
        },
      },
      card: {
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
      },
      headerTitle: {
        color: '#ffffff',
      },
      headerSubtitle: {
        color: '#a0a0a0',
      },
    },
  },
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/dashboard',
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
};

// Auth Context for additional functionality
const AuthContext = createContext(null);

// Enhanced auth hook that combines Clerk hooks
const useEnhancedAuth = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  
  // Map Clerk user to our application user format
  const mappedUser = user ? {
    id: user.id,
    firstName: user.firstName || 'User',
    lastName: user.lastName || '',
    email: user.primaryEmailAddress?.emailAddress || '',
    role: user.publicMetadata?.role || 'user',
    avatar: user.imageUrl,
    fullName: user.fullName || `${user.firstName || 'User'} ${user.lastName || ''}`.trim(),
  } : null;

  return {
    // Clerk native properties
    isLoaded,
    isSignedIn,
    userId,
    user: mappedUser,
    
    // Convenience properties
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded,
    
    // User role checking
    hasRole: (role) => mappedUser?.role === role,
    hasAnyRole: (roles) => roles.includes(mappedUser?.role),
  };
};

// Auth Context Provider (internal)
const AuthContextProvider = ({ children }) => {
  const authData = useEnhancedAuth();
  
  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

// Main Clerk Auth Provider
export const ClerkAuthProvider = ({ children }) => {
  return (
    <ClerkProvider {...clerkConfig}>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </ClerkProvider>
  );
};

// Hook to use auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within ClerkAuthProvider');
  }
  return context;
};

// Export Clerk components for direct use
export {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  SignIn,
  SignUp,
} from '@clerk/clerk-react';

export default ClerkAuthProvider;
