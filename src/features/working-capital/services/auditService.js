/**
 * Audit Trail Service for Working Capital Management
 * Provides comprehensive logging and tracking of all user actions
 */

// Audit event types
export const AUDIT_EVENTS = {
  // Data Access
  DATA_VIEW: 'data_view',
  DATA_EXPORT: 'data_export',
  DATA_REFRESH: 'data_refresh',

  // Dashboard Actions
  DASHBOARD_ACCESS: 'dashboard_access',
  PERIOD_CHANGE: 'period_change',
  CURRENCY_CHANGE: 'currency_change',

  // Export Actions
  EXPORT_CSV: 'export_csv',
  EXPORT_EXCEL: 'export_excel',
  EXPORT_PDF: 'export_pdf',
  EXPORT_JSON: 'export_json',

  // Forecasting
  FORECAST_GENERATE: 'forecast_generate',
  SCENARIO_CREATE: 'scenario_create',
  RISK_ASSESS: 'risk_assess',

  // Recommendations
  RECOMMENDATION_VIEW: 'recommendation_view',
  RECOMMENDATION_ACTION: 'recommendation_action',
  OPTIMIZATION_ANALYSIS: 'optimization_analysis',

  // Configuration Changes
  SETTINGS_UPDATE: 'settings_update',
  THRESHOLD_CHANGE: 'threshold_change',
  ALERT_CONFIG: 'alert_config',

  // System Events
  ERROR_OCCURRED: 'error_occurred',
  PERFORMANCE_ISSUE: 'performance_issue',
  API_FAILURE: 'api_failure'
}

// Audit severity levels
export const AUDIT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
}

// Compliance requirements
export const COMPLIANCE_STANDARDS = {
  SOX: 'sox', // Sarbanes-Oxley Act
  GDPR: 'gdpr', // General Data Protection Regulation
  PCI_DSS: 'pci_dss', // Payment Card Industry Data Security Standard
  ISO27001: 'iso27001', // Information Security Management
  INTERNAL: 'internal' // Internal compliance requirements
}

class AuditLogger {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.userId = null
    this.userRole = null
    this.auditQueue = []
    this.batchSize = 10
    this.flushInterval = 30000 // 30 seconds
    this.maxRetries = 3

    // Start periodic flushing
    this.startPeriodicFlush()

    // Set up beforeunload to flush remaining logs
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true) // Synchronous flush on page unload
      })
    }
  }

  // Initialize user context
  setUserContext(user) {
    this.userId = user?.id || 'anonymous'
    this.userRole = user?.role || 'unknown'

    // Log session start
    this.logEvent(AUDIT_EVENTS.DASHBOARD_ACCESS, {
      action: 'session_start',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString()
    }, AUDIT_SEVERITY.INFO)
  }

  // Generate unique session ID
  generateSessionId() {
    return `wc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Log audit event
  logEvent(eventType, details = {}, severity = AUDIT_SEVERITY.INFO, compliance = []) {
    const auditEntry = {
      id: this.generateAuditId(),
      sessionId: this.sessionId,
      userId: this.userId,
      userRole: this.userRole,
      eventType,
      severity,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      details: this.sanitizeDetails(details),
      compliance: Array.isArray(compliance) ? compliance : [compliance].filter(Boolean),
      moduleContext: 'working_capital'
    }

    // Add to queue
    this.auditQueue.push(auditEntry)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${eventType}:`, auditEntry)
    }

    // Check if we need to flush
    if (this.auditQueue.length >= this.batchSize) {
      this.flush()
    }

    return auditEntry.id
  }

  // Generate unique audit ID
  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get client IP (best effort)
  getClientIP() {
    // In a real implementation, this would come from the server
    // For client-side, we can only get limited info
    return 'client_side_unknown'
  }

  // Sanitize sensitive data from details
  sanitizeDetails(details) {
    const sanitized = { ...details }

    // Remove or mask sensitive fields
    const sensitiveFields = [
      'password', 'token', 'apiKey', 'secret', 'ssn',
      'creditCard', 'bankAccount', 'personalData'
    ]

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })

    // Mask email addresses partially
    if (sanitized.email && typeof sanitized.email === 'string') {
      sanitized.email = this.maskEmail(sanitized.email)
    }

    // Truncate long strings to prevent log bloat
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '...[TRUNCATED]'
      }
    })

    return sanitized
  }

  // Mask email address for privacy
  maskEmail(email) {
    const [username, domain] = email.split('@')
    if (!username || !domain) return '[MASKED_EMAIL]'

    const maskedUsername = username.length > 2
      ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
      : '*'.repeat(username.length)

    return `${maskedUsername}@${domain}`
  }

  // Flush audit logs to server
  async flush(synchronous = false) {
    if (this.auditQueue.length === 0) return

    const batch = [...this.auditQueue]
    this.auditQueue = []

    try {
      const payload = {
        batch,
        batchId: this.generateAuditId(),
        timestamp: new Date().toISOString(),
        source: 'working_capital_frontend'
      }

      if (synchronous) {
        // Use sendBeacon for synchronous sending during page unload
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/audit/log', JSON.stringify(payload))
        }
      } else {
        await this.sendAuditBatch(payload)
      }
    } catch (error) {
      console.error('Failed to flush audit logs:', error)

      // Re-queue failed items with retry count
      batch.forEach(entry => {
        entry.retryCount = (entry.retryCount || 0) + 1
        if (entry.retryCount <= this.maxRetries) {
          this.auditQueue.unshift(entry) // Add back to front of queue
        }
      })
    }
  }

  // Send audit batch to server
  async sendAuditBatch(payload) {
    const response = await fetch('/api/audit/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Audit logging failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Start periodic flushing
  startPeriodicFlush() {
    if (typeof window !== 'undefined') {
      this.flushTimer = setInterval(() => {
        this.flush()
      }, this.flushInterval)
    }
  }

  // Stop periodic flushing
  stopPeriodicFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  // Get audit statistics
  getAuditStats() {
    return {
      sessionId: this.sessionId,
      queueLength: this.auditQueue.length,
      userId: this.userId,
      userRole: this.userRole,
      batchSize: this.batchSize,
      flushInterval: this.flushInterval
    }
  }

  // Clean up resources
  destroy() {
    this.stopPeriodicFlush()
    this.flush(true) // Final flush

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.flush)
    }
  }
}

// Create singleton instance
const auditLogger = new AuditLogger()

// High-level audit functions for working capital module
export const auditService = {
  // Initialize audit service
  initialize(user) {
    auditLogger.setUserContext(user)
  },

  // Dashboard access logging
  logDashboardAccess(details = {}) {
    return auditLogger.logEvent(
      AUDIT_EVENTS.DASHBOARD_ACCESS,
      { ...details, module: 'working_capital' },
      AUDIT_SEVERITY.INFO,
      [COMPLIANCE_STANDARDS.SOX, COMPLIANCE_STANDARDS.INTERNAL]
    )
  },

  // Data export logging (high compliance requirement)
  logDataExport(format, details = {}) {
    return auditLogger.logEvent(
      AUDIT_EVENTS.DATA_EXPORT,
      {
        format,
        ...details,
        dataTypes: ['financial_metrics', 'cash_flow', 'recommendations'],
        exportTimestamp: new Date().toISOString()
      },
      AUDIT_SEVERITY.INFO,
      [COMPLIANCE_STANDARDS.SOX, COMPLIANCE_STANDARDS.GDPR, COMPLIANCE_STANDARDS.INTERNAL]
    )
  },

  // Forecast generation logging
  logForecastGeneration(forecastType, options = {}) {
    return auditLogger.logEvent(
      AUDIT_EVENTS.FORECAST_GENERATE,
      {
        forecastType,
        periods: options.periods,
        scenarios: options.scenarios,
        confidence: options.confidence,
        methodology: options.methodology || 'monte_carlo'
      },
      AUDIT_SEVERITY.INFO,
      [COMPLIANCE_STANDARDS.SOX, COMPLIANCE_STANDARDS.INTERNAL]
    )
  },

  // Recommendation action logging
  logRecommendationAction(recommendationId, action, details = {}) {
    return auditLogger.logEvent(
      AUDIT_EVENTS.RECOMMENDATION_ACTION,
      {
        recommendationId,
        action,
        potentialImpact: details.potentialImpact,
        priority: details.priority,
        category: details.category,
        ...details
      },
      AUDIT_SEVERITY.INFO,
      [COMPLIANCE_STANDARDS.SOX, COMPLIANCE_STANDARDS.INTERNAL]
    )
  },

  // Configuration change logging
  logSettingsUpdate(setting, oldValue, newValue, details = {}) {
    return auditLogger.logEvent(
      AUDIT_EVENTS.SETTINGS_UPDATE,
      {
        setting,
        oldValue: typeof oldValue === 'object' ? '[OBJECT]' : String(oldValue),
        newValue: typeof newValue === 'object' ? '[OBJECT]' : String(newValue),
        changeReason: details.reason,
        ...details
      },
      AUDIT_SEVERITY.WARNING,
      [COMPLIANCE_STANDARDS.SOX, COMPLIANCE_STANDARDS.ISO27001, COMPLIANCE_STANDARDS.INTERNAL]
    )
  },

  // Error logging
  logError(error, context = {}) {
    return auditLogger.logEvent(
      AUDIT_EVENTS.ERROR_OCCURRED,
      {
        errorMessage: error.message,
        errorStack: error.stack,
        errorType: error.constructor.name,
        context,
        timestamp: new Date().toISOString()
      },
      AUDIT_SEVERITY.ERROR,
      [COMPLIANCE_STANDARDS.ISO27001, COMPLIANCE_STANDARDS.INTERNAL]
    )
  },

  // API failure logging
  logAPIFailure(endpoint, statusCode, error, details = {}) {
    return auditLogger.logEvent(
      AUDIT_EVENTS.API_FAILURE,
      {
        endpoint,
        statusCode,
        errorMessage: error?.message,
        responseTime: details.responseTime,
        retryAttempt: details.retryAttempt,
        ...details
      },
      statusCode >= 500 ? AUDIT_SEVERITY.CRITICAL : AUDIT_SEVERITY.ERROR,
      [COMPLIANCE_STANDARDS.ISO27001, COMPLIANCE_STANDARDS.INTERNAL]
    )
  },

  // Performance issue logging
  logPerformanceIssue(metric, value, threshold, details = {}) {
    return auditLogger.logEvent(
      AUDIT_EVENTS.PERFORMANCE_ISSUE,
      {
        metric,
        value,
        threshold,
        impact: value > threshold ? 'exceeded' : 'warning',
        ...details
      },
      value > threshold * 2 ? AUDIT_SEVERITY.CRITICAL : AUDIT_SEVERITY.WARNING,
      [COMPLIANCE_STANDARDS.INTERNAL]
    )
  },

  // Risk assessment logging
  logRiskAssessment(riskLevel, risks, details = {}) {
    return auditLogger.logEvent(
      AUDIT_EVENTS.RISK_ASSESS,
      {
        riskLevel,
        totalRisks: risks.length,
        criticalRisks: risks.filter(r => r.severity === 'critical').length,
        riskTypes: risks.map(r => r.type),
        assessmentMethod: details.method || 'automated',
        ...details
      },
      riskLevel === 'critical' ? AUDIT_SEVERITY.CRITICAL : AUDIT_SEVERITY.INFO,
      [COMPLIANCE_STANDARDS.SOX, COMPLIANCE_STANDARDS.INTERNAL]
    )
  },

  // Data refresh logging
  logDataRefresh(source, details = {}) {
    return auditLogger.logEvent(
      AUDIT_EVENTS.DATA_REFRESH,
      {
        source,
        refreshType: details.type || 'manual',
        dataAge: details.dataAge,
        recordsUpdated: details.recordsUpdated,
        ...details
      },
      AUDIT_SEVERITY.INFO,
      [COMPLIANCE_STANDARDS.INTERNAL]
    )
  },

  // Generic event logging
  logEvent(eventType, details, severity, compliance) {
    return auditLogger.logEvent(eventType, details, severity, compliance)
  },

  // Force flush audit logs
  flush() {
    return auditLogger.flush()
  },

  // Get audit statistics
  getStats() {
    return auditLogger.getAuditStats()
  },

  // Clean up audit service
  destroy() {
    auditLogger.destroy()
  }
}

// React hook for audit logging
export const useAuditLogger = () => {
  const logAction = (eventType, details, severity, compliance) => {
    return auditService.logEvent(eventType, details, severity, compliance)
  }

  const logError = (error, context) => {
    return auditService.logError(error, context)
  }

  const logUserAction = (action, details) => {
    return auditService.logEvent(
      action,
      { ...details, userInitiated: true },
      AUDIT_SEVERITY.INFO
    )
  }

  return {
    logAction,
    logError,
    logUserAction,
    flush: auditService.flush,
    getStats: auditService.getStats
  }
}

export default auditService