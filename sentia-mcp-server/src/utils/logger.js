import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';
import { performance } from 'perf_hooks';
import { SERVER_CONFIG } from '../config/server-config.js';

const namespace = 'sentia-mcp'
const allowed = () => process.env.NODE_ENV !== 'production'

// Async Local Storage for correlation tracking
const asyncLocalStorage = new AsyncLocalStorage();

// Performance timing storage
const performanceTimings = new Map();

// Log sampling configuration
const LOG_SAMPLING = {
  enabled: process.env.LOG_SAMPLING_ENABLED === 'true',
  rates: {
    debug: parseFloat(process.env.DEBUG_SAMPLING_RATE) || 0.1,
    info: parseFloat(process.env.INFO_SAMPLING_RATE) || 1.0,
    warn: parseFloat(process.env.WARN_SAMPLING_RATE) || 1.0,
    error: parseFloat(process.env.ERROR_SAMPLING_RATE) || 1.0
  }
};

// Enhanced error serialization
const errorFormat = winston.format((info) => {
  if (info.error && info.error instanceof Error) {
    info.error = {
      name: info.error.name,
      message: info.error.message,
      stack: info.error.stack,
      code: info.error.code,
      statusCode: info.error.statusCode,
      details: info.error.details
    };
  }
  return info;
});

// Async logging transport
class AsyncConsoleTransport extends winston.transports.Console {
  log(info, callback) {
    setImmediate(() => super.log(info, callback));
  }
}

// Performance timing format
const performanceFormat = winston.format((info) => {
  if (info.performanceTimer) {
    const timing = performanceTimings.get(info.performanceTimer);
    if (timing) {
      info.duration = performance.now() - timing.start;
      info.performanceData = {
        operation: timing.operation,
        context: timing.context,
        duration: info.duration,
        timestamp: timing.start
      };
      performanceTimings.delete(info.performanceTimer);
    }
  }
  return info;
});

// Log sampling format
const samplingFormat = winston.format((info) => {
  if (LOG_SAMPLING.enabled && LOG_SAMPLING.rates[info.level]) {
    const sampleRate = LOG_SAMPLING.rates[info.level];
    if (Math.random() > sampleRate) {
      return false; // Skip this log entry
    }
  }
  return info;
});

// Enhanced Winston Logger for MCP Server
export const mcpLogger = winston.createLogger({
  level: SERVER_CONFIG.logging.level || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    errorFormat(),
    performanceFormat(),
    samplingFormat(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, correlationId, service, duration, performanceData, ...meta }) => {
      const logEntry = {
        timestamp,
        level,
        message,
        correlationId: correlationId || asyncLocalStorage.getStore()?.correlationId,
        service: service || 'sentia-mcp',
        ...meta
      };

      // Add performance data if available
      if (duration !== undefined) {
        logEntry.duration = duration;
      }
      if (performanceData) {
        logEntry.performance = performanceData;
      }

      // Add memory usage in development
      if (process.env.NODE_ENV === 'development') {
        const memUsage = process.memoryUsage();
        logEntry.memory = {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        };
      }

      return JSON.stringify(logEntry);
    })
  ),
  defaultMeta: { service: 'sentia-mcp-server' },
  transports: [
    new AsyncConsoleTransport({
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

// Performance timing utilities
export const performanceTimer = {
  start: (operation, context = {}) => {
    const timerId = uuidv4();
    performanceTimings.set(timerId, {
      start: performance.now(),
      operation,
      context
    });
    return timerId;
  },
  
  end: (timerId, message = 'Operation completed', meta = {}) => {
    if (performanceTimings.has(timerId)) {
      mcpLogger.info(message, {
        performanceTimer: timerId,
        correlationId: asyncLocalStorage.getStore()?.correlationId || uuidv4(),
        ...meta
      });
    }
  },
  
  measure: (operation, fn, context = {}) => {
    const timerId = performanceTimer.start(operation, context);
    try {
      const result = fn();
      if (result && typeof result.then === 'function') {
        // Handle async functions
        return result.finally(() => {
          performanceTimer.end(timerId, `Async operation ${operation} completed`);
        });
      } else {
        // Handle sync functions
        performanceTimer.end(timerId, `Operation ${operation} completed`);
        return result;
      }
    } catch (error) {
      performanceTimer.end(timerId, `Operation ${operation} failed`, { error });
      throw error;
    }
  }
};

// Correlation context management
export const correlationContext = {
  run: (correlationId, fn) => {
    return asyncLocalStorage.run({ correlationId }, fn);
  },
  
  getId: () => {
    return asyncLocalStorage.getStore()?.correlationId;
  },
  
  middleware: (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    asyncLocalStorage.run({ correlationId }, next);
  }
};

// Enhanced logging functions with correlation ID support and performance tracking
export const createLogger = (correlationId = null) => {
  const getCorrelationId = () => correlationId || correlationContext.getId() || uuidv4();
  
  return {
    info: (message, meta = {}) => mcpLogger.info(message, { correlationId: getCorrelationId(), ...meta }),
    warn: (message, meta = {}) => mcpLogger.warn(message, { correlationId: getCorrelationId(), ...meta }),
    error: (message, meta = {}) => mcpLogger.error(message, { correlationId: getCorrelationId(), ...meta }),
    debug: (message, meta = {}) => mcpLogger.debug(message, { correlationId: getCorrelationId(), ...meta }),
    
    // Performance logging methods
    timing: (operation, fn, context = {}) => {
      return performanceTimer.measure(operation, fn, context);
    },
    
    startTimer: (operation, context = {}) => {
      return performanceTimer.start(operation, context);
    },
    
    endTimer: (timerId, message, meta = {}) => {
      performanceTimer.end(timerId, message, meta);
    },
    
    // Structured business event logging
    businessEvent: (event, data = {}) => {
      mcpLogger.info(`Business Event: ${event}`, {
        correlationId: getCorrelationId(),
        eventType: 'business',
        event,
        eventData: data,
        timestamp: new Date().toISOString()
      });
    },
    
    // Tool execution logging
    toolExecution: (toolName, status, duration, meta = {}) => {
      mcpLogger.info(`Tool Execution: ${toolName}`, {
        correlationId: getCorrelationId(),
        eventType: 'tool_execution',
        toolName,
        status,
        duration,
        ...meta
      });
    },
    
    // Integration logging
    integration: (integration, operation, status, meta = {}) => {
      mcpLogger.info(`Integration: ${integration} - ${operation}`, {
        correlationId: getCorrelationId(),
        eventType: 'integration',
        integration,
        operation,
        status,
        ...meta
      });
    }
  };
};

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