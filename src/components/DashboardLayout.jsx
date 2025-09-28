import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import {
  LayoutDashboardIcon,
  LineChartIcon,
  Package2Icon,
  FactoryIcon,
  FlaskConicalIcon,
  BrainIcon,
  DollarSignIcon,
  LayersIcon,
  DatabaseIcon,
  ShieldCheckIcon
} from 'lucide-react'
import ChatWidget from '@/components/chat/ChatWidget'
import CommandPalette from '@/components/dashboard/CommandPalette'

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [{ to: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboardIcon }]
  },
  {
    title: 'Planning & Analytics',
    items: [
      { to: '/forecasting', label: 'Demand Forecasting', icon: LineChartIcon },
      { to: '/inventory', label: 'Inventory Management', icon: Package2Icon },
      { to: '/production', label: 'Production Tracking', icon: FactoryIcon },
      { to: '/quality', label: 'Quality Control', icon: FlaskConicalIcon },
      { to: '/analytics', label: 'AI Analytics', icon: BrainIcon }
    ]
  },
  {
    title: 'Financial',
    items: [
      { to: '/working-capital', label: 'Working Capital', icon: DollarSignIcon },
      { to: '/what-if', label: 'What-If Analysis', icon: LayersIcon }
    ]
  },
  {
    title: 'Operations',
    items: [
      { to: '/data-import', label: 'Data Import', icon: DatabaseIcon },
      { to: '/admin', label: 'Admin Panel', icon: ShieldCheckIcon }
    ]
  }
]

const DashboardLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [commandOpen, setCommandOpen] = useState(false)

  const activePath = useMemo(() => location.pathname, [location.pathname])

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="relative hidden w-72 flex-col border-r border-white/5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-3 pl-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-2xl font-bold text-white">S</div>
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-400">Sentia</p>
            <p className="text-lg font-semibold text-white">Manufacturing</p>
          </div>
        </div>
        <nav className="space-y-8 overflow-y-auto pr-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-3 pl-2 text-xs uppercase tracking-[0.3em] text-slate-500">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = activePath.startsWith(item.to)
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => navigate(item.to)}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-gradient-to-r from-sky-500/20 to-cyan-400/20 text-white ring-1 ring-cyan-400/40 shadow-lg'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 ${active ? 'bg-white/10 text-cyan-300' : 'bg-white/5 text-sky-200'}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-slate-950/70 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
            <p className="text-lg font-semibold text-white">Manufacturing Intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 sm:flex"
            >
              <span>Search</span>
              <span className="rounded border border-white/10 bg-white/10 px-1">⌘K</span>
            </button>
            <UserButton appearance={{ elements: { avatarBox: 'h-10 w-10' } }} />
          </div>
        </header>

        <main className="flex-1 bg-slate-950 px-6 py-8">
          <div className="mx-auto max-w-6xl space-y-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <ChatWidget />
    </div>
  )
}

export default DashboardLayout
