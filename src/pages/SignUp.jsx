import { SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

import AuthScaffold from '../components/auth/AuthScaffold.jsx'
import clerkAppearance from '../components/auth/clerkAppearance.js'

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
const mockMode = import.meta.env.VITE_FORCE_MOCK_AUTH === 'true'

export default function SignUpPage() {
  if (!hasClerk || mockMode) {
    return (
      <AuthScaffold
        heading="Clerk sign-up unavailable"
        subheading="Mock authentication is active in this environment. Configure Clerk keys to unlock production sign-up."
        cardClassName="p-8"
        footer={
          <Link to="/login" className="font-medium text-brand-primary transition hover:text-brand-primary/80">
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-4 text-left text-sm text-crystal-border/70">
          <p>
            The mock auth mode only supports the predefined role picker used for local exploration. Visit the sign-in
            page to choose a role and continue.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-crystal-border/60">
            <li>Set `VITE_CLERK_PUBLISHABLE_KEY` and friends in your environment to enable Clerk.</li>
            <li>Clear cached mock sessions via `/clear-auth.html` if you recently switched modes.</li>
            <li>Restart the dev server after updating environment variables.</li>
          </ul>
        </div>
      </AuthScaffold>
    )
  }

  return (
    <AuthScaffold
      heading="Create your account"
      subheading="Get started with your manufacturing dashboard"
      cardClassName="p-2 sm:p-4"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-primary transition hover:text-brand-primary/80">
            Sign in
          </Link>
        </>
      }
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/login"
        afterSignUpUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </AuthScaffold>
  )
}
