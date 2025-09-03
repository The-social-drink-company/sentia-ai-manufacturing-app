import React from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import SignInButton from './auth/SignInButton'
import SignUpButton from './auth/SignUpButton'
import UserButton from './auth/UserButton'

export default function Header() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const isAdmin = user?.publicMetadata?.role === 'admin'

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1>Sentia Manufacturing Dashboard</h1>
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