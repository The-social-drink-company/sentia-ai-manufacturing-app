import React from 'react'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import '../styles/LandingPage.css'

function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-content">
          <div className="landing-hero">
            <h1>Welcome to Sentia Manufacturing Dashboard</h1>
            <p className="landing-subtitle">
              A comprehensive manufacturing management platform for production planning, 
              resource optimization, and operational excellence.
            </p>
          </div>

          <div className="landing-features">
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Real-time Analytics</h3>
                <p>Monitor production metrics, KPIs, and performance indicators in real-time.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🏭</div>
                <h3>Production Planning</h3>
                <p>Optimize schedules, manage resources, and streamline manufacturing workflows.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">⚙️</div>
                <h3>Resource Management</h3>
                <p>Track equipment, personnel, and materials across your manufacturing operations.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Quality Control</h3>
                <p>Maintain high standards with integrated quality monitoring and reporting.</p>
              </div>
            </div>
          </div>

          <div className="landing-auth">
            <div className="auth-prompt">
              <h2>Access Required</h2>
              <p>Please sign in to access the dashboard. New users require admin approval.</p>
              <div className="auth-buttons-landing">
                <SignInButton mode="modal">
                  <button className="btn btn-primary">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-secondary">Request Access</button>
                </SignUpButton>
              </div>
              <p className="auth-note">
                Registration requests are reviewed by administrators before approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage