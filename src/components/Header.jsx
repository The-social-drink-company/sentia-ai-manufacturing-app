import React from 'react'
import { useAuth } from '@clerk/clerk-react'
import SignInButton from './auth/SignInButton'
import SignUpButton from './auth/SignUpButton'
import UserButton from './auth/UserButton'

export default function Header() {
  const { isSignedIn } = useAuth()

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1>Sentia Manufacturing Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="auth-controls">
            {isSignedIn ? (
              <UserButton />
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