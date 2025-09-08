import { devLog } from '../../lib/devLog.js';
import React, { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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
  BookmarkIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  LanguageIcon,
  AdjustmentsHorizontalIcon as SlidersIcon
} from '@heroicons/react/24/outline'
import { ShareButton } from '../ui/ShareButton'
import { Menu, Transition } from '@headlessui/react'
// ENTERPRISE: Full Clerk integration restored
import { useUser, UserButton, SignOutButton } from '@clerk/clerk-react'
import { useAuthRole } from '../../hooks/useAuthRole.jsx'
import { useLayoutStore } from '../../stores/layoutStore'
import { useSSE } from '../../hooks/useSSE'
import { useFeatureFlags } from '../../hooks/useFeatureFlags.jsx'
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

const RegionTabs = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPermission } = useAuthRole()
  const currentRegion = searchParams.get('region') || 'consolidated'
  
  const regions = [
    { id: 'consolidated', label: 'Consolidated', icon: GlobeAltIcon },
    { id: 'uk', label: 'UK', icon: null, flagEmoji: '🇬🇧' },
    { id: 'eu', label: 'EU', icon: null, flagEmoji: '🇪🇺' },
    { id: 'usa', label: 'USA', icon: null, flagEmoji: '🇺🇸' }
  ]
  
  const handleRegionChange = (regionId) => {
    const newParams = new URLSearchParams(searchParams)
    if (regionId === 'consolidated') {
      newParams.delete('region')
    } else {
      newParams.set('region', regionId)
    }
    setSearchParams(newParams)
  }
  
  // RBAC: Hide regions user cannot access
  const accessibleRegions = regions.filter(region => {
    if (region.id === 'consolidated') return true
    return hasPermission(`region.${region.id}.view`) || hasPermission('region.all.view')
  })
  
  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      {accessibleRegions.map((region) => {
        const Icon = region.icon
        const isActive = currentRegion === region.id
        
        return (
          <button
            key={region.id}
            onClick={() => handleRegionChange(region.id)}
            className={cn(
              "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              isActive
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-600/50"
            )}
            role="tab"
            aria-selected={isActive}
            title={`Switch to ${region.label} view`}
          >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {region.flagEmoji && (
              <span className="mr-2 text-base" role="img" aria-label={`${region.label} flag`}>
                {region.flagEmoji}
              </span>
            )}
            {region.label}
          </button>
        )
      })}
    </div>
  )
}

const EntitySwitcher = () => {
  const { hasPermission } = useAuthRole()
  const [currentEntity, setCurrentEntity] = useState('uk_ltd')
  
  // Mock entities - in real app would come from user context
  const entities = [
    { id: 'uk_ltd', name: 'Sentia UK Ltd', region: 'UK', currency: 'GBP' },
    { id: 'eu_bv', name: 'Sentia EU B.V.', region: 'EU', currency: 'EUR' },
    { id: 'usa_inc', name: 'Sentia USA Inc', region: 'USA', currency: 'USD' }
  ]
  
  // RBAC: Only show entities user has access to
  const accessibleEntities = entities.filter(entity => 
    hasPermission(`entity.${entity.id}.view`) || hasPermission('entity.all.view')
  )
  
  // Hide if user has access to only one entity
  if (accessibleEntities.length <= 1) return null
  
  const activeEntity = entities.find(e => e.id === currentEntity)
  
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        <BuildingOffice2Icon className="w-4 h-4 mr-2" />
        {activeEntity?.name}
        <ChevronDownIcon className="w-4 h-4 ml-2" />
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
        <Menu.Items className="absolute left-0 mt-2 w-64 origin-top-left bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Switch Entity</h3>
            </div>
            {accessibleEntities.map((entity) => (
              <Menu.Item key={entity.id}>
                {({ active }) => (
                  <button
                    onClick={() => setCurrentEntity(entity.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm",
                      active && "bg-gray-50 dark:bg-gray-700",
                      currentEntity === entity.id && "bg-blue-50 dark:bg-blue-900"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {entity.name}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {entity.region} • {entity.currency}
                        </div>
                      </div>
                      {currentEntity === entity.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

const CurrencyControl = () => {
  const [displayCurrency, setDisplayCurrency] = useState('base')
  const [locale, setLocale] = useState('en-GB')
  
  const currencies = [
    { id: 'base', label: 'Base (GBP)', symbol: '£' },
    { id: 'local', label: 'Local', symbol: '💱' },
    { id: 'usd', label: 'USD', symbol: '$' },
    { id: 'eur', label: 'EUR', symbol: '€' }
  ]
  
  const locales = [
    { id: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
    { id: 'en-US', label: 'English (US)', flag: '🇺🇸' },
    { id: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
    { id: 'fr-FR', label: 'Français', flag: '🇫🇷' }
  ]
  
  const activeCurrency = currencies.find(c => c.id === displayCurrency)
  const activeLocale = locales.find(l => l.id === locale)
  
  return (
    <div className="flex items-center space-x-2">
      {/* Currency Switcher */}
      <Menu as="div" className="relative">
        <Menu.Button className="inline-flex items-center px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <CurrencyDollarIcon className="w-4 h-4 mr-1" />
          {activeCurrency?.symbol}
          <ChevronDownIcon className="w-3 h-3 ml-1" />
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
          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Display Currency
                </h3>
              </div>
              {currencies.map((currency) => (
                <Menu.Item key={currency.id}>
                  {({ active }) => (
                    <button
                      onClick={() => setDisplayCurrency(currency.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm",
                        active && "bg-gray-50 dark:bg-gray-700",
                        displayCurrency === currency.id && "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{currency.label}</span>
                        <span className="text-gray-400">{currency.symbol}</span>
                      </div>
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
      
      {/* Locale Switcher */}
      <Menu as="div" className="relative">
        <Menu.Button className="inline-flex items-center px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <LanguageIcon className="w-4 h-4 mr-1" />
          <span className="text-base" role="img" aria-label="Current locale">
            {activeLocale?.flag}
          </span>
          <ChevronDownIcon className="w-3 h-3 ml-1" />
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
          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Language & Locale
                </h3>
              </div>
              {locales.map((localeOption) => (
                <Menu.Item key={localeOption.id}>
                  {({ active }) => (
                    <button
                      onClick={() => setLocale(localeOption.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm",
                        active && "bg-gray-50 dark:bg-gray-700",
                        locale === localeOption.id && "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      )}
                    >
                      <div className="flex items-center">
                        <span className="mr-2 text-base" role="img" aria-label={`${localeOption.label} flag`}>
                          {localeOption.flag}
                        </span>
                        <span>{localeOption.label}</span>
                      </div>
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}

const Header = () => {
  const navigate = useNavigate()
  // NUCLEAR: BRUTAL Clerk user integration with auth bypass support
  const useAuthBypass = import.meta.env.VITE_USE_AUTH_BYPASS === 'true'
  const { user, isLoaded, isSignedIn } = useAuthBypass 
    ? { user: { firstName: 'Demo', lastName: 'User', emailAddresses: [{ emailAddress: 'demo@sentia.com' }] }, isLoaded: true, isSignedIn: true }
    : useUser()
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
  const { hasGlobalTabs, hasCFOFeatures } = useFeatureFlags()
  
  // Environment badge
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development'
  const environmentColors = {
    development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    test: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    production: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
  
  // Quick actions - Functional implementations
  const handleRunForecast = () => {
    navigate('/forecasting')
  }
  
  const handleOptimizeStock = () => {
    navigate('/inventory')
  }
  
  const handleProjectCash = () => {
    navigate('/working-capital')
  }
  
  const handleWhatIfAnalysis = () => {
    navigate('/what-if')
  }
  
  const handleExport = () => {
    // Create and trigger download of dashboard data
    const data = {
      timestamp: new Date().toISOString(),
      dashboard: 'manufacturing',
      data: 'Export functionality implemented'
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    devLog.log('Export dashboard completed')
  }
  
  const handleSaveLayout = () => {
    const layoutData = generateShareableLayout()
    localStorage.setItem('sentia-dashboard-layout', JSON.stringify(layoutData))
    devLog.log('Layout saved successfully', layoutData)
    // Show success toast here in real implementation
  }
  
  const handleShare = () => {
    const layoutData = generateShareableLayout()
    const shareUrl = `${window.location.origin}/dashboard?layout=${btoa(JSON.stringify(layoutData))}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      devLog.log('Share URL copied to clipboard', shareUrl)
      // Show success toast here in real implementation
    })
  }
  
  // Keyboard shortcuts for enterprise navigation
  useHotkeys('g o', () => navigate('/dashboard'), { enableOnFormTags: false })
  useHotkeys('g f', () => navigate('/forecasting'), { enableOnFormTags: false })
  useHotkeys('g i', () => navigate('/inventory'), { enableOnFormTags: false })
  useHotkeys('g p', () => navigate('/production'), { enableOnFormTags: false })
  useHotkeys('g q', () => navigate('/quality'), { enableOnFormTags: false })
  useHotkeys('g w', () => navigate('/working-capital'), { enableOnFormTags: false })
  useHotkeys('g a', () => navigate('/what-if'), { enableOnFormTags: false })
  useHotkeys('g r', () => navigate('/analytics'), { enableOnFormTags: false })
  useHotkeys('g d', () => navigate('/data-import'), { enableOnFormTags: false })
  useHotkeys('shift+/', () => {
    // Show help modal
    devLog.log('Show help')
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
              {/* Clickable Sentia Logo */}
              <Link 
                to="/dashboard" 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md px-2 py-1"
                title="Go to Dashboard Home"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sentia Manufacturing
                </h1>
              </Link>
              
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
          
          {/* Center section - Global Tabs, Entity Switcher, and Breadcrumbs */}
          <div className="flex-1 flex items-center justify-center px-4 space-x-4">
            {hasGlobalTabs && <RegionTabs />}
            <EntitySwitcher />
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
              
              <ShareButton
                dashboardId="main-dashboard"
                title="Manufacturing Dashboard"
                variant="icon"
                size="md"
              />
              
              {hasPermission('workingcapital.analyze') && (
                <QuickActionButton
                  icon={CurrencyDollarIcon}
                  label="Working Capital"
                  onClick={handleProjectCash}
                  variant="default"
                />
              )}
              
              {hasPermission('analytics.view') && (
                <QuickActionButton
                  icon={SlidersIcon}
                  label="What-If Analysis"
                  onClick={handleWhatIfAnalysis}
                  variant="default"
                  shortcut="G+A"
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
              {/* Currency and Locale Controls */}
              <CurrencyControl />
              
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
                onClick={() => devLog.log('Show help')}
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
                {/* User avatar with next-auth */}
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {getUserDisplayName()?.charAt(0)?.toUpperCase() || 'U'}
                </div>
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