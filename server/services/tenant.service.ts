/**
 * Tenant Service
 *
 * Handles tenant creation, updates, and management operations.
 *
 * @module server/services/tenant.service
 */

import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

export interface CreateTenantInput {
  name: string
  slug: string
  clerkOrganizationId: string
  subscriptionTier: 'starter' | 'professional' | 'enterprise'
  ownerEmail: string
}

export interface UpdateTenantInput {
  name?: string
  subscriptionTier?: 'starter' | 'professional' | 'enterprise'
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended'
  maxUsers?: number
  maxEntities?: number
  features?: Record<string, boolean>
}

export class TenantService {
  /**
   * Create a new tenant with schema
   */
  async createTenant(input: CreateTenantInput) {
    const { name, slug, clerkOrganizationId, subscriptionTier, ownerEmail } = input

    // Generate schema name
    const schemaName = `tenant_${this.generateSchemaId()}`

    // Set tier-based limits and features
    const { maxUsers, maxEntities, features } = this.getTierConfiguration(subscriptionTier)

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    // Create tenant in public schema
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        schemaName,
        clerkOrganizationId,
        subscriptionTier,
        subscriptionStatus: 'trial',
        trialEndsAt,
        maxUsers,
        maxEntities,
        features
      }
    })

    // Create tenant schema using raw SQL
    await prisma.$executeRawUnsafe(`SELECT create_tenant_schema($1::UUID)`, tenant.id)

    // Create default company in tenant schema
    await this.createDefaultCompany(schemaName, name)

    console.log(`✅ Tenant created: ${slug} (${schemaName})`)

    return tenant
  }

  /**
   * Update tenant metadata
   */
  async updateTenant(tenantId: string, input: UpdateTenantInput) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...input,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Tenant updated: ${tenant.slug}`)

    return tenant
  }

  /**
   * Get tenant by Clerk organization ID
   */
  async getTenantByClerkOrgId(clerkOrganizationId: string) {
    return await prisma.tenant.findUnique({
      where: { clerkOrganizationId }
    })
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string) {
    return await prisma.tenant.findUnique({
      where: { slug }
    })
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const existing = await prisma.tenant.findUnique({
      where: { slug }
    })
    return !existing
  }

  /**
   * Soft delete tenant
   */
  async softDeleteTenant(tenantId: string) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        deletedAt: new Date(),
        subscriptionStatus: 'cancelled'
      }
    })

    console.log(`⚠️ Tenant soft-deleted: ${tenant.slug}`)

    return tenant
  }

  /**
   * Get tier configuration (limits and features)
   */
  private getTierConfiguration(tier: 'starter' | 'professional' | 'enterprise') {
    const configs = {
      starter: {
        maxUsers: 5,
        maxEntities: 500,
        features: {
          ai_forecasting: false,
          what_if: false,
          api_integrations: true,
          advanced_reports: false,
          custom_integrations: false
        }
      },
      professional: {
        maxUsers: 25,
        maxEntities: 5000,
        features: {
          ai_forecasting: true,
          what_if: true,
          api_integrations: true,
          advanced_reports: true,
          custom_integrations: false
        }
      },
      enterprise: {
        maxUsers: 100,
        maxEntities: null, // unlimited
        features: {
          ai_forecasting: true,
          what_if: true,
          api_integrations: true,
          advanced_reports: true,
          custom_integrations: true
        }
      }
    }

    return configs[tier]
  }

  /**
   * Generate random schema ID
   */
  private generateSchemaId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  /**
   * Create default company in tenant schema
   */
  private async createDefaultCompany(schemaName: string, companyName: string) {
    try {
      await prisma.$executeRawUnsafe(
        `
        SET search_path TO "${schemaName}", public;

        INSERT INTO companies (name, is_active)
        VALUES ($1, true)
        ON CONFLICT DO NOTHING;
        `,
        companyName
      )

      console.log(`✅ Default company created in ${schemaName}`)
    } catch (error) {
      console.error(`❌ Error creating default company:`, error)
      // Non-fatal - tenant can still function without default company
    }
  }
}

export const tenantService = new TenantService()
