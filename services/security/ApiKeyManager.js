/**
 * API Key Management Service
 * 
 * Manages secure storage and rotation of API keys for external services.
 * Provides encryption, validation, and audit logging for all API key operations.
 * 
 * Features:
 * - AES-256-GCM encryption for key storage
 * - Automatic key rotation with configurable intervals
 * - Audit logging for all key operations
 * - Health monitoring for API key validity
 * - Environment-specific key management
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

const prisma = new PrismaClient();

class ApiKeyManager {
  constructor() {
    this.encryptionKey = this.getEncryptionKey();
    this.algorithm = 'aes-256-gcm';
    this.keyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  }

  /**
   * Get or generate encryption key for API key storage
   */
  getEncryptionKey() {
    const envKey = process.env.API_KEY_ENCRYPTION_KEY;
    if (envKey) {
      return Buffer.from(envKey, 'hex');
    }

    // Generate a new key if not provided (development only)
    if (process.env.NODE_ENV === 'development') {
      const key = crypto.randomBytes(32);
      logWarn('Generated new API key encryption key for development', {
        keyLength: key.length,
        environment: process.env.NODE_ENV
      });
      return key;
    }

    throw new Error('API_KEY_ENCRYPTION_KEY environment variable is required in production');
  }

  /**
   * Encrypt an API key for secure storage
   */
  encryptApiKey(plainKey, keyId) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from(keyId));

      let encrypted = cipher.update(plainKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      const result = {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.algorithm
      };

      logInfo('API key encrypted successfully', {
        keyId,
        algorithm: this.algorithm,
        ivLength: iv.length
      });

      return result;
    } catch (error) {
      logError('Failed to encrypt API key', {
        keyId,
        error: error.message
      });
      throw new Error('API key encryption failed');
    }
  }

  /**
   * Decrypt an API key for use
   */
  decryptApiKey(encryptedData, keyId) {
    try {
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from(keyId));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      logInfo('API key decrypted successfully', {
        keyId,
        algorithm: encryptedData.algorithm
      });

      return decrypted;
    } catch (error) {
      logError('Failed to decrypt API key', {
        keyId,
        error: error.message
      });
      throw new Error('API key decryption failed');
    }
  }

  /**
   * Store API key securely in database
   */
  async storeApiKey(service, keyName, keyValue, metadata = {}) {
    try {
      const keyId = `${service}_${keyName}_${Date.now()}`;
      const encryptedData = this.encryptApiKey(keyValue, keyId);

      const apiKey = await prisma.apiKey.create({
        data: {
          keyId,
          service,
          keyName,
          encryptedKey: JSON.stringify(encryptedData),
          isActive: true,
          expiresAt: metadata.expiresAt || new Date(Date.now() + this.keyRotationInterval),
          metadata: JSON.stringify(metadata),
          createdAt: new Date(),
          lastUsed: null
        }
      });

      await this.logKeyOperation('STORE', service, keyName, {
        keyId,
        expiresAt: apiKey.expiresAt,
        metadata
      });

      logInfo('API key stored successfully', {
        service,
        keyName,
        keyId,
        expiresAt: apiKey.expiresAt
      });

      return keyId;
    } catch (error) {
      logError('Failed to store API key', {
        service,
        keyName,
        error: error.message
      });
      throw new Error('API key storage failed');
    }
  }

  /**
   * Retrieve and decrypt API key
   */
  async getApiKey(service, keyName) {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          service,
          keyName,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!apiKey) {
        logWarn('API key not found or expired', {
          service,
          keyName
        });
        return null;
      }

      const encryptedData = JSON.parse(apiKey.encryptedKey);
      const decryptedKey = this.decryptApiKey(encryptedData, apiKey.keyId);

      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsed: new Date() }
      });

      await this.logKeyOperation('ACCESS', service, keyName, {
        keyId: apiKey.keyId,
        lastUsed: new Date()
      });

      logInfo('API key retrieved successfully', {
        service,
        keyName,
        keyId: apiKey.keyId,
        lastUsed: apiKey.lastUsed
      });

      return decryptedKey;
    } catch (error) {
      logError('Failed to retrieve API key', {
        service,
        keyName,
        error: error.message
      });
      throw new Error('API key retrieval failed');
    }
  }

  /**
   * Rotate API key (deactivate old, store new)
   */
  async rotateApiKey(service, keyName, newKeyValue, metadata = {}) {
    try {
      // Deactivate current key
      await prisma.apiKey.updateMany({
        where: {
          service,
          keyName,
          isActive: true
        },
        data: {
          isActive: false,
          deactivatedAt: new Date()
        }
      });

      // Store new key
      const newKeyId = await this.storeApiKey(service, keyName, newKeyValue, {
        ...metadata,
        rotated: true,
        rotatedAt: new Date()
      });

      await this.logKeyOperation('ROTATE', service, keyName, {
        newKeyId,
        rotatedAt: new Date(),
        metadata
      });

      logInfo('API key rotated successfully', {
        service,
        keyName,
        newKeyId
      });

      return newKeyId;
    } catch (error) {
      logError('Failed to rotate API key', {
        service,
        keyName,
        error: error.message
      });
      throw new Error('API key rotation failed');
    }
  }

  /**
   * Validate API key health across all services
   */
  async validateApiKeyHealth() {
    try {
      const activeKeys = await prisma.apiKey.findMany({
        where: {
          isActive: true
        },
        select: {
          service: true,
          keyName: true,
          keyId: true,
          expiresAt: true,
          lastUsed: true
        }
      });

      const healthReport = {
        timestamp: new Date().toISOString(),
        totalKeys: activeKeys.length,
        services: {},
        warnings: [],
        errors: []
      };

      for (const key of activeKeys) {
        if (!healthReport.services[key.service]) {
          healthReport.services[key.service] = {
            totalKeys: 0,
            expiringSoon: 0,
            unused: 0
          };
        }

        healthReport.services[key.service].totalKeys++;

        // Check for keys expiring within 7 days
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (key.expiresAt < sevenDaysFromNow) {
          healthReport.services[key.service].expiringSoon++;
          healthReport.warnings.push({
            type: 'EXPIRING_SOON',
            service: key.service,
            keyName: key.keyName,
            expiresAt: key.expiresAt
          });
        }

        // Check for unused keys (not used in 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (!key.lastUsed || key.lastUsed < thirtyDaysAgo) {
          healthReport.services[key.service].unused++;
          healthReport.warnings.push({
            type: 'UNUSED_KEY',
            service: key.service,
            keyName: key.keyName,
            lastUsed: key.lastUsed
          });
        }
      }

      logInfo('API key health validation completed', {
        totalKeys: healthReport.totalKeys,
        servicesCount: Object.keys(healthReport.services).length,
        warningsCount: healthReport.warnings.length
      });

      return healthReport;
    } catch (error) {
      logError('Failed to validate API key health', {
        error: error.message
      });
      throw new Error('API key health validation failed');
    }
  }

  /**
   * Log API key operations for audit trail
   */
  async logKeyOperation(operation, service, keyName, details = {}) {
    try {
      await prisma.auditLog.create({
        data: {
          operation: `API_KEY_${operation}`,
          service,
          details: JSON.stringify({
            keyName,
            ...details,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
          }),
          timestamp: new Date(),
          userId: details.userId || 'system',
          ipAddress: details.ipAddress || null
        }
      });

      logInfo('API key operation logged', {
        operation,
        service,
        keyName
      });
    } catch (error) {
      logError('Failed to log API key operation', {
        operation,
        service,
        keyName,
        error: error.message
      });
      // Don't throw here - logging failure shouldn't break key operations
    }
  }

  /**
   * Cleanup expired and deactivated keys
   */
  async cleanupExpiredKeys() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deletedCount = await prisma.apiKey.deleteMany({
        where: {
          OR: [
            {
              isActive: false,
              deactivatedAt: {
                lt: thirtyDaysAgo
              }
            },
            {
              expiresAt: {
                lt: thirtyDaysAgo
              }
            }
          ]
        }
      });

      logInfo('Expired API keys cleaned up', {
        deletedCount: deletedCount.count,
        cutoffDate: thirtyDaysAgo
      });

      return deletedCount.count;
    } catch (error) {
      logError('Failed to cleanup expired API keys', {
        error: error.message
      });
      throw new Error('API key cleanup failed');
    }
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStatistics(timeframe = '30d') {
    try {
      const timeframeDays = parseInt(timeframe.replace('d', ''));
      const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          operation: {
            startsWith: 'API_KEY_'
          },
          timestamp: {
            gte: startDate
          }
        },
        select: {
          operation: true,
          service: true,
          timestamp: true
        }
      });

      const statistics = {
        timeframe,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        operationCounts: {},
        serviceCounts: {},
        dailyActivity: {}
      };

      auditLogs.forEach(log => {
        // Count operations
        statistics.operationCounts[log.operation] = 
          (statistics.operationCounts[log.operation] || 0) + 1;

        // Count by service
        statistics.serviceCounts[log.service] = 
          (statistics.serviceCounts[log.service] || 0) + 1;

        // Daily activity
        const day = log.timestamp.toISOString().split('T')[0];
        statistics.dailyActivity[day] = 
          (statistics.dailyActivity[day] || 0) + 1;
      });

      logInfo('API key usage statistics generated', {
        timeframe,
        totalOperations: auditLogs.length,
        services: Object.keys(statistics.serviceCounts).length
      });

      return statistics;
    } catch (error) {
      logError('Failed to get API key usage statistics', {
        timeframe,
        error: error.message
      });
      throw new Error('Usage statistics generation failed');
    }
  }
}

// Singleton instance
let apiKeyManager = null;

/**
 * Get or create API key manager instance
 */
export function getApiKeyManager() {
  if (!apiKeyManager) {
    apiKeyManager = new ApiKeyManager();
  }
  return apiKeyManager;
}

export default ApiKeyManager;