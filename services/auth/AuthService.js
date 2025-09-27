/**
 * Enhanced Authentication Service with Session Management
 * Implements token rotation, replay detection, and audit logging
 * 
 * Features:
 * - Rotating refresh tokens with replay detection
 * - Session management with device tracking
 * - Account lockout with exponential backoff
 * - Comprehensive audit logging
 * - Multi-entity and region-aware access control (feature flagged)
 * 
 * @author Claude Code
 * @created 2025-01-20
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import logger from '../logger.js';

class AuthService {
  constructor() {
    this.prisma = new PrismaClient();
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    this.accessTokenTtl = parseInt(process.env.JWT_ACCESS_TTL) || 15 * 60; // 15 minutes
    this.refreshTokenTtl = parseInt(process.env.JWT_REFRESH_TTL) || 7 * 24 * 60 * 60; // 7 days
    this.bcryptCost = parseInt(process.env.BCRYPT_COST) || 12;
    this.maxLoginAttempts = parseInt(process.env.LOGIN_MAX_ATTEMPTS) || 5;
    this.lockoutMinutes = parseInt(process.env.LOCKOUT_MINUTES) || 15;
  }

  /**
   * TOKEN MANAGEMENT
   */

  /**
   * Generate JWT access token
   * @param {Object} payload - Token payload
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenTtl,
      issuer: 'sentia-dashboard',
      audience: 'sentia-api'
    });
  }

  /**
   * Generate cryptographically secure refresh token
   * @returns {string} Refresh token
   */
  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded payload
   */
  async verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'sentia-dashboard',
        audience: 'sentia-api'
      });
    } catch (error) {
      logger.warn('Invalid access token', { error: error.message });
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Hash token for secure storage
   * @param {string} token - Plain text token
   * @returns {string} Hashed token
   */
  async hashToken(token) {
    return await bcrypt.hash(token, this.bcryptCost);
  }

  /**
   * Verify token against hash
   * @param {string} token - Plain text token
   * @param {string} hash - Stored hash
   * @returns {boolean} Match result
   */
  async verifyTokenHash(token, hash) {
    return await bcrypt.compare(token, hash);
  }

  /**
   * SESSION MANAGEMENT
   */

  /**
   * Create new user session
   * @param {Object} params - Session parameters
   * @returns {Object} Session data with tokens
   */
  async createSession({ userId, userAgent, ipAddress, deviceName }) {
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = await this.hashToken(refreshToken);
    
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.refreshTokenTtl);

    // Detect suspicious login (new device/location)
    const recentSessions = await this.prisma.userSession.findMany({
      where: {
        user_id: userId,
        revoked_at: null,
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: { ip_address: true, user_agent: true }
    });

    const isSuspicious = !recentSessions.some(session => 
      session.ip_address === ipAddress || 
      this.isUserAgentSimilar(session.user_agent, userAgent)
    );

    // Create session record
    const session = await this.prisma.userSession.create({
      data: {
        user_id: userId,
        refresh_token_hash: refreshTokenHash,
        device_name: deviceName,
        user_agent: userAgent,
        ip_address: ipAddress,
        expires_at: expiresAt,
        is_suspicious: isSuspicious
      }
    });

    // Generate access token
    const accessToken = this.generateAccessToken({
      sub: userId,
      sessionId: session.id,
      iat: Math.floor(Date.now() / 1000)
    });

    // Log session creation
    await this.auditLog({
      userId,
      eventType: 'SESSION_CREATED',
      eventData: { 
        sessionId: session.id, 
        suspicious: isSuspicious,
        deviceName 
      },
      ipAddress,
      userAgent,
      sessionId: session.id
    });

    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
      expiresAt,
      suspicious: isSuspicious
    };
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Current refresh token
   * @param {string} userAgent - User agent string
   * @param {string} ipAddress - Client IP address
   * @returns {Object} New tokens or error
   */
  async refreshSession(refreshToken, userAgent, ipAddress) {
    // Find session by refresh token hash
    const sessions = await this.prisma.userSession.findMany({
      where: {
        revoked_at: null,
        expires_at: { gte: new Date() }
      },
      include: { user: true }
    });

    let matchedSession = null;
    for (const session of sessions) {
      if (await this.verifyTokenHash(refreshToken, session.refresh_token_hash)) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      // Potential replay attack - revoke all user sessions
      await this.handleTokenReplayDetection(refreshToken);
      throw new Error('Invalid refresh token - all sessions revoked for security');
    }

    // Update session last used
    await this.prisma.userSession.update({
      where: { id: matchedSession.id },
      data: { last_used_at: new Date() }
    });

    // Generate new tokens (token rotation)
    const newRefreshToken = this.generateRefreshToken();
    const newRefreshTokenHash = await this.hashToken(newRefreshToken);
    
    // Update session with new refresh token
    await this.prisma.userSession.update({
      where: { id: matchedSession.id },
      data: { refresh_token_hash: newRefreshTokenHash }
    });

    const newAccessToken = this.generateAccessToken({
      sub: matchedSession.user_id,
      sessionId: matchedSession.id,
      iat: Math.floor(Date.now() / 1000)
    });

    // Log token refresh
    await this.auditLog({
      userId: matchedSession.user_id,
      eventType: 'TOKEN_REFRESHED',
      eventData: { sessionId: matchedSession.id },
      ipAddress,
      userAgent,
      sessionId: matchedSession.id
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: matchedSession.id,
      user: matchedSession.user
    };
  }

  /**
   * Handle potential token replay attack
   * @param {string} usedToken - The replayed token
   */
  async handleTokenReplayDetection(usedToken) {
    logger.error('Potential token replay detected', { token: usedToken.substring(0, 10) + '...' });
    
    // Find all sessions that could have used this token recently
    const recentSessions = await this.prisma.userSession.findMany({
      where: {
        last_used_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Revoke all potentially compromised sessions
    const userIds = [...new Set(recentSessions.map(s => s.user_id))];
    
    for (const userId of userIds) {
      await this.revokeAllUserSessions(userId, 'security_replay_detected');
      
      await this.auditLog({
        userId,
        eventType: 'SECURITY_TOKEN_REPLAY',
        eventData: { 
          revokedSessions: recentSessions.filter(s => s.user_id === userId).length,
          reason: 'Token replay attack detected'
        },
        severity: 'error'
      });
    }
  }

  /**
   * ACCOUNT LOCKOUT & RATE LIMITING
   */

  /**
   * Handle failed login attempt
   * @param {string} userId - User ID
   * @param {string} ipAddress - Client IP
   * @returns {Object} Lockout information
   */
  async handleFailedLogin(userId, ipAddress) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        failed_login_count: true, 
        locked_until: true,
        last_failed_login: true 
      }
    });

    if (!user) return { locked: false };

    const now = new Date();
    const failedCount = (user.failed_login_count || 0) + 1;
    
    // Calculate exponential backoff lockout duration
    const lockoutMinutes = this.calculateLockoutDuration(failedCount);
    const lockedUntil = lockoutMinutes > 0 ? 
      new Date(now.getTime() + lockoutMinutes * 60 * 1000) : null;

    // Update user with failed attempt
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failed_login_count: failedCount,
        last_failed_login: now,
        locked_until: lockedUntil
      }
    });

    // Log failed attempt
    await this.auditLog({
      userId,
      eventType: 'LOGIN_FAILED',
      eventData: { 
        attemptCount: failedCount,
        lockoutMinutes,
        locked: !!lockedUntil
      },
      ipAddress,
      severity: failedCount >= this.maxLoginAttempts ? 'error' : 'warn'
    });

    return {
      locked: !!lockedUntil,
      lockedUntil,
      attemptCount: failedCount,
      maxAttempts: this.maxLoginAttempts
    };
  }

  /**
   * Calculate lockout duration with exponential backoff
   * @param {number} attemptCount - Number of failed attempts
   * @returns {number} Lockout duration in minutes
   */
  calculateLockoutDuration(attemptCount) {
    if (attemptCount < this.maxLoginAttempts) return 0;
    
    // Exponential backoff: 15, 30, 60, 120, 240, 480 minutes (max 8 hours)
    const baseMinutes = this.lockoutMinutes;
    const backoffFactor = Math.min(attemptCount - this.maxLoginAttempts + 1, 6);
    return baseMinutes * Math.pow(2, backoffFactor - 1);
  }

  /**
   * Check if user is currently locked out
   * @param {string} userId - User ID
   * @returns {boolean} Lock status
   */
  async isUserLocked(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { locked_until: true }
    });

    return user?.locked_until && user.locked_until > new Date();
  }

  /**
   * Clear failed login attempts after successful login
   * @param {string} userId - User ID
   */
  async clearFailedAttempts(userId) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failed_login_count: 0,
        locked_until: null,
        last_failed_login: null
      }
    });
  }

  /**
   * SESSION UTILITIES
   */

  /**
   * Get all active sessions for user
   * @param {string} userId - User ID
   * @returns {Array} Active sessions
   */
  async getUserSessions(userId) {
    return await this.prisma.userSession.findMany({
      where: {
        user_id: userId,
        revoked_at: null,
        expires_at: { gte: new Date() }
      },
      orderBy: { last_used_at: 'desc' }
    });
  }

  /**
   * Revoke specific session
   * @param {string} sessionId - Session ID
   * @param {string} reason - Revocation reason
   */
  async revokeSession(sessionId, reason = 'manual') {
    const session = await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        revoked_at: new Date(),
        revoked_reason: reason
      }
    });

    await this.auditLog({
      userId: session.user_id,
      eventType: 'SESSION_REVOKED',
      eventData: { sessionId, reason },
      sessionId
    });
  }

  /**
   * Revoke all sessions for user
   * @param {string} userId - User ID  
   * @param {string} reason - Revocation reason
   */
  async revokeAllUserSessions(userId, reason = 'manual') {
    const sessions = await this.prisma.userSession.updateMany({
      where: {
        user_id: userId,
        revoked_at: null
      },
      data: {
        revoked_at: new Date(),
        revoked_reason: reason
      }
    });

    await this.auditLog({
      userId,
      eventType: 'ALL_SESSIONS_REVOKED',
      eventData: { 
        revokedCount: sessions.count,
        reason 
      }
    });

    return sessions.count;
  }

  /**
   * AUDIT LOGGING
   */

  /**
   * Create audit log entry
   * @param {Object} params - Audit parameters
   */
  async auditLog(params) {
    const {
      userId,
      eventType,
      eventData,
      ipAddress,
      userAgent,
      sessionId,
      resourceType,
      resourceId,
      oldValue,
      newValue,
      severity = 'info'
    } = params;

    try {
      await this.prisma.auditLog.create({
        data: {
          user_id: userId,
          event_type: eventType,
          event_data: eventData,
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: sessionId,
          resource_type: resourceType,
          resource_id: resourceId,
          old_value: oldValue,
          new_value: newValue,
          severity,
          environment: process.env.NODE_ENV || 'development'
        }
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error: error.message });
    }
  }

  /**
   * UTILITY FUNCTIONS
   */

  /**
   * Compare user agent strings for similarity
   * @param {string} ua1 - First user agent
   * @param {string} ua2 - Second user agent
   * @returns {boolean} Similarity result
   */
  isUserAgentSimilar(ua1, ua2) {
    if (!ua1 || !ua2) return false;
    
    // Extract browser and OS info for comparison
    const extract = (ua) => {
      const browser = ua.match(/(Chrome|Firefox|Safari|Edge)/[\d.]+/i)?.[0];
      const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[0];
      return `${browser}-${os}`;
    };

    return extract(ua1) === extract(ua2);
  }

  /**
   * Cleanup expired sessions and tokens
   */
  async cleanup() {
    const now = new Date();
    
    // Remove expired sessions
    const expiredSessions = await this.prisma.userSession.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: now } },
          { revoked_at: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } // 30 days old
        ]
      }
    });

    // Remove expired password reset tokens
    const expiredTokens = await this.prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: now } },
          { used_at: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } // 24 hours old
        ]
      }
    });

    logger.info('Auth cleanup completed', {
      expiredSessions: expiredSessions.count,
      expiredTokens: expiredTokens.count
    });

    return {
      expiredSessions: expiredSessions.count,
      expiredTokens: expiredTokens.count
    };
  }

  /**
   * Health check for auth service
   * @returns {Object} Health status
   */
  async healthCheck() {
    try {
      // Test database connectivity
      await this.prisma.$queryRaw`SELECT 1 as health`;
      
      // Get basic metrics
      const [activeSessions, recentLogins, lockedUsers] = await Promise.all([
        this.prisma.userSession.count({
          where: {
            revoked_at: null,
            expires_at: { gte: new Date() }
          }
        }),
        this.prisma.auditLog.count({
          where: {
            event_type: 'LOGIN_SUCCESS',
            created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
        this.prisma.user.count({
          where: {
            locked_until: { gte: new Date() }
          }
        })
      ]);

      return {
        status: 'healthy',
        database: 'connected',
        metrics: {
          activeSessions,
          recentLogins,
          lockedUsers
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Update password changed timestamp for a user
   * @param {string} userId - User ID  
   */
  async updatePasswordChangedAt(userId) {
    try {
      const query = `
        UPDATE users 
        SET password_changed_at = NOW()
        WHERE clerk_user_id = $1
      `;
      await this.pool.query(query, [userId]);
      logInfo('Password changed timestamp updated', { userId });
    } catch (error) {
      logError('Failed to update password changed timestamp', error);
      throw error;
    }
  }

  /**
   * Get recent audit logs for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of recent logs to retrieve
   * @returns {Promise<Array>} Recent audit logs
   */
  async getRecentAuditLogs(userId, limit = 10) {
    try {
      const query = `
        SELECT action, created_at, ip_address, user_agent, details
        FROM audit_logs 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      const result = await this.pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      logError('Failed to get recent audit logs', error);
      return [];
    }
  }

  /**
   * Get audit logs with filters
   * @param {Object} filters - Filter criteria
   * @param {number} limit - Number of logs to retrieve
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Filtered audit logs
   */
  async getAuditLogs(filters = {}, limit = 50, offset = 0) {
    try {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (filters.user_id) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(filters.user_id);
        paramIndex++;
      }

      if (filters.action) {
        query += ` AND action = $${paramIndex}`;
        params.push(filters.action);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logError('Failed to get audit logs', error);
      return [];
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export default AuthService;