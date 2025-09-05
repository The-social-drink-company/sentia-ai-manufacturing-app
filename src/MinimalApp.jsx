import React from 'react'

function MinimalApp() {
  return (
    <div style={{
      padding: '50px',
      textAlign: 'center',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: 'green', fontSize: '48px' }}>
        REACT IS WORKING!
      </h1>
      <p style={{ fontSize: '24px', color: 'blue' }}>
        If you can see this text, React is rendering correctly.
      </p>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>
        Current time: {new Date().toLocaleTimeString()}
      </p>
      <button 
        onClick={() => alert('Button clicked!')}
        style={{
          padding: '10px 20px',
          fontSize: '18px',
          marginTop: '20px',
          cursor: 'pointer'
        }}
      >
        Click Me to Test Interactivity
      </button>
    </div>
  )
}

export default MinimalApp