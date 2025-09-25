import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth.js'

const SignupPage = () => {
  const { authSource, isAuthenticated, isLoaded, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('operations')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname ?? '/dashboard'

  if (isAuthenticated && isLoaded) {
    return <Navigate to={redirectTo} replace />
  }

  if (authSource === 'clerk') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-50">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
            <span className="text-xl font-semibold">S</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Request Sentia access</h1>
          <p className="text-sm text-slate-400">
            Your organisation uses Clerk for identity. Continue to the secure sign-up flow to request access.
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                if (window?.Clerk?.openSignUp) {
                  window.Clerk.openSignUp({ redirectUrl: redirectTo })
                } else {
                  window.location.assign('/login')
                }
              } catch (_error) {
                window.location.assign('/login')
              }
            }}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
          >
            Continue to secure sign-up
          </button>
          <p className="text-sm text-slate-400">
            Already onboarded?{' '}
            <Link to="/login" className="font-medium text-emerald-300 hover:text-emerald-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Enter a work email to continue.')
      return
    }

    setIsSubmitting(true)

    try {
      await login({
        id: email.trim().toLowerCase(),
        email: email.trim(),
        displayName: fullName.trim() || email.trim(),
        role: role || 'operations'
      })
      navigate(redirectTo, { replace: true })
    } catch (submitError) {
      setError(submitError?.message || 'Unable to create account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-50">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        <header className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
            <span className="text-xl font-semibold">S</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Request dashboard access</h1>
          <p className="text-sm text-slate-400">Submit your details and we will provision a demo workspace instantly.</p>
        </header>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Sentia Operator"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="email">
              Work email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (error) {
                  setError('')
                }
              }}
              placeholder="ops@sentia-demo.com"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="role">
              Role
            </label>
            <input
              id="role"
              type="text"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="operations"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Submit request'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have access?
          <Link className="ml-1 font-medium text-emerald-300 hover:text-emerald-200" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignupPage
