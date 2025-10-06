/**
 * Xero Invoices Management Tool
 * 
 * Comprehensive invoice management tool for retrieving, filtering, and analyzing
 * invoices with payment status tracking and aging analysis.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

/**
 * Invoices Tool Class
 */
export class InvoicesTool {
  constructor(xeroIntegration) {
    this.xero = xeroIntegration;
    this.name = 'xero-get-invoices';
    this.description = 'Retrieve and analyze invoices with advanced filtering, payment tracking, and aging analysis';
    this.category = 'financial';
    this.cacheEnabled = true;
    this.cacheTTL = 600; // 10 minutes
    this.requiresAuth = true;

    this.inputSchema = {
      type: 'object',
      properties: {
        tenantId: {
          type: 'string',
          description: 'Xero tenant/organization ID',
          minLength: 1
        },
        invoiceType: {
          type: 'string',
          enum: ['ACCREC', 'ACCPAY'],
          description: 'Invoice type: ACCREC (receivable/sales) or ACCPAY (payable/bills)',
          default: 'ACCREC'
        },
        status: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['DRAFT', 'SUBMITTED', 'AUTHORISED', 'PAID', 'VOIDED', 'DELETED']
          },
          description: 'Filter by invoice status (can select multiple)',
          default: ['AUTHORISED', 'PAID']
        },
        contactID: {
          type: 'string',
          description: 'Filter by specific contact/customer ID'
        },
        contactName: {
          type: 'string',
          description: 'Filter by contact name (partial match)'
        },
        fromDate: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'Start date for invoice date filter (YYYY-MM-DD)'
        },
        toDate: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'End date for invoice date filter (YYYY-MM-DD)'
        },
        dueDateFrom: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'Start date for due date filter (YYYY-MM-DD)'
        },
        dueDateTo: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'End date for due date filter (YYYY-MM-DD)'
        },
        minAmount: {
          type: 'number',
          minimum: 0,
          description: 'Minimum invoice amount filter'
        },
        maxAmount: {
          type: 'number',
          minimum: 0,
          description: 'Maximum invoice amount filter'
        },
        overdueOnly: {
          type: 'boolean',
          description: 'Show only overdue invoices',
          default: false
        },
        includePayments: {
          type: 'boolean',
          description: 'Include payment details for each invoice',
          default: true
        },
        includeLineItems: {
          type: 'boolean',
          description: 'Include detailed line items',
          default: false
        },
        includeAttachments: {
          type: 'boolean',
          description: 'Include attachment information',
          default: false
        },
        includeAgingAnalysis: {
          type: 'boolean',
          description: 'Include receivables aging analysis',
          default: true
        },
        includePaymentAnalysis: {
          type: 'boolean',
          description: 'Include payment pattern analysis',
          default: false
        },
        sortBy: {
          type: 'string',
          enum: ['InvoiceNumber', 'Date', 'DueDate', 'Total', 'Contact'],
          description: 'Sort invoices by specified field',
          default: 'Date'
        },
        sortOrder: {
          type: 'string',
          enum: ['ASC', 'DESC'],
          description: 'Sort order',
          default: 'DESC'
        },
        page: {
          type: 'integer',
          minimum: 1,
          description: 'Page number for pagination',
          default: 1
        },
        pageSize: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description: 'Number of invoices per page',
          default: 50
        },
        exportFormat: {
          type: 'string',
          enum: ['json', 'csv', 'xlsx'],
          description: 'Export format',
          default: 'json'
        }
      },
      required: ['tenantId'],
      additionalProperties: false
    };

    logger.info('Invoices Tool initialized');
  }

  /**
   * Execute invoice retrieval and analysis
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing invoices tool', {
        correlationId,
        invoiceType: params.invoiceType,
        tenantId: params.tenantId,
        overdueOnly: params.overdueOnly
      });

      // Set tenant context
      await this.xero.xeroApi.setTokenSet(
        await this.xero.tokenManager.getTokens(params.tenantId)
      );

      // Build Xero API filters
      const whereClause = this.buildWhereClause(params);
      const orderBy = this.buildOrderBy(params);

      // Retrieve invoices from Xero
      const invoicesData = await this.retrieveInvoices(
        params,
        whereClause,
        orderBy,
        correlationId
      );

      // Apply additional filtering
      let filteredInvoices = this.applyAdditionalFilters(invoicesData.invoices, params);

      // Apply pagination
      const paginationResult = this.applyPagination(filteredInvoices, params);
      filteredInvoices = paginationResult.invoices;

      // Enrich with additional data
      const enrichedInvoices = await this.enrichInvoiceData(
        filteredInvoices,
        params,
        correlationId
      );

      // Perform analysis
      let analysis = null;
      if (params.includeAgingAnalysis || params.includePaymentAnalysis) {
        analysis = await this.performInvoiceAnalysis(
          enrichedInvoices,
          params,
          correlationId
        );
      }

      // Format response
      const result = await this.formatResponse(
        enrichedInvoices,
        analysis,
        paginationResult.pagination,
        params
      );

      const executionTime = Date.now() - startTime;

      logger.info('Invoices retrieved successfully', {
        correlationId,
        invoicesCount: enrichedInvoices.length,
        totalMatched: paginationResult.pagination.totalItems,
        executionTime,
        hasAnalysis: !!analysis
      });

      return {
        success: true,
        data: result,
        metadata: {
          totalInvoices: paginationResult.pagination.totalItems,
          returnedInvoices: enrichedInvoices.length,
          executionTime,
          correlationId,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Invoices execution failed', {
        correlationId,
        error: error.message,
        executionTime
      });

      throw new Error(`Invoices retrieval failed: ${error.message}`);
    }
  }

  /**
   * Build WHERE clause for Xero API
   */
  buildWhereClause(params) {
    const conditions = [];

    // Invoice type
    if (params.invoiceType) {
      conditions.push(`Type="${params.invoiceType}"`);
    }

    // Status filter
    if (params.status && params.status.length > 0) {
      const statusConditions = params.status.map(status => `Status="${status}"`);
      conditions.push(`(${statusConditions.join(' OR ')})`);
    }

    // Contact filter
    if (params.contactID) {
      conditions.push(`Contact.ContactID=Guid("${params.contactID}")`);
    }

    // Date filters
    if (params.fromDate) {
      conditions.push(`Date>=DateTime(${params.fromDate})`);
    }
    if (params.toDate) {
      conditions.push(`Date<=DateTime(${params.toDate})`);
    }

    // Due date filters
    if (params.dueDateFrom) {
      conditions.push(`DueDate>=DateTime(${params.dueDateFrom})`);
    }
    if (params.dueDateTo) {
      conditions.push(`DueDate<=DateTime(${params.dueDateTo})`);
    }

    // Amount filters
    if (params.minAmount !== undefined) {
      conditions.push(`Total>=${params.minAmount}`);
    }
    if (params.maxAmount !== undefined) {
      conditions.push(`Total<=${params.maxAmount}`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : null;
  }

  /**
   * Build ORDER BY clause for Xero API
   */
  buildOrderBy(params) {
    const field = params.sortBy || 'Date';
    const order = params.sortOrder || 'DESC';
    return `${field} ${order}`;
  }

  /**
   * Retrieve invoices from Xero API
   */
  async retrieveInvoices(params, whereClause, orderBy, correlationId) {
    try {
      const apiParams = {
        where: whereClause,
        order: orderBy,
        includeArchived: false
      };

      logger.debug('Retrieving invoices from Xero', {
        correlationId,
        whereClause,
        orderBy
      });

      const response = await this.xero.xeroApi.accountingApi.getInvoices(
        params.tenantId,
        null, // modifiedSince
        apiParams.where,
        apiParams.order,
        null, // IDs
        null, // invoiceNumbers
        null, // contactIDs
        null, // statuses
        apiParams.includeArchived
      );

      if (!response || !response.body || !response.body.invoices) {
        throw new Error('Invalid response from Xero API');
      }

      logger.debug('Invoices retrieved from Xero', {
        correlationId,
        count: response.body.invoices.length
      });

      return {
        invoices: response.body.invoices,
        pagination: response.body.pagination
      };

    } catch (error) {
      logger.error('Xero API invoice retrieval failed', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Apply additional client-side filters
   */
  applyAdditionalFilters(invoices, params) {
    let filtered = [...invoices];

    // Contact name filter (partial match)
    if (params.contactName) {
      const contactNameLower = params.contactName.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.Contact?.Name?.toLowerCase().includes(contactNameLower)
      );
    }

    // Overdue filter
    if (params.overdueOnly) {
      const today = new Date();
      filtered = filtered.filter(invoice => {
        if (invoice.Status === 'PAID') return false;
        const dueDate = new Date(invoice.DueDateString || invoice.DateString);
        return dueDate < today;
      });
    }

    return filtered;
  }

  /**
   * Apply pagination to results
   */
  applyPagination(invoices, params) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedInvoices = invoices.slice(startIndex, endIndex);

    return {
      invoices: paginatedInvoices,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: invoices.length,
        totalPages: Math.ceil(invoices.length / pageSize),
        hasNextPage: endIndex < invoices.length,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Enrich invoice data with additional information
   */
  async enrichInvoiceData(invoices, params, correlationId) {
    try {
      const enrichedInvoices = [];

      for (const invoice of invoices) {
        const enrichedInvoice = { ...invoice };

        // Add calculated fields
        enrichedInvoice.amountDue = this.calculateAmountDue(invoice);
        enrichedInvoice.daysPastDue = this.calculateDaysPastDue(invoice);
        enrichedInvoice.paymentStatus = this.determinePaymentStatus(invoice);

        // Include payment details if requested
        if (params.includePayments && invoice.InvoiceID) {
          try {
            const payments = await this.getInvoicePayments(
              params.tenantId,
              invoice.InvoiceID,
              correlationId
            );
            enrichedInvoice.payments = payments;
          } catch (error) {
            logger.warn('Failed to retrieve payments for invoice', {
              correlationId,
              invoiceID: invoice.InvoiceID,
              error: error.message
            });
            enrichedInvoice.payments = [];
          }
        }

        // Include line items if requested
        if (params.includeLineItems && invoice.LineItems) {
          enrichedInvoice.lineItems = invoice.LineItems.map(item => ({
            ...item,
            lineTotal: (item.Quantity || 1) * (item.UnitAmount || 0)
          }));
        }

        // Include attachments if requested
        if (params.includeAttachments && invoice.InvoiceID) {
          try {
            const attachments = await this.getInvoiceAttachments(
              params.tenantId,
              invoice.InvoiceID,
              correlationId
            );
            enrichedInvoice.attachments = attachments;
          } catch (error) {
            logger.debug('No attachments found for invoice', {
              correlationId,
              invoiceID: invoice.InvoiceID
            });
            enrichedInvoice.attachments = [];
          }
        }

        enrichedInvoices.push(enrichedInvoice);
      }

      return enrichedInvoices;

    } catch (error) {
      logger.error('Invoice enrichment failed', {
        correlationId,
        error: error.message
      });
      // Return original invoices if enrichment fails
      return invoices;
    }
  }

  /**
   * Calculate amount due for an invoice
   */
  calculateAmountDue(invoice) {
    if (invoice.Status === 'PAID') return 0;
    
    const total = parseFloat(invoice.Total || 0);
    const amountPaid = parseFloat(invoice.AmountPaid || 0);
    
    return Math.max(0, total - amountPaid);
  }

  /**
   * Calculate days past due for an invoice
   */
  calculateDaysPastDue(invoice) {
    if (invoice.Status === 'PAID') return 0;
    
    const today = new Date();
    const dueDate = new Date(invoice.DueDateString || invoice.DateString);
    
    if (dueDate >= today) return 0;
    
    return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine payment status
   */
  determinePaymentStatus(invoice) {
    if (invoice.Status === 'PAID') {
      return 'Paid';
    }
    
    const daysPastDue = this.calculateDaysPastDue(invoice);
    
    if (daysPastDue === 0) {
      return 'Current';
    } else if (daysPastDue <= 30) {
      return 'Overdue (1-30 days)';
    } else if (daysPastDue <= 60) {
      return 'Overdue (31-60 days)';
    } else if (daysPastDue <= 90) {
      return 'Overdue (61-90 days)';
    } else {
      return 'Overdue (90+ days)';
    }
  }

  /**
   * Get payment details for an invoice
   */
  async getInvoicePayments(tenantId, invoiceID, correlationId) {
    try {
      const response = await this.xero.xeroApi.accountingApi.getPayments(
        tenantId,
        null, // modifiedSince
        `Invoice.InvoiceID=Guid("${invoiceID}")`
      );

      return response.body?.payments || [];

    } catch (error) {
      logger.debug('Payment retrieval failed', {
        correlationId,
        invoiceID,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get attachments for an invoice
   */
  async getInvoiceAttachments(tenantId, invoiceID, correlationId) {
    try {
      const response = await this.xero.xeroApi.accountingApi.getInvoiceAttachments(
        tenantId,
        invoiceID
      );

      return response.body?.attachments || [];

    } catch (error) {
      logger.debug('Attachment retrieval failed', {
        correlationId,
        invoiceID,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Perform invoice analysis
   */
  async performInvoiceAnalysis(invoices, params, correlationId) {
    const analysis = {};

    try {
      // Aging analysis for receivables
      if (params.includeAgingAnalysis && params.invoiceType === 'ACCREC') {
        analysis.agingAnalysis = this.xero.analytics.analyzeReceivablesAging(invoices);
      }

      // Payment pattern analysis
      if (params.includePaymentAnalysis) {
        analysis.paymentPatterns = this.analyzePaymentPatterns(invoices);
      }

      // Summary statistics
      analysis.summary = this.calculateSummaryStatistics(invoices);

      logger.debug('Invoice analysis completed', {
        correlationId,
        analysisKeys: Object.keys(analysis)
      });

      return analysis;

    } catch (error) {
      logger.warn('Invoice analysis failed', {
        correlationId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Analyze payment patterns
   */
  analyzePaymentPatterns(invoices) {
    const patterns = {
      averagePaymentTime: 0,
      onTimePayments: 0,
      latePayments: 0,
      paymentTrends: []
    };

    const paidInvoices = invoices.filter(inv => inv.Status === 'PAID');
    
    if (paidInvoices.length === 0) {
      return patterns;
    }

    let totalPaymentDays = 0;
    let onTimeCount = 0;

    for (const invoice of paidInvoices) {
      const dueDate = new Date(invoice.DueDateString);
      const paidDate = new Date(invoice.FullyPaidOnDate || invoice.UpdatedDateUTC);
      const paymentDays = Math.floor((paidDate - dueDate) / (1000 * 60 * 60 * 24));
      
      totalPaymentDays += paymentDays;
      
      if (paymentDays <= 0) {
        onTimeCount++;
      }
    }

    patterns.averagePaymentTime = totalPaymentDays / paidInvoices.length;
    patterns.onTimePayments = onTimeCount;
    patterns.latePayments = paidInvoices.length - onTimeCount;

    return patterns;
  }

  /**
   * Calculate summary statistics
   */
  calculateSummaryStatistics(invoices) {
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: 0,
      totalAmountDue: 0,
      averageInvoiceAmount: 0,
      statusBreakdown: {},
      currencyBreakdown: {}
    };

    for (const invoice of invoices) {
      const amount = parseFloat(invoice.Total || 0);
      const amountDue = this.calculateAmountDue(invoice);
      
      summary.totalAmount += amount;
      summary.totalAmountDue += amountDue;

      // Status breakdown
      const status = invoice.Status;
      summary.statusBreakdown[status] = (summary.statusBreakdown[status] || 0) + 1;

      // Currency breakdown
      const currency = invoice.CurrencyCode || 'UNKNOWN';
      if (!summary.currencyBreakdown[currency]) {
        summary.currencyBreakdown[currency] = { count: 0, amount: 0 };
      }
      summary.currencyBreakdown[currency].count++;
      summary.currencyBreakdown[currency].amount += amount;
    }

    summary.averageInvoiceAmount = summary.totalInvoices > 0 
      ? summary.totalAmount / summary.totalInvoices 
      : 0;

    return summary;
  }

  /**
   * Format the final response
   */
  async formatResponse(invoices, analysis, pagination, params) {
    const response = {
      invoices,
      pagination,
      filters: {
        invoiceType: params.invoiceType,
        status: params.status,
        dateRange: {
          from: params.fromDate,
          to: params.toDate
        },
        overdueOnly: params.overdueOnly
      }
    };

    if (analysis) {
      response.analysis = analysis;
    }

    // Handle export formats
    if (params.exportFormat === 'csv') {
      response.csvData = await this.convertToCSV(invoices);
    } else if (params.exportFormat === 'xlsx') {
      response.excelData = await this.convertToExcel(invoices);
    }

    return response;
  }

  /**
   * Convert invoices to CSV format
   */
  async convertToCSV(invoices) {
    const headers = [
      'Invoice Number', 'Contact', 'Date', 'Due Date', 'Status',
      'Total', 'Amount Due', 'Currency', 'Days Past Due'
    ];

    const rows = invoices.map(invoice => [
      invoice.InvoiceNumber || '',
      invoice.Contact?.Name || '',
      invoice.DateString || '',
      invoice.DueDateString || '',
      invoice.Status || '',
      invoice.Total || 0,
      invoice.amountDue || 0,
      invoice.CurrencyCode || '',
      invoice.daysPastDue || 0
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert invoices to Excel format
   */
  async convertToExcel(invoices) {
    // Implementation would create Excel file
    // This is a placeholder
    return 'Excel export placeholder';
  }
}