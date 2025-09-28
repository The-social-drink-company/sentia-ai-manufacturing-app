import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import LandingPage from '@/components/LandingPage'
import ClerkSignIn from '@/pages/ClerkSignIn'
import DashboardLayout from '@/components/DashboardLayout'

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
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Loading dashboard…</p>
    </div>
  </div>
)

const ProtectedShell = () => (
  <SignedIn>
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
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

const SmartHome = () => {
  const { isSignedIn, isLoaded } = useAuth()

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return isSignedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/" element={<SmartHome />} />
        <Route path="/sign-in" element={<ClerkSignIn />} />

        <Route element={<RequireAuth />}>
          <Route element={<ProtectedShell />}>
            <Route
              path="/dashboard"
              element={(
                <Suspense fallback={<Loader />}>
                  <Dashboard />
                </Suspense>
              )}
            />
            <Route
              path="/working-capital"
              element={(
                <Suspense fallback={<Loader />}>
                  <WorkingCapital />
                </Suspense>
              )}
            />
            <Route
              path="/forecasting"
              element={(
                <Suspense fallback={<Loader />}>
                  <Forecasting />
                </Suspense>
              )}
            />
            <Route
              path="/production"
              element={(
                <Suspense fallback={<Loader />}>
                  <Production />
                </Suspense>
              )}
            />
            <Route
              path="/analytics"
              element={(
                <Suspense fallback={<Loader />}>
                  <Analytics />
                </Suspense>
              )}
            />
            <Route
              path="/inventory"
              element={(
                <Suspense fallback={<Loader />}>
                  <Inventory />
                </Suspense>
              )}
            />
            <Route
              path="/quality"
              element={(
                <Suspense fallback={<Loader />}>
                  <Quality />
                </Suspense>
              )}
            />
            <Route
              path="/data-import"
              element={(
                <Suspense fallback={<Loader />}>
                  <DataImport />
                </Suspense>
              )}
            />
            <Route
              path="/admin"
              element={(
                <Suspense fallback={<Loader />}>
                  <AdminPanel />
                </Suspense>
              )}
            />
            <Route
              path="/what-if"
              element={(
                <Suspense fallback={<Loader />}>
                  <WhatIf />
                </Suspense>
              )}
            />
            <Route
              path="/scenarios"
              element={(
                <Suspense fallback={<Loader />}>
                  <ScenarioPlanner />
                </Suspense>
              )}
            />
            <Route
              path="/assistant"
              element={(
                <Suspense fallback={<Loader />}>
                  <AssistantPanel />
                </Suspense>
              )}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
)

export default App
