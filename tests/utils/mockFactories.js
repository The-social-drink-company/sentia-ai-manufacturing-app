/**
 * Mock Data Factories for Integration Tests
 *
 * Generate test data for tenants, users, subscriptions, and other entities.
 *
 * @see tests/integration/api/ for usage examples
 */

/**
 * Create mock tenant data
 *
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock tenant data
 */
export function createMockTenant(overrides = {}) {
  const defaults = {
    slug: `test-tenant-${Date.now()}`,
    name: 'Test Tenant',
    clerkOrgId: `org_test_${Date.now()}`,
    subscriptionTier: 'starter',
    status: 'active',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    ...overrides
  }

  return defaults
}

/**
 * Create mock user data
 *
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock user data
 */
export function createMockUser(overrides = {}) {
  const defaults = {
    clerkUserId: `user_test_${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'member',
    status: 'active',
    ...overrides
  }

  return defaults
}

/**
 * Create mock subscription data
 *
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock subscription data
 */
export function createMockSubscription(overrides = {}) {
  const defaults = {
    tier: 'starter',
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    cancelAtPeriodEnd: false,
    stripeCustomerId: `cus_test_${Date.now()}`,
    stripeSubscriptionId: `sub_test_${Date.now()}`,
    ...overrides
  }

  return defaults
}

/**
 * Create mock product data
 *
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock product data
 */
export function createMockProduct(overrides = {}) {
  const defaults = {
    sku: `TEST-SKU-${Date.now()}`,
    name: 'Test Product',
    description: 'Test product description',
    unitCost: 10.0,
    unitPrice: 20.0,
    status: 'active',
    ...overrides
  }

  return defaults
}

/**
 * Create mock subscription tier data with limits
 *
 * @param {string} tier - Tier name ('starter', 'professional', 'enterprise')
 * @returns {Object} Tier configuration
 */
export function createMockTierConfig(tier = 'starter') {
  const configs = {
    starter: {
      tier: 'starter',
      maxUsers: 5,
      maxEntities: 500,
      features: ['working_capital', 'reports'],
      price: {
        monthly: 149,
        annual: 1490
      }
    },
    professional: {
      tier: 'professional',
      maxUsers: 20,
      maxEntities: 10000,
      features: ['working_capital', 'reports', 'ai_forecasting', 'what_if_analysis', 'integrations'],
      price: {
        monthly: 295,
        annual: 2950
      }
    },
    enterprise: {
      tier: 'enterprise',
      maxUsers: 999999,
      maxEntities: 999999,
      features: ['working_capital', 'reports', 'ai_forecasting', 'what_if_analysis', 'integrations', 'white_label', 'priority_support', 'custom_reports'],
      price: {
        monthly: 595,
        annual: 5950
      }
    }
  }

  return configs[tier] || configs.starter
}

/**
 * Create mock proration data
 *
 * @param {string} fromTier - Current tier
 * @param {string} toTier - New tier
 * @param {number} daysRemaining - Days remaining in billing period
 * @returns {Object} Proration calculation
 */
export function createMockProration(fromTier, toTier, daysRemaining = 15) {
  const fromConfig = createMockTierConfig(fromTier)
  const toConfig = createMockTierConfig(toTier)

  const daysInMonth = 30
  const unusedCredit = (fromConfig.price.monthly / daysInMonth) * daysRemaining
  const newCharge = (toConfig.price.monthly / daysInMonth) * daysRemaining
  const amountDue = newCharge - unusedCredit

  return {
    fromTier,
    toTier,
    daysRemaining,
    unusedCredit: Math.round(unusedCredit * 100) / 100,
    newCharge: Math.round(newCharge * 100) / 100,
    amountDue: Math.round(amountDue * 100) / 100,
    effectiveDate: new Date().toISOString()
  }
}

/**
 * Create mock downgrade impact data
 *
 * @param {string} fromTier - Current tier
 * @param {string} toTier - New tier
 * @param {Object} currentUsage - Current usage stats
 * @returns {Object} Downgrade impact analysis
 */
export function createMockDowngradeImpact(fromTier, toTier, currentUsage = {}) {
  const fromConfig = createMockTierConfig(fromTier)
  const toConfig = createMockTierConfig(toTier)

  const usage = {
    users: currentUsage.users || 3,
    entities: currentUsage.entities || 150,
    integrations: currentUsage.integrations || 2,
    ...currentUsage
  }

  const impacts = {
    usersOverLimit: usage.users > toConfig.maxUsers,
    entitiesOverLimit: usage.entities > toConfig.maxEntities,
    featuresLost: fromConfig.features.filter(f => !toConfig.features.includes(f)),
    warnings: []
  }

  if (impacts.usersOverLimit) {
    impacts.warnings.push(`Current users (${usage.users}) exceeds limit (${toConfig.maxUsers})`)
  }

  if (impacts.entitiesOverLimit) {
    impacts.warnings.push(`Current entities (${usage.entities}) exceeds limit (${toConfig.maxEntities})`)
  }

  if (impacts.featuresLost.length > 0) {
    impacts.warnings.push(`Features will be lost: ${impacts.featuresLost.join(', ')}`)
  }

  return {
    fromTier,
    toTier,
    currentUsage: usage,
    newLimits: {
      maxUsers: toConfig.maxUsers,
      maxEntities: toConfig.maxEntities
    },
    impact: impacts,
    canDowngrade: !impacts.usersOverLimit && !impacts.entitiesOverLimit
  }
}
