import { createContext } from 'react'

import { mockAuthState, mockUser, mockSession, mockOrganization } from './MockUser'

export const AuthContext = createContext(mockAuthState)
export const UserContext = createContext(mockUser)
export const SessionContext = createContext(mockSession)
export const OrganizationContext = createContext(mockOrganization)
