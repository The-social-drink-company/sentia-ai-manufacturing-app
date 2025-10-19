/**
 * SignInPage - Clerk-powered sign-in page with Sentia branding
 *
 * Features:
 * - Clerk <SignIn /> component for authentication
 * - Sentia blue-purple gradient background
 * - Company branding (logo, title, subtitle)
 * - PublicOnlyRoute wrapper (redirects authenticated users)
 * - "Back to Home" navigation link
 *
 * Route: /sign-in
 * Redirects to: /dashboard (after successful sign-in)
 */
import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import PublicOnlyRoute from '@/components/auth/PublicOnlyRoute'

const SignInPage = () => {
  return (
    <PublicOnlyRoute>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 p-4">
        <div className="w-full max-w-md">
          {/* Sentia Branding Header */}
          <div className="mb-8 text-center">
            {/* Company Logo */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-lg">
              <span className="text-3xl font-bold text-blue-600">S</span>
            </div>

            {/* Company Title */}
            <h1 className="text-3xl font-bold text-white">
              Sentia Manufacturing
            </h1>

            {/* Subtitle */}
            <p className="mt-2 text-purple-100">
              Enterprise Dashboard
            </p>
          </div>

          {/* Clerk Sign-In Component */}
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none',
                }
              }}
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
            />
          </div>

          {/* Back to Home Link */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-purple-100 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </PublicOnlyRoute>
  )
}

export default SignInPage
