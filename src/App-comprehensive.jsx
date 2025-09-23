/**
 * Sentia Manufacturing Dashboard - COMPREHENSIVE Enterprise Implementation
 *
 * This is the FULL enterprise application with ALL features from the 10-day development.
 * NO emergency versions, NO cut-down implementations - 100% complete enterprise features.
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuth, useUser } from '@clerk/clerk-react';

// Core Layout Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import ErrorFallback from './components/ui/ErrorFallback';

// Authentication Components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy-loaded Page Components - COMPREHENSIVE SET
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EnterpriseDashboard = lazy(() => import('./pages/Dashboard/EnterpriseDashboard'));
const WorldClassDashboard = lazy(() => import('./pages/WorldClassDashboard'));
const ExecutiveDashboard = lazy(() => import('./components/Executive/ExecutiveDashboard'));

// Financial Management
const WorkingCapital = lazy(() => import('./components/WorkingCapital/WorkingCapital'));
const WorkingCapitalExpert = lazy(() => import('./components/WorkingCapital/WorkingCapitalExpert'));
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis'));
const FinancialReports = lazy(() => import('./pages/Financial/FinancialReports'));

// Manufacturing Operations
const Production = lazy(() => import('./pages/Production'));
const Quality = lazy(() => import('./pages/Quality'));
const QualityControlDashboard = lazy(() => import('./components/quality/QualityControlDashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const AdvancedInventoryManagement = lazy(() => import('./components/inventory/AdvancedInventoryManagement'));
const Forecasting = lazy(() => import('./pages/Forecasting'));
const SupplyChain = lazy(() => import('./pages/SupplyChain'));

// Analytics & AI
const Analytics = lazy(() => import('./pages/Analytics'));
const AIAnalytics = lazy(() => import('./components/AI/AIAnalytics'));
const RealTimeAnalytics = lazy(() => import('./pages/RealTimeAnalytics'));
const MultiMarketAnalytics = lazy(() => import('./components/analytics/MultiMarketAnalytics'));
const AdvancedAnalyticsDashboard = lazy(() => import('./components/analytics/AdvancedAnalyticsDashboard'));

// Data Management
const DataImport = lazy(() => import('./components/DataImport'));
const DataManagementCenter = lazy(() => import('./components/data/DataManagementCenter'));
const ImportTemplates = lazy(() => import('./components/data/ImportTemplates'));

// Administration
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminPanelEnhanced = lazy(() => import('./pages/AdminPanelEnhanced'));
const UserManagement = lazy(() => import('./components/admin/UserManagement'));
const SystemConfig = lazy(() => import('./components/admin/SystemConfig'));
const Settings = lazy(() => import('./pages/Settings'));
const UserPreferences = lazy(() => import('./pages/UserPreferences'));

// Reporting
const BoardReadyReports = lazy(() => import('./components/reporting/BoardReadyReportGenerator'));
const Reports = lazy(() => import('./components/Reports'));

// Mobile & Floor Operations
const Mobile = lazy(() => import('./pages/Mobile'));
const MobileFloor = lazy(() => import('./pages/MobileFloor'));
const MobileFloorDashboard = lazy(() => import('./components/mobile/MobileFloorDashboard'));

// Mission Control & Monitoring
const MissionControl = lazy(() => import('./pages/MissionControl'));
const MCPMonitoringDashboard = lazy(() => import('./pages/MCPMonitoringDashboard'));

// Automation
const AutomationDashboard = lazy(() => import('./components/automation/AutomationDashboard'));

// React Query configuration with enterprise settings
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
      <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">Loading enterprise features...</p>
    </div>
  </div>
);

// Main authenticated application
const AuthenticatedApp = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading while auth is checking
  if (!isLoaded) {
    return <PageLoader />;
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Check if it's a fullscreen page
  const isFullscreenPage = ['/sign-in', '/sign-up', '/landing'].includes(location.pathname);

  if (isFullscreenPage) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/sign-in" element={<Navigate to="/dashboard" replace />} />
          <Route path="/sign-up" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Dashboard Routes - Multiple Options */}
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
                <Route path="/dashboard/executive" element={
                  <ProtectedRoute roles={['executive', 'admin']}>
                    <ExecutiveDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/world-class" element={
                  <ProtectedRoute>
                    <WorldClassDashboard />
                  </ProtectedRoute>
                } />

                {/* Financial Management */}
                <Route path="/working-capital" element={
                  <ProtectedRoute permissions={['view_financial']}>
                    <WorkingCapital />
                  </ProtectedRoute>
                } />
                <Route path="/working-capital/expert" element={
                  <ProtectedRoute permissions={['view_financial']}>
                    <WorkingCapitalExpert />
                  </ProtectedRoute>
                } />
                <Route path="/what-if" element={
                  <ProtectedRoute permissions={['view_analytics']}>
                    <WhatIfAnalysis />
                  </ProtectedRoute>
                } />
                <Route path="/financial-reports" element={
                  <ProtectedRoute permissions={['view_reports']}>
                    <FinancialReports />
                  </ProtectedRoute>
                } />

                {/* Manufacturing Operations */}
                <Route path="/production" element={
                  <ProtectedRoute permissions={['view_production']}>
                    <Production />
                  </ProtectedRoute>
                } />
                <Route path="/quality" element={
                  <ProtectedRoute permissions={['view_quality']}>
                    <QualityControlDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/inventory" element={
                  <ProtectedRoute permissions={['view_inventory']}>
                    <AdvancedInventoryManagement />
                  </ProtectedRoute>
                } />
                <Route path="/forecasting" element={
                  <ProtectedRoute permissions={['view_forecasting']}>
                    <Forecasting />
                  </ProtectedRoute>
                } />
                <Route path="/supply-chain" element={
                  <ProtectedRoute permissions={['view_supply_chain']}>
                    <SupplyChain />
                  </ProtectedRoute>
                } />

                {/* Analytics & AI */}
                <Route path="/analytics" element={
                  <ProtectedRoute permissions={['view_analytics']}>
                    <AdvancedAnalyticsDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/ai-analytics" element={
                  <ProtectedRoute permissions={['view_ai']}>
                    <AIAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/real-time-analytics" element={
                  <ProtectedRoute permissions={['view_analytics']}>
                    <RealTimeAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/multi-market" element={
                  <ProtectedRoute permissions={['view_analytics']}>
                    <MultiMarketAnalytics />
                  </ProtectedRoute>
                } />

                {/* Data Management */}
                <Route path="/data-import" element={
                  <ProtectedRoute permissions={['data_import']}>
                    <DataImport />
                  </ProtectedRoute>
                } />
                <Route path="/data-management" element={
                  <ProtectedRoute permissions={['data_management']}>
                    <DataManagementCenter />
                  </ProtectedRoute>
                } />
                <Route path="/import-templates" element={
                  <ProtectedRoute permissions={['data_import']}>
                    <ImportTemplates />
                  </ProtectedRoute>
                } />

                {/* Reports */}
                <Route path="/reports" element={
                  <ProtectedRoute permissions={['view_reports']}>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/board-reports" element={
                  <ProtectedRoute roles={['executive', 'admin']}>
                    <BoardReadyReports />
                  </ProtectedRoute>
                } />

                {/* Mobile & Floor */}
                <Route path="/mobile" element={
                  <ProtectedRoute>
                    <Mobile />
                  </ProtectedRoute>
                } />
                <Route path="/mobile-floor" element={
                  <ProtectedRoute permissions={['floor_access']}>
                    <MobileFloorDashboard />
                  </ProtectedRoute>
                } />

                {/* Mission Control */}
                <Route path="/mission-control" element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <MissionControl />
                  </ProtectedRoute>
                } />
                <Route path="/mcp-monitoring" element={
                  <ProtectedRoute roles={['admin']}>
                    <MCPMonitoringDashboard />
                  </ProtectedRoute>
                } />

                {/* Automation */}
                <Route path="/automation" element={
                  <ProtectedRoute permissions={['view_automation']}>
                    <AutomationDashboard />
                  </ProtectedRoute>
                } />

                {/* Administration */}
                <Route path="/admin" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminPanelEnhanced />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute roles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/system" element={
                  <ProtectedRoute roles={['admin']}>
                    <SystemConfig />
                  </ProtectedRoute>
                } />

                {/* Settings */}
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/preferences" element={
                  <ProtectedRoute>
                    <UserPreferences />
                  </ProtectedRoute>
                } />

                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App component with all providers
// NOTE: This component expects to be wrapped by ClerkProvider from App-multistage.jsx
const AppComprehensive = () => {
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
        <Router>
          <AuthenticatedApp />
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
    </ErrorBoundary>
  );
};

export default AppComprehensive;