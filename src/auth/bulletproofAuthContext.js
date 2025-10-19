import { createContext } from 'react'

export const AuthContext = createContext(null)

export const FALLBACK_AUTH_STATE = {
  isLoaded: true,
  isSignedIn: false,
  userId: 'guest_user',
  sessionId: 'guest_session',
  user: {
    id: 'guest_user',
    firstName: 'Guest',
    lastName: 'User',
    fullName: 'Guest User',
    emailAddresses: [{ emailAddress: 'guest@sentia.local' }],
    publicMetadata: { role: 'viewer' },
  },
  signOut: () => Promise.resolve(),
  getToken: () => Promise.resolve(null),
  mode: 'fallback',
}

export const getPermissionsForRole = role => {
  const permissions = {
    admin: ['*'],
    manager: ['read', 'write', 'update', 'delete', 'manage_team'],
    operator: ['read', 'write', 'update'],
    viewer: ['read'],
  }

  return permissions[role] || permissions.viewer
}
