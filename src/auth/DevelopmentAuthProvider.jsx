/**
 * Development Authentication Provider
 * Mocks Clerk authentication for development environment
 */

import React, { createContext, useContext } from 'react'
import { mockAuthState, mockUser, mockSession, mockOrganization } from './MockUser'

// Create contexts that match Clerk's structure
const AuthContext = createContext(mockAuthState)
const UserContext = createContext(mockUser)
const SessionContext = createContext(mockSession)
const OrganizationContext = createContext(mockOrganization)

// Mock useAuth hook
export const useAuth = () => {
  return useContext(AuthContext)
}

// Mock useUser hook
export const useUser = () => {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: useContext(UserContext),
  }
}

// Mock useSession hook
export const useSession = () => {
  return {
    isLoaded: true,
    session: useContext(SessionContext),
  }
}

// Mock useOrganization hook
export const useOrganization = () => {
  return {
    isLoaded: true,
    organization: useContext(OrganizationContext),
    membership: {
      id: 'mem_dev_12345',
      role: 'admin',
      permissions: ['org:sys_memberships:manage', 'org:sys_domains_manage'],
    },
  }
}

// Mock SignedIn component
export const SignedIn = ({ children }) => {
  return children
}

// Mock SignedOut component
export const SignedOut = () => {
  return null // Never show signed out content in development
}

// Mock RedirectToSignIn component
export const RedirectToSignIn = () => {
  console.warn('[Development Mode] RedirectToSignIn called - bypassing authentication')
  return null
}

// Mock SignIn component
export const SignIn = () => {
  console.warn('[Development Mode] SignIn component rendered - authentication bypassed')
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Development Mode</h2>
        <p className="text-gray-600 text-center mb-4">
          Authentication is bypassed in development mode.
        </p>
        <p className="text-sm text-gray-500 text-center">
          You are automatically signed in as: {mockUser.emailAddress}
        </p>
      </div>
    </div>
  )
}

// Mock SignUp component
export const SignUp = () => {
  console.warn('[Development Mode] SignUp component rendered - authentication bypassed')
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Development Mode</h2>
        <p className="text-gray-600 text-center mb-4">
          User registration is bypassed in development mode.
        </p>
        <p className="text-sm text-gray-500 text-center">
          You are automatically signed in as: {mockUser.emailAddress}
        </p>
      </div>
    </div>
  )
}

// Mock UserButton component
export const UserButton = () => {
  return (
    <div className="flex items-center space-x-2 bg-blue-100 px-3 py-2 rounded-lg">
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
        <span className="text-white text-sm font-medium">{mockUser.firstName?.[0] || 'D'}</span>
      </div>
      <div className="text-sm">
        <div className="font-medium text-gray-900">{mockUser.fullName}</div>
        <div className="text-gray-500">Development Mode</div>
      </div>
    </div>
  )
}

// Mock OrganizationSwitcher component
export const OrganizationSwitcher = () => {
  return (
    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded">
      {mockOrganization.name} (Dev)
    </div>
  )
}

// Main Development Auth Provider
export const DevelopmentAuthProvider = ({ children }) => {
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

// Export all the hooks and components that Clerk normally provides
export const ClerkProvider = DevelopmentAuthProvider
export const useClerk = () => ({
  loaded: true,
  user: mockUser,
  session: mockSession,
  organization: mockOrganization,
  signOut: () => {
    console.warn('[Development Mode] Sign out called - no action taken')
    return Promise.resolve()
  },
  openSignIn: () => {
    console.warn('[Development Mode] Open sign in called - no action taken')
  },
  openSignUp: () => {
    console.warn('[Development Mode] Open sign up called - no action taken')
  },
  openUserProfile: () => {
    console.warn('[Development Mode] Open user profile called - no action taken')
  },
})

export default DevelopmentAuthProvider
