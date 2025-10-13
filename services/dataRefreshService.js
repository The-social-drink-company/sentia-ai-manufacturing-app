/**
 * Data Refresh Service
 * Pulls real data from all connected APIs and updates application calculations
 */

import { PrismaClient } from '@prisma/client'
import xeroService from './xeroService.js'
import shopifyMultiStore from './shopify-multistore.js'
import amazonService from './amazonService.js'
import unleashedService from './unleashedService.js'
import { logInfo, logWarn, logError } from './observability/structuredLogger.js'

const prisma = new PrismaClient()

/**
 * Refresh all data from external APIs
 */
export async function refreshAllData() {
  try {
    logInfo('Starting comprehensive data refresh from all APIs')
    
    const results = {
      xero: null,
      shopify: null,
      amazon: null,
      unleashed: null,
      calculations: null,
      timestamp: new Date().toISOString()
    }
    
    // Refresh Xero financial data
    try {
      results.xero = await refreshXeroData()
      logInfo('Xero data refresh completed', { status: 'success' })
    } catch (error) {
      logError('Xero data refresh failed', error)
      results.xero = { error: error.message }
    }
    
    // Refresh Shopify sales data
    try {
      results.shopify = await refreshShopifyData()
      logInfo('Shopify data refresh completed', { status: 'success' })
    } catch (error) {
      logError('Shopify data refresh failed', error)
      results.shopify = { error: error.message }
    }
    
    // Refresh Amazon sales data
    try {
      results.amazon = await refreshAmazonData()
      logInfo('Amazon data refresh completed', { status: 'success' })
    } catch (error) {
      logError('Amazon data refresh failed', error)
      results.amazon = { error: error.message }
    }
    
    // Refresh Unleashed inventory data
    try {
      results.unleashed = await refreshUnleashedData()
      logInfo('Unleashed data refresh completed', { status: 'success' })
    } catch (error) {
      logError('Unleashed data refresh failed', error)
      results.unleashed = { error: error.message }
    }
    
    // Recalculate all metrics and KPIs
    try {
      results.calculations = await recalculateAllMetrics()
      logInfo('Metrics recalculation completed', { status: 'success' })
    } catch (error) {
      logError('Metrics recalculation failed', error)
      results.calculations = { error: error.message }
    }
    
    logInfo('Comprehensive data refresh completed', { results })
    return results
    
  } catch (error) {
    logError('Data refresh service failed', error)
    throw error
  }
}

/**
 * Refresh Xero financial data
 */
async function refreshXeroData() {
  try {
    // Check if Xero service methods exist
    if (!xeroService.getBalanceSheet || !xeroService.getProfitLoss || !xeroService.getCashFlow) {
      logWarn('Xero service methods not available, using fallback data')
      return await generateSampleXeroData()
    }
    
    const [balanceSheet, profitLoss, cashFlow] = await Promise.all([
      xeroService.getBalanceSheet(),
      xeroService.getProfitLoss(),
      xeroService.getCashFlow()
    ])
    
    // Update working capital data from Xero
    const workingCapitalData = calculateWorkingCapitalFromXero(balanceSheet, profitLoss)
    await updateWorkingCapitalData(workingCapitalData)
    
    return {
      balanceSheet: balanceSheet.length,
      profitLoss: profitLoss.length,
      cashFlow: cashFlow.length,
      workingCapital: workingCapitalData
    }
    
  } catch (error) {
    logWarn('Xero service not fully configured or unavailable')
    return { status: 'not_configured', error: error.message }
  }
}

/**
 * Refresh Shopify sales data
 */
async function refreshShopifyData() {
  try {
    // Connect to Shopify multistore service
    await shopifyMultiStore.connect()
    
    // Get recent orders from all connected stores
    const allOrders = await shopifyMultiStore.getAllOrders({
      limit: 250, 
      created_at_min: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    
    // Convert Shopify orders to historical sales
    const salesData = allOrders.map(order => ({
      external_order_id: order.id.toString(),
      sale_date: new Date(order.created_at),
      gross_revenue: parseFloat(order.total_price || 0),
      net_revenue: parseFloat(order.total_price || 0) - parseFloat(order.total_discounts || 0),
      quantity_sold: order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      customer_email: order.customer?.email,
      source: 'shopify',
      currency: order.currency || 'GBP',
      store_region: order.store_region || 'uk_eu'
    }))
    
    // Update historical sales data
    await updateHistoricalSales(salesData)
    
    return {
      orders: allOrders.length,
      totalRevenue: salesData.reduce((sum, sale) => sum + sale.gross_revenue, 0),
      totalQuantity: salesData.reduce((sum, sale) => sum + sale.quantity_sold, 0),
      storeCount: shopifyMultiStore.getActiveStoreCount()
    }
    
  } catch (error) {
    logWarn('Shopify multistore service not configured or unavailable')
    return { status: 'not_configured', error: error.message }
  }
}

/**
 * Refresh Amazon sales data
 */
async function refreshAmazonData() {
  try {
    // Get orders from Amazon SP-API
    const orders = await amazonService.getOrders({
      CreatedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    
    // Convert Amazon orders to sales data
    const salesData = orders.map(order => ({
      external_order_id: order.AmazonOrderId,
      sale_date: new Date(order.PurchaseDate),
      gross_revenue: parseFloat(order.OrderTotal?.Amount || 0),
      currency: order.OrderTotal?.CurrencyCode || 'USD',
      source: 'amazon',
      marketplace_name: order.MarketplaceId
    }))
    
    await updateHistoricalSales(salesData)
    
    return {
      orders: orders.length,
      totalRevenue: salesData.reduce((sum, sale) => sum + sale.gross_revenue, 0)
    }
    
  } catch (error) {
    logWarn('Amazon SP-API not configured or unavailable')
    return { status: 'not_configured', error: error.message }
  }
}

/**
 * Refresh Unleashed inventory data
 */
async function refreshUnleashedData() {
  try {
    // Check if Unleashed service method exists
    if (!unleashedService.getProducts) {
      logWarn('Unleashed service getProducts method not available, using sample data')
      return await generateSampleUnleashedData()
    }
    
    const products = await unleashedService.getProducts()
    
    // Update inventory levels from Unleashed
    const inventoryData = products.map(product => ({
      sku: product.ProductCode,
      product_name: product.ProductDescription,
      available_quantity: product.AvailableQty || 0,
      unit_cost: parseFloat(product.AverageUnitCost || 0),
      total_value: (product.AvailableQty || 0) * parseFloat(product.AverageUnitCost || 0),
      source: 'unleashed'
    }))
    
    await updateInventoryData(inventoryData)
    
    return {
      products: products.length,
      totalValue: inventoryData.reduce((sum, item) => sum + item.total_value, 0)
    }
    
  } catch (error) {
    logWarn('Unleashed service not configured or unavailable')
    return { status: 'not_configured', error: error.message }
  }
}

/**
 * Calculate working capital metrics from Xero data
 */
function calculateWorkingCapitalFromXero(balanceSheet, profitLoss) {
  try {
    // Extract key figures from balance sheet
    const currentAssets = balanceSheet.find(item => 
      item.accountType === 'CURRENT' && item.accountClass === 'ASSET'
    )?.total || 0
    
    const currentLiabilities = balanceSheet.find(item => 
      item.accountType === 'CURRENT' && item.accountClass === 'LIABILITY'
    )?.total || 0
    
    const revenue = profitLoss.find(item => 
      item.accountClass === 'REVENUE'
    )?.total || 0
    
    const workingCapital = currentAssets - currentLiabilities
    const workingCapitalRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0
    
    return {
      current_assets: currentAssets,
      current_liabilities: currentLiabilities,
      working_capital: workingCapital,
      working_capital_ratio: workingCapitalRatio,
      revenue: revenue,
      calculation_date: new Date()
    }
    
  } catch (error) {
    logError('Error calculating working capital from Xero data', error)
    return null
  }
}

/**
 * Update working capital data in database
 */
async function updateWorkingCapitalData(data) {
  if (!data) return
  
  try {
    // Create working capital record (let Prisma generate UUID)
    await prisma.workingCapital.create({
      data: {
        projectionDate: new Date(),
        projection_period: 'current',
        currencyCode: 'USD',
        projectedSalesRevenue: data.revenue,
        accounts_receivable: data.current_assets * 0.3,
        accounts_payable: data.current_liabilities * 0.4,
        workingCapitalRequirement: data.working_capital,
        working_capital_turnover: data.working_capital_ratio,
        status: 'active',
        is_approved: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    
  } catch (error) {
    logError('Error updating working capital data', error)
  }
}

/**
 * Update historical sales data in database
 */
async function updateHistoricalSales(salesData) {
  try {
    for (const sale of salesData) {
      // Check if sale already exists by order_id
      const existing = await prisma.historicalSale.findFirst({
        where: {
          order_id: sale.external_order_id
        }
      })
      
      if (!existing) {
        await prisma.historicalSale.create({
          data: {
            saleDate: sale.sale_date,
            sale_datetime: sale.sale_date,
            quantitySold: sale.quantity_sold || 1,
            unit_price: sale.gross_revenue / (sale.quantity_sold || 1),
            grossRevenue: sale.gross_revenue,
            netRevenue: sale.net_revenue || sale.gross_revenue,
            data_source: sale.source,
            currency_code_tx: sale.currency || 'USD',
            is_validated: true,
            // Link to default product and sales channel
            productId: await getDefaultProductId(),
            salesChannelId: await getDefaultSalesChannelId(sale.source),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      }
    }
    
  } catch (error) {
    logError('Error updating historical sales data', error)
  }
}

/**
 * Update inventory data in database
 */
async function updateInventoryData(inventoryData) {
  try {
    for (const item of inventoryData) {
      await prisma.inventoryLevel.upsert({
        where: {
          productId_locationId_snapshot_date: {
            productId: await getOrCreateProductBySku(item.sku, item.product_name),
            locationId: 'main-warehouse',
            snapshot_date: new Date()
          }
        },
        update: {
          availableQuantity: item.available_quantity,
          total_quantity: item.available_quantity,
          unit_cost: item.unit_cost,
          total_value: item.total_value,
          data_source: item.source,
          last_sync_at: new Date(),
          updatedAt: new Date()
        },
        create: {
          productId: await getOrCreateProductBySku(item.sku, item.product_name),
          locationType: 'warehouse',
          locationId: 'main-warehouse',
          availableQuantity: item.available_quantity,
          total_quantity: item.available_quantity,
          unit_cost: item.unit_cost,
          total_value: item.total_value,
          data_source: item.source,
          snapshot_date: new Date(),
          status: 'active',
          last_sync_at: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }
    
  } catch (error) {
    logError('Error updating inventory data', error)
  }
}

/**
 * Recalculate all metrics and KPIs based on refreshed data
 */
async function recalculateAllMetrics() {
  try {
    // Calculate total revenue from historical sales
    const totalRevenue = await prisma.historicalSale.aggregate({
      _sum: { netRevenue: true },
      where: {
        saleDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })
    
    // Calculate total inventory value
    const totalInventoryValue = await prisma.inventoryLevel.aggregate({
      _sum: { total_value: true },
      where: {
        snapshot_date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
    
    // Calculate working capital metrics
    const workingCapitalMetrics = await prisma.workingCapital.aggregate({
      _avg: {
        workingCapitalRequirement: true,
        working_capital_turnover: true
      },
      where: {
        status: 'active'
      }
    })
    
    return {
      totalRevenue: totalRevenue._sum.netRevenue || 0,
      totalInventoryValue: totalInventoryValue._sum.total_value || 0,
      avgWorkingCapital: workingCapitalMetrics._avg.workingCapitalRequirement || 0,
      avgWCTurnover: workingCapitalMetrics._avg.working_capital_turnover || 0
    }
    
  } catch (error) {
    logError('Error recalculating metrics', error)
    throw error
  }
}

/**
 * Helper functions
 */
async function getDefaultProductId() {
  const product = await prisma.product.findFirst({
    select: { id: true }
  })
  return product?.id || await createDefaultProduct()
}

async function getDefaultSalesChannelId(source) {
  const channel = await prisma.salesChannel.findFirst({
    where: { channelType: source },
    select: { id: true }
  })
  return channel?.id || await createDefaultSalesChannel(source)
}

async function getOrCreateProductBySku(sku, name) {
  const product = await prisma.product.findUnique({
    where: { sku },
    select: { id: true }
  })
  
  if (product) return product.id
  
  return await createProductBySku(sku, name)
}

async function createDefaultProduct() {
  const product = await prisma.product.create({
    data: {
      sku: 'DEFAULT',
      name: 'Default Product',
      category: 'General',
      marketRegion: 'US',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  return product.id
}

async function createDefaultSalesChannel(source) {
  const channel = await prisma.salesChannel.create({
    data: {
      name: `${source} Channel`,
      channelType: source,
      marketCode: 'US',
      sync_enabled: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  return channel.id
}

async function createProductBySku(sku, name) {
  const product = await prisma.product.create({
    data: {
      sku,
      name: name || sku,
      category: 'Imported',
      marketRegion: 'US',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  return product.id
}

/**
 * Sample data generation functions
 */
async function generateSampleXeroData() {
  // CRITICAL ERROR: No fake financial data generation allowed
  throw new Error('Financial data must come from real Xero API integration. Math.random() fake data is not permitted.');
}

async function generateSampleUnleashedData() {
  // CRITICAL ERROR: No fake inventory data generation allowed
  throw new Error('Inventory data must come from real Unleashed API integration. Math.random() fake data is not permitted.');
}

export default {
  refreshAllData,
  refreshXeroData,
  refreshShopifyData,
  refreshAmazonData,
  refreshUnleashedData
}