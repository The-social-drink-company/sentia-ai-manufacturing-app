import { useState, useEffect } from 'react'

const isDevelopmentMode = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'

const useAuthRole = () => {
  const [authData, setAuthData] = useState({
    isAuthorized: isDevelopmentMode,
    role: isDevelopmentMode ? 'admin' : 'guest',
    loading: !isDevelopmentMode,
  })

  useEffect(() => {
    const loadAuth = async () => {
      if (isDevelopmentMode) {
        // Development mode - use mock data
        const { mockUser } = await import('../auth/MockUser.js')
        setAuthData({
          isAuthorized: true,
          role: mockUser.publicMetadata.role || 'admin',
          user: mockUser,
          loading: false,
        })
      } else {
        // Production mode - use real Clerk auth
        try {
          const { useAuth } = await import('@clerk/clerk-react')
          // TODO: Refactor to avoid calling hook inside async function
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const { isSignedIn, user } = useAuth()
          setAuthData({
            isAuthorized: Boolean(isSignedIn),
            role: isSignedIn ? user?.publicMetadata?.role || 'member' : 'guest',
            user: user,
            loading: false,
          })
        } catch (error) {
          console.error('[useAuthRole] Failed to load Clerk auth:', error)
          setAuthData({
            isAuthorized: false,
            role: 'guest',
            loading: false,
          })
        }
      }
    }

    loadAuth()
  }, [])

  return authData
}

export default useAuthRole
