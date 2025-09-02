import { SignUpButton as ClerkSignUpButton } from '@clerk/clerk-react'

export default function SignUpButton() {
  return (
    <ClerkSignUpButton mode="modal">
      <button className="auth-button signup-button">
        Sign Up
      </button>
    </ClerkSignUpButton>
  )
}