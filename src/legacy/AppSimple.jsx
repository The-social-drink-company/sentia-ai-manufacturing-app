import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Simple landing page that works
const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
          Sentia Manufacturing Dashboard
        </h1>
        <p style={{ fontSize: '20px', marginBottom: '40px' }}>
          Enterprise Manufacturing Intelligence Platform
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '60px' }}>
          <Link to="/dashboard">
            <button style={{
              padding: '15px 30px',
              fontSize: '18px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              Enter Dashboard
            </button>
          </Link>
          <Link to="/working-capital">
            <button style={{
              padding: '15px 30px',
              fontSize: '18px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              Working Capital
            </button>
          </Link>
          <Link to="/what-if">
            <button style={{
              padding: '15px 30px',
              fontSize: '18px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              What-If Analysis
            </button>
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            { title: 'AI Analytics', desc: 'Machine learning insights', icon: '🤖' },
            { title: 'Inventory', desc: 'Real-time tracking', icon: '📦' },
            { title: 'Production', desc: 'Optimize workflows', icon: '🏭' },
            { title: 'Quality Control', desc: 'Ensure standards', icon: '✅' },
            { title: 'Forecasting', desc: 'Predict demand', icon: '📊' },
            { title: 'Reports', desc: 'Financial analytics', icon: '📈' }
          ].map((feature, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '30px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>{feature.icon}</div>
              <h3 style={{ marginBottom: '10px' }}>{feature.title}</h3>
              <p style={{ opacity: 0.9 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple dashboard
const Dashboard = () => (
  <div style={{ padding: '40px' }}>
    <h1>Dashboard</h1>
    <p>Welcome to Sentia Manufacturing Dashboard</p>
    <Link to="/">Back to Home</Link>
  </div>
);

// Simple pages
const WorkingCapital = () => (
  <div style={{ padding: '40px' }}>
    <h1>Working Capital Management</h1>
    <p>Financial analytics and cash flow optimization</p>
    <Link to="/">Back to Home</Link>
  </div>
);

const WhatIf = () => (
  <div style={{ padding: '40px' }}>
    <h1>What-If Analysis</h1>
    <p>Scenario planning and forecasting</p>
    <Link to="/">Back to Home</Link>
  </div>
);

// Main App
function AppSimple() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/working-capital" element={<WorkingCapital />} />
        <Route path="/what-if" element={<WhatIf />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default AppSimple;