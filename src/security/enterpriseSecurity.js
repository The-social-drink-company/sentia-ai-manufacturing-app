/**
 * Enterprise Security Framework for Manufacturing Dashboard
 * Implements comprehensive security measures for production environments
 */

import CryptoJS from 'crypto-js';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


// Security configuration
const SECURITY_CONFIG = {
  encryption: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    ivSize: 16
  },
  session: {
    timeout: 30 * 60 * 1000, // 30 minutes
    renewThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    maxConcurrentSessions: 3
  },
  rateLimit: {
    api: { requests: 100, window: 60000 }, // 100 requests per minute
    auth: { requests: 5, window: 300000 }, // 5 auth attempts per 5 minutes
    upload: { requests: 10, window: 60000 } // 10 uploads per minute
  },
  validation: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['csv', 'xlsx', 'json', 'pdf'],
    maxFieldLength: 1000
  }
};

// Data encryption utilities
export class DataEncryption {
  constructor() {
    this.secretKey = this.generateSecretKey();
  }

  // Generate secure secret key
  generateSecretKey() {
    const key = import.meta.env.VITE_ENCRYPTION_KEY || null;
    return CryptoJS.SHA256(key + window.location.origin).toString();
  }

  // Encrypt sensitive data
  encrypt(data) {
    try {
      const iv = CryptoJS.lib.WordArray.random(SECURITY_CONFIG.encryption.ivSize);
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.secretKey, {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        encrypted: encrypted.toString(),
        iv: iv.toString(),
        timestamp: Date.now()
      };
    } catch (error) {
      logError('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, timestamp } = encryptedData;
      
      // Check if data is too old (24 hours)
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        throw new Error('Encrypted data has expired');
      }

      const decrypted = CryptoJS.AES.decrypt(encrypted, this.secretKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7
      });

      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      logError('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  // Encrypt local storage data
  encryptLocalStorage(key, data) {
    const encrypted = this.encrypt(data);
    localStorage.setItem(key, JSON.stringify(encrypted));
  }

  // Decrypt local storage data
  decryptLocalStorage(key) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const encryptedData = JSON.parse(stored);
      return this.decrypt(encryptedData);
    } catch (error) {
      logError('Failed to decrypt local storage data:', error);
      localStorage.removeItem(key); // Remove corrupted data
      return null;
    }
  }
}

// Session security management
export class SessionSecurity {
  constructor() {
    this.sessions = new Map();
    this.activityTimer = null;
    this.warningTimer = null;
    this.setupActivityMonitoring();
  }

  // Setup user activity monitoring
  setupActivityMonitoring() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateLastActivity();
      }, { passive: true });
    });

    this.startSessionTimer();
  }

  // Update last activity timestamp
  updateLastActivity() {
    const now = Date.now();
    sessionStorage.setItem('lastActivity', now.toString());
    
    // Reset timers
    this.clearTimers();
    this.startSessionTimer();
  }

  // Start session timeout timer
  startSessionTimer() {
    const timeout = SECURITY_CONFIG.session.timeout;
    const warningTime = timeout - SECURITY_CONFIG.session.renewThreshold;

    // Warning timer
    this.warningTimer = setTimeout(() => {
      this.showSessionWarning();
    }, warningTime);

    // Timeout timer
    this.activityTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeout);
  }

  // Clear all timers
  clearTimers() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  // Show session expiry warning
  showSessionWarning() {
    const remainingTime = Math.ceil(SECURITY_CONFIG.session.renewThreshold / 60000);
    
    if (window.confirm(`Your session will expire in ${remainingTime} minutes. Do you want to extend it?`)) {
      this.renewSession();
    }
  }

  // Handle session timeout
  handleSessionTimeout() {
    this.clearSession();
    alert('Your session has expired for security reasons. Please log in again.');
    
    // Redirect to login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?reason=timeout';
    }
  }

  // Renew session
  renewSession() {
    this.updateLastActivity();
    
    // Make API call to renew session
    fetch('/api/auth/renew-session', {
      method: 'POST',
      credentials: 'include'
    }).catch(error => {
      logError('Failed to renew session:', error);
    });
  }

  // Clear session data
  clearSession() {
    sessionStorage.clear();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userPreferences');
    this.clearTimers();
  }

  // Validate session integrity
  validateSession() {
    const lastActivity = sessionStorage.getItem('lastActivity');
    if (!lastActivity) return false;

    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    return timeSinceActivity < SECURITY_CONFIG.session.timeout;
  }
}

// Rate limiting implementation
export class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  // Check if request is allowed
  isAllowed(key, type = 'api') {
    const config = SECURITY_CONFIG.rateLimit[type];
    if (!config) return true;

    const now = Date.now();
    const windowStart = now - config.window;
    
    // Get or create request history for this key
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requestHistory = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = requestHistory.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, validRequests);
    
    // Check if limit exceeded
    if (validRequests.length >= config.requests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    return true;
  }

  // Record a request
  recordRequest(key, type = 'api') {
    if (!this.isAllowed(key, type)) {
      throw new Error(`Rate limit exceeded for ${type}`);
    }
  }

  // Get remaining requests
  getRemainingRequests(key, type = 'api') {
    const config = SECURITY_CONFIG.rateLimit[type];
    if (!config) return Infinity;

    const now = Date.now();
    const windowStart = now - config.window;
    const requestHistory = this.requests.get(key) || [];
    const validRequests = requestHistory.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, config.requests - validRequests.length);
  }
}

// Input validation and sanitization
export class InputValidator {
  // Sanitize HTML input
  sanitizeHtml(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Validate file upload
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > SECURITY_CONFIG.validation.maxFileSize) {
      errors.push(`File size exceeds ${SECURITY_CONFIG.validation.maxFileSize / 1024 / 1024}MB limit`);
    }

    // Check file type
    const extension = file.name.split('.').pop().toLowerCase();
    if (!SECURITY_CONFIG.validation.allowedFileTypes.includes(extension)) {
      errors.push(`File type .${extension} is not allowed`);
    }

    // Check for suspicious file names
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('Invalid file name');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate and sanitize form data
  validateFormData(data, schema) {
    const sanitized = {};
    const errors = [];

    Object.keys(schema).forEach(field => {
      const value = data[field];
      const rules = schema[field];

      // Required field check
      if (rules.required && (!value || value.toString().trim() === '')) {
        errors.push(`${field} is required`);
        return;
      }

      if (value !== undefined && value !== null) {
        let sanitizedValue = value;

        // Type validation
        if (rules.type === 'email' && !this.isValidEmail(value)) {
          errors.push(`${field} must be a valid email`);
        }

        if (rules.type === 'number' && isNaN(value)) {
          errors.push(`${field} must be a number`);
        }

        // Length validation
        if (rules.maxLength && value.toString().length > rules.maxLength) {
          errors.push(`${field} exceeds maximum length of ${rules.maxLength}`);
        }

        if (rules.minLength && value.toString().length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }

        // Sanitization
        if (rules.sanitize !== false) {
          sanitizedValue = this.sanitizeHtml(value.toString());
        }

        // Custom validation
        if (rules.validate && typeof rules.validate === 'function') {
          const customResult = rules.validate(sanitizedValue);
          if (customResult !== true) {
            errors.push(customResult || null);
          }
        }

        sanitized[field] = sanitizedValue;
      }
    });

    return {
      isValid: errors.length === 0,
      data: sanitized,
      errors
    };
  }

  // Email validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // SQL injection prevention
  preventSqlInjection(input) {
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'EXEC'];
    const upperInput = input.toUpperCase();
    
    return !sqlKeywords.some(keyword => upperInput.includes(keyword));
  }
}

// Security audit logging
export class SecurityAudit {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
  }

  // Log security event
  logEvent(type, details, severity = 'info') {
    const event = {
      id: this.generateId(),
      type,
      details,
      severity,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: sessionStorage.getItem('sessionId')
    };

    this.logs.push(event);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Send critical events to server
    if (severity === 'critical' || severity === 'high') {
      this.sendToServer(event);
    }

    logDebug(`Security Event [${severity.toUpperCase()}]:`, event);
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + 0;
  }

  // Send event to server
  async sendToServer(event) {
    try {
      await fetch('/api/security/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event),
        credentials: 'include'
      });
    } catch (error) {
      logError('Failed to send security event to server:', error);
    }
  }

  // Get security summary
  getSummary() {
    const summary = {
      totalEvents: this.logs.length,
      severityBreakdown: {},
      recentEvents: this.logs.slice(-10),
      timeRange: {
        start: this.logs[0]?.timestamp,
        end: this.logs[this.logs.length - 1]?.timestamp
      }
    };

    // Count by severity
    this.logs.forEach(log => {
      summary.severityBreakdown[log.severity] = 
        (summary.severityBreakdown[log.severity] || 0) + 1;
    });

    return summary;
  }
}

// Initialize security instances
export const dataEncryption = new DataEncryption();
export const sessionSecurity = new SessionSecurity();
export const rateLimiter = new RateLimiter();
export const inputValidator = new InputValidator();
export const securityAudit = new SecurityAudit();

// Security middleware for API calls
export const secureApiCall = async (url, options = {}) => {
  const clientId = sessionStorage.getItem('clientId') || 'anonymous';
  
  // Rate limiting check
  try {
    rateLimiter.recordRequest(clientId, 'api');
  } catch (error) {
    securityAudit.logEvent('rate_limit_exceeded', { url, clientId }, 'high');
    throw error;
  }

  // Add security headers
  const secureOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Version': '1.0.5',
      ...options.headers
    },
    credentials: 'include'
  };

  // Log API call
  securityAudit.logEvent('api_call', { url, method: options.method || null }, 'info');

  try {
    const response = await fetch(url, secureOptions);
    
    if (!response.ok) {
      securityAudit.logEvent('api_error', { 
        url, 
        status: response.status, 
        statusText: response.statusText 
      }, 'warning');
    }

    return response;
  } catch (error) {
    securityAudit.logEvent('api_failure', { url, error: error.message }, 'high');
    throw error;
  }
};

// Export security framework
export default {
  dataEncryption,
  sessionSecurity,
  rateLimiter,
  inputValidator,
  securityAudit,
  secureApiCall,
  SECURITY_CONFIG
};
