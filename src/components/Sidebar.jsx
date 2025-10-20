import {
  BarChart3,
  TrendingUp,
  Package,
  ClipboardCheck,
  Shield,
  DollarSign,
  FileText,
  BarChart,
  Upload,
  Settings,
  Brain,
} from 'lucide-react'

const Sidebar = ({ activeSection, setActiveSection }) => {
  const menuSections = [
    {
      title: 'OVERVIEW',
      items: [{ id: 'executive-dashboard', label: 'Executive Dashboard', icon: BarChart3 }],
    },
    {
      title: 'PLANNING & ANALYTICS',
      items: [
        { id: 'demand-forecasting', label: 'Demand Forecasting', icon: TrendingUp },
        { id: 'inventory-management', label: 'Inventory Management', icon: Package },
        { id: 'production-tracking', label: 'Production Tracking', icon: ClipboardCheck },
        { id: 'quality-control', label: 'Quality Control', icon: Shield },
        { id: 'business-intelligence', label: 'Business Intelligence', icon: Brain },
      ],
    },
    {
      title: 'FINANCIAL MANAGEMENT',
      items: [
        { id: 'working-capital', label: 'Working Capital', icon: DollarSign },
        { id: 'what-if-analysis', label: 'What-If Analysis', icon: BarChart },
        { id: 'financial-reports', label: 'Financial Reports', icon: FileText },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'data-import', label: 'Data Import', icon: Upload },
        { id: 'admin-panel', label: 'Admin Panel', icon: Settings },
      ],
    },
  ]

  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-700 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <div>
            <p className="text-lg font-semibold">CapLiquify</p>
            <p className="text-sm font-semibold">Manufacturing</p>
            <p className="text-xs text-slate-400">Enterprise Dashboard</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {menuSections.map(section => (
          <div key={section.title} className="py-4">
            <h3 className="mb-3 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </h3>
            <nav className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon
                const isActive = activeSection === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-6 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-r-2 border-blue-400 bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      <footer className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
          <span>All Systems Operational</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">18:24:24</p>
      </footer>
    </aside>
  )
}

export default Sidebar
