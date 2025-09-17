/**
 * Xero Data Synchronization Service
 * Handles automated syncing of financial data from Xero
 */

import cron from 'node-cron';
import prisma from '../../lib/prisma.js';
import { getXeroService } from './XeroClient.js';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';
import WebSocketService from '../websocketService.js';

class XeroSyncService {
  constructor() {
    this.xeroService = getXeroService();
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncInterval = process.env.XERO_SYNC_INTERVAL || '*/30 * * * *'; // Every 30 minutes
    this.cronJob = null;
    this.syncStats = {
      lastSync: null,
      invoicesSynced: 0,
      transactionsSynced: 0,
      errors: [],
      duration: 0
    };
  }

  /**
   * Initialize sync service and start scheduled sync
   */
  async initialize() {
    try {
      // Check if Xero is authenticated
      const isAuth = await this.xeroService.isAuthenticated();

      if (!isAuth) {
        logWarn('Xero sync not initialized - authentication required');
        return false;
      }

      // Start scheduled sync
      this.startScheduledSync();

      // Perform initial sync
      await this.performSync();

      logInfo('Xero sync service initialized', {
        syncInterval: this.syncInterval
      });

      return true;
    } catch (error) {
      logError('Failed to initialize Xero sync', error);
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
      logInfo('Starting scheduled Xero sync');
      await this.performSync();
    });

    logInfo('Scheduled Xero sync started', { schedule: this.syncInterval });
  }

  /**
   * Stop scheduled sync
   */
  stopScheduledSync() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logInfo('Scheduled Xero sync stopped');
    }
  }

  /**
   * Perform full Xero sync
   */
  async performSync() {
    if (this.isRunning) {
      logWarn('Xero sync already in progress, skipping');
      return { success: false, message: 'Sync already in progress' };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logInfo('Starting Xero data sync');

      // Reset sync stats
      this.syncStats = {
        lastSync: new Date(),
        invoicesSynced: 0,
        transactionsSynced: 0,
        errors: [],
        duration: 0
      };

      // Check authentication
      const isAuth = await this.xeroService.isAuthenticated();
      if (!isAuth) {
        throw new Error('Not authenticated with Xero');
      }

      // 1. Sync Invoices
      await this.syncInvoices();

      // 2. Sync Bank Transactions
      await this.syncBankTransactions();

      // 3. Sync Balance Sheet and Working Capital
      await this.syncWorkingCapital();

      // 4. Sync Accounts
      await this.syncAccounts();

      // Update sync stats
      this.syncStats.duration = Date.now() - startTime;
      this.lastSyncTime = new Date();

      // Broadcast sync completion
      this.broadcastSyncStatus('completed', this.syncStats);

      logInfo('Xero sync completed', this.syncStats);

      return {
        success: true,
        stats: this.syncStats
      };
    } catch (error) {
      logError('Xero sync failed', error);

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
   * Sync invoices from Xero
   */
  async syncInvoices() {
    try {
      logInfo('Syncing invoices from Xero');

      // Get modified date for incremental sync
      let lastSync = null;
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
        const lastInvoice = await prisma.invoice.findFirst({
          orderBy: { updatedAt: 'desc' }
        });
        lastSync = lastInvoice?.updatedAt;
      }

      const invoices = await this.xeroService.getInvoices({
        ifModifiedSince: lastSync,
        includeArchived: false
      });

      if (!invoices || invoices.length === 0) {
        logInfo('No invoices to sync');
        return;
      }

      // Store invoices in database (if available)
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
        await prisma.$transaction(async (tx) => {
          for (const invoice of invoices) {
            await tx.invoice.upsert({
              where: {
                xeroId: invoice.invoiceID
              },
              update: {
                invoiceNumber: invoice.invoiceNumber || invoice.invoiceID,
                type: invoice.type,
                status: invoice.status,
                total: invoice.total || 0,
                amountDue: invoice.amountDue || 0,
                amountPaid: invoice.amountPaid || 0,
                contactName: invoice.contact?.name || 'Unknown',
                date: invoice.date ? new Date(invoice.date) : new Date(),
                dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
                currency: invoice.currencyCode || 'USD',
                lineItems: invoice.lineItems || [],
                updatedAt: new Date()
              },
              create: {
                xeroId: invoice.invoiceID,
                invoiceNumber: invoice.invoiceNumber || invoice.invoiceID,
                type: invoice.type,
                status: invoice.status,
                total: invoice.total || 0,
                amountDue: invoice.amountDue || 0,
                amountPaid: invoice.amountPaid || 0,
                contactName: invoice.contact?.name || 'Unknown',
                date: invoice.date ? new Date(invoice.date) : new Date(),
                dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
                currency: invoice.currencyCode || 'USD',
                lineItems: invoice.lineItems || []
              }
            });
          }
        });
      }

      this.syncStats.invoicesSynced = invoices.length;

      logInfo(`Synced ${invoices.length} invoices from Xero`);
    } catch (error) {
      logError('Failed to sync invoices', error);
      this.syncStats.errors.push(`Invoice sync: ${error.message}`);
    }
  }

  /**
   * Sync bank transactions from Xero
   */
  async syncBankTransactions() {
    try {
      logInfo('Syncing bank transactions from Xero');

      const transactions = await this.xeroService.getBankTransactions({
        page: 1
      });

      if (!transactions || transactions.length === 0) {
        logInfo('No bank transactions to sync');
        return;
      }

      // Process transactions for cash flow analysis
      const cashFlowData = this.analyzeCashFlow(transactions);

      // Store in database (if available)
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
        await prisma.cashFlow.createMany({
          data: cashFlowData,
          skipDuplicates: true
        });
      }

      this.syncStats.transactionsSynced = transactions.length;

      logInfo(`Synced ${transactions.length} bank transactions from Xero`);
    } catch (error) {
      logError('Failed to sync bank transactions', error);
      this.syncStats.errors.push(`Transaction sync: ${error.message}`);
    }
  }

  /**
   * Sync working capital from balance sheet
   */
  async syncWorkingCapital() {
    try {
      logInfo('Syncing working capital from Xero');

      const balanceSheet = await this.xeroService.getBalanceSheet(new Date());

      if (!balanceSheet) {
        logWarn('No balance sheet data available');
        return;
      }

      const workingCapitalData = this.xeroService.calculateWorkingCapital(balanceSheet);

      if (!workingCapitalData) {
        logWarn('Could not calculate working capital');
        return;
      }

      // Store in database (if available)
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
        await prisma.workingCapital.create({
          data: {
            date: workingCapitalData.date,
            currentAssets: workingCapitalData.currentAssets,
            currentLiabilities: workingCapitalData.currentLiabilities,
            workingCapital: workingCapitalData.workingCapital,
            cashAndEquivalents: 0, // Would need to extract from balance sheet
            accountsReceivable: 0, // Would need to extract from balance sheet
            inventory: 0, // Would need to extract from balance sheet
            accountsPayable: 0, // Would need to extract from balance sheet
            daysReceivables: 0, // Calculate from AR data
            daysInventory: 0, // Calculate from inventory data
            daysPayables: 0 // Calculate from AP data
          }
        });
      }

      logInfo('Working capital synced from Xero', workingCapitalData);
    } catch (error) {
      logError('Failed to sync working capital', error);
      this.syncStats.errors.push(`Working capital sync: ${error.message}`);
    }
  }

  /**
   * Sync chart of accounts from Xero
   */
  async syncAccounts() {
    try {
      logInfo('Syncing accounts from Xero');

      const accounts = await this.xeroService.getAccounts();

      if (!accounts || accounts.length === 0) {
        logInfo('No accounts to sync');
        return;
      }

      // Process accounts for cash account tracking
      const cashAccounts = accounts.filter(acc =>
        acc.type === 'BANK' || acc.class === 'ASSET'
      );

      // Store in database (if available)
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
        await prisma.$transaction(async (tx) => {
          for (const account of cashAccounts) {
            await tx.cashAccount.upsert({
              where: {
                accountCode: account.code
              },
              update: {
                accountName: account.name,
                accountType: account.type,
                balance: account.balance || 0,
                currency: account.currencyCode || 'USD',
                status: account.status || 'ACTIVE',
                updatedAt: new Date()
              },
              create: {
                accountCode: account.code,
                accountName: account.name,
                accountType: account.type,
                balance: account.balance || 0,
                currency: account.currencyCode || 'USD',
                bankName: account.bankAccountNumber ? 'Xero Bank' : null,
                isPrimary: account.type === 'BANK'
              }
            });
          }
        });
      }

      logInfo(`Synced ${cashAccounts.length} cash accounts from Xero`);
    } catch (error) {
      logError('Failed to sync accounts', error);
      this.syncStats.errors.push(`Account sync: ${error.message}`);
    }
  }

  /**
   * Analyze cash flow from transactions
   */
  analyzeCashFlow(transactions) {
    const cashFlowData = [];

    transactions.forEach(transaction => {
      const isInflow = transaction.type === 'RECEIVE';
      const category = this.categorizeTransaction(transaction);

      cashFlowData.push({
        date: new Date(transaction.date),
        type: isInflow ? 'inflow' : 'outflow',
        category: category.primary,
        subCategory: category.sub,
        description: transaction.reference || transaction.contact?.name || 'Xero Transaction',
        amount: Math.abs(transaction.total || 0),
        reference: transaction.bankTransactionID,
        createdBy: 'xero_sync'
      });
    });

    return cashFlowData;
  }

  /**
   * Categorize transaction for cash flow reporting
   */
  categorizeTransaction(transaction) {
    // Simple categorization logic - can be enhanced
    const lineItem = transaction.lineItems?.[0];
    const accountCode = lineItem?.accountCode;

    // Map account codes to categories
    if (accountCode?.startsWith('4')) {
      return { primary: 'operating', sub: 'revenue' };
    } else if (accountCode?.startsWith('5')) {
      return { primary: 'operating', sub: 'expenses' };
    } else if (accountCode?.startsWith('1')) {
      return { primary: 'investing', sub: 'assets' };
    } else if (accountCode?.startsWith('2')) {
      return { primary: 'financing', sub: 'liabilities' };
    }

    return { primary: 'operating', sub: 'other' };
  }

  /**
   * Broadcast sync status via WebSocket
   */
  broadcastSyncStatus(status, data) {
    try {
      const wsService = WebSocketService.getInstance?.() || WebSocketService;
      wsService.broadcast?.('xero-sync-status', {
        status,
        ...data
      });
    } catch (error) {
      logError('Failed to broadcast Xero sync status', error);
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
      cronActive: !!this.cronJob,
      authenticated: this.xeroService.isAuthenticated()
    };
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync() {
    logInfo('Manual Xero sync triggered');
    return await this.performSync();
  }
}

// Singleton instance
let syncInstance = null;

export function getXeroSync() {
  if (!syncInstance) {
    syncInstance = new XeroSyncService();
  }
  return syncInstance;
}

export default XeroSyncService;