/**
 * Tenant-related TypeScript type definitions
 *
 * @module server/types/tenant.types
 */

export interface Tenant {
  id: string
  slug: string
  name: string
  schemaName: string
  clerkOrganizationId: string
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
  trialEndsAt?: Date | null
  maxUsers?: number | null
  maxEntities?: number | null
  features?: TenantFeatures | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export interface TenantFeatures {
  ai_forecasting: boolean
  what_if: boolean
  api_integrations: boolean
  advanced_reports: boolean
  custom_integrations: boolean
}

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise'

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended'

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface TenantContext {
  tenant: Tenant
  tenantSchema: string
  userRole: UserRole
  organizationId: string
  userId: string
}

export interface User {
  id: string
  clerkUserId: string
  tenantId: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface AuditLog {
  id: string
  tenantId: string
  userId: string | null
  action: string
  resourceType: string
  resourceId: string
  ipAddress: string | null
  userAgent: string | null
  metadata: Record<string, any> | null
  createdAt: Date
}
