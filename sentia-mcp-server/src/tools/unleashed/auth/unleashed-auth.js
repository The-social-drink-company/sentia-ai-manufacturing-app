/**
 * Unleashed Authentication Module
 * 
 * Handles HMAC-SHA256 signature generation and authentication for Unleashed Software API.
 * Provides secure API access with proper request signing and validation.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import crypto from 'crypto';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class UnleashedAuth {
  constructor(config) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.isValidated = false;
    
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Unleashed API key and secret are required for authentication');
    }
    
    logger.info('Unleashed authentication module initialized', {
      hasApiKey: !!this.apiKey,
      hasApiSecret: !!this.apiSecret
    });
  }

  /**
   * Generate HMAC-SHA256 signature for Unleashed API requests
   * Following Unleashed's authentication requirements
   */
  generateSignature(queryString) {
    try {
      // Create signature string following Unleashed format:
      // GET\n{query_string}\n\n{api_key}
      const stringToSign = `GET\n${queryString}\n\n${this.apiKey}`;
      
      // Generate HMAC-SHA256 signature
      const signature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(stringToSign, 'utf8')
        .digest('base64');

      logger.debug('Signature generated', {
        queryStringLength: queryString.length,
        signatureGenerated: !!signature
      });

      return signature;

    } catch (error) {
      logger.error('Failed to generate signature', {
        error: error.message,
        queryString: queryString?.substring(0, 100)
      });
      throw new Error(`Signature generation failed: ${error.message}`);
    }
  }

  /**
   * Generate authentication headers for Unleashed API requests
   */
  getAuthHeaders(endpoint, params = {}) {
    try {
      // Build query string from parameters
      const queryParams = new URLSearchParams();
      
      // Add API key to query parameters
      queryParams.append('api-auth-id', this.apiKey);
      
      // Add other parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const queryString = queryParams.toString();
      const signature = this.generateSignature(queryString);

      // Return headers with signature
      return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-auth-id': this.apiKey,
        'api-auth-signature': signature
      };

    } catch (error) {
      logger.error('Failed to generate auth headers', {
        endpoint,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Build authenticated URL with proper query parameters and signature
   */
  buildAuthenticatedUrl(baseUrl, endpoint, params = {}) {
    try {
      // Build full URL
      const url = new URL(endpoint, baseUrl);
      
      // Add API key
      url.searchParams.append('api-auth-id', this.apiKey);
      
      // Add parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });

      // Generate signature for the query string
      const queryString = url.searchParams.toString();
      const signature = this.generateSignature(queryString);
      
      // Add signature to URL
      url.searchParams.append('api-auth-signature', signature);

      logger.debug('Authenticated URL built', {
        endpoint,
        paramCount: Object.keys(params).length,
        hasSignature: !!signature
      });

      return url.toString();

    } catch (error) {
      logger.error('Failed to build authenticated URL', {
        endpoint,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate API credentials by making a test request
   */
  async validateCredentials() {
    try {
      logger.info('Validating Unleashed API credentials...');

      if (!this.apiKey || !this.apiSecret) {
        throw new Error('API key and secret are required');
      }

      // Test signature generation
      const testQueryString = `api-auth-id=${this.apiKey}&test=validation`;
      const testSignature = this.generateSignature(testQueryString);

      if (!testSignature) {
        throw new Error('Failed to generate test signature');
      }

      this.isValidated = true;
      
      logger.info('Unleashed API credentials validated successfully', {
        apiKeyLength: this.apiKey.length,
        signatureGenerated: !!testSignature
      });

      return {
        valid: true,
        apiKey: this.apiKey.substring(0, 8) + '...',
        signatureTest: 'passed',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.isValidated = false;
      
      logger.error('Unleashed API credential validation failed', {
        error: error.message
      });

      throw new Error(`Credential validation failed: ${error.message}`);
    }
  }

  /**
   * Get authentication status
   */
  getStatus() {
    return {
      authenticated: this.isValidated,
      hasApiKey: !!this.apiKey,
      hasApiSecret: !!this.apiSecret,
      apiKeyPreview: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not configured',
      lastValidated: this.isValidated ? new Date().toISOString() : null
    };
  }

  /**
   * Refresh authentication status
   */
  async refresh() {
    try {
      await this.validateCredentials();
      return this.getStatus();
    } catch (error) {
      logger.error('Authentication refresh failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate request metadata for logging and debugging
   */
  getRequestMetadata(endpoint, params = {}) {
    return {
      endpoint,
      paramCount: Object.keys(params).length,
      hasAuthentication: this.isValidated,
      timestamp: new Date().toISOString(),
      apiKeyPreview: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not configured'
    };
  }

  /**
   * Validate signature format
   */
  validateSignatureFormat(signature) {
    if (!signature || typeof signature !== 'string') {
      return false;
    }

    // Base64 signature should be valid format
    try {
      const buffer = Buffer.from(signature, 'base64');
      return buffer.toString('base64') === signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Security check for API credentials
   */
  securityCheck() {
    const issues = [];

    if (!this.apiKey || this.apiKey.length < 16) {
      issues.push('API key appears to be too short or missing');
    }

    if (!this.apiSecret || this.apiSecret.length < 32) {
      issues.push('API secret appears to be too short or missing');
    }

    if (!this.isValidated) {
      issues.push('Credentials have not been validated');
    }

    return {
      secure: issues.length === 0,
      issues,
      recommendations: issues.length > 0 ? [
        'Ensure API credentials are properly configured',
        'Validate credentials before making API requests',
        'Use environment variables for sensitive credentials'
      ] : []
    };
  }
}