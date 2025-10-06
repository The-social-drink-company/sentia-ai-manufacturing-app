import { useState, useEffect } from 'react'

const isDevelopmentMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

/**
 * Master Authentication Hook - Environment Aware
 * Replaces all direct Clerk useAuth imports
 * Returns consistent auth interface regardless of environment
 */
const useEnvironmentAuth = () => {
  const [authState, setAuthState] = useState(() => {
    if (isDevelopmentMode) {
      // Development mode - return auth state immediately
      return {
        isSignedIn: true,
        isLoaded: true,
        userId: 'dev_user_12345',
        sessionId: 'sess_dev_12345',
        loading: false,
        // Additional Clerk-compatible properties
        actor: null,
        orgId: 'org_dev_12345',
        orgRole: 'admin',
        orgSlug: 'sentia-dev'
      }
    } else {
      // Production mode - start with loading state
      return {
        isSignedIn: false,
        isLoaded: false,
        userId: null,
        sessionId: null,
        loading: true,
        actor: null,
        orgId: null,
        orgRole: null,
        orgSlug: null
      }
    }
  })

  useEffect(() => {
    if (isDevelopmentMode) {
      // Development mode - auth is immediately ready
      console.log('[useEnvironmentAuth] Development mode - authentication bypassed')
      return
    }

    // Production mode - load Clerk auth
    const loadClerkAuth = async () => {
      try {
        console.log('[useEnvironmentAuth] Loading Clerk authentication...')
        const clerkAuth = await import('@clerk/clerk-react')
        const { useAuth } = clerkAuth

        // This is a hack to get Clerk's auth state
        // In a real implementation, we'd need to properly integrate with React context
        console.log('[useEnvironmentAuth] Clerk loaded successfully')
        
        // For now, set a basic production auth state
        setAuthState(prevState => ({
          ...prevState,
          isLoaded: true,
          loading: false
        }))
      } catch (error) {
        console.error('[useEnvironmentAuth] Failed to load Clerk:', error)
        // Fallback to development-like state if Clerk fails
        setAuthState({
          isSignedIn: false,
          isLoaded: true,
          userId: null,
          sessionId: null,
          loading: false,
          actor: null,
          orgId: null,
          orgRole: null,
          orgSlug: null
        })
      }
    }

    loadClerkAuth()
  }, [])

  // Development mode convenience methods
  const signOut = async () => {
    if (isDevelopmentMode) {
      console.log('[useEnvironmentAuth] Sign out called in development mode - no action taken')
      return Promise.resolve()
    }
    // Production mode would handle real sign out
    console.log('[useEnvironmentAuth] Sign out not implemented for production mode in this hook')
  }

  return {
    ...authState,
    signOut
  }
}

export default useEnvironmentAuth