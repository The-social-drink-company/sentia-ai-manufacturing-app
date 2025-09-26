import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../navigation/Sidebar.jsx'
import { useAuth } from '../../hooks/useAuth.js'

const pageTitles = new Map([
  ['/dashboard', 'Operational Overview'],
  ['/working-capital', 'Working Capital'],
  ['/what-if', 'What-If Scenarios'],
  ['/admin', 'Administration'],
])

const getTitle = pathname => pageTitles.get(pathname) ?? 'Sentia Dashboard'

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut, mode, isAuthenticated } = useAuth()
  const title = getTitle(location.pathname)

  const handleSignOut = async () => {
    await signOut()

    if (mode !== 'clerk') {
      navigate('/login')
    }
  }

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">
          <span className="app-shell__brand-mark" aria-hidden="true">
            S
          </span>
          <span className="sr-only">Sentia Manufacturing Dashboard</span>
        </div>
        <Sidebar />
      </aside>
      <div className="app-shell__content">
        <header className="app-shell__header" role="banner">
          <div>
            <p className="app-shell__eyebrow">Sentia Manufacturing Dashboard</p>
            <h1 className="app-shell__title">{title}</h1>
          </div>
          <div className="app-shell__user">
            <div className="app-shell__user-meta">
              <span className="app-shell__user-name">
                {user ? `${user.firstName} ${user.lastName}`.trim() : 'Guest'}
              </span>
              <span className="app-shell__user-role">{user?.role ?? 'not signed in'}</span>
              <span className="app-shell__auth-mode">Auth mode: {mode}</span>
            </div>
            <button
              type="button"
              className="app-shell__signout"
              onClick={handleSignOut}
              disabled={!isAuthenticated}
            >
              {mode === 'clerk' ? 'Sign out' : isAuthenticated ? 'Sign out' : 'Sign in'}
            </button>
          </div>
        </header>
        <main className="app-shell__main" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
