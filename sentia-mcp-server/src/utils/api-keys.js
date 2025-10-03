/**
 * API Key Management Utilities
 * 
 * Comprehensive API key management system with development bypass
 * for the Sentia Manufacturing MCP Server.
 * 
 * CRITICAL: Development environment uses mock API keys for easier testing
 * while maintaining full key management in production.
 */

import crypto from 'crypto';
import { createLogger } from './logger.js';
import { encryptionUtils } from './encryption.js';
import { securityUtils } from './security.js';
import { 
  isDevelopmentEnvironment, 
  CURRENT_AUTH_CONFIG 
} from '../config/auth-config.js';

const logger = createLogger();

/**
 * API Key Management Class
 */
export class APIKeyManager {
  constructor() {
    this.isDevelopment = isDevelopmentEnvironment();
    this.config = CURRENT_AUTH_CONFIG.apiKeys;
    this.authConfig = CURRENT_AUTH_CONFIG.authentication;
    
    // In-memory store for development and testing
    this.keyStore = new Map();
    this.usageStore = new Map();
    
    // Initialize development keys
    if (this.isDevelopment) {
      this.initializeDevelopmentKeys();
    }
  }

  /**
   * Initialize development API keys
   */
  initializeDevelopmentKeys() {
    const devKeys = this.config.development.mockKeys;
    
    for (const key of devKeys) {
      this.keyStore.set(key, {
        id: `dev-${key}`,
        key: key,
        userId: 'dev-user-001',
        name: `Development API Key ${key}`,
        permissions: this.config.development.permissions,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUsed: null,
        usageCount: 0,
        environment: 'development',
        encrypted: false
      });
    }
    
    logger.debug('Development API keys initialized', {
      count: devKeys.length,
      keys: devKeys.map(k => k.substring(0, 8) + '...')
    });
  }

  /**
   * Generate new API key
   */
  async generateAPIKey(userId, options = {}) {
    const {
      name = 'Unnamed API Key',
      permissions = ['dashboard:read'],
      expiresInDays = this.config.production.expirationDays
    } = options;
    
    // In development, use simple key generation
    if (this.isDevelopment) {
      const devKey = `dev-api-key-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      const keyData = {
        id: `dev-key-${Date.now()}`,
        key: devKey,
        userId,
        name,
        permissions: this.config.development.permissions, // Always grant full permissions in dev
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: null, // No expiration in development
        lastUsed: null,
        usageCount: 0,
        environment: 'development',
        encrypted: false
      };
      
      this.keyStore.set(devKey, keyData);
      
      logger.debug('Development API key generated', {
        keyId: keyData.id,
        userId,
        name,
        key: devKey.substring(0, 12) + '...'
      });
      
      return {
        success: true,
        apiKey: devKey,
        keyId: keyData.id,
        expiresAt: null,
        permissions: keyData.permissions
      };
    }
    
    // Production API key generation
    try {
      const apiKey = securityUtils.generateAPIKey();
      const keyId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000));
      
      // Hash the API key for storage
      const hashedKey = await securityUtils.hashPassword(apiKey);
      
      const keyData = {
        id: keyId,
        hashedKey, // Store hashed version
        userId,
        name,
        permissions,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastUsed: null,
        usageCount: 0,
        environment: 'production',
        encrypted: true
      };
      
      // Encrypt sensitive data
      const encryptedKeyData = encryptionUtils.encryptFields(keyData, [
        'hashedKey',
        'permissions'
      ]);
      
      // Store in database (simulated with Map for now)
      this.keyStore.set(keyId, encryptedKeyData);
      
      logger.info('Production API key generated', {
        keyId,
        userId,
        name,
        expiresAt: expiresAt.toISOString(),
        permissions: permissions.length
      });
      
      return {
        success: true,
        apiKey, // Return unhashed key only once
        keyId,
        expiresAt: expiresAt.toISOString(),
        permissions
      };
      
    } catch (error) {
      logger.error('API key generation failed', {
        userId,
        name,
        error: error.message
      });
      
      throw new Error(`API key generation failed: ${error.message}`);
    }
  }

  /**
   * Validate API key
   */
  async validateAPIKey(apiKey, options = {}) {
    const { trackUsage = true, requiredPermissions = [] } = options;
    
    try {
      // In development, check mock keys first
      if (this.isDevelopment && this.config.development.mockKeys.includes(apiKey)) {
        const keyData = this.keyStore.get(apiKey);
        
        if (trackUsage) {
          keyData.lastUsed = new Date().toISOString();
          keyData.usageCount++;
          this.updateUsageStats(apiKey, 'development');
        }
        
        logger.debug('Development API key validated', {
          key: apiKey.substring(0, 8) + '...',
          usageCount: keyData.usageCount
        });
        
        return {
          valid: true,
          keyData: {
            id: keyData.id,
            userId: keyData.userId,
            permissions: keyData.permissions,
            environment: 'development'
          }
        };
      }
      
      // Production validation
      if (!securityUtils.isValidAPIKeyFormat(apiKey)) {
        return { valid: false, reason: 'invalid_format' };
      }
      
      // Search for key by trying to match hash
      for (const [keyId, storedData] of this.keyStore.entries()) {
        if (storedData.environment === 'production') {
          try {
            // Decrypt the key data
            const decryptedData = encryptionUtils.decryptFields(storedData, [
              'hashedKey',
              'permissions'
            ]);
            
            // Verify the API key
            const isValid = await securityUtils.verifyPassword(apiKey, decryptedData.hashedKey);
            
            if (isValid) {
              // Check if key is expired
              if (decryptedData.expiresAt && new Date() > new Date(decryptedData.expiresAt)) {
                logger.warn('Expired API key used', {
                  keyId,
                  expiresAt: decryptedData.expiresAt
                });
                return { valid: false, reason: 'expired' };
              }
              
              // Check if key is active
              if (decryptedData.status !== 'active') {
                return { valid: false, reason: 'inactive' };
              }
              
              // Check required permissions
              if (requiredPermissions.length > 0) {
                const hasPermissions = requiredPermissions.every(permission => 
                  decryptedData.permissions.includes(permission) || 
                  decryptedData.permissions.includes('*')
                );
                
                if (!hasPermissions) {
                  return { valid: false, reason: 'insufficient_permissions' };
                }
              }
              
              // Update usage tracking
              if (trackUsage) {
                await this.updateKeyUsage(keyId);
              }
              
              logger.info('Production API key validated', {
                keyId,
                userId: decryptedData.userId,
                permissions: decryptedData.permissions.length
              });
              
              return {
                valid: true,
                keyData: {
                  id: keyId,
                  userId: decryptedData.userId,
                  permissions: decryptedData.permissions,
                  environment: 'production'
                }
              };
            }
          } catch (error) {
            // Continue to next key if this one fails to decrypt/verify
            continue;
          }
        }
      }
      
      return { valid: false, reason: 'not_found' };
      
    } catch (error) {
      logger.error('API key validation error', {
        error: error.message,
        keyPrefix: apiKey.substring(0, 8)
      });
      
      return { valid: false, reason: 'validation_error' };
    }
  }

  /**
   * Update API key usage tracking
   */
  async updateKeyUsage(keyId) {
    try {
      const keyData = this.keyStore.get(keyId);
      if (keyData) {
        keyData.lastUsed = new Date().toISOString();
        keyData.usageCount = (keyData.usageCount || 0) + 1;
        
        this.keyStore.set(keyId, keyData);
        this.updateUsageStats(keyId, keyData.environment);
      }
    } catch (error) {
      logger.error('Failed to update key usage', {
        keyId,
        error: error.message
      });
    }
  }

  /**
   * Update usage statistics
   */
  updateUsageStats(keyIdentifier, environment) {
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `${keyIdentifier}:${today}`;
    
    const currentStats = this.usageStore.get(statsKey) || {
      date: today,
      keyIdentifier,
      environment,
      requestCount: 0,
      firstRequest: new Date().toISOString(),
      lastRequest: null
    };
    
    currentStats.requestCount++;
    currentStats.lastRequest = new Date().toISOString();
    
    this.usageStore.set(statsKey, currentStats);
  }

  /**
   * List API keys for a user
   */
  async listUserAPIKeys(userId) {
    const userKeys = [];
    
    for (const [keyId, keyData] of this.keyStore.entries()) {
      if (keyData.userId === userId) {
        // Decrypt if needed
        const decryptedData = keyData.encrypted ? 
          encryptionUtils.decryptFields(keyData, ['permissions']) : 
          keyData;
        
        userKeys.push({
          id: keyData.id || keyId,
          name: decryptedData.name,
          status: decryptedData.status,
          permissions: decryptedData.permissions,
          createdAt: decryptedData.createdAt,
          expiresAt: decryptedData.expiresAt,
          lastUsed: decryptedData.lastUsed,
          usageCount: decryptedData.usageCount || 0,
          environment: decryptedData.environment
        });
      }
    }
    
    return userKeys;
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(keyId, revokedBy) {
    try {
      const keyData = this.keyStore.get(keyId);
      
      if (!keyData) {
        return { success: false, reason: 'not_found' };
      }
      
      // Update status to revoked
      keyData.status = 'revoked';
      keyData.revokedAt = new Date().toISOString();
      keyData.revokedBy = revokedBy;
      
      this.keyStore.set(keyId, keyData);
      
      logger.info('API key revoked', {
        keyId,
        revokedBy,
        environment: keyData.environment
      });
      
      return { success: true };
      
    } catch (error) {
      logger.error('API key revocation failed', {
        keyId,
        revokedBy,
        error: error.message
      });
      
      return { success: false, reason: 'revocation_error' };
    }
  }

  /**
   * Get API key usage statistics
   */
  getUsageStatistics(keyId = null, days = 30) {
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const stats = [];
    
    for (const [statsKey, data] of this.usageStore.entries()) {
      const statsDate = new Date(data.date);
      
      if (statsDate >= cutoffDate && 
          (!keyId || data.keyIdentifier === keyId)) {
        stats.push(data);
      }
    }
    
    return {
      totalEntries: stats.length,
      totalRequests: stats.reduce((sum, stat) => sum + stat.requestCount, 0),
      dateRange: {
        from: cutoffDate.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      },
      statistics: stats.sort((a, b) => a.date.localeCompare(b.date))
    };
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys() {
    let cleanedCount = 0;
    const now = new Date();
    
    for (const [keyId, keyData] of this.keyStore.entries()) {
      if (keyData.expiresAt && new Date(keyData.expiresAt) < now) {
        if (keyData.status === 'active') {
          keyData.status = 'expired';
          keyData.expiredAt = now.toISOString();
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      logger.info('Expired API keys cleaned up', { count: cleanedCount });
    }
    
    return cleanedCount;
  }

  /**
   * Get API key management status
   */
  getStatus() {
    const activeKeys = Array.from(this.keyStore.values())
      .filter(key => key.status === 'active');
    
    const expiredKeys = Array.from(this.keyStore.values())
      .filter(key => key.status === 'expired');
    
    const revokedKeys = Array.from(this.keyStore.values())
      .filter(key => key.status === 'revoked');
    
    return {
      enabled: this.config.enabled,
      developmentMode: this.isDevelopment,
      totalKeys: this.keyStore.size,
      activeKeys: activeKeys.length,
      expiredKeys: expiredKeys.length,
      revokedKeys: revokedKeys.length,
      developmentKeys: this.isDevelopment ? this.config.development.mockKeys.length : 0,
      usageEntries: this.usageStore.size,
      configuration: {
        maxKeysPerUser: this.config.production.maxKeysPerUser,
        defaultExpirationDays: this.config.production.expirationDays,
        rateLimitingEnabled: this.config.rateLimiting.enabled
      }
    };
  }
}

// Create singleton instance
export const apiKeyManager = new APIKeyManager();

// Export convenience functions
export const {
  generateAPIKey,
  validateAPIKey,
  listUserAPIKeys,
  revokeAPIKey,
  getUsageStatistics,
  cleanupExpiredKeys,
  getStatus
} = apiKeyManager;

// Set up periodic cleanup (every hour)
if (!isDevelopmentEnvironment()) {
  setInterval(() => {
    apiKeyManager.cleanupExpiredKeys();
  }, 60 * 60 * 1000);
}