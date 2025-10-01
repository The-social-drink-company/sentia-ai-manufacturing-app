import { Navigate } from 'react-router-dom'
import useEnvironmentAuth from '@/hooks/useEnvironmentAuth'

const AuthGuard = ({ children }) => {
  const { isSignedIn } = useEnvironmentAuth()

  if (isSignedIn === true) {
    return children
  }

  if (isSignedIn === false) {
    return <Navigate to="/sign-in" replace />
  }

  return null
}

export default AuthGuard
