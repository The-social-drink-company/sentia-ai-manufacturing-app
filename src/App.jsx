import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Pages
import LandingPage from './pages/LandingPage'
import EnhancedDashboard from './pages/EnhancedDashboard'
import EnhancedDashboardSimple from './pages/EnhancedDashboardSimple'
import WorkingCapitalDashboard from './pages/WorkingCapitalDashboard'
import AdminPortal from './pages/AdminPortal'

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute'

// Styles
import './App.css'

// Environment variables
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: false
    },
  },
})

// Fallback dashboard for when Clerk is not available
function FallbackDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sentia Manufacturing Dashboard
          </h1>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Demo Mode:</strong> Authentication is disabled. In production, users would sign in through Clerk.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Production Ready</h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-2">
                Full authentication, role-based access, and enterprise features available.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100">Multi-tenant</h3>
              <p className="text-sm text-green-700 dark:text-green-200 mt-2">
                Support for multiple organizations and role hierarchies.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Real-time</h3>
              <p className="text-sm text-purple-700 dark:text-purple-200 mt-2">
                Live data updates and collaborative dashboard management.
              </p>
            </div>
          </div>
        </div>
        <EnhancedDashboardSimple />
      </div>
    </div>
  )
}

// Main app content component with authentication
function AuthenticatedApp() {
  return (
    <div className="App">
      <Routes>
        {/* Public landing page */}
        <Route 
          path="/" 
          element={
            <>
              <SignedOut>
                <LandingPage />
              </SignedOut>
              <SignedIn>
                <Navigate to="/dashboard" replace />
              </SignedIn>
            </>
          } 
        />

        {/* Protected dashboard routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <EnhancedDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/working-capital" 
          element={
            <ProtectedRoute>
              <WorkingCapitalDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin portal - requires admin role */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPortal />
            </ProtectedRoute>
          } 
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

// Simple app without authentication
function SimpleApp() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<FallbackDashboard />} />
        <Route path="/dashboard" element={<FallbackDashboard />} />
        <Route path="/dashboard/simple" element={<EnhancedDashboardSimple />} />
        <Route path="/working-capital" element={<WorkingCapitalDashboard />} />
        <Route path="/admin/*" element={<AdminPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  try {
    // If Clerk is not configured, render without authentication
    if (!clerkPubKey) {
      console.log('Running in demo mode - authentication disabled')
      return (
        <QueryClientProvider client={queryClient}>
          <Router>
            <SimpleApp />
          </Router>
          {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      )
    }

    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <AuthenticatedApp />
          </Router>
          {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </ClerkProvider>
    )
  } catch (error) {
    console.error('App initialization error:', error)
    
    // Fallback error boundary
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-xl font-bold text-red-600 mb-4">Application Error</h1>
          <p className="text-gray-600 mb-4">
            The application encountered an error during initialization.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    )
  }
}

export default App