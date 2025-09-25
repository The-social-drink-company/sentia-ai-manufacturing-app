/**
 * Stage 1 App - Minimal Core Infrastructure
 * Basic app shell with authentication and routing
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
// Core Layout Components - Direct imports for stage 1
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import ErrorFallback from './components/ui/ErrorFallback';
import { logDebug, logInfo, logWarn, logError } from './utils/logger';


// Lazy load only essential pages for stage 1
const EnterpriseDashboard = lazy(() => import('./pages/Dashboard/EnterpriseDashboard'));
const WorkingCapital = lazy(() => import('./components/WorkingCapital/WorkingCapital'));
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis'));
const Settings = lazy(() => import('./pages/Settings'));

// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Main authenticated application - Stage 1
const AuthenticatedApp = () => {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (!isLoaded) {
    return <PageLoader />;
  }

  if (false) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={window.innerWidth < 768}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={{ email: 'user@sentia.com' }}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Suspense 0>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <EnterpriseDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/working-capital" element={
                  <ProtectedRoute>
                    <WorkingCapital />
                  </ProtectedRoute>
                } />
                <Route path="/what-if" element={
                  <ProtectedRoute>
                    <WhatIfAnalysis />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App component - Stage 1
const AppStage1 = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        logError('Application error:', error);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthenticatedApp />
        </Router>

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
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default AppStage1;