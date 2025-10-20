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

/**
 * Get all members of an organization
 *
 * @param organizationId - Clerk organization ID
 * @param options - Pagination options
 * @returns Array of organization memberships
 */
export async function getOrganizationMembers(
  organizationId: string,
  options?: {
    limit?: number
    offset?: number
  }
) {
  try {
    const response = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId,
      limit: options?.limit || 50,
      offset: options?.offset || 0
    })

    return response.data || []
  } catch (error) {
    console.error('[Clerk] Error fetching organization members:', error)
    return []
  }
}

/**
 * Get user by email address
 *
 * @param email - User's email address
 * @returns User object or null
 */
export async function getUserByEmail(email: string) {
  try {
    const users = await clerkClient.users.getUserList({
      emailAddress: [email]
    })

    return users.data[0] || null
  } catch (error) {
    console.error('[Clerk] Error fetching user by email:', error)
    return null
  }
}

/**
 * Check if a user is a member of an organization
 *
 * @param userId - Clerk user ID
 * @param organizationId - Clerk organization ID
 * @returns True if user is a member, false otherwise
 */
export async function isUserMemberOfOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const memberships = await getUserOrganizations(userId)
    return memberships.some(
      (membership) => membership.organization.id === organizationId
    )
  } catch (error) {
    console.error('[Clerk] Error checking organization membership:', error)
    return false
  }
}

/**
 * Get user's role in an organization
 *
 * @param userId - Clerk user ID
 * @param organizationId - Clerk organization ID
 * @returns Role string or null
 */
export async function getUserOrganizationRole(
  userId: string,
  organizationId: string
): Promise<string | null> {
  try {
    const memberships = await getUserOrganizations(userId)
    const membership = memberships.find(
      (m) => m.organization.id === organizationId
    )

    return membership?.role || null
  } catch (error) {
    console.error('[Clerk] Error fetching user organization role:', error)
    return null
  }
}

/**
 * Invite a user to an organization
 *
 * @param organizationId - Clerk organization ID
 * @param emailAddress - Email address to invite
 * @param role - Role to assign
 * @returns Invitation object or null
 */
export async function inviteUserToOrganization(
  organizationId: string,
  emailAddress: string,
  role: string = 'org:member'
) {
  try {
    const invitation = await clerkClient.organizations.createOrganizationInvitation({
      organizationId,
      emailAddress,
      role
    })

    return invitation
  } catch (error) {
    console.error('[Clerk] Error inviting user to organization:', error)
    return null
  }
}
