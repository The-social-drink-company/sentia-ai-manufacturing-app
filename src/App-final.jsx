import React, { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, useUser } from '@clerk/clerk-react'
import './App.css'

// Landing Page Component
function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-header">
          <div className="logo-section">
            <div className="logo">
              <span className="logo-icon">S</span>
              <div className="logo-text">
                <h1>Sentia Manufacturing</h1>
                <p>Enterprise Dashboard</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-section">
          <h2>Working Capital Intelligence Platform</h2>
          <p>Real-time manufacturing operations overview with AI-powered insights</p>
          
          <div className="cta-section">
            <SignInButton mode="modal">
              <button className="sign-in-btn">
                🔐 Sign In to Dashboard
              </button>
            </SignInButton>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Real-time business intelligence</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>Inventory</h3>
            <p>Stock management & optimization</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏭</div>
            <h3>Production</h3>
            <p>Manufacturing efficiency tracking</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Finance</h3>
            <p>Working capital management</p>
          </div>
        </div>

        <div className="security-notice">
          <p>🔒 Powered by Clerk • Enterprise-grade security • No guest access allowed</p>
        </div>
      </div>
    </div>
  )
}

// Dashboard Component
function Dashboard() {
  const { user } = useUser()
  const [dashboardData, setDashboardData] = useState(null)
  const [activeSection, setActiveSection] = useState('executive')
  const [showChatbot, setShowChatbot] = useState(false)

  useEffect(() => {
    // Fetch real dashboard data
    fetch('/api/dashboard-data')
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error('Error fetching dashboard data:', err))
  }, [])

  if (!dashboardData) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading enterprise dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">S</span>
            <div className="logo-text">
              <h3>Sentia Manufacturing</h3>
              <p>Enterprise Dashboard</p>
            </div>
          </div>
        </div>

        <div className="nav-section">
          <h4>OVERVIEW</h4>
          <button 
            className={`nav-item ${activeSection === 'executive' ? 'active' : ''}`}
            onClick={() => setActiveSection('executive')}
          >
            📊 Executive Dashboard
          </button>
        </div>

        <div className="nav-section">
          <h4>PLANNING & ANALYTICS</h4>
          <button 
            className={`nav-item ${activeSection === 'demand' ? 'active' : ''}`}
            onClick={() => setActiveSection('demand')}
          >
            📈 Demand Forecasting
          </button>
          <button 
            className={`nav-item ${activeSection === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveSection('inventory')}
          >
            📦 Inventory Management
          </button>
          <button 
            className={`nav-item ${activeSection === 'production' ? 'active' : ''}`}
            onClick={() => setActiveSection('production')}
          >
            🏭 Production Tracking
          </button>
          <button 
            className={`nav-item ${activeSection === 'quality' ? 'active' : ''}`}
            onClick={() => setActiveSection('quality')}
          >
            ⚡ Quality Control
          </button>
        </div>

        <div className="nav-section">
          <h4>FINANCIAL MANAGEMENT</h4>
          <button 
            className={`nav-item ${activeSection === 'working-capital' ? 'active' : ''}`}
            onClick={() => setActiveSection('working-capital')}
          >
            💰 Working Capital
          </button>
          <button 
            className={`nav-item ${activeSection === 'what-if' ? 'active' : ''}`}
            onClick={() => setActiveSection('what-if')}
          >
            📋 What-If Analysis
          </button>
          <button 
            className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveSection('reports')}
          >
            📊 Financial Reports
          </button>
        </div>

        <div className="nav-section">
          <h4>OPERATIONS</h4>
          <button 
            className={`nav-item ${activeSection === 'data-import' ? 'active' : ''}`}
            onClick={() => setActiveSection('data-import')}
          >
            📁 Data Import
          </button>
          <button 
            className={`nav-item ${activeSection === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveSection('admin')}
          >
            ⚙️ Admin Panel
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1>Executive Dashboard</h1>
            <p>Real-time manufacturing operations overview</p>
          </div>
          <div className="header-right">
            <div className="status-indicator">
              <span className="status-dot green"></span>
              All Systems Operational
            </div>
            <div className="search-box">
              <input type="text" placeholder="Search anything..." />
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">💰</span>
                <span className="metric-change positive">+{dashboardData.revenue.growth}%</span>
              </div>
              <h3>Total Revenue</h3>
              <div className="metric-value">£{(dashboardData.revenue.current / 1000000).toFixed(1)}M</div>
              <p>Monthly recurring revenue</p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">📦</span>
                <span className="metric-change positive">+8.5%</span>
              </div>
              <h3>Active Orders</h3>
              <div className="metric-value">{dashboardData.orders.length}</div>
              <p>Orders in production</p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">💼</span>
                <span className="metric-change negative">-2.1%</span>
              </div>
              <h3>Working Capital</h3>
              <div className="metric-value">£{(dashboardData.workingCapital.current / 1000).toFixed(0)}K</div>
              <p>Current working capital</p>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">👥</span>
                <span className="metric-change positive">+12.3%</span>
              </div>
              <h3>Production Efficiency</h3>
              <div className="metric-value">{dashboardData.production.efficiency}%</div>
              <p>Manufacturing efficiency</p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="section-card">
            <h3>Recent Orders (Live Data)</h3>
            <div className="orders-table">
              {dashboardData.orders.map(order => (
                <div key={order.id} className="order-row">
                  <div className="order-info">
                    <strong>Order #{order.id}</strong>
                    <span>{order.customer}</span>
                  </div>
                  <div className="order-amount">
                    {order.currency === 'GBP' ? '£' : '$'}{order.amount}
                  </div>
                  <div className={`order-status ${order.status}`}>
                    {order.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button className="action-btn">📊 View Analytics</button>
              <button className="action-btn">📦 Manage Inventory</button>
              <button className="action-btn">🏭 Production Report</button>
              <button className="action-btn">💰 Financial Summary</button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      <div className={`chatbot ${showChatbot ? 'open' : ''}`}>
        {showChatbot && (
          <div className="chatbot-panel">
            <div className="chatbot-header">
              <h4>🤖 AI Assistant</h4>
              <button onClick={() => setShowChatbot(false)}>×</button>
            </div>
            <div className="chatbot-content">
              <p>Hello! I'm your AI assistant for Sentia Manufacturing. I can help you with:</p>
              <ul>
                <li>• Demand forecasting analysis</li>
                <li>• Inventory optimization</li>
                <li>• Working capital insights</li>
                <li>• Production planning</li>
              </ul>
              <div className="chat-input">
                <input type="text" placeholder="Ask me anything..." />
                <button>Send</button>
              </div>
            </div>
          </div>
        )}
        <button 
          className="chatbot-toggle"
          onClick={() => setShowChatbot(!showChatbot)}
        >
          🤖
        </button>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  const { isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading authentication...</p>
      </div>
    )
  }

  return (
    <div className="App">
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <Dashboard />
      </SignedIn>
    </div>
  )
}

export default App
