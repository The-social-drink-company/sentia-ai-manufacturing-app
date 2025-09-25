import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'blue' }}>SENTIA Manufacturing Dashboard</h1>
      <p>React is working! Environment: {import.meta.env.MODE}</p>
      <p>API URL: {import.meta.env.VITE_API_BASE_URL || 'Not set'}</p>
      <p>Clerk Key: {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Not set'}</p>
      <button onClick={() => alert('Button works!')}>Test Button</button>
    </div>
  )
}

export default App
