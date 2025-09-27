/**
 * Enterprise Threat Detection System
 * Real-time monitoring and detection of security threats
 */

import { auditLogger } from './audit-logger.js';

class ThreatDetector {
  constructor() {
    this.patterns = this.loadThreatPatterns();
    this.sessionTracking = new Map();
    this.ipTracking = new Map();
    this.thresholds = {
      maxFailedLogins: 5,
      maxFailedLoginsWindow: 300000, // 5 minutes
      maxRequestsPerMinute: 100,
      maxRequestsPerHour: 1000,
      suspiciousPatternScore: 10,
      blockDuration: 3600000 // 1 hour
    };
    this.blockedIPs = new Set();
    this.blockedUsers = new Set();
  }

  /**
   * Analyze request for threats
   */
  async analyzeRequest(req) {
    const threats = [];
    const ip = this.getClientIP(req);
    const userId = req.user?.id;

    // Check if blocked
    if (this.blockedIPs.has(ip)) {
      threats.push({
        type: 'BLOCKED_IP',
        severity: 'HIGH',
        message: 'Request from blocked IP address'
      });
    }

    if (userId && this.blockedUsers.has(userId)) {
      threats.push({
        type: 'BLOCKED_USER',
        severity: 'HIGH',
        message: 'Request from blocked user'
      });
    }

    // Rate limiting check
    const rateViolation = this.checkRateLimit(ip, userId);
    if (rateViolation) {
      threats.push(rateViolation);
    }

    // SQL injection detection
    const sqlInjection = this.detectSQLInjection(req);
    if (sqlInjection) {
      threats.push(sqlInjection);
    }

    // XSS detection
    const xss = this.detectXSS(req);
    if (xss) {
      threats.push(xss);
    }

    // Path traversal detection
    const pathTraversal = this.detectPathTraversal(req);
    if (pathTraversal) {
      threats.push(pathTraversal);
    }

    // Command injection detection
    const cmdInjection = this.detectCommandInjection(req);
    if (cmdInjection) {
      threats.push(cmdInjection);
    }

    // Suspicious headers
    const suspiciousHeaders = this.checkSuspiciousHeaders(req);
    if (suspiciousHeaders.length > 0) {
      threats.push(...suspiciousHeaders);
    }

    // Log threats
    if (threats.length > 0) {
      await this.handleThreats(req, threats);
    }

    return threats;
  }

  /**
   * Detect SQL injection attempts
   */
  detectSQLInjection(req) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
      /(--|\#|/*|*/)/g,
      /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
      /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
      /(\'|\"|;|\\x00|\\n|\\r|\\x1a)/g,
      /(\bEXEC\b|\bEXECUTE\b|\bCAST\b|\bDECLARE\b)/gi
    ];

    const checkString = (_str) => {
      if (!str) return false;
      const decoded = decodeURIComponent(str);
      return sqlPatterns.some(pattern => pattern.test(decoded));
    };

    // Check all request inputs
    const params = { ...req.query, ...req.body, ...req.params };

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && checkString(value)) {
        return {
          type: 'SQL_INJECTION',
          severity: 'CRITICAL',
          message: 'Potential SQL injection detected',
          field: key,
          pattern: 'SQL keywords/patterns detected'
        };
      }
    }

    return null;
  }

  /**
   * Detect XSS attempts
   */
  detectXSS(req) {
    const xssPatterns = [
      /<script[^>]*>.*?</script>/gi,
      /<iframe[^>]*>.*?</iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers
      /<img[^>]*onerror=/gi,
      /<svg[^>]*onload=/gi,
      /eval\s*(/gi,
      /expression\s*(/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /document.(cookie|write|domain)/gi,
      /window.(location|open)/gi
    ];

    const checkString = (_str) => {
      if (!str) return false;
      const decoded = decodeURIComponent(str);
      return xssPatterns.some(pattern => pattern.test(decoded));
    };

    const params = { ...req.query, ...req.body, ...req.params };

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && checkString(value)) {
        return {
          type: 'XSS_ATTEMPT',
          severity: 'HIGH',
          message: 'Potential XSS attack detected',
          field: key,
          pattern: 'Script/HTML injection detected'
        };
      }
    }

    return null;
  }

  /**
   * Detect path traversal attempts
   */
  detectPathTraversal(req) {
    const traversalPatterns = [
      /..//g,
      /..\\/g,
      /%2e%2e%2f/gi,
      /%252e%252e%252f/gi,
      /../g
    ];

    const checkPath = (path) => {
      if (!path) return false;
      return traversalPatterns.some(pattern => pattern.test(path));
    };

    // Check URL path
    if (checkPath(req.path)) {
      return {
        type: 'PATH_TRAVERSAL',
        severity: 'HIGH',
        message: 'Path traversal attempt detected',
        path: req.path
      };
    }

    // Check parameters
    const params = { ...req.query, ...req.body };
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && checkPath(value)) {
        return {
          type: 'PATH_TRAVERSAL',
          severity: 'HIGH',
          message: 'Path traversal in parameter',
          field: key
        };
      }
    }

    return null;
  }

  /**
   * Detect command injection attempts
   */
  detectCommandInjection(req) {
    const cmdPatterns = [
      /;\s*(ls|dir|cat|type|more|less|head|tail|pwd|whoami|id|uname)/gi,
      /\|\s*(ls|dir|cat|type|more|less|head|tail|pwd|whoami|id|uname)/gi,
      /`[^`]*`/g,
      /\$([^)]*)/g,
      /&&\s*\w+/g,
      /\|\|\s*\w+/g
    ];

    const checkString = (_str) => {
      if (!str) return false;
      return cmdPatterns.some(pattern => pattern.test(str));
    };

    const params = { ...req.query, ...req.body };

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && checkString(value)) {
        return {
          type: 'COMMAND_INJECTION',
          severity: 'CRITICAL',
          message: 'Potential command injection detected',
          field: key
        };
      }
    }

    return null;
  }

  /**
   * Check for suspicious headers
   */
  checkSuspiciousHeaders(req) {
    const threats = [];

    // Check for proxy headers manipulation
    const proxyHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
    for (const header of proxyHeaders) {
      if (req.headers[header]) {
        const ips = req.headers[header].split(',').map(ip => ip.trim());
        if (ips.length > 3) {
          threats.push({
            type: 'PROXY_MANIPULATION',
            severity: 'MEDIUM',
            message: 'Suspicious proxy header chain',
            header
          });
        }
      }
    }

    // Check for header injection
    const headerInjectionPattern = /[\r\n]/;
    for (const [header, value] of Object.entries(req.headers)) {
      if (typeof value === 'string' && headerInjectionPattern.test(value)) {
        threats.push({
          type: 'HEADER_INJECTION',
          severity: 'HIGH',
          message: 'Header injection attempt',
          header
        });
      }
    }

    // Check User-Agent anomalies
    const userAgent = req.headers['user-agent'];
    if (userAgent) {
      if (userAgent.length > 500) {
        threats.push({
          type: 'SUSPICIOUS_USER_AGENT',
          severity: 'LOW',
          message: 'Abnormally long User-Agent'
        });
      }

      // Known bot patterns
      const botPatterns = [
        /sqlmap/i,
        /nikto/i,
        /scanner/i,
        /nessus/i,
        /metasploit/i,
        /burp/i
      ];

      if (botPatterns.some(pattern => pattern.test(userAgent))) {
        threats.push({
          type: 'SECURITY_SCANNER',
          severity: 'HIGH',
          message: 'Security scanner detected',
          scanner: userAgent
        });
      }
    }

    return threats;
  }

  /**
   * Check rate limits
   */
  checkRateLimit(ip, userId) {
    const now = Date.now();
    const key = userId || ip;

    if (!this.ipTracking.has(key)) {
      this.ipTracking.set(key, {
        requests: [],
        violations: 0
      });
    }

    const tracking = this.ipTracking.get(key);

    // Clean old requests
    tracking.requests = tracking.requests.filter(
      time => now - time < 3600000 // Keep last hour
    );

    tracking.requests.push(now);

    // Check per minute
    const lastMinute = tracking.requests.filter(
      time => now - time < 60000
    );

    if (lastMinute.length > this.thresholds.maxRequestsPerMinute) {
      tracking.violations++;

      if (tracking.violations > 3) {
        this.blockIP(ip);
      }

      return {
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'HIGH',
        message: 'Rate limit exceeded',
        limit: this.thresholds.maxRequestsPerMinute,
        actual: lastMinute.length,
        window: '1 minute'
      };
    }

    // Check per hour
    if (tracking.requests.length > this.thresholds.maxRequestsPerHour) {
      return {
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        message: 'Hourly rate limit exceeded',
        limit: this.thresholds.maxRequestsPerHour,
        actual: tracking.requests.length,
        window: '1 hour'
      };
    }

    return null;
  }

  /**
   * Handle detected threats
   */
  async handleThreats(req, threats) {
    const ip = this.getClientIP(req);
    const userId = req.user?.id;

    // Calculate threat score
    const threatScore = threats.reduce(_(score, threat) => {
      const severityScores = {
        CRITICAL: 20,
        HIGH: 10,
        MEDIUM: 5,
        LOW: 1
      };
      return score + (severityScores[threat.severity] || 0);
    }, 0);

    // Log all threats
    for (const threat of threats) {
      await auditLogger.logViolation(
        threat.type,
        { userId, ip },
        threat,
        {
          url: req.url,
          method: req.method,
          headers: this.sanitizeHeaders(req.headers)
        }
      );
    }

    // Take action based on threat score
    if (threatScore >= this.thresholds.suspiciousPatternScore) {
      if (threatScore >= 20) {
        // Critical threat - immediate block
        this.blockIP(ip);
        if (userId) {
          this.blockUser(userId);
        }
      } else if (threatScore >= 10) {
        // High threat - temporary block
        this.temporaryBlock(ip, this.thresholds.blockDuration);
      }
    }
  }

  /**
   * Block IP address
   */
  blockIP(ip) {
    this.blockedIPs.add(ip);
    console.error(`BLOCKED IP: ${ip}`);
  }

  /**
   * Block user
   */
  blockUser(userId) {
    this.blockedUsers.add(userId);
    console.error(`BLOCKED USER: ${userId}`);
  }

  /**
   * Temporary block
   */
  temporaryBlock(ip, duration) {
    this.blockedIPs.add(ip);
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      console.log(`Unblocked IP: ${ip}`);
    }, duration);
  }

  /**
   * Track authentication failure
   */
  async trackAuthFailure(userId, ip) {
    const key = `auth_${userId || ip}`;
    const now = Date.now();

    if (!this.sessionTracking.has(key)) {
      this.sessionTracking.set(key, {
        failures: [],
        locked: false
      });
    }

    const tracking = this.sessionTracking.get(key);

    // Clean old failures
    tracking.failures = tracking.failures.filter(
      time => now - time < this.thresholds.maxFailedLoginsWindow
    );

    tracking.failures.push(now);

    // Check threshold
    if (tracking.failures.length >= this.thresholds.maxFailedLogins) {
      tracking.locked = true;

      await auditLogger.logViolation(
        'BRUTE_FORCE',
        { userId, ip },
        {
          attempts: tracking.failures.length,
          window: this.thresholds.maxFailedLoginsWindow
        }
      );

      // Block the source
      if (userId) {
        this.blockUser(userId);
      } else {
        this.blockIP(ip);
      }

      return true; // Account locked
    }

    return false;
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.ip;
  }

  /**
   * Sanitize headers for logging
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitive = ['authorization', 'cookie', 'x-api-key'];

    for (const key of sensitive) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Load threat patterns from configuration
   */
  loadThreatPatterns() {
    return {
      sqlInjection: {
        patterns: [],
        severity: 'CRITICAL'
      },
      xss: {
        patterns: [],
        severity: 'HIGH'
      },
      commandInjection: {
        patterns: [],
        severity: 'CRITICAL'
      }
    };
  }

  /**
   * Check if IP is blocked
   */
  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  /**
   * Check if user is blocked
   */
  isUserBlocked(userId) {
    return this.blockedUsers.has(userId);
  }
}

// Export singleton instance
export const threatDetector = new ThreatDetector();

// Export class for testing
export default ThreatDetector;