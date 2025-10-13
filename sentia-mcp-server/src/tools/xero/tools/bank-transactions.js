/**
 * Xero Bank Transactions Tool
 * 
 * Comprehensive bank transaction management tool for retrieving and analyzing
 * bank account transactions with reconciliation status and cash flow metrics.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

/**
 * Bank Transactions Tool Class
 */
export class BankTransactionsTool {
  constructor(xeroIntegration) {
    this.xero = xeroIntegration;
    this.name = 'xero-get-bank-transactions';
    this.description = 'Retrieve and analyze bank transactions with reconciliation tracking and cash flow analysis';
    this.category = 'financial';
    this.cacheEnabled = true;
    this.cacheTTL = 900; // 15 minutes
    this.requiresAuth = true;

    this.inputSchema = {
      type: 'object',
      properties: {
        tenantId: {
          type: 'string',
          description: 'Xero tenant/organization ID',
          minLength: 1
        },
        bankAccountID: {
          type: 'string',
          description: 'Filter by specific bank account ID'
        },
        fromDate: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'Start date for transaction date filter (YYYY-MM-DD)'
        },
        toDate: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'End date for transaction date filter (YYYY-MM-DD)'
        },
        transactionType: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['RECEIVE', 'SPEND', 'TRANSFER-IN', 'TRANSFER-OUT', 'ADJUSTMENT']
          },
          description: 'Filter by transaction types',
          default: ['RECEIVE', 'SPEND']
        },
        reconciliationStatus: {
          type: 'string',
          enum: ['ALL', 'RECONCILED', 'UNRECONCILED'],
          description: 'Filter by reconciliation status',
          default: 'ALL'
        },
        minAmount: {
          type: 'number',
          description: 'Minimum transaction amount filter'
        },
        maxAmount: {
          type: 'number',
          description: 'Maximum transaction amount filter'
        },
        reference: {
          type: 'string',
          description: 'Filter by transaction reference (partial match)'
        },
        description: {
          type: 'string',
          description: 'Filter by transaction description (partial match)'
        },
        contactID: {
          type: 'string',
          description: 'Filter by contact ID'
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
        includeCashFlowAnalysis: {
          type: 'boolean',
          description: 'Include cash flow trend analysis',
          default: true
        },
        includeReconciliationAnalysis: {
          type: 'boolean',
          description: 'Include reconciliation status analysis',
          default: false
        },
        includeCategoryBreakdown: {
          type: 'boolean',
          description: 'Include spending category breakdown',
          default: false
        },
        sortBy: {
          type: 'string',
          enum: ['Date', 'Amount', 'Reference'],
          description: 'Sort transactions by specified field',
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
          description: 'Number of transactions per page',
          default: 50
        },
        exportFormat: {
          type: 'string',
          enum: ['json', 'csv', 'xlsx', 'qif'],
          description: 'Export format',
          default: 'json'
        }
      },
      required: ['tenantId'],
      additionalProperties: false
    };

    logger.info('Bank Transactions Tool initialized');
  }

  /**
   * Execute bank transactions retrieval and analysis
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing bank transactions tool', {
        correlationId,
        tenantId: params.tenantId,
        bankAccountID: params.bankAccountID,
        dateRange: `${params.fromDate || 'auto'} to ${params.toDate || 'auto'}`
      });

      // Set tenant context
      await this.xero.xeroApi.setTokenSet(
        await this.xero.tokenManager.getTokens(params.tenantId)
      );

      // Prepare date range
      const dateRange = this.prepareDateRange(params);

      // Get bank accounts list if needed
      const bankAccounts = await this.getBankAccounts(params.tenantId, correlationId);

      // Build Xero API filters
      const whereClause = this.buildWhereClause(params, dateRange);
      const orderBy = this.buildOrderBy(params);

      // Retrieve transactions from Xero
      const transactionsData = await this.retrieveBankTransactions(
        params,
        whereClause,
        orderBy,
        correlationId
      );

      // Apply additional filtering
      let filteredTransactions = this.applyAdditionalFilters(
        transactionsData.bankTransactions, 
        params
      );

      // Apply pagination
      const paginationResult = this.applyPagination(filteredTransactions, params);
      filteredTransactions = paginationResult.transactions;

      // Enrich with additional data
      const enrichedTransactions = await this.enrichTransactionData(
        filteredTransactions,
        params,
        correlationId
      );

      // Perform analysis
      let analysis = null;
      if (params.includeCashFlowAnalysis || 
          params.includeReconciliationAnalysis || 
          params.includeCategoryBreakdown) {
        analysis = await this.performTransactionAnalysis(
          enrichedTransactions,
          transactionsData.bankTransactions, // Full dataset for analysis
          bankAccounts,
          params,
          correlationId
        );
      }

      // Format response
      const result = await this.formatResponse(
        enrichedTransactions,
        analysis,
        bankAccounts,
        paginationResult.pagination,
        dateRange,
        params
      );

      const executionTime = Date.now() - startTime;

      logger.info('Bank transactions retrieved successfully', {
        correlationId,
        transactionsCount: enrichedTransactions.length,
        totalMatched: paginationResult.pagination.totalItems,
        executionTime,
        hasAnalysis: !!analysis
      });

      return {
        success: true,
        data: result,
        metadata: {
          totalTransactions: paginationResult.pagination.totalItems,
          returnedTransactions: enrichedTransactions.length,
          executionTime,
          correlationId,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Bank transactions execution failed', {
        correlationId,
        error: error.message,
        executionTime
      });

      throw new Error(`Bank transactions retrieval failed: ${error.message}`);
    }
  }

  /**
   * Prepare date range for the transactions
   */
  prepareDateRange(params) {
    let fromDate = params.fromDate;
    let toDate = params.toDate;

    // Set default dates if not provided
    if (!fromDate || !toDate) {
      const today = new Date();
      
      if (!toDate) {
        toDate = today.toISOString().split('T')[0];
      }
      
      if (!fromDate) {
        // Default to 3 months ago
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        fromDate = threeMonthsAgo.toISOString().split('T')[0];
      }
    }

    // Validate date format and order
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format');
    }

    if (fromDateObj > toDateObj) {
      throw new Error('From date must be before to date');
    }

    return {
      fromDate,
      toDate,
      fromDateObj,
      toDateObj
    };
  }

  /**
   * Get bank accounts list
   */
  async getBankAccounts(tenantId, correlationId) {
    try {
      const response = await this.xero.xeroApi.accountingApi.getAccounts(
        tenantId,
        null, // modifiedSince
        'Type=="BANK"',
        'Name ASC'
      );

      return response.body?.accounts || [];

    } catch (error) {
      logger.warn('Failed to retrieve bank accounts', {
        correlationId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Build WHERE clause for Xero API
   */
  buildWhereClause(params, dateRange) {
    const conditions = [];

    // Bank account filter
    if (params.bankAccountID) {
      conditions.push(`BankAccount.AccountID=Guid("${params.bankAccountID}")`);
    }

    // Date range filter
    conditions.push(`Date>=DateTime(${dateRange.fromDate})`);
    conditions.push(`Date<=DateTime(${dateRange.toDate})`);

    // Transaction type filter
    if (params.transactionType && params.transactionType.length > 0) {
      const typeConditions = params.transactionType.map(type => `Type="${type}"`);
      conditions.push(`(${typeConditions.join(' OR ')})`);
    }

    // Contact filter
    if (params.contactID) {
      conditions.push(`Contact.ContactID=Guid("${params.contactID}")`);
    }

    // Amount filters
    if (params.minAmount !== undefined) {
      conditions.push(`Total>=${Math.abs(params.minAmount)}`);
    }
    if (params.maxAmount !== undefined) {
      conditions.push(`Total<=${Math.abs(params.maxAmount)}`);
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
   * Retrieve bank transactions from Xero API
   */
  async retrieveBankTransactions(params, whereClause, orderBy, correlationId) {
    try {
      logger.debug('Retrieving bank transactions from Xero', {
        correlationId,
        whereClause,
        orderBy
      });

      const response = await this.xero.xeroApi.accountingApi.getBankTransactions(
        params.tenantId,
        null, // modifiedSince
        whereClause,
        orderBy,
        null, // page
        null // unitdp
      );

      if (!response || !response.body || !response.body.bankTransactions) {
        throw new Error('Invalid response from Xero API');
      }

      logger.debug('Bank transactions retrieved from Xero', {
        correlationId,
        count: response.body.bankTransactions.length
      });

      return {
        bankTransactions: response.body.bankTransactions,
        pagination: response.body.pagination
      };

    } catch (error) {
      logger.error('Xero API bank transaction retrieval failed', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Apply additional client-side filters
   */
  applyAdditionalFilters(transactions, params) {
    let filtered = [...transactions];

    // Reference filter
    if (params.reference) {
      const referenceLower = params.reference.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.Reference?.toLowerCase().includes(referenceLower)
      );
    }

    // Description filter
    if (params.description) {
      const descriptionLower = params.description.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.LineItems?.some(line =>
          line.Description?.toLowerCase().includes(descriptionLower)
        )
      );
    }

    // Reconciliation status filter
    if (params.reconciliationStatus && params.reconciliationStatus !== 'ALL') {
      const isReconciled = params.reconciliationStatus === 'RECONCILED';
      filtered = filtered.filter(transaction =>
        transaction.IsReconciled === isReconciled
      );
    }

    return filtered;
  }

  /**
   * Apply pagination to results
   */
  applyPagination(transactions, params) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    return {
      transactions: paginatedTransactions,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: transactions.length,
        totalPages: Math.ceil(transactions.length / pageSize),
        hasNextPage: endIndex < transactions.length,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Enrich transaction data with additional information
   */
  async enrichTransactionData(transactions, params, correlationId) {
    try {
      const enrichedTransactions = [];

      for (const transaction of transactions) {
        const enrichedTransaction = { ...transaction };

        // Add calculated fields
        enrichedTransaction.transactionAge = this.calculateTransactionAge(transaction);
        enrichedTransaction.cashFlowDirection = this.determineCashFlowDirection(transaction);
        enrichedTransaction.transactionCategory = this.categorizeTransaction(transaction);

        // Include attachments if requested
        if (params.includeAttachments && transaction.BankTransactionID) {
          try {
            const attachments = await this.getTransactionAttachments(
              params.tenantId,
              transaction.BankTransactionID,
              correlationId
            );
            enrichedTransaction.attachments = attachments;
          } catch (error) {
            logger.debug('No attachments found for transaction', {
              correlationId,
              transactionID: transaction.BankTransactionID
            });
            enrichedTransaction.attachments = [];
          }
        }

        enrichedTransactions.push(enrichedTransaction);
      }

      return enrichedTransactions;

    } catch (error) {
      logger.error('Transaction enrichment failed', {
        correlationId,
        error: error.message
      });
      // Return original transactions if enrichment fails
      return transactions;
    }
  }

  /**
   * Calculate transaction age in days
   */
  calculateTransactionAge(transaction) {
    if (!transaction.DateString) return null;
    
    const transactionDate = new Date(transaction.DateString);
    const today = new Date();
    
    return Math.floor((today - transactionDate) / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine cash flow direction
   */
  determineCashFlowDirection(transaction) {
    const type = transaction.Type;
    const total = parseFloat(transaction.Total || 0);

    switch (type) {
      case 'RECEIVE':
      case 'TRANSFER-IN':
        return 'INFLOW';
      case 'SPEND':
      case 'TRANSFER-OUT':
        return 'OUTFLOW';
      case 'ADJUSTMENT':
        return total >= 0 ? 'INFLOW' : 'OUTFLOW';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Categorize transaction based on line items
   */
  categorizeTransaction(transaction) {
    if (!transaction.LineItems || transaction.LineItems.length === 0) {
      return 'Uncategorized';
    }

    // Get the account code from the first line item
    const firstLineItem = transaction.LineItems[0];
    const accountCode = firstLineItem.AccountCode;
    
    // Basic categorization based on common account codes
    if (accountCode) {
      if (accountCode.startsWith('4')) return 'Revenue';
      if (accountCode.startsWith('5')) return 'Expenses';
      if (accountCode.startsWith('6')) return 'Operating Expenses';
      if (accountCode.startsWith('7')) return 'Other Expenses';
      if (accountCode.startsWith('8')) return 'Other Income';
    }

    // Categorize based on description
    const description = firstLineItem.Description?.toLowerCase() || '';
    
    if (description.includes('salary') || description.includes('wage')) {
      return 'Payroll';
    }
    if (description.includes('rent') || description.includes('lease')) {
      return 'Rent & Utilities';
    }
    if (description.includes('office') || description.includes('supply')) {
      return 'Office Expenses';
    }
    if (description.includes('travel') || description.includes('fuel')) {
      return 'Travel & Vehicle';
    }
    if (description.includes('marketing') || description.includes('advertising')) {
      return 'Marketing';
    }

    return 'General';
  }

  /**
   * Get attachments for a transaction
   */
  async getTransactionAttachments(tenantId, transactionID, correlationId) {
    try {
      const response = await this.xero.xeroApi.accountingApi.getBankTransactionAttachments(
        tenantId,
        transactionID
      );

      return response.body?.attachments || [];

    } catch (error) {
      logger.debug('Attachment retrieval failed', {
        correlationId,
        transactionID,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Perform transaction analysis
   */
  async performTransactionAnalysis(transactions, allTransactions, bankAccounts, params, correlationId) {
    const analysis = {};

    try {
      // Cash flow analysis
      if (params.includeCashFlowAnalysis) {
        analysis.cashFlow = this.analyzeCashFlow(allTransactions);
      }

      // Reconciliation analysis
      if (params.includeReconciliationAnalysis) {
        analysis.reconciliation = this.analyzeReconciliation(allTransactions);
      }

      // Category breakdown
      if (params.includeCategoryBreakdown) {
        analysis.categoryBreakdown = this.analyzeCategoryBreakdown(allTransactions);
      }

      // Account summary
      analysis.accountSummary = this.analyzeAccountSummary(allTransactions, bankAccounts);

      // Summary statistics
      analysis.summary = this.calculateTransactionSummary(allTransactions);

      logger.debug('Transaction analysis completed', {
        correlationId,
        analysisKeys: Object.keys(analysis)
      });

      return analysis;

    } catch (error) {
      logger.warn('Transaction analysis failed', {
        correlationId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Analyze cash flow patterns
   */
  analyzeCashFlow(transactions) {
    const cashFlow = {
      totalInflow: 0,
      totalOutflow: 0,
      netCashFlow: 0,
      inflowTransactions: 0,
      outflowTransactions: 0,
      dailyTrends: {},
      monthlyTrends: {},
      largestTransactions: {
        inflow: null,
        outflow: null
      }
    };

    let largestInflow = 0;
    let largestOutflow = 0;

    for (const transaction of transactions) {
      const amount = Math.abs(parseFloat(transaction.Total || 0));
      const direction = this.determineCashFlowDirection(transaction);
      const date = transaction.DateString;

      if (direction === 'INFLOW') {
        cashFlow.totalInflow += amount;
        cashFlow.inflowTransactions++;
        
        if (amount > largestInflow) {
          largestInflow = amount;
          cashFlow.largestTransactions.inflow = transaction;
        }
      } else if (direction === 'OUTFLOW') {
        cashFlow.totalOutflow += amount;
        cashFlow.outflowTransactions++;
        
        if (amount > largestOutflow) {
          largestOutflow = amount;
          cashFlow.largestTransactions.outflow = transaction;
        }
      }

      // Daily trends
      if (date) {
        if (!cashFlow.dailyTrends[date]) {
          cashFlow.dailyTrends[date] = { inflow: 0, outflow: 0, net: 0 };
        }
        
        if (direction === 'INFLOW') {
          cashFlow.dailyTrends[date].inflow += amount;
        } else if (direction === 'OUTFLOW') {
          cashFlow.dailyTrends[date].outflow += amount;
        }
        
        cashFlow.dailyTrends[date].net = 
          cashFlow.dailyTrends[date].inflow - cashFlow.dailyTrends[date].outflow;

        // Monthly trends
        const month = date.substring(0, 7); // YYYY-MM
        if (!cashFlow.monthlyTrends[month]) {
          cashFlow.monthlyTrends[month] = { inflow: 0, outflow: 0, net: 0 };
        }
        
        if (direction === 'INFLOW') {
          cashFlow.monthlyTrends[month].inflow += amount;
        } else if (direction === 'OUTFLOW') {
          cashFlow.monthlyTrends[month].outflow += amount;
        }
        
        cashFlow.monthlyTrends[month].net = 
          cashFlow.monthlyTrends[month].inflow - cashFlow.monthlyTrends[month].outflow;
      }
    }

    cashFlow.netCashFlow = cashFlow.totalInflow - cashFlow.totalOutflow;

    return cashFlow;
  }

  /**
   * Analyze reconciliation status
   */
  analyzeReconciliation(transactions) {
    const reconciliation = {
      reconciled: 0,
      unreconciled: 0,
      reconciledAmount: 0,
      unreconciledAmount: 0,
      percentageReconciled: 0,
      oldestUnreconciled: null
    };

    let oldestUnreconciledDate = null;

    for (const transaction of transactions) {
      const amount = Math.abs(parseFloat(transaction.Total || 0));
      const transactionDate = new Date(transaction.DateString);

      if (transaction.IsReconciled) {
        reconciliation.reconciled++;
        reconciliation.reconciledAmount += amount;
      } else {
        reconciliation.unreconciled++;
        reconciliation.unreconciledAmount += amount;
        
        if (!oldestUnreconciledDate || transactionDate < oldestUnreconciledDate) {
          oldestUnreconciledDate = transactionDate;
          reconciliation.oldestUnreconciled = transaction;
        }
      }
    }

    const totalTransactions = reconciliation.reconciled + reconciliation.unreconciled;
    reconciliation.percentageReconciled = totalTransactions > 0 
      ? (reconciliation.reconciled / totalTransactions) * 100 
      : 0;

    return reconciliation;
  }

  /**
   * Analyze spending by category
   */
  analyzeCategoryBreakdown(transactions) {
    const breakdown = {};

    for (const transaction of transactions) {
      const category = this.categorizeTransaction(transaction);
      const amount = Math.abs(parseFloat(transaction.Total || 0));
      const direction = this.determineCashFlowDirection(transaction);

      if (!breakdown[category]) {
        breakdown[category] = {
          inflow: 0,
          outflow: 0,
          net: 0,
          transactionCount: 0
        };
      }

      breakdown[category].transactionCount++;

      if (direction === 'INFLOW') {
        breakdown[category].inflow += amount;
      } else if (direction === 'OUTFLOW') {
        breakdown[category].outflow += amount;
      }

      breakdown[category].net = breakdown[category].inflow - breakdown[category].outflow;
    }

    return breakdown;
  }

  /**
   * Analyze transactions by bank account
   */
  analyzeAccountSummary(transactions, bankAccounts) {
    const accountSummary = {};

    // Initialize with bank accounts
    for (const account of bankAccounts) {
      accountSummary[account.AccountID] = {
        accountName: account.Name,
        accountCode: account.Code,
        balance: account.BankAccountNumber ? parseFloat(account.BankAccountNumber) : 0,
        inflow: 0,
        outflow: 0,
        net: 0,
        transactionCount: 0
      };
    }

    // Process transactions
    for (const transaction of transactions) {
      const accountID = transaction.BankAccount?.AccountID;
      if (!accountID) continue;

      if (!accountSummary[accountID]) {
        accountSummary[accountID] = {
          accountName: transaction.BankAccount.Name || 'Unknown',
          accountCode: transaction.BankAccount.Code || '',
          balance: 0,
          inflow: 0,
          outflow: 0,
          net: 0,
          transactionCount: 0
        };
      }

      const amount = Math.abs(parseFloat(transaction.Total || 0));
      const direction = this.determineCashFlowDirection(transaction);

      accountSummary[accountID].transactionCount++;

      if (direction === 'INFLOW') {
        accountSummary[accountID].inflow += amount;
      } else if (direction === 'OUTFLOW') {
        accountSummary[accountID].outflow += amount;
      }

      accountSummary[accountID].net = 
        accountSummary[accountID].inflow - accountSummary[accountID].outflow;
    }

    return accountSummary;
  }

  /**
   * Calculate summary statistics
   */
  calculateTransactionSummary(transactions) {
    const summary = {
      totalTransactions: transactions.length,
      totalAmount: 0,
      averageTransactionAmount: 0,
      typeBreakdown: {},
      statusBreakdown: {
        reconciled: 0,
        unreconciled: 0
      }
    };

    let totalAmount = 0;

    for (const transaction of transactions) {
      const amount = Math.abs(parseFloat(transaction.Total || 0));
      totalAmount += amount;

      // Type breakdown
      const type = transaction.Type;
      summary.typeBreakdown[type] = (summary.typeBreakdown[type] || 0) + 1;

      // Status breakdown
      if (transaction.IsReconciled) {
        summary.statusBreakdown.reconciled++;
      } else {
        summary.statusBreakdown.unreconciled++;
      }
    }

    summary.totalAmount = totalAmount;
    summary.averageTransactionAmount = transactions.length > 0 
      ? totalAmount / transactions.length 
      : 0;

    return summary;
  }

  /**
   * Format the final response
   */
  async formatResponse(transactions, analysis, bankAccounts, pagination, dateRange, params) {
    const response = {
      transactions,
      pagination,
      bankAccounts,
      filters: {
        dateRange,
        bankAccountID: params.bankAccountID,
        transactionType: params.transactionType,
        reconciliationStatus: params.reconciliationStatus
      }
    };

    if (analysis) {
      response.analysis = analysis;
    }

    // Handle export formats
    if (params.exportFormat === 'csv') {
      response.csvData = await this.convertToCSV(transactions);
    } else if (params.exportFormat === 'xlsx') {
      response.excelData = await this.convertToExcel(transactions);
    } else if (params.exportFormat === 'qif') {
      response.qifData = await this.convertToQIF(transactions);
    }

    return response;
  }

  /**
   * Convert transactions to CSV format
   */
  async convertToCSV(transactions) {
    const headers = [
      'Date', 'Reference', 'Description', 'Type', 'Amount', 'Bank Account',
      'Contact', 'Is Reconciled', 'Category'
    ];

    const rows = transactions.map(transaction => [
      transaction.DateString || '',
      transaction.Reference || '',
      transaction.LineItems?.[0]?.Description || '',
      transaction.Type || '',
      transaction.Total || 0,
      transaction.BankAccount?.Name || '',
      transaction.Contact?.Name || '',
      transaction.IsReconciled || false,
      transaction.transactionCategory || 'Uncategorized'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert transactions to Excel format
   */
  async convertToExcel(transactions) {
    // Implementation would create Excel file
    // This is a placeholder
    return 'Excel export placeholder';
  }

  /**
   * Convert transactions to QIF format
   */
  async convertToQIF(transactions) {
    const qifLines = ['!Type:Bank', ''];

    for (const transaction of transactions) {
      qifLines.push(`D${transaction.DateString}`);
      qifLines.push(`T${transaction.Total}`);
      qifLines.push(`P${transaction.Contact?.Name || ''}`);
      qifLines.push(`M${transaction.LineItems?.[0]?.Description || ''}`);
      qifLines.push(`N${transaction.Reference || ''}`);
      qifLines.push(`C${transaction.IsReconciled ? 'X' : ''}`);
      qifLines.push('^'); // End of transaction marker
    }

    return qifLines.join('\n');
  }
}