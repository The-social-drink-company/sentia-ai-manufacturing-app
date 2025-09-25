import React from 'react';
import { Navigate } from 'react-router-dom';
const ClerkSignUp = () => {
  const auth = useBulletproofAuth();
  const mode = useAuthMode();

  // If already signed in, redirect to dashboard
  if (auth.isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not in Clerk mode, show message
  if (mode !== 'clerk') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sign Up Not Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The application is currently running in fallback mode.
              New account creation is not available.
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

  // Render Clerk SignUp component
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
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
};

export default ClerkSignUp;