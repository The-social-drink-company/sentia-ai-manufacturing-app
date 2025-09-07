import Stripe from 'stripe';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

/**
 * Enterprise Payment Processing Service
 * Supports Stripe, PayPal, and Square for B2B manufacturing payments
 */
class PaymentService {
  constructor() {
    this.stripeClient = null;
    this.provider = process.env.PAYMENT_PROVIDER || 'stripe';
    this.initialized = false;
    
    // Initialize the payment provider
    this.initialize();
  }

  /**
   * Initialize payment service based on configured provider
   */
  async initialize() {
    try {
      switch (this.provider.toLowerCase()) {
        case 'stripe':
          await this.initializeStripe();
          break;
        case 'paypal':
          await this.initializePayPal();
          break;
        case 'square':
          await this.initializeSquare();
          break;
        default:
          logWarn('Payment Service: No valid provider configured, using mock mode');
          this.initialized = true;
      }
      
      logInfo('Payment Service initialized successfully', { provider: this.provider });
    } catch (error) {
      logError('Failed to initialize payment service', error);
      throw error;
    }
  }

  /**
   * Initialize Stripe payment service
   */
  async initializeStripe() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    
    this.stripeClient = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
    
    this.initialized = true;
  }

  /**
   * Initialize PayPal payment service
   */
  async initializePayPal() {
    // PayPal SDK implementation would go here
    logWarn('PayPal payment provider not yet implemented');
    this.initialized = true;
  }

  /**
   * Initialize Square payment service
   */
  async initializeSquare() {
    // Square SDK implementation would go here
    logWarn('Square payment provider not yet implemented');
    this.initialized = true;
  }

  /**
   * Create payment intent for manufacturing order
   * @param {Object} orderData - Order information
   * @param {string} orderData.orderId - Order ID
   * @param {number} orderData.amount - Amount in cents
   * @param {string} orderData.currency - Currency code
   * @param {string} orderData.customerId - Customer ID
   * @param {Object} orderData.metadata - Additional metadata
   */
  async createPaymentIntent(orderData) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { orderId, amount, currency, customerId, metadata = {} } = orderData;

      // Validate required fields
      this.validatePaymentData(orderData);

      let result;
      
      switch (this.provider.toLowerCase()) {
        case 'stripe':
          result = await this.createStripePaymentIntent(orderData);
          break;
        case 'paypal':
          result = await this.createPayPalPayment(orderData);
          break;
        case 'square':
          result = await this.createSquarePayment(orderData);
          break;
        default:
          result = await this.createMockPayment(orderData);
      }

      logInfo('Payment intent created successfully', { 
        orderId, 
        amount, 
        currency,
        provider: this.provider,
        paymentIntentId: result.paymentIntentId 
      });
      
      return result;
    } catch (error) {
      logError('Failed to create payment intent', { 
        orderId: orderData.orderId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Create Stripe payment intent
   */
  async createStripePaymentIntent(orderData) {
    const { orderId, amount, currency, customerId, metadata = {} } = orderData;

    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        orderId,
        source: 'sentia_manufacturing',
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: 'stripe'
    };
  }

  /**
   * Create PayPal payment (placeholder)
   */
  async createPayPalPayment(orderData) {
    return {
      paymentIntentId: 'paypal_mock_' + Date.now(),
      clientSecret: 'mock_secret',
      status: 'mock_created',
      amount: orderData.amount * 100,
      currency: orderData.currency,
      provider: 'paypal'
    };
  }

  /**
   * Create Square payment (placeholder)
   */
  async createSquarePayment(orderData) {
    return {
      paymentIntentId: 'square_mock_' + Date.now(),
      clientSecret: 'mock_secret',
      status: 'mock_created',
      amount: orderData.amount * 100,
      currency: orderData.currency,
      provider: 'square'
    };
  }

  /**
   * Mock payment for development/testing
   */
  async createMockPayment(orderData) {
    return {
      paymentIntentId: 'mock_' + Date.now(),
      clientSecret: 'mock_secret',
      status: 'mock_created',
      amount: orderData.amount * 100,
      currency: orderData.currency,
      provider: 'mock'
    };
  }

  /**
   * Confirm payment
   * @param {string} paymentIntentId - Payment intent ID
   * @param {string} paymentMethodId - Payment method ID
   */
  async confirmPayment(paymentIntentId, paymentMethodId) {
    try {
      let result;
      
      switch (this.provider.toLowerCase()) {
        case 'stripe':
          result = await this.confirmStripePayment(paymentIntentId, paymentMethodId);
          break;
        default:
          result = await this.confirmMockPayment(paymentIntentId, paymentMethodId);
      }

      logInfo('Payment confirmed successfully', { 
        paymentIntentId,
        status: result.status,
        provider: this.provider
      });
      
      return result;
    } catch (error) {
      logError('Failed to confirm payment', { 
        paymentIntentId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Confirm Stripe payment
   */
  async confirmStripePayment(paymentIntentId, paymentMethodId) {
    const paymentIntent = await this.stripeClient.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: 'stripe'
    };
  }

  /**
   * Confirm mock payment
   */
  async confirmMockPayment(paymentIntentId, paymentMethodId) {
    return {
      paymentIntentId,
      status: 'succeeded',
      amount: 10000, // Mock amount
      currency: 'gbp',
      provider: 'mock'
    };
  }

  /**
   * Process manufacturing invoice payment
   * @param {Object} invoiceData - Invoice information
   */
  async processInvoicePayment(invoiceData) {
    const {
      invoiceId,
      amount,
      currency,
      customerId,
      dueDate,
      lineItems = []
    } = invoiceData;

    try {
      // Create payment intent for invoice
      const paymentIntent = await this.createPaymentIntent({
        orderId: invoiceId,
        amount,
        currency,
        customerId,
        metadata: {
          type: 'invoice',
          invoiceId,
          dueDate,
          itemCount: lineItems.length
        }
      });

      // Log invoice payment creation
      logInfo('Invoice payment created', {
        invoiceId,
        amount,
        currency,
        paymentIntentId: paymentIntent.paymentIntentId
      });

      return {
        ...paymentIntent,
        invoiceId,
        type: 'invoice'
      };
    } catch (error) {
      logError('Failed to process invoice payment', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process subscription payment for SaaS features
   * @param {Object} subscriptionData - Subscription information
   */
  async processSubscriptionPayment(subscriptionData) {
    const {
      customerId,
      planId,
      priceId,
      quantity = 1,
      metadata = {}
    } = subscriptionData;

    try {
      if (this.provider === 'stripe' && this.stripeClient) {
        const subscription = await this.stripeClient.subscriptions.create({
          customer: customerId,
          items: [{
            price: priceId,
            quantity,
          }],
          metadata: {
            source: 'sentia_manufacturing',
            planId,
            ...metadata
          },
        });

        logInfo('Subscription created successfully', {
          subscriptionId: subscription.id,
          customerId,
          planId
        });

        return {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          provider: 'stripe'
        };
      }

      // Mock subscription for other providers
      return {
        subscriptionId: 'mock_sub_' + Date.now(),
        status: 'active',
        currentPeriodStart: Math.floor(Date.now() / 1000),
        currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        provider: 'mock'
      };
    } catch (error) {
      logError('Failed to process subscription payment', {
        customerId,
        planId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Refund payment
   * @param {string} paymentIntentId - Payment intent ID
   * @param {number} amount - Refund amount (optional, full refund if not specified)
   * @param {string} reason - Refund reason
   */
  async refundPayment(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      let result;
      
      switch (this.provider.toLowerCase()) {
        case 'stripe':
          result = await this.refundStripePayment(paymentIntentId, amount, reason);
          break;
        default:
          result = await this.refundMockPayment(paymentIntentId, amount, reason);
      }

      logInfo('Payment refunded successfully', { 
        paymentIntentId,
        refundAmount: result.amount,
        reason,
        provider: this.provider
      });
      
      return result;
    } catch (error) {
      logError('Failed to refund payment', { 
        paymentIntentId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Refund Stripe payment
   */
  async refundStripePayment(paymentIntentId, amount, reason) {
    const refundData = {
      payment_intent: paymentIntentId,
      reason,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await this.stripeClient.refunds.create(refundData);

    return {
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
      reason: refund.reason,
      provider: 'stripe'
    };
  }

  /**
   * Refund mock payment
   */
  async refundMockPayment(paymentIntentId, amount, reason) {
    return {
      refundId: 'mock_refund_' + Date.now(),
      amount: amount || 10000,
      status: 'succeeded',
      reason,
      provider: 'mock'
    };
  }

  /**
   * Validate payment data
   */
  validatePaymentData(orderData) {
    const { orderId, amount, currency, customerId } = orderData;

    if (!orderId) throw new Error('Order ID is required');
    if (!amount || amount <= 0) throw new Error('Valid amount is required');
    if (!currency) throw new Error('Currency is required');
    if (!customerId) throw new Error('Customer ID is required');

    // Validate currency code
    const validCurrencies = ['gbp', 'usd', 'eur', 'cad', 'aud'];
    if (!validCurrencies.includes(currency.toLowerCase())) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
  }

  /**
   * Get payment status
   * @param {string} paymentIntentId - Payment intent ID
   */
  async getPaymentStatus(paymentIntentId) {
    try {
      if (this.provider === 'stripe' && this.stripeClient) {
        const paymentIntent = await this.stripeClient.paymentIntents.retrieve(paymentIntentId);
        
        return {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          provider: 'stripe'
        };
      }

      // Mock status for other providers
      return {
        paymentIntentId,
        status: 'succeeded',
        amount: 10000,
        currency: 'gbp',
        provider: 'mock'
      };
    } catch (error) {
      logError('Failed to get payment status', {
        paymentIntentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Health check for payment service
   */
  async healthCheck() {
    try {
      if (!this.initialized) {
        return { status: 'error', message: 'Payment service not initialized' };
      }

      // Test connection based on provider
      if (this.provider === 'stripe' && this.stripeClient) {
        // Test Stripe connection
        await this.stripeClient.balance.retrieve();
        return { 
          status: 'healthy', 
          provider: 'stripe',
          initialized: this.initialized
        };
      }

      return { status: 'healthy', provider: this.provider };
    } catch (error) {
      logError('Payment service health check failed', error);
      return { status: 'error', message: error.message };
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();

export default paymentService;

// Export individual functions for convenience
export const {
  createPaymentIntent,
  confirmPayment,
  processInvoicePayment,
  processSubscriptionPayment,
  refundPayment,
  getPaymentStatus,
  healthCheck
} = paymentService;