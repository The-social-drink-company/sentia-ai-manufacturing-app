import { devLog } from '../lib/devLog.js';\nimport React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'

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

// Protected route - for now just pass through
function ProtectedRoute({ children }) {
  // Authentication disabled - allow all access
  return children
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
    devLog.error('App Error:', error, errorInfo);
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

// Main App Component - Demo Mode (No Authentication)
function App() {
  devLog.log('App rendering - Demo Mode Version')
  devLog.log('Environment:', import.meta.env.MODE)
  
  // Always run in demo mode for now
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
              
              {/* Working Capital - No auth required */}
              <Route path="/working-capital" element={
                <AppLayout>
                  <Suspense fallback={<Loading />}>
                    <WorkingCapitalDashboard />
                  </Suspense>
                </AppLayout>
              } />
              
              {/* Data Import - No auth required */}
              <Route path="/data-import" element={
                <AppLayout>
                  <Suspense fallback={<Loading />}>
                    <DataImport />
                  </Suspense>
                </AppLayout>
              } />
              
              {/* Templates - No auth required */}
              <Route path="/templates" element={
                <AppLayout>
                  <Suspense fallback={<Loading />}>
                    <Templates />
                  </Suspense>
                </AppLayout>
              } />
              
              {/* Admin Portal - No auth required */}
              <Route path="/admin/*" element={
                <AppLayout>
                  <Suspense fallback={<Loading />}>
                    <AdminPortal />
                  </Suspense>
                </AppLayout>
              } />
              
              {/* All other routes redirect to landing in demo mode */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
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