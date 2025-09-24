/**
 * Xero OAuth Client Service
 * Handles OAuth authentication and API integration with Xero accounting
 */

import { XeroClient } from 'xero-node';
import prisma from '../../lib/prisma.js';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

class XeroService {
  constructor() {
    this.client = null;
    this.tenantId = null;
    this.tokenSet = null;
    this.isInitialized = false;

    // Initialize Xero client with environment credentials
    this.initializeClient();
  }

  /**
   * Initialize Xero client with OAuth2 configuration
   */
  initializeClient() {
    try {
      const clientId = process.env.XERO_CLIENT_ID;
      const clientSecret = process.env.XERO_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        logWarn('Xero credentials not configured', {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret
        });
        return false;
      }

      const baseUrl = process.env.NODE_ENV === 'production'
        ? process.env.VITE_API_BASE_URL || 'https://sentia-manufacturing-production.onrender.com'
        : 'http://localhost:5000';

      this.client = new XeroClient({
        clientId,
        clientSecret,
        redirectUris: [`${baseUrl}/api/xero/callback`],
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
          'offline_access'
        ].join(' ')
      });

      this.isInitialized = true;
      logInfo('Xero client initialized successfully');
      return true;
    } catch (error) {
      logError('Failed to initialize Xero client', error);
      return false;
    }
  }

  /**
   * Build OAuth2 consent URL for user authorization
   */
  async buildConsentUrl() {
    if (!this.isInitialized) {
      throw new Error('Xero client not initialized');
    }

    try {
      const consentUrl = await this.client.buildConsentUrl();
      logInfo('Xero consent URL generated', { url: consentUrl });
      return consentUrl;
    } catch (error) {
      logError('Failed to build Xero consent URL', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(requestUrl) {
    if (!this.isInitialized) {
      throw new Error('Xero client not initialized');
    }

    try {
      // Exchange authorization code for tokens
      this.tokenSet = await this.client.apiCallback(requestUrl);

      // Update tenants
      await this.updateTenants();

      // Store tokens in database
      await this.saveTokens();

      logInfo('Xero OAuth callback successful', {
        hasTokens: !!this.tokenSet,
        tenantId: this.tenantId
      });

      return {
        success: true,
        tenantId: this.tenantId
      };
    } catch (error) {
      logError('Failed to handle Xero callback', error);
      throw error;
    }
  }

  /**
   * Update tenant information
   */
  async updateTenants() {
    if (!this.client || !this.tokenSet) {
      throw new Error('Xero client not authenticated');
    }

    try {
      await this.client.setTokenSet(this.tokenSet);
      const tenants = await this.client.updateTenants();

      if (tenants && tenants.length > 0) {
        this.tenantId = tenants[0].tenantId;
        logInfo('Xero tenants updated', {
          tenantCount: tenants.length,
          tenantId: this.tenantId
        });
      }

      return this.tenantId;
    } catch (error) {
      logError('Failed to update Xero tenants', error);
      throw error;
    }
  }

  /**
   * Save tokens to database
   */
  async saveTokens() {
    if (!this.tokenSet) {
      throw new Error('No token set available to save');
    }

    try {
      // For local development without database, just log
      if (process.env.DATABASE_URL?.includes('dummy')) {
        logInfo('Skipping token save in development mode');
        return;
      }

      const tokenData = {
        accessToken: this.tokenSet.access_token,
        refreshToken: this.tokenSet.refresh_token,
        expiresAt: new Date(Date.now() + (this.tokenSet.expires_in * 1000)),
        scope: this.tokenSet.scope,
        tenantId: this.tenantId
      };

      // Store in ApiConnectionStatus table
      await prisma.apiConnectionStatus.upsert({
        where: { service: 'xero' },
        update: {
          status: 'connected',
          lastSync: new Date(),
          metadata: tokenData,
          errorMessage: null
        },
        create: {
          service: 'xero',
          status: 'connected',
          lastSync: new Date(),
          metadata: tokenData
        }
      });

      logInfo('Xero tokens saved to database');
    } catch (error) {
      logError('Failed to save Xero tokens', error);
      // Don't throw in local development
      if (!process.env.DATABASE_URL?.includes('dummy')) {
        throw error;
      }
    }
  }

  /**
   * Load tokens from database
   */
  async loadTokens() {
    try {
      // Skip in local development
      if (process.env.DATABASE_URL?.includes('dummy')) {
        logInfo('Skipping token load in development mode');
        return false;
      }

      const connection = await prisma.apiConnectionStatus.findUnique({
        where: { service: 'xero' }
      });

      if (connection && connection.metadata) {
        const tokenData = connection.metadata;
        this.tokenSet = {
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          expires_in: Math.floor((new Date(tokenData.expiresAt) - new Date()) / 1000),
          scope: tokenData.scope
        };
        this.tenantId = tokenData.tenantId;

        await this.client.setTokenSet(this.tokenSet);

        logInfo('Xero tokens loaded from database');
        return true;
      }

      return false;
    } catch (error) {
      logError('Failed to load Xero tokens', error);
      return false;
    }
  }

  /**
   * Refresh access token if expired
   */
  async refreshToken() {
    if (!this.tokenSet || !this.tokenSet.refresh_token) {
      logWarn('No refresh token available');
      return false;
    }

    try {
      const newTokenSet = await this.client.refreshToken();
      this.tokenSet = newTokenSet;
      await this.saveTokens();

      logInfo('Xero access token refreshed');
      return true;
    } catch (error) {
      logError('Failed to refresh Xero token', error);
      return false;
    }
  }

  /**
   * Check if authenticated and tokens are valid
   */
  async isAuthenticated() {
    if (!this.isInitialized || !this.tokenSet) {
      // Try to load tokens from database
      const loaded = await this.loadTokens();
      if (!loaded) {
        return false;
      }
    }

    // Check if token is expired
    if (this.tokenSet.expires_in <= 0) {
      // Try to refresh
      const refreshed = await this.refreshToken();
      return refreshed;
    }

    return true;
  }

  /**
   * Get invoices from Xero
   */
  async getInvoices(options = {}) {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Xero');
    }

    try {
      const response = await this.client.accountingApi.getInvoices(
        this.tenantId,
        options.ifModifiedSince,
        options.where,
        options.order,
        options.ids,
        options.invoiceNumbers,
        options.contactIds,
        options.statuses,
        options.page,
        options.includeArchived,
        options.createdByMyApp,
        options.unitdp,
        options.summaryOnly
      );

      logInfo('Retrieved invoices from Xero', {
        count: response.body?.invoices?.length || 0
      });

      return response.body?.invoices || [];
    } catch (error) {
      logError('Failed to get Xero invoices', error);
      throw error;
    }
  }

  /**
   * Get bank transactions from Xero
   */
  async getBankTransactions(options = {}) {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Xero');
    }

    try {
      const response = await this.client.accountingApi.getBankTransactions(
        this.tenantId,
        options.ifModifiedSince,
        options.where,
        options.order,
        options.page,
        options.unitdp
      );

      logInfo('Retrieved bank transactions from Xero', {
        count: response.body?.bankTransactions?.length || 0
      });

      return response.body?.bankTransactions || [];
    } catch (error) {
      logError('Failed to get Xero bank transactions', error);
      throw error;
    }
  }

  /**
   * Get balance sheet report from Xero
   */
  async getBalanceSheet(date) {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Xero');
    }

    try {
      const response = await this.client.accountingApi.getReportBalanceSheet(
        this.tenantId,
        date
      );

      logInfo('Retrieved balance sheet from Xero');
      return response.body?.reports?.[0] || null;
    } catch (error) {
      logError('Failed to get Xero balance sheet', error);
      throw error;
    }
  }

  /**
   * Get profit and loss report from Xero
   */
  async getProfitAndLoss(fromDate, toDate) {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Xero');
    }

    try {
      const response = await this.client.accountingApi.getReportProfitAndLoss(
        this.tenantId,
        fromDate,
        toDate,
        12, // periods
        'MONTH' // timeframe
      );

      logInfo('Retrieved profit and loss from Xero');
      return response.body?.reports?.[0] || null;
    } catch (error) {
      logError('Failed to get Xero profit and loss', error);
      throw error;
    }
  }

  /**
   * Get accounts from Xero
   */
  async getAccounts() {
    if (!await this.isAuthenticated()) {
      throw new Error('Not authenticated with Xero');
    }

    try {
      const response = await this.client.accountingApi.getAccounts(
        this.tenantId
      );

      logInfo('Retrieved accounts from Xero', {
        count: response.body?.accounts?.length || 0
      });

      return response.body?.accounts || [];
    } catch (error) {
      logError('Failed to get Xero accounts', error);
      throw error;
    }
  }

  /**
   * Calculate working capital from balance sheet
   */
  calculateWorkingCapital(balanceSheet) {
    if (!balanceSheet || !balanceSheet.rows) {
      return null;
    }

    let currentAssets = 0;
    let currentLiabilities = 0;

    // Parse balance sheet rows to find current assets and liabilities
    balanceSheet.rows.forEach(row => {
      if (row.title === 'Current Assets' && row.cells) {
        currentAssets = parseFloat(row.cells[0]?.value || 0);
      }
      if (row.title === 'Current Liabilities' && row.cells) {
        currentLiabilities = parseFloat(row.cells[0]?.value || 0);
      }
    });

    const workingCapital = currentAssets - currentLiabilities;

    return {
      currentAssets,
      currentLiabilities,
      workingCapital,
      date: balanceSheet.reportDate || new Date()
    };
  }

  /**
   * Test connection to Xero
   */
  async testConnection() {
    try {
      const isAuth = await this.isAuthenticated();

      if (!isAuth) {
        return {
          success: false,
          message: 'Not authenticated with Xero',
          needsAuth: true
        };
      }

      // Try to get organization info as a test
      const response = await this.client.accountingApi.getOrganisations(this.tenantId);

      return {
        success: true,
        message: 'Successfully connected to Xero',
        organization: response.body?.organisations?.[0]?.name
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        needsAuth: true
      };
    }
  }
}

// Singleton instance
let xeroInstance = null;

export function getXeroService() {
  if (!xeroInstance) {
    xeroInstance = new XeroService();
  }
  return xeroInstance;
}

export default XeroService;