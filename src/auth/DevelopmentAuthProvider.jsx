/**
 * Development Authentication Provider
 * Mocks Clerk authentication for development environment
 */

import React from 'react'

import { AuthContext, UserContext, SessionContext, OrganizationContext } from './developmentContext'
import { mockAuthState, mockUser, mockSession, mockOrganization } from './MockUser'

export function DevelopmentAuthProvider({ children }) {
  console.log('[Development Mode] Authentication provider initialized with mock data')

  return (
    <AuthContext.Provider value={mockAuthState}>
      <UserContext.Provider value={mockUser}>
        <SessionContext.Provider value={mockSession}>
          <OrganizationContext.Provider value={mockOrganization}>
            {children}
          </OrganizationContext.Provider>
        </SessionContext.Provider>
      </UserContext.Provider>
    </AuthContext.Provider>
  )
}

export default DevelopmentAuthProvider
