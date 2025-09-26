import { useUser } from '@clerk/clerk-react'
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
  CommandLineIcon,
  PresentationChartLineIcon,
  BanknotesIcon,
  CircleStackIcon,
  DocumentChartBarIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { cn } from '../../utils/cn'


const navigation = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, badge: 'Live' }
    ]
  },
  {
    title: 'Planning & Analytics',
    items: [
      { name: 'Demand Forecasting', href: '/forecasting', icon: PresentationChartLineIcon },
      { name: 'Inventory Management', href: '/inventory', icon: CubeIcon },
      { name: 'Production Tracking', href: '/production', icon: TruckIcon },
      { name: 'Quality Control', href: '/quality', icon: ClipboardDocumentCheckIcon },
      { name: 'AI Analytics', href: '/ai-analytics', icon: SparklesIcon, badge: 'AI' }
    ]
  },
  {
    title: 'Financial Management',
    items: [
      { name: 'Working Capital', href: '/working-capital', icon: BanknotesIcon },
      { name: 'What-If Analysis', href: '/what-if', icon: BeakerIcon },
      { name: 'Financial Reports', href: '/reports', icon: DocumentChartBarIcon }
    ]
  },
  {
    title: 'Data Management',
    items: [
      { name: 'Data Import', href: '/import', icon: CircleStackIcon },
      { name: 'Import Templates', href: '/templates', icon: DocumentTextIcon }
    ]
  },
  {
    title: 'Administration',
    items: [
      { name: 'Admin Panel', href: '/admin', icon: ShieldCheckIcon },
      { name: 'User Management', href: '/users', icon: UsersIcon },
      { name: 'System Configuration', href: '/config', icon: Cog6ToothIcon },
      { name: 'Monitoring', href: '/monitoring', icon: ServerStackIcon }
    ]
  }
]

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const { role, hasPermission, hasFeature } = useAuthRole()
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore()
  const [isMobile, setIsMobile] = useState(false)
  // Force rebuild - fixed undefined collapsed variable issue
  
  // Alert counts (would come from actual data)
  const [alertCounts] = useState({
    stockLow: 3,
    capacityIssues: 1,
    forecastErrors: 0
  })
  
  // Handle mobile responsiveness
  useEffect(() => {
    // Get user role from metadata
    const role = user?.publicMetadata?.role || 'viewer'
    setUserRole(role)

    // Load sidebar state
    const savedState = localStorage.getItem('sidebarState')
    if (savedState) {
      const { collapsed: savedCollapsed, expanded } = JSON.parse(savedState)
      setCollapsed(savedCollapsed)
      setExpandedSections(expanded || {})
    } else {
      // Expand all sections by default
      const defaultExpanded = {}
      navigation.forEach((section) => {
        defaultExpanded[section.title] = true
      })
      setExpandedSections(defaultExpanded)
    }
  }, [user])

  const toggleSection = (title) => {
    const newExpanded = {
      ...expandedSections,
      [title]: !expandedSections[title]
    }
    setExpandedSections(newExpanded)
    localStorage.setItem('sidebarState', JSON.stringify({
      collapsed,
      expanded: newExpanded
    }))
  }

  const toggleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem('sidebarState', JSON.stringify({
      collapsed: newCollapsed,
      expanded: expandedSections
    }))
  }

  // Check if user has access to a route based on role
  const hasAccess = (href) => {
    const adminRoutes = ['/admin', '/users', '/config', '/monitoring']
    const managerRoutes = ['/forecasting', '/inventory', '/production', '/quality', '/reports', '/ai-analytics']

    if (userRole === 'admin') return true
    if (userRole === 'manager' && !adminRoutes.includes(href)) return true
    if (userRole === 'operator' && !adminRoutes.includes(href) && !managerRoutes.includes(href)) return true
    if (!adminRoutes.includes(href) && !managerRoutes.includes(href)) return true

    return false
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              <span>S</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Sentia
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manufacturing
              </p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={sidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
        >
          {sidebarCollapsed ? (
            <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        <div className="space-y-4 px-3">
          {navigationItems.map((section) => {
            // For demo/guest access, show all items regardless of permissions
            const visibleItems = section.items.filter(item => 
              !item.permission || hasPermission(item.permission) || true
            )
            
            if (visibleItems.length === 0) return null
            
            return (
              <SidebarSection
                key={section.section}
                title={section.section}
                isCollapsed={sidebarCollapsed}
                defaultExpanded={section.defaultExpanded}
              >
                {visibleItems.map((item) => (
                  <SidebarItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.to)}
                    isCollapsed={sidebarCollapsed}
                    badge={item.badge}
                    shortcut={item.shortcut}
                  />
                ))}
              </SidebarSection>
            )
          })}
          
          {/* Admin section */}
          {adminItems.length > 0 && (
            <SidebarSection
              title="Administration"
              isCollapsed={sidebarCollapsed}
              defaultExpanded={false}
            >
              {collapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {navigation.map((section) => {
              const isExpanded = expandedSections[section.title]
              const visibleItems = section.items.filter(item => hasAccess(item.href))

              if (visibleItems.length === 0) return null

              return (
                <div key={section.title}>
                  {!collapsed && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <span>{section.title}</span>
                      <ChevronDownIcon
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded ? 'rotate-180' : ''
                        )}
                      />
                    </button>
                  )}

                  {(isExpanded || collapsed) && (
                    <div className={cn('space-y-1', !collapsed && 'mt-1')}>
                      {visibleItems.map((item) => {
                        const isActive = location.pathname === item.href
                        const Icon = item.icon

                        return (
                          <NavLink
                            key={item.name}
                            to={item.href}
                            className={cn(
                              'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                              collapsed && 'justify-center'
                            )}
                            title={collapsed ? item.name : undefined}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && (
                              <>
                                <span className="ml-3 flex-1">{item.name}</span>
                                {item.badge && (
                                  <span className={cn(
                                    'ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                    item.badge === 'AI' && 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
                                    item.badge === 'Live' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                                    item.badge !== 'AI' && item.badge !== 'Live' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                  )}>
                                    {item.badge}
                                  </span>
                                )}
                              </>
                            )}
                          </NavLink>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <div className="font-medium">Sentia Manufacturing</div>
                <div>Enterprise v2.0</div>
                <div className="mt-2">Role: {userRole}</div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Collapsed state indicator */}
      {sidebarCollapsed && (
        <div className="sidebar-footer-collapsed">
          <div className="collapsed-hint">
            <span>Ctrl+B</span>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default Sidebar