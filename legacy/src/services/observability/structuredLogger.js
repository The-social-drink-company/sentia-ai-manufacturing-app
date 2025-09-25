import { devLog } from '../../lib/devLog.js';

// Structured Logging System for Enterprise Applications
// Provides consistent, searchable, and actionable log output

class StructuredLogger {
  constructor(options = {}) {
    this.level = options.level || null;
    this.service = options.service || null;
    this.version = options.version || null;
    this.environment = options.environment || process.env.NODE_ENV || null;
    this.enableConsole = options.enableConsole !== false;
    this.enableStorage = options.enableStorage !== false;
    this.maxStoredLogs = options.maxStoredLogs || 0;
    
    // Log levels with numeric values for filtering
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    
    // In-memory log storage for debugging
    this.logBuffer = [];
    
    // Performance tracking
    this.metrics = {
      logsGenerated: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0
    };
  }
  
  // Core logging method
  log(level, message, context = {}, error = null) {
    // Check if this log level should be output
    if (this.levels[level] > this.levels[this.level]) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.service,
      version: this.version,
      environment: this.environment,
      message: message,
      context: this.sanitizeContext(context),
      ...(error && { 
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      }),
      ...(typeof window !== 'undefined' && {
        userAgent: window.navigator?.userAgent,
        url: window.location?.href
      })
    };
    
    // Update metrics
    this.updateMetrics(level);
    
    // Store in buffer
    if (this.enableStorage) {
      this.storeLog(logEntry);
    }
    
    // Output to console
    if (this.enableConsole) {
      this.outputToConsole(logEntry);
    }
    
    // Send to external logging service (if configured)
    this.sendToExternalService(logEntry);
    
    return logEntry;
  }
  
  // Convenience methods
  error(message, context = {}, error = null) {
    return this.log('error', message, context, error);
  }
  
  warn(message, context = {}) {
    return this.log('warn', message, context);
  }
  
  info(message, context = {}) {
    return this.log('info', message, context);
  }
  
  debug(message, context = {}) {
    return this.log('debug', message, context);
  }
  
  trace(message, context = {}) {
    return this.log('trace', message, context);
  }
  
  // Sanitize context to remove sensitive information
  sanitizeContext(context) {
    if (!context || typeof context !== 'object') {
      return context;
    }
    
    const sanitized = { ...context };
    const sensitiveKeys = [
      'password', 'token', 'apiKey', 'secret', 'authorization',
      'credit_card', 'ssn', 'social_security', 'auth', 'bearer'
    ];
    
    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  // Store log in memory buffer
  storeLog(logEntry) {
    this.logBuffer.push(logEntry);
    
    // Maintain buffer size
    if (this.logBuffer.length > this.maxStoredLogs) {
      this.logBuffer.shift(); // Remove oldest log
    }
  }
  
  // Output to console with appropriate formatting
  outputToConsole(logEntry) {
    const consoleMessage = this.formatConsoleMessage(logEntry);
    
    switch (logEntry.level) {
      case 'ERROR':
        devLog.error(consoleMessage);
        break;
      case 'WARN':
        devLog.warn(consoleMessage);
        break;
      case 'INFO':
        devLog.log(consoleMessage);
        break;
      case 'DEBUG':
        console.debug(consoleMessage);
        break;
      case 'TRACE':
        console.trace(consoleMessage);
        break;
      default:
        devLog.log(consoleMessage);
    }
  }
  
  // Format message for console output
  formatConsoleMessage(logEntry) {
    const { timestamp, level, message, context, error } = logEntry;
    const time = new Date(timestamp).toLocaleTimeString();
    
    let formatted = `[${time}] ${level}: ${message}`;
    
    // Add context if present
    if (context && Object.keys(context).length > 0) {
      formatted += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    // Add error if present
    if (error) {
      formatted += `\nError: ${error.message}`;
      if (this.level === 'debug' || this.level === 'trace') {
        formatted += `\nStack: ${error.stack}`;
      }
    }
    
    return formatted;
  }
  
  // Send to external logging service
  async sendToExternalService(logEntry) {
    // Only send error and warn logs to external service in production
    if (this.environment === 'production' && 
        (logEntry.level === 'ERROR' || logEntry.level === 'WARN')) {
      
      try {
        // Example: Send to logging service
        // await fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(logEntry)
        // });
      } catch (error) {
        // Silently fail - don't log errors about logging
      }
    }
  }
  
  // Update internal metrics
  updateMetrics(level) {
    this.metrics.logsGenerated++;
    
    switch (level) {
      case 'error':
        this.metrics.errorCount++;
        break;
      case 'warn':
        this.metrics.warnCount++;
        break;
      case 'info':
        this.metrics.infoCount++;
        break;
      case 'debug':
        this.metrics.debugCount++;
        break;
    }
  }
  
  // Performance logging helpers
  time(label) {
    const startTime = performance.now();
    return {
      end: (message = `Timer ${label} completed`, context = {}) => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        this.info(message, {
          ...context,
          duration: `${duration}ms`,
          label
        });
        
        return duration;
      }
    };
  }
  
  // Request/response logging
  logRequest(method, url, context = {}) {
    return this.info('API Request', {
      method: method.toUpperCase(),
      url,
      ...context,
      type: 'request'
    });
  }
  
  logResponse(method, url, status, responseTime, context = {}) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    
    return this.log(level, 'API Response', {
      method: method.toUpperCase(),
      url,
      status,
      responseTime: `${responseTime}ms`,
      ...context,
      type: 'response'
    });
  }
  
  // User action logging
  logUserAction(action, details = {}) {
    return this.info('User Action', {
      action,
      ...details,
      type: 'user_action',
      userId: details.userId || null
    });
  }
  
  // Business event logging
  logBusinessEvent(event, details = {}) {
    return this.info('Business Event', {
      event,
      ...details,
      type: 'business_event'
    });
  }
  
  // Error boundary logging
  logError(error, context = {}) {
    return this.error('Application Error', {
      ...context,
      componentStack: context.componentStack,
      errorBoundary: true
    }, error);
  }
  
  // Search logs
  searchLogs(query, options = {}) {
    const { level, startDate, endDate, limit = 100 } = options;
    
    let filteredLogs = [...this.logBuffer];
    
    // Filter by level
    if (level) {
      filteredLogs = filteredLogs.filter(log => 
        log.level.toLowerCase() === level.toLowerCase()
      );
    }
    
    // Filter by date range
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(endDate)
      );
    }
    
    // Filter by query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(lowerQuery) ||
        JSON.stringify(log.context).toLowerCase().includes(lowerQuery)
      );
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit
    return filteredLogs.slice(0, limit);
  }
  
  // Get metrics and statistics
  getMetrics() {
    return {
      ...this.metrics,
      bufferSize: this.logBuffer.length,
      maxBufferSize: this.maxStoredLogs,
      currentLevel: this.level,
      environment: this.environment,
      service: this.service
    };
  }
  
  // Export logs for analysis
  exportLogs(format = 'json') {
    switch (format) {
      case 'csv':
        return this.exportAsCSV();
      case 'json':
      default:
        return JSON.stringify(this.logBuffer, null, 2);
    }
  }
  
  // Export as CSV format
  exportAsCSV() {
    if (this.logBuffer.length === 0) {
      return '';
    }
    
    const headers = ['timestamp', 'level', 'message', 'context', 'error'];
    const rows = this.logBuffer.map(log => [
      log.timestamp,
      log.level,
      log.message,
      JSON.stringify(log.context || {}),
      log.error ? log.error.message : ''
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
  
  // Clear log buffer
  clearLogs() {
    const count = this.logBuffer.length;
    this.logBuffer = [];
    return count;
  }
  
  // Set log level
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
      return true;
    }
    return false;
  }
}

// Create singleton instance
const logger = new StructuredLogger({
  service: 'sentia-manufacturing',
  environment: typeof window !== 'undefined' ? 'browser' : 'server'
});

// Export convenience functions
export const logError = (message, context, error) => logger.error(message, context, error);
export const logWarn = (message, context) => logger.warn(message, context);
export const logInfo = (message, context) => logger.info(message, context);
export const logDebug = (message, context) => logger.debug(message, context);
export const logTrace = (message, context) => logger.trace(message, context);

export const logRequest = (method, url, context) => logger.logRequest(method, url, context);
export const logResponse = (method, url, status, responseTime, context) => 
  logger.logResponse(method, url, status, responseTime, context);

export const logUserAction = (action, details) => logger.logUserAction(action, details);
export const logBusinessEvent = (event, details) => logger.logBusinessEvent(event, details);

export const timeLog = (label) => logger.time(label);

// Export logger instance and class
export { logger, StructuredLogger };
export default logger;
