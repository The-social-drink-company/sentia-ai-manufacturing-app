/**
 * Master Admin Middleware
 *
 * Enforces authentication and authorization for master admin routes.
 *
 * Security Requirements:
 * - Valid Clerk session
 * - Email in MASTER_ADMIN_EMAIL whitelist
 * - 2FA enabled for admin user
 * - Optional: IP whitelist validation
 *
 * @module server/middleware/master-admin.middleware
 */

import { Request, Response, NextFunction } from 'express'
import { clerkClient } from '@clerk/clerk-sdk-node'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      masterAdmin?: {
        userId: string
        email: string
        clerkUser: any
      }
    }
  }
}

/**
 * Master admin email whitelist
 * Can be comma-separated list in env var
 */
const MASTER_ADMIN_EMAILS = (process.env.MASTER_ADMIN_EMAIL || '')
  .split(',')
  .map((email) => email.trim())
  .filter((email) => email.length > 0)

/**
 * Optional IP whitelist
 * Can be comma-separated list in env var
 */
const IP_WHITELIST = (process.env.MASTER_ADMIN_IP_WHITELIST || '')
  .split(',')
  .map((ip) => ip.trim())
  .filter((ip) => ip.length > 0)

/**
 * Master Admin Authentication Middleware
 *
 * Validates:
 * 1. Clerk session token exists and is valid
 * 2. User email is in master admin whitelist
 * 3. User has 2FA enabled (security requirement)
 * 4. Optional: User IP is in whitelist
 *
 * @param req Express request
 * @param res Express response
 * @param next Next middleware function
 */
export async function masterAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract and validate authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      })
      return
    }

    const sessionToken = authHeader.substring(7)

    // 2. Verify Clerk session
    let session
    try {
      session = await clerkClient.sessions.verifySession(sessionToken, sessionToken)
    } catch (error) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token'
      })
      return
    }

    if (!session) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Session verification failed'
      })
      return
    }

    // 3. Get user details from Clerk
    let user
    try {
      user = await clerkClient.users.getUser(session.userId)
    } catch (error) {
      console.error('Error fetching Clerk user:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch user details'
      })
      return
    }

    // 4. Extract primary email address
    const primaryEmail = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
    const userEmail = primaryEmail?.emailAddress

    if (!userEmail) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'User email not found'
      })
      return
    }

    // 5. Check if email is in master admin whitelist
    if (!MASTER_ADMIN_EMAILS.includes(userEmail)) {
      console.warn(`Unauthorized master admin access attempt: ${userEmail}`)
      res.status(403).json({
        error: 'Forbidden',
        message: 'Master admin access required. Your email is not authorized.'
      })
      return
    }

    // 6. Verify 2FA is enabled (security requirement)
    if (!user.twoFactorEnabled) {
      res.status(403).json({
        error: 'Forbidden',
        message: '2FA (Two-Factor Authentication) is required for master admin access. Please enable 2FA in your account settings.'
      })
      return
    }

    // 7. Optional: IP whitelist validation
    if (IP_WHITELIST.length > 0) {
      const clientIp = req.ip || req.connection.remoteAddress
      if (!clientIp || !IP_WHITELIST.includes(clientIp)) {
        console.warn(`Unauthorized IP for master admin: ${clientIp} (user: ${userEmail})`)
        res.status(403).json({
          error: 'Forbidden',
          message: 'Your IP address is not authorized for master admin access'
        })
        return
      }
    }

    // 8. Attach master admin context to request
    req.masterAdmin = {
      userId: user.id,
      email: userEmail,
      clerkUser: user
    }

    // 9. Log successful admin access (optional, for audit)
    console.log(`Master admin access granted: ${userEmail} (${req.method} ${req.path})`)

    // 10. Proceed to next middleware/route handler
    next()
  } catch (error) {
    console.error('Master admin middleware error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during authentication'
    })
  }
}

/**
 * Check if master admin emails are configured
 *
 * @returns boolean
 */
export function isMasterAdminConfigured(): boolean {
  return MASTER_ADMIN_EMAILS.length > 0
}

/**
 * Get configured master admin emails (for debugging)
 * DO NOT expose this in production API
 *
 * @returns string[]
 */
export function getMasterAdminEmails(): string[] {
  return MASTER_ADMIN_EMAILS
}
