import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider, SignIn, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import EnhancedDashboard from './pages/EnhancedDashboard'
import './index.css'

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

// Get Clerk key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function AppFixed() {
  // Check if Clerk key exists
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
          <h1>Configuration Error</h1>
          <p>VITE_CLERK_PUBLISHABLE_KEY is not configured</p>
          <p>Please add it to your .env file</p>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <QueryClientProvider client={queryClient}>
          <div style={{ minHeight: '100vh' }}>
            <SignedOut>
              <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2rem'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  maxWidth: '400px',
                  width: '100%'
                }}>
                  <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold', 
                      color: '#1f2937',
                      marginBottom: '0.5rem'
                    }}>
                      SENTIA Manufacturing
                    </h1>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '1rem',
                      marginBottom: '2rem'
                    }}>
                      Enterprise Manufacturing Intelligence Platform
                    </p>
                  </div>
                  
                  <SignIn 
                    afterSignInUrl="/dashboard"
                    signUpUrl="/sign-up"
                  />
                </div>
              </div>
            </SignedOut>
            
            <SignedIn>
              <div style={{
                position: 'fixed',
                top: '1rem',
                right: '1rem',
                zIndex: 1000
              }}>
                <UserButton />
              </div>
              
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<EnhancedDashboard />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </SignedIn>
          </div>
        </QueryClientProvider>
      </Router>
    </ClerkProvider>
  )
}

export default AppFixed