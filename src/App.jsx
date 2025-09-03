import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminPortal from './pages/AdminPortal'
import './App.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

// Helper component to conditionally render header
const ConditionalHeader = () => {
  const location = useLocation()
  const isEnhancedDashboard = location.pathname === '/' || location.pathname === '/dashboard'
  const isAdminPortal = location.pathname.startsWith('/admin')
  
  // Don't render the old header for enhanced dashboard or admin portal routes
  if (isEnhancedDashboard || isAdminPortal) {
    return null
  }
  
  return <Header />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <main>
            <Routes>
              <Route path="/" element={
                <div style={{ padding: '20px', backgroundColor: 'lightblue', color: 'black', minHeight: '100vh' }}>
                  <h1>🏠 HOME PAGE WORKS!</h1>
                  <p>This is the home page - routing is working</p>
                  <p>Try: /test and /admin</p>
                </div>
              } />
              <Route path="/test" element={
                <div style={{ padding: '20px', backgroundColor: 'lime', color: 'black', minHeight: '100vh' }}>
                  <h1>🧪 TEST ROUTE WORKS!</h1>
                  <p>This is /test route - if you see this, routing is working</p>
                </div>
              } />
              <Route path="/admin/*" element={<AdminPortal />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App