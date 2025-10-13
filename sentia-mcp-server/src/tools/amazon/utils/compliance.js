/**
 * Amazon Compliance Manager
 * 
 * Manages marketplace-specific compliance requirements including tax calculation,
 * product restrictions, regulatory requirements, and marketplace policies.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon Compliance Manager Class
 */
export class ComplianceManager {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      taxCalculation: options.taxCalculation !== false,
      restrictedProducts: options.restrictedProducts !== false,
      marketplaceRules: options.marketplaceRules !== false,
      autoValidation: options.autoValidation || false,
      ...options
    };

    // Compliance rules and restrictions by marketplace
    this.marketplaceRules = {
      'UK': {
        currency: 'GBP',
        taxRate: 0.20, // 20% VAT
        restrictedCategories: ['weapons', 'pharmaceuticals', 'tobacco'],
        requiredFields: ['brand', 'manufacturer'],
        maxTitleLength: 200,
        languageRequirements: ['en-GB'],
        certificationRequired: ['CE', 'UKCA']
      },
      'USA': {
        currency: 'USD',
        taxRate: 0.00, // Varies by state
        restrictedCategories: ['weapons', 'pharmaceuticals', 'alcohol'],
        requiredFields: ['brand', 'upc'],
        maxTitleLength: 200,
        languageRequirements: ['en-US'],
        certificationRequired: ['FCC', 'UL']
      },
      'EU': {
        currency: 'EUR',
        taxRate: 0.19, // Average EU VAT
        restrictedCategories: ['weapons', 'pharmaceuticals', 'tobacco'],
        requiredFields: ['brand', 'manufacturer', 'ean'],
        maxTitleLength: 200,
        languageRequirements: ['de-DE', 'fr-FR', 'it-IT', 'es-ES'],
        certificationRequired: ['CE']
      },
      'CANADA': {
        currency: 'CAD',
        taxRate: 0.13, // Average HST/GST
        restrictedCategories: ['weapons', 'pharmaceuticals', 'tobacco'],
        requiredFields: ['brand', 'manufacturer'],
        maxTitleLength: 200,
        languageRequirements: ['en-CA', 'fr-CA'],
        certificationRequired: ['CSA', 'IC']
      }
    };

    // Product category restrictions
    this.categoryRestrictions = {
      'weapons': {
        prohibited: true,
        reason: 'Weapons and weapon accessories are prohibited on Amazon'
      },
      'pharmaceuticals': {
        prohibited: true,
        reason: 'Pharmaceutical products require special authorization'
      },
      'supplements': {
        restricted: true,
        requirements: ['FDA registration', 'ingredient disclosure', 'health claims review']
      },
      'electronics': {
        restricted: false,
        requirements: ['safety certifications', 'warranty information']
      },
      'toys': {
        restricted: false,
        requirements: ['age appropriateness', 'safety warnings', 'choking hazard labels']
      }
    };

    // Tax rate data by region
    this.taxRates = {
      'UK': { standard: 0.20, reduced: 0.05, zero: 0.00 },
      'USA': { 
        // Varies by state - this is simplified
        'CA': 0.0725, 'NY': 0.08, 'TX': 0.0625, 'FL': 0.06, 'WA': 0.065
      },
      'EU': {
        'DE': 0.19, 'FR': 0.20, 'IT': 0.22, 'ES': 0.21, 'NL': 0.21
      },
      'CANADA': { 'ON': 0.13, 'BC': 0.12, 'AB': 0.05, 'QC': 0.14975 }
    };

    logger.info('Amazon Compliance Manager initialized', {
      enabled: this.options.enabled,
      taxCalculation: this.options.taxCalculation,
      restrictedProducts: this.options.restrictedProducts,
      supportedMarketplaces: Object.keys(this.marketplaceRules)
    });
  }

  /**
   * Validate product compliance for a specific marketplace
   */
  async validateProductCompliance(productData, marketplace, options = {}) {
    if (!this.options.enabled) {
      return { compliant: true, message: 'Compliance checking disabled' };
    }

    try {
      const validation = {
        compliant: true,
        warnings: [],
        errors: [],
        requirements: [],
        marketplace,
        timestamp: new Date().toISOString()
      };

      const rules = this.marketplaceRules[marketplace];
      if (!rules) {
        validation.warnings.push(`No compliance rules defined for marketplace: ${marketplace}`);
        return validation;
      }

      // Validate required fields
      this.validateRequiredFields(productData, rules, validation);

      // Validate product restrictions
      this.validateProductRestrictions(productData, marketplace, validation);

      // Validate title length
      this.validateTitleLength(productData, rules, validation);

      // Validate language requirements
      this.validateLanguageRequirements(productData, rules, validation);

      // Validate certifications
      this.validateCertifications(productData, rules, validation);

      // Check for restricted categories
      this.validateCategoryRestrictions(productData, validation);

      // Set overall compliance status
      validation.compliant = validation.errors.length === 0;

      logger.debug('Product compliance validation completed', {
        marketplace,
        compliant: validation.compliant,
        warnings: validation.warnings.length,
        errors: validation.errors.length
      });

      return validation;

    } catch (error) {
      logger.error('Product compliance validation failed', {
        marketplace,
        error: error.message
      });

      return {
        compliant: false,
        errors: [`Compliance validation failed: ${error.message}`],
        marketplace,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate tax for a product/price in a specific marketplace
   */
  calculateTax(price, marketplace, region = null, productCategory = 'standard') {
    if (!this.options.taxCalculation) {
      return {
        basePrice: price,
        taxAmount: 0,
        taxRate: 0,
        totalPrice: price,
        currency: this.marketplaceRules[marketplace]?.currency || 'USD'
      };
    }

    try {
      let taxRate = 0;
      const marketplaceRates = this.taxRates[marketplace];

      if (marketplaceRates) {
        if (typeof marketplaceRates === 'number') {
          taxRate = marketplaceRates;
        } else if (region && marketplaceRates[region]) {
          taxRate = marketplaceRates[region];
        } else if (marketplaceRates.standard) {
          // Use standard rate as default
          taxRate = marketplaceRates.standard;
        } else {
          // Use first available rate
          taxRate = Object.values(marketplaceRates)[0];
        }
      }

      // Apply category-specific tax rules
      taxRate = this.applyCategoryTaxRules(taxRate, productCategory, marketplace);

      const taxAmount = price * taxRate;
      const totalPrice = price + taxAmount;

      return {
        basePrice: price,
        taxAmount,
        taxRate,
        totalPrice,
        currency: this.marketplaceRules[marketplace]?.currency || 'USD',
        region,
        category: productCategory
      };

    } catch (error) {
      logger.error('Tax calculation failed', {
        marketplace,
        region,
        error: error.message
      });

      return {
        basePrice: price,
        taxAmount: 0,
        taxRate: 0,
        totalPrice: price,
        currency: this.marketplaceRules[marketplace]?.currency || 'USD',
        error: error.message
      };
    }
  }

  /**
   * Get compliance requirements for a marketplace
   */
  getComplianceRequirements(marketplace) {
    const rules = this.marketplaceRules[marketplace];
    
    if (!rules) {
      return {
        error: `No compliance requirements defined for marketplace: ${marketplace}`
      };
    }

    return {
      marketplace,
      currency: rules.currency,
      taxRate: rules.taxRate,
      requiredFields: rules.requiredFields,
      restrictedCategories: rules.restrictedCategories,
      maxTitleLength: rules.maxTitleLength,
      languageRequirements: rules.languageRequirements,
      certificationRequired: rules.certificationRequired,
      additionalRequirements: this.getAdditionalRequirements(marketplace)
    };
  }

  /**
   * Check if a product category is restricted
   */
  isCategoryRestricted(category, marketplace = null) {
    const restriction = this.categoryRestrictions[category.toLowerCase()];
    
    if (!restriction) {
      return { restricted: false, prohibited: false };
    }

    // Check marketplace-specific restrictions
    if (marketplace) {
      const marketplaceRules = this.marketplaceRules[marketplace];
      if (marketplaceRules?.restrictedCategories?.includes(category.toLowerCase())) {
        return {
          restricted: true,
          prohibited: true,
          reason: `Category '${category}' is prohibited in ${marketplace} marketplace`
        };
      }
    }

    return {
      restricted: restriction.restricted || restriction.prohibited,
      prohibited: restriction.prohibited,
      reason: restriction.reason,
      requirements: restriction.requirements
    };
  }

  /**
   * Get compliance status summary
   */
  getStatus() {
    return {
      enabled: this.options.enabled,
      features: {
        taxCalculation: this.options.taxCalculation,
        restrictedProducts: this.options.restrictedProducts,
        marketplaceRules: this.options.marketplaceRules,
        autoValidation: this.options.autoValidation
      },
      supportedMarketplaces: Object.keys(this.marketplaceRules),
      categoryRestrictions: Object.keys(this.categoryRestrictions)
    };
  }

  // Private validation methods

  validateRequiredFields(productData, rules, validation) {
    rules.requiredFields.forEach(field => {
      if (!productData[field] || productData[field].trim() === '') {
        validation.errors.push(`Required field '${field}' is missing or empty`);
        validation.requirements.push(`Provide a valid ${field}`);
      }
    });
  }

  validateProductRestrictions(productData, marketplace, validation) {
    if (productData.category) {
      const restriction = this.isCategoryRestricted(productData.category, marketplace);
      
      if (restriction.prohibited) {
        validation.errors.push(restriction.reason);
      } else if (restriction.restricted) {
        validation.warnings.push(`Category '${productData.category}' has restrictions`);
        if (restriction.requirements) {
          validation.requirements.push(...restriction.requirements);
        }
      }
    }
  }

  validateTitleLength(productData, rules, validation) {
    if (productData.title && productData.title.length > rules.maxTitleLength) {
      validation.errors.push(`Title exceeds maximum length of ${rules.maxTitleLength} characters`);
      validation.requirements.push(`Shorten title to ${rules.maxTitleLength} characters or less`);
    }
  }

  validateLanguageRequirements(productData, rules, validation) {
    // This would check if text content is in required languages
    // For now, just add a requirement note
    if (rules.languageRequirements.length > 0) {
      validation.requirements.push(`Ensure content is available in: ${rules.languageRequirements.join(', ')}`);
    }
  }

  validateCertifications(productData, rules, validation) {
    if (rules.certificationRequired.length > 0) {
      const hasCertifications = productData.certifications && productData.certifications.length > 0;
      
      if (!hasCertifications) {
        validation.warnings.push('Product may require safety certifications');
        validation.requirements.push(`Consider obtaining certifications: ${rules.certificationRequired.join(', ')}`);
      }
    }
  }

  validateCategoryRestrictions(productData, validation) {
    if (productData.category) {
      const restriction = this.categoryRestrictions[productData.category.toLowerCase()];
      
      if (restriction?.prohibited) {
        validation.errors.push(restriction.reason);
      } else if (restriction?.restricted && restriction.requirements) {
        validation.requirements.push(...restriction.requirements);
      }
    }
  }

  applyCategoryTaxRules(baseTaxRate, category, marketplace) {
    // Apply category-specific tax modifications
    const categoryRules = {
      'books': 0.0, // Often tax-exempt
      'food': baseTaxRate * 0.5, // Often reduced rate
      'medical': 0.0, // Often tax-exempt
      'luxury': baseTaxRate * 1.2 // Often higher rate
    };

    return categoryRules[category.toLowerCase()] ?? baseTaxRate;
  }

  getAdditionalRequirements(marketplace) {
    const additionalReqs = {
      'UK': [
        'UKCA marking for applicable products',
        'Brexit compliance for EU-sourced products',
        'WEEE registration for electronic products'
      ],
      'USA': [
        'UPC/EAN codes required for most categories',
        'FBA prep requirements',
        'California Proposition 65 warnings where applicable'
      ],
      'EU': [
        'CE marking for applicable products',
        'REACH compliance for chemicals',
        'GDPR compliance for customer data'
      ],
      'CANADA': [
        'Health Canada regulations compliance',
        'French language requirements in Quebec',
        'Competition Act compliance'
      ]
    };

    return additionalReqs[marketplace] || [];
  }

  /**
   * Generate compliance checklist for a product
   */
  generateComplianceChecklist(productData, marketplace) {
    const requirements = this.getComplianceRequirements(marketplace);
    const validation = this.validateProductCompliance(productData, marketplace);
    
    const checklist = {
      marketplace,
      productId: productData.id || productData.sku,
      timestamp: new Date().toISOString(),
      overallCompliance: validation.compliant,
      items: []
    };

    // Required fields checklist
    requirements.requiredFields?.forEach(field => {
      checklist.items.push({
        category: 'Required Fields',
        requirement: `Provide ${field}`,
        status: productData[field] ? 'completed' : 'pending',
        mandatory: true
      });
    });

    // Certification checklist
    requirements.certificationRequired?.forEach(cert => {
      checklist.items.push({
        category: 'Certifications',
        requirement: `Obtain ${cert} certification`,
        status: 'pending', // Would need to check actual certifications
        mandatory: false
      });
    });

    // Category-specific requirements
    if (productData.category) {
      const restriction = this.isCategoryRestricted(productData.category, marketplace);
      if (restriction.requirements) {
        restriction.requirements.forEach(req => {
          checklist.items.push({
            category: 'Category Requirements',
            requirement: req,
            status: 'pending',
            mandatory: restriction.prohibited
          });
        });
      }
    }

    return checklist;
  }
}