/**
 * Test Setup for Production Module
 * Global test configuration and mocks
 */

import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver for component tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver for lazy loading tests
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock performance.now for timing tests
global.performance = global.performance || {}
global.performance.now = vi.fn(() => Date.now())

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
global.sessionStorage = localStorageMock

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}

// Mock fetch for API tests
global.fetch = vi.fn()

// Mock URL and Blob for file operations
global.URL = {
  createObjectURL: vi.fn(() => 'mock-blob-url'),
  revokeObjectURL: vi.fn(),
}

global.Blob = vi.fn((content, _options) => ({
  content,
  options,
  size: content?.[0]?.length || 0,
  type: options?.type || 'application/octet-stream',
}))

// Mock document.createElement for download tests
const mockElement = {
  href: '',
  download: '',
  click: vi.fn(),
  style: {},
  appendChild: vi.fn(),
  removeChild: vi.fn(),
}

global.document = {
  ...global.document,
  createElement: vi.fn(() => mockElement),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
}

// Mock WebSocket for IoT tests
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
    this.sentMessages = []

    // Simulate async connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) this.onopen(new Event('open'))
    }, 10)
  }

  send(data) {
    this.sentMessages.push(data)
  }

  close() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) this.onclose(new Event('close'))
  }

  // Test helpers
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) })
    }
  }

  simulateError(error) {
    if (this.onerror) this.onerror(error)
  }
}

// WebSocket constants
MockWebSocket.CONNECTING = 0
MockWebSocket.OPEN = 1
MockWebSocket.CLOSING = 2
MockWebSocket.CLOSED = 3

global.WebSocket = MockWebSocket

// Mock timers
vi.useFakeTimers()

// Clean up after each test
afterEach(_() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
  localStorage.clear()
  sessionStorage.clear()
})

// Clean up after all tests
afterAll(_() => {
  vi.useRealTimers()
})

// Export commonly used test utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

export const flushPromises = () => new Promise(resolve => setImmediate(resolve))

export const mockLocalStorage = localStorageMock

export const mockWebSocket = MockWebSocket

export const mockElement

// Helper to create mock IoT data
export const createMockSensorData = (machineId = 'CNC_001') => ({
  machineId,
  timestamp: new Date().toISOString(),
  status: 'online',
  sensors: {
    temperature: { value: 75.2, unit: '°C', status: 'normal' },
    pressure: { value: 3.2, unit: 'bar', status: 'normal' },
    vibration: { value: 2.1, unit: 'mm/s', status: 'normal' },
    flowRate: { value: 18.5, unit: 'L/min', status: 'normal' },
    powerConsumption: { value: 12.8, unit: 'kW', status: 'normal' },
    productionCount: { value: 1450, unit: 'pieces', status: 'normal' },
    qualityScore: { value: 94.2, unit: '%', status: 'normal' },
    safetyStatus: { value: 'safe', unit: '', status: 'normal' }
  },
  oee: {
    availability: 92.5,
    performance: 88.3,
    quality: 96.1,
    overall: 80.7
  },
  alarms: [],
  lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  nextMaintenance: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
})

// Helper to create mock machine state
export const createMockMachineState = (machineId = 'CNC_001') => ({
  machineId,
  currentState: 'running',
  stateStartTime: new Date().toISOString(),
  cycleTime: 118000,
  targetCycleTime: 120000,
  productivity: 92.3,
  efficiency: 98.3,
  downtime: 0,
  totalRuntime: 28800000
})

// Helper to create mock alarms
export const createMockAlarm = (machineId = 'CNC_001', severity = 'medium') => ({
  id: `alarm_${Date.now()}`,
  machineId,
  severity,
  message: `Test alarm for ${machineId}`,
  timestamp: new Date().toISOString(),
  acknowledged: false,
  resolved: false,
  category: 'test_alarm',
  recommendedAction: 'Check system status'
})

// Helper to create mock production metrics
export const createMockProductionMetrics = () => ({
  summary: {
    totalProduction: 1500,
    targetProduction: 1600,
    efficiency: 85.2,
    qualityScore: 94.1,
    downtime: 45,
    activeAlarms: 2
  },
  oee: {
    overall: 78.5,
    availability: 88.2,
    performance: 89.1,
    quality: 94.1,
    trend: 'improving'
  },
  machines: [
    {
      id: 'CNC_001',
      name: 'CNC Machine 1',
      status: 'running',
      oee: 82.1,
      currentJob: 'JOB_001',
      efficiency: 88.5
    }
  ],
  schedule: [
    {
      id: 'JOB_001',
      productName: 'Product A',
      quantity: 500,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      priority: 'high'
    }
  ],
  quality: {
    overallScore: 94.1,
    defectRate: 2.1,
    firstPassYield: 97.9,
    reworkRate: 1.8,
    defectTypes: [
      { type: 'Surface defect', count: 12 },
      { type: 'Dimensional', count: 8 }
    ]
  },
  capacity: {
    utilized: 82.5,
    available: 95.0,
    planned: 100.0,
    bottlenecks: ['CNC_002'],
    forecast: [85, 88, 90, 87, 89]
  },
  shifts: [
    {
      id: 'shift_1',
      name: 'Day Shift',
      startTime: '06:00',
      endTime: '14:00',
      supervisor: 'John Smith',
      performance: 88.2
    }
  ],
  alerts: [
    {
      id: 'alert_001',
      type: 'performance',
      severity: 'medium',
      message: 'Machine efficiency below target',
      timestamp: new Date().toISOString(),
      source: 'CNC_001'
    }
  ]
})