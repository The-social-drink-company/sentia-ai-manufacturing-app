/**
 * OpenAI Authentication Module
 * 
 * Handles secure authentication and API key management for OpenAI GPT integration.
 * Provides validation, secure storage, and organization/project management.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';
import OpenAI from 'openai';

const logger = createLogger();

/**
 * OpenAI Authentication Manager
 * Manages API authentication, organization settings, and security
 */
export class OpenAIAuth {
  constructor(config) {
    this.config = config;
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.organizationId = config.organizationId || process.env.OPENAI_ORGANIZATION_ID;
    this.projectId = config.projectId || process.env.OPENAI_PROJECT_ID;
    this.isValidated = false;
    this.organizationInfo = null;
    this.usageLimits = null;
    
    logger.info('OpenAI Authentication initialized', {
      hasApiKey: !!this.apiKey,
      hasOrganization: !!this.organizationId,
      hasProject: !!this.projectId
    });
  }

  /**
   * Validate API key and organization access
   */
  async validateApiKey() {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not provided. Set OPENAI_API_KEY environment variable or provide in config.');
      }

      logger.info('Validating OpenAI API key...');

      // Create temporary client for validation
      const tempClient = new OpenAI({
        apiKey: this.apiKey,
        organization: this.organizationId,
        project: this.projectId
      });

      // Test API key by listing available models
      const models = await tempClient.models.list();
      
      if (!models || !models.data || models.data.length === 0) {
        throw new Error('Invalid OpenAI API key or insufficient permissions');
      }

      // Get organization information if organization ID is provided
      if (this.organizationId) {
        try {
          // Note: Organization info endpoint requires admin access
          // We'll skip this if not available and just log a warning
          logger.info('Organization ID provided, but organization info requires admin access');
        } catch (orgError) {
          logger.warn('Could not retrieve organization information', {
            error: orgError.message,
            organizationId: this.organizationId
          });
        }
      }

      this.isValidated = true;
      
      logger.info('OpenAI API key validated successfully', {
        availableModels: models.data.length,
        hasGPT4: models.data.some(m => m.id.includes('gpt-4')),
        hasGPT35: models.data.some(m => m.id.includes('gpt-3.5'))
      });

      return {
        valid: true,
        availableModels: models.data.map(m => m.id),
        organizationId: this.organizationId,
        projectId: this.projectId
      };

    } catch (error) {
      logger.error('OpenAI API key validation failed', {
        error: error.message,
        hasApiKey: !!this.apiKey,
        keyPrefix: this.apiKey ? `${this.apiKey.substring(0, 7)}...` : 'none'
      });
      
      this.isValidated = false;
      throw new Error(`OpenAI authentication failed: ${error.message}`);
    }
  }

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders() {
    if (!this.isValidated) {
      throw new Error('OpenAI API key not validated. Call validateApiKey() first.');
    }

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    if (this.organizationId) {
      headers['OpenAI-Organization'] = this.organizationId;
    }

    if (this.projectId) {
      headers['OpenAI-Project'] = this.projectId;
    }

    return headers;
  }

  /**
   * Create authenticated OpenAI client instance
   */
  createClient() {
    if (!this.isValidated) {
      throw new Error('OpenAI API key not validated. Call validateApiKey() first.');
    }

    const clientConfig = {
      apiKey: this.apiKey
    };

    if (this.organizationId) {
      clientConfig.organization = this.organizationId;
    }

    if (this.projectId) {
      clientConfig.project = this.projectId;
    }

    return new OpenAI(clientConfig);
  }

  /**
   * Check current usage and limits (if available)
   */
  async checkUsageLimits() {
    try {
      if (!this.isValidated) {
        await this.validateApiKey();
      }

      // Note: Usage endpoint is not available in the standard API
      // This would require billing API access which is typically restricted
      logger.info('Usage limits check requested, but requires billing API access');
      
      return {
        available: false,
        reason: 'Billing API access required for usage limits'
      };

    } catch (error) {
      logger.warn('Could not check usage limits', {
        error: error.message
      });
      
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh authentication and validate periodically
   */
  async refreshAuth() {
    try {
      logger.info('Refreshing OpenAI authentication...');
      
      // Re-validate API key
      const validation = await this.validateApiKey();
      
      logger.info('OpenAI authentication refreshed successfully');
      return validation;
      
    } catch (error) {
      logger.error('Failed to refresh OpenAI authentication', {
        error: error.message
      });
      
      this.isValidated = false;
      throw error;
    }
  }

  /**
   * Get authentication status and information
   */
  getAuthStatus() {
    return {
      authenticated: this.isValidated,
      hasApiKey: !!this.apiKey,
      organizationId: this.organizationId,
      projectId: this.projectId,
      organizationInfo: this.organizationInfo,
      usageLimits: this.usageLimits,
      keyPrefix: this.apiKey ? `${this.apiKey.substring(0, 7)}...` : null
    };
  }

  /**
   * Secure cleanup of authentication data
   */
  cleanup() {
    try {
      logger.info('Cleaning up OpenAI authentication...');
      
      // Clear sensitive data
      this.apiKey = null;
      this.organizationInfo = null;
      this.usageLimits = null;
      this.isValidated = false;
      
      logger.info('OpenAI authentication cleanup completed');
      
    } catch (error) {
      logger.error('Error during OpenAI authentication cleanup', {
        error: error.message
      });
    }
  }

  /**
   * Validate environment configuration
   */
  static validateEnvironment() {
    const issues = [];

    if (!process.env.OPENAI_API_KEY) {
      issues.push('OPENAI_API_KEY environment variable not set');
    } else if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      issues.push('OPENAI_API_KEY does not appear to be a valid OpenAI API key format');
    }

    if (process.env.OPENAI_ORGANIZATION_ID && !process.env.OPENAI_ORGANIZATION_ID.startsWith('org-')) {
      issues.push('OPENAI_ORGANIZATION_ID does not appear to be a valid organization ID format');
    }

    if (process.env.OPENAI_PROJECT_ID && !process.env.OPENAI_PROJECT_ID.startsWith('proj_')) {
      issues.push('OPENAI_PROJECT_ID does not appear to be a valid project ID format');
    }

    if (issues.length > 0) {
      logger.warn('OpenAI environment configuration issues detected', { issues });
      return { valid: false, issues };
    }

    logger.info('OpenAI environment configuration validated successfully');
    return { valid: true, issues: [] };
  }
}