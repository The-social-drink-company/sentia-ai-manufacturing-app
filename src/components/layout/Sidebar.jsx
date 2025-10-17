import { useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import useEnvironmentUser from '@/hooks/useEnvironmentUser'
import {
  HomeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  CubeIcon,
  TruckIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CommandLineIcon,
  PresentationChartLineIcon,
  BanknotesIcon,
  CircleStackIcon,
  DocumentChartBarIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import useAuthRole from '@/hooks/useAuthRole'
import { cn } from '@/utils/cn'

// Navigation configuration with role-based access control
const navigation = [
  {
    title: 'Overview',
    items: [
      {
        name: 'Dashboard',
        href: '/app/dashboard',
        icon: HomeIcon,
        badge: 'Live',
        roles: ['viewer', 'operator', 'manager', 'admin', 'master_admin'],
      },
    ],
  },
  {
    title: 'Planning & Analytics',
    items: [
      {
        name: 'Demand Forecasting',
        href: '/app/forecasting',
        icon: PresentationChartLineIcon,
        roles: ['operator', 'manager', 'admin', 'master_admin'],
      },
      {
        name: 'Inventory Management',
        href: '/app/inventory',
        icon: CubeIcon,
        roles: ['operator', 'manager', 'admin', 'master_admin'],
      },
      {
        name: 'AI Analytics',
        href: '/app/ai-analytics',
        icon: SparklesIcon,
        badge: 'AI',
        roles: ['manager', 'admin', 'master_admin'],
      },
    ],
  },
  {
    title: 'Financial Management',
    items: [
      {
        name: 'Working Capital',
        href: '/app/working-capital',
        icon: BanknotesIcon,
        roles: ['manager', 'admin', 'master_admin'],
      },
      {
        name: 'What-If Analysis',
        href: '/app/what-if',
        icon: BeakerIcon,
        roles: ['manager', 'admin', 'master_admin'],
      },
      {
        name: 'Financial Reports',
        href: '/app/reports',
        icon: DocumentChartBarIcon,
        roles: ['viewer', 'manager', 'admin', 'master_admin'],
      },
    ],
  },
  {
    title: 'Data Management',
    items: [
      {
        name: 'Data Import',
        href: '/app/data-import',
        icon: CircleStackIcon,
        roles: ['manager', 'admin', 'master_admin'],
      },
      {
        name: 'Import Templates',
        href: '/app/templates',
        icon: DocumentTextIcon,
        roles: ['operator', 'manager', 'admin', 'master_admin'],
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        name: 'Admin Panel',
        href: '/app/admin',
        icon: ShieldCheckIcon,
        roles: ['admin', 'master_admin'],
      },
      {
        name: 'User Management',
        href: '/app/users',
        icon: UsersIcon,
        roles: ['admin', 'master_admin'],
      },
      {
        name: 'System Configuration',
        href: '/app/config',
        icon: Cog6ToothIcon,
        roles: ['admin', 'master_admin'],
      },
      {
        name: 'Monitoring',
        href: '/app/monitoring',
        icon: ServerStackIcon,
        roles: ['manager', 'admin', 'master_admin'],
      },
    ],
  },
]

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const { user } = useEnvironmentUser()
  const { role } = useAuthRole()

  // State management
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const [isMobile, setIsMobile] = useState(false)

  // Alert counts (would come from actual data in production)
  // const [alertCounts] = useState({
  //   stockLow: 3,
  //   capacityIssues: 1,
  //   forecastErrors: 0
  // });

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load saved sidebar state
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarState')
    if (savedState) {
      try {
        const { collapsed: savedCollapsed, expanded } = JSON.parse(savedState)
        setCollapsed(savedCollapsed || false)
        setExpandedSections(expanded || {})
      } catch {
        // Initialize with default state if parse fails
        initializeDefaultState()
      }
    } else {
      initializeDefaultState()
    }
  }, [])

  // Initialize default expanded state
  const initializeDefaultState = () => {
    const defaultExpanded = {}
    navigation.forEach(section => {
      defaultExpanded[section.title] = true
    })
    setExpandedSections(defaultExpanded)
  }

  // Toggle section expansion
  const toggleSection = useCallback(
    title => {
      const newExpanded = {
        ...expandedSections,
        [title]: !expandedSections[title],
      }
      setExpandedSections(newExpanded)
      localStorage.setItem(
        'sidebarState',
        JSON.stringify({
          collapsed,
          expanded: newExpanded,
        })
      )
    },
    [expandedSections, collapsed]
  )

  // Toggle sidebar collapse
  const toggleCollapse = useCallback(() => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem(
      'sidebarState',
      JSON.stringify({
        collapsed: newCollapsed,
        expanded: expandedSections,
      })
    )
  }, [collapsed, expandedSections])

  // Check if user has access to a navigation item based on role
  const hasAccess = useCallback(
    item => {
      // If no roles specified, allow all users
      if (!item.roles || item.roles.length === 0) return true

      // If user has no role, default to viewer
      const userRole = role || 'viewer'

      // Check if user's role is in the allowed roles list
      return item.roles.includes(userRole)
    },
    [role]
  )

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        toggleCollapse()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [toggleCollapse])

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-white dark:bg-gray-900',
          'border-r border-gray-200 dark:border-gray-700',
          'shadow-sm transition-all duration-300 z-50',
          'flex flex-col',
          collapsed ? 'w-16' : 'w-64',
          isMobile && !isOpen && '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Sentia</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manufacturing</p>
              </div>
            </div>
          )}

          {(!isMobile || (isMobile && !collapsed)) && (
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}
        </div>

        {/* Navigation content */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Primary navigation">
          {navigation.map(section => {
            // Filter items user has access to
            const accessibleItems = section.items.filter(item => hasAccess(item))

            // Don't render section if no items are accessible
            if (accessibleItems.length === 0) return null

            return (
              <div key={section.title} className="space-y-1">
                {/* Section header */}
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-expanded={expandedSections[section.title]}
                    aria-controls={`nav-section-${section.title}`}
                  >
                    <span>{section.title}</span>
                    {expandedSections[section.title] ? (
                      <ChevronUpIcon className="w-3 h-3" />
                    ) : (
                      <ChevronDownIcon className="w-3 h-3" />
                    )}
                  </button>
                )}

                {/* Section items */}
                {(collapsed || expandedSections[section.title]) && (
                  <ul id={`nav-section-${section.title}`} className="space-y-1" role="list">
                    {accessibleItems.map(item => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.href

                      return (
                        <li key={item.name} role="listitem">
                          <NavLink
                            to={item.href}
                            onClick={e => {
                              console.log(
                                `[Navigation Debug] Sidebar link clicked: ${item.name} -> ${item.href}`
                              )
                              console.log(
                                '[Navigation Debug] Current pathname before navigation:',
                                window.location.pathname
                              )
                              console.log('[Navigation Debug] Event:', e)
                              if (item.name === 'Financial Reports') {
                                console.log(
                                  '[Navigation Debug] FINANCIAL REPORTS NAVIGATION INITIATED'
                                )
                                console.log('[Navigation Debug] Target URL:', item.href)
                                console.log('[Navigation Debug] User role:', role)
                                console.log('[Navigation Debug] Has access:', hasAccess(item))
                              }
                            }}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg transition-colors group',
                              'hover:bg-gray-100 dark:hover:bg-gray-700',
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300'
                            )}
                            title={collapsed ? item.name : undefined}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon
                                className={cn(
                                  'w-5 h-5 flex-shrink-0',
                                  isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                                )}
                                aria-hidden="true"
                              />
                              {!collapsed && (
                                <span className="text-sm font-medium">{item.name}</span>
                              )}
                            </div>

                            {!collapsed && item.badge && (
                              <span
                                className={cn(
                                  'px-2 py-0.5 text-xs font-semibold rounded-full',
                                  item.badge === 'Live' &&
                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                                  item.badge === 'AI' &&
                                    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
                                  item.badge === 'New' &&
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        {/* User section */}
        {user && !collapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user.firstName?.[0]?.toUpperCase() ||
                    user.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
                    'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.fullName || user.firstName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                  {role || 'Viewer'}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

export default Sidebar
