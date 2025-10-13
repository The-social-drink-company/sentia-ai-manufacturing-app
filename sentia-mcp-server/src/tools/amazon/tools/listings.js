/**
 * Amazon Listings Management Tool
 * 
 * Create, update, and manage Amazon product listings with pricing optimization,
 * inventory synchronization, and performance tracking.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon Listings Management Tool Class
 */
export class ListingsTool {
  constructor(authManager, options = {}) {
    this.authManager = authManager;
    this.options = {
      validateBeforeSubmit: options.validateBeforeSubmit !== false,
      autoOptimize: options.autoOptimize || false,
      includePerformance: options.includePerformance !== false,
      ...options
    };

    // Input schema for MCP
    this.inputSchema = {
      type: 'object',
      properties: {
        marketplaceId: {
          type: 'string',
          enum: ['UK', 'USA', 'EU', 'CANADA', 'A1F83G8C2ARO7P', 'ATVPDKIKX0DER', 'A1PA6795UKMFR9', 'A2EUQ1WTGCTBG2'],
          description: 'Amazon marketplace ID or name'
        },
        action: {
          type: 'string',
          enum: ['create', 'update', 'delete', 'patch', 'validate'],
          default: 'update',
          description: 'Action to perform on the listing'
        },
        sku: {
          type: 'string',
          description: 'Seller SKU for the product'
        },
        productData: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Product title' },
            description: { type: 'string', description: 'Product description' },
            brand: { type: 'string', description: 'Brand name' },
            manufacturer: { type: 'string', description: 'Manufacturer name' },
            bulletPoints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Product bullet points (max 5)'
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Search keywords'
            },
            category: { type: 'string', description: 'Product category' },
            productType: { type: 'string', description: 'Amazon product type' },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  variant: { type: 'string' }
                }
              },
              description: 'Product images'
            },
            dimensions: {
              type: 'object',
              properties: {
                length: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                unit: { type: 'string', enum: ['inches', 'centimeters'] }
              }
            },
            weight: {
              type: 'object',
              properties: {
                value: { type: 'number' },
                unit: { type: 'string', enum: ['pounds', 'ounces', 'grams', 'kilograms'] }
              }
            }
          },
          description: 'Product data for listing creation/update'
        },
        offerData: {
          type: 'object',
          properties: {
            price: {
              type: 'object',
              properties: {
                amount: { type: 'number' },
                currency: { type: 'string' }
              }
            },
            quantity: { type: 'integer', minimum: 0 },
            condition: {
              type: 'string',
              enum: ['new', 'used_like_new', 'used_very_good', 'used_good', 'used_acceptable', 'refurbished']
            },
            conditionNote: { type: 'string' },
            fulfillmentChannel: {
              type: 'string',
              enum: ['DEFAULT', 'AMAZON_NA']
            },
            shippingTemplate: { type: 'string' }
          },
          description: 'Offer data for pricing and availability'
        },
        validateOnly: {
          type: 'boolean',
          default: false,
          description: 'Only validate the listing without submitting'
        },
        optimize: {
          type: 'boolean',
          default: false,
          description: 'Apply optimization suggestions automatically'
        },
        sandbox: {
          type: 'boolean',
          default: false,
          description: 'Use sandbox environment'
        }
      },
      required: ['marketplaceId', 'sku']
    };

    logger.info('Amazon Listings Tool initialized', {
      validateBeforeSubmit: this.options.validateBeforeSubmit,
      autoOptimize: this.options.autoOptimize
    });
  }

  /**
   * Execute listings management operation
   */
  async execute(params = {}) {
    const correlationId = `listings-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Executing Amazon listings operation', {
        correlationId,
        params: this.sanitizeParams(params)
      });

      // Validate and normalize parameters
      const normalizedParams = this.validateAndNormalizeParams(params);
      
      // Get authenticated client
      const client = await this.authManager.getClient(normalizedParams.marketplaceId, {
        sandbox: normalizedParams.sandbox,
        correlationId
      });

      let result;
      
      // Execute based on action
      switch (normalizedParams.action) {
        case 'create':
          result = await this.createListing(client, normalizedParams, correlationId);
          break;
        case 'update':
          result = await this.updateListing(client, normalizedParams, correlationId);
          break;
        case 'delete':
          result = await this.deleteListing(client, normalizedParams, correlationId);
          break;
        case 'patch':
          result = await this.patchListing(client, normalizedParams, correlationId);
          break;
        case 'validate':
          result = await this.validateListing(client, normalizedParams, correlationId);
          break;
        default:
          throw new Error(`Unsupported action: ${normalizedParams.action}`);
      }

      logger.info('Amazon listings operation completed', {
        correlationId,
        action: normalizedParams.action,
        sku: normalizedParams.sku,
        success: result.success
      });

      return {
        ...result,
        correlationId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Amazon listings operation failed', {
        correlationId,
        error: error.message,
        stack: error.stack,
        params: this.sanitizeParams(params)
      });

      return {
        success: false,
        error: error.message,
        correlationId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate and normalize input parameters
   */
  validateAndNormalizeParams(params) {
    const normalized = { ...params };

    // Set defaults
    normalized.action = normalized.action || 'update';
    normalized.validateOnly = normalized.validateOnly || false;
    normalized.optimize = normalized.optimize || false;
    normalized.sandbox = normalized.sandbox || false;

    // Validate required parameters based on action
    if (normalized.action === 'create' && !normalized.productData) {
      throw new Error('productData is required for create action');
    }

    if (['create', 'update'].includes(normalized.action) && !normalized.offerData) {
      throw new Error('offerData is required for create and update actions');
    }

    // Validate SKU format
    if (normalized.sku && !/^[a-zA-Z0-9\-_.]{1,40}$/.test(normalized.sku)) {
      throw new Error('SKU must be 1-40 characters and contain only alphanumeric characters, hyphens, underscores, and periods');
    }

    return normalized;
  }

  /**
   * Create a new listing
   */
  async createListing(client, params, correlationId) {
    try {
      logger.info('Creating Amazon listing', {
        correlationId,
        sku: params.sku,
        marketplace: params.marketplaceId
      });

      // Build listing payload
      const listingPayload = this.buildListingPayload(params, 'create');

      // Validate before submitting if enabled
      if (this.options.validateBeforeSubmit || params.validateOnly) {
        const validation = await this.validateListingPayload(listingPayload, params, correlationId);
        if (!validation.isValid) {
          return {
            success: false,
            action: 'create',
            validation,
            message: 'Listing validation failed'
          };
        }
        
        if (params.validateOnly) {
          return {
            success: true,
            action: 'validate',
            validation,
            message: 'Listing validation passed'
          };
        }
      }

      // Apply optimizations if requested
      if (params.optimize) {
        this.applyOptimizations(listingPayload, params);
      }

      // Submit the listing
      const response = await client.callAPI({
        operation: 'putListingsItem',
        endpoint: 'listings',
        path: {
          sellerId: process.env.AMAZON_SELLER_ID,
          sku: params.sku
        },
        query: {
          marketplaceIds: [this.getMarketplaceId(params.marketplaceId)]
        },
        body: listingPayload
      });

      // Check for issues in response
      const issues = this.extractIssues(response);

      return {
        success: true,
        action: 'create',
        sku: params.sku,
        submissionId: response.submissionId,
        status: response.status,
        issues,
        optimizations: params.optimize ? this.getAppliedOptimizations() : null
      };

    } catch (error) {
      logger.error('Failed to create listing', {
        correlationId,
        sku: params.sku,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update an existing listing
   */
  async updateListing(client, params, correlationId) {
    try {
      logger.info('Updating Amazon listing', {
        correlationId,
        sku: params.sku,
        marketplace: params.marketplaceId
      });

      // Get current listing data first
      const currentListing = await this.getCurrentListing(client, params, correlationId);

      // Build update payload (merge with existing data)
      const listingPayload = this.buildListingPayload(params, 'update', currentListing);

      // Validate if enabled
      if (this.options.validateBeforeSubmit || params.validateOnly) {
        const validation = await this.validateListingPayload(listingPayload, params, correlationId);
        if (!validation.isValid) {
          return {
            success: false,
            action: 'update',
            validation,
            message: 'Listing validation failed'
          };
        }
        
        if (params.validateOnly) {
          return {
            success: true,
            action: 'validate',
            validation,
            message: 'Listing validation passed'
          };
        }
      }

      // Apply optimizations if requested
      if (params.optimize) {
        this.applyOptimizations(listingPayload, params);
      }

      // Submit the update
      const response = await client.callAPI({
        operation: 'putListingsItem',
        endpoint: 'listings',
        path: {
          sellerId: process.env.AMAZON_SELLER_ID,
          sku: params.sku
        },
        query: {
          marketplaceIds: [this.getMarketplaceId(params.marketplaceId)]
        },
        body: listingPayload
      });

      const issues = this.extractIssues(response);

      return {
        success: true,
        action: 'update',
        sku: params.sku,
        submissionId: response.submissionId,
        status: response.status,
        issues,
        changes: this.getChanges(currentListing, listingPayload),
        optimizations: params.optimize ? this.getAppliedOptimizations() : null
      };

    } catch (error) {
      logger.error('Failed to update listing', {
        correlationId,
        sku: params.sku,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete a listing
   */
  async deleteListing(client, params, correlationId) {
    try {
      logger.info('Deleting Amazon listing', {
        correlationId,
        sku: params.sku,
        marketplace: params.marketplaceId
      });

      const response = await client.callAPI({
        operation: 'deleteListingsItem',
        endpoint: 'listings',
        path: {
          sellerId: process.env.AMAZON_SELLER_ID,
          sku: params.sku
        },
        query: {
          marketplaceIds: [this.getMarketplaceId(params.marketplaceId)]
        }
      });

      const issues = this.extractIssues(response);

      return {
        success: true,
        action: 'delete',
        sku: params.sku,
        submissionId: response.submissionId,
        status: response.status,
        issues
      };

    } catch (error) {
      logger.error('Failed to delete listing', {
        correlationId,
        sku: params.sku,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Patch (partial update) a listing
   */
  async patchListing(client, params, correlationId) {
    try {
      logger.info('Patching Amazon listing', {
        correlationId,
        sku: params.sku,
        marketplace: params.marketplaceId
      });

      // Build patch payload with only provided fields
      const patchPayload = this.buildPatchPayload(params);

      const response = await client.callAPI({
        operation: 'patchListingsItem',
        endpoint: 'listings',
        path: {
          sellerId: process.env.AMAZON_SELLER_ID,
          sku: params.sku
        },
        query: {
          marketplaceIds: [this.getMarketplaceId(params.marketplaceId)]
        },
        body: patchPayload
      });

      const issues = this.extractIssues(response);

      return {
        success: true,
        action: 'patch',
        sku: params.sku,
        submissionId: response.submissionId,
        status: response.status,
        issues,
        patchedFields: Object.keys(patchPayload.patches[0]?.value || {})
      };

    } catch (error) {
      logger.error('Failed to patch listing', {
        correlationId,
        sku: params.sku,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate listing data
   */
  async validateListing(client, params, correlationId) {
    try {
      logger.info('Validating Amazon listing', {
        correlationId,
        sku: params.sku
      });

      const listingPayload = this.buildListingPayload(params, params.action || 'create');
      const validation = await this.validateListingPayload(listingPayload, params, correlationId);

      return {
        success: true,
        action: 'validate',
        sku: params.sku,
        validation
      };

    } catch (error) {
      logger.error('Failed to validate listing', {
        correlationId,
        sku: params.sku,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Build listing payload for Amazon API
   */
  buildListingPayload(params, action, existingListing = null) {
    const payload = {
      productType: params.productData?.productType || 'PRODUCT',
      patches: []
    };

    // Add product attributes
    if (params.productData) {
      const attributes = {};

      if (params.productData.title) {
        attributes.item_name = [{ value: params.productData.title, language_tag: 'en_US' }];
      }

      if (params.productData.description) {
        attributes.product_description = [{ value: params.productData.description, language_tag: 'en_US' }];
      }

      if (params.productData.brand) {
        attributes.brand = [{ value: params.productData.brand }];
      }

      if (params.productData.manufacturer) {
        attributes.manufacturer = [{ value: params.productData.manufacturer }];
      }

      if (params.productData.bulletPoints && params.productData.bulletPoints.length > 0) {
        attributes.bullet_point = params.productData.bulletPoints.slice(0, 5).map(point => ({
          value: point,
          language_tag: 'en_US'
        }));
      }

      if (params.productData.keywords && params.productData.keywords.length > 0) {
        attributes.generic_keyword = params.productData.keywords.slice(0, 5).map(keyword => ({
          value: keyword,
          language_tag: 'en_US'
        }));
      }

      if (params.productData.dimensions) {
        const dims = params.productData.dimensions;
        if (dims.length) attributes.item_dimensions_length = [{ value: dims.length, unit: dims.unit || 'inches' }];
        if (dims.width) attributes.item_dimensions_width = [{ value: dims.width, unit: dims.unit || 'inches' }];
        if (dims.height) attributes.item_dimensions_height = [{ value: dims.height, unit: dims.unit || 'inches' }];
      }

      if (params.productData.weight) {
        attributes.item_weight = [{ 
          value: params.productData.weight.value, 
          unit: params.productData.weight.unit || 'pounds' 
        }];
      }

      if (params.productData.images && params.productData.images.length > 0) {
        attributes.main_product_image_locator = [{ 
          media_location: params.productData.images[0].url 
        }];
        
        if (params.productData.images.length > 1) {
          attributes.other_product_image_locator = params.productData.images.slice(1, 9).map(img => ({
            media_location: img.url
          }));
        }
      }

      payload.patches.push({
        op: action === 'create' ? 'add' : 'replace',
        path: '/attributes',
        value: attributes
      });
    }

    // Add offer data
    if (params.offerData) {
      const offer = {};

      if (params.offerData.price) {
        offer.our_price = [{
          schedule: [{
            value_with_tax: params.offerData.price.amount,
            currency: params.offerData.price.currency || 'USD'
          }]
        }];
      }

      if (params.offerData.quantity !== undefined) {
        offer.quantity = params.offerData.quantity;
      }

      if (params.offerData.condition) {
        offer.condition_type = [{ value: params.offerData.condition.toUpperCase() }];
      }

      if (params.offerData.conditionNote) {
        offer.condition_note = [{ value: params.offerData.conditionNote, language_tag: 'en_US' }];
      }

      if (params.offerData.fulfillmentChannel) {
        offer.fulfillment_channel_code = [{ value: params.offerData.fulfillmentChannel }];
      }

      payload.patches.push({
        op: action === 'create' ? 'add' : 'replace',
        path: '/offers/0',
        value: offer
      });
    }

    return payload;
  }

  /**
   * Build patch payload for partial updates
   */
  buildPatchPayload(params) {
    const payload = {
      productType: params.productData?.productType || 'PRODUCT',
      patches: []
    };

    // Add only the fields that are being updated
    if (params.offerData?.price) {
      payload.patches.push({
        op: 'replace',
        path: '/offers/0/our_price',
        value: [{
          schedule: [{
            value_with_tax: params.offerData.price.amount,
            currency: params.offerData.price.currency || 'USD'
          }]
        }]
      });
    }

    if (params.offerData?.quantity !== undefined) {
      payload.patches.push({
        op: 'replace',
        path: '/offers/0/quantity',
        value: params.offerData.quantity
      });
    }

    return payload;
  }

  /**
   * Get current listing data
   */
  async getCurrentListing(client, params, correlationId) {
    try {
      const response = await client.callAPI({
        operation: 'getListingsItem',
        endpoint: 'listings',
        path: {
          sellerId: process.env.AMAZON_SELLER_ID,
          sku: params.sku
        },
        query: {
          marketplaceIds: [this.getMarketplaceId(params.marketplaceId)],
          includedData: ['summaries', 'attributes', 'offers', 'fulfillmentAvailability', 'procurement']
        }
      });

      return response;
    } catch (error) {
      logger.warn('Could not retrieve current listing', {
        correlationId,
        sku: params.sku,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Validate listing payload
   */
  async validateListingPayload(payload, params, correlationId) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Basic validations
    if (!payload.patches || payload.patches.length === 0) {
      validation.errors.push('No data provided for listing');
      validation.isValid = false;
    }

    // Validate attributes if present
    const attributesPatch = payload.patches.find(p => p.path === '/attributes');
    if (attributesPatch) {
      const attrs = attributesPatch.value;

      // Title validation
      if (attrs.item_name) {
        const title = attrs.item_name[0]?.value;
        if (!title || title.length < 5) {
          validation.errors.push('Title must be at least 5 characters long');
          validation.isValid = false;
        } else if (title.length > 200) {
          validation.errors.push('Title must be 200 characters or less');
          validation.isValid = false;
        }
      }

      // Bullet points validation
      if (attrs.bullet_point && attrs.bullet_point.length > 5) {
        validation.warnings.push('Maximum 5 bullet points allowed, extras will be ignored');
      }

      // Keywords validation
      if (attrs.generic_keyword && attrs.generic_keyword.length > 5) {
        validation.warnings.push('Maximum 5 keywords recommended for best performance');
      }
    }

    // Validate offers if present
    const offerPatch = payload.patches.find(p => p.path === '/offers/0');
    if (offerPatch) {
      const offer = offerPatch.value;

      // Price validation
      if (offer.our_price) {
        const price = offer.our_price[0]?.schedule[0]?.value_with_tax;
        if (!price || price <= 0) {
          validation.errors.push('Price must be greater than 0');
          validation.isValid = false;
        } else if (price > 999999) {
          validation.warnings.push('Very high price may affect buy box eligibility');
        }
      }

      // Quantity validation
      if (offer.quantity !== undefined && offer.quantity < 0) {
        validation.errors.push('Quantity cannot be negative');
        validation.isValid = false;
      }
    }

    // Add optimization suggestions
    validation.suggestions = this.generateOptimizationSuggestions(payload);

    return validation;
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizationSuggestions(payload) {
    const suggestions = [];

    const attributesPatch = payload.patches.find(p => p.path === '/attributes');
    if (attributesPatch) {
      const attrs = attributesPatch.value;

      // Title optimization
      if (attrs.item_name) {
        const title = attrs.item_name[0]?.value || '';
        if (title.length < 50) {
          suggestions.push({
            type: 'title',
            message: 'Consider using a longer, more descriptive title for better search visibility',
            impact: 'medium'
          });
        }
      }

      // Images optimization
      if (!attrs.main_product_image_locator) {
        suggestions.push({
          type: 'images',
          message: 'Add a main product image to improve conversion rates',
          impact: 'high'
        });
      } else if (!attrs.other_product_image_locator || attrs.other_product_image_locator.length < 3) {
        suggestions.push({
          type: 'images',
          message: 'Add more product images (recommended: 5-7 images)',
          impact: 'medium'
        });
      }

      // Keywords optimization
      if (!attrs.generic_keyword || attrs.generic_keyword.length < 3) {
        suggestions.push({
          type: 'keywords',
          message: 'Add more relevant keywords to improve search discoverability',
          impact: 'high'
        });
      }

      // Bullet points optimization
      if (!attrs.bullet_point || attrs.bullet_point.length < 3) {
        suggestions.push({
          type: 'content',
          message: 'Add bullet points to highlight key features and benefits',
          impact: 'medium'
        });
      }
    }

    return suggestions;
  }

  /**
   * Apply optimizations to listing payload
   */
  applyOptimizations(payload, params) {
    // This would implement automatic optimizations
    // For now, just log that optimizations were requested
    logger.info('Optimizations requested but not yet implemented', {
      sku: params.sku
    });
  }

  /**
   * Get applied optimizations
   */
  getAppliedOptimizations() {
    return []; // Placeholder for optimization tracking
  }

  /**
   * Extract issues from API response
   */
  extractIssues(response) {
    const issues = [];

    if (response.issues && response.issues.length > 0) {
      response.issues.forEach(issue => {
        issues.push({
          code: issue.code,
          message: issue.message,
          severity: issue.severity,
          attributeName: issue.attributeName
        });
      });
    }

    return issues;
  }

  /**
   * Get changes between current and new listing
   */
  getChanges(currentListing, newPayload) {
    // This would implement change detection
    // For now, return empty array
    return [];
  }

  /**
   * Get marketplace ID from name or return as-is
   */
  getMarketplaceId(identifier) {
    const marketplaceMap = {
      'UK': 'A1F83G8C2ARO7P',
      'USA': 'ATVPDKIKX0DER',
      'EU': 'A1PA6795UKMFR9',
      'CANADA': 'A2EUQ1WTGCTBG2'
    };

    return marketplaceMap[identifier.toUpperCase()] || identifier;
  }

  /**
   * Sanitize parameters for logging
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    // Remove sensitive data if any
    return sanitized;
  }

  /**
   * Get tool schema for MCP registration
   */
  getSchema() {
    return {
      name: 'amazon-manage-listings',
      description: 'Create, update, and manage Amazon product listings with optimization and validation',
      inputSchema: this.inputSchema
    };
  }
}