import { SignInButton as ClerkSignInButton } from '@clerk/clerk-react'

export default function SignInButton() {
  return (
    <ClerkSignInButton mode="modal">
      <button className="auth-button signin-button">
        Sign In
      </button>
    </ClerkSignInButton>
  )
}