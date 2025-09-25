import { MouseEvent, useMemo, useState } from 'react'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Factory,
  FileText,
  LineChart,
  Package,
  Settings,
  ShieldCheck,
  TrendingUp,
  Upload,
  Wallet
} from 'lucide-react'

export type EnterpriseSidebarProps = {
  currentPath: string
  userRole: string
  onNavigate: (path: string) => void
}

type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  roles?: string[]
}

type NavSection = {
  id: string
  label: string
  items: NavItem[]
}

const baseSections: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        label: 'Executive Dashboard',
        path: '/dashboard',
        icon: LineChart
      }
    ]
  },
  {
    id: 'planning-analytics',
    label: 'Planning & Analytics',
    items: [
      {
        label: 'Demand Forecasting',
        path: '/forecasting',
        icon: TrendingUp
      },
      {
        label: 'Inventory Management',
        path: '/inventory',
        icon: Package
      },
      {
        label: 'Production Tracking',
        path: '/production',
        icon: Factory
      },
      {
        label: 'Quality Control',
        path: '/quality',
        icon: ShieldCheck
      }
    ]
  },
  {
    id: 'financial-management',
    label: 'Financial Management',
    items: [
      {
        label: 'Working Capital',
        path: '/working-capital',
        icon: Wallet
      },
      {
        label: 'What-If Analysis',
        path: '/what-if-analysis',
        icon: BarChart3
      },
      {
        label: 'Financial Reports',
        path: '/financial-reports',
        icon: FileText
      }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        label: 'Data Import',
        path: '/data-import',
        icon: Upload
      },
      {
        label: 'Admin Panel',
        path: '/admin',
        icon: Settings,
        roles: ['admin', 'superadmin']
      }
    ]
  }
]

const filterItemsByRole = (items: NavItem[], userRole: string): NavItem[] => {
  return items.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true
    }

    return item.roles.some((role) => role.toLowerCase() === userRole)
  })
}

const EnterpriseSidebar: FC<EnterpriseSidebarProps> = ({ currentPath, userRole, onNavigate }) => {
  const normalizedRole = userRole ? userRole.trim().toLowerCase() : ''
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    return baseSections.reduce<Record<string, boolean>>((acc, section) => {
      acc[section.id] = true
      return acc
    }, {})
  })

  const sections = useMemo(() => {
    return baseSections
      .map((section) => ({
        ...section,
        items: filterItemsByRole(section.items, normalizedRole)
      }))
      .filter((section) => section.items.length > 0)
  }, [normalizedRole])

  const handleToggleSection = (sectionId: string) => {
    setOpenSections((previous) => ({
      ...previous,
      [sectionId]: !previous[sectionId]
    }))
  }

  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (event.defaultPrevented || event.button !== 0) {
      return
    }

    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
      return
    }

    event.preventDefault()
    onNavigate(path)
  }

  return (
    <aside
      className="sticky top-0 flex h-screen w-[260px] flex-col bg-[#1e293b] text-white"
      role="navigation"
      aria-label="Sentia enterprise navigation"
    >
      <div className="border-b border-slate-700 px-6 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3b82f6] text-lg font-semibold text-white">
            S
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-wide">Sentia Manufacturing</span>
            <span className="text-xs text-slate-300">Enterprise Dashboard</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-8 text-sm">
          {sections.map((section) => {
            const isOpen = openSections[section.id]

            return (
              <li key={section.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 transition hover:text-white"
                  onClick={() => handleToggleSection(section.id)}
                  aria-expanded={isOpen}
                  aria-controls={`${section.id}-group`}
                >
                  <span>{section.label}</span>
                  <span className="text-lg" aria-hidden="true">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </span>
                </button>
                <div id={`${section.id}-group`} hidden={!isOpen}>
                  <ul className="mt-4 space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`)
                      const baseClasses = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e293b]'
                      const activeClasses = 'bg-[#0f172a] text-white shadow-inner border-l-4 border-[#3b82f6] pl-2.5'
                      const inactiveClasses = 'border-l-4 border-transparent text-slate-300 hover:bg-slate-700/70 hover:text-white'

                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={(event) => handleNavigate(event, item.path)}
                            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <Icon
                              aria-hidden="true"
                              className={`h-4 w-4 ${isActive ? 'text-[#3b82f6]' : 'text-slate-400'}`}
                            />
                            <span className={isActive ? 'text-[#3b82f6]' : undefined}>{item.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default EnterpriseSidebar
