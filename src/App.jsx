import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ClerkProvider, SignIn, SignUp, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Clerk is mandatory for authentication
if (!clerkPubKey) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is required. Please configure Clerk authentication.')
}

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

// Lazy load pages for better performance
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'))
const WorkingCapitalDashboard = lazy(() => import('./pages/WorkingCapitalDashboard'))
const AdminPortal = lazy(() => import('./pages/AdminPortal'))
const DataImport = lazy(() => import('./pages/DataImport'))
const LandingPage = lazy(() => import('./pages/LandingPage'))

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

// Simple HomePage component for landing
function HomePage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', color: '#333', marginBottom: '2rem' }}>
        SENTIA Manufacturing Dashboard
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>
        Enterprise Manufacturing Intelligence Platform
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <a href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '2rem', backgroundColor: '#4F46E5', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            <h2>Dashboard</h2>
            <p>View real-time KPIs and metrics</p>
          </div>
        </a>
        
        <a href="/working-capital" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '2rem', backgroundColor: '#10B981', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            <h2>Working Capital</h2>
            <p>Financial management and projections</p>
          </div>
        </a>
        
        <a href="/admin" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '2rem', backgroundColor: '#F59E0B', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            <h2>Admin Portal</h2>
            <p>System configuration and management</p>
          </div>
        </a>
      </div>
    </div>
  )
}

// Navigation wrapper for Clerk
function ClerkWithRouter({ children }) {
  const navigate = useNavigate()
  
  return (
    <ClerkProvider publishableKey={clerkPubKey} navigate={(to) => navigate(to)}>
      {children}
    </ClerkProvider>
  )
}

// Route component that requires authentication
function ProtectedRoute({ children }) {
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

// Main App component with conditional Clerk integration
function App() {
  return (
    <Router>
      <ClerkWithRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <div style={{ minHeight: '100vh' }}>
              <Routes>
                {/* Authentication routes */}
                <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
                <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
                
                {/* Protected landing page */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Protected routes - conditionally protected */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<Loading />}>
                        <EnhancedDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/working-capital"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<Loading />}>
                        <WorkingCapitalDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<Loading />}>
                        <AdminPortal />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/data-import"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<Loading />}>
                        <DataImport />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                
                {/* Catch-all route - redirect to sign in */}
                <Route
                  path="*"
                  element={
                    <>
                      <SignedIn>
                        <Navigate to="/dashboard" replace />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
              </Routes>
            </div>
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ClerkWithRouter>
    </Router>
  )
}

export default App