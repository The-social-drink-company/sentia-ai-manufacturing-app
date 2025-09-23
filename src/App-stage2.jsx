/**
 * STAGE 2: Core + Essential Business Features
 * Adds Working Capital and What-If Analysis
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Core components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Stage 1: Core pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

// Stage 2: Essential business features
const WorkingCapital = lazy(() => import('./components/WorkingCapital/WorkingCapital'));
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis'));
const Production = lazy(() => import('./pages/Production'));
const Inventory = lazy(() => import('./pages/Inventory'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppStage2() {
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

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default AppStage2;