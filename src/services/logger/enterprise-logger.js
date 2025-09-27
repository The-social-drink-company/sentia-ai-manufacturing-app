/**
 * Enterprise Logging System
 * Centralized, structured logging with Winston
 * Replaces all console.log/error/warn statements
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_TO_FILE = process.env.LOG_TO_FILE !== 'false';
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

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
    critical: 'red bold',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
    trace: 'grey'
  }
};

// Add colors to Winston
winston.addColors(logLevels.colors);

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    const meta = metadata && Object.keys(metadata).length
      ? `\n${JSON.stringify(metadata, null, 2)}`
      : '';
    return `[${timestamp}] ${level}: ${message}${meta}`;
  })
);

// Create transports array
const transports = [];

// Console transport (always enabled in development)
if (NODE_ENV !== 'production' || process.env.LOG_TO_CONSOLE === 'true') {
  transports.push(
    new winston.transports.Console({
      format: NODE_ENV === 'production' ? structuredFormat : consoleFormat,
      level: LOG_LEVEL
    })
  );
}

// File transports (production and when explicitly enabled)
if (LOG_TO_FILE && NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: structuredFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: structuredFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 30,
      tailable: true
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  levels: logLevels.levels,
  level: LOG_LEVEL,
  format: structuredFormat,
  transports,
  exitOnError: false,
  silent: process.env.SILENT === 'true'
});

// Add request ID and correlation tracking
class EnterpriseLogger {
  constructor(component = 'App') {
    this.component = component;
    this.requestId = null;
  }

  setRequestId(requestId) {
    this.requestId = requestId;
  }

  setComponent(component) {
    this.component = component;
  }

  _log(level, message, meta = {}) {
    const metadata = {
      component: this.component,
      requestId: this.requestId,
      ...meta,
      env: NODE_ENV,
      timestamp: new Date().toISOString()
    };

    // Filter sensitive data
    const sanitizedMeta = this._sanitizeMeta(metadata);

    logger.log(level, message, sanitizedMeta);
  }

  _sanitizeMeta(meta) {
    const sensitive = ['password', 'token', 'secret', 'api_key', 'apiKey', 'authorization'];
    const sanitized = { ...meta };

    Object.keys(sanitized).forEach(key => {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this._sanitizeMeta(sanitized[key]);
      }
    });

    return sanitized;
  }

  // Log level methods
  critical(message, meta) {
    this._log('critical', message, meta);
  }

  error(message, error, meta = {}) {
    const errorMeta = error instanceof Error ? {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      },
      ...meta
    } : { error, ...meta };

    this._log('error', message, errorMeta);
  }

  warn(message, meta) {
    this._log('warn', message, meta);
  }

  info(message, meta) {
    this._log('info', message, meta);
  }

  http(message, meta) {
    this._log('http', message, meta);
  }

  debug(message, meta) {
    this._log('debug', message, meta);
  }

  trace(message, meta) {
    this._log('trace', message, meta);
  }

  // Performance logging
  startTimer(label) {
    const start = Date.now();
    return {
      end: (message, meta = {}) => {
        const duration = Date.now() - start;
        this.info(message || `Timer ${label} completed`, {
          ...meta,
          label,
          duration,
          durationMs: duration
        });
      }
    };
  }

  // Audit logging for security events
  audit(action, userId, details = {}) {
    this.info('AUDIT', {
      action,
      userId,
      ...details,
      timestamp: new Date().toISOString(),
      ip: details.ip || 'unknown'
    });
  }

  // Metrics logging for monitoring
  metric(name, value, unit = 'count', tags = {}) {
    this.info('METRIC', {
      metric: name,
      value,
      unit,
      tags,
      timestamp: Date.now()
    });
  }
}

// Create singleton instance for default export
const defaultLogger = new EnterpriseLogger('System');

// Middleware for Express
export const loggingMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] ||
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  req.requestId = requestId;
  req.logger = new EnterpriseLogger('HTTP');
  req.logger.setRequestId(requestId);

  const timer = req.logger.startTimer('request');

  req.logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    timer.end('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      contentLength: res.get('content-length')
    });
    return originalSend.call(this, data);
  };

  next();
};

// Stream for Morgan HTTP logger integration
export const stream = {
  write: (message) => {
    defaultLogger.http(message.trim());
  }
};

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

// Development-only console wrapper (will be removed in production build)
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