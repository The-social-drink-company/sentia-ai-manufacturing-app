/**
 * STAGE 3: Core + Business + Analytics
 * Adds AI components, advanced analytics, and data management
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';

// Core components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Stage 1: Core pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

// Stage 2: Essential business features
const WorkingCapital = lazy(() => import('./components/WorkingCapital/WorkingCapital'));
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis'));
const Production = lazy(() => import('./pages/Production'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Quality = lazy(() => import('./pages/Quality'));
const Forecasting = lazy(() => import('./pages/Forecasting'));

// Stage 3: Analytics and AI
const Analytics = lazy(() => import('./pages/Analytics'));
const AIAnalytics = lazy(() => import('./components/AI/AIAnalytics'));
const DataImport = lazy(() => import('./components/DataImport'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Reports = lazy(() => import('./components/Reports'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppStage3() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-6">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* Stage 2 routes */}
                  <Route path="/working-capital" element={
                    <ProtectedRoute requiredPermission="finance.view">
                      <WorkingCapital />
                    </ProtectedRoute>
                  } />
                  <Route path="/what-if" element={
                    <ProtectedRoute requiredPermission="analytics.view">
                      <WhatIfAnalysis />
                    </ProtectedRoute>
                  } />
                  <Route path="/production" element={<Production />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/quality" element={<Quality />} />
                  <Route path="/forecasting" element={<Forecasting />} />

                  {/* Stage 3 routes */}
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/ai-analytics" element={
                    <ProtectedRoute requiredPermission="ai.view">
                      <AIAnalytics />
                    </ProtectedRoute>
                  } />
                  <Route path="/data-import" element={
                    <ProtectedRoute requiredPermission="data.import">
                      <DataImport />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute requiredPermission="admin.access">
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={<Reports />} />

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </Router>
      <Toaster position="top-right" />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export default AppStage3;