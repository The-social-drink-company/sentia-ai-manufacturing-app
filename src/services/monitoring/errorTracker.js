/**
 * Error Tracking and Alerting Service
 * Comprehensive error monitoring, categorization, and alerting system
 * Integrates with external services like Sentry, DataDog, etc.
 */

export class ErrorTracker {
  constructor(config = {}) {
    this.config = {
      maxErrors: config.maxErrors || 1000,
      enableConsoleLogging: config.enableConsoleLogging !== false,
      enableExternalReporting: config.enableExternalReporting !== false,
      alertThresholds: {
        errorRate: config.alertThresholds?.errorRate || 10, // errors per minute
        criticalErrors: config.alertThresholds?.criticalErrors || 1,
        repeatingErrors: config.alertThresholds?.repeatingErrors || 5
      },
      samplingRate: config.samplingRate || 1.0, // Sample 100% by default
      ...config
    }

    this.errors = []
    this.errorCounts = new Map()
    this.errorPatterns = new Map()
    this.alertHandlers = new Set()
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
    this.isTracking = false
  }

  /**
   * Start error tracking
   */
  start() {
    if (this.isTracking) return

    this.isTracking = true

    // Set up global error handlers
    this.setupGlobalErrorHandlers()

    // Set up unhandled promise rejection handler
    this.setupPromiseRejectionHandler()

    // Set up React error boundary integration
    this.setupReactErrorHandling()

    // Start periodic analysis
    this.startPeriodicAnalysis()

    console.log('Error tracker started')
  }

  /**
   * Stop error tracking
   */
  stop() {
    if (!this.isTracking) return

    this.isTracking = false

    // Remove global handlers
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleGlobalError)
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
    }

    console.log('Error tracker stopped')
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return

    this.handleGlobalError = (event) => {
      const errorInfo = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        type: 'javascript_error',
        severity: this.categorizeError(event.error || event.message)
      }

      this.trackError(errorInfo)
    }

    window.addEventListener('error', this.handleGlobalError)
  }

  /**
   * Set up promise rejection handler
   */
  setupPromiseRejectionHandler() {
    if (typeof window === 'undefined') return

    this.handleUnhandledRejection = (event) => {
      const reason = event.reason
      const errorInfo = {
        message: reason?.message || String(reason),
        stack: reason?.stack,
        type: 'unhandled_promise_rejection',
        severity: this.categorizeError(reason),
        promise: event.promise
      }

      this.trackError(errorInfo)
    }

    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  /**
   * Set up React error handling
   */
  setupReactErrorHandling() {
    // This would integrate with React Error Boundaries
    // For now, provide a manual reporting method
    window.__errorTracker = this
  }

  /**
   * Track an error manually
   */
  trackError(errorInfo, context = {}) {
    // Apply sampling rate
    if (Math.random() > this.config.samplingRate) return

    const processedError = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      ...errorInfo,
      context: {
        userId: context.userId,
        feature: context.feature,
        userAction: context.userAction,
        additionalData: context.additionalData,
        ...context
      },
      fingerprint: this.generateErrorFingerprint(errorInfo)
    }

    // Add to errors collection
    this.errors.push(processedError)

    // Limit collection size
    if (this.errors.length > this.config.maxErrors) {
      this.errors.splice(0, this.errors.length - this.config.maxErrors)
    }

    // Update error counts and patterns
    this.updateErrorMetrics(processedError)

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      console.error('Error tracked:', processedError)
    }

    // Check for immediate alerts
    this.checkAlertConditions(processedError)

    // Report to external services
    if (this.config.enableExternalReporting) {
      this.reportToExternalServices(processedError)
    }

    return processedError.id
  }

  /**
   * Track React component error
   */
  trackReactError(error, errorInfo, componentStack) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      type: 'react_error',
      severity: 'high',
      componentStack,
      errorInfo,
      reactVersion: this.getReactVersion()
    }

    return this.trackError(errorDetails, {
      feature: 'react_component',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    })
  }

  /**
   * Track API errors
   */
  trackApiError(response, request, context = {}) {
    const errorDetails = {
      message: `API Error: ${response.status} ${response.statusText}`,
      type: 'api_error',
      severity: response.status >= 500 ? 'high' : 'medium',
      apiEndpoint: request.url,
      httpMethod: request.method,
      statusCode: response.status,
      responseHeaders: response.headers
    }

    return this.trackError(errorDetails, {
      feature: 'api_client',
      userAction: context.userAction,
      additionalData: {
        requestId: response.headers?.get('x-request-id'),
        endpoint: request.url,
        method: request.method
      }
    })
  }

  /**
   * Track user-reported issues
   */
  trackUserReport(description, severity = 'medium', metadata = {}) {
    const errorDetails = {
      message: `User Report: ${description}`,
      type: 'user_report',
      severity,
      userReported: true,
      description
    }

    return this.trackError(errorDetails, {
      feature: 'user_feedback',
      additionalData: metadata
    })
  }

  /**
   * Categorize error severity
   */
  categorizeError(error) {
    if (!error) return 'low'

    const errorMessage = (error.message || String(error)).toLowerCase()

    // Critical errors
    const criticalPatterns = [
      'security',
      'authentication',
      'authorization',
      'cors',
      'network error',
      'failed to fetch',
      'syntax error',
      'reference error'
    ]

    // High severity errors
    const highPatterns = [
      'type error',
      'range error',
      'eval error',
      'uri error',
      'promise rejection',
      'api error'
    ]

    // Medium severity errors
    const mediumPatterns = [
      'warning',
      'deprecated',
      'validation error',
      'not found'
    ]

    if (criticalPatterns.some(pattern => errorMessage.includes(pattern))) {
      return 'critical'
    }

    if (highPatterns.some(pattern => errorMessage.includes(pattern))) {
      return 'high'
    }

    if (mediumPatterns.some(pattern => errorMessage.includes(pattern))) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Generate error fingerprint for deduplication
   */
  generateErrorFingerprint(errorInfo) {
    const key = [
      errorInfo.type,
      errorInfo.message,
      errorInfo.filename,
      errorInfo.lineno,
      errorInfo.stack?.split('\n')[0] // First line of stack trace
    ].filter(Boolean).join('|')

    // Create hash of key (simplified implementation)
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36)
  }

  /**
   * Update error metrics and patterns
   */
  updateErrorMetrics(error) {
    // Update error count by fingerprint
    const fingerprint = error.fingerprint
    const currentCount = this.errorCounts.get(fingerprint) || 0
    this.errorCounts.set(fingerprint, currentCount + 1)

    // Track error patterns
    const pattern = {
      type: error.type,
      severity: error.severity,
      message: error.message
    }

    const patternKey = `${error.type}:${error.severity}`
    if (!this.errorPatterns.has(patternKey)) {
      this.errorPatterns.set(patternKey, {
        ...pattern,
        count: 0,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp
      })
    }

    const existingPattern = this.errorPatterns.get(patternKey)
    existingPattern.count++
    existingPattern.lastSeen = error.timestamp
  }

  /**
   * Check alert conditions
   */
  checkAlertConditions(error) {
    // Critical error alert
    if (error.severity === 'critical') {
      this.triggerAlert('critical_error', {
        error,
        message: `Critical error detected: ${error.message}`,
        severity: 'critical'
      })
    }

    // Repeating error alert
    const errorCount = this.errorCounts.get(error.fingerprint)
    if (errorCount >= this.config.alertThresholds.repeatingErrors) {
      this.triggerAlert('repeating_error', {
        error,
        count: errorCount,
        message: `Error repeated ${errorCount} times: ${error.message}`,
        severity: 'high'
      })
    }

    // Error rate alert
    const recentErrors = this.getRecentErrors(60000) // Last minute
    if (recentErrors.length >= this.config.alertThresholds.errorRate) {
      this.triggerAlert('high_error_rate', {
        count: recentErrors.length,
        timeWindow: '1 minute',
        message: `High error rate: ${recentErrors.length} errors in 1 minute`,
        severity: 'high'
      })
    }
  }

  /**
   * Trigger alert
   */
  triggerAlert(alertType, details) {
    const alert = {
      type: 'error_alert',
      alertType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...details
    }

    console.warn('Error Alert:', alert)

    // Notify all alert handlers
    for (const handler of this.alertHandlers) {
      try {
        handler(alert)
      } catch (error) {
        console.error('Alert handler failed:', error)
      }
    }
  }

  /**
   * Start periodic analysis
   */
  startPeriodicAnalysis() {
    setInterval(() => {
      if (this.isTracking) {
        this.analyzeErrorPatterns()
        this.cleanupOldErrors()
      }
    }, 300000) // 5 minutes
  }

  /**
   * Analyze error patterns
   */
  analyzeErrorPatterns() {
    const analysis = {
      timestamp: Date.now(),
      totalErrors: this.errors.length,
      uniqueErrors: this.errorCounts.size,
      errorRate: this.calculateErrorRate(),
      topErrors: this.getTopErrors(),
      severityDistribution: this.getSeverityDistribution(),
      errorTrends: this.getErrorTrends()
    }

    console.log('Error Pattern Analysis:', analysis)
    return analysis
  }

  /**
   * Clean up old errors
   */
  cleanupOldErrors() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours

    // Remove old errors
    this.errors = this.errors.filter(error => error.timestamp > cutoffTime)

    // Clean up old error counts (keep only recent fingerprints)
    const recentFingerprints = new Set(this.errors.map(e => e.fingerprint))
    for (const [fingerprint] of this.errorCounts) {
      if (!recentFingerprints.has(fingerprint)) {
        this.errorCounts.delete(fingerprint)
      }
    }
  }

  /**
   * Get recent errors within timeframe
   */
  getRecentErrors(timeframe = 300000) {
    const cutoff = Date.now() - timeframe
    return this.errors.filter(error => error.timestamp > cutoff)
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    const recentErrors = this.getRecentErrors(60000) // Last minute
    return {
      perMinute: recentErrors.length,
      perHour: this.getRecentErrors(3600000).length,
      perDay: this.errors.length
    }
  }

  /**
   * Get top errors by frequency
   */
  getTopErrors(limit = 10) {
    return Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([fingerprint, count]) => {
        const error = this.errors.find(e => e.fingerprint === fingerprint)
        return {
          fingerprint,
          count,
          message: error?.message,
          type: error?.type,
          severity: error?.severity,
          lastSeen: error?.timestamp
        }
      })
  }

  /**
   * Get severity distribution
   */
  getSeverityDistribution() {
    const distribution = { critical: 0, high: 0, medium: 0, low: 0 }

    for (const error of this.errors) {
      if (distribution.hasOwnProperty(error.severity)) {
        distribution[error.severity]++
      }
    }

    return distribution
  }

  /**
   * Get error trends over time
   */
  getErrorTrends() {
    const now = Date.now()
    const hourly = new Array(24).fill(0)

    for (const error of this.errors) {
      const hourIndex = Math.floor((now - error.timestamp) / (60 * 60 * 1000))
      if (hourIndex >= 0 && hourIndex < 24) {
        hourly[23 - hourIndex]++
      }
    }

    return {
      hourly,
      peak: Math.max(...hourly),
      average: hourly.reduce((a, b) => a + b, 0) / hourly.length
    }
  }

  /**
   * Add alert handler
   */
  onAlert(handler) {
    if (typeof handler === 'function') {
      this.alertHandlers.add(handler)
    }
  }

  /**
   * Remove alert handler
   */
  offAlert(handler) {
    this.alertHandlers.delete(handler)
  }

  /**
   * Export error data for external services
   */
  exportErrorData() {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      version: '1.0',
      errors: this.errors.map(error => ({
        ...error,
        // Remove sensitive data
        userAgent: undefined,
        context: {
          ...error.context,
          additionalData: undefined // Remove potentially sensitive data
        }
      })),
      summary: {
        totalErrors: this.errors.length,
        uniqueErrors: this.errorCounts.size,
        errorRate: this.calculateErrorRate(),
        severityDistribution: this.getSeverityDistribution()
      }
    }
  }

  /**
   * Report to external monitoring services
   */
  reportToExternalServices(error) {
    // Report to Sentry
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          errorType: error.type,
          severity: error.severity
        },
        extra: error.context
      })
    }

    // Report to DataDog (if configured)
    if (window.DD_RUM) {
      window.DD_RUM.addError(error.message, {
        type: error.type,
        severity: error.severity,
        fingerprint: error.fingerprint
      })
    }

    // Custom reporting endpoint
    if (this.config.reportingEndpoint) {
      fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: error.timestamp,
          sessionId: this.sessionId,
          error: {
            message: error.message,
            type: error.type,
            severity: error.severity,
            fingerprint: error.fingerprint,
            stack: error.stack
          }
        })
      }).catch(reportingError => {
        console.warn('Failed to report error to external service:', reportingError)
      })
    }
  }

  // Utility methods
  generateSessionId() {
    return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  generateErrorId() {
    return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
  }

  getReactVersion() {
    if (typeof window !== 'undefined' && window.React) {
      return window.React.version || 'unknown'
    }
    return 'not_detected'
  }
}

// Create and export singleton instance
export const errorTracker = new ErrorTracker({
  maxErrors: 1000,
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableExternalReporting: process.env.NODE_ENV === 'production',
  alertThresholds: {
    errorRate: 10,
    criticalErrors: 1,
    repeatingErrors: 5
  }
})

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  errorTracker.start()
}

export default ErrorTracker