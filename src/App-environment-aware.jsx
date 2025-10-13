import React, { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import LandingPage from '@/components/LandingPage'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressiveDashboardLoader from '@/components/dashboard/ProgressiveDashboardLoader'
import ClerkSignInEnvironmentAware from '@/pages/ClerkSignInEnvironmentAware'
import FinancialReportsErrorBoundary from '@/components/debug/FinancialReportsErrorBoundary'
import MinimalFinancialReportsTest from '@/components/debug/MinimalFinancialReportsTest'
import { XeroProvider } from '@/contexts/XeroContext'

const Dashboard = lazy(() => import('@/pages/DashboardEnterprise'))
const WorkingCapital = lazy(() => import('@/components/WorkingCapital/RealWorkingCapital'))
const Forecasting = lazy(() => import('@/pages/Forecasting'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Inventory = lazy(() => import('@/components/inventory/InventoryDashboard'))
const DataImport = lazy(() => import('@/components/data/DataImportWidget'))
const AdminPanel = lazy(() => import('@/pages/AdminPanelEnhanced'))
const WhatIf = lazy(() => import('@/components/analytics/WhatIfAnalysis'))
const ScenarioPlanner = lazy(() => import('@/features/forecasting/ScenarioPlanner.jsx'))
const AssistantPanel = lazy(() => import('@/features/ai-assistant/AssistantPanel.jsx'))

const FinancialReports = lazy(() => {
  console.log('[Navigation Debug] Loading Financial Reports component')
  return import('@/pages/Financial/FinancialReports').then(module => {
    console.log('[Navigation Debug] Financial Reports component loaded successfully:', module)
    return module
  }).catch(error => {
    console.error('[Navigation Debug] Failed to load Financial Reports:', error)
    throw error
  })
})

// Wrapper component with comprehensive debugging
const FinancialReportsWrapper = () => {
  console.log('[Navigation Debug] FinancialReportsWrapper component mounting')
  
  React.useEffect(() => {
    console.log('[Navigation Debug] FinancialReportsWrapper useEffect - component mounted')
    console.log('[Navigation Debug] Current location:', window.location.pathname)
    console.log('[Navigation Debug] Development mode:', import.meta.env.VITE_DEVELOPMENT_MODE)
    
    return () => {
      console.log('[Navigation Debug] FinancialReportsWrapper unmounting')
    }
  }, [])

  // TEMPORARY: Use minimal test component to isolate routing issues
  const useMinimalTest = true
  
  if (useMinimalTest) {
    console.log('[Navigation Debug] Using MinimalFinancialReportsTest for diagnosis')
    return React.createElement(MinimalFinancialReportsTest)
  }

  try {
    console.log('[Navigation Debug] Attempting to render FinancialReports component')
    return React.createElement(FinancialReports)
  } catch (error) {
    console.error('[Navigation Debug] Error rendering FinancialReports:', error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Component Error</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <pre className="text-red-500 text-xs mt-2 overflow-auto">
            {error.stack}
          </pre>
        </div>
      </div>
    )
  }
}

// Component to monitor route changes
const RouterDebugger = () => {
  const location = useLocation()
  const navigationType = useNavigationType()
  
  React.useEffect(() => {
    console.log('[Navigation Debug] Route changed:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state,
      navigationType
    })
    
    if (location.pathname !== '/app/reports' && location.state?.from === '/app/reports') {
      console.error('[Navigation Debug] REDIRECT DETECTED! User was redirected away from /app/reports')
    }
  }, [location, navigationType])
  
  return null
}

// Debug wrapper for Navigate component
const DebugNavigate = ({ to, replace, debugMessage }) => {
  React.useEffect(() => {
    console.error(`[Navigation Debug] ${debugMessage}`)
    console.error('[Navigation Debug] Original path:', window.location.pathname)
    console.error('[Navigation Debug] Redirecting to:', to)
  }, [to, debugMessage])
  
  return <Navigate to={to} replace={replace} />
}

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
  <div className="flex min-h-screen items-center justify-center bg-white">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <p className="text-xs uppercase tracking-[0.3em] text-gray-600">Loading Enterprise Dashboard...</p>
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
  console.log('[Navigation Debug] ProtectedRoute rendering')
  
  const [authComponents, setAuthComponents] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[Navigation Debug] ProtectedRoute useEffect - loading auth components')
    
    const loadAuthComponents = async () => {
      try {
        if (isDevelopmentMode) {
          console.log('[Navigation Debug] Loading development auth components')
          const devAuth = await import('./auth/DevelopmentAuthProvider.jsx')
          setAuthComponents({
            SignedIn: devAuth.SignedIn,
            SignedOut: devAuth.SignedOut,
            RedirectToSignIn: devAuth.RedirectToSignIn
          })
        } else {
          console.log('[Navigation Debug] Loading production Clerk auth components')
          const clerkAuth = await import('@clerk/clerk-react')
          setAuthComponents({
            SignedIn: clerkAuth.SignedIn,
            SignedOut: clerkAuth.SignedOut,
            RedirectToSignIn: clerkAuth.RedirectToSignIn
          })
        }
      } catch (error) {
        console.error('[Navigation Debug] [ProtectedRoute] Failed to load auth components:', error)
        // Fallback to development mode
        const devAuth = await import('./auth/DevelopmentAuthProvider.jsx')
        setAuthComponents({
          SignedIn: devAuth.SignedIn,
          SignedOut: devAuth.SignedOut,
          RedirectToSignIn: devAuth.RedirectToSignIn
        })
      } finally {
        setLoading(false)
        console.log('[Navigation Debug] ProtectedRoute auth components loaded')
      }
    }

    loadAuthComponents()
  }, [])

  if (loading || !authComponents) {
    console.log('[Navigation Debug] ProtectedRoute showing loader')
    return <Loader />
  }

  const { SignedIn, SignedOut, RedirectToSignIn } = authComponents

  console.log('[Navigation Debug] ProtectedRoute rendering auth wrapper')

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
      <XeroProvider>
        <BrowserRouter>
          <RouterDebugger />
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
          
          {/* DEBUG ROUTE TO TEST ROUTING */}
          <Route path="/app/test-reports" element={
            <div className="p-8 bg-green-50 min-h-screen">
              <h1 className="text-2xl font-bold text-green-800">✅ TEST ROUTE WORKING</h1>
              <p className="text-green-700">This proves routing is functional - the issue is specific to /app/reports</p>
              <pre className="mt-4 p-4 bg-green-100 rounded text-sm">
                URL: {window.location.href}{'\n'}
                Pathname: {window.location.pathname}{'\n'}
                Timestamp: {new Date().toISOString()}
              </pre>
            </div>
          } />
          
          <Route path="/app/reports" element={
            <ProtectedRoute>
              <FinancialReportsErrorBoundary>
                <Suspense fallback={<Loader />}>
                  <FinancialReportsWrapper />
                </Suspense>
              </FinancialReportsErrorBoundary>
            </ProtectedRoute>
          } />
          
          {/* Default redirects - TEMPORARILY DISABLED FOR DEBUGGING */}
          {/* <Route path="/app/*" element={
            <DebugNavigate 
              to="/app/dashboard" 
              replace 
              debugMessage="FALLBACK ROUTE TRIGGERED: /app/* -> /app/dashboard"
            />
          } /> */}
          <Route path="*" element={
            <DebugNavigate 
              to="/" 
              replace 
              debugMessage="ROOT FALLBACK TRIGGERED: * -> /"
            />
          } />
        </Routes>
        </BrowserRouter>
      </XeroProvider>
    </QueryClientProvider>
  </AuthenticationProvider>
)

export default App