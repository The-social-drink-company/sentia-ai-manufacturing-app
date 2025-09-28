import { SignIn } from '@clerk/clerk-react'
import { Link, Navigate } from 'react-router-dom'

import AuthScaffold from '../components/auth/AuthScaffold.jsx'
import clerkAppearance from '../components/auth/clerkAppearance.js'
import { useAuth } from '../hooks/useAuth.js'

export default function LoginPage() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthScaffold
      heading="Sign in to Sentia"
      subheading="Access the manufacturing command center"
      cardClassName="p-2 sm:p-4"
      footer={
        <>
          Need an account?{' '}
          <Link to="/sign-up" className="font-medium text-brand-primary transition hover:text-brand-primary/80">
            Create one
          </Link>
        </>
      }
    >
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </AuthScaffold>
  )
}
