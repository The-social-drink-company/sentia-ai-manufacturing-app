import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Lazy load all pages for better performance
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'))
const EnterpriseDashboard = lazy(() => import('./pages/EnterpriseEnhancedDashboard'))
const WorkingCapitalDashboard = lazy(() => import('./pages/WorkingCapitalDashboard'))
const AdminPortal = lazy(() => import('./pages/AdminPortal'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const AdminPanelEnhanced = lazy(() => import('./pages/AdminPanelEnhanced'))
const DataImport = lazy(() => import('./pages/DataImport'))
const LandingPage = lazy(() => import('./pages/Landing'))
const InventoryPage = lazy(() => import('./pages/Inventory'))
const SettingsPage = lazy(() => import('./pages/Settings'))

// Import components
const WorkingCapital = lazy(() => import('./components/WorkingCapital'))
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis'))
const AIForecastingInterface = lazy(() => import('./components/forecasting/AIForecastingInterface'))
const InventoryOptimizer = lazy(() => import('./components/inventory/InventoryOptimizer'))
const MultiMarketAnalytics = lazy(() => import('./components/analytics/MultiMarketAnalytics'))
const CFOBoardPack = lazy(() => import('./components/Executive/CFOBoardPack'))
const DataImportWizard = lazy(() => import('./components/DataImport/DataImportWizard'))
const Templates = lazy(() => import('./components/templates/Templates'))
const SystemHealth = lazy(() => import('./components/system/SystemHealth'))
const EnterpriseAIChatbot = lazy(() => import('./components/AI/EnterpriseAIChatbot'))

// Loading component
function Loading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{
        color: 'white',
        marginTop: '1rem',
        fontSize: '1.1rem'
      }}>
        Loading SENTIA Dashboard...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Main App component - Full Enterprise without Clerk
function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div style={{ minHeight: '100vh' }}>
            <Routes>
              {/* Home/Landing Page */}
              <Route path="/" element={
                <Suspense fallback={<Loading />}>
                  <LandingPage />
                </Suspense>
              } />

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={
                <Suspense fallback={<Loading />}>
                  <EnhancedDashboard />
                </Suspense>
              } />

              <Route path="/dashboard/enterprise" element={
                <Suspense fallback={<Loading />}>
                  <EnterpriseDashboard />
                </Suspense>
              } />

              {/* Financial Management Routes */}
              <Route path="/working-capital" element={
                <Suspense fallback={<Loading />}>
                  <WorkingCapital />
                </Suspense>
              } />

              <Route path="/working-capital/dashboard" element={
                <Suspense fallback={<Loading />}>
                  <WorkingCapitalDashboard />
                </Suspense>
              } />

              <Route path="/what-if" element={
                <Suspense fallback={<Loading />}>
                  <WhatIfAnalysis />
                </Suspense>
              } />

              <Route path="/analytics" element={
                <Suspense fallback={<Loading />}>
                  <MultiMarketAnalytics />
                </Suspense>
              } />

              <Route path="/cfo-board-pack" element={
                <Suspense fallback={<Loading />}>
                  <CFOBoardPack />
                </Suspense>
              } />

              {/* Planning & Operations Routes */}
              <Route path="/forecasting" element={
                <Suspense fallback={<Loading />}>
                  <AIForecastingInterface />
                </Suspense>
              } />

              <Route path="/inventory" element={
                <Suspense fallback={<Loading />}>
                  <InventoryPage />
                </Suspense>
              } />

              <Route path="/inventory-optimizer" element={
                <Suspense fallback={<Loading />}>
                  <InventoryOptimizer />
                </Suspense>
              } />

              <Route path="/production" element={
                <Suspense fallback={<Loading />}>
                  <EnhancedDashboard />
                </Suspense>
              } />

              <Route path="/quality" element={
                <Suspense fallback={<Loading />}>
                  <EnhancedDashboard />
                </Suspense>
              } />

              {/* Data Management Routes */}
              <Route path="/data-import" element={
                <Suspense fallback={<Loading />}>
                  <DataImportWizard />
                </Suspense>
              } />

              <Route path="/data-import/wizard" element={
                <Suspense fallback={<Loading />}>
                  <DataImport />
                </Suspense>
              } />

              <Route path="/templates" element={
                <Suspense fallback={<Loading />}>
                  <Templates />
                </Suspense>
              } />

              {/* Administration Routes */}
              <Route path="/admin" element={
                <Suspense fallback={<Loading />}>
                  <AdminPanel />
                </Suspense>
              } />

              <Route path="/admin/enhanced" element={
                <Suspense fallback={<Loading />}>
                  <AdminPanelEnhanced />
                </Suspense>
              } />

              <Route path="/admin/portal" element={
                <Suspense fallback={<Loading />}>
                  <AdminPortal />
                </Suspense>
              } />

              <Route path="/settings" element={
                <Suspense fallback={<Loading />}>
                  <SettingsPage />
                </Suspense>
              } />

              <Route path="/system-health" element={
                <Suspense fallback={<Loading />}>
                  <SystemHealth />
                </Suspense>
              } />

              {/* AI Analytics Routes */}
              <Route path="/ai-analytics" element={
                <Suspense fallback={<Loading />}>
                  <MultiMarketAnalytics />
                </Suspense>
              } />

              {/* Automation Routes */}
              <Route path="/automation" element={
                <Suspense fallback={<Loading />}>
                  <EnhancedDashboard />
                </Suspense>
              } />

              {/* Mobile Routes */}
              <Route path="/mobile" element={
                <Suspense fallback={<Loading />}>
                  <EnhancedDashboard />
                </Suspense>
              } />

              {/* API Status Route */}
              <Route path="/api-status" element={
                <Suspense fallback={<Loading />}>
                  <SystemHealth />
                </Suspense>
              } />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>

          {/* Enterprise AI Chatbot - Always visible across all pages */}
          <Suspense fallback={null}>
            <EnterpriseAIChatbot />
          </Suspense>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Router>
  )
}

export default App
