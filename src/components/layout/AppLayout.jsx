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
    <div className="grid min-h-screen grid-cols-1 bg-quantum-space bg-gradient-quantum text-crystal-light lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-crystal-border/15 bg-gradient-to-b from-quantum-midnight/95 to-quantum-twilight/70 px-4 py-6 lg:flex lg:flex-col lg:gap-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-2xl font-bold text-quantum-space shadow-glow-blue">
          <span aria-hidden="true">S</span>
          <span className="sr-only">Sentia Manufacturing Dashboard</span>
        </div>
        <Sidebar />
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-crystal-border/15 bg-quantum-overlay/60 px-6 py-6 pb-4 backdrop-blur-xl lg:gap-6 lg:px-12 lg:py-8 lg:pb-4" role="banner">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-crystal-border/70">Sentia Manufacturing Dashboard</p>
            <h1 className="text-3xl font-semibold text-crystal-pure">{title}</h1>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-crystal-border/15 bg-quantum-overlay/60 px-4 py-3">
            <div className="flex flex-col space-y-0.5 text-xs uppercase tracking-[0.05em] text-crystal-border/80">
              <span className="text-sm font-medium tracking-normal text-crystal-pure normal-case">
                {user ? `${user.firstName} ${user.lastName}`.trim() : 'Guest'}
              </span>
              <span className="text-crystal-border/70">{user?.role ?? 'not signed in'}</span>
              <span className="text-sky-300">Auth mode: {mode}</span>
            </div>
            <button
              type="button"
              className="transform rounded-lg border border-sky-500/45 bg-sky-500/20 px-3 py-2 text-sm font-medium text-crystal-pure transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
              onClick={handleSignOut}
              disabled={!isAuthenticated}
            >
              {mode === 'clerk' ? 'Sign out' : isAuthenticated ? 'Sign out' : 'Sign in'}
            </button>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-8 px-6 pb-10 pt-8 lg:px-12" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
