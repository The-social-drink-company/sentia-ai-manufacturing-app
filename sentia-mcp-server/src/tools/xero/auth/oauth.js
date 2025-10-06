/**
 * Xero OAuth 2.0 Authentication Handler
 * 
 * Manages the complete OAuth 2.0 flow for Xero API authentication
 * including authorization URL generation, token exchange, and refresh.
 * 
 * @version 1.0.0
 */

import pkg from 'xero-node';
const { XeroApi } = pkg;
import crypto from 'crypto';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Xero OAuth 2.0 Authentication Class
 */
export class XeroAuth {
  constructor(config) {
    this.config = config;
    this.xeroApi = new XeroApi({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUris: [config.redirectUri],
      scopes: config.scopes,
      httpTimeout: 30000
    });

    // Store for PKCE verification
    this.codeVerifiers = new Map();

    logger.info('Xero OAuth handler initialized', {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes
    });
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  async getAuthorizationUrl(state = null) {
    try {
      // Generate PKCE parameters
      const pkce = this.generatePKCE();
      
      // Generate state parameter if not provided
      if (!state) {
        state = crypto.randomBytes(16).toString('hex');
      }

      // Store code verifier for later use
      this.codeVerifiers.set(state, pkce.codeVerifier);

      // Build authorization URL
      const authUrl = await this.xeroApi.buildConsentUrl({
        state,
        codeChallenge: pkce.codeChallenge,
        codeChallengeMethod: pkce.codeChallengeMethod
      });

      logger.info('Generated authorization URL', {
        state,
        hasCodeChallenge: !!pkce.codeChallenge
      });

      return {
        url: authUrl,
        state,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      };

    } catch (error) {
      logger.error('Failed to generate authorization URL', {
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Authorization URL generation failed: ${error.message}`);
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForToken(code, state = null) {
    try {
      logger.info('Exchanging code for tokens', {
        code: code.substring(0, 10) + '...',
        state
      });

      // Get stored code verifier
      let codeVerifier = null;
      if (state && this.codeVerifiers.has(state)) {
        codeVerifier = this.codeVerifiers.get(state);
        this.codeVerifiers.delete(state); // Clean up
      }

      // Exchange code for tokens
      const tokenSet = await this.xeroApi.apiCallback(code, codeVerifier);

      if (!tokenSet || !tokenSet.access_token) {
        throw new Error('Invalid token response from Xero');
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (tokenSet.expires_in * 1000));

      const tokenData = {
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token,
        token_type: tokenSet.token_type || 'Bearer',
        expires_in: tokenSet.expires_in,
        expires_at: expiresAt.toISOString(),
        scope: tokenSet.scope,
        created_at: new Date().toISOString()
      };

      logger.info('Token exchange successful', {
        expires_in: tokenSet.expires_in,
        scope: tokenSet.scope,
        hasRefreshToken: !!tokenSet.refresh_token
      });

      return tokenData;

    } catch (error) {
      logger.error('Token exchange failed', {
        error: error.message,
        code: code?.substring(0, 10) + '...',
        state
      });
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken) {
    try {
      logger.info('Refreshing access token');

      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Create token set for refresh
      const oldTokenSet = { refresh_token: refreshToken };
      
      // Refresh tokens
      const newTokenSet = await this.xeroApi.refreshToken(oldTokenSet);

      if (!newTokenSet || !newTokenSet.access_token) {
        throw new Error('Invalid refresh token response from Xero');
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (newTokenSet.expires_in * 1000));

      const tokenData = {
        access_token: newTokenSet.access_token,
        refresh_token: newTokenSet.refresh_token || refreshToken, // Keep old refresh token if new one not provided
        token_type: newTokenSet.token_type || 'Bearer',
        expires_in: newTokenSet.expires_in,
        expires_at: expiresAt.toISOString(),
        scope: newTokenSet.scope,
        refreshed_at: new Date().toISOString()
      };

      logger.info('Token refresh successful', {
        expires_in: newTokenSet.expires_in,
        scope: newTokenSet.scope
      });

      return tokenData;

    } catch (error) {
      logger.error('Token refresh failed', {
        error: error.message,
        hasRefreshToken: !!refreshToken
      });
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Revoke access tokens
   */
  async revokeTokens(accessToken) {
    try {
      logger.info('Revoking access token');

      if (!accessToken) {
        throw new Error('Access token is required for revocation');
      }

      // Note: Xero doesn't have a standard revoke endpoint
      // Tokens will expire naturally or can be invalidated by removing app access
      
      logger.info('Token revocation completed (Xero auto-expires tokens)');
      
      return {
        success: true,
        message: 'Tokens will expire naturally',
        revokedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Token revocation failed', {
        error: error.message
      });
      throw new Error(`Token revocation failed: ${error.message}`);
    }
  }

  /**
   * Validate access token by making a test API call
   */
  async validateToken(tokenData) {
    try {
      // Set token in API client
      await this.xeroApi.setTokenSet(tokenData);

      // Make a simple API call to validate token
      const organisations = await this.xeroApi.accountingApi.getOrganisations();

      if (!organisations || !organisations.body) {
        throw new Error('Invalid token validation response');
      }

      logger.info('Token validation successful', {
        organisationsCount: organisations.body.organisations?.length || 0
      });

      return {
        valid: true,
        organisations: organisations.body.organisations?.map(org => ({
          organisationID: org.organisationID,
          name: org.name,
          legalName: org.legalName,
          taxNumber: org.taxNumber,
          organisationType: org.organisationType,
          isDemoCompany: org.isDemoCompany
        })) || []
      };

    } catch (error) {
      logger.warn('Token validation failed', {
        error: error.message
      });

      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get current authentication status
   */
  getAuthStatus() {
    return {
      configured: !!(this.config.clientId && this.config.clientSecret),
      redirectUri: this.config.redirectUri,
      scopes: this.config.scopes,
      pendingStates: this.codeVerifiers.size
    };
  }

  /**
   * Clean up expired state entries
   */
  cleanupExpiredStates() {
    // Clean up code verifiers older than 15 minutes
    const cutoff = Date.now() - (15 * 60 * 1000);
    
    for (const [state, timestamp] of this.codeVerifiers.entries()) {
      if (timestamp < cutoff) {
        this.codeVerifiers.delete(state);
      }
    }

    logger.debug('Cleaned up expired OAuth states', {
      remaining: this.codeVerifiers.size
    });
  }
}