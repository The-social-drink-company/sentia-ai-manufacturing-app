import React from 'react'
import { useAuth } from '@clerk/clerk-react'
import SignInButton from './auth/SignInButton'
import SignUpButton from './auth/SignUpButton'
import UserButton from './auth/UserButton'

export default function Header() {
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  
  // Use Clerk auth if available, otherwise show demo mode
  let isSignedIn = false
  try {
    if (PUBLISHABLE_KEY) {
      const auth = useAuth()
      isSignedIn = auth.isSignedIn
    }
  } catch (error) {
    console.warn('Clerk not available:', error.message)
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1>Sentia Manufacturing Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="auth-controls">
            {PUBLISHABLE_KEY ? (
              isSignedIn ? (
                <UserButton />
              ) : (
                <div className="auth-buttons">
                  <SignInButton />
                  <SignUpButton />
                </div>
              )
            ) : (
              <div className="auth-status">
                <span>Demo Mode (Auth Disabled)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}