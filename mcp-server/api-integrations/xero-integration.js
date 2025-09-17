/**
 * Xero Integration for MCP Server
 * Handles all Xero API interactions through the MCP architecture
 */

import { XeroClient } from 'xero-node';
import winston from 'winston';

class XeroIntegrationMCP {
  constructor() {
    this.client = null;
    this.tenantId = null;
    this.isInitialized = false;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/xero-integration.log' })
      ]
    });
  }

  async initialize() {
    try {
      this.client = new XeroClient({
        clientId: process.env.XERO_CLIENT_ID || '',
        clientSecret: process.env.XERO_CLIENT_SECRET || '',
        redirectUris: [process.env.XERO_REDIRECT_URI || 'http://localhost:3001/mcp/xero/callback'],
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
          'accounting.contacts.read'
        ].join(' ')
      });

      this.isInitialized = true;
      this.logger.info('✅ Xero Integration initialized for MCP Server');
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to initialize Xero integration', error);
      return { success: false, error: error.message };
    }
  }

  // MCP Tool: Get Authorization URL
  async getAuthorizationUrl() {
    try {
      if (!this.client) await this.initialize();
      const consentUrl = await this.client.buildConsentUrl();

      return {
        success: true,
        url: consentUrl,
        message: 'Redirect user to this URL for Xero authorization'
      };
    } catch (error) {
      this.logger.error('Failed to generate authorization URL', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: Handle OAuth Callback
  async handleOAuthCallback(requestUrl) {
    try {
      const tokenSet = await this.client.apiCallback(requestUrl);
      await this.client.setTokenSet(tokenSet);

      // Update tenants
      await this.client.updateTenants();
      const tenants = this.client.tenants;

      if (tenants && tenants.length > 0) {
        this.tenantId = tenants[0].tenantId;
      }

      this.logger.info('Xero OAuth successful', { tenantId: this.tenantId });

      return {
        success: true,
        tenantId: this.tenantId,
        tokens: tokenSet,
        message: 'Successfully connected to Xero'
      };
    } catch (error) {
      this.logger.error('OAuth callback failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: Refresh Access Token
  async refreshToken(refreshToken) {
    try {
      const validTokenSet = await this.client.refreshWithRefreshToken(refreshToken);
      await this.client.setTokenSet(validTokenSet);

      this.logger.info('Xero tokens refreshed');
      return {
        success: true,
        tokens: validTokenSet
      };
    } catch (error) {
      this.logger.error('Failed to refresh token', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: Get Financial Data
  async getFinancialData(type, params = {}) {
    try {
      if (!this.tenantId) {
        return {
          success: false,
          error: 'No tenant selected. Please authenticate first.'
        };
      }

      let data;
      switch (type) {
        case 'balance-sheet':
          const balanceSheet = await this.client.accountingApi.getReportBalanceSheet(
            this.tenantId,
            params.date,
            params.periods || 1,
            params.timeframe || 'MONTH'
          );
          data = this.parseBalanceSheet(balanceSheet.body);
          break;

        case 'profit-loss':
          const profitLoss = await this.client.accountingApi.getReportProfitAndLoss(
            this.tenantId,
            params.fromDate,
            params.toDate,
            params.periods || 1,
            params.timeframe || 'MONTH'
          );
          data = this.parseProfitLoss(profitLoss.body);
          break;

        case 'cash-flow':
          // Get bank transactions for cash flow analysis
          const transactions = await this.client.accountingApi.getBankTransactions(
            this.tenantId,
            params.fromDate,
            params.where,
            'Date DESC'
          );
          data = this.calculateCashFlow(transactions.body);
          break;

        case 'invoices':
          const invoices = await this.client.accountingApi.getInvoices(
            this.tenantId,
            params.modifiedSince,
            params.where,
            params.order,
            params.ids,
            params.invoiceNumbers,
            params.contactIds,
            params.statuses
          );
          data = this.parseInvoices(invoices.body);
          break;

        case 'working-capital':
          // Get multiple reports to calculate working capital
          const [balance, receivables, payables] = await Promise.all([
            this.client.accountingApi.getReportBalanceSheet(this.tenantId),
            this.client.accountingApi.getReportAgedReceivablesByContact(this.tenantId),
            this.client.accountingApi.getReportAgedPayablesByContact(this.tenantId)
          ]);

          data = this.calculateWorkingCapital(
            balance.body,
            receivables.body,
            payables.body
          );
          break;

        default:
          return {
            success: false,
            error: `Unknown financial data type: ${type}`
          };
      }

      this.logger.info(`Retrieved ${type} data from Xero`);
      return {
        success: true,
        type,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get ${type} data`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Parse Balance Sheet
  parseBalanceSheet(report) {
    const rows = report.reports?.[0]?.rows || [];
    const result = {
      assets: { current: 0, nonCurrent: 0, total: 0 },
      liabilities: { current: 0, nonCurrent: 0, total: 0 },
      equity: 0,
      netAssets: 0
    };

    rows.forEach(row => {
      if (row.rowType === 'Section') {
        const title = row.title?.toLowerCase() || '';
        const value = this.extractValue(row);

        if (title.includes('current assets')) {
          result.assets.current = value;
        } else if (title.includes('non-current assets')) {
          result.assets.nonCurrent = value;
        } else if (title.includes('total assets')) {
          result.assets.total = value;
        } else if (title.includes('current liabilities')) {
          result.liabilities.current = value;
        } else if (title.includes('non-current liabilities')) {
          result.liabilities.nonCurrent = value;
        } else if (title.includes('total liabilities')) {
          result.liabilities.total = value;
        } else if (title.includes('equity')) {
          result.equity = value;
        }
      }
    });

    result.netAssets = result.assets.total - result.liabilities.total;
    return result;
  }

  // Parse Profit & Loss
  parseProfitLoss(report) {
    const rows = report.reports?.[0]?.rows || [];
    const result = {
      revenue: 0,
      expenses: 0,
      netProfit: 0,
      grossProfit: 0,
      operatingExpenses: 0
    };

    rows.forEach(row => {
      if (row.rowType === 'Section') {
        const title = row.title?.toLowerCase() || '';
        const value = this.extractValue(row);

        if (title.includes('revenue') || title.includes('income')) {
          result.revenue = value;
        } else if (title.includes('gross profit')) {
          result.grossProfit = value;
        } else if (title.includes('operating expenses')) {
          result.operatingExpenses = value;
        } else if (title.includes('total expenses')) {
          result.expenses = value;
        } else if (title.includes('net profit') || title.includes('net income')) {
          result.netProfit = value;
        }
      }
    });

    return result;
  }

  // Calculate Cash Flow from transactions
  calculateCashFlow(transactions) {
    const cashFlow = {
      inflows: 0,
      outflows: 0,
      netCashFlow: 0,
      byCategory: {}
    };

    transactions.bankTransactions?.forEach(transaction => {
      const amount = parseFloat(transaction.total || 0);
      const type = transaction.type;
      const category = transaction.lineItems?.[0]?.accountCode || 'Other';

      if (type === 'RECEIVE') {
        cashFlow.inflows += amount;
      } else if (type === 'SPEND') {
        cashFlow.outflows += amount;
      }

      if (!cashFlow.byCategory[category]) {
        cashFlow.byCategory[category] = { inflows: 0, outflows: 0 };
      }

      if (type === 'RECEIVE') {
        cashFlow.byCategory[category].inflows += amount;
      } else {
        cashFlow.byCategory[category].outflows += amount;
      }
    });

    cashFlow.netCashFlow = cashFlow.inflows - cashFlow.outflows;
    return cashFlow;
  }

  // Parse Invoices
  parseInvoices(invoiceData) {
    const invoices = invoiceData.invoices || [];

    return {
      total: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      totalDue: invoices.reduce((sum, inv) => sum + (inv.amountDue || 0), 0),
      byStatus: this.groupByStatus(invoices),
      invoices: invoices.map(inv => ({
        id: inv.invoiceID,
        number: inv.invoiceNumber,
        contact: inv.contact?.name,
        date: inv.date,
        dueDate: inv.dueDate,
        total: inv.total,
        amountDue: inv.amountDue,
        status: inv.status,
        lineItems: inv.lineItems
      }))
    };
  }

  // Calculate Working Capital
  calculateWorkingCapital(balanceSheet, receivables, payables) {
    const balance = this.parseBalanceSheet(balanceSheet);

    // Extract aged receivables total
    const totalReceivables = this.extractTotalFromReport(receivables);

    // Extract aged payables total
    const totalPayables = this.extractTotalFromReport(payables);

    const workingCapital = balance.assets.current - balance.liabilities.current;
    const currentRatio = balance.liabilities.current > 0
      ? balance.assets.current / balance.liabilities.current
      : 0;

    return {
      currentAssets: balance.assets.current,
      currentLiabilities: balance.liabilities.current,
      workingCapital,
      currentRatio: Math.round(currentRatio * 100) / 100,
      accountsReceivable: totalReceivables,
      accountsPayable: totalPayables,
      cashConversionCycle: this.calculateCashConversionCycle(
        totalReceivables,
        totalPayables,
        balance.assets.current
      )
    };
  }

  // Utility: Extract value from report row
  extractValue(row) {
    if (row.rows && row.rows.length > 0) {
      const summaryRow = row.rows.find(r => r.rowType === 'SummaryRow');
      if (summaryRow && summaryRow.cells) {
        return parseFloat(summaryRow.cells[1]?.value || 0);
      }
    }
    return 0;
  }

  // Utility: Extract total from aged report
  extractTotalFromReport(report) {
    const rows = report.reports?.[0]?.rows || [];
    const totalRow = rows.find(r => r.rowType === 'SummaryRow');
    if (totalRow && totalRow.cells) {
      return parseFloat(totalRow.cells[totalRow.cells.length - 1]?.value || 0);
    }
    return 0;
  }

  // Utility: Group invoices by status
  groupByStatus(invoices) {
    const groups = {};
    invoices.forEach(inv => {
      const status = inv.status || 'UNKNOWN';
      if (!groups[status]) {
        groups[status] = {
          count: 0,
          total: 0,
          due: 0
        };
      }
      groups[status].count++;
      groups[status].total += inv.total || 0;
      groups[status].due += inv.amountDue || 0;
    });
    return groups;
  }

  // Utility: Calculate cash conversion cycle
  calculateCashConversionCycle(receivables, payables, currentAssets) {
    // Simplified calculation - would need more data for accurate CCC
    const daysReceivables = receivables > 0 ? (receivables / currentAssets) * 365 : 0;
    const daysPayables = payables > 0 ? (payables / currentAssets) * 365 : 0;

    return {
      daysReceivables: Math.round(daysReceivables),
      daysPayables: Math.round(daysPayables),
      cashCycle: Math.round(daysReceivables - daysPayables)
    };
  }

  // MCP Tool: Process Webhook
  async processWebhook(payload, signature) {
    try {
      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(payload, signature);

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        return {
          success: false,
          error: 'Invalid signature'
        };
      }

      const events = payload.events || [];
      const results = [];

      for (const event of events) {
        const result = await this.processWebhookEvent(event);
        results.push(result);
      }

      this.logger.info(`Processed ${events.length} webhook events`);
      return {
        success: true,
        eventsProcessed: events.length,
        results
      };
    } catch (error) {
      this.logger.error('Webhook processing failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const webhookKey = process.env.XERO_WEBHOOK_KEY || '';

    const hash = crypto
      .createHmac('sha256', webhookKey)
      .update(JSON.stringify(payload))
      .digest('base64');

    return hash === signature;
  }

  // Process individual webhook event
  async processWebhookEvent(event) {
    const { eventType, resourceId, eventDateUtc } = event;

    this.logger.info(`Processing webhook event: ${eventType}`, {
      resourceId,
      eventDateUtc
    });

    // Return event info for MCP to handle
    return {
      type: eventType,
      resourceId,
      timestamp: eventDateUtc,
      processed: true
    };
  }

  // MCP Tool: Get Connection Status
  async getStatus() {
    return {
      initialized: this.isInitialized,
      connected: !!this.tenantId,
      tenantId: this.tenantId,
      clientConfigured: !!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET)
    };
  }
}

// Export singleton instance
export default new XeroIntegrationMCP();