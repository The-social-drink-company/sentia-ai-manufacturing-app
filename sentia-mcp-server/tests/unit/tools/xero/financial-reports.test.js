/**
 * Unit Tests for Xero Financial Reports Tool
 * Comprehensive testing of financial reporting functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { XeroApiError } from 'xero-node';

// Mock Xero API before importing the module
vi.mock('../../../../src/tools/xero/auth/oauth.js', () => ({
  getXeroClient: vi.fn().mockResolvedValue({
    accountingApi: {
      getReports: vi.fn(),
      getBankTransactions: vi.fn(),
      getContacts: vi.fn(),
      getInvoices: vi.fn()
    }
  })
}));

describe('Xero Financial Reports Tool', () => {
  let financialReportsTool;
  let mockXeroClient;
  let consoleRestore;

  beforeEach(async () => {
    // Mock console to reduce test noise
    consoleRestore = global.testUtils.mockConsole();
    
    // Import the tool after mocking dependencies
    const { financialReports } = await import('../../../../src/tools/xero/tools/financial-reports.js');
    financialReportsTool = financialReports;
    
    // Get the mocked Xero client
    const { getXeroClient } = await import('../../../../src/tools/xero/auth/oauth.js');
    mockXeroClient = await getXeroClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (consoleRestore) consoleRestore();
  });

  describe('Profit and Loss Report', () => {
    it('should generate profit and loss report with default parameters', async () => {
      const mockProfitLossData = {
        reports: [{
          reportID: 'ProfitAndLoss',
          reportName: 'Profit and Loss',
          reportType: 'ProfitAndLoss',
          reportTitles: ['Profit and Loss', 'Demo Company (US)', 'For the month ended 31 October 2024'],
          reportDate: '31 October 2024',
          updatedDateUTC: new Date().toISOString(),
          rows: [
            {
              rowType: 'Header',
              cells: [
                { value: 'Account' },
                { value: '31 Oct 24' }
              ]
            },
            {
              rowType: 'Section',
              title: 'Revenue',
              rows: [
                {
                  rowType: 'Row',
                  cells: [
                    { value: 'Sales Revenue', attributes: [{ value: '200', id: 'account' }] },
                    { value: '15000.00', attributes: [{ value: '15000.00', id: 'value' }] }
                  ]
                }
              ]
            }
          ]
        }]
      };

      mockXeroClient.accountingApi.getReports.mockResolvedValue(mockProfitLossData);

      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.reports).toHaveLength(1);
      expect(result.data.reports[0].reportType).toBe('ProfitAndLoss');
      expect(mockXeroClient.accountingApi.getReports).toHaveBeenCalledWith(
        'test-tenant-123',
        'ProfitAndLoss',
        expect.any(Object)
      );
    });

    it('should generate profit and loss report with custom date range', async () => {
      const mockProfitLossData = {
        reports: [{
          reportID: 'ProfitAndLoss',
          reportName: 'Profit and Loss',
          reportType: 'ProfitAndLoss',
          reportDate: '31 December 2023',
          rows: []
        }]
      };

      mockXeroClient.accountingApi.getReports.mockResolvedValue(mockProfitLossData);

      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123',
        fromDate: '2023-01-01',
        toDate: '2023-12-31'
      });

      expect(result.success).toBe(true);
      expect(mockXeroClient.accountingApi.getReports).toHaveBeenCalledWith(
        'test-tenant-123',
        'ProfitAndLoss',
        expect.objectContaining({
          fromDate: '2023-01-01',
          toDate: '2023-12-31'
        })
      );
    });

    it('should handle profit and loss report API errors gracefully', async () => {
      const apiError = new XeroApiError(
        400,
        'Bad Request',
        { type: 'ValidationException', message: 'Invalid date range' }
      );

      mockXeroClient.accountingApi.getReports.mockRejectedValue(apiError);

      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123',
        fromDate: 'invalid-date'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ValidationException');
      expect(result.error).toContain('Invalid date range');
    });
  });

  describe('Balance Sheet Report', () => {
    it('should generate balance sheet report successfully', async () => {
      const mockBalanceSheetData = {
        reports: [{
          reportID: 'BalanceSheet',
          reportName: 'Balance Sheet',
          reportType: 'BalanceSheet',
          reportDate: '31 October 2024',
          rows: [
            {
              rowType: 'Section',
              title: 'Assets',
              rows: [
                {
                  rowType: 'SummaryRow',
                  cells: [
                    { value: 'Current Assets' },
                    { value: '25000.00' }
                  ]
                }
              ]
            }
          ]
        }]
      };

      mockXeroClient.accountingApi.getReports.mockResolvedValue(mockBalanceSheetData);

      const result = await financialReportsTool.handler({
        reportType: 'balance-sheet',
        tenantId: 'test-tenant-123',
        date: '2024-10-31'
      });

      expect(result.success).toBe(true);
      expect(result.data.reports[0].reportType).toBe('BalanceSheet');
      expect(mockXeroClient.accountingApi.getReports).toHaveBeenCalledWith(
        'test-tenant-123',
        'BalanceSheet',
        expect.objectContaining({ date: '2024-10-31' })
      );
    });

    it('should use current date when no date specified for balance sheet', async () => {
      const mockBalanceSheetData = {
        reports: [{
          reportID: 'BalanceSheet',
          reportName: 'Balance Sheet',
          reportType: 'BalanceSheet',
          rows: []
        }]
      };

      mockXeroClient.accountingApi.getReports.mockResolvedValue(mockBalanceSheetData);

      const result = await financialReportsTool.handler({
        reportType: 'balance-sheet',
        tenantId: 'test-tenant-123'
      });

      expect(result.success).toBe(true);
      expect(mockXeroClient.accountingApi.getReports).toHaveBeenCalledWith(
        'test-tenant-123',
        'BalanceSheet',
        expect.objectContaining({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
        })
      );
    });
  });

  describe('Cash Flow Report', () => {
    it('should generate cash flow report with quarterly periods', async () => {
      const mockCashFlowData = {
        reports: [{
          reportID: 'CashFlow',
          reportName: 'Cash Flow',
          reportType: 'CashFlow',
          reportDate: '31 October 2024',
          rows: [
            {
              rowType: 'Section',
              title: 'Operating Activities',
              rows: [
                {
                  rowType: 'Row',
                  cells: [
                    { value: 'Net Cash from Operating Activities' },
                    { value: '12000.00' }
                  ]
                }
              ]
            }
          ]
        }]
      };

      mockXeroClient.accountingApi.getReports.mockResolvedValue(mockCashFlowData);

      const result = await financialReportsTool.handler({
        reportType: 'cash-flow',
        tenantId: 'test-tenant-123',
        fromDate: '2024-01-01',
        toDate: '2024-10-31',
        periods: 'QUARTER'
      });

      expect(result.success).toBe(true);
      expect(result.data.reports[0].reportType).toBe('CashFlow');
      expect(mockXeroClient.accountingApi.getReports).toHaveBeenCalledWith(
        'test-tenant-123',
        'CashFlow',
        expect.objectContaining({
          fromDate: '2024-01-01',
          toDate: '2024-10-31',
          periods: 'QUARTER'
        })
      );
    });
  });

  describe('Trial Balance Report', () => {
    it('should generate trial balance report with account details', async () => {
      const mockTrialBalanceData = {
        reports: [{
          reportID: 'TrialBalance',
          reportName: 'Trial Balance',
          reportType: 'TrialBalance',
          reportDate: '31 October 2024',
          rows: [
            {
              rowType: 'Row',
              cells: [
                { value: 'Sales Revenue', attributes: [{ value: '200', id: 'account' }] },
                { value: '0.00' },
                { value: '15000.00' }
              ]
            }
          ]
        }]
      };

      mockXeroClient.accountingApi.getReports.mockResolvedValue(mockTrialBalanceData);

      const result = await financialReportsTool.handler({
        reportType: 'trial-balance',
        tenantId: 'test-tenant-123',
        date: '2024-10-31'
      });

      expect(result.success).toBe(true);
      expect(result.data.reports[0].reportType).toBe('TrialBalance');
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid report type', async () => {
      const result = await financialReportsTool.handler({
        reportType: 'invalid-report',
        tenantId: 'test-tenant-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid report type');
    });

    it('should reject missing tenant ID', async () => {
      const result = await financialReportsTool.handler({
        reportType: 'profit-loss'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tenant ID is required');
    });

    it('should reject invalid date format', async () => {
      const result = await financialReportsTool.handler({
        reportType: 'balance-sheet',
        tenantId: 'test-tenant-123',
        date: 'invalid-date'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });

    it('should reject date range where fromDate is after toDate', async () => {
      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123',
        fromDate: '2024-12-31',
        toDate: '2024-01-01'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('fromDate cannot be after toDate');
    });
  });

  describe('Report Processing', () => {
    it('should calculate financial ratios when requested', async () => {
      const mockProfitLossData = {
        reports: [{
          reportID: 'ProfitAndLoss',
          reportType: 'ProfitAndLoss',
          rows: [
            {
              rowType: 'Section',
              title: 'Revenue',
              rows: [
                {
                  rowType: 'Row',
                  cells: [
                    { value: 'Total Revenue' },
                    { value: '100000.00' }
                  ]
                }
              ]
            },
            {
              rowType: 'Section',
              title: 'Expenses',
              rows: [
                {
                  rowType: 'Row',
                  cells: [
                    { value: 'Total Expenses' },
                    { value: '80000.00' }
                  ]
                }
              ]
            }
          ]
        }]
      };

      mockXeroClient.accountingApi.getReports.mockResolvedValue(mockProfitLossData);

      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123',
        includeRatios: true
      });

      expect(result.success).toBe(true);
      expect(result.data.financialRatios).toBeDefined();
      expect(result.data.financialRatios.grossMargin).toBeDefined();
      expect(result.data.financialRatios.netMargin).toBeDefined();
    });

    it('should format report data for manufacturing analytics', async () => {
      const mockData = {
        reports: [{
          reportID: 'ProfitAndLoss',
          reportType: 'ProfitAndLoss',
          rows: []
        }]
      };

      mockXeroClient.accountingApi.getReports.mockResolvedValue(mockData);

      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123',
        format: 'manufacturing'
      });

      expect(result.success).toBe(true);
      expect(result.data.manufacturingMetrics).toBeDefined();
      expect(result.data.manufacturingMetrics.costOfGoodsSold).toBeDefined();
      expect(result.data.manufacturingMetrics.grossProfit).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';

      mockXeroClient.accountingApi.getReports.mockRejectedValue(timeoutError);

      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      expect(result.retryable).toBe(true);
    });

    it('should handle rate limiting errors with retry information', async () => {
      const rateLimitError = new XeroApiError(
        429,
        'Too Many Requests',
        { type: 'RateLimitException', message: 'Rate limit exceeded' }
      );

      mockXeroClient.accountingApi.getReports.mockRejectedValue(rateLimitError);

      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.retryable).toBe(true);
      expect(result.retryAfter).toBeDefined();
    });

    it('should handle authentication errors', async () => {
      const authError = new XeroApiError(
        401,
        'Unauthorized',
        { type: 'AuthenticationException', message: 'Invalid access token' }
      );

      mockXeroClient.accountingApi.getReports.mockRejectedValue(authError);

      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
      expect(result.requiresReauth).toBe(true);
    });
  });

  describe('Performance Tracking', () => {
    it('should track API call performance metrics', async () => {
      const mockData = {
        reports: [{ reportID: 'ProfitAndLoss', rows: [] }]
      };

      mockXeroClient.accountingApi.getReports.mockResolvedValue(mockData);

      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123'
      });

      expect(result.success).toBe(true);
      expect(result.performance).toBeDefined();
      expect(result.performance.duration).toBeGreaterThan(0);
      expect(result.performance.apiCalls).toBe(1);
    });

    it('should track memory usage for large reports', async () => {
      const largeReportData = {
        reports: [{
          reportID: 'ProfitAndLoss',
          rows: Array.from({ length: 1000 }, (_, i) => ({
            rowType: 'Row',
            cells: [
              { value: `Account ${i}` },
              { value: `${Math.random() * 10000}.00` }
            ]
          }))
        }]
      };

      mockXeroClient.accountingApi.getReports.mockResolvedValue(largeReportData);

      const result = await financialReportsTool.handler({
        reportType: 'profit-loss',
        tenantId: 'test-tenant-123'
      });

      expect(result.success).toBe(true);
      expect(result.performance.memoryUsage).toBeDefined();
      expect(result.performance.memoryUsage.heapUsed).toBeGreaterThan(0);
    });
  });
});