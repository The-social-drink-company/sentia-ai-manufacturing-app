import React from 'react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import SignInButton from './auth/SignInButton'
import SignUpButton from './auth/SignUpButton'
import UserButton from './auth/UserButton'

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1>Sentia Manufacturing Dashboard</h1>
        </div>
        <div className="header-right">
          <SignedOut>
            <div className="auth-buttons">
              <SignInButton />
              <SignUpButton />
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}