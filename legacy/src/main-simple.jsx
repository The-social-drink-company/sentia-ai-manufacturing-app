import React from 'react'
import ReactDOM from 'react-dom/client'

// Simple test app to diagnose blank screen issue
function SimpleApp() {
  return (
    <div style={{
      padding: '40px',
      fontFamily: 'sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{color: '#333'}}>Sentia Manufacturing Dashboard</h1>
        <div style={{
          padding: '20px',
          background: '#d4edda',
          color: '#155724',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          âœ“ React is working! The app has mounted successfully.
        </div>
        <p>This is a minimal React app to test if the production build works.</p>
        <div style={{marginTop: '20px'}}>
          <button 
            onClick={() => alert('Button works!')}
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Test Button
          </button>
        </div>
        <div style={{marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px'}}>
          <strong>Debug Info:</strong><br/>
          React Version: {React.version}<br/>
          Environment: {import.meta.env.MODE}<br/>
          Base URL: {import.meta.env.BASE_URL}
        </div>
      </div>
    </div>
  )
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<SimpleApp />)

console.log('Simple React app mounted successfully')
