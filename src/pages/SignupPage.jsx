import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth.js'

const defaultRole = 'admin'

const SignupPage = () => {
  const { isAuthenticated, login } = useAuth()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState(defaultRole)
  const [company, setCompany] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Enter a work email to create your workspace.')
      return
    }

    if (!agree) {
      setError('Accept the terms to continue.')
      return
    }

    const user = {
      id: email.trim().toLowerCase(),
      email: email.trim(),
      displayName: displayName.trim() || email.trim(),
      role: role || defaultRole,
      company: company.trim() || undefined
    }

    login(user)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-50">
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-300">
            <span className="text-lg font-semibold">S</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-white">Create your Sentia workspace</h1>
          <p className="mt-2 text-sm text-slate-400">Provision a sandbox environment for manufacturing operations.</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="signup-email">
                Work email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error) {
                    setError('')
                  }
                }}
                placeholder="executive@sentia-demo.com"
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-sky-400"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200" htmlFor="signup-name">
                Display name
              </label>
              <input
                id="signup-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Sentia Executive"
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-sky-400"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200" htmlFor="signup-role">
                Role
              </label>
              <input
                id="signup-role"
                type="text"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="admin"
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-sky-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="signup-company">
                Company (optional)
              </label>
              <input
                id="signup-company"
                type="text"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Sentia Manufacturing"
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white outline-none transition focus:border-sky-400"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={agree}
              onChange={(event) => {
                setAgree(event.target.checked)
                if (error) {
                  setError('')
                }
              }}
              className="mt-1 h-4 w-4 rounded border border-slate-600 bg-slate-950 text-sky-400 focus:ring-sky-400"
            />
            <span>By continuing you confirm that this environment will only use demo data until MCP integrations are validated.</span>
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Provision workspace
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have access?
          <Link className="ml-1 font-medium text-sky-300 hover:text-sky-200" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignupPage
