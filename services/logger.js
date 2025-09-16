import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { existsSync, mkdirSync } from 'fs'

const { combine, timestamp, printf, colorize, errors } = winston.format

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let logEntry = `${timestamp} [${level}]: ${message}`
  
  if (stack) {
    logEntry += `\n${stack}`
  }
  
  if (Object.keys(meta).length > 0) {
    logEntry += `\n${JSON.stringify(meta, null, 2)}`
  }
  
  return logEntry
})

// Create logs directory if it doesn't exist
const logsDir = './logs'

// Check if running on Railway/Render (read-only filesystem)
const isRailwayOrRender = process.env.RAILWAY_ENVIRONMENT || process.env.RENDER || process.env.RENDER_EXTERNAL_URL

// Only create logs directory if not on Railway/Render
if (!isRailwayOrRender && !existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true })
}

// Create transports array based on environment
const transports = []

// Only create file transports if not on Railway/Render
if (!isRailwayOrRender) {
  try {
    // File rotation transport for general logs
    const fileRotateTransport = new DailyRotateFile({
      filename: `${logsDir}/application-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      )
    })

    // Error logs only
    const errorRotateTransport = new DailyRotateFile({
      level: 'error',
      filename: `${logsDir}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      )
    })

    transports.push(fileRotateTransport, errorRotateTransport)
  } catch (err) {
    console.warn('Unable to create file transports:', err.message)
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports
})

// Add console transport for development or Railway/Render
if (process.env.NODE_ENV !== 'production' || isRailwayOrRender) {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      printf(({ level, message, timestamp, stack }) => {
        let logEntry = `${timestamp} [${level}]: ${message}`
        if (stack) {
          logEntry += `\n${stack}`
        }
        return logEntry
      })
    )
  }))
}

// Helper functions for different log levels
export const logInfo = (message, meta = {}) => {
  logger.info(message, meta)
}

export const logError = (message, error = null, meta = {}) => {
  if (error) {
    logger.error(message, { error: error.message, stack: error.stack, ...meta })
  } else {
    logger.error(message, meta)
  }
}

export const logWarn = (message, meta = {}) => {
  logger.warn(message, meta)
}

export const logDebug = (message, meta = {}) => {
  logger.debug(message, meta)
}

export const logHttp = (message, meta = {}) => {
  logger.http(message, meta)
}

export default logger