import React from 'react'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import '../styles/SentiaTheme.css'
import '../styles/SentiaLanding.css'

function LandingPage() {
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

export default LandingPage