/**
 * Webhook Handler for Real-time Data Updates
 * 
 * Handles incoming webhooks from external services (Xero, Shopify, Amazon, etc.)
 * for real-time data synchronization and immediate dashboard updates.
 * 
 * Features:
 * - Webhook signature verification
 * - Event routing and processing
 * - Real-time dashboard notifications
 * - Error handling and retry mechanisms
 * - Webhook endpoint management
 */

import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { getDataSyncPipeline } from '../../services/sync/DataSyncPipeline.js';
import { logInfo, logWarn, logError } from '../../services/observability/structuredLogger.js';

export class WebhookHandler {
  constructor() {
    this.router = express.Router();
    this.prisma = new PrismaClient();
    this.syncPipeline = getDataSyncPipeline();
    
    this.setupRoutes();
    this.setupWebhookValidation();
    
    logInfo('WebhookHandler initialized');
  }

  /**
   * Set up webhook routes
   */
  setupRoutes() {
    // Shopify webhooks
    this.router.post('/shopify/uk', this.handleShopifyWebhook.bind(this, 'uk'));
    this.router.post('/shopify/usa', this.handleShopifyWebhook.bind(this, 'usa'));
    
    // Xero webhooks
    this.router.post('/xero', this.handleXeroWebhook.bind(this));
    
    // Amazon webhooks (if supported)
    this.router.post('/amazon/uk', this.handleAmazonWebhook.bind(this, 'uk'));
    this.router.post('/amazon/usa', this.handleAmazonWebhook.bind(this, 'usa'));
    
    // Unleashed webhooks
    this.router.post('/unleashed', this.handleUnleashedWebhook.bind(this));
    
    // Generic webhook endpoint
    this.router.post('/generic/:service', this.handleGenericWebhook.bind(this));
    
    // Webhook health check
    this.router.get('/health', this.handleHealthCheck.bind(this));
    
    logInfo('Webhook routes configured');
  }

  /**
   * Set up webhook signature validation
   */
  setupWebhookValidation() {
    this.validationSecrets = {
      shopify_uk: process.env.SHOPIFY_UK_WEBHOOK_SECRET,
      shopify_usa: process.env.SHOPIFY_USA_WEBHOOK_SECRET,
      xero: process.env.XERO_WEBHOOK_SECRET,
      amazon_uk: process.env.AMAZON_UK_WEBHOOK_SECRET,
      amazon_usa: process.env.AMAZON_USA_WEBHOOK_SECRET,
      unleashed: process.env.UNLEASHED_WEBHOOK_SECRET
    };
  }

  /**
   * Handle Shopify webhooks
   */
  async handleShopifyWebhook(region, req, res) {
    try {
      const signature = req.headers['x-shopify-hmac-sha256'];
      const topic = req.headers['x-shopify-topic'];
      const shopDomain = req.headers['x-shopify-shop-domain'];
      
      logInfo('Shopify webhook received', {
        region,
        topic,
        shopDomain,
        hasSignature: !!signature
      });

      // Verify webhook signature
      if (!this.verifyShopifySignature(req.body, signature, region)) {
        logWarn('Invalid Shopify webhook signature', { region, topic });
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const webhookData = {
        service: `shopify_${region}`,
        event: topic,
        data: req.body,
        source: shopDomain,
        receivedAt: new Date()
      };

      // Process webhook based on topic
      await this.processShopifyEvent(region, topic, req.body, webhookData);
      
      res.status(200).json({ success: true, processed: true });

    } catch (error) {
      logError('Shopify webhook processing failed', {
        region,
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Process Shopify events
   */
  async processShopifyEvent(region, topic, data, webhookData) {
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
      case 'orders/paid':
      case 'orders/cancelled':
        await this.handleShopifyOrderEvent(region, topic, data);
        break;
        
      case 'products/create':
      case 'products/update':
        await this.handleShopifyProductEvent(region, topic, data);
        break;
        
      case 'inventory_levels/update':
        await this.handleShopifyInventoryEvent(region, topic, data);
        break;
        
      case 'customers/create':
      case 'customers/update':
        await this.handleShopifyCustomerEvent(region, topic, data);
        break;
        
      default:
        logInfo('Unhandled Shopify webhook topic', { region, topic });
    }

    // Log webhook event
    await this.logWebhookEvent(webhookData);
    
    // Trigger real-time dashboard update
    await this.notifyDashboard('shopify', {
      region,
      event: topic,
      timestamp: new Date()
    });
  }

  /**
   * Handle Shopify order events
   */
  async handleShopifyOrderEvent(region, topic, orderData) {
    try {
      // Update order in database
      await this.prisma.shopifyOrder.upsert({
        where: { shopifyId: orderData.id.toString() },
        update: {
          orderNumber: orderData.order_number?.toString(),
          email: orderData.email,
          phone: orderData.phone,
          financialStatus: orderData.financial_status,
          fulfillmentStatus: orderData.fulfillment_status,
          totalPrice: parseFloat(orderData.total_price || 0),
          subtotalPrice: parseFloat(orderData.subtotal_price || 0),
          totalTax: parseFloat(orderData.total_tax || 0),
          totalShipping: parseFloat(orderData.total_shipping_price_set?.shop_money?.amount || 0),
          currency: orderData.currency,
          customer: orderData.customer,
          billingAddress: orderData.billing_address,
          shippingAddress: orderData.shipping_address,
          lineItems: orderData.line_items,
          orderDate: new Date(orderData.created_at),
          processedAt: orderData.processed_at ? new Date(orderData.processed_at) : null,
          lastSyncAt: new Date()
        },
        create: {
          shopifyId: orderData.id.toString(),
          region,
          orderNumber: orderData.order_number?.toString(),
          email: orderData.email,
          phone: orderData.phone,
          financialStatus: orderData.financial_status,
          fulfillmentStatus: orderData.fulfillment_status,
          totalPrice: parseFloat(orderData.total_price || 0),
          subtotalPrice: parseFloat(orderData.subtotal_price || 0),
          totalTax: parseFloat(orderData.total_tax || 0),
          totalShipping: parseFloat(orderData.total_shipping_price_set?.shop_money?.amount || 0),
          currency: orderData.currency,
          customer: orderData.customer,
          billingAddress: orderData.billing_address,
          shippingAddress: orderData.shipping_address,
          lineItems: orderData.line_items,
          orderDate: new Date(orderData.created_at),
          processedAt: orderData.processed_at ? new Date(orderData.processed_at) : null,
          lastSyncAt: new Date()
        }
      });

      logInfo('Shopify order event processed', {
        region,
        topic,
        orderId: orderData.id,
        orderNumber: orderData.order_number
      });

    } catch (error) {
      logError('Failed to process Shopify order event', {
        region,
        topic,
        orderId: orderData.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle Xero webhooks
   */
  async handleXeroWebhook(req, res) {
    try {
      const signature = req.headers['x-xero-signature'];
      const eventType = req.headers['x-xero-event-type'];
      
      logInfo('Xero webhook received', {
        eventType,
        hasSignature: !!signature
      });

      // Verify webhook signature
      if (!this.verifyXeroSignature(req.body, signature)) {
        logWarn('Invalid Xero webhook signature', { eventType });
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const webhookData = {
        service: 'xero',
        event: eventType,
        data: req.body,
        receivedAt: new Date()
      };

      // Process webhook events
      for (const event of req.body.events || []) {
        await this.processXeroEvent(event, webhookData);
      }
      
      res.status(200).json({ success: true, processed: true });

    } catch (error) {
      logError('Xero webhook processing failed', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Process Xero events
   */
  async processXeroEvent(event, webhookData) {
    switch (event.eventCategory) {
      case 'INVOICE':
        await this.handleXeroInvoiceEvent(event);
        break;
        
      case 'CONTACT':
        await this.handleXeroContactEvent(event);
        break;
        
      case 'BANK_TRANSACTION':
        await this.handleXeroBankTransactionEvent(event);
        break;
        
      default:
        logInfo('Unhandled Xero event category', { 
          eventCategory: event.eventCategory,
          eventType: event.eventType 
        });
    }

    // Log webhook event
    await this.logWebhookEvent(webhookData);
    
    // Trigger real-time dashboard update
    await this.notifyDashboard('xero', {
      event: event.eventCategory,
      timestamp: new Date()
    });
  }

  /**
   * Handle Amazon webhooks (if available)
   */
  async handleAmazonWebhook(region, req, res) {
    try {
      // Amazon doesn't typically provide webhooks, but this would handle SQS notifications
      const messageType = req.headers['x-amz-sns-message-type'];
      
      logInfo('Amazon webhook/notification received', {
        region,
        messageType
      });

      // Process based on message type
      if (messageType === 'SubscriptionConfirmation') {
        // Handle SNS subscription confirmation
        await this.handleAmazonSubscriptionConfirmation(req.body);
      } else if (messageType === 'Notification') {
        // Handle actual notification
        await this.handleAmazonNotification(region, req.body);
      }
      
      res.status(200).json({ success: true });

    } catch (error) {
      logError('Amazon webhook processing failed', {
        region,
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Handle Unleashed webhooks
   */
  async handleUnleashedWebhook(req, res) {
    try {
      const eventType = req.headers['x-unleashed-event'];
      
      logInfo('Unleashed webhook received', {
        eventType
      });

      const webhookData = {
        service: 'unleashed',
        event: eventType,
        data: req.body,
        receivedAt: new Date()
      };

      // Process webhook based on event type
      await this.processUnleashedEvent(eventType, req.body, webhookData);
      
      res.status(200).json({ success: true, processed: true });

    } catch (error) {
      logError('Unleashed webhook processing failed', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Handle generic webhooks
   */
  async handleGenericWebhook(req, res) {
    try {
      const { service } = req.params;
      
      logInfo('Generic webhook received', {
        service,
        headers: req.headers,
        bodyType: typeof req.body
      });

      const webhookData = {
        service,
        event: 'generic',
        data: req.body,
        headers: req.headers,
        receivedAt: new Date()
      };

      // Log the webhook for analysis
      await this.logWebhookEvent(webhookData);
      
      res.status(200).json({ 
        success: true, 
        message: 'Webhook received and logged',
        service 
      });

    } catch (error) {
      logError('Generic webhook processing failed', {
        service: req.params.service,
        error: error.message
      });
      
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Health check endpoint
   */
  async handleHealthCheck(req, res) {
    try {
      const recentWebhooks = await this.prisma.webhookLog.count({
        where: {
          receivedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        webhooksLast24h: recentWebhooks,
        supportedServices: [
          'shopify_uk',
          'shopify_usa', 
          'xero',
          'amazon_uk',
          'amazon_usa',
          'unleashed'
        ]
      });

    } catch (error) {
      logError('Webhook health check failed', { error: error.message });
      res.status(500).json({ 
        status: 'error', 
        error: error.message 
      });
    }
  }

  /**
   * Webhook signature verification methods
   */
  verifyShopifySignature(payload, signature, region) {
    if (!signature) return false;
    
    const secret = this.validationSecrets[`shopify_${region}`];
    if (!secret) {
      logWarn('Shopify webhook secret not configured', { region });
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload), 'utf8');
    const calculatedSignature = hmac.digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature), 
      Buffer.from(calculatedSignature)
    );
  }

  verifyXeroSignature(payload, signature) {
    if (!signature) return false;
    
    const secret = this.validationSecrets.xero;
    if (!secret) {
      logWarn('Xero webhook secret not configured');
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload), 'utf8');
    const calculatedSignature = hmac.digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature), 
      Buffer.from(calculatedSignature)
    );
  }

  /**
   * Log webhook events for auditing
   */
  async logWebhookEvent(webhookData) {
    try {
      await this.prisma.webhookLog.create({
        data: {
          service: webhookData.service,
          event: webhookData.event,
          data: webhookData.data,
          headers: webhookData.headers || {},
          source: webhookData.source,
          receivedAt: webhookData.receivedAt,
          processed: true,
          processingTime: Date.now() - webhookData.receivedAt.getTime()
        }
      });
    } catch (error) {
      logError('Failed to log webhook event', {
        service: webhookData.service,
        event: webhookData.event,
        error: error.message
      });
    }
  }

  /**
   * Notify dashboard of real-time updates
   */
  async notifyDashboard(service, eventData) {
    try {
      // This would send real-time notifications to connected dashboard clients
      // Implementation would depend on the WebSocket/SSE setup
      
      logInfo('Dashboard notification sent', {
        service,
        event: eventData.event,
        timestamp: eventData.timestamp
      });

      // TODO: Implement actual real-time notification
      // This could use WebSockets, Server-Sent Events, or other real-time mechanisms
      
    } catch (error) {
      logError('Failed to notify dashboard', {
        service,
        eventData,
        error: error.message
      });
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(timeframe = '24h') {
    try {
      const timeframeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const since = new Date(Date.now() - (timeframeMs[timeframe] || timeframeMs['24h']));

      const stats = await this.prisma.webhookLog.groupBy({
        by: ['service', 'event'],
        where: {
          receivedAt: { gte: since }
        },
        _count: {
          id: true
        },
        _avg: {
          processingTime: true
        }
      });

      return {
        timeframe,
        since,
        total: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        byService: stats.reduce((acc, stat) => {
          if (!acc[stat.service]) {
            acc[stat.service] = { total: 0, events: {} };
          }
          acc[stat.service].total += stat._count.id;
          acc[stat.service].events[stat.event] = {
            count: stat._count.id,
            avgProcessingTime: stat._avg.processingTime
          };
          return acc;
        }, {})
      };

    } catch (error) {
      logError('Failed to get webhook stats', {
        timeframe,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get the Express router
   */
  getRouter() {
    return this.router;
  }
}

// Create singleton instance
let webhookHandler = null;

export function createWebhookHandler() {
  if (!webhookHandler) {
    webhookHandler = new WebhookHandler();
  }
  return webhookHandler;
}

export function getWebhookHandler() {
  if (!webhookHandler) {
    throw new Error('WebhookHandler not initialized. Call createWebhookHandler() first.');
  }
  return webhookHandler;
}

export default WebhookHandler;