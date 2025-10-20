import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

export const useRequireAuth = (redirectUrl = '/sign-in') => {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate(redirectUrl)
    }
  }, [isLoaded, isSignedIn, navigate, redirectUrl])

  return { isLoaded, isSignedIn }
}
