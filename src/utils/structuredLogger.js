/* eslint-env node */
/**
 * Structured Logger Utility
 *
 * Enterprise-grade logging system with environment-aware levels
 * Replaces console.log statements throughout the application
 *
 * Usage:
 * import { logInfo, logWarn, logError, logDebug } from '@/utils/structuredLogger';
 *
 * logInfo('Operation completed', { userId, operation: 'data_sync' });
 * logWarn('Fallback triggered', { reason, fallbackType });
 * logError('Critical failure', error);
 */

const LOGLEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Determine log level based on environment
const getCurrentLogLevel = () => {
  const env = import.meta.env?.MODE || process?.env?.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return LOGLEVELS.WARN; // Only warnings and errors in production
    case 'test':
    case 'testing':
      return LOGLEVELS.ERROR; // Only errors in test
    case 'development':
    default:
      return LOGLEVELS.DEBUG; // Everything in development
  }
};

const currentLogLevel = getCurrentLogLevel();
const isDevelopment = import.meta.env?.DEV || process?.env?.NODE_ENV === 'development';

/**
 * Format log message with timestamp and level
 */
const formatMessage = (level, message, context) => {
  const timestamp = new Date().toISOString();
  const levelName = Object.keys(LOGLEVELS).find(key => LOGLEVELS[key] === level);

  return {
    timestamp,
    level: levelName,
    message,
    ...(context && { context }),
    environment: import.meta.env?.MODE || process?.env?.NODE_ENV || 'unknown'
  };
};

/**
 * Send log to monitoring service (if configured)
 */
const sendToMonitoring = (logData) => {
  // In production, send to monitoring service
  if (typeof window !== 'undefined' && window.sentryCapture) {
    window.sentryCapture(logData);
  }

  // Could also send to custom logging endpoint
  if (import.meta.env?.VITE_LOGGING_ENDPOINT) {
    // Non-blocking log sending
    fetch(import.meta.env.VITE_LOGGING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {
      // Silently fail - don't break app if logging fails
    });
  }
};

/**
 * Core logging function
 */
const log = (level, message, context) => {
  if (level < currentLogLevel) return;

  const logData = formatMessage(level, message, context);

  // Console output in development
  if (isDevelopment || level >= LOGLEVELS.WARN) {
    const consoleMethod = level === LOGLEVELS.ERROR ? 'error' :
                         level === LOGLEVELS.WARN ? 'warn' :
                         level === LOGLEVELS.DEBUG ? 'debug' : 'log';

    // Use structured output in development
    if (isDevelopment) {
      console[consoleMethod](`[${logData.level}] ${logData.message}`, context || '');
    } else {
      // Simple output in production
      console[consoleMethod](logData.message);
    }
  }

  // Send errors and warnings to monitoring
  if (level >= LOGLEVELS.WARN) {
    sendToMonitoring(logData);
  }
};

/**
 * Public logging functions
 */
export const logDebug = (message, context) => {
  log(LOGLEVELS.DEBUG, message, context);
};

export const logInfo = (message, context) => {
  log(LOGLEVELS.INFO, message, context);
};

export const logWarn = (message, context) => {
  log(LOGLEVELS.WARN, message, context);
};

export const logError = (message, errorOrContext) => {
  // Handle both Error objects and context objects
  let context = errorOrContext;

  if (errorOrContext instanceof Error) {
    context = {
      error: errorOrContext.message,
      stack: errorOrContext.stack,
      name: errorOrContext.name,
      ...(errorOrContext.cause && { cause: errorOrContext.cause })
    };
  }

  log(LOGLEVELS.ERROR, message, context);
};

/**
 * Performance logging utility
 */
export const logPerformance = (operation, duration, metadata) => {
  const context = {
    operation,
    duration: `${duration}ms`,
    ...metadata
  };

  if (duration > 1000) {
    logWarn(`Slow operation: ${operation}`, context);
  } else if (isDevelopment) {
    logDebug(`Performance: ${operation}`, context);
  }
};

/**
 * Development-only logger (completely removed in production)
 */
export const devLog = {
  log: (...args) => {
    if (isDevelopment) console.log(...args);
  },
  warn: (...args) => {
    if (isDevelopment) console.warn(...args);
  },
  error: (...args) => {
    if (isDevelopment) console.error(...args);
  },
  table: (...args) => {
    if (isDevelopment) console.table(...args);
  },
  time: (_label) => {
    if (isDevelopment) console.time(label);
  },
  timeEnd: (_label) => {
    if (isDevelopment) console.timeEnd(label);
  }
};

/**
 * Create a scoped logger for specific modules
 */
export const createLogger = (_scope) => {
  return {
    debug: (message, context) => logDebug(`[${scope}] ${message}`, context),
    info: (message, context) => logInfo(`[${scope}] ${message}`, context),
    warn: (message, context) => logWarn(`[${scope}] ${message}`, context),
    error: (message, context) => logError(`[${scope}] ${message}`, context)
  };
};

// Default export for convenience
export default {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  performance: logPerformance,
  createLogger,
  devLog
};