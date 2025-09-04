import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Create QueryClient instance for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Lazy load ALL pages for better performance
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'))
const WorkingCapitalDashboard = lazy(() => import('./pages/WorkingCapitalDashboard'))
const AdminPortal = lazy(() => import('./pages/AdminPortal'))
const DataImport = lazy(() => import('./pages/DataImport'))
const Templates = lazy(() => import('./pages/Templates'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const LandingPage = lazy(() => import('./pages/LandingPage'))

// Import layout components
const Header = lazy(() => import('./components/layout/Header'))
const Sidebar = lazy(() => import('./components/layout/Sidebar'))

// Loading component with enhanced UI
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
        marginTop: '1rem', 
        color: 'white', 
        fontSize: '1.25rem',
        fontWeight: '500'
      }}>
        Loading Sentia Manufacturing Dashboard...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Main App Layout Component
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Suspense fallback={<div />}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </Suspense>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<div />}>
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        </Suspense>
        <main style={{ 
          flex: 1, 
          overflowY: 'auto',
          backgroundColor: '#f5f5f5',
          padding: '1rem'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}

// Protected Route Component
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

// Error Boundary Component for better error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Application Error</h1>
          <p>The application encountered an error. Please check the console for details.</p>
          <details style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
            <summary>Error Details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App Component with FULL functionality and Clerk Authentication
function App() {
  console.log('App rendering - FULL FEATURED VERSION with 100% functionality + Clerk Auth')
  console.log('Clerk key available:', !!clerkPubKey)
  console.log('Environment:', import.meta.env.MODE)
  console.log('All env vars:', Object.keys(import.meta.env))
  
  // If no Clerk key, show demo mode
  if (!clerkPubKey || clerkPubKey === 'undefined' || clerkPubKey === 'null') {
    console.warn('No Clerk publishable key found - running in demo mode')
    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <div style={{ minHeight: '100vh' }}>
            <Routes>
              {/* Landing page - Always accessible */}
              <Route path="/" element={
                <Suspense fallback={<Loading />}>
                  <LandingPage />
                </Suspense>
              } />
              
              {/* Demo Dashboard - No auth required */}
              <Route path="/dashboard" element={
                <AppLayout>
                  <Suspense fallback={<Loading />}>
                    <EnhancedDashboard />
                  </Suspense>
                </AppLayout>
              } />
              
              {/* All other routes redirect to dashboard in demo mode */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    )
  }
  
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div style={{ minHeight: '100vh' }}>
            <Routes>
              {/* Landing page - Always accessible */}
              <Route path="/" element={
                <Suspense fallback={<Loading />}>
                  <LandingPage />
                </Suspense>
              } />
              
              {/* Enhanced Dashboard with ALL features - Protected */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<Loading />}>
                      <EnhancedDashboard />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* Basic Dashboard (fallback) - Protected */}
              <Route path="/dashboard/basic" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<Loading />}>
                      <Dashboard />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* Working Capital with full features - Protected */}
              <Route path="/working-capital" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<Loading />}>
                      <WorkingCapitalDashboard />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* Data Import with all components - Protected */}
              <Route path="/data-import" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<Loading />}>
                      <DataImport />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* Templates - Protected */}
              <Route path="/templates" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<Loading />}>
                      <Templates />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* Admin Portal with all pages - Protected */}
              <Route path="/admin/*" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<Loading />}>
                      <AdminPortal />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* Public API test endpoint */}
              <Route path="/api/test" element={
                <div style={{ padding: '2rem' }}>
                  <h1>API Endpoints Active</h1>
                  <ul>
                    <li>/api/forecasting - Forecasting service</li>
                    <li>/api/optimization - Optimization service</li>
                    <li>/api/working-capital - Working capital calculations</li>
                    <li>/api/data-import - Data import processing</li>
                  </ul>
                </div>
              } />
              
              {/* Catch all - redirect to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
        
        {/* React Query Devtools for debugging */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ClerkProvider>
  )
}

// Export wrapped with ErrorBoundary
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}