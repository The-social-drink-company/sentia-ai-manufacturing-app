/**
 * Multi-Entity Import Service - Prompt 4 Enhancement
 * 
 * Handles multi-entity and multi-currency data imports with:
 * - Entity-specific validation rules
 * - Currency conversion and validation
 * - Regional compliance checks
 * - Cross-entity data relationships
 * - Entity-aware financial impact calculations
 */

import { logInfo, logWarn, logError } from '../logger.js';
import dbService from '../../src/services/db/index.js';

class MultiEntityImportService {
  constructor() {
    // Currency exchange rates (in production, fetch from external API)
    this.exchangeRates = {
      'GBP': { EUR: 1.17, USD: 1.27, CAD: 1.65, AUD: 1.85 },
      'EUR': { GBP: 0.85, USD: 1.08, CAD: 1.41, AUD: 1.58 },
      'USD': { GBP: 0.79, EUR: 0.93, CAD: 1.30, AUD: 1.46 }
    };

    // Regional compliance rules
    this.regionalCompliance = {
      'UK': {
        requiredFields: ['vat_number'],
        taxRateRange: [0.00, 0.20],
        currencyDefault: 'GBP',
        dateFormat: 'DD/MM/YYYY',
        decimalSeparator: '.',
        allowedCountries: ['GB']
      },
      'EU': {
        requiredFields: ['vat_number', 'eu_tax_id'],
        taxRateRange: [0.00, 0.27],
        currencyDefault: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        decimalSeparator: ',',
        allowedCountries: ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'DK', 'SE', 'NO', 'FI']
      },
      'USA': {
        requiredFields: ['tax_id'],
        taxRateRange: [0.00, 0.12],
        currencyDefault: 'USD',
        dateFormat: 'MM/DD/YYYY',
        decimalSeparator: '.',
        allowedCountries: ['US']
      }
    };

    // Entity-specific business rules
    this.entityBusinessRules = new Map();
  }

  /**
   * Get entity configuration and validation rules
   */
  async getEntityConfiguration(entityId) {
    try {
      await dbService.initialize();
      const prisma = dbService.getClient();

      const entity = await prisma.entity.findUnique({
        where: { id: entityId },
        include: {
          // Include any related configuration data
          parent_entity: true
        }
      });

      if (!entity) {
        throw new Error(`Entity ${entityId} not found`);
      }

      // Get regional compliance rules
      const regionalRules = this.regionalCompliance[entity.region] || {};

      return {
        entity: entity,
        region: entity.region,
        currency: entity.currency_code,
        timezone: entity.timezone,
        locale: entity.locale,
        complianceRules: regionalRules,
        businessRules: this.entityBusinessRules.get(entityId) || []
      };
    } catch (error) {
      logError('Failed to get entity configuration', error);
      throw error;
    }
  }

  /**
   * Validate data against entity-specific rules
   */
  async validateEntityCompliance(rowData, entityConfig, rowNumber) {
    const errors = [];
    const warnings = [];

    try {
      // Currency validation
      if (rowData.currency) {
        if (rowData.currency !== entityConfig.currency) {
          // Allow other currencies but flag for conversion
          warnings.push({
            code: 'CURRENCY_CONVERSION_REQUIRED',
            message: `Currency ${rowData.currency} will be converted to entity default ${entityConfig.currency}`,
            field: 'currency',
            severity: 'warning',
            conversionRate: this.getExchangeRate(rowData.currency, entityConfig.currency)
          });
        }
      }

      // Regional compliance validation
      const compliance = entityConfig.complianceRules;
      
      if (compliance.requiredFields) {
        compliance.requiredFields.forEach(field => {
          if (!rowData[field] || rowData[field] === '') {
            errors.push({
              code: 'REGIONAL_COMPLIANCE_ERROR',
              message: `Field '${field}' is required for ${entityConfig.region} region`,
              field: field,
              severity: 'error'
            });
          }
        });
      }

      // Tax rate validation
      if (rowData.tax_rate && compliance.taxRateRange) {
        const taxRate = parseFloat(rowData.tax_rate);
        if (taxRate < compliance.taxRateRange[0] || taxRate > compliance.taxRateRange[1]) {
          warnings.push({
            code: 'TAX_RATE_OUT_OF_RANGE',
            message: `Tax rate ${taxRate} is outside normal range for ${entityConfig.region} (${compliance.taxRateRange[0]} - ${compliance.taxRateRange[1]})`,
            field: 'tax_rate',
            severity: 'warning'
          });
        }
      }

      // Country code validation
      if (rowData.country_code && compliance.allowedCountries) {
        if (!compliance.allowedCountries.includes(rowData.country_code)) {
          warnings.push({
            code: 'COUNTRY_REGION_MISMATCH',
            message: `Country ${rowData.country_code} not typical for entity region ${entityConfig.region}`,
            field: 'country_code',
            severity: 'warning'
          });
        }
      }

      // Date format validation (if date fields present)
      ['sale_date', 'production_date', 'created_date'].forEach(dateField => {
        if (rowData[dateField]) {
          const dateValidation = this.validateDateFormat(rowData[dateField], compliance.dateFormat);
          if (!dateValidation.isValid) {
            errors.push({
              code: 'DATE_FORMAT_ERROR',
              message: `Date field '${dateField}' does not match expected format ${compliance.dateFormat}`,
              field: dateField,
              severity: 'error',
              expectedFormat: compliance.dateFormat
            });
          }
        }
      });

    } catch (error) {
      errors.push({
        code: 'ENTITY_VALIDATION_ERROR',
        message: `Entity validation failed: ${error.message}`,
        severity: 'error'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate date format against regional expectations
   */
  validateDateFormat(dateValue, expectedFormat) {
    try {
      // Simple format validation - in production use proper date library
      const dateStr = dateValue.toString();
      
      switch (expectedFormat) {
        case 'DD/MM/YYYY':
          return {
            isValid: /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr),
            parsedDate: this.parseDate(dateStr, 'DD/MM/YYYY')
          };
        case 'MM/DD/YYYY':
          return {
            isValid: /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr),
            parsedDate: this.parseDate(dateStr, 'MM/DD/YYYY')
          };
        case 'YYYY-MM-DD':
          return {
            isValid: /^\d{4}-\d{2}-\d{2}$/.test(dateStr),
            parsedDate: new Date(dateStr)
          };
        default:
          return { isValid: true, parsedDate: new Date(dateStr) };
      }
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Parse date according to format
   */
  parseDate(dateStr, format) {
    const parts = dateStr.split(/[\/\-]/);
    
    switch (format) {
      case 'DD/MM/YYYY':
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      case 'MM/DD/YYYY':
        return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      case 'YYYY-MM-DD':
      default:
        return new Date(dateStr);
    }
  }

  /**
   * Convert currency values for multi-currency imports
   */
  async convertCurrency(amount, fromCurrency, toCurrency, entityConfig) {
    try {
      if (fromCurrency === toCurrency) {
        return {
          originalAmount: amount,
          convertedAmount: amount,
          originalCurrency: fromCurrency,
          targetCurrency: toCurrency,
          exchangeRate: 1.0,
          conversionDate: new Date()
        };
      }

      const exchangeRate = this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = parseFloat((amount * exchangeRate).toFixed(4));

      logInfo('Currency conversion applied', {
        originalAmount: amount,
        fromCurrency,
        toCurrency,
        exchangeRate,
        convertedAmount,
        entityId: entityConfig.entity.id
      });

      return {
        originalAmount: amount,
        convertedAmount: convertedAmount,
        originalCurrency: fromCurrency,
        targetCurrency: toCurrency,
        exchangeRate: exchangeRate,
        conversionDate: new Date()
      };
    } catch (error) {
      logError('Currency conversion failed', error);
      throw new Error(`Cannot convert ${fromCurrency} to ${toCurrency}: ${error.message}`);
    }
  }

  /**
   * Get exchange rate between currencies
   */
  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1.0;

    // Check direct rate
    if (this.exchangeRates[fromCurrency] && this.exchangeRates[fromCurrency][toCurrency]) {
      return this.exchangeRates[fromCurrency][toCurrency];
    }

    // Check inverse rate
    if (this.exchangeRates[toCurrency] && this.exchangeRates[toCurrency][fromCurrency]) {
      return 1.0 / this.exchangeRates[toCurrency][fromCurrency];
    }

    // Use USD as intermediate currency
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromUsdRate = this.getExchangeRate(fromCurrency, 'USD');
      const toUsdRate = this.getExchangeRate('USD', toCurrency);
      return fromUsdRate * toUsdRate;
    }

    throw new Error(`Exchange rate not available from ${fromCurrency} to ${toCurrency}`);
  }

  /**
   * Calculate financial impact with multi-currency support
   */
  async calculateMultiCurrencyImpact(rowData, processedData, dataType, entityConfig) {
    try {
      const impact = {
        estimatedValue: 0,
        originalCurrency: rowData.currency || entityConfig.currency,
        targetCurrency: entityConfig.currency,
        impactType: 'neutral',
        currencyConversion: null,
        financialMetrics: {}
      };

      let baseImpactValue = 0;

      // Calculate base impact based on data type
      switch (dataType) {
        case 'products':
          if (processedData.selling_price && processedData.unit_cost) {
            const margin = parseFloat(processedData.selling_price) - parseFloat(processedData.unit_cost);
            baseImpactValue = margin;
            
            impact.financialMetrics = {
              unitMargin: margin,
              marginPercent: (margin / parseFloat(processedData.unit_cost)) * 100,
              sellingPrice: parseFloat(processedData.selling_price),
              unitCost: parseFloat(processedData.unit_cost)
            };
          }
          break;

        case 'historical_sales':
          if (processedData.gross_revenue) {
            baseImpactValue = parseFloat(processedData.gross_revenue);
            impact.financialMetrics = {
              grossRevenue: baseImpactValue,
              netRevenue: parseFloat(processedData.net_revenue || 0),
              quantity: parseInt(processedData.quantity_sold || 0)
            };
          }
          break;

        case 'inventory_levels':
          // Calculate inventory value impact
          if (processedData.quantity_on_hand && rowData.unit_value) {
            baseImpactValue = parseFloat(processedData.quantity_on_hand) * parseFloat(rowData.unit_value);
            impact.financialMetrics = {
              inventoryValue: baseImpactValue,
              quantity: parseInt(processedData.quantity_on_hand)
            };
          }
          break;
      }

      // Apply currency conversion if needed
      if (impact.originalCurrency !== impact.targetCurrency) {
        const conversion = await this.convertCurrency(
          baseImpactValue,
          impact.originalCurrency,
          impact.targetCurrency,
          entityConfig
        );
        
        impact.estimatedValue = conversion.convertedAmount;
        impact.currencyConversion = conversion;
      } else {
        impact.estimatedValue = baseImpactValue;
      }

      // Determine impact type
      if (impact.estimatedValue > 0) {
        impact.impactType = 'positive';
      } else if (impact.estimatedValue < 0) {
        impact.impactType = 'negative';
      }

      // Add regional adjustments
      impact.regionalAdjustments = this.applyRegionalAdjustments(
        impact.estimatedValue,
        entityConfig
      );

      return impact;
    } catch (error) {
      logError('Multi-currency impact calculation failed', error);
      return {
        estimatedValue: 0,
        impactType: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Apply regional business adjustments
   */
  applyRegionalAdjustments(baseValue, entityConfig) {
    const adjustments = {
      taxAdjustment: 0,
      complianceCost: 0,
      regionalMultiplier: 1.0,
      adjustedValue: baseValue
    };

    try {
      // Apply regional tax considerations
      if (entityConfig.entity.tax_rate) {
        adjustments.taxAdjustment = baseValue * parseFloat(entityConfig.entity.tax_rate);
      }

      // Regional business multipliers based on market conditions
      const regionalMultipliers = {
        'UK': 1.0,
        'EU': 0.95,  // Slightly lower due to regulatory complexity
        'USA': 1.05  // Higher due to market premiums
      };

      adjustments.regionalMultiplier = regionalMultipliers[entityConfig.region] || 1.0;
      
      // Apply compliance costs for certain regions
      if (entityConfig.region === 'EU') {
        adjustments.complianceCost = Math.abs(baseValue) * 0.02; // 2% compliance overhead
      }

      // Calculate final adjusted value
      adjustments.adjustedValue = (baseValue * adjustments.regionalMultiplier) - 
                                  adjustments.complianceCost;

      return adjustments;
    } catch (error) {
      logError('Regional adjustment calculation failed', error);
      return adjustments;
    }
  }

  /**
   * Validate cross-entity data relationships
   */
  async validateCrossEntityRelationships(importData, entityConfig) {
    const relationshipIssues = [];

    try {
      await dbService.initialize();
      const prisma = dbService.getClient();

      // Check for SKU conflicts across entities
      const skus = importData
        .filter(row => row.sku)
        .map(row => row.sku);

      if (skus.length > 0) {
        const existingSkus = await prisma.product.findMany({
          where: {
            sku: { in: skus },
            // Include entity filtering if products have entity associations
          },
          select: {
            sku: true,
            // entity_id: true // if implemented
          }
        });

        existingSkus.forEach(existing => {
          relationshipIssues.push({
            type: 'sku_exists_other_entity',
            severity: 'warning',
            message: `SKU ${existing.sku} already exists in another entity`,
            sku: existing.sku,
            recommendation: 'Consider using entity-specific SKU prefix'
          });
        });
      }

      // Check for pricing consistency across related entities
      if (entityConfig.entity.parent_entity_id) {
        // Validate pricing against parent entity rules
        const pricingIssues = await this.validateParentEntityPricing(
          importData,
          entityConfig
        );
        relationshipIssues.push(...pricingIssues);
      }

    } catch (error) {
      logError('Cross-entity validation failed', error);
      relationshipIssues.push({
        type: 'validation_error',
        severity: 'error',
        message: `Cross-entity validation failed: ${error.message}`
      });
    }

    return relationshipIssues;
  }

  /**
   * Validate pricing against parent entity rules
   */
  async validateParentEntityPricing(importData, entityConfig) {
    const pricingIssues = [];

    try {
      // This would implement complex parent-child entity pricing rules
      // For example: subsidiary prices should be within X% of parent prices
      
      logInfo('Parent entity pricing validation', {
        entityId: entityConfig.entity.id,
        parentEntityId: entityConfig.entity.parent_entity_id
      });

      // Placeholder for complex pricing validation logic
      
    } catch (error) {
      logError('Parent entity pricing validation failed', error);
    }

    return pricingIssues;
  }

  /**
   * Generate multi-entity import report
   */
  async generateMultiEntityReport(importResults, entityConfig) {
    try {
      const report = {
        entityInfo: {
          id: entityConfig.entity.id,
          name: entityConfig.entity.name,
          region: entityConfig.region,
          currency: entityConfig.currency
        },
        importSummary: {
          totalRows: importResults.totalRows,
          validRows: importResults.validRows,
          errorRows: importResults.errorRows,
          warningRows: importResults.warningRows
        },
        financialImpact: {
          totalImpact: 0,
          currencyConversions: 0,
          regionalAdjustments: 0
        },
        complianceStatus: {
          passed: true,
          issues: []
        },
        recommendations: []
      };

      // Aggregate financial impact data
      if (importResults.businessImpactData) {
        importResults.businessImpactData.forEach(impact => {
          report.financialImpact.totalImpact += impact.estimatedValue || 0;
          if (impact.currencyConversion) {
            report.financialImpact.currencyConversions++;
          }
        });
      }

      // Add entity-specific recommendations
      if (entityConfig.region === 'EU') {
        report.recommendations.push(
          'Consider GDPR compliance for any customer data imports',
          'Validate VAT numbers against EU VIES database'
        );
      }

      if (entityConfig.region === 'USA') {
        report.recommendations.push(
          'Ensure compliance with state-specific tax regulations',
          'Consider sales tax implications for multi-state operations'
        );
      }

      return report;
    } catch (error) {
      logError('Multi-entity report generation failed', error);
      return { error: error.message };
    }
  }

  /**
   * Load exchange rates from external API (production implementation)
   */
  async refreshExchangeRates() {
    try {
      // In production, this would fetch from a reliable exchange rate API
      // For now, use static rates
      logInfo('Using static exchange rates - implement external API for production');
      
      return this.exchangeRates;
    } catch (error) {
      logError('Failed to refresh exchange rates', error);
      throw error;
    }
  }
}

export default MultiEntityImportService;