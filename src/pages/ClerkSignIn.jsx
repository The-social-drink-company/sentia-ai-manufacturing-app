import { SignIn } from '@clerk/clerk-react'

const ClerkSignIn = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
    <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
  </div>
)

export default ClerkSignIn
