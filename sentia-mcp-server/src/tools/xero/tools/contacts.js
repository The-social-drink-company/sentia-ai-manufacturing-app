/**
 * Xero Contacts Management Tool
 * 
 * Comprehensive contact management tool for retrieving customer and supplier data
 * with relationship mapping, grouping, and export capabilities.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

/**
 * Contacts Tool Class
 */
export class ContactsTool {
  constructor(xeroIntegration) {
    this.xero = xeroIntegration;
    this.name = 'xero-get-contacts';
    this.description = 'Retrieve and manage customer and supplier contacts with advanced filtering and relationship analysis';
    this.category = 'financial';
    this.cacheEnabled = true;
    this.cacheTTL = 3600; // 1 hour
    this.requiresAuth = true;

    this.inputSchema = {
      type: 'object',
      properties: {
        tenantId: {
          type: 'string',
          description: 'Xero tenant/organization ID',
          minLength: 1
        },
        contactType: {
          type: 'string',
          enum: ['Customer', 'Supplier', 'Both'],
          description: 'Type of contacts to retrieve',
          default: 'Both'
        },
        status: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['ACTIVE', 'ARCHIVED', 'GDPRREQUEST']
          },
          description: 'Filter by contact status',
          default: ['ACTIVE']
        },
        includeArchived: {
          type: 'boolean',
          description: 'Include archived contacts',
          default: false
        },
        searchTerm: {
          type: 'string',
          description: 'Search contacts by name, email, or phone',
          maxLength: 255
        },
        contactName: {
          type: 'string',
          description: 'Filter by specific contact name (partial match)'
        },
        emailAddress: {
          type: 'string',
          description: 'Filter by email address'
        },
        phone: {
          type: 'string',
          description: 'Filter by phone number'
        },
        city: {
          type: 'string',
          description: 'Filter by city'
        },
        region: {
          type: 'string',
          description: 'Filter by state/region'
        },
        country: {
          type: 'string',
          description: 'Filter by country'
        },
        contactGroupID: {
          type: 'string',
          description: 'Filter by contact group ID'
        },
        hasTransactions: {
          type: 'boolean',
          description: 'Filter contacts that have transactions',
          default: false
        },
        includeAddresses: {
          type: 'boolean',
          description: 'Include address information',
          default: true
        },
        includePhones: {
          type: 'boolean',
          description: 'Include phone numbers',
          default: true
        },
        includeContactGroups: {
          type: 'boolean',
          description: 'Include contact group memberships',
          default: true
        },
        includeTransactionSummary: {
          type: 'boolean',
          description: 'Include transaction summary statistics',
          default: false
        },
        includeRelationshipAnalysis: {
          type: 'boolean',
          description: 'Include customer/supplier relationship analysis',
          default: false
        },
        sortBy: {
          type: 'string',
          enum: ['Name', 'UpdatedDateUTC', 'ContactNumber'],
          description: 'Sort contacts by specified field',
          default: 'Name'
        },
        sortOrder: {
          type: 'string',
          enum: ['ASC', 'DESC'],
          description: 'Sort order',
          default: 'ASC'
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
          description: 'Number of contacts per page',
          default: 50
        },
        exportFormat: {
          type: 'string',
          enum: ['json', 'csv', 'xlsx', 'vcard'],
          description: 'Export format',
          default: 'json'
        }
      },
      required: ['tenantId'],
      additionalProperties: false
    };

    logger.info('Contacts Tool initialized');
  }

  /**
   * Execute contact retrieval and analysis
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing contacts tool', {
        correlationId,
        contactType: params.contactType,
        tenantId: params.tenantId,
        searchTerm: params.searchTerm
      });

      // Set tenant context
      await this.xero.xeroApi.setTokenSet(
        await this.xero.tokenManager.getTokens(params.tenantId)
      );

      // Build Xero API filters
      const whereClause = this.buildWhereClause(params);
      const orderBy = this.buildOrderBy(params);

      // Retrieve contacts from Xero
      const contactsData = await this.retrieveContacts(
        params,
        whereClause,
        orderBy,
        correlationId
      );

      // Apply additional filtering
      let filteredContacts = this.applyAdditionalFilters(contactsData.contacts, params);

      // Apply pagination
      const paginationResult = this.applyPagination(filteredContacts, params);
      filteredContacts = paginationResult.contacts;

      // Enrich with additional data
      const enrichedContacts = await this.enrichContactData(
        filteredContacts,
        params,
        correlationId
      );

      // Perform analysis
      let analysis = null;
      if (params.includeRelationshipAnalysis || params.includeTransactionSummary) {
        analysis = await this.performContactAnalysis(
          enrichedContacts,
          params,
          correlationId
        );
      }

      // Get contact groups if needed
      let contactGroups = null;
      if (params.includeContactGroups) {
        contactGroups = await this.getContactGroups(params.tenantId, correlationId);
      }

      // Format response
      const result = await this.formatResponse(
        enrichedContacts,
        analysis,
        contactGroups,
        paginationResult.pagination,
        params
      );

      const executionTime = Date.now() - startTime;

      logger.info('Contacts retrieved successfully', {
        correlationId,
        contactsCount: enrichedContacts.length,
        totalMatched: paginationResult.pagination.totalItems,
        executionTime,
        hasAnalysis: !!analysis
      });

      return {
        success: true,
        data: result,
        metadata: {
          totalContacts: paginationResult.pagination.totalItems,
          returnedContacts: enrichedContacts.length,
          executionTime,
          correlationId,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Contacts execution failed', {
        correlationId,
        error: error.message,
        executionTime
      });

      throw new Error(`Contacts retrieval failed: ${error.message}`);
    }
  }

  /**
   * Build WHERE clause for Xero API
   */
  buildWhereClause(params) {
    const conditions = [];

    // Contact type filter
    if (params.contactType && params.contactType !== 'Both') {
      if (params.contactType === 'Customer') {
        conditions.push('IsCustomer==true');
      } else if (params.contactType === 'Supplier') {
        conditions.push('IsSupplier==true');
      }
    }

    // Status filter
    if (params.status && params.status.length > 0) {
      const statusConditions = params.status.map(status => `ContactStatus="${status}"`);
      conditions.push(`(${statusConditions.join(' OR ')})`);
    }

    // Contact name filter
    if (params.contactName) {
      conditions.push(`Name.Contains("${params.contactName}")`);
    }

    // Email filter
    if (params.emailAddress) {
      conditions.push(`EmailAddress.Contains("${params.emailAddress}")`);
    }

    // Contact group filter
    if (params.contactGroupID) {
      conditions.push(`ContactGroups.Any(ContactGroupID=Guid("${params.contactGroupID}"))`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : null;
  }

  /**
   * Build ORDER BY clause for Xero API
   */
  buildOrderBy(params) {
    const field = params.sortBy || 'Name';
    const order = params.sortOrder || 'ASC';
    return `${field} ${order}`;
  }

  /**
   * Retrieve contacts from Xero API
   */
  async retrieveContacts(params, whereClause, orderBy, correlationId) {
    try {
      logger.debug('Retrieving contacts from Xero', {
        correlationId,
        whereClause,
        orderBy
      });

      const response = await this.xero.xeroApi.accountingApi.getContacts(
        params.tenantId,
        null, // modifiedSince
        whereClause,
        orderBy,
        null, // IDs
        null, // page
        params.includeArchived,
        false, // summaryOnly
        params.searchTerm
      );

      if (!response || !response.body || !response.body.contacts) {
        throw new Error('Invalid response from Xero API');
      }

      logger.debug('Contacts retrieved from Xero', {
        correlationId,
        count: response.body.contacts.length
      });

      return {
        contacts: response.body.contacts,
        pagination: response.body.pagination
      };

    } catch (error) {
      logger.error('Xero API contact retrieval failed', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Apply additional client-side filters
   */
  applyAdditionalFilters(contacts, params) {
    let filtered = [...contacts];

    // Phone filter
    if (params.phone) {
      filtered = filtered.filter(contact =>
        contact.Phones?.some(phone =>
          phone.PhoneNumber?.includes(params.phone)
        )
      );
    }

    // Location filters
    if (params.city || params.region || params.country) {
      filtered = filtered.filter(contact => {
        if (!contact.Addresses) return false;
        
        return contact.Addresses.some(address => {
          const cityMatch = !params.city || 
            address.City?.toLowerCase().includes(params.city.toLowerCase());
          const regionMatch = !params.region || 
            address.Region?.toLowerCase().includes(params.region.toLowerCase());
          const countryMatch = !params.country || 
            address.Country?.toLowerCase().includes(params.country.toLowerCase());
          
          return cityMatch && regionMatch && countryMatch;
        });
      });
    }

    // Has transactions filter
    if (params.hasTransactions) {
      filtered = filtered.filter(contact => 
        contact.AccountsReceivableTaxType || 
        contact.AccountsPayableTaxType ||
        contact.SalesTrackingCategories?.length > 0 ||
        contact.PurchasesTrackingCategories?.length > 0
      );
    }

    return filtered;
  }

  /**
   * Apply pagination to results
   */
  applyPagination(contacts, params) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedContacts = contacts.slice(startIndex, endIndex);

    return {
      contacts: paginatedContacts,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: contacts.length,
        totalPages: Math.ceil(contacts.length / pageSize),
        hasNextPage: endIndex < contacts.length,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Enrich contact data with additional information
   */
  async enrichContactData(contacts, params, correlationId) {
    try {
      const enrichedContacts = [];

      for (const contact of contacts) {
        const enrichedContact = { ...contact };

        // Add calculated fields
        enrichedContact.primaryEmail = this.getPrimaryEmail(contact);
        enrichedContact.primaryPhone = this.getPrimaryPhone(contact);
        enrichedContact.primaryAddress = this.getPrimaryAddress(contact);
        enrichedContact.contactAge = this.calculateContactAge(contact);

        // Include transaction summary if requested
        if (params.includeTransactionSummary && contact.ContactID) {
          try {
            const transactionSummary = await this.getContactTransactionSummary(
              params.tenantId,
              contact.ContactID,
              correlationId
            );
            enrichedContact.transactionSummary = transactionSummary;
          } catch (error) {
            logger.warn('Failed to retrieve transaction summary for contact', {
              correlationId,
              contactID: contact.ContactID,
              error: error.message
            });
            enrichedContact.transactionSummary = null;
          }
        }

        enrichedContacts.push(enrichedContact);
      }

      return enrichedContacts;

    } catch (error) {
      logger.error('Contact enrichment failed', {
        correlationId,
        error: error.message
      });
      // Return original contacts if enrichment fails
      return contacts;
    }
  }

  /**
   * Get primary email address for contact
   */
  getPrimaryEmail(contact) {
    return contact.EmailAddress || 
           contact.ContactPersons?.[0]?.EmailAddress || 
           null;
  }

  /**
   * Get primary phone number for contact
   */
  getPrimaryPhone(contact) {
    if (!contact.Phones || contact.Phones.length === 0) {
      return null;
    }

    // Look for mobile first, then default, then any
    const mobile = contact.Phones.find(p => p.PhoneType === 'MOBILE');
    if (mobile) return mobile.PhoneNumber;

    const defaultPhone = contact.Phones.find(p => p.PhoneType === 'DEFAULT');
    if (defaultPhone) return defaultPhone.PhoneNumber;

    return contact.Phones[0]?.PhoneNumber || null;
  }

  /**
   * Get primary address for contact
   */
  getPrimaryAddress(contact) {
    if (!contact.Addresses || contact.Addresses.length === 0) {
      return null;
    }

    // Look for postal address first, then any
    const postal = contact.Addresses.find(a => a.AddressType === 'POBOX' || a.AddressType === 'STREET');
    if (postal) return postal;

    return contact.Addresses[0] || null;
  }

  /**
   * Calculate contact age in days
   */
  calculateContactAge(contact) {
    if (!contact.CreatedDateUTC) return null;
    
    const createdDate = new Date(contact.CreatedDateUTC);
    const today = new Date();
    
    return Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get transaction summary for a contact
   */
  async getContactTransactionSummary(tenantId, contactID, correlationId) {
    try {
      // Get invoices for this contact
      const invoicesResponse = await this.xero.xeroApi.accountingApi.getInvoices(
        tenantId,
        null, // modifiedSince
        `Contact.ContactID=Guid("${contactID}")`,
        'Date DESC',
        null, // IDs
        null, // invoiceNumbers
        null, // contactIDs
        null, // statuses
        false // includeArchived
      );

      const invoices = invoicesResponse.body?.invoices || [];

      // Calculate summary statistics
      const summary = {
        totalInvoices: invoices.length,
        totalSales: 0,
        totalReceivable: 0,
        totalPurchases: 0,
        totalPayable: 0,
        lastTransactionDate: null,
        averageInvoiceValue: 0,
        paymentHistory: {
          onTime: 0,
          late: 0,
          averageDaysToPayment: 0
        }
      };

      let totalSalesAmount = 0;
      let totalReceivableAmount = 0;
      let totalPurchasesAmount = 0;
      let totalPayableAmount = 0;
      let latestDate = null;

      for (const invoice of invoices) {
        const amount = parseFloat(invoice.Total || 0);
        const amountDue = parseFloat(invoice.AmountDue || 0);
        const invoiceDate = new Date(invoice.DateString);

        if (!latestDate || invoiceDate > latestDate) {
          latestDate = invoiceDate;
        }

        if (invoice.Type === 'ACCREC') {
          totalSalesAmount += amount;
          totalReceivableAmount += amountDue;
        } else if (invoice.Type === 'ACCPAY') {
          totalPurchasesAmount += amount;
          totalPayableAmount += amountDue;
        }
      }

      summary.totalSales = totalSalesAmount;
      summary.totalReceivable = totalReceivableAmount;
      summary.totalPurchases = totalPurchasesAmount;
      summary.totalPayable = totalPayableAmount;
      summary.lastTransactionDate = latestDate?.toISOString() || null;
      summary.averageInvoiceValue = invoices.length > 0 
        ? (totalSalesAmount + totalPurchasesAmount) / invoices.length 
        : 0;

      return summary;

    } catch (error) {
      logger.debug('Transaction summary retrieval failed', {
        correlationId,
        contactID,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get contact groups
   */
  async getContactGroups(tenantId, correlationId) {
    try {
      const response = await this.xero.xeroApi.accountingApi.getContactGroups(
        tenantId,
        'Name ASC'
      );

      return response.body?.contactGroups || [];

    } catch (error) {
      logger.debug('Contact groups retrieval failed', {
        correlationId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Perform contact analysis
   */
  async performContactAnalysis(contacts, params, correlationId) {
    const analysis = {};

    try {
      // Contact type distribution
      analysis.typeDistribution = this.analyzeContactTypes(contacts);

      // Geographic distribution
      analysis.geographicDistribution = this.analyzeGeographicDistribution(contacts);

      // Relationship strength analysis
      if (params.includeRelationshipAnalysis) {
        analysis.relationshipStrength = this.analyzeRelationshipStrength(contacts);
      }

      // Contact activity analysis
      analysis.activityAnalysis = this.analyzeContactActivity(contacts);

      // Summary statistics
      analysis.summary = this.calculateContactSummary(contacts);

      logger.debug('Contact analysis completed', {
        correlationId,
        analysisKeys: Object.keys(analysis)
      });

      return analysis;

    } catch (error) {
      logger.warn('Contact analysis failed', {
        correlationId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Analyze contact type distribution
   */
  analyzeContactTypes(contacts) {
    const distribution = {
      customers: 0,
      suppliers: 0,
      both: 0,
      neither: 0
    };

    for (const contact of contacts) {
      const isCustomer = contact.IsCustomer;
      const isSupplier = contact.IsSupplier;

      if (isCustomer && isSupplier) {
        distribution.both++;
      } else if (isCustomer) {
        distribution.customers++;
      } else if (isSupplier) {
        distribution.suppliers++;
      } else {
        distribution.neither++;
      }
    }

    return distribution;
  }

  /**
   * Analyze geographic distribution
   */
  analyzeGeographicDistribution(contacts) {
    const distribution = {
      countries: {},
      regions: {},
      cities: {}
    };

    for (const contact of contacts) {
      if (contact.Addresses) {
        for (const address of contact.Addresses) {
          // Count countries
          if (address.Country) {
            distribution.countries[address.Country] = 
              (distribution.countries[address.Country] || 0) + 1;
          }

          // Count regions/states
          if (address.Region) {
            distribution.regions[address.Region] = 
              (distribution.regions[address.Region] || 0) + 1;
          }

          // Count cities
          if (address.City) {
            distribution.cities[address.City] = 
              (distribution.cities[address.City] || 0) + 1;
          }
        }
      }
    }

    return distribution;
  }

  /**
   * Analyze relationship strength
   */
  analyzeRelationshipStrength(contacts) {
    const analysis = {
      highValue: [],
      frequent: [],
      longTerm: [],
      atRisk: []
    };

    for (const contact of contacts) {
      const summary = contact.transactionSummary;
      if (!summary) continue;

      const totalValue = summary.totalSales + summary.totalPurchases;
      const contactAge = contact.contactAge || 0;

      // High value contacts (top revenue)
      if (totalValue > 10000) {
        analysis.highValue.push({
          contactID: contact.ContactID,
          name: contact.Name,
          totalValue
        });
      }

      // Long-term relationships (over 2 years)
      if (contactAge > 730) {
        analysis.longTerm.push({
          contactID: contact.ContactID,
          name: contact.Name,
          contactAge
        });
      }

      // At-risk contacts (high receivables)
      if (summary.totalReceivable > 5000) {
        analysis.atRisk.push({
          contactID: contact.ContactID,
          name: contact.Name,
          totalReceivable: summary.totalReceivable
        });
      }
    }

    // Sort by value/risk
    analysis.highValue.sort((a, b) => b.totalValue - a.totalValue);
    analysis.atRisk.sort((a, b) => b.totalReceivable - a.totalReceivable);

    return analysis;
  }

  /**
   * Analyze contact activity
   */
  analyzeContactActivity(contacts) {
    const activity = {
      withTransactions: 0,
      withoutTransactions: 0,
      recentlyActive: 0,
      dormant: 0
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const contact of contacts) {
      const summary = contact.transactionSummary;
      
      if (summary && summary.totalInvoices > 0) {
        activity.withTransactions++;
        
        if (summary.lastTransactionDate) {
          const lastTransaction = new Date(summary.lastTransactionDate);
          if (lastTransaction > thirtyDaysAgo) {
            activity.recentlyActive++;
          } else {
            activity.dormant++;
          }
        }
      } else {
        activity.withoutTransactions++;
      }
    }

    return activity;
  }

  /**
   * Calculate contact summary statistics
   */
  calculateContactSummary(contacts) {
    const summary = {
      totalContacts: contacts.length,
      averageContactAge: 0,
      contactsWithEmail: 0,
      contactsWithPhone: 0,
      contactsWithAddress: 0
    };

    let totalAge = 0;
    let contactsWithAge = 0;

    for (const contact of contacts) {
      if (contact.primaryEmail) {
        summary.contactsWithEmail++;
      }
      
      if (contact.primaryPhone) {
        summary.contactsWithPhone++;
      }
      
      if (contact.primaryAddress) {
        summary.contactsWithAddress++;
      }

      if (contact.contactAge) {
        totalAge += contact.contactAge;
        contactsWithAge++;
      }
    }

    summary.averageContactAge = contactsWithAge > 0 
      ? totalAge / contactsWithAge 
      : 0;

    return summary;
  }

  /**
   * Format the final response
   */
  async formatResponse(contacts, analysis, contactGroups, pagination, params) {
    const response = {
      contacts,
      pagination,
      filters: {
        contactType: params.contactType,
        status: params.status,
        searchTerm: params.searchTerm
      }
    };

    if (analysis) {
      response.analysis = analysis;
    }

    if (contactGroups) {
      response.contactGroups = contactGroups;
    }

    // Handle export formats
    if (params.exportFormat === 'csv') {
      response.csvData = await this.convertToCSV(contacts);
    } else if (params.exportFormat === 'xlsx') {
      response.excelData = await this.convertToExcel(contacts);
    } else if (params.exportFormat === 'vcard') {
      response.vcardData = await this.convertToVCard(contacts);
    }

    return response;
  }

  /**
   * Convert contacts to CSV format
   */
  async convertToCSV(contacts) {
    const headers = [
      'Contact ID', 'Name', 'Email', 'Phone', 'Is Customer', 'Is Supplier',
      'City', 'Region', 'Country', 'Contact Status', 'Created Date'
    ];

    const rows = contacts.map(contact => [
      contact.ContactID || '',
      contact.Name || '',
      contact.primaryEmail || '',
      contact.primaryPhone || '',
      contact.IsCustomer || false,
      contact.IsSupplier || false,
      contact.primaryAddress?.City || '',
      contact.primaryAddress?.Region || '',
      contact.primaryAddress?.Country || '',
      contact.ContactStatus || '',
      contact.CreatedDateUTC || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert contacts to Excel format
   */
  async convertToExcel(contacts) {
    // Implementation would create Excel file
    // This is a placeholder
    return 'Excel export placeholder';
  }

  /**
   * Convert contacts to vCard format
   */
  async convertToVCard(contacts) {
    const vcards = contacts.map(contact => {
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${contact.Name || ''}`,
        `ORG:${contact.Name || ''}`,
      ];

      if (contact.primaryEmail) {
        vcard.push(`EMAIL:${contact.primaryEmail}`);
      }

      if (contact.primaryPhone) {
        vcard.push(`TEL:${contact.primaryPhone}`);
      }

      if (contact.primaryAddress) {
        const addr = contact.primaryAddress;
        vcard.push(`ADR:;;${addr.AddressLine1 || ''};${addr.City || ''};${addr.Region || ''};${addr.PostalCode || ''};${addr.Country || ''}`);
      }

      vcard.push('END:VCARD');
      return vcard.join('\n');
    });

    return vcards.join('\n\n');
  }
}