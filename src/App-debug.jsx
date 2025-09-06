import { devLog } from './lib/devLog.js';\nimport React from 'react'

function App() {
  devLog.log('App component is rendering')
  devLog.log('Clerk key:', import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'black' }}>DEBUG: App is Rendering</h1>
      <p style={{ color: 'black' }}>If you can see this, React is working!</p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', border: '2px solid blue' }}>
        <h2 style={{ color: 'black' }}>Environment Variables:</h2>
        <pre style={{ color: 'black' }}>{JSON.stringify(import.meta.env, null, 2)}</pre>
      </div>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', border: '2px solid green' }}>
        <h2 style={{ color: 'black' }}>Test Components:</h2>
        <button onClick={() => alert('Button works!')}>Click Me</button>
      </div>
    </div>
  )
}

export default App