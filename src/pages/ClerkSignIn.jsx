import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


const ClerkSignIn = () => {
  logDebug('[ClerkSignIn] Component rendering...');
  
  // Add debug information
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  logDebug('[ClerkSignIn] Clerk key available:', !!clerkKey);
  logDebug('[ClerkSignIn] Clerk key prefix:', clerkKey?.substring(0, 20));

  try {
    // Try to get auth state but don't fail if it's not available
    let auth = null;
    let mode = null;
    
    try {
      const { useBulletproofAuth, useAuthMode } = require('../auth/BulletproofAuthProvider');
      auth = useBulletproofAuth();
      mode = useAuthMode();
      logDebug('[ClerkSignIn] Auth mode:', mode);
      logDebug('[ClerkSignIn] Auth state:', auth);
    } catch (error) {
      logWarn('[ClerkSignIn] Could not get auth state:', error);
    }

    // If already signed in, redirect to dashboard
    if (auth?.isSignedIn) {
      logDebug('[ClerkSignIn] User already signed in, redirecting...');
      return <Navigate to="/dashboard" replace />;
    }

    // If not in Clerk mode, show fallback message
    if (mode && mode !== 'clerk') {
      logDebug('[ClerkSignIn] Not in Clerk mode, showing fallback');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-md w-full text-center">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Clerk Authentication Not Available
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The application is currently running in fallback mode.
                Clerk authentication is not configured.
              </p>
              <div className="space-y-3">
                <a
                  href="/dashboard"
                  className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue as Guest
                </a>
                <a
                  href="/"
                  className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    logDebug('[ClerkSignIn] Rendering Clerk SignIn component...');
    
    // Render Clerk SignIn component
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          <div className="mb-4 p-4 bg-white rounded-lg shadow">
            <p className="text-center text-sm text-gray-600">
              Debug: ClerkSignIn component loaded
            </p>
          </div>
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            appearance={{
              baseTheme: undefined,
              variables: {
                colorPrimary: '#2563eb',
                colorBackground: '#ffffff',
                colorText: '#1f2937',
                colorInputBackground: '#f9fafb',
                colorInputText: '#1f2937',
                borderRadius: '0.5rem'
              },
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                card: 'shadow-xl',
                headerTitle: 'text-2xl font-bold',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
                formFieldLabel: 'text-gray-700',
                formFieldInput: 'border-gray-300',
                footerActionLink: 'text-blue-600 hover:text-blue-700'
              }
            }}
          />
        </div>
      </div>
    );
  } catch (error) {
    logError('[ClerkSignIn] Error rendering component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full text-center">
          <div className="bg-white shadow-xl rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Sign-In Error
            </h2>
            <p className="text-gray-600 mb-6">
              Unable to load sign-in component. Error: {error.message}
            </p>
            <a
              href="/dashboard"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue as Guest
            </a>
          </div>
        </div>
      </div>
    );
  }
};

export default ClerkSignIn;