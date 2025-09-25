import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBulletproofAuth, useAuthMode } from '../auth/BulletproofAuthProvider';
import { SignIn } from '@clerk/clerk-react';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


const UniversalLogin = () => {
  const navigate = useNavigate();
  const auth = useBulletproofAuth();
  const mode = useAuthMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check if Clerk is available
  const isClerkMode = mode === 'clerk';

  const handleFallbackLogin = (e) => {
    e.preventDefault();

    // Simple demo login for fallback mode
    if (email && password) {
      // In fallback mode, any email/password works for demo
      logDebug('Fallback login successful');
      navigate('/dashboard');
    } else {
      setError('Please enter email and password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to Sentia
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isClerkMode ? 'Secure authentication powered by Clerk' : 'Guest mode - Any credentials work'}
          </p>
        </div>

        {isClerkMode ? (
          // Clerk authentication
          <div className="mt-8">
            <SignIn
              redirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "w-full mb-2",
                  formButtonPrimary: "w-full bg-blue-600 hover:bg-blue-700",
                  footerActionLink: "text-blue-600 hover:text-blue-500"
                }
              }}
            />
          </div>
        ) : (
          // Fallback authentication
          <form className="mt-8 space-y-6" onSubmit={handleFallbackLogin}>
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="demo@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="any password"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in (Demo Mode)
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  In demo mode, any email and password will work
                </p>
              </div>
            </div>
          </form>
        )}

        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Continue as guest →
          </button>
        </div>

        {/* Auth Mode Indicator */}
        <div className="mt-4 text-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isClerkMode ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isClerkMode ? '🔒 Clerk Authentication Active' : '⚡ Fallback Mode Active'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UniversalLogin;