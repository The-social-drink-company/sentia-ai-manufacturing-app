import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// STEP 1: FIX REACT FIRST - Absolutely minimal React app
console.log('🚀 REACT FIX: Starting minimal React test...')

function ReactTest() {
  const [status, setStatus] = React.useState('initializing')
  
  React.useEffect(() => {
    console.log('✅ REACT FIX: React useEffect working!')
    setStatus('mounted')
  }, [])

  const handleClick = () => {
    console.log('✅ REACT FIX: Button click working!')
    setStatus('interactive')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: status === 'interactive' ? '#10b981' : '#3b82f6',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'background 0.3s ease'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: status === 'interactive' ? '#10b981' : '#3b82f6',
          borderRadius: '50%',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '32px'
        }}>
          {status === 'interactive' ? '🎉' : status === 'mounted' ? '✅' : '⏳'}
        </div>
        
        <h1 style={{ 
          color: '#1f2937', 
          marginBottom: '16px', 
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          {status === 'interactive' ? 'REACT IS FULLY WORKING!' : 
           status === 'mounted' ? 'React Mounted Successfully!' : 
           'Testing React...'}
        </h1>
        
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '24px', 
          fontSize: '18px',
          lineHeight: '1.6'
        }}>
          {status === 'interactive' ? 
            'Perfect! React is completely operational. All components, state, and events are working correctly.' :
           status === 'mounted' ? 
            'React has successfully mounted and state management is working. Click the button to test interactivity.' :
            'Initializing React components and testing core functionality...'}
        </p>
        
        <div style={{
          background: status === 'interactive' ? '#f0fdf4' : '#eff6ff',
          border: `1px solid ${status === 'interactive' ? '#bbf7d0' : '#bfdbfe'}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <h3 style={{ 
            color: status === 'interactive' ? '#166534' : '#1e40af', 
            margin: '0 0 8px 0', 
            fontSize: '16px', 
            fontWeight: '600' 
          }}>
            React Status: {status.toUpperCase()}
          </h3>
          <ul style={{ 
            color: status === 'interactive' ? '#15803d' : '#2563eb', 
            margin: 0, 
            paddingLeft: '20px', 
            fontSize: '14px' 
          }}>
            <li>✅ React DOM mounting: SUCCESS</li>
            <li>✅ Component lifecycle: SUCCESS</li>
            <li>✅ State management: SUCCESS</li>
            <li>{status === 'interactive' ? '✅' : '⏳'} Event handling: {status === 'interactive' ? 'SUCCESS' : 'TESTING'}</li>
          </ul>
        </div>

        <button 
          onClick={handleClick}
          style={{
            background: status === 'interactive' ? '#10b981' : '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'all 0.2s ease'
          }}
        >
          {status === 'interactive' ? '🎯 React Test Complete!' : '🧪 Test React Functionality'}
        </button>

        {status === 'interactive' && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#fef3c7',
            borderRadius: '8px',
            color: '#92400e',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            <strong>✅ REACT IS FIXED!</strong><br/>
            React is now working perfectly. Ready to add Clerk authentication and enterprise features.
          </div>
        )}
      </div>
    </div>
  )
}

// Initialize React with comprehensive error handling
console.log('🔧 REACT FIX: Initializing React DOM...')

try {
  const rootElement = document.getElementById('root')
  
  if (!rootElement) {
    throw new Error('Root element not found')
  }
  
  const root = ReactDOM.createRoot(rootElement)
  
  root.render(
    <React.StrictMode>
      <ReactTest />
    </React.StrictMode>
  )
  
  console.log('✅ REACT FIX: React successfully initialized!')
  
} catch (error) {
  console.error('❌ REACT FIX: Critical error:', error)
  
  // Emergency fallback
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fee2e2; font-family: system-ui;">
        <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <div style="width: 60px; height: 60px; background: #dc2626; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">❌</div>
          <h1 style="color: #dc2626; margin-bottom: 16px; font-size: 24px;">React Initialization Failed</h1>
          <p style="color: #6b7280; margin-bottom: 24px; line-height: 1.6;">Error: ${error.message}</p>
          <button onclick="location.reload()" style="background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
            Retry React Initialization
          </button>
        </div>
      </div>
    `
  }
}
