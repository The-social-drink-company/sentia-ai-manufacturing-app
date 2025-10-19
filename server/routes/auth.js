import express from 'express'

import { verifyUserCredentials, initializeDefaultUsers } from '../../lib/user-service.js'
import { logInfo, logError, logWarn } from '../../services/observability/structuredLogger.js'
import authMiddleware from '../middleware/authMiddleware.js'
import mfaMiddleware from '../middleware/mfaMiddleware.js'
// import sessionMiddleware from '../middleware/sessionMiddleware.js' // TODO: Implement session validation endpoints
import auditMiddleware from '../middleware/auditMiddleware.js'

const router = express.Router()

// Initialize default users on server startup
;(async () => {
  try {
    await initializeDefaultUsers()
    logInfo('Default users initialized')
  } catch (error) {
    logError('Failed to initialize default users', error)
  }
})()

// Sign in endpoint
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      logWarn('Sign in attempt with missing credentials')
      return res.status(400).json({ error: 'Email and password are required' })
    }

    logInfo('Sign in attempt', { email })
    const user = await verifyUserCredentials(email, password)

    if (user) {
      // Create session token (in production, use JWT or proper session management)
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36)}`

      logInfo('Successful sign in', { userId: user.id, email: user.email })

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: sessionToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
    } else {
      logWarn('Failed sign in attempt', { email })
      res.status(401).json({ error: 'Invalid email or password' })
    }
  } catch (error) {
    logError('Sign in error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sign out endpoint
router.post('/signout', (req, res) => {
  try {
    logInfo('User signed out')
    res.json({ message: 'Signed out successfully' })
  } catch (error) {
    logError('Sign out error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Session verification endpoint
router.get('/session', (req, res) => {
  try {
    // In production, verify JWT token and return user data
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      res.json({
        user: {
          id: 'dev-user',
          name: 'Development User',
          email: 'dev@sentia.com',
          role: 'admin',
        },
      })
    } else {
      res.status(401).json({ error: 'Session verification not implemented' })
    }
  } catch (error) {
    logError('Session verification error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { user } = req
    res.json({
      success: true,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        mfaEnabled: user.mfaEnabled,
        isApproved: user.isApproved,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    logError('Failed to fetch user profile', error)
    res.status(500).json({ success: false, error: 'Failed to fetch user profile' })
  }
})

/**
 * POST /api/auth/mfa/setup
 * Initialize MFA setup for authenticated user
 */
router.post('/mfa/setup', authMiddleware, async (req, res) => {
  try {
    const { prisma } = req.app.locals
    const speakeasy = await import('speakeasy')
    const QRCode = await import('qrcode')

    // Generate secret
    const secret = speakeasy.default.generateSecret({
      name: `Sentia Manufacturing (${req.user.email})`,
      length: 32,
    })

    // Generate 10 backup codes
    const backupCodes = []
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      backupCodes.push(code)
    }

    // Hash backup codes before storing
    const bcrypt = await import('bcrypt')
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.default.hash(code, 10))
    )

    // Store secret (not enabled yet - requires verification first)
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        mfaSecret: secret.base32,
        mfaBackupCodes: hashedBackupCodes,
      },
    })

    // Generate QR code
    const qrCodeDataUrl = await QRCode.default.toDataURL(secret.otpauth_url)

    logInfo('MFA setup initiated', { userId: req.user.id })

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      backupCodes, // Show once, never again
    })
  } catch (error) {
    logError('MFA setup error', error)
    res.status(500).json({ success: false, error: 'Failed to setup MFA' })
  }
})

/**
 * POST /api/auth/mfa/verify
 * Verify MFA code and enable MFA
 */
router.post('/mfa/verify', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body
    const { prisma } = req.app.locals
    const speakeasy = await import('speakeasy')

    if (!code) {
      return res.status(400).json({ success: false, error: 'MFA code is required' })
    }

    // Get user with secret
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { mfaSecret: true, mfaEnabled: true },
    })

    if (!user?.mfaSecret) {
      return res.status(400).json({ success: false, error: 'MFA not setup. Call /mfa/setup first' })
    }

    // Verify TOTP token
    const verified = speakeasy.default.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps before/after
    })

    if (!verified) {
      logWarn('Invalid MFA code attempt', { userId: req.user.id })
      return res.status(400).json({ success: false, error: 'Invalid MFA code' })
    }

    // Enable MFA
    await prisma.user.update({
      where: { id: req.user.id },
      data: { mfaEnabled: true },
    })

    // Mark MFA verified in session if exists
    if (req.session) {
      await prisma.session.update({
        where: { id: req.session.id },
        data: { mfaVerifiedAt: new Date() },
      })
    }

    logInfo('MFA enabled successfully', { userId: req.user.id })

    res.json({ success: true, message: 'MFA enabled successfully' })
  } catch (error) {
    logError('MFA verification error', error)
    res.status(500).json({ success: false, error: 'Failed to verify MFA' })
  }
})

/**
 * POST /api/auth/mfa/disable
 * Disable MFA (requires step-up authentication)
 */
router.post('/mfa/disable', authMiddleware, mfaMiddleware, auditMiddleware, async (req, res) => {
  try {
    const { code } = req.body
    const { prisma } = req.app.locals

    if (!code) {
      return res.status(400).json({ success: false, error: 'MFA code required to disable MFA' })
    }

    // Verify code one last time before disabling
    const speakeasy = await import('speakeasy')
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { mfaSecret: true },
    })

    const verified = speakeasy.default.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    })

    if (!verified) {
      return res.status(400).json({ success: false, error: 'Invalid MFA code' })
    }

    // Disable MFA
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      },
    })

    logInfo('MFA disabled', { userId: req.user.id })

    res.json({ success: true, message: 'MFA disabled successfully' })
  } catch (error) {
    logError('MFA disable error', error)
    res.status(500).json({ success: false, error: 'Failed to disable MFA' })
  }
})

/**
 * GET /api/auth/sessions
 * Get all active sessions for current user
 */
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const { prisma } = req.app.locals

    const sessions = await prisma.session.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        sessionToken: true,
        ipAddress: true,
        userAgent: true,
        lastActivityAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { lastActivityAt: 'desc' },
    })

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        ...s,
        sessionToken: s.sessionToken.substring(0, 8) + '...', // Partial token
        isCurrent: s.id === req.session?.id,
      })),
    })
  } catch (error) {
    logError('Failed to fetch sessions', error)
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' })
  }
})

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId', authMiddleware, auditMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { prisma } = req.app.locals

    // Ensure user can only revoke their own sessions
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: req.user.id },
    })

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' })
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    })

    logInfo('Session revoked', { sessionId, userId: req.user.id })

    res.json({ success: true, message: 'Session revoked successfully' })
  } catch (error) {
    logError('Failed to revoke session', error)
    res.status(500).json({ success: false, error: 'Failed to revoke session' })
  }
})

export default router
