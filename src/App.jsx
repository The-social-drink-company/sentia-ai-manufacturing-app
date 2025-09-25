import { Suspense, createContext, lazy, useCallback, useContext, useMemo, useState } from 'react'
import { Navigate, Outlet, RouterProvider, createBrowserRouter, createMemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/clerk-react'

import EnterpriseSidebar from './components/EnterpriseSidebar.jsx'
import ClerkAuthProvider from './providers/ClerkAuthProvider.jsx'
import MockAuthProvider from './providers/MockAuthProvider.jsx'

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'))
const DashboardPage = lazy(() => import('./pages/Dashboard.jsx'))
const SettingsPage = lazy(() => import('./pages/Settings.jsx'))
const WorkingCapitalPage = lazy(() => import('./pages/WorkingCapital.jsx'))
const InventoryPage = lazy(() => import('./pages/Inventory.jsx'))
const ProductionPage = lazy(() => import('./pages/Production.jsx'))

const DEFAULT_USER = {
  id: 'sentia-ops-demo',
  email: 'ops@sentia-demo.com',
  role: 'admin',
  displayName: 'Sentia Operations'
}

const AuthContext = createContext({
  user: DEFAULT_USER,
  isAuthenticated: true,
  login: () => undefined,
  logout: () => undefined
})

export const useAuth = () => useContext(AuthContext)

const RequireAuth = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location }} />
  }

  return <Outlet />
}

const PublicLayout = () => (
  <div className='min-h-screen bg-slate-950 text-slate-50'>
    <Suspense fallback={<div className='flex min-h-screen items-center justify-center'>Loading.</div>}>
      <Outlet />
    </Suspense>
  </div>
)

const AppLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigate = useCallback((path) => {
    navigate(path)
  }, [navigate])

  return (
    <div className='flex min-h-screen bg-slate-950 text-slate-50'>
      <div className='hidden lg:flex'>
        <EnterpriseSidebar
          currentPath={location.pathname}
          userRole={user?.role ?? 'guest'}
          onNavigate={handleNavigate}
          footerContent={
            user ? (
              <button
                type='button'
                onClick={logout}
                className='w-full rounded border border-slate-700 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-slate-500 hover:text-white'
              >
                {'Sign out ' + (user.displayName ? '(' + user.displayName + ')' : '')}
              </button>
            ) : null
          }
        />
      </div>
      <main className='flex-1'>
        <Suspense fallback={<div className='flex min-h-screen items-center justify-center'>Loading dashboard.</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 0
    }
  }
})

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
          { path: '/settings', element: <SettingsPage /> },
          { path: '/working-capital', element: <WorkingCapitalPage /> },
          { path: '/inventory', element: <InventoryPage /> },
          { path: '/production', element: <ProductionPage /> },
          { path: '*', element: <Navigate to='/dashboard' replace /> }
        ]
      }
    ]
  }
]

const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'

const router = isTestEnv
  ? createMemoryRouter(routes, { initialEntries: ['/dashboard'] })
  : createBrowserRouter(routes)

// Clerk configuration
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const shouldUseClerk = Boolean(clerkPublishableKey)
const clerkFrontendApi = import.meta.env.VITE_CLERK_FRONTEND_API
const signInUrl = '/login'
const signUpUrl = '/signup'
const afterSignInUrl = '/dashboard'
const afterSignUpUrl = '/dashboard'

const AppContent = () => (
  <>
    <RouterProvider router={router} />
    <Toaster position='top-right' toastOptions={{ duration: 3500 }} />
  </>
)

const AppProviders = ({ children }) => {
  if (shouldUseClerk) {
    return (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        frontendApi={clerkFrontendApi}
        signInUrl={signInUrl}
        signUpUrl={signUpUrl}
        afterSignInUrl={afterSignInUrl}
        afterSignUpUrl={afterSignUpUrl}
      >
        <QueryClientProvider client={queryClient}>
          <ClerkAuthProvider>{children}</ClerkAuthProvider>
        </QueryClientProvider>
      </ClerkProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>{children}</MockAuthProvider>
    </QueryClientProvider>
  )
}

const App = () => (
  <AppProviders>
    <AppContent />
  </AppProviders>
)

export default App