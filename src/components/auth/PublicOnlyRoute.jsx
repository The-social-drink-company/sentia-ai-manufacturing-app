/**
 * PublicOnlyRoute - Route wrapper for sign-in/sign-up pages
 *
 * Redirects authenticated users to dashboard, preventing access to auth pages
 * when already logged in. Shows loading screen while checking auth status.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Sign-in or sign-up page component
 * @returns {JSX.Element}
 *
 * @example
 * <Route path="/sign-in" element={
 *   <PublicOnlyRoute>
 *     <SignInPage />
 *   </PublicOnlyRoute>
 * } />
 */
import { Navigate } from 'react-router-dom'
import useEnvironmentAuth from '@/hooks/useEnvironmentAuth'
import LoadingScreen from '@/components/LoadingScreen'

const PublicOnlyRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useEnvironmentAuth()

  // Show loading screen while checking authentication status
  if (!isLoaded) {
    return <LoadingScreen message="Loading..." />
  }

  // If user is already signed in, redirect to dashboard
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />
  }

  // User is not signed in - show sign-in or sign-up page
  return children
}

export default PublicOnlyRoute
