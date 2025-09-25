/**
 * WORLD-CLASS ENTERPRISE MANUFACTURING DASHBOARD
 * NO AUTHENTICATION - ALL PAGES ACCESSIBLE
 * Full comprehensive enterprise application
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './App.css';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Dashboard Pages - verified to exist
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'));
const EnterpriseEnhancedDashboard = lazy(() => import('./pages/EnterpriseEnhancedDashboard'));
const WorldClassDashboard = lazy(() => import('./pages/WorldClassDashboard'));
const SimpleDashboard = lazy(() => import('./pages/SimpleDashboard'));

// Manufacturing Pages - verified to exist
const Production = lazy(() => import('./pages/Production'));
const Quality = lazy(() => import('./pages/Quality'));
const Inventory = lazy(() => import('./pages/Inventory/index'));
const SupplyChain = lazy(() => import('./pages/SupplyChain'));
const Forecasting = lazy(() => import('./pages/Forecasting'));

// Analytics Pages - verified to exist
const Analytics = lazy(() => import('./pages/Analytics'));
const RealTimeAnalytics = lazy(() => import('./pages/RealTimeAnalytics'));

// Admin Pages - verified to exist
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminPanelEnhanced = lazy(() => import('./pages/AdminPanelEnhanced'));
const Settings = lazy(() => import('./pages/Settings/index'));

// Components - verified to exist
const WorkingCapital = lazy(() => import('./components/WorkingCapital'));
const AIInsights = lazy(() => import('./components/AIInsights'));

// Mobile Pages - verified to exist
const Mobile = lazy(() => import('./pages/Mobile'));
const MobileFloor = lazy(() => import('./pages/MobileFloor'));

// Landing Page - verified to exist
const Landing = lazy(() => import('./pages/Landing/index'));

// Mock auth hooks for compatibility
export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  getToken: async () => 'mock-token',
  userId: 'admin',
  signOut: () => {},
});

export const useUser = () => ({
  user: {
    id: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    fullName: 'Admin User',
    emailAddresses: [{ emailAddress: 'admin@sentia.com' }],
    publicMetadata: { role: 'admin' },
  },
  isLoaded: true,
  isSignedIn: true,
});

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Landing */}
              <Route path="/" element={<Landing />} />

              {/* Dashboards */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/enhanced" element={<EnhancedDashboard />} />
              <Route path="/dashboard/enterprise" element={<EnterpriseEnhancedDashboard />} />
              <Route path="/dashboard/world-class" element={<WorldClassDashboard />} />
              <Route path="/dashboard/simple" element={<SimpleDashboard />} />

              {/* Financial */}
              <Route path="/working-capital" element={<WorkingCapital />} />
              <Route path="/ai-insights" element={<AIInsights />} />

              {/* Manufacturing */}
              <Route path="/production" element={<Production />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/supply-chain" element={<SupplyChain />} />
              <Route path="/forecasting" element={<Forecasting />} />

              {/* Analytics */}
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/analytics/real-time" element={<RealTimeAnalytics />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/enhanced" element={<AdminPanelEnhanced />} />
              <Route path="/settings" element={<Settings />} />

              {/* Mobile */}
              <Route path="/mobile" element={<Mobile />} />
              <Route path="/mobile-floor" element={<MobileFloor />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>

          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
