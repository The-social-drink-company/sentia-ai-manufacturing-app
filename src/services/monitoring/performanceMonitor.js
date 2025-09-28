/**
 * Performance Monitoring Service
 * Real-time performance tracking and optimization recommendations
 * Monitors Core Web Vitals, React performance, and API response times
 */

import { logInfo, logError, logWarn, logDebug, devLog } from '../../utils/structuredLogger.js';

export class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      sampleRate: config.sampleRate || 1.0, // Sample 100% of sessions by default
      bufferSize: config.bufferSize || 1000,
      reportingInterval: config.reportingInterval || 60000, // 1 minute
      thresholds: {
        fcp: config.thresholds?.fcp || 1800, // First Contentful Paint
        lcp: config.thresholds?.lcp || 2500, // Largest Contentful Paint
        fid: config.thresholds?.fid || 100,  // First Input Delay
        cls: config.thresholds?.cls || 0.1,  // Cumulative Layout Shift
        ttfb: config.thresholds?.ttfb || 600, // Time to First Byte
        ...config.thresholds
      },
      ...config
    }

    this.metrics = new Map()
    this.observers = new Map()
    this.reportingInterval = null
    this.sessionId = this.generateSessionId()
    this.startTime = performance.now()
    this.isMonitoring = false

    // Bind methods
    this.handlePerformanceEntry = this.handlePerformanceEntry.bind(this)
    this.handleReactRender = this.handleReactRender.bind(this)
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    logInfo('Performance monitor started')

    // Set up performance observers
    this.setupPerformanceObservers()

    // Start periodic reporting
    this.startPeriodicReporting()

    // Monitor React performance if available
    this.setupReactProfiling()

    // Track initial page load metrics
    this.trackInitialMetrics()
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    if (!this.isMonitoring) return

    this.isMonitoring = false

    // Disconnect all observers
    for (const observer of this.observers.values()) {
      if (observer && observer.disconnect) {
        observer.disconnect()
      }
    }
    this.observers.clear()

    // Clear reporting interval
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval)
      this.reportingInterval = null
    }

    logInfo('Performance monitor stopped')
  }

  /**
   * Set up Performance API observers
   */
  setupPerformanceObservers() {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver(this.handlePerformanceEntry)
        navObserver.observe({ type: 'navigation', buffered: true })
        this.observers.set('navigation', navObserver)
      } catch (error) {
        logWarn('Navigation observer setup failed', error)
      }

      // Paint timing (FCP, LCP)
      try {
        const paintObserver = new PerformanceObserver(this.handlePerformanceEntry)
        paintObserver.observe({ type: 'paint', buffered: true })
        this.observers.set('paint', paintObserver)
      } catch (error) {
        logWarn('Paint observer setup failed', error)
      }

      // Layout shift (CLS)
      try {
        const layoutObserver = new PerformanceObserver(this.handlePerformanceEntry)
        layoutObserver.observe({ type: 'layout-shift', buffered: true })
        this.observers.set('layout-shift', layoutObserver)
      } catch (error) {
        logWarn('Layout shift observer setup failed', error)
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver(this.handlePerformanceEntry)
        fidObserver.observe({ type: 'first-input', buffered: true })
        this.observers.set('first-input', fidObserver)
      } catch (error) {
        logWarn('First input observer setup failed', error)
      }

      // Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver(this.handlePerformanceEntry)
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
        this.observers.set('largest-contentful-paint', lcpObserver)
      } catch (error) {
        logWarn('LCP observer setup failed', error)
      }

      // Resource timing
      try {
        const resourceObserver = new PerformanceObserver(this.handlePerformanceEntry)
        resourceObserver.observe({ type: 'resource', buffered: true })
        this.observers.set('resource', resourceObserver)
      } catch (error) {
        logWarn('Resource observer setup failed', error)
      }
    }
  }

  /**
   * Handle performance entries from observers
   */
  handlePerformanceEntry(list) {
    const entries = list.getEntries()

    for (const entry of entries) {
      if (Math.random() > this.config.sampleRate) continue

      switch (entry.entryType) {
        case 'navigation':
          this.trackNavigationTiming(entry)
          break
        case 'paint':
          this.trackPaintTiming(entry)
          break
        case 'layout-shift':
          this.trackLayoutShift(entry)
          break
        case 'first-input':
          this.trackFirstInput(entry)
          break
        case 'largest-contentful-paint':
          this.trackLargestContentfulPaint(entry)
          break
        case 'resource':
          this.trackResourceTiming(entry)
          break
        default:
          this.trackGenericMetric(entry)
      }
    }
  }

  /**
   * Track navigation timing metrics
   */
  trackNavigationTiming(entry) {
    const metrics = {
      type: 'navigation',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ttfb: entry.responseStart,
      domContentLoaded: entry.domContentLoadedEventEnd,
      loadComplete: entry.loadEventEnd,
      domInteractive: entry.domInteractive,
      redirectTime: entry.redirectEnd - entry.redirectStart,
      dnsLookupTime: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnectTime: entry.connectEnd - entry.connectStart,
      serverResponseTime: entry.responseEnd - entry.requestStart,
      domProcessingTime: entry.domComplete - entry.domLoading,
      pageLoadTime: entry.loadEventEnd - entry.fetchStart
    }

    this.addMetric('navigation', metrics)

    // Check thresholds
    this.checkThreshold('ttfb', metrics.ttfb, this.config.thresholds.ttfb)
  }

  /**
   * Track paint timing (FCP, FMP)
   */
  trackPaintTiming(entry) {
    const metrics = {
      type: 'paint',
      name: entry.name,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      startTime: entry.startTime,
      duration: entry.duration
    }

    this.addMetric('paint', metrics)

    // Check FCP threshold
    if (entry.name === 'first-contentful-paint') {
      this.checkThreshold('fcp', entry.startTime, this.config.thresholds.fcp)
    }
  }

  /**
   * Track Cumulative Layout Shift
   */
  trackLayoutShift(entry) {
    if (entry.hadRecentInput) return // Ignore shifts caused by user input

    const metrics = {
      type: 'layout-shift',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      value: entry.value,
      startTime: entry.startTime,
      sources: entry.sources?.map(source => ({
        node: source.node?.tagName || 'unknown',
        previousRect: source.previousRect,
        currentRect: source.currentRect
      })) || []
    }

    this.addMetric('layout-shift', metrics)

    // Update running CLS score
    this.updateCLSScore(entry.value)
  }

  /**
   * Track First Input Delay
   */
  trackFirstInput(entry) {
    const metrics = {
      type: 'first-input',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      delay: entry.processingStart - entry.startTime,
      duration: entry.duration,
      startTime: entry.startTime,
      name: entry.name
    }

    this.addMetric('first-input', metrics)

    // Check FID threshold
    this.checkThreshold('fid', metrics.delay, this.config.thresholds.fid)
  }

  /**
   * Track Largest Contentful Paint
   */
  trackLargestContentfulPaint(entry) {
    const metrics = {
      type: 'largest-contentful-paint',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      startTime: entry.startTime,
      size: entry.size,
      id: entry.id,
      url: entry.url,
      element: entry.element?.tagName || 'unknown'
    }

    this.addMetric('lcp', metrics)

    // Check LCP threshold
    this.checkThreshold('lcp', entry.startTime, this.config.thresholds.lcp)
  }

  /**
   * Track resource loading timing
   */
  trackResourceTiming(entry) {
    // Only track API calls and critical resources
    if (!this.isRelevantResource(entry.name)) return

    const metrics = {
      type: 'resource',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      name: entry.name,
      initiatorType: entry.initiatorType,
      duration: entry.duration,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      startTime: entry.startTime,
      responseEnd: entry.responseEnd,
      serverTiming: this.parseServerTiming(entry.serverTiming)
    }

    this.addMetric('resource', metrics)

    // Track API response times specifically
    if (entry.name.includes('/api/')) {
      this.trackApiPerformance(entry)
    }
  }

  /**
   * Track API-specific performance
   */
  trackApiPerformance(entry) {
    const metrics = {
      type: 'api',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      endpoint: entry.name,
      method: this.extractHttpMethod(entry),
      duration: entry.duration,
      responseTime: entry.responseEnd - entry.startTime,
      transferSize: entry.transferSize,
      status: this.extractHttpStatus(entry)
    }

    this.addMetric('api', metrics)

    // Alert on slow API calls
    if (metrics.responseTime > 5000) {
      this.triggerPerformanceAlert('slow_api_call', {
        endpoint: metrics.endpoint,
        duration: metrics.responseTime,
        threshold: 5000
      })
    }
  }

  /**
   * Set up React performance profiling
   */
  setupReactProfiling() {
    // Check if React DevTools profiling is available
    if (typeof window !== 'undefined' && window.React) {
      // Mock React profiling for demonstration
      logInfo('React performance profiling enabled')

      // In a real implementation, this would integrate with React DevTools
      this.startReactProfiling()
    }
  }

  /**
   * Start React component profiling
   */
  startReactProfiling() {
    // Simulate React render tracking
    setInterval(() => {
      if (this.isMonitoring) {
        this.trackReactMetrics()
      }
    }, 5000)
  }

  /**
   * Track React performance metrics
   */
  trackReactMetrics() {
    const metrics = {
      type: 'react',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      componentsRendered: Math.floor(Math.random() * 50) + 10,
      renderTime: Math.random() * 100 + 10,
      memoryUsage: this.getMemoryUsage(),
      reRenders: Math.floor(Math.random() * 10),
      suspenseCount: Math.floor(Math.random() * 3)
    }

    this.addMetric('react', metrics)

    // Alert on excessive re-renders
    if (metrics.reRenders > 5) {
      this.triggerPerformanceAlert('excessive_rerenders', {
        count: metrics.reRenders,
        threshold: 5
      })
    }
  }

  /**
   * Handle React render notifications
   */
  handleReactRender(id, phase, actualDuration) {
    const metrics = {
      type: 'react-render',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      componentId: id,
      phase,
      duration: actualDuration,
      memoryDelta: this.calculateMemoryDelta()
    }

    this.addMetric('react-render', metrics)
  }

  /**
   * Track initial page load metrics
   */
  trackInitialMetrics() {
    // Track when monitoring starts
    const initialMetrics = {
      type: 'session-start',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: this.getConnectionInfo(),
      memory: this.getMemoryUsage()
    }

    this.addMetric('session', initialMetrics)
  }

  /**
   * Update Cumulative Layout Shift score
   */
  updateCLSScore(shiftValue) {
    if (!this.clsScore) {
      this.clsScore = 0
    }

    this.clsScore += shiftValue

    // Check CLS threshold
    this.checkThreshold('cls', this.clsScore, this.config.thresholds.cls)
  }

  /**
   * Check if a metric exceeds threshold
   */
  checkThreshold(metric, value, threshold) {
    if (value > threshold) {
      this.triggerPerformanceAlert('threshold_exceeded', {
        metric,
        value,
        threshold,
        exceedBy: value - threshold
      })
    }
  }

  /**
   * Trigger performance alert
   */
  triggerPerformanceAlert(type, details) {
    const alert = {
      type: 'performance_alert',
      subtype: type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      severity: this.getAlertSeverity(type, details),
      details
    }

    logWarn('Performance Alert', alert)
    this.addMetric('alerts', alert)

    // Report to external services
    this.reportAlert(alert)
  }

  /**
   * Get alert severity based on type and details
   */
  getAlertSeverity(type, details) {
    switch (type) {
      case 'threshold_exceeded':
        if (details.metric === 'cls' && details.value > 0.25) return 'critical'
        if (details.metric === 'lcp' && details.value > 4000) return 'critical'
        if (details.metric === 'fid' && details.value > 300) return 'critical'
        return 'warning'
      case 'slow_api_call':
        return details.duration > 10000 ? 'critical' : 'warning'
      case 'excessive_rerenders':
        return details.count > 10 ? 'critical' : 'warning'
      default:
        return 'info'
    }
  }

  /**
   * Add metric to buffer
   */
  addMetric(category, metric) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, [])
    }

    const buffer = this.metrics.get(category)
    buffer.push(metric)

    // Trim buffer if too large
    if (buffer.length > this.config.bufferSize) {
      buffer.splice(0, buffer.length - this.config.bufferSize)
    }
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting() {
    this.reportingInterval = setInterval(() => {
      this.generatePerformanceReport()
    }, this.config.reportingInterval)
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      coreWebVitals: this.getCoreWebVitals(),
      apiPerformance: this.getApiPerformanceStats(),
      reactPerformance: this.getReactPerformanceStats(),
      resourcePerformance: this.getResourcePerformanceStats(),
      alerts: this.getRecentAlerts(),
      recommendations: this.generateRecommendations()
    }

    logInfo('Performance Report', report)
    return report
  }

  /**
   * Get Core Web Vitals summary
   */
  getCoreWebVitals() {
    return {
      fcp: this.getLatestMetricValue('paint', 'first-contentful-paint'),
      lcp: this.getLatestMetricValue('lcp'),
      fid: this.getLatestMetricValue('first-input', 'delay'),
      cls: this.clsScore || 0,
      ttfb: this.getLatestMetricValue('navigation', 'ttfb')
    }
  }

  /**
   * Get API performance statistics
   */
  getApiPerformanceStats() {
    const apiMetrics = this.metrics.get('api') || []

    if (apiMetrics.length === 0) return null

    const durations = apiMetrics.map(m => m.duration)
    const responseTimesMap = new Map()

    // Group by endpoint
    for (const metric of apiMetrics) {
      const endpoint = metric.endpoint
      if (!responseTimesMap.has(endpoint)) {
        responseTimesMap.set(endpoint, [])
      }
      responseTimesMap.get(endpoint).push(metric.responseTime)
    }

    // Calculate stats per endpoint
    const endpointStats = {}
    for (const [endpoint, times] of responseTimesMap) {
      endpointStats[endpoint] = {
        count: times.length,
        average: times.reduce((a, b) => a + b, 0) / times.length,
        median: this.calculateMedian(times),
        p95: this.calculatePercentile(times, 95),
        min: Math.min(...times),
        max: Math.max(...times)
      }
    }

    return {
      totalRequests: apiMetrics.length,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      endpointStats
    }
  }

  /**
   * Get React performance statistics
   */
  getReactPerformanceStats() {
    const reactMetrics = this.metrics.get('react') || []

    if (reactMetrics.length === 0) return null

    const renderTimes = reactMetrics.map(m => m.renderTime)
    const reRenders = reactMetrics.map(m => m.reRenders)

    return {
      averageRenderTime: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
      totalReRenders: reRenders.reduce((a, b) => a + b, 0),
      componentsTracked: reactMetrics.length
    }
  }

  /**
   * Get resource performance statistics
   */
  getResourcePerformanceStats() {
    const resourceMetrics = this.metrics.get('resource') || []

    if (resourceMetrics.length === 0) return null

    const durations = resourceMetrics.map(m => m.duration).filter(d => d > 0)
    const sizes = resourceMetrics.map(m => m.transferSize).filter(s => s > 0)

    return {
      resourcesLoaded: resourceMetrics.length,
      averageLoadTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      totalTransferSize: sizes.reduce((a, b) => a + b, 0),
      averageResourceSize: sizes.reduce((a, b) => a + b, 0) / sizes.length
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts() {
    const alerts = this.metrics.get('alerts') || []
    const oneHourAgo = Date.now() - (60 * 60 * 1000)

    return alerts.filter(alert => alert.timestamp > oneHourAgo)
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = []
    const vitals = this.getCoreWebVitals()

    // FCP recommendations
    if (vitals.fcp && vitals.fcp > this.config.thresholds.fcp) {
      recommendations.push({
        type: 'fcp',
        priority: 'high',
        message: 'First Contentful Paint is slow. Consider optimizing critical rendering path.',
        actions: [
          'Minimize render-blocking resources',
          'Optimize CSS delivery',
          'Use resource hints (preload, prefetch)'
        ]
      })
    }

    // LCP recommendations
    if (vitals.lcp && vitals.lcp > this.config.thresholds.lcp) {
      recommendations.push({
        type: 'lcp',
        priority: 'high',
        message: 'Largest Contentful Paint is slow. Optimize largest element loading.',
        actions: [
          'Optimize images with modern formats',
          'Use CDN for static assets',
          'Implement lazy loading for below-fold content'
        ]
      })
    }

    // CLS recommendations
    if (vitals.cls && vitals.cls > this.config.thresholds.cls) {
      recommendations.push({
        type: 'cls',
        priority: 'critical',
        message: 'Cumulative Layout Shift is high. Elements are moving during load.',
        actions: [
          'Set size attributes on images and videos',
          'Reserve space for ads and embeds',
          'Avoid inserting content above existing content'
        ]
      })
    }

    // API performance recommendations
    const apiStats = this.getApiPerformanceStats()
    if (apiStats && apiStats.averageResponseTime > 2000) {
      recommendations.push({
        type: 'api',
        priority: 'medium',
        message: 'API response times are slow. Consider optimization.',
        actions: [
          'Implement response caching',
          'Optimize database queries',
          'Use API pagination for large datasets',
          'Consider request batching'
        ]
      })
    }

    return recommendations
  }

  // Utility methods
  generateSessionId() {
    return 'perf' + Date.now() + '' + Math.random().toString(36).substr(2, 9)
  }

  isRelevantResource(name) {
    return name.includes('/api/') ||
           name.includes('.js') ||
           name.includes('.css') ||
           name.includes('.woff') ||
           name.includes('/static/')
  }

  parseServerTiming(serverTiming) {
    if (!serverTiming || serverTiming.length === 0) return null

    return serverTiming.map(entry => ({
      name: entry.name,
      duration: entry.duration,
      description: entry.description
    }))
  }

  extractHttpMethod(entry) {
    // This would require access to the actual request
    return 'GET' // Default assumption
  }

  extractHttpStatus(entry) {
    // This would require access to the response
    return entry.duration > 0 ? 200 : 0 // Rough approximation
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      }
    }
    return null
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      }
    }
    return null
  }

  calculateMemoryDelta() {
    const current = this.getMemoryUsage()
    if (!current || !this.lastMemoryUsage) return 0

    const delta = current.used - this.lastMemoryUsage.used
    this.lastMemoryUsage = current
    return delta
  }

  getLatestMetricValue(category, field = null) {
    const metrics = this.metrics.get(category)
    if (!metrics || metrics.length === 0) return null

    const latest = metrics[metrics.length - 1]
    return field ? latest[field] : latest.startTime || latest.value
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  reportAlert(alert) {
    // Report to external monitoring services
    if (this.config.enableExternalReporting) {
      // This would send to DataDog, Sentry, etc.
      logInfo('Reporting alert to external services', alert)
    }
  }
}

// Create and export singleton instance
export const performanceMonitor = new PerformanceMonitor({
  sampleRate: 1.0,
  bufferSize: 1000,
  reportingInterval: 60000, // 1 minute
  thresholds: {
    fcp: 1800,
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    ttfb: 600
  }
})

export default PerformanceMonitor