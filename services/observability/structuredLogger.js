import winston from 'winston';
import crypto from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage for request context
const asyncLocalStorage = new AsyncLocalStorage();

// Generate correlation ID
export const generateCorrelationId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Get current correlation ID from context
export const getCorrelationId = () => {
  const store = asyncLocalStorage.getStore();
  return store?.correlationId || 'system';
};

// Set correlation ID in context
export const withCorrelationId = (correlationId, fn) => {
  return asyncLocalStorage.run({ correlationId }, fn);
};

// Structured log format
const structuredFormat = winston.format.printf(({ 
  level, 
  message, 
  timestamp, 
  correlationId,
  service,
  environment,
  version,
  ...metadata 
}) => {
  const logEntry = {
    timestamp,
    level,
    service,
    environment,
    version,
    correlationId: correlationId || getCorrelationId(),
    message,
    ...metadata
  };
  
  // Remove undefined values
  Object.keys(logEntry).forEach(key => 
    logEntry[key] === undefined && delete logEntry[key]
  );
  
  return JSON.stringify(logEntry);
});

// Create structured logger
const createStructuredLogger = () => {
  const defaultMeta = {
    service: process.env.SERVICE_NAME || 'sentia-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.VERSION || process.env.npm_package_version || 'unknown'
  };
  
  // Don't use file transports in production environments like Render
  // File system may be read-only or ephemeral
  const transports = [];

  // Only add file transports in true local development (avoid container/Render/CI)
  const isContainer = !!(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL || process.env.CI);
  if (process.env.NODE_ENV === 'development' && !isContainer) {
    try {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10485760, // 10MB
          maxFiles: 10
        })
      );
    } catch (err) {
      // Silently ignore file transport errors
      console.warn('Unable to create file transports for logger');
    }
  }

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      structuredFormat
    ),
    transports
  });
  
  // Add console transport for non-production
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }));
  }
  
  // Add JSON console transport for production
  if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.Console({
      format: structuredFormat
    }));
  }
  
  return logger;
};

// Create singleton logger instance
const structuredLogger = createStructuredLogger();

// Log with correlation ID
export const log = (level, message, metadata = {}) => {
  structuredLogger.log(level, message, {
    correlationId: getCorrelationId(),
    ...metadata
  });
};

// Convenience methods
export const logInfo = (message, metadata = {}) => {
  log('info', message, metadata);
};

export const logError = (message, error = null, metadata = {}) => {
  const errorMeta = error ? {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    }
  } : {};
  
  log('error', message, { ...errorMeta, ...metadata });
};

export const logWarn = (message, metadata = {}) => {
  log('warn', message, metadata);
};

export const logDebug = (message, metadata = {}) => {
  log('debug', message, metadata);
};

// HTTP request logging
export const logHttpRequest = (req, res, duration) => {
  const metadata = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    statusCode: res.statusCode,
    duration,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id
  };
  
  const level = res.statusCode >= 500 ? 'error' 
    : res.statusCode >= 400 ? 'warn' 
    : 'info';
  
  log(level, `HTTP ${req.method} ${req.path}`, metadata);
};

// Database query logging
export const logDatabaseQuery = (query, params, duration, error = null) => {
  const metadata = {
    query: query.substring(0, 500), // Limit query length
    duration,
    paramCount: params?.length || 0
  };
  
  if (error) {
    logError('Database query failed', error, metadata);
  } else {
    logDebug('Database query executed', metadata);
  }
};

// External API call logging
export const logApiCall = (service, endpoint, method, duration, statusCode, error = null) => {
  const metadata = {
    service,
    endpoint,
    method,
    duration,
    statusCode
  };
  
  if (error) {
    logError(`External API call failed: ${service}`, error, metadata);
  } else {
    logInfo(`External API call: ${service}`, metadata);
  }
};

// Performance logging
export const logPerformance = (operation, duration, metadata = {}) => {
  logInfo(`Performance: ${operation}`, {
    operation,
    duration,
    ...metadata
  });
};

// Security event logging
export const logSecurityEvent = (event, severity, metadata = {}) => {
  const level = severity === 'critical' ? 'error' 
    : severity === 'high' ? 'warn' 
    : 'info';
  
  log(level, `Security event: ${event}`, {
    securityEvent: event,
    severity,
    ...metadata
  });
};

// Business event logging
export const logBusinessEvent = (event, metadata = {}) => {
  logInfo(`Business event: ${event}`, {
    businessEvent: event,
    ...metadata
  });
};

// Audit logging
export const logAudit = (action, resource, userId, result, metadata = {}) => {
  logInfo('Audit event', {
    audit: {
      action,
      resource,
      userId,
      result,
      timestamp: new Date().toISOString()
    },
    ...metadata
  });
};

// Express middleware for correlation ID
export const correlationIdMiddleware = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || 
                        req.headers['x-request-id'] || 
                        generateCorrelationId();
  
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  withCorrelationId(correlationId, () => {
    next();
  });
};

// Express middleware for request logging
export const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logInfo(`Request started: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    const duration = Date.now() - start;
    
    logHttpRequest(req, res, duration);
    
    return res.send(data);
  };
  
  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (err, req, res, next) => {
  logError('Unhandled error in request', err, {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body
  });
  
  next(err);
};

export default {
  generateCorrelationId,
  getCorrelationId,
  withCorrelationId,
  correlationIdMiddleware,
  requestLoggingMiddleware,
  errorLoggingMiddleware,
  log,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logHttpRequest,
  logDatabaseQuery,
  logApiCall,
  logPerformance,
  logSecurityEvent,
  logBusinessEvent,
  logAudit
};