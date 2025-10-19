import { useEffect } from 'react'
import { useAuth } from './useAuth'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Hook to automatically redirect unauthenticated users to sign-in page
 *
 * This hook monitors authentication state and redirects users to the sign-in
 * page if they're not authenticated and trying to access a protected route.
 * It preserves the original destination URL for post-login redirect.
 *
 * @returns {Object} Authentication state
 * @returns {boolean} return.isLoaded - Whether authentication state is loaded
 * @returns {boolean} return.isSignedIn - Whether user is authenticated
 *
 * @example
 * function ProtectedPage() {
 *   const { isLoaded, isSignedIn } = useAuthRedirect()
 *
 *   if (!isLoaded) return <LoadingScreen />
 *   if (!isSignedIn) return null // Will redirect
 *
 *   return <div>Protected Content</div>
 * }
 */
export const useAuthRedirect = () => {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Only redirect if auth state is loaded and user is not signed in
    // Avoid redirecting on sign-in/sign-up pages to prevent loops
    if (isLoaded && !isSignedIn && !location.pathname.startsWith('/sign-')) {
      const from = location.pathname + location.search
      navigate('/sign-in', { state: { from } })
    }
  }, [isLoaded, isSignedIn, location, navigate])

  return { isLoaded, isSignedIn }
}
