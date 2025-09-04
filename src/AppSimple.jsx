import React from 'react'

function AppSimple() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1f2937',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>
            Sentia Manufacturing Dashboard
          </h1>
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <a href="#dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</a>
            <a href="#working-capital" style={{ color: 'white', textDecoration: 'none' }}>Working Capital</a>
            <a href="#data-import" style={{ color: 'white', textDecoration: 'none' }}>Data Import</a>
            <a href="#sign-in" style={{ color: 'white', textDecoration: 'none' }}>Sign In</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Page Title */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Production Dashboard
            </h2>
            <p style={{ color: '#6b7280' }}>
              Real-time production metrics and KPIs
            </p>
          </div>

          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Production Efficiency
              </h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>98.5%</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                +2.3% from last month
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
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>1,234</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Today's production
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
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>45</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                In production queue
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
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>$2.3M</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                +12% from average
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              System Status
            </h3>
            
            <div style={{
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              padding: '1rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              <p style={{ color: '#166534', fontWeight: 'bold' }}>
                ✓ All Systems Operational
              </p>
              <p style={{ color: '#166534', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Application is running correctly on localhost:3000
              </p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Quick Actions</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>
                  View Reports
                </button>
                <button style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>
                  New Production Job
                </button>
                <button style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>
                  Import Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1f2937',
        color: '#9ca3af',
        padding: '2rem',
        marginTop: '4rem',
        textAlign: 'center'
      }}>
        <p>© 2024 Sentia Manufacturing Dashboard. All rights reserved.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Powered by React + Vite | Version 1.0.0
        </p>
      </footer>
    </div>
  )
}

export default AppSimple