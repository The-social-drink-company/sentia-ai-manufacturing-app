/**
 * Data Encryption Utilities
 * 
 * Environment-aware encryption utilities with development bypass
 * for the Sentia Manufacturing MCP Server.
 * 
 * CRITICAL: Development environment can bypass encryption for faster debugging
 * while maintaining full encryption in production.
 */

import crypto from 'crypto';
import { createLogger } from './logger.js';
import { 
  isDevelopmentEnvironment, 
  CURRENT_AUTH_CONFIG 
} from '../config/auth-config.js';

const logger = createLogger();

/**
 * Encryption utility class with environment-aware behavior
 */
export class EncryptionUtils {
  constructor() {
    this.isDevelopment = isDevelopmentEnvironment();
    this.config = CURRENT_AUTH_CONFIG.encryption;
    this.algorithm = this.config.algorithm;
    this.encryptionKey = this.getEncryptionKey();
  }

  /**
   * Get or generate encryption key
   */
  getEncryptionKey() {
    // In development, use a fixed key for consistency
    if (this.isDevelopment) {
      const devKey = 'dev-encryption-key-32-chars-long';
      logger.debug('Using development encryption key');
      return crypto.createHash('sha256').update(devKey).digest();
    }
    
    // Production: Use environment variable or generate
    const envKey = process.env.ENCRYPTION_KEY;
    if (envKey) {
      return crypto.createHash('sha256').update(envKey).digest();
    }
    
    // Generate and warn about missing key
    logger.warn('No ENCRYPTION_KEY found, generating temporary key');
    return crypto.randomBytes(32);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data, options = {}) {
    // Skip encryption in development if bypass is enabled
    if (this.isDevelopment && this.config.developmentBypass && !options.forceEncryption) {
      logger.debug('Development mode: Encryption bypassed');
      return {
        encrypted: false,
        data: data,
        algorithm: 'none',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate random IV for each encryption (16 bytes for CBC)
      const iv = crypto.randomBytes(16);
      
      // Create cipher using correct Node.js API
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      // Encrypt data
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // CBC doesn't use auth tags
      const authTag = null;
      
      const result = {
        encrypted: true,
        data: encrypted,
        iv: iv.toString('hex'),
        authTag: null, // CBC doesn't use auth tags
        algorithm: 'aes-256-cbc',
        timestamp: new Date().toISOString()
      };
      
      logger.debug('Data encrypted successfully', {
        algorithm: this.algorithm,
        dataLength: dataString.length,
        encryptedLength: encrypted.length
      });
      
      return result;
      
    } catch (error) {
      logger.error('Encryption failed', {
        error: error.message,
        algorithm: this.algorithm
      });
      
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData, options = {}) {
    // Handle non-encrypted data (development bypass)
    if (!encryptedData.encrypted) {
      logger.debug('Development mode: Decrypting non-encrypted data');
      return encryptedData.data;
    }
    
    try {
      const { data, iv, authTag, algorithm } = encryptedData;
      
      if (!data || !iv) {
        throw new Error('Invalid encrypted data format');
      }
      
      // Create decipher using correct Node.js API
      const ivBuffer = Buffer.from(iv, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, ivBuffer);
      
      // CBC doesn't use auth tags, skip auth tag handling
      
      // Decrypt data
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      logger.debug('Data decrypted successfully', {
        algorithm: algorithm || this.algorithm,
        dataLength: decrypted.length
      });
      
      // Try to parse as JSON, return as string if it fails
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
      
    } catch (error) {
      logger.error('Decryption failed', {
        error: error.message,
        algorithm: encryptedData.algorithm || this.algorithm
      });
      
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt specific fields in an object
   */
  encryptFields(obj, fieldsToEncrypt = []) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    // Use configured fields if none specified
    const fields = fieldsToEncrypt.length > 0 ? 
      fieldsToEncrypt : 
      this.config.encryptedFields;
    
    const result = { ...obj };
    
    for (const field of fields) {
      if (result[field] !== undefined) {
        try {
          result[field] = this.encrypt(result[field]);
          
          logger.debug('Field encrypted', { 
            field: field,
            encrypted: result[field].encrypted 
          });
          
        } catch (error) {
          logger.error('Field encryption failed', {
            field: field,
            error: error.message
          });
          
          // Don't fail the entire operation for one field
          result[field] = {
            encrypted: false,
            data: result[field],
            error: 'Encryption failed'
          };
        }
      }
    }
    
    return result;
  }

  /**
   * Decrypt specific fields in an object
   */
  decryptFields(obj, fieldsToDecrypt = []) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    // Use configured fields if none specified
    const fields = fieldsToDecrypt.length > 0 ? 
      fieldsToDecrypt : 
      this.config.encryptedFields;
    
    const result = { ...obj };
    
    for (const field of fields) {
      if (result[field] !== undefined && 
          typeof result[field] === 'object' && 
          result[field].encrypted !== undefined) {
        
        try {
          result[field] = this.decrypt(result[field]);
          
          logger.debug('Field decrypted', { field: field });
          
        } catch (error) {
          logger.error('Field decryption failed', {
            field: field,
            error: error.message
          });
          
          // Return the encrypted data if decryption fails
          result[field] = result[field].data || result[field];
        }
      }
    }
    
    return result;
  }

  /**
   * Generate encryption key from password (key derivation)
   */
  deriveKey(password, salt = null) {
    const actualSalt = salt || crypto.randomBytes(this.config.keyDerivation.saltLength);
    const iterations = this.config.keyDerivation.iterations;
    const algorithm = this.config.keyDerivation.algorithm;
    
    let derivedKey;
    
    if (algorithm === 'pbkdf2') {
      derivedKey = crypto.pbkdf2Sync(password, actualSalt, iterations, 32, 'sha256');
    } else {
      // Fallback to scrypt
      derivedKey = crypto.scryptSync(password, actualSalt, 32);
    }
    
    return {
      key: derivedKey,
      salt: actualSalt,
      iterations,
      algorithm
    };
  }

  /**
   * Encrypt with derived key
   */
  encryptWithPassword(data, password) {
    // Skip in development with bypass
    if (this.isDevelopment && this.config.developmentBypass) {
      logger.debug('Development mode: Password encryption bypassed');
      return {
        encrypted: false,
        data: data,
        passwordProtected: false
      };
    }
    
    const { key, salt, iterations, algorithm } = this.deriveKey(password);
    
    // Temporarily set the derived key
    const originalKey = this.encryptionKey;
    this.encryptionKey = key;
    
    try {
      const encryptedData = this.encrypt(data, { forceEncryption: true });
      
      return {
        ...encryptedData,
        passwordProtected: true,
        salt: salt.toString('hex'),
        keyDerivation: {
          iterations,
          algorithm
        }
      };
      
    } finally {
      // Restore original key
      this.encryptionKey = originalKey;
    }
  }

  /**
   * Decrypt with password
   */
  decryptWithPassword(encryptedData, password) {
    // Handle development bypass
    if (!encryptedData.passwordProtected) {
      logger.debug('Development mode: Password decryption bypassed');
      return encryptedData.data;
    }
    
    const { salt, keyDerivation } = encryptedData;
    const saltBuffer = Buffer.from(salt, 'hex');
    
    // Derive the same key
    const { key } = this.deriveKey(password, saltBuffer);
    
    // Temporarily set the derived key
    const originalKey = this.encryptionKey;
    this.encryptionKey = key;
    
    try {
      return this.decrypt(encryptedData);
    } finally {
      // Restore original key
      this.encryptionKey = originalKey;
    }
  }

  /**
   * Hash data for integrity checking
   */
  hash(data, algorithm = 'sha256') {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    return crypto.createHash(algorithm)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Verify data integrity
   */
  verifyHash(data, expectedHash, algorithm = 'sha256') {
    const actualHash = this.hash(data, algorithm);
    
    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(actualHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  }

  /**
   * Encrypt for storage (includes integrity check)
   */
  encryptForStorage(data, options = {}) {
    const encrypted = this.encrypt(data, options);
    
    // Add integrity hash
    encrypted.hash = this.hash(encrypted.data);
    encrypted.storageVersion = '1.0';
    
    return encrypted;
  }

  /**
   * Decrypt from storage (verifies integrity)
   */
  decryptFromStorage(encryptedData, options = {}) {
    // Verify integrity first
    if (encryptedData.hash && encryptedData.encrypted) {
      const isValid = this.verifyHash(encryptedData.data, encryptedData.hash);
      
      if (!isValid) {
        logger.error('Data integrity check failed during decryption');
        throw new Error('Data integrity verification failed');
      }
    }
    
    return this.decrypt(encryptedData, options);
  }

  /**
   * Get encryption status and configuration
   */
  getEncryptionStatus() {
    return {
      enabled: this.config.enabled,
      developmentBypass: this.isDevelopment && this.config.developmentBypass,
      algorithm: this.algorithm,
      encryptedFields: this.config.encryptedFields,
      keyDerivation: this.config.keyDerivation,
      environment: this.isDevelopment ? 'development' : 'production'
    };
  }

  /**
   * Rotate encryption key (production only)
   */
  rotateEncryptionKey(newKey) {
    if (this.isDevelopment) {
      logger.debug('Development mode: Key rotation skipped');
      return { rotated: false, reason: 'development_bypass' };
    }
    
    const oldKey = this.encryptionKey;
    
    // Set new key
    this.encryptionKey = crypto.createHash('sha256').update(newKey).digest();
    
    logger.info('Encryption key rotated', {
      oldKeyHash: crypto.createHash('sha256').update(oldKey).digest('hex').substring(0, 8),
      newKeyHash: crypto.createHash('sha256').update(this.encryptionKey).digest('hex').substring(0, 8)
    });
    
    return { 
      rotated: true, 
      timestamp: new Date().toISOString(),
      oldKeyHash: crypto.createHash('sha256').update(oldKey).digest('hex').substring(0, 8)
    };
  }
}

// Create singleton instance
export const encryptionUtils = new EncryptionUtils();

// Export convenience functions
export const {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  encryptWithPassword,
  decryptWithPassword,
  hash,
  verifyHash,
  encryptForStorage,
  decryptFromStorage,
  getEncryptionStatus,
  rotateEncryptionKey
} = encryptionUtils;