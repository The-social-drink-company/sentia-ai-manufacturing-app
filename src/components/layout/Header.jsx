import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useHotkeys } from 'react-hotkeys-hook'
import { 
  Bars3Icon, 
  XMarkIcon, 
  SunIcon, 
  MoonIcon,
  BellIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  PlayIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { UserButton } from '@clerk/clerk-react'
import { useAuthRole } from '../../hooks/useAuthRole.jsx'
import { useLayoutStore } from '../../stores/layoutStore'
import { useSSE } from '../../hooks/useSSE'
import { cn } from '../../lib/utils'

const QuickActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  disabled = false, 
  variant = 'default',
  shortcut = null 
}) => {
  const baseClasses = "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
  
  const variants = {
    default: "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700",
    primary: "text-white bg-blue-600 border border-transparent hover:bg-blue-700 focus:ring-blue-500",
    success: "text-white bg-green-600 border border-transparent hover:bg-green-700 focus:ring-green-500",
    warning: "text-white bg-yellow-600 border border-transparent hover:bg-yellow-700 focus:ring-yellow-500"
  }
  
  const disabledClasses = "opacity-50 cursor-not-allowed"
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variants[variant],
        disabled && disabledClasses
      )}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
      {shortcut && (
        <kbd className="ml-2 px-1.5 py-0.5 text-xs font-mono bg-gray-100 rounded dark:bg-gray-600">
          {shortcut}
        </kbd>
      )}
    </button>
  )
}

const NotificationBell = () => {
  const [notifications] = useState([
    { id: 1, type: 'warning', message: 'Stock level low for SKU-123', timestamp: new Date() },
    { id: 2, type: 'success', message: 'Forecast completed successfully', timestamp: new Date() },
    { id: 3, type: 'info', message: 'Working capital analysis ready', timestamp: new Date() }
  ])
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-200">
        <div className="relative">
          <BellIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </Menu.Button>
      
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
            </div>
            {notifications.map((notification) => (
              <Menu.Item key={notification.id}>
                {({ active }) => (
                  <div className={cn(
                    "px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer",
                    active && "bg-gray-50 dark:bg-gray-700"
                  )}>
                    <div className="flex items-start">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2 mr-3",
                        notification.type === 'warning' && "bg-yellow-400",
                        notification.type === 'success' && "bg-green-400",
                        notification.type === 'info' && "bg-blue-400"
                      )} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Menu.Item>
            ))}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <Link 
                to="/notifications" 
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

const Breadcrumbs = () => {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)
  
  const breadcrumbLabels = {
    dashboard: 'Dashboard',
    forecasts: 'Forecasts',
    inventory: 'Inventory', 
    'working-capital': 'Working Capital',
    imports: 'Data Import',
    admin: 'Admin Panel',
    templates: 'Templates'
  }
  
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            Dashboard
          </Link>
        </li>
        {pathSegments.slice(1).map((segment, index) => (
          <li key={segment} className="flex items-center">
            <ChevronDownIcon className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
            <Link
              to={`/${pathSegments.slice(0, index + 2).join('/')}`}
              className="ml-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}

const Header = () => {
  const navigate = useNavigate()
  const { 
    theme, 
    toggleTheme, 
    sidebarCollapsed, 
    toggleSidebar, 
    isEditing, 
    setEditing,
    generateShareableLayout
  } = useLayoutStore()
  const { role, hasPermission, getUserDisplayName } = useAuthRole()
  const { isConnected } = useSSE({ enabled: true })
  
  // Environment badge
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development'
  const environmentColors = {
    development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    test: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    production: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
  
  // Quick actions
  const handleRunForecast = () => {
    navigate('/dashboard?action=run-forecast')
  }
  
  const handleOptimizeStock = () => {
    navigate('/dashboard?action=optimize-stock')
  }
  
  const handleProjectCash = () => {
    navigate('/working-capital?action=project-cash')
  }
  
  const handleExport = () => {
    // Implementation for export functionality
    console.log('Export dashboard')
  }
  
  const handleSaveLayout = () => {
    const layoutData = generateShareableLayout()
    // Implementation for saving layout
    console.log('Save layout', layoutData)
  }
  
  const handleShare = () => {
    const layoutData = generateShareableLayout()
    // Implementation for sharing
    console.log('Share dashboard', layoutData)
  }
  
  // Keyboard shortcuts
  useHotkeys('g o', () => navigate('/dashboard'), { enableOnFormTags: false })
  useHotkeys('g f', () => navigate('/dashboard/forecasts'), { enableOnFormTags: false })
  useHotkeys('g i', () => navigate('/dashboard/inventory'), { enableOnFormTags: false })
  useHotkeys('g w', () => navigate('/working-capital'), { enableOnFormTags: false })
  useHotkeys('shift+/', () => {
    // Show help modal
    console.log('Show help')
  }, { enableOnFormTags: false })
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            >
              {sidebarCollapsed ? (
                <Bars3Icon className="w-6 h-6" />
              ) : (
                <XMarkIcon className="w-6 h-6" />
              )}
            </button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Sentia Manufacturing
              </h1>
              
              {/* Environment badge */}
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                environmentColors[environment]
              )}>
                {environment}
              </span>
              
              {/* Connection status */}
              <div className="flex items-center">
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  isConnected ? "bg-green-400" : "bg-red-400"
                )} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Center section - Breadcrumbs */}
          <div className="flex-1 flex justify-center px-4">
            <Breadcrumbs />
          </div>
          
          {/* Right section */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions Toolbar */}
            <div className="flex items-center space-x-2">
              {hasPermission('forecast.run') && (
                <QuickActionButton
                  icon={PlayIcon}
                  label="Run Forecast"
                  onClick={handleRunForecast}
                  variant="primary"
                  shortcut="Alt+F"
                />
              )}
              
              {hasPermission('stock.optimize') && (
                <QuickActionButton
                  icon={ArrowPathIcon}
                  label="Re-optimize Stock"
                  onClick={handleOptimizeStock}
                  variant="default"
                />
              )}
              
              {hasPermission('workingcapital.analyze') && (
                <QuickActionButton
                  icon={ArrowPathIcon}
                  label="Project Cash"
                  onClick={handleProjectCash}
                  variant="default"
                />
              )}
              
              <QuickActionButton
                icon={DocumentArrowDownIcon}
                label="Export"
                onClick={handleExport}
                variant="default"
                shortcut="Ctrl+E"
              />
              
              {hasPermission('dashboard.edit') && (
                <>
                  <QuickActionButton
                    icon={BookmarkIcon}
                    label="Save Layout"
                    onClick={handleSaveLayout}
                    variant="default"
                  />
                  
                  <QuickActionButton
                    icon={ShareIcon}
                    label="Share"
                    onClick={handleShare}
                    variant="default"
                  />
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-3 dark:border-gray-700">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-200"
                title="Toggle theme"
              >
                {theme === 'light' ? (
                  <MoonIcon className="w-5 h-5" />
                ) : (
                  <SunIcon className="w-5 h-5" />
                )}
              </button>
              
              {/* Notifications */}
              <NotificationBell />
              
              {/* Settings */}
              <Link
                to="/settings"
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-200"
                title="Settings"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </Link>
              
              {/* Help */}
              <button
                onClick={() => console.log('Show help')}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-200"
                title="Help (Shift+?)"
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
              </button>
              
              {/* User menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 dark:text-gray-200 hidden sm:block">
                  {getUserDisplayName()}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  {role}
                </span>
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
        </div>
      </div>
      
      {/* Edit mode indicator */}
      {isEditing && (
        <div className="bg-blue-600 text-white px-4 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
            Layout editing mode - Drag and resize widgets
          </div>
          <button
            onClick={() => setEditing(false)}
            className="text-white hover:text-gray-200"
          >
            Exit Edit Mode
          </button>
        </div>
      )}
    </header>
  )
}

export default Header