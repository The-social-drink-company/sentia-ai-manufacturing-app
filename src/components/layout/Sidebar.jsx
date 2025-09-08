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
  CircleStackIcon
} from '@heroicons/react/24/outline'
import { useAuthRole } from '../../hooks/useAuthRole.jsx'
import { useLayoutStore } from '../../stores/layoutStore'
import { cn } from '../../lib/utils'

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
  const baseClasses = cn(
    "group flex items-center transition-all duration-200 ease-in-out relative",
    isSubItem 
      ? "pl-8 pr-3 py-2 text-sm" 
      : "px-3 py-2.5 text-sm",
    "font-medium rounded-lg mx-2 my-0.5"
  )
  
  const activeClasses = cn(
    "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm border border-blue-200",
    "dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-200 dark:border-blue-700/50",
    "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600 before:rounded-r-full"
  )
  
  const inactiveClasses = cn(
    "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
    "dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white",
    "hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
  )
  
  const content = (
    <>
      <div className={cn(
        "flex items-center justify-center flex-shrink-0",
        isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"
      )}>
        <Icon className={cn(
          "w-5 h-5 transition-colors duration-200",
          isActive 
            ? "text-blue-600 dark:text-blue-400" 
            : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        )} />
      </div>
      
      {!isCollapsed && (
        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="font-medium truncate">{label}</span>
          <div className="flex items-center space-x-1.5 ml-2">
            {badge && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                {badge}
              </span>
            )}
            {shortcut && (
              <kbd className="hidden group-hover:inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded border dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 transition-all duration-200">
                {shortcut}
              </kbd>
            )}
          </div>
        </div>
      )}
    </>
  )
  
  const className = cn(
    baseClasses,
    isActive ? activeClasses : inactiveClasses,
    isCollapsed && "justify-center"
  )
  
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
      <div className="space-y-0.5">
        <div className="mx-2 my-2 border-t border-gray-200 dark:border-gray-700" />
        {children}
      </div>
    )
  }
  
  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200"
      >
        <span>{title}</span>
        {isExpanded ? (
          <ChevronUpIcon className="w-3 h-3" />
        ) : (
          <ChevronDownIcon className="w-3 h-3" />
        )}
      </button>
      
      <div className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded ? "opacity-100 max-h-96" : "opacity-0 max-h-0"
      )}>
        <div className="space-y-0.5 mt-2">
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
          label: 'Production Tracking',
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
      
      <div className={cn(
        "flex flex-col h-screen bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 transition-all duration-300 ease-in-out",
        isMobile ? "fixed left-0 top-0 z-50 sidebar-mobile" : "relative",
        isMobile && sidebarCollapsed && "transform -translate-x-full",
        !isMobile && (sidebarCollapsed ? "w-16" : "w-72"),
        isMobile && "w-72"
      )}>
      {/* Sidebar Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
        sidebarCollapsed && "px-2"
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Sentia
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manufacturing Dashboard
              </p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-all duration-200"
          title={sidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
        >
          {sidebarCollapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {navigationItems.map((section) => {
            const visibleItems = section.items.filter(item => 
              !item.permission || hasPermission(item.permission)
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
          {adminItems.some(item => hasPermission(item.permission)) && (
            <SidebarSection
              title="Administration"
              isCollapsed={sidebarCollapsed}
              defaultExpanded={false}
            >
              {adminItems
                .filter(item => hasPermission(item.permission))
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
                .filter(item => hasPermission(item.permission))
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Role:</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize px-2 py-1 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                {role}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Version:</span>
              <span className="font-mono text-gray-600 dark:text-gray-400">v1.0.0</span>
            </div>
            {hasFeature('debugMode') && (
              <div className="flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                <span>Debug Mode</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Collapsed state indicator */}
      {sidebarCollapsed && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex justify-center">
            <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-600 rounded border dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
              Ctrl+B
            </kbd>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar