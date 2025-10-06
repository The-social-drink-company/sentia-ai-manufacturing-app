/**
 * Unit Tests for Xero Invoices Tool
 * Comprehensive testing of invoice management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { XeroApiError } from 'xero-node';

// Mock Xero API before importing the module
vi.mock('../../../../src/tools/xero/auth/oauth.js', () => ({
  getXeroClient: vi.fn().mockResolvedValue({
    accountingApi: {
      getInvoices: vi.fn(),
      createInvoice: vi.fn(),
      updateInvoice: vi.fn(),
      getContacts: vi.fn(),
      getInvoice: vi.fn()
    }
  })
}));

describe('Xero Invoices Tool', () => {
  let invoicesTool;
  let mockXeroClient;
  let consoleRestore;

  beforeEach(async () => {
    consoleRestore = global.testUtils.mockConsole();
    
    const { invoices } = await import('../../../../src/tools/xero/tools/invoices.js');
    invoicesTool = invoices;
    
    const { getXeroClient } = await import('../../../../src/tools/xero/auth/oauth.js');
    mockXeroClient = await getXeroClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (consoleRestore) consoleRestore();
  });

  describe('Get Invoices', () => {
    it('should retrieve invoices with default parameters', async () => {
      const mockInvoicesData = {
        invoices: [
          {
            invoiceID: 'inv-001',
            invoiceNumber: 'INV-001',
            type: 'ACCREC',
            status: 'AUTHORISED',
            date: '2024-10-01',
            dueDate: '2024-11-01',
            contact: {
              contactID: 'contact-001',
              name: 'Test Customer'
            },
            lineItems: [
              {
                description: 'Product A',
                quantity: 2,
                unitAmount: 100.00,
                lineAmount: 200.00,
                accountCode: '200'
              }
            ],
            subTotal: 200.00,
            totalTax: 20.00,
            total: 220.00,
            amountDue: 220.00,
            currencyCode: 'USD'
          }
        ]
      };

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue(mockInvoicesData);

      const result = await invoicesTool.handler({
        operation: 'get',
        tenantId: 'test-tenant-123'
      });

      expect(result.success).toBe(true);
      expect(result.data.invoices).toHaveLength(1);
      expect(result.data.invoices[0].invoiceNumber).toBe('INV-001');
      expect(mockXeroClient.accountingApi.getInvoices).toHaveBeenCalledWith(
        'test-tenant-123',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );
    });

    it('should filter invoices by status', async () => {
      const mockInvoicesData = {
        invoices: [
          {
            invoiceID: 'inv-001',
            invoiceNumber: 'INV-001',
            status: 'DRAFT',
            total: 100.00
          }
        ]
      };

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue(mockInvoicesData);

      const result = await invoicesTool.handler({
        operation: 'get',
        tenantId: 'test-tenant-123',
        status: 'DRAFT'
      });

      expect(result.success).toBe(true);
      expect(result.data.invoices[0].status).toBe('DRAFT');
      expect(mockXeroClient.accountingApi.getInvoices).toHaveBeenCalledWith(
        'test-tenant-123',
        undefined,
        undefined,
        undefined,
        'Status=="DRAFT"',
        undefined,
        undefined,
        undefined,
        undefined
      );
    });

    it('should filter invoices by date range', async () => {
      const mockInvoicesData = {
        invoices: [
          {
            invoiceID: 'inv-001',
            invoiceNumber: 'INV-001',
            date: '2024-10-15',
            total: 100.00
          }
        ]
      };

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue(mockInvoicesData);

      const result = await invoicesTool.handler({
        operation: 'get',
        tenantId: 'test-tenant-123',
        fromDate: '2024-10-01',
        toDate: '2024-10-31'
      });

      expect(result.success).toBe(true);
      expect(mockXeroClient.accountingApi.getInvoices).toHaveBeenCalledWith(
        'test-tenant-123',
        undefined,
        '2024-10-01',
        '2024-10-31',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );
    });

    it('should filter invoices by contact', async () => {
      const mockInvoicesData = {
        invoices: [
          {
            invoiceID: 'inv-001',
            contact: {
              contactID: 'contact-123',
              name: 'Specific Customer'
            }
          }
        ]
      };

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue(mockInvoicesData);

      const result = await invoicesTool.handler({
        operation: 'get',
        tenantId: 'test-tenant-123',
        contactId: 'contact-123'
      });

      expect(result.success).toBe(true);
      expect(mockXeroClient.accountingApi.getInvoices).toHaveBeenCalledWith(
        'test-tenant-123',
        undefined,
        undefined,
        undefined,
        'Contact.ContactID=guid("contact-123")',
        undefined,
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe('Create Invoice', () => {
    it('should create a new invoice successfully', async () => {
      const mockCreatedInvoice = {
        invoices: [
          {
            invoiceID: 'inv-new-001',
            invoiceNumber: 'INV-NEW-001',
            type: 'ACCREC',
            status: 'DRAFT',
            contact: {
              contactID: 'contact-001',
              name: 'Test Customer'
            },
            lineItems: [
              {
                description: 'Manufacturing Component A',
                quantity: 5,
                unitAmount: 50.00,
                lineAmount: 250.00,
                accountCode: '200'
              }
            ],
            subTotal: 250.00,
            totalTax: 25.00,
            total: 275.00
          }
        ]
      };

      mockXeroClient.accountingApi.createInvoice.mockResolvedValue(mockCreatedInvoice);

      const result = await invoicesTool.handler({
        operation: 'create',
        tenantId: 'test-tenant-123',
        invoiceData: {
          type: 'ACCREC',
          contactId: 'contact-001',
          date: '2024-10-20',
          dueDate: '2024-11-20',
          lineItems: [
            {
              description: 'Manufacturing Component A',
              quantity: 5,
              unitAmount: 50.00,
              accountCode: '200'
            }
          ]
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.invoices[0].invoiceNumber).toBe('INV-NEW-001');
      expect(result.data.invoices[0].total).toBe(275.00);
      expect(mockXeroClient.accountingApi.createInvoice).toHaveBeenCalledWith(
        'test-tenant-123',
        expect.objectContaining({
          invoices: [expect.objectContaining({
            type: 'ACCREC',
            contact: { contactID: 'contact-001' }
          })]
        }),
        false
      );
    });

    it('should validate required fields when creating invoice', async () => {
      const result = await invoicesTool.handler({
        operation: 'create',
        tenantId: 'test-tenant-123',
        invoiceData: {
          type: 'ACCREC'
          // Missing contactId and lineItems
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('contactId is required');
    });

    it('should validate line items when creating invoice', async () => {
      const result = await invoicesTool.handler({
        operation: 'create',
        tenantId: 'test-tenant-123',
        invoiceData: {
          type: 'ACCREC',
          contactId: 'contact-001',
          lineItems: [
            {
              description: 'Product A'
              // Missing quantity, unitAmount, accountCode
            }
          ]
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Line item validation failed');
    });

    it('should handle duplicate invoice number errors', async () => {
      const duplicateError = new XeroApiError(
        400,
        'Bad Request',
        { 
          type: 'ValidationException', 
          message: 'Invoice number INV-001 is already used by another invoice'
        }
      );

      mockXeroClient.accountingApi.createInvoice.mockRejectedValue(duplicateError);

      const result = await invoicesTool.handler({
        operation: 'create',
        tenantId: 'test-tenant-123',
        invoiceData: {
          type: 'ACCREC',
          contactId: 'contact-001',
          invoiceNumber: 'INV-001',
          lineItems: [
            {
              description: 'Product A',
              quantity: 1,
              unitAmount: 100.00,
              accountCode: '200'
            }
          ]
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invoice number INV-001 is already used');
    });
  });

  describe('Update Invoice', () => {
    it('should update an existing invoice successfully', async () => {
      const mockUpdatedInvoice = {
        invoices: [
          {
            invoiceID: 'inv-001',
            invoiceNumber: 'INV-001',
            status: 'AUTHORISED',
            lineItems: [
              {
                description: 'Updated Manufacturing Component',
                quantity: 10,
                unitAmount: 60.00,
                lineAmount: 600.00
              }
            ],
            total: 660.00
          }
        ]
      };

      mockXeroClient.accountingApi.updateInvoice.mockResolvedValue(mockUpdatedInvoice);

      const result = await invoicesTool.handler({
        operation: 'update',
        tenantId: 'test-tenant-123',
        invoiceId: 'inv-001',
        invoiceData: {
          lineItems: [
            {
              description: 'Updated Manufacturing Component',
              quantity: 10,
              unitAmount: 60.00,
              accountCode: '200'
            }
          ]
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.invoices[0].total).toBe(660.00);
      expect(mockXeroClient.accountingApi.updateInvoice).toHaveBeenCalledWith(
        'test-tenant-123',
        'inv-001',
        expect.objectContaining({
          invoices: [expect.objectContaining({
            invoiceID: 'inv-001'
          })]
        })
      );
    });

    it('should prevent updating authorised invoice line items', async () => {
      const mockInvoiceData = {
        invoices: [
          {
            invoiceID: 'inv-001',
            status: 'AUTHORISED'
          }
        ]
      };

      mockXeroClient.accountingApi.getInvoice.mockResolvedValue(mockInvoiceData);

      const result = await invoicesTool.handler({
        operation: 'update',
        tenantId: 'test-tenant-123',
        invoiceId: 'inv-001',
        invoiceData: {
          lineItems: [
            {
              description: 'New line item',
              quantity: 1,
              unitAmount: 100.00
            }
          ]
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot modify line items of authorised invoice');
    });
  });

  describe('Manufacturing-Specific Features', () => {
    it('should calculate manufacturing cost breakdown', async () => {
      const mockInvoicesData = {
        invoices: [
          {
            invoiceID: 'inv-001',
            lineItems: [
              {
                description: 'Raw Materials - Steel',
                quantity: 100,
                unitAmount: 5.00,
                lineAmount: 500.00,
                itemCode: 'RAW-STEEL-001'
              },
              {
                description: 'Labor - Assembly',
                quantity: 8,
                unitAmount: 25.00,
                lineAmount: 200.00,
                itemCode: 'LABOR-ASSEMBLY'
              },
              {
                description: 'Overhead - Factory',
                quantity: 1,
                unitAmount: 150.00,
                lineAmount: 150.00,
                itemCode: 'OVERHEAD-FACTORY'
              }
            ],
            total: 850.00
          }
        ]
      };

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue(mockInvoicesData);

      const result = await invoicesTool.handler({
        operation: 'get',
        tenantId: 'test-tenant-123',
        analyzeManufacturing: true
      });

      expect(result.success).toBe(true);
      expect(result.data.manufacturingAnalysis).toBeDefined();
      expect(result.data.manufacturingAnalysis.materialCosts).toBe(500.00);
      expect(result.data.manufacturingAnalysis.laborCosts).toBe(200.00);
      expect(result.data.manufacturingAnalysis.overheadCosts).toBe(150.00);
      expect(result.data.manufacturingAnalysis.totalCosts).toBe(850.00);
    });

    it('should identify overdue manufacturing invoices', async () => {
      const mockInvoicesData = {
        invoices: [
          {
            invoiceID: 'inv-001',
            invoiceNumber: 'INV-001',
            status: 'AUTHORISED',
            dueDate: '2024-09-01', // Overdue
            amountDue: 1000.00,
            contact: { name: 'Manufacturing Supplier A' }
          },
          {
            invoiceID: 'inv-002',
            invoiceNumber: 'INV-002',
            status: 'AUTHORISED',
            dueDate: '2024-12-01', // Not overdue
            amountDue: 500.00,
            contact: { name: 'Manufacturing Supplier B' }
          }
        ]
      };

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue(mockInvoicesData);

      const result = await invoicesTool.handler({
        operation: 'get',
        tenantId: 'test-tenant-123',
        includeOverdue: true
      });

      expect(result.success).toBe(true);
      expect(result.data.overdueAnalysis).toBeDefined();
      expect(result.data.overdueAnalysis.overdueInvoices).toHaveLength(1);
      expect(result.data.overdueAnalysis.totalOverdueAmount).toBe(1000.00);
      expect(result.data.overdueAnalysis.overdueInvoices[0].invoiceNumber).toBe('INV-001');
    });

    it('should generate supplier payment schedule', async () => {
      const mockInvoicesData = {
        invoices: [
          {
            invoiceID: 'inv-001',
            dueDate: '2024-11-15',
            amountDue: 2000.00,
            contact: { 
              contactID: 'supplier-001',
              name: 'Steel Supplier Inc' 
            }
          },
          {
            invoiceID: 'inv-002',
            dueDate: '2024-11-30',
            amountDue: 1500.00,
            contact: { 
              contactID: 'supplier-002',
              name: 'Equipment Rental Co' 
            }
          }
        ]
      };

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue(mockInvoicesData);

      const result = await invoicesTool.handler({
        operation: 'get',
        tenantId: 'test-tenant-123',
        generatePaymentSchedule: true
      });

      expect(result.success).toBe(true);
      expect(result.data.paymentSchedule).toBeDefined();
      expect(result.data.paymentSchedule).toHaveLength(2);
      expect(result.data.paymentSchedule[0].dueDate).toBe('2024-11-15');
      expect(result.data.paymentSchedule[0].amount).toBe(2000.00);
      expect(result.data.paymentSchedule[1].dueDate).toBe('2024-11-30');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid invoice ID', async () => {
      const result = await invoicesTool.handler({
        operation: 'update',
        tenantId: 'test-tenant-123',
        invoiceId: 'invalid-id'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid invoice ID format');
    });

    it('should handle contact not found errors', async () => {
      const contactError = new XeroApiError(
        400,
        'Bad Request',
        { 
          type: 'ValidationException', 
          message: 'Contact not found for ContactID: invalid-contact-id'
        }
      );

      mockXeroClient.accountingApi.createInvoice.mockRejectedValue(contactError);

      const result = await invoicesTool.handler({
        operation: 'create',
        tenantId: 'test-tenant-123',
        invoiceData: {
          type: 'ACCREC',
          contactId: 'invalid-contact-id',
          lineItems: [
            {
              description: 'Product A',
              quantity: 1,
              unitAmount: 100.00,
              accountCode: '200'
            }
          ]
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Contact not found');
    });

    it('should handle account code validation errors', async () => {
      const accountError = new XeroApiError(
        400,
        'Bad Request',
        { 
          type: 'ValidationException', 
          message: 'Account code 999 does not exist'
        }
      );

      mockXeroClient.accountingApi.createInvoice.mockRejectedValue(accountError);

      const result = await invoicesTool.handler({
        operation: 'create',
        tenantId: 'test-tenant-123',
        invoiceData: {
          type: 'ACCREC',
          contactId: 'contact-001',
          lineItems: [
            {
              description: 'Product A',
              quantity: 1,
              unitAmount: 100.00,
              accountCode: '999'
            }
          ]
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Account code 999 does not exist');
    });
  });

  describe('Performance and Optimization', () => {
    it('should batch process multiple invoice operations', async () => {
      const mockBatchResult = {
        invoices: [
          { invoiceID: 'inv-001', invoiceNumber: 'INV-001' },
          { invoiceID: 'inv-002', invoiceNumber: 'INV-002' },
          { invoiceID: 'inv-003', invoiceNumber: 'INV-003' }
        ]
      };

      mockXeroClient.accountingApi.createInvoice.mockResolvedValue(mockBatchResult);

      const result = await invoicesTool.handler({
        operation: 'batchCreate',
        tenantId: 'test-tenant-123',
        invoices: [
          {
            type: 'ACCREC',
            contactId: 'contact-001',
            lineItems: [{ description: 'Product A', quantity: 1, unitAmount: 100.00, accountCode: '200' }]
          },
          {
            type: 'ACCREC',
            contactId: 'contact-002',
            lineItems: [{ description: 'Product B', quantity: 2, unitAmount: 50.00, accountCode: '200' }]
          }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.data.invoices).toHaveLength(3);
      expect(result.performance.batchSize).toBe(2);
    });

    it('should cache frequently accessed invoice data', async () => {
      const mockInvoicesData = {
        invoices: [{ invoiceID: 'inv-001', invoiceNumber: 'INV-001' }]
      };

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue(mockInvoicesData);

      // First call
      const result1 = await invoicesTool.handler({
        operation: 'get',
        tenantId: 'test-tenant-123',
        useCache: true
      });

      // Second call should use cache
      const result2 = await invoicesTool.handler({
        operation: 'get',
        tenantId: 'test-tenant-123',
        useCache: true
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.fromCache).toBe(true);
      expect(mockXeroClient.accountingApi.getInvoices).toHaveBeenCalledTimes(1);
    });
  });
});