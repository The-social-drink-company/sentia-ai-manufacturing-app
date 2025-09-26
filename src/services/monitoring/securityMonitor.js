/**
 * Security Monitoring Service
 * Real-time security threat detection and compliance monitoring
 * Monitors for suspicious activity, CSP violations, and security best practices
 */

export class SecurityMonitor {
  constructor(config = {}) {
    this.config = {
      enableCSPReporting: config.enableCSPReporting !== false,
      enableRateLimitMonitoring: config.enableRateLimitMonitoring !== false,
      enableAuthMonitoring: config.enableAuthMonitoring !== false,
      maxFailedAttempts: config.maxFailedAttempts || 5,
      suspiciousActivityThreshold: config.suspiciousActivityThreshold || 10,
      reportingInterval: config.reportingInterval || 300000, // 5 minutes
      alertThresholds: {
        failedLogins: config.alertThresholds?.failedLogins || 5,
        rateLimitHits: config.alertThresholds?.rateLimitHits || 10,
        cspViolations: config.alertThresholds?.cspViolations || 3,
        ...config.alertThresholds
      },
      ...config
    }

    this.securityEvents = new Map()
    this.threatDetectors = new Map()
    this.alertHandlers = new Set()
    this.sessionThreatScores = new Map()
    this.isMonitoring = false
    this.reportingInterval = null

    // Bind methods
    this.handleCSPViolation = this.handleCSPViolation.bind(this)
    this.handleSecurityError = this.handleSecurityError.bind(this)
  }

  /**
   * Start security monitoring
   */
  start() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('Security monitor started')

    // Set up CSP violation reporting
    if (this.config.enableCSPReporting) {
      this.setupCSPReporting()
    }

    // Set up authentication monitoring
    if (this.config.enableAuthMonitoring) {
      this.setupAuthMonitoring()
    }

    // Register threat detectors
    this.registerThreatDetectors()

    // Start periodic security reporting
    this.startPeriodicReporting()

    // Monitor for security-related errors
    this.setupErrorMonitoring()
  }

  /**
   * Stop security monitoring
   */
  stop() {
    if (!this.isMonitoring) return

    this.isMonitoring = false

    // Remove event listeners
    if (typeof window !== 'undefined') {
      document.removeEventListener('securitypolicyviolation', this.handleCSPViolation)
      window.removeEventListener('error', this.handleSecurityError)
    }

    // Clear reporting interval
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval)
      this.reportingInterval = null
    }

    console.log('Security monitor stopped')
  }

  /**
   * Set up Content Security Policy violation reporting
   */
  setupCSPReporting() {
    if (typeof document === 'undefined') return

    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', this.handleCSPViolation)

    console.log('CSP violation reporting enabled')
  }

  /**
   * Handle CSP violations
   */
  handleCSPViolation(event) {
    const violation = {
      type: 'csp_violation',
      timestamp: Date.now(),
      directive: event.violatedDirective,
      blockedURI: event.blockedURI,
      documentURI: event.documentURI,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      sample: event.sample,
      disposition: event.disposition, // 'enforce' or 'report'
      severity: this.classifyCSPViolationSeverity(event)
    }

    this.recordSecurityEvent('csp_violation', violation)

    // Trigger alert for critical violations
    if (violation.severity === 'critical') {
      this.triggerSecurityAlert('critical_csp_violation', {
        directive: violation.directive,
        blockedURI: violation.blockedURI,
        sourceFile: violation.sourceFile
      })
    }
  }

  /**
   * Classify CSP violation severity
   */
  classifyCSPViolationSeverity(event) {
    const criticalDirectives = [
      'script-src',
      'object-src',
      'base-uri',
      'form-action'
    ]

    const warningDirectives = [
      'img-src',
      'style-src',
      'font-src',
      'media-src'
    ]

    if (criticalDirectives.some(dir => event.violatedDirective.includes(dir))) {
      return 'critical'
    }

    if (warningDirectives.some(dir => event.violatedDirective.includes(dir))) {
      return 'warning'
    }

    return 'info'
  }

  /**
   * Set up authentication monitoring
   */
  setupAuthMonitoring() {
    // Monitor auth-related events
    this.registerThreatDetector('failed_login', (events) => {
      const failedLogins = events.filter(e => e.type === 'auth_failure')
      const recentFailures = failedLogins.filter(e =>
        Date.now() - e.timestamp < 300000 // 5 minutes
      )

      if (recentFailures.length >= this.config.alertThresholds.failedLogins) {
        return {
          threat: 'brute_force_attempt',
          severity: 'high',
          details: {
            attempts: recentFailures.length,
            timeWindow: '5 minutes',
            sources: [...new Set(recentFailures.map(e => e.ipAddress))]
          }
        }
      }

      return null
    })

    console.log('Authentication monitoring enabled')
  }

  /**
   * Set up error monitoring for security issues
   */
  setupErrorMonitoring() {
    if (typeof window === 'undefined') return

    window.addEventListener('error', this.handleSecurityError)
    window.addEventListener('unhandledrejection', (event) => {
      this.handleSecurityError({
        message: event.reason?.message || 'Unhandled promise rejection',
        filename: 'unknown',
        lineno: 0,
        colno: 0,
        error: event.reason
      })
    })
  }

  /**
   * Handle security-related errors
   */
  handleSecurityError(event) {
    const securityKeywords = [
      'permission',
      'cors',
      'unauthorized',
      'forbidden',
      'blocked',
      'security',
      'xss',
      'injection'
    ]

    const errorMessage = event.message?.toLowerCase() || ''
    const isSecurityRelated = securityKeywords.some(keyword =>
      errorMessage.includes(keyword)
    )

    if (isSecurityRelated) {
      const securityError = {
        type: 'security_error',
        timestamp: Date.now(),
        message: event.message,
        filename: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        stack: event.error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        severity: this.classifySecurityErrorSeverity(event.message)
      }

      this.recordSecurityEvent('security_error', securityError)
    }
  }

  /**
   * Classify security error severity
   */
  classifySecurityErrorSeverity(message) {
    const criticalPatterns = [
      'xss',
      'injection',
      'unauthorized access',
      'permission denied'
    ]

    const warningPatterns = [
      'cors',
      'blocked',
      'forbidden'
    ]

    const lowerMessage = message?.toLowerCase() || ''

    if (criticalPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return 'critical'
    }

    if (warningPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return 'warning'
    }

    return 'info'
  }

  /**
   * Register threat detectors
   */
  registerThreatDetectors() {
    // Excessive API calls detector
    this.registerThreatDetector('api_abuse', (events) => {
      const apiCalls = events.filter(e => e.type === 'api_call')
      const recentCalls = apiCalls.filter(e =>
        Date.now() - e.timestamp < 60000 // 1 minute
      )

      if (recentCalls.length > 100) {
        return {
          threat: 'api_abuse',
          severity: 'medium',
          details: {
            callsPerMinute: recentCalls.length,
            endpoints: [...new Set(recentCalls.map(e => e.endpoint))]
          }
        }
      }

      return null
    })

    // Suspicious user behavior detector
    this.registerThreatDetector('suspicious_behavior', (events) => {
      const userActions = events.filter(e => e.type === 'user_action')
      const recentActions = userActions.filter(e =>
        Date.now() - e.timestamp < 300000 // 5 minutes
      )

      // Check for rapid, unusual patterns
      const actionTypes = recentActions.map(e => e.action)
      const uniqueActions = new Set(actionTypes)

      if (recentActions.length > 50 && uniqueActions.size < 3) {
        return {
          threat: 'bot_behavior',
          severity: 'medium',
          details: {
            actionsInTimeframe: recentActions.length,
            uniqueActionTypes: uniqueActions.size,
            timeWindow: '5 minutes'
          }
        }
      }

      return null
    })

    // Data exfiltration detector
    this.registerThreatDetector('data_exfiltration', (events) => {
      const dataAccess = events.filter(e => e.type === 'data_access')
      const recentAccess = dataAccess.filter(e =>
        Date.now() - e.timestamp < 600000 // 10 minutes
      )

      const sensitiveDataAccess = recentAccess.filter(e =>
        e.dataType && ['financial', 'user_data', 'credentials'].includes(e.dataType)
      )

      if (sensitiveDataAccess.length > 20) {
        return {
          threat: 'data_exfiltration',
          severity: 'critical',
          details: {
            sensitiveDataAccess: sensitiveDataAccess.length,
            dataTypes: [...new Set(sensitiveDataAccess.map(e => e.dataType))],
            timeWindow: '10 minutes'
          }
        }
      }

      return null
    })
  }

  /**
   * Register a custom threat detector
   */
  registerThreatDetector(name, detectorFunction) {
    this.threatDetectors.set(name, detectorFunction)
    console.log(`Registered threat detector: ${name}`)
  }

  /**
   * Record a security event
   */
  recordSecurityEvent(category, event) {
    if (!this.securityEvents.has(category)) {
      this.securityEvents.set(category, [])
    }

    const events = this.securityEvents.get(category)
    events.push(event)

    // Limit buffer size
    if (events.length > 1000) {
      events.splice(0, events.length - 1000)
    }

    // Run threat detection
    this.runThreatDetection(category, event)
  }

  /**
   * Run threat detection on new events
   */
  runThreatDetection(category, newEvent) {
    const allEvents = []
    for (const events of this.securityEvents.values()) {
      allEvents.push(...events)
    }

    // Run all registered detectors
    for (const [name, detector] of this.threatDetectors) {
      try {
        const threat = detector(allEvents)
        if (threat) {
          this.handleThreatDetection(name, threat)
        }
      } catch (error) {
        console.error(`Threat detector ${name} failed:`, error)
      }
    }
  }

  /**
   * Handle detected threats
   */
  handleThreatDetection(detectorName, threat) {
    const alert = {
      type: 'security_threat',
      detector: detectorName,
      timestamp: Date.now(),
      threatType: threat.threat,
      severity: threat.severity,
      details: threat.details,
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      ipAddress: this.getClientIP()
    }

    this.triggerSecurityAlert(threat.threat, alert)

    // Update session threat score
    this.updateSessionThreatScore(alert.sessionId, threat.severity)
  }

  /**
   * Update session threat score
   */
  updateSessionThreatScore(sessionId, severity) {
    const currentScore = this.sessionThreatScores.get(sessionId) || 0
    const severityScore = {
      'low': 1,
      'medium': 3,
      'high': 5,
      'critical': 10
    }[severity] || 1

    const newScore = currentScore + severityScore
    this.sessionThreatScores.set(sessionId, newScore)

    // Alert on high-risk sessions
    if (newScore >= 15) {
      this.triggerSecurityAlert('high_risk_session', {
        sessionId,
        threatScore: newScore,
        threshold: 15
      })
    }
  }

  /**
   * Trigger security alert
   */
  triggerSecurityAlert(alertType, details) {
    const alert = {
      type: 'security_alert',
      alertType,
      timestamp: Date.now(),
      severity: details.severity || 'medium',
      details,
      sessionId: this.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    console.warn('Security Alert:', alert)

    // Notify all alert handlers
    for (const handler of this.alertHandlers) {
      try {
        handler(alert)
      } catch (error) {
        console.error('Security alert handler failed:', error)
      }
    }

    // Record alert as security event
    this.recordSecurityEvent('alerts', alert)

    // Report to external services
    this.reportSecurityAlert(alert)
  }

  /**
   * Start periodic security reporting
   */
  startPeriodicReporting() {
    this.reportingInterval = setInterval(() => {
      this.generateSecurityReport()
    }, this.config.reportingInterval)
  }

  /**
   * Generate comprehensive security report
   */
  generateSecurityReport() {
    const report = {
      timestamp: Date.now(),
      timeWindow: this.config.reportingInterval,
      summary: {
        totalEvents: this.getTotalEventCount(),
        criticalAlerts: this.getCriticalAlertsCount(),
        cspViolations: this.getEventCount('csp_violation'),
        securityErrors: this.getEventCount('security_error'),
        threatDetections: this.getEventCount('alerts'),
        highRiskSessions: this.getHighRiskSessionsCount()
      },
      topThreats: this.getTopThreats(),
      riskSessions: this.getTopRiskSessions(),
      recommendations: this.generateSecurityRecommendations()
    }

    console.log('Security Report:', report)
    this.reportSecurityData(report)

    return report
  }

  /**
   * Get total event count across all categories
   */
  getTotalEventCount() {
    let total = 0
    for (const events of this.securityEvents.values()) {
      total += events.length
    }
    return total
  }

  /**
   * Get event count for specific category
   */
  getEventCount(category) {
    const events = this.securityEvents.get(category)
    return events ? events.length : 0
  }

  /**
   * Get critical alerts count
   */
  getCriticalAlertsCount() {
    const alerts = this.securityEvents.get('alerts') || []
    return alerts.filter(alert =>
      alert.severity === 'critical' || alert.details?.severity === 'critical'
    ).length
  }

  /**
   * Get high-risk sessions count
   */
  getHighRiskSessionsCount() {
    let count = 0
    for (const score of this.sessionThreatScores.values()) {
      if (score >= 10) count++
    }
    return count
  }

  /**
   * Get top threats by frequency
   */
  getTopThreats() {
    const threats = new Map()
    const alerts = this.securityEvents.get('alerts') || []

    for (const alert of alerts) {
      const threatType = alert.threatType || alert.alertType
      threats.set(threatType, (threats.get(threatType) || 0) + 1)
    }

    return Array.from(threats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([threat, count]) => ({ threat, count }))
  }

  /**
   * Get top risk sessions
   */
  getTopRiskSessions() {
    return Array.from(this.sessionThreatScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sessionId, score]) => ({ sessionId, score }))
  }

  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations() {
    const recommendations = []

    // CSP violations
    const cspViolations = this.getEventCount('csp_violation')
    if (cspViolations > 0) {
      recommendations.push({
        type: 'csp',
        priority: 'high',
        message: `${cspViolations} CSP violations detected. Review and tighten Content Security Policy.`,
        actions: [
          'Review blocked resources',
          'Update CSP directives',
          'Remove inline scripts/styles'
        ]
      })
    }

    // High-risk sessions
    const highRiskSessions = this.getHighRiskSessionsCount()
    if (highRiskSessions > 0) {
      recommendations.push({
        type: 'sessions',
        priority: 'critical',
        message: `${highRiskSessions} high-risk sessions detected. Consider additional monitoring.`,
        actions: [
          'Review session activities',
          'Implement additional verification',
          'Consider temporary access restrictions'
        ]
      })
    }

    // API abuse
    const topThreats = this.getTopThreats()
    if (topThreats.some(t => t.threat === 'api_abuse')) {
      recommendations.push({
        type: 'api',
        priority: 'medium',
        message: 'API abuse detected. Implement rate limiting and monitoring.',
        actions: [
          'Implement request rate limiting',
          'Add API key requirements',
          'Monitor for unusual patterns'
        ]
      })
    }

    return recommendations
  }

  /**
   * Add security alert handler
   */
  onAlert(handler) {
    if (typeof handler === 'function') {
      this.alertHandlers.add(handler)
    }
  }

  /**
   * Remove security alert handler
   */
  offAlert(handler) {
    this.alertHandlers.delete(handler)
  }

  /**
   * Track authentication event
   */
  trackAuthEvent(type, details) {
    const authEvent = {
      type: 'auth_' + type,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      ...details
    }

    this.recordSecurityEvent('auth_events', authEvent)
  }

  /**
   * Track API call for monitoring
   */
  trackApiCall(endpoint, method, responseTime, statusCode) {
    const apiEvent = {
      type: 'api_call',
      timestamp: Date.now(),
      endpoint,
      method,
      responseTime,
      statusCode,
      sessionId: this.getSessionId(),
      ipAddress: this.getClientIP()
    }

    this.recordSecurityEvent('api_calls', apiEvent)
  }

  /**
   * Track user action for behavioral analysis
   */
  trackUserAction(action, details) {
    const userEvent = {
      type: 'user_action',
      timestamp: Date.now(),
      action,
      sessionId: this.getSessionId(),
      ...details
    }

    this.recordSecurityEvent('user_actions', userEvent)
  }

  /**
   * Track data access for exfiltration monitoring
   */
  trackDataAccess(dataType, operation, recordCount) {
    const dataEvent = {
      type: 'data_access',
      timestamp: Date.now(),
      dataType,
      operation,
      recordCount,
      sessionId: this.getSessionId(),
      ipAddress: this.getClientIP()
    }

    this.recordSecurityEvent('data_access', dataEvent)
  }

  // Utility methods
  getSessionId() {
    return sessionStorage.getItem('sessionId') || 'unknown'
  }

  getClientIP() {
    // This would need to be provided by the backend
    return 'unknown'
  }

  reportSecurityAlert(alert) {
    // Report to external security services
    console.log('Reporting security alert to external services:', alert)
  }

  reportSecurityData(report) {
    // Report security metrics to monitoring services
    console.log('Reporting security data to monitoring services:', report)
  }
}

// Create and export singleton instance
export const securityMonitor = new SecurityMonitor({
  enableCSPReporting: true,
  enableRateLimitMonitoring: true,
  enableAuthMonitoring: true,
  maxFailedAttempts: 5,
  reportingInterval: 300000 // 5 minutes
})

export default SecurityMonitor