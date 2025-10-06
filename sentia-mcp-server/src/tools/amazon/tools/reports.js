/**
 * Amazon Reports Management Tool
 * 
 * Comprehensive report generation and retrieval for Amazon marketplace data
 * with automated processing, scheduling, and business intelligence insights.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon Reports Tool Class
 */
export class ReportsTool {
  constructor(authManager, options = {}) {
    this.authManager = authManager;
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5000,
      maxWaitTime: options.maxWaitTime || 300000, // 5 minutes
      includeProcessing: options.includeProcessing !== false,
      ...options
    };

    // Available report types with their specifications
    this.reportTypes = {
      // Settlement Reports
      'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE': {
        name: 'Settlement Report',
        category: 'financial',
        description: 'Financial settlement data including payments, fees, and adjustments',
        marketplaceRequired: true,
        dataStartTime: false
      },
      'GET_V2_SETTLEMENT_REPORT_DATA_XML': {
        name: 'Settlement Report (XML)',
        category: 'financial',
        description: 'Financial settlement data in XML format',
        marketplaceRequired: true,
        dataStartTime: false
      },

      // Inventory Reports
      'GET_MERCHANT_LISTINGS_ALL_DATA': {
        name: 'Inventory Report',
        category: 'inventory',
        description: 'All current listings with inventory and pricing data',
        marketplaceRequired: true,
        dataStartTime: false
      },
      'GET_MERCHANT_LISTINGS_DATA': {
        name: 'Active Listings Report',
        category: 'inventory',
        description: 'Currently active listings only',
        marketplaceRequired: true,
        dataStartTime: false
      },
      'GET_AFN_INVENTORY_DATA': {
        name: 'FBA Inventory Report',
        category: 'inventory',
        description: 'Amazon FBA inventory levels and details',
        marketplaceRequired: true,
        dataStartTime: false
      },

      // Sales Reports
      'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL': {
        name: 'All Orders Report',
        category: 'sales',
        description: 'All orders data by order date',
        marketplaceRequired: true,
        dataStartTime: true
      },
      'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE_GENERAL': {
        name: 'Orders by Last Update',
        category: 'sales',
        description: 'Orders data by last update date',
        marketplaceRequired: true,
        dataStartTime: true
      },

      // Performance Reports
      'GET_SELLER_FEEDBACK_DATA': {
        name: 'Seller Feedback Report',
        category: 'performance',
        description: 'Customer feedback and ratings',
        marketplaceRequired: true,
        dataStartTime: true
      },
      'GET_V1_SELLER_PERFORMANCE_REPORT': {
        name: 'Seller Performance Report',
        category: 'performance',
        description: 'Account health and performance metrics',
        marketplaceRequired: true,
        dataStartTime: false
      }
    };

    // Input schema for MCP
    this.inputSchema = {
      type: 'object',
      properties: {
        marketplaceId: {
          type: 'string',
          enum: ['UK', 'USA', 'EU', 'CANADA', 'A1F83G8C2ARO7P', 'ATVPDKIKX0DER', 'A1PA6795UKMFR9', 'A2EUQ1WTGCTBG2'],
          description: 'Amazon marketplace ID or name'
        },
        reportType: {
          type: 'string',
          enum: Object.keys(this.reportTypes),
          description: 'Type of report to generate or retrieve'
        },
        action: {
          type: 'string',
          enum: ['create', 'list', 'download', 'status'],
          default: 'create',
          description: 'Action to perform (create new report, list existing, download, or check status)'
        },
        reportId: {
          type: 'string',
          description: 'Specific report ID for download or status check'
        },
        dateRange: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' }
          },
          description: 'Date range for time-based reports'
        },
        waitForCompletion: {
          type: 'boolean',
          default: true,
          description: 'Wait for report generation to complete before returning'
        },
        parseData: {
          type: 'boolean',
          default: true,
          description: 'Parse and structure report data (vs. raw file)'
        },
        sandbox: {
          type: 'boolean',
          default: false,
          description: 'Use sandbox environment'
        }
      },
      required: ['marketplaceId']
    };

    logger.info('Amazon Reports Tool initialized', {
      supportedReports: Object.keys(this.reportTypes).length,
      categories: [...new Set(Object.values(this.reportTypes).map(r => r.category))]
    });
  }

  /**
   * Execute reports operation
   */
  async execute(params = {}) {
    const correlationId = `reports-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Executing Amazon reports operation', {
        correlationId,
        params: this.sanitizeParams(params)
      });

      // Validate and normalize parameters
      const normalizedParams = this.validateAndNormalizeParams(params);
      
      // Get authenticated client
      const client = await this.authManager.getClient(normalizedParams.marketplaceId, {
        sandbox: normalizedParams.sandbox,
        correlationId
      });

      let result;
      
      // Execute based on action
      switch (normalizedParams.action) {
        case 'create':
          result = await this.createReport(client, normalizedParams, correlationId);
          break;
        case 'list':
          result = await this.listReports(client, normalizedParams, correlationId);
          break;
        case 'download':
          result = await this.downloadReport(client, normalizedParams, correlationId);
          break;
        case 'status':
          result = await this.getReportStatus(client, normalizedParams, correlationId);
          break;
        default:
          throw new Error(`Unsupported action: ${normalizedParams.action}`);
      }

      logger.info('Amazon reports operation completed', {
        correlationId,
        action: normalizedParams.action,
        success: result.success
      });

      return {
        ...result,
        correlationId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Amazon reports operation failed', {
        correlationId,
        error: error.message,
        stack: error.stack,
        params: this.sanitizeParams(params)
      });

      return {
        success: false,
        error: error.message,
        correlationId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate and normalize input parameters
   */
  validateAndNormalizeParams(params) {
    const normalized = { ...params };

    // Set defaults
    normalized.action = normalized.action || 'create';
    normalized.waitForCompletion = normalized.waitForCompletion !== false;
    normalized.parseData = normalized.parseData !== false;
    normalized.sandbox = normalized.sandbox || false;

    // Validate action-specific requirements
    if (normalized.action === 'create' && !normalized.reportType) {
      throw new Error('reportType is required for create action');
    }

    if ((normalized.action === 'download' || normalized.action === 'status') && !normalized.reportId) {
      throw new Error('reportId is required for download and status actions');
    }

    // Validate report type if provided
    if (normalized.reportType && !this.reportTypes[normalized.reportType]) {
      throw new Error(`Unsupported report type: ${normalized.reportType}`);
    }

    // Set default date range for time-based reports
    if (normalized.action === 'create' && normalized.reportType) {
      const reportSpec = this.reportTypes[normalized.reportType];
      if (reportSpec.dataStartTime && !normalized.dateRange) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
        
        normalized.dateRange = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
      }
    }

    return normalized;
  }

  /**
   * Create a new report
   */
  async createReport(client, params, correlationId) {
    try {
      logger.info('Creating Amazon report', {
        correlationId,
        reportType: params.reportType,
        marketplace: params.marketplaceId
      });

      const reportSpec = this.reportTypes[params.reportType];
      const requestBody = {
        reportType: params.reportType,
        marketplaceIds: [this.getMarketplaceId(params.marketplaceId)]
      };

      // Add date range if required
      if (reportSpec.dataStartTime && params.dateRange) {
        requestBody.dataStartTime = params.dateRange.startDate;
        requestBody.dataEndTime = params.dateRange.endDate;
      }

      // Create the report
      const createResponse = await client.callAPI({
        operation: 'createReport',
        endpoint: 'reports',
        body: requestBody
      });

      const reportId = createResponse.reportId;

      logger.info('Report creation initiated', {
        correlationId,
        reportId,
        reportType: params.reportType
      });

      // If waiting for completion, poll for status
      if (params.waitForCompletion) {
        const completedReport = await this.waitForReportCompletion(client, reportId, correlationId);
        
        // If parsing is requested and report is complete, download and parse
        if (params.parseData && completedReport.processingStatus === 'DONE') {
          const downloadResult = await this.downloadReport(client, {
            ...params,
            reportId,
            parseData: true
          }, correlationId);
          
          return {
            success: true,
            action: 'create',
            report: completedReport,
            data: downloadResult.data,
            parsedData: downloadResult.parsedData
          };
        }

        return {
          success: true,
          action: 'create',
          report: completedReport
        };
      }

      return {
        success: true,
        action: 'create',
        reportId,
        status: 'IN_PROGRESS',
        message: 'Report creation initiated. Use status action to check progress.'
      };

    } catch (error) {
      logger.error('Failed to create report', {
        correlationId,
        reportType: params.reportType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List existing reports
   */
  async listReports(client, params, correlationId) {
    try {
      logger.debug('Listing Amazon reports', {
        correlationId,
        marketplace: params.marketplaceId
      });

      const queryParams = {
        marketplaceIds: [this.getMarketplaceId(params.marketplaceId)]
      };

      // Add report type filter if specified
      if (params.reportType) {
        queryParams.reportTypes = [params.reportType];
      }

      const response = await client.callAPI({
        operation: 'getReports',
        endpoint: 'reports',
        query: queryParams
      });

      const reports = response.reports || [];
      
      // Enrich reports with additional information
      const enrichedReports = reports.map(report => this.enrichReportData(report));

      // Group reports by category and status
      const analytics = this.analyzeReports(enrichedReports);

      return {
        success: true,
        action: 'list',
        summary: {
          totalReports: enrichedReports.length,
          byStatus: analytics.byStatus,
          byCategory: analytics.byCategory
        },
        reports: enrichedReports,
        analytics
      };

    } catch (error) {
      logger.error('Failed to list reports', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Download and optionally parse report data
   */
  async downloadReport(client, params, correlationId) {
    try {
      logger.info('Downloading Amazon report', {
        correlationId,
        reportId: params.reportId
      });

      // First get report details to get download URL
      const reportDetails = await client.callAPI({
        operation: 'getReport',
        endpoint: 'reports',
        path: { reportId: params.reportId }
      });

      if (reportDetails.processingStatus !== 'DONE') {
        throw new Error(`Report not ready for download. Status: ${reportDetails.processingStatus}`);
      }

      if (!reportDetails.reportDocumentId) {
        throw new Error('Report document ID not available');
      }

      // Get document details to get download URL
      const documentResponse = await client.callAPI({
        operation: 'getReportDocument',
        endpoint: 'reports',
        path: { reportDocumentId: reportDetails.reportDocumentId }
      });

      // Download the actual report data
      const reportData = await this.downloadReportFile(documentResponse.url, correlationId);

      let parsedData = null;
      if (params.parseData) {
        parsedData = this.parseReportData(reportData, reportDetails.reportType, correlationId);
      }

      return {
        success: true,
        action: 'download',
        report: this.enrichReportData(reportDetails),
        data: reportData,
        parsedData,
        size: reportData.length,
        downloadUrl: documentResponse.url
      };

    } catch (error) {
      logger.error('Failed to download report', {
        correlationId,
        reportId: params.reportId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get report status
   */
  async getReportStatus(client, params, correlationId) {
    try {
      logger.debug('Getting report status', {
        correlationId,
        reportId: params.reportId
      });

      const reportDetails = await client.callAPI({
        operation: 'getReport',
        endpoint: 'reports',
        path: { reportId: params.reportId }
      });

      const enrichedReport = this.enrichReportData(reportDetails);

      return {
        success: true,
        action: 'status',
        report: enrichedReport
      };

    } catch (error) {
      logger.error('Failed to get report status', {
        correlationId,
        reportId: params.reportId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Wait for report completion with polling
   */
  async waitForReportCompletion(client, reportId, correlationId) {
    const startTime = Date.now();
    let attempts = 0;

    while (Date.now() - startTime < this.options.maxWaitTime) {
      attempts++;
      
      try {
        const reportStatus = await client.callAPI({
          operation: 'getReport',
          endpoint: 'reports',
          path: { reportId }
        });

        logger.debug('Report status check', {
          correlationId,
          reportId,
          attempt: attempts,
          status: reportStatus.processingStatus
        });

        if (reportStatus.processingStatus === 'DONE') {
          logger.info('Report completed successfully', {
            correlationId,
            reportId,
            attempts,
            duration: Date.now() - startTime
          });
          return reportStatus;
        }

        if (reportStatus.processingStatus === 'CANCELLED' || reportStatus.processingStatus === 'FATAL') {
          throw new Error(`Report failed with status: ${reportStatus.processingStatus}`);
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));

      } catch (error) {
        logger.warn('Report status check failed', {
          correlationId,
          reportId,
          attempt: attempts,
          error: error.message
        });

        if (attempts >= this.options.maxRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
      }
    }

    throw new Error(`Report completion timeout after ${this.options.maxWaitTime}ms`);
  }

  /**
   * Download report file from Amazon's URL
   */
  async downloadReportFile(url, correlationId) {
    try {
      logger.debug('Downloading report file', { correlationId });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.text();
      
      logger.debug('Report file downloaded', {
        correlationId,
        size: data.length
      });

      return data;

    } catch (error) {
      logger.error('Failed to download report file', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Parse report data based on report type
   */
  parseReportData(rawData, reportType, correlationId) {
    try {
      logger.debug('Parsing report data', {
        correlationId,
        reportType,
        dataSize: rawData.length
      });

      // Most Amazon reports are tab-delimited
      const lines = rawData.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return { rows: [], summary: { totalRows: 0 } };
      }

      // Parse headers
      const headers = lines[0].split('\t').map(h => h.trim());
      
      // Parse data rows
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const row = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : '';
        });
        
        rows.push(row);
      }

      // Generate summary based on report type
      const summary = this.generateReportSummary(rows, reportType);

      return {
        headers,
        rows,
        summary: {
          totalRows: rows.length,
          ...summary
        }
      };

    } catch (error) {
      logger.error('Failed to parse report data', {
        correlationId,
        reportType,
        error: error.message
      });
      return {
        error: error.message,
        rawDataSize: rawData.length
      };
    }
  }

  /**
   * Generate summary for parsed report data
   */
  generateReportSummary(rows, reportType) {
    const summary = {};

    try {
      switch (reportType) {
        case 'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE':
          summary.totalTransactions = rows.length;
          summary.totalAmount = rows.reduce((sum, row) => {
            const amount = parseFloat(row['total'] || row['amount'] || 0);
            return sum + amount;
          }, 0);
          break;

        case 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL':
          summary.totalOrders = rows.length;
          summary.totalSales = rows.reduce((sum, row) => {
            const amount = parseFloat(row['item-price'] || 0);
            return sum + amount;
          }, 0);
          summary.averageOrderValue = summary.totalSales / summary.totalOrders || 0;
          break;

        case 'GET_MERCHANT_LISTINGS_ALL_DATA':
          summary.totalListings = rows.length;
          summary.activeListings = rows.filter(row => 
            row['status'] === 'Active'
          ).length;
          break;

        default:
          summary.recordCount = rows.length;
      }
    } catch (error) {
      logger.warn('Failed to generate report summary', {
        reportType,
        error: error.message
      });
    }

    return summary;
  }

  /**
   * Enrich report data with additional information
   */
  enrichReportData(report) {
    const enriched = { ...report };
    
    // Add report type information
    if (this.reportTypes[report.reportType]) {
      enriched.reportInfo = this.reportTypes[report.reportType];
    }

    // Add timing information
    if (report.createdTime) {
      const created = new Date(report.createdTime);
      const now = new Date();
      enriched.ageInMinutes = Math.floor((now - created) / (1000 * 60));
    }

    // Add status interpretation
    enriched.statusDescription = this.getStatusDescription(report.processingStatus);

    return enriched;
  }

  /**
   * Analyze collection of reports
   */
  analyzeReports(reports) {
    const analytics = {
      byStatus: {},
      byCategory: {},
      byType: {},
      recent: [],
      failed: []
    };

    reports.forEach(report => {
      // Status analysis
      const status = report.processingStatus;
      analytics.byStatus[status] = (analytics.byStatus[status] || 0) + 1;

      // Category analysis
      const category = report.reportInfo?.category || 'unknown';
      analytics.byCategory[category] = (analytics.byCategory[category] || 0) + 1;

      // Type analysis
      const type = report.reportType;
      analytics.byType[type] = (analytics.byType[type] || 0) + 1;

      // Recent reports (last 24 hours)
      if (report.ageInMinutes !== undefined && report.ageInMinutes < 1440) {
        analytics.recent.push({
          reportId: report.reportId,
          reportType: report.reportType,
          status: report.processingStatus,
          ageInMinutes: report.ageInMinutes
        });
      }

      // Failed reports
      if (status === 'CANCELLED' || status === 'FATAL') {
        analytics.failed.push({
          reportId: report.reportId,
          reportType: report.reportType,
          status: report.processingStatus
        });
      }
    });

    return analytics;
  }

  /**
   * Get human-readable status description
   */
  getStatusDescription(status) {
    const descriptions = {
      'IN_QUEUE': 'Waiting to be processed',
      'IN_PROGRESS': 'Currently being generated',
      'DONE': 'Completed successfully and ready for download',
      'CANCELLED': 'Report generation was cancelled',
      'FATAL': 'Report generation failed with an error'
    };

    return descriptions[status] || 'Unknown status';
  }

  /**
   * Get marketplace ID from name or return as-is
   */
  getMarketplaceId(identifier) {
    const marketplaceMap = {
      'UK': 'A1F83G8C2ARO7P',
      'USA': 'ATVPDKIKX0DER',
      'EU': 'A1PA6795UKMFR9',
      'CANADA': 'A2EUQ1WTGCTBG2'
    };

    return marketplaceMap[identifier.toUpperCase()] || identifier;
  }

  /**
   * Sanitize parameters for logging
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    // Remove sensitive data if any
    return sanitized;
  }

  /**
   * Get available report types
   */
  getAvailableReportTypes() {
    return Object.entries(this.reportTypes).map(([type, spec]) => ({
      reportType: type,
      ...spec
    }));
  }

  /**
   * Get tool schema for MCP registration
   */
  getSchema() {
    return {
      name: 'amazon-get-reports',
      description: 'Generate, retrieve, and analyze Amazon marketplace reports with automated processing and business intelligence',
      inputSchema: this.inputSchema
    };
  }
}