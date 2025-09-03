import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  FlagIcon,
  PuzzlePieceIcon,
  KeyIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useAuthRole } from '../../hooks/useAuthRole.jsx'
import { cn } from '../../lib/utils'

const AdminSidebar = ({ collapsed = false }) => {
  const location = useLocation()
  const { hasPermission } = useAuthRole()

  const navigationItems = [
    {
      name: 'Overview',
      href: '/admin',
      icon: HomeIcon,
      permission: 'admin.overview.view'
    },
    {
      name: 'Users & Roles',
      href: '/admin/users',
      icon: UsersIcon,
      permission: 'admin.users.view'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Cog6ToothIcon,
      permission: 'admin.settings.view'
    },
    {
      name: 'Feature Flags',
      href: '/admin/feature-flags',
      icon: FlagIcon,
      permission: 'admin.feature_flags.view'
    },
    {
      name: 'Integrations',
      href: '/admin/integrations',
      icon: PuzzlePieceIcon,
      permission: 'admin.integrations.view'
    },
    {
      name: 'API & Keys',
      href: '/admin/api',
      icon: KeyIcon,
      permission: 'admin.api.manage'
    },
    {
      name: 'Webhooks',
      href: '/admin/webhooks',
      icon: GlobeAltIcon,
      permission: 'admin.webhooks.view'
    },
    {
      name: 'Logs',
      href: '/admin/logs',
      icon: DocumentTextIcon,
      permission: 'admin.logs.view'
    },
    {
      name: 'Errors',
      href: '/admin/errors',
      icon: ExclamationTriangleIcon,
      permission: 'admin.errors.view'
    },
    {
      name: 'Maintenance',
      href: '/admin/maintenance',
      icon: WrenchScrewdriverIcon,
      permission: 'admin.maintenance.database'
    }
  ]

  const isActive = (href) => {
    if (href === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(href)
  }

  const visibleItems = navigationItems.filter(item => hasPermission(item.permission))

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700",
        collapsed && "px-3"
      )}>
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <WrenchScrewdriverIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Admin Portal
            </h2>
          </div>
        )}
        
        {collapsed && (
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mx-auto">
            <WrenchScrewdriverIcon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                active
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn(
                "flex-shrink-0 w-5 h-5",
                collapsed ? "mx-auto" : "mr-3",
                active 
                  ? "text-purple-500 dark:text-purple-400" 
                  : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
              )} />
              {!collapsed && (
                <span className="flex-1 truncate">{item.name}</span>
              )}
              
              {!collapsed && active && (
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!collapsed ? (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Version:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Environment:</span>
              <span className={cn(
                "font-medium capitalize",
                process.env.NODE_ENV === 'production' 
                  ? "text-red-600 dark:text-red-400"
                  : process.env.NODE_ENV === 'test'
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-blue-600 dark:text-blue-400"
              )}>
                {process.env.NODE_ENV || 'development'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className={cn(
              "w-3 h-3 rounded-full",
              process.env.NODE_ENV === 'production' 
                ? "bg-red-500"
                : process.env.NODE_ENV === 'test'
                ? "bg-yellow-500"
                : "bg-blue-500"
            )} 
            title={`Environment: ${process.env.NODE_ENV || 'development'}`} />
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSidebar