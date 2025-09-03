import React from 'react'
import { SignInButton as ClerkSignInButton } from '@clerk/clerk-react'

export default function SignInButton() {
  return (
    <ClerkSignInButton mode="modal">
      <button className="auth-button sign-in-button">
        Sign In
      </button>
    </ClerkSignInButton>
  )
}