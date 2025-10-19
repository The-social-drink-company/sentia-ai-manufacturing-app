# BMAD-MOCK-005: Real-Time Data Streaming via SSE

**Story ID**: BMAD-MOCK-005
**Epic**: EPIC-002 (Eliminate Mock Data - Production-Ready Application)
**Sprint**: Sprint 3 - Real-Time & Error Handling
**Story Points**: 4
**Estimated Effort**: 2 days
**Priority**: Medium
**Status**: Ready for Development

**Created**: 2025-10-19
**Assigned To**: Development Team
**BMAD Agent Role**: Developer (`bmad dev`)

---

## 📋 Story Overview

**As a** operations manager
**I want** real-time dashboard updates from actual data sources (Xero, Shopify, Amazon, Unleashed)
**So that** I can monitor live business metrics without manual page refreshes

---

## 🎯 Business Value

**Current State (Problem)**:
- SSE broadcasts send mock data updates
- Real-time events use `Math.random()` for values
- Dashboard updates disconnected from actual API changes
- No notification of real data changes (new orders, inventory alerts, etc.)

**Target State (Solution)**:
- SSE events triggered by actual API data changes
- Webhook handlers for external service notifications
- Dashboard auto-refresh when real data updates
- Real-time alerts for critical events (low stock, quality issues, large orders)

**Business Impact**:
- **Real-Time Visibility**: Instant notification of business-critical events
- **Reduced Manual Work**: No need to manually refresh dashboard
- **Faster Response**: Immediate awareness of inventory/quality issues
- **Data Confidence**: Users trust real-time updates reflect actual state

---

## 🔍 Current State Analysis

### Existing SSE Infrastructure

**File**: [`server/routes/sse.js`](../server/routes/sse.js) (50 lines)

**✅ Already Implemented**:
```javascript
import sseService from '../services/sse/index.cjs';

// SSE channel endpoints
router.get('/dashboard', (req, res) => streamChannel('dashboard', req, res));
router.get('/production', (req, res) => streamChannel('production', req, res));
router.get('/inventory', (req, res) => streamChannel('inventory', req, res));
router.get('/alerts', (req, res) => streamChannel('alerts', req, res));
router.get('/forecast', (req, res) => streamChannel('forecast', req, res));
router.get('/working-capital', (req, res) => streamChannel('working-capital', req, res));
router.get('/jobs/:jobId', (req, res) => streamJobChannel(req.params.jobId, req, res));
router.get('/subscribe', (req, res) => streamMultiChannel(req, res));

// Admin broadcast
router.post('/broadcast', requireRole('admin'), (req, res) => {
  emitAdminBroadcast(channel, event, data, { userId });
});
```

**🎯 Infrastructure Strengths**:
- Complete SSE service with channel subscriptions
- Multi-channel support (dashboard, production, inventory, etc.)
- Admin broadcast capability
- Authentication middleware integrated

**⚠️ Integration Gaps**:
- No connection to real API sync events (Xero, Shopify, Amazon, Unleashed)
- No webhook handlers for external services
- Mock data broadcasts still present (if any)
- No debouncing logic (could spam 15+ events/minute)

**Frontend Hook**: `src/hooks/useSSE.js` or `src/context/sse-context.js`

---

## 🛠️ Technical Implementation Plan

### Phase 1: SSE Event Architecture Design (0.25 days)

**1.1 Define SSE Event Types**

**File**: `server/services/sse/event-types.js` (NEW)

```javascript
/**
 * SSE Event Type Definitions
 * Central registry for all SSE event types across the application
 */

export const SSE_EVENTS = {
  // === XERO FINANCIAL EVENTS ===
  XERO_SYNC_STARTED: 'xero:sync-started',
  XERO_SYNC_COMPLETED: 'xero:sync-completed',
  XERO_SYNC_ERROR: 'xero:sync-error',
  XERO_DATA_UPDATED: 'xero:data-updated',

  // === SHOPIFY SALES EVENTS ===
  SHOPIFY_SYNC_STARTED: 'shopify:sync-started',
  SHOPIFY_STORE_SYNCED: 'shopify:store-synced',
  SHOPIFY_SYNC_COMPLETED: 'shopify:sync-completed',
  SHOPIFY_SYNC_ERROR: 'shopify:sync-error',
  SHOPIFY_ORDER_CREATED: 'shopify:order-created', // Webhook trigger
  SHOPIFY_ORDER_UPDATED: 'shopify:order-updated', // Webhook trigger

  // === AMAZON FBAEVENTS ===
  AMAZON_SYNC_STARTED: 'amazon:sync-started',
  AMAZON_SYNC_COMPLETED: 'amazon:sync-completed',
  AMAZON_SYNC_ERROR: 'amazon:sync-error',
  AMAZON_LOW_STOCK_ALERT: 'amazon:low-stock-alert',
  AMAZON_ORDER_CREATED: 'amazon:order-created', // Webhook trigger

  // === UNLEASHED ERP EVENTS ===
  UNLEASHED_SYNC_STARTED: 'unleashed:sync-started',
  UNLEASHED_SYNC_COMPLETED: 'unleashed:sync-completed',
  UNLEASHED_SYNC_ERROR: 'unleashed:sync-error',
  UNLEASHED_QUALITY_ALERT: 'unleashed:quality-alert',
  UNLEASHED_LOW_STOCK_ALERT: 'unleashed:low-stock-alert',
  UNLEASHED_PRODUCTION_UPDATED: 'unleashed:production-updated',

  // === SYSTEM EVENTS ===
  DASHBOARD_REFRESH_REQUIRED: 'dashboard:refresh-required',
  ALERT_CRITICAL: 'alert:critical',
  ALERT_WARNING: 'alert:warning',
  ALERT_INFO: 'alert:info',
  SYSTEM_HEALTH_CHECK: 'system:health-check',

  // === IMPORT/EXPORT JOB EVENTS ===
  IMPORT_JOB_STARTED: 'import:job-started',
  IMPORT_JOB_PROGRESS: 'import:job-progress',
  IMPORT_JOB_COMPLETED: 'import:job-completed',
  IMPORT_JOB_FAILED: 'import:job-failed',
  EXPORT_JOB_STARTED: 'export:job-started',
  EXPORT_JOB_PROGRESS: 'export:job-progress',
  EXPORT_JOB_COMPLETED: 'export:job-completed',
  EXPORT_JOB_FAILED: 'export:job-failed'
};

/**
 * Event Channel Mapping
 * Maps event types to SSE channels
 */
export const EVENT_CHANNELS = {
  // Dashboard channel: KPIs, summary data
  dashboard: [
    SSE_EVENTS.XERO_DATA_UPDATED,
    SSE_EVENTS.SHOPIFY_SYNC_COMPLETED,
    SSE_EVENTS.AMAZON_SYNC_COMPLETED,
    SSE_EVENTS.UNLEASHED_SYNC_COMPLETED,
    SSE_EVENTS.DASHBOARD_REFRESH_REQUIRED
  ],

  // Production channel: Manufacturing data
  production: [
    SSE_EVENTS.UNLEASHED_SYNC_COMPLETED,
    SSE_EVENTS.UNLEASHED_QUALITY_ALERT,
    SSE_EVENTS.UNLEASHED_PRODUCTION_UPDATED
  ],

  // Inventory channel: Stock levels
  inventory: [
    SSE_EVENTS.SHOPIFY_SYNC_COMPLETED,
    SSE_EVENTS.AMAZON_SYNC_COMPLETED,
    SSE_EVENTS.AMAZON_LOW_STOCK_ALERT,
    SSE_EVENTS.UNLEASHED_SYNC_COMPLETED,
    SSE_EVENTS.UNLEASHED_LOW_STOCK_ALERT
  ],

  // Alerts channel: Critical notifications
  alerts: [
    SSE_EVENTS.AMAZON_LOW_STOCK_ALERT,
    SSE_EVENTS.UNLEASHED_QUALITY_ALERT,
    SSE_EVENTS.UNLEASHED_LOW_STOCK_ALERT,
    SSE_EVENTS.ALERT_CRITICAL,
    SSE_EVENTS.ALERT_WARNING
  ],

  // Working capital channel: Financial metrics
  'working-capital': [
    SSE_EVENTS.XERO_SYNC_COMPLETED,
    SSE_EVENTS.XERO_DATA_UPDATED
  ]
};
```

**1.2 Create SSE Emitter Service**

**File**: `server/services/sse/emitter.js` (NEW)

```javascript
import sseService from './index.cjs';
import { SSE_EVENTS, EVENT_CHANNELS } from './event-types.js';
import { logDebug, logWarn } from '../../utils/logger.js';

class SSEEmitter {
  constructor() {
    this.eventCounts = new Map();
    this.lastEmitTime = new Map();
    this.debounceDelay = 2000; // 2 seconds minimum between same event type
  }

  /**
   * Emit SSE event to appropriate channels with debouncing
   */
  emit(eventType, data, options = {}) {
    try {
      // Validate event type
      if (!Object.values(SSE_EVENTS).includes(eventType)) {
        logWarn(`SSE: Unknown event type: ${eventType}`);
        return;
      }

      // Debounce check
      if (this.shouldDebounce(eventType)) {
        logDebug(`SSE: Debouncing event ${eventType}`);
        return;
      }

      // Determine target channels
      const channels = this.getChannelsForEvent(eventType);

      // Emit to all relevant channels
      channels.forEach(channel => {
        sseService.emit(channel, eventType, data);
        logDebug(`SSE: Emitted ${eventType} to channel ${channel}`);
      });

      // Track emit time for debouncing
      this.lastEmitTime.set(eventType, Date.now());

      // Track event counts
      const count = this.eventCounts.get(eventType) || 0;
      this.eventCounts.set(eventType, count + 1);

    } catch (error) {
      logWarn(`SSE: Failed to emit event ${eventType}:`, error);
    }
  }

  /**
   * Debounce logic: Prevent spamming same event type
   */
  shouldDebounce(eventType) {
    const lastEmit = this.lastEmitTime.get(eventType);
    if (!lastEmit) return false;

    const timeSinceLastEmit = Date.now() - lastEmit;
    return timeSinceLastEmit < this.debounceDelay;
  }

  /**
   * Get SSE channels for a given event type
   */
  getChannelsForEvent(eventType) {
    const channels = [];

    Object.entries(EVENT_CHANNELS).forEach(([channel, events]) => {
      if (events.includes(eventType)) {
        channels.push(channel);
      }
    });

    // Always emit to 'subscribe' channel (multi-channel subscription)
    if (!channels.includes('subscribe')) {
      channels.push('subscribe');
    }

    return channels;
  }

  /**
   * Get event statistics (for monitoring)
   */
  getStatistics() {
    return {
      eventCounts: Object.fromEntries(this.eventCounts),
      activeChannels: Object.keys(EVENT_CHANNELS),
      totalEvents: Array.from(this.eventCounts.values()).reduce((sum, count) => sum + count, 0)
    };
  }
}

export default new SSEEmitter();
```

---

### Phase 2: Integrate API Sync Events (0.5 days)

**2.1 Update Xero Service SSE Events**

**File**: [`services/xeroService.js`](../services/xeroService.js)

**Add SSE Integration** (BMAD-MOCK-001 already has partial implementation):
```javascript
import sseEmitter from '../server/services/sse/emitter.js';
import { SSE_EVENTS } from '../server/services/sse/event-types.js';

// In existing sync methods, add SSE emissions

async getBalanceSheet(periods = 1) {
  try {
    // Emit sync started
    sseEmitter.emit(SSE_EVENTS.XERO_SYNC_STARTED, {
      endpoint: 'balance-sheet',
      periods,
      timestamp: new Date().toISOString()
    });

    const response = await this.api.accountingApi.getBalanceSheet(/* ... */);

    // Emit data updated
    sseEmitter.emit(SSE_EVENTS.XERO_DATA_UPDATED, {
      endpoint: 'balance-sheet',
      dataPoints: response.body.reports[0].rows.length,
      timestamp: new Date().toISOString()
    });

    return this.transformBalanceSheet(response.body);

  } catch (error) {
    // Emit error
    sseEmitter.emit(SSE_EVENTS.XERO_SYNC_ERROR, {
      endpoint: 'balance-sheet',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Similar pattern for P&L, cash flow, working capital methods
```

**2.2 Update Shopify Service SSE Events**

**File**: [`services/shopify-multistore.js`](../services/shopify-multistore.js)

**Enhance Existing SSE Emissions** (BMAD-MOCK-002 has basic implementation):
```javascript
import sseEmitter from '../server/services/sse/emitter.js';
import { SSE_EVENTS } from '../server/services/sse/event-types.js';

async syncAllStores() {
  // ... existing sync logic ...

  // ✅ ALREADY HAS: sendEvent('shopify-sync-started', {...})
  // UPDATE TO USE: sseEmitter.emit(SSE_EVENTS.SHOPIFY_SYNC_STARTED, {...})

  for (const [storeId, store] of this.stores.entries()) {
    try {
      const storeData = await this.syncStore(storeId);

      // Use centralized emitter
      sseEmitter.emit(SSE_EVENTS.SHOPIFY_STORE_SYNCED, {
        storeId,
        storeName: store.name,
        region: store.region,
        orders: storeData.orders,
        revenue: storeData.sales,
        netRevenue: storeData.netSales,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      sseEmitter.emit(SSE_EVENTS.SHOPIFY_SYNC_ERROR, {
        storeId,
        storeName: store.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Emit sync completed
  const consolidatedData = this.consolidateStoreData(syncResults);
  sseEmitter.emit(SSE_EVENTS.SHOPIFY_SYNC_COMPLETED, {
    successCount: syncResults.filter(r => r.success).length,
    totalStores: syncResults.length,
    totalRevenue: consolidatedData.totalSales,
    totalNetRevenue: consolidatedData.totalNetSales,
    totalOrders: consolidatedData.totalOrders,
    timestamp: new Date().toISOString()
  });

  return consolidatedData;
}
```

**2.3 Update Amazon Service SSE Events**

**File**: [`services/amazon-sp-api.js`](../services/amazon-sp-api.js)

**Add SSE Integration** (BMAD-MOCK-003 has placeholder):
```javascript
import sseEmitter from '../server/services/sse/emitter.js';
import { SSE_EVENTS } from '../server/services/sse/event-types.js';

async performFullSync() {
  try {
    sseEmitter.emit(SSE_EVENTS.AMAZON_SYNC_STARTED, {
      timestamp: new Date().toISOString()
    });

    const [inventory, orders, fba] = await Promise.all([
      this.syncInventoryData(),
      this.syncOrderData(),
      this.syncFBAData()
    ]);

    const inventorySummary = await this.getInventorySummary();
    const orderMetrics = await this.getOrderMetrics();

    // Check for low-stock items
    if (inventorySummary.lowStockItems > 0) {
      sseEmitter.emit(SSE_EVENTS.AMAZON_LOW_STOCK_ALERT, {
        count: inventorySummary.lowStockItems,
        criticalItems: inventory.filter(item => item.fulfillableQuantity === 0).length,
        timestamp: new Date().toISOString()
      });
    }

    sseEmitter.emit(SSE_EVENTS.AMAZON_SYNC_COMPLETED, {
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
    sseEmitter.emit(SSE_EVENTS.AMAZON_SYNC_ERROR, {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

**2.4 Update Unleashed Service SSE Events**

**File**: [`services/unleashed-erp.js`](../services/unleashed-erp.js)

**Add SSE Integration** (BMAD-MOCK-004 has placeholder):
```javascript
import sseEmitter from '../server/services/sse/emitter.js';
import { SSE_EVENTS } from '../server/services/sse/event-types.js';

async syncAllData() {
  if (!this.isConnected) return;

  sseEmitter.emit(SSE_EVENTS.UNLEASHED_SYNC_STARTED, {
    timestamp: new Date().toISOString()
  });

  try {
    const syncResults = {};

    syncResults.production = await this.syncProductionData();
    syncResults.inventory = await this.syncInventoryData();
    syncResults.salesOrders = await this.syncSalesOrderData();
    syncResults.purchaseOrders = await this.syncPurchaseOrderData();
    syncResults.resources = await this.syncResourceData();

    const consolidatedData = this.consolidateManufacturingData(syncResults);

    // Quality alerts
    if (consolidatedData.qualityAlerts.length > 0) {
      sseEmitter.emit(SSE_EVENTS.UNLEASHED_QUALITY_ALERT, {
        count: consolidatedData.qualityAlerts.length,
        criticalIssues: consolidatedData.qualityAlerts.filter(a => a.severity === 'High').length,
        alerts: consolidatedData.qualityAlerts.slice(0, 3),
        timestamp: new Date().toISOString()
      });
    }

    // Low-stock alerts
    if (consolidatedData.inventoryAlerts.length > 0) {
      sseEmitter.emit(SSE_EVENTS.UNLEASHED_LOW_STOCK_ALERT, {
        count: consolidatedData.inventoryAlerts.length,
        criticalItems: consolidatedData.inventoryAlerts.filter(item => item.currentStock === 0).length,
        items: consolidatedData.inventoryAlerts.slice(0, 5),
        timestamp: new Date().toISOString()
      });
    }

    sseEmitter.emit(SSE_EVENTS.UNLEASHED_SYNC_COMPLETED, {
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
    sseEmitter.emit(SSE_EVENTS.UNLEASHED_SYNC_ERROR, {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}
```

---

### Phase 3: Webhook Handlers for External Events (0.75 days)

**3.1 Create Webhook Infrastructure**

**File**: `server/webhooks/webhook-handler.js` (NEW)

```javascript
import express from 'express';
import crypto from 'crypto';
import { logInfo, logWarn, logError } from '../utils/logger.js';
import sseEmitter from '../services/sse/emitter.js';
import { SSE_EVENTS } from '../services/sse/event-types.js';

const router = express.Router();

/**
 * Shopify Webhook Handler
 * Triggered when orders are created/updated in Shopify
 */
router.post('/shopify/orders', express.json(), async (req, res) => {
  try {
    // Verify Shopify webhook signature
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const shop = req.headers['x-shopify-shop-domain'];

    if (!verifyShopifyWebhook(req.body, hmac, shop)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const order = req.body;

    // Emit real-time order event
    sseEmitter.emit(SSE_EVENTS.SHOPIFY_ORDER_CREATED, {
      orderId: order.id,
      orderNumber: order.order_number,
      totalPrice: parseFloat(order.total_price),
      currency: order.currency,
      customerEmail: order.customer?.email,
      shop: shop,
      timestamp: new Date().toISOString()
    });

    // Trigger dashboard refresh
    sseEmitter.emit(SSE_EVENTS.DASHBOARD_REFRESH_REQUIRED, {
      source: 'shopify',
      reason: 'new-order',
      timestamp: new Date().toISOString()
    });

    logInfo(`WEBHOOK: Shopify order created - ${order.order_number}`);
    res.status(200).json({ received: true });

  } catch (error) {
    logError('WEBHOOK: Shopify order webhook failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Amazon SP-API Notification Handler
 * Triggered by Amazon SNS notifications (orders, inventory changes)
 */
router.post('/amazon/notifications', express.json(), async (req, res) => {
  try {
    const notification = req.body;

    // Verify Amazon SNS signature
    if (!verifyAmazonSNS(notification)) {
      return res.status(401).json({ error: 'Invalid SNS signature' });
    }

    // Handle subscription confirmation
    if (notification.Type === 'SubscriptionConfirmation') {
      await confirmAmazonSubscription(notification.SubscribeURL);
      return res.status(200).json({ confirmed: true });
    }

    // Process notification
    const message = JSON.parse(notification.Message);

    if (message.NotificationType === 'ORDER_CHANGE') {
      sseEmitter.emit(SSE_EVENTS.AMAZON_ORDER_CREATED, {
        orderId: message.OrderId,
        marketplaceId: message.MarketplaceId,
        timestamp: new Date().toISOString()
      });
    }

    if (message.NotificationType === 'INVENTORY_UPDATE') {
      sseEmitter.emit(SSE_EVENTS.DASHBOARD_REFRESH_REQUIRED, {
        source: 'amazon',
        reason: 'inventory-update',
        timestamp: new Date().toISOString()
      });
    }

    logInfo(`WEBHOOK: Amazon notification received - ${message.NotificationType}`);
    res.status(200).json({ received: true });

  } catch (error) {
    logError('WEBHOOK: Amazon notification webhook failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Xero Webhook Handler
 * Triggered when financial data changes in Xero
 */
router.post('/xero/webhook', express.json(), async (req, res) => {
  try {
    // Verify Xero webhook signature
    const signature = req.headers['x-xero-signature'];

    if (!verifyXeroWebhook(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const events = req.body.events;

    events.forEach(event => {
      if (event.eventType === 'UPDATE' && event.eventCategory === 'INVOICE') {
        sseEmitter.emit(SSE_EVENTS.XERO_DATA_UPDATED, {
          resourceId: event.resourceId,
          resourceType: event.resourceType,
          eventType: event.eventType,
          timestamp: new Date().toISOString()
        });

        sseEmitter.emit(SSE_EVENTS.DASHBOARD_REFRESH_REQUIRED, {
          source: 'xero',
          reason: 'invoice-updated',
          timestamp: new Date().toISOString()
        });
      }
    });

    logInfo(`WEBHOOK: Xero webhook received - ${events.length} events`);
    res.status(200).json({ received: true });

  } catch (error) {
    logError('WEBHOOK: Xero webhook failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook signature verification functions
function verifyShopifyWebhook(body, hmac, shop) {
  const shopSecret = process.env[`SHOPIFY_${shop.toUpperCase()}_WEBHOOK_SECRET`];
  if (!shopSecret) return false;

  const hash = crypto
    .createHmac('sha256', shopSecret)
    .update(JSON.stringify(body))
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
}

function verifyAmazonSNS(notification) {
  // Amazon SNS signature verification
  // See: https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
  // Implementation depends on amazon-sns-message-validator package
  return true; // Placeholder - implement actual verification
}

function verifyXeroWebhook(body, signature) {
  const webhookKey = process.env.XERO_WEBHOOK_KEY;
  if (!webhookKey) return false;

  const hash = crypto
    .createHmac('sha256', webhookKey)
    .update(JSON.stringify(body))
    .digest('base64');

  return hash === signature;
}

async function confirmAmazonSubscription(subscribeURL) {
  // Confirm Amazon SNS subscription
  const response = await fetch(subscribeURL);
  logInfo('WEBHOOK: Amazon SNS subscription confirmed');
  return response.ok;
}

export default router;
```

**3.2 Register Webhook Routes**

**File**: [`server.js`](../server.js) or [`server/routes/index.js`](../server/routes/index.js)

```javascript
import webhookHandler from './webhooks/webhook-handler.js';

// Register webhook routes (before authentication middleware)
app.use('/api/webhooks', webhookHandler);
```

---

### Phase 4: Frontend SSE Subscription Updates (0.25 days)

**4.1 Update Frontend SSE Hook**

**File**: `src/hooks/useSSE.js` or `src/context/sse-context.js`

```javascript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { SSE_EVENTS } from '../constants/sse-events'; // Copy from server

export function useSSE() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/api/sse/subscribe');

    // === XERO EVENTS ===
    eventSource.addEventListener(SSE_EVENTS.XERO_SYNC_COMPLETED, (event) => {
      const data = JSON.parse(event.data);
      queryClient.invalidateQueries(['dashboard', 'executive']);
      queryClient.invalidateQueries(['working-capital']);
      toast.success('Xero data updated');
    });

    eventSource.addEventListener(SSE_EVENTS.XERO_DATA_UPDATED, (event) => {
      const data = JSON.parse(event.data);
      queryClient.invalidateQueries(['xero', 'financial']);
    });

    // === SHOPIFY EVENTS ===
    eventSource.addEventListener(SSE_EVENTS.SHOPIFY_SYNC_COMPLETED, (event) => {
      const data = JSON.parse(event.data);
      queryClient.invalidateQueries(['dashboard', 'executive']);
      queryClient.invalidateQueries(['dashboard', 'sales-trends']);
      toast.success(`Shopify sync: ${data.totalOrders} orders, $${data.totalRevenue.toFixed(2)}`);
    });

    eventSource.addEventListener(SSE_EVENTS.SHOPIFY_ORDER_CREATED, (event) => {
      const data = JSON.parse(event.data);
      queryClient.invalidateQueries(['dashboard', 'executive']);
      toast.info(`New order: ${data.orderNumber} - $${data.totalPrice}`);
    });

    // === AMAZON EVENTS ===
    eventSource.addEventListener(SSE_EVENTS.AMAZON_SYNC_COMPLETED, (event) => {
      const data = JSON.parse(event.data);
      queryClient.invalidateQueries(['dashboard', 'executive']);
      queryClient.invalidateQueries(['dashboard', 'amazon-inventory']);
      toast.success(`Amazon sync: ${data.inventory.totalSKUs} SKUs`);
    });

    eventSource.addEventListener(SSE_EVENTS.AMAZON_LOW_STOCK_ALERT, (event) => {
      const data = JSON.parse(event.data);
      toast.warning(`⚠️ ${data.count} Amazon SKUs below reorder point`, {
        duration: 10000,
        action: {
          label: 'View Inventory',
          onClick: () => navigate('/inventory/amazon')
        }
      });
    });

    // === UNLEASHED EVENTS ===
    eventSource.addEventListener(SSE_EVENTS.UNLEASHED_SYNC_COMPLETED, (event) => {
      const data = JSON.parse(event.data);
      queryClient.invalidateQueries(['dashboard', 'executive']);
      queryClient.invalidateQueries(['dashboard', 'production-schedule']);
      toast.success(`Unleashed sync: ${data.production.activeBatches} active batches`);
    });

    eventSource.addEventListener(SSE_EVENTS.UNLEASHED_QUALITY_ALERT, (event) => {
      const data = JSON.parse(event.data);
      toast.warning(`⚠️ ${data.count} quality alerts detected`, {
        duration: 15000,
        action: {
          label: 'View Details',
          onClick: () => navigate('/production/quality')
        }
      });
    });

    eventSource.addEventListener(SSE_EVENTS.UNLEASHED_LOW_STOCK_ALERT, (event) => {
      const data = JSON.parse(event.data);
      toast.warning(`⚠️ ${data.count} items below minimum stock level`, {
        duration: 15000,
        action: {
          label: 'View Inventory',
          onClick: () => navigate('/inventory/unleashed')
        }
      });
    });

    // === SYSTEM EVENTS ===
    eventSource.addEventListener(SSE_EVENTS.DASHBOARD_REFRESH_REQUIRED, (event) => {
      const data = JSON.parse(event.data);
      queryClient.invalidateQueries(['dashboard']);
      console.log('Dashboard refresh triggered:', data.source, data.reason);
    });

    eventSource.addEventListener(SSE_EVENTS.ALERT_CRITICAL, (event) => {
      const data = JSON.parse(event.data);
      toast.error(`🚨 CRITICAL: ${data.message}`, {
        duration: 30000
      });
    });

    // Connection status handling
    eventSource.onopen = () => {
      console.log('SSE connection established');
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Auto-reconnect handled by browser
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
```

---

### Phase 5: Testing & Validation (0.25 days)

**5.1 Manual Testing Checklist**

```markdown
### SSE Event Flow Testing
- [ ] Verify Xero sync triggers `xero:sync-completed` event
- [ ] Verify Shopify sync triggers `shopify:sync-completed` event
- [ ] Verify Amazon sync triggers `amazon:sync-completed` event
- [ ] Verify Unleashed sync triggers `unleashed:sync-completed` event
- [ ] Confirm dashboard auto-refreshes on sync events

### Webhook Testing
- [ ] Send test Shopify order webhook → SSE event emitted
- [ ] Send test Amazon notification → SSE event emitted
- [ ] Send test Xero webhook → SSE event emitted
- [ ] Verify webhook signature validation rejects invalid requests

### Debouncing Testing
- [ ] Trigger same event 10 times in 1 second → only 1-2 emissions
- [ ] Verify debounce delay of 2 seconds working
- [ ] Confirm no spam of 15+ events/minute

### Frontend Integration Testing
- [ ] Dashboard receives SSE events and invalidates queries
- [ ] Toast notifications display for critical events
- [ ] Low-stock alerts persist for 10+ seconds
- [ ] Quality alerts show action buttons (View Details)

### Performance Testing
- [ ] Monitor SSE connection stability over 1 hour
- [ ] Verify browser auto-reconnects on connection drop
- [ ] Confirm no memory leaks from event listeners
- [ ] Check network traffic (events should be <1KB each)
```

**5.2 Automated Testing**

**File**: `tests/integration/sse-events.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import sseEmitter from '../../server/services/sse/emitter.js';
import { SSE_EVENTS } from '../../server/services/sse/event-types.js';

describe('SSE Event Emitter', () => {
  it('should emit events to correct channels', () => {
    const channels = sseEmitter.getChannelsForEvent(SSE_EVENTS.XERO_SYNC_COMPLETED);

    expect(channels).toContain('dashboard');
    expect(channels).toContain('working-capital');
    expect(channels).toContain('subscribe');
  });

  it('should debounce rapid successive events', async () => {
    sseEmitter.eventCounts.clear();

    // Emit same event 5 times rapidly
    for (let i = 0; i < 5; i++) {
      sseEmitter.emit(SSE_EVENTS.XERO_DATA_UPDATED, { test: true });
    }

    // Should only emit once due to debouncing
    const count = sseEmitter.eventCounts.get(SSE_EVENTS.XERO_DATA_UPDATED);
    expect(count).toBeLessThanOrEqual(2);
  });

  it('should track event statistics', () => {
    sseEmitter.emit(SSE_EVENTS.SHOPIFY_SYNC_COMPLETED, {});
    sseEmitter.emit(SSE_EVENTS.AMAZON_SYNC_COMPLETED, {});

    const stats = sseEmitter.getStatistics();

    expect(stats.totalEvents).toBeGreaterThan(0);
    expect(stats.activeChannels.length).toBeGreaterThan(0);
  });
});

describe('Webhook Handlers', () => {
  it('should validate Shopify webhook signatures', () => {
    // Test webhook signature validation
    // Implementation depends on test setup
  });
});
```

---

### Phase 6: Documentation & Deployment (0.25 days)

**6.1 SSE Event Documentation**

**New File**: `docs/architecture/sse-events.md`

```markdown
# Server-Sent Events (SSE) Architecture

## Overview

Real-time dashboard updates are delivered via Server-Sent Events (SSE), providing live notifications of data changes from external APIs without manual page refreshes.

## Event Flow

```
External API → Service Sync → SSE Emitter → SSE Channels → Frontend Listeners → Dashboard Refresh
```

## Event Types

### Xero Financial Events
- `xero:sync-started` - Xero sync initiated
- `xero:sync-completed` - Xero sync finished successfully
- `xero:sync-error` - Xero sync failed
- `xero:data-updated` - Xero invoice/bill updated (webhook)

### Shopify Sales Events
- `shopify:sync-started` - Shopify sync initiated
- `shopify:store-synced` - Individual store synced
- `shopify:sync-completed` - All stores synced successfully
- `shopify:sync-error` - Shopify sync failed
- `shopify:order-created` - New order created (webhook)

### Amazon FBA Events
- `amazon:sync-started` - Amazon sync initiated
- `amazon:sync-completed` - Amazon sync finished successfully
- `amazon:sync-error` - Amazon sync failed
- `amazon:low-stock-alert` - SKUs below reorder point (<10 units)
- `amazon:order-created` - New order created (webhook)

### Unleashed ERP Events
- `unleashed:sync-started` - Unleashed sync initiated
- `unleashed:sync-completed` - Unleashed sync finished successfully
- `unleashed:sync-error` - Unleashed sync failed
- `unleashed:quality-alert` - Production yield shortfall detected
- `unleashed:low-stock-alert` - Stock items below minimum level
- `unleashed:production-updated` - Assembly job status changed

### System Events
- `dashboard:refresh-required` - Dashboard should reload data
- `alert:critical` - Critical system alert
- `alert:warning` - Warning notification
- `alert:info` - Informational message

## SSE Channels

### `/api/sse/dashboard`
Receives: KPI updates, sync completions, general dashboard events

### `/api/sse/production`
Receives: Manufacturing data, quality alerts, production updates

### `/api/sse/inventory`
Receives: Stock levels, low-stock alerts, inventory changes

### `/api/sse/alerts`
Receives: All critical/warning alerts from any source

### `/api/sse/working-capital`
Receives: Financial data updates from Xero

### `/api/sse/subscribe`
Receives: All events from all channels (multi-channel subscription)

## Frontend Integration

```javascript
import { useSSE } from '../hooks/useSSE';

function Dashboard() {
  useSSE(); // Automatically subscribes to all events

  return <DashboardLayout />;
}
```

## Webhook Setup

### Shopify Webhooks
1. Shopify Admin → Settings → Notifications → Webhooks
2. Add webhook: `https://your-domain.com/api/webhooks/shopify/orders`
3. Topic: `orders/create`
4. Format: JSON

### Amazon SP-API Notifications
1. Configure Amazon SNS topic
2. Subscribe to: `ORDER_CHANGE`, `INVENTORY_UPDATE`
3. Endpoint: `https://your-domain.com/api/webhooks/amazon/notifications`

### Xero Webhooks
1. Xero Developer Portal → Your App → Webhooks
2. Delivery URL: `https://your-domain.com/api/webhooks/xero/webhook`
3. Events: `INVOICE.UPDATE`, `BILL.UPDATE`

## Debouncing

SSE events are debounced with a 2-second delay to prevent spam:
- Same event type cannot emit more than once per 2 seconds
- Protects against rapid sync loops
- Reduces client-side rendering overhead

## Monitoring

```bash
# Check SSE event statistics
GET /api/sse/status

Response:
{
  "eventCounts": {
    "xero:sync-completed": 45,
    "shopify:sync-completed": 32,
    "amazon:sync-completed": 28
  },
  "activeChannels": ["dashboard", "production", "inventory"],
  "totalEvents": 105
}
```
```

**6.2 Update CLAUDE.md**

```markdown
### **Real-Time Data Streaming** ✅ **OPERATIONAL**

- **Framework**: Server-Sent Events (SSE) with centralized emitter
- **Reality**: Live updates from Xero, Shopify, Amazon, Unleashed APIs
- **Status**: Operational - Real-time dashboard refresh, webhook handlers, debouncing
- **Story**: BMAD-MOCK-005 (Completed 2025-10-19)
- **Webhooks**: Shopify orders, Amazon notifications, Xero financial updates
```

**6.3 Deployment**

```bash
# Commit SSE integration
git add .
git commit -m "feat(sse): Complete BMAD-MOCK-005 - Real-time data streaming

- Create centralized SSE emitter with debouncing
- Integrate SSE events in Xero, Shopify, Amazon, Unleashed services
- Add webhook handlers for Shopify orders, Amazon notifications, Xero updates
- Update frontend SSE hook with all event types
- Implement 2-second debounce to prevent spam
- Complete SSE architecture documentation

Story: BMAD-MOCK-005
Sprint: Sprint 3 - Real-Time & Error Handling
Effort: 2 days

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to development
git push origin development
```

---

## ✅ Definition of Done

### Functional Requirements
- ✅ SSE events emitted on all API sync operations
- ✅ Webhook handlers for Shopify, Amazon, Xero
- ✅ Dashboard auto-refresh on data updates
- ✅ Real-time alerts for low stock, quality issues, large orders
- ✅ Debouncing prevents event spam (max 1 event per 2 seconds per type)

### Technical Requirements
- ✅ Zero `Math.random()` in SSE broadcasts
- ✅ All SSE events source from real API data
- ✅ Centralized event emitter with channel routing
- ✅ Webhook signature verification for all external services
- ✅ Frontend SSE subscription handles all event types
- ✅ Browser auto-reconnect on SSE connection drop

### Testing Requirements
- ✅ Manual testing checklist passed
- ✅ Automated SSE event tests green
- ✅ Webhook signature validation tested
- ✅ Debouncing verified (10 events → 1-2 emissions)
- ✅ Frontend receives events and invalidates queries

### Documentation Requirements
- ✅ Complete SSE architecture documentation
- ✅ Webhook setup guides for all services
- ✅ Event type reference with examples
- ✅ Frontend integration guide

### Deployment Requirements
- ✅ Changes deployed to development environment
- ✅ SSE endpoints accessible
- ✅ Webhooks configured on external services
- ✅ Event monitoring dashboard functional

---

## 📊 Success Metrics

### Before (Mock SSE)
- SSE events: Random data generation
- Dashboard updates: Manual refresh only
- Alerts: Simulated, not actionable
- Webhooks: Not integrated

### After (Real SSE)
- SSE events: Triggered by actual API changes
- Dashboard updates: Automatic on data change
- Alerts: Real-time, actionable notifications
- Webhooks: Live integration with external services

---

## 🔗 Related Stories

**Epic**: [EPIC-002: Eliminate Mock Data](../epics/2025-10-eliminate-mock-data-epic.md)

**Sprint 3 Stories**:
- ✅ BMAD-MOCK-005: Real-Time Data Streaming (This Story)
- ⏳ BMAD-MOCK-006: API Fallback Handling (1.5 days)
- ⏳ BMAD-MOCK-007: UI Empty States & Loading UI (2 days)

---

**Story Status**: ✅ Ready for Implementation
**Next Step**: Begin Phase 1 - SSE Event Architecture Design
**Estimated Completion**: 2 days from start
