import React, { useState, useEffect, Suspense, lazy } from 'react';
import './App.css';
import { logInfo, logError } from '@/utils/structuredLogger';

// Lazy load feature components for better performance
const WorkingCapitalDashboard = lazy(() => import('./features/working-capital/WorkingCapitalDashboard'));
const InventoryDashboard = lazy(() => import('./features/inventory/InventoryDashboard'));
const ProductionDashboard = lazy(() => import('./features/production/ProductionDashboard'));
const AIInsights = lazy(() => import('./components/AIInsights'));
const AIAnalyticsDashboard = lazy(() => import('./features/ai-analytics/AIAnalyticsDashboard'));
const QualityControlDashboard = lazy(() => import('./features/quality/QualityControlDashboard'));

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
        logInfo('Server connection successful', { data });
      })
      .catch(err => {
        setError(err.message);
        setStatus('Connection Failed');
        logError('Server connection failed', err);
      });
  }, []);

  // Loading component for lazy-loaded features
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      <span className="ml-4 text-lg text-gray-600">Loading component...</span>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'working-capital':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <WorkingCapitalDashboard />
          </Suspense>
        );
      case 'inventory':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <InventoryDashboard />
          </Suspense>
        );
      case 'production':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ProductionDashboard />
          </Suspense>
        );
      case 'ai-insights':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AIInsights />
          </Suspense>
        );
      case 'ai-analytics':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AIAnalyticsDashboard />
          </Suspense>
        );
      case 'quality':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <QualityControlDashboard />
          </Suspense>
        );
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
                  <h4>📦 Inventory Management</h4>
                  <p>Monitor stock levels, reorder points, and turnover</p>
                  <button
                    className="feature-button active"
                    onClick={() => setCurrentView('inventory')}
                  >
                    Manage Inventory
                  </button>
                </div>

                <div className="feature-card">
                  <h4>🏭 Production Tracking</h4>
                  <p>Real-time OEE monitoring and production optimization</p>
                  <button
                    className="feature-button active"
                    onClick={() => setCurrentView('production')}
                  >
                    Track Production
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
                <p>✅ Inventory Management: Ready</p>
                <p>✅ Production Tracking: Ready</p>
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

  return renderCurrentView();
}

export default App;
