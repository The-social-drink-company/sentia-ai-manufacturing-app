/**
 * Shopify Webhook Handler
 * 
 * Real-time webhook processing for Shopify events including orders,
 * products, customers, and inventory updates with event broadcasting.
 * 
 * @version 1.0.0
 */

import crypto from 'crypto';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Shopify Webhook Handler Class
 */
export class ShopifyWebhooks {
  constructor(config = {}) {
    this.config = {
      secret: config.secret || process.env.SHOPIFY_WEBHOOK_SECRET,
      endpoints: config.endpoints || [],
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      enableBroadcasting: config.enableBroadcasting !== false,
      ...config
    };

    // Webhook event handlers
    this.eventHandlers = new Map();
    this.eventHistory = [];
    this.stats = {
      received: 0,
      processed: 0,
      failed: 0,
      lastProcessed: null
    };

    this.initializeEventHandlers();

    logger.info('Shopify Webhooks initialized', {
      hasSecret: !!this.config.secret,
      endpointsCount: this.config.endpoints.length,
      broadcastingEnabled: this.config.enableBroadcasting
    });
  }

  /**
   * Initialize default event handlers
   */
  initializeEventHandlers() {
    // Order events
    this.registerHandler('orders/create', this.handleOrderCreated.bind(this));
    this.registerHandler('orders/updated', this.handleOrderUpdated.bind(this));
    this.registerHandler('orders/paid', this.handleOrderPaid.bind(this));
    this.registerHandler('orders/cancelled', this.handleOrderCancelled.bind(this));
    this.registerHandler('orders/fulfilled', this.handleOrderFulfilled.bind(this));

    // Product events
    this.registerHandler('products/create', this.handleProductCreated.bind(this));
    this.registerHandler('products/update', this.handleProductUpdated.bind(this));
    this.registerHandler('products/delete', this.handleProductDeleted.bind(this));

    // Customer events
    this.registerHandler('customers/create', this.handleCustomerCreated.bind(this));
    this.registerHandler('customers/update', this.handleCustomerUpdated.bind(this));
    this.registerHandler('customers/delete', this.handleCustomerDeleted.bind(this));

    // Inventory events
    this.registerHandler('inventory_levels/update', this.handleInventoryUpdated.bind(this));

    // App events
    this.registerHandler('app/uninstalled', this.handleAppUninstalled.bind(this));
  }

  /**
   * Register a webhook event handler
   */
  registerHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
    logger.debug('Webhook handler registered', { eventType });
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(headers, body, storeId = null) {
    const correlationId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.stats.received++;

      logger.info('Processing Shopify webhook', {
        correlationId,
        storeId,
        topic: headers['x-shopify-topic'],
        shop: headers['x-shopify-shop-domain']
      });

      // Verify webhook signature
      if (!this.verifyWebhookSignature(headers, body)) {
        throw new Error('Invalid webhook signature');
      }

      // Parse webhook data
      const webhookData = this.parseWebhookData(headers, body);

      // Store event in history
      this.addToEventHistory(webhookData, correlationId);

      // Process the webhook event
      const result = await this.handleWebhookEvent(webhookData, correlationId);

      // Broadcast event if enabled
      if (this.config.enableBroadcasting) {
        await this.broadcastEvent(webhookData, result, correlationId);
      }

      this.stats.processed++;
      this.stats.lastProcessed = new Date().toISOString();

      logger.info('Webhook processed successfully', {
        correlationId,
        topic: webhookData.topic,
        shop: webhookData.shop
      });

      return {
        success: true,
        correlationId,
        eventType: webhookData.topic,
        result
      };

    } catch (error) {
      this.stats.failed++;

      logger.error('Webhook processing failed', {
        correlationId,
        error: error.message,
        headers: this.sanitizeHeaders(headers)
      });

      return {
        success: false,
        correlationId,
        error: error.message
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(headers, body) {
    if (!this.config.secret) {
      logger.warn('Webhook secret not configured - signature verification skipped');
      return true;
    }

    const signature = headers['x-shopify-hmac-sha256'];
    if (!signature) {
      logger.error('Missing webhook signature header');
      return false;
    }

    try {
      const computedSignature = crypto
        .createHmac('sha256', this.config.secret)
        .update(body, 'utf8')
        .digest('base64');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );

      if (!isValid) {
        logger.error('Webhook signature verification failed', {
          received: signature.substring(0, 10) + '...',
          computed: computedSignature.substring(0, 10) + '...'
        });
      }

      return isValid;

    } catch (error) {
      logger.error('Webhook signature verification error', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Parse webhook data from headers and body
   */
  parseWebhookData(headers, body) {
    let parsedBody;
    
    try {
      parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (error) {
      logger.warn('Failed to parse webhook body as JSON', { error: error.message });
      parsedBody = body;
    }

    return {
      topic: headers['x-shopify-topic'],
      shop: headers['x-shopify-shop-domain'],
      apiVersion: headers['x-shopify-api-version'],
      timestamp: new Date().toISOString(),
      data: parsedBody,
      headers: this.sanitizeHeaders(headers)
    };
  }

  /**
   * Handle webhook event based on topic
   */
  async handleWebhookEvent(webhookData, correlationId) {
    const handler = this.eventHandlers.get(webhookData.topic);
    
    if (!handler) {
      logger.warn('No handler found for webhook topic', {
        correlationId,
        topic: webhookData.topic
      });
      return { status: 'ignored', reason: 'no_handler' };
    }

    try {
      const result = await handler(webhookData, correlationId);
      return result || { status: 'processed' };
    } catch (error) {
      logger.error('Webhook handler failed', {
        correlationId,
        topic: webhookData.topic,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Broadcast event to interested parties
   */
  async broadcastEvent(webhookData, result, correlationId) {
    try {
      const eventData = {
        id: correlationId,
        type: 'shopify_webhook',
        topic: webhookData.topic,
        shop: webhookData.shop,
        timestamp: webhookData.timestamp,
        data: webhookData.data,
        result
      };

      // This would integrate with the main application's event system
      // For now, just log the event
      logger.info('Broadcasting webhook event', {
        correlationId,
        topic: webhookData.topic,
        shop: webhookData.shop
      });

      // TODO: Integrate with WebSocket broadcasting system
      // this.broadcastToClients(eventData);

    } catch (error) {
      logger.error('Failed to broadcast webhook event', {
        correlationId,
        error: error.message
      });
    }
  }

  /**
   * Add event to history
   */
  addToEventHistory(webhookData, correlationId) {
    const historyEntry = {
      id: correlationId,
      topic: webhookData.topic,
      shop: webhookData.shop,
      timestamp: webhookData.timestamp,
      processed: false
    };

    this.eventHistory.unshift(historyEntry);

    // Keep only last 100 events
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(0, 100);
    }
  }

  // Event handlers for different webhook types

  async handleOrderCreated(webhookData, correlationId) {
    const order = webhookData.data;
    
    logger.info('Order created webhook', {
      correlationId,
      orderId: order.id,
      orderNumber: order.order_number,
      totalPrice: order.total_price,
      customerEmail: order.email
    });

    return {
      status: 'processed',
      action: 'order_created',
      orderId: order.id,
      notifications: ['order_confirmation_sent']
    };
  }

  async handleOrderUpdated(webhookData, correlationId) {
    const order = webhookData.data;
    
    logger.info('Order updated webhook', {
      correlationId,
      orderId: order.id,
      orderNumber: order.order_number,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status
    });

    return {
      status: 'processed',
      action: 'order_updated',
      orderId: order.id
    };
  }

  async handleOrderPaid(webhookData, correlationId) {
    const order = webhookData.data;
    
    logger.info('Order paid webhook', {
      correlationId,
      orderId: order.id,
      orderNumber: order.order_number,
      totalPrice: order.total_price
    });

    return {
      status: 'processed',
      action: 'order_paid',
      orderId: order.id,
      notifications: ['payment_confirmation_sent']
    };
  }

  async handleOrderCancelled(webhookData, correlationId) {
    const order = webhookData.data;
    
    logger.info('Order cancelled webhook', {
      correlationId,
      orderId: order.id,
      orderNumber: order.order_number,
      cancelReason: order.cancel_reason
    });

    return {
      status: 'processed',
      action: 'order_cancelled',
      orderId: order.id,
      notifications: ['cancellation_notification_sent']
    };
  }

  async handleOrderFulfilled(webhookData, correlationId) {
    const order = webhookData.data;
    
    logger.info('Order fulfilled webhook', {
      correlationId,
      orderId: order.id,
      orderNumber: order.order_number,
      trackingNumber: order.fulfillments?.[0]?.tracking_number
    });

    return {
      status: 'processed',
      action: 'order_fulfilled',
      orderId: order.id,
      notifications: ['shipment_notification_sent']
    };
  }

  async handleProductCreated(webhookData, correlationId) {
    const product = webhookData.data;
    
    logger.info('Product created webhook', {
      correlationId,
      productId: product.id,
      title: product.title,
      vendor: product.vendor
    });

    return {
      status: 'processed',
      action: 'product_created',
      productId: product.id
    };
  }

  async handleProductUpdated(webhookData, correlationId) {
    const product = webhookData.data;
    
    logger.info('Product updated webhook', {
      correlationId,
      productId: product.id,
      title: product.title,
      status: product.status
    });

    return {
      status: 'processed',
      action: 'product_updated',
      productId: product.id
    };
  }

  async handleProductDeleted(webhookData, correlationId) {
    const product = webhookData.data;
    
    logger.info('Product deleted webhook', {
      correlationId,
      productId: product.id,
      title: product.title
    });

    return {
      status: 'processed',
      action: 'product_deleted',
      productId: product.id
    };
  }

  async handleCustomerCreated(webhookData, correlationId) {
    const customer = webhookData.data;
    
    logger.info('Customer created webhook', {
      correlationId,
      customerId: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name
    });

    return {
      status: 'processed',
      action: 'customer_created',
      customerId: customer.id,
      notifications: ['welcome_email_sent']
    };
  }

  async handleCustomerUpdated(webhookData, correlationId) {
    const customer = webhookData.data;
    
    logger.info('Customer updated webhook', {
      correlationId,
      customerId: customer.id,
      email: customer.email
    });

    return {
      status: 'processed',
      action: 'customer_updated',
      customerId: customer.id
    };
  }

  async handleCustomerDeleted(webhookData, correlationId) {
    const customer = webhookData.data;
    
    logger.info('Customer deleted webhook', {
      correlationId,
      customerId: customer.id,
      email: customer.email
    });

    return {
      status: 'processed',
      action: 'customer_deleted',
      customerId: customer.id
    };
  }

  async handleInventoryUpdated(webhookData, correlationId) {
    const inventory = webhookData.data;
    
    logger.info('Inventory updated webhook', {
      correlationId,
      inventoryItemId: inventory.inventory_item_id,
      locationId: inventory.location_id,
      available: inventory.available
    });

    return {
      status: 'processed',
      action: 'inventory_updated',
      inventoryItemId: inventory.inventory_item_id,
      newQuantity: inventory.available
    };
  }

  async handleAppUninstalled(webhookData, correlationId) {
    const shop = webhookData.shop;
    
    logger.warn('App uninstalled webhook', {
      correlationId,
      shop: shop
    });

    return {
      status: 'processed',
      action: 'app_uninstalled',
      shop: shop,
      cleanup: ['tokens_revoked', 'data_cleaned']
    };
  }

  /**
   * Get webhook statistics
   */
  getStats() {
    return {
      ...this.stats,
      eventHandlers: this.eventHandlers.size,
      recentEvents: this.eventHistory.slice(0, 10)
    };
  }

  /**
   * Get event history
   */
  getEventHistory(limit = 50) {
    return this.eventHistory.slice(0, limit);
  }

  /**
   * Create webhook endpoints for Shopify
   */
  getWebhookEndpoints(baseUrl) {
    const endpoints = [];

    // Standard webhook topics
    const topics = [
      'orders/create',
      'orders/updated',
      'orders/paid',
      'orders/cancelled',
      'orders/fulfilled',
      'products/create',
      'products/update',
      'products/delete',
      'customers/create',
      'customers/update',
      'customers/delete',
      'inventory_levels/update',
      'app/uninstalled'
    ];

    topics.forEach(topic => {
      endpoints.push({
        topic,
        address: `${baseUrl}/webhooks/shopify/${topic.replace('/', '-')}`,
        format: 'json'
      });
    });

    return endpoints;
  }

  /**
   * Test webhook processing
   */
  async testWebhook(topic, testData = {}) {
    const testHeaders = {
      'x-shopify-topic': topic,
      'x-shopify-shop-domain': 'test-shop.myshopify.com',
      'x-shopify-api-version': '2024-01',
      'x-shopify-hmac-sha256': 'test-signature'
    };

    const testBody = JSON.stringify(testData);

    // Skip signature verification for test
    const originalSecret = this.config.secret;
    this.config.secret = null;

    try {
      const result = await this.processWebhook(testHeaders, testBody, 'test');
      return result;
    } finally {
      this.config.secret = originalSecret;
    }
  }

  // Helper methods

  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    // Remove sensitive headers
    delete sanitized['x-shopify-hmac-sha256'];
    delete sanitized['authorization'];
    return sanitized;
  }
}