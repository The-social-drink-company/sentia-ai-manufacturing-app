/**
 * Xero Accounting Integration Service
 * Handles authentication and API calls to Xero accounting software
 */

const { XeroApi, XeroClient } = require('xero-node');
const { logError } = require('./observability/structuredLogger.js');

class XeroService {
  constructor() {
    this.clientId = process.env.XERO_CLIENT_ID;
    this.clientSecret = process.env.XERO_CLIENT_SECRET;
    this.redirectUri = process.env.XERO_REDIRECT_URI || 'http://localhost:5000/api/xero/callback';
    this.scope = process.env.XERO_SCOPE || 'accounting.transactions,accounting.contacts,accounting.settings';
    
    this.xeroClient = new XeroClient({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUris: [this.redirectUri],
      scopes: this.scope.split(','),
    });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl() {
    try {
      return this.xeroClient.buildConsentUrl();
    } catch (error) {
      logError('Error building Xero consent URL', error);
      throw new Error('Failed to generate Xero authorization URL');
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    try {
      const tokenSet = await this.xeroClient.apiCallback(code);
      return tokenSet;
    } catch (error) {
      logError('Error exchanging code for token', error);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const tokenSet = await this.xeroClient.refreshAccessToken(refreshToken);
      return tokenSet;
    } catch (error) {
      logError('Error refreshing token', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get connected organizations
   */
  async getOrganizations(accessToken) {
    try {
      this.xeroClient.setTokenSet({ access_token: accessToken });
      const response = await this.xeroClient.accountingApi.getOrganisations();
      return response.body.organisations;
    } catch (error) {
      logError('Error fetching organizations', error);
      throw new Error('Failed to fetch Xero organizations');
    }
  }

  /**
   * Get contacts from Xero
   */
  async getContacts(accessToken, tenantId, page = 1, limit = 100) {
    try {
      this.xeroClient.setTokenSet({ access_token: accessToken });
      const response = await this.xeroClient.accountingApi.getContacts(
        tenantId,
        undefined, // ifModifiedSince
        undefined, // where
        undefined, // order
        undefined, // IDs
        undefined, // page
        undefined, // includeArchived
        undefined, // summaryOnly
        undefined, // searchTerm
        undefined, // email
        undefined, // contactGroup
        undefined, // isCustomer
        undefined, // isSupplier
        undefined, // hasAttachments
      );
      return response.body.contacts;
    } catch (error) {
      logError('Error fetching contacts', error);
      throw new Error('Failed to fetch Xero contacts');
    }
  }

  /**
   * Create or update contact in Xero
   */
  async createOrUpdateContact(accessToken, tenantId, contactData) {
    try {
      this.xeroClient.setTokenSet({ access_token: accessToken });
      const response = await this.xeroClient.accountingApi.createOrUpdateContacts(
        tenantId,
        { contacts: [contactData] }
      );
      return response.body.contacts[0];
    } catch (error) {
      logError('Error creating/updating contact', error);
      throw new Error('Failed to create or update Xero contact');
    }
  }

  /**
   * Get invoices from Xero
   */
  async getInvoices(accessToken, tenantId, page = 1, limit = 100) {
    try {
      this.xeroClient.setTokenSet({ access_token: accessToken });
      const response = await this.xeroClient.accountingApi.getInvoices(
        tenantId,
        undefined, // ifModifiedSince
        undefined, // where
        undefined, // order
        undefined, // IDs
        undefined, // invoiceNumbers
        undefined, // contactIDs
        undefined, // statuses
        undefined, // page
        undefined, // includeArchived
        undefined, // createdByMyApp
        undefined, // unitdp
        undefined, // summaryOnly
        undefined, // searchTerm
      );
      return response.body.invoices;
    } catch (error) {
      logError('Error fetching invoices', error);
      throw new Error('Failed to fetch Xero invoices');
    }
  }

  /**
   * Create invoice in Xero
   */
  async createInvoice(accessToken, tenantId, invoiceData) {
    try {
      this.xeroClient.setTokenSet({ access_token: accessToken });
      const response = await this.xeroClient.accountingApi.createInvoices(
        tenantId,
        { invoices: [invoiceData] }
      );
      return response.body.invoices[0];
    } catch (error) {
      logError('Error creating invoice', error);
      throw new Error('Failed to create Xero invoice');
    }
  }

  /**
   * Get items/products from Xero
   */
  async getItems(accessToken, tenantId, page = 1, limit = 100) {
    try {
      this.xeroClient.setTokenSet({ access_token: accessToken });
      const response = await this.xeroClient.accountingApi.getItems(
        tenantId,
        undefined, // ifModifiedSince
        undefined, // where
        undefined, // order
        undefined, // IDs
        undefined, // code
        undefined, // page
        undefined, // includeArchived
        undefined, // isSold
        undefined, // isPurchased
        undefined, // hasAttachments
      );
      return response.body.items;
    } catch (error) {
      logError('Error fetching items', error);
      throw new Error('Failed to fetch Xero items');
    }
  }

  /**
   * Create or update item in Xero
   */
  async createOrUpdateItem(accessToken, tenantId, itemData) {
    try {
      this.xeroClient.setTokenSet({ access_token: accessToken });
      const response = await this.xeroClient.accountingApi.createOrUpdateItems(
        tenantId,
        { items: [itemData] }
      );
      return response.body.items[0];
    } catch (error) {
      logError('Error creating/updating item', error);
      throw new Error('Failed to create or update Xero item');
    }
  }

  /**
   * Get financial reports
   */
  async getFinancialReports(accessToken, tenantId, reportType, fromDate, toDate) {
    try {
      this.xeroClient.setTokenSet({ access_token: accessToken });
      const response = await this.xeroClient.accountingApi.getReportFinancialStatements(
        tenantId,
        reportType,
        fromDate,
        toDate
      );
      return response.body;
    } catch (error) {
      logError('Error fetching financial reports', error);
      throw new Error('Failed to fetch Xero financial reports');
    }
  }

  /**
   * Test connection to Xero
   */
  async testConnection(accessToken) {
    try {
      const organizations = await this.getOrganizations(accessToken);
      return {
        success: true,
        organizations: organizations.length,
        message: 'Successfully connected to Xero'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to connect to Xero'
      };
    }
  }
}

module.exports = XeroService;
