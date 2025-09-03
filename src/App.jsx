import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Pages
import LandingPage from './pages/LandingPage'
import EnhancedDashboard from './pages/EnhancedDashboard'
import WorkingCapitalDashboard from './pages/WorkingCapitalDashboard'
import AdminPortal from './pages/AdminPortal'

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute'

// Styles
import './App.css'

// Environment variables
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY not found. Authentication will be disabled.')
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

// Main app content component
function AppContent() {
  const location = useLocation()
  
  useEffect(() => {
    // Add environment-specific debugging
    console.log('App loaded with Clerk key:', clerkPubKey ? 'Present' : 'Missing')
    console.log('Current path:', location.pathname)
  }, [location.pathname])

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

function App() {
  // If Clerk is not configured, render without authentication
  if (!clerkPubKey) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<EnhancedDashboard />} />
              <Route path="/dashboard" element={<EnhancedDashboard />} />
              <Route path="/working-capital" element={<WorkingCapitalDashboard />} />
              <Route path="/admin/*" element={<AdminPortal />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppContent />
        </Router>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ClerkProvider>
  )
}

export default App