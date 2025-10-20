/**
 * MFA Middleware - Stub for Integration Tests
 *
 * Minimal MFA verification middleware for testing purposes.
 */

export default function mfaMiddleware(req, res, next) {
  // In test environment, skip MFA verification
  if (process.env.NODE_ENV === 'test') {
    return next()
  }

  // In production, verify MFA if user has it enabled
  if (req.user?.mfaEnabled && !req.session?.mfaVerifiedAt) {
    return res.status(403).json({
      success: false,
      error: 'mfa_required',
      message: 'MFA verification required'
    })
  }

  next()
}
