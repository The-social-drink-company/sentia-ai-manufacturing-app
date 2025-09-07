import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import EnhancedDashboardSimple from './pages/EnhancedDashboardSimple';

// Clerk configuration
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  if (!clerkPubKey) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Missing Clerk Key</h1>
        <EnhancedDashboardSimple />
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <SignedOut>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h1>Please Sign In</h1>
              <SignInButton>
                <button style={{ padding: '10px 20px', backgroundColor: '#blue', color: 'white' }}>
                  Sign In
                </button>
              </SignInButton>
            </div>
          </SignedOut>
          
          <SignedIn>
            <div style={{ padding: '20px' }}>
              <h1>SIGNED IN - Minimal App</h1>
              <Routes>
                <Route path="/" element={<EnhancedDashboardSimple />} />
                <Route path="/dashboard" element={<EnhancedDashboardSimple />} />
              </Routes>
            </div>
          </SignedIn>
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;