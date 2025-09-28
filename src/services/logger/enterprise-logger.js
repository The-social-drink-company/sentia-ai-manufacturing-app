/**
 * Enterprise Logging System - Browser Compatible
 * Structured logging for React application
 * Replaces all console.log/error/warn statements
 */

// Environment configuration
// Check if we're in a browser (Vite) or Node.js environment
const isBrowser = typeof window !== 'undefined';
const NODE_ENV = isBrowser ? (import.meta.env?.MODE || 'development') : (process.env.NODE_ENV || 'development');
const LOG_LEVEL = isBrowser ? (import.meta.env?.VITE_LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug')) : (process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug'));

// Log levels
const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};

// Check if we should show debug logs
const shouldDebug = LOG_LEVEL === 'debug' || LOG_LEVEL === 'trace';

/**
 * Structured logger for browser environment
 */
class EnterpriseLogger {
  constructor() {
    this.context = {
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL] || 0;
  }

  formatLog(level, message, data = {}) {
    return {
      ...this.context,
      level,
      timestamp: new Date().toISOString(),
      message,
      ...data
    };
  }

  log(level, message, data) {
    if (!this.shouldLog(level)) return;

    const logData = this.formatLog(level, message, data);

    // In browser, use console methods
    switch (level) {
      case 'trace':
      case 'debug':
        console.debug('[DEBUG]', message, data || '');
        break;
      case 'info':
        console.info('[INFO]', message, data || '');
        break;
      case 'warn':
        console.warn('[WARN]', message, data || '');
        break;
      case 'error':
      case 'fatal':
        console.error('[ERROR]', message, data || '');
        break;
      default:
        console.log('[LOG]', message, data || '');
    }

    // Store in localStorage for debugging (limited to last 100 logs)
    if (NODE_ENV === 'development') {
      try {
        const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
        logs.push(logData);
        if (logs.length > 100) logs.shift();
        localStorage.setItem('app_logs', JSON.stringify(logs));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  trace(message, data) {
    this.log('trace', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  fatal(message, data) {
    this.log('fatal', message, data);
  }
}

// Create singleton instance
const logger = new EnterpriseLogger();

// Export convenience functions
export const logTrace = (message, data) => logger.trace(message, data);
export const logDebug = (message, data) => logger.debug(message, data);
export const logInfo = (message, data) => logger.info(message, data);
export const logWarn = (message, data) => logger.warn(message, data);
export const logError = (message, data) => logger.error(message, data);
export const logFatal = (message, data) => logger.fatal(message, data);

// Development-only console helpers (for backwards compatibility)
export const devLog = {
  log: (...args) => {
    if (shouldDebug) console.log(...args);
  },
  warn: (...args) => {
    if (shouldDebug) console.warn(...args);
  },
  error: (...args) => {
    if (shouldDebug) console.error(...args);
  },
  info: (...args) => {
    if (shouldDebug) console.info(...args);
  }
};

// Create logger function for compatibility
export const createLogger = (name) => {
  // Return a namespaced version of the logger
  return {
    trace: (msg, data) => logger.trace(`[${name}] ${msg}`, data),
    debug: (msg, data) => logger.debug(`[${name}] ${msg}`, data),
    info: (msg, data) => logger.info(`[${name}] ${msg}`, data),
    warn: (msg, data) => logger.warn(`[${name}] ${msg}`, data),
    error: (msg, data) => logger.error(`[${name}] ${msg}`, data),
    fatal: (msg, data) => logger.fatal(`[${name}] ${msg}`, data)
  };
};

// Express middleware for logging
export const loggingMiddleware = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    logger.info(`Response sent: ${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
    return originalSend.call(this, data);
  };

  next();
};

// Default export
export default logger;