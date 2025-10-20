import { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import LandingPage from '@/pages/marketing/LandingPage'
import FeaturesPage from '@/pages/marketing/FeaturesPage'
import BlogListPage from '@/pages/marketing/BlogListPage'
import BlogPostPage from '@/pages/marketing/BlogPostPage'
import DashboardLayout from '@/components/DashboardLayout'
import ProgressiveDashboardLoader from '@/components/dashboard/ProgressiveDashboardLoader'
import SignInPage from '@/pages/SignInPage'
import SignUpPage from '@/pages/SignUpPage'
import ErrorBoundary from '@/components/ErrorBoundary'
import DebugPanel from '@/components/DebugPanel'
import AuthError from '@/components/AuthError'
import { XeroProvider } from '@/contexts/XeroContext'
import { useRequireAuth } from '@/hooks/useRequireAuth'

const Dashboard = lazy(() => import('@/pages/DashboardEnterprise'))
const WorkingCapital = lazy(() => import('@/components/WorkingCapital/RealWorkingCapital'))
const Forecasting = lazy(() => import('@/pages/Forecasting'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Inventory = lazy(() => import('@/components/inventory/InventoryDashboard'))
const DataImport = lazy(() => import('@/components/data/DataImportWidget'))
const AdminPanel = lazy(() => import('@/pages/AdminPanelEnhanced'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const TrialOnboarding = lazy(() => import('@/pages/onboarding/OnboardingWizard'))
const MasterAdminDashboard = lazy(() => import('@/pages/master-admin/MasterAdminDashboard'))
const TrialSignup = lazy(() => import('@/pages/auth/TrialSignup'))
// const ImportWizard = lazy(() => import('@/pages/admin/ImportWizard')) // TODO: Create ImportWizard component
// const ExportBuilder = lazy(() => import('@/pages/admin/ExportBuilder')) // TODO: Create ExportBuilder component
const WhatIf = lazy(() => import('@/components/analytics/WhatIfAnalysis'))
const ScenarioPlanner = lazy(() => import('@/features/forecasting/ScenarioPlanner.jsx'))
const AssistantPanel = lazy(() => import('@/features/ai-assistant/AssistantPanel.jsx'))
const SettingsBilling = lazy(() => import('@/pages/SettingsBilling'))

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
// BMAD-DEPLOY-001-FIX: In production builds, ALWAYS use Clerk (never development mode)
// Priority: import.meta.env.PROD > VITE_DEVELOPMENT_MODE
// This ensures ClerkProvider wraps the app and authentication works correctly
const isProductionBuild = import.meta.env.PROD === true
const developmentFlag = import.meta.env.VITE_DEVELOPMENT_MODE

// Production builds ALWAYS use production authentication (Clerk)
// Development mode ONLY enabled when:
// 1. NOT a production build (import.meta.env.PROD === false)
// 2. AND developmentFlag is explicitly set to true/not "false"
const isDevelopmentMode = isProductionBuild
  ? false // ALWAYS false in production builds (import.meta.env.PROD === true)
  : developmentFlag === 'true' || developmentFlag === true // Only true if explicitly enabled in dev

// Simple Development Protected Route - No Authentication Check
// In development mode, RBAC is bypassed for convenience
const DevelopmentProtectedRoute = ({ children, requiredRole }) => {
  // Log RBAC requirement for visibility (but don't enforce in dev mode)
  if (requiredRole) {
    console.log(`[Dev Mode] Route requires role: ${requiredRole} (bypassed in development)`)
  }

  return (
    <XeroProvider>
      <ProgressiveDashboardLoader>
        <DashboardLayout>{children}</DashboardLayout>
      </ProgressiveDashboardLoader>
    </XeroProvider>
  )
}

// Inner component that performs RBAC check (can use hooks)
const RBACGuard = ({ children, requiredRole }) => {
  // Use the RBAC hook - it will redirect to /unauthorized if role insufficient
  useRequireAuth({ requiredRole })

  return children
}

// Production Protected Route - Uses Clerk
const ProductionProtectedRoute = ({ children, requiredRole }) => {
  const [ClerkComponents, setClerkComponents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [clerkError, setClerkError] = useState(null)

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
        // BMAD-AUTH-008-FIX-002: Remove fallback to dev mode, show error instead
        setClerkError(error)
      } finally {
        setLoading(false)
      }
    }

    loadClerk()
  }, [])

  if (loading) {
    return <Loader />
  }

  // BMAD-AUTH-008-FIX-002: Show error page instead of fallback
  if (!ClerkComponents || clerkError) {
    return (
      <AuthError
        type="network"
        message="Unable to connect to authentication service. Please check your internet connection and try again."
        onRetry={() => window.location.reload()}
      />
    )
  }

  const { SignedIn, SignedOut, RedirectToSignIn } = ClerkComponents

  return (
    <>
      <SignedIn>
        {/* BMAD-AUTH-008-FIX-001: Add RBAC enforcement */}
        {requiredRole ? (
          <RBACGuard requiredRole={requiredRole}>
            <XeroProvider>
              <ProgressiveDashboardLoader>
                <DashboardLayout>{children}</DashboardLayout>
              </ProgressiveDashboardLoader>
            </XeroProvider>
          </RBACGuard>
        ) : (
          <XeroProvider>
            <ProgressiveDashboardLoader>
              <DashboardLayout>{children}</DashboardLayout>
            </ProgressiveDashboardLoader>
          </XeroProvider>
        )}
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Always load Clerk provider (needed for Clerk components even in dev mode)
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

  if (!ClerkProvider) {
    // Fallback if Clerk failed to load - no auth wrapper
    console.warn('[Auth] ClerkProvider not available, rendering without authentication')
    return children
  }

  // Both development and production modes use ClerkProvider
  // (Clerk components like SignIn require ClerkProvider even in dev mode)
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

  // BMAD-DEPLOY-006-FIX: Log Clerk configuration for debugging
  console.log('[AuthProvider] Clerk Configuration:', {
    publishableKeyPresent: !!publishableKey,
    publishableKeyLength: publishableKey?.length || 0,
    publishableKeyPrefix: publishableKey?.substring(0, 15) || 'NOT_SET',
  })

  // BMAD-DEPLOY-006-FIX: Warn if publishable key is missing
  if (!publishableKey) {
    console.error('[AuthProvider] VITE_CLERK_PUBLISHABLE_KEY is not set - authentication will not work!')
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
  console.log('[App] Environment Configuration:', {
    isDevelopmentMode,
    isProductionBuild,
    VITE_DEVELOPMENT_MODE: import.meta.env.VITE_DEVELOPMENT_MODE,
    PROD: import.meta.env.PROD,
    authMode: isDevelopmentMode ? 'development-bypass' : 'production-clerk',
  })

  return (
    <ErrorBoundary fallbackMessage="The Sentia Manufacturing Dashboard encountered an unexpected error. Please try refreshing the page.">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/blog" element={<BlogListPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />

              {/* Authentication Routes */}
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/trial-signup" element={
                <ErrorBoundary fallbackMessage="Trial signup failed to load.">
                  <Suspense fallback={<Loader />}>
                    <TrialSignup />
                  </Suspense>
                </ErrorBoundary>
              } />
              {/* Legacy routes for backward compatibility */}
              <Route path="/app/sign-in" element={<Navigate to="/sign-in" replace />} />
              <Route path="/app/sign-up" element={<Navigate to="/sign-up" replace />} />

              {/* Onboarding Route */}
              <Route
                path="/onboarding"
                element={
                  <ErrorBoundary fallbackMessage="Onboarding failed to load.">
                    <Suspense fallback={<Loader />}>
                      <Onboarding />
                    </Suspense>
                  </ErrorBoundary>
                }
              />

              {/* Trial Onboarding Wizard */}
              <Route
                path="/trial-onboarding"
                element={
                  <ErrorBoundary fallbackMessage="Trial onboarding failed to load.">
                    <Suspense fallback={<Loader />}>
                      <TrialOnboarding />
                    </Suspense>
                  </ErrorBoundary>
                }
              />

              {/* Master Admin Route (Requires special email whitelist) */}
              <Route
                path="/master-admin"
                element={
                  <ErrorBoundary fallbackMessage="Master Admin dashboard failed to load.">
                    <Suspense fallback={<Loader />}>
                      <MasterAdminDashboard />
                    </Suspense>
                  </ErrorBoundary>
                }
              />

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
                    <ProtectedRoute requiredRole="manager">
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
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<Loader />}>
                        <AdminPanel />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              {/* TODO: Implement ImportWizard component
              <Route
                path="/app/admin/import"
                element={
                  <ErrorBoundary fallbackMessage="Import Wizard failed to load.">
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<Loader />}>
                        <ImportWizard />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />
              */}

              {/* TODO: Implement ExportBuilder component
              <Route
                path="/app/admin/export"
                element={
                  <ErrorBoundary fallbackMessage="Export Builder failed to load.">
                    <ProtectedRoute requiredRole="admin">
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

              {/* Settings Routes */}
              <Route
                path="/settings/billing"
                element={
                  <ErrorBoundary fallbackMessage="Settings Billing page failed to load.">
                    <ProtectedRoute>
                      <Suspense fallback={<Loader />}>
                        <SettingsBilling />
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
