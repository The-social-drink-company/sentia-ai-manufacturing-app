/**
 * Clerk SDK Configuration
 *
 * @module src/lib/clerk
 */

import { createClerkClient } from '@clerk/backend'

const clerkSecretKey = import.meta.env.VITE_CLERK_SECRET_KEY

if (!clerkSecretKey) {
  console.warn('VITE_CLERK_SECRET_KEY is not set - Clerk functionality will be limited')
}

export const clerkClient = createClerkClient({
  secretKey: clerkSecretKey || ''
})

/**
 * Helper to verify Clerk session
 */
export async function verifyClerkSession(sessionToken: string) {
  try {
    const session = await clerkClient.sessions.verifySession(sessionToken, {
      token: sessionToken
    })
    return session
  } catch (error) {
    console.error('Error verifying Clerk session:', error)
    return null
  }
}

/**
 * Helper to get user organizations
 */
export async function getUserOrganizations(userId: string) {
  try {
    const memberships = await clerkClient.users.getOrganizationMembershipList({
      userId
    })
    return memberships.data
  } catch (error) {
    console.error('Error fetching user organizations:', error)
    return []
  }
}

/**
 * Helper to get organization by ID
 */
export async function getOrganization(organizationId: string) {
  try {
    const organization = await clerkClient.organizations.getOrganization({
      organizationId
    })
    return organization
  } catch (error) {
    console.error('Error fetching organization:', error)
    return null
  }
}

/**
 * Helper to get user by ID
 */
export async function getUser(userId: string) {
  try {
    const user = await clerkClient.users.getUser(userId)
    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * Map Clerk role to tenant role
 */
export function mapClerkRoleToTenantRole(clerkRole: string): 'owner' | 'admin' | 'member' | 'viewer' {
  switch (clerkRole) {
    case 'org:admin':
      return 'admin'
    case 'org:member':
      return 'member'
    case 'org:viewer':
      return 'viewer'
    default:
      return 'member'
  }
}
