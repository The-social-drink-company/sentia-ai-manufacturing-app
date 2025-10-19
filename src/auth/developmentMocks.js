import React, { useContext } from 'react'

import { AuthContext, UserContext, SessionContext, OrganizationContext } from './developmentContext'
import { mockAuthState, mockUser, mockSession, mockOrganization } from './MockUser'
import DevelopmentAuthProvider from './DevelopmentAuthProvider.jsx'

export function useAuth() {
  return useContext(AuthContext)
}

export function useUser() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: useContext(UserContext),
  }
}

export function useSession() {
  return {
    isLoaded: true,
    session: useContext(SessionContext),
  }
}

export function useOrganization() {
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

export function SignedIn({ children }) {
  return children
}

export function SignedOut() {
  return null
}

export function RedirectToSignIn() {
  console.warn('[Development Mode] RedirectToSignIn called - bypassing authentication')
  return null
}

export function SignIn() {
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

export function SignUp() {
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

export function UserButton() {
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

export function OrganizationSwitcher() {
  return (
    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded">
      {mockOrganization.name} (Dev)
    </div>
  )
}

export const ClerkProvider = DevelopmentAuthProvider

export function useClerk() {
  return {
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
  }
}
