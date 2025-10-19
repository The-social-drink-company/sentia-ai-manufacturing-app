/**
 * UserProfile - User profile display with Clerk UserButton integration
 *
 * Features:
 * - Environment-aware authentication (production: Clerk, development: bypass)
 * - Clerk UserButton for authenticated users (avatar, dropdown menu)
 * - Development mode fallback (shows mock user info)
 * - Handles loading and unauthenticated states gracefully
 * - Integrates with useEnvironmentAuth hook
 *
 * Usage:
 * <UserProfile /> // In Header component
 *
 * Environment Modes:
 * - Production (VITE_DEVELOPMENT_MODE=false): Uses Clerk UserButton
 * - Development (VITE_DEVELOPMENT_MODE=true): Shows development user badge
 */
import { useState, useEffect } from 'react'
import useEnvironmentAuth from '@/hooks/useEnvironmentAuth'

const isDevelopmentMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

const UserProfile = () => {
  const { isSignedIn, isLoaded } = useEnvironmentAuth()
  const [UserButton, setUserButton] = useState(null)
  const [loading, setLoading] = useState(!isDevelopmentMode)

  // Load Clerk UserButton in production mode
  useEffect(() => {
    if (isDevelopmentMode) {
      setLoading(false)
      return
    }

    const loadClerkUserButton = async () => {
      try {
        const clerkAuth = await import('@clerk/clerk-react')
        setUserButton(() => clerkAuth.UserButton)
      } catch (error) {
        console.error('[UserProfile] Failed to load Clerk UserButton:', error)
        setUserButton(null)
      } finally {
        setLoading(false)
      }
    }

    loadClerkUserButton()
  }, [])

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  // Unauthenticated state - don't show anything
  if (!isSignedIn) {
    return null
  }

  // Development mode - show development user badge
  if (isDevelopmentMode) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 dark:bg-blue-900/20">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
          D
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Dev User</span>
          <span className="text-xs text-blue-700 dark:text-blue-300">Development Mode</span>
        </div>
      </div>
    )
  }

  // Production mode - use Clerk UserButton
  if (UserButton) {
    return (
      <div className="flex items-center">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
              userButtonTrigger: 'focus:shadow-none',
            },
          }}
          afterSignOutUrl="/sign-in"
        />
      </div>
    )
  }

  // Fallback if Clerk fails to load - show generic user icon
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
        <svg
          className="h-5 w-5 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    </div>
  )
}

export default UserProfile
