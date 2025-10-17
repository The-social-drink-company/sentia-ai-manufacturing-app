import { useState, useEffect } from 'react'
import {
  ChevronDownIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { mockUser } from '../../auth/MockUser.js'

const isDevelopmentMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

const UserButtonEnvironmentAware = ({ afterSignOutUrl, ...props }) => {
  const [UserButton, setUserButton] = useState(null)
  const [loading, setLoading] = useState(!isDevelopmentMode)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    if (isDevelopmentMode) {
      // Development mode - use mock user button
      console.log('[UserButtonEnvironmentAware] Using development mode user button')
      setLoading(false)
      return
    }

    // Production mode - load real Clerk UserButton
    const loadClerkUserButton = async () => {
      try {
        console.log('[UserButtonEnvironmentAware] Loading Clerk UserButton...')
        const clerkAuth = await import('@clerk/clerk-react')
        setUserButton(() => clerkAuth.UserButton)
      } catch (error) {
        console.error('[UserButtonEnvironmentAware] Failed to load Clerk UserButton:', error)
        // Fallback to development mode if Clerk fails
        setUserButton(null)
      } finally {
        setLoading(false)
      }
    }

    loadClerkUserButton()
  }, [])

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
  }

  if (isDevelopmentMode || !UserButton) {
    // Development mode user button
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg transition-colors"
          {...props}
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{mockUser.firstName?.[0] || 'D'}</span>
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-gray-900">{mockUser.fullName}</div>
            <div className="text-xs text-gray-500">Development Mode</div>
          </div>
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-900">{mockUser.fullName}</div>
              <div className="text-sm text-gray-500">{mockUser.emailAddress}</div>
              <div className="text-xs text-blue-600 mt-1">Admin • Development Mode</div>
            </div>

            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
              <UserIcon className="w-4 h-4" />
              <span>Manage Account</span>
            </button>

            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
              <CogIcon className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => {
                  console.log('[UserButtonEnvironmentAware] Sign out called in development mode')
                  setDropdownOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Sign Out (Dev Mode)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Production mode - render real Clerk UserButton
  return <UserButton afterSignOutUrl={afterSignOutUrl} {...props} />
}

export default UserButtonEnvironmentAware
