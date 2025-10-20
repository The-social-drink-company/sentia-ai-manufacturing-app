/**
 * Test Database Utilities
 *
 * Helper functions for setting up and tearing down test databases in integration tests.
 *
 * @see tests/integration/tenant-isolation.test.js for usage examples
 */

import { tenantPrisma } from '../../server/services/tenantPrisma.js'

/**
 * Setup test database before running tests
 *
 * Creates test tenants with isolated schemas
 *
 * @param {Object[]} tenants - Array of tenant configurations
 * @returns {Promise<Object[]>} Created tenant records
 */
export async function setupTestDatabase(tenants = []) {
  console.log('🧪 Setting up test database...')

  const createdTenants = []

  for (const tenantConfig of tenants) {
    try {
      const tenant = await tenantPrisma.createTenant(tenantConfig)
      createdTenants.push(tenant)
      console.log(`✅ Created test tenant: ${tenant.schemaName}`)
    } catch (error) {
      console.error(`❌ Failed to create tenant ${tenantConfig.slug}:`, error.message)
      throw error
    }
  }

  return createdTenants
}

/**
 * Teardown test database after running tests
 *
 * Deletes test tenants and their schemas (hard delete)
 *
 * @param {Object[]} tenants - Array of tenant records to delete
 * @returns {Promise<void>}
 */
export async function teardownTestDatabase(tenants = []) {
  console.log('🧹 Cleaning up test database...')

  for (const tenant of tenants) {
    try {
      await tenantPrisma.deleteTenant(tenant.id, true) // Hard delete
      console.log(`✅ Deleted test tenant: ${tenant.schemaName}`)
    } catch (error) {
      console.error(`❌ Failed to delete tenant ${tenant.slug}:`, error.message)
      // Continue cleanup even if one fails
    }
  }

  console.log('✅ Test cleanup complete')
}

/**
 * Reset test database between tests
 *
 * Truncates data tables without dropping schemas
 *
 * @param {Object} tenant - Tenant record
 * @param {string[]} tables - Array of table names to truncate
 * @returns {Promise<void>}
 */
export async function resetTestDatabase(tenant, tables = []) {
  console.log(`🔄 Resetting test database for ${tenant.schemaName}...`)

  const defaultTables = [
    'products',
    'sales',
    'forecasts',
    'scenarios',
    'inventory',
    'working_capital_metrics'
  ]

  const tablesToReset = tables.length > 0 ? tables : defaultTables

  for (const table of tablesToReset) {
    try {
      await tenantPrisma.queryRaw(
        tenant.schemaName,
        `TRUNCATE TABLE ${table} CASCADE`,
        []
      )
    } catch (error) {
      // Table might not exist, which is fine
      console.log(`⚠️  Could not truncate ${table}:`, error.message)
    }
  }

  console.log('✅ Database reset complete')
}

/**
 * Seed test data into a tenant schema
 *
 * @param {Object} tenant - Tenant record
 * @param {Object} seedData - Data to seed (organized by table)
 * @returns {Promise<void>}
 */
export async function seedTestData(tenant, seedData = {}) {
  console.log(`🌱 Seeding test data for ${tenant.schemaName}...`)

  // Seed products
  if (seedData.products && Array.isArray(seedData.products)) {
    for (const product of seedData.products) {
      await tenantPrisma.queryRaw(
        tenant.schemaName,
        `INSERT INTO products (sku, name, description, unit_cost, unit_price, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          product.sku,
          product.name,
          product.description || '',
          product.unitCost,
          product.unitPrice,
          product.status || 'active'
        ]
      )
    }
    console.log(`✅ Seeded ${seedData.products.length} products`)
  }

  // Seed sales
  if (seedData.sales && Array.isArray(seedData.sales)) {
    for (const sale of seedData.sales) {
      await tenantPrisma.queryRaw(
        tenant.schemaName,
        `INSERT INTO sales (product_id, order_id, sale_date, channel, quantity, unit_price, total_amount, currency, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          sale.productId,
          sale.orderId,
          sale.saleDate,
          sale.channel,
          sale.quantity,
          sale.unitPrice,
          sale.totalAmount,
          sale.currency || 'USD'
        ]
      )
    }
    console.log(`✅ Seeded ${seedData.sales.length} sales`)
  }

  // Seed working capital metrics
  if (seedData.workingCapital && Array.isArray(seedData.workingCapital)) {
    for (const wc of seedData.workingCapital) {
      await tenantPrisma.queryRaw(
        tenant.schemaName,
        `INSERT INTO working_capital_metrics (metric_date, cash, accounts_receivable, accounts_payable, inventory_value, current_assets, current_liabilities, working_capital, dso, dpo, dio, ccc, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [
          wc.metricDate,
          wc.cash,
          wc.accountsReceivable,
          wc.accountsPayable,
          wc.inventoryValue,
          wc.currentAssets,
          wc.currentLiabilities,
          wc.workingCapital,
          wc.dso,
          wc.dpo,
          wc.dio,
          wc.ccc
        ]
      )
    }
    console.log(`✅ Seeded ${seedData.workingCapital.length} working capital metrics`)
  }

  console.log('✅ Test data seeded successfully')
}

/**
 * Get test database connection status
 *
 * @returns {Promise<boolean>} True if database is connected
 */
export async function checkDatabaseConnection() {
  try {
    await tenantPrisma.queryRaw('public', 'SELECT 1', [])
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}
