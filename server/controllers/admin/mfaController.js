/**
 * MFA Controller
 *
 * Handles HTTP requests for Multi-Factor Authentication (MFA) verification
 *
 * Endpoints:
 * - POST /admin/mfa/request - Request MFA code (TOTP setup or email/SMS delivery)
 * - POST /admin/mfa/verify - Verify MFA code
 *
 * @module controllers/admin/mfaController
 */

import MfaService from '../../services/admin/MfaService.js'
import logger from '../../utils/logger.js'

/**
 * Request MFA code
 *
 * POST /admin/mfa/request
 *
 * Body:
 * - action: Action requiring MFA (e.g., 'approve_request', 'toggle_feature_flag')
 * - method: MFA method ('totp', 'email', 'sms') - default: 'totp'
 *
 * Response:
 * - For TOTP (first-time setup): Returns QR code URL and secret
 * - For TOTP (existing): Instructs user to use authenticator app
 * - For email/SMS: Confirms code sent (development stub)
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function requestMFACode(req, res) {
  try {
    const { action, method = 'totp' } = req.body

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action parameter is required',
      })
    }

    // Get user ID from authenticated user
    const userId = req.user?.id || req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const result = await MfaService.requestMFACode(userId, action, method)

    logger.info(
      `[MfaController] MFA code requested for user ${userId}, action: ${action}, method: ${method}`
    )

    // For TOTP first-time setup, return QR code
    if (result.qrCode) {
      return res.json({
        success: true,
        method: result.method,
        qrCode: result.qrCode,
        secret: result.secret, // Base32 secret for manual entry
        message: result.message,
      })
    }

    // For existing TOTP or email/SMS
    res.json({
      success: true,
      method: result.method,
      message: result.message,
      // Include devCode only in development for email/SMS testing
      ...(result.devCode && { devCode: result.devCode }),
    })
  } catch (error) {
    logger.error('[MfaController] Error requesting MFA code:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to request MFA code',
      error: error.message,
    })
  }
}

/**
 * Verify MFA code
 *
 * POST /admin/mfa/verify
 *
 * Body:
 * - code: 6-digit MFA code
 *
 * Response:
 * - verified: Boolean indicating success
 * - token: Verification token (15-minute validity)
 * - expiresAt: Token expiration timestamp
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function verifyMFACode(req, res) {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'MFA code is required',
      })
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid MFA code format. Must be 6 digits.',
      })
    }

    // Get user ID from authenticated user
    const userId = req.user?.id || req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const result = await MfaService.verifyMFACode(userId, code)

    // Set MFA verification in session
    if (req.session) {
      req.session.mfaVerified = true
      req.session.mfaVerifiedAt = new Date()
      req.session.mfaToken = result.token
    }

    // Also set in user object for immediate use
    if (req.user) {
      req.user.mfaVerified = true
    }

    logger.info(`[MfaController] MFA code verified successfully for user ${userId}`)

    res.json({
      success: true,
      verified: result.verified,
      token: result.token,
      expiresAt: result.expiresAt,
      message: 'MFA verification successful. You can now proceed with admin operations.',
    })
  } catch (error) {
    logger.error('[MfaController] Error verifying MFA code:', error)
    res.status(401).json({
      success: false,
      verified: false,
      message: error.message || 'MFA verification failed',
      error: error.message,
    })
  }
}
