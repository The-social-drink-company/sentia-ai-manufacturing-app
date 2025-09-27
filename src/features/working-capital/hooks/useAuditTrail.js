/**
 * Audit Trail Hook for Working Capital Components
 * Provides easy integration of audit logging into React components
 */

import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { auditService, AUDIT_EVENTS, AUDIT_SEVERITY, COMPLIANCE_STANDARDS } from '../services/auditService'

export const useAuditTrail = (componentName) => {
  const { user } = useAuth()
  const componentMountTime = useRef(Date.now())
  const sessionActions = useRef([])

  // Initialize audit service when component mounts
  useEffect(() => {
    if (user) {
      auditService.initialize(user)

      // Log component access
      auditService.logEvent(
        AUDIT_EVENTS.DATA_VIEW,
        {
          component: componentName,
          accessTime: new Date().toISOString(),
          userRole: user.role
        },
        AUDIT_SEVERITY.INFO,
        [COMPLIANCE_STANDARDS.INTERNAL]
      )
    }

    // Cleanup on unmount
    return () => {
      const sessionDuration = Date.now() - componentMountTime.current
      auditService.logEvent(
        AUDIT_EVENTS.DATA_VIEW,
        {
          component: componentName,
          action: 'component_unmount',
          sessionDuration: Math.round(sessionDuration / 1000), // seconds
          totalActions: sessionActions.current.length,
          actionsPerformed: sessionActions.current
        },
        AUDIT_SEVERITY.INFO,
        [COMPLIANCE_STANDARDS.INTERNAL]
      )
    }
  }, [user, componentName])

  // Track user actions within the component
  const trackAction = useCallback((action, details = {}) => {
    const actionId = auditService.logEvent(
      action,
      {
        component: componentName,
        timestamp: new Date().toISOString(),
        ...details
      },
      AUDIT_SEVERITY.INFO,
      [COMPLIANCE_STANDARDS.INTERNAL]
    )

    sessionActions.current.push({
      action,
      timestamp: new Date().toISOString(),
      details
    })

    return actionId
  }, [componentName])

  // Log data access events
  const logDataAccess = useCallback((dataType, details = {}) => {
    return auditService.logEvent(
      AUDIT_EVENTS.DATA_VIEW,
      {
        component: componentName,
        dataType,
        accessMethod: details.method || 'user_initiated',
        filters: details.filters,
        period: details.period,
        ...details
      },
      AUDIT_SEVERITY.INFO,
      [COMPLIANCE_STANDARDS.SOX, COMPLIANCE_STANDARDS.INTERNAL]
    )
  }, [componentName])

  // Log export actions with high compliance requirements
  const logExport = useCallback((format, details = {}) => {
    return auditService.logDataExport(format, {
      component: componentName,
      includeForecasts: details.includeForecasts,
      includeRecommendations: details.includeRecommendations,
      dateRange: details.dateRange,
      recordCount: details.recordCount,
      fileSize: details.fileSize,
      ...details
    })
  }, [componentName])

  // Log configuration changes
  const logConfigChange = useCallback((setting, oldValue, newValue, reason = '') => {
    return auditService.logSettingsUpdate(
      setting,
      oldValue,
      newValue,
      {
        component: componentName,
        reason,
        userInitiated: true
      }
    )
  }, [componentName])

  // Log errors with context
  const logError = useCallback((error, context = {}) => {
    return auditService.logError(error, {
      component: componentName,
      userAction: context.action,
      inputData: context.inputData,
      timestamp: new Date().toISOString(),
      ...context
    })
  }, [componentName])

  // Log performance metrics
  const logPerformance = useCallback((metric, value, threshold, context = {}) => {
    return auditService.logPerformanceIssue(
      metric,
      value,
      threshold,
      {
        component: componentName,
        measurement: context.measurement || 'milliseconds',
        userAction: context.action,
        ...context
      }
    )
  }, [componentName])

  // Log forecast generation
  const logForecastGeneration = useCallback((forecastType, options = {}) => {
    return auditService.logForecastGeneration(forecastType, {
      component: componentName,
      userInitiated: true,
      ...options
    })
  }, [componentName])

  // Log recommendation actions
  const logRecommendationAction = useCallback((recommendationId, action, details = {}) => {
    return auditService.logRecommendationAction(recommendationId, action, {
      component: componentName,
      userInitiated: true,
      timestamp: new Date().toISOString(),
      ...details
    })
  }, [componentName])

  // Log API interactions
  const logAPICall = useCallback((endpoint, method, status, details = {}) => {
    const eventType = status >= 400 ? AUDIT_EVENTS.API_FAILURE : AUDIT_EVENTS.DATA_VIEW
    const severity = status >= 500 ? AUDIT_SEVERITY.CRITICAL
                   : status >= 400 ? AUDIT_SEVERITY.ERROR
                   : AUDIT_SEVERITY.INFO

    return auditService.logEvent(
      eventType,
      {
        component: componentName,
        endpoint,
        method,
        statusCode: status,
        responseTime: details.responseTime,
        requestSize: details.requestSize,
        responseSize: details.responseSize,
        ...details
      },
      severity,
      [COMPLIANCE_STANDARDS.ISO27001, COMPLIANCE_STANDARDS.INTERNAL]
    )
  }, [componentName])

  // Batch logging for multiple actions
  const logBatch = useCallback((actions) => {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    actions.forEach((actionData, index) => {
      auditService.logEvent(
        actionData.eventType,
        {
          component: componentName,
          batchId,
          batchIndex: index,
          batchSize: actions.length,
          ...actionData.details
        },
        actionData.severity || AUDIT_SEVERITY.INFO,
        actionData.compliance || [COMPLIANCE_STANDARDS.INTERNAL]
      )
    })

    return batchId
  }, [componentName])

  // Get component audit statistics
  const getAuditStats = useCallback(() => {
    return {
      component: componentName,
      sessionDuration: Date.now() - componentMountTime.current,
      totalActions: sessionActions.current.length,
      lastAction: sessionActions.current[sessionActions.current.length - 1],
      ...auditService.getStats()
    }
  }, [componentName])

  return {
    trackAction,
    logDataAccess,
    logExport,
    logConfigChange,
    logError,
    logPerformance,
    logForecastGeneration,
    logRecommendationAction,
    logAPICall,
    logBatch,
    getAuditStats,
    flush: auditService.flush
  }
}

// Hook for dashboard-level audit tracking
export const useDashboardAudit = () => {
  const audit = useAuditTrail('WorkingCapitalDashboard')

  // Dashboard-specific logging functions
  const logDashboardLoad = useCallback((loadTime, dataPoints) => {
    return audit.logPerformance('dashboard_load_time', loadTime, 3000, {
      action: 'dashboard_load',
      dataPoints,
      measurement: 'milliseconds'
    })
  }, [audit])

  const logPeriodChange = useCallback((oldPeriod, newPeriod) => {
    return audit.logConfigChange('reporting_period', oldPeriod, newPeriod, 'user_selection')
  }, [audit])

  const logCurrencyChange = useCallback((oldCurrency, newCurrency) => {
    return audit.logConfigChange('display_currency', oldCurrency, newCurrency, 'user_selection')
  }, [audit])

  const logMetricRefresh = useCallback((source, recordsUpdated) => {
    return auditService.logDataRefresh(source, {
      component: 'WorkingCapitalDashboard',
      type: 'manual',
      recordsUpdated,
      timestamp: new Date().toISOString()
    })
  }, [])

  const logAlertInteraction = useCallback((alertId, action) => {
    return audit.trackAction(AUDIT_EVENTS.RECOMMENDATION_VIEW, {
      alertId,
      alertAction: action,
      severity: 'user_interaction'
    })
  }, [audit])

  return {
    ...audit,
    logDashboardLoad,
    logPeriodChange,
    logCurrencyChange,
    logMetricRefresh,
    logAlertInteraction
  }
}

// Hook for export audit tracking
export const useExportAudit = () => {
  const audit = useAuditTrail('ExportService')

  const logExportAttempt = useCallback((format, options = {}) => {
    return audit.logExport(format, {
      exportOptions: options,
      userInitiated: true,
      timestamp: new Date().toISOString()
    })
  }, [audit])

  const logExportSuccess = useCallback((format, fileSize, duration) => {
    return audit.trackAction(AUDIT_EVENTS.DATA_EXPORT, {
      format,
      fileSize,
      duration,
      status: 'success'
    })
  }, [audit])

  const logExportFailure = useCallback((format, error, context = {}) => {
    return audit.logError(error, {
      format,
      exportAttempt: true,
      ...context
    })
  }, [audit])

  return {
    logExportAttempt,
    logExportSuccess,
    logExportFailure,
    ...audit
  }
}

// Hook for forecast audit tracking
export const useForecastAudit = () => {
  const audit = useAuditTrail('ForecastService')

  const logForecastRequest = useCallback((forecastType, parameters) => {
    return audit.logForecastGeneration(forecastType, {
      parameters,
      requestTimestamp: new Date().toISOString()
    })
  }, [audit])

  const logForecastCompletion = useCallback((forecastType, duration, accuracy) => {
    return audit.trackAction(AUDIT_EVENTS.FORECAST_GENERATE, {
      forecastType,
      processingDuration: duration,
      accuracyScore: accuracy,
      status: 'completed'
    })
  }, [audit])

  const logScenarioCreation = useCallback((scenarioName, parameters) => {
    return audit.trackAction(AUDIT_EVENTS.SCENARIO_CREATE, {
      scenarioName,
      parameters,
      userInitiated: true
    })
  }, [audit])

  const logRiskAssessment = useCallback((riskLevel, riskCount, methodology) => {
    return auditService.logRiskAssessment(riskLevel, [], {
      component: 'ForecastService',
      riskCount,
      methodology,
      userInitiated: true
    })
  }, [])

  return {
    logForecastRequest,
    logForecastCompletion,
    logScenarioCreation,
    logRiskAssessment,
    ...audit
  }
}

export default useAuditTrail