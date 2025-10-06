/**
 * Shopify Product Management Tool
 * 
 * Create, update, and manage products including inventory levels,
 * pricing, descriptions, images, and SEO optimization.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

/**
 * Product Management Tool Class
 */
export class ProductManagementTool {
  constructor(shopifyIntegration) {
    this.shopify = shopifyIntegration;
    this.name = 'shopify-manage-products';
    this.description = 'Create, update, and manage Shopify products with inventory, pricing, and SEO';
    this.category = 'product_management';
    this.cacheEnabled = false; // Disable caching for write operations
    this.requiresAuth = true;

    this.inputSchema = {
      type: 'object',
      properties: {
        storeId: {
          type: 'string',
          enum: ['uk', 'usa'],
          description: 'Store to manage products in (cannot be "all" for write operations)'
        },
        action: {
          type: 'string',
          enum: ['create', 'update', 'delete', 'update_inventory', 'update_pricing', 'bulk_update'],
          description: 'Product management action to perform'
        },
        productData: {
          type: 'object',
          description: 'Product data for create/update operations',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID (required for update operations)'
            },
            title: {
              type: 'string',
              description: 'Product title',
              maxLength: 255
            },
            description: {
              type: 'string',
              description: 'Product description (HTML allowed)'
            },
            vendor: {
              type: 'string',
              description: 'Product vendor/brand'
            },
            productType: {
              type: 'string',
              description: 'Product type/category'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Product tags for organization and filtering'
            },
            status: {
              type: 'string',
              enum: ['active', 'archived', 'draft'],
              description: 'Product status',
              default: 'active'
            },
            variants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Variant ID (for updates)' },
                  title: { type: 'string', description: 'Variant title' },
                  price: { type: 'string', description: 'Variant price' },
                  compareAtPrice: { type: 'string', description: 'Compare at price' },
                  sku: { type: 'string', description: 'Stock keeping unit' },
                  barcode: { type: 'string', description: 'Product barcode' },
                  inventoryQuantity: { type: 'integer', description: 'Inventory quantity' },
                  inventoryPolicy: { 
                    type: 'string', 
                    enum: ['deny', 'continue'],
                    description: 'Inventory policy when out of stock'
                  },
                  weight: { type: 'number', description: 'Variant weight' },
                  weightUnit: { 
                    type: 'string', 
                    enum: ['g', 'kg', 'oz', 'lb'],
                    description: 'Weight unit'
                  },
                  requiresShipping: { type: 'boolean', description: 'Requires shipping' },
                  taxable: { type: 'boolean', description: 'Is taxable' }
                }
              },
              description: 'Product variants'
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  src: { type: 'string', description: 'Image URL' },
                  alt: { type: 'string', description: 'Image alt text' },
                  position: { type: 'integer', description: 'Image position' }
                }
              },
              description: 'Product images'
            },
            seo: {
              type: 'object',
              properties: {
                metaTitle: { type: 'string', description: 'SEO meta title' },
                metaDescription: { type: 'string', description: 'SEO meta description' },
                handle: { type: 'string', description: 'Product URL handle' }
              },
              description: 'SEO optimization data'
            }
          }
        },
        inventoryUpdates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variantId: { type: 'string', description: 'Variant ID' },
              locationId: { type: 'string', description: 'Location ID' },
              quantity: { type: 'integer', description: 'New quantity' },
              adjustment: { type: 'integer', description: 'Quantity adjustment (+ or -)' }
            },
            required: ['variantId']
          },
          description: 'Inventory updates for variants'
        },
        pricingUpdates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variantId: { type: 'string', description: 'Variant ID' },
              price: { type: 'string', description: 'New price' },
              compareAtPrice: { type: 'string', description: 'New compare at price' }
            },
            required: ['variantId', 'price']
          },
          description: 'Pricing updates for variants'
        },
        bulkOperations: {
          type: 'object',
          properties: {
            productIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Product IDs for bulk operations'
            },
            updates: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['active', 'archived', 'draft'] },
                vendor: { type: 'string' },
                productType: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                addTags: { type: 'array', items: { type: 'string' } },
                removeTags: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          description: 'Bulk update operations'
        },
        validateOnly: {
          type: 'boolean',
          description: 'Only validate the operation without executing',
          default: false
        }
      },
      required: ['storeId', 'action'],
      additionalProperties: false
    };

    logger.info('Shopify Product Management Tool initialized');
  }

  /**
   * Execute product management operation
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing Shopify product management', {
        correlationId,
        storeId: params.storeId,
        action: params.action,
        validateOnly: params.validateOnly
      });

      // Validate parameters
      this.validateParams(params);

      // Get client for the store
      const client = this.shopify.getRestClient(params.storeId);

      let result;

      // Execute the requested action
      switch (params.action) {
        case 'create':
          result = await this.createProduct(client, params, correlationId);
          break;
        case 'update':
          result = await this.updateProduct(client, params, correlationId);
          break;
        case 'delete':
          result = await this.deleteProduct(client, params, correlationId);
          break;
        case 'update_inventory':
          result = await this.updateInventory(client, params, correlationId);
          break;
        case 'update_pricing':
          result = await this.updatePricing(client, params, correlationId);
          break;
        case 'bulk_update':
          result = await this.bulkUpdate(client, params, correlationId);
          break;
        default:
          throw new Error(`Unsupported action: ${params.action}`);
      }

      const executionTime = Date.now() - startTime;

      logger.info('Product management completed successfully', {
        correlationId,
        action: params.action,
        executionTime,
        success: result.success
      });

      return {
        ...result,
        metadata: {
          correlationId,
          executionTime,
          action: params.action,
          storeId: params.storeId,
          validateOnly: params.validateOnly,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Product management failed', {
        correlationId,
        error: error.message,
        action: params.action,
        executionTime
      });

      throw new Error(`Product management failed: ${error.message}`);
    }
  }

  /**
   * Create a new product
   */
  async createProduct(client, params, correlationId) {
    try {
      const productData = this.buildProductPayload(params.productData, 'create');

      if (params.validateOnly) {
        return {
          success: true,
          action: 'validate',
          message: 'Product data validation passed',
          productData: productData
        };
      }

      logger.debug('Creating new product', {
        correlationId,
        title: productData.product.title
      });

      const response = await client.post({
        path: 'products',
        data: productData
      });

      if (!response.body || !response.body.product) {
        throw new Error('Invalid response from Shopify API');
      }

      const createdProduct = response.body.product;

      // Update inventory levels if specified
      if (params.productData.variants && params.productData.variants.some(v => v.inventoryQuantity !== undefined)) {
        await this.setInitialInventory(client, createdProduct, params.productData.variants, correlationId);
      }

      logger.info('Product created successfully', {
        correlationId,
        productId: createdProduct.id,
        title: createdProduct.title
      });

      return {
        success: true,
        action: 'create',
        product: createdProduct,
        message: `Product "${createdProduct.title}" created successfully`
      };

    } catch (error) {
      logger.error('Failed to create product', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(client, params, correlationId) {
    try {
      if (!params.productData.id) {
        throw new Error('Product ID is required for update operations');
      }

      const productData = this.buildProductPayload(params.productData, 'update');

      if (params.validateOnly) {
        return {
          success: true,
          action: 'validate',
          message: 'Product update validation passed',
          productData: productData
        };
      }

      logger.debug('Updating product', {
        correlationId,
        productId: params.productData.id
      });

      const response = await client.put({
        path: `products/${params.productData.id}`,
        data: productData
      });

      if (!response.body || !response.body.product) {
        throw new Error('Invalid response from Shopify API');
      }

      const updatedProduct = response.body.product;

      logger.info('Product updated successfully', {
        correlationId,
        productId: updatedProduct.id,
        title: updatedProduct.title
      });

      return {
        success: true,
        action: 'update',
        product: updatedProduct,
        message: `Product "${updatedProduct.title}" updated successfully`
      };

    } catch (error) {
      logger.error('Failed to update product', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(client, params, correlationId) {
    try {
      if (!params.productData.id) {
        throw new Error('Product ID is required for delete operations');
      }

      if (params.validateOnly) {
        return {
          success: true,
          action: 'validate',
          message: 'Product deletion validation passed'
        };
      }

      logger.debug('Deleting product', {
        correlationId,
        productId: params.productData.id
      });

      const response = await client.delete({
        path: `products/${params.productData.id}`
      });

      logger.info('Product deleted successfully', {
        correlationId,
        productId: params.productData.id
      });

      return {
        success: true,
        action: 'delete',
        productId: params.productData.id,
        message: 'Product deleted successfully'
      };

    } catch (error) {
      logger.error('Failed to delete product', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update inventory levels
   */
  async updateInventory(client, params, correlationId) {
    try {
      if (!params.inventoryUpdates || params.inventoryUpdates.length === 0) {
        throw new Error('Inventory updates are required for inventory update operations');
      }

      if (params.validateOnly) {
        return {
          success: true,
          action: 'validate',
          message: 'Inventory updates validation passed',
          updates: params.inventoryUpdates
        };
      }

      const results = [];

      for (const update of params.inventoryUpdates) {
        try {
          logger.debug('Updating inventory for variant', {
            correlationId,
            variantId: update.variantId,
            quantity: update.quantity,
            adjustment: update.adjustment
          });

          // Get current inventory levels
          const inventoryResponse = await client.get({
            path: 'inventory_levels',
            query: { inventory_item_ids: update.variantId }
          });

          const inventoryLevels = inventoryResponse.body?.inventory_levels || [];
          
          for (const level of inventoryLevels) {
            const locationId = update.locationId || level.location_id;
            
            let newQuantity;
            if (update.quantity !== undefined) {
              newQuantity = update.quantity;
            } else if (update.adjustment !== undefined) {
              newQuantity = (level.available || 0) + update.adjustment;
            } else {
              throw new Error('Either quantity or adjustment must be specified');
            }

            // Update inventory level
            await client.post({
              path: 'inventory_levels/set',
              data: {
                location_id: locationId,
                inventory_item_id: update.variantId,
                available: newQuantity
              }
            });

            results.push({
              variantId: update.variantId,
              locationId: locationId,
              previousQuantity: level.available,
              newQuantity: newQuantity,
              success: true
            });
          }

        } catch (error) {
          results.push({
            variantId: update.variantId,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      logger.info('Inventory updates completed', {
        correlationId,
        successCount,
        failureCount,
        totalUpdates: results.length
      });

      return {
        success: failureCount === 0,
        action: 'update_inventory',
        results: results,
        summary: {
          totalUpdates: results.length,
          successful: successCount,
          failed: failureCount
        },
        message: `Inventory updates completed: ${successCount} successful, ${failureCount} failed`
      };

    } catch (error) {
      logger.error('Failed to update inventory', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update pricing
   */
  async updatePricing(client, params, correlationId) {
    try {
      if (!params.pricingUpdates || params.pricingUpdates.length === 0) {
        throw new Error('Pricing updates are required for pricing update operations');
      }

      if (params.validateOnly) {
        return {
          success: true,
          action: 'validate',
          message: 'Pricing updates validation passed',
          updates: params.pricingUpdates
        };
      }

      const results = [];

      for (const update of params.pricingUpdates) {
        try {
          logger.debug('Updating pricing for variant', {
            correlationId,
            variantId: update.variantId,
            price: update.price,
            compareAtPrice: update.compareAtPrice
          });

          const variantData = {
            variant: {
              id: update.variantId,
              price: update.price
            }
          };

          if (update.compareAtPrice !== undefined) {
            variantData.variant.compare_at_price = update.compareAtPrice;
          }

          const response = await client.put({
            path: `variants/${update.variantId}`,
            data: variantData
          });

          if (response.body?.variant) {
            results.push({
              variantId: update.variantId,
              previousPrice: response.body.variant.price,
              newPrice: update.price,
              compareAtPrice: update.compareAtPrice,
              success: true
            });
          }

        } catch (error) {
          results.push({
            variantId: update.variantId,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      logger.info('Pricing updates completed', {
        correlationId,
        successCount,
        failureCount,
        totalUpdates: results.length
      });

      return {
        success: failureCount === 0,
        action: 'update_pricing',
        results: results,
        summary: {
          totalUpdates: results.length,
          successful: successCount,
          failed: failureCount
        },
        message: `Pricing updates completed: ${successCount} successful, ${failureCount} failed`
      };

    } catch (error) {
      logger.error('Failed to update pricing', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Perform bulk updates on multiple products
   */
  async bulkUpdate(client, params, correlationId) {
    try {
      if (!params.bulkOperations || !params.bulkOperations.productIds || params.bulkOperations.productIds.length === 0) {
        throw new Error('Product IDs and updates are required for bulk operations');
      }

      if (params.validateOnly) {
        return {
          success: true,
          action: 'validate',
          message: 'Bulk updates validation passed',
          operations: params.bulkOperations
        };
      }

      const results = [];
      const { productIds, updates } = params.bulkOperations;

      for (const productId of productIds) {
        try {
          logger.debug('Performing bulk update on product', {
            correlationId,
            productId,
            updates: Object.keys(updates)
          });

          const productData = this.buildBulkUpdatePayload(updates);

          const response = await client.put({
            path: `products/${productId}`,
            data: productData
          });

          if (response.body?.product) {
            results.push({
              productId: productId,
              title: response.body.product.title,
              success: true,
              updatedFields: Object.keys(updates)
            });
          }

        } catch (error) {
          results.push({
            productId: productId,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      logger.info('Bulk updates completed', {
        correlationId,
        successCount,
        failureCount,
        totalProducts: results.length
      });

      return {
        success: failureCount === 0,
        action: 'bulk_update',
        results: results,
        summary: {
          totalProducts: results.length,
          successful: successCount,
          failed: failureCount
        },
        message: `Bulk updates completed: ${successCount} successful, ${failureCount} failed`
      };

    } catch (error) {
      logger.error('Failed to perform bulk updates', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  // Helper methods

  validateParams(params) {
    if (params.storeId === 'all') {
      throw new Error('Product management operations cannot be performed on "all" stores. Please specify a specific store.');
    }

    switch (params.action) {
      case 'create':
        if (!params.productData || !params.productData.title) {
          throw new Error('Product title is required for create operations');
        }
        break;
      case 'update':
      case 'delete':
        if (!params.productData || !params.productData.id) {
          throw new Error('Product ID is required for update/delete operations');
        }
        break;
      case 'update_inventory':
        if (!params.inventoryUpdates || params.inventoryUpdates.length === 0) {
          throw new Error('Inventory updates are required');
        }
        break;
      case 'update_pricing':
        if (!params.pricingUpdates || params.pricingUpdates.length === 0) {
          throw new Error('Pricing updates are required');
        }
        break;
      case 'bulk_update':
        if (!params.bulkOperations || !params.bulkOperations.productIds) {
          throw new Error('Bulk operations configuration is required');
        }
        break;
    }
  }

  buildProductPayload(productData, operation) {
    const payload = {
      product: {}
    };

    // Basic product fields
    if (productData.title) payload.product.title = productData.title;
    if (productData.description) payload.product.body_html = productData.description;
    if (productData.vendor) payload.product.vendor = productData.vendor;
    if (productData.productType) payload.product.product_type = productData.productType;
    if (productData.status) payload.product.status = productData.status;

    // Tags
    if (productData.tags) {
      payload.product.tags = Array.isArray(productData.tags) 
        ? productData.tags.join(',') 
        : productData.tags;
    }

    // SEO fields
    if (productData.seo) {
      if (productData.seo.metaTitle) payload.product.meta_title = productData.seo.metaTitle;
      if (productData.seo.metaDescription) payload.product.meta_description = productData.seo.metaDescription;
      if (productData.seo.handle) payload.product.handle = productData.seo.handle;
    }

    // Variants
    if (productData.variants) {
      payload.product.variants = productData.variants.map(variant => {
        const v = {};
        if (variant.id && operation === 'update') v.id = variant.id;
        if (variant.title) v.title = variant.title;
        if (variant.price) v.price = variant.price;
        if (variant.compareAtPrice) v.compare_at_price = variant.compareAtPrice;
        if (variant.sku) v.sku = variant.sku;
        if (variant.barcode) v.barcode = variant.barcode;
        if (variant.weight) v.weight = variant.weight;
        if (variant.weightUnit) v.weight_unit = variant.weightUnit;
        if (variant.requiresShipping !== undefined) v.requires_shipping = variant.requiresShipping;
        if (variant.taxable !== undefined) v.taxable = variant.taxable;
        if (variant.inventoryPolicy) v.inventory_policy = variant.inventoryPolicy;
        return v;
      });
    }

    // Images
    if (productData.images) {
      payload.product.images = productData.images.map(image => ({
        src: image.src,
        alt: image.alt,
        position: image.position
      }));
    }

    return payload;
  }

  buildBulkUpdatePayload(updates) {
    const payload = {
      product: {}
    };

    if (updates.status) payload.product.status = updates.status;
    if (updates.vendor) payload.product.vendor = updates.vendor;
    if (updates.productType) payload.product.product_type = updates.productType;

    // Handle tags
    if (updates.tags) {
      payload.product.tags = Array.isArray(updates.tags) 
        ? updates.tags.join(',') 
        : updates.tags;
    }

    // Note: addTags and removeTags would require fetching current tags first
    // This is a simplified implementation

    return payload;
  }

  async setInitialInventory(client, product, variants, correlationId) {
    try {
      // Get default location
      const locationsResponse = await client.get({ path: 'locations' });
      const locations = locationsResponse.body?.locations || [];
      const defaultLocation = locations.find(loc => loc.primary) || locations[0];

      if (!defaultLocation) {
        logger.warn('No locations found for inventory setup', { correlationId });
        return;
      }

      // Set inventory for each variant that has a quantity specified
      for (const variant of variants) {
        if (variant.inventoryQuantity !== undefined) {
          const productVariant = product.variants.find(v => v.sku === variant.sku || v.title === variant.title);
          
          if (productVariant && productVariant.inventory_item_id) {
            await client.post({
              path: 'inventory_levels/set',
              data: {
                location_id: defaultLocation.id,
                inventory_item_id: productVariant.inventory_item_id,
                available: variant.inventoryQuantity
              }
            });
          }
        }
      }

    } catch (error) {
      logger.warn('Failed to set initial inventory', {
        correlationId,
        error: error.message
      });
    }
  }
}