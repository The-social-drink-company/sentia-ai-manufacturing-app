import React from 'react'

function SimpleApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Sentia Manufacturing Dashboard</h1>
      <p>Testing - App is loading correctly</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard" style={{ marginRight: '10px', padding: '10px', background: '#4F46E5', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Dashboard
        </a>
        <a href="/working-capital" style={{ marginRight: '10px', padding: '10px', background: '#10B981', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Working Capital
        </a>
        <a href="/admin" style={{ padding: '10px', background: '#F59E0B', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Admin
        </a>
      </div>
    </div>
  )
}

export default SimpleApp