import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import LandingPage from './pages/LandingPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import './App.css'

function App() {
  const { isSignedIn } = useAuth()
  
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
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App