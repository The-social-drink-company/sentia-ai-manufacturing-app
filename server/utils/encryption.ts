/**
 * Encryption Utilities
 *
 * @module server/utils/encryption
 */

import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const IV_LENGTH = 16 // For AES, this is always 16
const ALGORITHM = 'aes-256-cbc'

/**
 * Encrypt a string value
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
    iv
  )
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt an encrypted string value
 */
export function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const encryptedText = parts.join(':')
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
    iv
  )
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Mask a sensitive value for display (shows only last 4 characters)
 */
export function maskValue(value: string, showLast: number = 4): string {
  if (value.length <= showLast) {
    return '*'.repeat(value.length)
  }
  return '*'.repeat(value.length - showLast) + value.slice(-showLast)
}
