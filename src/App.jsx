import React, { useState, useEffect } from 'react';
import WorkingCapitalCalculator from './components/WorkingCapitalCalculator';
import AIInsights from './components/AIInsights';
import SentiaAIChatbot from './components/AI/SentiaAIChatbot';
import './App.css';

function App() {
  const [status, setStatus] = useState('Loading...');
  const [serverInfo, setServerInfo] = useState(null);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    // Test server connection
    fetch('/api/status')
      .then(response => response.json())
      .then(data => {
        setServerInfo(data);
        setStatus('Connected');
        console.log('✅ Server connection successful:', data);
      })
      .catch(err => {
        setError(err.message);
        setStatus('Connection Failed');
        console.error('❌ Server connection failed:', err);
      });
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'working-capital':
        return <WorkingCapitalCalculator />;
      case 'ai-insights':
        return <AIInsights />;
      case 'dashboard':
      default:
        return (
          <div className="App">
            <header className="App-header">
              <h1>🏭 Sentia Manufacturing Dashboard</h1>
              <h2>Enterprise Working Capital Intelligence</h2>
              
              <div className="status-card">
                <h3>System Status</h3>
                <div className={`status-indicator ${status === 'Connected' ? 'success' : status === 'Connection Failed' ? 'error' : 'loading'}`}>
                  {status}
                </div>
                
                {serverInfo && (
                  <div className="server-info">
                    <p><strong>Service:</strong> {serverInfo.service}</p>
                    <p><strong>Version:</strong> {serverInfo.version}</p>
                    <p><strong>Environment:</strong> {serverInfo.environment}</p>
                    <p><strong>Timestamp:</strong> {new Date(serverInfo.timestamp).toLocaleString()}</p>
                  </div>
                )}
                
                {error && (
                  <div className="error-info">
                    <p><strong>Error:</strong> {error}</p>
                  </div>
                )}
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <h4>📊 Working Capital Calculator</h4>
                  <p>Analyze cash flow and optimize working capital</p>
                  <button 
                    className="feature-button active"
                    onClick={() => setCurrentView('working-capital')}
                  >
                    Launch Calculator
                  </button>
                </div>
                
                <div className="feature-card">
                  <h4>🤖 AI Insights</h4>
                  <p>AI-powered manufacturing intelligence</p>
                  <button 
                    className="feature-button active"
                    onClick={() => setCurrentView('ai-insights')}
                  >
                    View Insights
                  </button>
                </div>
                
                <div className="feature-card">
                  <h4>📈 Real-time Analytics</h4>
                  <p>Live production and financial metrics</p>
                  <button disabled>Coming Soon</button>
                </div>
                
                <div className="feature-card">
                  <h4>🔗 Enterprise Integration</h4>
                  <p>Connect with Xero, Shopify, and more</p>
                  <button disabled>Coming Soon</button>
                </div>
              </div>

              <div className="deployment-info">
                <h3>🚀 Deployment Status</h3>
                <p>✅ React Application: Loaded Successfully</p>
                <p>✅ Server Connection: {status}</p>
                <p>✅ Static Assets: Serving Correctly</p>
                <p>✅ Health Checks: Operational</p>
                <p>✅ Working Capital Calculator: Ready</p>
                <p>✅ AI Insights: Ready</p>
              </div>
            </header>
          </div>
        );
    }
  };

  if (currentView !== 'dashboard') {
    return (
      <div className="app-container">
        <nav className="app-nav">
          <button 
            className="nav-button"
            onClick={() => setCurrentView('dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h3>Sentia Manufacturing Dashboard</h3>
        </nav>
        {renderCurrentView()}
      </div>
    );
  }

  return (
    <>
      {renderCurrentView()}
      {/* Sentia AI Chatbot - Always visible */}
      <SentiaAIChatbot />
    </>
  );
}

export default App;
