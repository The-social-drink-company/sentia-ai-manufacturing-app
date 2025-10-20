import winston from 'winston'
import { v4 as uuidv4 } from 'uuid'

const importMetaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined
const processEnv = typeof globalThis !== 'undefined' && globalThis.process ? globalThis.process.env : undefined

const getEnvVar = (key, fallback) => {
  if (importMetaEnv && importMetaEnv[key] !== undefined) {
    return importMetaEnv[key]
  }
  if (processEnv && processEnv[key] !== undefined) {
    return processEnv[key]
  }
  return fallback
}

const namespace = 'sentia'
const envMode = getEnvVar('MODE', processEnv?.NODE_ENV) || 'production'
const isDevelopment = envMode === 'development'
const allowed = () => envMode !== 'production'

// Enhanced Winston Logger for MCP Server
export const mcpLogger = winston.createLogger({
  level: getEnvVar('VITE_LOG_LEVEL', 'info'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, correlationId, service, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        correlationId,
        service: service || 'capliquify-mcp',
        ...meta,
      })
    })
  ),
  defaultMeta: { service: 'capliquify-mcp-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
})

// Enhanced logging functions with correlation ID support
export const createLogger = (correlationId = null) => ({
  info: (message, meta = {}) =>
    mcpLogger.info(message, { correlationId: correlationId || uuidv4(), ...meta }),
  warn: (message, meta = {}) =>
    mcpLogger.warn(message, { correlationId: correlationId || uuidv4(), ...meta }),
  error: (message, meta = {}) =>
    mcpLogger.error(message, { correlationId: correlationId || uuidv4(), ...meta }),
  debug: (message, meta = {}) =>
    mcpLogger.debug(message, { correlationId: correlationId || uuidv4(), ...meta }),
})

// Original simple logging functions for backward compatibility
export const logWarn = (...args) => {
  if (allowed()) {
    console.warn(`[${namespace}]`, ...args)
  }
}

export const logError = (...args) => {
  if (allowed()) {
    console.error(`[${namespace}]`, ...args)
  }
}

export const logInfo = (...args) => {
  if (allowed()) {
    console.log(`[${namespace}]`, ...args)
  }
}

export const logDebug = (...args) => {
  if (allowed() && isDevelopment) {
    console.debug(`[${namespace}]`, ...args)
  }
}
