import { Suspense, lazy } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import DashboardLayout from '@/components/DashboardLayout'
import ProgressiveDashboardLoader from '@/components/dashboard/ProgressiveDashboardLoader'
import ClerkSignIn from '@/pages/ClerkSignIn'

const Dashboard = lazy(() => import('@/pages/DashboardEnterprise'))
const WorkingCapital = lazy(() => import('@/pages/WorkingCapitalEnterprise'))
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

const queryClient = new QueryClient()

const Loader = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Loading dashboard.</p>
    </div>
  </div>
)

const ProtectedShell = () => (
  <SignedIn>
    <ProgressiveDashboardLoader>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </ProgressiveDashboardLoader>
  </SignedIn>
)

const RequireAuth = () => (
  <>
    <SignedIn>
      <Outlet />
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
)

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY, Clerk features will be disabled')
}

const AuthenticatedApp = () => (
  <ClerkProvider
    publishableKey={publishableKey}
    navigate={(to) => {
      window.location.href = to
    }}
    appearance={{
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
    }}
  >
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="sign-in" element={<ClerkSignIn />} />
        <Route element={<RequireAuth />}>
          <Route element={<ProtectedShell />}>
            <Route
              path="dashboard"
              element={<Suspense fallback={<Loader />}><Dashboard /></Suspense>}
            />
            <Route
              path="working-capital"
              element={<Suspense fallback={<Loader />}><WorkingCapital /></Suspense>}
            />
            <Route
              path="forecasting"
              element={<Suspense fallback={<Loader />}><Forecasting /></Suspense>}
            />
            <Route
              path="production"
              element={<Suspense fallback={<Loader />}><Production /></Suspense>}
            />
            <Route
              path="analytics"
              element={<Suspense fallback={<Loader />}><Analytics /></Suspense>}
            />
            <Route
              path="inventory"
              element={<Suspense fallback={<Loader />}><Inventory /></Suspense>}
            />
            <Route
              path="quality"
              element={<Suspense fallback={<Loader />}><Quality /></Suspense>}
            />
            <Route
              path="data-import"
              element={<Suspense fallback={<Loader />}><DataImport /></Suspense>}
            />
            <Route
              path="admin"
              element={<Suspense fallback={<Loader />}><AdminPanel /></Suspense>}
            />
            <Route
              path="what-if"
              element={<Suspense fallback={<Loader />}><WhatIf /></Suspense>}
            />
            <Route
              path="scenarios"
              element={<Suspense fallback={<Loader />}><ScenarioPlanner /></Suspense>}
            />
            <Route
              path="assistant"
              element={<Suspense fallback={<Loader />}><AssistantPanel /></Suspense>}
            />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  </ClerkProvider>
)

export default AuthenticatedApp
