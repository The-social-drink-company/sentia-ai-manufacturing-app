import React from 'react'
// Simple authentication wrapper that shows dashboard when signed in
function SimpleAuth({ children }) {
  return (
    <>
      <SignedOut>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: '#1f2937',
                marginBottom: '0.5rem'
              }}>
                SENTIA Manufacturing
              </h1>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '1rem',
                marginBottom: '2rem'
              }}>
                Enterprise Manufacturing Intelligence Platform
              </p>
            </div>
            
            <SignIn 
              afterSignInUrl="/dashboard"
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600',
                  card: 'shadow-none',
                  headerTitle: 'text-xl font-bold',
                  headerSubtitle: 'text-gray-600'
                }
              }}
            />
            
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                Demo Access Features:
              </h3>
              <ul style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                textAlign: 'left',
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '0.25rem' }}>âœ“ Real-time production pipeline tracking</li>
                <li style={{ marginBottom: '0.25rem' }}>âœ“ Multi-channel sales analytics (Amazon, Shopify)</li>
                <li style={{ marginBottom: '0.25rem' }}>âœ“ AI-powered demand forecasting</li>
                <li style={{ marginBottom: '0.25rem' }}>âœ“ Unleashed ERP & Xero integration</li>
                <li>âœ“ MCP vector database insights</li>
              </ul>
            </div>
          </div>
        </div>
      </SignedOut>
      
      <SignedIn>
        {children}
      </SignedIn>
    </>
  )
}

export default SimpleAuth
