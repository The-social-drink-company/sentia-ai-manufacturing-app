<<<<<<< HEAD
﻿/* eslint-env node */

const globalProcess = typeof globalThis !== 'undefined' && globalThis.process ? globalThis.process : null
=======
import { logDebug, logInfo, logWarn, logError } from 'logger';
/**
 * Environment Variable Validator
 * Validates required environment variables on application startup
 * Implements TASK-002 from SpecKit specifications
 */
>>>>>>> branch-23-bulletproof

const requiredBackendEnvVars = [
  'CLERK_SECRET_KEY',
  'DATABASE_URL_DEVELOPMENT',
  'DATABASE_URL_TESTING',
  'DATABASE_URL_PRODUCTION'
]

const requiredFrontendEnvVars = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_CLERK_DOMAIN'
]

const defaultLogger = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
}

export function validateBackendEnvironment(logger = defaultLogger) {
  const env = globalProcess ? globalProcess.env : null
  if (!env) {
    logger.warn('[env-validator] Backend environment unavailable; skipping checks')
    return { valid: false, missing: requiredBackendEnvVars }
  }

  logger.debug('[env-validator] Validating backend environment variables')

  const missing = requiredBackendEnvVars.filter((key) => !env[key] || env[key].trim() === '')
  if (missing.length > 0) {
    reportMissing(logger, 'backend', missing)
    safeExit(1)
    return { valid: false, missing }
  }

<<<<<<< HEAD
  if (env.CLERK_SECRET_KEY && !env.CLERK_SECRET_KEY.startsWith('sk_')) {
    logger.error('[env-validator] CLERK_SECRET_KEY must start with "sk_"')
    safeExit(1)
    return { valid: false, missing: [] }
=======
  // Validate Clerk secret key format
  if (process.env.CLERK_SECRET_KEY && !process.env.CLERK_SECRET_KEY.startsWith('sk_')) {
    logError('❌ CRITICAL: CLERK_SECRET_KEY must start with "sk_"');
    process.exit(1);
>>>>>>> branch-23-bulletproof
  }

  const dbKeys = ['DATABASE_URL_DEVELOPMENT', 'DATABASE_URL_TESTING', 'DATABASE_URL_PRODUCTION']
  for (const key of dbKeys) {
    if (env[key] && !env[key].startsWith('postgresql://')) {
      logger.error(`[env-validator] ${key} must be a valid PostgreSQL connection string`)
      safeExit(1)
      return { valid: false, missing: [] }
    }
  }

  logger.debug('[env-validator] Backend environment validation passed')
  return { valid: true, missing: [] }
}

export function validateFrontendEnvironment(logger = defaultLogger) {
  let env = null
  try {
    env = typeof import.meta !== 'undefined' ? import.meta.env : null
  } catch {
    env = null
  }
  if (!env) {
    logger.warn('[env-validator] Frontend environment unavailable; skipping checks')
    return { valid: false, missing: requiredFrontendEnvVars }
  }

  logger.debug('[env-validator] Validating frontend environment variables')

  const missing = requiredFrontendEnvVars.filter((key) => !env[key] || env[key].trim() === '')
  if (missing.length > 0) {
    reportMissing(logger, 'frontend', missing)
    return { valid: false, missing }
  }

<<<<<<< HEAD
  if (env.VITE_CLERK_PUBLISHABLE_KEY && !env.VITE_CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    logger.error('[env-validator] VITE_CLERK_PUBLISHABLE_KEY must start with "pk_"')
    return { valid: false, missing: [] }
=======
  // Validate Clerk publishable key format
  if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    logError('❌ CRITICAL: VITE_CLERK_PUBLISHABLE_KEY must start with "pk_"');
    return false;
>>>>>>> branch-23-bulletproof
  }

  logger.debug('[env-validator] Frontend environment validation passed')
  return { valid: true, missing: [] }
}

export function getEnvironmentStatus() {
  const backend = globalProcess ? globalProcess.env : null
  const backendStatus = backend
    ? requiredBackendEnvVars.every((key) => backend[key] && backend[key].trim() !== '')
    : false

  return {
    backend: backendStatus,
    timestamp: new Date().toISOString()
  }
}

export function validateEnvVar(key, value, pattern = null) {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${key} is required but not set` }
  }

  if (pattern && !pattern.test(value)) {
    return { valid: false, error: `${key} does not match required pattern` }
  }

  return { valid: true }
}

function reportMissing(logger, scope, missing) {
  logger.error(`[env-validator] Missing required ${scope} environment variables:`)
  missing.forEach((key) => logger.error(`  - ${key}`))
}

function safeExit(code) {
  if (globalProcess && typeof globalProcess.exit === 'function') {
    globalProcess.exit(code)
  }
}
