import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Layout Components
import DashboardLayout from './components/DashboardLayoutReborn'
import LandingPage from './components/LandingPage'

// Lazy-loaded Page Components
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'))
const WorkingCapitalComprehensive = lazy(() => import('./pages/WorkingCapitalComprehensive'))
const WhatIfAnalysisComprehensive = lazy(() => import('./pages/WhatIfAnalysisComprehensive'))
const DemandForecasting = lazy(() => import('./pages/DemandForecasting'))
const InventoryManagement = lazy(() => import('./pages/InventoryManagement'))
const ProductionTracking = lazy(() => import('./pages/ProductionTracking'))
const QualityControl = lazy(() => import('./pages/QualityControl'))
const FinancialReports = lazy(() => import('./pages/FinancialReports'))
const DataImport = lazy(() => import('./pages/DataImport'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))

// Create QueryClient for data management
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

// Loading Component
const Loader = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Loading Enterprise Dashboard...</p>
    </div>
  </div>
)

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => (
  <>
    <SignedIn>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
)

// Clerk Configuration
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY, Clerk features will be disabled')
}

const clerkAppearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: '#2563eb',
    colorTextOnPrimaryBackground: '#ffffff',
    colorBackground: '#0f172a',
    colorInputBackground: '#1e293b',
    colorInputText: '#f1f5f9',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '0.5rem'
  },
  elements: {
    card: {
      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      border: '1px solid #334155',
      backgroundColor: '#1e293b'
    },
    headerTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#f1f5f9'
    },
    headerSubtitle: {
      color: '#94a3b8'
    }
  }
}

function App() {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      navigate={(to) => {
        window.location.href = to
      }}
      appearance={clerkAppearance}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/app/*" element={
              <Routes>
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <Suspense fallback={<Loader />}>
                      <ExecutiveDashboard />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                <Route path="working-capital" element={
                  <ProtectedRoute>
                    <Suspense fallback={<Loader />}>
                      <WorkingCapitalComprehensive />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                <Route path="what-if-analysis" element={
                  <ProtectedRoute>
                    <Suspense fallback={<Loader />}>
                      <WhatIfAnalysisComprehensive />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                <Route path="demand-forecasting" element={
                  <ProtectedRoute>
                    <Suspense fallback={<Loader />}>
                      <DemandForecasting />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                <Route path="inventory-management" element={
                  <ProtectedRoute>
                    <Suspense fallback={<Loader />}>
                      <InventoryManagement />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                <Route path="production-tracking" element={
                  <ProtectedRoute>
                    <Suspense fallback={<Loader />}>
                      <ProductionTracking />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                <Route path="quality-control" element={
                  <ProtectedRoute>
                    <Suspense fallback={<Loader />}>
                      <QualityControl />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                <Route path="financial-reports" element={
                  <ProtectedRoute>
                    <Suspense fallback={<Loader />}>
                      <FinancialReports />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                <Route path="data-import" element={
                  <ProtectedRoute>
                    <Suspense fallback={<Loader />}>
                      <DataImport />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                <Route path="admin-panel" element={
                  <ProtectedRoute>
                    <Suspense fallback={<Loader />}>
                      <AdminPanel />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Default redirect to dashboard */}
                <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
              </Routes>
            } />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  )
}

export default App
