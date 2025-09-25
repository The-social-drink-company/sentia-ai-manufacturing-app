import React, { useEffect, useState } from 'react';
const AuthVerification = () => {
  const auth = useBulletproofAuth();
  const mode = useAuthMode();
  const role = useAuthRole();
  const [clerkStatus, setClerkStatus] = useState('checking');

  useEffect(() => {
    // Check Clerk environment variable
    const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

    if (!clerkKey) {
      setClerkStatus('no-key');
    } else if (!clerkKey.startsWith('pk_')) {
      setClerkStatus('invalid-key');
    } else {
      setClerkStatus('key-present');
    }
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'clerk': return 'text-green-600';
      case 'fallback': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm border border-gray-200 dark:border-gray-700 z-50">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
        🔐 Auth System Status
      </h3>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Auth Mode:</span>
          <span className={`font-semibold ${getStatusColor(mode)}`}>
            {mode === 'clerk' ? '✓ Clerk Active' : mode === 'fallback' ? '⚡ Fallback Mode' : mode}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Clerk Key:</span>
          <span className={clerkStatus === 'key-present' ? 'text-green-600' : 'text-yellow-600'}>
            {clerkStatus === 'key-present' ? '✓ Configured' :
             clerkStatus === 'no-key' ? '✗ Not Set' :
             clerkStatus === 'invalid-key' ? '⚠ Invalid' :
             'Checking...'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Auth Loaded:</span>
          <span className={auth.isLoaded ? 'text-green-600' : 'text-yellow-600'}>
            {auth.isLoaded ? '✓ Ready' : '⏳ Loading'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">User Status:</span>
          <span className={auth.isSignedIn ? 'text-green-600' : 'text-gray-500'}>
            {auth.isSignedIn ? '✓ Signed In' : '○ Guest'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">User Role:</span>
          <span className="font-semibold text-blue-600">
            {role.role || 'viewer'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">User ID:</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">
            {auth.userId || 'guest_user'}
          </span>
        </div>

        {auth.user && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Display Name:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {auth.user.firstName || auth.user.fullName || 'Guest'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-center">
          {mode === 'clerk' ? (
            <span className="text-green-600 font-semibold">
              ✅ Clerk Authentication Active
            </span>
          ) : mode === 'fallback' ? (
            <span className="text-yellow-600 font-semibold">
              ⚡ Running in Fallback Mode (App Working)
            </span>
          ) : (
            <span className="text-gray-500">
              Initializing...
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        BulletproofAuth v1.0 - Never Fails
      </div>
    </div>
  );
};

export default AuthVerification;