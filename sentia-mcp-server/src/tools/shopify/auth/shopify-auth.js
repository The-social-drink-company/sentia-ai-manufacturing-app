/**
 * Shopify Authentication Manager
 * 
 * Handles OAuth 2.0 authentication for multiple Shopify stores,
 * token management, and authentication validation.
 * 
 * @version 1.0.0
 */

import CryptoJS from 'crypto-js';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Shopify Authentication Class
 */
export class ShopifyAuth {
  constructor(config = {}) {
    this.config = config;
    this.encryptionKey = process.env.SHOPIFY_ENCRYPTION_KEY || 'default-key-change-in-production';
    this.tokens = new Map(); // In-memory token storage (extend to database for production)
    
    logger.info('Shopify Auth initialized', {
      storesConfigured: Object.keys(this.config.stores || {}).length,
      encryptionEnabled: !!this.encryptionKey
    });
  }

  /**
   * Generate OAuth authorization URL for a store
   */
  generateAuthUrl(storeId, options = {}) {
    try {
      const storeConfig = this.config.stores[storeId];
      if (!storeConfig) {
        throw new Error(`Store '${storeId}' not configured`);
      }

      const scopes = options.scopes || [
        'read_products',
        'write_products',
        'read_orders',
        'read_customers',
        'read_inventory',
        'write_inventory',
        'read_analytics'
      ];

      const state = options.state || this.generateState();
      const redirectUri = options.redirectUri || process.env.SHOPIFY_REDIRECT_URI;

      const authUrl = new URL(`https://${storeConfig.shopDomain}/admin/oauth/authorize`);
      authUrl.searchParams.set('client_id', process.env.SHOPIFY_API_KEY);
      authUrl.searchParams.set('scope', scopes.join(','));
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state);

      logger.info('OAuth URL generated', {
        storeId,
        shopDomain: storeConfig.shopDomain,
        scopes: scopes.length,
        state
      });

      return {
        authUrl: authUrl.toString(),
        state,
        storeId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };

    } catch (error) {
      logger.error('Failed to generate auth URL', {
        storeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(storeId, code, state) {
    try {
      const storeConfig = this.config.stores[storeId];
      if (!storeConfig) {
        throw new Error(`Store '${storeId}' not configured`);
      }

      // Validate state parameter (in production, validate against stored state)
      if (!state) {
        throw new Error('Invalid state parameter');
      }

      const tokenEndpoint = `https://${storeConfig.shopDomain}/admin/oauth/access_token`;
      const requestBody = {
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      };

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
      }

      const tokenData = await response.json();

      // Store the access token securely
      await this.storeToken(storeId, {
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
        obtainedAt: new Date().toISOString(),
        expiresAt: null // Shopify tokens don't expire
      });

      logger.info('Access token obtained successfully', {
        storeId,
        shopDomain: storeConfig.shopDomain,
        scopes: tokenData.scope
      });

      return {
        success: true,
        storeId,
        scopes: tokenData.scope,
        obtainedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Token exchange failed', {
        storeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Store access token securely
   */
  async storeToken(storeId, tokenData) {
    try {
      const encryptedToken = {
        accessToken: this.encrypt(tokenData.accessToken),
        scope: tokenData.scope,
        obtainedAt: tokenData.obtainedAt,
        expiresAt: tokenData.expiresAt,
        storeId
      };

      // Store in memory (extend to database for production)
      this.tokens.set(storeId, encryptedToken);

      logger.debug('Token stored successfully', {
        storeId,
        hasToken: !!tokenData.accessToken
      });

      return true;

    } catch (error) {
      logger.error('Failed to store token', {
        storeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Retrieve access token for a store
   */
  async getToken(storeId) {
    try {
      // First check stored tokens
      const storedToken = this.tokens.get(storeId);
      if (storedToken) {
        return {
          accessToken: this.decrypt(storedToken.accessToken),
          scope: storedToken.scope,
          obtainedAt: storedToken.obtainedAt
        };
      }

      // Fallback to environment variable
      const storeConfig = this.config.stores[storeId];
      if (storeConfig && storeConfig.accessToken) {
        return {
          accessToken: storeConfig.accessToken,
          scope: 'read_products,read_orders,read_customers,read_inventory',
          obtainedAt: 'from_config'
        };
      }

      throw new Error(`No access token found for store '${storeId}'`);

    } catch (error) {
      logger.error('Failed to retrieve token', {
        storeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate access token for a store
   */
  async validateToken(storeId) {
    try {
      const tokenData = await this.getToken(storeId);
      const storeConfig = this.config.stores[storeId];

      // Test the token by making a simple API call
      const testUrl = `https://${storeConfig.shopDomain}/admin/api/${storeConfig.apiVersion}/shop.json`;
      const response = await fetch(testUrl, {
        headers: {
          'X-Shopify-Access-Token': tokenData.accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Token validation failed: ${response.status}`);
      }

      const shopData = await response.json();

      logger.info('Token validated successfully', {
        storeId,
        shopName: shopData.shop.name,
        planName: shopData.shop.plan_name
      });

      return {
        valid: true,
        storeId,
        shopName: shopData.shop.name,
        planName: shopData.shop.plan_name,
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Token validation failed', {
        storeId,
        error: error.message
      });

      return {
        valid: false,
        storeId,
        error: error.message,
        validatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Revoke access token for a store
   */
  async revokeToken(storeId) {
    try {
      // Remove from memory storage
      this.tokens.delete(storeId);

      logger.info('Token revoked successfully', { storeId });

      return {
        success: true,
        storeId,
        revokedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Token revocation failed', {
        storeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get authentication status for all stores
   */
  async getAuthStatus() {
    const status = {};

    for (const storeId of Object.keys(this.config.stores)) {
      try {
        const validation = await this.validateToken(storeId);
        status[storeId] = validation;
      } catch (error) {
        status[storeId] = {
          valid: false,
          storeId,
          error: error.message,
          validatedAt: new Date().toISOString()
        };
      }
    }

    return status;
  }

  /**
   * Generate secure state parameter
   */
  generateState() {
    return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text) {
    try {
      return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
    } catch (error) {
      logger.error('Encryption failed', { error: error.message });
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      logger.error('Decryption failed', { error: error.message });
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if store requires authentication
   */
  requiresAuth(storeId) {
    const storeConfig = this.config.stores[storeId];
    return !storeConfig || !storeConfig.accessToken;
  }

  /**
   * Create session object for Shopify API
   */
  async createSession(storeId) {
    try {
      const tokenData = await this.getToken(storeId);
      const storeConfig = this.config.stores[storeId];

      return {
        id: `session-${storeId}`,
        shop: storeConfig.shopDomain,
        state: 'authenticated',
        isOnline: false,
        accessToken: tokenData.accessToken,
        scope: tokenData.scope
      };

    } catch (error) {
      logger.error('Failed to create session', {
        storeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get webhook verification signature
   */
  verifyWebhookSignature(body, signature, secret = null) {
    try {
      const webhookSecret = secret || this.config.webhooks?.secret || process.env.SHOPIFY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      const computedSignature = CryptoJS.HmacSHA256(body, webhookSecret).toString(CryptoJS.enc.Base64);
      return computedSignature === signature;

    } catch (error) {
      logger.error('Webhook signature verification failed', {
        error: error.message
      });
      return false;
    }
  }
}