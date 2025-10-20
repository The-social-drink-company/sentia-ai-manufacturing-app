/**
 * Security Audit Logger
 * 
 * Comprehensive security audit logging system with development-aware behavior
 * for the CapLiquify MCP Server.
 * 
 * CRITICAL: Development environment uses console logging for easier debugging
 * while maintaining structured audit logs in production.
 */

import { createLogger } from './logger.js';
import { encryptionUtils } from './encryption.js';
import { securityUtils } from './security.js';
import { 
  isDevelopmentEnvironment, 
  CURRENT_AUTH_CONFIG 
} from '../config/auth-config.js';

const logger = createLogger();

/**
 * Audit event types
 */
export const AUDIT_EVENTS = {
  // Authentication events
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',
  AUTH_LOGOUT: 'auth_logout',
  AUTH_TOKEN_REFRESH: 'auth_token_refresh',
  AUTH_PASSWORD_CHANGE: 'auth_password_change',
  
  // Authorization events
  AUTHZ_GRANTED: 'authz_granted',
  AUTHZ_DENIED: 'authz_denied',
  AUTHZ_ROLE_CHANGE: 'authz_role_change',
  AUTHZ_PERMISSION_GRANT: 'authz_permission_grant',
  AUTHZ_PERMISSION_REVOKE: 'authz_permission_revoke',
  
  // Tool execution events
  TOOL_EXECUTION_START: 'tool_execution_start',
  TOOL_EXECUTION_SUCCESS: 'tool_execution_success',
  TOOL_EXECUTION_FAILURE: 'tool_execution_failure',
  TOOL_PERMISSION_DENIED: 'tool_permission_denied',
  
  // Data access events
  DATA_READ: 'data_read',
  DATA_WRITE: 'data_write',
  DATA_DELETE: 'data_delete',
  DATA_EXPORT: 'data_export',
  DATA_IMPORT: 'data_import',
  
  // Configuration events
  CONFIG_CHANGE: 'config_change',
  CONFIG_READ: 'config_read',
  
  // User management events
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_ROLE_ASSIGN: 'user_role_assign',
  USER_PERMISSION_ASSIGN: 'user_permission_assign',
  
  // API key events
  API_KEY_CREATE: 'api_key_create',
  API_KEY_USE: 'api_key_use',
  API_KEY_REVOKE: 'api_key_revoke',
  API_KEY_EXPIRE: 'api_key_expire',
  
  // Security events
  SECURITY_VIOLATION: 'security_violation',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',
  
  // System events
  SYSTEM_START: 'system_start',
  SYSTEM_STOP: 'system_stop',
  SYSTEM_ERROR: 'system_error',
  SYSTEM_CONFIG_RELOAD: 'system_config_reload'
};

/**
 * Audit severity levels
 */
export const AUDIT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Audit Logger Class
 */
export class AuditLogger {
  constructor() {
    this.isDevelopment = isDevelopmentEnvironment();
    this.config = CURRENT_AUTH_CONFIG.monitoring.audit;
    this.auditStore = new Map(); // In-memory store for development
    this.sessionStore = new Map(); // Track audit sessions
    
    // Initialize development mode
    if (this.isDevelopment) {
      logger.debug('Audit logger initialized in development mode');
    }
  }

  /**
   * Log audit event
   */
  async logEvent(eventType, details = {}, options = {}) {
    try {
      const {
        severity = AUDIT_SEVERITY.MEDIUM,
        userId = null,
        sessionId = null,
        correlationId = null,
        ipAddress = null,
        userAgent = null,
        resource = null,
        action = null,
        outcome = 'success',
        additionalData = {}
      } = options;
      
      const auditEntry = {
        id: securityUtils.generateSecureToken(16),
        timestamp: new Date().toISOString(),
        eventType,
        severity,
        outcome,
        
        // User context
        userId,
        sessionId,
        correlationId,
        
        // Request context
        ipAddress,
        userAgent,
        
        // Resource context
        resource,
        action,
        
        // Event details
        details: this.sanitizeAuditData(details),
        additionalData: this.sanitizeAuditData(additionalData),
        
        // Metadata
        environment: this.isDevelopment ? 'development' : 'production',
        serverVersion: process.env.npm_package_version || '1.0.0',
        
        // Security
        integrity: null // Will be set after hashing
      };
      
      // Add integrity hash
      auditEntry.integrity = securityUtils.generateHMAC(
        JSON.stringify(auditEntry),
        process.env.AUDIT_INTEGRITY_SECRET || 'default-audit-secret'
      );
      
      // Handle development vs production logging
      if (this.isDevelopment) {
        await this.logDevelopmentEvent(auditEntry);
      } else {
        await this.logProductionEvent(auditEntry);
      }
      
      // Update session tracking
      if (sessionId) {
        this.updateSessionTracking(sessionId, auditEntry);
      }
      
      // Check for suspicious patterns
      this.checkSuspiciousActivity(auditEntry);
      
      return auditEntry.id;
      
    } catch (error) {
      logger.error('Audit logging failed', {
        eventType,
        error: error.message,
        stack: error.stack
      });
      
      // Don't fail the operation if audit logging fails
      return null;
    }
  }

  /**
   * Development audit logging (console-based)
   */
  async logDevelopmentEvent(auditEntry) {
    const logLevel = this.getSeverityLogLevel(auditEntry.severity);
    const logMessage = `[AUDIT] ${auditEntry.eventType}`;
    
    const logData = {
      auditId: auditEntry.id,
      timestamp: auditEntry.timestamp,
      eventType: auditEntry.eventType,
      severity: auditEntry.severity,
      outcome: auditEntry.outcome,
      userId: auditEntry.userId,
      resource: auditEntry.resource,
      action: auditEntry.action,
      details: auditEntry.details,
      correlationId: auditEntry.correlationId
    };
    
    logger[logLevel](logMessage, logData);
    
    // Store in memory for development queries
    this.auditStore.set(auditEntry.id, auditEntry);
    
    // Keep only recent entries in development
    if (this.auditStore.size > 1000) {
      const oldestEntries = Array.from(this.auditStore.keys()).slice(0, 100);
      for (const id of oldestEntries) {
        this.auditStore.delete(id);
      }
    }
  }

  /**
   * Production audit logging (encrypted, structured)
   */
  async logProductionEvent(auditEntry) {
    // Encrypt sensitive data
    const encryptedEntry = encryptionUtils.encryptFields(auditEntry, [
      'details',
      'additionalData',
      'userAgent'
    ]);
    
    // Store in database (simulated with Map for now)
    this.auditStore.set(auditEntry.id, encryptedEntry);
    
    // Log to structured logger
    const logLevel = this.getSeverityLogLevel(auditEntry.severity);
    logger[logLevel]('Audit event recorded', {
      auditId: auditEntry.id,
      eventType: auditEntry.eventType,
      severity: auditEntry.severity,
      outcome: auditEntry.outcome,
      userId: auditEntry.userId,
      timestamp: auditEntry.timestamp,
      correlationId: auditEntry.correlationId
    });
    
    // Trigger alerts for high severity events
    if (auditEntry.severity === AUDIT_SEVERITY.CRITICAL || 
        auditEntry.severity === AUDIT_SEVERITY.HIGH) {
      await this.triggerSecurityAlert(auditEntry);
    }
  }

  /**
   * Get log level based on audit severity
   */
  getSeverityLogLevel(severity) {
    switch (severity) {
      case AUDIT_SEVERITY.CRITICAL:
        return 'error';
      case AUDIT_SEVERITY.HIGH:
        return 'warn';
      case AUDIT_SEVERITY.MEDIUM:
        return 'info';
      case AUDIT_SEVERITY.LOW:
      default:
        return 'debug';
    }
  }

  /**
   * Sanitize audit data to remove sensitive information
   */
  sanitizeAuditData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sensitiveFields = [
      'password', 'secret', 'key', 'token', 'apiKey', 'hash',
      'creditCard', 'ssn', 'personalId', 'bankAccount'
    ];
    
    return securityUtils.maskSensitiveData(data, sensitiveFields);
  }

  /**
   * Update session tracking
   */
  updateSessionTracking(sessionId, auditEntry) {
    const sessionData = this.sessionStore.get(sessionId) || {
      sessionId,
      startTime: auditEntry.timestamp,
      lastActivity: auditEntry.timestamp,
      eventCount: 0,
      events: [],
      userId: auditEntry.userId,
      ipAddress: auditEntry.ipAddress
    };
    
    sessionData.lastActivity = auditEntry.timestamp;
    sessionData.eventCount++;
    sessionData.events.push({
      timestamp: auditEntry.timestamp,
      eventType: auditEntry.eventType,
      outcome: auditEntry.outcome
    });
    
    // Keep only recent events per session
    if (sessionData.events.length > 100) {
      sessionData.events = sessionData.events.slice(-50);
    }
    
    this.sessionStore.set(sessionId, sessionData);
  }

  /**
   * Check for suspicious activity patterns
   */
  checkSuspiciousActivity(auditEntry) {
    if (this.isDevelopment) {
      return; // Skip suspicious activity detection in development
    }
    
    const suspiciousPatterns = [
      () => this.checkBruteForcePattern(auditEntry),
      () => this.checkRapidRequestPattern(auditEntry),
      () => this.checkPrivilegeEscalationPattern(auditEntry),
      () => this.checkDataExfiltrationPattern(auditEntry)
    ];
    
    for (const patternCheck of suspiciousPatterns) {
      try {
        const result = patternCheck();
        if (result.suspicious) {
          this.logSuspiciousActivity(result, auditEntry);
        }
      } catch (error) {
        logger.warn('Suspicious activity check failed', {
          error: error.message,
          auditId: auditEntry.id
        });
      }
    }
  }

  /**
   * Check for brute force patterns
   */
  checkBruteForcePattern(auditEntry) {
    if (auditEntry.eventType !== AUDIT_EVENTS.AUTH_FAILURE) {
      return { suspicious: false };
    }
    
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const threshold = 5; // 5 failed attempts
    const now = new Date().getTime();
    
    const recentFailures = Array.from(this.auditStore.values())
      .filter(entry => 
        entry.eventType === AUDIT_EVENTS.AUTH_FAILURE &&
        entry.ipAddress === auditEntry.ipAddress &&
        (now - new Date(entry.timestamp).getTime()) < timeWindow
      );
    
    if (recentFailures.length >= threshold) {
      return {
        suspicious: true,
        pattern: 'brute_force',
        details: {
          failureCount: recentFailures.length,
          timeWindow: timeWindow / 1000,
          ipAddress: auditEntry.ipAddress
        }
      };
    }
    
    return { suspicious: false };
  }

  /**
   * Check for rapid request patterns
   */
  checkRapidRequestPattern(auditEntry) {
    const timeWindow = 1 * 60 * 1000; // 1 minute
    const threshold = 100; // 100 requests
    const now = new Date().getTime();
    
    const recentRequests = Array.from(this.auditStore.values())
      .filter(entry => 
        entry.userId === auditEntry.userId &&
        (now - new Date(entry.timestamp).getTime()) < timeWindow
      );
    
    if (recentRequests.length >= threshold) {
      return {
        suspicious: true,
        pattern: 'rapid_requests',
        details: {
          requestCount: recentRequests.length,
          timeWindow: timeWindow / 1000,
          userId: auditEntry.userId
        }
      };
    }
    
    return { suspicious: false };
  }

  /**
   * Check for privilege escalation patterns
   */
  checkPrivilegeEscalationPattern(auditEntry) {
    if (auditEntry.eventType !== AUDIT_EVENTS.AUTHZ_DENIED) {
      return { suspicious: false };
    }
    
    const timeWindow = 10 * 60 * 1000; // 10 minutes
    const threshold = 10; // 10 denied attempts
    const now = new Date().getTime();
    
    const recentDenials = Array.from(this.auditStore.values())
      .filter(entry => 
        entry.eventType === AUDIT_EVENTS.AUTHZ_DENIED &&
        entry.userId === auditEntry.userId &&
        (now - new Date(entry.timestamp).getTime()) < timeWindow
      );
    
    if (recentDenials.length >= threshold) {
      return {
        suspicious: true,
        pattern: 'privilege_escalation',
        details: {
          denialCount: recentDenials.length,
          timeWindow: timeWindow / 1000,
          userId: auditEntry.userId
        }
      };
    }
    
    return { suspicious: false };
  }

  /**
   * Check for data exfiltration patterns
   */
  checkDataExfiltrationPattern(auditEntry) {
    if (auditEntry.eventType !== AUDIT_EVENTS.DATA_EXPORT) {
      return { suspicious: false };
    }
    
    const timeWindow = 30 * 60 * 1000; // 30 minutes
    const threshold = 5; // 5 exports
    const now = new Date().getTime();
    
    const recentExports = Array.from(this.auditStore.values())
      .filter(entry => 
        entry.eventType === AUDIT_EVENTS.DATA_EXPORT &&
        entry.userId === auditEntry.userId &&
        (now - new Date(entry.timestamp).getTime()) < timeWindow
      );
    
    if (recentExports.length >= threshold) {
      return {
        suspicious: true,
        pattern: 'data_exfiltration',
        details: {
          exportCount: recentExports.length,
          timeWindow: timeWindow / 1000,
          userId: auditEntry.userId
        }
      };
    }
    
    return { suspicious: false };
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(suspiciousResult, originalEntry) {
    await this.logEvent(AUDIT_EVENTS.SUSPICIOUS_ACTIVITY, {
      originalAuditId: originalEntry.id,
      originalEventType: originalEntry.eventType,
      suspiciousPattern: suspiciousResult.pattern,
      patternDetails: suspiciousResult.details
    }, {
      severity: AUDIT_SEVERITY.HIGH,
      userId: originalEntry.userId,
      sessionId: originalEntry.sessionId,
      correlationId: originalEntry.correlationId,
      ipAddress: originalEntry.ipAddress,
      outcome: 'detected'
    });
  }

  /**
   * Trigger security alert
   */
  async triggerSecurityAlert(auditEntry) {
    logger.error('Security alert triggered', {
      auditId: auditEntry.id,
      eventType: auditEntry.eventType,
      severity: auditEntry.severity,
      userId: auditEntry.userId,
      timestamp: auditEntry.timestamp,
      details: auditEntry.details
    });
    
    // In production, this would integrate with alerting systems
    // For now, just log the alert
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs(filters = {}, options = {}) {
    const {
      eventType,
      userId,
      severity,
      startTime,
      endTime,
      limit = 100,
      offset = 0
    } = filters;
    
    let entries = Array.from(this.auditStore.values());
    
    // Apply filters
    if (eventType) {
      entries = entries.filter(entry => entry.eventType === eventType);
    }
    
    if (userId) {
      entries = entries.filter(entry => entry.userId === userId);
    }
    
    if (severity) {
      entries = entries.filter(entry => entry.severity === severity);
    }
    
    if (startTime) {
      entries = entries.filter(entry => 
        new Date(entry.timestamp) >= new Date(startTime)
      );
    }
    
    if (endTime) {
      entries = entries.filter(entry => 
        new Date(entry.timestamp) <= new Date(endTime)
      );
    }
    
    // Sort by timestamp (newest first)
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const total = entries.length;
    const paginatedEntries = entries.slice(offset, offset + limit);
    
    // Decrypt entries in production
    const decryptedEntries = this.isDevelopment ? 
      paginatedEntries : 
      paginatedEntries.map(entry => encryptionUtils.decryptFields(entry, [
        'details',
        'additionalData',
        'userAgent'
      ]));
    
    return {
      entries: decryptedEntries,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  }

  /**
   * Get audit statistics
   */
  getAuditStatistics(timeRange = '24h') {
    const now = new Date().getTime();
    const timeRangeMs = this.parseTimeRange(timeRange);
    const cutoff = now - timeRangeMs;
    
    const recentEntries = Array.from(this.auditStore.values())
      .filter(entry => new Date(entry.timestamp).getTime() >= cutoff);
    
    const stats = {
      totalEvents: recentEntries.length,
      timeRange,
      eventTypes: {},
      severityDistribution: {},
      outcomeDistribution: {},
      userActivity: {},
      suspiciousActivity: 0
    };
    
    for (const entry of recentEntries) {
      // Event types
      stats.eventTypes[entry.eventType] = (stats.eventTypes[entry.eventType] || 0) + 1;
      
      // Severity distribution
      stats.severityDistribution[entry.severity] = (stats.severityDistribution[entry.severity] || 0) + 1;
      
      // Outcome distribution
      stats.outcomeDistribution[entry.outcome] = (stats.outcomeDistribution[entry.outcome] || 0) + 1;
      
      // User activity
      if (entry.userId) {
        stats.userActivity[entry.userId] = (stats.userActivity[entry.userId] || 0) + 1;
      }
      
      // Suspicious activity
      if (entry.eventType === AUDIT_EVENTS.SUSPICIOUS_ACTIVITY) {
        stats.suspiciousActivity++;
      }
    }
    
    return stats;
  }

  /**
   * Parse time range string to milliseconds
   */
  parseTimeRange(timeRange) {
    const units = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000
    };
    
    const match = timeRange.match(/^(\d+)([mhdw])$/);
    if (!match) {
      return 24 * 60 * 60 * 1000; // Default to 24 hours
    }
    
    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * Get audit logger status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      developmentMode: this.isDevelopment,
      totalEntries: this.auditStore.size,
      activeSessions: this.sessionStore.size,
      retentionDays: this.config.retention.days,
      maxSizeMB: this.config.retention.maxSizeMB,
      events: Object.values(AUDIT_EVENTS),
      severityLevels: Object.values(AUDIT_SEVERITY)
    };
  }
}

// Create singleton instance
export const auditLogger = new AuditLogger();

// Export convenience functions
export const {
  logEvent,
  queryAuditLogs,
  getAuditStatistics,
  getStatus
} = auditLogger;