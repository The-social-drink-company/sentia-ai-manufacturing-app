import { useAuth } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import LoadingScreen from '@/components/LoadingScreen'

const PublicOnlyRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen message="Loading..." />
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PublicOnlyRoute
