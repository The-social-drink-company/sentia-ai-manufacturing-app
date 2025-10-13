/**
 * Core Security Utilities
 * 
 * Comprehensive security utilities with environment-aware implementation
 * for the Sentia Manufacturing MCP Server.
 * 
 * CRITICAL: Development environment bypasses most security checks
 * for faster development workflow.
 */

import crypto from 'crypto';
import { createLogger } from './logger.js';
import { 
  isDevelopmentEnvironment, 
  CURRENT_AUTH_CONFIG 
} from '../config/auth-config.js';

const logger = createLogger();

/**
 * Security utility class with environment-aware behavior
 */
export class SecurityUtils {
  constructor() {
    this.isDevelopment = isDevelopmentEnvironment();
    this.config = CURRENT_AUTH_CONFIG;
  }

  /**
   * Generate secure random tokens
   */
  generateSecureToken(length = 32) {
    // In development, use predictable tokens for easier debugging
    if (this.isDevelopment) {
      const devToken = `dev-token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      logger.debug('Development token generated', { 
        length: devToken.length,
        token: devToken.substring(0, 12) + '...'
      });
      return devToken;
    }
    
    // Production: Use cryptographically secure random bytes
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure API keys
   */
  generateAPIKey() {
    if (this.isDevelopment) {
      const devKey = `dev-api-key-${Date.now()}`;
      logger.debug('Development API key generated', { key: devKey });
      return devKey;
    }
    
    // Production: Generate secure API key
    const keyLength = this.config.apiKeys.production.keyLength;
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(keyLength).toString('base64url');
    
    return `mcp_${timestamp}_${randomPart}`;
  }

  /**
   * Hash passwords or sensitive data
   */
  async hashPassword(password, saltRounds = 12) {
    // In development, use simple hashing for faster execution
    if (this.isDevelopment) {
      const simpleHash = crypto.createHash('sha256').update(password).digest('hex');
      logger.debug('Development password hashed with SHA256');
      return simpleHash;
    }
    
    // Production: Use PBKDF2 with strong parameters
    return this.hashWithPBKDF2(password);
  }

  /**
   * Verify password hashes
   */
  async verifyPassword(password, hash) {
    if (this.isDevelopment) {
      const simpleHash = crypto.createHash('sha256').update(password).digest('hex');
      return simpleHash === hash;
    }
    
    // Production: Use PBKDF2 verification
    return this.verifyPBKDF2Hash(password, hash);
  }

  /**
   * PBKDF2 hashing fallback
   */
  hashWithPBKDF2(password, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16);
    const iterations = this.config.encryption.keyDerivation.iterations;
    
    const hash = crypto.pbkdf2Sync(password, actualSalt, iterations, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: actualSalt.toString('hex'),
      iterations
    };
  }

  /**
   * Verify PBKDF2 hash
   */
  verifyPBKDF2Hash(password, storedHash) {
    try {
      const { hash, salt, iterations } = JSON.parse(storedHash);
      const saltBuffer = Buffer.from(salt, 'hex');
      const hashToVerify = crypto.pbkdf2Sync(password, saltBuffer, iterations, 64, 'sha512');
      
      return hashToVerify.toString('hex') === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate HMAC signatures for API requests
   */
  generateHMAC(data, secret) {
    if (this.isDevelopment) {
      // Simple signature for development
      const devSignature = crypto.createHash('sha256')
        .update(data + secret)
        .digest('hex');
      
      logger.debug('Development HMAC signature generated');
      return devSignature;
    }
    
    // Production HMAC
    return crypto.createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify HMAC signatures
   */
  verifyHMAC(data, signature, secret) {
    const expectedSignature = this.generateHMAC(data, secret);
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Sanitize input data to prevent injection attacks
   */
  sanitizeInput(input, options = {}) {
    if (this.isDevelopment && !options.forceValidation) {
      // Minimal sanitization in development for easier debugging
      logger.debug('Development mode: Minimal input sanitization applied');
      return input.toString().trim();
    }
    
    if (typeof input !== 'string') {
      input = String(input);
    }
    
    // Remove potentially dangerous characters
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\0/g, '') // Remove null bytes
      .trim();
    
    // Additional SQL injection prevention
    if (options.preventSQL) {
      sanitized = sanitized
        .replace(/['";\\]/g, '')
        .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/gi, '');
    }
    
    return sanitized;
  }

  /**
   * Validate input against common patterns
   */
  validateInput(input, type, options = {}) {
    if (this.isDevelopment && !options.forceValidation) {
      logger.debug('Development mode: Input validation bypassed');
      return { valid: true, sanitized: input };
    }
    
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      alphanumeric: /^[a-zA-Z0-9]+$/,
      numeric: /^\d+$/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      apiKey: /^[a-zA-Z0-9_-]+$/,
      filename: /^[a-zA-Z0-9._-]+$/
    };
    
    const pattern = patterns[type];
    if (!pattern) {
      logger.warn('Unknown validation type', { type });
      return { valid: false, error: 'Unknown validation type' };
    }
    
    const sanitized = this.sanitizeInput(input, options);
    const valid = pattern.test(sanitized);
    
    return {
      valid,
      sanitized,
      error: valid ? null : `Invalid ${type} format`
    };
  }

  /**
   * Rate limiting utilities
   */
  createRateLimiter(windowMs, maxRequests) {
    const requests = new Map();
    
    return {
      isAllowed: (key) => {
        // Always allow in development
        if (this.isDevelopment) {
          return { allowed: true, remaining: Infinity };
        }
        
        const now = Date.now();
        const requestData = requests.get(key) || { count: 0, resetTime: now + windowMs };
        
        // Reset if window has passed
        if (now > requestData.resetTime) {
          requestData.count = 0;
          requestData.resetTime = now + windowMs;
        }
        
        requestData.count++;
        requests.set(key, requestData);
        
        const allowed = requestData.count <= maxRequests;
        const remaining = Math.max(0, maxRequests - requestData.count);
        
        return {
          allowed,
          remaining,
          resetTime: requestData.resetTime,
          retryAfter: allowed ? 0 : Math.ceil((requestData.resetTime - now) / 1000)
        };
      },
      
      reset: (key) => {
        requests.delete(key);
      },
      
      getStats: () => ({
        activeKeys: requests.size,
        totalRequests: Array.from(requests.values()).reduce((sum, data) => sum + data.count, 0)
      })
    };
  }

  /**
   * Generate secure session IDs
   */
  generateSessionId() {
    if (this.isDevelopment) {
      return `dev-session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    }
    
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Validate API key format
   */
  isValidAPIKeyFormat(apiKey) {
    if (this.isDevelopment) {
      // Accept any non-empty string in development
      return apiKey && apiKey.length > 0;
    }
    
    // Production validation
    const pattern = /^mcp_[a-zA-Z0-9]+_[a-zA-Z0-9_-]+$/;
    return pattern.test(apiKey);
  }

  /**
   * Generate CSRF tokens
   */
  generateCSRFToken() {
    if (this.isDevelopment) {
      return `dev-csrf-${Date.now()}`;
    }
    
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Verify CSRF tokens
   */
  verifyCSRFToken(token, storedToken) {
    if (this.isDevelopment) {
      // Simple comparison in development
      return token === storedToken;
    }
    
    // Timing-safe comparison
    if (!token || !storedToken || token.length !== storedToken.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
  }

  /**
   * Create secure headers for HTTP responses
   */
  getSecurityHeaders() {
    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
    
    if (!this.isDevelopment) {
      // Add stricter headers in production
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
      headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'";
    }
    
    return headers;
  }

  /**
   * Log security events
   */
  logSecurityEvent(event, details = {}) {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      environment: this.isDevelopment ? 'development' : 'production',
      ...details
    };
    
    if (this.isDevelopment) {
      logger.debug('Security event (development)', logData);
    } else {
      logger.warn('Security event', logData);
    }
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data, fields = ['password', 'secret', 'key', 'token']) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const masked = { ...data };
    
    for (const field of fields) {
      if (masked[field]) {
        const value = masked[field].toString();
        masked[field] = value.length > 8 ? 
          value.substring(0, 4) + '***' + value.substring(value.length - 4) : 
          '***';
      }
    }
    
    return masked;
  }
}

// Create singleton instance
export const securityUtils = new SecurityUtils();

// Export convenience functions
export const {
  generateSecureToken,
  generateAPIKey,
  hashPassword,
  verifyPassword,
  generateHMAC,
  verifyHMAC,
  sanitizeInput,
  validateInput,
  createRateLimiter,
  generateSessionId,
  isValidAPIKeyFormat,
  generateCSRFToken,
  verifyCSRFToken,
  getSecurityHeaders,
  logSecurityEvent,
  maskSensitiveData
} = securityUtils;