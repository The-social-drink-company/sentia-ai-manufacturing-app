/**
 * Amazon SP-API Authentication Handler
 * 
 * Manages Login with Amazon (LWA) authentication for Selling Partner API
 * with support for multiple marketplaces and token refresh automation.
 * 
 * @version 1.0.0
 */

import pkg from 'amazon-sp-api';
const { SellingPartnerAPI } = pkg;
import crypto from 'crypto';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon SP-API Authentication Class
 */
export class AmazonAuth {
  constructor(config = {}) {
    this.config = {
      // LWA (Login with Amazon) Configuration
      clientId: config.clientId || process.env.AMAZON_CLIENT_ID,
      clientSecret: config.clientSecret || process.env.AMAZON_CLIENT_SECRET,
      refreshToken: config.refreshToken || process.env.AMAZON_REFRESH_TOKEN,
      
      // SP-API Configuration
      region: config.region || process.env.AMAZON_REGION || 'us-east-1',
      sandbox: config.sandbox || process.env.AMAZON_SANDBOX === 'true',
      
      // Rate limiting
      rateLimitBuffer: config.rateLimitBuffer || 0.8, // Use 80% of rate limit
      
      // Token management
      tokenValidityBuffer: config.tokenValidityBuffer || 300, // 5 minutes buffer
      
      ...config
    };

    // Marketplace configurations
    this.marketplaces = {
      'UK': {
        id: 'A1F83G8C2ARO7P',
        endpoint: 'https://sellingpartnerapi-eu.amazon.com',
        region: 'eu-west-1',
        currency: 'GBP',
        countryCode: 'GB'
      },
      'USA': {
        id: 'ATVPDKIKX0DER',
        endpoint: 'https://sellingpartnerapi-na.amazon.com',
        region: 'us-east-1',
        currency: 'USD',
        countryCode: 'US'
      },
      'EU': {
        id: 'A1PA6795UKMFR9',
        endpoint: 'https://sellingpartnerapi-eu.amazon.com',
        region: 'eu-west-1',
        currency: 'EUR',
        countryCode: 'DE'
      },
      'CANADA': {
        id: 'A2EUQ1WTGCTBG2',
        endpoint: 'https://sellingpartnerapi-na.amazon.com',
        region: 'us-east-1',
        currency: 'CAD',
        countryCode: 'CA'
      }
    };

    // Store active clients and tokens
    this.clients = new Map();
    this.accessTokens = new Map();
    this.authStates = new Map();

    this.validateConfiguration();

    logger.info('Amazon SP-API Auth initialized', {
      hasClientId: !!this.config.clientId,
      hasClientSecret: !!this.config.clientSecret,
      hasRefreshToken: !!this.config.refreshToken,
      sandbox: this.config.sandbox,
      supportedMarketplaces: Object.keys(this.marketplaces)
    });
  }

  /**
   * Validate authentication configuration
   */
  validateConfiguration() {
    // Log environment variable status for debugging
    console.log('Amazon environment variables check:', {
      hasClientId: !!process.env.AMAZON_CLIENT_ID,
      hasClientSecret: !!process.env.AMAZON_CLIENT_SECRET,
      hasRefreshToken: !!process.env.AMAZON_REFRESH_TOKEN,
      configClientId: !!this.config.clientId,
      configClientSecret: !!this.config.clientSecret,
      configRefreshToken: !!this.config.refreshToken
    });
    
    const required = ['clientId', 'clientSecret', 'refreshToken'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required Amazon SP-API configuration: ${missing.join(', ')}`);
    }

    // Validate marketplace configurations
    for (const [name, marketplace] of Object.entries(this.marketplaces)) {
      if (!marketplace.id || !marketplace.endpoint) {
        throw new Error(`Invalid marketplace configuration for ${name}`);
      }
    }
  }

  /**
   * Get or create SP-API client for marketplace
   */
  async getClient(marketplaceId, options = {}) {
    const correlationId = options.correlationId || `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const marketplace = this.getMarketplaceConfig(marketplaceId);
      const clientKey = `${marketplaceId}-${this.config.sandbox ? 'sandbox' : 'prod'}`;

      // Return existing client if valid
      if (this.clients.has(clientKey)) {
        const client = this.clients.get(clientKey);
        
        // Verify token is still valid
        if (await this.isTokenValid(clientKey)) {
          logger.debug('Using existing SP-API client', { 
            correlationId, 
            marketplace: marketplaceId, 
            sandbox: this.config.sandbox 
          });
          return client;
        }
      }

      // Create new client with fresh token
      logger.info('Creating new SP-API client', { 
        correlationId, 
        marketplace: marketplaceId,
        sandbox: this.config.sandbox 
      });

      const clientConfig = {
        region: marketplace.region,
        refresh_token: this.config.refreshToken,
        credentials: {
          SELLING_PARTNER_APP_CLIENT_ID: this.config.clientId,
          SELLING_PARTNER_APP_CLIENT_SECRET: this.config.clientSecret,
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
          AWS_SELLING_PARTNER_ROLE: process.env.AWS_SELLING_PARTNER_ROLE
        },
        options: {
          debug: this.config.sandbox,
          only_grantless_operations: false,
          use_sandbox: this.config.sandbox,
          auto_request_tokens: true,
          auto_request_throttled: true
        }
      };

      const client = new SellingPartnerAPI(clientConfig);
      
      // Test authentication
      await this.testAuthentication(client, marketplace, correlationId);
      
      // Store client and mark token as valid
      this.clients.set(clientKey, client);
      this.markTokenValid(clientKey);

      logger.info('SP-API client created successfully', { 
        correlationId, 
        marketplace: marketplaceId 
      });

      return client;

    } catch (error) {
      logger.error('Failed to create SP-API client', {
        correlationId,
        marketplace: marketplaceId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Test authentication with a simple API call
   */
  async testAuthentication(client, marketplace, correlationId) {
    try {
      // Test with getMarketplaceParticipations API
      const response = await client.callAPI({
        operation: 'getMarketplaceParticipations',
        endpoint: 'sellers'
      });

      if (response && response.marketplace_participations) {
        logger.info('SP-API authentication test successful', {
          correlationId,
          marketplace: marketplace.id,
          participations: response.marketplace_participations.length
        });
        return true;
      }

      throw new Error('Invalid authentication response');

    } catch (error) {
      logger.error('SP-API authentication test failed', {
        correlationId,
        marketplace: marketplace.id,
        error: error.message
      });
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Get marketplace configuration by ID or name
   */
  getMarketplaceConfig(identifier) {
    // Try by marketplace ID first
    for (const [name, config] of Object.entries(this.marketplaces)) {
      if (config.id === identifier) {
        return { ...config, name };
      }
    }

    // Try by name
    if (this.marketplaces[identifier.toUpperCase()]) {
      return { 
        ...this.marketplaces[identifier.toUpperCase()], 
        name: identifier.toUpperCase() 
      };
    }

    throw new Error(`Unknown marketplace: ${identifier}`);
  }

  /**
   * Get all supported marketplaces
   */
  getSupportedMarketplaces() {
    return Object.entries(this.marketplaces).map(([name, config]) => ({
      name,
      ...config
    }));
  }

  /**
   * Generate authorization URL for manual OAuth flow
   */
  generateAuthUrl(state = null, scopes = null) {
    const defaultScopes = [
      'sellingpartnerapi::notifications',
      'sellingpartnerapi::migration'
    ];

    const authState = state || crypto.randomBytes(16).toString('hex');
    const authScopes = scopes || defaultScopes;

    this.authStates.set(authState, {
      created: Date.now(),
      scopes: authScopes
    });

    const params = new URLSearchParams({
      application_id: this.config.clientId,
      state: authState,
      version: 'beta'
    });

    const authUrl = `https://sellercentral.amazon.com/apps/authorize/consent?${params.toString()}`;

    logger.info('Generated Amazon authorization URL', {
      state: authState,
      scopes: authScopes.join(', ')
    });

    return {
      authUrl,
      state: authState,
      scopes: authScopes
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeAuthorizationCode(code, state) {
    try {
      if (!this.authStates.has(state)) {
        throw new Error('Invalid or expired authorization state');
      }

      const authState = this.authStates.get(state);
      this.authStates.delete(state);

      // This would typically involve calling LWA token endpoint
      // For now, we'll assume refresh token is already configured
      logger.info('Authorization code exchange initiated', {
        state,
        hasCode: !!code
      });

      return {
        success: true,
        message: 'Please configure refresh token in environment variables'
      };

    } catch (error) {
      logger.error('Authorization code exchange failed', {
        state,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(marketplaceId) {
    const clientKey = `${marketplaceId}-${this.config.sandbox ? 'sandbox' : 'prod'}`;
    
    try {
      logger.info('Refreshing access token', { marketplace: marketplaceId });

      // Remove cached client to force recreation with new token
      this.clients.delete(clientKey);
      this.accessTokens.delete(clientKey);

      // Create new client (which will automatically refresh token)
      const client = await this.getClient(marketplaceId);

      logger.info('Access token refreshed successfully', { marketplace: marketplaceId });
      return client;

    } catch (error) {
      logger.error('Failed to refresh access token', {
        marketplace: marketplaceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if token is valid
   */
  async isTokenValid(clientKey) {
    const tokenInfo = this.accessTokens.get(clientKey);
    
    if (!tokenInfo) {
      return false;
    }

    const now = Date.now();
    const tokenAge = now - tokenInfo.created;
    const bufferTime = this.config.tokenValidityBuffer * 1000;

    // Tokens are typically valid for 1 hour
    return tokenAge < (3600 * 1000 - bufferTime);
  }

  /**
   * Mark token as valid
   */
  markTokenValid(clientKey) {
    this.accessTokens.set(clientKey, {
      created: Date.now(),
      valid: true
    });
  }

  /**
   * Get authentication status
   */
  getAuthStatus() {
    const status = {
      configured: this.config.clientId && this.config.clientSecret && this.config.refreshToken,
      sandbox: this.config.sandbox,
      activeClients: this.clients.size,
      supportedMarketplaces: Object.keys(this.marketplaces),
      clientStatus: {}
    };

    // Add client-specific status
    for (const [clientKey, client] of this.clients.entries()) {
      status.clientStatus[clientKey] = {
        connected: true,
        tokenValid: this.isTokenValid(clientKey),
        lastUsed: this.accessTokens.get(clientKey)?.created || null
      };
    }

    return status;
  }

  /**
   * Disconnect all clients
   */
  disconnect() {
    logger.info('Disconnecting all SP-API clients', {
      clientCount: this.clients.size
    });

    this.clients.clear();
    this.accessTokens.clear();
    this.authStates.clear();

    return {
      success: true,
      message: 'All SP-API clients disconnected'
    };
  }

  /**
   * Test connection to specific marketplace
   */
  async testConnection(marketplaceId, options = {}) {
    const correlationId = options.correlationId || `test-${Date.now()}`;
    
    try {
      const client = await this.getClient(marketplaceId, { correlationId });
      const marketplace = this.getMarketplaceConfig(marketplaceId);

      // Perform basic API test
      await this.testAuthentication(client, marketplace, correlationId);

      return {
        success: true,
        marketplace: marketplace.name,
        marketplaceId: marketplace.id,
        endpoint: marketplace.endpoint,
        sandbox: this.config.sandbox,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        marketplace: marketplaceId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get client for authenticated operations
   */
  async getAuthenticatedClient(marketplaceId, options = {}) {
    return await this.getClient(marketplaceId, options);
  }
}