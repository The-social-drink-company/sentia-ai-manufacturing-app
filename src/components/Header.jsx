import React from 'react'
import { Link } from 'react-router-dom'
export default function Header() {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  const isAdmin = user?.publicMetadata?.role === 'admin'
  const hasFinancialAccess = () => {
    const userRole = user?.publicMetadata?.role
    return ['admin', 'cfo', 'financial_manager', 'financial_analyst'].includes(userRole)
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1>Sentia Manufacturing Dashboard</h1>
        </div>
        <div className="header-center">
          {isSignedIn && (
            <nav className="main-nav">
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              {hasFinancialAccess() && (
                <Link to="/working-capital" className="nav-link">
                  Working Capital
                </Link>
              )}
            </nav>
          )}
        </div>
        <div className="header-right">
          <div className="auth-controls">
            {isSignedIn ? (
              <div className="user-section">
                {isAdmin && (
                  <Link to="/admin" className="admin-link">
                    Admin Panel
                  </Link>
                )}
                <UserButton />
              </div>
            ) : (
              <div className="auth-buttons">
                <SignInButton />
                <SignUpButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}