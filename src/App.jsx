import React, { Suspense, useEffect, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { SSEProvider } from './context/SSEProvider';
import { MicrosoftAuthProvider } from './contexts/MicrosoftAuthContext';
import { setupGlobalErrorHandling } from './utils/errorHandling';
import ErrorBoundary from './components/ErrorBoundary';
import AuthGuard from './components/auth/AuthGuard';
import SignInPage from './pages/auth/SignInPage';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

// Core components (loaded immediately)
import LandingPage from './components/LandingPage';

// Layout components (loaded immediately)
import EnterpriseLayout from './components/layout/EnterpriseLayout';

// Lazy-loaded components for better code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const WorkingCapital = lazy(() => import('./components/WorkingCapital'));

// Manufacturing components (lazy loaded)
const ProductionTracking = lazy(() => import('./components/Manufacturing/ProductionTracking'));
const QualityControl = lazy(() => import('./components/Manufacturing/QualityControl'));
const InventoryManagement = lazy(() => import('./components/Manufacturing/InventoryManagement'));

// Advanced components (lazy loaded)
const FileImportSystem = lazy(() => import('./components/DataImport/FileImportSystem'));
const AIAnalyticsDashboard = lazy(() => import('./components/AI/AIAnalyticsDashboard'));
const DemandForecasting = lazy(() => import('./components/forecasting/DemandForecasting'));
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis'));
const TestMonitorDashboard = lazy(() => import('./pages/TestMonitorDashboard'));
const Analytics = lazy(() => import('./components/analytics/Analytics'));
const Templates = lazy(() => import('./components/templates/Templates'));
const Settings = lazy(() => import('./components/settings/Settings'));
const SystemHealth = lazy(() => import('./components/system/SystemHealth'));
const Experimental = lazy(() => import('./components/experimental/Experimental'));

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Setup global error handling
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return (
    <SessionProvider
      session={null}
      basePath="/api/auth"
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      <QueryClientProvider client={queryClient}>
        <MicrosoftAuthProvider>
          <SSEProvider>
            <ErrorBoundary>
              <Router>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/auth/signin" element={<SignInPage />} />
                      <Route path="/auth/error" element={<div>Authentication Error</div>} />
                      
                      {/* Public landing page */}
                      <Route path="/" element={<LandingPage />} />
                      
                      <Route path="/dashboard" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <Dashboard />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/admin" element={
                        <AuthGuard requiredRole="admin">
                          <EnterpriseLayout>
                            <AdminPanel />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/working-capital" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <WorkingCapital />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/production" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <ProductionTracking />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/quality" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <QualityControl />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/inventory" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <InventoryManagement />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/data-import" element={
                        <AuthGuard requiredRole="data_manager">
                          <EnterpriseLayout>
                            <FileImportSystem />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/ai-analytics" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <AIAnalyticsDashboard />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/forecasting" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <DemandForecasting />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/what-if" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <WhatIfAnalysis />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/analytics" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <Analytics />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/templates" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <Templates />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/settings" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <Settings />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/system/health" element={
                        <AuthGuard requiredRole="admin">
                          <EnterpriseLayout>
                            <SystemHealth />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/experimental" element={
                        <AuthGuard requiredRole="admin">
                          <EnterpriseLayout>
                            <Experimental />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      <Route path="/test-monitor" element={
                        <AuthGuard requiredRole="admin">
                          <EnterpriseLayout>
                            <TestMonitorDashboard />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />

                      {/* Fallback route */}
                      <Route path="*" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <Dashboard />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />
                    </Routes>
                  </Suspense>
                  
                  {/* Toast notifications */}
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      className: 'dark:bg-gray-800 dark:text-white',
                    }}
                  />
                </div>
              </Router>
            </ErrorBoundary>
          </SSEProvider>
        </MicrosoftAuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default App;