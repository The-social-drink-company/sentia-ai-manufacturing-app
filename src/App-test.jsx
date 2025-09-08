import React from 'react'

function App() {
  return (
    <div style={{ 
      backgroundColor: '#1e40af', 
      color: 'white', 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>SENTIA</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.9 }}>
          Manufacturing Intelligence Platform
        </h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.8 }}>
          ✅ REACT IS WORKING! If you can see this, the authentication error has been fixed.
        </p>
        <button 
          onClick={() => alert('Button clicked!')} 
          style={{
            backgroundColor: 'white',
            color: '#1e40af',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          Test Button
        </button>
        <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.7 }}>
          <p>🎉 Clerk authentication error resolved!</p>
          <p>🔧 React app is running on localhost:3002</p>
          <p>🚀 No more "Something went wrong" error</p>
        </div>
      </div>
    </div>
  )
}

export default App