import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/SentiaTheme.css'
import '../styles/SentiaLanding.css'

function LandingPage() {
  // For now, always show demo mode to avoid errors
  return <DemoLandingPage />
}

// Demo landing page without authentication
function DemoLandingPage() {
  return (
    <div className="sentia-landing">
      <div className="sentia-container">
        {/* Hero Section */}
        <section className="sentia-hero">
          <div className="sentia-hero-content">
            <div className="sentia-brand">
              <div className="sentia-logo-section">
                <h1 className="sentia-brand-title">SENTIA</h1>
                <div className="sentia-brand-subtitle">Manufacturing Dashboard</div>
              </div>
            </div>
            
            <div className="sentia-hero-text">
              <h2>Enterprise Manufacturing Intelligence</h2>
              <p className="sentia-hero-description">
                Transform your manufacturing operations with real-time analytics, 
                predictive insights, and comprehensive operational control.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid with direct access */}
        <section className="sentia-features">
          <div className="sentia-features-grid">
            <Link to="/dashboard" className="sentia-feature-card sentia-dashboard-link">
              <div className="sentia-feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Enhanced Dashboard</h3>
              <p>Access the full-featured dashboard with real-time KPIs and customizable widgets.</p>
            </Link>
            
            <Link to="/working-capital" className="sentia-feature-card sentia-dashboard-link">
              <div className="sentia-feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Working Capital</h3>
              <p>Explore financial management tools and cash flow optimization features.</p>
            </Link>
            
            <Link to="/data-import" className="sentia-feature-card sentia-dashboard-link">
              <div className="sentia-feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Data Management</h3>
              <p>Try our data import and validation tools.</p>
            </Link>
            
            <Link to="/admin" className="sentia-feature-card sentia-dashboard-link">
              <div className="sentia-feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Admin Portal</h3>
              <p>Access administrative features and system configuration.</p>
            </Link>
          </div>
        </section>

        {/* Access Section */}
        <section className="sentia-access">
          <div className="sentia-access-card">
            <div className="sentia-access-header">
              <h3>Welcome to Sentia Manufacturing Dashboard</h3>
              <p>Click any feature card above to explore the dashboard capabilities.</p>
            </div>
            
            <div className="sentia-auth-actions">
              <Link to="/dashboard">
                <button className="sentia-btn sentia-btn-primary">
                  Open Dashboard
                </button>
              </Link>
              <Link to="/working-capital">
                <button className="sentia-btn sentia-btn-secondary">
                  Working Capital Demo
                </button>
              </Link>
            </div>
            
            <div className="sentia-auth-note">
              <p>Full authentication features available with Clerk integration.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LandingPage