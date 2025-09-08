import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from 'react-error-boundary'

// Import layout components
import DashboardLayout from './components/layout/DashboardLayout'
import LoadingSpinner from './components/LoadingSpinner'

// Import page components (lazy loaded for better performance)
const EnterpriseEnhancedDashboard = React.lazy(() => import('./pages/EnterpriseEnhancedDashboard'))
const ManufacturingDashboard = React.lazy(() => import('./components/dashboard/ManufacturingDashboard'))
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'))

// Import analytical components
const Analytics = React.lazy(() => import('./components/analytics/Analytics'))
const WhatIfAnalysis = React.lazy(() => import('./components/analytics/WhatIfAnalysis'))

// Import other components
const WorkingCapital = React.lazy(() => import('./components/WorkingCapital/WorkingCapital'))
const DataImportDashboard = React.lazy(() => import('./components/DataImport/DataImportDashboard'))

import './index.css'

// Get Clerk publishable key with development bypass
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const useAuthBypass = import.meta.env.VITE_USE_AUTH_BYPASS === 'true'

console.log('Starting Sentia Enterprise Manufacturing Dashboard...')
console.log('Auth bypass mode:', useAuthBypass ? 'ENABLED' : 'DISABLED')

// Create a mock Clerk provider for development
const MockClerkProvider = ({ children }) => {
  console.log('Using mock authentication for development')
  return <>{children}</>
}

// Initialize React Query client with optimized settings for enterprise use
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 3
      },
      // Enable background refetching for real-time data
      refetchInterval: 30000, // 30 seconds
      refetchIntervalInBackground: true
    },
    mutations: {
      retry: 1,
    }
  }
})

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
        Something went wrong
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-200"
        >
          Reload page
        </button>
      </div>
    </div>
  </div>
)

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="lg" />
  </div>
)

// Protected route wrapper with bypass support
const ProtectedRoute = ({ children }) => {
  if (useAuthBypass) {
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

// Landing page component
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      <div className="relative min-h-screen flex items-center justify-center px-4">
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

          <div className="space-y-4">
            <a 
              href="/dashboard"
              className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200 text-lg shadow-lg">
                Access Dashboard
            </a>
            
            <p className="text-blue-200 text-sm">
              Secure authentication powered by Clerk
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  // Choose provider based on bypass mode
  const AuthProvider = useAuthBypass ? MockClerkProvider : ClerkProvider
  const providerProps = useAuthBypass ? {} : { publishableKey: clerkPubKey }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo)
        // In production, send to error reporting service
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider {...providerProps}>
          <Router>
            <div className="App">
              <Routes>
                {/* Public landing page */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Protected dashboard routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Suspense fallback={<PageLoader />}>
                          <ManufacturingDashboard />
                        </Suspense>
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/dashboard/basic" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Suspense fallback={<PageLoader />}>
                          <ManufacturingDashboard />
                        </Suspense>
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/dashboard/enterprise" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Suspense fallback={<PageLoader />}>
                          <EnterpriseEnhancedDashboard />
                        </Suspense>
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Suspense fallback={<PageLoader />}>
                          <Analytics />
                        </Suspense>
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/what-if" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Suspense fallback={<PageLoader />}>
                          <WhatIfAnalysis />
                        </Suspense>
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/working-capital" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Suspense fallback={<PageLoader />}>
                          <WorkingCapital />
                        </Suspense>
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/data-import" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Suspense fallback={<PageLoader />}>
                          <DataImportDashboard />
                        </Suspense>
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <AdminPanel />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Redirect unknown routes to dashboard for authenticated users */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              
              {/* Global toast notifications */}
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
        
        {/* React Query DevTools - only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App