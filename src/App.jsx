import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './context/AuthContext'
import { ClerkProvider } from '@clerk/clerk-react'
import SimpleAuth from './components/auth/SimpleAuth'
import './index.css'
import './styles/ui-fixes.css'

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
const AIDashboard = lazy(() => import('./pages/AIDashboard'))
const AIEnhancedDashboard = lazy(() => import('./pages/AIEnhancedDashboard'))

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

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk'

// Main App component with Clerk authentication
function App() {
  if (!clerkPubKey) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <h1>Authentication Configuration Required</h1>
          <p>Please configure VITE_CLERK_PUBLISHABLE_KEY in your environment variables.</p>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthProvider>
        <Router>
          <QueryClientProvider client={queryClient}>
            <SimpleAuth>
              <div style={{ minHeight: '100vh' }}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  <Route
                    path="/dashboard"
                    element={
                      <Suspense fallback={<Loading />}>
                        <EnhancedDashboard />
                      </Suspense>
                    }
                  />
                  
                  <Route
                    path="/working-capital"
                    element={
                      <Suspense fallback={<Loading />}>
                        <WorkingCapitalDashboard />
                      </Suspense>
                    }
                  />
                  
                  <Route
                    path="/admin/*"
                    element={
                      <Suspense fallback={<Loading />}>
                        <AdminPortal />
                      </Suspense>
                    }
                  />
                  
                  <Route
                    path="/data-import"
                    element={
                      <Suspense fallback={<Loading />}>
                        <DataImport />
                      </Suspense>
                    }
                  />
                  
                  <Route
                    path="/ai-dashboard"
                    element={
                      <Suspense fallback={<Loading />}>
                        <AIDashboard />
                      </Suspense>
                    }
                  />
                  
                  <Route
                    path="/ai-enhanced"
                    element={
                      <Suspense fallback={<Loading />}>
                        <AIEnhancedDashboard />
                      </Suspense>
                    }
                  />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
              <ReactQueryDevtools initialIsOpen={false} />
            </SimpleAuth>
          </QueryClientProvider>
        </Router>
      </AuthProvider>
    </ClerkProvider>
  )
}

export default App