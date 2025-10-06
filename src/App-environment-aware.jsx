import { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import LandingPage from '@/components/LandingPage'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressiveDashboardLoader from '@/components/dashboard/ProgressiveDashboardLoader'
import ClerkSignInEnvironmentAware from '@/pages/ClerkSignInEnvironmentAware'

const Dashboard = lazy(() => import('@/pages/DashboardEnterprise'))
const WorkingCapital = lazy(() => import('@/components/WorkingCapital/RealWorkingCapital'))
const Forecasting = lazy(() => import('@/pages/Forecasting'))
const Production = lazy(() => import('@/pages/Production'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Inventory = lazy(() => import('@/components/inventory/InventoryDashboard'))
const Quality = lazy(() => import('@/components/quality/QualityDashboard'))
const DataImport = lazy(() => import('@/components/data/DataImportWidget'))
const AdminPanel = lazy(() => import('@/pages/AdminPanelEnhanced'))
const WhatIf = lazy(() => import('@/components/analytics/WhatIfAnalysis'))
const ScenarioPlanner = lazy(() => import('@/features/forecasting/ScenarioPlanner.jsx'))
const AssistantPanel = lazy(() => import('@/features/ai-assistant/AssistantPanel.jsx'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const Loader = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Loading Enterprise Dashboard...</p>
    </div>
  </div>
)

// Environment detection
const isDevelopmentMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

// Authentication Components Loader
const AuthenticationProvider = ({ children }) => {
  const [authComponents, setAuthComponents] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAuthProvider = async () => {
      try {
        if (isDevelopmentMode) {
          console.log('[Environment] Loading Development Authentication Provider')
          const devAuth = await import('./auth/DevelopmentAuthProvider.jsx')
          setAuthComponents({
            ClerkProvider: devAuth.ClerkProvider,
            SignedIn: devAuth.SignedIn,
            SignedOut: devAuth.SignedOut,
            RedirectToSignIn: devAuth.RedirectToSignIn
          })
        } else {
          console.log('[Environment] Loading Production Clerk Authentication Provider')
          const clerkAuth = await import('@clerk/clerk-react')
          setAuthComponents({
            ClerkProvider: clerkAuth.ClerkProvider,
            SignedIn: clerkAuth.SignedIn,
            SignedOut: clerkAuth.SignedOut,
            RedirectToSignIn: clerkAuth.RedirectToSignIn
          })
        }
      } catch (error) {
        console.error('[Environment] Failed to load authentication provider:', error)
        // Fallback to development mode on error
        const devAuth = await import('./auth/DevelopmentAuthProvider.jsx')
        setAuthComponents({
          ClerkProvider: devAuth.ClerkProvider,
          SignedIn: devAuth.SignedIn,
          SignedOut: devAuth.SignedOut,
          RedirectToSignIn: devAuth.RedirectToSignIn
        })
      } finally {
        setLoading(false)
      }
    }

    loadAuthProvider()
  }, [])

  if (loading || !authComponents) {
    return <Loader />
  }

  const { ClerkProvider } = authComponents
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

  // Development mode doesn't need publishable key validation
  if (!isDevelopmentMode && !publishableKey) {
    console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY, Clerk features will be disabled')
  }

  const clerkAppearance = {
    baseTheme: undefined,
    variables: {
      colorPrimary: '#2563eb',
      colorTextOnPrimaryBackground: '#ffffff',
      colorBackground: '#ffffff',
      colorInputBackground: '#ffffff',
      colorInputText: '#1f2937',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '0.5rem'
    },
    elements: {
      card: {
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        border: '1px solid #e5e7eb'
      },
      headerTitle: {
        fontSize: '1.5rem',
        fontWeight: '600'
      },
      headerSubtitle: {
        color: '#6b7280'
      }
    }
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAppearance}
    >
      {children}
    </ClerkProvider>
  )
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [authComponents, setAuthComponents] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAuthComponents = async () => {
      try {
        if (isDevelopmentMode) {
          const devAuth = await import('./auth/DevelopmentAuthProvider.jsx')
          setAuthComponents({
            SignedIn: devAuth.SignedIn,
            SignedOut: devAuth.SignedOut,
            RedirectToSignIn: devAuth.RedirectToSignIn
          })
        } else {
          const clerkAuth = await import('@clerk/clerk-react')
          setAuthComponents({
            SignedIn: clerkAuth.SignedIn,
            SignedOut: clerkAuth.SignedOut,
            RedirectToSignIn: clerkAuth.RedirectToSignIn
          })
        }
      } catch (error) {
        console.error('[ProtectedRoute] Failed to load auth components:', error)
        // Fallback to development mode
        const devAuth = await import('./auth/DevelopmentAuthProvider.jsx')
        setAuthComponents({
          SignedIn: devAuth.SignedIn,
          SignedOut: devAuth.SignedOut,
          RedirectToSignIn: devAuth.RedirectToSignIn
        })
      } finally {
        setLoading(false)
      }
    }

    loadAuthComponents()
  }, [])

  if (loading || !authComponents) {
    return <Loader />
  }

  const { SignedIn, SignedOut, RedirectToSignIn } = authComponents

  return (
    <>
      <SignedIn>
        <ProgressiveDashboardLoader>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </ProgressiveDashboardLoader>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

const App = () => (
  <AuthenticationProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          
          {/* Authentication Routes */}
          <Route path="/app/sign-in" element={<ClerkSignInEnvironmentAware />} />
          <Route path="/app/sign-up" element={<ClerkSignInEnvironmentAware />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/app/dashboard" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/working-capital" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <WorkingCapital />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/forecasting" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <Forecasting />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/production" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <Production />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/analytics" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <Analytics />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/inventory" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <Inventory />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/quality" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <Quality />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/data-import" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <DataImport />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/admin" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <AdminPanel />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/what-if" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <WhatIf />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/scenarios" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <ScenarioPlanner />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/app/assistant" element={
            <ProtectedRoute>
              <Suspense fallback={<Loader />}>
                <AssistantPanel />
              </Suspense>
            </ProtectedRoute>
          } />
          
          {/* Default redirects */}
          <Route path="/app/*" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </AuthenticationProvider>
)

export default App