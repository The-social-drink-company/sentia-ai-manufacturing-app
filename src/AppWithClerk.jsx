import { devLog } from './lib/devLog.js';
import React from 'react'
import { ClerkProvider, SignIn, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function AppWithClerk() {
  devLog.log('Clerk Publishable Key:', clerkPubKey ? 'Found' : 'Missing')
  
  // First check if Clerk key exists
  if (!clerkPubKey) {
    return (
      <div style={{
        padding: '50px',
        textAlign: 'center',
        backgroundColor: '#ff6b6b',
        color: 'white',
        minHeight: '100vh'
      }}>
        <h1>Configuration Error</h1>
        <p>VITE_CLERK_PUBLISHABLE_KEY is missing from .env file</p>
        <p>Current value: {clerkPubKey || 'undefined'}</p>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <SignedOut>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              textAlign: 'center',
              maxWidth: '400px',
              width: '100%'
            }}>
              <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>
                SENTIA Manufacturing
              </h1>
              <p style={{ color: '#6b7280', marginBottom: '30px' }}>
                Sign in to access the dashboard
              </p>
              <SignIn 
                afterSignInUrl="/dashboard"
                routing="path"
                path="/sign-in"
              />
            </div>
          </div>
        </SignedOut>
        
        <SignedIn>
          <div style={{ padding: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h1>Welcome to SENTIA Dashboard!</h1>
              <UserButton />
            </div>
            
            <div style={{
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ color: 'green', marginBottom: '20px' }}>
                Authentication Successful!
              </h2>
              <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                You are now signed in and can access the dashboard.
              </p>
              <p style={{ color: '#666' }}>
                Next step: Load the full Enhanced Dashboard component here
              </p>
            </div>
          </div>
        </SignedIn>
      </div>
    </ClerkProvider>
  )
}

export default AppWithClerk