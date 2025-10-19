import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * NotificationDropdown Component
 * Displays notification bell with unread count and dropdown list
 *
 * Features:
 * - Bell icon with unread badge
 * - Dropdown with recent notifications
 * - Mark as read functionality
 * - Auto-close on outside click
 * - Accessible with ARIA attributes
 *
 * @param {Array} notifications - Array of notification objects
 * @param {Function} onMarkAsRead - Callback when notification is marked as read
 * @param {Function} onClearAll - Callback to clear all notifications
 */
const NotificationDropdown = ({
  notifications = [],
  onMarkAsRead = () => {},
  onClearAll = () => {},
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  /**
   * Close on ESC key
   */
  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  /**
   * Toggle dropdown
   */
  const handleToggle = () => {
    setIsOpen(prev => !prev)
  }

  /**
   * Mark notification as read
   */
  const handleMarkAsRead = notificationId => {
    onMarkAsRead(notificationId)
  }

  /**
   * Clear all notifications
   */
  const handleClearAll = () => {
    onClearAll()
    setIsOpen(false)
  }

  /**
   * Format notification timestamp
   */
  const formatTime = timestamp => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - notificationTime) / 60000)

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white shadow-md"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-xl"
          role="menu"
          aria-label="Notifications menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
                type="button"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />
                <p className="text-sm text-slate-500">No notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100" role="list">
                {notifications.map(notification => (
                  <li
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 transition-colors hover:bg-slate-50',
                      !notification.read && 'bg-blue-50/50'
                    )}
                    role="menuitem"
                  >
                    <div className="flex items-start gap-3">
                      {/* Notification Icon/Status */}
                      <div className="mt-0.5 flex-shrink-0">
                        {notification.read ? (
                          <div className="h-2 w-2 rounded-full bg-slate-300" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                        {notification.message && (
                          <p className="mt-0.5 text-sm text-slate-600 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>

                      {/* Mark as Read Button */}
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="flex-shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Mark as read"
                          type="button"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer (optional - view all link) */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-200 px-4 py-2 text-center">
              <button
                className="text-xs text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
                type="button"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
