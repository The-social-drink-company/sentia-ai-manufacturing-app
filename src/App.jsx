import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import LandingPage from './pages/LandingPage'
import WorkingCapitalDashboard from './pages/WorkingCapitalDashboard'
import ProtectedRoute from './components/auth/ProtectedRoute'
import './App.css'

function App() {
  // Check if Clerk is available before using hooks
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  let isSignedIn = false;
  
  if (PUBLISHABLE_KEY) {
    try {
      const auth = useAuth();
      isSignedIn = auth.isSignedIn;
    } catch (error) {
      console.warn('Clerk authentication not available:', error.message);
    }
  }
  
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={
              isSignedIn ? (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              ) : (
                <LandingPage />
              )
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/working-capital" element={
              <ProtectedRoute requireRole={['admin', 'cfo', 'financial_manager', 'financial_analyst']}>
                <WorkingCapitalDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App