import { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import LandingPage from '@/pages/LandingPage'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressiveDashboardLoader from '@/components/dashboard/ProgressiveDashboardLoader'
import SignInPage from '@/pages/SignInPage'
import SignUpPage from '@/pages/SignUpPage'
import ErrorBoundary from '@/components/ErrorBoundary'
import DebugPanel from '@/components/DebugPanel'
import { XeroProvider } from '@/contexts/XeroContext'

const Dashboard = lazy(() => import('@/pages/DashboardEnterprise'))
const WorkingCapital = lazy(() => import('@/components/WorkingCapital/RealWorkingCapital'))
const Forecasting = lazy(() => import('@/pages/Forecasting'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Inventory = lazy(() => import('@/components/inventory/InventoryDashboard'))
const DataImport = lazy(() => import('@/components/data/DataImportWidget'))
const AdminPanel = lazy(() => import('@/pages/AdminPanelEnhanced'))
const ImportWizard = lazy(() => import('@/pages/admin/ImportWizard'))
// const ExportBuilder = lazy(() => import('@/pages/admin/ExportBuilder')) // TODO: Create ExportBuilder component
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
      <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
        Loading Enterprise Dashboard...
      </p>
    </div>
  </div>
)

// Environment detection
const isDevelopmentMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

// Simple Development Protected Route - No Authentication Check
const DevelopmentProtectedRoute = ({ children }) => {
  return (
    <XeroProvider>
      <ProgressiveDashboardLoader>
        <DashboardLayout>{children}</DashboardLayout>
      </ProgressiveDashboardLoader>
    </XeroProvider>
  )
}

// Production Protected Route - Uses Clerk
const ProductionProtectedRoute = ({ children }) => {
  const [ClerkComponents, setClerkComponents] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadClerk = async () => {
      try {
        const clerkAuth = await import('@clerk/clerk-react')
        setClerkComponents({
          SignedIn: clerkAuth.SignedIn,
          SignedOut: clerkAuth.SignedOut,
          RedirectToSignIn: clerkAuth.RedirectToSignIn,
        })
      } catch (error) {
        console.error('[Production] Failed to load Clerk:', error)
        // Fallback to development mode if Clerk fails
        setClerkComponents(null)
      } finally {
        setLoading(false)
      }
    }

    loadClerk()
  }, [])

  if (loading) {
    return <Loader />
  }

  if (!ClerkComponents) {
    // Fallback to development mode if Clerk unavailable
    return (
      <XeroProvider>
        <ProgressiveDashboardLoader>
          <DashboardLayout>{children}</DashboardLayout>
        </ProgressiveDashboardLoader>
      </XeroProvider>
    )
  }

  const { SignedIn, SignedOut, RedirectToSignIn } = ClerkComponents

  return (
    <>
      <SignedIn>
        <XeroProvider>
          <ProgressiveDashboardLoader>
            <DashboardLayout>{children}</DashboardLayout>
          </ProgressiveDashboardLoader>
        </XeroProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

// Choose the appropriate protected route based on environment
const ProtectedRoute = isDevelopmentMode ? DevelopmentProtectedRoute : ProductionProtectedRoute

// Authentication Provider - Simple approach
const AuthProvider = ({ children }) => {
  const [ClerkProvider, setClerkProvider] = useState(null)
  const [loading, setLoading] = useState(!isDevelopmentMode)

  useEffect(() => {
    if (isDevelopmentMode) {
      // Development mode - no auth provider needed
      setLoading(false)
      return
    }

    // Production mode - load Clerk
    const loadClerkProvider = async () => {
      try {
        const clerkAuth = await import('@clerk/clerk-react')
        setClerkProvider(() => clerkAuth.ClerkProvider)
      } catch (error) {
        console.error('[Auth] Failed to load Clerk provider:', error)
      } finally {
        setLoading(false)
      }
    }

    loadClerkProvider()
  }, [])

  if (loading) {
    return <Loader />
  }

  if (isDevelopmentMode || !ClerkProvider) {
    // Development mode or fallback - no auth wrapper
    return children
  }

  // Production mode with Clerk
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const clerkAppearance = {
    baseTheme: undefined,
    variables: {
      colorPrimary: '#2563eb',
      colorTextOnPrimaryBackground: '#ffffff',
      colorBackground: '#ffffff',
      colorInputBackground: '#ffffff',
      colorInputText: '#1f2937',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '0.5rem',
    },
    elements: {
      card: {
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        border: '1px solid #e5e7eb',
      },
      headerTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
      },
      headerSubtitle: {
        color: '#6b7280',
      },
    },
  }

  return (
    <ClerkProvider publishableKey={publishableKey} appearance={clerkAppearance}>
      {children}
    </ClerkProvider>
  )
}

const App = () => {
  console.log('[App] Starting with development mode:', isDevelopmentMode)

  return (
    <ErrorBoundary fallbackMessage="The Sentia Manufacturing Dashboard encountered an unexpected error. Please try refreshing the page.">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />

              {/* Authentication Routes */}
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              {/* Legacy routes for backward compatibility */}
              <Route path="/app/sign-in" element={<Navigate to="/sign-in" replace />} />
              <Route path="/app/sign-up" element={<Navigate to="/sign-up" replace />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ErrorBoundary fallbackMessage="Dashboard failed to load. Please check your connection and try again.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <Dashboard />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />
              {/* Legacy /app/dashboard route for backward compatibility */}
              <Route
                path="/app/dashboard"
                element={
                  <ErrorBoundary fallbackMessage="Dashboard failed to load. Please check your connection and try again.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <Dashboard />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/app/working-capital"
                element={
                  <ErrorBoundary fallbackMessage="Working Capital module failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <WorkingCapital />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/app/forecasting"
                element={
                  <ErrorBoundary fallbackMessage="Forecasting module failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <Forecasting />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/app/analytics"
                element={
                  <ErrorBoundary fallbackMessage="Analytics module failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <Analytics />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/app/inventory"
                element={
                  <ErrorBoundary fallbackMessage="Inventory module failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <Inventory />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/app/data-import"
                element={
                  <ErrorBoundary fallbackMessage="Data Import module failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <DataImport />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/app/admin"
                element={
                  <ErrorBoundary fallbackMessage="Admin Panel failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <AdminPanel />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/app/admin/import"
                element={
                  <ErrorBoundary fallbackMessage="Import Wizard failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <ImportWizard />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              {/* TODO: Implement ExportBuilder component
              <Route
                path="/app/admin/export"
                element={
                  <ErrorBoundary fallbackMessage="Export Builder failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <ExportBuilder />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />
              */}

              <Route
                path="/app/what-if"
                element={
                  <ErrorBoundary fallbackMessage="What-If Analysis module failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <WhatIf />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/app/scenarios"
                element={
                  <ErrorBoundary fallbackMessage="Scenario Planner module failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <ScenarioPlanner />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/app/assistant"
                element={
                  <ErrorBoundary fallbackMessage="AI Assistant failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <AssistantPanel />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              {/* Default redirects */}
              <Route path="/app/*" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Development Debug Panel */}
            <DebugPanel />
          </BrowserRouter>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
