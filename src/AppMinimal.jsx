import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Simple loading spinner
const LoadingSpinner = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
);

// Simple sign in page (no complex imports)
const SimpleSignIn = () => (
  <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
    <h1>Sign In</h1>
    <form>
      <div style={{ marginBottom: '10px' }}>
        <input type="email" placeholder="Email" style={{ width: '100%', padding: '8px' }} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <input type="password" placeholder="Password" style={{ width: '100%', padding: '8px' }} />
      </div>
      <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none' }}>
        Sign In
      </button>
    </form>
  </div>
);

// Simple landing page
const SimpleLanding = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>Sentia Manufacturing Dashboard</h1>
    <p>Welcome to the manufacturing dashboard</p>
    <a href="/auth/signin" style={{ color: '#007bff' }}>Go to Sign In</a>
  </div>
);

function AppMinimal() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/auth/signin" element={<SimpleSignIn />} />
            <Route path="/" element={<SimpleLanding />} />
            <Route path="*" element={<div style={{ padding: '20px' }}>Page not found</div>} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default AppMinimal;