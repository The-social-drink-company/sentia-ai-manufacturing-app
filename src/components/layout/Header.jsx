import { useUser, useClerk } from '@clerk/clerk-react'
import {
  BellIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthRole } from '../../hooks/useAuthRole.jsx'

import { cn } from '../../utils/cn'

const Header = ({ _onMenuToggle, isSidebarOpen }) => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { role, getUserDisplayName } = useAuthRole()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  // Get role display information
  const getRoleInfo = (userRole) => {
    switch(userRole) {
      case 'master_admin':
        return { label: 'Master Admin', icon: ShieldCheckIcon, color: 'text-purple-600' }
      case 'admin':
        return { label: 'Administrator', icon: ShieldCheckIcon, color: 'text-red-600' }
      case 'manager':
        return { label: 'Manager', icon: BuildingOfficeIcon, color: 'text-blue-600' }
      case 'operator':
        return { label: 'Operator', icon: UserIcon, color: 'text-green-600' }
      case 'viewer':
        return { label: 'Viewer', icon: UserIcon, color: 'text-gray-600' }
      default:
        return { label: 'User', icon: UserIcon, color: 'text-gray-600' }
    }
  }

  const roleInfo = getRoleInfo(role)

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme')
    const isDark = savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)

    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)

    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            {/* Logo and brand */}
            <Link to="/dashboard" className="flex items-center space-x-3 ml-2 lg:ml-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Sentia Manufacturing
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enterprise Dashboard v2.0
                </p>
              </div>
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </button>
            </div>

            {/* Settings */}
            <button
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Settings"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || user.username}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.fullName || user?.username || getUserDisplayName() || 'User'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                    {role && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 ${roleInfo.color}`}>
                        <roleInfo.icon className="w-3 h-3 mr-1" />
                        {roleInfo.label}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Enhanced Dropdown menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.fullName || user?.username || 'User'}
                    </p>
                    <div className="flex items-center mt-1">
                      <roleInfo.icon className={`w-3 h-3 mr-1 ${roleInfo.color}`} />
                      <span className={`text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Your Profile
                  </Link>
                  <Link
                    to="/user-preferences"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-2" />
                    Preferences
                  </Link>

                  {/* Admin-only options */}
                  {(role === 'admin' || role === 'master_admin') && (
                    <>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <ShieldCheckIcon className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Link>
                    </>
                  )}

                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header