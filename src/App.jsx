import React, { Suspense, useEffect } from 'react';
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

// Import components
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import WorkingCapital from './components/WorkingCapital';
import LandingPage from './components/LandingPage';

// Manufacturing components
import ProductionTracking from './components/Manufacturing/ProductionTracking';
import QualityControl from './components/Manufacturing/QualityControl';
import InventoryManagement from './components/Manufacturing/InventoryManagement';

// Advanced components
import FileImportSystem from './components/DataImport/FileImportSystem';
import AIAnalyticsDashboard from './components/AI/AIAnalyticsDashboard';
import DemandForecasting from './components/forecasting/DemandForecasting';
import WhatIfAnalysis from './components/analytics/WhatIfAnalysis';
import TestMonitorDashboard from './pages/TestMonitorDashboard';

// Layout components
import EnterpriseLayout from './components/layout/EnterpriseLayout';

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
                      
                      {/* Protected routes */}
                      <Route path="/" element={
                        <AuthGuard>
                          <EnterpriseLayout>
                            <LandingPage />
                          </EnterpriseLayout>
                        </AuthGuard>
                      } />
                      
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