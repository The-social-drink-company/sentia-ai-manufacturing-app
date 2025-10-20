/**
 * Claude Authentication Manager
 * 
 * Handles Anthropic API key validation, management, and security.
 * Provides enterprise-grade authentication features for Claude AI integration.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Claude Authentication and API Key Management
 */
export class ClaudeAuth {
  constructor(config) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.isValidated = false;
    this.lastValidation = null;
    this.validationCache = new Map();
    
    if (!this.apiKey) {
      logger.warn('Anthropic API key not provided');
    }
  }

  /**
   * Validate API key with Anthropic
   */
  async validateApiKey() {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    // Check cache for recent validation
    const cacheKey = this.getApiKeyHash();
    const cached = this.validationCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutes cache
      this.isValidated = cached.valid;
      this.lastValidation = cached.timestamp;
      return cached.valid;
    }

    try {
      logger.info('Validating Anthropic API key...');

      // Create temporary client for validation
      const tempClient = new Anthropic({
        apiKey: this.apiKey
      });

      // Test with a minimal request
      const response = await tempClient.messages.create({
        model: 'claude-3-haiku-20240307', // Use fastest model for validation
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Test'
          }
        ]
      });

      if (response && response.content) {
        this.isValidated = true;
        this.lastValidation = Date.now();
        
        // Cache successful validation
        this.validationCache.set(cacheKey, {
          valid: true,
          timestamp: this.lastValidation
        });

        logger.info('Anthropic API key validated successfully');
        return true;
      }

      throw new Error('Invalid response from Anthropic API');

    } catch (error) {
      this.isValidated = false;
      
      // Cache failed validation
      this.validationCache.set(cacheKey, {
        valid: false,
        timestamp: Date.now(),
        error: error.message
      });

      logger.error('Anthropic API key validation failed', {
        error: error.message,
        statusCode: error.status
      });

      throw new Error(`API key validation failed: ${error.message}`);
    }
  }

  /**
   * Get API key for client initialization
   */
  getApiKey() {
    if (!this.isValidated) {
      throw new Error('API key not validated. Call validateApiKey() first.');
    }
    
    return this.apiKey;
  }

  /**
   * Check if API key is valid and not expired
   */
  isValid() {
    if (!this.isValidated || !this.lastValidation) {
      return false;
    }

    // Consider validation expired after 1 hour
    const validationAge = Date.now() - this.lastValidation;
    return validationAge < 3600000; // 1 hour
  }

  /**
   * Refresh API key validation
   */
  async refreshValidation() {
    try {
      await this.validateApiKey();
      return this.isValidated;
    } catch (error) {
      logger.error('Failed to refresh API key validation', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get authentication status
   */
  getStatus() {
    return {
      hasApiKey: !!this.apiKey,
      isValidated: this.isValidated,
      lastValidation: this.lastValidation,
      validationAge: this.lastValidation ? Date.now() - this.lastValidation : null,
      isExpired: !this.isValid()
    };
  }

  /**
   * Create secure hash of API key for caching
   */
  getApiKeyHash() {
    if (!this.apiKey) return null;
    
    // Create a simple hash for caching (not for security)
    const hash = this.apiKey
      .split('')
      .reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Validate API key format
   */
  validateApiKeyFormat(apiKey = this.apiKey) {
    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    // Anthropic API keys typically start with 'sk-ant-' and have specific length
    if (!apiKey.startsWith('sk-ant-')) {
      return { 
        valid: false, 
        error: 'Invalid API key format. Anthropic API keys should start with "sk-ant-"' 
      };
    }

    if (apiKey.length < 50) {
      return { 
        valid: false, 
        error: 'API key appears to be too short' 
      };
    }

    return { valid: true };
  }

  /**
   * Update API key and revalidate
   */
  async updateApiKey(newApiKey) {
    try {
      // Validate format first
      const formatValidation = this.validateApiKeyFormat(newApiKey);
      if (!formatValidation.valid) {
        throw new Error(formatValidation.error);
      }

      // Clear cache
      this.validationCache.clear();
      
      // Update key
      const oldKey = this.apiKey;
      this.apiKey = newApiKey;
      this.isValidated = false;
      this.lastValidation = null;

      // Validate new key
      await this.validateApiKey();

      logger.info('API key updated and validated successfully');
      return true;

    } catch (error) {
      // Restore old key on failure
      this.apiKey = oldKey;
      logger.error('Failed to update API key', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get usage statistics for monitoring
   */
  getUsageStats() {
    return {
      validationCacheSize: this.validationCache.size,
      lastValidationAge: this.lastValidation ? Date.now() - this.lastValidation : null,
      validationStatus: this.getStatus()
    };
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear();
    logger.info('API key validation cache cleared');
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.clearCache();
    this.isValidated = false;
    this.lastValidation = null;
    
    logger.info('Claude authentication cleaned up');
  }
}