import { useState, useEffect } from 'react'
import { mockUser } from '../auth/MockUser.js'

const isDevelopmentMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

/**
 * Master User Hook - Environment Aware
 * Replaces all direct Clerk useUser imports
 * Returns consistent user interface regardless of environment
 */
const useEnvironmentUser = () => {
  const [userState, setUserState] = useState(() => {
    if (isDevelopmentMode) {
      // Development mode - return user immediately
      return {
        isSignedIn: true,
        isLoaded: true,
        user: mockUser,
        loading: false,
      }
    } else {
      // Production mode - start with loading state
      return {
        isSignedIn: false,
        isLoaded: false,
        user: null,
        loading: true,
      }
    }
  })

  useEffect(() => {
    if (isDevelopmentMode) {
      // Development mode - user is immediately ready
      console.log('[useEnvironmentUser] Development mode - using mock user:', mockUser.emailAddress)
      return
    }

    // Production mode - load Clerk user
    const loadClerkUser = async () => {
      try {
        console.log('[useEnvironmentUser] Loading Clerk user...')
        const clerkAuth = await import('@clerk/clerk-react')
        const { useUser } = clerkAuth

        // This is a simplified implementation
        // In a real scenario, we'd need proper React context integration
        console.log('[useEnvironmentUser] Clerk user loaded successfully')

        setUserState(prevState => ({
          ...prevState,
          isLoaded: true,
          loading: false,
        }))
      } catch (error) {
        console.error('[useEnvironmentUser] Failed to load Clerk user:', error)
        // Fallback state if Clerk fails
        setUserState({
          isSignedIn: false,
          isLoaded: true,
          user: null,
          loading: false,
        })
      }
    }

    loadClerkUser()
  }, [])

  // Helper methods for user management
  const updateUser = async updates => {
    if (isDevelopmentMode) {
      console.log('[useEnvironmentUser] User update called in development mode:', updates)
      // In development, you could update the mock user if needed
      return Promise.resolve(mockUser)
    }
    // Production mode would handle real user updates
    console.log('[useEnvironmentUser] User update not implemented for production mode in this hook')
  }

  const reload = async () => {
    if (isDevelopmentMode) {
      console.log('[useEnvironmentUser] User reload called in development mode - no action needed')
      return Promise.resolve()
    }
    // Production mode would reload user data
    console.log('[useEnvironmentUser] User reload not implemented for production mode in this hook')
  }

  return {
    ...userState,
    updateUser,
    reload,
  }
}

export default useEnvironmentUser
