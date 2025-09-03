import React from 'react'

function EnhancedDashboardSimple() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1>Enhanced Dashboard (Simple)</h1>
      <p>This is a simplified version of the Enhanced Dashboard to test component rendering.</p>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Dashboard Features</h2>
        <ul>
          <li>KPI Strip Widget</li>
          <li>Demand Forecast Widget</li>
          <li>Working Capital Components</li>
          <li>Grid Layout System</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Environment Check</h2>
        <p>VITE_CLERK_PUBLISHABLE_KEY: {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing'}</p>
        <p>NODE_ENV: {import.meta.env.NODE_ENV}</p>
      </div>
    </div>
  )
}

export default EnhancedDashboardSimple
