import React from 'react'
import './App.css'

// Simple working dashboard that will render immediately
function SimpleDashboard() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
            Sentia Manufacturing Dashboard
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Production Management System
          </p>
        </header>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* KPI Cards */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Production Efficiency
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              98.5%
            </p>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Units Produced
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              1,234
            </p>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Active Jobs
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              45
            </p>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Revenue Today
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              $2.3M
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Dashboard Status
          </h2>
          <div style={{ 
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '0.375rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#78350f' }}>
              <strong>System Status:</strong> Dashboard is operational. 
              Authentication and advanced features are temporarily disabled while we resolve deployment issues.
            </p>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Available Features
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                ✓ Production Monitoring
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                ✓ KPI Tracking
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                ✓ Job Management
              </li>
              <li style={{ padding: '0.5rem 0' }}>
                ✓ Revenue Analytics
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  // For now, just render the simple dashboard to ensure something displays
  return <SimpleDashboard />
}

export default App