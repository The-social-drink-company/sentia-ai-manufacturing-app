import React from 'react';

function App() {
  console.log('[DEBUG] App component rendering...');
  console.log('[DEBUG] Environment:', import.meta.env.MODE);
  console.log('[DEBUG] Clerk Key:', import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  try {
    // Test Clerk import - ES modules
    console.log('[DEBUG] Attempting to import Clerk...');
    console.log('[DEBUG] Clerk import successful');

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

    console.log('[DEBUG] Creating ClerkProvider...');
    return (
      <div style={{ padding: '20px', backgroundColor: 'lightgreen', minHeight: '100vh' }}>
        <h1>CLERK DEBUG TEST</h1>
        <p>If you see this, the issue is deeper in Clerk...</p>
        <p>Check browser console for detailed error messages.</p>
      </div>
    );

  } catch (error) {
    console.error('[ERROR] Clerk import failed:', error);
    return (
      <div style={{ padding: '20px', backgroundColor: 'red', color: 'white', fontSize: '20px' }}>
        <h1>ERROR: Clerk Import Failed</h1>
        <p>Error: {error.message}</p>
        <p>Stack: {error.stack}</p>
      </div>
    );
  }
}

export default App;