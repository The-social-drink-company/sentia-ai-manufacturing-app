import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, useSession } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * SessionManager Component - Manages session lifecycle and automatic refresh
 * Displays warnings before session expiry and handles automatic token refresh
 */
const SessionManager = ({ children, warningTime = 300000 }) => { // 5 minutes warning by default
  const { isSignedIn, sessionId, getToken } = useAuth();
  const { session } = useSession();
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Track user activity
  const trackActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  // Refresh session token
  const refreshSession = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      setIsRefreshing(true);
      // Get a fresh token from Clerk
      const token = await getToken({ template: 'default' });
      if (token) {
        // // console.log('Session refreshed successfully');
        setShowWarning(false);
        // Update session expiry time
        if (session?.lastActiveAt) {
          const expiryTime = new Date(session.lastActiveAt).getTime() + (60 * 60 * 1000); // 1 hour
          setSessionExpiry(expiryTime);
        }
      }
    } catch (error) {
      logError('Failed to refresh session:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isSignedIn, getToken, session]);

  // Monitor session expiry
  useEffect(() => {
    if (!session || !isSignedIn) {
      setSessionExpiry(null);
      setShowWarning(false);
      return;
    }

    // Calculate session expiry (Clerk sessions typically last 1 hour)
    const lastActive = session.lastActiveAt || session.createdAt;
    const expiryTime = new Date(lastActive).getTime() + (60 * 60 * 1000); // 1 hour
    setSessionExpiry(expiryTime);

    const checkSessionExpiry = () => {
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      // Show warning when less than warningTime remains
      if (timeUntilExpiry > 0 && timeUntilExpiry <= warningTime && !showWarning) {
        setShowWarning(true);
      }

      // Auto-refresh if user was recently active
      if (timeUntilExpiry > 0 && timeUntilExpiry <= 60000) { // 1 minute before expiry
        const timeSinceActivity = now - lastActivity;
        if (timeSinceActivity < 300000) { // Active in last 5 minutes
          refreshSession();
        }
      }
    };

    const interval = setInterval(checkSessionExpiry, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [session, isSignedIn, warningTime, showWarning, lastActivity, refreshSession]);

  // Add activity listeners
  useEffect(() => {
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, trackActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, [trackActivity]);

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!sessionExpiry) return '';

    const now = Date.now();
    const remaining = Math.max(0, sessionExpiry - now);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}

      {/* Session Warning Modal */}
      <AnimatePresence>
        {showWarning && isSignedIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mx-auto mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Session Expiring Soon
              </h2>

              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                Your session will expire in <span className="font-mono font-bold text-yellow-600 dark:text-yellow-500">{formatTimeRemaining()}</span>
              </p>

              <div className="space-y-3">
                <button
                  onClick={refreshSession}
                  disabled={isRefreshing}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
                >
                  {isRefreshing ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2" />
                      Extend Session
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowWarning(false)}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
                >
                  Continue Working
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Click anywhere or press any key to keep your session active
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Timer Badge (Optional - can be shown in development) */}
      {process.env.NODE_ENV === 'development' && isSignedIn && sessionExpiry && (
        <div className="fixed bottom-4 right-4 bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm z-40">
          <ClockIcon className="h-4 w-4" />
          <span>Session: {formatTimeRemaining()}</span>
          {isRefreshing && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
        </div>
      )}
    </>
  );
};

// Hook for programmatic session management
export const useSessionManager = () => {
  const { isSignedIn, sessionId, getToken } = useAuth();
  const { session } = useSession();

  const refreshSession = async () => {
    if (!isSignedIn) return false;

    try {
      const token = await getToken({ template: 'default' });
      return !!token;
    } catch (error) {
      logError('Session refresh failed:', error);
      return false;
    }
  };

  const getSessionInfo = () => {
    if (!session) return null;

    const lastActive = session.lastActiveAt || session.createdAt;
    const expiryTime = new Date(lastActive).getTime() + (60 * 60 * 1000);
    const now = Date.now();
    const remaining = Math.max(0, expiryTime - now);

    return {
      sessionId,
      isActive: isSignedIn && remaining > 0,
      expiresAt: new Date(expiryTime),
      remainingMs: remaining,
      remainingMinutes: Math.floor(remaining / 60000)
    };
  };

  return {
    refreshSession,
    getSessionInfo,
    isSignedIn,
    sessionId
  };
};

export default SessionManager;