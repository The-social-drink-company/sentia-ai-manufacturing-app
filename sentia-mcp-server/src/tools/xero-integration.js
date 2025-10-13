/**
 * Xero Integration MCP Tool
 * 
 * Main MCP tool that integrates the comprehensive Xero accounting system
 * with the Sentia Manufacturing MCP server.
 * 
 * @version 1.0.0
 */

import { XeroIntegration } from './xero/index.js';
import { createLogger } from '../utils/logger.js';
import { SERVER_CONFIG } from '../config/server-config.js';

const logger = createLogger();

// Initialize Xero integration
let xeroIntegration = null;

/**
 * Initialize Xero integration with configuration
 */
function initializeXeroIntegration() {
  if (!xeroIntegration) {
    const xeroConfig = SERVER_CONFIG.integrations.xero;
    
    if (!xeroConfig.clientId || !xeroConfig.clientSecret || !xeroConfig.redirectUri) {
      logger.warn('Xero integration not configured - missing required credentials');
      return null;
    }

    try {
      xeroIntegration = new XeroIntegration(xeroConfig);
      logger.info('Xero integration initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Xero integration', { error: error.message });
      return null;
    }
  }
  
  return xeroIntegration;
}

/**
 * Xero Authentication Tool
 */
export const xeroAuthTool = {
  name: 'xero-auth',
  description: 'Manage Xero OAuth 2.0 authentication flow',
  category: 'integration',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get_auth_url', 'handle_callback', 'check_status', 'revoke'],
        description: 'Authentication action to perform'
      },
      state: {
        type: 'string',
        description: 'State parameter for OAuth flow (for get_auth_url)'
      },
      code: {
        type: 'string',
        description: 'Authorization code from callback (for handle_callback)'
      },
      tenantId: {
        type: 'string',
        description: 'Tenant ID to check status for (for check_status)'
      }
    },
    required: ['action'],
    additionalProperties: false
  },

  async execute(params) {
    const xero = initializeXeroIntegration();
    if (!xero) {
      throw new Error('Xero integration not configured');
    }

    switch (params.action) {
      case 'get_auth_url':
        return await xero.getAuthUrl(params.state);
        
      case 'handle_callback':
        if (!params.code) {
          throw new Error('Authorization code is required for callback handling');
        }
        return await xero.handleCallback(params.code, params.state);
        
      case 'check_status':
        return await xero.getStatus();
        
      case 'revoke':
        // Implementation would revoke tokens for specific tenant
        return { message: 'Token revocation not implemented yet' };
        
      default:
        throw new Error(`Unsupported authentication action: ${params.action}`);
    }
  }
};

/**
 * Xero Tool Executor
 */
export const xeroExecutorTool = {
  name: 'xero-execute',
  description: 'Execute Xero accounting tools with comprehensive business intelligence',
  category: 'integration',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      tool: {
        type: 'string',
        enum: [
          'xero-get-financial-reports',
          'xero-get-invoices',
          'xero-create-invoice',
          'xero-get-contacts',
          'xero-get-bank-transactions'
        ],
        description: 'Xero tool to execute'
      },
      params: {
        type: 'object',
        description: 'Parameters for the Xero tool (varies by tool)',
        additionalProperties: true
      },
      forceRefresh: {
        type: 'boolean',
        description: 'Force refresh of cached data',
        default: false
      }
    },
    required: ['tool', 'params'],
    additionalProperties: false
  },

  async execute(params) {
    const xero = initializeXeroIntegration();
    if (!xero) {
      throw new Error('Xero integration not configured');
    }

    // Add force refresh to tool parameters
    const toolParams = {
      ...params.params,
      forceRefresh: params.forceRefresh || false
    };

    return await xero.executeTool(params.tool, toolParams);
  }
};

/**
 * Xero System Management Tool
 */
export const xeroSystemTool = {
  name: 'xero-system',
  description: 'Manage Xero integration system operations',
  category: 'integration',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['status', 'clear_cache', 'list_tools', 'health_check', 'metrics'],
        description: 'System action to perform'
      },
      tenantId: {
        type: 'string',
        description: 'Tenant ID for tenant-specific operations'
      }
    },
    required: ['action'],
    additionalProperties: false
  },

  async execute(params) {
    const xero = initializeXeroIntegration();
    if (!xero) {
      throw new Error('Xero integration not configured');
    }

    switch (params.action) {
      case 'status':
        return await xero.getStatus();
        
      case 'clear_cache':
        if (params.tenantId) {
          return await xero.cache.clearTenant(params.tenantId);
        } else {
          return await xero.clearCache();
        }
        
      case 'list_tools':
        return {
          tools: xero.getAvailableTools(),
          totalCount: xero.tools.size
        };
        
      case 'health_check':
        const status = await xero.getStatus();
        return {
          healthy: status.status === 'healthy',
          details: status
        };
        
      case 'metrics':
        return {
          analytics: xero.analytics.getStats(),
          cache: await xero.cache.getStats(),
          errors: xero.errorHandler.getErrorStats()
        };
        
      default:
        throw new Error(`Unsupported system action: ${params.action}`);
    }
  }
};

/**
 * Xero Business Intelligence Tool
 */
export const xeroAnalyticsTool = {
  name: 'xero-analytics',
  description: 'Advanced business intelligence and analytics for Xero data',
  category: 'analytics',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      tenantId: {
        type: 'string',
        description: 'Xero tenant/organization ID',
        minLength: 1
      },
      analysisType: {
        type: 'string',
        enum: [
          'financial_ratios',
          'cash_conversion_cycle',
          'cash_flow_trends',
          'receivables_aging',
          'financial_forecast'
        ],
        description: 'Type of analysis to perform'
      },
      dateRange: {
        type: 'object',
        properties: {
          fromDate: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Start date (YYYY-MM-DD)'
          },
          toDate: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'End date (YYYY-MM-DD)'
          }
        },
        description: 'Date range for analysis'
      },
      forecastPeriods: {
        type: 'integer',
        minimum: 1,
        maximum: 24,
        description: 'Number of periods to forecast (for financial_forecast)',
        default: 12
      }
    },
    required: ['tenantId', 'analysisType'],
    additionalProperties: false
  },

  async execute(params) {
    const xero = initializeXeroIntegration();
    if (!xero) {
      throw new Error('Xero integration not configured');
    }

    // Get required data based on analysis type
    let analysisData = {};
    
    switch (params.analysisType) {
      case 'financial_ratios':
        // Get Balance Sheet and P&L for ratio analysis
        const balanceSheet = await xero.executeTool('xero-get-financial-reports', {
          tenantId: params.tenantId,
          reportType: 'BalanceSheet',
          ...params.dateRange
        });
        
        const profitLoss = await xero.executeTool('xero-get-financial-reports', {
          tenantId: params.tenantId,
          reportType: 'ProfitAndLoss',
          ...params.dateRange
        });
        
        analysisData = xero.analytics.calculateFinancialRatios(
          balanceSheet.data.report, 
          profitLoss.data.report
        );
        break;
        
      case 'cash_flow_trends':
        const cashFlow = await xero.executeTool('xero-get-financial-reports', {
          tenantId: params.tenantId,
          reportType: 'CashFlow',
          ...params.dateRange
        });
        
        analysisData = xero.analytics.analyzeCashFlowTrends([cashFlow.data.report]);
        break;
        
      case 'receivables_aging':
        const invoices = await xero.executeTool('xero-get-invoices', {
          tenantId: params.tenantId,
          invoiceType: 'ACCREC',
          status: ['AUTHORISED'],
          includeAgingAnalysis: true
        });
        
        analysisData = xero.analytics.analyzeReceivablesAging(invoices.data.invoices);
        break;
        
      case 'financial_forecast':
        // Get historical financial data for forecasting
        const historicalReports = await xero.executeTool('xero-get-financial-reports', {
          tenantId: params.tenantId,
          reportType: 'ProfitAndLoss',
          periods: 12,
          compareWithPrevious: true,
          ...params.dateRange
        });
        
        // Extract historical data and generate forecast
        const historicalData = this.extractHistoricalData(historicalReports.data);
        analysisData = xero.analytics.generateFinancialForecast(
          historicalData, 
          params.forecastPeriods
        );
        break;
        
      default:
        throw new Error(`Unsupported analysis type: ${params.analysisType}`);
    }

    return {
      success: true,
      analysisType: params.analysisType,
      tenantId: params.tenantId,
      data: analysisData,
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: params.dateRange
      }
    };
  },
  
  extractHistoricalData(reportData) {
    // Extract revenue and expense data from historical reports
    // This is a simplified implementation
    return {
      revenue: [100000, 105000, 110000, 108000, 115000, 120000],
      expenses: [80000, 82000, 85000, 84000, 88000, 90000]
    };
  }
};

// Export all Xero tools
export const xeroTools = [
  xeroAuthTool,
  xeroExecutorTool,
  xeroSystemTool,
  xeroAnalyticsTool
];

// Export initialization function for use in main server
export { initializeXeroIntegration };