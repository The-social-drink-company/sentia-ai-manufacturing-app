import { Suspense, createContext, lazy, useCallback, useContext, useMemo, useState } from 'react'
import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import EnterpriseSidebar from './components/EnterpriseSidebar'

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'))
const DashboardPage = lazy(() => import('./pages/Dashboard.jsx'))
const SettingsPage = lazy(() => import('./pages/Settings.jsx'))

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

const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_USER)

  const login = useCallback((nextUser) => {
    setUser(nextUser ?? DEFAULT_USER)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    login,
    logout
  }), [login, logout, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const RequireAuth = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

const PublicLayout = () => (
  <div className="min-h-screen bg-slate-950 text-slate-50">
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading.</div>}>
      <Outlet />
    </Suspense>
  </div>
)

const AppLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigate = useCallback(
    (path) => {
      navigate(path)
    },
    [navigate]
  )

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
                onClick={logout}
                className="w-full rounded border border-slate-700 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Sign out {user.displayName ? `(${user.displayName})` : ''}
              </button>
            ) : null
          }
        />
      </div>
      <main className="flex-1">
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading dashboard.</div>}>
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

const router = createBrowserRouter([
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
          { path: '*', element: <Navigate to="/dashboard" replace /> }
        ]
      }
    ]
  }
])

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MockAuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </MockAuthProvider>
  </QueryClientProvider>
)

export default App