import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/SentiaTheme.css'
import '../styles/SentiaLanding.css'

// Check if Clerk is properly configured
const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && 
                 import.meta.env.VITE_CLERK_PUBLISHABLE_KEY !== 'undefined' &&
                 import.meta.env.VITE_CLERK_PUBLISHABLE_KEY !== 'null'

// Conditionally import Clerk components
let ClerkComponents = null
if (hasClerk) {
  ClerkComponents = React.lazy(() => import('@clerk/clerk-react').then(module => ({
    default: module
  })))
}

function LandingPage() {
  // When Clerk is available, use it
  if (hasClerk && ClerkComponents) {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <ClerkAuthenticatedLandingPage />
      </React.Suspense>
    )
  }
  
  // Demo mode without Clerk
  return <DemoLandingPage />
}

// Landing page with full Clerk authentication
function ClerkAuthenticatedLandingPage() {
  const { SignInButton, SignUpButton, useAuth, useUser } = require('@clerk/clerk-react')
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  
  // If user is signed in, show quick access dashboard
  if (isSignedIn && user) {
    return (
      <div className="sentia-landing">
        <div className="sentia-container">
          {/* Welcome back hero */}
          <section className="sentia-hero">
            <div className="sentia-hero-content">
              <div className="sentia-brand">
                <div className="sentia-logo-section">
                  <h1 className="sentia-brand-title">SENTIA</h1>
                  <div className="sentia-brand-subtitle">Manufacturing Dashboard</div>
                </div>
              </div>
              
              <div className="sentia-hero-text">
                <h2>Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}</h2>
                <p className="sentia-hero-description">
                  Access your complete manufacturing dashboard and operational tools.
                </p>
              </div>
            </div>
          </section>

          {/* Quick Access Dashboard */}
          <section className="sentia-features">
            <div className="sentia-features-grid">
              <Link to="/dashboard" className="sentia-feature-card sentia-dashboard-link">
                <div className="sentia-feature-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
                  </svg>
                </div>
                <h3>Enhanced Dashboard</h3>
                <p>Real-time KPIs, customizable widgets, and comprehensive analytics for operational excellence.</p>
              </Link>
              
              <Link to="/working-capital" className="sentia-feature-card sentia-dashboard-link">
                <div className="sentia-feature-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"/>
                  </svg>
                </div>
                <h3>Working Capital</h3>
                <p>Optimize cash flow, manage AR/AP, and forecast financial requirements with precision tools.</p>
              </Link>
              
              <Link to="/data-import" className="sentia-feature-card sentia-dashboard-link">
                <div className="sentia-feature-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                  </svg>
                </div>
                <h3>Data Management</h3>
                <p>Import, validate, and synchronize data across all systems with enterprise-grade reliability.</p>
              </Link>
              
              <Link to="/admin" className="sentia-feature-card sentia-dashboard-link">
                <div className="sentia-feature-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                  </svg>
                </div>
                <h3>Admin Portal</h3>
                <p>Configure system settings, manage users, and monitor operational performance metrics.</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }
  
  // Not signed in - show full landing page with auth
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
                Transform your manufacturing operations with real-time analytics, predictive insights, and comprehensive operational control.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="sentia-features">
          <div className="sentia-features-grid">
            <div className="sentia-feature-card">
              <div className="sentia-feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Real-Time Analytics</h3>
              <p>Monitor production metrics, performance indicators, and operational KPIs with precision dashboards and intelligent reporting.</p>
            </div>
            
            <div className="sentia-feature-card">
              <div className="sentia-feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Production Planning</h3>
              <p>Optimize manufacturing schedules, streamline workflows, and maximize resource utilization through intelligent planning algorithms.</p>
            </div>
            
            <div className="sentia-feature-card">
              <div className="sentia-feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Resource Management</h3>
              <p>Track and optimize equipment utilization, personnel allocation, and material flows across all manufacturing operations.</p>
            </div>
            
            <div className="sentia-feature-card">
              <div className="sentia-feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Quality Assurance</h3>
              <p>Maintain exceptional standards through integrated quality monitoring, compliance tracking, and continuous improvement metrics.</p>
            </div>
          </div>
        </section>

        {/* Access Section */}
        <section className="sentia-access">
          <div className="sentia-access-card">
            <div className="sentia-access-header">
              <h3>Secure Access Portal</h3>
              <p>Enter your credentials to access the manufacturing dashboard. New team members require administrative approval for enhanced security.</p>
            </div>
            
            <div className="sentia-auth-actions">
              <SignInButton mode="modal">
                <button className="sentia-btn sentia-btn-primary">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="sentia-btn sentia-btn-secondary">
                  Request Access
                </button>
              </SignUpButton>
            </div>
            
            <div className="sentia-auth-note">
              <p>All registration requests undergo administrative review to ensure authorized access to manufacturing systems.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
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
                <div className="sentia-brand-subtitle">Manufacturing Dashboard - Demo Mode</div>
              </div>
            </div>
            
            <div className="sentia-hero-text">
              <h2>Enterprise Manufacturing Intelligence</h2>
              <p className="sentia-hero-description">
                Experience the full power of our manufacturing dashboard in demo mode. 
                Authentication is currently disabled.
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

        {/* Demo Access Section */}
        <section className="sentia-access">
          <div className="sentia-access-card">
            <div className="sentia-access-header">
              <h3>Demo Mode Active</h3>
              <p>Click any feature card above to explore the dashboard without authentication.</p>
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
              <p>To enable authentication, configure Clerk environment variables in your deployment.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LandingPage