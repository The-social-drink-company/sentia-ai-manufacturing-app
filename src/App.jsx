import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignIn, SignUp } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './App.css'

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'))
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'))
const WorkingCapitalDashboard = lazy(() => import('./pages/WorkingCapitalDashboard'))
const AdminPortal = lazy(() => import('./pages/AdminPortal'))
const DataImport = lazy(() => import('./pages/DataImport'))
const Templates = lazy(() => import('./pages/Templates'))

// Import components
import ProtectedRoute from './components/auth/ProtectedRoute'

// Get Clerk key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk'

// Create a query client
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

// Loading component
function Loading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.5rem',
      color: '#666'
    }}>
      Loading...
    </div>
  )
}

// Sign in page component
function SignInPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6'
    }}>
      <SignIn 
        routing="path" 
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
      />
    </div>
  )
}

// Sign up page component
function SignUpPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6'
    }}>
      <SignUp 
        routing="path" 
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
      />
    </div>
  )
}

// Header component with user button
function Header() {
  return (
    <header style={{
      backgroundColor: '#1f2937',
      padding: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>
        Sentia Manufacturing Dashboard
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <a href="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</a>
          <a href="/working-capital" style={{ color: 'white', textDecoration: 'none' }}>Working Capital</a>
          <a href="/data-import" style={{ color: 'white', textDecoration: 'none' }}>Data Import</a>
          <a href="/admin" style={{ color: 'white', textDecoration: 'none' }}>Admin</a>
        </nav>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  )
}

// Main App component
function App() {
  console.log('App rendering with Clerk key:', !!clerkPubKey)

  // If no Clerk key, show error
  if (!clerkPubKey || clerkPubKey === 'pk_test_your-clerk-publishable-key-here') {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: '#fef2f2',
        minHeight: '100vh'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ color: '#dc2626' }}>Configuration Required</h1>
          <p>The application requires Clerk authentication to be configured.</p>
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '1rem',
            borderRadius: '4px',
            marginTop: '1rem'
          }}>
            <h3>To fix this:</h3>
            <ol>
              <li>Add VITE_CLERK_PUBLISHABLE_KEY to your environment variables</li>
              <li>For Railway: Add the variable in the Railway dashboard</li>
              <li>For local: Update your .env file</li>
            </ol>
            <p style={{ marginTop: '1rem' }}>
              <strong>Required value:</strong><br/>
              VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={
                <>
                  <SignedOut>
                    <Suspense fallback={<Loading />}>
                      <LandingPage />
                    </Suspense>
                  </SignedOut>
                  <SignedIn>
                    <Navigate to="/dashboard" replace />
                  </SignedIn>
                </>
              } />

              {/* Authentication routes */}
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />

              {/* Protected routes - require authentication */}
              <Route path="/dashboard" element={
                <SignedIn>
                  <>
                    <Header />
                    <Suspense fallback={<Loading />}>
                      <EnhancedDashboard />
                    </Suspense>
                  </>
                </SignedIn>
              } />

              <Route path="/working-capital" element={
                <SignedIn>
                  <>
                    <Header />
                    <Suspense fallback={<Loading />}>
                      <WorkingCapitalDashboard />
                    </Suspense>
                  </>
                </SignedIn>
              } />

              <Route path="/data-import" element={
                <SignedIn>
                  <>
                    <Header />
                    <Suspense fallback={<Loading />}>
                      <DataImport />
                    </Suspense>
                  </>
                </SignedIn>
              } />

              <Route path="/templates" element={
                <SignedIn>
                  <>
                    <Header />
                    <Suspense fallback={<Loading />}>
                      <Templates />
                    </Suspense>
                  </>
                </SignedIn>
              } />

              <Route path="/admin/*" element={
                <SignedIn>
                  <>
                    <Header />
                    <Suspense fallback={<Loading />}>
                      <AdminPortal />
                    </Suspense>
                  </>
                </SignedIn>
              } />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Show sign in prompt when not authenticated */}
            <SignedOut>
              <Routes>
                <Route path="/dashboard" element={<Navigate to="/sign-in" replace />} />
                <Route path="/working-capital" element={<Navigate to="/sign-in" replace />} />
                <Route path="/data-import" element={<Navigate to="/sign-in" replace />} />
                <Route path="/admin/*" element={<Navigate to="/sign-in" replace />} />
              </Routes>
            </SignedOut>
          </div>
        </Router>
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ClerkProvider>
  )
}

export default App