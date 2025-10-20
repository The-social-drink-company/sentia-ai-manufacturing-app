/**
 * Unleashed Get Suppliers Tool
 * 
 * Retrieves supplier master data with performance metrics, ratings,
 * lead time analysis, cost comparisons, and quality assessments.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class GetSuppliersTool {
  constructor(apiClient, cache, dataValidator) {
    this.apiClient = apiClient;
    this.cache = cache;
    this.dataValidator = dataValidator;
    this.isInitialized = false;
    
    // Tool metadata
    this.name = 'unleashed-get-suppliers';
    this.description = 'Retrieve supplier master data with performance metrics, ratings, and quality assessments';
    this.category = 'unleashed';
    this.version = '1.0.0';
    
    // Input schema for validation
    this.inputSchema = {
      type: 'object',
      properties: {
        supplierCode: {
          type: 'string',
          description: 'Specific supplier code to retrieve'
        },
        supplierGuid: {
          type: 'string',
          description: 'Specific supplier GUID to retrieve'
        },
        includeInactive: {
          type: 'boolean',
          default: false,
          description: 'Include inactive suppliers in results'
        },
        includePerformance: {
          type: 'boolean',
          default: true,
          description: 'Include supplier performance metrics'
        },
        includeContacts: {
          type: 'boolean',
          default: false,
          description: 'Include supplier contact information'
        },
        includeProducts: {
          type: 'boolean',
          default: false,
          description: 'Include products supplied by this supplier'
        },
        modifiedSince: {
          type: 'string',
          format: 'date-time',
          description: 'Only return suppliers modified since this date'
        },
        pageSize: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          default: 200,
          description: 'Number of suppliers per page'
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1,
          description: 'Page number for pagination'
        },
        sortBy: {
          type: 'string',
          enum: ['SupplierCode', 'SupplierName', 'Country', 'LastModifiedOn'],
          default: 'SupplierCode',
          description: 'Field to sort results by'
        }
      }
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Unleashed Get Suppliers tool...');
      this.isInitialized = true;
      logger.info('Get Suppliers tool initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Get Suppliers tool', { error: error.message });
      throw error;
    }
  }

  async execute(params = {}) {
    try {
      logger.info('Executing Unleashed get suppliers request', {
        supplierCode: params.supplierCode,
        includePerformance: params.includePerformance,
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
          logger.debug('Returning cached suppliers data');
          return cachedData;
        }
      }

      const endpoint = params.supplierGuid ? `/Suppliers/${params.supplierGuid}` : '/Suppliers';
      const response = await this.apiClient.get(endpoint, queryParams);
      const processedData = await this.processSuppliersData(response.data, params);
      
      if (this.cache && params.useCache !== false) {
        await this.cache.set(cacheKey, processedData, 1800); // 30 minute cache
      }

      logger.info('Suppliers data retrieved successfully', {
        supplierCount: Array.isArray(processedData.suppliers) ? processedData.suppliers.length : 1
      });

      return processedData;

    } catch (error) {
      logger.error('Get suppliers execution failed', { error: error.message, params });
      throw error;
    }
  }

  buildQueryParams(params) {
    const queryParams = {};
    if (params.supplierCode) queryParams.supplierCode = params.supplierCode;
    if (params.includeInactive) queryParams.includeInactive = 'true';
    if (params.includePerformance) queryParams.includePerformance = 'true';
    if (params.includeContacts) queryParams.includeContacts = 'true';
    if (params.includeProducts) queryParams.includeProducts = 'true';
    if (params.modifiedSince) queryParams.modifiedSince = params.modifiedSince;
    queryParams.pageSize = params.pageSize || 200;
    queryParams.page = params.page || 1;
    if (params.sortBy) queryParams.sort = params.sortBy;
    return queryParams;
  }

  async processSuppliersData(rawData, params) {
    try {
      const suppliers = Array.isArray(rawData) ? rawData : [rawData];
      const processedSuppliers = [];

      for (const supplier of suppliers) {
        const processedSupplier = {
          guid: supplier.Guid,
          supplierCode: supplier.SupplierCode,
          supplierName: supplier.SupplierName,
          companyName: supplier.CompanyName,
          address: {
            line1: supplier.AddressLine1,
            line2: supplier.AddressLine2,
            city: supplier.City,
            region: supplier.Region,
            postalCode: supplier.PostalCode,
            country: supplier.Country
          },
          contact: {
            phone: supplier.PhoneNumber,
            fax: supplier.FaxNumber,
            email: supplier.Email,
            website: supplier.Website
          },
          financial: {
            currency: supplier.Currency,
            paymentTerms: supplier.PaymentTerms,
            taxNumber: supplier.TaxNumber,
            taxRate: supplier.TaxRate || 0
          },
          status: {
            obsolete: supplier.Obsolete,
            active: !supplier.Obsolete
          },
          metadata: {
            createdBy: supplier.CreatedBy,
            createdOn: supplier.CreatedOn,
            lastModifiedOn: supplier.LastModifiedOn
          },
          performance: {},
          contacts: [],
          products: [],
          analytics: {}
        };

        if (params.includePerformance && supplier.Guid) {
          try {
            processedSupplier.performance = await this.getSupplierPerformance(supplier.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve performance data', { supplierCode: supplier.SupplierCode, error: error.message });
          }
        }

        if (params.includeContacts && supplier.Guid) {
          try {
            processedSupplier.contacts = await this.getSupplierContacts(supplier.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve contacts', { supplierCode: supplier.SupplierCode, error: error.message });
          }
        }

        if (params.includeProducts && supplier.Guid) {
          try {
            processedSupplier.products = await this.getSupplierProducts(supplier.Guid);
          } catch (error) {
            logger.warn('Failed to retrieve products', { supplierCode: supplier.SupplierCode, error: error.message });
          }
        }

        processedSupplier.analytics = this.calculateSupplierAnalytics(processedSupplier);
        processedSuppliers.push(processedSupplier);
      }

      return {
        success: true,
        suppliers: processedSuppliers,
        summary: this.calculateSupplierSummary(processedSuppliers),
        analysis: this.performSupplierAnalysis(processedSuppliers),
        metadata: {
          retrievedAt: new Date().toISOString(),
          includePerformance: params.includePerformance,
          includeContacts: params.includeContacts,
          includeProducts: params.includeProducts
        }
      };

    } catch (error) {
      logger.error('Failed to process suppliers data', { error: error.message });
      throw error;
    }
  }

  async getSupplierPerformance(supplierGuid) {
    try {
      const response = await this.apiClient.get(`/Suppliers/${supplierGuid}/Performance`);
      return {
        onTimeDeliveryRate: response.data.OnTimeDeliveryRate || 0,
        qualityRating: response.data.QualityRating || 0,
        averageLeadTime: response.data.AverageLeadTime || 0,
        costPerformance: response.data.CostPerformance || 0,
        overallRating: response.data.OverallRating || 0,
        totalOrders: response.data.TotalOrders || 0,
        totalSpend: response.data.TotalSpend || 0,
        lastEvaluation: response.data.LastEvaluation,
        certifications: response.data.Certifications || [],
        riskLevel: response.data.RiskLevel || 'medium'
      };
    } catch (error) {
      logger.debug('No performance data available for supplier', { supplierGuid });
      return {};
    }
  }

  async getSupplierContacts(supplierGuid) {
    try {
      const response = await this.apiClient.get(`/Suppliers/${supplierGuid}/Contacts`);
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
      logger.debug('No contacts available for supplier', { supplierGuid });
      return [];
    }
  }

  async getSupplierProducts(supplierGuid) {
    try {
      const response = await this.apiClient.get(`/Suppliers/${supplierGuid}/Products`);
      return response.data.map(product => ({
        productCode: product.ProductCode,
        productDescription: product.ProductDescription,
        supplierProductCode: product.SupplierProductCode,
        unitCost: product.UnitCost || 0,
        leadTime: product.LeadTime || 0,
        minimumOrderQuantity: product.MinimumOrderQuantity || 0,
        lastOrderDate: product.LastOrderDate
      }));
    } catch (error) {
      logger.debug('No products available for supplier', { supplierGuid });
      return [];
    }
  }

  calculateSupplierAnalytics(supplier) {
    const analytics = {
      riskScore: 0,
      valueCategory: 'standard',
      performanceGrade: 'C',
      recommendations: []
    };

    // Calculate risk score
    let riskFactors = 0;
    if (supplier.performance.onTimeDeliveryRate < 85) riskFactors++;
    if (supplier.performance.qualityRating < 4) riskFactors++;
    if (supplier.performance.averageLeadTime > 14) riskFactors++;
    
    analytics.riskScore = (riskFactors / 3) * 100;

    // Determine value category
    if (supplier.performance.totalSpend > 100000) {
      analytics.valueCategory = 'strategic';
    } else if (supplier.performance.totalSpend > 50000) {
      analytics.valueCategory = 'preferred';
    }

    // Calculate performance grade
    const overallRating = supplier.performance.overallRating || 0;
    if (overallRating >= 4.5) analytics.performanceGrade = 'A';
    else if (overallRating >= 4.0) analytics.performanceGrade = 'B';
    else if (overallRating >= 3.0) analytics.performanceGrade = 'C';
    else analytics.performanceGrade = 'D';

    // Generate recommendations
    if (supplier.performance.onTimeDeliveryRate < 90) {
      analytics.recommendations.push('Improve delivery reliability');
    }
    if (supplier.performance.qualityRating < 4.5) {
      analytics.recommendations.push('Focus on quality improvements');
    }

    return analytics;
  }

  calculateSupplierSummary(suppliers) {
    return {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(s => s.status.active).length,
      inactiveSuppliers: suppliers.filter(s => !s.status.active).length,
      strategicSuppliers: suppliers.filter(s => s.analytics.valueCategory === 'strategic').length,
      preferredSuppliers: suppliers.filter(s => s.analytics.valueCategory === 'preferred').length,
      averagePerformanceRating: this.calculateAverage(suppliers.map(s => s.performance.overallRating || 0)),
      averageOnTimeDelivery: this.calculateAverage(suppliers.map(s => s.performance.onTimeDeliveryRate || 0)),
      countriesRepresented: new Set(suppliers.map(s => s.address.country)).size
    };
  }

  performSupplierAnalysis(suppliers) {
    return {
      performanceDistribution: this.analyzePerformanceDistribution(suppliers),
      riskAssessment: this.assessSupplierRisks(suppliers),
      geographicDistribution: this.analyzeGeographicDistribution(suppliers),
      valueSegmentation: this.analyzeValueSegmentation(suppliers)
    };
  }

  analyzePerformanceDistribution(suppliers) {
    const grades = { A: 0, B: 0, C: 0, D: 0 };
    suppliers.forEach(supplier => {
      grades[supplier.analytics.performanceGrade]++;
    });
    return grades;
  }

  assessSupplierRisks(suppliers) {
    const highRisk = suppliers.filter(s => s.analytics.riskScore > 70);
    const mediumRisk = suppliers.filter(s => s.analytics.riskScore > 30 && s.analytics.riskScore <= 70);
    const lowRisk = suppliers.filter(s => s.analytics.riskScore <= 30);

    return {
      highRisk: highRisk.length,
      mediumRisk: mediumRisk.length,
      lowRisk: lowRisk.length,
      riskFactors: this.identifyCommonRiskFactors(suppliers)
    };
  }

  analyzeGeographicDistribution(suppliers) {
    const countryDistribution = {};
    suppliers.forEach(supplier => {
      const country = supplier.address.country || 'Unknown';
      countryDistribution[country] = (countryDistribution[country] || 0) + 1;
    });
    return countryDistribution;
  }

  analyzeValueSegmentation(suppliers) {
    const segmentation = { strategic: 0, preferred: 0, standard: 0 };
    suppliers.forEach(supplier => {
      segmentation[supplier.analytics.valueCategory]++;
    });
    return segmentation;
  }

  identifyCommonRiskFactors(suppliers) {
    const riskFactors = [];
    const poorDelivery = suppliers.filter(s => s.performance.onTimeDeliveryRate < 85).length;
    const poorQuality = suppliers.filter(s => s.performance.qualityRating < 4).length;
    
    if (poorDelivery > suppliers.length * 0.2) {
      riskFactors.push('Delivery reliability issues');
    }
    if (poorQuality > suppliers.length * 0.2) {
      riskFactors.push('Quality consistency issues');
    }
    
    return riskFactors;
  }

  calculateAverage(values) {
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    return validValues.length > 0 ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
  }

  generateCacheKey(params) {
    return `unleashed:suppliers:${JSON.stringify(params)}`;
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