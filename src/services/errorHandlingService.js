import { devLog } from '../lib/devLog.js';\n
// Enterprise Error Handling Service
class ErrorHandlingService {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 1000;
    this.errorCounts = new Map();
    this.notifications = [];
  }

  handleError(error, context = {}) {
    const errorEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      severity: this.determineSeverity(error, context),
      resolved: false
    };

    this.errorLog.unshift(errorEntry);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Count error types
    const errorType = error.constructor.name;
    this.errorCounts.set(errorType, (this.errorCounts.get(errorType) || 0) + 1);

    // Handle based on severity
    this.processError(errorEntry);

    return errorEntry.id;
  }

  determineSeverity(error, context) {
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return context.critical ? 'high' : 'medium';
    }
    
    if (error.message?.includes('authentication') || error.message?.includes('authorization')) {
      return 'high';
    }
    
    if (error.message?.includes('validation') || error.message?.includes('format')) {
      return 'low';
    }
    
    return 'medium';
  }

  processError(errorEntry) {
    switch (errorEntry.severity) {
      case 'high':
        this.sendAlert(errorEntry);
        devLog.error('[CRITICAL ERROR]', errorEntry);
        break;
      case 'medium':
        this.logWarning(errorEntry);
        break;
      case 'low':
        this.logInfo(errorEntry);
        break;
    }
  }

  sendAlert(errorEntry) {
    // In production, send to monitoring service
    this.notifications.push({
      type: 'alert',
      error: errorEntry,
      timestamp: new Date().toISOString()
    });
  }

  logWarning(errorEntry) {
    devLog.warn('[WARNING]', errorEntry.message, errorEntry.context);
  }

  logInfo(errorEntry) {
    devLog.log('[INFO]', errorEntry.message);
  }

  getErrorSummary() {
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentErrors = this.errorLog.filter(e => 
      new Date(e.timestamp).getTime() > last24Hours
    );

    return {
      total: this.errorLog.length,
      last24Hours: recentErrors.length,
      byType: Object.fromEntries(this.errorCounts),
      bySeverity: {
        high: recentErrors.filter(e => e.severity === 'high').length,
        medium: recentErrors.filter(e => e.severity === 'medium').length,
        low: recentErrors.filter(e => e.severity === 'low').length
      },
      unresolved: this.errorLog.filter(e => !e.resolved).length
    };
  }

  resolveError(errorId) {
    const error = this.errorLog.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  clearOldErrors() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    this.errorLog = this.errorLog.filter(e => 
      new Date(e.timestamp).getTime() > cutoff
    );
  }
}

// Global error handlers
const errorHandler = new ErrorHandlingService();

// Handle unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(event.reason, { type: 'unhandledRejection' });
  });
  
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error, { 
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno
    });
  });
}

export default errorHandler;
