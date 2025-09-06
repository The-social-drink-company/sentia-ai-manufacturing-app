import React from 'react'
import './index.css'

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      color: 'white'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ fontSize: '3rem', margin: 0 }}>🚀 SENTIA Dashboard</h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9, margin: '1rem 0 0 0' }}>
          Manufacturing Intelligence Platform
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: '#1f2937'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>📊 Revenue</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#059669' }}>
            $125,430
          </div>
          <div style={{ color: '#059669', fontWeight: 500 }}>↗ +12% this month</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: '#1f2937'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>📦 Orders</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#059669' }}>
            1,329
          </div>
          <div style={{ color: '#059669', fontWeight: 500 }}>↗ +5% this week</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: '#1f2937'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>👥 Customers</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#059669' }}>
            892
          </div>
          <div style={{ color: '#059669', fontWeight: 500 }}>↗ +18% this month</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: '#1f2937'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>⚙ Status</h3>
          <div style={{ margin: '1rem 0' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              Production: <span style={{ color: '#10b981', fontWeight: 600 }}>Running</span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              Quality: <span style={{ color: '#10b981', fontWeight: 600 }}>Active</span>  
            </div>
            <div>
              Efficiency: <span style={{ color: '#10b981', fontWeight: 600 }}>94.2%</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '2rem',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '1rem'
      }}>
        <p style={{ margin: 0, opacity: 0.9 }}>
          ✅ Dashboard Operational • React: Working • Server: Active
        </p>
      </div>
    </div>
  )
}

export default App