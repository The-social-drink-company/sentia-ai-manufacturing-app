import { Suspense, lazy } from 'react'
import { ClerkProvider } from '@clerk/clerk-react'
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  createMemoryRouter,
  useLocation,
  useNavigate
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import EnterpriseSidebar from './components/EnterpriseSidebar'
import ClerkAuthProvider from './providers/ClerkAuthProvider.jsx'
import MockAuthProvider from './providers/MockAuthProvider.jsx'
import { useAuth } from './hooks/useAuth.js'
import { logInfo, logWarn } from './utils/logger.js'

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'))
const DashboardPage = lazy(() => import('./pages/Dashboard.jsx'))
const WorkingCapitalPage = lazy(() => import('./pages/WorkingCapital.jsx'))
const InventoryPage = lazy(() => import('./pages/Inventory.jsx'))
const ProductionPage = lazy(() => import('./pages/Production.jsx'))
const ForecastingPage = lazy(() => import('./pages/Forecasting.jsx'))
const SettingsPage = lazy(() => import('./pages/Settings.jsx'))

// Auth guard component
const RequireAuth = () => {
  const { isAuthenticated, isLoaded } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Validating credentials...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

// Public layout wrapper
const PublicLayout = () => (
  <div className="min-h-screen bg-slate-950 text-slate-50">
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <Outlet />
    </Suspense>
  </div>
)

// Main app layout with sidebar
const AppLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigate = (path) => {
    navigate(path)
  }

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <div className="hidden lg:flex">
        <EnterpriseSidebar
          currentPath={location.pathname}
          userRole={user?.role ?? 'guest'}
          onNavigate={handleNavigate}
          footerContent={
            user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded border border-slate-700 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Sign out {user.displayName ? `(${user.displayName})` : ''}
              </button>
            ) : null
          }
        />
      </div>
      <main className="flex-1">
        <Suspense fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 0
    }
  }
})

// Routes configuration
const routes = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> }
    ]
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/working-capital', element: <WorkingCapitalPage /> },
          { path: '/inventory', element: <InventoryPage /> },
          { path: '/production', element: <ProductionPage /> },
          { path: '/forecasting', element: <ForecastingPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '*', element: <Navigate to="/dashboard" replace /> }
        ]
      }
    ]
  }
]

// Check if we're in a test environment
const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'

// Create router
const router = isTestEnv
  ? createMemoryRouter(routes, { initialEntries: ['/dashboard'] })
  : createBrowserRouter(routes)

// Get Clerk configuration from environment
const env = import.meta.env ?? {}
const clerkPublishableKey =
  env.VITE_CLERK_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  env.PUBLIC_CLERK_PUBLISHABLE_KEY ||
  ''

const useClerkAuth = Boolean(clerkPublishableKey && !env.VITE_DISABLE_CLERK)

// Clerk configuration
const clerkFrontendApi = env.VITE_CLERK_FRONTEND_API || env.CLERK_FRONTEND_API
const signInUrl = env.VITE_CLERK_SIGN_IN_URL || '/login'
const signUpUrl = env.VITE_CLERK_SIGN_UP_URL || '/signup'
const afterSignInUrl = env.VITE_CLERK_AFTER_SIGN_IN_URL || '/dashboard'
const afterSignUpUrl = env.VITE_CLERK_AFTER_SIGN_UP_URL || '/dashboard'

// Log authentication configuration
if (useClerkAuth) {
  logInfo('[App] Using Clerk authentication')
} else {
  logWarn('[App] Clerk not configured, using mock authentication')
}

// Main App component
const App = () => {
  // If Clerk is configured, wrap with ClerkProvider
  if (useClerkAuth) {
    return (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        frontendApi={clerkFrontendApi}
        signInUrl={signInUrl}
        signUpUrl={signUpUrl}
        afterSignInUrl={afterSignInUrl}
        afterSignUpUrl={afterSignUpUrl}
        routerPush={(to) => router.navigate(to)}
        routerReplace={(to) => router.navigate(to, { replace: true })}
      >
        <QueryClientProvider client={queryClient}>
          <ClerkAuthProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
          </ClerkAuthProvider>
        </QueryClientProvider>
      </ClerkProvider>
    )
  }

  // Otherwise use MockAuthProvider
  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </MockAuthProvider>
    </QueryClientProvider>
  )
}

export default App