import React, {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  Link,
  useLocation,
  useNavigate,
  useRouteError,
  isRouteErrorResponse
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import ThemeProvider from './theming/ThemeProvider.jsx';
import Header from './components/layout/Header.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import { DashboardSkeleton } from './components/performance/LazyLoadWrapper.jsx';
import { logError } from './utils/logger.js';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard.jsx'));
const EnterpriseDashboard = lazy(() => import('./pages/Dashboard/EnterpriseDashboard.jsx'));
const WorldClassDashboard = lazy(() => import('./pages/WorldClassDashboard.jsx'));

const WorkingCapitalDashboard = lazy(() => import('./components/WorkingCapital.jsx'));
const CashRunway = lazy(() => import('./pages/CashRunway.jsx'));
const FundingCalculator = lazy(() => import('./pages/FundingCalculator.jsx'));
const WorkingCapitalOptimizer = lazy(() => import('./pages/WorkingCapitalOptimizer.jsx'));

const Production = lazy(() => import('./pages/Production.jsx'));
const Quality = lazy(() => import('./pages/Quality.jsx'));
const Inventory = lazy(() => import('./pages/Inventory.jsx'));
const SupplyChain = lazy(() => import('./pages/SupplyChain.jsx'));

const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Forecasting = lazy(() => import('./pages/Forecasting.jsx'));
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis.jsx'));
const AIInsights = lazy(() => import('./components/AI/AIInsights.jsx'));

const MobileDashboard = lazy(() => import('./pages/Mobile.jsx'));
const MobileFloor = lazy(() => import('./pages/MobileFloor.jsx'));

const Settings = lazy(() => import('./pages/Settings.jsx'));
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx'));

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES_MS,
      gcTime: TEN_MINUTES_MS,
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 1
    }
  }
});

const DEFAULT_AUTH_USER = {
  id: 'sentia-demo-admin',
  email: 'admin@sentia-demo.com',
  firstName: 'Sentia',
  lastName: 'Admin',
  role: 'admin',
  permissions: ['dashboard.read', 'analytics.read', 'admin.access']
};

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => undefined,
  logout: () => undefined,
  hasRole: () => false
});

export const useAuth = () => useContext(AuthContext);

/** @param {{ children: React.ReactNode }} props */
const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_AUTH_USER);

  const login = useCallback((nextUser) => {
    setUser(current => {
      if (nextUser) return { ...DEFAULT_AUTH_USER, ...nextUser };
      return current ?? DEFAULT_AUTH_USER;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const hasRole = useCallback((requiredRole) => {
    if (!requiredRole) return true;
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === requiredRole) return true;
    return Array.isArray(user.permissions) && user.permissions.includes(requiredRole);
  }, [user]);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    login,
    logout,
    hasRole
  }), [user, login, logout, hasRole]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

const PageFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center bg-slate-950 text-slate-100">
    <DashboardSkeleton />
  </div>
);

/** @param {{ error: Error | null, resetErrorBoundary: () => void }} props */
const GlobalErrorFallback = ({ error, resetErrorBoundary }) => {
  logError('Global application error', error);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8 text-slate-100">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-sm text-slate-400">{error?.message ?? 'An unexpected error occurred.'}</p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
      >
        Try again
      </button>
    </div>
  );
};

const RouteErrorBoundary = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error?.message ?? 'Unknown error';

  logError('Route boundary captured error', error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-slate-950 p-8 text-slate-100">
      <h2 className="text-xl font-semibold">We hit a snag</h2>
      <p className="mt-3 max-w-xl text-center text-sm text-slate-400">{message}</p>
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
      >
        Go to dashboard
      </button>
    </div>
  );
};

const SkipToContentLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
  >
    Skip to main content
  </a>
);

const AppLayout = () => (
  <div className="flex min-h-screen bg-slate-950 text-slate-100">
    <SkipToContentLink />
    <Sidebar />
    <div className="flex min-h-screen flex-1 flex-col">
      <Header />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto bg-slate-900 px-4 pb-10 pt-6 md:px-8"
        role="main"
      >
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  </div>
);

const Footer = () => (
  <footer className="border-t border-slate-800 bg-slate-950 px-4 py-4 text-sm text-slate-500 md:px-8">
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <span>© {new Date().getFullYear()} Sentia Manufacturing Intelligence</span>
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/settings" className="hover:text-slate-200">User settings</Link>
        <Link to="/admin" className="hover:text-slate-200">Admin</Link>
        <span className="text-xs uppercase tracking-wide">Version 2.0 demo</span>
      </div>
    </div>
  </footer>
);

const PublicLayout = () => (
  <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
    <main className="flex flex-1 flex-col">
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </main>
  </div>
);

const LandingRoute = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return <LandingPage />;
};

const LoginRoute = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      login();
      navigate('/dashboard', { replace: true });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [login, navigate]);

  return <LoginPage />;
};

const SignupRoute = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      login({
        id: 'sentia-demo-ops',
        email: 'operations@sentia-demo.com',
        firstName: 'Operations',
        lastName: 'Lead',
        role: 'operations',
        permissions: ['dashboard.read', 'operations.read']
      });
      navigate('/dashboard', { replace: true });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [login, navigate]);

  return <SignupPage />;
};

const RequireAuth = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const NotFoundRoute = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8 text-slate-100">
    <h1 className="text-3xl font-semibold">Page not found</h1>
    <p className="mt-3 text-sm text-slate-400">The resource you are looking for no longer exists or has moved.</p>
    <Link
      to="/dashboard"
      className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
    >
      Return to dashboard
    </Link>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <LandingRoute /> },
      { path: 'login', element: <LoginRoute /> },
      { path: 'signup', element: <SignupRoute /> }
    ]
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'dashboard/enhanced', element: <EnhancedDashboard /> },
          { path: 'dashboard/enterprise', element: <EnterpriseDashboard /> },
          { path: 'dashboard/world-class', element: <WorldClassDashboard /> },
          { path: 'working-capital', element: <WorkingCapitalDashboard /> },
          { path: 'cash-runway', element: <CashRunway /> },
          { path: 'funding-calculator', element: <FundingCalculator /> },
          { path: 'working-capital-optimizer', element: <WorkingCapitalOptimizer /> },
          { path: 'production', element: <Production /> },
          { path: 'quality', element: <Quality /> },
          { path: 'inventory', element: <Inventory /> },
          { path: 'supply-chain', element: <SupplyChain /> },
          { path: 'analytics', element: <Analytics /> },
          { path: 'forecasting', element: <Forecasting /> },
          { path: 'what-if', element: <WhatIfAnalysis /> },
          { path: 'ai-insights', element: <AIInsights /> },
          { path: 'mobile', element: <MobileDashboard /> },
          { path: 'mobile-floor', element: <MobileFloor /> },
          { path: 'settings', element: <Settings /> },
          { path: 'admin', element: <AdminPanel /> }
        ]
      }
    ]
  },
  { path: '*', element: <NotFoundRoute /> }
]);

const showReactQueryDevtools = Boolean(import.meta.env?.DEV);

/** @returns {JSX.Element} */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <MockAuthProvider>
      <ThemeProvider>
        <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
          <Suspense fallback={<PageFallback />}>
            <RouterProvider router={router} />
          </Suspense>
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc'
            }
          }}
        />
        {showReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </ThemeProvider>
    </MockAuthProvider>
  </QueryClientProvider>
);

export default App;

