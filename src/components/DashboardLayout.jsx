import { useLocation, useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  Package,
  Factory,
  Shield,
  Calculator,
  FileText,
  BarChart2,
  Upload,
  Settings
} from 'lucide-react'

const navigation = [
  { section: 'Overview', items: [{ icon: BarChart3, label: 'Executive Dashboard', path: '/app/dashboard' }] },
  {
    section: 'Planning & Analytics',
    items: [
      { icon: TrendingUp, label: 'Demand Forecasting', path: '/app/demand-forecasting' },
      { icon: Package, label: 'Inventory Management', path: '/app/inventory-management' },
      { icon: Factory, label: 'Production Tracking', path: '/app/production-tracking' },
      { icon: Shield, label: 'Quality Control', path: '/app/quality-control' }
    ]
  },
  {
    section: 'Financial',
    items: [
      { icon: Calculator, label: 'Working Capital', path: '/app/working-capital', badge: 'New' },
      { icon: FileText, label: 'What-If Analysis', path: '/app/what-if-analysis' },
      { icon: BarChart2, label: 'Financial Reports', path: '/app/financial-reports' }
    ]
  },
  {
    section: 'Operations',
    items: [
      { icon: Upload, label: 'Data Import', path: '/app/data-import' },
      { icon: Settings, label: 'Admin Panel', path: '/app/admin-panel' }
    ]
  }
]

const DashboardLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-72 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-900">Sentia Manufacturing</p>
          <p className="text-xs text-slate-500">Operations dashboard</p>
        </div>
        <ScrollArea className="flex-1 px-4 py-6">
          <nav className="space-y-6">
            {navigation.map((section) => (
              <div key={section.section}>
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {section.section}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = location.pathname === item.path
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                          active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </span>
                        {item.badge ? <Badge variant="secondary">{item.badge}</Badge> : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="text-xs">
              <p className="font-medium text-slate-900">Signed in</p>
              <p className="text-slate-500">Manage account</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">Dashboard</p>
            <p className="text-lg font-semibold text-slate-900">Manufacturing Intelligence</p>
          </div>
          <Button variant="outline" size="sm">
            Export summary
          </Button>
        </header>
        <div className="flex-1 bg-slate-50 p-6">{children}</div>
      </main>
    </div>
  )
}

export default DashboardLayout
