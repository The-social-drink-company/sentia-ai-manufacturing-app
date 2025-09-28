import { useAuth } from '@clerk/clerk-react'

const useAuthRole = () => {
  const { isSignedIn } = useAuth()
  return {
    isAuthorized: Boolean(isSignedIn),
    role: isSignedIn ? 'member' : 'guest'
  }
}

export default useAuthRole
