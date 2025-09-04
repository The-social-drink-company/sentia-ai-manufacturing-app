import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignIn, SignUp } from '@clerk/clerk-react'

// Get Clerk key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk'

// Simple Dashboard Component
function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <header style={{
        backgroundColor: '#1f2937',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ color: 'white', margin: 0 }}>Sentia Manufacturing Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/working-capital" style={{ color: 'white', textDecoration: 'none' }}>Working Capital</Link>
            <Link to="/data-import" style={{ color: 'white', textDecoration: 'none' }}>Data Import</Link>
          </nav>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      
      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Production Dashboard</h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Production Efficiency</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>98.5%</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Units Produced</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>1,234</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Jobs</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>45</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Revenue Today</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>$2.3M</p>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>System Status</h3>
            <div style={{ backgroundColor: '#dcfce7', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1rem' }}>
              <p style={{ color: '#166534' }}>✓ All systems operational</p>
            </div>
            <p style={{ color: '#6b7280' }}>
              Welcome to Sentia Manufacturing Dashboard. Use the navigation above to access different modules.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Landing Page Component
function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Sentia Manufacturing
      </h1>
      <p style={{ fontSize: '1.5rem', color: '#6b7280', marginBottom: '2rem' }}>
        Production Management System
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/sign-in" style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '0.75rem 2rem',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Sign In
        </Link>
        <Link to="/sign-up" style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '0.75rem 2rem',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Sign Up
        </Link>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  console.log('App rendering with Clerk key:', !!clerkPubKey)
  console.log('Environment:', import.meta.env.MODE)
  
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <>
              <SignedOut>
                <LandingPage />
              </SignedOut>
              <SignedIn>
                <Navigate to="/dashboard" replace />
              </SignedIn>
            </>
          } />
          
          {/* Authentication routes */}
          <Route path="/sign-in/*" element={
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
              backgroundColor: '#f3f4f6'
            }}>
              <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" afterSignInUrl="/dashboard" />
            </div>
          } />
          
          <Route path="/sign-up/*" element={
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
              backgroundColor: '#f3f4f6'
            }}>
              <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" afterSignUpUrl="/dashboard" />
            </div>
          } />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <SignedIn>
              <Dashboard />
            </SignedIn>
          } />
          
          <Route path="/working-capital" element={
            <SignedIn>
              <Dashboard />
            </SignedIn>
          } />
          
          <Route path="/data-import" element={
            <SignedIn>
              <Dashboard />
            </SignedIn>
          } />
          
          {/* Redirect unauthenticated users */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <SignedOut>
          <Routes>
            <Route path="/dashboard" element={<Navigate to="/sign-in" replace />} />
            <Route path="/working-capital" element={<Navigate to="/sign-in" replace />} />
            <Route path="/data-import" element={<Navigate to="/sign-in" replace />} />
          </Routes>
        </SignedOut>
      </Router>
    </ClerkProvider>
  )
}

export default App