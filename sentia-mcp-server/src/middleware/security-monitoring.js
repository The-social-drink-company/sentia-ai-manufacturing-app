/**
 * Security Monitoring Middleware
 * 
 * Real-time security monitoring and threat detection with development bypass
 * for the Sentia Manufacturing MCP Server.
 * 
 * CRITICAL: Development environment disables security monitoring for faster debugging
 * while maintaining comprehensive monitoring in production.
 */

import { createLogger } from '../utils/logger.js';
import { auditLogger, AUDIT_EVENTS, AUDIT_SEVERITY } from '../utils/audit-logger.js';
import { securityUtils } from '../utils/security.js';
import { 
  isDevelopmentEnvironment, 
  CURRENT_AUTH_CONFIG 
} from '../config/auth-config.js';

const logger = createLogger();

/**
 * Security Monitoring Manager
 */
export class SecurityMonitor {
  constructor() {
    this.isDevelopment = isDevelopmentEnvironment();
    this.config = CURRENT_AUTH_CONFIG.monitoring;
    
    // Threat tracking
    this.threatMap = new Map();
    this.ipTracker = new Map();
    this.userTracker = new Map();
    this.sessionTracker = new Map();
    
    // Rate limiting
    this.rateLimits = new Map();
    
    // Initialize monitoring
    if (!this.isDevelopment) {
      this.initializeMonitoring();
    } else {
      logger.debug('Security monitoring disabled in development mode');
    }
  }

  /**
   * Initialize security monitoring
   */
  initializeMonitoring() {
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupExpiredTracking();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    logger.info('Security monitoring initialized', {
      suspiciousActivityDetection: this.config.suspiciousActivity.enabled,
      auditLogging: this.config.audit.enabled,
      failedAuthTracking: this.config.failedAuth.maxAttempts
    });
  }

  /**
   * Main security monitoring middleware
   */
  monitor() {
    return async (req, res, next) => {
      // CRITICAL: Development bypass
      if (this.isDevelopment) {
        return next();
      }
      
      const correlationId = req.correlationId;
      const startTime = Date.now();
      
      try {
        // Extract request context
        const context = this.extractRequestContext(req);
        
        // Perform security checks
        const securityChecks = await this.performSecurityChecks(context);
        
        if (securityChecks.blocked) {
          await this.handleSecurityViolation(context, securityChecks);
          return res.status(403).json({
            error: 'Request blocked by security monitoring',
            reason: securityChecks.reason,
            correlationId
          });
        }
        
        // Add security context to request
        req.securityContext = {
          checks: securityChecks,
          context,
          timestamp: new Date().toISOString()
        };
        
        // Monitor response
        this.monitorResponse(req, res, context);
        
        next();
        
      } catch (error) {
        logger.error('Security monitoring error', {
          correlationId,
          error: error.message,
          executionTime: Date.now() - startTime
        });
        
        // Don't block requests if monitoring fails
        next();
      }
    };
  }

  /**
   * Extract request context for security analysis
   */
  extractRequestContext(req) {
    return {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      url: req.originalUrl || req.url,
      userId: req.user?.id,
      sessionId: req.user?.sessionId,
      role: req.user?.role,
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeRequestBody(req.body),
      query: req.query,
      referrer: req.headers.referer || req.headers.referrer,
      protocol: req.protocol,
      secure: req.secure,
      xhr: req.xhr
    };
  }

  /**
   * Sanitize headers for security analysis
   */
  sanitizeHeaders(headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize request body for security analysis
   */
  sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') {
      return body;
    }
    
    return securityUtils.maskSensitiveData(body);
  }

  /**
   * Perform comprehensive security checks
   */
  async performSecurityChecks(context) {
    const checks = {
      blocked: false,
      reason: null,
      threats: [],
      warnings: []
    };
    
    // Check for suspicious IP patterns
    const ipCheck = await this.checkSuspiciousIP(context);
    if (ipCheck.suspicious) {
      checks.threats.push(ipCheck);
      if (ipCheck.severity === 'high') {
        checks.blocked = true;
        checks.reason = 'suspicious_ip';
      }
    }
    
    // Check for brute force attempts
    const bruteForceCheck = await this.checkBruteForce(context);
    if (bruteForceCheck.detected) {
      checks.threats.push(bruteForceCheck);
      if (bruteForceCheck.severity === 'high') {
        checks.blocked = true;
        checks.reason = 'brute_force';
      }
    }
    
    // Check rate limiting
    const rateLimitCheck = await this.checkRateLimit(context);
    if (rateLimitCheck.exceeded) {
      checks.blocked = true;
      checks.reason = 'rate_limit_exceeded';
    }
    
    // Check for SQL injection patterns
    const sqlInjectionCheck = this.checkSQLInjection(context);
    if (sqlInjectionCheck.detected) {
      checks.threats.push(sqlInjectionCheck);
      checks.blocked = true;
      checks.reason = 'sql_injection_attempt';
    }
    
    // Check for XSS patterns
    const xssCheck = this.checkXSS(context);
    if (xssCheck.detected) {
      checks.threats.push(xssCheck);
      checks.warnings.push(xssCheck);
    }
    
    // Check for suspicious user behavior
    if (context.userId) {
      const userBehaviorCheck = await this.checkUserBehavior(context);
      if (userBehaviorCheck.suspicious) {
        checks.threats.push(userBehaviorCheck);
        if (userBehaviorCheck.severity === 'high') {
          checks.warnings.push(userBehaviorCheck);
        }
      }
    }
    
    return checks;
  }

  /**
   * Check for suspicious IP patterns
   */
  async checkSuspiciousIP(context) {
    const ip = context.ip;
    const now = Date.now();
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    
    // Get or create IP tracking data
    const ipData = this.ipTracker.get(ip) || {
      firstSeen: now,
      requestCount: 0,
      failedAttempts: 0,
      lastActivity: now,
      userAgents: new Set(),
      endpoints: new Set(),
      flagged: false
    };
    
    // Update tracking data
    ipData.requestCount++;
    ipData.lastActivity = now;
    ipData.userAgents.add(context.userAgent);
    ipData.endpoints.add(context.url);
    
    // Check for suspicious patterns
    let suspicious = false;
    let severity = 'low';
    const reasons = [];
    
    // Too many requests from single IP
    if (ipData.requestCount > 1000 && (now - ipData.firstSeen) < timeWindow) {
      suspicious = true;
      severity = 'medium';
      reasons.push('high_request_volume');
    }
    
    // Multiple user agents from same IP
    if (ipData.userAgents.size > 10) {
      suspicious = true;
      severity = 'medium';
      reasons.push('multiple_user_agents');
    }
    
    // Accessing many different endpoints
    if (ipData.endpoints.size > 50) {
      suspicious = true;
      severity = 'low';
      reasons.push('endpoint_scanning');
    }
    
    // High failure rate
    if (ipData.failedAttempts > 20 && ipData.failedAttempts / ipData.requestCount > 0.5) {
      suspicious = true;
      severity = 'high';
      reasons.push('high_failure_rate');
    }
    
    this.ipTracker.set(ip, ipData);
    
    return {
      suspicious,
      severity,
      reasons,
      data: {
        ip,
        requestCount: ipData.requestCount,
        timeSpan: now - ipData.firstSeen,
        userAgentCount: ipData.userAgents.size,
        endpointCount: ipData.endpoints.size
      }
    };
  }

  /**
   * Check for brute force attempts
   */
  async checkBruteForce(context) {
    const key = context.userId || context.ip;
    const now = Date.now();
    const timeWindow = this.config.failedAuth.lockoutDuration;
    
    // Track authentication attempts
    const attempts = this.threatMap.get(`brute_force:${key}`) || [];
    const recentAttempts = attempts.filter(time => (now - time) < timeWindow);
    
    const detected = recentAttempts.length >= this.config.failedAuth.maxAttempts;
    let severity = 'low';
    
    if (detected) {
      severity = recentAttempts.length > this.config.failedAuth.maxAttempts * 2 ? 'high' : 'medium';
    }
    
    return {
      detected,
      severity,
      attempts: recentAttempts.length,
      threshold: this.config.failedAuth.maxAttempts,
      timeWindow: timeWindow / 1000
    };
  }

  /**
   * Check rate limiting
   */
  async checkRateLimit(context) {
    const key = context.userId || context.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // Default limit
    
    const requests = this.rateLimits.get(key) || [];
    const recentRequests = requests.filter(time => (now - time) < windowMs);
    
    // Add current request
    recentRequests.push(now);
    this.rateLimits.set(key, recentRequests);
    
    const exceeded = recentRequests.length > maxRequests;
    
    return {
      exceeded,
      currentCount: recentRequests.length,
      limit: maxRequests,
      windowMs,
      retryAfter: exceeded ? Math.ceil(windowMs / 1000) : 0
    };
  }

  /**
   * Check for SQL injection patterns
   */
  checkSQLInjection(context) {
    const sqlPatterns = [
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i,
      /(\bINSERT\b.*\bINTO\b)/i,
      /(\bUPDATE\b.*\bSET\b)/i,
      /(\bDELETE\b.*\bFROM\b)/i,
      /(\bDROP\b.*\bTABLE\b)/i,
      /('.*OR.*'.*=.*')/i,
      /(\-\-)/,
      /(\/\*.*\*\/)/,
      /(\bEXEC\b|\bEXECUTE\b)/i
    ];
    
    const testStrings = [
      context.url,
      JSON.stringify(context.query),
      JSON.stringify(context.body)
    ].filter(Boolean);
    
    for (const testString of testStrings) {
      for (const pattern of sqlPatterns) {
        if (pattern.test(testString)) {
          return {
            detected: true,
            pattern: pattern.source,
            location: testString.substring(0, 100),
            severity: 'high'
          };
        }
      }
    }
    
    return { detected: false };
  }

  /**
   * Check for XSS patterns
   */
  checkXSS(context) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*>/gi,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /onclick\s*=/i
    ];
    
    const testStrings = [
      context.url,
      JSON.stringify(context.query),
      JSON.stringify(context.body),
      context.userAgent
    ].filter(Boolean);
    
    for (const testString of testStrings) {
      for (const pattern of xssPatterns) {
        if (pattern.test(testString)) {
          return {
            detected: true,
            pattern: pattern.source,
            location: testString.substring(0, 100),
            severity: 'medium'
          };
        }
      }
    }
    
    return { detected: false };
  }

  /**
   * Check user behavior patterns
   */
  async checkUserBehavior(context) {
    const userId = context.userId;
    const now = Date.now();
    const timeWindow = 30 * 60 * 1000; // 30 minutes
    
    const userData = this.userTracker.get(userId) || {
      sessions: [],
      requests: [],
      locations: new Set(),
      devices: new Set(),
      suspiciousActivity: 0
    };
    
    // Update user data
    userData.requests.push({
      timestamp: now,
      ip: context.ip,
      userAgent: context.userAgent,
      url: context.url
    });
    
    userData.locations.add(context.ip);
    userData.devices.add(context.userAgent);
    
    // Filter recent activity
    userData.requests = userData.requests.filter(req => (now - req.timestamp) < timeWindow);
    
    // Check for suspicious patterns
    let suspicious = false;
    let severity = 'low';
    const reasons = [];
    
    // Multiple locations
    if (userData.locations.size > this.config.suspiciousActivity.multipleLocationThreshold) {
      suspicious = true;
      severity = 'medium';
      reasons.push('multiple_locations');
    }
    
    // Rapid requests
    if (userData.requests.length > this.config.suspiciousActivity.rapidRequestThreshold) {
      suspicious = true;
      severity = 'medium';
      reasons.push('rapid_requests');
    }
    
    // Multiple devices
    if (userData.devices.size > 5) {
      suspicious = true;
      severity = 'low';
      reasons.push('multiple_devices');
    }
    
    this.userTracker.set(userId, userData);
    
    return {
      suspicious,
      severity,
      reasons,
      data: {
        userId,
        locationCount: userData.locations.size,
        deviceCount: userData.devices.size,
        recentRequests: userData.requests.length
      }
    };
  }

  /**
   * Monitor response for security issues
   */
  monitorResponse(req, res, context) {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      // Check response for sensitive data exposure
      if (typeof data === 'string' && data.length > 0) {
        const sensitivePatterns = [
          /password\s*[:=]\s*["']?[^"'\s]+["']?/gi,
          /api[_-]?key\s*[:=]\s*["']?[^"'\s]+["']?/gi,
          /secret\s*[:=]\s*["']?[^"'\s]+["']?/gi,
          /token\s*[:=]\s*["']?[^"'\s]+["']?/gi
        ];
        
        for (const pattern of sensitivePatterns) {
          if (pattern.test(data)) {
            logger.warn('Potential sensitive data exposure in response', {
              correlationId: context.correlationId,
              url: context.url,
              pattern: pattern.source
            });
            break;
          }
        }
      }
      
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      // Monitor JSON responses
      if (data && typeof data === 'object') {
        const sensitiveFields = ['password', 'secret', 'apiKey', 'token'];
        const exposedFields = sensitiveFields.filter(field => 
          data[field] !== undefined
        );
        
        if (exposedFields.length > 0) {
          logger.warn('Sensitive fields in JSON response', {
            correlationId: context.correlationId,
            url: context.url,
            exposedFields
          });
        }
      }
      
      return originalJson.call(this, data);
    };
  }

  /**
   * Handle security violations
   */
  async handleSecurityViolation(context, securityChecks) {
    const severity = this.determineSeverity(securityChecks);
    
    // Log audit event
    await auditLogger.logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, {
      reason: securityChecks.reason,
      threats: securityChecks.threats,
      warnings: securityChecks.warnings,
      ip: context.ip,
      userAgent: context.userAgent,
      url: context.url
    }, {
      severity,
      userId: context.userId,
      sessionId: context.sessionId,
      correlationId: context.correlationId,
      ipAddress: context.ip,
      userAgent: context.userAgent,
      outcome: 'blocked'
    });
    
    // Update threat tracking
    this.updateThreatTracking(context, securityChecks);
    
    logger.warn('Security violation detected and blocked', {
      correlationId: context.correlationId,
      reason: securityChecks.reason,
      ip: context.ip,
      userId: context.userId,
      threats: securityChecks.threats.length,
      warnings: securityChecks.warnings.length
    });
  }

  /**
   * Determine severity from security checks
   */
  determineSeverity(securityChecks) {
    const highSeverityReasons = ['sql_injection_attempt', 'brute_force'];
    const mediumSeverityReasons = ['suspicious_ip', 'rate_limit_exceeded'];
    
    if (highSeverityReasons.includes(securityChecks.reason)) {
      return AUDIT_SEVERITY.HIGH;
    }
    
    if (mediumSeverityReasons.includes(securityChecks.reason)) {
      return AUDIT_SEVERITY.MEDIUM;
    }
    
    return AUDIT_SEVERITY.LOW;
  }

  /**
   * Update threat tracking
   */
  updateThreatTracking(context, securityChecks) {
    const key = `${securityChecks.reason}:${context.ip}`;
    const now = Date.now();
    
    const threats = this.threatMap.get(key) || [];
    threats.push(now);
    
    // Keep only recent threats (24 hours)
    const recentThreats = threats.filter(time => (now - time) < 24 * 60 * 60 * 1000);
    this.threatMap.set(key, recentThreats);
  }

  /**
   * Cleanup expired tracking data
   */
  cleanupExpiredTracking() {
    const now = Date.now();
    const expireTime = 24 * 60 * 60 * 1000; // 24 hours
    
    // Cleanup IP tracker
    for (const [ip, data] of this.ipTracker.entries()) {
      if ((now - data.lastActivity) > expireTime) {
        this.ipTracker.delete(ip);
      }
    }
    
    // Cleanup rate limits
    for (const [key, requests] of this.rateLimits.entries()) {
      const recentRequests = requests.filter(time => (now - time) < 15 * 60 * 1000);
      if (recentRequests.length === 0) {
        this.rateLimits.delete(key);
      } else {
        this.rateLimits.set(key, recentRequests);
      }
    }
    
    // Cleanup threat map
    for (const [key, threats] of this.threatMap.entries()) {
      const recentThreats = threats.filter(time => (now - time) < expireTime);
      if (recentThreats.length === 0) {
        this.threatMap.delete(key);
      } else {
        this.threatMap.set(key, recentThreats);
      }
    }
    
    logger.debug('Security monitoring data cleaned up', {
      ipTrackerSize: this.ipTracker.size,
      rateLimitsSize: this.rateLimits.size,
      threatMapSize: this.threatMap.size
    });
  }

  /**
   * Get security monitoring status
   */
  getStatus() {
    return {
      enabled: !this.isDevelopment && this.config.enabled,
      developmentBypass: this.isDevelopment,
      trackedIPs: this.ipTracker.size,
      rateLimitEntries: this.rateLimits.size,
      threatEntries: this.threatMap.size,
      trackedUsers: this.userTracker.size,
      configuration: {
        suspiciousActivityDetection: this.config.suspiciousActivity.enabled,
        failedAuthMax: this.config.failedAuth.maxAttempts,
        lockoutDuration: this.config.failedAuth.lockoutDuration / 1000
      }
    };
  }
}

// Create singleton instance
export const securityMonitor = new SecurityMonitor();

// Export the monitoring middleware
export const securityMonitoringMiddleware = securityMonitor.monitor();

// Export convenience functions
export const { getStatus } = securityMonitor;