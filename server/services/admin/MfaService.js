/**
 * MFA (Multi-Factor Authentication) Service
 *
 * Provides TOTP-based MFA verification for admin operations
 * Uses speakeasy for TOTP generation and verification
 *
 * Features:
 * - TOTP code generation
 * - Code verification with time window tolerance
 * - Rate limiting (3 attempts per 5 minutes)
 * - QR code generation for authenticator apps
 *
 * @module services/admin/MfaService
 */

import speakeasy from 'speakeasy'
import logger from '../../utils/logger.js'
import prisma from '../../lib/prisma.js'

class MfaService {
  constructor() {
    this.rateLimits = new Map() // userId → { attempts: number, resetAt: Date }
    this.MAX_ATTEMPTS = 3
    this.RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes in milliseconds
    this.CODE_WINDOW = 2 // Allow 2 time steps before/after (±1 minute tolerance)
  }

  /**
   * Request MFA code for a specific action
   *
   * For TOTP method, this generates a secret and returns QR code
   * For email/SMS, this would trigger code delivery (future enhancement)
   *
   * @param {string} userId - User ID
   * @param {string} action - Action requiring MFA
   * @param {string} method - MFA method ('totp', 'email', 'sms')
   * @returns {Promise<Object>} MFA request result
   */
  async requestMFACode(userId, action, method = 'totp') {
    try {
      logger.info(`[MfaService] MFA code requested for user ${userId}, action: ${action}`)

      // Check rate limit
      if (!this.checkRateLimit(userId)) {
        logger.warn(`[MfaService] Rate limit exceeded for user ${userId}`)
        throw new Error('Too many MFA attempts. Please wait 5 minutes and try again.')
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      if (method === 'totp') {
        // Check if user already has TOTP secret
        if (user.twoFactorSecret) {
          logger.info(`[MfaService] User ${userId} already has TOTP secret configured`)
          return {
            success: true,
            method: 'totp',
            message: 'Use your authenticator app to generate the code',
          }
        }

        // Generate new TOTP secret
        const secret = speakeasy.generateSecret({
          name: `Sentia Admin (${user.email})`,
          issuer: 'Sentia Manufacturing',
          length: 32,
        })

        // Store secret in database
        await prisma.user.update({
          where: { id: userId },
          data: {
            twoFactorSecret: secret.base32,
            twoFactorEnabled: true,
          },
        })

        logger.info(`[MfaService] Generated TOTP secret for user ${userId}`)

        return {
          success: true,
          method: 'totp',
          secret: secret.base32,
          qrCode: secret.otpauth_url,
          message: 'Scan the QR code with your authenticator app',
        }
      }

      // Email/SMS methods (future enhancement)
      if (method === 'email' || method === 'sms') {
        logger.warn(`[MfaService] ${method.toUpperCase()} MFA not yet implemented`)

        // TODO: Integrate with email/SMS service
        // For now, log to console for development
        const code = this.generateFallbackCode()
        logger.info(`[MfaService] Fallback MFA code for ${userId}: ${code}`)

        return {
          success: true,
          method,
          message: `MFA code sent via ${method} (check server logs for development)`,
          devCode: process.env.NODE_ENV === 'development' ? code : undefined,
        }
      }

      throw new Error(`Unsupported MFA method: ${method}`)
    } catch (error) {
      logger.error('[MfaService] Error requesting MFA code:', error)
      throw error
    }
  }

  /**
   * Verify MFA code
   *
   * @param {string} userId - User ID
   * @param {string} code - MFA code to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyMFACode(userId, code) {
    try {
      // Check rate limit
      if (!this.checkRateLimit(userId)) {
        this.incrementAttempts(userId)
        logger.warn(`[MfaService] Rate limit exceeded for user ${userId}`)
        throw new Error('Too many MFA verification attempts. Please wait 5 minutes.')
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      })

      if (!user) {
        this.incrementAttempts(userId)
        throw new Error('User not found')
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new Error('MFA is not enabled for this user. Please set up MFA first.')
      }

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: this.CODE_WINDOW, // ±1 minute tolerance
      })

      if (verified) {
        // Clear rate limit on successful verification
        this.clearAttempts(userId)

        logger.info(`[MfaService] MFA verification successful for user ${userId}`)

        return {
          verified: true,
          token: this.generateVerificationToken(userId),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        }
      }

      // Increment failed attempts
      this.incrementAttempts(userId)

      logger.warn(`[MfaService] Invalid MFA code for user ${userId}`)
      throw new Error('Invalid MFA code. Please try again.')
    } catch (error) {
      logger.error('[MfaService] Error verifying MFA code:', error)
      throw error
    }
  }

  /**
   * Check if user has exceeded rate limit
   *
   * @param {string} userId - User ID
   * @returns {boolean} True if within rate limit
   */
  checkRateLimit(userId) {
    const limit = this.rateLimits.get(userId)

    if (!limit) {
      return true // No limit set yet
    }

    const now = new Date()

    // Reset if time window has passed
    if (now > limit.resetAt) {
      this.rateLimits.delete(userId)
      return true
    }

    // Check if attempts exceeded
    return limit.attempts < this.MAX_ATTEMPTS
  }

  /**
   * Increment failed attempts for rate limiting
   *
   * @param {string} userId - User ID
   */
  incrementAttempts(userId) {
    const limit = this.rateLimits.get(userId)

    if (!limit) {
      this.rateLimits.set(userId, {
        attempts: 1,
        resetAt: new Date(Date.now() + this.RATE_LIMIT_WINDOW),
      })
    } else {
      limit.attempts += 1
    }

    logger.warn(`[MfaService] User ${userId} failed attempts: ${this.rateLimits.get(userId).attempts}`)
  }

  /**
   * Clear failed attempts (after successful verification)
   *
   * @param {string} userId - User ID
   */
  clearAttempts(userId) {
    this.rateLimits.delete(userId)
    logger.info(`[MfaService] Cleared rate limit for user ${userId}`)
  }

  /**
   * Generate verification token
   *
   * @param {string} userId - User ID
   * @returns {string} Verification token
   */
  generateVerificationToken(userId) {
    // Simple token for this session (could use JWT for production)
    const timestamp = Date.now()
    const payload = `${userId}:${timestamp}`
    return Buffer.from(payload).toString('base64')
  }

  /**
   * Generate fallback code for email/SMS (development only)
   *
   * @private
   * @returns {string} 6-digit code
   */
  generateFallbackCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Disable MFA for a user (admin operation)
   *
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async disableMFA(userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      })

      logger.info(`[MfaService] MFA disabled for user ${userId}`)

      return {
        success: true,
        message: 'MFA has been disabled',
      }
    } catch (error) {
      logger.error('[MfaService] Error disabling MFA:', error)
      throw error
    }
  }

  /**
   * Get MFA status for a user
   *
   * @param {string} userId - User ID
   * @returns {Promise<Object>} MFA status
   */
  async getMFAStatus(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          twoFactorEnabled: true,
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      return {
        enabled: user.twoFactorEnabled,
        method: user.twoFactorEnabled ? 'totp' : null,
      }
    } catch (error) {
      logger.error('[MfaService] Error getting MFA status:', error)
      throw error
    }
  }

  /**
   * Clear all rate limits (maintenance operation)
   */
  clearAllRateLimits() {
    this.rateLimits.clear()
    logger.info('[MfaService] All rate limits cleared')
  }
}

// Export singleton instance
export default new MfaService()
