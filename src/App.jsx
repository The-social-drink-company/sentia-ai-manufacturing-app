/**
 * SENTIA MANUFACTURING DASHBOARD - MAIN APPLICATION
 * React 18.3.1 with complete routing and provider setup
 *
 * @version 2.0.0
 * @framework React 18.3.1, Vite 5.4.0
 */

import React, { lazy, Suspense, useState, useEffect, createContext, useContext } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

// ============================================================================
// LAZY LOADED COMPONENTS
// ============================================================================

// Landing & Auth Pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

// Dashboard Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'));
const EnterpriseDashboard = lazy(() => import('./pages/Dashboard/EnterpriseDashboard'));
const WorldClassDashboard = lazy(() => import('./pages/Dashboard/WorldClassDashboard'));

// Financial Management Pages (NEW)
const WorkingCapital = lazy(() => import('./pages/WorkingCapital'));
const CashRunway = lazy(() => import('./pages/CashRunway'));
const FundingCalculator = lazy(() => import('./pages/FundingCalculator'));
const WorkingCapitalOptimizer = lazy(() => import('./pages/WorkingCapitalOptimizer'));

// Operations Pages
const Production = lazy(() => import('./pages/Production'));
const Quality = lazy(() => import('./pages/Quality'));
const Inventory = lazy(() => import('./pages/Inventory'));
const SupplyChain = lazy(() => import('./pages/SupplyChain'));

// Analytics Pages
const Analytics = lazy(() => import('./pages/Analytics'));
const Forecasting = lazy(() => import('./pages/Forecasting'));
const WhatIfAnalysis = lazy(() => import('./pages/WhatIfAnalysis'));
const AIInsights = lazy(() => import('./pages/AIInsights'));

// Mobile Pages
const Mobile = lazy(() => import('./pages/Mobile'));
const MobileFloor = lazy(() => import('./pages/MobileFloor'));

// Admin Pages
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Layout Components
const Header = lazy(() => import('./components/layout/Header'));
const Sidebar = lazy(() => import('./components/layout/Sidebar'));
const Footer = lazy(() => import('./components/layout/Footer'));

// ============================================================================
// QUERY CLIENT CONFIGURATION
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: 'always'
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  }
});

// ============================================================================
// MOCK AUTH CONTEXT (Clerk disabled)
// ============================================================================

const AuthContext = createContext({
  isAuthenticated: true,
  user: null,
  login: () => {},
  logout: () => {},
  checkRole: () => true
});

export const useAuth = () => useContext(AuthContext);

const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: 'user_mock_001',
    email: 'admin@sentia.com',
    firstName: 'Admin',
    lastName: 'User',
    fullName: 'Admin User',
    role: 'admin',
    permissions: ['*'],
    imageUrl: null
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const login = (email, password) => {
    // Mock login - always succeeds for demo
    setUser({
      id: 'user_mock_001',
      email: email || 'admin@sentia.com',
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      role: 'admin',
      permissions: ['*'],
      imageUrl: null
    });
    setIsAuthenticated(true);
    return Promise.resolve(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    return Promise.resolve();
  };

  const checkRole = (requiredRole) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === requiredRole;
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      checkRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// THEME CONTEXT
// ============================================================================

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-200 border-solid rounded-full animate-spin border-t-blue-600"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-blue-600">S</span>
      </div>
    </div>
  </div>
);

const LoadingFallback = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
  </div>
);

// ============================================================================
// ERROR BOUNDARY COMPONENTS
// ============================================================================

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Something went wrong</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">An unexpected error occurred</p>
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            Error details
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
            {error.message}
            {error.stack}
          </pre>
        </details>
      )}

      <button
        onClick={resetErrorBoundary}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Try again
      </button>
    </div>
  </div>
);

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      // Escape to close mobile menu
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Suspense fallback={<div className="h-16 bg-white dark:bg-gray-800 border-b" />}>
        <Header
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </Suspense>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Desktop */}
        <div className={`hidden lg:block transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}>
          <Suspense fallback={<div className="h-full bg-white dark:bg-gray-800 border-r" />}>
            <Sidebar isCollapsed={!sidebarOpen} />
          </Suspense>
        </div>

        {/* Sidebar - Mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black opacity-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl">
              <Suspense fallback={<LoadingFallback />}>
                <Sidebar isCollapsed={false} onClose={() => setMobileMenuOpen(false)} />
              </Suspense>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense fallback={<LoadingFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

// ============================================================================
// PROTECTED ROUTE WRAPPER
// ============================================================================

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, checkRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !checkRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ============================================================================
// 404 PAGE
// ============================================================================

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Page not found</p>
      <a
        href="/dashboard"
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Go to Dashboard
      </a>
    </div>
  </div>
);

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <MockAuthProvider>
          <ThemeProvider>
            <BrowserRouter>
              <Routes>
                {/* Landing & Auth Routes */}
                <Route path="/" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Landing />
                  </Suspense>
                } />

                <Route path="/login" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Login />
                  </Suspense>
                } />

                <Route path="/signup" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Signup />
                  </Suspense>
                } />

                {/* Protected Routes with Layout */}
                <Route element={<AppLayout />}>
                  {/* Dashboard Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/enhanced" element={
                    <ProtectedRoute>
                      <EnhancedDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/enterprise" element={
                    <ProtectedRoute requiredRole="admin">
                      <EnterpriseDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/world-class" element={
                    <ProtectedRoute>
                      <WorldClassDashboard />
                    </ProtectedRoute>
                  } />

                  {/* Financial Management Routes (NEW) */}
                  <Route path="/working-capital" element={
                    <ProtectedRoute>
                      <WorkingCapital />
                    </ProtectedRoute>
                  } />

                  <Route path="/cash-runway" element={
                    <ProtectedRoute>
                      <CashRunway />
                    </ProtectedRoute>
                  } />

                  <Route path="/funding-calculator" element={
                    <ProtectedRoute>
                      <FundingCalculator />
                    </ProtectedRoute>
                  } />

                  <Route path="/working-capital-optimizer" element={
                    <ProtectedRoute>
                      <WorkingCapitalOptimizer />
                    </ProtectedRoute>
                  } />

                  {/* Operations Routes */}
                  <Route path="/production" element={
                    <ProtectedRoute>
                      <Production />
                    </ProtectedRoute>
                  } />

                  <Route path="/quality" element={
                    <ProtectedRoute>
                      <Quality />
                    </ProtectedRoute>
                  } />

                  <Route path="/inventory" element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  } />

                  <Route path="/supply-chain" element={
                    <ProtectedRoute>
                      <SupplyChain />
                    </ProtectedRoute>
                  } />

                  {/* Analytics Routes */}
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } />

                  <Route path="/forecasting" element={
                    <ProtectedRoute>
                      <Forecasting />
                    </ProtectedRoute>
                  } />

                  <Route path="/what-if" element={
                    <ProtectedRoute>
                      <WhatIfAnalysis />
                    </ProtectedRoute>
                  } />

                  <Route path="/ai-insights" element={
                    <ProtectedRoute>
                      <AIInsights />
                    </ProtectedRoute>
                  } />

                  {/* Mobile Routes */}
                  <Route path="/mobile" element={
                    <ProtectedRoute>
                      <Mobile />
                    </ProtectedRoute>
                  } />

                  <Route path="/mobile-floor" element={
                    <ProtectedRoute>
                      <MobileFloor />
                    </ProtectedRoute>
                  } />

                  {/* Admin Routes */}
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerStyle={{
                  top: 80,
                }}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    borderRadius: '8px',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                    style: {
                      background: '#10b981',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                    style: {
                      background: '#ef4444',
                    },
                  },
                }}
              />

              {/* React Query Devtools - Development Only */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
              )}
            </BrowserRouter>
          </ThemeProvider>
        </MockAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;