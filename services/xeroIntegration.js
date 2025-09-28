/**
 * Xero Integration Service
 * Handles OAuth flow, data synchronization, and webhook processing
 */

import { XeroClient } from 'xero-node';
import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { logInfo, logError, logWarn } from '../services/observability/structuredLogger.js';

class XeroIntegrationService {
  constructor() {
    this.xeroClient = null;
    this.tenantId = null;
    this.isConnected = false;
    this.syncJob = null;
    this.initializeClient();
  }

  initializeClient() {
    try {
      this.xeroClient = new XeroClient({
        clientId: process.env.XERO_CLIENT_ID || '',
        clientSecret: process.env.XERO_CLIENT_SECRET || '',
        redirectUris: [`${process.env.API_URL || 'http://localhost:5000'}/api/xero/callback`],
        scopes: [
          'openid',
          'profile',
          'email',
          'accounting.transactions',
          'accounting.transactions.read',
          'accounting.reports.read',
          'accounting.settings',
          'accounting.settings.read',
          'accounting.contacts',
          'accounting.contacts.read',
          'accounting.attachments',
          'accounting.attachments.read'
        ].join(' ')
      });

      logInfo('Xero client initialized');
    } catch (error) {
      logError('Failed to initialize Xero client', error);
    }
  }

  // OAuth Flow Methods
  async buildConsentUrl() {
    try {
      const consentUrl = await this.xeroClient.buildConsentUrl();
      logInfo('Xero consent URL generated');
      return consentUrl;
    } catch (error) {
      logError('Failed to build Xero consent URL', error);
      throw error;
    }
  }

  async handleCallback(requestUrl) {
    try {
      const tokenSet = await this.xeroClient.apiCallback(requestUrl);
      await this.xeroClient.setTokenSet(tokenSet);

      // Store tokens in database
      await prisma.integration.upsert({
        where: { service: 'xero' },
        update: {
          tokens: tokenSet,
          status: 'connected',
          lastSync: new Date(),
          metadata: {
            expiresAt: new Date(Date.now() + tokenSet.expires_in * 1000)
          }
        },
        create: {
          service: 'xero',
          tokens: tokenSet,
          status: 'connected',
          lastSync: new Date(),
          metadata: {
            expiresAt: new Date(Date.now() + tokenSet.expires_in * 1000)
          }
        }
      });

      // Update tenant information
      await this.updateTenants();

      this.isConnected = true;
      logInfo('Xero OAuth callback successful');

      // Start automated sync
      this.startAutomatedSync();

      return true;
    } catch (error) {
      logError('Xero OAuth callback failed', error);
      throw error;
    }
  }

  async refreshTokens() {
    try {
      const integration = await prisma.integration.findUnique({
        where: { service: 'xero' }
      });

      if (!integration || !integration.tokens) {
        logWarn('No Xero tokens found');
        return false;
      }

      const validTokenSet = await this.xeroClient.refreshWithRefreshToken(
        integration.tokens.refresh_token
      );

      await this.xeroClient.setTokenSet(validTokenSet);

      // Update stored tokens
      await prisma.integration.update({
        where: { service: 'xero' },
        data: {
          tokens: validTokenSet,
          metadata: {
            expiresAt: new Date(Date.now() + validTokenSet.expires_in * 1000)
          }
        }
      });

      logInfo('Xero tokens refreshed');
      return true;
    } catch (error) {
      logError('Failed to refresh Xero tokens', error);
      return false;
    }
  }

  async updateTenants() {
    try {
      await this.xeroClient.updateTenants();
      const tenants = this.xeroClient.tenants;

      if (tenants && tenants.length > 0) {
        this.tenantId = tenants[0].tenantId;

        // Store tenant info
        await prisma.integration.update({
          where: { service: 'xero' },
          data: {
            metadata: {
              tenantId: this.tenantId,
              tenantName: tenants[0].tenantName,
              tenantType: tenants[0].tenantType
            }
          }
        });

        logInfo('Xero tenants updated', { tenantId: this.tenantId });
        return this.tenantId;
      }
    } catch (error) {
      logError('Failed to update Xero tenants', error);
      throw error;
    }
  }

  // Data Synchronization Methods
  async syncInvoices() {
    try {
      if (!this.tenantId) {
        await this.updateTenants();
      }

      const response = await this.xeroClient.accountingApi.getInvoices(
        this.tenantId,
        null, // if modified since
        null, // where
        'Type=="ACCREC"', // order
        null, // IDs
        null, // Invoice Numbers
        null, // Contact IDs
        null, // Statuses
        1, // page
        100, // page size
        true // include archived
      );

      if (response.body && response.body.invoices) {
        const invoices = response.body.invoices;

        for (const invoice of invoices) {
          await prisma.invoice.upsert({
            where: { xeroId: invoice.invoiceID },
            update: {
              number: invoice.invoiceNumber,
              amount: invoice.total || 0,
              amountDue: invoice.amountDue || 0,
              status: invoice.status,
              type: invoice.type,
              dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
              paidDate: invoice.fullyPaidOnDate ? new Date(invoice.fullyPaidOnDate) : null,
              contactName: invoice.contact?.name,
              lineItems: invoice.lineItems,
              updatedAt: new Date()
            },
            create: {
              xeroId: invoice.invoiceID,
              number: invoice.invoiceNumber || `INV-${Date.now()}`,
              amount: invoice.total || 0,
              amountDue: invoice.amountDue || 0,
              status: invoice.status,
              type: invoice.type,
              dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
              paidDate: invoice.fullyPaidOnDate ? new Date(invoice.fullyPaidOnDate) : null,
              contactName: invoice.contact?.name,
              lineItems: invoice.lineItems,
              createdAt: new Date()
            }
          });
        }

        logInfo(`Synced ${invoices.length} invoices from Xero`);
        return invoices.length;
      }

      return 0;
    } catch (error) {
      logError('Failed to sync Xero invoices', error);
      throw error;
    }
  }

  async syncBankTransactions() {
    try {
      if (!this.tenantId) {
        await this.updateTenants();
      }

      const response = await this.xeroClient.accountingApi.getBankTransactions(
        this.tenantId,
        null, // if modified since
        null, // where
        'Date DESC', // order
        1, // page
        100 // page size
      );

      if (response.body && response.body.bankTransactions) {
        const transactions = response.body.bankTransactions;

        for (const transaction of transactions) {
          await prisma.bankTransaction.upsert({
            where: { xeroId: transaction.bankTransactionID },
            update: {
              date: new Date(transaction.date),
              amount: transaction.total || 0,
              type: transaction.type,
              status: transaction.status,
              reference: transaction.reference,
              bankAccountId: transaction.bankAccount?.accountID,
              contactName: transaction.contact?.name,
              isReconciled: transaction.isReconciled,
              updatedAt: new Date()
            },
            create: {
              xeroId: transaction.bankTransactionID,
              date: new Date(transaction.date),
              amount: transaction.total || 0,
              type: transaction.type,
              status: transaction.status,
              reference: transaction.reference,
              bankAccountId: transaction.bankAccount?.accountID,
              contactName: transaction.contact?.name,
              isReconciled: transaction.isReconciled,
              createdAt: new Date()
            }
          });
        }

        logInfo(`Synced ${transactions.length} bank transactions from Xero`);
        return transactions.length;
      }

      return 0;
    } catch (error) {
      logError('Failed to sync Xero bank transactions', error);
      throw error;
    }
  }

  async syncAccounts() {
    try {
      if (!this.tenantId) {
        await this.updateTenants();
      }

      const response = await this.xeroClient.accountingApi.getAccounts(
        this.tenantId,
        null, // if modified since
        'Status=="ACTIVE"', // where
        'Name ASC' // order
      );

      if (response.body && response.body.accounts) {
        const accounts = response.body.accounts;

        for (const account of accounts) {
          await prisma.account.upsert({
            where: { xeroId: account.accountID },
            update: {
              code: account.code,
              name: account.name,
              type: account.type,
              class: account.class,
              status: account.status,
              description: account.description,
              bankAccountNumber: account.bankAccountNumber,
              currencyCode: account.currencyCode,
              updatedAt: new Date()
            },
            create: {
              xeroId: account.accountID,
              code: account.code || `ACC-${Date.now()}`,
              name: account.name,
              type: account.type,
              class: account.class,
              status: account.status,
              description: account.description,
              bankAccountNumber: account.bankAccountNumber,
              currencyCode: account.currencyCode,
              createdAt: new Date()
            }
          });
        }

        logInfo(`Synced ${accounts.length} accounts from Xero`);
        return accounts.length;
      }

      return 0;
    } catch (error) {
      logError('Failed to sync Xero accounts', error);
      throw error;
    }
  }

  async syncWorkingCapital() {
    try {
      if (!this.tenantId) {
        await this.updateTenants();
      }

      // Get Balance Sheet report
      const balanceSheet = await this.xeroClient.accountingApi.getReportBalanceSheet(
        this.tenantId,
        null, // date
        3, // periods
        'MONTH' // timeframe
      );

      // Get Aged Receivables
      const agedReceivables = await this.xeroClient.accountingApi.getReportAgedReceivablesByContact(
        this.tenantId,
        null, // contact ID
        new Date() // date
      );

      // Get Aged Payables
      const agedPayables = await this.xeroClient.accountingApi.getReportAgedPayablesByContact(
        this.tenantId,
        null, // contact ID
        new Date() // date
      );

      // Calculate working capital metrics
      const workingCapitalData = this.calculateWorkingCapital(
        balanceSheet.body,
        agedReceivables.body,
        agedPayables.body
      );

      // Store working capital data
      await prisma.workingCapital.create({
        data: {
          date: new Date(),
          currentAssets: workingCapitalData.currentAssets,
          currentLiabilities: workingCapitalData.currentLiabilities,
          workingCapital: workingCapitalData.workingCapital,
          currentRatio: workingCapitalData.currentRatio,
          quickRatio: workingCapitalData.quickRatio,
          cashBalance: workingCapitalData.cashBalance,
          accountsReceivable: workingCapitalData.accountsReceivable,
          accountsPayable: workingCapitalData.accountsPayable,
          inventory: workingCapitalData.inventory,
          metadata: workingCapitalData.breakdown
        }
      });

      logInfo('Working capital synced from Xero', workingCapitalData);
      return workingCapitalData;
    } catch (error) {
      logError('Failed to sync working capital from Xero', error);
      throw error;
    }
  }

  calculateWorkingCapital(balanceSheet, agedReceivables, agedPayables) {
    try {
      // Extract values from balance sheet report
      const reports = balanceSheet.reports || [];
      const report = reports[0] || {};
      const rows = report.rows || [];

      let currentAssets = 0;
      let currentLiabilities = 0;
      let cashBalance = 0;
      let accountsReceivable = 0;
      let accountsPayable = 0;
      let inventory = 0;

      // Parse balance sheet rows
      rows.forEach(row => {
        if (row.rowType === 'Section') {
          const title = row.title || '';
          const cells = row.rows || [];

          if (title.includes('Current Assets')) {
            cells.forEach(cell => {
              if (cell.cells) {
                const value = parseFloat(cell.cells[1]?.value || 0);
                currentAssets += value;

                if (cell.cells[0]?.value?.includes('Cash')) {
                  cashBalance += value;
                }
                if (cell.cells[0]?.value?.includes('Accounts Receivable')) {
                  accountsReceivable += value;
                }
                if (cell.cells[0]?.value?.includes('Inventory')) {
                  inventory += value;
                }
              }
            });
          }

          if (title.includes('Current Liabilities')) {
            cells.forEach(cell => {
              if (cell.cells) {
                const value = parseFloat(cell.cells[1]?.value || 0);
                currentLiabilities += value;

                if (cell.cells[0]?.value?.includes('Accounts Payable')) {
                  accountsPayable += value;
                }
              }
            });
          }
        }
      });

      // Calculate ratios
      const workingCapital = currentAssets - currentLiabilities;
      const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
      const quickRatio = currentLiabilities > 0 ?
        (currentAssets - inventory) / currentLiabilities : 0;

      return {
        currentAssets,
        currentLiabilities,
        workingCapital,
        currentRatio: Math.round(currentRatio * 100) / 100,
        quickRatio: Math.round(quickRatio * 100) / 100,
        cashBalance,
        accountsReceivable,
        accountsPayable,
        inventory,
        breakdown: {
          assets: {
            cash: cashBalance,
            receivables: accountsReceivable,
            inventory: inventory,
            other: currentAssets - cashBalance - accountsReceivable - inventory
          },
          liabilities: {
            payables: accountsPayable,
            other: currentLiabilities - accountsPayable
          }
        }
      };
    } catch (error) {
      logError('Failed to calculate working capital', error);
      return {
        currentAssets: 0,
        currentLiabilities: 0,
        workingCapital: 0,
        currentRatio: 0,
        quickRatio: 0,
        cashBalance: 0,
        accountsReceivable: 0,
        accountsPayable: 0,
        inventory: 0,
        breakdown: {}
      };
    }
  }

  // Full Data Sync
  async syncAllData() {
    try {
      logInfo('Starting full Xero data sync');

      // Refresh tokens if needed
      await this.refreshTokens();

      // Sync all data types
      const results = {
        invoices: await this.syncInvoices(),
        bankTransactions: await this.syncBankTransactions(),
        accounts: await this.syncAccounts(),
        workingCapital: await this.syncWorkingCapital()
      };

      // Update last sync time
      await prisma.integration.update({
        where: { service: 'xero' },
        data: {
          lastSync: new Date(),
          metadata: {
            lastSyncResults: results
          }
        }
      });

      logInfo('Full Xero sync completed', results);
      return results;
    } catch (error) {
      logError('Full Xero sync failed', error);

      // Update status to error
      await prisma.integration.update({
        where: { service: 'xero' },
        data: {
          status: 'error',
          metadata: {
            lastError: error.message,
            errorTime: new Date()
          }
        }
      });

      throw error;
    }
  }

  // Automated Sync Management
  startAutomatedSync() {
    // Stop existing job if any
    if (this.syncJob) {
      this.syncJob.stop();
    }

    // Schedule sync every 30 minutes
    this.syncJob = cron.schedule('*/30 * * * _*', async _() => {
      logInfo('Running automated Xero sync');
      try {
        await this.syncAllData();
      } catch (error) {
        logError('Automated Xero sync failed', error);
      }
    });

    logInfo('Automated Xero sync scheduled (every 30 minutes)');
  }

  stopAutomatedSync() {
    if (this.syncJob) {
      this.syncJob.stop();
      this.syncJob = null;
      logInfo('Automated Xero sync stopped');
    }
  }

  // Webhook Processing
  async processWebhook(payload, signature) {
    try {
      // Verify webhook signature
      const isValid = await this.verifyWebhookSignature(payload, signature);

      if (!isValid) {
        logWarn('Invalid Xero webhook signature');
        return false;
      }

      const events = payload.events || [];

      for (const event of events) {
        await this.processWebhookEvent(event);
      }

      logInfo(`Processed ${events.length} Xero webhook events`);
      return true;
    } catch (error) {
      logError('Failed to process Xero webhook', error);
      throw error;
    }
  }

  async verifyWebhookSignature(payload, signature) {
    // Implement Xero webhook signature verification
    // This would use the webhook key from Xero
    const crypto = await import('crypto');
    const webhookKey = process.env.XERO_WEBHOOK_KEY || '';

    const hash = crypto
      .createHmac('sha256', webhookKey)
      .update(JSON.stringify(payload))
      .digest('base64');

    return hash === signature;
  }

  async processWebhookEvent(event) {
    try {
      const { eventType, resourceId, eventDateUtc } = event;

      switch (eventType) {
        case 'CREATE_INVOICE':
        case 'UPDATE_INVOICE':
          // Sync specific invoice
          await this.syncInvoiceById(resourceId);
          break;

        case 'CREATE_BANKTRANSACTION':
        case 'UPDATE_BANKTRANSACTION':
          // Sync specific bank transaction
          await this.syncBankTransactionById(resourceId);
          break;

        case 'CREATE_CONTACT':
        case 'UPDATE_CONTACT':
          // Sync specific contact
          await this.syncContactById(resourceId);
          break;

        default:
          logInfo(`Unhandled Xero webhook event type: ${eventType}`);
      }
    } catch (error) {
      logError(`Failed to process webhook event: ${event.eventType}`, error);
    }
  }

  async syncInvoiceById(invoiceId) {
    try {
      const response = await this.xeroClient.accountingApi.getInvoice(
        this.tenantId,
        invoiceId
      );

      if (response.body && response.body.invoices && response.body.invoices.length > 0) {
        const invoice = response.body.invoices[0];

        await prisma.invoice.upsert({
          where: { xeroId: invoice.invoiceID },
          update: {
            number: invoice.invoiceNumber,
            amount: invoice.total || 0,
            amountDue: invoice.amountDue || 0,
            status: invoice.status,
            updatedAt: new Date()
          },
          create: {
            xeroId: invoice.invoiceID,
            number: invoice.invoiceNumber || `INV-${Date.now()}`,
            amount: invoice.total || 0,
            amountDue: invoice.amountDue || 0,
            status: invoice.status,
            createdAt: new Date()
          }
        });

        logInfo(`Synced invoice ${invoiceId} from webhook`);
      }
    } catch (error) {
      logError(`Failed to sync invoice ${invoiceId}`, error);
    }
  }

  async syncBankTransactionById(transactionId) {
    // Similar implementation for bank transactions
    logInfo(`Syncing bank transaction ${transactionId} from webhook`);
  }

  async syncContactById(contactId) {
    // Similar implementation for contacts
    logInfo(`Syncing contact ${contactId} from webhook`);
  }

  // Connection Status
  async checkConnectionStatus() {
    try {
      const integration = await prisma.integration.findUnique({
        where: { service: 'xero' }
      });

      if (!integration || !integration.tokens) {
        return {
          connected: false,
          status: 'not_authenticated',
          message: 'Xero not connected'
        };
      }

      // Check if tokens are expired
      const expiresAt = integration.metadata?.expiresAt;
      if (expiresAt && new Date(expiresAt) < new Date()) {
        // Try to refresh tokens
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          return {
            connected: false,
            status: 'token_expired',
            message: 'Xero tokens expired and could not be refreshed'
          };
        }
      }

      // Test connection with a simple API call
      await this.xeroClient.accountingApi.getOrganisations(this.tenantId);

      return {
        connected: true,
        status: 'connected',
        message: 'Xero connected successfully',
        lastSync: integration.lastSync,
        tenantName: integration.metadata?.tenantName
      };
    } catch (error) {
      logError('Failed to check Xero connection status', error);
      return {
        connected: false,
        status: 'error',
        message: error.message
      };
    }
  }

  // Manual Sync Trigger
  async triggerManualSync() {
    try {
      logInfo('Manual Xero sync triggered');
      const results = await this.syncAllData();
      return {
        success: true,
        results,
        timestamp: new Date()
      };
    } catch (error) {
      logError('Manual Xero sync failed', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Disconnect Xero
  async disconnect() {
    try {
      // Stop automated sync
      this.stopAutomatedSync();

      // Clear tokens from database
      await prisma.integration.update({
        where: { service: 'xero' },
        data: {
          status: 'disconnected',
          tokens: null,
          metadata: {}
        }
      });

      this.isConnected = false;
      this.tenantId = null;

      logInfo('Xero disconnected');
      return true;
    } catch (error) {
      logError('Failed to disconnect Xero', error);
      return false;
    }
  }
}

// Create singleton instance
const xeroIntegration = new XeroIntegrationService();

export default xeroIntegration;