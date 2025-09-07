import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

// Clerk configuration
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <div style={{ padding: '20px', backgroundColor: 'lightyellow', minHeight: '100vh', fontSize: '18px' }}>
        <h1 style={{ color: 'blue', fontSize: '24px' }}>CLERK TEST - NO CSS</h1>
        
        <SignedOut>
          <div style={{ padding: '20px', border: '2px solid red' }}>
            <h2>SIGNED OUT STATE</h2>
            <p>You are currently signed out.</p>
            <SignInButton>
              <button style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', fontSize: '16px' }}>
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>
        
        <SignedIn>
          <div style={{ padding: '20px', border: '2px solid green' }}>
            <h2>SIGNED IN STATE</h2>
            <p>You are successfully signed in!</p>
            <p>Clerk authentication is working.</p>
          </div>
        </SignedIn>
        
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'lightgray' }}>
          <p>Environment: {import.meta.env.MODE}</p>
          <p>Clerk Key: {clerkPubKey ? 'Present' : 'Missing'}</p>
          <p>Time: {new Date().toISOString()}</p>
        </div>
      </div>
    </ClerkProvider>
  );
}

export default App;