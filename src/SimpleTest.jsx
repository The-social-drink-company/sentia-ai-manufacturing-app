import React from 'react'

function SimpleTest() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Sentia Manufacturing Dashboard
      </h1>
      <p style={{ fontSize: '1.5rem', color: '#6b7280' }}>
        Application is loading correctly!
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <p>✅ Vite Server: Running on port 3000</p>
        <p>✅ React: Rendering successfully</p>
        <p>✅ Environment: Ready for authentication</p>
      </div>
    </div>
  )
}

export default SimpleTest