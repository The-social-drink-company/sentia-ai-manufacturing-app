import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Minimal test component to check if React is working
const TestComponent = () => {
  return (
    <div style={{ padding: '20px', background: 'lightblue', minHeight: '100vh' }}>
      <h1>PRODUCTION TEST - REACT IS WORKING!</h1>
      <p>If you see this, React is mounting correctly.</p>
      <p>Current URL: {window.location.href}</p>
      <p>Time: {new Date().toISOString()}</p>
      <button onClick={() => alert('Button clicked!')}>Test Interaction</button>
    </div>
  );
};

function AppMinimalTest() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<TestComponent />} />
      </Routes>
    </Router>
  );
}

export default AppMinimalTest;