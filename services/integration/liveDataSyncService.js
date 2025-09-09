import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';
import xeroService from '../xeroService.js';
import amazonSPAPIService from '../amazon-sp-api.js';
import shopifyMultiStoreService from '../shopify-multistore.js';

export class LiveDataSyncService {
  constructor(databaseService) {
    this.databaseService = databaseService;
    this.syncInterval = null;
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncFrequency = 15 * 60 * 1000; // 15 minutes default
    this.services = {
      xero: xeroService,
      amazon: amazonSPAPIService,
      shopify: shopifyMultiStoreService
    };
    this.syncStatus = {
      xero: { status: 'not_connected', lastSync: null, error: null },
      amazon: { status: 'not_connected', lastSync: null, error: null },
      shopify: { status: 'not_connected', lastSync: null, error: null }
    };
  }

  async initialize() {
    try {
      logInfo('Initializing Live Data Sync Service');
      
      // Test all service connections
      await this.testAllConnections();
      
      logInfo('Live Data Sync Service initialized', { 
        connectedServices: Object.entries(this.syncStatus)
          .filter(([_, status]) => status.status === 'connected')
          .map(([service, _]) => service)
      });
      
      return true;
    } catch (error) {
      logError('Failed to initialize Live Data Sync Service', error);
      return false;
    }
  }

  async testAllConnections() {
    // Test Xero connection
    try {
      if (this.services.xero && this.services.xero.isConnected) {
        await this.services.xero.getOrganizationInfo();
        this.syncStatus.xero = { status: 'connected', lastSync: null, error: null };
        logInfo('Xero service connected successfully');
      } else {
        this.syncStatus.xero = { status: 'not_configured', lastSync: null, error: 'Service not configured' };
        // Xero service not configured - using mock data
      }
    } catch (error) {
      this.syncStatus.xero = { status: 'error', lastSync: null, error: error.message };
      logWarn('Xero connection test failed', error);
    }

    // Test Amazon SP-API connection
    try {
      if (this.services.amazon && this.services.amazon.isConnected) {
        await this.services.amazon.testConnection();
        this.syncStatus.amazon = { status: 'connected', lastSync: null, error: null };
        logInfo('Amazon SP-API connected successfully');
      } else {
        await this.services.amazon.initialize();
        this.syncStatus.amazon = { status: 'connected', lastSync: null, error: null };
        logInfo('Amazon SP-API initialized and connected');
      }
    } catch (error) {
      this.syncStatus.amazon = { status: 'error', lastSync: null, error: error.message };
      // Amazon SP-API using mock data - no connection required
    }

    // Test Shopify connection
    try {
      const shopifyData = await this.services.shopify.getConsolidatedData();
      if (shopifyData && !shopifyData.error) {
        this.syncStatus.shopify = { status: 'connected', lastSync: null, error: null };
        logInfo('Shopify Multi-Store connected successfully');
      } else {
        this.syncStatus.shopify = { status: 'error', lastSync: null, error: shopifyData.error || 'Unknown error' };
        // Shopify using mock data - no connection required
      }
    } catch (error) {
      this.syncStatus.shopify = { status: 'error', lastSync: null, error: error.message };
      // Shopify using mock data - no connection required
    }
  }

  async startPeriodicSync(frequency = this.syncFrequency) {
    if (this.isRunning) {
      logWarn('Live data sync already running');
      return;
    }

    this.syncFrequency = frequency;
    this.isRunning = true;
    
    logInfo('Starting periodic live data sync', { frequency: frequency / 1000 + 's' });
    
    // Initial sync
    await this.performFullSync();
    
    // Set up periodic sync
    this.syncInterval = setInterval(async () => {
      await this.performFullSync();
    }, this.syncFrequency);
  }

  async stopPeriodicSync() {
    if (!this.isRunning) return;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.isRunning = false;
    logInfo('Stopped periodic live data sync');
  }

  async performFullSync() {
    const syncStartTime = new Date();
    logInfo('Starting full live data sync');

    const results = {
      xero: null,
      amazon: null,
      shopify: null,
      success: false,
      errors: []
    };

    // Sync Xero financial data
    if (this.syncStatus.xero.status === 'connected') {
      try {
        results.xero = await this.syncXeroData();
        this.syncStatus.xero.lastSync = new Date();
        this.syncStatus.xero.error = null;
      } catch (error) {
        this.syncStatus.xero.status = 'error';
        this.syncStatus.xero.error = error.message;
        results.errors.push(`Xero sync failed: ${error.message}`);
        logError('Xero data sync failed', error);
      }
    }

    // Sync Amazon SP-API data
    if (this.syncStatus.amazon.status === 'connected') {
      try {
        results.amazon = await this.syncAmazonData();
        this.syncStatus.amazon.lastSync = new Date();
        this.syncStatus.amazon.error = null;
      } catch (error) {
        this.syncStatus.amazon.status = 'error';
        this.syncStatus.amazon.error = error.message;
        results.errors.push(`Amazon sync failed: ${error.message}`);
        logError('Amazon data sync failed', error);
      }
    }

    // Sync Shopify data
    if (this.syncStatus.shopify.status === 'connected') {
      try {
        results.shopify = await this.syncShopifyData();
        this.syncStatus.shopify.lastSync = new Date();
        this.syncStatus.shopify.error = null;
      } catch (error) {
        this.syncStatus.shopify.status = 'error';
        this.syncStatus.shopify.error = error.message;
        results.errors.push(`Shopify sync failed: ${error.message}`);
        logError('Shopify data sync failed', error);
      }
    }

    const syncDuration = Date.now() - syncStartTime.getTime();
    results.success = results.errors.length === 0;
    this.lastSyncTime = syncStartTime;

    logInfo('Full live data sync completed', {
      duration: syncDuration + 'ms',
      success: results.success,
      errors: results.errors.length,
      syncedServices: Object.keys(results).filter(key => key !== 'success' && key !== 'errors' && results[key])
    });

    return results;
  }

  async syncXeroData() {
    if (!this.databaseService.isConnected) {
      logWarn('Database not connected, skipping Xero data sync');
      return null;
    }

    logInfo('Starting Xero financial data sync');

    // Get financial data from Xero
    const [balanceSheet, profitLoss, bankTransactions, invoices] = await Promise.all([
      this.services.xero.getBalanceSheet().catch(err => ({ error: err.message })),
      this.services.xero.getProfitLoss().catch(err => ({ error: err.message })),
      this.services.xero.getBankTransactions().catch(err => ({ error: err.message })),
      this.services.xero.getInvoices().catch(err => ({ error: err.message }))
    ]);

    const syncResults = {
      balanceSheetRecords: 0,
      profitLossRecords: 0,
      bankTransactionRecords: 0,
      invoiceRecords: 0,
      errors: []
    };

    // Sync Accounts Receivable data
    if (invoices && !invoices.error && invoices.invoices) {
      const arData = invoices.invoices
        .filter(inv => inv.type === 'ACCREC' && inv.status === 'AUTHORISED')
        .map(invoice => ({
          id: invoice.invoiceID,
          companyId: 'default', // Use actual company ID from context
          customerName: invoice.contact?.name || 'Unknown',
          amount: invoice.total || 0,
          currency: invoice.currencyCode || 'GBP',
          issueDate: new Date(invoice.date),
          dueDate: new Date(invoice.dueDate),
          status: invoice.status,
          description: invoice.reference || invoice.invoiceNumber
        }));

      // Upsert AR records
      for (const ar of arData) {
        try {
          await this.databaseService.prisma.accountsReceivable.upsert({
            where: { id: ar.id },
            update: ar,
            create: ar
          });
          syncResults.invoiceRecords++;
        } catch (error) {
          syncResults.errors.push(`AR record ${ar.id}: ${error.message}`);
        }
      }
    }

    // Sync Cash Flow data
    if (bankTransactions && !bankTransactions.error && bankTransactions.bankTransactions) {
      const cashFlowData = bankTransactions.bankTransactions.map(transaction => ({
        id: transaction.bankTransactionID,
        companyId: 'default',
        date: new Date(transaction.date),
        amount: transaction.total || 0,
        currency: transaction.currencyCode || 'GBP',
        type: transaction.type === 'RECEIVE' ? 'REVENUE' : 'EXPENSE',
        category: transaction.lineItems?.[0]?.accountCode || 'GENERAL',
        description: transaction.reference || transaction.particulars,
        source: 'xero'
      }));

      // Upsert cash flow records
      for (const cf of cashFlowData) {
        try {
          await this.databaseService.prisma.cashFlow.upsert({
            where: { id: cf.id },
            update: cf,
            create: cf
          });
          syncResults.bankTransactionRecords++;
        } catch (error) {
          syncResults.errors.push(`Cash flow record ${cf.id}: ${error.message}`);
        }
      }
    }

    logInfo('Xero data sync completed', syncResults);
    return syncResults;
  }

  async syncAmazonData() {
    if (!this.databaseService.isConnected) {
      logWarn('Database not connected, skipping Amazon data sync');
      return null;
    }

    logInfo('Starting Amazon SP-API data sync');

    const syncResults = {
      ordersRecords: 0,
      inventoryRecords: 0,
      errors: []
    };

    try {
      // Get Amazon orders from last 30 days
      const orders = await this.services.amazon.getOrders(30);
      
      if (orders && orders.length > 0) {
        for (const order of orders) {
          try {
            // Convert Amazon order to historical sale record
            const saleRecord = {
              id: order.AmazonOrderId,
              companyId: 'default',
              productId: 'amazon-aggregate', // TODO: Map to specific products
              date: new Date(order.PurchaseDate),
              quantity: order.NumberOfItemsShipped || 1,
              revenue: parseFloat(order.OrderTotal?.Amount || 0),
              currency: order.OrderTotal?.CurrencyCode || 'GBP',
              channel: 'amazon',
              customerLocation: order.ShipToAddress?.CountryCode || 'Unknown',
              source: 'amazon-sp-api'
            };

            await this.databaseService.prisma.historicalSale.upsert({
              where: { id: saleRecord.id },
              update: saleRecord,
              create: saleRecord
            });
            
            syncResults.ordersRecords++;
          } catch (error) {
            syncResults.errors.push(`Amazon order ${order.AmazonOrderId}: ${error.message}`);
          }
        }
      }

      // Get inventory data if available
      const inventory = await this.services.amazon.getInventorySummaries();
      
      if (inventory && inventory.length > 0) {
        for (const item of inventory) {
          try {
            const inventoryRecord = {
              id: `amazon-${item.asin}`,
              companyId: 'default',
              productId: item.asin,
              location: 'Amazon FBA',
              currentStock: item.totalQuantity || 0,
              availableStock: item.sellableQuantity || 0,
              reservedStock: (item.totalQuantity || 0) - (item.sellableQuantity || 0),
              value: 0, // TODO: Calculate based on cost
              currency: 'GBP',
              source: 'amazon-sp-api'
            };

            await this.databaseService.prisma.inventoryLevel.upsert({
              where: { id: inventoryRecord.id },
              update: inventoryRecord,
              create: inventoryRecord
            });
            
            syncResults.inventoryRecords++;
          } catch (error) {
            syncResults.errors.push(`Amazon inventory ${item.asin}: ${error.message}`);
          }
        }
      }

    } catch (error) {
      syncResults.errors.push(`Amazon API error: ${error.message}`);
    }

    logInfo('Amazon data sync completed', syncResults);
    return syncResults;
  }

  async syncShopifyData() {
    if (!this.databaseService.isConnected) {
      logWarn('Database not connected, skipping Shopify data sync');
      return null;
    }

    logInfo('Starting Shopify multi-store data sync');

    const syncResults = {
      storeRecords: 0,
      orderRecords: 0,
      customerRecords: 0,
      errors: []
    };

    try {
      const consolidatedData = await this.services.shopify.getConsolidatedData();
      
      if (consolidatedData && !consolidatedData.error && consolidatedData.stores) {
        for (const store of consolidatedData.stores) {
          try {
            // Sync store orders as historical sales
            if (store.recentOrders) {
              for (const order of store.recentOrders) {
                const saleRecord = {
                  id: `${store.id}-${order.id}`,
                  companyId: 'default',
                  productId: 'shopify-aggregate', // TODO: Map to specific products
                  date: new Date(order.created_at),
                  quantity: order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 1,
                  revenue: parseFloat(order.total_price || 0),
                  currency: order.currency || store.currency,
                  channel: `shopify-${store.region}`,
                  customerLocation: order.billing_address?.country || 'Unknown',
                  source: 'shopify-api'
                };

                await this.databaseService.prisma.historicalSale.upsert({
                  where: { id: saleRecord.id },
                  update: saleRecord,
                  create: saleRecord
                });
                
                syncResults.orderRecords++;
              }
            }

            syncResults.storeRecords++;
          } catch (error) {
            syncResults.errors.push(`Shopify store ${store.id}: ${error.message}`);
          }
        }
      }

    } catch (error) {
      syncResults.errors.push(`Shopify API error: ${error.message}`);
    }

    logInfo('Shopify data sync completed', syncResults);
    return syncResults;
  }

  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      syncFrequency: this.syncFrequency,
      services: this.syncStatus,
      connectedServices: Object.entries(this.syncStatus)
        .filter(([_, status]) => status.status === 'connected')
        .length
    };
  }

  async forceSyncService(serviceName) {
    if (!['xero', 'amazon', 'shopify'].includes(serviceName)) {
      throw new Error('Invalid service name');
    }

    logInfo(`Forcing sync for ${serviceName} service`);
    
    switch (serviceName) {
      case 'xero':
        return await this.syncXeroData();
      case 'amazon':
        return await this.syncAmazonData();
      case 'shopify':
        return await this.syncShopifyData();
    }
  }

  async reconnectService(serviceName) {
    if (!['xero', 'amazon', 'shopify'].includes(serviceName)) {
      throw new Error('Invalid service name');
    }

    logInfo(`Reconnecting ${serviceName} service`);
    
    switch (serviceName) {
      case 'xero':
        await this.services.xero.authenticate();
        break;
      case 'amazon':
        await this.services.amazon.initialize();
        break;
      case 'shopify':
        // Shopify doesn't need explicit reconnection
        break;
    }

    // Test the reconnection
    await this.testAllConnections();
    return this.syncStatus[serviceName];
  }

  destroy() {
    this.stopPeriodicSync();
    logInfo('Live Data Sync Service destroyed');
  }
}

export default LiveDataSyncService;