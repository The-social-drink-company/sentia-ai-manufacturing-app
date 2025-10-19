import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { ChevronRight } from 'lucide-react'
import MobileMenuButton from './MobileMenuButton'
import SystemStatusBadge from './SystemStatusBadge'
import NotificationDropdown from './NotificationDropdown'

/**
 * Route Labels Mapping
 * Maps route paths to display names
 */
const routeLabels = {
  '/app/dashboard': 'Executive Dashboard',
  '/app/forecasting': 'Demand Forecasting',
  '/app/inventory': 'Inventory Management',
  '/app/analytics': 'AI Analytics',
  '/app/working-capital': 'Working Capital',
  '/app/what-if': 'What-If Analysis',
  '/app/reports': 'Financial Reports',
  '/app/scenarios': 'Scenario Planner',
  '/app/data-import': 'Data Import',
  '/app/admin': 'Admin Panel',
  '/app/assistant': 'AI Assistant',
}

/**
 * Route Categories Mapping
 * Maps route paths to section categories
 */
const routeCategories = {
  '/app/dashboard': 'OVERVIEW',
  '/app/forecasting': 'PLANNING & ANALYTICS',
  '/app/inventory': 'PLANNING & ANALYTICS',
  '/app/analytics': 'PLANNING & ANALYTICS',
  '/app/working-capital': 'FINANCIAL MANAGEMENT',
  '/app/what-if': 'FINANCIAL MANAGEMENT',
  '/app/reports': 'FINANCIAL MANAGEMENT',
  '/app/scenarios': 'FINANCIAL MANAGEMENT',
  '/app/data-import': 'OPERATIONS',
  '/app/admin': 'OPERATIONS',
  '/app/assistant': 'OPERATIONS',
}

/**
 * DashboardHeader Component
 * Professional header bar with breadcrumbs, status, notifications, and user profile
 *
 * Features:
 * - Mobile menu button (hamburger)
 * - Breadcrumb navigation with clickable links
 * - System status badge (operational/degraded/issues)
 * - Real-time clock (updates every second)
 * - Notification dropdown with unread count
 * - User profile (Clerk UserButton)
 *
 * @param {boolean} mobileMenuOpen - Mobile menu open state
 * @param {Function} onMenuClick - Callback to toggle mobile menu
 */
const DashboardHeader = ({ mobileMenuOpen = false, onMenuClick = () => {} }) => {
  const location = useLocation()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [systemStatus, setSystemStatus] = useState('operational') // operational, degraded, issues
  const [notifications, setNotifications] = useState([])

  /**
   * Update time every second
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  /**
   * Simulate system status updates (replace with real API call)
   */
  useEffect(() => {
    // TODO: Replace with real system health check
    // For now, randomly simulate status changes for demo
    const statusInterval = setInterval(() => {
      const statuses = ['operational', 'operational', 'operational', 'degraded'] // 75% operational
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      setSystemStatus(randomStatus)
    }, 30000) // Check every 30 seconds

    return () => clearInterval(statusInterval)
  }, [])

  /**
   * Simulate notifications (replace with real notification system)
   */
  useEffect(() => {
    // TODO: Replace with real notification API
    // Sample notifications for demo
    const sampleNotifications = [
      {
        id: '1',
        title: 'Inventory Alert',
        message: 'Low stock detected for Product SKU-12345',
        timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        read: false,
      },
      {
        id: '2',
        title: 'Forecast Updated',
        message: 'Demand forecast has been recalculated',
        timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
        read: false,
      },
      {
        id: '3',
        title: 'Report Generated',
        message: 'Monthly financial report is ready',
        timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
        read: true,
      },
    ]

    setNotifications(sampleNotifications)
  }, [])

  /**
   * Generate breadcrumbs from current route
   */
  const breadcrumbs = useMemo(() => {
    const path = location.pathname
    const label = routeLabels[path] || 'Dashboard'
    const category = routeCategories[path] || 'OVERVIEW'

    return [
      { label: 'Dashboard', path: '/app/dashboard', isActive: false },
      { label: category, path: null, isActive: false },
      { label, path, isActive: true },
    ]
  }, [location.pathname])

  /**
   * Format time for display
   */
  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }, [currentTime])

  /**
   * Mark notification as read
   */
  const handleMarkAsRead = notificationId => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    )
  }

  /**
   * Clear all notifications
   */
  const handleClearAll = () => {
    setNotifications([])
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      {/* Left Section: Mobile Menu + Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <MobileMenuButton isOpen={mobileMenuOpen} onClick={onMenuClick} />

        {/* Breadcrumb Navigation */}
        <nav
          className="hidden md:flex items-center gap-2 text-sm"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-2" role="list">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-2">
                {/* Breadcrumb Link/Text */}
                {crumb.isActive ? (
                  <span
                    className="font-semibold text-slate-900"
                    aria-current="page"
                  >
                    {crumb.label}
                  </span>
                ) : crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="text-slate-600 transition-colors hover:text-blue-600"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-600">{crumb.label}</span>
                )}

                {/* Separator */}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Right Section: Status + Time + Notifications + User */}
      <div className="flex items-center gap-3">
        {/* System Status Badge */}
        <div className="hidden sm:block">
          <SystemStatusBadge status={systemStatus} />
        </div>

        {/* Current Time */}
        <div className="hidden lg:block">
          <time
            className="font-mono text-sm text-slate-600"
            dateTime={currentTime.toISOString()}
            aria-label={`Current time: ${formattedTime}`}
          >
            {formattedTime}
          </time>
        </div>

        {/* Notification Bell */}
        <NotificationDropdown
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onClearAll={handleClearAll}
        />

        {/* User Profile (Clerk UserButton) */}
        <div className="flex items-center">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'h-9 w-9',
                userButtonPopoverCard: 'shadow-xl',
              },
            }}
          />
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
