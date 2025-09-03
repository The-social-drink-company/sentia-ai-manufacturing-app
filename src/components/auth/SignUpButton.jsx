import React from 'react'
import { SignUpButton as ClerkSignUpButton } from '@clerk/clerk-react'

export default function SignUpButton() {
  return (
    <ClerkSignUpButton mode="modal">
      <button className="auth-button sign-up-button">
        Sign Up
      </button>
    </ClerkSignUpButton>
  )
}