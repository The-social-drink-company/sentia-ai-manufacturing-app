import { Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

const AuthGuard = ({ children }) => {
  const { isSignedIn } = useAuth()

  if (isSignedIn === true) {
    return children
  }

  if (isSignedIn === false) {
    return <Navigate to="/sign-in" replace />
  }

  return null
}

export default AuthGuard
