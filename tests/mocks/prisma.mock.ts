/**
 * Prisma Client Mock for Unit Tests
 *
 * BMAD-MULTITENANT-002 Story 10: Test Infrastructure
 *
 * Provides mock implementations of Prisma client operations
 * for testing tenant middleware and services without requiring
 * a live database connection.
 *
 * @module tests/mocks/prisma.mock
 */

import { vi } from 'vitest'

export interface MockTenant {
  id: string
  name: string
  slug: string
  schemaName: string
  clerkOrganizationId: string
  subscriptionTier: 'starter' | 'professional' | 'enterprise'
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended'
  trialEndsAt: Date | null
  maxUsers: number
  maxEntities: number
  features: Record<string, boolean>
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface MockUser {
  id: string
  clerkUserId: string
  tenantId: string
  email: string
  firstName: string | null
  lastName: string | null
  role: 'owner' | 'admin' | 'member' | 'viewer'
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Mock Prisma Client
 *
 * Simulates Prisma database operations for testing
 */
export class MockPrismaClient {
  private tenants: Map<string, MockTenant> = new Map()
  private users: Map<string, MockUser> = new Map()
  private searchPath: string = 'public'

  // Mock Prisma operations
  tenant = {
    findUnique: vi.fn(async ({ where }: any) => {
      if (where.id) {
        return this.tenants.get(where.id) || null
      }
      if (where.clerkOrganizationId) {
        return Array.from(this.tenants.values()).find(
          t => t.clerkOrganizationId === where.clerkOrganizationId
        ) || null
      }
      if (where.slug) {
        return Array.from(this.tenants.values()).find(
          t => t.slug === where.slug
        ) || null
      }
      return null
    }),

    create: vi.fn(async ({ data }: any) => {
      const tenant: MockTenant = {
        id: data.id || `tenant_${Date.now()}`,
        name: data.name,
        slug: data.slug,
        schemaName: data.schemaName,
        clerkOrganizationId: data.clerkOrganizationId,
        subscriptionTier: data.subscriptionTier || 'starter',
        subscriptionStatus: data.subscriptionStatus || 'trial',
        trialEndsAt: data.trialEndsAt || null,
        maxUsers: data.maxUsers || 5,
        maxEntities: data.maxEntities || 500,
        features: data.features || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }
      this.tenants.set(tenant.id, tenant)
      return tenant
    }),

    update: vi.fn(async ({ where, data }: any) => {
      const tenant = this.tenants.get(where.id)
      if (!tenant) {
        throw new Error('Tenant not found')
      }
      const updated = { ...tenant, ...data, updatedAt: new Date() }
      this.tenants.set(tenant.id, updated)
      return updated
    }),

    delete: vi.fn(async ({ where }: any) => {
      const tenant = this.tenants.get(where.id)
      if (!tenant) {
        throw new Error('Tenant not found')
      }
      this.tenants.delete(where.id)
      return tenant
    })
  }

  user = {
    findUnique: vi.fn(async ({ where }: any) => {
      if (where.id) {
        return this.users.get(where.id) || null
      }
      if (where.clerkUserId) {
        return Array.from(this.users.values()).find(
          u => u.clerkUserId === where.clerkUserId
        ) || null
      }
      return null
    }),

    create: vi.fn(async ({ data }: any) => {
      const user: MockUser = {
        id: data.id || `user_${Date.now()}`,
        clerkUserId: data.clerkUserId,
        tenantId: data.tenantId,
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        role: data.role || 'viewer',
        isActive: data.isActive !== undefined ? data.isActive : true,
        lastLoginAt: data.lastLoginAt || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      this.users.set(user.id, user)
      return user
    }),

    update: vi.fn(async ({ where, data }: any) => {
      const user = this.users.get(where.id) ||
                   Array.from(this.users.values()).find(u => u.clerkUserId === where.clerkUserId)
      if (!user) {
        throw new Error('User not found')
      }
      const updated = { ...user, ...data, updatedAt: new Date() }
      this.users.set(user.id, updated)
      return updated
    })
  }

  $executeRawUnsafe = vi.fn(async (sql: string, ...params: any[]) => {
    // Mock SET search_path
    if (sql.includes('SET search_path')) {
      const match = sql.match(/SET search_path TO "?([^",\s]+)"?/)
      if (match) {
        this.searchPath = match[1]
      }
      return
    }

    // Mock CREATE SCHEMA
    if (sql.includes('CREATE SCHEMA')) {
      return
    }

    // Mock DROP SCHEMA
    if (sql.includes('DROP SCHEMA')) {
      return
    }

    // Mock table creation
    if (sql.includes('CREATE TABLE')) {
      return
    }

    // Mock index creation
    if (sql.includes('CREATE INDEX')) {
      return
    }

    // Default: return empty array
    return []
  })

  $queryRawUnsafe = vi.fn(async (sql: string, ...params: any[]) => {
    // Mock SHOW search_path
    if (sql.includes('SHOW search_path')) {
      return [{ search_path: this.searchPath }]
    }

    // Mock schema existence check
    if (sql.includes('information_schema.schemata')) {
      return [{ exists: true }]
    }

    // Mock SELECT version()
    if (sql.includes('SELECT version()')) {
      return [{ version: 'PostgreSQL 17.0 (Mock)' }]
    }

    // Mock SELECT current_database()
    if (sql.includes('SELECT current_database()')) {
      return [{ current_database: 'test_db' }]
    }

    // Default: return empty array
    return []
  })

  $queryRaw = vi.fn(async (sql: any, ...params: any[]) => {
    // Handle template literal queries
    return this.$queryRawUnsafe(sql.join('?'), ...params)
  })

  $disconnect = vi.fn(async () => {
    // Mock disconnect
  })

  /**
   * Add a mock tenant for testing
   */
  addTenant(tenant: MockTenant): void {
    this.tenants.set(tenant.id, tenant)
  }

  /**
   * Add a mock user for testing
   */
  addUser(user: MockUser): void {
    this.users.set(user.id, user)
  }

  /**
   * Get current search_path (for testing)
   */
  getSearchPath(): string {
    return this.searchPath
  }

  /**
   * Clear all mock data
   */
  clear(): void {
    this.tenants.clear()
    this.users.clear()
    this.searchPath = 'public'
    vi.clearAllMocks()
  }
}

/**
 * Create a mock tenant
 */
export function createMockTenant(overrides?: Partial<MockTenant>): MockTenant {
  return {
    id: 'tenant_test123',
    name: 'Test Tenant',
    slug: 'test-tenant',
    schemaName: 'tenant_abc123def456',
    clerkOrganizationId: 'org_test123',
    subscriptionTier: 'professional',
    subscriptionStatus: 'active',
    trialEndsAt: null,
    maxUsers: 25,
    maxEntities: 5000,
    features: {
      basic_forecasting: true,
      ai_forecasting: true,
      what_if_analysis: true,
      multi_entity: false,
      api_access: false,
      white_label: false,
      priority_support: true,
      advanced_reports: false,
      custom_integrations: false
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
    ...overrides
  }
}

/**
 * Create a mock user
 */
export function createMockDbUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: 'dbuser_test123',
    clerkUserId: 'user_test123',
    tenantId: 'tenant_test123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'member',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides
  }
}

/**
 * Create a fully configured mock Prisma client for testing
 */
export function createMockPrismaClient(): MockPrismaClient {
  const client = new MockPrismaClient()

  // Add default test tenant
  client.addTenant(createMockTenant())

  // Add default test user
  client.addUser(createMockDbUser())

  return client
}
