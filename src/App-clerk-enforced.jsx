/**
 * Sentia Manufacturing Dashboard - Clerk Authentication Enforced
 *
 * This version enforces proper Clerk authentication without any fallback modes.
 * Users MUST authenticate through Clerk to access the dashboard.
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

// Import proper Clerk authentication
import { ClerkAuthProvider } from './auth/ClerkAuthProvider';
import { ThemeProvider } from './components/ui/ThemeProvider';
import { logError } from './utils/structuredLogger';

// Components
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import ErrorFallback from './components/ui/ErrorFallback';

// Lazy-loaded components
const SignInPage = lazy(() => import('./pages/SignIn'));
const SignUpPage = lazy(() => import('./pages/SignUp'));
const AuthenticatedApp = lazy(() => import('./App-comprehensive'));

// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">Loading...</p>
    </div>
  </div>
);

// Main App component with Clerk authentication enforced
const AppClerkEnforced = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        logError('Application error in Clerk enforced app', { 
          error: error.message, 
          stack: error.stack, 
          errorInfo 
        });
      }}
    >
      <ClerkAuthProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Authentication routes */}
                  <Route path="/sign-in" element={<SignInPage />} />
                  <Route path="/sign-up" element={<SignUpPage />} />
                  
                  {/* Main authenticated application */}
                  <Route path="/*" element={<AuthenticatedApp />} />
                </Routes>
              </Suspense>
            </Router>

            {/* Global Toaster for notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />

            {/* React Query DevTools - only in development */}
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </ThemeProvider>
      </ClerkAuthProvider>
    </ErrorBoundary>
  );
};

export default AppClerkEnforced;
