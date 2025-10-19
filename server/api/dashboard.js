/**
 * Dashboard API Endpoints
 *
 * Provides aggregated data for the executive dashboard:
 * - KPI summary data (6 key metrics)
 * - Time series data for charts (sales, production, inventory)
 * - Working capital snapshot
 * - Recent alerts and notifications
 *
 * Target: <3 second response time for full dashboard load
 *
 * STATUS: Sprint 2 In Progress
 * - ✅ Xero financial data integration (BMAD-MOCK-001)
 * - ✅ Shopify sales data integration (BMAD-MOCK-002)
 * - 🔄 Amazon SP-API integration (BMAD-MOCK-003) - In Progress
 * - ⏳ Unleashed ERP inventory integration (BMAD-MOCK-004)
 */

import express from 'express'
import xeroService from '../../services/xeroService.js'
import shopifyMultiStoreService from '../../services/shopify-multistore.js'
import amazonSPAPIService from '../../services/amazon-sp-api.js'
import unleashedERPService from '../../services/unleashed-erp.js'
import { logInfo, logError, logDebug, logWarn } from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/v1/dashboard/executive
 *
 * Returns complete dashboard data including:
 * - KPIs (revenue, production, inventory, CCC, OTD, forecast accuracy)
 * - Chart data (sales/revenue, production output, inventory levels)
 * - Working capital summary
 * - Recent alerts
 *
 * Response time target: <3 seconds
 */
router.get('/executive', async (req, res) => {
  const startTime = Date.now()

  try {
    logDebug('[Dashboard] Fetching executive dashboard data...')

    // Check integration health
    const xeroHealth = await xeroService.healthCheck()
    const shopifyStatus = shopifyMultiStoreService.getConnectionStatus()
    const amazonConnected = amazonSPAPIService.isConnected

    logDebug('[Dashboard] Integration health:', {
      xero: xeroHealth.status,
      shopify: shopifyStatus.connected
        ? `${shopifyStatus.activeStores}/${shopifyStatus.totalStores} stores`
        : 'not connected',
      amazon: amazonConnected ? 'connected' : 'not connected',
    })

    if (xeroHealth.status !== 'connected') {
      logInfo('[Dashboard] Xero not connected, returning setup instructions')
      return res.json({
        success: true,
        data: {
          kpis: null,
          charts: null,
          workingCapital: null,
          setupRequired: true,
          xeroStatus: xeroHealth,
          shopifyStatus: shopifyStatus,
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime,
            dataAvailable: false,
            message: 'Connect Xero to view real financial data',
            requiredIntegrations: [
              { name: 'Xero', status: xeroHealth.status, required: true, story: 'BMAD-MOCK-001' },
              {
                name: 'Shopify',
                status: shopifyStatus.connected ? 'connected' : 'pending',
                required: false,
                activeStores: shopifyStatus.activeStores,
                story: 'BMAD-MOCK-002',
              },
              {
                name: 'Amazon SP-API',
                status: amazonConnected ? 'connected' : 'pending',
                required: false,
                story: 'BMAD-MOCK-005',
              },
              { name: 'Unleashed ERP', status: 'pending', required: false, story: 'BMAD-MOCK-006' },
            ],
          },
        },
      })
    }

    // Fetch real data from Xero, Shopify, and Amazon in parallel
    logDebug('[Dashboard] Fetching data from Xero, Shopify, and Amazon...')
    const [wcData, plData, cfData, shopifyData, amazonOrders, amazonInventory] = await Promise.all([
      xeroService.calculateWorkingCapital(),
      xeroService.getProfitAndLoss(3), // Last 3 months
      xeroService.getCashFlow(3),
      shopifyStatus.connected
        ? shopifyMultiStoreService.getConsolidatedSalesData()
        : Promise.resolve({ success: false, error: 'Not connected' }),
      amazonConnected
        ? amazonSPAPIService.getOrderMetrics().catch(() => null)
        : Promise.resolve(null),
      amazonConnected
        ? amazonSPAPIService.getInventorySummary().catch(() => null)
        : Promise.resolve(null),
    ])

    logDebug('[Dashboard] Data fetched:', {
      xero: { workingCapital: wcData?.success, profitLoss: plData?.length, cashFlow: !!cfData },
      shopify: { success: shopifyData?.success, stores: shopifyData?.stores?.length },
      amazon: {
        orders: amazonOrders?.totalOrders || 0,
        inventory: amazonInventory?.totalSKUs || 0,
      },
    })

    // Calculate month-over-month change
    const calculateChange = data => {
      if (!data || data.length < 2) return 0
      const current = data[0]?.totalRevenue || 0
      const previous = data[1]?.totalRevenue || 0
      if (previous === 0) return 0
      return ((current - previous) / previous) * 100
    }

    // Transform Xero and Shopify data to dashboard KPI format
    const kpis = {
      revenue: {
        mtd: plData?.[0]?.totalRevenue || 0,
        ytd: plData?.reduce((sum, p) => sum + (p.totalRevenue || 0), 0) || 0,
        change: calculateChange(plData),
        sparkline: plData?.map(p => p.totalRevenue || 0).reverse() || [],
        // Shopify sales breakdown
        shopify: shopifyData.success
          ? {
              grossRevenue: shopifyData.totalRevenue || 0,
              netRevenue: shopifyData.netRevenue || 0,
              transactionFees: shopifyData.transactionFees || 0,
              feeRate: shopifyData.feeRate || 0.029,
              orders: shopifyData.totalOrders || 0,
              avgOrderValue: shopifyData.avgOrderValue || 0,
              avgNetOrderValue: shopifyData.avgNetOrderValue || 0,
              storeCount: shopifyData.stores?.length || 0,
              dataSource: shopifyData.dataSource,
            }
          : null,
        // Amazon sales breakdown
        amazon: amazonOrders
          ? {
              revenue: amazonOrders.totalRevenue || 0,
              orders: amazonOrders.totalOrders || 0,
              avgOrderValue: amazonOrders.averageOrderValue || 0,
              unshippedOrders: amazonOrders.unshippedOrders || 0,
            }
          : null,
      },
      sales: shopifyData.success
        ? {
            totalOrders: shopifyData.totalOrders || 0,
            totalCustomers: shopifyData.totalCustomers || 0,
            avgOrderValue: shopifyData.avgOrderValue || 0,
            avgNetOrderValue: shopifyData.avgNetOrderValue || 0,
            commission: shopifyData.commission || {},
            storeCount: shopifyData.stores?.length || 0,
            dataSource: shopifyData.dataSource,
          }
        : null,
      workingCapital: {
        value: wcData.data?.workingCapital || 0,
        ccc: wcData.data?.cashConversionCycle || 0,
        currentRatio: wcData.data?.currentRatio || 0,
        dso: wcData.data?.dso || 0,
        dio: wcData.data?.dio || 0,
        dpo: wcData.data?.dpo || 0,
        sparkline: [wcData.data?.workingCapital || 0], // Single data point - historical tracking in future story
      },
      cashFlow: {
        operating: cfData?.operating || 0,
        investing: cfData?.investing || 0,
        financing: cfData?.financing || 0,
        total: cfData?.totalMovement || 0,
      },
      profitability: {
        grossMargin: plData?.[0]?.grossMargin || 0,
        profitMargin: plData?.[0]?.profitMargin || 0,
        netProfit: plData?.[0]?.netProfit || 0,
      },
      inventory: amazonInventory
        ? {
            totalSKUs: amazonInventory.totalSKUs || 0,
            totalQuantity: amazonInventory.totalQuantity || 0,
            lowStockItems: amazonInventory.lowStockItems || 0,
          }
        : null,
    }

    const responseTime = Date.now() - startTime
    logInfo(`[Dashboard] Executive dashboard data fetched in ${responseTime}ms`)

    res.json({
      success: true,
      data: {
        kpis,
        charts: {
          revenue: {
            labels: plData?.map(p => p.reportDate).reverse() || [],
            data: plData?.map(p => p.totalRevenue || 0).reverse() || [],
          },
          profitLoss: {
            labels: plData?.map(p => p.reportDate).reverse() || [],
            revenue: plData?.map(p => p.totalRevenue || 0).reverse() || [],
            expenses: plData?.map(p => p.totalExpenses || 0).reverse() || [],
            profit: plData?.map(p => p.netProfit || 0).reverse() || [],
          },
        },
        workingCapital: wcData.data,
        metadata: {
          timestamp: new Date().toISOString(),
          responseTime,
          dataAvailable: true,
          dataSource: 'xero_api',
          periodsIncluded: plData?.length || 0,
          integrationStatus: {
            xero: true,
            shopify: shopifyData?.success || false,
            amazon: amazonConnected || false,
          },
        },
      },
    })
  } catch (error) {
    logError('[Dashboard] Failed to fetch Xero data:', error.message)
    res.status(503).json({
      success: false,
      error: 'xero_api_error',
      message: 'Unable to fetch financial data from Xero',
      details: error.message,
      retryable: true,
    })
  }
})

/**
 * GET /api/v1/dashboard/kpis
 *
 * Returns only KPI data (for quick updates)
 */
router.get('/kpis', async (req, res) => {
  try {
    res.json({
      success: true,
      data: null,
      message: 'KPI data not available. Connect your financial and operational data sources.',
      setupRequired: true,
    })
  } catch (error) {
    console.error('[Dashboard API] Error fetching KPI data:', error)
    res.status(503).json({
      success: false,
      error: 'KPI service unavailable',
      message: error.message,
      retryable: true,
    })
  }
})

/**
 * GET /api/v1/dashboard/setup-status
 *
 * Returns integration setup status for dashboard
 */
router.get('/setup-status', async (req, res) => {
  try {
    logDebug('[Dashboard] Checking setup status...')
    const xeroHealth = await xeroService.healthCheck()
    const shopifyStatus = shopifyMultiStoreService.getConnectionStatus()
    const amazonConnected = amazonSPAPIService.isConnected
    const unleashedStatus = unleashedERPService.getConnectionStatus()

    const setupStatus = {
      integrations: {
        xero: {
          connected: xeroHealth.status === 'connected',
          status: xeroHealth.status,
          message: xeroHealth.message,
          organizationId: xeroHealth.organizationId || null,
          lastCheck: xeroHealth.lastCheck,
          required: true,
          story: 'BMAD-MOCK-001',
        },
        shopify: {
          connected: shopifyStatus.connected,
          status: shopifyStatus.connected ? 'connected' : 'pending',
          activeStores: shopifyStatus.activeStores || 0,
          totalStores: shopifyStatus.totalStores || 0,
          message: shopifyStatus.connected
            ? `${shopifyStatus.activeStores} of ${shopifyStatus.totalStores} stores connected`
            : 'Not configured. Add SHOPIFY_UK_SHOP_DOMAIN, SHOPIFY_UK_ACCESS_TOKEN, SHOPIFY_US_SHOP_DOMAIN, SHOPIFY_US_ACCESS_TOKEN.',
          required: false,
          story: 'BMAD-MOCK-002',
        },
        amazonSpApi: {
          connected: amazonConnected,
          status: amazonConnected ? 'connected' : 'pending',
          message: amazonConnected
            ? 'Amazon SP-API connected successfully'
            : 'Not configured. Add AMAZON_REFRESH_TOKEN, AMAZON_LWA_APP_ID, AMAZON_LWA_CLIENT_SECRET, AMAZON_SP_ROLE_ARN environment variables.',
          required: false,
          story: 'BMAD-MOCK-003',
        },
        unleashedErp: {
          connected: unleashedStatus.connected,
          status: unleashedStatus.connected ? 'connected' : 'pending',
          message: unleashedStatus.connected
            ? `Unleashed ERP connected successfully. Sync interval: ${unleashedStatus.syncInterval}`
            : 'Not configured. Add UNLEASHED_API_ID, UNLEASHED_API_KEY, UNLEASHED_API_URL environment variables.',
          apiEndpoint: unleashedStatus.apiEndpoint,
          syncInterval: unleashedStatus.syncInterval,
          required: false,
          story: 'BMAD-MOCK-004',
        },
      },
      dashboardReady: xeroHealth.status === 'connected',
      nextSteps:
        xeroHealth.status === 'connected'
          ? [
              'Xero connected successfully! ✅',
              shopifyStatus.connected
                ? `Shopify connected successfully! ${shopifyStatus.activeStores} stores active ✅`
                : 'Optional: Connect Shopify for sales data (BMAD-MOCK-002)',
              amazonConnected
                ? 'Amazon SP-API connected successfully! ✅'
                : 'Optional: Connect Amazon SP-API for order data (BMAD-MOCK-003)',
              unleashedStatus.connected
                ? 'Unleashed ERP connected successfully! ✅'
                : 'Optional: Connect Unleashed ERP for manufacturing/inventory data (BMAD-MOCK-004)',
            ]
          : [
              'Set XERO_CLIENT_ID environment variable',
              'Set XERO_CLIENT_SECRET environment variable',
              'Restart application to connect to Xero',
              'Verify connection at /api/v1/dashboard/setup-status',
            ],
    }

    logInfo(
      `[Dashboard] Setup status checked: Xero ${xeroHealth.status}, Shopify ${shopifyStatus.connected ? `${shopifyStatus.activeStores} stores` : 'not connected'}, Amazon ${amazonConnected ? 'connected' : 'not connected'}, Unleashed ${unleashedStatus.connected ? 'connected' : 'not connected'}`
    )

    res.json({
      success: true,
      data: setupStatus,
    })
  } catch (error) {
    logError('[Dashboard] Setup status check failed:', error.message)
    res.status(500).json({
      success: false,
      error: 'setup_check_failed',
      message: error.message,
    })
  }
})

/**
 * GET /api/v1/dashboard/sales-trends
 *
 * Returns sales trends data from Shopify multi-store
 * Period options: 1month, 3months, 6months, 12months
 */
router.get('/sales-trends', async (req, res) => {
  try {
    const { period = '12months' } = req.query
    logDebug(`[Dashboard] Fetching sales trends (period: ${period})...`)

    const shopifyStatus = shopifyMultiStoreService.getConnectionStatus()

    if (!shopifyStatus.connected) {
      return res.json({
        success: false,
        error: 'shopify_not_connected',
        data: [],
        message: 'Shopify stores not configured',
        setupRequired: true,
      })
    }

    const trendsData = await shopifyMultiStoreService.getSalesTrends({
      period,
      includeQuantity: true,
    })

    if (!trendsData.success) {
      logWarn('[Dashboard] Sales trends fetch failed:', trendsData.error)
      return res.json({
        success: false,
        error: trendsData.error,
        data: [],
      })
    }

    // Transform for frontend charting
    const chartData = trendsData.data.map(month => ({
      date: month.date,
      revenue: month.revenue,
      quantity: month.quantity,
      orders: month.orders,
      avgOrderValue: month.orders > 0 ? month.revenue / month.orders : 0,
    }))

    logInfo(`[Dashboard] Sales trends fetched: ${chartData.length} months`)

    res.json({
      success: true,
      data: chartData,
      period: trendsData.period,
      dateRange: trendsData.dateRange,
      lastUpdated: trendsData.lastUpdated,
    })
  } catch (error) {
    logError('[Dashboard] Error fetching sales trends:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
    })
  }
})

/**
 * GET /api/v1/dashboard/product-performance
 *
 * Returns top products by revenue from Shopify
 */
router.get('/product-performance', async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query
    logDebug(`[Dashboard] Fetching product performance (limit: ${limit})...`)

    const shopifyStatus = shopifyMultiStoreService.getConnectionStatus()

    if (!shopifyStatus.connected) {
      return res.json({
        success: false,
        error: 'shopify_not_connected',
        data: { products: [], summary: {} },
        message: 'Shopify stores not configured',
        setupRequired: true,
      })
    }

    const performanceData = await shopifyMultiStoreService.getProductPerformance({
      startDate,
      endDate,
      limit: parseInt(limit),
    })

    // Transform for frontend display
    const topProducts = performanceData.products.map(product => ({
      id: product.id,
      title: product.title,
      sku: product.sku,
      unitsSold: product.unitsSold,
      revenue: product.revenue,
      currency: product.currency,
      region: product.storeName,
      avgPrice: product.unitsSold > 0 ? product.revenue / product.unitsSold : 0,
    }))

    logInfo(`[Dashboard] Product performance fetched: ${topProducts.length} products`)

    res.json({
      success: true,
      data: {
        products: topProducts,
        summary: {
          totalRevenue: performanceData.totalRevenue,
          totalOrders: performanceData.totalOrders,
          totalUnitsSold: performanceData.totalUnitsSold,
          avgOrderValue: performanceData.averageOrderValue,
        },
        dateRange: performanceData.dateRange,
        lastUpdated: performanceData.lastUpdated,
      },
    })
  } catch (error) {
    logError('[Dashboard] Error fetching product performance:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
      data: { products: [], summary: {} },
    })
  }
})

/**
 * GET /api/v1/dashboard/shopify-sales
 *
 * Returns consolidated Shopify sales data with commission tracking
 */
router.get('/shopify-sales', async (req, res) => {
  try {
    logDebug('[Dashboard] Fetching Shopify sales data...')

    const shopifyStatus = shopifyMultiStoreService.getConnectionStatus()

    if (!shopifyStatus.connected) {
      return res.json({
        success: false,
        error: 'shopify_not_connected',
        data: null,
        message:
          'Shopify stores not configured. Add SHOPIFY_UK_SHOP_DOMAIN, SHOPIFY_UK_ACCESS_TOKEN, SHOPIFY_US_SHOP_DOMAIN, SHOPIFY_US_ACCESS_TOKEN environment variables.',
        setupRequired: true,
        shopifyStatus: shopifyStatus,
      })
    }

    const salesData = await shopifyMultiStoreService.getConsolidatedSalesData()

    if (!salesData.success) {
      logWarn('[Dashboard] Shopify sales data fetch failed:', salesData.error)
      return res.json({
        success: false,
        error: salesData.error,
        errorType: salesData.errorType,
        data: null,
        setupRequired: salesData.setupRequired || false,
      })
    }

    // Regional breakdown
    const regionalData = (salesData.stores || []).map(store => ({
      region: store.region,
      name: store.name,
      revenue: store.sales || 0,
      netRevenue: store.netSales || 0,
      transactionFees: store.transactionFees || 0,
      orders: store.orders || 0,
      customers: store.customers || 0,
      avgOrderValue: store.avgOrderValue || 0,
      currency: store.currency,
      status: store.status,
      productsCount: store.products?.length || 0,
    }))

    logInfo(
      `[Dashboard] Shopify sales data fetched: ${salesData.totalOrders} orders, ${regionalData.length} stores`
    )

    res.json({
      success: true,
      data: {
        sales: {
          totalOrders: salesData.totalOrders || 0,
          totalRevenue: salesData.totalRevenue || 0,
          netRevenue: salesData.netRevenue || 0,
          transactionFees: salesData.transactionFees || 0,
          feeRate: salesData.feeRate || 0.029,
          avgOrderValue: salesData.avgOrderValue || 0,
          avgNetOrderValue: salesData.avgNetOrderValue || 0,
          customers: salesData.totalCustomers || 0,
        },
        commission: salesData.commission || {},
        regionalPerformance: regionalData,
        shopifyStatus: shopifyStatus,
        lastUpdated: salesData.lastUpdated,
      },
    })
  } catch (error) {
    logError('[Dashboard] Error fetching Shopify sales data:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
      data: null,
    })
  }
})

/**
 * GET /api/v1/dashboard/amazon-orders
 *
 * Returns Amazon SP-API order data and metrics
 */
router.get('/amazon-orders', async (req, res) => {
  try {
    logDebug('[Dashboard] Fetching Amazon order data...')

    if (!amazonSPAPIService.isConnected) {
      return res.json({
        success: false,
        error: 'amazon_not_connected',
        data: null,
        message:
          'Amazon SP-API not configured. Add AMAZON_REFRESH_TOKEN, AMAZON_LWA_APP_ID, AMAZON_LWA_CLIENT_SECRET, AMAZON_SP_ROLE_ARN environment variables.',
        setupRequired: true,
      })
    }

    const orderMetrics = await amazonSPAPIService.getOrderMetrics()

    logInfo(`[Dashboard] Amazon order metrics fetched: ${orderMetrics.totalOrders} orders`)

    res.json({
      success: true,
      data: {
        orders: {
          totalOrders: orderMetrics.totalOrders || 0,
          totalRevenue: orderMetrics.totalRevenue || 0,
          averageOrderValue: orderMetrics.averageOrderValue || 0,
          unshippedOrders: orderMetrics.unshippedOrders || 0,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          dataSource: 'amazon_sp_api',
          timeRange: 'Last 24 hours',
        },
      },
    })
  } catch (error) {
    logError('[Dashboard] Error fetching Amazon order data:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
      data: null,
    })
  }
})

/**
 * GET /api/v1/dashboard/amazon-inventory
 *
 * Returns Amazon FBA inventory summary
 */
router.get('/amazon-inventory', async (req, res) => {
  try {
    logDebug('[Dashboard] Fetching Amazon inventory data...')

    if (!amazonSPAPIService.isConnected) {
      return res.json({
        success: false,
        error: 'amazon_not_connected',
        data: null,
        message:
          'Amazon SP-API not configured. Add AMAZON_REFRESH_TOKEN, AMAZON_LWA_APP_ID, AMAZON_LWA_CLIENT_SECRET, AMAZON_SP_ROLE_ARN environment variables.',
        setupRequired: true,
      })
    }

    const inventorySummary = await amazonSPAPIService.getInventorySummary()

    logInfo(`[Dashboard] Amazon inventory summary fetched: ${inventorySummary.totalSKUs} SKUs`)

    res.json({
      success: true,
      data: {
        inventory: {
          totalSKUs: inventorySummary.totalSKUs || 0,
          totalQuantity: inventorySummary.totalQuantity || 0,
          lowStockItems: inventorySummary.lowStockItems || 0,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          dataSource: 'amazon_sp_api',
          lastSync: inventorySummary.lastSync,
        },
      },
    })
  } catch (error) {
    logError('[Dashboard] Error fetching Amazon inventory data:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
      data: null,
    })
  }
})

/**
 * GET /api/v1/dashboard/unleashed-manufacturing
 *
 * Returns Unleashed ERP manufacturing and production data
 */
router.get('/unleashed-manufacturing', async (req, res) => {
  try {
    logDebug('[Dashboard] Fetching Unleashed manufacturing data...')

    const unleashedStatus = unleashedERPService.getConnectionStatus()

    if (!unleashedStatus.connected) {
      return res.json({
        success: false,
        error: 'unleashed_not_connected',
        data: null,
        message:
          'Unleashed ERP not configured. Add UNLEASHED_API_ID, UNLEASHED_API_KEY, UNLEASHED_API_URL environment variables.',
        setupRequired: true,
        unleashedStatus: unleashedStatus,
      })
    }

    const manufacturingData = await unleashedERPService.getConsolidatedData()

    if (manufacturingData.error) {
      logWarn('[Dashboard] Unleashed manufacturing data fetch failed:', manufacturingData.error)
      return res.json({
        success: false,
        error: manufacturingData.error,
        data: null,
        setupRequired: false,
      })
    }

    logInfo(
      `[Dashboard] Unleashed manufacturing data fetched: ${manufacturingData.production?.activeBatches || 0} active batches`
    )

    res.json({
      success: true,
      data: {
        production: {
          activeBatches: manufacturingData.production?.activeBatches || 0,
          completedToday: manufacturingData.production?.completedToday || 0,
          qualityScore: manufacturingData.production?.qualityScore || 0,
          utilizationRate: manufacturingData.production?.utilizationRate || 0,
        },
        resources: {
          utilizationRate: manufacturingData.resources?.utilizationRate || 0,
          status: manufacturingData.resources?.status || [],
        },
        productionSchedule: manufacturingData.productionSchedule || [],
        alerts: {
          qualityAlerts: manufacturingData.qualityAlerts || [],
          inventoryAlerts: manufacturingData.inventoryAlerts || [],
        },
        metadata: {
          timestamp: new Date().toISOString(),
          dataSource: 'unleashed_erp',
          lastUpdated: manufacturingData.lastUpdated,
        },
      },
    })
  } catch (error) {
    logError('[Dashboard] Error fetching Unleashed manufacturing data:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
      data: null,
    })
  }
})

/**
 * GET /api/v1/dashboard/channel-performance
 *
 * Returns consolidated channel performance comparison (Shopify vs Amazon)
 * Enables marketplace strategy decisions and commission tracking
 */
router.get('/channel-performance', async (req, res) => {
  try {
    logDebug('[Dashboard] Fetching channel performance comparison...')

    const shopifyStatus = shopifyMultiStoreService.getConnectionStatus()
    const amazonConnected = amazonSPAPIService.isConnected

    // Fetch data from both channels in parallel
    const [shopifyData, amazonOrders, amazonInventory] = await Promise.all([
      shopifyStatus.connected
        ? shopifyMultiStoreService.getConsolidatedSalesData()
        : Promise.resolve({ success: false }),
      amazonConnected ? amazonSPAPIService.getOrderMetrics() : Promise.resolve(null),
      amazonConnected ? amazonSPAPIService.getInventorySummary() : Promise.resolve(null),
    ])

    const channels = []

    // Shopify channel
    if (shopifyData.success) {
      channels.push({
        channel: 'Shopify (UK/EU + USA)',
        revenue: shopifyData.totalRevenue || 0,
        netRevenue: shopifyData.netRevenue || 0,
        orders: shopifyData.totalOrders || 0,
        customers: shopifyData.totalCustomers || 0,
        avgOrderValue: shopifyData.avgOrderValue || 0,
        commission: {
          fees: shopifyData.transactionFees || 0,
          rate: 0.029,
          description: '2.9% Shopify transaction fees',
        },
        status: 'connected',
        storeCount: shopifyData.stores?.length || 0,
      })
    }

    // Amazon channel
    if (amazonConnected && amazonOrders) {
      channels.push({
        channel: 'Amazon FBA',
        revenue: amazonOrders.totalRevenue || 0,
        orders: amazonOrders.totalOrders || 0,
        avgOrderValue: amazonOrders.averageOrderValue || 0,
        unshippedOrders: amazonOrders.unshippedOrders || 0,
        inventoryStatus: amazonInventory
          ? {
              totalSKUs: amazonInventory.totalSKUs || 0,
              totalQuantity: amazonInventory.totalQuantity || 0,
              lowStockItems: amazonInventory.lowStockItems || 0,
            }
          : null,
        status: 'connected',
      })
    }

    // Calculate totals
    const totalRevenue = channels.reduce((sum, ch) => sum + (ch.revenue || 0), 0)
    const totalOrders = channels.reduce((sum, ch) => sum + (ch.orders || 0), 0)

    logInfo(
      `[Dashboard] Channel performance fetched: ${channels.length} channels, $${totalRevenue.toFixed(2)} total revenue`
    )

    res.json({
      success: true,
      data: {
        channels,
        summary: {
          totalRevenue,
          totalOrders,
          avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          channelCount: channels.length,
        },
        integrationStatus: {
          shopify: shopifyStatus.connected ? 'connected' : 'pending',
          amazon: amazonConnected ? 'connected' : 'pending',
        },
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    logError('[Dashboard] Error fetching channel performance:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
      data: { channels: [], summary: {} },
    })
  }
})

export default router
