import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth.js'

const defaultRole = 'operator'

const LoginPage = () => {
  const { authSource, isAuthenticated, isLoaded, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState(defaultRole)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname ?? '/dashboard'

  if (isAuthenticated && isLoaded) {
    return <Navigate to={redirectTo} replace />
  }

  if (authSource === 'clerk') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-50">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
              <span className="text-xl font-semibold">S</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Sentia Manufacturing</h1>
            <p className="text-sm text-slate-400">Secure sign-in is provided by Clerk for enterprise tenants.</p>
          </div>
          <button
            type="button"
            onClick={() => login({ redirectTo })}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
          >
            Continue to secure sign-in
          </button>
          <p className="text-center text-sm text-slate-400">
            Need access?{' '}
            <Link to="/signup" className="font-medium text-emerald-300 hover:text-emerald-200">
              Request an account
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
        displayName: displayName.trim() || email.trim(),
        role: role || defaultRole
      })
      navigate(redirectTo, { replace: true })
    } catch (submitError) {
      setError(submitError?.message || 'Unable to start session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-50">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
            <span className="text-lg font-semibold">S</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-white">Sentia Manufacturing</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in with your workspace email to enter the console.</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
            <label className="text-sm font-medium text-slate-200" htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Sentia Operations"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
              autoComplete="name"
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
              placeholder="operator"
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Need an account?
          <Link className="ml-1 font-medium text-emerald-300 hover:text-emerald-200" to="/signup">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
