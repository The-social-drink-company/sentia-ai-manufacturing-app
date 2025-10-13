/**
 * Xero Accounting Integration for Sentia Manufacturing MCP Server
 * 
 * Comprehensive Xero API integration providing financial data access,
 * business intelligence, and accounting automation capabilities.
 * 
 * Features:
 * - OAuth 2.0 authentication with multi-tenant support
 * - Financial reporting (P&L, Balance Sheet, Cash Flow)
 * - Invoice management and creation
 * - Contact and supplier management
 * - Bank transaction processing
 * - Business intelligence and analytics
 * - Comprehensive caching and error handling
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import pkg from 'xero-node';
const { XeroApi } = pkg;
import { createLogger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { XeroAuth } from './auth/oauth.js';
import { XeroTokenManager } from './auth/token-manager.js';
import { XeroCache } from './utils/cache.js';
import { XeroErrorHandler } from './utils/error-handler.js';
import { XeroAnalytics } from './utils/analytics.js';

// Import tool implementations
import { FinancialReportsTool } from './tools/financial-reports.js';
import { InvoicesTool } from './tools/invoices.js';
import { ContactsTool } from './tools/contacts.js';
import { BankTransactionsTool } from './tools/bank-transactions.js';
import { CreateInvoiceTool } from './tools/create-invoice.js';

const logger = createLogger();

/**
 * Main Xero Integration Class
 * Manages Xero API connections, authentication, and tool orchestration
 */
export class XeroIntegration {
  constructor(config = {}) {
    this.config = {
      clientId: config.clientId || process.env.XERO_CLIENT_ID,
      clientSecret: config.clientSecret || process.env.XERO_CLIENT_SECRET,
      redirectUri: config.redirectUri || process.env.XERO_REDIRECT_URI,
      scopes: config.scopes || ['accounting.read', 'accounting.transactions', 'accounting.contacts.read'],
      ...config
    };

    // Validate required configuration
    this.validateConfig();

    // Initialize components
    this.auth = new XeroAuth(this.config);
    this.tokenManager = new XeroTokenManager();
    this.cache = new XeroCache();
    this.errorHandler = new XeroErrorHandler();
    this.analytics = new XeroAnalytics();

    // Initialize Xero API client
    this.xeroApi = new XeroApi({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      redirectUris: [this.config.redirectUri],
      scopes: this.config.scopes,
      httpTimeout: 30000
    });

    // Initialize tools
    this.initializeTools();

    logger.info('Xero Integration initialized', {
      clientId: this.config.clientId,
      scopes: this.config.scopes,
      toolsCount: this.tools.size
    });
  }

  /**
   * Validate required configuration parameters
   */
  validateConfig() {
    const required = ['clientId', 'clientSecret', 'redirectUri'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required Xero configuration: ${missing.join(', ')}`);
    }
  }

  /**
   * Initialize all Xero tools
   */
  initializeTools() {
    this.tools = new Map();

    // Financial Reports Tool
    this.tools.set('xero-get-financial-reports', new FinancialReportsTool(this));

    // Invoice Management Tools
    this.tools.set('xero-get-invoices', new InvoicesTool(this));
    this.tools.set('xero-create-invoice', new CreateInvoiceTool(this));

    // Contact Management Tool
    this.tools.set('xero-get-contacts', new ContactsTool(this));

    // Bank Transactions Tool
    this.tools.set('xero-get-bank-transactions', new BankTransactionsTool(this));

    logger.info('Xero tools initialized', {
      tools: Array.from(this.tools.keys()),
      totalCount: this.tools.size
    });
  }

  /**
   * Get authentication URL for OAuth flow
   */
  async getAuthUrl(state = null) {
    try {
      const authUrl = await this.auth.getAuthorizationUrl(state);
      
      logger.info('Generated Xero auth URL', { state });
      return authUrl;
    } catch (error) {
      logger.error('Failed to generate auth URL', { error: error.message });
      throw this.errorHandler.handleError(error, 'AUTH_URL_GENERATION');
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code, state = null) {
    try {
      const tokenData = await this.auth.exchangeCodeForToken(code);
      
      // Store tokens securely
      await this.tokenManager.storeTokens(tokenData);
      
      // Set tokens in Xero API client
      await this.xeroApi.setTokenSet(tokenData);
      
      // Get tenant information
      const tenants = await this.xeroApi.connections.tenants();
      
      logger.info('Xero OAuth callback handled successfully', {
        state,
        tenantsCount: tenants.length
      });
      
      return {
        success: true,
        tenants: tenants.map(tenant => ({
          id: tenant.tenantId,
          name: tenant.tenantName,
          type: tenant.tenantType,
          createdDateUtc: tenant.createdDateUtc
        }))
      };
    } catch (error) {
      logger.error('OAuth callback handling failed', { 
        error: error.message,
        code: code?.substring(0, 10) + '...',
        state 
      });
      throw this.errorHandler.handleError(error, 'OAUTH_CALLBACK');
    }
  }

  /**
   * Ensure valid authentication before API calls
   */
  async ensureAuthentication(tenantId = null) {
    try {
      // Get stored tokens
      const tokens = await this.tokenManager.getTokens(tenantId);
      
      if (!tokens) {
        throw new Error('No stored tokens found. Please authenticate first.');
      }

      // Check if tokens need refresh
      if (this.tokenManager.needsRefresh(tokens)) {
        const refreshedTokens = await this.auth.refreshTokens(tokens.refresh_token);
        await this.tokenManager.storeTokens(refreshedTokens, tenantId);
        tokens = refreshedTokens;
      }

      // Set tokens in API client
      await this.xeroApi.setTokenSet(tokens);
      
      return true;
    } catch (error) {
      logger.error('Authentication check failed', { 
        error: error.message,
        tenantId 
      });
      throw this.errorHandler.handleError(error, 'AUTHENTICATION');
    }
  }

  /**
   * Execute a Xero tool with proper error handling and caching
   */
  async executeTool(toolName, params = {}) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing Xero tool', {
        correlationId,
        toolName,
        tenantId: params.tenantId
      });

      // Check if tool exists
      if (!this.tools.has(toolName)) {
        throw new Error(`Xero tool '${toolName}' not found`);
      }

      // Ensure authentication
      await this.ensureAuthentication(params.tenantId);

      // Get tool instance
      const tool = this.tools.get(toolName);

      // Check cache first (if caching is enabled for this tool)
      if (tool.cacheEnabled && !params.forceRefresh) {
        const cacheKey = this.cache.generateKey(toolName, params);
        const cachedResult = await this.cache.get(cacheKey);
        
        if (cachedResult) {
          logger.info('Returning cached result', {
            correlationId,
            toolName,
            cacheKey
          });
          
          return {
            ...cachedResult,
            fromCache: true,
            correlationId
          };
        }
      }

      // Execute tool
      const result = await tool.execute(params);

      // Cache result if caching is enabled
      if (tool.cacheEnabled && result.success) {
        const cacheKey = this.cache.generateKey(toolName, params);
        await this.cache.set(cacheKey, result, tool.cacheTTL);
      }

      const executionTime = Date.now() - startTime;

      // Update analytics
      this.analytics.recordToolExecution(toolName, executionTime, true);

      logger.info('Xero tool executed successfully', {
        correlationId,
        toolName,
        executionTime,
        resultSize: JSON.stringify(result).length
      });

      return {
        ...result,
        fromCache: false,
        executionTime,
        correlationId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Update analytics
      this.analytics.recordToolExecution(toolName, executionTime, false);

      logger.error('Xero tool execution failed', {
        correlationId,
        toolName,
        error: error.message,
        executionTime
      });

      throw this.errorHandler.handleError(error, 'TOOL_EXECUTION', {
        toolName,
        correlationId,
        executionTime
      });
    }
  }

  /**
   * Get all available tools with their metadata
   */
  getAvailableTools() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      inputSchema: tool.inputSchema,
      requiresAuth: tool.requiresAuth || true,
      cacheEnabled: tool.cacheEnabled || false,
      cacheTTL: tool.cacheTTL || 300
    }));
  }

  /**
   * Get system status and health information
   */
  async getStatus() {
    try {
      const tokens = await this.tokenManager.getAllTenants();
      
      return {
        status: 'healthy',
        authenticated: tokens.length > 0,
        tenants: tokens.length,
        tools: this.tools.size,
        cache: await this.cache.getStats(),
        analytics: this.analytics.getStats(),
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastUpdate: new Date().toISOString()
      };
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    try {
      await this.cache.clear();
      logger.info('Xero cache cleared successfully');
      return { success: true, message: 'Cache cleared successfully' };
    } catch (error) {
      logger.error('Failed to clear Xero cache', { error: error.message });
      throw error;
    }
  }

  /**
   * Disconnect and cleanup resources
   */
  async disconnect() {
    try {
      // Clear cache
      await this.cache.clear();
      
      // Clear tokens (optional - depends on requirements)
      // await this.tokenManager.clearAllTokens();
      
      logger.info('Xero integration disconnected successfully');
      return { success: true, message: 'Disconnected successfully' };
    } catch (error) {
      logger.error('Error during Xero disconnection', { error: error.message });
      throw error;
    }
  }
}

// Export for use in MCP server
export default XeroIntegration;