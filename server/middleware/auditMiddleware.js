/**
 * Audit Middleware - Stub for Integration Tests
 *
 * Minimal audit logging middleware for testing purposes.
 */

import { logInfo } from '../../services/observability/structuredLogger.js'

export default function auditMiddleware(req, res, next) {
  // Log sensitive operations for audit trail
  const auditEvent = {
    userId: req.user?.id,
    action: `${req.method} ${req.path}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  }

  // In production, save to audit log table
  if (process.env.NODE_ENV !== 'test') {
    logInfo('Audit event', auditEvent)
  }

  next()
}
