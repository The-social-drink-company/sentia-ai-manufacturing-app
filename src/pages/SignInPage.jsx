import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

const SignInPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-lg">
            <span className="text-3xl font-bold text-blue-600">C</span>
          </div>
          <h1 className="text-3xl font-bold text-white">CapLiquify Platform</h1>
          <p className="mt-2 text-purple-100">Multi-tenant manufacturing intelligence</p>
          <p className="text-xs uppercase tracking-[0.3em] text-purple-200">Tenant: Sentia Spirits</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none',
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
          />
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-purple-100 transition-colors hover:text-white">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignInPage
