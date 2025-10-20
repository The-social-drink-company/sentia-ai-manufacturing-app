import { Link, useLocation } from 'react-router-dom'
import {
  BarChart2,
  TrendingUp,
  Package,
  DollarSign,
  Settings as Wrench,
  FileText,
  Upload,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Navigation Groups Configuration
 * Organized by business function for logical grouping
 */
const navigationGroups = [
  {
    title: 'OVERVIEW',
    items: [{ icon: BarChart2, label: 'Executive Dashboard', path: '/app/dashboard' }],
  },
  {
    title: 'PLANNING & ANALYTICS',
    items: [
      { icon: TrendingUp, label: 'Demand Forecasting', path: '/app/forecasting' },
      { icon: Package, label: 'Inventory Management', path: '/app/inventory' },
    ],
  },
  {
    title: 'FINANCIAL MANAGEMENT',
    items: [
      { icon: DollarSign, label: 'Working Capital', path: '/app/working-capital' },
      { icon: Wrench, label: 'What-If Analysis', path: '/app/what-if' },
      { icon: FileText, label: 'Financial Reports', path: '/app/reports' },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { icon: Upload, label: 'Data Import', path: '/app/data-import' },
      { icon: Settings, label: 'Admin Panel', path: '/app/admin' },
    ],
  },
]

/**
 * DashboardSidebar Component
 * Dark-themed professional sidebar navigation for manufacturing dashboard
 *
 * Features:
 * - Dark theme (#1E293B background)
 * - Grouped navigation with section headers
 * - Active state management with React Router
 * - Responsive behavior (desktop: fixed, mobile: overlay)
 * - Smooth transitions and hover effects
 * - Accessibility compliant (ARIA, keyboard nav)
 *
 * @param {boolean} isOpen - Mobile sidebar open state
 * @param {Function} onClose - Callback to close mobile sidebar
 */
const DashboardSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation()

  /**
   * Check if navigation item is active based on current route
   */
  const isActive = path => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  /**
   * Handle navigation item click
   * On mobile, close sidebar after navigation
   */
  const handleItemClick = () => {
    // Close mobile sidebar when navigating
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          // Base styles
          'fixed inset-y-0 left-0 z-50 flex h-screen w-56 flex-col bg-slate-800 shadow-xl transition-transform duration-300 ease-in-out',
          // Desktop: always visible
          'lg:sticky lg:translate-x-0',
          // Mobile: slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        onKeyDown={handleKeyDown}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo/Brand Section */}
        <div className="border-b border-slate-700 p-6">
          <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold text-white shadow-md">
              C
            </div>

            {/* Brand Text */}
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight text-slate-50">CapLiquify Platform</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Multi-tenant SaaS</p>
              <p className="text-xs text-slate-300">Tenant: Sentia Spirits</p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {navigationGroups.map((group, groupIndex) => (
              <div key={group.title}>
                {/* Section Header */}
                <h2
                  className={cn(
                    'px-4 text-xs font-semibold uppercase tracking-wider text-slate-500',
                    groupIndex > 0 && 'mt-6'
                  )}
                >
                  {group.title}
                </h2>

                {/* Navigation Items */}
                <ul className="mt-2 space-y-1" role="list">
                  {group.items.map(item => {
                    const Icon = item.icon
                    const active = isActive(item.path)

                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={handleItemClick}
                          className={cn(
                            // Base styles
                            'group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150',
                            // Default state
                            'text-slate-300 hover:bg-slate-700 hover:text-slate-50',
                            // Active state
                            active &&
                              'bg-slate-700 text-slate-50 shadow-sm before:absolute before:left-0 before:h-full before:w-1 before:rounded-r before:bg-blue-500'
                          )}
                          aria-current={active ? 'page' : undefined}
                        >
                          {/* Icon */}
                          <Icon
                            className={cn(
                              'h-5 w-5 transition-colors',
                              active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                            )}
                            aria-hidden="true"
                          />

                          {/* Label */}
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer Section (Optional) */}
        <div className="border-t border-slate-700 p-4">
          <div className="rounded-lg bg-slate-900 p-3 space-y-1">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} CapLiquify</p>
            <p className="text-xs text-slate-500">Current tenant: Sentia Spirits</p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default DashboardSidebar
