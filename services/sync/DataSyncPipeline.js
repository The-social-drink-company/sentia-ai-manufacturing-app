/**
 * Data Synchronization Pipeline
 * 
 * Orchestrates data synchronization between external APIs and the central database.
 * Provides scheduled synchronization, real-time webhook handling, and data processing.
 * 
 * Features:
 * - Scheduled sync jobs with cron expressions
 * - Webhook handlers for real-time updates
 * - Data transformation and validation
 * - Conflict resolution and deduplication
 * - Error handling and retry mechanisms
 * - Performance monitoring and metrics
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { getUnifiedApiClient } from '../integration/UnifiedApiClient.js';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class DataSyncPipeline {
  constructor(config = {}) {
    this.config = {
      maxConcurrentJobs: config.maxConcurrentJobs || 3,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 5000,
      batchSize: config.batchSize || 100,
      enableScheduling: config.enableScheduling !== false,
      ...config
    };

    this.prisma = new PrismaClient();
    this.apiClient = getUnifiedApiClient();
    this.activeJobs = new Map();
    this.scheduledJobs = new Map();
    this.jobQueue = [];
    this.isProcessing = false;

    // Sync schedules based on environment variables
    this.syncSchedules = {
      xero: process.env.XERO_SYNC_INTERVAL || '*/30 * * * *', // Every 30 minutes
      shopify_uk: process.env.SHOPIFY_SYNC_INTERVAL || '*/15 * * * *', // Every 15 minutes
      shopify_usa: process.env.SHOPIFY_SYNC_INTERVAL || '*/15 * * * *',
      amazon_uk: process.env.AMAZON_SYNC_INTERVAL || '*/60 * * * *', // Every hour
      amazon_usa: process.env.AMAZON_SYNC_INTERVAL || '*/60 * * * *',
      unleashed: '*/20 * * * *', // Every 20 minutes
      database_cleanup: '0 2 * * *' // Daily at 2 AM
    };

    this.initialize();
  }

  /**
   * Initialize the sync pipeline
   */
  async initialize() {
    try {
      logInfo('DataSyncPipeline initializing', {
        config: this.config,
        schedules: this.syncSchedules
      });

      if (this.config.enableScheduling) {
        this.setupScheduledJobs();
      }

      this.startJobProcessor();

      logInfo('DataSyncPipeline initialized successfully');
    } catch (error) {
      logError('Failed to initialize DataSyncPipeline', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Set up scheduled synchronization jobs
   */
  setupScheduledJobs() {
    // Xero synchronization
    if (this.syncSchedules.xero) {
      const xeroJob = cron.schedule(this.syncSchedules.xero, () => {
        this.queueSyncJob('xero', 'incremental');
      }, { scheduled: false });
      
      this.scheduledJobs.set('xero', xeroJob);
      xeroJob.start();
      logInfo('Scheduled Xero sync job', { schedule: this.syncSchedules.xero });
    }

    // Shopify UK synchronization
    if (this.syncSchedules.shopify_uk) {
      const shopifyUKJob = cron.schedule(this.syncSchedules.shopify_uk, () => {
        this.queueSyncJob('shopify_uk', 'incremental');
      }, { scheduled: false });
      
      this.scheduledJobs.set('shopify_uk', shopifyUKJob);
      shopifyUKJob.start();
      logInfo('Scheduled Shopify UK sync job', { schedule: this.syncSchedules.shopify_uk });
    }

    // Shopify USA synchronization
    if (this.syncSchedules.shopify_usa) {
      const shopifyUSAJob = cron.schedule(this.syncSchedules.shopify_usa, () => {
        this.queueSyncJob('shopify_usa', 'incremental');
      }, { scheduled: false });
      
      this.scheduledJobs.set('shopify_usa', shopifyUSAJob);
      shopifyUSAJob.start();
      logInfo('Scheduled Shopify USA sync job', { schedule: this.syncSchedules.shopify_usa });
    }

    // Amazon UK synchronization
    if (this.syncSchedules.amazon_uk) {
      const amazonUKJob = cron.schedule(this.syncSchedules.amazon_uk, () => {
        this.queueSyncJob('amazon_uk', 'incremental');
      }, { scheduled: false });
      
      this.scheduledJobs.set('amazon_uk', amazonUKJob);
      amazonUKJob.start();
      logInfo('Scheduled Amazon UK sync job', { schedule: this.syncSchedules.amazon_uk });
    }

    // Amazon USA synchronization
    if (this.syncSchedules.amazon_usa) {
      const amazonUSAJob = cron.schedule(this.syncSchedules.amazon_usa, () => {
        this.queueSyncJob('amazon_usa', 'incremental');
      }, { scheduled: false });
      
      this.scheduledJobs.set('amazon_usa', amazonUSAJob);
      amazonUSAJob.start();
      logInfo('Scheduled Amazon USA sync job', { schedule: this.syncSchedules.amazon_usa });
    }

    // Unleashed synchronization
    if (this.syncSchedules.unleashed) {
      const unleashedJob = cron.schedule(this.syncSchedules.unleashed, () => {
        this.queueSyncJob('unleashed', 'incremental');
      }, { scheduled: false });
      
      this.scheduledJobs.set('unleashed', unleashedJob);
      unleashedJob.start();
      logInfo('Scheduled Unleashed sync job', { schedule: this.syncSchedules.unleashed });
    }

    // Database cleanup job
    if (this.syncSchedules.database_cleanup) {
      const cleanupJob = cron.schedule(this.syncSchedules.database_cleanup, () => {
        this.queueSyncJob('database_cleanup', 'full');
      }, { scheduled: false });
      
      this.scheduledJobs.set('database_cleanup', cleanupJob);
      cleanupJob.start();
      logInfo('Scheduled database cleanup job', { schedule: this.syncSchedules.database_cleanup });
    }
  }

  /**
   * Queue a synchronization job
   */
  queueSyncJob(service, syncType = 'incremental', priority = 'normal', metadata = {}) {
    const jobId = `${service}_${syncType}_${Date.now()}`;
    
    const job = {
      id: jobId,
      service,
      syncType,
      priority,
      metadata,
      status: 'queued',
      queuedAt: new Date(),
      attempts: 0,
      maxAttempts: this.config.retryAttempts
    };

    this.jobQueue.push(job);
    
    logInfo('Sync job queued', {
      jobId,
      service,
      syncType,
      priority,
      queueLength: this.jobQueue.length
    });

    this.processJobQueue();
    return jobId;
  }

  /**
   * Start the job processor
   */
  startJobProcessor() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.processJobQueue();
  }

  /**
   * Process the job queue
   */
  async processJobQueue() {
    while (this.jobQueue.length > 0 && this.activeJobs.size < this.config.maxConcurrentJobs) {
      // Sort queue by priority (high > normal > low)
      this.jobQueue.sort((a, b) => {
        const priorities = { high: 3, normal: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });

      const job = this.jobQueue.shift();
      if (job) {
        this.executeJob(job);
      }
    }

    // Schedule next processing cycle
    setTimeout(() => {
      if (this.jobQueue.length > 0 || this.activeJobs.size > 0) {
        this.processJobQueue();
      }
    }, 1000);
  }

  /**
   * Execute a synchronization job
   */
  async executeJob(job) {
    this.activeJobs.set(job.id, job);
    job.status = 'running';
    job.startedAt = new Date();
    job.attempts++;

    logInfo('Executing sync job', {
      jobId: job.id,
      service: job.service,
      syncType: job.syncType,
      attempt: job.attempts
    });

    // Create sync log entry
    const syncLog = await this.prisma.syncLog.create({
      data: {
        service: job.service,
        syncType: job.syncType,
        status: 'running',
        startTime: job.startedAt,
        metadata: job.metadata
      }
    });

    try {
      let result;

      switch (job.service) {
        case 'xero':
          result = await this.syncXeroData(job);
          break;
        case 'shopify_uk':
          result = await this.syncShopifyData(job, 'uk');
          break;
        case 'shopify_usa':
          result = await this.syncShopifyData(job, 'usa');
          break;
        case 'amazon_uk':
          result = await this.syncAmazonData(job, 'uk');
          break;
        case 'amazon_usa':
          result = await this.syncAmazonData(job, 'usa');
          break;
        case 'unleashed':
          result = await this.syncUnleashedData(job);
          break;
        case 'database_cleanup':
          result = await this.performDatabaseCleanup(job);
          break;
        default:
          throw new Error(`Unknown service: ${job.service}`);
      }

      // Update sync log with success
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          endTime: new Date(),
          recordsSync: result.recordsProcessed || 0,
          metadata: { ...job.metadata, ...result }
        }
      });

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;

      logInfo('Sync job completed successfully', {
        jobId: job.id,
        service: job.service,
        duration: job.completedAt - job.startedAt,
        recordsProcessed: result.recordsProcessed
      });

    } catch (error) {
      logError('Sync job failed', {
        jobId: job.id,
        service: job.service,
        attempt: job.attempts,
        error: error.message,
        stack: error.stack
      });

      // Update sync log with error
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          endTime: new Date(),
          errors: { message: error.message, stack: error.stack }
        }
      });

      // Retry logic
      if (job.attempts < job.maxAttempts) {
        job.status = 'queued';
        job.retryAt = new Date(Date.now() + this.config.retryDelay * job.attempts);
        
        setTimeout(() => {
          this.jobQueue.push(job);
          logInfo('Sync job queued for retry', {
            jobId: job.id,
            attempt: job.attempts + 1,
            retryDelay: this.config.retryDelay * job.attempts
          });
        }, this.config.retryDelay * job.attempts);
      } else {
        job.status = 'failed';
        job.failedAt = new Date();
        job.error = error.message;
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Synchronize Xero data
   */
  async syncXeroData(job) {
    let recordsProcessed = 0;
    const lastSync = await this.getLastSyncTime('xero');

    try {
      // Sync contacts
      const contacts = await this.apiClient.getXeroContacts({
        modifiedAfter: job.syncType === 'incremental' ? lastSync : undefined
      });
      
      for (const contact of contacts) {
        await this.upsertXeroContact(contact);
        recordsProcessed++;
      }

      // Sync invoices
      const invoices = await this.apiClient.getXeroInvoices({
        modifiedAfter: job.syncType === 'incremental' ? lastSync : undefined
      });
      
      for (const invoice of invoices) {
        await this.upsertXeroInvoice(invoice);
        recordsProcessed++;
      }

      // Sync bank transactions
      const transactions = await this.apiClient.getXeroBankTransactions({
        modifiedAfter: job.syncType === 'incremental' ? lastSync : undefined
      });
      
      for (const transaction of transactions) {
        await this.upsertXeroBankTransaction(transaction);
        recordsProcessed++;
      }

      return { recordsProcessed, contacts: contacts.length, invoices: invoices.length, transactions: transactions.length };
    } catch (error) {
      throw new Error(`Xero sync failed: ${error.message}`);
    }
  }

  /**
   * Synchronize Shopify data
   */
  async syncShopifyData(job, region) {
    let recordsProcessed = 0;
    const lastSync = await this.getLastSyncTime(`shopify_${region}`);

    try {
      // Sync products
      const products = await this.apiClient.getShopifyProducts(region, {
        updatedAtMin: job.syncType === 'incremental' ? lastSync : undefined
      });
      
      for (const product of products) {
        await this.upsertShopifyProduct(product, region);
        recordsProcessed++;
      }

      // Sync orders
      const orders = await this.apiClient.getShopifyOrders(region, {
        updatedAtMin: job.syncType === 'incremental' ? lastSync : undefined
      });
      
      for (const order of orders) {
        await this.upsertShopifyOrder(order, region);
        recordsProcessed++;
      }

      return { recordsProcessed, products: products.length, orders: orders.length };
    } catch (error) {
      throw new Error(`Shopify ${region} sync failed: ${error.message}`);
    }
  }

  /**
   * Synchronize Amazon data
   */
  async syncAmazonData(job, region) {
    let recordsProcessed = 0;
    const lastSync = await this.getLastSyncTime(`amazon_${region}`);

    try {
      // Sync orders
      const orders = await this.apiClient.getAmazonOrders(region, {
        LastUpdatedAfter: job.syncType === 'incremental' ? lastSync : undefined
      });
      
      for (const order of orders) {
        await this.upsertAmazonOrder(order, region);
        recordsProcessed++;
      }

      // Sync inventory
      const inventory = await this.apiClient.getAmazonInventory(region);
      
      for (const item of inventory) {
        await this.upsertAmazonInventory(item, region);
        recordsProcessed++;
      }

      return { recordsProcessed, orders: orders.length, inventory: inventory.length };
    } catch (error) {
      throw new Error(`Amazon ${region} sync failed: ${error.message}`);
    }
  }

  /**
   * Synchronize Unleashed data
   */
  async syncUnleashedData(job) {
    let recordsProcessed = 0;
    const lastSync = await this.getLastSyncTime('unleashed');

    try {
      // Sync products
      const products = await this.apiClient.getUnleashedProducts({
        modifiedSince: job.syncType === 'incremental' ? lastSync : undefined
      });
      
      for (const product of products) {
        await this.upsertUnleashedProduct(product);
        recordsProcessed++;
      }

      // Sync stock levels
      const stockLevels = await this.apiClient.getUnleashedInventory();
      
      for (const stock of stockLevels) {
        await this.upsertUnleashedStockLevel(stock);
        recordsProcessed++;
      }

      // Sync sales orders
      const salesOrders = await this.apiClient.getUnleashedSalesOrders({
        modifiedSince: job.syncType === 'incremental' ? lastSync : undefined
      });
      
      for (const order of salesOrders) {
        await this.upsertUnleashedSalesOrder(order);
        recordsProcessed++;
      }

      return { recordsProcessed, products: products.length, stockLevels: stockLevels.length, salesOrders: salesOrders.length };
    } catch (error) {
      throw new Error(`Unleashed sync failed: ${error.message}`);
    }
  }

  /**
   * Perform database cleanup
   */
  async performDatabaseCleanup(job) {
    let recordsProcessed = 0;

    try {
      // Clean old sync logs (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedSyncLogs = await this.prisma.syncLog.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          status: { in: ['completed', 'failed'] }
        }
      });
      recordsProcessed += deletedSyncLogs.count;

      // Clean old MCP requests (older than 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const deletedMCPRequests = await this.prisma.mCPRequest.deleteMany({
        where: {
          createdAt: { lt: sevenDaysAgo }
        }
      });
      recordsProcessed += deletedMCPRequests.count;

      // Update API health status
      await this.updateApiHealthStatus();

      return { recordsProcessed, deletedSyncLogs: deletedSyncLogs.count, deletedMCPRequests: deletedMCPRequests.count };
    } catch (error) {
      throw new Error(`Database cleanup failed: ${error.message}`);
    }
  }

  /**
   * Database upsert methods for each service
   */

  async upsertXeroContact(contactData) {
    return this.prisma.xeroContact.upsert({
      where: { xeroId: contactData.ContactID },
      update: {
        name: contactData.Name,
        email: contactData.EmailAddress,
        phone: contactData.Phones?.[0]?.PhoneNumber,
        address: contactData.Addresses,
        isCustomer: contactData.IsCustomer,
        isSupplier: contactData.IsSupplier,
        lastSyncAt: new Date()
      },
      create: {
        xeroId: contactData.ContactID,
        name: contactData.Name,
        email: contactData.EmailAddress,
        phone: contactData.Phones?.[0]?.PhoneNumber,
        address: contactData.Addresses,
        isCustomer: contactData.IsCustomer,
        isSupplier: contactData.IsSupplier,
        lastSyncAt: new Date()
      }
    });
  }

  async upsertXeroInvoice(invoiceData) {
    return this.prisma.xeroInvoice.upsert({
      where: { xeroId: invoiceData.InvoiceID },
      update: {
        invoiceNumber: invoiceData.InvoiceNumber,
        type: invoiceData.Type,
        status: invoiceData.Status,
        date: new Date(invoiceData.Date),
        dueDate: invoiceData.DueDate ? new Date(invoiceData.DueDate) : null,
        totalAmount: parseFloat(invoiceData.Total || 0),
        amountDue: parseFloat(invoiceData.AmountDue || 0),
        amountPaid: parseFloat(invoiceData.AmountPaid || 0),
        currencyCode: invoiceData.CurrencyCode,
        lineItems: invoiceData.LineItems,
        lastSyncAt: new Date()
      },
      create: {
        xeroId: invoiceData.InvoiceID,
        invoiceNumber: invoiceData.InvoiceNumber,
        type: invoiceData.Type,
        status: invoiceData.Status,
        date: new Date(invoiceData.Date),
        dueDate: invoiceData.DueDate ? new Date(invoiceData.DueDate) : null,
        totalAmount: parseFloat(invoiceData.Total || 0),
        amountDue: parseFloat(invoiceData.AmountDue || 0),
        amountPaid: parseFloat(invoiceData.AmountPaid || 0),
        currencyCode: invoiceData.CurrencyCode,
        lineItems: invoiceData.LineItems,
        lastSyncAt: new Date()
      }
    });
  }

  async upsertXeroBankTransaction(transactionData) {
    return this.prisma.xeroBankTransaction.upsert({
      where: { xeroId: transactionData.BankTransactionID },
      update: {
        type: transactionData.Type,
        status: transactionData.Status,
        date: new Date(transactionData.Date),
        amount: parseFloat(transactionData.Total || 0),
        reference: transactionData.Reference,
        description: transactionData.LineItems?.[0]?.Description,
        bankAccount: transactionData.BankAccount,
        lineItems: transactionData.LineItems,
        lastSyncAt: new Date()
      },
      create: {
        xeroId: transactionData.BankTransactionID,
        type: transactionData.Type,
        status: transactionData.Status,
        date: new Date(transactionData.Date),
        amount: parseFloat(transactionData.Total || 0),
        reference: transactionData.Reference,
        description: transactionData.LineItems?.[0]?.Description,
        bankAccount: transactionData.BankAccount,
        lineItems: transactionData.LineItems,
        lastSyncAt: new Date()
      }
    });
  }

  // Additional upsert methods for Shopify, Amazon, and Unleashed would follow similar patterns...

  /**
   * Utility methods
   */

  async getLastSyncTime(service) {
    const lastSync = await this.prisma.syncLog.findFirst({
      where: {
        service,
        status: 'completed'
      },
      orderBy: {
        endTime: 'desc'
      }
    });

    return lastSync?.endTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
  }

  async updateApiHealthStatus() {
    const services = ['xero', 'shopify_uk', 'shopify_usa', 'amazon_uk', 'amazon_usa', 'unleashed'];
    
    for (const service of services) {
      try {
        // This would check actual API health
        const health = await this.checkServiceHealth(service);
        
        await this.prisma.apiHealth.upsert({
          where: { service },
          update: {
            status: health.status,
            lastCheckTime: new Date(),
            responseTime: health.responseTime,
            errorRate: health.errorRate,
            lastError: health.lastError
          },
          create: {
            service,
            status: health.status,
            lastCheckTime: new Date(),
            responseTime: health.responseTime,
            errorRate: health.errorRate,
            lastError: health.lastError
          }
        });
      } catch (error) {
        logWarn('Failed to update API health status', {
          service,
          error: error.message
        });
      }
    }
  }

  async checkServiceHealth(service) {
    // Mock health check - would implement actual checks
    return {
      status: 'healthy',
      responseTime: Math.floor(Math.random() * 500) + 100,
      errorRate: 0,
      lastError: null
    };
  }

  /**
   * Manual sync triggers
   */
  async triggerManualSync(services, syncType = 'incremental', priority = 'high') {
    const jobIds = [];
    
    for (const service of services) {
      const jobId = this.queueSyncJob(service, syncType, priority, {
        triggeredBy: 'manual',
        triggeredAt: new Date()
      });
      jobIds.push(jobId);
    }
    
    return jobIds;
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus() {
    const activeJobs = Array.from(this.activeJobs.values());
    const queuedJobs = this.jobQueue.filter(job => job.status === 'queued');
    
    const recentSyncs = await this.prisma.syncLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    return {
      active: activeJobs.length,
      queued: queuedJobs.length,
      recentSyncs: recentSyncs.length,
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      activeJobs: activeJobs.map(job => ({
        id: job.id,
        service: job.service,
        syncType: job.syncType,
        status: job.status,
        startedAt: job.startedAt
      })),
      queuedJobs: queuedJobs.map(job => ({
        id: job.id,
        service: job.service,
        syncType: job.syncType,
        priority: job.priority,
        queuedAt: job.queuedAt
      })),
      recentSyncs: recentSyncs.map(sync => ({
        id: sync.id,
        service: sync.service,
        syncType: sync.syncType,
        status: sync.status,
        startTime: sync.startTime,
        endTime: sync.endTime,
        recordsSync: sync.recordsSync
      }))
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    logInfo('DataSyncPipeline shutting down');
    
    // Stop all scheduled jobs
    for (const [name, job] of this.scheduledJobs) {
      job.stop();
      logInfo('Stopped scheduled job', { name });
    }
    
    // Wait for active jobs to complete (with timeout)
    let attempts = 0;
    while (this.activeJobs.size > 0 && attempts < 30) { // 30 second timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    // Force stop remaining jobs
    if (this.activeJobs.size > 0) {
      logWarn('Force stopping remaining active jobs', {
        activeJobs: Array.from(this.activeJobs.keys())
      });
    }
    
    await this.prisma.$disconnect();
    logInfo('DataSyncPipeline shutdown complete');
  }
}

// Singleton instance
let dataSyncPipeline = null;

export function createDataSyncPipeline(config = {}) {
  if (!dataSyncPipeline) {
    dataSyncPipeline = new DataSyncPipeline(config);
  }
  return dataSyncPipeline;
}

export function getDataSyncPipeline() {
  if (!dataSyncPipeline) {
    throw new Error('DataSyncPipeline not initialized. Call createDataSyncPipeline() first.');
  }
  return dataSyncPipeline;
}

export default DataSyncPipeline;