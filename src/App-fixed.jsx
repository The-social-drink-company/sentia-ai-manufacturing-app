/**
 * FIXED App Entry Point - consolidated, production-ready shell with Clerk authentication.
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import { SignIn, SignUp, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';

import { ThemeProvider } from './components/ui/ThemeProvider';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { devLog } from './utils/structuredLogger';
import { BulletproofAuthProvider } from './auth/BulletproofAuthProvider';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const WorkingCapital = lazy(() => import('./pages/WorkingCapital'));
const WhatIfAnalysis = lazy(() => import('./components/WhatIfAnalysis'));
const Production = lazy(() => import('./pages/Production'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Quality = lazy(() => import('./pages/Quality'));
const Forecasting = lazy(() => import('./pages/Forecasting'));
const AdminPanelEnhanced = lazy(() => import('./pages/AdminPanelEnhanced'));
const AdminPage = lazy(() => import('./pages/Admin'));
const Settings = lazy(() => import('./pages/Settings'));
const DataImport = lazy(() => import('./components/DataImport'));
const ImportTemplates = lazy(() => import('./components/data/ImportTemplates'));
const Analytics = lazy(() => import('./pages/Analytics'));
const RealTimeAnalytics = lazy(() => import('./pages/RealTimeAnalytics'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" label="Loading page..." />
  </div>
);

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        type="button"
      >
        Try again
      </button>
    </div>
  </div>
);

const isValidClerkKey = (key) =>
  typeof key === 'string' &&
  (key.startsWith('pk_live_') || key.startsWith('pk_test_')) &&
  key.length > 20 &&
  !key.includes('undefined') &&
  !key.includes('YOUR_KEY') &&
  !key.includes('your_key_here');

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsSidebarOpen(window.innerWidth >= 1024);
  }, []);

  const handleMenuToggle = () => {
    setIsSidebarOpen((previous) => !previous);
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen((previous) => !previous);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
        <main className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<PageLoading />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
};

const ProtectedRoot = () => (
  <>
    <SignedIn>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

const MonitoringPlaceholder = () => (
  <div className="rounded-2xl border border-dashed border-blue-200 bg-white/80 p-8 text-center shadow-sm">
    <h2 className="text-xl font-semibold text-slate-900">Monitoring Console</h2>
    <p className="mt-2 text-sm text-slate-600">
      Live telemetry integration is being finalized. Check back soon for real-time metrics.
    </p>
  </div>
);

const OfflineExperience = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-slate-900">Sentia Manufacturing Dashboard</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Authentication keys are not configured. You are viewing the offline experience with sample data while
          we wait for Clerk credentials.
        </p>
      </section>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <Suspense fallback={<PageLoading />}>
          <Dashboard />
        </Suspense>
      </div>
    </div>
  </div>
);

function App() {
  devLog.log('[App-fixed] Initializing fixed app...');

  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const hasValidClerkKey = isValidClerkKey(clerkKey);

  if (!hasValidClerkKey) {
    devLog.log('[App-fixed] Missing Clerk key, rendering offline dashboard');
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light" storageKey="sentia-ui-theme">
            <Router>
              <Routes>
                <Route path="*" element={<OfflineExperience />} />
              </Routes>
            </Router>
            <Toaster position="top-right" />
          </ThemeProvider>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  devLog.log('[App-fixed] Rendering authenticated application shell');

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BulletproofAuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light" storageKey="sentia-ui-theme">
            <Router>
              <Routes>
                <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
                <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
                <Route path="/login" element={<Navigate to="/sign-in" replace />} />
                <Route path="/register" element={<Navigate to="/sign-up" replace />} />
                <Route path="/" element={<ProtectedRoot />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="working-capital" element={<WorkingCapital />} />
                  <Route path="what-if" element={<WhatIfAnalysis />} />
                  <Route path="production" element={<Production />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="quality" element={<Quality />} />
                  <Route path="forecasting" element={<Forecasting />} />
                  <Route path="ai-analytics" element={<RealTimeAnalytics />} />
                  <Route path="reports" element={<Analytics />} />
                  <Route path="import" element={<DataImport />} />
                  <Route path="templates" element={<ImportTemplates />} />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="users" element={<AdminPanelEnhanced />} />
                  <Route path="config" element={<Settings />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="monitoring" element={<MonitoringPlaceholder />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </Router>
            <Toaster position="top-right" />
          </ThemeProvider>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </BulletproofAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
