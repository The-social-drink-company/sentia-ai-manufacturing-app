/**
 * Unleashed Inventory Sync Service
 * Synchronizes Unleashed ERP inventory data with local database
 */

import cron from 'node-cron';
import prisma from '../../lib/prisma.js';
import unleashedIntegration from '../../mcp-server/api-integrations/unleashed-integration.js';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';
import websocketService from '../websocketService.js';

class UnleashedInventorySync {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncInterval = process.env.UNLEASHED_SYNC_INTERVAL || '*/15 * * * *'; // Every 15 minutes
    this.cronJob = null;
    this.syncStats = {
      lastSync: null,
      itemsSynced: 0,
      errors: [],
      duration: 0
    };
  }

  /**
   * Safely parse date string to avoid Invalid Date errors
   * Handles both ISO format and Unleashed's /Date(timestamp)/ format
   */
  safeParseDate(dateString, defaultValue = new Date()) {
    if (!dateString) return defaultValue;

    try {
      // Check if it's Unleashed's /Date(timestamp)/ format
      if (typeof dateString === 'string' && dateString.startsWith('/Date(')) {
        const match = dateString.match(/\/Date\((\d+)\)\//);
        if (match) {
          const timestamp = parseInt(match[1], 10);
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        logWarn('Invalid Unleashed date format', { dateString });
        return defaultValue;
      }

      // Try standard date parsing
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        logWarn('Invalid date string received', { dateString });
        return defaultValue;
      }
      return date;
    } catch (error) {
      logWarn('Date parsing error', { dateString, error: error.message });
      return defaultValue;
    }
  }

  /**
   * Initialize sync service and start scheduled sync
   */
  async initialize() {
    try {
      // Initialize Unleashed integration
      const result = await unleashedIntegration.initialize();

      if (!result.success) {
        logWarn('Unleashed sync not initialized - API not configured', { error: result.error });
        return false;
      }

      // Start scheduled sync
      this.startScheduledSync();

      // Perform initial sync
      await this.performSync();

      logInfo('Unleashed inventory sync service initialized', {
        syncInterval: this.syncInterval
      });

      return true;
    } catch (error) {
      logError('Failed to initialize Unleashed sync', error);
      return false;
    }
  }

  /**
   * Start scheduled sync using cron
   */
  startScheduledSync() {
    if (this.cronJob) {
      this.cronJob.stop();
    }

    this.cronJob = cron.schedule(this.syncInterval, async () => {
      logInfo('Starting scheduled Unleashed inventory sync');
      await this.performSync();
    });

    logInfo('Scheduled Unleashed sync started', { schedule: this.syncInterval });
  }

  /**
   * Stop scheduled sync
   */
  stopScheduledSync() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logInfo('Scheduled Unleashed sync stopped');
    }
  }

  /**
   * Perform full inventory sync
   */
  async performSync() {
    if (this.isRunning) {
      logWarn('Sync already in progress, skipping');
      return { success: false, message: 'Sync already in progress' };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logInfo('Starting Unleashed inventory sync');

      // Reset sync stats
      this.syncStats = {
        lastSync: new Date(),
        itemsSynced: 0,
        errors: [],
        duration: 0
      };

      // 1. Sync Stock on Hand
      await this.syncStockOnHand();

      // 2. Sync Purchase Orders
      await this.syncPurchaseOrders();

      // 3. Sync Sales Orders
      await this.syncSalesOrders();

      // 4. Sync Stock Movements
      await this.syncStockMovements();

      // 5. Calculate inventory metrics
      await this.calculateInventoryMetrics();

      // Update sync stats
      this.syncStats.duration = Date.now() - startTime;
      this.lastSyncTime = new Date();

      // Broadcast sync completion
      this.broadcastSyncStatus('completed', this.syncStats);

      logInfo('Unleashed inventory sync completed', this.syncStats);

      return {
        success: true,
        stats: this.syncStats
      };
    } catch (error) {
      logError('Unleashed inventory sync failed', error);

      this.syncStats.errors.push(error.message);
      this.syncStats.duration = Date.now() - startTime;

      this.broadcastSyncStatus('failed', this.syncStats);

      return {
        success: false,
        error: error.message,
        stats: this.syncStats
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync stock on hand from Unleashed
   */
  async syncStockOnHand() {
    try {
      logInfo('Syncing stock on hand from Unleashed');

      const result = await unleashedIntegration.getInventoryData({
        pageSize: 100, // Reduced page size to avoid timeouts
        maxPages: 20   // Allow more pages if needed
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const inventory = result.data.inventory || [];

      // Use transaction for bulk upsert with increased timeout
      await prisma.$transaction(async (tx) => {
        for (const item of inventory) {
          await tx.inventory.upsert({
            where: {
              sku: item.sku
            },
            update: {
              productName: item.productName,
              quantity: item.quantityOnHand,
              quantityAllocated: item.quantityAllocated,
              quantityAvailable: item.quantityAvailable,
              warehouse: item.warehouse,
              location: item.binLocation || item.warehouseName,
              unitCost: item.averageCost,
              totalValue: item.totalValue,
              lastModified: this.safeParseDate(item.lastModified),
              updatedAt: new Date()
            },
            create: {
              sku: item.sku,
              productName: item.productName,
              quantity: item.quantityOnHand,
              quantityAllocated: item.quantityAllocated,
              quantityAvailable: item.quantityAvailable,
              warehouse: item.warehouse,
              location: item.binLocation || item.warehouseName,
              unitCost: item.averageCost,
              totalValue: item.totalValue,
              reorderPoint: 0, // Will be calculated based on movement history
              reorderQuantity: 0,
              lastModified: this.safeParseDate(item.lastModified)
            }
          });
        }
      }, {
        timeout: 30000, // 30 seconds timeout
        maxWait: 5000 // 5 seconds max wait
      });

      this.syncStats.itemsSynced += inventory.length;

      logInfo(`Synced ${inventory.length} inventory items`, {
        totals: result.data.totals
      });

      // Broadcast inventory update
      this.broadcastInventoryUpdate(result.data);
    } catch (error) {
      logError('Failed to sync stock on hand', error);
      this.syncStats.errors.push(`Stock sync: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync purchase orders from Unleashed
   */
  async syncPurchaseOrders() {
    try {
      logInfo('Syncing purchase orders from Unleashed');

      const result = await unleashedIntegration.getPurchaseOrders({
        pageSize: 200,
        status: 'Open'
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const purchaseOrders = result.data.purchaseOrders || [];

      // Store purchase orders in database with increased timeout
      await prisma.$transaction(async (tx) => {
        for (const po of purchaseOrders) {
          // Ensure supplierId is always provided
          const supplierId = po.supplierCode || po.supplierId || `SUPPLIER_${po.orderNumber}`;
          const supplierName = po.supplier || po.supplierName || 'Unknown Supplier';

          await tx.purchaseOrder.upsert({
            where: {
              orderNumber: po.orderNumber
            },
            update: {
              supplierId: supplierId,
              supplierName: supplierName,
              orderDate: this.safeParseDate(po.orderDate),
              deliveryDate: this.safeParseDate(po.requiredDate, null),
              status: (po.status || 'pending').toLowerCase(),
              items: po.lines || [],
              subtotal: po.subTotal || 0,
              tax: po.tax || 0,
              shipping: po.freight || 0,
              totalAmount: po.total || 0,
              currency: po.currency || 'USD',
              paymentTerms: po.paymentTerms || null,
              notes: po.comments || null,
              approvedBy: po.approvedBy || null,
              approvedDate: po.approvedDate ? this.safeParseDate(po.approvedDate, null) : null,
              updatedAt: new Date()
            },
            create: {
              orderNumber: po.orderNumber,
              supplierId: supplierId,
              supplierName: supplierName,
              orderDate: this.safeParseDate(po.orderDate),
              deliveryDate: this.safeParseDate(po.requiredDate, null),
              status: (po.status || 'pending').toLowerCase(),
              items: po.lines || [],
              subtotal: po.subTotal || 0,
              tax: po.tax || 0,
              shipping: po.freight || 0,
              totalAmount: po.total || 0,
              currency: po.currency || 'USD',
              paymentTerms: po.paymentTerms || null,
              notes: po.comments || null,
              approvedBy: po.approvedBy || null,
              approvedDate: po.approvedDate ? this.safeParseDate(po.approvedDate, null) : null,
              createdBy: po.createdBy || 'unleashed-sync' // Required field
            }
          });
        }
      }, {
        timeout: 30000, // 30 seconds timeout
        maxWait: 5000 // 5 seconds max wait
      });

      logInfo(`Synced ${purchaseOrders.length} purchase orders`, {
        summary: result.data.summary
      });
    } catch (error) {
      logError('Failed to sync purchase orders', error);
      this.syncStats.errors.push(`PO sync: ${error.message}`);
    }
  }

  /**
   * Sync sales orders from Unleashed
   */
  async syncSalesOrders() {
    try {
      logInfo('Syncing sales orders from Unleashed');

      const result = await unleashedIntegration.getSalesOrders({
        pageSize: 200,
        status: 'Open'
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const salesOrders = result.data.salesOrders || [];

      // Since SalesOrder model doesn't exist yet, log the data for now
      logInfo(`Retrieved ${salesOrders.length} sales orders from Unleashed`, {
        summary: result.data.summary
      });

      // TODO: Add SalesOrder model to Prisma schema and implement syncing
      // For now, skip database sync to prevent errors

      /*
      // Store sales orders in database with increased timeout
      await prisma.$transaction(async (tx) => {
        for (const so of salesOrders) {
          await tx.salesOrder.upsert({
            where: {
              orderNumber: so.orderNumber
            },
            update: {
              customer: so.customer,
              customerCode: so.customerCode,
              orderDate: this.safeParseDate(so.orderDate),
              requiredDate: this.safeParseDate(so.requiredDate, null),
              status: so.status,
              subTotal: so.subTotal,
              tax: so.tax,
              total: so.total,
              currency: so.currency,
              data: so, // Store complete order data as JSON
              updatedAt: new Date()
            },
            create: {
              orderNumber: so.orderNumber,
              customer: so.customer,
              customerCode: so.customerCode,
              orderDate: this.safeParseDate(so.orderDate),
              requiredDate: this.safeParseDate(so.requiredDate, null),
              status: so.status,
              subTotal: so.subTotal,
              tax: so.tax,
              total: so.total,
              currency: so.currency,
              data: so
            }
          });
        }
      }, {
        timeout: 30000, // 30 seconds timeout
        maxWait: 5000 // 5 seconds max wait
      });
      */
    } catch (error) {
      logError('Failed to sync sales orders', error);
      this.syncStats.errors.push(`SO sync: ${error.message}`);
    }
  }

  /**
   * Sync stock movements from Unleashed
   */
  async syncStockMovements() {
    try {
      logInfo('Syncing stock movements from Unleashed');

      const result = await unleashedIntegration.getStockMovements({
        pageSize: 100  // Reduced page size to avoid timeouts
      });

      if (!result.success) {
        // Handle 403 Forbidden - likely due to API permission restrictions
        if (result.error && result.error.includes('403')) {
          logWarn('Stock movements API returned 403 Forbidden - skipping sync', {
            error: result.error,
            note: 'This endpoint may require additional permissions in Unleashed'
          });
          return; // Skip stock movements sync
        }
        throw new Error(result.error);
      }

      const movements = result.data.stockMovements || [];

      // Store stock movements in database with increased timeout
      await prisma.$transaction(async (tx) => {
        for (const movement of movements) {
          const movementId = `${movement.productCode}_${movement.completedDate}_${movement.quantity}`;

          await tx.stockMovement.upsert({
            where: {
              movementId
            },
            update: {
              quantity: movement.quantity,
              unitCost: movement.unitCost,
              totalCost: movement.totalCost,
              reference: movement.reference,
              orderNumber: movement.orderNumber,
              reason: movement.reason,
              customerSupplier: movement.customerSupplier,
              updatedAt: new Date()
            },
            create: {
              movementId,
              productCode: movement.productCode,
              productName: movement.productName,
              warehouse: movement.warehouse,
              movementType: movement.movementType,
              quantity: movement.quantity,
              unitCost: movement.unitCost,
              totalCost: movement.totalCost,
              reference: movement.reference,
              orderNumber: movement.orderNumber,
              completedDate: this.safeParseDate(movement.completedDate),
              reason: movement.reason,
              customerSupplier: movement.customerSupplier
            }
          });
        }
      }, {
        timeout: 30000, // 30 seconds timeout
        maxWait: 5000 // 5 seconds max wait
      });

      logInfo(`Synced ${movements.length} stock movements`, {
        summary: result.data.summary
      });
    } catch (error) {
      logError('Failed to sync stock movements', error);
      this.syncStats.errors.push(`Movement sync: ${error.message}`);
    }
  }

  /**
   * Calculate inventory metrics based on synced data
   */
  async calculateInventoryMetrics() {
    try {
      logInfo('Calculating inventory metrics');

      // Calculate basic inventory metrics
      const inventoryItems = await prisma.inventory.findMany();

      // Update status based on quantity levels
      for (const item of inventoryItems) {
        let status = 'in-stock';
        const quantity = parseFloat(item.quantity);
        const reorderPoint = item.reorderPoint || 10; // Default reorder point

        if (quantity <= 0) {
          status = 'out-of-stock';
        } else if (quantity <= reorderPoint) {
          status = 'low-stock';
        }

        // Update inventory status
        await prisma.inventory.update({
          where: { sku: item.sku },
          data: {
            status,
            // Set default reorder values if not set
            reorderPoint: item.reorderPoint || reorderPoint,
            reorderQuantity: item.reorderQuantity || (reorderPoint * 3)
          }
        });
      }

      // Calculate summary metrics
      const metrics = await prisma.inventory.aggregate({
        _sum: {
          quantity: true,
          totalValue: true
        },
        _count: true
      });

      const lowStockCount = await prisma.inventory.count({
        where: {
          status: 'low-stock'
        }
      });

      const outOfStockCount = await prisma.inventory.count({
        where: {
          status: 'out-of-stock'
        }
      });

      logInfo('Inventory metrics calculated', {
        totalProducts: metrics._count,
        totalQuantity: metrics._sum.quantity || 0,
        totalValue: metrics._sum.totalValue || 0,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount
      });
    } catch (error) {
      logError('Failed to calculate inventory metrics', error);
      this.syncStats.errors.push(`Metrics calc: ${error.message}`);
    }
  }

  /**
   * Broadcast sync status via WebSocket
   */
  broadcastSyncStatus(status, data) {
    try {
      // Use the imported singleton instance
      if (websocketService && websocketService.inventoryIO) {
        websocketService.inventoryIO.emit('unleashed-sync-status', {
          status,
          ...data
        });
      }
    } catch (error) {
      logError('Failed to broadcast sync status', error);
    }
  }

  /**
   * Broadcast inventory update via WebSocket
   */
  broadcastInventoryUpdate(data) {
    try {
      // Use the imported singleton instance
      if (websocketService && websocketService.inventoryIO) {
        websocketService.inventoryIO.emit('inventory-update', {
          source: 'unleashed',
          ...data
        });
      }
    } catch (error) {
      logError('Failed to broadcast inventory update', error);
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      syncInterval: this.syncInterval,
      stats: this.syncStats,
      cronActive: !!this.cronJob
    };
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync() {
    logInfo('Manual sync triggered');
    return await this.performSync();
  }
}

// Singleton instance
let syncInstance = null;

export function getUnleashedSync() {
  if (!syncInstance) {
    syncInstance = new UnleashedInventorySync();
  }
  return syncInstance;
}

export default UnleashedInventorySync;