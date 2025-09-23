/**
 * Stage 2 App - Dashboard & Analytics Features
 * Includes core + analytics dashboards and financial features
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuth } from '@clerk/clerk-react';

// Core Layout Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import ErrorFallback from './components/ui/ErrorFallback';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Stage 1 Pages (Essential)
const EnterpriseDashboard = lazy(() => import('./pages/Dashboard/EnterpriseDashboard'));
const WorkingCapital = lazy(() => import('./components/WorkingCapital/WorkingCapital'));
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis'));
const Settings = lazy(() => import('./pages/Settings'));

// Stage 2 Pages (Analytics & Dashboards)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WorldClassDashboard = lazy(() => import('./pages/WorldClassDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const FinancialReports = lazy(() => import('./pages/Financial/FinancialReports'));
const WorkingCapitalExpert = lazy(() => import('./components/WorkingCapital/WorkingCapitalExpert'));
const Reports = lazy(() => import('./components/Reports'));
const Forecasting = lazy(() => import('./pages/Forecasting'));
const DataImport = lazy(() => import('./components/DataImport'));

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

// Main authenticated application - Stage 2
const AuthenticatedApp = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (!isLoaded) {
    return <PageLoader />;
  }

  if (!isSignedIn) {
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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Core Routes - Stage 1 */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <EnterpriseDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/enterprise" element={
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

                {/* Analytics Routes - Stage 2 */}
                <Route path="/dashboard/world-class" element={
                  <ProtectedRoute>
                    <WorldClassDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="/financial-reports" element={
                  <ProtectedRoute>
                    <FinancialReports />
                  </ProtectedRoute>
                } />
                <Route path="/working-capital/expert" element={
                  <ProtectedRoute>
                    <WorkingCapitalExpert />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/forecasting" element={
                  <ProtectedRoute>
                    <Forecasting />
                  </ProtectedRoute>
                } />
                <Route path="/data-import" element={
                  <ProtectedRoute>
                    <DataImport />
                  </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App component - Stage 2
const AppStage2 = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error('Application error:', error);
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

export default AppStage2;