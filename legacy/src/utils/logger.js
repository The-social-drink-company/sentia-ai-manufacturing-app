// Structured logging utility for production-ready code
// Replaces console.log statements with environment-aware logging

const isDevelopment = import.meta.env?.DEV || process?.env?.NODE_ENV === 'development';
const isTest = import.meta.env?.MODE === 'test' || process?.env?.NODE_ENV === 'test';

// Log levels
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  // Error logging - always enabled
  error(message, error = null, meta = {}) {
    if (currentLogLevel >= LogLevel.ERROR) {
      const logEntry = {
        level: 'ERROR',
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...meta
      };

      if (error) {
        logEntry.error = {
          message: error.message,
          stack: error.stack,
          name: error.name
        };
      }

      console.error(`[${logEntry.context}] ERROR:`, message, error || '');

      // In production, send to monitoring service
      if (!isDevelopment && !isTest) {
        this.sendToMonitoring(logEntry);
      }
    }
  }

  // Warning logging
  warn(message, meta = {}) {
    if (currentLogLevel >= LogLevel.WARN) {
      const logEntry = {
        level: 'WARN',
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...meta
      };

      console.warn(`[${logEntry.context}] WARN:`, message);

      if (!isDevelopment && !isTest) {
        this.sendToMonitoring(logEntry);
      }
    }
  }

  // Info logging
  info(message, meta = {}) {
    if (currentLogLevel >= LogLevel.INFO) {
      const logEntry = {
        level: 'INFO',
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...meta
      };

      if (isDevelopment) {
        console.info(`[${logEntry.context}] INFO:`, message);
      }
    }
  }

  // Debug logging - only in development
  debug(message, data = null) {
    if (isDevelopment && currentLogLevel >= LogLevel.DEBUG) {
      console.debug(`[${this.context}] DEBUG:`, message, data || '');
    }
  }

  // Performance logging
  time(label) {
    if (isDevelopment) {
      console.time(`[${this.context}] ${label}`);
    }
  }

  timeEnd(label) {
    if (isDevelopment) {
      console.timeEnd(`[${this.context}] ${label}`);
    }
  }

  // Table logging for development
  table(data) {
    if (isDevelopment) {
      console.table(data);
    }
  }

  // Group logging for development
  group(label) {
    if (isDevelopment) {
      console.group(`[${this.context}] ${label}`);
    }
  }

  groupEnd() {
    if (isDevelopment) {
      console.groupEnd();
    }
  }

  // Send logs to monitoring service in production
  sendToMonitoring(logEntry) {
    // This would integrate with your monitoring service
    // For now, we'll just store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(logEntry);
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.shift();
      }
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (_error) {
      // Silently fail if localStorage is not available
    }
  }
}

// Create default logger instance
const defaultLogger = new Logger('App');

// Export both class and convenience functions
export default Logger;

export const logger = defaultLogger;

// Convenience exports for default logger
export const logError = (message, error, meta) => defaultLogger.error(message, error, meta);
export const logWarn = (message, meta) => defaultLogger.warn(message, meta);
export const logInfo = (message, meta) => defaultLogger.info(message, meta);
export const logDebug = (message, data) => defaultLogger.debug(message, data);

// Development-only logging helper
export const devLog = {
  log: (...args) => { if (isDevelopment) console.log(...args); },
  error: (...args) => { if (isDevelopment) console.error(...args); },
  warn: (...args) => { if (isDevelopment) console.warn(...args); },
  info: (...args) => { if (isDevelopment) console.info(...args); },
  debug: (...args) => { if (isDevelopment) console.debug(...args); },
  table: (data) => { if (isDevelopment) console.table(data); }
};

// Create context-specific loggers
export const createLogger = (context) => new Logger(context);
