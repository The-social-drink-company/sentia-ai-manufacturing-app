import express from 'express'

import { verifyUserCredentials, initializeDefaultUsers } from '../../lib/user-service.js'
import { logInfo, logError, logWarn } from '../../services/observability/structuredLogger.js'

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

export default router
