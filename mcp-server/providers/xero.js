/**
 * Xero Provider for MCP Server
 * Handles Xero API operations
 */

import { XeroApi, XeroClient } from 'xero-node';

export class XeroProvider {
  constructor(logger) {
    this.logger = logger;
    this.clientId = process.env.XERO_CLIENT_ID;
    this.clientSecret = process.env.XERO_CLIENT_SECRET;
    this.redirectUri = process.env.XERO_REDIRECT_URI;
    this.scope = process.env.XERO_SCOPE || 'accounting.transactions,accounting.contacts,accounting.settings';
    
    this.xeroClient = null;
    this.accessToken = process.env.XERO_ACCESS_TOKEN;
    this.refreshToken = process.env.XERO_REFRESH_TOKEN;
    this.tenantId = process.env.XERO_TENANT_ID;

    if (this.isConfigured()) {
      this.initializeClient();
    }
  }

  isConfigured() {
    return !!(this.clientId && this.clientSecret);
  }

  initializeClient() {
    this.xeroClient = new XeroClient({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUris: [this.redirectUri],
      scopes: this.scope.split(','),
    });

    if (this.accessToken) {
      this.xeroClient.setTokenSet({
        access_token: this.accessToken,
        refresh_token: this.refreshToken
      });
    }
  }

  async getOrganizations() {
    try {
      if (!this.accessToken) {
        throw new Error('Xero access token not configured. Please authenticate first.');
      }

      this.xeroClient.setTokenSet({ access_token: this.accessToken });
      const response = await this.xeroClient.accountingApi.getOrganisations();
      
      return {
        success: true,
        organizations: response.body.organisations.map(org => ({
          id: org.organisationID,
          name: org.name,
          shortCode: org.shortCode,
          isDemoCompany: org.isDemoCompany
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get Xero organizations', { error: error.message });
      throw new Error(`Failed to get organizations: ${error.message}`);
    }
  }

  async getContacts(tenantId, page = 1, limit = 100) {
    try {
      if (!this.accessToken) {
        throw new Error('Xero access token not configured');
      }

      this.xeroClient.setTokenSet({ access_token: this.accessToken });
      const response = await this.xeroClient.accountingApi.getContacts(tenantId);
      
      return {
        success: true,
        contacts: response.body.contacts.map(contact => ({
          id: contact.contactID,
          name: contact.name,
          email: contact.emailAddress,
          phone: contact.phones?.[0]?.phoneNumber,
          isCustomer: contact.isCustomer,
          isSupplier: contact.isSupplier
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get Xero contacts', { error: error.message });
      throw new Error(`Failed to get contacts: ${error.message}`);
    }
  }

  async createContact(tenantId, contactData) {
    try {
      if (!this.accessToken) {
        throw new Error('Xero access token not configured');
      }

      this.xeroClient.setTokenSet({ access_token: this.accessToken });
      
      const contact = {
        name: contactData.name,
        emailAddress: contactData.email,
        phones: contactData.phone ? [{
          phoneType: 'MOBILE',
          phoneNumber: contactData.phone
        }] : undefined
      };

      const response = await this.xeroClient.accountingApi.createOrUpdateContacts(
        tenantId,
        { contacts: [contact] }
      );

      return {
        success: true,
        contact: {
          id: response.body.contacts[0].contactID,
          name: response.body.contacts[0].name,
          email: response.body.contacts[0].emailAddress
        }
      };
    } catch (error) {
      this.logger.error('Failed to create Xero contact', { error: error.message });
      throw new Error(`Failed to create contact: ${error.message}`);
    }
  }

  async getInvoices(tenantId, page = 1, limit = 100) {
    try {
      if (!this.accessToken) {
        throw new Error('Xero access token not configured');
      }

      this.xeroClient.setTokenSet({ access_token: this.accessToken });
      const response = await this.xeroClient.accountingApi.getInvoices(tenantId);
      
      return {
        success: true,
        invoices: response.body.invoices.map(invoice => ({
          id: invoice.invoiceID,
          number: invoice.invoiceNumber,
          type: invoice.type,
          status: invoice.status,
          total: invoice.total,
          date: invoice.date,
          dueDate: invoice.dueDate,
          contactName: invoice.contact?.name
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get Xero invoices', { error: error.message });
      throw new Error(`Failed to get invoices: ${error.message}`);
    }
  }

  async createInvoice(tenantId, invoiceData) {
    try {
      if (!this.accessToken) {
        throw new Error('Xero access token not configured');
      }

      this.xeroClient.setTokenSet({ access_token: this.accessToken });
      
      const invoice = {
        type: 'ACCREC',
        contact: { contactID: invoiceData.contactId },
        lineItems: [{
          description: invoiceData.description,
          quantity: 1,
          unitAmount: invoiceData.amount,
          accountCode: '200'
        }],
        date: invoiceData.date || new Date().toISOString().split('T')[0],
        dueDate: invoiceData.dueDate
      };

      const response = await this.xeroClient.accountingApi.createInvoices(
        tenantId,
        { invoices: [invoice] }
      );

      return {
        success: true,
        invoice: {
          id: response.body.invoices[0].invoiceID,
          number: response.body.invoices[0].invoiceNumber,
          total: response.body.invoices[0].total
        }
      };
    } catch (error) {
      this.logger.error('Failed to create Xero invoice', { error: error.message });
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }

  async getItems(tenantId, page = 1, limit = 100) {
    try {
      if (!this.accessToken) {
        throw new Error('Xero access token not configured');
      }

      this.xeroClient.setTokenSet({ access_token: this.accessToken });
      const response = await this.xeroClient.accountingApi.getItems(tenantId);
      
      return {
        success: true,
        items: response.body.items.map(item => ({
          id: item.itemID,
          code: item.code,
          name: item.name,
          description: item.description,
          unitPrice: item.unitPrice,
          purchasePrice: item.purchaseDetails?.unitPrice,
          salesPrice: item.salesDetails?.unitPrice
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get Xero items', { error: error.message });
      throw new Error(`Failed to get items: ${error.message}`);
    }
  }
}
