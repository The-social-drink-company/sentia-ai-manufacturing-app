import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate, useLocation } from 'react-router-dom'

export const useAuthRedirect = () => {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoaded && !isSignedIn && !location.pathname.startsWith('/sign-')) {
      const from = `${location.pathname}${location.search}`
      navigate('/sign-in', { state: { from } })
    }
  }, [isLoaded, isSignedIn, location, navigate])

  return { isLoaded, isSignedIn }
}
