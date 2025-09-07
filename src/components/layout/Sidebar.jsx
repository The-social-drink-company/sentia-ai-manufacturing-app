import React, { useState } from 'react'
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
  PresentationChartLineIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon as SlidersIcon
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
  onClick = null 
}) => {
  const baseClasses = "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200"
  const activeClasses = "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
  const inactiveClasses = "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
  
  const content = (
    <>
      <Icon className={cn(
        "flex-shrink-0 w-5 h-5",
        isCollapsed ? "mx-auto" : "mr-3",
        isActive ? "text-blue-500 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
      )} />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              {badge}
            </span>
          )}
          {shortcut && (
            <kbd className="ml-2 px-1.5 py-0.5 text-xs font-mono bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity dark:bg-gray-600">
              {shortcut}
            </kbd>
          )}
        </>
      )}
    </>
  )
  
  const className = cn(
    baseClasses,
    isActive ? activeClasses : inactiveClasses,
    isCollapsed && "justify-center px-2"
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

const SidebarSection = ({ title, children, isCollapsed }) => {
  if (isCollapsed) {
    return (
      <div className="space-y-1">
        {children}
      </div>
    )
  }
  
  return (
    <div>
      <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

const Sidebar = () => {
  const location = useLocation()
  const { role, hasPermission, hasFeature } = useAuthRole()
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore()
  
  // Alert counts (would come from actual data)
  const [alertCounts] = useState({
    stockLow: 3,
    capacityIssues: 1,
    forecastErrors: 0
  })
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }
  
  // Navigation items with permissions
  const navigationItems = [
    {
      section: 'Overview',
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
          icon: BeakerIcon,
          label: 'AI Analytics',
          shortcut: 'G AI',
          permission: 'analytics.view'
        }
      ]
    },
    {
      section: 'Financial Management',
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
          shortcut: 'G A',
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
          icon: DocumentArrowUpIcon,
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
      label: 'System Config',
      permission: 'system.configure'
    }
  ]
  
  // Experimental features
  const experimentalItems = hasFeature('experimentalFeatures') ? [
    {
      to: '/experimental',
      icon: BeakerIcon,
      label: 'Experimental',
      permission: 'system.configure'
    }
  ] : []
  
  // System status
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
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Sidebar header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700",
        sidebarCollapsed && "px-2"
      )}>
        {!sidebarCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Navigation
          </h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto">
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
        
        {/* Experimental features */}
        {experimentalItems.length > 0 && (
          <SidebarSection
            title="Experimental"
            isCollapsed={sidebarCollapsed}
          >
            {experimentalItems
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
      </nav>
      
      {/* Footer info */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Role:</span>
              <span className="font-medium capitalize">{role}</span>
            </div>
            <div className="flex justify-between">
              <span>Version:</span>
              <span>1.0.0</span>
            </div>
            {hasFeature('debugMode') && (
              <div className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                Debug mode enabled
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Collapsed state tooltip */}
      {sidebarCollapsed && (
        <div className="px-2 pb-4">
          <div 
            className="w-full h-px bg-gray-200 dark:bg-gray-700 mb-2"
            title="Press Ctrl+B to expand"
          />
          <div className="text-center">
            <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 rounded dark:bg-gray-600">
              Ctrl+B
            </kbd>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar