/**
 * Security Monitor Service
 *
 * Monitors security events and detects suspicious activity.
 *
 * Features:
 * - Failed login detection
 * - Brute force attack detection
 * - IP blocking for repeated violations
 * - Suspicious pattern detection
 * - Security alerts
 * - Threat intelligence
 *
 * Security:
 * - Real-time monitoring
 * - Automated IP blocking
 * - Alert notifications
 * - Audit integration
 */

const { PrismaClient } = require('@prisma/client');
const { logAudit, SEVERITY, STATUS } = require('../audit/AuditLogger');
const { SECURITY_ACTIONS } = require('../audit/AuditCategories');
const { getRedisClient } = require('../../middleware/rateLimiter');

const prisma = new PrismaClient();

/**
 * ============================================================================
 * CONFIGURATION
 * ============================================================================
 */

/**
 * Threat detection thresholds
 */
const THRESHOLDS = {
  FAILED_LOGIN_ATTEMPTS: 5, // Failed logins before alert
  FAILED_LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
  BRUTE_FORCE_ATTEMPTS: 10, // Attempts before blocking
  BRUTE_FORCE_WINDOW: 10 * 60 * 1000, // 10 minutes
  RATE_LIMIT_VIOLATIONS: 5, // Violations before blocking
  IP_BLOCK_DURATION: 60 * 60 * 1000, // 1 hour
};

/**
 * ============================================================================
 * FAILED LOGIN MONITORING
 * ============================================================================
 */

/**
 * Track failed login attempt
 *
 * @param {Object} data - Login attempt data
 * @returns {Promise<Object>} Monitoring result
 */
async function trackFailedLogin(data) {
  const { ipAddress, email, userId } = data;

  // Get recent failed attempts for this IP
  const recentAttempts = await getFailedLoginAttempts(ipAddress);

  // Check if threshold exceeded
  if (recentAttempts.length >= THRESHOLDS.FAILED_LOGIN_ATTEMPTS) {
    // Alert: Possible brute force attack
    await alertBruteForceAttempt(ipAddress, email, recentAttempts.length);

    // Check if should block IP
    if (recentAttempts.length >= THRESHOLDS.BRUTE_FORCE_ATTEMPTS) {
      await blockIP(ipAddress, 'Brute force attack detected');
    }
  }

  // Log failed attempt
  await logAudit({
    userId: userId || 'ANONYMOUS',
    action: SECURITY_ACTIONS.SUSPICIOUS_LOGIN_ATTEMPT,
    category: 'SECURITY',
    resourceType: 'AUTH',
    resourceId: email || 'UNKNOWN',
    status: STATUS.FAILURE,
    severity: SEVERITY.WARNING,
    ipAddress,
    metadata: {
      attemptCount: recentAttempts.length + 1,
    },
  });

  return {
    attempts: recentAttempts.length + 1,
    blocked: recentAttempts.length >= THRESHOLDS.BRUTE_FORCE_ATTEMPTS,
  };
}

/**
 * Get recent failed login attempts
 *
 * @param {string} ipAddress - IP address
 * @returns {Promise<Array>} Failed attempts
 */
async function getFailedLoginAttempts(ipAddress) {
  const windowStart = new Date(Date.now() - THRESHOLDS.FAILED_LOGIN_WINDOW);

  return prisma.auditLog.findMany({
    where: {
      ipAddress,
      action: {
        in: [
          SECURITY_ACTIONS.SUSPICIOUS_LOGIN_ATTEMPT,
          'LOGIN_FAILURE',
        ],
      },
      timestamp: {
        gte: windowStart,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });
}

/**
 * ============================================================================
 * BRUTE FORCE DETECTION
 * ============================================================================
 */

/**
 * Detect brute force attack
 *
 * @param {string} ipAddress - IP address
 * @returns {Promise<Object>} Detection result
 */
async function detectBruteForce(ipAddress) {
  const attempts = await getFailedLoginAttempts(ipAddress);

  const isBruteForce = attempts.length >= THRESHOLDS.BRUTE_FORCE_ATTEMPTS;

  if (isBruteForce) {
    await logAudit({
      userId: 'SYSTEM',
      action: SECURITY_ACTIONS.BRUTE_FORCE_DETECTED,
      category: 'SECURITY',
      resourceType: 'IP_ADDRESS',
      resourceId: ipAddress,
      status: STATUS.FAILURE,
      severity: SEVERITY.CRITICAL,
      ipAddress,
      metadata: {
        attemptCount: attempts.length,
        timeWindow: THRESHOLDS.BRUTE_FORCE_WINDOW,
      },
    });
  }

  return {
    detected: isBruteForce,
    attempts: attempts.length,
    threshold: THRESHOLDS.BRUTE_FORCE_ATTEMPTS,
  };
}

/**
 * Alert brute force attempt
 *
 * @param {string} ipAddress - IP address
 * @param {string} email - Target email
 * @param {number} attemptCount - Number of attempts
 */
async function alertBruteForceAttempt(ipAddress, email, attemptCount) {
  console.warn('⚠️ SECURITY ALERT: Brute force attempt detected');
  console.warn(`IP: ${ipAddress}`);
  console.warn(`Target: ${email || 'UNKNOWN'}`);
  console.warn(`Attempts: ${attemptCount}`);

  // TODO: Send email/SMS alert to security team
  // TODO: Integrate with security monitoring service (Sentry, DataDog, etc.)
}

/**
 * ============================================================================
 * IP BLOCKING
 * ============================================================================
 */

/**
 * Block IP address
 *
 * @param {string} ipAddress - IP to block
 * @param {string} reason - Block reason
 * @param {number} duration - Block duration (ms)
 * @returns {Promise<void>}
 */
async function blockIP(ipAddress, reason, duration = THRESHOLDS.IP_BLOCK_DURATION) {
  const redis = await getRedisClient();

  const blockKey = `blocked_ip:${ipAddress}`;
  const expiresAt = Date.now() + duration;

  // Store block in Redis
  await redis.set(blockKey, JSON.stringify({
    reason,
    blockedAt: Date.now(),
    expiresAt,
  }), {
    PX: duration, // Expiration in milliseconds
  });

  // Log IP block
  await logAudit({
    userId: 'SYSTEM',
    action: SECURITY_ACTIONS.IP_BLOCKED,
    category: 'SECURITY',
    resourceType: 'IP_ADDRESS',
    resourceId: ipAddress,
    status: STATUS.SUCCESS,
    severity: SEVERITY.CRITICAL,
    ipAddress,
    metadata: {
      reason,
      duration,
      expiresAt: new Date(expiresAt),
    },
  });

  console.warn(`🚫 IP blocked: ${ipAddress} (${reason})`);
}

/**
 * Unblock IP address
 *
 * @param {string} ipAddress - IP to unblock
 * @returns {Promise<void>}
 */
async function unblockIP(ipAddress) {
  const redis = await getRedisClient();

  const blockKey = `blocked_ip:${ipAddress}`;
  await redis.del(blockKey);

  // Log IP unblock
  await logAudit({
    userId: 'SYSTEM',
    action: SECURITY_ACTIONS.IP_UNBLOCKED,
    category: 'SECURITY',
    resourceType: 'IP_ADDRESS',
    resourceId: ipAddress,
    status: STATUS.SUCCESS,
    severity: SEVERITY.INFO,
    ipAddress,
  });

  console.log(`✅ IP unblocked: ${ipAddress}`);
}

/**
 * Check if IP is blocked
 *
 * @param {string} ipAddress - IP to check
 * @returns {Promise<Object>} Block status
 */
async function isIPBlocked(ipAddress) {
  const redis = await getRedisClient();

  const blockKey = `blocked_ip:${ipAddress}`;
  const blockData = await redis.get(blockKey);

  if (!blockData) {
    return { blocked: false };
  }

  const parsed = JSON.parse(blockData);

  return {
    blocked: true,
    reason: parsed.reason,
    blockedAt: new Date(parsed.blockedAt),
    expiresAt: new Date(parsed.expiresAt),
  };
}

/**
 * IP blocking middleware
 *
 * @returns {Function} Express middleware
 */
function ipBlockingMiddleware() {
  return async (req, res, next) => {
    const ipAddress = req.ip || req.connection.remoteAddress;

    const blockStatus = await isIPBlocked(ipAddress);

    if (blockStatus.blocked) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your IP address has been temporarily blocked due to suspicious activity',
        expiresAt: blockStatus.expiresAt,
      });
    }

    next();
  };
}

/**
 * ============================================================================
 * SUSPICIOUS PATTERN DETECTION
 * ============================================================================
 */

/**
 * Detect unusual access patterns
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Detection result
 */
async function detectUnusualAccessPattern(userId) {
  // Get user's recent access logs
  const recentLogs = await prisma.auditLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Detect unusual patterns
  const patterns = {
    multipleIPs: detectMultipleIPs(recentLogs),
    rapidActions: detectRapidActions(recentLogs),
    unusualTime: detectUnusualTime(recentLogs),
  };

  const suspicious = patterns.multipleIPs || patterns.rapidActions || patterns.unusualTime;

  if (suspicious) {
    await logAudit({
      userId,
      action: SECURITY_ACTIONS.UNUSUAL_ACCESS_PATTERN,
      category: 'SECURITY',
      resourceType: 'USER',
      resourceId: userId,
      status: STATUS.FAILURE,
      severity: SEVERITY.WARNING,
      metadata: patterns,
    });
  }

  return {
    suspicious,
    patterns,
  };
}

/**
 * Detect multiple IPs for same user
 *
 * @param {Array} logs - Audit logs
 * @returns {boolean} True if suspicious
 */
function detectMultipleIPs(logs) {
  const uniqueIPs = new Set(logs.map(log => log.ipAddress));
  return uniqueIPs.size > 5; // More than 5 different IPs in 24 hours
}

/**
 * Detect rapid actions
 *
 * @param {Array} logs - Audit logs
 * @returns {boolean} True if suspicious
 */
function detectRapidActions(logs) {
  if (logs.length < 2) return false;

  // Check for actions within 1 second
  for (let i = 0; i < logs.length - 1; i++) {
    const timeDiff = logs[i].timestamp - logs[i + 1].timestamp;
    if (timeDiff < 1000) {
      return true; // Actions less than 1 second apart
    }
  }

  return false;
}

/**
 * Detect unusual access time
 *
 * @param {Array} logs - Audit logs
 * @returns {boolean} True if suspicious
 */
function detectUnusualTime(logs) {
  const nightHours = logs.filter(log => {
    const hour = new Date(log.timestamp).getHours();
    return hour >= 0 && hour <= 5; // Between midnight and 5 AM
  });

  return nightHours.length > 10; // More than 10 actions during night
}

/**
 * ============================================================================
 * SECURITY METRICS
 * ============================================================================
 */

/**
 * Get security metrics
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Security metrics
 */
async function getSecurityMetrics(params = {}) {
  const { startDate, endDate } = params;

  const where = {
    category: 'SECURITY',
  };

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const [
    totalSecurityEvents,
    failedLogins,
    bruteForceAttempts,
    blockedIPs,
    csrfViolations,
    rateLimitViolations,
  ] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: { in: [SECURITY_ACTIONS.SUSPICIOUS_LOGIN_ATTEMPT, 'LOGIN_FAILURE'] },
      },
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: SECURITY_ACTIONS.BRUTE_FORCE_DETECTED,
      },
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: SECURITY_ACTIONS.IP_BLOCKED,
      },
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: SECURITY_ACTIONS.UNAUTHORIZED_ACCESS_ATTEMPT,
        resourceType: 'CSRF',
      },
    }),
    prisma.auditLog.count({
      where: {
        ...where,
        action: SECURITY_ACTIONS.RATE_LIMIT_EXCEEDED,
      },
    }),
  ]);

  return {
    totalSecurityEvents,
    failedLogins,
    bruteForceAttempts,
    blockedIPs,
    csrfViolations,
    rateLimitViolations,
  };
}

/**
 * ============================================================================
 * EXPORTS
 * ============================================================================
 */

module.exports = {
  // Failed login monitoring
  trackFailedLogin,
  getFailedLoginAttempts,

  // Brute force detection
  detectBruteForce,
  alertBruteForceAttempt,

  // IP blocking
  blockIP,
  unblockIP,
  isIPBlocked,
  ipBlockingMiddleware,

  // Pattern detection
  detectUnusualAccessPattern,

  // Metrics
  getSecurityMetrics,

  // Configuration
  THRESHOLDS,
};
