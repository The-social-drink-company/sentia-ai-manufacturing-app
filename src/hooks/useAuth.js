import { useMemo } from 'react'
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'

function mapClerkUser(user) {
  if (!user) {
    return null
  }

  const email = user.primaryEmailAddress?.emailAddress ?? ''
  const roleMetadata = user.publicMetadata?.role
  const role = typeof roleMetadata === 'string' ? roleMetadata : 'viewer'

  return {
    id: user.id,
    firstName: user.firstName ?? user.username ?? 'Sentia',
    lastName: user.lastName ?? '',
    email,
    role,
  }
}

export function useAuth() {
  const auth = useClerkAuth()
  const { isLoaded: isUserLoaded, user } = useUser()

  const mappedUser = useMemo(() => mapClerkUser(user), [user])
  const isLoaded = auth.isLoaded && isUserLoaded

  return {
    mode: 'clerk',
    isLoaded,
    isAuthenticated: auth.isSignedIn,
    isSignedIn: auth.isSignedIn,
    sessionId: auth.sessionId ?? null,
    user: mappedUser,
    signOut: auth.signOut,
    getToken: auth.getToken,
  }
}
