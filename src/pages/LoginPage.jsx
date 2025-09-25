import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth.js'

const defaultRole = 'operator'

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState(defaultRole)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname ?? '/dashboard'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Enter a work email to continue.')
      return
    }

    const user = {
      id: email.trim().toLowerCase(),
      email: email.trim(),
      displayName: displayName.trim() || email.trim(),
      role: role || defaultRole
    }

    login(user)
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
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
          >
            Continue
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
