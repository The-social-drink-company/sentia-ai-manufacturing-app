import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PublicOnlyRoute from '@/components/auth/PublicOnlyRoute'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/sonner'
import { XeroProvider } from '@/contexts/XeroContext'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const FeaturesPage = lazy(() => import('@/pages/marketing/FeaturesPage'))
const PricingPage = lazy(() => import('@/pages/marketing/PricingPage'))
const BlogListPage = lazy(() => import('@/pages/marketing/BlogListPage'))
const BlogPostPage = lazy(() => import('@/pages/marketing/BlogPostPage'))
const EcosystemPage = lazy(() => import('@/pages/marketing/EcosystemPage'))
const AboutPage = lazy(() => import('@/pages/marketing/AboutPage'))
const SignInPage = lazy(() => import('@/pages/SignInPage'))
const SignUpPage = lazy(() => import('@/pages/SignUpPage'))
const DashboardLayout = lazy(() => import('@/components/DashboardLayout'))
const Dashboard = lazy(() => import('@/pages/DashboardEnterprise'))
const WorkingCapital = lazy(() => import('@/components/WorkingCapital/RealWorkingCapital'))
const Forecasting = lazy(() => import('@/pages/Forecasting'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Inventory = lazy(() => import('@/components/inventory/InventoryDashboard'))
const DataImport = lazy(() => import('@/components/data/DataImportWidget'))
const AdminPanel = lazy(() => import('@/pages/AdminPanelEnhanced'))
const WhatIf = lazy(() => import('@/components/analytics/WhatIfAnalysis'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const renderDashboardPage = Component => (
  <ProtectedRoute>
    <XeroProvider>
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    </XeroProvider>
  </ProtectedRoute>
)

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen message="Loading Sentia experience..." />}>
            <Routes>
              <Route
                path="/"
                element={
                  <PublicOnlyRoute>
                    <LandingPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/features"
                element={
                  <PublicOnlyRoute>
                    <FeaturesPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/pricing"
                element={
                  <PublicOnlyRoute>
                    <PricingPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/ecosystem"
                element={
                  <PublicOnlyRoute>
                    <EcosystemPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/about"
                element={
                  <PublicOnlyRoute>
                    <AboutPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/blog"
                element={
                  <PublicOnlyRoute>
                    <BlogListPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/blog/:slug"
                element={
                  <PublicOnlyRoute>
                    <BlogPostPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/sign-in/*"
                element={
                  <PublicOnlyRoute>
                    <SignInPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/sign-up/*"
                element={
                  <PublicOnlyRoute>
                    <SignUpPage />
                  </PublicOnlyRoute>
                }
              />

              <Route path="/dashboard" element={renderDashboardPage(Dashboard)} />
              <Route path="/working-capital" element={renderDashboardPage(WorkingCapital)} />
              <Route path="/forecasting" element={renderDashboardPage(Forecasting)} />
              <Route path="/analytics" element={renderDashboardPage(Analytics)} />
              <Route path="/inventory" element={renderDashboardPage(Inventory)} />
              <Route path="/import" element={renderDashboardPage(DataImport)} />
              <Route path="/admin" element={renderDashboardPage(AdminPanel)} />
              <Route path="/what-if" element={renderDashboardPage(WhatIf)} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster richColors position="top-right" closeButton />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
