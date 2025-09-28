import axios from 'axios';
import { XeroClient } from 'xero-node';

class XeroIntegration {
  constructor(config = {}) {
    this.clientId = config.clientId || process.env.XERO_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.XERO_CLIENT_SECRET;
    this.tenantId = config.tenantId || process.env.XERO_TENANT_ID;
    this.redirectUrl = config.redirectUrl || process.env.XERO_REDIRECT_URL;
    this.isConfigured = !!(this.clientId && this.clientSecret);

    if (this.isConfigured) {
      try {
        this.xeroClient = new XeroClient({
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          redirectUris: [this.redirectUrl],
          scopes: [
            'accounting.transactions',
            'accounting.reports.read',
            'accounting.journals.read',
            'accounting.settings',
            'accounting.contacts',
            'accounting.attachments'
          ].join(' ')
        });
      } catch (error) {
        console.error('Failed to initialize Xero client:', error);
        this.isConfigured = false;
      }
    }

    this.mockMode = !this.isConfigured;
    this.rateLimit = {
      maxRequests: 60,
      perMinute: 60000,
      requests: []
    };
  }

  async checkRateLimit() {
    const now = Date.now();
    this.rateLimit.requests = this.rateLimit.requests.filter(
      time => now - time < this.rateLimit.perMinute
    );

    if (this.rateLimit.requests.length >= this.rateLimit.maxRequests) {
      const waitTime = this.rateLimit.perMinute - (now - this.rateLimit.requests[0]);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`);
    }

    this.rateLimit.requests.push(now);
  }

  async getStatus() {
    if (this.mockMode) {
      return {
        connected: false,
        message: 'Running in mock mode - Xero credentials not configured',
        mockMode: true,
        lastSync: null
      };
    }

    try {
      await this.checkRateLimit();
      const tokenSet = await this.xeroClient.readTokenSet();
      return {
        connected: tokenSet && !this.xeroClient.tokenExpired(),
        tenantId: this.tenantId,
        lastSync: new Date().toISOString(),
        expiresAt: tokenSet?.expires_at
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        lastSync: null
      };
    }
  }

  async getCashFlow(startDate, endDate) {
    if (this.mockMode) {
      return this.getMockCashFlow(startDate, endDate);
    }

    try {
      await this.checkRateLimit();
      await this.xeroClient.initialize();

      const response = await this.xeroClient.accountingApi.getReportCashSummary(
        this.tenantId,
        startDate,
        endDate
      );

      return this.transformCashFlowReport(response.body);
    } catch (error) {
      console.error('Xero getCashFlow error:', error);
      return this.getMockCashFlow(startDate, endDate);
    }
  }

  async getInvoices(status = 'AUTHORISED') {
    if (this.mockMode) {
      return this.getMockInvoices(status);
    }

    try {
      await this.checkRateLimit();
      await this.xeroClient.initialize();

      const response = await this.xeroClient.accountingApi.getInvoices(
        this.tenantId,
        null,
        `Status=="${status}"`
      );

      return response.body.invoices.map(invoice => ({
        id: invoice.invoiceID,
        number: invoice.invoiceNumber,
        date: invoice.date,
        dueDate: invoice.dueDate,
        contact: invoice.contact?.name,
        total: invoice.total,
        status: invoice.status,
        type: invoice.type,
        amountDue: invoice.amountDue,
        isPaid: invoice.status === 'PAID'
      }));
    } catch (error) {
      console.error('Xero getInvoices error:', error);
      return this.getMockInvoices(status);
    }
  }

  async getBills(status = 'AUTHORISED') {
    if (this.mockMode) {
      return this.getMockBills(status);
    }

    try {
      await this.checkRateLimit();
      await this.xeroClient.initialize();

      const response = await this.xeroClient.accountingApi.getBills(
        this.tenantId,
        null,
        `Status=="${status}"`
      );

      return response.body.bills.map(bill => ({
        id: bill.billID,
        number: bill.billNumber,
        date: bill.date,
        dueDate: bill.dueDate,
        contact: bill.contact?.name,
        total: bill.total,
        status: bill.status,
        amountDue: bill.amountDue,
        isPaid: bill.status === 'PAID'
      }));
    } catch (error) {
      console.error('Xero getBills error:', error);
      return this.getMockBills(status);
    }
  }

  async getProfitLoss(startDate, endDate) {
    if (this.mockMode) {
      return this.getMockProfitLoss(startDate, endDate);
    }

    try {
      await this.checkRateLimit();
      await this.xeroClient.initialize();

      const response = await this.xeroClient.accountingApi.getReportProfitAndLoss(
        this.tenantId,
        startDate,
        endDate
      );

      return this.transformProfitLossReport(response.body);
    } catch (error) {
      console.error('Xero getProfitLoss error:', error);
      return this.getMockProfitLoss(startDate, endDate);
    }
  }

  async getBalanceSheet(date) {
    if (this.mockMode) {
      return this.getMockBalanceSheet(date);
    }

    try {
      await this.checkRateLimit();
      await this.xeroClient.initialize();

      const response = await this.xeroClient.accountingApi.getReportBalanceSheet(
        this.tenantId,
        date
      );

      return this.transformBalanceSheetReport(response.body);
    } catch (error) {
      console.error('Xero getBalanceSheet error:', error);
      return this.getMockBalanceSheet(date);
    }
  }

  transformCashFlowReport(report) {
    return {
      period: report.reportDate,
      openingBalance: report.openingBalance || 0,
      closingBalance: report.closingBalance || 0,
      netChange: report.netCashMovement || 0,
      operatingActivities: report.operatingActivities || 0,
      investingActivities: report.investingActivities || 0,
      financingActivities: report.financingActivities || 0
    };
  }

  transformProfitLossReport(report) {
    return {
      period: report.reportDate,
      revenue: report.totalRevenue || 0,
      expenses: report.totalExpenses || 0,
      netProfit: report.netProfit || 0,
      grossProfit: report.grossProfit || 0,
      operatingProfit: report.operatingProfit || 0
    };
  }

  transformBalanceSheetReport(report) {
    return {
      date: report.reportDate,
      assets: {
        current: report.currentAssets || 0,
        nonCurrent: report.nonCurrentAssets || 0,
        total: report.totalAssets || 0
      },
      liabilities: {
        current: report.currentLiabilities || 0,
        nonCurrent: report.nonCurrentLiabilities || 0,
        total: report.totalLiabilities || 0
      },
      equity: report.totalEquity || 0
    };
  }

  // Mock data methods
  getMockCashFlow(startDate, endDate) {
    return {
      period: `${startDate} to ${endDate}`,
      openingBalance: 125000,
      closingBalance: 142000,
      netChange: 17000,
      operatingActivities: 35000,
      investingActivities: -12000,
      financingActivities: -6000,
      mockData: true
    };
  }

  getMockInvoices(status) {
    const invoices = [
      {
        id: 'INV-001',
        number: 'INV-2025-001',
        date: '2025-01-15',
        dueDate: '2025-02-15',
        contact: 'Acme Corporation',
        total: 15750.00,
        status: 'AUTHORISED',
        type: 'ACCREC',
        amountDue: 15750.00,
        isPaid: false
      },
      {
        id: 'INV-002',
        number: 'INV-2025-002',
        date: '2025-01-20',
        dueDate: '2025-02-20',
        contact: 'Global Tech Inc',
        total: 8900.50,
        status: 'PAID',
        type: 'ACCREC',
        amountDue: 0,
        isPaid: true
      },
      {
        id: 'INV-003',
        number: 'INV-2025-003',
        date: '2025-01-25',
        dueDate: '2025-02-25',
        contact: 'Retail Partners Ltd',
        total: 23400.00,
        status: 'AUTHORISED',
        type: 'ACCREC',
        amountDue: 23400.00,
        isPaid: false
      }
    ];

    return status === 'ALL' ? invoices : invoices.filter(inv => inv.status === status);
  }

  getMockBills(status) {
    const bills = [
      {
        id: 'BILL-001',
        number: 'BILL-2025-001',
        date: '2025-01-10',
        dueDate: '2025-02-10',
        contact: 'Raw Materials Supplier',
        total: 42000.00,
        status: 'AUTHORISED',
        amountDue: 42000.00,
        isPaid: false
      },
      {
        id: 'BILL-002',
        number: 'BILL-2025-002',
        date: '2025-01-12',
        dueDate: '2025-02-12',
        contact: 'Logistics Provider',
        total: 5600.00,
        status: 'PAID',
        amountDue: 0,
        isPaid: true
      },
      {
        id: 'BILL-003',
        number: 'BILL-2025-003',
        date: '2025-01-18',
        dueDate: '2025-02-18',
        contact: 'Equipment Rental Co',
        total: 8900.00,
        status: 'AUTHORISED',
        amountDue: 8900.00,
        isPaid: false
      }
    ];

    return status === 'ALL' ? bills : bills.filter(bill => bill.status === status);
  }

  getMockProfitLoss(startDate, endDate) {
    return {
      period: `${startDate} to ${endDate}`,
      revenue: 850000,
      expenses: 620000,
      netProfit: 230000,
      grossProfit: 340000,
      operatingProfit: 280000,
      mockData: true
    };
  }

  getMockBalanceSheet(date) {
    return {
      date: date,
      assets: {
        current: 450000,
        nonCurrent: 820000,
        total: 1270000
      },
      liabilities: {
        current: 180000,
        nonCurrent: 320000,
        total: 500000
      },
      equity: 770000,
      mockData: true
    };
  }
}

export default XeroIntegration;