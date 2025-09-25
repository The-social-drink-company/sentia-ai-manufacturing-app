/**
 * Emergency App Component - Simplified Clerk Implementation
 * 
 * This is a minimal, working version designed to:
 * 1. Get the application running immediately
 * 2. Provide basic authentication functionality
 * 3. Enable client demonstration
 * 4. Serve as fallback during deployment issues
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

// Emergency Clerk Provider
import { 
  EmergencyClerkProvider, 
  useEmergencyAuth,
  SignIn,
  SignUp,
  UserButton
} from './auth/EmergencyClerkProvider';

// Core components
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { logDebug, logInfo, logWarn, logError } from './utils/logger';


// Lazy-loaded components
const Dashboard = lazy(() => import('./components/Dashboard'));
const WorkingCapital = lazy(() => import('./components/WorkingCapital'));

// Simple loading component
const SimpleLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-red-50">
    <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
);

// Simple header component
const SimpleHeader = ({ user, onSignOut }) => (
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Sentia Manufacturing
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <span className="text-sm text-gray-600">
                Welcome, {user.firstName || null}
              </span>
              <UserButton afterSignOutUrl="/" />
            </>
          )}
        </div>
      </div>
    </div>
  </header>
);

// Simple navigation
const SimpleNav = () => (
  <nav className="bg-gray-50 border-r min-h-screen w-64 p-4">
    <div className="space-y-2">
      <a
        href="/dashboard"
        className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        Dashboard
      </a>
      <a
        href="/working-capital"
        className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        Working Capital
      </a>
    </div>
  </nav>
);

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isReady } = useEmergencyAuth();

  if (!isReady) {
    return <SimpleLoader />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
};

// Main authenticated app
const AuthenticatedApp = () => {
  const { user, isSignedIn, isReady } = useEmergencyAuth();

  // Loading state
  if (!isReady) {
    return <SimpleLoader />;
  }

  // Not authenticated - show sign in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sentia Manufacturing
            </h1>
            <p className="text-gray-600">
              Manufacturing Intelligence Platform
            </p>
          </div>
          <Routes>
            <Route path="/sign-in" element={<SignIn routing="path" path="/sign-in" />} />
            <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" />} />
            <Route path="*" element={<Navigate to="/sign-in" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // Authenticated - show main app
  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader user={user} />
      
      <div className="flex">
        <SimpleNav />
        
        <main className="flex-1 p-6">
          <Suspense 0>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/working-capital" 
                element={
                  <ProtectedRoute>
                    <WorkingCapital />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback for any other routes */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// Main App component
const EmergencyApp = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        logError('Application error:', error, errorInfo);
      }}
    >
      <EmergencyClerkProvider>
        <Router>
          <AuthenticatedApp />
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Router>
      </EmergencyClerkProvider>
    </ErrorBoundary>
  );
};

export default EmergencyApp;
