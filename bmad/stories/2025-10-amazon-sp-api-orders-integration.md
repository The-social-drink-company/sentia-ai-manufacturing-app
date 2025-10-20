# BMAD-MOCK-003: Amazon SP-API Orders & Inventory Integration

**Story ID**: BMAD-MOCK-003
**Epic**: EPIC-002 (Eliminate Mock Data - Production-Ready Application)
**Sprint**: Sprint 2 - E-Commerce & Inventory Data
**Story Points**: 6
**Estimated Effort**: 3 days
**Priority**: High
**Status**: Ready for Development

**Created**: 2025-10-19
**Assigned To**: Development Team
**BMAD Agent Role**: Developer (`bmad dev`)

---

## 📋 Story Overview

**As a** manufacturing operations manager
**I want** real-time order and inventory data from Amazon FBA integrated into the dashboard
**So that** I can make accurate production planning decisions based on actual Amazon sales velocity and inventory levels

---

## 🎯 Business Value

**Current State (Problem)**:
- Dashboard shows mock Amazon order data
- No visibility into real FBA inventory levels
- Cannot identify Amazon-specific demand patterns
- Production planning disconnected from Amazon sales velocity
- No tracking of Amazon FBA shipment status

**Target State (Solution)**:
- Live order data from Amazon SP-API (last 24 hours rolling)
- Real-time FBA inventory levels (fulfillable, reserved, inbound)
- Amazon-specific sales metrics (total orders, revenue, AOV)
- FBA shipment tracking (inbound to fulfillment centers)
- Low-stock alerts for Amazon SKUs

**Business Impact**:
- **Demand Accuracy**: Real Amazon sales patterns replace synthetic data
- **Inventory Optimization**: FBA stock levels visible for reorder decisions
- **Channel Strategy**: Amazon vs Shopify performance comparison
- **Production Planning**: Manufacturing aligned with actual Amazon sales velocity
- **Risk Mitigation**: Low-stock alerts prevent Amazon stockouts

---

## 🔍 Current State Analysis

### Existing Amazon SP-API Service Implementation

**File**: [`services/amazon-sp-api.js`](../services/amazon-sp-api.js) (395 lines)

**✅ Already Implemented**:
```javascript
class AmazonSPAPIService {
  constructor() {
    this.credentials = {
      refresh_token: process.env.AMAZON_REFRESH_TOKEN,
      lwa_app_id: process.env.AMAZON_LWA_APP_ID,
      lwa_client_secret: process.env.AMAZON_LWA_CLIENT_SECRET,
      aws_selling_partner_role: process.env.AMAZON_SP_ROLE_ARN,
      region: process.env.AMAZON_REGION || 'us-east-1'
    };
  }

  // ✅ SP-API initialization with OAuth
  async initialize() {
    // Dynamic import of amazon-sp-api package
    // LWA (Login with Amazon) authentication
    // Marketplace participation check
    // Lines 53-90
  }

  // ✅ FBA inventory sync
  async syncInventoryData() {
    // getInventorySummaries API call
    // Tracks: totalQuantity, fulfillableQuantity, reservedQuantity
    // Inbound tracking: inboundWorkingQuantity, inboundShippedQuantity
    // Database upsert via Prisma
    // Redis caching (5-minute TTL)
    // Lines 106-171
  }

  // ✅ Order data sync (24-hour rolling window)
  async syncOrderData() {
    // getOrders API call
    // Order statuses: Unshipped, PartiallyShipped, Shipped
    // Order totals, item counts, fulfillment channel
    // Lines 173-219
  }

  // ✅ FBA shipment tracking
  async syncFBAData() {
    // getShipments API call (FBA inbound)
    // Shipment status, destination FC, need-by dates
    // Lines 221-261
  }

  // ✅ Automated sync scheduler (15-minute intervals)
  startDataSync() {
    // Initial sync + recurring every 15 minutes
    // Lines 299-309
  }

  // ✅ Inventory summary aggregation
  async getInventorySummary() {
    // Redis cache fallback to database
    // Total SKUs, total quantity, low-stock count
    // Lines 328-351
  }

  // ✅ Order metrics aggregation
  async getOrderMetrics() {
    // Last 24 hours order stats
    // Total orders, revenue, AOV, unshipped count
    // Lines 353-375
  }
}
```

**🎯 Service Strengths**:
- Complete Amazon SP-API integration (`amazon-sp-api` package v3+)
- LWA OAuth 2.0 authentication
- Multi-API endpoint support (Orders, Inventory, FBA Inbound)
- Prisma ORM for database persistence
- Redis caching reduces API calls
- Automatic sync scheduler (15-minute intervals)
- Comprehensive error handling

**⚠️ Integration Gaps**:
- Service initialization not called in `server.js`
- Dashboard API endpoints don't query Amazon data
- Frontend components not connected to Amazon metrics
- No SSE events for real-time Amazon updates
- Missing empty states for unconfigured Amazon credentials

**📦 Amazon SP-API Package Status**:
- Package installed: `amazon-sp-api` (node_modules present)
- Dynamic import pattern ready (lines 8-31)
- Requires credentials configuration (no mock fallback allowed)

---

## 🛠️ Technical Implementation Plan

### Phase 1: Amazon SP-API Credential Setup (0.5 days)

**1.1 Obtain Amazon SP-API Credentials**

**Prerequisites**:
- Amazon Seller Central account access
- AWS IAM access (for STS role creation)

**Steps**:

1. **Create SP-API Application** (Seller Central)
   - Navigate to: https://sellercentral.amazon.com/apps/authorize/consent
   - Go to: **Apps & Services** → **Develop Apps**
   - Click **Add new app client**
   - App name: `Sentia Manufacturing Dashboard`
   - OAuth redirect URI: `https://capliquify-frontend-prod.onrender.com/amazon/callback`
   - Select roles:
     - View and manage orders
     - View and manage inventory (FBA)
     - View shipments (FBA Inbound)
   - Note down:
     - **LWA Client ID** (`amzn1.application-oa2-client.xxxxx`)
     - **LWA Client Secret** (`amzn1.oa2-cs.v1.xxxxx`)

2. **Create IAM Role** (AWS Console)
   ```bash
   # Role name: SentiaManufacturingDashboardSPRole
   # Trust policy (allows SP-API to assume role):
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::437568002678:role/SP-API"
         },
         "Action": "sts:AssumeRole"
       }
     ]
   }

   # Attach policy: AmazonSellerPartnerAPIFullAccess (custom or managed)
   ```
   - Note down: **Role ARN** (`arn:aws:iam::YOUR_ACCOUNT:role/SentiaManufacturingDashboardSPRole`)

3. **Generate Refresh Token**
   ```bash
   # Use SP-API authorization flow
   # https://developer-docs.amazon.com/sp-api/docs/connecting-to-the-selling-partner-api

   # Authorization URL (replace CLIENT_ID):
   https://sellercentral.amazon.com/apps/authorize/consent?application_id=amzn1.application-oa2-client.XXXXX&state=stateexample&version=beta

   # After authorization, exchange code for refresh token
   curl -X POST https://api.amazon.com/auth/o2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "code=AUTH_CODE_FROM_REDIRECT" \
     -d "client_id=amzn1.application-oa2-client.XXXXX" \
     -d "client_secret=amzn1.oa2-cs.v1.XXXXX"

   # Response includes: refresh_token
   ```

**1.2 Configure Environment Variables**

**File**: `.env` (Render dashboard environment variables)

```bash
# Amazon SP-API Authentication
AMAZON_REFRESH_TOKEN=Atzr|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AMAZON_LWA_APP_ID=amzn1.application-oa2-client.xxxxxxxxxxxxxxxxxxxxx
AMAZON_LWA_CLIENT_SECRET=amzn1.oa2-cs.v1.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AMAZON_SP_ROLE_ARN=arn:aws:iam::123456789012:role/SentiaManufacturingDashboardSPRole
AMAZON_REGION=us-east-1
AMAZON_SELLER_ID=A1XXXXXXXXXXXXX
```

**Validation Steps**:
```bash
# Test Amazon SP-API connection
node -e "
import amazonSPAPIService from './services/amazon-sp-api.js';
await amazonSPAPIService.initialize();
console.log('Amazon Connection:', amazonSPAPIService.isConnected ? 'SUCCESS' : 'FAILED');
const summary = await amazonSPAPIService.getInventorySummary();
console.log('Inventory Summary:', JSON.stringify(summary, null, 2));
"
```

**Expected Output**:
```json
{
  "totalSKUs": 45,
  "totalQuantity": 1250,
  "lowStockItems": 3,
  "lastSync": "2025-10-19T14:30:00.000Z"
}
```

**1.3 Initialize Amazon Service in Server**

**File**: [`server.js`](../server.js)

```javascript
// Add after Shopify service initialization
import amazonSPAPIService from './services/amazon-sp-api.js';

// Initialize Amazon SP-API connection
const initializeAmazon = async () => {
  try {
    logInfo('AMAZON: Initializing SP-API connection...');
    await amazonSPAPIService.initialize();

    if (amazonSPAPIService.isConnected) {
      logInfo('AMAZON: Connected to Amazon SP-API successfully');

      // Get initial metrics
      const inventory = await amazonSPAPIService.getInventorySummary();
      const orders = await amazonSPAPIService.getOrderMetrics();

      logInfo(`AMAZON: Inventory - ${inventory.totalSKUs} SKUs, ${inventory.totalQuantity} units`);
      logInfo(`AMAZON: Orders - ${orders.totalOrders} orders (last 24h), $${orders.totalRevenue.toFixed(2)} revenue`);

      if (inventory.lowStockItems > 0) {
        logWarn(`AMAZON: ⚠️ ${inventory.lowStockItems} SKUs below reorder point`);
      }
    } else {
      logWarn('AMAZON: SP-API not connected. Check environment variables:');
      logWarn('  Required: AMAZON_REFRESH_TOKEN, AMAZON_LWA_APP_ID, AMAZON_LWA_CLIENT_SECRET');
      logWarn('  Required: AMAZON_SP_ROLE_ARN, AMAZON_SELLER_ID');
    }

    return amazonSPAPIService.isConnected;
  } catch (error) {
    logError('AMAZON: Initialization failed:', error.message);
    logError('  Ensure amazon-sp-api package is installed: npm install amazon-sp-api');
    logError('  Verify all SP-API credentials are configured correctly');
    return false;
  }
};

// Call during server startup (after database connection)
const amazonConnected = await initializeAmazon();
```

**Success Criteria**:
- ✅ Server logs show "Connected to Amazon SP-API successfully"
- ✅ Inventory summary displays actual SKU counts
- ✅ Order metrics show last 24h data
- ✅ No authentication errors in startup logs
- ✅ Sync scheduler started (15-minute intervals)

---

### Phase 2: Dashboard API Integration (1 day)

**2.1 Update Executive Dashboard Endpoint**

**File**: [`server/api/dashboard.js`](../server/api/dashboard.js)

**Add Amazon Data Integration**:
```javascript
import amazonSPAPIService from '../../services/amazon-sp-api.js';

router.get('/executive', async (req, res) => {
  const startTime = Date.now();

  try {
    // Check Amazon connection status
    const amazonConnected = amazonSPAPIService.isConnected;

    // Fetch Shopify data (from BMAD-MOCK-002)
    const shopifyData = await shopifyMultiStoreService.getConsolidatedSalesData();

    // Fetch Amazon data if connected
    let amazonInventory = null;
    let amazonOrders = null;

    if (amazonConnected) {
      try {
        [amazonInventory, amazonOrders] = await Promise.all([
          amazonSPAPIService.getInventorySummary(),
          amazonSPAPIService.getOrderMetrics()
        ]);
      } catch (error) {
        logError('AMAZON: Data fetch failed:', error);
        // Continue with Shopify data only
      }
    }

    // Build KPIs combining Shopify + Amazon
    const kpis = {
      revenue: {
        label: 'Total Revenue',
        shopify: shopifyData?.totalRevenue || 0,
        amazon: amazonOrders?.totalRevenue || 0,
        total: (shopifyData?.totalRevenue || 0) + (amazonOrders?.totalRevenue || 0),
        unit: 'USD', // TODO: Handle multi-currency conversion
        trend: 'neutral',
        sources: {
          shopify: shopifyData?.success ? 'connected' : 'disconnected',
          amazon: amazonConnected ? 'connected' : 'disconnected'
        }
      },
      orders: {
        label: 'Total Orders',
        shopify: shopifyData?.totalOrders || 0,
        amazon: amazonOrders?.totalOrders || 0,
        total: (shopifyData?.totalOrders || 0) + (amazonOrders?.totalOrders || 0),
        unit: 'orders',
        trend: 'neutral',
        sources: {
          shopify: shopifyData?.success ? 'connected' : 'disconnected',
          amazon: amazonConnected ? 'connected' : 'disconnected'
        }
      },
      inventory: {
        label: 'Total Inventory',
        amazon: amazonInventory?.totalQuantity || 0,
        lowStockItems: amazonInventory?.lowStockItems || 0,
        unit: 'units',
        trend: amazonInventory?.lowStockItems > 5 ? 'down' : 'neutral',
        source: amazonConnected ? 'connected' : 'disconnected'
      },
      avgOrderValue: {
        label: 'Avg Order Value',
        shopify: shopifyData?.avgOrderValue || 0,
        amazon: amazonOrders?.averageOrderValue || 0,
        combined: (shopifyData?.totalOrders || 0) + (amazonOrders?.totalOrders || 0) > 0
          ? ((shopifyData?.totalRevenue || 0) + (amazonOrders?.totalRevenue || 0)) /
            ((shopifyData?.totalOrders || 0) + (amazonOrders?.totalOrders || 0))
          : 0,
        unit: 'per order',
        trend: 'neutral'
      }
    };

    // Channel performance comparison
    const channelPerformance = [
      {
        channel: 'Shopify (UK/EU + USA)',
        revenue: shopifyData?.totalRevenue || 0,
        netRevenue: shopifyData?.netRevenue || 0,
        orders: shopifyData?.totalOrders || 0,
        customers: shopifyData?.totalCustomers || 0,
        avgOrderValue: shopifyData?.avgOrderValue || 0,
        commission: {
          fees: shopifyData?.transactionFees || 0,
          rate: 0.029,
          description: '2.9% Shopify transaction fees'
        },
        status: shopifyData?.success ? 'connected' : 'disconnected'
      },
      {
        channel: 'Amazon FBA',
        revenue: amazonOrders?.totalRevenue || 0,
        orders: amazonOrders?.totalOrders || 0,
        avgOrderValue: amazonOrders?.averageOrderValue || 0,
        unshippedOrders: amazonOrders?.unshippedOrders || 0,
        inventoryStatus: {
          totalSKUs: amazonInventory?.totalSKUs || 0,
          totalQuantity: amazonInventory?.totalQuantity || 0,
          lowStockItems: amazonInventory?.lowStockItems || 0
        },
        status: amazonConnected ? 'connected' : 'disconnected'
      }
    ];

    const dashboardData = {
      kpis,
      channelPerformance,
      metadata: {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        dataAvailable: shopifyData?.success || amazonConnected,
        integrationStatus: {
          shopify: {
            connected: shopifyData?.success || false,
            activeStores: shopifyData?.stores?.length || 0
          },
          amazon: {
            connected: amazonConnected,
            inventorySync: amazonInventory ? 'active' : 'inactive',
            orderSync: amazonOrders ? 'active' : 'inactive'
          }
        }
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('[Dashboard API] Error fetching dashboard data:', error);
    res.status(503).json({
      success: false,
      error: 'Dashboard service error',
      message: error.message,
      retryable: true
    });
  }
});
```

**2.2 Add Amazon Inventory Endpoint**

**New Endpoint**: `GET /api/v1/dashboard/amazon-inventory`

```javascript
router.get('/amazon-inventory', async (req, res) => {
  try {
    if (!amazonSPAPIService.isConnected) {
      return res.json({
        success: false,
        setupRequired: true,
        message: 'Amazon SP-API not configured. Add credentials to view FBA inventory.',
        data: null
      });
    }

    // Get detailed inventory from database
    const inventoryItems = await prisma.amazonInventory.findMany({
      orderBy: { fulfillableQuantity: 'asc' }, // Low-stock items first
      take: 100
    });

    // Categorize inventory
    const lowStock = inventoryItems.filter(item => item.fulfillableQuantity < 10);
    const outOfStock = inventoryItems.filter(item => item.fulfillableQuantity === 0);
    const inbound = inventoryItems.filter(item => item.inboundWorkingQuantity > 0);

    const inventoryData = {
      summary: {
        totalSKUs: inventoryItems.length,
        totalQuantity: inventoryItems.reduce((sum, item) => sum + item.totalQuantity, 0),
        fulfillableQuantity: inventoryItems.reduce((sum, item) => sum + item.fulfillableQuantity, 0),
        reservedQuantity: inventoryItems.reduce((sum, item) => sum + item.reservedQuantity, 0),
        inboundQuantity: inventoryItems.reduce((sum, item) => sum + item.inboundWorkingQuantity, 0)
      },
      alerts: {
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        inboundCount: inbound.length
      },
      items: inventoryItems.map(item => ({
        asin: item.asin,
        sku: item.sku,
        productName: item.productName,
        fulfillableQuantity: item.fulfillableQuantity,
        reservedQuantity: item.reservedQuantity,
        inboundQuantity: item.inboundWorkingQuantity + item.inboundShippedQuantity,
        totalQuantity: item.totalQuantity,
        status: item.fulfillableQuantity === 0 ? 'out-of-stock' :
                item.fulfillableQuantity < 10 ? 'low-stock' :
                'in-stock',
        lastUpdated: item.lastUpdated
      })),
      lastSync: inventoryItems[0]?.lastUpdated || null
    };

    res.json({
      success: true,
      data: inventoryData
    });

  } catch (error) {
    console.error('[Dashboard API] Error fetching Amazon inventory:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: null
    });
  }
});
```

**2.3 Add Amazon Orders Endpoint**

**New Endpoint**: `GET /api/v1/dashboard/amazon-orders`

```javascript
router.get('/amazon-orders', async (req, res) => {
  try {
    if (!amazonSPAPIService.isConnected) {
      return res.json({
        success: false,
        setupRequired: true,
        message: 'Amazon SP-API not configured.',
        data: null
      });
    }

    // Get orders from last 24 hours
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    const orders = await prisma.amazonOrder.findMany({
      where: {
        purchaseDate: {
          gte: startTime,
          lte: endTime
        }
      },
      orderBy: { purchaseDate: 'desc' }
    });

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.orderTotal, 0);
    const unshippedOrders = orders.filter(order => order.orderStatus === 'Unshipped');
    const shippedOrders = orders.filter(order => order.orderStatus === 'Shipped');

    const orderData = {
      summary: {
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        unshippedCount: unshippedOrders.length,
        shippedCount: shippedOrders.length
      },
      orders: orders.map(order => ({
        amazonOrderId: order.amazonOrderId,
        orderStatus: order.orderStatus,
        purchaseDate: order.purchaseDate,
        orderTotal: order.orderTotal,
        currency: order.currencyCode,
        itemsShipped: order.numberOfItemsShipped,
        itemsUnshipped: order.numberOfItemsUnshipped,
        fulfillmentChannel: order.fulfillmentChannel,
        salesChannel: order.salesChannel
      })),
      dateRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      }
    };

    res.json({
      success: true,
      data: orderData
    });

  } catch (error) {
    console.error('[Dashboard API] Error fetching Amazon orders:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: null
    });
  }
});
```

**Testing Phase 2**:
```bash
# Test executive dashboard with Amazon data
curl http://localhost:5000/api/v1/dashboard/executive | jq

# Expected: kpis with Shopify + Amazon combined metrics
# Expected: channelPerformance comparing Shopify vs Amazon

# Test Amazon inventory
curl http://localhost:5000/api/v1/dashboard/amazon-inventory | jq

# Expected: FBA inventory summary with low-stock alerts

# Test Amazon orders
curl http://localhost:5000/api/v1/dashboard/amazon-orders | jq

# Expected: Last 24h orders with revenue metrics
```

---

### Phase 3: Real-Time SSE Events (0.5 days)

**3.1 Add SSE Events to Amazon Sync**

**File**: [`services/amazon-sp-api.js`](../services/amazon-sp-api.js)

**Modify**: `performFullSync()` method (Lines 311-326)

```javascript
// Add SSE import at top of file
import { sendEvent } from './sse-service.js'; // Assuming SSE service exists

async performFullSync() {
  try {
    logDebug('🚀 Starting full Amazon data sync...');

    // Send SSE event: sync started
    sendEvent('amazon-sync-started', {
      timestamp: new Date().toISOString()
    });

    const [inventory, orders, fba] = await Promise.all([
      this.syncInventoryData(),
      this.syncOrderData(),
      this.syncFBAData()
    ]);

    logDebug('✅ Full Amazon sync completed successfully');

    // Get aggregated metrics
    const inventorySummary = await this.getInventorySummary();
    const orderMetrics = await this.getOrderMetrics();

    // Send SSE event: sync completed
    sendEvent('amazon-sync-completed', {
      inventory: {
        totalSKUs: inventorySummary.totalSKUs,
        totalQuantity: inventorySummary.totalQuantity,
        lowStockItems: inventorySummary.lowStockItems
      },
      orders: {
        totalOrders: orderMetrics.totalOrders,
        totalRevenue: orderMetrics.totalRevenue,
        unshippedOrders: orderMetrics.unshippedOrders
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('❌ Full sync failed:', error);

    // Send SSE event: sync error
    sendEvent('amazon-sync-error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

**3.2 Add Low-Stock Alert Events**

**File**: [`services/amazon-sp-api.js`](../services/amazon-sp-api.js)

**Modify**: `syncInventoryData()` method (Lines 106-171)

```javascript
async syncInventoryData() {
  if (!this.isConnected) {
    throw new Error('Amazon SP-API not connected');
  }

  try {
    logDebug('📦 Syncing inventory data from Amazon...');

    // ... existing sync logic ...

    // Check for new low-stock items
    const lowStockItems = processedItems.filter(item => item.fulfillableQuantity < 10);

    if (lowStockItems.length > 0) {
      // Send SSE event: low-stock alert
      sendEvent('amazon-low-stock-alert', {
        count: lowStockItems.length,
        items: lowStockItems.slice(0, 5).map(item => ({ // Top 5 critical items
          sku: item.sku,
          productName: item.productName,
          fulfillableQuantity: item.fulfillableQuantity,
          inboundQuantity: item.inboundWorkingQuantity
        })),
        timestamp: new Date().toISOString()
      });
    }

    return processedItems;

  } catch (error) {
    logError('❌ Failed to sync inventory:', error);
    throw error;
  }
}
```

**3.3 Frontend SSE Subscription**

**File**: `src/hooks/useSSE.js`

```javascript
// Add Amazon event handlers
useEffect(() => {
  const eventSource = new EventSource('/api/sse');

  eventSource.addEventListener('amazon-sync-completed', (event) => {
    const data = JSON.parse(event.data);
    console.log('Amazon sync completed:', data);

    // Invalidate dashboard queries
    queryClient.invalidateQueries(['dashboard', 'executive']);
    queryClient.invalidateQueries(['dashboard', 'amazon-inventory']);
    queryClient.invalidateQueries(['dashboard', 'amazon-orders']);

    // Show toast notification
    toast.success(`Amazon sync: ${data.inventory.totalSKUs} SKUs, ${data.orders.totalOrders} orders`);
  });

  eventSource.addEventListener('amazon-low-stock-alert', (event) => {
    const data = JSON.parse(event.data);
    console.warn('Amazon low-stock alert:', data);

    // Show persistent alert
    toast.warning(`⚠️ ${data.count} Amazon SKUs below reorder point`, {
      duration: 10000,
      action: {
        label: 'View Inventory',
        onClick: () => navigate('/inventory/amazon')
      }
    });
  });

  eventSource.addEventListener('amazon-sync-error', (event) => {
    const data = JSON.parse(event.data);
    console.error('Amazon sync error:', data);
    toast.error(`Amazon sync failed: ${data.error}`);
  });

  return () => eventSource.close();
}, []);
```

---

### Phase 4: Frontend Components (0.5 days)

**4.1 Channel Performance Comparison Widget**

**New File**: `src/components/widgets/ChannelPerformanceWidget.jsx`

```jsx
import { ShoppingBagIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function ChannelPerformanceWidget({ channelData }) {
  if (!channelData || channelData.length === 0) {
    return (
      <div className="widget-card">
        <h3>Channel Performance</h3>
        <div className="empty-state">
          <p>No channel data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card">
      <h3 className="widget-title">Sales Channel Performance</h3>

      <div className="channel-grid grid grid-cols-1 md:grid-cols-2 gap-4">
        {channelData.map(channel => (
          <div key={channel.channel} className="channel-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                {channel.channel === 'Amazon FBA' ? (
                  <ShoppingCartIcon className="h-5 w-5 text-orange-600" />
                ) : (
                  <ShoppingBagIcon className="h-5 w-5 text-green-600" />
                )}
                {channel.channel}
              </h4>
              <span className={`badge ${channel.status === 'connected' ? 'badge-success' : 'badge-error'}`}>
                {channel.status}
              </span>
            </div>

            {channel.status === 'connected' ? (
              <div className="channel-metrics space-y-2">
                <div className="metric-row flex justify-between">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-semibold">
                    ${channel.revenue.toLocaleString()}
                  </span>
                </div>

                {channel.netRevenue && (
                  <div className="metric-row flex justify-between text-sm">
                    <span className="text-green-600">Net Revenue</span>
                    <span className="text-green-600 font-semibold">
                      ${channel.netRevenue.toLocaleString()}
                    </span>
                  </div>
                )}

                {channel.commission && (
                  <div className="metric-row flex justify-between text-sm">
                    <span className="text-red-600">Fees</span>
                    <span className="text-red-600">
                      -${channel.commission.fees.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="metric-row flex justify-between">
                  <span className="text-gray-600">Orders</span>
                  <span>{channel.orders}</span>
                </div>

                <div className="metric-row flex justify-between">
                  <span className="text-gray-600">Avg Order Value</span>
                  <span>${channel.avgOrderValue.toFixed(2)}</span>
                </div>

                {channel.inventoryStatus && (
                  <>
                    <div className="divider my-2"></div>
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-600">FBA Inventory</span>
                      <span>{channel.inventoryStatus.totalQuantity} units</span>
                    </div>
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-600">Active SKUs</span>
                      <span>{channel.inventoryStatus.totalSKUs}</span>
                    </div>
                    {channel.inventoryStatus.lowStockItems > 0 && (
                      <div className="metric-row flex justify-between text-orange-600">
                        <span>⚠️ Low Stock Items</span>
                        <span className="font-semibold">{channel.inventoryStatus.lowStockItems}</span>
                      </div>
                    )}
                  </>
                )}

                {channel.unshippedOrders > 0 && (
                  <div className="metric-row flex justify-between text-blue-600">
                    <span>📦 Unshipped Orders</span>
                    <span className="font-semibold">{channel.unshippedOrders}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="channel-disconnected text-gray-500 text-sm">
                <p>Channel not configured</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**4.2 Amazon Setup Prompt Component**

**New File**: `src/components/integrations/AmazonSetupPrompt.jsx`

```jsx
import { ExclamationCircleIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function AmazonSetupPrompt({ amazonStatus }) {
  return (
    <div className="setup-prompt-card rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 p-8">
      <div className="text-center">
        <ShoppingCartIcon className="mx-auto h-16 w-16 text-orange-600" />
        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          Connect Amazon SP-API to View FBA Data
        </h3>
        <p className="mt-2 text-gray-600">
          Amazon SP-API integration is not configured. Add credentials to view inventory and order data.
        </p>

        <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
          <h4 className="font-semibold text-gray-900">Required Environment Variables:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li><code>AMAZON_REFRESH_TOKEN</code> - OAuth refresh token</li>
            <li><code>AMAZON_LWA_APP_ID</code> - LWA client ID</li>
            <li><code>AMAZON_LWA_CLIENT_SECRET</code> - LWA client secret</li>
            <li><code>AMAZON_SP_ROLE_ARN</code> - AWS IAM role ARN</li>
            <li><code>AMAZON_SELLER_ID</code> - Seller Central ID</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <a
            href="/docs/integrations/amazon-sp-api-setup"
            className="btn btn-primary"
          >
            Setup Instructions
          </a>
          <a
            href="https://sellercentral.amazon.com/apps/manage"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Seller Central
          </a>
        </div>

        {amazonStatus?.error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2">Connection Error:</h4>
            <p className="text-sm text-red-800">{amazonStatus.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Phase 5: Error Handling & Validation (0.5 days)

**5.1 Credential Validation**

**File**: [`services/amazon-sp-api.js`](../services/amazon-sp-api.js)

**Enhance**: `initialize()` method (Lines 53-90)

```javascript
async initialize() {
  try {
    // Validate required credentials
    const missingCreds = [];
    if (!this.credentials.refresh_token) missingCreds.push('AMAZON_REFRESH_TOKEN');
    if (!this.credentials.lwa_app_id) missingCreds.push('AMAZON_LWA_APP_ID');
    if (!this.credentials.lwa_client_secret) missingCreds.push('AMAZON_LWA_CLIENT_SECRET');
    if (!this.credentials.aws_selling_partner_role) missingCreds.push('AMAZON_SP_ROLE_ARN');

    if (missingCreds.length > 0) {
      const errorMsg = `Amazon SP-API credentials missing: ${missingCreds.join(', ')}. No mock data will be returned.`;
      logWarn(errorMsg);
      this.isConnected = false;
      throw new Error(errorMsg);
    }

    // Validate credential formats
    if (!this.credentials.refresh_token.startsWith('Atzr|')) {
      throw new Error('Invalid AMAZON_REFRESH_TOKEN format. Should start with "Atzr|"');
    }

    if (!this.credentials.lwa_app_id.startsWith('amzn1.application-oa2-client.')) {
      throw new Error('Invalid AMAZON_LWA_APP_ID format. Should start with "amzn1.application-oa2-client."');
    }

    if (!this.credentials.aws_selling_partner_role.startsWith('arn:aws:iam::')) {
      throw new Error('Invalid AMAZON_SP_ROLE_ARN format. Should be AWS IAM role ARN');
    }

    // Dynamically import SellingPartnerApi
    const SPAPIClass = await importSellingPartnerApi();

    this.spApi = new SPAPIClass({
      region: this.credentials.region,
      refresh_token: this.credentials.refresh_token,
      credentials: {
        SELLING_PARTNER_APP_CLIENT_ID: this.credentials.lwa_app_id,
        SELLING_PARTNER_APP_CLIENT_SECRET: this.credentials.lwa_client_secret,
        AWS_SELLING_PARTNER_ROLE: this.credentials.aws_selling_partner_role
      },
      debug: process.env.NODE_ENV === 'development'
    });

    // Test connection
    await this.testConnection();
    this.isConnected = true;

    logInfo('✅ Amazon SP-API initialized successfully');

    // Start automatic data sync
    this.startDataSync();

  } catch (error) {
    logError('❌ Failed to initialize Amazon SP-API:', error.message);
    this.isConnected = false;
    throw error;
  }
}
```

**5.2 API Error Handling**

**File**: [`services/amazon-sp-api.js`](../services/amazon-sp-api.js)

```javascript
// Add retry logic for rate limits
async callAPIWithRetry(operation, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await this.spApi.callAPI(operation);
    } catch (error) {
      attempt++;

      // Handle rate limiting (429 Too Many Requests)
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 60;
        logWarn(`Amazon API rate limited. Retrying after ${retryAfter}s (attempt ${attempt}/${maxRetries})`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
      }

      // Handle throttling (503 Service Unavailable)
      if (error.response?.status === 503) {
        const backoff = Math.pow(2, attempt) * 1000; // Exponential backoff
        logWarn(`Amazon API throttled. Retrying after ${backoff}ms (attempt ${attempt}/${maxRetries})`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
      }

      // Other errors: throw immediately
      throw error;
    }
  }

  throw new Error(`Amazon API call failed after ${maxRetries} attempts`);
}
```

---

### Phase 6: Testing & Validation (0.5 days)

**6.1 Manual Testing Checklist**

```markdown
### Connection Testing
- [ ] Verify Amazon SP-API connects successfully with valid credentials
- [ ] Verify graceful handling when credentials not configured
- [ ] Verify graceful handling with invalid refresh token
- [ ] Verify error messages are user-friendly (no stack traces)

### Data Accuracy Testing
- [ ] Compare inventory counts to Amazon Seller Central
- [ ] Verify order totals match Amazon reports
- [ ] Confirm low-stock threshold (< 10 units) is accurate
- [ ] Check inbound shipment tracking matches FBA dashboard

### API Endpoint Testing
- [ ] `/api/v1/dashboard/executive` includes Amazon metrics
- [ ] `/api/v1/dashboard/amazon-inventory` returns FBA inventory
- [ ] `/api/v1/dashboard/amazon-orders` returns last 24h orders
- [ ] Response times < 3 seconds for all endpoints

### Real-Time Updates Testing
- [ ] SSE event `amazon-sync-started` fires every 15 minutes
- [ ] SSE event `amazon-sync-completed` triggers dashboard refresh
- [ ] SSE event `amazon-low-stock-alert` displays when SKUs < 10
- [ ] Dashboard auto-refreshes after successful sync

### Frontend Testing
- [ ] Channel performance widget shows Shopify vs Amazon
- [ ] Amazon inventory widget displays low-stock alerts
- [ ] Empty state displays when Amazon not configured
- [ ] Loading states display during data fetch

### Error Handling Testing
- [ ] Missing credentials: clear setup instructions
- [ ] Invalid credentials: specific error messages
- [ ] API rate limit (429): retry with backoff
- [ ] Network timeout: user-friendly error
```

**6.2 Automated Testing**

**File**: `tests/integration/amazon-integration.test.js`

```javascript
import { describe, it, expect, beforeAll } from 'vitest';
import amazonSPAPIService from '../../services/amazon-sp-api.js';

describe('Amazon SP-API Integration', () => {
  beforeAll(async () => {
    try {
      await amazonSPAPIService.initialize();
    } catch (error) {
      console.warn('Amazon SP-API not configured, skipping tests');
    }
  });

  it('should connect to Amazon SP-API with valid credentials', () => {
    if (amazonSPAPIService.isConnected) {
      expect(amazonSPAPIService.isConnected).toBe(true);
    } else {
      console.warn('Amazon not connected - credentials not configured');
    }
  });

  it('should fetch inventory summary', async () => {
    if (!amazonSPAPIService.isConnected) return;

    const summary = await amazonSPAPIService.getInventorySummary();

    expect(summary).toHaveProperty('totalSKUs');
    expect(summary).toHaveProperty('totalQuantity');
    expect(summary).toHaveProperty('lowStockItems');
    expect(summary.totalSKUs).toBeGreaterThanOrEqual(0);
  });

  it('should fetch order metrics', async () => {
    if (!amazonSPAPIService.isConnected) return;

    const metrics = await amazonSPAPIService.getOrderMetrics();

    expect(metrics).toHaveProperty('totalOrders');
    expect(metrics).toHaveProperty('totalRevenue');
    expect(metrics).toHaveProperty('averageOrderValue');
    expect(metrics).toHaveProperty('unshippedOrders');
  });
});

describe('Amazon Error Handling', () => {
  it('should handle missing credentials gracefully', async () => {
    const originalToken = process.env.AMAZON_REFRESH_TOKEN;
    delete process.env.AMAZON_REFRESH_TOKEN;

    const tempService = new AmazonSPAPIService();

    await expect(tempService.initialize()).rejects.toThrow('credentials missing');

    process.env.AMAZON_REFRESH_TOKEN = originalToken;
  });
});
```

---

### Phase 7: Documentation & Deployment (0.5 days)

**7.1 Setup Documentation**

**New File**: `docs/integrations/amazon-sp-api-setup.md`

```markdown
# Amazon SP-API Integration Setup Guide

## Overview

Connect your Amazon Seller Central account to the Sentia Manufacturing Dashboard for real-time FBA inventory and order data.

## Prerequisites

- Amazon Seller Central account (Professional seller)
- AWS account (for IAM role creation)
- Render dashboard access (for environment variables)

## Step 1: Create SP-API Developer Application

1. Navigate to: https://sellercentral.amazon.com/apps/manage
2. Click **Develop Apps** → **Add new app client**
3. Configure app:
   - App name: `Sentia Manufacturing Dashboard`
   - OAuth redirect URI: `https://capliquify-frontend-prod.onrender.com/amazon/callback`
4. Select API roles:
   - **Orders API**: View and manage orders
   - **FBA Inventory API**: View inventory summaries
   - **FBA Inbound API**: View shipments
5. Click **Save and exit**
6. Note down:
   - **LWA Client ID**: `amzn1.application-oa2-client.xxxxx`
   - **LWA Client Secret**: `amzn1.oa2-cs.v1.xxxxx`

## Step 2: Create AWS IAM Role

```bash
# AWS Console: IAM → Roles → Create role
# Trust relationship policy:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::437568002678:role/SP-API"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}

# Attach policy: AmazonSellerPartnerAPIFullAccess
# Role name: SentiaManufacturingDashboardSPRole
# Copy ARN: arn:aws:iam::YOUR_ACCOUNT:role/SentiaManufacturingDashboardSPRole
```

## Step 3: Generate Refresh Token

```bash
# Authorization URL (replace YOUR_CLIENT_ID):
https://sellercentral.amazon.com/apps/authorize/consent?application_id=YOUR_CLIENT_ID&state=stateexample&version=beta

# After authorization, exchange code for refresh token:
curl -X POST https://api.amazon.com/auth/o2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE_FROM_REDIRECT" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"

# Response includes: refresh_token (starts with "Atzr|")
```

## Step 4: Configure Environment Variables on Render

```bash
AMAZON_REFRESH_TOKEN=Atzr|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AMAZON_LWA_APP_ID=amzn1.application-oa2-client.xxxxxxxxxxxxx
AMAZON_LWA_CLIENT_SECRET=amzn1.oa2-cs.v1.xxxxxxxxxxxxx
AMAZON_SP_ROLE_ARN=arn:aws:iam::123456789012:role/SentiaManufacturingDashboardSPRole
AMAZON_REGION=us-east-1
AMAZON_SELLER_ID=A1XXXXXXXXXXXXX
```

## Step 5: Verify Connection

Check Render logs for:
```
[INFO] AMAZON: Initializing SP-API connection...
[INFO] AMAZON: Connected to Amazon SP-API successfully
[INFO] AMAZON: Inventory - 45 SKUs, 1250 units
[INFO] AMAZON: Orders - 12 orders (last 24h), $3,456.78 revenue
```

## Troubleshooting

### Error: "Invalid refresh token"
- Regenerate refresh token in Seller Central
- Ensure token starts with "Atzr|"

### Error: "Access Denied"
- Verify IAM role trust policy
- Check SP-API app has correct permissions

### Error: "Rate limit exceeded"
- Wait 60 seconds for quota reset
- Amazon allows 30 requests/second per operation

## Data Sync Schedule

- **Frequency**: Every 15 minutes
- **Inventory**: Last 30 days FBA inventory
- **Orders**: Last 24 hours orders
- **Cache Duration**: 5 minutes (Redis)
```

**7.2 Update CLAUDE.md**

```markdown
### **Amazon SP-API Integration** ✅ **OPERATIONAL**

- **Framework**: Complete SP-API service with OAuth 2.0
- **Reality**: FBA inventory and order sync operational
- **Status**: Operational - Real-time inventory tracking, order metrics
- **Story**: BMAD-MOCK-003 (Completed 2025-10-19)
```

**7.3 Deployment**

```bash
# Commit Phase 3 changes
git add .
git commit -m "feat(amazon): Complete BMAD-MOCK-003 - Amazon SP-API integration

- Integrate Amazon SP-API with LWA OAuth 2.0
- Add FBA inventory sync (15-minute intervals)
- Add order data sync (24-hour rolling window)
- Implement dashboard API endpoints for Amazon data
- Add SSE events for real-time inventory alerts
- Create channel performance comparison widget
- Comprehensive error handling and credential validation
- Complete setup documentation

Story: BMAD-MOCK-003
Sprint: Sprint 2 - E-Commerce & Inventory Data
Effort: 3 days

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to development
git push origin development
```

---

## ✅ Definition of Done

### Functional Requirements
- ✅ Amazon SP-API connects with OAuth 2.0 credentials
- ✅ FBA inventory data synced every 15 minutes
- ✅ Order data from last 24 hours available
- ✅ Low-stock alerts trigger for SKUs < 10 units
- ✅ Channel performance comparison (Shopify vs Amazon)
- ✅ Real-time SSE updates for inventory changes
- ✅ Empty states displayed when Amazon not configured

### Technical Requirements
- ✅ Zero mock data in Amazon code paths
- ✅ All API endpoints return real Amazon data or setup prompt
- ✅ Response times <3 seconds for dashboard load
- ✅ Redis caching reduces SP-API calls
- ✅ Retry logic for rate limits (429) and throttling (503)
- ✅ SSE events: sync-started, sync-completed, low-stock-alert, sync-error

### Testing Requirements
- ✅ Manual testing checklist passed
- ✅ Automated integration tests green
- ✅ Inventory accuracy validated against Seller Central
- ✅ Order totals match Amazon reports
- ✅ Low-stock threshold tested (<10 units)

### Documentation Requirements
- ✅ Complete setup guide with SP-API credential instructions
- ✅ CLAUDE.md updated with operational status
- ✅ Troubleshooting section covers common errors
- ✅ AWS IAM role creation documented

### Deployment Requirements
- ✅ Changes deployed to development environment
- ✅ Render logs show successful Amazon connection
- ✅ Dashboard displays real Amazon data
- ✅ SSE events firing every 15 minutes

---

## 📊 Success Metrics

### Before (Mock Data)
- Amazon data: Not integrated
- Inventory: No visibility
- Orders: Not tracked
- Channel comparison: Not available

### After (Real Data)
- Amazon data: Live SP-API integration
- Inventory: Real-time FBA levels (fulfillable, reserved, inbound)
- Orders: Last 24h rolling window with auto-sync
- Channel comparison: Shopify vs Amazon performance metrics

---

## 🔗 Related Stories

**Epic**: [EPIC-002: Eliminate Mock Data](../epics/2025-10-eliminate-mock-data-epic.md)

**Sprint 2 Stories**:
- ✅ BMAD-MOCK-003: Amazon SP-API Orders Integration (This Story)
- ⏳ BMAD-MOCK-004: Unleashed ERP Inventory Integration (3 days)

---

**Story Status**: ✅ Ready for Implementation
**Next Step**: Begin Phase 1 - Amazon SP-API Credential Setup
**Estimated Completion**: 3 days from start
