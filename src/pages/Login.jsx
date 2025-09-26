import { SignIn } from '@clerk/clerk-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
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
  const { isAuthenticated, signIn, mode } = useAuth()
  const [selectedRole, setSelectedRole] = useState('manager')
  const navigate = useNavigate()

  if (mode === 'clerk') {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />
    }

    return (
      <div className="auth auth--clerk">
        <SignIn path="/login" routing="path" redirectUrl="/dashboard" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async event => {
    event.preventDefault()
    const role = roles.find(item => item.id === selectedRole) ?? roles[0]

    await signIn({
      id: `mock-${role.id}`,
      role: role.id,
      email: `${role.id}@sentia.local`,
      firstName: role.label,
      lastName: 'User',
    })

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSubmit}>
        <header className="auth__header">
          <h1>Sign in to Sentia</h1>
          <p>Select a role to explore the rebuilt dashboard baseline.</p>
        </header>

        <div className="auth__roles" role="radiogroup" aria-label="Available roles">
          {roles.map(role => (
            <label
              key={role.id}
              className={`auth__role ${selectedRole === role.id ? 'auth__role--selected' : ''}`}
            >
              <input
                type="radio"
                name="role"
                value={role.id}
                checked={selectedRole === role.id}
                onChange={() => setSelectedRole(role.id)}
              />
              <span className="auth__role-label">{role.label}</span>
              <span className="auth__role-description">{role.description}</span>
            </label>
          ))}
        </div>

        <button type="submit" className="auth__submit">
          Continue
        </button>
        <p className="auth__footnote">
          Mock auth is active. Configure Clerk keys to switch to production authentication.
        </p>
      </form>
    </div>
  )
}
