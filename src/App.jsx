function App() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '24px',
      fontWeight: 'bold',
      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <div>
        <h1>🚀 Deployment Successful!</h1>
        <p>Build Time: {new Date().toISOString()}</p>
        <p>Environment: Production</p>
      </div>
    </div>
  );
}

export default App;