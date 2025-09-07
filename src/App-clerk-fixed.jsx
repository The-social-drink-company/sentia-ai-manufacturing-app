import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

function App() {
  console.log('[DEBUG] App component rendering...');
  console.log('[DEBUG] Environment:', import.meta.env.MODE);
  console.log('[DEBUG] Clerk Key:', import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  console.log('[DEBUG] Clerk publishable key:', clerkPubKey ? 'Present' : 'Missing');

  if (!clerkPubKey) {
    console.error('[ERROR] Missing VITE_CLERK_PUBLISHABLE_KEY');
    return (
      <div style={{ padding: '20px', backgroundColor: 'red', color: 'white', fontSize: '20px' }}>
        <h1>ERROR: Missing Clerk Key</h1>
        <p>VITE_CLERK_PUBLISHABLE_KEY is not set</p>
      </div>
    );
  }

  console.log('[DEBUG] Creating ClerkProvider with key:', clerkPubKey.substring(0, 20) + '...');

  try {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        <div style={{ padding: '20px', backgroundColor: 'lightgreen', minHeight: '100vh' }}>
          <h1>CLERK WORKING!</h1>
          <p>ClerkProvider created successfully</p>
          
          <SignedOut>
            <div style={{ padding: '20px', border: '2px solid blue', margin: '10px' }}>
              <h2>SIGNED OUT</h2>
              <SignInButton>
                <button style={{ padding: '10px', backgroundColor: 'blue', color: 'white' }}>
                  Sign In
                </button>
              </SignInButton>
            </div>
          </SignedOut>
          
          <SignedIn>
            <div style={{ padding: '20px', border: '2px solid green', margin: '10px' }}>
              <h2>SIGNED IN</h2>
              <p>Authentication successful!</p>
            </div>
          </SignedIn>
        </div>
      </ClerkProvider>
    );
  } catch (error) {
    console.error('[ERROR] ClerkProvider failed:', error);
    return (
      <div style={{ padding: '20px', backgroundColor: 'orange', color: 'black', fontSize: '18px' }}>
        <h1>CLERK PROVIDER ERROR</h1>
        <p>Error: {error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }
}

export default App;