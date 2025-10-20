/**
 * Clerk API Mock for Unit Tests
 *
 * BMAD-MULTITENANT-002 Story 10: Test Infrastructure
 *
 * Provides mock implementations of Clerk authentication APIs
 * for testing tenant middleware without requiring live Clerk connections.
 *
 * @module tests/mocks/clerk.mock
 */

export interface MockClerkSession {
  id: string
  userId: string
  status: 'active' | 'expired' | 'removed'
  lastActiveAt: number
  expireAt: number
  abandonAt: number
  createdAt: number
  updatedAt: number
}

export interface MockClerkUser {
  id: string
  firstName: string | null
  lastName: string | null
  emailAddresses: Array<{
    id: string
    emailAddress: string
    verification: { status: string }
  }>
  primaryEmailAddressId: string
  username: string | null
  imageUrl: string
  createdAt: number
  updatedAt: number
}

export interface MockClerkOrganization {
  id: string
  name: string
  slug: string
  imageUrl: string
  hasImage: boolean
  createdAt: number
  updatedAt: number
  publicMetadata: Record<string, any>
  privateMetadata: Record<string, any>
}

export interface MockClerkOrganizationMembership {
  id: string
  organization: MockClerkOrganization
  role: 'org:admin' | 'org:member'
  publicMetadata: Record<string, any>
  privateMetadata: Record<string, any>
  createdAt: number
  updatedAt: number
}

/**
 * Mock Clerk Client
 *
 * Simulates Clerk API responses for testing
 */
export class MockClerkClient {
  private sessions: Map<string, MockClerkSession> = new Map()
  private users: Map<string, MockClerkUser> = new Map()
  private organizations: Map<string, MockClerkOrganization> = new Map()
  private memberships: Map<string, MockClerkOrganizationMembership[]> = new Map()

  /**
   * Add a mock session for testing
   */
  addSession(session: MockClerkSession): void {
    this.sessions.set(session.id, session)
  }

  /**
   * Add a mock user for testing
   */
  addUser(user: MockClerkUser): void {
    this.users.set(user.id, user)
  }

  /**
   * Add a mock organization for testing
   */
  addOrganization(org: MockClerkOrganization): void {
    this.organizations.set(org.id, org)
  }

  /**
   * Add mock organization membership for testing
   */
  addMembership(userId: string, membership: MockClerkOrganizationMembership): void {
    const existing = this.memberships.get(userId) || []
    existing.push(membership)
    this.memberships.set(userId, existing)
  }

  /**
   * Mock sessions.verifySession
   */
  async verifySession(sessionId: string): Promise<MockClerkSession> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }
    if (session.status !== 'active') {
      throw new Error('Session is not active')
    }
    return session
  }

  /**
   * Mock users.getUser
   */
  async getUser(userId: string): Promise<MockClerkUser> {
    const user = this.users.get(userId)
    if (!user) {
      throw new Error('User not found')
    }
    return user
  }

  /**
   * Mock users.getOrganizationMembershipList
   */
  async getOrganizationMembershipList(userId: string): Promise<MockClerkOrganizationMembership[]> {
    return this.memberships.get(userId) || []
  }

  /**
   * Clear all mock data
   */
  clear(): void {
    this.sessions.clear()
    this.users.clear()
    this.organizations.clear()
    this.memberships.clear()
  }
}

/**
 * Create a mock Clerk session
 */
export function createMockSession(overrides?: Partial<MockClerkSession>): MockClerkSession {
  return {
    id: 'sess_test123',
    userId: 'user_test123',
    status: 'active',
    lastActiveAt: Date.now(),
    expireAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    abandonAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
    createdAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
    updatedAt: Date.now(),
    ...overrides
  }
}

/**
 * Create a mock Clerk user
 */
export function createMockUser(overrides?: Partial<MockClerkUser>): MockClerkUser {
  return {
    id: 'user_test123',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [
      {
        id: 'email_test123',
        emailAddress: 'test@example.com',
        verification: { status: 'verified' }
      }
    ],
    primaryEmailAddressId: 'email_test123',
    username: 'testuser',
    imageUrl: 'https://example.com/avatar.jpg',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    updatedAt: Date.now(),
    ...overrides
  }
}

/**
 * Create a mock Clerk organization
 */
export function createMockOrganization(overrides?: Partial<MockClerkOrganization>): MockClerkOrganization {
  return {
    id: 'org_test123',
    name: 'Test Organization',
    slug: 'test-org',
    imageUrl: 'https://example.com/org-logo.jpg',
    hasImage: true,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publicMetadata: {},
    privateMetadata: {},
    ...overrides
  }
}

/**
 * Create a mock organization membership
 */
export function createMockMembership(
  organization: MockClerkOrganization,
  role: 'org:admin' | 'org:member' = 'org:member'
): MockClerkOrganizationMembership {
  return {
    id: `mem_${organization.id}_test123`,
    organization,
    role,
    publicMetadata: {},
    privateMetadata: {},
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now()
  }
}

/**
 * Create a fully configured mock Clerk client for testing
 */
export function createMockClerkClient(): MockClerkClient {
  const client = new MockClerkClient()

  // Add default test session
  client.addSession(createMockSession())

  // Add default test user
  client.addUser(createMockUser())

  // Add default test organization
  const org = createMockOrganization()
  client.addOrganization(org)

  // Add default membership
  client.addMembership('user_test123', createMockMembership(org, 'org:member'))

  return client
}
