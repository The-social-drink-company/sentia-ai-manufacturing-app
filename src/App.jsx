import { Suspense, lazy } from 'react'
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

import EnterpriseSidebar from './components/EnterpriseSidebar.jsx'
import MockAuthProvider from './providers/MockAuthProvider.jsx'
import { useAuth } from './hooks/useAuth.js'

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'))
const DashboardPage = lazy(() => import('./pages/Dashboard.jsx'))
const WorkingCapitalPage = lazy(() => import('./features/working-capital/WorkingCapitalPage.jsx'))
const InventoryPage = lazy(() => import('./pages/Inventory.jsx'))
const ProductionPage = lazy(() => import('./pages/Production.jsx'))
const SettingsPage = lazy(() => import('./pages/Settings.jsx'))

const RequireAuth = () => {
  const { isAuthenticated, isLoaded } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-950 text-slate-300'>
        Checking credentials...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location }} />
  }

  return <Outlet />
}

const PublicLayout = () => (
  <div className='min-h-screen bg-slate-950 text-slate-50'>
    <Suspense fallback={<div className='flex min-h-screen items-center justify-center'>Loading...</div>}>
      <Outlet />
    </Suspense>
  </div>
)

const AppLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigate = (path) => {
    navigate(path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

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
                onClick={handleLogout}
                className='w-full rounded border border-slate-700 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-slate-500 hover:text-white'
              >
                Sign out {user?.displayName ? `(${user.displayName})` : ''}
              </button>
            ) : null
          }
        />
      </div>
      <main className='flex-1'>
        <Suspense fallback={<div className='flex min-h-screen items-center justify-center'>Loading dashboard...</div>}>
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
          { path: '/working-capital', element: <WorkingCapitalPage /> },
          { path: '/inventory', element: <InventoryPage /> },
          { path: '/production', element: <ProductionPage /> },
          { path: '/settings', element: <SettingsPage /> },
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MockAuthProvider>
      <RouterProvider router={router} />
      <Toaster position='top-right' toastOptions={{ duration: 3500 }} />
    </MockAuthProvider>
  </QueryClientProvider>
)

export default App
