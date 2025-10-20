/**
 * Sample Data Generator Service
 *
 * Generates realistic manufacturing data for trial users
 * to explore CapLiquify features immediately.
 *
 * @module server/services/sampleDataGenerator
 */

import { logInfo, logError } from '../../services/observability/structuredLogger.js'

/**
 * Generate sample data for a tenant
 * @param {Object} prisma - Prisma client
 * @param {string} tenantId - Tenant ID
 * @param {string} industry - Industry type
 * @returns {Promise<Object>} Generation result
 */
export async function generateSampleData(prisma, tenantId, industry = 'food-beverage') {
  logInfo('Generating sample data', { tenantId, industry })

  try {
    // Get industry-specific product templates
    const products = getIndustryProducts(industry)

    // Create organization if doesn't exist
    let organization = await prisma.organization.findUnique({
      where: { id: tenantId },
    })

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          id: tenantId,
          name: `Sample Company (${industry})`,
          displayName: `Sample ${industry} Company`,
          industry,
          size: '11-50',
        },
      })
    }

    // Generate products (20 SKUs)
    const createdProducts = []
    for (const product of products) {
      const created = await prisma.product.create({
        data: {
          organizationId: tenantId,
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: product.category,
          unitCost: product.unitCost,
          sellingPrice: product.sellingPrice,
          leadTime: product.leadTime,
          moq: product.moq,
          batchSize: product.batchSize,
          safetyStock: product.safetyStock,
          reorderPoint: product.reorderPoint,
        },
      })
      createdProducts.push(created)
    }

    // Generate inventory items
    for (const product of createdProducts) {
      await prisma.inventoryItem.create({
        data: {
          organizationId: tenantId,
          productId: product.id,
          warehouseId: 'MAIN-WAREHOUSE',
          location: 'A-01',
          quantityOnHand: Math.floor(Math.random() * 1000) + 100,
          quantityAvailable: Math.floor(Math.random() * 800) + 50,
          quantityReserved: Math.floor(Math.random() * 100),
          quantityInTransit: Math.floor(Math.random() * 50),
          unitCost: product.unitCost,
          totalValue: product.unitCost * (Math.floor(Math.random() * 1000) + 100),
        },
      })
    }

    // Generate production jobs (5-10 active jobs)
    const jobCount = Math.floor(Math.random() * 6) + 5
    for (let i = 0; i < jobCount; i++) {
      const product = createdProducts[Math.floor(Math.random() * createdProducts.length)]
      const quantity = Math.floor(Math.random() * 500) + 100

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30))

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 14) + 1)

      await prisma.productionJob.create({
        data: {
          organizationId: tenantId,
          productId: product.id,
          jobNumber: `JOB-${Date.now()}-${i}`,
          workOrderNumber: `WO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          quantityOrdered: quantity,
          quantityProduced: Math.floor(quantity * (Math.random() * 0.3 + 0.6)),
          quantityRejected: Math.floor(quantity * (Math.random() * 0.05)),
          plannedStart: startDate,
          plannedEnd: endDate,
          actualStart: startDate,
          status: ['PENDING', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 3)],
          priority: Math.floor(Math.random() * 10) + 1,
          assignedLine: `Line-${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
          qualityScore: Math.random() * 20 + 80, // 80-100
          defectRate: Math.random() * 5, // 0-5%
        },
      })
    }

    // Generate financial data
    const periodStart = new Date()
    periodStart.setDate(1) // First day of month

    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    periodEnd.setDate(0) // Last day of month

    const revenue = Math.floor(Math.random() * 500000) + 100000
    const cogs = Math.floor(revenue * (Math.random() * 0.2 + 0.6)) // 60-80% of revenue
    const grossProfit = revenue - cogs

    // Placeholder user ID - in production, use actual user
    const userId = 'sample-user'

    await prisma.workingCapital.create({
      data: {
        organizationId: tenantId,
        periodStart,
        periodEnd,
        revenue,
        cogs,
        grossProfit,
        grossMargin: (grossProfit / revenue) * 100,
        accountsReceivable: Math.floor(revenue * 0.2),
        inventory: Math.floor(cogs * 0.3),
        accountsPayable: Math.floor(cogs * 0.15),
        workingCapital: Math.floor(revenue * 0.35),
        dso: Math.floor(Math.random() * 30) + 30, // 30-60 days
        dio: Math.floor(Math.random() * 30) + 45, // 45-75 days
        dpo: Math.floor(Math.random() * 20) + 30, // 30-50 days
        ccc: Math.floor(Math.random() * 30) + 45, // 45-75 days
        inventoryTurnover: Math.random() * 4 + 4, // 4-8x
        receivablesTurnover: Math.random() * 4 + 6, // 6-10x
        payablesTurnover: Math.random() * 4 + 8, // 8-12x
        quickRatio: Math.random() * 0.5 + 1, // 1.0-1.5
        currentRatio: Math.random() * 0.5 + 1.5, // 1.5-2.0
        workingCapitalRatio: Math.random() * 0.3 + 0.2, // 0.2-0.5
        createdBy: userId,
        status: 'APPROVED',
      },
    })

    logInfo('Sample data generated successfully', {
      tenantId,
      productsCount: createdProducts.length,
      jobsCount: jobCount,
    })

    return {
      success: true,
      data: {
        products: createdProducts.length,
        inventoryItems: createdProducts.length,
        productionJobs: jobCount,
        workingCapital: 1,
      },
    }
  } catch (error) {
    logError('Failed to generate sample data', error)
    throw error
  }
}

/**
 * Get industry-specific product templates
 * @param {string} industry - Industry type
 * @returns {Array} Product templates
 */
function getIndustryProducts(industry) {
  const templates = {
    'food-beverage': [
      {
        sku: 'FB-001',
        name: 'Premium Artisan Gin 700ml',
        description: 'Small-batch craft gin with botanicals',
        category: 'Spirits',
        unitCost: 12.5,
        sellingPrice: 35.0,
        leadTime: 14,
        moq: 100,
        batchSize: 500,
        safetyStock: 200,
        reorderPoint: 350,
      },
      {
        sku: 'FB-002',
        name: 'Organic Vodka 750ml',
        description: 'Triple-distilled organic vodka',
        category: 'Spirits',
        unitCost: 10.0,
        sellingPrice: 28.0,
        leadTime: 14,
        moq: 100,
        batchSize: 500,
        safetyStock: 150,
        reorderPoint: 300,
      },
      {
        sku: 'FB-003',
        name: 'Spiced Rum 700ml',
        description: 'Caribbean-style spiced rum',
        category: 'Spirits',
        unitCost: 11.0,
        sellingPrice: 32.0,
        leadTime: 21,
        moq: 100,
        batchSize: 500,
        safetyStock: 150,
        reorderPoint: 300,
      },
      {
        sku: 'FB-004',
        name: 'Whiskey Cask Aged 750ml',
        description: 'Oak-aged premium whiskey',
        category: 'Spirits',
        unitCost: 18.0,
        sellingPrice: 55.0,
        leadTime: 28,
        moq: 50,
        batchSize: 250,
        safetyStock: 100,
        reorderPoint: 200,
      },
      {
        sku: 'FB-005',
        name: 'Cocktail Bitters 100ml',
        description: 'Aromatic cocktail bitters',
        category: 'Mixers',
        unitCost: 3.5,
        sellingPrice: 12.0,
        leadTime: 7,
        moq: 200,
        batchSize: 1000,
        safetyStock: 300,
        reorderPoint: 500,
      },
      // Add 15 more products for 20 total
      ...generateGenericProducts(15, 'FB', 'Food & Beverage'),
    ],
    spirits: [
      {
        sku: 'SP-001',
        name: 'Single Malt Scotch 750ml',
        description: '12-year aged single malt',
        category: 'Whiskey',
        unitCost: 25.0,
        sellingPrice: 75.0,
        leadTime: 30,
        moq: 50,
        batchSize: 200,
        safetyStock: 75,
        reorderPoint: 150,
      },
      ...generateGenericProducts(19, 'SP', 'Spirits'),
    ],
    'consumer-goods': [
      {
        sku: 'CG-001',
        name: 'Eco-Friendly Water Bottle',
        description: 'Reusable stainless steel bottle',
        category: 'Drinkware',
        unitCost: 5.0,
        sellingPrice: 18.0,
        leadTime: 14,
        moq: 500,
        batchSize: 2000,
        safetyStock: 500,
        reorderPoint: 1000,
      },
      ...generateGenericProducts(19, 'CG', 'Consumer Goods'),
    ],
    industrial: [
      {
        sku: 'IND-001',
        name: 'Steel Component A-123',
        description: 'Precision-machined steel part',
        category: 'Components',
        unitCost: 15.0,
        sellingPrice: 45.0,
        leadTime: 21,
        moq: 100,
        batchSize: 500,
        safetyStock: 150,
        reorderPoint: 300,
      },
      ...generateGenericProducts(19, 'IND', 'Industrial'),
    ],
  }

  return templates[industry] || templates['food-beverage']
}

/**
 * Generate generic products for an industry
 * @param {number} count - Number of products to generate
 * @param {string} prefix - SKU prefix
 * @param {string} category - Product category
 * @returns {Array} Product templates
 */
function generateGenericProducts(count, prefix, category) {
  const products = []
  for (let i = 0; i < count; i++) {
    const num = String(i + 6).padStart(3, '0')
    products.push({
      sku: `${prefix}-${num}`,
      name: `${category} Product ${num}`,
      description: `Sample ${category.toLowerCase()} product`,
      category,
      unitCost: Math.floor(Math.random() * 20) + 5,
      sellingPrice: Math.floor(Math.random() * 40) + 20,
      leadTime: Math.floor(Math.random() * 21) + 7,
      moq: Math.floor(Math.random() * 400) + 100,
      batchSize: Math.floor(Math.random() * 1500) + 500,
      safetyStock: Math.floor(Math.random() * 200) + 100,
      reorderPoint: Math.floor(Math.random() * 300) + 200,
    })
  }
  return products
}

export default { generateSampleData }
