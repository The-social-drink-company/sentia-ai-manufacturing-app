/**
 * Enterprise Logging System - Browser Compatible
 * Structured logging for React application
 * Replaces all console.log/error/warn statements
 */

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || process.env.VITE_LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');

// Custom log levels with priorities
const logLevels = {
  levels: {
    critical: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    debug: 5,
    trace: 6
  },
  colors: {
    critical: '#ff0000',
    error: '#ff4444',
    warn: '#ffaa00',
    info: '#00aa00',
    http: '#aa00aa',
    debug: '#0066cc',
    trace: '#888888'
  }
};

// Determine if a log level should be displayed
const shouldLog = (level) => {
  const currentLevel = logLevels.levels[LOG_LEVEL] || logLevels.levels.info;
  const messageLevel = logLevels.levels[level] || logLevels.levels.info;
  return messageLevel <= currentLevel;
};

// Format timestamp
const formatTimestamp = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
};

// Format log message
const formatMessage = (level, message, metadata = {}) => {
  const timestamp = formatTimestamp();
  const metaStr = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '';
  return {
    timestamp,
    level,
    message,
    metadata,
    formatted: `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`
  };
};

// Enterprise Logger Class
class EnterpriseLogger {
  constructor(component = 'App') {
    this.component = component;
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
  }

  // Core logging method
  log(level, message, metadata = {}) {
    if (!shouldLog(level)) return;

    const logEntry = formatMessage(level, message, {
      ...metadata,
      component: this.component
    });

    // Store in memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to console in development
    if (NODE_ENV === 'development') {
      const color = logLevels.colors[level];
      const style = `color: ${color}; font-weight: ${level === 'critical' ? 'bold' : 'normal'}`;

      console.log(`%c${logEntry.formatted}`, style);

      // Also log metadata if present
      if (Object.keys(metadata).length > 0) {
        console.log('Metadata:', metadata);
      }
    } else if (NODE_ENV === 'production') {
      // In production, use appropriate console methods
      switch (level) {
        case 'critical':
        case 'error':
          console.error(logEntry.formatted, metadata);
          break;
        case 'warn':
          console.warn(logEntry.formatted, metadata);
          break;
        case 'info':
        case 'http':
          console.info(logEntry.formatted, metadata);
          break;
        case 'debug':
        case 'trace':
          if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'trace') {
            console.log(logEntry.formatted, metadata);
          }
          break;
        default:
          console.log(logEntry.formatted, metadata);
      }
    }

    // Send to remote logging service in production
    if (NODE_ENV === 'production' && (level === 'critical' || level === 'error')) {
      this.sendToRemote(logEntry);
    }

    return logEntry;
  }

  // Send logs to remote service
  async sendToRemote(logEntry) {
    try {
      // This would be replaced with actual remote logging service
      // e.g., Sentry, LogRocket, DataDog, etc.
      if (window.REMOTE_LOGGING_ENABLED) {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      }
    } catch {
      // Silently fail remote logging to avoid infinite loops
    }
  }

  // Log level methods
  critical(message, metadata) {
    return this.log('critical', message, metadata);
  }

  error(message, error, metadata = {}) {
    const errorMeta = error instanceof Error ? {
      ...metadata,
      error: error.message,
      stack: error.stack
    } : metadata;
    return this.log('error', message, errorMeta);
  }

  warn(message, metadata) {
    return this.log('warn', message, metadata);
  }

  info(message, metadata) {
    return this.log('info', message, metadata);
  }

  http(message, metadata) {
    return this.log('http', message, metadata);
  }

  debug(message, metadata) {
    return this.log('debug', message, metadata);
  }

  trace(message, metadata) {
    return this.log('trace', message, metadata);
  }

  // Special logging methods
  audit(action, userId, details) {
    return this.log('info', `AUDIT: ${action}`, { userId, details, type: 'audit' });
  }

  metric(name, value, unit = '', tags = {}) {
    return this.log('info', `METRIC: ${name}`, { value, unit, tags, type: 'metric' });
  }

  // Get logs for debugging
  getLogs(level = null) {
    if (!level) return this.logs;
    return this.logs.filter(log => log.level === level);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }
}

// Create default logger instance
const defaultLogger = new EnterpriseLogger('Default');

// Factory function to create component-specific loggers
export const createLogger = (component) => {
  return new EnterpriseLogger(component);
};

// Export singleton for backward compatibility
export default defaultLogger;

// Named exports for convenience
export const critical = (msg, meta) => defaultLogger.critical(msg, meta);
export const error = (msg, err, meta) => defaultLogger.error(msg, err, meta);
export const warn = (msg, meta) => defaultLogger.warn(msg, meta);
export const info = (msg, meta) => defaultLogger.info(msg, meta);
export const http = (msg, meta) => defaultLogger.http(msg, meta);
export const debug = (msg, meta) => defaultLogger.debug(msg, meta);
export const trace = (msg, meta) => defaultLogger.trace(msg, meta);
export const audit = (action, userId, details) => defaultLogger.audit(action, userId, details);
export const metric = (name, value, unit, tags) => defaultLogger.metric(name, value, unit, tags);

// Development-only console wrapper
export const devLog = NODE_ENV === 'development' ? {
  log: (...args) => defaultLogger.debug(args.join(' ')),
  error: (...args) => defaultLogger.error(args.join(' ')),
  warn: (...args) => defaultLogger.warn(args.join(' ')),
  info: (...args) => defaultLogger.info(args.join(' ')),
  debug: (...args) => defaultLogger.debug(args.join(' ')),
  trace: (...args) => defaultLogger.trace(args.join(' '))
} : {
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
  trace: () => {}
};

// Express middleware integration (for use in server code only)
export const expressMiddleware = (req, res, next) => {
  // This would only be used in server-side code
  // Skip in browser environment
  if (typeof window !== 'undefined') {
    return next ? next() : undefined;
  }
  
  // Log the request in server environment
  defaultLogger.http(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Always call next() to continue the middleware chain
  next();
};

// Stream for Morgan HTTP logger integration (server only)
export const stream = {
  write: (message) => {
    if (typeof window === 'undefined') {
      defaultLogger.http(message.trim());
    }
  }
};