import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

function TestDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard Working!</h1>
      <p>If you can see this, the app is loading correctly.</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Quick Stats</h2>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <div style={{ padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
            <h3>Revenue</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>$125,000</p>
          </div>
          <div style={{ padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
            <h3>Orders</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>342</p>
          </div>
          <div style={{ padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
            <h3>Customers</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>1,234</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppMinimal() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#fff' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<TestDashboard />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default AppMinimal