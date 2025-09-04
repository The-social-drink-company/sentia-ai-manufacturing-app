import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Lazy load pages for better performance
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'))
const WorkingCapitalDashboard = lazy(() => import('./pages/WorkingCapitalDashboard'))
const AdminPortal = lazy(() => import('./pages/AdminPortal'))
const DataImport = lazy(() => import('./pages/DataImport'))
const Templates = lazy(() => import('./pages/Templates'))

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

// Header component
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
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</a>
        <a href="/working-capital" style={{ color: 'white', textDecoration: 'none' }}>Working Capital</a>
        <a href="/data-import" style={{ color: 'white', textDecoration: 'none' }}>Data Import</a>
        <a href="/admin" style={{ color: 'white', textDecoration: 'none' }}>Admin</a>
      </nav>
    </header>
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
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="/dashboard" style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '0.75rem 2rem',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Go to Dashboard
        </a>
        <a href="/working-capital" style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '0.75rem 2rem',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Working Capital
        </a>
        <a href="/data-import" style={{
          backgroundColor: '#f59e0b',
          color: 'white',
          padding: '0.75rem 2rem',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Data Import
        </a>
        <a href="/admin" style={{
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '0.75rem 2rem',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Admin Portal
        </a>
      </div>
      <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>System Features:</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
          <li>Real-time Production Monitoring</li>
          <li>Working Capital Analytics</li>
          <li>Data Import & Export</li>
          <li>Advanced Reporting</li>
          <li>Full Dashboard Suite</li>
        </ul>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  console.log('App rendering - Full featured version')
  
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Dashboard route */}
          <Route path="/dashboard" element={
            <>
              <Header />
              <Suspense fallback={<Loading />}>
                <EnhancedDashboard />
              </Suspense>
            </>
          } />
          
          {/* Working Capital route */}
          <Route path="/working-capital" element={
            <>
              <Header />
              <Suspense fallback={<Loading />}>
                <WorkingCapitalDashboard />
              </Suspense>
            </>
          } />
          
          {/* Data Import route */}
          <Route path="/data-import" element={
            <>
              <Header />
              <Suspense fallback={<Loading />}>
                <DataImport />
              </Suspense>
            </>
          } />
          
          {/* Templates route */}
          <Route path="/templates" element={
            <>
              <Header />
              <Suspense fallback={<Loading />}>
                <Templates />
              </Suspense>
            </>
          } />
          
          {/* Admin route */}
          <Route path="/admin/*" element={
            <>
              <Header />
              <Suspense fallback={<Loading />}>
                <AdminPortal />
              </Suspense>
            </>
          } />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App