/**
 * Performance Monitor Test Suite
 * Comprehensive tests for performance monitoring functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PerformanceMonitor } from './performanceMonitor'

// Mock Performance API
global.PerformanceObserver = vi.fn()
global.performance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 30, // 30MB
    totalJSHeapSize: 1024 * 1024 * 50, // 50MB
    jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
  }
}

// Mock window object for browser environment
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  location: { href: 'https://test.example.com' },
  React: { version: '18.2.0' }
}

global.navigator = {
  userAgent: 'Test Browser',
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50
  }
}

describe('PerformanceMonitor', () => {
  let monitor
  let mockObserver

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock PerformanceObserver
    mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn()
    }

    global.PerformanceObserver.mockImplementation((callback) => {
      mockObserver.callback = callback
      return mockObserver
    })

    monitor = new PerformanceMonitor({
      sampleRate: 1.0,
      bufferSize: 100,
      reportingInterval: 1000,
      thresholds: {
        fcp: 1800,
        lcp: 2500,
        fid: 100,
        cls: 0.1
      }
    })
  })

  afterEach(() => {
    if (monitor.isMonitoring) {
      monitor.stop()
    }
  })

  describe('Initialization', () => {
    it('should create performance monitor with default config', () => {
      const defaultMonitor = new PerformanceMonitor()
      expect(defaultMonitor.config.sampleRate).toBe(1.0)
      expect(defaultMonitor.config.bufferSize).toBe(1000)
      expect(defaultMonitor.isMonitoring).toBe(false)
    })

    it('should create performance monitor with custom config', () => {
      expect(monitor.config.sampleRate).toBe(1.0)
      expect(monitor.config.bufferSize).toBe(100)
      expect(monitor.config.thresholds.fcp).toBe(1800)
    })

    it('should generate unique session ID', () => {
      const sessionId1 = monitor.sessionId
      const monitor2 = new PerformanceMonitor()
      const sessionId2 = monitor2.sessionId

      expect(sessionId1).toMatch(/^perf_/)
      expect(sessionId2).toMatch(/^perf_/)
      expect(sessionId1).not.toBe(sessionId2)
    })
  })

  describe('Performance Observer Setup', () => {
    it('should set up performance observers on start', () => {
      monitor.start()

      expect(global.PerformanceObserver).toHaveBeenCalledTimes(6) // 6 observer types
      expect(mockObserver.observe).toHaveBeenCalledWith({ type: 'navigation', buffered: true })
      expect(mockObserver.observe).toHaveBeenCalledWith({ type: 'paint', buffered: true })
      expect(mockObserver.observe).toHaveBeenCalledWith({ type: 'layout-shift', buffered: true })
      expect(mockObserver.observe).toHaveBeenCalledWith({ type: 'first-input', buffered: true })
      expect(mockObserver.observe).toHaveBeenCalledWith({ type: 'largest-contentful-paint', buffered: true })
      expect(mockObserver.observe).toHaveBeenCalledWith({ type: 'resource', buffered: true })
    })

    it('should handle observer setup failures gracefully', () => {
      global.PerformanceObserver.mockImplementation(() => {
        throw new Error('Observer not supported')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      monitor.start()

      expect(consoleSpy).toHaveBeenCalled()
      expect(monitor.isMonitoring).toBe(true)

      consoleSpy.mockRestore()
    })

    it('should disconnect observers on stop', () => {
      monitor.start()
      monitor.stop()

      expect(mockObserver.disconnect).toHaveBeenCalled()
      expect(monitor.observers.size).toBe(0)
    })
  })

  describe('Navigation Timing', () => {
    it('should track navigation timing metrics', () => {
      const navigationEntry = {
        entryType: 'navigation',
        responseStart: 100,
        domContentLoadedEventEnd: 500,
        loadEventEnd: 800,
        domInteractive: 400,
        redirectEnd: 50,
        redirectStart: 10,
        domainLookupEnd: 80,
        domainLookupStart: 60,
        connectEnd: 95,
        connectStart: 85,
        responseEnd: 200,
        requestStart: 90,
        domComplete: 700,
        domLoading: 300,
        fetchStart: 0
      }

      monitor.trackNavigationTiming(navigationEntry)

      const metrics = monitor.metrics.get('navigation')
      expect(metrics).toHaveLength(1)

      const metric = metrics[0]
      expect(metric.type).toBe('navigation')
      expect(metric.ttfb).toBe(100)
      expect(metric.loadComplete).toBe(800)
      expect(metric.redirectTime).toBe(40) // 50 - 10
      expect(metric.dnsLookupTime).toBe(20) // 80 - 60
      expect(metric.tcpConnectTime).toBe(10) // 95 - 85
      expect(metric.pageLoadTime).toBe(800) // 800 - 0
    })

    it('should check TTFB threshold', () => {
      const alertSpy = vi.spyOn(monitor, 'triggerPerformanceAlert')

      const slowNavigationEntry = {
        entryType: 'navigation',
        responseStart: 2000, // Exceeds threshold
        domContentLoadedEventEnd: 3000,
        loadEventEnd: 4000
      }

      monitor.trackNavigationTiming(slowNavigationEntry)

      expect(alertSpy).toHaveBeenCalledWith(
        'threshold_exceeded',
        expect.objectContaining({
          metric: 'ttfb',
          value: 2000,
          threshold: monitor.config.thresholds.ttfb
        })
      )

      alertSpy.mockRestore()
    })
  })

  describe('Paint Timing', () => {
    it('should track First Contentful Paint', () => {
      const paintEntry = {
        entryType: 'paint',
        name: 'first-contentful-paint',
        startTime: 1500,
        duration: 0
      }

      monitor.trackPaintTiming(paintEntry)

      const metrics = monitor.metrics.get('paint')
      expect(metrics).toHaveLength(1)

      const metric = metrics[0]
      expect(metric.type).toBe('paint')
      expect(metric.name).toBe('first-contentful-paint')
      expect(metric.startTime).toBe(1500)
    })

    it('should check FCP threshold', () => {
      const alertSpy = vi.spyOn(monitor, 'triggerPerformanceAlert')

      const slowFCPEntry = {
        entryType: 'paint',
        name: 'first-contentful-paint',
        startTime: 2000 // Exceeds threshold
      }

      monitor.trackPaintTiming(slowFCPEntry)

      expect(alertSpy).toHaveBeenCalledWith(
        'threshold_exceeded',
        expect.objectContaining({
          metric: 'fcp',
          value: 2000
        })
      )

      alertSpy.mockRestore()
    })
  })

  describe('Layout Shift Tracking', () => {
    it('should track layout shift without user input', () => {
      const layoutShiftEntry = {
        entryType: 'layout-shift',
        value: 0.15,
        startTime: 1000,
        hadRecentInput: false,
        sources: [{
          node: { tagName: 'DIV' },
          previousRect: { x: 0, y: 0, width: 100, height: 100 },
          currentRect: { x: 0, y: 50, width: 100, height: 100 }
        }]
      }

      monitor.trackLayoutShift(layoutShiftEntry)

      const metrics = monitor.metrics.get('layout-shift')
      expect(metrics).toHaveLength(1)

      const metric = metrics[0]
      expect(metric.type).toBe('layout-shift')
      expect(metric.value).toBe(0.15)
      expect(metric.sources).toHaveLength(1)
      expect(metric.sources[0].node).toBe('DIV')
    })

    it('should ignore layout shifts with recent user input', () => {
      const layoutShiftEntry = {
        entryType: 'layout-shift',
        value: 0.15,
        hadRecentInput: true
      }

      monitor.trackLayoutShift(layoutShiftEntry)

      const metrics = monitor.metrics.get('layout-shift')
      expect(metrics).toHaveLength(0)
    })

    it('should update CLS score and check threshold', () => {
      const alertSpy = vi.spyOn(monitor, 'triggerPerformanceAlert')

      const layoutShiftEntry = {
        entryType: 'layout-shift',
        value: 0.15,
        hadRecentInput: false
      }

      monitor.trackLayoutShift(layoutShiftEntry)

      expect(monitor.clsScore).toBe(0.15)
      expect(alertSpy).toHaveBeenCalledWith(
        'threshold_exceeded',
        expect.objectContaining({
          metric: 'cls',
          value: 0.15
        })
      )

      alertSpy.mockRestore()
    })
  })

  describe('First Input Delay', () => {
    it('should track first input delay', () => {
      const fidEntry = {
        entryType: 'first-input',
        startTime: 1000,
        processingStart: 1050,
        duration: 20,
        name: 'click'
      }

      monitor.trackFirstInput(fidEntry)

      const metrics = monitor.metrics.get('first-input')
      expect(metrics).toHaveLength(1)

      const metric = metrics[0]
      expect(metric.type).toBe('first-input')
      expect(metric.delay).toBe(50) // 1050 - 1000
      expect(metric.duration).toBe(20)
      expect(metric.name).toBe('click')
    })

    it('should check FID threshold', () => {
      const alertSpy = vi.spyOn(monitor, 'triggerPerformanceAlert')

      const slowFIDEntry = {
        entryType: 'first-input',
        startTime: 1000,
        processingStart: 1200, // 200ms delay
        duration: 20
      }

      monitor.trackFirstInput(slowFIDEntry)

      expect(alertSpy).toHaveBeenCalledWith(
        'threshold_exceeded',
        expect.objectContaining({
          metric: 'fid',
          value: 200
        })
      )

      alertSpy.mockRestore()
    })
  })

  describe('Largest Contentful Paint', () => {
    it('should track LCP metrics', () => {
      const lcpEntry = {
        entryType: 'largest-contentful-paint',
        startTime: 2000,
        size: 5000,
        id: 'hero-image',
        url: 'https://example.com/hero.jpg',
        element: { tagName: 'IMG' }
      }

      monitor.trackLargestContentfulPaint(lcpEntry)

      const metrics = monitor.metrics.get('lcp')
      expect(metrics).toHaveLength(1)

      const metric = metrics[0]
      expect(metric.type).toBe('largest-contentful-paint')
      expect(metric.startTime).toBe(2000)
      expect(metric.size).toBe(5000)
      expect(metric.element).toBe('IMG')
    })

    it('should check LCP threshold', () => {
      const alertSpy = vi.spyOn(monitor, 'triggerPerformanceAlert')

      const slowLCPEntry = {
        entryType: 'largest-contentful-paint',
        startTime: 3000 // Exceeds threshold
      }

      monitor.trackLargestContentfulPaint(slowLCPEntry)

      expect(alertSpy).toHaveBeenCalledWith(
        'threshold_exceeded',
        expect.objectContaining({
          metric: 'lcp',
          value: 3000
        })
      )

      alertSpy.mockRestore()
    })
  })

  describe('Resource Timing', () => {
    it('should track API resource performance', () => {
      const resourceEntry = {
        entryType: 'resource',
        name: 'https://api.example.com/data',
        initiatorType: 'xmlhttprequest',
        duration: 250,
        transferSize: 1024,
        encodedBodySize: 800,
        decodedBodySize: 900,
        startTime: 1000,
        responseEnd: 1250
      }

      monitor.trackResourceTiming(resourceEntry)

      const apiMetrics = monitor.metrics.get('api')
      expect(apiMetrics).toHaveLength(1)

      const metric = apiMetrics[0]
      expect(metric.type).toBe('api')
      expect(metric.endpoint).toBe('https://api.example.com/data')
      expect(metric.duration).toBe(250)
      expect(metric.transferSize).toBe(1024)
    })

    it('should alert on slow API calls', () => {
      const alertSpy = vi.spyOn(monitor, 'triggerPerformanceAlert')

      const slowApiEntry = {
        entryType: 'resource',
        name: 'https://api.example.com/slow',
        duration: 6000,
        startTime: 1000,
        responseEnd: 7000
      }

      monitor.trackResourceTiming(slowApiEntry)
      monitor.trackApiPerformance(slowApiEntry)

      expect(alertSpy).toHaveBeenCalledWith(
        'slow_api_call',
        expect.objectContaining({
          endpoint: 'https://api.example.com/slow',
          duration: 6000
        })
      )

      alertSpy.mockRestore()
    })

    it('should filter irrelevant resources', () => {
      const irrelevantEntry = {
        entryType: 'resource',
        name: 'https://external.com/ad.js',
        duration: 100
      }

      const result = monitor.isRelevantResource(irrelevantEntry.name)
      expect(result).toBe(false)

      const relevantEntry = {
        entryType: 'resource',
        name: 'https://api.example.com/data',
        duration: 100
      }

      const relevantResult = monitor.isRelevantResource(relevantEntry.name)
      expect(relevantResult).toBe(true)
    })
  })

  describe('React Performance', () => {
    it('should track React metrics', () => {
      monitor.trackReactMetrics()

      const metrics = monitor.metrics.get('react')
      expect(metrics).toHaveLength(1)

      const metric = metrics[0]
      expect(metric.type).toBe('react')
      expect(metric.componentsRendered).toBeGreaterThan(0)
      expect(metric.renderTime).toBeGreaterThan(0)
      expect(metric.memoryUsage).toBeDefined()
    })

    it('should alert on excessive re-renders', () => {
      const alertSpy = vi.spyOn(monitor, 'triggerPerformanceAlert')

      // Mock excessive re-renders
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9) // componentsRendered
        .mockReturnValueOnce(0.5) // renderTime
        .mockReturnValueOnce(0.9) // reRenders > 5
        .mockReturnValueOnce(0.5) // suspenseCount

      monitor.trackReactMetrics()

      expect(alertSpy).toHaveBeenCalledWith(
        'excessive_rerenders',
        expect.objectContaining({
          count: expect.any(Number),
          threshold: 5
        })
      )

      alertSpy.mockRestore()
      vi.restoreAllMocks()
    })

    it('should handle React render notifications', () => {
      monitor.handleReactRender('TestComponent', 'mount', 25.5)

      const metrics = monitor.metrics.get('react-render')
      expect(metrics).toHaveLength(1)

      const metric = metrics[0]
      expect(metric.type).toBe('react-render')
      expect(metric.componentId).toBe('TestComponent')
      expect(metric.phase).toBe('mount')
      expect(metric.duration).toBe(25.5)
    })
  })

  describe('Core Web Vitals Calculation', () => {
    it('should calculate core web vitals correctly', () => {
      // Add sample metrics
      monitor.addMetric('paint', { name: 'first-contentful-paint', startTime: 1500 })
      monitor.addMetric('lcp', { startTime: 2200 })
      monitor.addMetric('first-input', { delay: 80 })
      monitor.clsScore = 0.08

      const vitals = monitor.getCoreWebVitals()

      expect(vitals.fcp).toBe(1500)
      expect(vitals.lcp).toBe(2200)
      expect(vitals.fid).toBe(80)
      expect(vitals.cls).toBe(0.08)
    })

    it('should handle missing vital metrics', () => {
      const vitals = monitor.getCoreWebVitals()

      expect(vitals.fcp).toBeNull()
      expect(vitals.lcp).toBeNull()
      expect(vitals.fid).toBeNull()
      expect(vitals.cls).toBe(0)
    })
  })

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', () => {
      // Add some test metrics
      monitor.addMetric('paint', { name: 'first-contentful-paint', startTime: 1500 })
      monitor.addMetric('api', { duration: 200, endpoint: '/api/test' })
      monitor.addMetric('react', { renderTime: 15, reRenders: 2 })

      const report = monitor.generatePerformanceReport()

      expect(report.timestamp).toBeDefined()
      expect(report.sessionId).toBe(monitor.sessionId)
      expect(report.coreWebVitals).toBeDefined()
      expect(report.recommendations).toBeInstanceOf(Array)
    })

    it('should generate performance recommendations', () => {
      // Mock poor performance metrics
      monitor.addMetric('paint', { name: 'first-contentful-paint', startTime: 2000 })
      monitor.addMetric('lcp', { startTime: 3000 })
      monitor.clsScore = 0.2

      const recommendations = monitor.generateRecommendations()

      expect(recommendations).toHaveLength(3)
      expect(recommendations[0].type).toBe('fcp')
      expect(recommendations[1].type).toBe('lcp')
      expect(recommendations[2].type).toBe('cls')
      expect(recommendations[2].priority).toBe('critical')
    })
  })

  describe('Utility Methods', () => {
    it('should calculate median correctly', () => {
      const values = [1, 3, 2, 5, 4]
      const median = monitor.calculateMedian(values)
      expect(median).toBe(3)

      const evenValues = [1, 2, 3, 4]
      const evenMedian = monitor.calculateMedian(evenValues)
      expect(evenMedian).toBe(2.5)
    })

    it('should calculate percentiles correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const p95 = monitor.calculatePercentile(values, 95)
      expect(p95).toBe(10) // 95th percentile

      const p50 = monitor.calculatePercentile(values, 50)
      expect(p50).toBe(5) // 50th percentile (median)
    })

    it('should get connection info when available', () => {
      const connectionInfo = monitor.getConnectionInfo()

      expect(connectionInfo.effectiveType).toBe('4g')
      expect(connectionInfo.downlink).toBe(10)
      expect(connectionInfo.rtt).toBe(50)
    })

    it('should get memory usage when available', () => {
      const memoryInfo = monitor.getMemoryUsage()

      expect(memoryInfo.used).toBe(30) // 30MB
      expect(memoryInfo.total).toBe(50) // 50MB
      expect(memoryInfo.limit).toBe(100) // 100MB
    })
  })

  describe('Alert System', () => {
    it('should determine correct alert severity', () => {
      expect(monitor.getAlertSeverity('threshold_exceeded', { metric: 'cls', value: 0.3 }))
        .toBe('critical')

      expect(monitor.getAlertSeverity('slow_api_call', { duration: 15000 }))
        .toBe('critical')

      expect(monitor.getAlertSeverity('excessive_rerenders', { count: 15 }))
        .toBe('critical')
    })

    it('should report alerts to external services', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const alert = {
        type: 'performance_alert',
        severity: 'warning'
      }

      monitor.reportAlert(alert)
      expect(consoleSpy).toHaveBeenCalledWith('Reporting alert to external services:', alert)

      consoleSpy.mockRestore()
    })
  })
})