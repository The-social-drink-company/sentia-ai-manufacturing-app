import React from 'react'

function SimpleTest() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1>Simple Test</h1>
      <p>This is a simple test component to verify React is working.</p>
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Environment Check</h2>
        <p>VITE_CLERK_PUBLISHABLE_KEY: {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing'}</p>
        <p>NODE_ENV: {import.meta.env.NODE_ENV}</p>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server-side rendering'}</p>
      </div>
    </div>
  )
}

export default SimpleTest
