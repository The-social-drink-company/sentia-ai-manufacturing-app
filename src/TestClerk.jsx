import React from 'react'
import { ClerkProvider, SignIn, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function TestClerk() {
  console.log('Clerk Key:', clerkPubKey ? 'Found' : 'Missing')
  
  if (!clerkPubKey) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Clerk Key Missing</h1>
        <p>VITE_CLERK_PUBLISHABLE_KEY is not configured</p>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Clerk Authentication Test</h1>
        
        <SignedOut>
          <h2>You are signed out</h2>
          <SignIn />
        </SignedOut>
        
        <SignedIn>
          <h2>You are signed in!</h2>
          <UserButton />
          <p>Dashboard would load here</p>
        </SignedIn>
      </div>
    </ClerkProvider>
  )
}

export default TestClerk