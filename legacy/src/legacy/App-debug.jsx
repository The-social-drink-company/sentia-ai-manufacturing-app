import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Simple debug component to test if React is working
const DebugDashboard = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '2rem' }}>ðŸ­ Sentia Debug Dashboard</h1>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
        <h2>System Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
            âœ… React: Working
          </div>
          <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
            âœ… Router: Active
          </div>
          <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
            âœ… Server: localhost:3010
          </div>
          <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
            âœ… Port: Available
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3>Navigation Test</h3>
        <p>Current URL: {window.location.href}</p>
        <p>Timestamp: {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}

function App() {
  // // // // // // // console.log('ðŸ­ Sentia Debug App Loading...')
  
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<DebugDashboard />} />
          <Route path="/dashboard" element={<DebugDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
