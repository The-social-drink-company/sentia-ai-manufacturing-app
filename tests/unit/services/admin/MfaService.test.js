/**
 * MfaService Unit Tests
 *
 * Tests TOTP-based MFA verification, rate limiting, and QR code generation
 *
 * Coverage:
 * - TOTP secret generation and QR code creation
 * - Code verification with time window tolerance
 * - Rate limiting (3 attempts / 5 minutes)
 * - Token generation
 * - MFA enable/disable
 *
 * @module tests/unit/services/admin/MfaService.test.js
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import MfaService from '../../../../server/services/admin/MfaService.js'
import prisma from '../../../../server/lib/prisma.js'
import speakeasy from 'speakeasy'

// Mock Prisma
vi.mock('../../../../server/lib/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock logger
vi.mock('../../../../server/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('MfaService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear rate limits before each test
    MfaService.clearAllRateLimits()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('requestMFACode', () => {
    it('should generate TOTP secret and QR code for new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        twoFactorSecret: null,
        twoFactorEnabled: false,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: 'MOCK_SECRET_BASE32',
        twoFactorEnabled: true,
      })

      const result = await MfaService.requestMFACode('user-123', 'approve_request', 'totp')

      expect(result.success).toBe(true)
      expect(result.method).toBe('totp')
      expect(result.secret).toBeDefined()
      expect(result.qrCode).toBeDefined()
      expect(result.qrCode).toContain('otpauth://totp/')
      expect(result.qrCode).toContain('Sentia%20Admin')
      expect(result.qrCode).toContain('test@example.com')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          twoFactorSecret: expect.any(String),
          twoFactorEnabled: true,
        },
      })
    })

    it('should return existing TOTP message for user with secret', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'existing@example.com',
        twoFactorSecret: 'EXISTING_SECRET_BASE32',
        twoFactorEnabled: true,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await MfaService.requestMFACode('user-456', 'approve_request', 'totp')

      expect(result.success).toBe(true)
      expect(result.method).toBe('totp')
      expect(result.message).toBe('Use your authenticator app to generate the code')
      expect(result.qrCode).toBeUndefined()
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should enforce rate limiting after 3 failed attempts', async () => {
      const mockUser = {
        id: 'user-rate-limit',
        email: 'test@example.com',
        twoFactorSecret: null,
        twoFactorEnabled: false,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      // Simulate failed attempts by calling checkRateLimit and incrementAttempts
      MfaService.incrementAttempts('user-rate-limit')
      MfaService.incrementAttempts('user-rate-limit')
      MfaService.incrementAttempts('user-rate-limit')

      await expect(MfaService.requestMFACode('user-rate-limit', 'approve_request', 'totp')).rejects.toThrow(
        'Too many MFA attempts. Please wait 5 minutes and try again.'
      )
    })
  })

  describe('verifyMFACode', () => {
    it('should verify valid TOTP code', async () => {
      const secret = speakeasy.generateSecret({ length: 32 })
      const validCode = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
      })

      const mockUser = {
        id: 'user-verify',
        email: 'verify@example.com',
        twoFactorSecret: secret.base32,
        twoFactorEnabled: true,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await MfaService.verifyMFACode('user-verify', validCode)

      expect(result.verified).toBe(true)
      expect(result.token).toBeDefined()
      expect(result.expiresAt).toBeDefined()

      // Token should expire in 15 minutes
      const expiresIn = new Date(result.expiresAt).getTime() - Date.now()
      expect(expiresIn).toBeGreaterThan(14 * 60 * 1000) // At least 14 minutes
      expect(expiresIn).toBeLessThan(16 * 60 * 1000) // Less than 16 minutes
    })

    it('should reject invalid TOTP code', async () => {
      const secret = speakeasy.generateSecret({ length: 32 })
      const invalidCode = '123456' // Invalid code

      const mockUser = {
        id: 'user-invalid',
        email: 'invalid@example.com',
        twoFactorSecret: secret.base32,
        twoFactorEnabled: true,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      await expect(MfaService.verifyMFACode('user-invalid', invalidCode)).rejects.toThrow(
        'Invalid MFA code. Please try again.'
      )
    })

    it('should reject verification when MFA not enabled', async () => {
      const mockUser = {
        id: 'user-not-enabled',
        email: 'notenabled@example.com',
        twoFactorSecret: null,
        twoFactorEnabled: false,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      await expect(MfaService.verifyMFACode('user-not-enabled', '123456')).rejects.toThrow(
        'MFA is not enabled for this user. Please set up MFA first.'
      )
    })

    it('should clear rate limit on successful verification', async () => {
      const secret = speakeasy.generateSecret({ length: 32 })
      const validCode = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
      })

      const mockUser = {
        id: 'user-clear-limit',
        email: 'clear@example.com',
        twoFactorSecret: secret.base32,
        twoFactorEnabled: true,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      // Add failed attempts first
      MfaService.incrementAttempts('user-clear-limit')
      MfaService.incrementAttempts('user-clear-limit')

      // Successful verification should clear rate limit
      await MfaService.verifyMFACode('user-clear-limit', validCode)

      // Should be able to verify again (rate limit cleared)
      const result = await MfaService.verifyMFACode('user-clear-limit', validCode)
      expect(result.verified).toBe(true)
    })

    it('should increment failed attempts on invalid code', async () => {
      const secret = speakeasy.generateSecret({ length: 32 })

      const mockUser = {
        id: 'user-increment',
        email: 'increment@example.com',
        twoFactorSecret: secret.base32,
        twoFactorEnabled: true,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      // First two failed attempts should succeed
      await expect(MfaService.verifyMFACode('user-increment', '111111')).rejects.toThrow()
      await expect(MfaService.verifyMFACode('user-increment', '222222')).rejects.toThrow()
      await expect(MfaService.verifyMFACode('user-increment', '333333')).rejects.toThrow()

      // Fourth attempt should hit rate limit
      await expect(MfaService.verifyMFACode('user-increment', '444444')).rejects.toThrow(
        'Too many MFA verification attempts. Please wait 5 minutes.'
      )
    })
  })

  describe('checkRateLimit', () => {
    it('should return true when no rate limit set', () => {
      const result = MfaService.checkRateLimit('user-no-limit')

      expect(result).toBe(true)
    })

    it('should return false when attempts exceeded', () => {
      MfaService.incrementAttempts('user-exceeded')
      MfaService.incrementAttempts('user-exceeded')
      MfaService.incrementAttempts('user-exceeded')

      const result = MfaService.checkRateLimit('user-exceeded')

      expect(result).toBe(false)
    })

    it('should reset rate limit after time window expires', () => {
      // Manually set expired rate limit
      const expiredTime = new Date(Date.now() - 6 * 60 * 1000) // 6 minutes ago
      MfaService.rateLimits.set('user-expired', {
        attempts: 3,
        resetAt: expiredTime,
      })

      const result = MfaService.checkRateLimit('user-expired')

      expect(result).toBe(true)
      expect(MfaService.rateLimits.has('user-expired')).toBe(false)
    })
  })

  describe('generateVerificationToken', () => {
    it('should generate base64-encoded token with userId and timestamp', () => {
      const token = MfaService.generateVerificationToken('user-token-test')

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      // Decode token
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      expect(decoded).toContain('user-token-test')
      expect(decoded).toContain(':')

      const [userId, timestamp] = decoded.split(':')
      expect(userId).toBe('user-token-test')
      expect(parseInt(timestamp, 10)).toBeGreaterThan(Date.now() - 1000)
    })
  })

  describe('disableMFA', () => {
    it('should disable MFA for user', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'user-disable',
        email: 'disable@example.com',
        twoFactorEnabled: false,
        twoFactorSecret: null,
      })

      const result = await MfaService.disableMFA('user-disable')

      expect(result.success).toBe(true)
      expect(result.message).toBe('MFA has been disabled')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-disable' },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      })
    })
  })

  describe('getMFAStatus', () => {
    it('should return enabled status for user with MFA', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-status',
        twoFactorEnabled: true,
      })

      const result = await MfaService.getMFAStatus('user-status')

      expect(result.enabled).toBe(true)
      expect(result.method).toBe('totp')
    })

    it('should return disabled status for user without MFA', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-no-mfa',
        twoFactorEnabled: false,
      })

      const result = await MfaService.getMFAStatus('user-no-mfa')

      expect(result.enabled).toBe(false)
      expect(result.method).toBe(null)
    })
  })

  describe('clearAllRateLimits', () => {
    it('should clear all rate limits', () => {
      MfaService.incrementAttempts('user-1')
      MfaService.incrementAttempts('user-2')
      MfaService.incrementAttempts('user-3')

      expect(MfaService.rateLimits.size).toBe(3)

      MfaService.clearAllRateLimits()

      expect(MfaService.rateLimits.size).toBe(0)
    })
  })
})
