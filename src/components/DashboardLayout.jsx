import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import UserButtonEnvironmentAware from '@/components/auth/UserButtonEnvironmentAware'
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
  ShieldCheckIcon,
  FileBarChartIcon
} from 'lucide-react'
import EnterpriseAIChatbot from '@/components/EnterpriseAIChatbot'
import CommandPalette from '@/components/dashboard/CommandPalette'

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [{ to: '/app/dashboard', label: 'Executive Dashboard', icon: LayoutDashboardIcon }]
  },
  {
    title: 'Planning & Analytics',
    items: [
      { to: '/app/forecasting', label: 'Demand Forecasting', icon: LineChartIcon },
      { to: '/app/inventory', label: 'Inventory Management', icon: Package2Icon },
      { to: '/app/analytics', label: 'AI Analytics', icon: BrainIcon }
    ]
  },
  {
    title: 'Financial',
    items: [
      { to: '/app/working-capital', label: 'Working Capital', icon: DollarSignIcon },
      { to: '/app/what-if', label: 'What-If Analysis', icon: LayersIcon },
      { to: '/app/reports', label: 'Financial Reports', icon: FileBarChartIcon }
    ]
  },
  {
    title: 'Operations',
    items: [
      { to: '/app/data-import', label: 'Data Import', icon: DatabaseIcon },
      { to: '/app/admin', label: 'Admin Panel', icon: ShieldCheckIcon }
    ]
  }
]

const DashboardLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [commandOpen, setCommandOpen] = useState(false)

  const activePath = useMemo(() => location.pathname, [location.pathname])

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <aside className="relative hidden w-72 flex-col border-r border-gray-200 bg-white px-4 py-6 lg:flex shadow-sm">
        <div className="mb-8 flex items-center gap-3 pl-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-2xl font-bold text-white">S</div>
          <div>
            <p className="text-sm uppercase tracking-widest text-gray-500">Sentia</p>
            <p className="text-lg font-semibold text-gray-900">Manufacturing</p>
          </div>
        </div>
        <nav className="space-y-8 overflow-y-auto pr-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-3 pl-2 text-xs uppercase tracking-[0.3em] text-gray-500">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = activePath.startsWith(item.to)
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        console.log('[DEBUG] Navigation clicked:', {
                          from: location.pathname,
                          to: item.to,
                          label: item.label
                        })
                        navigate(item.to)
                      }}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${active ? 'border-blue-200 bg-blue-100 text-blue-600' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
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
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Dashboard</p>
            <p className="text-lg font-semibold text-gray-900">Manufacturing Intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 sm:flex"
            >
              <span>Search</span>
              <span className="rounded border border-gray-200 bg-gray-100 px-1">⌘K</span>
            </button>
            <UserButtonEnvironmentAware />
          </div>
        </header>

        <main className="flex-1 bg-gray-50 px-6 py-8">
          <div className="mx-auto max-w-6xl space-y-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <EnterpriseAIChatbot />
    </div>
  )
}

export default DashboardLayout
