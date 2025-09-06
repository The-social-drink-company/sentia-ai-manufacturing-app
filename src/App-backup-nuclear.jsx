import React, { Suspense, lazy, Component } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './context/AuthContext'
import ClerkProviderWithFallback from './components/auth/ClerkProviderWithFallback'
import SimpleAuth from './components/auth/SimpleAuth'
import clerkConfig from './services/auth/clerkConfig'
import './index.css'
import './styles/ui-fixes.css'

// Emergency Error Boundary for debugging
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary Caught:', error, errorInfo);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          background: '#ff0000', 
          color: 'white',
          fontFamily: 'monospace',
          minHeight: '100vh'
        }}>
          <h1>🚨 React Error Caught!</h1>
          <p>Error: {this.state.error?.message}</p>
          <details>
            <summary>Click for full error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Initialize Clerk configuration
if (typeof window !== 'undefined') {
  window.clerkConfig = clerkConfig;
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

// Import AI Enhanced Dashboard as the main dashboard

// Lazy load other pages
const WorkingCapitalDashboard = lazy(() => import('./pages/WorkingCapitalDashboard'))
const AdminPortal = lazy(() => import('./pages/AdminPortal'))
const DataImport = lazy(() => import('./pages/DataImport'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AIDashboard = lazy(() => import('./pages/AIDashboard'))
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'))

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
  console.log('🚀 App component rendering - START');
  console.log('Environment mode:', import.meta.env.MODE);
  console.log('Clerk pubkey:', clerkPubKey ? 'Present' : 'Missing');
  console.log('Current URL:', window.location.href);
  
  // Emergency Debug Mode - Shows immediately if React is working
  const showDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true' || window.location.search.includes('debug=true');
  
  if (showDebugMode) {
    console.log('🛠️ Emergency Debug Mode Activated');
    return (
      <div style={{ 
        padding: '20px', 
        background: '#00ff00', 
        color: 'black',
        minHeight: '100vh'
      }}>
        <h1>🛠️ EMERGENCY DEBUG MODE</h1>
        <p><strong>React is working!</strong></p>
        <p>Environment: {import.meta.env.MODE}</p>
        <p>Base URL: {import.meta.env.BASE_URL}</p>
        <p>Time: {new Date().toISOString()}</p>
        <h2>Navigation Test</h2>
        <button onClick={() => window.location.href = '/?debug=false'}>Exit Debug Mode</button>
        <h2>Console Logs</h2>
        <p>Check browser console for detailed logs</p>
      </div>
    );
  }

  if (!clerkPubKey) {
    console.log('❌ No Clerk publishable key found');
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

  console.log('✅ App component rendering normally');
  
  return (
    <ErrorBoundary>
    <ClerkProviderWithFallback>
      <AuthProvider>
        <Router>
          <QueryClientProvider client={queryClient}>
            <SimpleAuth>
              <div style={{ minHeight: '100vh' }}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  <Route
                    path="/dashboard"
                    element={<AIEnhancedDashboard />}
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
                    path="/enhanced"
                    element={
                      <Suspense fallback={<Loading />}>
                        <EnhancedDashboard />
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
    </ClerkProviderWithFallback>
    </ErrorBoundary>
  )
}

export default App