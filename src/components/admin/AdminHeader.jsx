import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { useLayoutStore } from '../../stores/layoutStore'
import { cn } from '../../lib/utils'

const AdminHeader = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { getUserDisplayName } = useAuthRole()
  const { theme, setTheme } = useLayoutStore()
  const [notifications] = useState([
    { id: 1, type: 'warning', message: 'High error rate detected in production' },
    { id: 2, type: 'info', message: 'Scheduled maintenance in 2 hours' }
  ])

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname
    const titles = {
      '/admin': 'System Overview',
      '/admin/users': 'User Management',
      '/admin/settings': 'Application Settings',
      '/admin/feature-flags': 'Feature Flags',
      '/admin/integrations': 'Integrations',
      '/admin/api': 'API & Keys',
      '/admin/webhooks': 'Webhooks',
      '/admin/logs': 'System Logs',
      '/admin/errors': 'Error Explorer',
      '/admin/maintenance': 'Maintenance'
    }
    return titles[path] || 'Admin Portal'
  }

  // Get breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname
    const segments = path.split('/').filter(Boolean)
    
    const breadcrumbs = [{ name: 'Admin', href: '/admin' }]
    
    if (segments.length > 1) {
      const pageMap = {
        'users': 'User Management',
        'settings': 'Settings',
        'feature-flags': 'Feature Flags',
        'integrations': 'Integrations',
        'api': 'API & Keys',
        'webhooks': 'Webhooks',
        'logs': 'Logs',
        'errors': 'Errors',
        'maintenance': 'Maintenance'
      }
      
      breadcrumbs.push({
        name: pageMap[segments[1]] || segments[1],
        href: `/${segments.join('/')}`
      })
    }
    
    return breadcrumbs
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <Bars3Icon className="w-5 h-5" />
            ) : (
              <XMarkIcon className="w-5 h-5" />
            )}
          </button>

          {/* Back to main dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Return to main dashboard"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            {breadcrumbs.map((item, index) => (
              <div key={item.href} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(item.href)}
                    className="hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {item.name}
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative">
              <BellIcon className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5" />
            ) : (
              <SunIcon className="w-5 h-5" />
            )}
          </button>

          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {getUserDisplayName()}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                Administrator
              </div>
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* System status bar (if needed) */}
      {process.env.NODE_ENV === 'production' && (
        <div className="bg-red-50 border-b border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <div className="px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                  PRODUCTION ENVIRONMENT
                </span>
                <span className="text-xs text-red-600 dark:text-red-300">
                  All actions are audited and logged
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default AdminHeader