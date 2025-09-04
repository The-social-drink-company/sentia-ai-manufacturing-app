import React from 'react'

const TestPage = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      backgroundColor: '#ff0000',
      minHeight: '100vh',
      fontSize: '2rem',
      border: '10px solid #000000'
    }}>
      <h1 style={{ 
        color: '#ffffff', 
        fontSize: '4rem', 
        marginBottom: '1rem',
        textShadow: '2px 2px 4px #000000',
        backgroundColor: '#000000',
        padding: '1rem'
      }}>
        🚨 TEST PAGE - WORKING! 🚨
      </h1>
      <p style={{ color: '#333' }}>
        If you can see this, React is rendering correctly.
      </p>
      <p style={{ color: '#666', marginTop: '1rem' }}>
        Current time: {new Date().toLocaleString()}
      </p>
      <div style={{
        backgroundColor: '#f0f8ff',
        border: '2px solid #007bff',
        padding: '1rem',
        marginTop: '2rem',
        borderRadius: '8px'
      }}>
        <h2 style={{ color: '#007bff' }}>System Check</h2>
        <ul style={{ color: '#333' }}>
          <li>✅ React rendering</li>
          <li>✅ Component loading</li>
          <li>✅ Styles applying</li>
          <li>✅ JavaScript execution</li>
        </ul>
      </div>
    </div>
  )
}

export default TestPage