import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { SERVER_CONFIG } from '../config/server-config.js';

const namespace = 'sentia-mcp'
const allowed = () => process.env.NODE_ENV !== 'production'

// Enhanced Winston Logger for MCP Server
export const mcpLogger = winston.createLogger({
  level: SERVER_CONFIG.logging.level || 'info',
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
        service: service || 'sentia-mcp',
        ...meta
      });
    })
  ),
  defaultMeta: { service: 'sentia-mcp-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ enabled: SERVER_CONFIG.logging.console.colorize }),
        winston.format.simple()
      )
    })
  ]
});

// Add file transports if enabled
if (SERVER_CONFIG.logging.file.enabled) {
  mcpLogger.add(new winston.transports.File({ 
    filename: `${SERVER_CONFIG.logging.file.directory}/error.log`, 
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: SERVER_CONFIG.logging.file.maxFiles
  }));
  
  mcpLogger.add(new winston.transports.File({ 
    filename: `${SERVER_CONFIG.logging.file.directory}/combined.log`,
    maxsize: 5242880, // 5MB
    maxFiles: SERVER_CONFIG.logging.file.maxFiles
  }));
}

// Enhanced logging functions with correlation ID support
export const createLogger = (correlationId = null) => ({
  info: (message, meta = {}) => mcpLogger.info(message, { correlationId: correlationId || uuidv4(), ...meta }),
  warn: (message, meta = {}) => mcpLogger.warn(message, { correlationId: correlationId || uuidv4(), ...meta }),
  error: (message, meta = {}) => mcpLogger.error(message, { correlationId: correlationId || uuidv4(), ...meta }),
  debug: (message, meta = {}) => mcpLogger.debug(message, { correlationId: correlationId || uuidv4(), ...meta })
});

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
  if (allowed() && process.env.NODE_ENV === 'development') {
    console.debug(`[${namespace}]`, ...args)
  }
}