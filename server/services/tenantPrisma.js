/**
 * Tenant-Aware Prisma Service for CapLiquify Multi-Tenant System
 *
 * Provides utilities for executing database queries in tenant-specific schemas.
 * Handles connection pooling, search_path management, and schema isolation.
 *
 * @module server/services/tenantPrisma
 */

import { PrismaClient } from '@prisma/client'

/**
 * Tenant-Aware Prisma Service
 *
 * Manages Prisma clients for multi-tenant database operations.
 * Each tenant gets their own schema, and this service ensures queries
 * are executed in the correct schema context.
 *
 * @class TenantPrismaService
 *
 * @example
 * import { tenantPrisma } from './services/tenantPrisma.js'
 *
 * // Query tenant's products
 * const products = await tenantPrisma.queryRaw(
 *   'tenant_abc123',
 *   'SELECT * FROM products WHERE is_active = true'
 * )
 */
export class TenantPrismaService {
  /**
   * Creates a new TenantPrismaService instance
   * Initializes the global Prisma client for public schema queries
   */
  constructor() {
    // Global client for public schema (tenants, users, subscriptions, audit_logs)
    this.globalClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })

    // Connection pool for tenant clients
    this.clientPool = new Map()
  }

  /**
   * Get or Create Prisma Client for Tenant
   *
   * Returns a Prisma client configured for a specific tenant schema.
   * Implements connection pooling to avoid creating too many connections.
   *
   * @param {string} schemaName - Tenant schema name (e.g., 'tenant_123abc')
   * @returns {Promise<PrismaClient>} Prisma client with search_path set to tenant schema
   *
   * @example
   * const client = await tenantPrisma.getClient('tenant_abc123')
   * const products = await client.$queryRaw`SELECT * FROM products`
   */
  async getClient(schemaName) {
    // Check if client already exists in pool
    if (this.clientPool.has(schemaName)) {
      return this.clientPool.get(schemaName)
    }

    // Create new client for this tenant
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : []
    })

    // Set search path to tenant schema
    await client.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`)

    // Add to pool (limit pool size to prevent memory issues)
    if (this.clientPool.size >= 50) {
      // Remove oldest client
      const firstKey = this.clientPool.keys().next().value
      const oldClient = this.clientPool.get(firstKey)
      await oldClient.$disconnect()
      this.clientPool.delete(firstKey)
    }

    this.clientPool.set(schemaName, client)
    return client
  }

  /**
   * Execute Raw SQL Query in Tenant Schema
   *
   * Executes a raw SQL query in the specified tenant schema.
   * Use for INSERT, UPDATE, DELETE operations that don't return data.
   *
   * @param {string} schemaName - Tenant schema name
   * @param {string} query - SQL query string
   * @param {Array} [params=[]] - Query parameters (prevents SQL injection)
   * @returns {Promise<number>} Number of affected rows
   *
   * @example
   * // Insert product with parameterized query
   * const rowsAffected = await tenantPrisma.executeRaw(
   *   'tenant_abc123',
   *   'INSERT INTO products (sku, name, unit_price) VALUES ($1, $2, $3)',
   *   ['WIDGET-001', 'Premium Widget', 49.99]
   * )
   */
  async executeRaw(schemaName, query, params = []) {
    const client = await this.getClient(schemaName)

    try {
      const result = await client.$executeRawUnsafe(query, ...params)
      return result
    } catch (error) {
      console.error(`[tenantPrisma] executeRaw error in schema ${schemaName}:`, error)
      throw new Error(`Database query failed: ${error.message}`)
    }
  }

  /**
   * Query Raw SQL in Tenant Schema
   *
   * Executes a raw SQL query and returns results.
   * Use for SELECT operations that return data.
   *
   * @param {string} schemaName - Tenant schema name
   * @param {string} query - SQL query string
   * @param {Array} [params=[]] - Query parameters (prevents SQL injection)
   * @returns {Promise<Array>} Query results as array of objects
   *
   * @example
   * // Get active products with inventory
   * const products = await tenantPrisma.queryRaw(
   *   'tenant_abc123',
   *   `SELECT p.*, i.quantity_on_hand
   *    FROM products p
   *    LEFT JOIN inventory i ON i.product_id = p.id
   *    WHERE p.is_active = true
   *    ORDER BY p.name`
   * )
   */
  async queryRaw(schemaName, query, params = []) {
    const client = await this.getClient(schemaName)

    try {
      const result = await client.$queryRawUnsafe(query, ...params)
      return result
    } catch (error) {
      console.error(`[tenantPrisma] queryRaw error in schema ${schemaName}:`, error)
      throw new Error(`Database query failed: ${error.message}`)
    }
  }

  /**
   * Transaction Support for Tenant Operations
   *
   * Executes multiple queries in a transaction within a tenant schema.
   * Automatically rolls back if any query fails.
   *
   * @param {string} schemaName - Tenant schema name
   * @param {Function} callback - Async function that receives Prisma client
   * @returns {Promise<any>} Result from callback function
   *
   * @example
   * // Create product and initial inventory in transaction
   * await tenantPrisma.transaction('tenant_abc123', async (client) => {
   *   const product = await client.$queryRaw`
   *     INSERT INTO products (sku, name, unit_price)
   *     VALUES ('WIDGET-001', 'Premium Widget', 49.99)
   *     RETURNING *
   *   `
   *
   *   await client.$queryRaw`
   *     INSERT INTO inventory (product_id, quantity_on_hand, warehouse_location)
   *     VALUES (${product[0].id}, 100, 'Warehouse A')
   *   `
   *
   *   return product[0]
   * })
   */
  async transaction(schemaName, callback) {
    const client = await this.getClient(schemaName)

    try {
      return await client.$transaction(async (tx) => {
        // Ensure search path is set in transaction
        await tx.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`)
        return await callback(tx)
      })
    } catch (error) {
      console.error(`[tenantPrisma] Transaction error in schema ${schemaName}:`, error)
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  /**
   * Get Global Prisma Client
   *
   * Returns the global client for querying public schema tables
   * (tenants, users, subscriptions, audit_logs).
   *
   * @returns {PrismaClient} Global Prisma client
   *
   * @example
   * // Query all tenants
   * const globalClient = tenantPrisma.getGlobalClient()
   * const tenants = await globalClient.tenant.findMany({
   *   where: { subscriptionStatus: 'active' }
   * })
   */
  getGlobalClient() {
    return this.globalClient
  }

  /**
   * Get Tenant by Clerk Organization ID
   *
   * Helper method to fetch tenant info from Clerk organization ID.
   *
   * @param {string} clerkOrgId - Clerk organization ID
   * @returns {Promise<Object|null>} Tenant object or null if not found
   *
   * @example
   * const tenant = await tenantPrisma.getTenantByClerkOrg('org_abc123')
   * if (tenant) {
   *   console.log(`Tenant schema: ${tenant.schemaName}`)
   * }
   */
  async getTenantByClerkOrg(clerkOrgId) {
    try {
      return await this.globalClient.tenant.findUnique({
        where: { clerkOrganizationId: clerkOrgId },
        include: {
          subscription: true
        }
      })
    } catch (error) {
      console.error('[tenantPrisma] Error fetching tenant:', error)
      return null
    }
  }

  /**
   * Create New Tenant Schema
   *
   * Creates a new tenant record and associated database schema.
   * Calls the PostgreSQL create_tenant_schema() function.
   *
   * @param {Object} tenantData - Tenant configuration
   * @param {string} tenantData.slug - Tenant slug (unique, URL-safe)
   * @param {string} tenantData.name - Tenant name
   * @param {string} tenantData.clerkOrgId - Clerk organization ID
   * @param {string} [tenantData.subscriptionTier='starter'] - Subscription tier
   * @returns {Promise<Object>} Created tenant object with schemaName
   *
   * @example
   * const tenant = await tenantPrisma.createTenant({
   *   slug: 'acme-corp',
   *   name: 'ACME Corporation',
   *   clerkOrgId: 'org_abc123',
   *   subscriptionTier: 'professional'
   * })
   * console.log(`Tenant created with schema: ${tenant.schemaName}`)
   */
  async createTenant(tenantData) {
    const {
      slug,
      name,
      clerkOrgId,
      subscriptionTier = 'starter'
    } = tenantData

    try {
      // Step 1: Create tenant record in public schema
      const tenant = await this.globalClient.tenant.create({
        data: {
          slug,
          name,
          schemaName: `tenant_${this.generateSchemaId()}`,
          clerkOrganizationId: clerkOrgId,
          subscriptionTier,
          subscriptionStatus: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          maxUsers: this.getMaxUsers(subscriptionTier),
          maxEntities: this.getMaxEntities(subscriptionTier),
          features: this.getFeatures(subscriptionTier)
        }
      })

      // Step 2: Create tenant schema using PostgreSQL function
      await this.globalClient.$executeRawUnsafe(
        `SELECT create_tenant_schema($1::UUID)`,
        tenant.id
      )

      console.log(`[tenantPrisma] Created tenant ${tenant.name} with schema ${tenant.schemaName}`)

      return tenant
    } catch (error) {
      console.error('[tenantPrisma] Error creating tenant:', error)
      throw new Error(`Failed to create tenant: ${error.message}`)
    }
  }

  /**
   * Delete Tenant Schema
   *
   * Soft-deletes tenant record and optionally hard-deletes schema.
   * WARNING: Hard delete is IRREVERSIBLE.
   *
   * @param {string} tenantId - Tenant UUID
   * @param {boolean} [hardDelete=false] - If true, permanently deletes schema
   * @returns {Promise<Object>} Deleted tenant object
   *
   * @example
   * // Soft delete (sets deleted_at timestamp)
   * await tenantPrisma.deleteTenant('123e4567-e89b-12d3-a456-426614174000')
   *
   * @example
   * // Hard delete (IRREVERSIBLE - removes all data)
   * await tenantPrisma.deleteTenant('123e4567-e89b-12d3-a456-426614174000', true)
   */
  async deleteTenant(tenantId, hardDelete = false) {
    try {
      // Step 1: Soft delete tenant record
      const tenant = await this.globalClient.tenant.update({
        where: { id: tenantId },
        data: { deletedAt: new Date() }
      })

      // Step 2: Hard delete schema if requested
      if (hardDelete) {
        await this.globalClient.$executeRawUnsafe(
          `SELECT delete_tenant_schema($1::UUID)`,
          tenantId
        )

        // Permanently remove tenant record
        await this.globalClient.tenant.delete({
          where: { id: tenantId }
        })

        console.log(`[tenantPrisma] Hard deleted tenant ${tenant.name} and schema ${tenant.schemaName}`)
      } else {
        console.log(`[tenantPrisma] Soft deleted tenant ${tenant.name}`)
      }

      // Remove from connection pool if exists
      if (this.clientPool.has(tenant.schemaName)) {
        const client = this.clientPool.get(tenant.schemaName)
        await client.$disconnect()
        this.clientPool.delete(tenant.schemaName)
      }

      return tenant
    } catch (error) {
      console.error('[tenantPrisma] Error deleting tenant:', error)
      throw new Error(`Failed to delete tenant: ${error.message}`)
    }
  }

  /**
   * Disconnect All Clients
   *
   * Closes all Prisma connections. Should be called on server shutdown.
   *
   * @returns {Promise<void>}
   *
   * @example
   * // On server shutdown
   * process.on('SIGTERM', async () => {
   *   await tenantPrisma.disconnect()
   *   process.exit(0)
   * })
   */
  async disconnect() {
    console.log('[tenantPrisma] Disconnecting all Prisma clients...')

    // Disconnect all tenant clients
    for (const [schema, client] of this.clientPool.entries()) {
      try {
        await client.$disconnect()
        console.log(`[tenantPrisma] Disconnected client for ${schema}`)
      } catch (error) {
        console.error(`[tenantPrisma] Error disconnecting ${schema}:`, error)
      }
    }

    this.clientPool.clear()

    // Disconnect global client
    await this.globalClient.$disconnect()
    console.log('[tenantPrisma] All clients disconnected')
  }

  // ==================== HELPER METHODS ====================

  /**
   * Generate Schema ID
   * Creates a UUID without dashes for schema naming
   * @private
   */
  generateSchemaId() {
    return crypto.randomUUID().replace(/-/g, '')
  }

  /**
   * Get Max Users for Tier
   * @private
   */
  getMaxUsers(tier) {
    const limits = {
      starter: 5,
      professional: 25,
      enterprise: 100
    }
    return limits[tier] || 5
  }

  /**
   * Get Max Entities for Tier
   * @private
   */
  getMaxEntities(tier) {
    const limits = {
      starter: 500,
      professional: 5000,
      enterprise: 999999
    }
    return limits[tier] || 500
  }

  /**
   * Get Features for Tier
   * @private
   */
  getFeatures(tier) {
    const features = {
      starter: {
        ai_forecasting: false,
        what_if: false,
        api_integrations: true,
        advanced_reports: false,
        custom_integrations: false
      },
      professional: {
        ai_forecasting: true,
        what_if: true,
        api_integrations: true,
        advanced_reports: false,
        custom_integrations: false
      },
      enterprise: {
        ai_forecasting: true,
        what_if: true,
        api_integrations: true,
        advanced_reports: true,
        custom_integrations: true
      }
    }
    return features[tier] || features.starter
  }
}

// Singleton instance - import this in your routes
export const tenantPrisma = new TenantPrismaService()

// Graceful shutdown
process.on('SIGTERM', async () => {
  await tenantPrisma.disconnect()
})

process.on('SIGINT', async () => {
  await tenantPrisma.disconnect()
})
