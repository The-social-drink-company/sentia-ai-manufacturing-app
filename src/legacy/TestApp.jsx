import React from 'react';

function TestApp() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>React is Working!</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard">Go to Dashboard</a>
      </div>
    </div>
  );
}

export default TestApp;