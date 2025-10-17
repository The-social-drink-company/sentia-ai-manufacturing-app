import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

class EnterpriseSecurityManager {
  constructor(config = {}) {
    this.jwtSecret = config.jwtSecret || process.env.JWT_SECRET || 'sentia-enterprise-secret-2025'
    this.mfaEnabled = config.mfaEnabled !== false
    this.sessionTimeout = config.sessionTimeout || 3600000 // 1 hour default
    this.maxFailedAttempts = config.maxFailedAttempts || 5
    this.lockoutDuration = config.lockoutDuration || 900000 // 15 minutes

    // In-memory stores (in production, use Redis or database)
    this.failedAttempts = new Map()
    this.mfaSecrets = new Map()
    this.sessions = new Map()
    this.auditLog = []
  }

  // Role-Based Access Control (RBAC)
  roles = {
    superadmin: {
      level: 100,
      permissions: ['*'], // All permissions
      description: 'Full system access',
    },
    admin: {
      level: 90,
      permissions: [
        'users.read',
        'users.write',
        'users.delete',
        'settings.read',
        'settings.write',
        'reports.read',
        'reports.write',
        'integrations.manage',
        'security.view',
      ],
      description: 'Administrative access',
    },
    manager: {
      level: 70,
      permissions: [
        'dashboard.read',
        'dashboard.write',
        'reports.read',
        'reports.write',
        'forecasting.read',
        'forecasting.write',
        'inventory.read',
        'inventory.write',
        'financial.read',
        'financial.write',
        'users.read',
      ],
      description: 'Managerial access',
    },
    analyst: {
      level: 50,
      permissions: [
        'dashboard.read',
        'reports.read',
        'forecasting.read',
        'inventory.read',
        'financial.read',
        'analytics.read',
      ],
      description: 'Analytical read access',
    },
    operator: {
      level: 30,
      permissions: [
        'dashboard.read',
        'inventory.read',
        'inventory.write',
        'production.read',
        'production.write',
        'quality.read',
        'quality.write',
      ],
      description: 'Operational access',
    },
    viewer: {
      level: 10,
      permissions: ['dashboard.read', 'reports.read'],
      description: 'Read-only access',
    },
  }

  // Check if user has required permission
  hasPermission(userRole, requiredPermission) {
    const role = this.roles[userRole]
    if (!role) return false

    // Superadmin has all permissions
    if (role.permissions.includes('*')) return true

    // Check specific permission
    return role.permissions.includes(requiredPermission)
  }

  // Check if user has required role level
  hasRoleLevel(userRole, requiredLevel) {
    const role = this.roles[userRole]
    if (!role) return false
    return role.level >= requiredLevel
  }

  // Multi-Factor Authentication (MFA)
  generateMFASecret(userId, appName = 'Sentia Manufacturing') {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${userId})`,
      length: 32,
    })

    this.mfaSecrets.set(userId, secret.base32)

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      manualEntry: secret.base32,
    }
  }

  async generateMFAQRCode(userId) {
    const secret = this.mfaSecrets.get(userId)
    if (!secret) {
      throw new Error('MFA not set up for this user')
    }

    const otpauth = speakeasy.otpauthURL({
      secret: secret,
      label: `Sentia:${userId}`,
      issuer: 'Sentia Manufacturing',
      encoding: 'base32',
    })

    try {
      const qrCode = await QRCode.toDataURL(otpauth)
      return qrCode
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw error
    }
  }

  verifyMFAToken(userId, token) {
    const secret = this.mfaSecrets.get(userId)
    if (!secret) {
      return false
    }

    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps tolerance
    })
  }

  // Session Management
  createSession(userId, userRole, mfaVerified = false) {
    const sessionId = crypto.randomBytes(32).toString('hex')
    const session = {
      userId,
      userRole,
      mfaVerified,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress: null,
      userAgent: null,
    }

    this.sessions.set(sessionId, session)

    // Create JWT token
    const token = jwt.sign(
      {
        sessionId,
        userId,
        userRole,
        mfaVerified,
      },
      this.jwtSecret,
      {
        expiresIn: '24h',
      }
    )

    this.auditLog.push({
      type: 'SESSION_CREATED',
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
    })

    return { sessionId, token }
  }

  validateSession(sessionId) {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // Check session timeout
    if (Date.now() - session.lastActivity > this.sessionTimeout) {
      this.sessions.delete(sessionId)
      this.auditLog.push({
        type: 'SESSION_TIMEOUT',
        userId: session.userId,
        sessionId,
        timestamp: new Date().toISOString(),
      })
      return null
    }

    // Update last activity
    session.lastActivity = Date.now()
    return session
  }

  // Brute Force Protection
  recordFailedAttempt(identifier) {
    const attempts = this.failedAttempts.get(identifier) || {
      count: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
    }

    attempts.count++
    attempts.lastAttempt = Date.now()

    this.failedAttempts.set(identifier, attempts)

    if (attempts.count >= this.maxFailedAttempts) {
      this.auditLog.push({
        type: 'ACCOUNT_LOCKED',
        identifier,
        attempts: attempts.count,
        timestamp: new Date().toISOString(),
      })
    }

    return attempts.count >= this.maxFailedAttempts
  }

  isLockedOut(identifier) {
    const attempts = this.failedAttempts.get(identifier)
    if (!attempts) return false

    if (attempts.count < this.maxFailedAttempts) return false

    const timeSinceLock = Date.now() - attempts.lastAttempt
    if (timeSinceLock > this.lockoutDuration) {
      this.failedAttempts.delete(identifier)
      return false
    }

    return true
  }

  clearFailedAttempts(identifier) {
    this.failedAttempts.delete(identifier)
  }

  // Audit Logging
  logSecurityEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString(),
      id: crypto.randomBytes(16).toString('hex'),
    }

    this.auditLog.push(event)

    // In production, persist to database
    console.log('[SECURITY AUDIT]', JSON.stringify(event))

    return event
  }

  getAuditLog(filters = {}) {
    let logs = [...this.auditLog]

    if (filters.userId) {
      logs = logs.filter(
        log => log.userId === filters.userId || log.data?.userId === filters.userId
      )
    }

    if (filters.type) {
      logs = logs.filter(log => log.type === filters.type)
    }

    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate))
    }

    if (filters.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate))
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  // Password Policy
  validatePassword(password) {
    const minLength = 12
    const requireUppercase = true
    const requireLowercase = true
    const requireNumbers = true
    const requireSpecial = true

    const errors = []

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`)
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters')
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters')
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain numbers')
    }

    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain special characters')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // Security Headers Middleware
  securityHeaders() {
    return (req, res, next) => {
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('X-XSS-Protection', '1; mode=block')
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

      // Remove sensitive headers
      res.removeHeader('X-Powered-By')

      next()
    }
  }

  // Authorization Middleware
  authorize(requiredPermission) {
    return (req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '')

      if (!token) {
        return res.status(401).json({ error: 'No authorization token provided' })
      }

      try {
        const decoded = jwt.verify(token, this.jwtSecret)
        const session = this.validateSession(decoded.sessionId)

        if (!session) {
          return res.status(401).json({ error: 'Invalid or expired session' })
        }

        if (requiredPermission && !this.hasPermission(session.userRole, requiredPermission)) {
          this.logSecurityEvent('UNAUTHORIZED_ACCESS', {
            userId: session.userId,
            permission: requiredPermission,
            role: session.userRole,
          })

          return res.status(403).json({ error: 'Insufficient permissions' })
        }

        req.user = {
          id: session.userId,
          role: session.userRole,
          mfaVerified: session.mfaVerified,
        }

        next()
      } catch {
        return res.status(401).json({ error: 'Invalid token' })
      }
    }
  }
}

export default EnterpriseSecurityManager
