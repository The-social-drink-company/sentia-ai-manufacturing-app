/**
 * Sentia Manufacturing Dashboard - Enterprise Clerk Implementation
 * 
 * This is the main application component with FULL Clerk enterprise authentication.
 * NO JWT-ONLY implementations - 100% enterprise Clerk features.
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

// Enterprise Clerk Provider (FULL IMPLEMENTATION)
import { 
  EnterpriseClerkProvider, 
  useEnterpriseAuth, 
  useEnterpriseUser,
  useEnterpriseSession,
  SignIn,
  SignUp,
  UserButton,
  OrganizationSwitcher
} from './auth/EnterpriseClerkProvider';

// Core components
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import ErrorFallback from './components/ui/ErrorFallback';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy-loaded components for performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const WorkingCapital = lazy(() => import('./components/WorkingCapital'));
const DataImport = lazy(() => import('./components/DataImport'));
const Analytics = lazy(() => import('./components/Analytics'));
const Reports = lazy(() => import('./components/Reports'));
const Settings = lazy(() => import('./components/Settings'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const ExecutiveDashboard = lazy(() => import('./components/executive/ExecutiveDashboard'));
const WorkingCapitalIntelligence = lazy(() => import('./components/executive/ExecutiveWorkingCapitalDashboard'));
const DataManagementCenter = lazy(() => import('./components/data/DataManagementCenter'));
const BoardReadyReports = lazy(() => import('./components/reporting/BoardReadyReportGenerator'));

// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading component for Suspense
const SuspenseLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading application...</p>
    </div>
  </div>
);

// Authentication wrapper component
const AuthenticatedApp = () => {
  const { user, isLoaded, userRole, permissions, canAccessAnalytics } = useEnterpriseUser();
  const { session, validateSession } = useEnterpriseSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Session validation effect
  useEffect(() => {
    if (isLoaded && session) {
      const isValid = validateSession();
      if (!isValid) {
        console.warn('Session validation failed, redirecting to sign in');
        // Session will be handled by Clerk automatically
      }
    }
  }, [isLoaded, session, validateSession]);

  // Loading state
  if (!isLoaded) {
    return <SuspenseLoader />;
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sentia Manufacturing
            </h1>
            <p className="text-gray-600">
              Enterprise Manufacturing Intelligence Platform
            </p>
          </div>
          <SignIn 
            routing="path" 
            path="/sign-in"
            redirectUrl="/dashboard"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with enterprise features */}
      <Header 
        user={user}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        userButton={<UserButton afterSignOutUrl="/" />}
        organizationSwitcher={<OrganizationSwitcher />}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole={userRole}
          permissions={permissions}
        />

        {/* Main content */}
        <main className="flex-1 lg:ml-64">
          <div className="p-6">
            <Suspense 0>
              <Routes>
                {/* Public routes */}
                <Route path="/sign-in" element={<SignIn routing="path" path="/sign-in" />} />
                <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" />} />

                {/* Protected routes */}
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
                    <ProtectedRoute permissions={['financials']}>
                      <WorkingCapital />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/data-import" 
                  element={
                    <ProtectedRoute permissions={['data_import']}>
                      <DataImport />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute permissions={['analytics']}>
                      <Analytics />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />

                {/* Executive routes */}
                <Route 
                  path="/executive" 
                  element={
                    <ProtectedRoute roles={['executive', 'admin']}>
                      <ExecutiveDashboard />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/executive/working-capital" 
                  element={
                    <ProtectedRoute roles={['executive', 'admin']} permissions={['financials']}>
                      <WorkingCapitalIntelligence />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/executive/reports" 
                  element={
                    <ProtectedRoute roles={['executive', 'admin']}>
                      <BoardReadyReports />
                    </ProtectedRoute>
                  } 
                />

                {/* Data management routes */}
                <Route 
                  path="/data-management" 
                  element={
                    <ProtectedRoute permissions={['data_management']}>
                      <DataManagementCenter />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin routes */}
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminPanel />
                    </ProtectedRoute>
                  } 
                />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App component with enterprise providers
const App = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo);
        // Send to error tracking service
        if (import.meta.env.VITE_SENTRY_DSN) {
          // Sentry error reporting would go here
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <EnterpriseClerkProvider>
          <Router>
            <AuthenticatedApp />
            
            {/* Global components */}
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
            
            {/* React Query DevTools (development only) */}
            {import.meta.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </Router>
        </EnterpriseClerkProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
