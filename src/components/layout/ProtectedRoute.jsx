import { RedirectToSignIn } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, mode } = useAuth()

  if (mode === 'clerk' && !isAuthenticated) {
    const redirectUrl = `${location.pathname}${location.search}${location.hash}` || '/dashboard'
    return <RedirectToSignIn redirectUrl={redirectUrl} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
