import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, SignInButton, UserButton } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'react-hot-toast'
import './index.css'

// Layout Components
import DashboardLayout from './components/layout/DashboardLayout'
import WorldClassLayout from './components/layout/WorldClassLayout'
import { LoadingSpinner } from './components/LoadingStates'
import ErrorBoundaryFallback from './components/ErrorBoundary'

// Lazy Load Pages for Performance
const WorldClassDashboard = lazy(() => import('./pages/WorldClassDashboard'))
const WorldClassEnterpriseDashboard = lazy(() => import('./pages/WorldClassEnterpriseDashboard'))
const EnterpriseEnhancedDashboard = lazy(() => import('./pages/EnterpriseEnhancedDashboard'))
const SimpleDashboard = lazy(() => import('./pages/SimpleDashboard'))
const WorkingEnterpriseDashboard = lazy(() => import('./pages/WorkingEnterpriseDashboard'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const WhatIfAnalysis = lazy(() => import('./components/analytics/WhatIfAnalysis'))
const WorkingCapital = lazy(() => import('./components/WorkingCapital/WorkingCapital'))
const DataImportDashboard = lazy(() => import('./components/DataImport/DataImportDashboard'))
const InventoryManagement = lazy(() => import('./components/inventory/InventoryManagement'))
const ProductionTracking = lazy(() => import('./components/production/ProductionTracking'))
const QualityControl = lazy(() => import('./components/quality/QualityControl'))
const DemandForecasting = lazy(() => import('./components/forecasting/DemandForecasting'))
const Analytics = lazy(() => import('./components/analytics/Analytics'))
const AIAnalyticsDashboard = lazy(() => import('./components/AI/AIAnalyticsDashboard'))
const PredictiveAnalyticsDashboard = lazy(() => import('./components/AI/PredictiveAnalyticsDashboard'))
const MaintenanceManagement = lazy(() => import('./components/admin/pages/AdminMaintenance'))
const MCPConnectionStatus = lazy(() => import('./components/AI/MCPConnectionStatus'))
const SystemSettings = lazy(() => import('./components/settings/Settings'))

console.log('Starting Sentia Enterprise Manufacturing Dashboard...')

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Validate Clerk key exists
if (!clerkPubKey) {
  console.error('VITE_CLERK_PUBLISHABLE_KEY is not set in environment variables')
  throw new Error('Clerk publishable key is required')
}

console.log('Clerk key loaded:', clerkPubKey.substring(0, 20) + '...')

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.status === 404) return false
        return failureCount < 3
      }
    }
  }
})

// Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      <div className="relative min-h-screen flex items-center justify-center px-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              SENTIA
            </h1>
            <h2 className="text-2xl md:text-3xl font-light mb-6 text-blue-100">
              Manufacturing Intelligence Platform
            </h2>
            <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto mb-8">
              Advanced AI-powered manufacturing dashboard with real-time analytics, 
              predictive insights, and intelligent automation for modern production facilities.
            </p>
          </div>

          {/* Authentication Section */}
          <div className="space-y-6">
            <SignedOut>
              <div className="space-y-4">
                <SignInButton mode="modal" redirectUrl="/dashboard">
                  <button className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
                    Sign In to Access Dashboard
                  </button>
                </SignInButton>
                
                <p className="text-blue-200 text-sm">
                  Secure enterprise authentication powered by Clerk
                </p>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="space-y-4">
                <a 
                  href="/dashboard"
                  className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
                    Access Your Dashboard
                </a>
                
                <div className="flex items-center justify-center space-x-4">
                  <p className="text-blue-200 text-sm">Welcome back!</p>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </div>
  )
}

// Protected route wrapper with guest access support
const ProtectedRoute = ({ children, allowGuest = false }) => {
  // Allow guest access for demo purposes
  if (allowGuest) {
    return children
  }
  
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

// Dashboard Route Component with Fallback Support
const DashboardRoute = () => {
  const [searchParams] = useSearchParams()
  const fallback = searchParams.get('fallback')
  
  if (fallback === 'true') {
    return <SimpleDashboard />
  }
  
  return (
    <ErrorBoundary 
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
            <p className="text-gray-600 mb-4">Enterprise dashboard failed to load.</p>
            <div className="flex space-x-3">
              <button 
                onClick={resetErrorBoundary}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Retry
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard?fallback=true'}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Simple Mode
              </button>
            </div>
          </div>
        </div>
      )}
      onReset={() => window.location.reload()}
    >
      <WorkingEnterpriseDashboard />
    </ErrorBoundary>
  )
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      <QueryClientProvider client={queryClient}>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Landing Page */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Protected Routes with World-Class Layout - Guest Access Enabled */}
                <Route 
                  path="/dashboard/*" 
                  element={
                    <ProtectedRoute allowGuest={true}>
                      <WorldClassLayout>
                        <Routes>
                          <Route index element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <DashboardRoute />
                            </Suspense>
                          } />
                          <Route path="basic" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <SimpleDashboard />
                            </Suspense>
                          } />
                        </Routes>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Enterprise Pages with World-Class Layout */}
                <Route 
                  path="/working-capital" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <WorkingCapital />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/what-if" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <WhatIfAnalysis />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/forecasting" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <DemandForecasting />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/inventory" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <InventoryManagement />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/production" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <ProductionTracking />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/quality" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <QualityControl />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Analytics />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/data-import" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <DataImportDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/ai-analytics" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AIAnalyticsDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/predictive-analytics" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <PredictiveAnalyticsDashboard />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/maintenance" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <MaintenanceManagement />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/mcp-status" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <MCPConnectionStatus />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <SystemSettings />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <WorldClassLayout>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminPanel />
                        </Suspense>
                      </WorldClassLayout>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Redirect to dashboard for any other route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              
              {/* Global Toast Notifications */}
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
          </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App;