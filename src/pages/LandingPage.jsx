import React from 'react'
import { SignInButton, SignUpButton, useAuth, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import '../styles/SentiaTheme.css'
import '../styles/SentiaLanding.css'

function LandingPage() {
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
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="currentColor"/>
                  </svg>
                </div>
                <h3>Working Capital</h3>
                <p>Cash flow projections, scenario analysis, and comprehensive financial management tools.</p>
              </Link>
              
              <Link to="/data-import" className="sentia-feature-card sentia-dashboard-link">
                <div className="sentia-feature-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="currentColor"/>
                  </svg>
                </div>
                <h3>Data Import</h3>
                <p>Advanced data upload system with validation, mapping, and template management capabilities.</p>
              </Link>
              
              {(user.publicMetadata?.masterAdmin || user.publicMetadata?.role === 'admin') && (
                <Link to="/admin" className="sentia-feature-card sentia-dashboard-link sentia-admin-access">
                  <div className="sentia-feature-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11C15.4,11 16,11.4 16,12V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V12C8,11.4 8.4,11 9,11V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9 10.2,10V11H13.8V10C13.8,9 12.8,8.2 12,8.2Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3>Admin Portal</h3>
                  <p>System administration, user management, and advanced configuration settings.</p>
                </Link>
              )}
            </div>
          </section>
          
          {/* User Status */}
          <section className="sentia-access">
            <div className="sentia-access-card">
              <div className="sentia-user-status-full">
                <h3>Current Session</h3>
                <div className="sentia-user-details-expanded">
                  <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
                  <p><strong>Role:</strong> {user.publicMetadata?.masterAdmin ? 'Master Administrator' : user.publicMetadata?.role === 'admin' ? 'Administrator' : user.publicMetadata?.role || 'User'}</p>
                  <p><strong>Last Sign In:</strong> {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'Current session'}</p>
                  <p><strong>Status:</strong> <span className="sentia-status-active">Active Session</span></p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }
  
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
              <h2>Operational Excellence Through Data-Driven Manufacturing</h2>
              <p className="sentia-hero-description">
                A sophisticated manufacturing management platform designed for 
                precision production planning, resource optimization, and quality control.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
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
              {typeof SignInButton !== 'undefined' ? (
                <SignInButton mode="modal">
                  <button className="sentia-btn sentia-btn-primary">
                    Sign In
                  </button>
                </SignInButton>
              ) : (
                <button className="sentia-btn sentia-btn-primary" disabled>
                  Sign In (Authentication Disabled)
                </button>
              )}
              {typeof SignUpButton !== 'undefined' ? (
                <SignUpButton mode="modal">
                  <button className="sentia-btn sentia-btn-secondary">
                    Request Access
                  </button>
                </SignUpButton>
              ) : (
                <button className="sentia-btn sentia-btn-secondary" disabled>
                  Request Access (Authentication Disabled)
                </button>
              )}
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

export default LandingPage