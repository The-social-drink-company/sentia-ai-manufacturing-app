/**
 * Unleashed Get Customers Tool
 * 
 * Retrieves customer master data with order history, patterns analysis,
 * credit management, profitability assessment, and relationship management.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class GetCustomersTool {
  constructor(apiClient, cache, dataValidator) {
    this.apiClient = apiClient;
    this.cache = cache;
    this.dataValidator = dataValidator;
    this.isInitialized = false;
    
    // Tool metadata
    this.name = 'unleashed-get-customers';
    this.description = 'Retrieve customer master data with order history, profitability analysis, and relationship management';
    this.category = 'unleashed';
    this.version = '1.0.0';
    
    // Input schema for validation
    this.inputSchema = {
      type: 'object',
      properties: {
        customerCode: {
          type: 'string',
          description: 'Specific customer code to retrieve'
        },
        customerGuid: {
          type: 'string',
          description: 'Specific customer GUID to retrieve'
        },
        includeInactive: {
          type: 'boolean',
          default: false,
          description: 'Include inactive customers in results'
        },
        includeOrderHistory: {
          type: 'boolean',
          default: true,
          description: 'Include customer order history'
        },
        includeProfitability: {
          type: 'boolean',
          default: false,
          description: 'Include profitability analysis'
        },
        includeContacts: {
          type: 'boolean',
          default: false,
          description: 'Include customer contact information'
        },
        modifiedSince: {
          type: 'string',
          format: 'date-time',
          description: 'Only return customers modified since this date'
        },
        pageSize: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          default: 200,
          description: 'Number of customers per page'
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1,
          description: 'Page number for pagination'
        },
        sortBy: {
          type: 'string',
          enum: ['CustomerCode', 'CustomerName', 'Country', 'LastModifiedOn'],
          default: 'CustomerCode',
          description: 'Field to sort results by'
        }
      }
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Unleashed Get Customers tool...');
      this.isInitialized = true;
      logger.info('Get Customers tool initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Get Customers tool', { error: error.message });
      throw error;
    }
  }

  async execute(params = {}) {
    try {
      logger.info('Executing Unleashed get customers request', {
        customerCode: params.customerCode,
        includeOrderHistory: params.includeOrderHistory,
        pageSize: params.pageSize || 200
      });

      const validationResult = this.dataValidator.validateInput(params, this.inputSchema);
      if (!validationResult.valid) {
        throw new Error(`Invalid parameters: ${validationResult.errors.join(', ')}`);
      }

      const queryParams = this.buildQueryParams(params);
      const cacheKey = this.generateCacheKey(queryParams);
      
      if (this.cache && params.useCache !== false) {
        const cachedData = await this.cache.get(cacheKey);
        if (cachedData) {
          logger.debug('Returning cached customers data');
          return cachedData;
        }
      }

      const endpoint = params.customerGuid ? `/Customers/${params.customerGuid}` : '/Customers';
      const response = await this.apiClient.get(endpoint, queryParams);
      const processedData = await this.processCustomersData(response.data, params);
      
      if (this.cache && params.useCache !== false) {
        await this.cache.set(cacheKey, processedData, 1800); // 30 minute cache
      }

      logger.info('Customers data retrieved successfully', {
        customerCount: Array.isArray(processedData.customers) ? processedData.customers.length : 1
      });

      return processedData;

    } catch (error) {
      logger.error('Get customers execution failed', { error: error.message, params });
      throw error;
    }
  }

  buildQueryParams(params) {
    const queryParams = {};
    if (params.customerCode) queryParams.customerCode = params.customerCode;
    if (params.includeInactive) queryParams.includeInactive = 'true';
    if (params.includeOrderHistory) queryParams.includeOrderHistory = 'true';
    if (params.includeProfitability) queryParams.includeProfitability = 'true';
    if (params.includeContacts) queryParams.includeContacts = 'true';
    if (params.modifiedSince) queryParams.modifiedSince = params.modifiedSince;
    queryParams.pageSize = params.pageSize || 200;
    queryParams.page = params.page || 1;
    if (params.sortBy) queryParams.sort = params.sortBy;
    return queryParams;
  }

  async processCustomersData(rawData, params) {
    try {
      const customers = Array.isArray(rawData) ? rawData : [rawData];
      const processedCustomers = [];

      for (const customer of customers) {
        const processedCustomer = {
          guid: customer.Guid,
          customerCode: customer.CustomerCode,
          customerName: customer.CustomerName,
          companyName: customer.CompanyName,
          address: {
            line1: customer.AddressLine1,
            line2: customer.AddressLine2,
            city: customer.City,
            region: customer.Region,
            postalCode: customer.PostalCode,
            country: customer.Country
          },
          contact: {
            phone: customer.PhoneNumber,
            fax: customer.FaxNumber,
            email: customer.Email,
            website: customer.Website
          },
          financial: {
            currency: customer.Currency,
            paymentTerms: customer.PaymentTerms,
            creditLimit: customer.CreditLimit || 0,
            currentBalance: customer.CurrentBalance || 0,
            taxNumber: customer.TaxNumber,
            taxRate: customer.TaxRate || 0
          },
          preferences: {
            priceGroup: customer.PriceGroup,
            salesPerson: customer.SalesPerson,
            deliveryMethod: customer.DeliveryMethod
          },
          status: {
            obsolete: customer.Obsolete,
            active: !customer.Obsolete,
            onHold: customer.OnHold || false
          },
          metadata: {
            createdBy: customer.CreatedBy,
            createdOn: customer.CreatedOn,
            lastModifiedOn: customer.LastModifiedOn,
            lastOrderDate: customer.LastOrderDate
          },
          orderHistory: [],
          profitability: {},
          contacts: [],
          analytics: {}
        };

        if (params.includeOrderHistory && customer.Guid) {
          try {
            processedCustomer.orderHistory = await this.getCustomerOrderHistory(customer.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve order history', { customerCode: customer.CustomerCode, error: error.message });
          }
        }

        if (params.includeProfitability && customer.Guid) {
          try {
            processedCustomer.profitability = await this.getCustomerProfitability(customer.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve profitability data', { customerCode: customer.CustomerCode, error: error.message });
          }
        }

        if (params.includeContacts && customer.Guid) {
          try {
            processedCustomer.contacts = await this.getCustomerContacts(customer.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve contacts', { customerCode: customer.CustomerCode, error: error.message });
          }
        }

        processedCustomer.analytics = this.calculateCustomerAnalytics(processedCustomer);
        processedCustomers.push(processedCustomer);
      }

      return {
        success: true,
        customers: processedCustomers,
        summary: this.calculateCustomerSummary(processedCustomers),
        analysis: this.performCustomerAnalysis(processedCustomers),
        metadata: {
          retrievedAt: new Date().toISOString(),
          includeOrderHistory: params.includeOrderHistory,
          includeProfitability: params.includeProfitability,
          includeContacts: params.includeContacts
        }
      };

    } catch (error) {
      logger.error('Failed to process customers data', { error: error.message });
      throw error;
    }
  }

  async getCustomerOrderHistory(customerGuid) {
    try {
      const response = await this.apiClient.get(`/Customers/${customerGuid}/Orders`, { pageSize: 50 });
      return response.data.map(order => ({
        orderNumber: order.OrderNumber,
        orderDate: order.OrderDate,
        status: order.Status,
        total: order.Total || 0,
        currency: order.Currency
      }));
    } catch (error) {
      logger.debug('No order history available for customer', { customerGuid });
      return [];
    }
  }

  async getCustomerProfitability(customerGuid) {
    try {
      const response = await this.apiClient.get(`/Customers/${customerGuid}/Profitability`);
      return {
        totalRevenue: response.data.TotalRevenue || 0,
        totalCost: response.data.TotalCost || 0,
        grossProfit: response.data.GrossProfit || 0,
        marginPercentage: response.data.MarginPercentage || 0,
        averageOrderValue: response.data.AverageOrderValue || 0,
        lifetimeValue: response.data.LifetimeValue || 0,
        profitabilityRank: response.data.ProfitabilityRank || 'unranked'
      };
    } catch (error) {
      logger.debug('No profitability data available for customer', { customerGuid });
      return {};
    }
  }

  async getCustomerContacts(customerGuid) {
    try {
      const response = await this.apiClient.get(`/Customers/${customerGuid}/Contacts`);
      return response.data.map(contact => ({
        contactId: contact.ContactId,
        name: contact.Name,
        title: contact.Title,
        email: contact.Email,
        phone: contact.Phone,
        department: contact.Department,
        isPrimary: contact.IsPrimary || false
      }));
    } catch (error) {
      logger.debug('No contacts available for customer', { customerGuid });
      return [];
    }
  }

  calculateCustomerAnalytics(customer) {
    const analytics = {
      valueSegment: 'standard',
      riskLevel: 'low',
      loyaltyScore: 0,
      orderFrequency: 'irregular',
      creditUtilization: 0,
      recommendations: []
    };

    // Calculate value segment
    const totalValue = customer.profitability.totalRevenue || 0;
    if (totalValue > 500000) {
      analytics.valueSegment = 'premium';
    } else if (totalValue > 100000) {
      analytics.valueSegment = 'preferred';
    }

    // Calculate credit utilization
    if (customer.financial.creditLimit > 0) {
      analytics.creditUtilization = (customer.financial.currentBalance / customer.financial.creditLimit) * 100;
    }

    // Assess risk level
    if (analytics.creditUtilization > 90) {
      analytics.riskLevel = 'high';
      analytics.recommendations.push('Review credit terms - high utilization');
    } else if (analytics.creditUtilization > 70) {
      analytics.riskLevel = 'medium';
    }

    if (customer.status.onHold) {
      analytics.riskLevel = 'high';
      analytics.recommendations.push('Account on hold - review required');
    }

    // Calculate loyalty score based on order history
    const orderCount = customer.orderHistory.length;
    if (orderCount > 50) {
      analytics.loyaltyScore = 95;
      analytics.orderFrequency = 'regular';
    } else if (orderCount > 20) {
      analytics.loyaltyScore = 80;
      analytics.orderFrequency = 'frequent';
    } else if (orderCount > 5) {
      analytics.loyaltyScore = 60;
      analytics.orderFrequency = 'occasional';
    }

    // Generate recommendations
    if (customer.profitability.marginPercentage < 10) {
      analytics.recommendations.push('Review pricing strategy - low margins');
    }

    if (orderCount === 0) {
      analytics.recommendations.push('No order history - potential new customer');
    }

    return analytics;
  }

  calculateCustomerSummary(customers) {
    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status.active).length,
      inactiveCustomers: customers.filter(c => !c.status.active).length,
      onHoldCustomers: customers.filter(c => c.status.onHold).length,
      premiumCustomers: customers.filter(c => c.analytics.valueSegment === 'premium').length,
      preferredCustomers: customers.filter(c => c.analytics.valueSegment === 'preferred').length,
      highRiskCustomers: customers.filter(c => c.analytics.riskLevel === 'high').length,
      totalRevenue: customers.reduce((sum, c) => sum + (c.profitability.totalRevenue || 0), 0),
      averageOrderValue: this.calculateAverage(customers.map(c => c.profitability.averageOrderValue || 0)),
      countriesRepresented: new Set(customers.map(c => c.address.country)).size
    };
  }

  performCustomerAnalysis(customers) {
    return {
      segmentationAnalysis: this.analyzeCustomerSegmentation(customers),
      riskAssessment: this.assessCustomerRisks(customers),
      geographicDistribution: this.analyzeGeographicDistribution(customers),
      profitabilityAnalysis: this.analyzeProfitability(customers)
    };
  }

  analyzeCustomerSegmentation(customers) {
    const segmentation = { premium: 0, preferred: 0, standard: 0 };
    customers.forEach(customer => {
      segmentation[customer.analytics.valueSegment]++;
    });
    return segmentation;
  }

  assessCustomerRisks(customers) {
    const risks = {
      high: customers.filter(c => c.analytics.riskLevel === 'high').length,
      medium: customers.filter(c => c.analytics.riskLevel === 'medium').length,
      low: customers.filter(c => c.analytics.riskLevel === 'low').length
    };

    const riskFactors = [];
    const highCreditUtilization = customers.filter(c => c.analytics.creditUtilization > 80).length;
    const onHoldAccounts = customers.filter(c => c.status.onHold).length;
    
    if (highCreditUtilization > customers.length * 0.1) {
      riskFactors.push('High credit utilization across customer base');
    }
    if (onHoldAccounts > 0) {
      riskFactors.push(`${onHoldAccounts} accounts currently on hold`);
    }

    return { ...risks, riskFactors };
  }

  analyzeGeographicDistribution(customers) {
    const countryDistribution = {};
    customers.forEach(customer => {
      const country = customer.address.country || 'Unknown';
      countryDistribution[country] = (countryDistribution[country] || 0) + 1;
    });
    return countryDistribution;
  }

  analyzeProfitability(customers) {
    const profitableCustomers = customers.filter(c => c.profitability.grossProfit > 0);
    return {
      profitableCustomerCount: profitableCustomers.length,
      totalGrossProfit: customers.reduce((sum, c) => sum + (c.profitability.grossProfit || 0), 0),
      averageMargin: this.calculateAverage(customers.map(c => c.profitability.marginPercentage || 0)),
      topCustomersByRevenue: customers
        .sort((a, b) => (b.profitability.totalRevenue || 0) - (a.profitability.totalRevenue || 0))
        .slice(0, 10)
        .map(c => ({
          customerCode: c.customerCode,
          customerName: c.customerName,
          revenue: c.profitability.totalRevenue || 0
        }))
    };
  }

  calculateAverage(values) {
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    return validValues.length > 0 ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
  }

  generateCacheKey(params) {
    return `unleashed:customers:${JSON.stringify(params)}`;
  }

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      category: this.category,
      version: this.version
    };
  }
}