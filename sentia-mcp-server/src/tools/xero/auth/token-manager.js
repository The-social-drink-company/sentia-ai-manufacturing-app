/**
 * Xero Token Manager
 * 
 * Secure storage and management of Xero OAuth tokens with encryption,
 * expiration tracking, and multi-tenant support.
 * 
 * @version 1.0.0
 */

import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Xero Token Manager Class
 */
export class XeroTokenManager {
  constructor(options = {}) {
    this.encryptionKey = options.encryptionKey || process.env.XERO_ENCRYPTION_KEY || this.generateEncryptionKey();
    this.algorithm = 'aes-256-gcm';
    
    // In-memory storage for development (replace with database in production)
    this.tokenStorage = new Map();
    
    // Token expiration buffer (refresh tokens 5 minutes before expiry)
    this.expirationBuffer = options.expirationBuffer || 5 * 60 * 1000; // 5 minutes

    logger.info('Xero Token Manager initialized', {
      hasEncryptionKey: !!this.encryptionKey,
      expirationBuffer: this.expirationBuffer
    });
  }

  /**
   * Generate encryption key if none provided
   */
  generateEncryptionKey() {
    const key = crypto.randomBytes(32).toString('hex');
    logger.warn('Generated temporary encryption key - use XERO_ENCRYPTION_KEY env var in production');
    return key;
  }

  /**
   * Encrypt sensitive token data
   */
  encrypt(text) {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      logger.error('Token encryption failed', { error: error.message });
      throw new Error('Token encryption failed');
    }
  }

  /**
   * Decrypt sensitive token data
   */
  decrypt(encryptedText) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      logger.error('Token decryption failed', { error: error.message });
      throw new Error('Token decryption failed');
    }
  }

  /**
   * Generate storage key for tenant tokens
   */
  generateStorageKey(tenantId = 'default') {
    return `xero_tokens_${tenantId}`;
  }

  /**
   * Store encrypted tokens for a tenant
   */
  async storeTokens(tokenData, tenantId = 'default') {
    try {
      const storageKey = this.generateStorageKey(tenantId);
      
      // Prepare token data with metadata
      const tokenRecord = {
        ...tokenData,
        tenantId,
        storedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };

      // Encrypt sensitive fields
      const encryptedRecord = {
        ...tokenRecord,
        access_token: this.encrypt(tokenRecord.access_token),
        refresh_token: tokenRecord.refresh_token ? this.encrypt(tokenRecord.refresh_token) : null
      };

      // Store in memory (replace with database in production)
      this.tokenStorage.set(storageKey, encryptedRecord);

      logger.info('Tokens stored successfully', {
        tenantId,
        expiresAt: tokenRecord.expires_at,
        hasRefreshToken: !!tokenRecord.refresh_token
      });

      return {
        success: true,
        tenantId,
        expiresAt: tokenRecord.expires_at
      };

    } catch (error) {
      logger.error('Token storage failed', {
        error: error.message,
        tenantId
      });
      throw new Error(`Token storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve and decrypt tokens for a tenant
   */
  async getTokens(tenantId = 'default') {
    try {
      const storageKey = this.generateStorageKey(tenantId);
      const encryptedRecord = this.tokenStorage.get(storageKey);

      if (!encryptedRecord) {
        logger.debug('No tokens found for tenant', { tenantId });
        return null;
      }

      // Decrypt sensitive fields
      const decryptedRecord = {
        ...encryptedRecord,
        access_token: this.decrypt(encryptedRecord.access_token),
        refresh_token: encryptedRecord.refresh_token ? this.decrypt(encryptedRecord.refresh_token) : null
      };

      // Update last accessed time
      encryptedRecord.lastAccessed = new Date().toISOString();
      this.tokenStorage.set(storageKey, encryptedRecord);

      logger.debug('Tokens retrieved successfully', {
        tenantId,
        expiresAt: decryptedRecord.expires_at
      });

      return decryptedRecord;

    } catch (error) {
      logger.error('Token retrieval failed', {
        error: error.message,
        tenantId
      });
      throw new Error(`Token retrieval failed: ${error.message}`);
    }
  }

  /**
   * Check if tokens need to be refreshed
   */
  needsRefresh(tokenData) {
    if (!tokenData || !tokenData.expires_at) {
      return true;
    }

    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    // Return true if token expires within the buffer time
    return timeUntilExpiry <= this.expirationBuffer;
  }

  /**
   * Check if tokens are expired
   */
  isExpired(tokenData) {
    if (!tokenData || !tokenData.expires_at) {
      return true;
    }

    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    return now >= expiresAt;
  }

  /**
   * Get time until token expiration
   */
  getTimeUntilExpiry(tokenData) {
    if (!tokenData || !tokenData.expires_at) {
      return 0;
    }

    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    return Math.max(0, timeUntilExpiry);
  }

  /**
   * Remove tokens for a tenant
   */
  async removeTokens(tenantId = 'default') {
    try {
      const storageKey = this.generateStorageKey(tenantId);
      const existed = this.tokenStorage.has(storageKey);
      
      this.tokenStorage.delete(storageKey);

      logger.info('Tokens removed', {
        tenantId,
        existed
      });

      return {
        success: true,
        tenantId,
        existed
      };

    } catch (error) {
      logger.error('Token removal failed', {
        error: error.message,
        tenantId
      });
      throw new Error(`Token removal failed: ${error.message}`);
    }
  }

  /**
   * Get all stored tenant IDs
   */
  async getAllTenants() {
    try {
      const tenants = [];
      
      for (const [storageKey, tokenData] of this.tokenStorage.entries()) {
        if (storageKey.startsWith('xero_tokens_')) {
          const tenantId = tokenData.tenantId;
          const isExpired = this.isExpired(tokenData);
          const needsRefresh = this.needsRefresh(tokenData);
          
          tenants.push({
            tenantId,
            storedAt: tokenData.storedAt,
            lastAccessed: tokenData.lastAccessed,
            expiresAt: tokenData.expires_at,
            isExpired,
            needsRefresh,
            hasRefreshToken: !!tokenData.refresh_token
          });
        }
      }

      logger.debug('Retrieved all tenant tokens', {
        tenantsCount: tenants.length
      });

      return tenants;

    } catch (error) {
      logger.error('Failed to get all tenants', {
        error: error.message
      });
      throw new Error(`Failed to get all tenants: ${error.message}`);
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    try {
      let removedCount = 0;
      const now = new Date();

      for (const [storageKey, tokenData] of this.tokenStorage.entries()) {
        if (storageKey.startsWith('xero_tokens_')) {
          // Remove tokens that expired more than 24 hours ago and have no refresh token
          if (tokenData.expires_at) {
            const expiresAt = new Date(tokenData.expires_at);
            const hoursExpired = (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60);
            
            if (hoursExpired > 24 && !tokenData.refresh_token) {
              this.tokenStorage.delete(storageKey);
              removedCount++;
              
              logger.info('Removed expired token', {
                tenantId: tokenData.tenantId,
                expiredHours: Math.round(hoursExpired)
              });
            }
          }
        }
      }

      logger.info('Token cleanup completed', {
        removedCount,
        remainingCount: this.tokenStorage.size
      });

      return {
        success: true,
        removedCount,
        remainingCount: this.tokenStorage.size
      };

    } catch (error) {
      logger.error('Token cleanup failed', {
        error: error.message
      });
      throw new Error(`Token cleanup failed: ${error.message}`);
    }
  }

  /**
   * Clear all stored tokens (use with caution)
   */
  async clearAllTokens() {
    try {
      const initialCount = this.tokenStorage.size;
      
      // Remove only Xero token entries
      for (const storageKey of this.tokenStorage.keys()) {
        if (storageKey.startsWith('xero_tokens_')) {
          this.tokenStorage.delete(storageKey);
        }
      }

      logger.warn('All Xero tokens cleared', {
        clearedCount: initialCount - this.tokenStorage.size
      });

      return {
        success: true,
        clearedCount: initialCount - this.tokenStorage.size
      };

    } catch (error) {
      logger.error('Failed to clear all tokens', {
        error: error.message
      });
      throw new Error(`Failed to clear all tokens: ${error.message}`);
    }
  }

  /**
   * Get token manager statistics
   */
  getStats() {
    const stats = {
      totalTenants: 0,
      expiredTokens: 0,
      needsRefresh: 0,
      validTokens: 0
    };

    for (const [storageKey, tokenData] of this.tokenStorage.entries()) {
      if (storageKey.startsWith('xero_tokens_')) {
        stats.totalTenants++;
        
        if (this.isExpired(tokenData)) {
          stats.expiredTokens++;
        } else if (this.needsRefresh(tokenData)) {
          stats.needsRefresh++;
        } else {
          stats.validTokens++;
        }
      }
    }

    return stats;
  }
}