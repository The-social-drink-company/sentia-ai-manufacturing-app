import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  BanknotesIcon,
  DocumentArrowUpIcon,
  Cog6ToothIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PresentationChartLineIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon as SlidersIcon,
  SparklesIcon,
  CircleStackIcon,
  SignalIcon,
  DevicePhoneMobileIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { useAuthRole } from '../../hooks/useAuthRole.jsx'
import { useLayoutStore } from '../../stores/layoutStore'

const SidebarItem = ({ 
  to, 
  icon: Icon, 
  label, 
  isActive, 
  isCollapsed, 
  badge = null, 
  shortcut = null,
  onClick = null,
  isSubItem = false
}) => {
  const baseClasses = "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200"

  const activeClasses = "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium shadow-sm"

  const inactiveClasses = "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
  
  const content = (
    <>
      <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </>
  )
  
  const className = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
  
  if (to) {
    return (
      <Link
        to={to}
        className={className}
        title={isCollapsed ? label : undefined}
        onClick={onClick}
      >
        {content}
      </Link>
    )
  }
  
  return (
    <button
      onClick={onClick}
      className={className}
      title={isCollapsed ? label : undefined}
    >
      {content}
    </button>
  )
}

const SidebarSection = ({ title, children, isCollapsed, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  if (isCollapsed) {
    return (
      <div className="space-y-1">
        <div className="h-px bg-gray-200 dark:bg-gray-700 my-3" />
        {children}
      </div>
    )
  }
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
      >
        <span>{title}</span>
        {isExpanded ? (
          <ChevronUpIcon className="w-3 h-3" />
        ) : (
          <ChevronDownIcon className="w-3 h-3" />
        )}
      </button>
      
      <div
        className={`mt-2 space-y-1 ${isExpanded ? 'block' : 'hidden'}`}
      >
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}

const Sidebar = () => {
  const location = useLocation()
  const { role, hasPermission, hasFeature } = useAuthRole()
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore()
  const [isMobile, setIsMobile] = useState(false)
  
  // Alert counts (would come from actual data)
  const [alertCounts] = useState({
    stockLow: 3,
    capacityIssues: 1,
    forecastErrors: 0
  })
  
  // Handle mobile responsiveness
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }
  
  // Navigation items with better icons and organization
  const navigationItems = [
    {
      section: 'Overview',
      defaultExpanded: true,
      items: [
        {
          to: '/dashboard',
          icon: HomeIcon,
          label: 'Dashboard',
          shortcut: 'G O',
          permission: 'dashboard.view'
        }
      ]
    },
    {
      section: 'Planning & Analytics',
      defaultExpanded: true,
      items: [
        {
          to: '/forecasting',
          icon: PresentationChartLineIcon,
          label: 'Demand Forecasting',
          shortcut: 'G F',
          permission: 'forecast.view'
        },
        {
          to: '/inventory',
          icon: CubeIcon,
          label: 'Inventory Management',
          shortcut: 'G I',
          permission: 'stock.view',
          badge: alertCounts.stockLow > 0 ? alertCounts.stockLow : null
        },
        {
          to: '/production',
          icon: TruckIcon,
          label: 'Production Optimization',
          shortcut: 'G P',
          permission: 'production.view',
          badge: alertCounts.capacityIssues > 0 ? alertCounts.capacityIssues : null
        },
        {
          to: '/quality',
          icon: BeakerIcon,
          label: 'Quality Control',
          shortcut: 'G Q',
          permission: 'quality.view'
        },
        {
          to: '/ai-analytics',
          icon: SparklesIcon,
          label: 'AI Analytics',
          shortcut: 'G A',
          permission: 'analytics.view'
        },
        {
          to: '/ai-status',
          icon: CpuChipIcon,
          label: 'AI System Status',
          shortcut: 'G AI',
          permission: 'system.view'
        },
        {
          to: '/monitoring',
          icon: SignalIcon,
          label: 'Real-Time Monitoring',
          shortcut: 'G M',
          permission: 'monitoring.view'
        },
        {
          to: '/mobile',
          icon: DevicePhoneMobileIcon,
          label: 'Mobile Floor View',
          shortcut: 'G MF',
          permission: 'production.view'
        }
      ]
    },
    {
      section: 'Financial Management',
      defaultExpanded: true,
      items: [
        {
          to: '/working-capital',
          icon: BanknotesIcon,
          label: 'Working Capital',
          shortcut: 'G W',
          permission: 'workingcapital.view'
        },
        {
          to: '/what-if',
          icon: SlidersIcon,
          label: 'What-If Analysis',
          shortcut: 'G WI',
          permission: 'analytics.view'
        },
        {
          to: '/analytics',
          icon: ChartBarIcon,
          label: 'Financial Reports',
          shortcut: 'G R',
          permission: 'reports.generate'
        },
        {
          to: '/automation',
          icon: SparklesIcon,
          label: 'Smart Automation',
          permission: 'automation.view'
        }
      ]
    },
    {
      section: 'Data Management',
      defaultExpanded: false,
      items: [
        {
          to: '/data-import',
          icon: DocumentArrowUpIcon,
          label: 'Data Import',
          shortcut: 'G D',
          permission: 'import.view'
        },
        {
          to: '/templates',
          icon: CircleStackIcon,
          label: 'Import Templates',
          permission: 'import.view'
        },
        {
          to: '/api-status',
          icon: ExclamationTriangleIcon,
          label: 'API Status',
          permission: 'system.monitor'
        }
      ]
    }
  ]
  
  // Admin section
  const adminItems = [
    {
      to: '/admin',
      icon: UsersIcon,
      label: 'Admin Panel',
      permission: 'users.manage'
    },
    {
      to: '/settings',
      icon: Cog6ToothIcon,
      label: 'System Settings',
      permission: 'system.configure'
    }
  ]
  
  // System diagnostics
  const systemItems = hasFeature('systemDiagnostics') ? [
    {
      to: '/system/health',
      icon: ExclamationTriangleIcon,
      label: 'System Health',
      permission: 'system.configure'
    }
  ] : []
  
  // Keyboard shortcuts
  useHotkeys('ctrl+b', toggleSidebar, { enableOnFormTags: false })
  
  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}
      
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
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
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
        >
          {collapsed ? (
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
              {adminItems
                .filter(item => !item.permission || hasPermission(item.permission) || true)
                .map((item) => (
                  <SidebarItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.to)}
                    isCollapsed={sidebarCollapsed}
                  />
                ))}
            </SidebarSection>
          )}
          
          {/* System diagnostics */}
          {systemItems.length > 0 && (
            <SidebarSection
              title="System"
              isCollapsed={sidebarCollapsed}
              defaultExpanded={false}
            >
              {systemItems
                .filter(item => !item.permission || hasPermission(item.permission) || true)
                .map((item) => (
                  <SidebarItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.to)}
                    isCollapsed={sidebarCollapsed}
                  />
                ))}
            </SidebarSection>
          )}
        </div>
      </nav>
      
      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-info">
            <div className="info-row">
              <span className="info-label">Role:</span>
              <span className="info-value">
                {role}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Version:</span>
              <span className="info-value">v1.0.0</span>
            </div>
            {hasFeature('debugMode') && (
              <div className="debug-mode">
                <span className="debug-indicator"></span>
                <span>Debug Mode</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Collapsed state indicator */}
      {collapsed && (
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