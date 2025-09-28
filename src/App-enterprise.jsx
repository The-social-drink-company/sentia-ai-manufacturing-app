import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
  RedirectToSignIn,
  useUser
} from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

// Import core pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login';

// Lazy load all dashboard pages
const Dashboard = lazy(() => import('./pages/DashboardEnterprise'));
const WorkingCapital = lazy(() => import('./components/WorkingCapital/RealWorkingCapital'));
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis'));
const DemandForecasting = lazy(() => import('./components/analytics/DemandForecasting'));
const InventoryManagement = lazy(() => import('./components/inventory/InventoryDashboard'));
const ProductionTracking = lazy(() => import('./components/production/ProductionDashboard'));
const QualityControl = lazy(() => import('./components/quality/QualityDashboard'));
const AIAnalytics = lazy(() => import('./components/ai/AIAnalyticsDashboard'));
const DataImport = lazy(() => import('./components/data/DataImportWidget'));
const AdminPanel = lazy(() => import('./pages/Admin'));
const SystemConfig = lazy(() => import('./components/admin/SystemConfig'));

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchInterval: 1000 * 60, // 1 minute
    },
  },
});

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Error Fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-red-50">
    <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-xl">
      <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-gray-700 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  </div>
);

// Main navigation layout
const MainLayout = ({ children }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigationItems = [
    { section: 'Overview', items: [
      { to: '/dashboard', icon: '📊', label: 'Dashboard' }
    ]},
    { section: 'Planning & Analytics', items: [
      { to: '/forecasting', icon: '📈', label: 'Demand Forecasting' },
      { to: '/inventory', icon: '📦', label: 'Inventory Management' },
      { to: '/production', icon: '🏭', label: 'Production Tracking' },
      { to: '/quality', icon: '✅', label: 'Quality Control' },
      { to: '/ai-analytics', icon: '🤖', label: 'AI Analytics' }
    ]},
    { section: 'Financial Management', items: [
      { to: '/working-capital', icon: '💰', label: 'Working Capital' },
      { to: '/what-if', icon: '🔄', label: 'What-If Analysis' }
    ]},
    { section: 'Data Management', items: [
      { to: '/data-import', icon: '📥', label: 'Data Import' }
    ]},
    { section: 'Administration', items: [
      { to: '/admin', icon: '⚙️', label: 'Admin Panel' },
      { to: '/system-config', icon: '🔧', label: 'System Config' }
    ]}
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white shadow-lg`}>
        <div className="p-4">
          <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            {sidebarOpen && <h1 className="text-xl font-bold text-gray-900">Sentia Manufacturing</h1>}
          </Link>
        </div>

        <nav className="px-4 pb-4">
          {sidebarOpen && navigationItems.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">{section.section}</h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute bottom-4 right-4 p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {user ? `Welcome, ${user.firstName || user.emailAddresses?.[0]?.emailAddress}` : 'Welcome'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <button
                onClick={() => navigate('/working-capital')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Working Capital
              </button>
              <button
                onClick={() => navigate('/what-if')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                What-If Analysis
              </button>
              <button
                onClick={() => navigate('/forecasting')}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                Run Forecast
              </button>
              <button
                onClick={() => navigate('/inventory')}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
              >
                Optimize Stock
              </button>

              <div className="border-l pl-4">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// MCP Server Status Component
const MCPServerStatus = () => {
  const [status, setStatus] = useState({ connected: false, services: {} });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/mcp/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('MCP Server check failed:', error);
        setStatus({ connected: false, services: {} });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`p-3 rounded-lg shadow-lg ${status.connected ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">
            MCP Server: {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {status.connected && (
          <div className="mt-2 text-xs text-gray-600">
            AI Services: {Object.values(status.services).filter(s => s).length} active
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
function AppEnterprise() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={
              <>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
                <SignedOut>
                  <LandingPage />
                </SignedOut>
              </>
            } />

            {/* Authentication Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sign-in/*" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Dashboard />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            <Route path="/working-capital" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <WorkingCapital />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            <Route path="/what-if" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <WhatIfAnalysis />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            <Route path="/forecasting" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <DemandForecasting />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            <Route path="/inventory" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <InventoryManagement />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            <Route path="/production" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <ProductionTracking />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            <Route path="/quality" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <QualityControl />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            <Route path="/ai-analytics" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <AIAnalytics />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            <Route path="/data-import" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <DataImport />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            <Route path="/admin" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminPanel />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            <Route path="/system-config" element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <SystemConfig />
                    </Suspense>
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>

        {/* MCP Server Status Indicator */}
        <MCPServerStatus />

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default AppEnterprise;