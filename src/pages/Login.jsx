import { SignIn } from '@clerk/clerk-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthScaffold from '../components/auth/AuthScaffold.jsx'
import clerkAppearance from '../components/auth/clerkAppearance.js'
import { useAuth } from '../hooks/useAuth.js'

const roles = [
  { id: 'executive', label: 'Executive', description: 'Board-level KPIs and liquidity oversight.' },
  {
    id: 'manager',
    label: 'Operations Manager',
    description: 'Production schedules, OEE, supplier health.',
  },
  {
    id: 'finance',
    label: 'Finance Controller',
    description: 'Cash conversion cycle and mitigation plans.',
  },
  { id: 'viewer', label: 'Viewer', description: 'Read-only dashboards across domains.' },
]

export default function LoginPage() {
  const { isAuthenticated, signIn: mockSignIn, mode } = useAuth()
  const [selectedRole, setSelectedRole] = useState('manager')
  const navigate = useNavigate()

  if (mode === 'clerk') {
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

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async event => {
    event.preventDefault()
    const role = roles.find(item => item.id === selectedRole) ?? roles[0]

    await mockSignIn({
      id: `mock-${role.id}`,
      role: role.id,
      email: `${role.id}@sentia.local`,
      firstName: role.label,
      lastName: 'User',
    })

    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthScaffold
      heading="Mock authentication enabled"
      subheading="Choose a role to explore dashboards locally."
      maxWidth="max-w-2xl"
      cardClassName="p-8"
      footer={
        <>
          Ready for production? Update your Clerk environment keys and visit{' '}
          <a href="/clear-auth.html" className="font-medium text-brand-primary transition hover:text-brand-primary/80">
            /clear-auth.html
          </a>{' '}
          to reset mock sessions.
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <fieldset className="space-y-3" aria-label="Available roles">
          <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-crystal-border/70">
            Select a role
          </legend>
          {roles.map(role => {
            const isActive = selectedRole === role.id
            return (
              <label
                key={role.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-400 ${
                  isActive
                    ? 'border-brand-primary/50 bg-brand-primary/10 shadow-glow-blue'
                    : 'border-crystal-border/20 bg-quantum-overlay/60 hover:border-crystal-border/40'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.id}
                  checked={isActive}
                  onChange={() => setSelectedRole(role.id)}
                  className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary"
                />
                <span>
                  <span className="block text-sm font-semibold text-crystal-pure">{role.label}</span>
                  <span className="mt-1 block text-sm text-crystal-border/70">{role.description}</span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-brand px-4 py-3 text-sm font-semibold text-quantum-space shadow-glow-blue transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:ring-offset-2 focus:ring-offset-quantum-space"
        >
          Continue with mock auth
        </button>
        <p className="text-xs text-crystal-border/70">
          Mock sessions and selected roles live in localStorage only. Production builds always use Clerk.
        </p>
      </form>
    </AuthScaffold>
  )
}
