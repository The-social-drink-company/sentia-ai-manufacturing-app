import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightblue', minHeight: '100vh', fontSize: '20px' }}>
      <h1 style={{ color: 'red', fontSize: '30px' }}>ULTRA MINIMAL TEST</h1>
      <p>If you can see this text, React is working.</p>
      <p>Environment: {import.meta.env.MODE}</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}

export default App;