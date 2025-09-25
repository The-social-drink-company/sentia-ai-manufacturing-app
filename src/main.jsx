/**
 * SENTIA MANUFACTURING DASHBOARD - MAIN ENTRY (NO AUTHENTICATION)
 *
 * This is the production-ready main entry point WITHOUT authentication.
 * Authentication was removed on September 24, 2025 per NO_AUTHENTICATION_DEPLOYED.md
 *
 * @version 3.1.0 - No Authentication
 */

import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
    console.error('[ErrorBoundary] Caught error:', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// APPLICATION INITIALIZATION (NO AUTHENTICATION)
// ============================================================================

const initializeApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('[main] Root element not found');
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: system-ui;">
        <h1 style="color: red;">Critical Error</h1>
        <p>Root element not found. Please check your HTML template.</p>
      </div>
    `;
    return;
  }

  console.log('[main] Initializing Sentia Manufacturing Dashboard (No Authentication)...');

  const root = createRoot(rootElement);

  try {
    // Directly render the App without any authentication
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );

    console.log('[main] Application mounted successfully (No Authentication)');

  } catch (error) {
    console.error('[main] Critical initialization error:', error);

    // Render error fallback
    root.render(
      <StrictMode>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Failed to load application
              </h2>
              <p className="text-gray-600 mb-4">
                {error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </StrictMode>
    );
  }
};

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

// Handle uncaught errors
window.addEventListener('error', (event) => {
  console.error('[main] Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[main] Unhandled promise rejection:', event.reason);
});

// ============================================================================
// SERVICE WORKER CLEANUP (Prevent caching issues)
// ============================================================================

// Unregister any existing service workers to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('[main] Unregistered service worker:', registration.scope);
    });
  });
}

// ============================================================================
// START APPLICATION
// ============================================================================

// Start immediately without async/await
initializeApp();