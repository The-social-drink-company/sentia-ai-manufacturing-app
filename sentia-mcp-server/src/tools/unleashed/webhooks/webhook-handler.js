/**
 * Unleashed Webhook Handler
 * 
 * Real-time webhook processing for Unleashed ERP events and data updates.
 * Provides event handling, data synchronization, and notification management.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import crypto from 'crypto';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class UnleashedWebhookHandler {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      secret: config.secret || process.env.UNLEASHED_WEBHOOK_SECRET,
      validateSignature: config.validateSignature !== false,
      maxPayloadSize: config.maxPayloadSize || 1048576, // 1MB
      eventTimeout: config.eventTimeout || 30000, // 30 seconds
      retryAttempts: config.retryAttempts || 3
    };
    
    this.isInitialized = false;
    this.eventHandlers = new Map();
    this.eventQueue = [];
    this.processingStats = {
      eventsReceived: 0,
      eventsProcessed: 0,
      eventsFailed: 0,
      averageProcessingTime: 0
    };
    
    logger.info('Unleashed Webhook Handler initialized', {
      enabled: this.config.enabled,
      validateSignature: this.config.validateSignature
    });
  }

  async initialize() {
    try {
      logger.info('Initializing Unleashed Webhook Handler...');
      
      this.setupDefaultEventHandlers();
      this.startEventProcessor();
      
      this.isInitialized = true;
      logger.info('Webhook Handler initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize Webhook Handler', { error: error.message });
      throw error;
    }
  }

  setupDefaultEventHandlers() {
    // Product events
    this.registerEventHandler('product.created', this.handleProductCreated.bind(this));
    this.registerEventHandler('product.updated', this.handleProductUpdated.bind(this));
    this.registerEventHandler('product.deleted', this.handleProductDeleted.bind(this));
    
    // Inventory events
    this.registerEventHandler('inventory.updated', this.handleInventoryUpdated.bind(this));
    this.registerEventHandler('inventory.movement', this.handleInventoryMovement.bind(this));
    this.registerEventHandler('inventory.reorder', this.handleInventoryReorder.bind(this));
    
    // Order events
    this.registerEventHandler('sales_order.created', this.handleSalesOrderCreated.bind(this));
    this.registerEventHandler('sales_order.updated', this.handleSalesOrderUpdated.bind(this));
    this.registerEventHandler('purchase_order.created', this.handlePurchaseOrderCreated.bind(this));
    this.registerEventHandler('purchase_order.updated', this.handlePurchaseOrderUpdated.bind(this));
    this.registerEventHandler('production_order.created', this.handleProductionOrderCreated.bind(this));
    this.registerEventHandler('production_order.updated', this.handleProductionOrderUpdated.bind(this));
    
    // Customer and Supplier events
    this.registerEventHandler('customer.created', this.handleCustomerCreated.bind(this));
    this.registerEventHandler('customer.updated', this.handleCustomerUpdated.bind(this));
    this.registerEventHandler('supplier.created', this.handleSupplierCreated.bind(this));
    this.registerEventHandler('supplier.updated', this.handleSupplierUpdated.bind(this));
    
    logger.info('Default event handlers registered', {
      handlerCount: this.eventHandlers.size
    });
  }

  registerEventHandler(eventType, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }
    
    this.eventHandlers.set(eventType, handler);
    
    logger.debug('Event handler registered', { eventType });
  }

  async processWebhook(req, res) {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validationResult = await this.validateWebhookRequest(req);
      if (!validationResult.valid) {
        logger.warn('Webhook validation failed', { 
          reason: validationResult.reason,
          ip: req.ip 
        });
        return res.status(400).json({ 
          error: 'Invalid webhook request',
          reason: validationResult.reason 
        });
      }

      // Parse webhook payload
      const webhookData = this.parseWebhookPayload(req.body);
      if (!webhookData) {\n        logger.error('Failed to parse webhook payload');\n        return res.status(400).json({ error: 'Invalid payload format' });\n      }\n\n      // Add to processing queue\n      const eventId = this.queueWebhookEvent(webhookData, req);\n      \n      this.processingStats.eventsReceived++;\n      \n      logger.info('Webhook received and queued', {\n        eventId,\n        eventType: webhookData.eventType,\n        processingTime: Date.now() - startTime\n      });\n\n      // Respond immediately to acknowledge receipt\n      res.status(200).json({\n        success: true,\n        eventId,\n        message: 'Webhook received and queued for processing'\n      });\n\n    } catch (error) {\n      logger.error('Webhook processing failed', {\n        error: error.message,\n        ip: req.ip,\n        processingTime: Date.now() - startTime\n      });\n      \n      res.status(500).json({\n        error: 'Webhook processing failed',\n        message: error.message\n      });\n    }\n  }\n\n  async validateWebhookRequest(req) {\n    try {\n      // Check content type\n      if (!req.headers['content-type']?.includes('application/json')) {\n        return { valid: false, reason: 'Invalid content type' };\n      }\n\n      // Check payload size\n      const contentLength = parseInt(req.headers['content-length'] || '0');\n      if (contentLength > this.config.maxPayloadSize) {\n        return { valid: false, reason: 'Payload too large' };\n      }\n\n      // Validate signature if enabled\n      if (this.config.validateSignature && this.config.secret) {\n        const signature = req.headers['x-unleashed-signature'];\n        if (!signature) {\n          return { valid: false, reason: 'Missing signature' };\n        }\n\n        const isValidSignature = this.validateSignature(\n          JSON.stringify(req.body),\n          signature\n        );\n        \n        if (!isValidSignature) {\n          return { valid: false, reason: 'Invalid signature' };\n        }\n      }\n\n      return { valid: true };\n\n    } catch (error) {\n      logger.error('Webhook validation error', { error: error.message });\n      return { valid: false, reason: 'Validation error' };\n    }\n  }\n\n  validateSignature(payload, signature) {\n    try {\n      const expectedSignature = crypto\n        .createHmac('sha256', this.config.secret)\n        .update(payload, 'utf8')\n        .digest('hex');\n      \n      const providedSignature = signature.replace('sha256=', '');\n      \n      return crypto.timingSafeEqual(\n        Buffer.from(expectedSignature, 'hex'),\n        Buffer.from(providedSignature, 'hex')\n      );\n    } catch (error) {\n      logger.error('Signature validation failed', { error: error.message });\n      return false;\n    }\n  }\n\n  parseWebhookPayload(body) {\n    try {\n      if (typeof body === 'string') {\n        body = JSON.parse(body);\n      }\n\n      // Extract event type and data\n      const eventType = body.event_type || body.eventType || 'unknown';\n      const eventData = body.data || body.payload || body;\n      const timestamp = body.timestamp || new Date().toISOString();\n      \n      return {\n        eventType,\n        eventData,\n        timestamp,\n        webhookId: body.webhook_id || body.id,\n        originalPayload: body\n      };\n\n    } catch (error) {\n      logger.error('Payload parsing failed', { error: error.message });\n      return null;\n    }\n  }\n\n  queueWebhookEvent(webhookData, req) {\n    const eventId = crypto.randomUUID();\n    \n    const queueItem = {\n      eventId,\n      ...webhookData,\n      queuedAt: Date.now(),\n      attempts: 0,\n      maxAttempts: this.config.retryAttempts,\n      metadata: {\n        userAgent: req.headers['user-agent'],\n        ip: req.ip,\n        contentLength: req.headers['content-length']\n      }\n    };\n    \n    this.eventQueue.push(queueItem);\n    \n    return eventId;\n  }\n\n  startEventProcessor() {\n    if (this.processorInterval) {\n      clearInterval(this.processorInterval);\n    }\n    \n    this.processorInterval = setInterval(() => {\n      this.processEventQueue();\n    }, 1000); // Process queue every second\n    \n    logger.info('Event processor started');\n  }\n\n  async processEventQueue() {\n    if (this.eventQueue.length === 0) {\n      return;\n    }\n\n    const eventsToProcess = this.eventQueue.splice(0, 10); // Process up to 10 events at once\n    \n    for (const event of eventsToProcess) {\n      try {\n        await this.processEvent(event);\n      } catch (error) {\n        logger.error('Event processing failed', {\n          eventId: event.eventId,\n          eventType: event.eventType,\n          error: error.message\n        });\n        \n        // Retry if attempts remaining\n        if (event.attempts < event.maxAttempts) {\n          event.attempts++;\n          event.retryAt = Date.now() + (event.attempts * 5000); // Exponential backoff\n          this.eventQueue.push(event);\n        } else {\n          this.processingStats.eventsFailed++;\n          logger.error('Event processing exhausted retries', {\n            eventId: event.eventId,\n            eventType: event.eventType\n          });\n        }\n      }\n    }\n  }\n\n  async processEvent(event) {\n    const startTime = Date.now();\n    \n    try {\n      event.attempts++;\n      \n      logger.debug('Processing webhook event', {\n        eventId: event.eventId,\n        eventType: event.eventType,\n        attempt: event.attempts\n      });\n\n      const handler = this.eventHandlers.get(event.eventType);\n      \n      if (!handler) {\n        logger.warn('No handler for event type', {\n          eventType: event.eventType,\n          eventId: event.eventId\n        });\n        return;\n      }\n\n      // Execute event handler with timeout\n      await this.executeWithTimeout(\n        () => handler(event.eventData, event),\n        this.config.eventTimeout\n      );\n      \n      const processingTime = Date.now() - startTime;\n      this.updateProcessingStats(processingTime);\n      \n      this.processingStats.eventsProcessed++;\n      \n      logger.info('Event processed successfully', {\n        eventId: event.eventId,\n        eventType: event.eventType,\n        processingTime\n      });\n\n    } catch (error) {\n      logger.error('Event processing error', {\n        eventId: event.eventId,\n        eventType: event.eventType,\n        error: error.message,\n        attempt: event.attempts\n      });\n      throw error;\n    }\n  }\n\n  async executeWithTimeout(fn, timeout) {\n    return new Promise((resolve, reject) => {\n      const timer = setTimeout(() => {\n        reject(new Error('Event processing timeout'));\n      }, timeout);\n      \n      Promise.resolve(fn())\n        .then(resolve)\n        .catch(reject)\n        .finally(() => clearTimeout(timer));\n    });\n  }\n\n  updateProcessingStats(processingTime) {\n    if (this.processingStats.averageProcessingTime === 0) {\n      this.processingStats.averageProcessingTime = processingTime;\n    } else {\n      // Rolling average\n      this.processingStats.averageProcessingTime = \n        (this.processingStats.averageProcessingTime * 0.9) + (processingTime * 0.1);\n    }\n  }\n\n  // Default event handlers\n  async handleProductCreated(data, event) {\n    logger.info('Product created', {\n      productCode: data.ProductCode,\n      productName: data.ProductDescription\n    });\n    // Invalidate product cache\n    await this.invalidateCache('products');\n  }\n\n  async handleProductUpdated(data, event) {\n    logger.info('Product updated', {\n      productCode: data.ProductCode,\n      productName: data.ProductDescription\n    });\n    await this.invalidateCache('products');\n  }\n\n  async handleInventoryUpdated(data, event) {\n    logger.info('Inventory updated', {\n      productCode: data.ProductCode,\n      warehouseCode: data.WarehouseCode,\n      newQuantity: data.QtyOnHand\n    });\n    await this.invalidateCache('inventory');\n  }\n\n  async handleSalesOrderCreated(data, event) {\n    logger.info('Sales order created', {\n      orderNumber: data.OrderNumber,\n      customerCode: data.CustomerCode,\n      total: data.Total\n    });\n    await this.invalidateCache('sales-orders');\n  }\n\n  async handlePurchaseOrderCreated(data, event) {\n    logger.info('Purchase order created', {\n      orderNumber: data.OrderNumber,\n      supplierCode: data.SupplierCode,\n      total: data.Total\n    });\n    await this.invalidateCache('purchase-orders');\n  }\n\n  async handleProductionOrderCreated(data, event) {\n    logger.info('Production order created', {\n      orderNumber: data.OrderNumber,\n      productCode: data.ProductCode,\n      quantity: data.PlannedQuantity\n    });\n    await this.invalidateCache('production-orders');\n  }\n\n  // Placeholder handlers for other events\n  async handleProductDeleted(data, event) { await this.invalidateCache('products'); }\n  async handleInventoryMovement(data, event) { await this.invalidateCache('inventory'); }\n  async handleInventoryReorder(data, event) { await this.invalidateCache('inventory'); }\n  async handleSalesOrderUpdated(data, event) { await this.invalidateCache('sales-orders'); }\n  async handlePurchaseOrderUpdated(data, event) { await this.invalidateCache('purchase-orders'); }\n  async handleProductionOrderUpdated(data, event) { await this.invalidateCache('production-orders'); }\n  async handleCustomerCreated(data, event) { await this.invalidateCache('customers'); }\n  async handleCustomerUpdated(data, event) { await this.invalidateCache('customers'); }\n  async handleSupplierCreated(data, event) { await this.invalidateCache('suppliers'); }\n  async handleSupplierUpdated(data, event) { await this.invalidateCache('suppliers'); }\n\n  async invalidateCache(cachePattern) {\n    try {\n      // This would integrate with the cache utility\n      logger.debug('Cache invalidation requested', { pattern: cachePattern });\n    } catch (error) {\n      logger.error('Cache invalidation failed', { \n        pattern: cachePattern, \n        error: error.message \n      });\n    }\n  }\n\n  getEventHandlers() {\n    return Array.from(this.eventHandlers.keys());\n  }\n\n  getQueueStatus() {\n    return {\n      queueSize: this.eventQueue.length,\n      oldestEvent: this.eventQueue.length > 0 ? \n        Date.now() - this.eventQueue[0].queuedAt : 0,\n      processingStats: this.processingStats\n    };\n  }\n\n  getStats() {\n    return {\n      ...this.processingStats,\n      queueSize: this.eventQueue.length,\n      registeredHandlers: this.eventHandlers.size,\n      enabled: this.config.enabled\n    };\n  }\n\n  getStatus() {\n    return {\n      initialized: this.isInitialized,\n      enabled: this.config.enabled,\n      queueSize: this.eventQueue.length,\n      handlerCount: this.eventHandlers.size,\n      stats: this.processingStats\n    };\n  }\n\n  async cleanup() {\n    try {\n      logger.info('Cleaning up Webhook Handler...');\n      \n      if (this.processorInterval) {\n        clearInterval(this.processorInterval);\n        this.processorInterval = null;\n      }\n      \n      this.eventHandlers.clear();\n      this.eventQueue = [];\n      this.isInitialized = false;\n      \n      logger.info('Webhook Handler cleanup completed');\n      \n    } catch (error) {\n      logger.error('Error during Webhook Handler cleanup', { error: error.message });\n    }\n  }\n}"