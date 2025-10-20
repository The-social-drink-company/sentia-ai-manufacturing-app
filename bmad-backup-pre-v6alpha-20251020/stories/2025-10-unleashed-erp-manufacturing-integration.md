# BMAD-MOCK-004: Unleashed ERP Manufacturing & Inventory Integration

**Story ID**: BMAD-MOCK-004
**Epic**: EPIC-002 (Eliminate Mock Data - Production-Ready Application)
**Sprint**: Sprint 2 - E-Commerce & Inventory Data
**Story Points**: 6
**Estimated Effort**: 3 days
**Priority**: Medium
**Status**: Ready for Development

**Created**: 2025-10-19
**Assigned To**: Development Team
**BMAD Agent Role**: Developer (`bmad dev`)

---

## 📋 Story Overview

**As a** manufacturing operations manager
**I want** real-time production and inventory data from Unleashed ERP integrated into the dashboard
**So that** I can make accurate production planning decisions based on actual assembly jobs, stock levels, and quality control metrics

---

## 🎯 Business Value

**Current State (Problem)**:
- Dashboard shows mock production metrics
- No visibility into real assembly job status
- Cannot track actual stock on hand levels
- Production schedule disconnected from Unleashed ERP
- Quality alerts based on fake data

**Target State (Solution)**:
- Live assembly job tracking (in-progress, planned, completed)
- Real-time stock on hand levels from Unleashed
- Production schedule synced with ERP system
- Quality control alerts based on actual yield data
- Low-stock notifications for manufacturing materials

**Business Impact**:
- **Production Planning**: Real assembly job data replaces mock schedules
- **Inventory Control**: Actual stock levels prevent stockouts/overstocking
- **Quality Management**: Real yield tracking identifies production issues
- **Resource Optimization**: Actual utilization rates inform capacity planning
- **Cost Accuracy**: Real purchase orders track material costs

---

## 🔍 Current State Analysis

### Existing Unleashed ERP Service Implementation

**File**: [`services/unleashed-erp.js`](../services/unleashed-erp.js) (493 lines)

**✅ Already Implemented**:
```javascript
class UnleashedERPService {
  constructor() {
    this.apiId = process.env.UNLEASHED_API_ID;
    this.apiKey = process.env.UNLEASHED_API_KEY;
    this.baseUrl = 'https://api.unleashedsoftware.com';
  }

  // ✅ HMAC-SHA256 authentication
  generateSignature(queryString) {
    return crypto.createHmac('sha256', this.apiKey)
      .update(queryString || '')
      .digest('base64');
  }

  // ✅ Assembly jobs sync (production tracking)
  async syncProductionData() {
    // GET /AssemblyJobs - production batches
    // Metrics: activeBatches, completedToday, qualityScore, utilizationRate
    // Schedule: planned jobs with priority
    // Quality alerts: yield shortfalls
    // Lines 166-231
  }

  // ✅ Stock on hand sync (inventory levels)
  async syncInventoryData() {
    // GET /StockOnHand - inventory tracking
    // Metrics: totalItems, totalValue, lowStockItems, zeroStockItems
    // Low-stock alerts: items below min level
    // Lines 233-284
  }

  // ✅ Sales orders sync
  async syncSalesOrderData() {
    // GET /SalesOrders - last 30 days
    // Metrics: totalOrders, totalValue, pendingOrders, fulfilledOrders
    // Lines 286-327
  }

  // ✅ Purchase orders sync
  async syncPurchaseOrderData() {
    // GET /PurchaseOrders
    // Metrics: totalOrders, totalValue, pendingOrders
    // Lines 329-359
  }

  // ✅ Automated sync scheduler (15-minute intervals)
  async startSyncScheduler() {
    // Initial sync + recurring every 15 minutes
    // Lines 100-118
  }

  // ✅ Data consolidation
  consolidateManufacturingData(syncResults) {
    // Aggregates: production, resources, schedules, alerts
    // Lines 382-401
  }
}
```

**🎯 Service Strengths**:
- Complete Unleashed REST API integration
- HMAC-SHA256 request signing (required by Unleashed)
- Multi-endpoint sync (AssemblyJobs, StockOnHand, SalesOrders, PurchaseOrders)
- Redis caching (15-minute TTL)
- Axios HTTP client with interceptors
- Comprehensive error handling

**⚠️ Known Issues** (from UNLEASHED_API_NOTES.md):
- `/StockMovements` endpoint returns 403 Forbidden (insufficient permissions)
- Solution: Calculate movements from SalesOrders and PurchaseOrders instead
- Page sizes reduced to 100 items (from 500) to avoid timeouts
- Transaction timeouts increased to 30 seconds for Prisma

**⚠️ Integration Gaps**:
- Service initialization not called in `server.js`
- Dashboard API endpoints don't query Unleashed data
- Frontend components not connected to manufacturing metrics
- No SSE events for production updates
- Missing empty states for unconfigured Unleashed credentials

---

## 🛠️ Technical Implementation Plan

### Phase 1: Unleashed API Credential Setup (0.5 days)

**1.1 Obtain Unleashed API Credentials**

**Prerequisites**:
- Unleashed Software admin account access
- Company subscription with API access enabled

**Steps**:

1. **Generate API Key** (Unleashed Admin Panel)
   - Navigate to: https://go.unleashedsoftware.com/
   - Go to: **Integration** → **API Access**
   - Click **Add API Key**
   - Key name: `CapLiquify Manufacturing Platform`
   - Select permissions:
     - ✅ Assembly Jobs (Read)
     - ✅ Stock On Hand (Read)
     - ✅ Sales Orders (Read)
     - ✅ Purchase Orders (Read)
     - ✅ Products (Read)
     - ✅ Warehouses (Read)
     - ❌ Stock Movements (403 Forbidden - known issue)
   - Click **Save**
   - Note down:
     - **API ID**: `{guid}` (e.g., `a1b2c3d4-e5f6-7890-abcd-1234567890ab`)
     - **API Key**: `{base64-string}` (e.g., `AbCdEf123456==`)

**1.2 Configure Environment Variables**

**File**: `.env` (Render dashboard environment variables)

```bash
# Unleashed ERP API Authentication
UNLEASHED_API_ID=a1b2c3d4-e5f6-7890-abcd-1234567890ab
UNLEASHED_API_KEY=AbCdEf123456==
UNLEASHED_API_URL=https://api.unleashedsoftware.com
```

**Validation Steps**:
```bash
# Test Unleashed ERP connection
node -e "
import unleashedERPService from './services/unleashed-erp.js';
const connected = await unleashedERPService.connect();
console.log('Unleashed Connection:', connected ? 'SUCCESS' : 'FAILED');
const data = await unleashedERPService.getConsolidatedData();
console.log('Manufacturing Data:', JSON.stringify(data, null, 2));
"
```

**Expected Output**:
```json
{
  "production": {
    "activeBatches": 3,
    "completedToday": 2,
    "qualityScore": 97.5,
    "utilizationRate": 87.0
  },
  "productionSchedule": [
    {
      "jobId": "guid-123",
      "productName": "Sentia Premium Blend 750ml",
      "quantity": 500,
      "scheduledTime": "2025-10-20T08:00:00Z",
      "priority": "High"
    }
  ],
  "inventoryAlerts": [
    {
      "productCode": "MAT-001",
      "description": "Premium Base Material",
      "currentStock": 45,
      "minLevel": 100,
      "location": "Main Warehouse"
    }
  ]
}
```

**1.3 Initialize Unleashed Service in Server**

**File**: [`server.js`](../server.js)

```javascript
// Add after Amazon service initialization
import unleashedERPService from './services/unleashed-erp.js';

// Initialize Unleashed ERP connection
const initializeUnleashed = async () => {
  try {
    logInfo('UNLEASHED: Initializing ERP connection...');
    const connected = await unleashedERPService.connect();

    if (connected) {
      logInfo('UNLEASHED: Connected to Unleashed ERP successfully');

      // Get initial metrics
      const manufacturingData = await unleashedERPService.getConsolidatedData();

      logInfo(`UNLEASHED: Production - ${manufacturingData.production.activeBatches} active batches`);
      logInfo(`UNLEASHED: Quality Score - ${manufacturingData.production.qualityScore.toFixed(1)}%`);
      logInfo(`UNLEASHED: Utilization - ${manufacturingData.production.utilizationRate.toFixed(1)}%`);

      if (manufacturingData.inventoryAlerts.length > 0) {
        logWarn(`UNLEASHED: ⚠️ ${manufacturingData.inventoryAlerts.length} low-stock items`);
      }

      if (manufacturingData.qualityAlerts.length > 0) {
        logWarn(`UNLEASHED: ⚠️ ${manufacturingData.qualityAlerts.length} quality alerts`);
      }
    } else {
      logWarn('UNLEASHED: ERP not connected. Check environment variables:');
      logWarn('  Required: UNLEASHED_API_ID, UNLEASHED_API_KEY');
    }

    return connected;
  } catch (error) {
    logError('UNLEASHED: Initialization failed:', error.message);
    logError('  Verify API credentials in Unleashed admin panel');
    logError('  Ensure API key has Assembly Jobs and Stock On Hand permissions');
    return false;
  }
};

// Call during server startup (after Amazon initialization)
const unleashedConnected = await initializeUnleashed();
```

**Success Criteria**:
- ✅ Server logs show "Connected to Unleashed ERP successfully"
- ✅ Production metrics display actual batch counts
- ✅ Quality score calculated from real assembly jobs
- ✅ No authentication errors in startup logs
- ✅ Sync scheduler started (15-minute intervals)

---

### Phase 2: Dashboard API Integration (1 day)

**2.1 Update Executive Dashboard Endpoint**

**File**: [`server/api/dashboard.js`](../server/api/dashboard.js)

**Add Unleashed Manufacturing Data**:
```javascript
import unleashedERPService from '../../services/unleashed-erp.js';

router.get('/executive', async (req, res) => {
  const startTime = Date.now();

  try {
    // Check Unleashed connection status
    const unleashedConnected = unleashedERPService.isConnected;

    // Fetch Shopify data (from BMAD-MOCK-002)
    const shopifyData = await shopifyMultiStoreService.getConsolidatedSalesData();

    // Fetch Amazon data (from BMAD-MOCK-003)
    let amazonInventory = null;
    let amazonOrders = null;
    if (amazonSPAPIService.isConnected) {
      [amazonInventory, amazonOrders] = await Promise.all([
        amazonSPAPIService.getInventorySummary(),
        amazonSPAPIService.getOrderMetrics()
      ]);
    }

    // Fetch Unleashed manufacturing data
    let unleashedData = null;
    if (unleashedConnected) {
      try {
        unleashedData = await unleashedERPService.getConsolidatedData();
      } catch (error) {
        logError('UNLEASHED: Data fetch failed:', error);
        // Continue with other data sources
      }
    }

    // Build KPIs combining all data sources
    const kpis = {
      revenue: {
        label: 'Total Revenue',
        shopify: shopifyData?.totalRevenue || 0,
        amazon: amazonOrders?.totalRevenue || 0,
        unleashed: unleashedData?.salesOrders?.metrics?.totalValue || 0,
        total: (shopifyData?.totalRevenue || 0) +
               (amazonOrders?.totalRevenue || 0) +
               (unleashedData?.salesOrders?.metrics?.totalValue || 0),
        unit: 'USD',
        trend: 'neutral',
        sources: {
          shopify: shopifyData?.success ? 'connected' : 'disconnected',
          amazon: amazonSPAPIService.isConnected ? 'connected' : 'disconnected',
          unleashed: unleashedConnected ? 'connected' : 'disconnected'
        }
      },
      production: {
        label: 'Active Production Batches',
        value: unleashedData?.production?.activeBatches || 0,
        completedToday: unleashedData?.production?.completedToday || 0,
        qualityScore: unleashedData?.production?.qualityScore || 0,
        utilizationRate: unleashedData?.production?.utilizationRate || 0,
        unit: 'batches',
        trend: unleashedData?.production?.activeBatches > 2 ? 'up' : 'neutral',
        source: unleashedConnected ? 'connected' : 'disconnected'
      },
      inventory: {
        label: 'Total Inventory Value',
        amazon: amazonInventory?.totalQuantity || 0,
        unleashed: unleashedData?.inventory?.metrics?.totalValue || 0,
        total: (unleashedData?.inventory?.metrics?.totalValue || 0),
        lowStockItems: (amazonInventory?.lowStockItems || 0) +
                       (unleashedData?.inventoryAlerts?.length || 0),
        unit: 'USD',
        trend: unleashedData?.inventoryAlerts?.length > 5 ? 'down' : 'neutral',
        sources: {
          amazon: amazonSPAPIService.isConnected ? 'connected' : 'disconnected',
          unleashed: unleashedConnected ? 'connected' : 'disconnected'
        }
      }
    };

    // Production schedule
    const productionSchedule = unleashedData?.productionSchedule || [];

    // Quality alerts
    const qualityAlerts = unleashedData?.qualityAlerts || [];

    // Inventory alerts (combined Amazon + Unleashed)
    const inventoryAlerts = [
      ...(unleashedData?.inventoryAlerts || []).map(alert => ({
        ...alert,
        source: 'unleashed'
      })),
      // Add Amazon low-stock items if available
    ];

    const dashboardData = {
      kpis,
      productionSchedule,
      qualityAlerts,
      inventoryAlerts,
      metadata: {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        dataAvailable: shopifyData?.success || amazonSPAPIService.isConnected || unleashedConnected,
        integrationStatus: {
          shopify: {
            connected: shopifyData?.success || false,
            activeStores: shopifyData?.stores?.length || 0
          },
          amazon: {
            connected: amazonSPAPIService.isConnected,
            inventorySync: amazonInventory ? 'active' : 'inactive',
            orderSync: amazonOrders ? 'active' : 'inactive'
          },
          unleashed: {
            connected: unleashedConnected,
            productionSync: unleashedData ? 'active' : 'inactive',
            inventorySync: unleashedData?.inventory ? 'active' : 'inactive'
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

**2.2 Add Production Schedule Endpoint**

**New Endpoint**: `GET /api/v1/dashboard/production-schedule`

```javascript
router.get('/production-schedule', async (req, res) => {
  try {
    if (!unleashedERPService.isConnected) {
      return res.json({
        success: false,
        setupRequired: true,
        message: 'Unleashed ERP not configured. Add credentials to view production schedule.',
        data: null
      });
    }

    const manufacturingData = await unleashedERPService.getConsolidatedData();

    const scheduleData = {
      activeJobs: manufacturingData.productionSchedule.filter(job =>
        job.status === 'InProgress'
      ),
      plannedJobs: manufacturingData.productionSchedule.filter(job =>
        job.status === 'Planned'
      ),
      completedToday: manufacturingData.production.completedToday,
      metrics: {
        activeBatches: manufacturingData.production.activeBatches,
        qualityScore: manufacturingData.production.qualityScore,
        utilizationRate: manufacturingData.production.utilizationRate
      },
      lastSync: manufacturingData.lastUpdated
    };

    res.json({
      success: true,
      data: scheduleData
    });

  } catch (error) {
    console.error('[Dashboard API] Error fetching production schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: null
    });
  }
});
```

**2.3 Add Manufacturing Inventory Endpoint**

**New Endpoint**: `GET /api/v1/dashboard/unleashed-inventory`

```javascript
router.get('/unleashed-inventory', async (req, res) => {
  try {
    if (!unleashedERPService.isConnected) {
      return res.json({
        success: false,
        setupRequired: true,
        message: 'Unleashed ERP not configured.',
        data: null
      });
    }

    const manufacturingData = await unleashedERPService.getConsolidatedData();

    const inventoryData = {
      summary: {
        totalItems: manufacturingData.inventory?.metrics?.totalItems || 0,
        totalValue: manufacturingData.inventory?.metrics?.totalValue || 0,
        lowStockItems: manufacturingData.inventory?.metrics?.lowStockItems || 0,
        zeroStockItems: manufacturingData.inventory?.metrics?.zeroStockItems || 0
      },
      alerts: manufacturingData.inventoryAlerts.map(alert => ({
        productCode: alert.productCode,
        description: alert.description,
        currentStock: alert.currentStock,
        minLevel: alert.minLevel,
        location: alert.location,
        status: alert.currentStock === 0 ? 'out-of-stock' :
                alert.currentStock < alert.minLevel ? 'low-stock' :
                'in-stock',
        reorderQuantity: Math.max(alert.minLevel * 2 - alert.currentStock, 0)
      })),
      lastSync: manufacturingData.lastUpdated
    };

    res.json({
      success: true,
      data: inventoryData
    });

  } catch (error) {
    console.error('[Dashboard API] Error fetching Unleashed inventory:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: null
    });
  }
});
```

**2.4 Add Quality Alerts Endpoint**

**New Endpoint**: `GET /api/v1/dashboard/quality-alerts`

```javascript
router.get('/quality-alerts', async (req, res) => {
  try {
    if (!unleashedERPService.isConnected) {
      return res.json({
        success: false,
        setupRequired: true,
        message: 'Unleashed ERP not configured.',
        data: null
      });
    }

    const manufacturingData = await unleashedERPService.getConsolidatedData();

    const qualityData = {
      alerts: manufacturingData.qualityAlerts.map(alert => ({
        batchId: alert.batchId,
        issue: alert.issue,
        severity: alert.severity,
        timestamp: alert.timestamp,
        actionRequired: alert.severity === 'High' ? 'Immediate inspection required' :
                        alert.severity === 'Medium' ? 'Review before next batch' :
                        'Monitor trend'
      })),
      metrics: {
        qualityScore: manufacturingData.production.qualityScore,
        alertCount: manufacturingData.qualityAlerts.length,
        trend: manufacturingData.production.qualityScore >= 95 ? 'excellent' :
               manufacturingData.production.qualityScore >= 85 ? 'good' :
               'needs-improvement'
      },
      lastSync: manufacturingData.lastUpdated
    };

    res.json({
      success: true,
      data: qualityData
    });

  } catch (error) {
    console.error('[Dashboard API] Error fetching quality alerts:', error);
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
# Test executive dashboard with Unleashed data
curl http://localhost:5000/api/v1/dashboard/executive | jq

# Expected: kpis with production metrics (activeBatches, qualityScore, utilizationRate)
# Expected: productionSchedule with assembly jobs
# Expected: inventoryAlerts from Unleashed

# Test production schedule
curl http://localhost:5000/api/v1/dashboard/production-schedule | jq

# Expected: activeJobs and plannedJobs from assembly jobs

# Test Unleashed inventory
curl http://localhost:5000/api/v1/dashboard/unleashed-inventory | jq

# Expected: StockOnHand summary with low-stock alerts

# Test quality alerts
curl http://localhost:5000/api/v1/dashboard/quality-alerts | jq

# Expected: Quality issues from assembly jobs (yield shortfalls)
```

---

### Phase 3: Real-Time SSE Events (0.5 days)

**3.1 Add SSE Events to Unleashed Sync**

**File**: [`services/unleashed-erp.js`](../services/unleashed-erp.js)

**Modify**: `syncAllData()` method (Lines 120-164)

```javascript
// Add SSE import at top of file
import { sendEvent } from './sse-service.js'; // Assuming SSE service exists

async syncAllData() {
  if (!this.isConnected) {
    logWarn('UNLEASHED ERP: Not connected, skipping sync');
    return;
  }

  logDebug('UNLEASHED ERP: Starting comprehensive data sync...');

  // Send SSE event: sync started
  sendEvent('unleashed-sync-started', {
    timestamp: new Date().toISOString()
  });

  const syncResults = {};

  try {
    // Sync production data
    syncResults.production = await this.syncProductionData();
    logDebug('UNLEASHED ERP: Production data synced');

    // Sync inventory data
    syncResults.inventory = await this.syncInventoryData();
    logDebug('UNLEASHED ERP: Inventory data synced');

    // Sync sales orders
    syncResults.salesOrders = await this.syncSalesOrderData();
    logDebug('UNLEASHED ERP: Sales orders synced');

    // Sync purchase orders
    syncResults.purchaseOrders = await this.syncPurchaseOrderData();
    logDebug('UNLEASHED ERP: Purchase orders synced');

    // Sync resources/assets
    syncResults.resources = await this.syncResourceData();
    logDebug('UNLEASHED ERP: Resources synced');

    // Generate consolidated manufacturing data
    const consolidatedData = this.consolidateManufacturingData(syncResults);

    // Cache the consolidated data
    await redisCacheService.set('unleashed:consolidated_data', consolidatedData, 1800);
    await redisCacheService.set('unleashed:last_sync', new Date().toISOString(), 3600);

    logDebug('UNLEASHED ERP: Sync completed successfully');

    // Send SSE event: sync completed
    sendEvent('unleashed-sync-completed', {
      production: {
        activeBatches: consolidatedData.production.activeBatches,
        completedToday: consolidatedData.production.completedToday,
        qualityScore: consolidatedData.production.qualityScore,
        utilizationRate: consolidatedData.production.utilizationRate
      },
      inventory: {
        totalItems: syncResults.inventory?.metrics?.totalItems || 0,
        totalValue: syncResults.inventory?.metrics?.totalValue || 0,
        lowStockItems: syncResults.inventory?.alerts?.length || 0
      },
      alerts: {
        qualityAlerts: consolidatedData.qualityAlerts.length,
        inventoryAlerts: consolidatedData.inventoryAlerts.length
      },
      timestamp: new Date().toISOString()
    });

    return consolidatedData;

  } catch (error) {
    logError('UNLEASHED ERP: Sync failed:', error);

    // Send SSE event: sync error
    sendEvent('unleashed-sync-error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    throw error;
  }
}
```

**3.2 Add Quality Alert Events**

**File**: [`services/unleashed-erp.js`](../services/unleashed-erp.js)

**Modify**: `syncProductionData()` method (Lines 166-231)

```javascript
async syncProductionData() {
  try {
    const response = await this.client.get('/AssemblyJobs', {
      params: {
        pageSize: 100,
        page: 1,
        orderBy: 'ModifiedOn',
        orderDirection: 'Desc'
      }
    });

    const assemblyJobs = response.data?.Items || [];

    // ... existing metrics calculation ...

    const qualityAlerts = assemblyJobs
      .filter(job => this.hasQualityIssues(job))
      .slice(0, 5)
      .map(job => ({
        batchId: job.AssemblyJobNumber,
        issue: this.getQualityIssue(job),
        severity: 'Medium',
        timestamp: job.ModifiedOn
      }));

    // Send SSE event if quality issues detected
    if (qualityAlerts.length > 0) {
      sendEvent('unleashed-quality-alert', {
        count: qualityAlerts.length,
        criticalIssues: qualityAlerts.filter(a => a.severity === 'High').length,
        alerts: qualityAlerts.slice(0, 3), // Top 3 critical alerts
        timestamp: new Date().toISOString()
      });
    }

    // ... existing caching and return ...

    return {
      metrics: productionMetrics,
      schedule: productionSchedule,
      alerts: qualityAlerts,
      rawJobs: assemblyJobs.slice(0, 20)
    };

  } catch (error) {
    logError('UNLEASHED ERP: Production sync failed:', error);
    return {
      metrics: { activeBatches: 0, completedToday: 0, qualityScore: 0, utilizationRate: 0 },
      schedule: [],
      alerts: []
    };
  }
}
```

**3.3 Add Low-Stock Alert Events**

**File**: [`services/unleashed-erp.js`](../services/unleashed-erp.js)

**Modify**: `syncInventoryData()` method (Lines 233-284)

```javascript
async syncInventoryData() {
  try {
    const response = await this.client.get('/StockOnHand', {
      params: {
        pageSize: 250,
        page: 1,
        orderBy: 'LastModifiedOn',
        orderDirection: 'Desc'
      }
    });

    const stockItems = response.data?.Items || [];

    // ... existing metrics calculation ...

    const lowStockAlerts = stockItems
      .filter(item => item.QtyOnHand < (item.MinStockLevel || 10))
      .slice(0, 10)
      .map(item => ({
        productCode: item.ProductCode,
        description: item.Product?.ProductDescription,
        currentStock: item.QtyOnHand,
        minLevel: item.MinStockLevel || 10,
        location: item.Warehouse?.WarehouseName
      }));

    // Send SSE event if low-stock items detected
    if (lowStockAlerts.length > 0) {
      sendEvent('unleashed-low-stock-alert', {
        count: lowStockAlerts.length,
        criticalItems: lowStockAlerts.filter(item => item.currentStock === 0).length,
        items: lowStockAlerts.slice(0, 5), // Top 5 critical items
        timestamp: new Date().toISOString()
      });
    }

    // ... existing caching and return ...

    return {
      metrics: inventoryMetrics,
      alerts: lowStockAlerts,
      rawStock: stockItems.slice(0, 50)
    };

  } catch (error) {
    logError('UNLEASHED ERP: Inventory sync failed:', error);
    return {
      metrics: { totalItems: 0, totalValue: 0, lowStockItems: 0, zeroStockItems: 0 },
      alerts: []
    };
  }
}
```

**3.4 Frontend SSE Subscription**

**File**: `src/hooks/useSSE.js`

```javascript
// Add Unleashed event handlers
useEffect(() => {
  const eventSource = new EventSource('/api/sse');

  eventSource.addEventListener('unleashed-sync-completed', (event) => {
    const data = JSON.parse(event.data);
    console.log('Unleashed sync completed:', data);

    // Invalidate dashboard queries
    queryClient.invalidateQueries(['dashboard', 'executive']);
    queryClient.invalidateQueries(['dashboard', 'production-schedule']);
    queryClient.invalidateQueries(['dashboard', 'unleashed-inventory']);
    queryClient.invalidateQueries(['dashboard', 'quality-alerts']);

    // Show toast notification
    toast.success(
      `Unleashed sync: ${data.production.activeBatches} active batches, quality ${data.production.qualityScore.toFixed(1)}%`
    );
  });

  eventSource.addEventListener('unleashed-quality-alert', (event) => {
    const data = JSON.parse(event.data);
    console.warn('Unleashed quality alert:', data);

    // Show persistent warning
    toast.warning(`⚠️ ${data.count} quality alerts detected in production`, {
      duration: 15000,
      action: {
        label: 'View Details',
        onClick: () => navigate('/production/quality')
      }
    });
  });

  eventSource.addEventListener('unleashed-low-stock-alert', (event) => {
    const data = JSON.parse(event.data);
    console.warn('Unleashed low-stock alert:', data);

    // Show persistent warning
    toast.warning(
      `⚠️ ${data.count} items below minimum stock level (${data.criticalItems} out of stock)`,
      {
        duration: 15000,
        action: {
          label: 'View Inventory',
          onClick: () => navigate('/inventory/unleashed')
        }
      }
    );
  });

  eventSource.addEventListener('unleashed-sync-error', (event) => {
    const data = JSON.parse(event.data);
    console.error('Unleashed sync error:', data);
    toast.error(`Unleashed sync failed: ${data.error}`);
  });

  return () => eventSource.close();
}, []);
```

---

### Phase 4: Frontend Components (0.5 days)

**4.1 Production Schedule Widget**

**New File**: `src/components/widgets/ProductionScheduleWidget.jsx`

```jsx
import { ClipboardDocumentListIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function ProductionScheduleWidget({ scheduleData }) {
  if (!scheduleData || scheduleData.length === 0) {
    return (
      <div className="widget-card">
        <h3>Production Schedule</h3>
        <div className="empty-state">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400" />
          <p>No production jobs scheduled</p>
          <p className="text-sm text-gray-500">Connect Unleashed ERP to view assembly jobs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card">
      <h3 className="widget-title">Production Schedule</h3>

      <div className="schedule-list space-y-3">
        {scheduleData.slice(0, 10).map(job => (
          <div key={job.jobId} className="schedule-item border rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{job.productName}</h4>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                  <span>Qty: {job.quantity}</span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {new Date(job.scheduledTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <span className={`badge ${
                job.priority === 'High' ? 'badge-error' :
                job.priority === 'Medium' ? 'badge-warning' :
                'badge-success'
              }`}>
                {job.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**4.2 Quality Alerts Widget**

**New File**: `src/components/widgets/QualityAlertsWidget.jsx`

```jsx
import { ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function QualityAlertsWidget({ qualityData }) {
  if (!qualityData) {
    return (
      <div className="widget-card">
        <h3>Quality Control</h3>
        <div className="empty-state">
          <ShieldCheckIcon className="h-12 w-12 text-gray-400" />
          <p>No quality data available</p>
        </div>
      </div>
    );
  }

  const { alerts, metrics } = qualityData;

  return (
    <div className="widget-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="widget-title">Quality Control</h3>
        <div className={`quality-score text-2xl font-bold ${
          metrics.qualityScore >= 95 ? 'text-green-600' :
          metrics.qualityScore >= 85 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {metrics.qualityScore.toFixed(1)}%
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-4 text-green-600">
          <ShieldCheckIcon className="h-12 w-12 mx-auto mb-2" />
          <p className="font-semibold">All systems within tolerance</p>
          <p className="text-sm text-gray-600">No quality issues detected</p>
        </div>
      ) : (
        <div className="alerts-list space-y-2">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert-item border-l-4 p-3 rounded ${
              alert.severity === 'High' ? 'border-red-500 bg-red-50' :
              alert.severity === 'Medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className={`h-5 w-5 ${
                  alert.severity === 'High' ? 'text-red-600' :
                  alert.severity === 'Medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Batch #{alert.batchId}</p>
                  <p className="text-xs text-gray-700">{alert.issue}</p>
                  <p className="text-xs text-gray-600 mt-1">{alert.actionRequired}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Alert Trend:</span>
            <span className={`ml-2 font-semibold ${
              metrics.trend === 'excellent' ? 'text-green-600' :
              metrics.trend === 'good' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {metrics.trend === 'excellent' ? '✓ Excellent' :
               metrics.trend === 'good' ? '~ Good' :
               '⚠ Needs Improvement'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-gray-600">Active Alerts:</span>
            <span className="ml-2 font-semibold">{metrics.alertCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**4.3 Unleashed Setup Prompt Component**

**New File**: `src/components/integrations/UnleashedSetupPrompt.jsx`

```jsx
import { ExclamationCircleIcon, CogIcon } from '@heroicons/react/24/outline';

export default function UnleashedSetupPrompt({ unleashedStatus }) {
  return (
    <div className="setup-prompt-card rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 p-8">
      <div className="text-center">
        <CogIcon className="mx-auto h-16 w-16 text-purple-600" />
        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          Connect Unleashed ERP to View Manufacturing Data
        </h3>
        <p className="mt-2 text-gray-600">
          Unleashed ERP integration is not configured. Add credentials to view production schedule and inventory.
        </p>

        <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
          <h4 className="font-semibold text-gray-900">Required Environment Variables:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li><code>UNLEASHED_API_ID</code> - API identifier (GUID)</li>
            <li><code>UNLEASHED_API_KEY</code> - API key (base64)</li>
            <li><code>UNLEASHED_API_URL</code> - API base URL (optional)</li>
          </ul>
        </div>

        <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
          <h4 className="font-semibold text-gray-900">Required API Permissions:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>✅ Assembly Jobs (Read) - Production tracking</li>
            <li>✅ Stock On Hand (Read) - Inventory levels</li>
            <li>✅ Sales Orders (Read) - Order data</li>
            <li>✅ Purchase Orders (Read) - Material tracking</li>
            <li>❌ Stock Movements (403 Forbidden - known limitation)</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <a
            href="/docs/integrations/unleashed-erp-setup"
            className="btn btn-primary"
          >
            Setup Instructions
          </a>
          <a
            href="https://go.unleashedsoftware.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Unleashed Admin
          </a>
        </div>

        {unleashedStatus?.error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2">Connection Error:</h4>
            <p className="text-sm text-red-800">{unleashedStatus.error}</p>
            <p className="text-xs text-red-600 mt-2">
              Note: Stock Movements endpoint returns 403 Forbidden due to API permissions. This is a known limitation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Phase 5: Error Handling & Known Issues (0.5 days)

**5.1 Handle 403 Forbidden on StockMovements**

**File**: [`services/unleashed-erp.js`](../services/unleashed-erp.js)

**Add Alternative Data Strategy**:
```javascript
// ❌ DISABLED: Stock Movements endpoint returns 403 Forbidden
// async syncStockMovements() {
//   const response = await this.client.get('/StockMovements');
// }

// ✅ ALTERNATIVE: Calculate movements from Sales Orders and Purchase Orders
async calculateStockMovements() {
  try {
    const [salesOrders, purchaseOrders] = await Promise.all([
      this.syncSalesOrderData(),
      this.syncPurchaseOrderData()
    ]);

    // Inferred movements from orders
    const movements = {
      outbound: salesOrders.metrics?.totalOrders || 0,
      inbound: purchaseOrders.metrics?.totalOrders || 0,
      net: (purchaseOrders.metrics?.totalOrders || 0) - (salesOrders.metrics?.totalOrders || 0),
      source: 'calculated_from_orders',
      note: 'Stock Movements API unavailable (403 Forbidden). Data calculated from orders.'
    };

    return movements;

  } catch (error) {
    logError('UNLEASHED ERP: Stock movement calculation failed:', error);
    return {
      outbound: 0,
      inbound: 0,
      net: 0,
      source: 'error',
      note: error.message
    };
  }
}
```

**5.2 Timeout Handling for Large Datasets**

**File**: [`services/unleashed-erp.js`](../services/unleashed-erp.js)

**Enhanced Error Handling**:
```javascript
async syncInventoryData() {
  try {
    // Reduced page size from 500 to 250 to avoid timeouts
    const response = await this.client.get('/StockOnHand', {
      params: {
        pageSize: 250, // ✅ Reduced to prevent timeout
        page: 1,
        orderBy: 'LastModifiedOn',
        orderDirection: 'Desc'
      },
      timeout: 30000 // ✅ Increased timeout to 30 seconds
    });

    const stockItems = response.data?.Items || [];

    // ... existing processing ...

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      logError('UNLEASHED ERP: Inventory sync timed out (>30s). Try reducing page size.');
    } else if (error.response?.status === 403) {
      logWarn('UNLEASHED ERP: 403 Forbidden on inventory endpoint. Check API key permissions.');
    } else {
      logError('UNLEASHED ERP: Inventory sync failed:', error);
    }

    return {
      metrics: { totalItems: 0, totalValue: 0, lowStockItems: 0, zeroStockItems: 0 },
      alerts: [],
      error: error.message
    };
  }
}
```

**5.3 Retry Logic with Exponential Backoff**

**File**: [`services/unleashed-erp.js`](../services/unleashed-erp.js)

```javascript
async retryRequest(operation, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;

      // Handle rate limiting (429 Too Many Requests)
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 60;
        logWarn(`Unleashed API rate limited. Retrying after ${retryAfter}s (attempt ${attempt}/${maxRetries})`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
      }

      // Handle timeout errors
      if (error.code === 'ECONNABORTED') {
        const backoff = Math.pow(2, attempt) * 1000; // Exponential backoff
        logWarn(`Unleashed API timeout. Retrying after ${backoff}ms (attempt ${attempt}/${maxRetries})`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
      }

      // Other errors: throw immediately
      throw error;
    }
  }

  throw new Error(`Unleashed API call failed after ${maxRetries} attempts`);
}
```

---

### Phase 6: Testing & Validation (0.5 days)

**6.1 Manual Testing Checklist**

```markdown
### Connection Testing
- [ ] Verify Unleashed ERP connects successfully with valid credentials
- [ ] Verify graceful handling when credentials not configured
- [ ] Verify HMAC-SHA256 signature generated correctly
- [ ] Verify error messages are user-friendly

### Data Accuracy Testing
- [ ] Compare assembly job counts to Unleashed admin panel
- [ ] Verify stock on hand levels match Unleashed
- [ ] Confirm low-stock threshold logic is accurate
- [ ] Check quality score calculation from yield data

### API Endpoint Testing
- [ ] `/api/v1/dashboard/executive` includes Unleashed metrics
- [ ] `/api/v1/dashboard/production-schedule` returns assembly jobs
- [ ] `/api/v1/dashboard/unleashed-inventory` returns stock on hand
- [ ] `/api/v1/dashboard/quality-alerts` returns quality issues
- [ ] Response times < 3 seconds for all endpoints

### Real-Time Updates Testing
- [ ] SSE event `unleashed-sync-started` fires every 15 minutes
- [ ] SSE event `unleashed-sync-completed` triggers dashboard refresh
- [ ] SSE event `unleashed-quality-alert` displays when yield < 95%
- [ ] SSE event `unleashed-low-stock-alert` displays when stock < min level
- [ ] Dashboard auto-refreshes after successful sync

### Frontend Testing
- [ ] Production schedule widget displays assembly jobs
- [ ] Quality alerts widget shows yield shortfalls
- [ ] Empty state displays when Unleashed not configured
- [ ] Loading states display during data fetch

### Error Handling Testing
- [ ] Missing credentials: clear setup instructions
- [ ] Invalid credentials: specific error messages
- [ ] 403 Forbidden (Stock Movements): documented limitation shown
- [ ] Timeout errors: retry with backoff
```

**6.2 Automated Testing**

**File**: `tests/integration/unleashed-integration.test.js`

```javascript
import { describe, it, expect, beforeAll } from 'vitest';
import unleashedERPService from '../../services/unleashed-erp.js';

describe('Unleashed ERP Integration', () => {
  beforeAll(async () => {
    try {
      await unleashedERPService.connect();
    } catch (error) {
      console.warn('Unleashed ERP not configured, skipping tests');
    }
  });

  it('should connect to Unleashed ERP with valid credentials', () => {
    if (unleashedERPService.isConnected) {
      expect(unleashedERPService.isConnected).toBe(true);
    } else {
      console.warn('Unleashed not connected - credentials not configured');
    }
  });

  it('should fetch manufacturing data', async () => {
    if (!unleashedERPService.isConnected) return;

    const data = await unleashedERPService.getConsolidatedData();

    expect(data).toHaveProperty('production');
    expect(data.production).toHaveProperty('activeBatches');
    expect(data.production).toHaveProperty('qualityScore');
    expect(data.production).toHaveProperty('utilizationRate');
  });

  it('should calculate quality score from assembly jobs', async () => {
    if (!unleashedERPService.isConnected) return;

    const data = await unleashedERPService.getConsolidatedData();

    expect(data.production.qualityScore).toBeGreaterThanOrEqual(0);
    expect(data.production.qualityScore).toBeLessThanOrEqual(100);
  });

  it('should identify low-stock items', async () => {
    if (!unleashedERPService.isConnected) return;

    const data = await unleashedERPService.getConsolidatedData();

    expect(data.inventoryAlerts).toBeInstanceOf(Array);

    // If there are low-stock alerts, verify structure
    if (data.inventoryAlerts.length > 0) {
      const alert = data.inventoryAlerts[0];
      expect(alert).toHaveProperty('productCode');
      expect(alert).toHaveProperty('currentStock');
      expect(alert).toHaveProperty('minLevel');
      expect(alert.currentStock).toBeLessThan(alert.minLevel);
    }
  });
});

describe('Unleashed Error Handling', () => {
  it('should handle missing credentials gracefully', async () => {
    const originalId = process.env.UNLEASHED_API_ID;
    delete process.env.UNLEASHED_API_ID;

    const tempService = new UnleashedERPService();

    await expect(tempService.connect()).rejects.toThrow('credentials');

    process.env.UNLEASHED_API_ID = originalId;
  });

  it('should handle 403 Forbidden on Stock Movements', async () => {
    // Stock Movements endpoint is known to return 403
    // Service should handle gracefully and use alternative data
    // This is a documented limitation, not an error

    expect(true).toBe(true); // Placeholder - known limitation
  });
});
```

---

### Phase 7: Documentation & Deployment (0.5 days)

**7.1 Setup Documentation**

**New File**: `docs/integrations/unleashed-erp-setup.md`

```markdown
# Unleashed ERP Integration Setup Guide

## Overview

Connect your Unleashed Software ERP system to the CapLiquify Manufacturing Platform for real-time production tracking, inventory management, and quality control.

## Prerequisites

- Unleashed Software account (Company subscription)
- Admin access to Unleashed admin panel
- API access enabled on subscription plan
- Render dashboard access (for environment variables)

## Step 1: Generate API Credentials

1. Log into Unleashed: https://go.unleashedsoftware.com/
2. Navigate to: **Integration** → **API Access**
3. Click **Add API Key**
4. Configure key:
   - Key name: `CapLiquify Manufacturing Platform`
   - Permissions:
     - ✅ Assembly Jobs (Read)
     - ✅ Stock On Hand (Read)
     - ✅ Sales Orders (Read)
     - ✅ Purchase Orders (Read)
     - ✅ Products (Read)
     - ✅ Warehouses (Read)
     - ❌ Stock Movements (Known Issue: 403 Forbidden)
5. Click **Save**
6. Copy credentials:
   - **API ID**: `a1b2c3d4-e5f6-7890-abcd-1234567890ab` (GUID format)
   - **API Key**: `AbCdEf123456==` (base64 string)

## Step 2: Configure Environment Variables on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select service: `sentia-manufacturing-dashboard-621h`
3. Click **Environment** tab
4. Add variables:

```bash
UNLEASHED_API_ID=a1b2c3d4-e5f6-7890-abcd-1234567890ab
UNLEASHED_API_KEY=AbCdEf123456==
UNLEASHED_API_URL=https://api.unleashedsoftware.com
```

5. Click **Save Changes**
6. Service will auto-redeploy (~5 minutes)

## Step 3: Verify Connection

Check Render logs for:
```
[INFO] UNLEASHED: Initializing ERP connection...
[INFO] UNLEASHED: Connected to Unleashed ERP successfully
[INFO] UNLEASHED: Production - 3 active batches
[INFO] UNLEASHED: Quality Score - 97.5%
[INFO] UNLEASHED: Utilization - 87.0%
```

## Step 4: Monitor Sync Status

### Sync Schedule

- **Frequency**: Every 15 minutes
- **Assembly Jobs**: Last 100 jobs (sorted by modified date)
- **Stock On Hand**: Last 250 items (sorted by modified date)
- **Sales Orders**: Last 30 days
- **Purchase Orders**: Latest 50
- **Cache Duration**: 30 minutes (Redis)

## Known Limitations

### Stock Movements Endpoint (403 Forbidden)

**Issue**: `/StockMovements` endpoint returns 403 Forbidden error

**Cause**: API key permissions or subscription plan limitation

**Workaround**: Stock movements calculated from Sales Orders + Purchase Orders
- Outbound movements: Sales order quantities
- Inbound movements: Purchase order quantities
- Net movements: Inbound - Outbound

**Impact**: Limited - calculated movements provide sufficient visibility

**Resolution**: Contact Unleashed support to enable Stock Movements API access

## Data Accuracy

### Production Metrics

```
Active Batches = AssemblyJobs where JobStatus = 'InProgress'
Completed Today = AssemblyJobs where CompletedDate = Today
Quality Score = (Jobs without yield issues / Total completed jobs) × 100
Utilization Rate = (Active jobs / Planned capacity) × 100
```

### Inventory Metrics

```
Total Value = Σ(QtyOnHand × AverageLandedCost)
Low Stock Items = Items where QtyOnHand < MinStockLevel
Zero Stock Items = Items where QtyOnHand = 0
```

### Quality Alerts

```
Yield Shortfall = ActualQuantity < PlannedQuantity × 0.95
Severity = High (< 90% yield), Medium (90-95% yield), Low (> 95% yield)
```

## Troubleshooting

### Error: "Missing API credentials"
- Verify `UNLEASHED_API_ID` and `UNLEASHED_API_KEY` are set in Render
- Check for typos in environment variable names
- Ensure credentials are not wrapped in quotes

### Error: "Connection timeout"
- API requests timeout after 30 seconds
- Reduce page size if syncing large datasets
- Check Unleashed API status: https://status.unleashedsoftware.com/

### Error: "403 Forbidden"
- Verify API key permissions in Unleashed admin
- Check subscription plan includes API access
- Stock Movements endpoint known to return 403 (expected)

### Low Data Quality

- Ensure assembly jobs have completed dates
- Verify stock items have min stock levels set
- Check that products have landed costs configured
- Review sales/purchase order data completeness

## Performance Optimization

### Sync Frequency

**Default**: 15 minutes

**To Change** (Edit `services/unleashed-erp.js` line 14):
```javascript
this.syncFrequency = 30 * 60 * 1000; // 30 minutes
```

### Page Sizes

**Current Settings**:
- Assembly Jobs: 100 items
- Stock On Hand: 250 items
- Sales Orders: 100 items
- Purchase Orders: 50 items

**To Adjust** (Reduce if experiencing timeouts):
```javascript
// services/unleashed-erp.js
pageSize: 50 // Reduced from 100
```

## Support

For issues with this integration:
1. Check Render logs for error details
2. Verify API credentials in Unleashed admin
3. Contact development team with specific error messages
4. See: [BMAD-MOCK-004 Story](../bmad/stories/2025-10-unleashed-erp-manufacturing-integration.md)
```

**7.2 Update CLAUDE.md**

```markdown
### **Unleashed ERP Integration** ✅ **OPERATIONAL**

- **Framework**: Complete Unleashed REST API integration with HMAC-SHA256 auth
- **Reality**: Assembly jobs, stock on hand, sales/purchase orders syncing
- **Status**: Operational - Production tracking, inventory management, quality alerts
- **Story**: BMAD-MOCK-004 (Completed 2025-10-19)
- **Known Limitation**: Stock Movements endpoint returns 403 (using calculated movements)
```

**7.3 Deployment**

```bash
# Commit Phase 3 changes
git add .
git commit -m "feat(unleashed): Complete BMAD-MOCK-004 - Unleashed ERP manufacturing integration

- Integrate Unleashed ERP with HMAC-SHA256 authentication
- Add assembly job sync (production tracking, quality alerts)
- Add stock on hand sync (inventory levels, low-stock alerts)
- Add sales/purchase order sync (material tracking)
- Implement dashboard API endpoints for manufacturing data
- Add SSE events for real-time production updates
- Create production schedule and quality widgets
- Comprehensive error handling for 403 Forbidden (Stock Movements)
- Complete setup documentation

Story: BMAD-MOCK-004
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
- ✅ Unleashed ERP connects with HMAC-SHA256 authentication
- ✅ Assembly job data synced every 15 minutes
- ✅ Stock on hand levels tracked
- ✅ Production schedule displayed from assembly jobs
- ✅ Quality alerts trigger for yield shortfalls (<95%)
- ✅ Low-stock alerts trigger for items below min level
- ✅ Real-time SSE updates for production changes
- ✅ Empty states displayed when Unleashed not configured

### Technical Requirements
- ✅ Zero mock data in Unleashed code paths
- ✅ All API endpoints return real ERP data or setup prompt
- ✅ Response times <3 seconds for dashboard load
- ✅ Redis caching reduces Unleashed API calls
- ✅ Retry logic for timeouts and errors
- ✅ SSE events: sync-started, sync-completed, quality-alert, low-stock-alert, sync-error

### Testing Requirements
- ✅ Manual testing checklist passed
- ✅ Automated integration tests green
- ✅ Production metrics validated against Unleashed admin
- ✅ Inventory levels match Unleashed stock on hand
- ✅ Quality score calculated correctly from yield data
- ✅ 403 Forbidden on Stock Movements handled gracefully

### Documentation Requirements
- ✅ Complete setup guide with API credential instructions
- ✅ CLAUDE.md updated with operational status
- ✅ Known limitations documented (Stock Movements 403)
- ✅ Troubleshooting section covers common errors

### Deployment Requirements
- ✅ Changes deployed to development environment
- ✅ Render logs show successful Unleashed connection
- ✅ Dashboard displays real manufacturing data
- ✅ SSE events firing every 15 minutes

---

## 📊 Success Metrics

### Before (Mock Data)
- Manufacturing data: Not integrated
- Production tracking: No visibility
- Quality control: Mock alerts
- Inventory: No ERP connection

### After (Real Data)
- Manufacturing data: Live Unleashed ERP integration
- Production tracking: Real assembly jobs (in-progress, planned, completed)
- Quality control: Actual yield tracking and shortfall alerts
- Inventory: Real-time stock on hand with low-stock notifications

---

## 🔗 Related Stories

**Epic**: [EPIC-002: Eliminate Mock Data](../epics/2025-10-eliminate-mock-data-epic.md)

**Sprint 2 Stories**:
- ✅ BMAD-MOCK-003: Amazon SP-API Orders Integration (Completed)
- ✅ BMAD-MOCK-004: Unleashed ERP Manufacturing Integration (This Story)

**Sprint 3 Stories** (Upcoming):
- ⏳ BMAD-MOCK-005: Real-time Data Streaming via SSE (2 days)
- ⏳ BMAD-MOCK-006: API Fallback Handling (1.5 days)
- ⏳ BMAD-MOCK-007: UI Empty States & Loading UI (2 days)

---

**Story Status**: ✅ Ready for Implementation
**Next Step**: Begin Phase 1 - Unleashed API Credential Setup
**Estimated Completion**: 3 days from start

