/**
 * Enterprise Comprehensive Logging System
 * Structured logging with multiple transports and correlation tracking
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
// import { ElasticsearchTransport } from 'winston-elasticsearch'; // Optional - install if using Elasticsearch
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnterpriseLogger {
  constructor() {
    this.logger = null;
    this.correlationStore = new Map();
    this.performanceMarks = new Map();
    this.logBuffer = [];
    this.bufferSize = 1000;
    this.initialized = false;

    // Log levels
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      verbose: 4,
      debug: 5,
      silly: 6
    };

    // Log colors for console output
    this.colors = {
      error: 'red',
      warn: 'yellow',
      info: 'green',
      http: 'magenta',
      verbose: 'cyan',
      debug: 'blue',
      silly: 'gray'
    };
  }

  /**
   * Initialize logger with configuration
   */
  initialize(config = {}) {
    if (this.initialized) return;

    winston.addColors(this.colors);

    // Create logger instance
    this.logger = winston.createLogger({
      level: config.level || process.env.LOG_LEVEL || 'info',
      levels: this.levels,
      format: this.createLogFormat(),
      defaultMeta: this.getDefaultMeta(),
      transports: this.createTransports(config),
      exceptionHandlers: this.createExceptionHandlers(),
      rejectionHandlers: this.createRejectionHandlers(),
      exitOnError: false
    });

    // Add query capabilities
    this.setupQueryMethods();

    // Start buffer flush interval
    this.startBufferFlush();

    // Log system startup
    this.info('Logger initialized', {
      level: this.logger.level,
      transports: this.logger.transports.map(t => t.name),
      hostname: os.hostname(),
      pid: process.pid
    });

    this.initialized = true;
  }

  /**
   * Create log format
   */
  createLogFormat() {
    const { combine, timestamp, errors, json, printf, colorize, metadata } = winston.format;

    // Custom format for different environments
    const devFormat = printf(({ level, _message, timestamp, ...metadata }) => {
      const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${meta}`;
    });

    const prodFormat = combine(
      timestamp({ format: 'ISO' }),
      errors({ stack: true }),
      json()
    );

    return process.env.NODE_ENV === 'production'
      ? prodFormat
      : combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          colorize(),
          devFormat
        );
  }

  /**
   * Get default metadata
   */
  getDefaultMeta() {
    return {
      service: 'sentia-manufacturing',
      environment: process.env.NODE_ENV || 'development',
      hostname: os.hostname(),
      pid: process.pid,
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  /**
   * Create log transports
   */
  createTransports(config) {
    const transports = [];

    // Console transport
    if (config.console !== false) {
      transports.push(new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true
      }));
    }

    // Only add file transports in development or when not on Railway/Render
    // Railway/Render filesystems are read-only/ephemeral
    const isCloudPlatform = process.env.RENDER || process.env.RAILWAY_ENVIRONMENT || process.env.RENDER_EXTERNAL_URL;
    if (!isCloudPlatform && process.env.NODE_ENV !== 'production') {
      try {
        // File transport - all logs
        transports.push(new DailyRotateFile({
          filename: path.join(config.logDir || 'logs', '%DATE%-combined.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.json(),
          auditFile: path.join(config.logDir || 'logs', '.audit-combined.json')
        }));

        // File transport - errors only
        transports.push(new DailyRotateFile({
          filename: path.join(config.logDir || 'logs', '%DATE%-error.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: winston.format.json(),
          auditFile: path.join(config.logDir || 'logs', '.audit-error.json')
        }));
      } catch (err) {
        console.warn('Unable to create file transports:', err.message);
      }
    }

    // Elasticsearch transport for production (optional - uncomment if using Elasticsearch)
    /*
    if (process.env.ELASTICSEARCH_URL) {
      transports.push(new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: process.env.ELASTICSEARCH_URL,
          auth: {
            username: process.env.ELASTICSEARCH_USER,
            password: process.env.ELASTICSEARCH_PASSWORD
          }
        },
        index: 'logs-sentia',
        transformer: this.elasticsearchTransformer.bind(this)
      }));
    }
    */

    // Syslog transport for enterprise logging (optional - uncomment if using Syslog)
    /*
    if (process.env.SYSLOG_HOST) {
      const Syslog = require('winston-syslog').Syslog;
      transports.push(new Syslog({
        host: process.env.SYSLOG_HOST,
        port: process.env.SYSLOG_PORT || 514,
        protocol: process.env.SYSLOG_PROTOCOL || 'udp4',
        app_name: 'sentia-manufacturing'
      }));
    }
    */

    return transports;
  }

  /**
   * Create exception handlers
   */
  createExceptionHandlers() {
    // Don't create file handlers on Railway/Render
    if (process.env.RENDER || process.env.RAILWAY_ENVIRONMENT || process.env.RENDER_EXTERNAL_URL) {
      return [
        new winston.transports.Console({
          format: winston.format.json()
        })
      ];
    }

    // Only create file handlers in development
    if (process.env.NODE_ENV !== 'production') {
      try {
        return [
          new winston.transports.File({
            filename: 'logs/exceptions.log',
            format: winston.format.json()
          })
        ];
      } catch (err) {
        return [
          new winston.transports.Console({
            format: winston.format.json()
          })
        ];
      }
    }

    return [];
  }

  /**
   * Create rejection handlers
   */
  createRejectionHandlers() {
    // Don't create file handlers on Railway/Render
    if (process.env.RENDER || process.env.RAILWAY_ENVIRONMENT || process.env.RENDER_EXTERNAL_URL) {
      return [
        new winston.transports.Console({
          format: winston.format.json()
        })
      ];
    }

    // Only create file handlers in development
    if (process.env.NODE_ENV !== 'production') {
      try {
        return [
          new winston.transports.File({
            filename: 'logs/rejections.log',
            format: winston.format.json()
          })
        ];
      } catch (err) {
        return [
          new winston.transports.Console({
            format: winston.format.json()
          })
        ];
      }
    }

    return [];
  }

  /**
   * Transform log for Elasticsearch
   */
  elasticsearchTransformer(logData) {
    return {
      '@timestamp': logData.timestamp || new Date().toISOString(),
      severity: logData.level,
      message: logData.message,
      fields: {
        ...logData.metadata,
        correlationId: this.getCorrelationId(),
        sessionId: this.getSessionId()
      }
    };
  }

  /**
   * Core logging methods
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  http(message, meta = {}) {
    this.log('http', message, meta);
  }

  verbose(message, meta = {}) {
    this.log('verbose', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  silly(message, meta = {}) {
    this.log('silly', message, meta);
  }

  /**
   * Main logging method
   */
  log(level, message, meta = {}) {
    if (!this.logger) {
      // Buffer logs before initialization
      this.bufferLog(level, message, meta);
      return;
    }

    // Add correlation ID
    const correlationId = this.getCorrelationId();
    const sessionId = this.getSessionId();

    // Enhance metadata
    const enhancedMeta = {
      ...meta,
      correlationId,
      sessionId,
      timestamp: new Date().toISOString()
    };

    // Log to winston
    this.logger.log(level, message, enhancedMeta);

    // Track metrics
    this.trackMetrics(level);
  }

  /**
   * Buffer logs before initialization
   */
  bufferLog(level, message, meta) {
    this.logBuffer.push({ level, message, meta, timestamp: Date.now() });

    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Flush buffered logs
   */
  flushBuffer() {
    if (!this.logger || this.logBuffer.length === 0) return;

    const buffer = [...this.logBuffer];
    this.logBuffer = [];

    buffer.forEach(({ level, _message, meta }) => {
      this.log(level, message, meta);
    });
  }

  /**
   * Start buffer flush interval
   */
  startBufferFlush() {
    setInterval(_() => {
      this.flushBuffer();
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Structured logging methods
   */
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      requestId: req.id,
      query: req.query,
      params: req.params
    };

    const level = res.statusCode >= 500 ? 'error' :
                  res.statusCode >= 400 ? 'warn' :
                  'http';

    this.log(level, `${req.method} ${req.url} ${res.statusCode}`, meta);
  }

  logDatabase(operation, query, duration, error = null) {
    const meta = {
      operation,
      query: this.sanitizeQuery(query),
      duration,
      success: !error,
      error: error?.message
    };

    const level = error ? 'error' : duration > 1000 ? 'warn' : 'debug';
    this.log(level, `Database ${operation}`, meta);
  }

  logSecurity(event, details) {
    const meta = {
      event,
      ...details,
      timestamp: new Date().toISOString(),
      severity: this.getSecuritySeverity(event)
    };

    this.warn(`Security Event: ${event}`, meta);
  }

  logPerformance(operation, duration, metadata = {}) {
    const meta = {
      operation,
      duration,
      ...metadata
    };

    const level = duration > 5000 ? 'warn' : 'info';
    this.log(level, `Performance: ${operation}`, meta);
  }

  logAudit(action, userId, details) {
    const meta = {
      action,
      userId,
      ...details,
      auditId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    this.info(`Audit: ${action}`, meta);
  }

  /**
   * Performance tracking
   */
  startTimer(label) {
    const id = crypto.randomUUID();
    this.performanceMarks.set(id, {
      label,
      start: performance.now()
    });
    return id;
  }

  endTimer(id, metadata = {}) {
    const mark = this.performanceMarks.get(id);
    if (!mark) return;

    const duration = performance.now() - mark.start;
    this.performanceMarks.delete(id);

    this.logPerformance(mark.label, duration, metadata);
    return duration;
  }

  /**
   * Correlation tracking
   */
  setCorrelationId(id) {
    if (typeof AsyncLocalStorage !== 'undefined') {
      // Use AsyncLocalStorage if available
      this.correlationStore.set('current', id);
    }
  }

  getCorrelationId() {
    return this.correlationStore.get('current') || crypto.randomUUID();
  }

  setSessionId(id) {
    this.correlationStore.set('session', id);
  }

  getSessionId() {
    return this.correlationStore.get('session');
  }

  /**
   * Query methods
   */
  setupQueryMethods() {
    this.query = {
      lastLogs: (options = {}) => this.queryLogs({ ...options, order: 'desc' }),
      errorLogs: (options = {}) => this.queryLogs({ ...options, level: 'error' }),
      userLogs: (userId, options = {}) => this.queryLogs({ ...options, userId }),
      timeRange: (from, to, options = {}) => this.queryLogs({ ...options, from, to })
    };
  }

  async queryLogs(options = {}) {
    return new Promise(_(resolve, _reject) => {
      const queryOptions = {
        from: options.from || new Date(Date.now() - 24 * 60 * 60 * 1000),
        until: options.until || new Date(),
        limit: options.limit || 100,
        start: 0,
        order: options.order || 'desc',
        fields: options.fields
      };

      this.logger.query(queryOptions, _(err, _results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Utility methods
   */
  sanitizeQuery(query) {
    // Remove sensitive information from queries
    if (typeof query === 'string') {
      return query
        .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
        .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
        .replace(/api_key\s*=\s*'[^']*'/gi, "api_key='***'");
    }
    return query;
  }

  getSecuritySeverity(event) {
    const criticalEvents = ['breach', 'intrusion', 'unauthorized_access'];
    const highEvents = ['failed_auth', 'permission_denied', 'rate_limit'];
    const mediumEvents = ['suspicious_activity', 'invalid_input'];

    if (criticalEvents.some(e => event.toLowerCase().includes(e))) return 'critical';
    if (highEvents.some(e => event.toLowerCase().includes(e))) return 'high';
    if (mediumEvents.some(e => event.toLowerCase().includes(e))) return 'medium';
    return 'low';
  }

  trackMetrics(level) {
    // Track log level metrics for monitoring
    if (!this.metrics) {
      this.metrics = {
        error: 0,
        warn: 0,
        info: 0,
        http: 0,
        verbose: 0,
        debug: 0
      };
    }

    if (this.metrics[level] !== undefined) {
      this.metrics[level]++;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Express middleware
   */
  middleware() {
    return (req, res, _next) => {
      req.id = crypto.randomUUID();
      const startTime = Date.now();

      // Log request start
      this.http(`Incoming ${req.method} ${req.url}`, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        requestId: req.id
      });

      // Capture response
      const originalSend = res.send;
      res.send = function(data) {
        res.send = originalSend;
        const responseTime = Date.now() - startTime;

        // Log request completion
        this.logRequest(req, res, responseTime);

        return res.send(data);
      }.bind(this);

      next();
    };
  }

  /**
   * Error middleware
   */
  errorMiddleware() {
    return (err, req, res, _next) => {
      this.error('Express error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        requestId: req.id
      });

      next(err);
    };
  }

  /**
   * Child logger
   */
  child(defaultMeta = {}) {
    const childLogger = Object.create(this);
    childLogger.defaultMeta = { ...this.defaultMeta, ...defaultMeta };
    return childLogger;
  }

  /**
   * Shutdown logger
   */
  async shutdown() {
    this.info('Logger shutting down');

    // Flush remaining logs
    this.flushBuffer();

    // Close transports
    return new Promise(_(resolve) => {
      this.logger.end(_() => {
        resolve();
      });
    });
  }
}

// Create singleton instance
const logger = new EnterpriseLogger();

// Initialize with default configuration
logger.initialize();

// Export logger instance and methods
export default logger;

export const {
  error,
  warn,
  info,
  http,
  verbose,
  debug,
  silly,
  logRequest,
  logDatabase,
  logSecurity,
  logPerformance,
  logAudit,
  startTimer,
  endTimer,
  middleware,
  errorMiddleware
} = logger;

// Export child logger factory
export function createLogger(meta) {
  return logger.child(meta);
}