/**
 * SENTIA MANUFACTURING DASHBOARD - MAIN ENTRY WITH CLERK AUTHENTICATION
 *
 * This is the production-ready main entry point with complete Clerk authentication,
 * bulletproof error handling, and fallback mechanisms to prevent blank screens.
 *
 * @version 3.0.0 - Full Authentication Implementation
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { logDebug, logInfo, logWarn, logError } from './utils/logger';

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================

// Clerk Configuration with fallback to test keys
const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk';

// Check if we have valid Clerk keys
const hasClerkKeys = CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.startsWith('pk_');

// Enable auth fallback for development or when keys are missing
const ENABLE_AUTH_FALLBACK =
  import.meta.env.VITE_ENABLE_AUTH_FALLBACK !== 'false' &&
  import.meta.env.NODE_ENV !== 'production';

// ============================================================================
// FALLBACK UI COMPONENTS
// ============================================================================

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Initializing Sentia Manufacturing Dashboard
      </h2>
      <p className="text-gray-600">
        Setting up secure access...
      </p>
    </div>
  </div>
);

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  logError('[ErrorFallback] Rendering error UI:', error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3l-7.928-13.856c-.77-1.333-2.694-1.333-3.464 0L1.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Initialization Error
            </h1>
            <p className="text-gray-600 mb-6">
              {error?.message || 'An unexpected error occurred during initialization'}
            </p>
            <div className="space-y-3">
              {resetErrorBoundary && (
                <button
                  onClick={resetErrorBoundary}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DemoModeNotice = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-100">
    <div className="max-w-md w-full">
      <div className="bg-white shadow-xl rounded-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Demo Mode Active
          </h1>
          <p className="text-gray-600 mb-6">
            Running in demo mode without authentication.
            Configure Clerk keys for production use.
          </p>
          <a
            href="/dashboard"
            className="block w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Enter Demo Dashboard
          </a>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError('[ErrorBoundary] Caught error:', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback
        error={this.state.error}
        resetErrorBoundary={() => this.setState({ hasError: false, error: null })}
      />;
    }
    return this.props.children;
  }
}

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

const initializeApp = async () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    logError('[main-with-clerk] Root element not found');
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: system-ui;">
        <h1 style="color: red;">Critical Error</h1>
        <p>Root element not found. Please check your HTML template.</p>
      </div>
    `;
    return;
  }

  logInfo('[main-with-clerk] Initializing application...');
  logDebug('[main-with-clerk] Clerk key status:', { hasClerkKeys, ENABLE_AUTH_FALLBACK });

  const root = createRoot(rootElement);

  // Show loading screen immediately
  root.render(
    <StrictMode>
      <LoadingScreen />
    </StrictMode>
  );

  try {
    // Determine which authentication mode to use
    if (hasClerkKeys) {
      logInfo('[main-with-clerk] Loading with Clerk authentication...');

      try {
        // Import BulletproofClerkProvider for robust auth handling
        const { BulletproofClerkProvider } = await import('./auth/BulletproofClerkProvider');
        const { default: App } = await import('./App.jsx');

        logInfo('[main-with-clerk] Clerk components loaded successfully');

        // Render with Clerk authentication
        root.render(
          <StrictMode>
            <ErrorBoundary>
              
                <App />
              
            </ErrorBoundary>
          </StrictMode>
        );

        logInfo('[main-with-clerk] Application mounted with Clerk authentication');

      } catch (clerkError) {
        logError('[main-with-clerk] Failed to load Clerk components:', clerkError);

        if (ENABLE_AUTH_FALLBACK) {
          logWarn('[main-with-clerk] Falling back to demo mode...');

          // Load app without authentication
          const { default: App } = await import('./App.jsx');

          root.render(
            <StrictMode>
              <ErrorBoundary>
                <div>
                  <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-50">
                    Demo Mode - Authentication Disabled
                  </div>
                  <App />
                </div>
              </ErrorBoundary>
            </StrictMode>
          );

          logInfo('[main-with-clerk] Application mounted in demo mode');
        } else {
          throw clerkError;
        }
      }

    } else {
      logWarn('[main-with-clerk] No Clerk keys found, loading in demo mode...');

      // Check if demo mode is allowed
      if (ENABLE_AUTH_FALLBACK) {
        // Show demo mode notice
        root.render(
          <StrictMode>
            <DemoModeNotice />
          </StrictMode>
        );

        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);

      } else {
        throw new Error('Authentication keys not configured. Please set VITE_CLERK_PUBLISHABLE_KEY.');
      }
    }

  } catch (error) {
    logError('[main-with-clerk] Critical initialization error:', error);

    // Render error fallback
    root.render(
      <StrictMode>
        <ErrorFallback
          error={error}
          resetErrorBoundary={() => window.location.reload()}
        />
      </StrictMode>
    );
  }
};

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

// Handle uncaught errors
window.addEventListener('error', (event) => {
  logError('[main-with-clerk] Global error:', event.error);

  // Check if it's a Clerk-related error
  if (event.error?.message?.includes('Clerk') ||
      event.error?.message?.includes('publishable')) {
    logWarn('[main-with-clerk] Clerk-related error detected, consider enabling fallback mode');
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logError('[main-with-clerk] Unhandled promise rejection:', event.reason);

  // Check if it's an authentication error
  if (event.reason?.message?.includes('401') ||
      event.reason?.message?.includes('403') ||
      event.reason?.message?.includes('Unauthorized')) {
    logWarn('[main-with-clerk] Authentication error detected');
  }
});

// ============================================================================
// SERVICE WORKER MANAGEMENT
// ============================================================================

// Unregister any existing service workers to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      logDebug('[main-with-clerk] Unregistered service worker:', registration.scope);
    });
  });
}

// ============================================================================
// START APPLICATION
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

logInfo('[main-with-clerk] Main entry point loaded');