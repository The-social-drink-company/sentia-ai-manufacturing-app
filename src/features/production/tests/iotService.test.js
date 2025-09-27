/**
 * IoT Service Test Suite
 * Comprehensive tests for IoT sensor integration and machine communication
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import iotService from '../services/iotService'

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
    this.sentMessages = []

    // Simulate connection after short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) this.onopen()
    }, 10)
  }

  send(data) {
    this.sentMessages.push(data)
  }

  close() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) this.onclose()
  }

  // Test helper to simulate incoming messages
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) })
    }
  }

  // Test helper to simulate errors
  simulateError(error) {
    if (this.onerror) this.onerror(error)
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket
global.WebSocket.CONNECTING = 0
global.WebSocket.OPEN = 1
global.WebSocket.CLOSING = 2
global.WebSocket.CLOSED = 3

// Mock performance.now
global.performance = {
  now: vi.fn(() => Date.now())
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

describe('IoT Service', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)

    // Reset service state
    iotService.isConnected = false
    iotService.sensorData?.clear()
    iotService.machineStates?.clear()
  })

  afterEach(() => {
    iotService.disconnect()
  })

  describe('Initialization', () => {
    it('should initialize with default machine configuration', () => {
      const connectionStatus = iotService.getConnectionStatus()

      expect(connectionStatus.totalMachines).toBeGreaterThan(0)
      expect(connectionStatus.onlineMachines).toBe(0) // Starts offline
      expect(connectionStatus.isConnected).toBe(false)
    })

    it('should initialize sensor data for all machines', () => {
      const allSensorData = iotService.getAllSensorData()

      expect(allSensorData).toBeInstanceOf(Array)
      expect(allSensorData.length).toBeGreaterThan(0)

      // Check first machine has required structure
      const firstMachine = allSensorData[0]
      expect(firstMachine).toHaveProperty('machineId')
      expect(firstMachine).toHaveProperty('sensors')
      expect(firstMachine).toHaveProperty('oee')
      expect(firstMachine.sensors).toHaveProperty('temperature')
      expect(firstMachine.sensors).toHaveProperty('pressure')
    })

    it('should initialize machine states', () => {
      const allSensorData = iotService.getAllSensorData()
      const firstMachineId = allSensorData[0].machineId

      const machineState = iotService.getMachineState(firstMachineId)

      expect(machineState).toHaveProperty('currentState')
      expect(machineState).toHaveProperty('stateStartTime')
      expect(machineState).toHaveProperty('cycleTime')
      expect(machineState).toHaveProperty('targetCycleTime')
    })
  })

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection', async () => {
      // Connection is automatically attempted on service creation
      await new Promise(resolve => setTimeout(resolve, 50))

      const status = iotService.getConnectionStatus()
      expect(status.isConnected).toBe(true)
    })

    it('should handle connection failures gracefully', () => {
      const originalWebSocket = global.WebSocket

      // Mock failing WebSocket
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url)
          setTimeout(() => {
            this.readyState = WebSocket.CLOSED
            if (this.onerror) this.onerror(new Error('Connection failed'))
          }, 10)
        }
      }

      // This should not throw an error
      expect(() => {
        iotService.connect()
      }).not.toThrow()

      global.WebSocket = originalWebSocket
    })

    it('should attempt reconnection on connection loss', async () => {
      // First establish connection
      await new Promise(resolve => setTimeout(resolve, 50))

      const reconnectSpy = vi.spyOn(iotService, 'connect')

      // Simulate connection loss
      if (iotService.websocket) {
        iotService.websocket.close()
      }

      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(reconnectSpy).toHaveBeenCalled()
    })
  })

  describe('Sensor Data Processing', () => {
    beforeEach(async () => {
      // Ensure connection is established
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    it('should process incoming sensor data', () => {
      const testSensorData = {
        type: 'sensor_data',
        payload: {
          machineId: 'CNC_001',
          timestamp: new Date().toISOString(),
          sensors: {
            temperature: { value: 75.5, unit: '°C', status: 'normal' },
            vibration: { value: 2.1, unit: 'mm/s', status: 'normal' }
          }
        }
      }

      // Simulate incoming WebSocket message
      if (iotService.websocket) {
        iotService.websocket.simulateMessage(testSensorData)
      }

      const machineData = iotService.getMachineSensorData('CNC_001')
      expect(machineData.sensors.temperature.value).toBe(75.5)
      expect(machineData.sensors.vibration.value).toBe(2.1)
      expect(machineData.status).toBe('online')
    })

    it('should process machine state changes', () => {
      const testStateChange = {
        type: 'machine_state',
        payload: {
          machineId: 'CNC_001',
          state: 'running',
          cycleTime: 115000,
          productivity: 95.2
        }
      }

      if (iotService.websocket) {
        iotService.websocket.simulateMessage(testStateChange)
      }

      const machineState = iotService.getMachineState('CNC_001')
      expect(machineState.currentState).toBe('running')
      expect(machineState.cycleTime).toBe(115000)
      expect(machineState.productivity).toBe(95.2)
    })

    it('should process OEE updates', () => {
      const testOEEUpdate = {
        type: 'oee_update',
        payload: {
          machineId: 'CNC_001',
          availability: 92.5,
          performance: 88.3,
          quality: 96.1,
          overall: 80.7
        }
      }

      if (iotService.websocket) {
        iotService.websocket.simulateMessage(testOEEUpdate)
      }

      const machineData = iotService.getMachineSensorData('CNC_001')
      expect(machineData.oee.availability).toBe(92.5)
      expect(machineData.oee.performance).toBe(88.3)
      expect(machineData.oee.quality).toBe(96.1)
      expect(machineData.oee.overall).toBe(80.7)
    })

    it('should process alarm notifications', () => {
      const testAlarm = {
        type: 'alarm',
        payload: {
          machineId: 'CNC_001',
          alarmId: 'temp_001',
          severity: 'critical',
          message: 'Temperature exceeded critical threshold',
          timestamp: new Date().toISOString()
        }
      }

      if (iotService.websocket) {
        iotService.websocket.simulateMessage(testAlarm)
      }

      const machineData = iotService.getMachineSensorData('CNC_001')
      expect(machineData.alarms).toHaveLength(1)
      expect(machineData.alarms[0].severity).toBe('critical')
      expect(machineData.alarms[0].acknowledged).toBe(false)
    })
  })

  describe('Machine Control', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    it('should send machine commands', () => {
      const success = iotService.sendMachineCommand('CNC_001', 'start')

      expect(success).toBe(true)
      expect(iotService.websocket.sentMessages).toHaveLength(1)

      const sentMessage = JSON.parse(iotService.websocket.sentMessages[0])
      expect(sentMessage.type).toBe('machine_command')
      expect(sentMessage.payload.machineId).toBe('CNC_001')
      expect(sentMessage.payload.command).toBe('start')
    })

    it('should send commands with parameters', () => {
      const parameters = { rpm: 1500, feedRate: 0.2 }
      const success = iotService.sendMachineCommand('CNC_001', 'set_speed', parameters)

      expect(success).toBe(true)

      const sentMessage = JSON.parse(iotService.websocket.sentMessages[0])
      expect(sentMessage.payload.parameters).toEqual(parameters)
    })

    it('should fail to send commands when disconnected', () => {
      iotService.disconnect()

      const success = iotService.sendMachineCommand('CNC_001', 'start')
      expect(success).toBe(false)
    })
  })

  describe('Alarm Management', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))

      // Add test alarm
      const testAlarm = {
        type: 'alarm',
        payload: {
          machineId: 'CNC_001',
          alarmId: 'test_alarm_001',
          severity: 'high',
          message: 'Test alarm message',
          timestamp: new Date().toISOString()
        }
      }

      if (iotService.websocket) {
        iotService.websocket.simulateMessage(testAlarm)
      }
    })

    it('should acknowledge alarms', () => {
      const success = iotService.acknowledgeAlarm('CNC_001', 'test_alarm_001')

      expect(success).toBe(true)

      const machineData = iotService.getMachineSensorData('CNC_001')
      const alarm = machineData.alarms.find(a => a.id === 'test_alarm_001')
      expect(alarm.acknowledged).toBe(true)
      expect(alarm).toHaveProperty('acknowledgedAt')
    })

    it('should send acknowledgment to IoT system', () => {
      iotService.acknowledgeAlarm('CNC_001', 'test_alarm_001')

      const ackMessage = iotService.websocket.sentMessages.find(msg => {
        const parsed = JSON.parse(msg)
        return parsed.type === 'acknowledge_alarm'
      })

      expect(ackMessage).toBeDefined()
      const parsed = JSON.parse(ackMessage)
      expect(parsed.payload.machineId).toBe('CNC_001')
      expect(parsed.payload.alarmId).toBe('test_alarm_001')
    })

    it('should handle acknowledgment of non-existent alarms', () => {
      const success = iotService.acknowledgeAlarm('CNC_001', 'non_existent_alarm')
      expect(success).toBe(false)
    })
  })

  describe('Mock Data Generation', () => {
    it('should generate realistic mock sensor data', () => {
      // Trigger mock data generation
      iotService.generateMockSensorData()

      const allData = iotService.getAllSensorData()
      expect(allData.length).toBeGreaterThan(0)

      const firstMachine = allData[0]

      // Check temperature is in realistic range (65-85°C)
      expect(firstMachine.sensors.temperature.value).toBeGreaterThanOrEqual(65)
      expect(firstMachine.sensors.temperature.value).toBeLessThanOrEqual(85)

      // Check pressure is in realistic range (2.5-4.0 bar)
      expect(firstMachine.sensors.pressure.value).toBeGreaterThanOrEqual(2.5)
      expect(firstMachine.sensors.pressure.value).toBeLessThanOrEqual(4.0)

      // Check OEE is calculated
      expect(firstMachine.oee.overall).toBeGreaterThanOrEqual(0)
      expect(firstMachine.oee.overall).toBeLessThanOrEqual(100)
    })

    it('should update machine states during mock data generation', () => {
      const initialState = iotService.getMachineState('CNC_001')
      const initialStateValue = initialState.currentState

      // Generate multiple mock updates to trigger state changes
      for (let i = 0; i < 50; i++) {
        iotService.generateMockSensorData()
      }

      // State should potentially have changed
      const updatedState = iotService.getMachineState('CNC_001')
      expect(['running', 'idle', 'maintenance', 'stopped']).toContain(updatedState.currentState)
    })
  })

  describe('Health Monitoring', () => {
    it('should perform health checks', () => {
      const initialStatus = iotService.getConnectionStatus()

      iotService.performHealthCheck()

      // Health check should not change connection status if healthy
      const postCheckStatus = iotService.getConnectionStatus()
      expect(postCheckStatus.isConnected).toBe(initialStatus.isConnected)
    })

    it('should detect unhealthy connections', () => {
      // Mock old last data received time
      iotService.lastDataReceived = new Date(Date.now() - 120000) // 2 minutes ago

      const healthySpy = vi.spyOn(iotService, 'handleConnectionFailure')
      iotService.performHealthCheck()

      // Should trigger connection failure handling
      expect(healthySpy).toHaveBeenCalled()
    })
  })

  describe('Connection Status', () => {
    it('should provide accurate connection status', () => {
      const status = iotService.getConnectionStatus()

      expect(status).toHaveProperty('isConnected')
      expect(status).toHaveProperty('totalMachines')
      expect(status).toHaveProperty('onlineMachines')
      expect(status).toHaveProperty('reconnectAttempts')
      expect(status).toHaveProperty('connectionStartTime')

      expect(typeof status.isConnected).toBe('boolean')
      expect(typeof status.totalMachines).toBe('number')
      expect(typeof status.onlineMachines).toBe('number')
    })

    it('should track online machine count', () => {
      // Initially all machines should be offline
      const initialStatus = iotService.getConnectionStatus()
      expect(initialStatus.onlineMachines).toBe(0)

      // Generate mock data to bring machines online
      iotService.generateMockSensorData()

      const updatedStatus = iotService.getConnectionStatus()
      expect(updatedStatus.onlineMachines).toBeGreaterThan(0)
    })
  })

  describe('Event Listeners', () => {
    it('should add and remove event listeners', () => {
      const mockListener = vi.fn()

      const removeListener = iotService.addEventListener(mockListener)
      expect(iotService.listeners.has(mockListener)).toBe(true)

      removeListener()
      expect(iotService.listeners.has(mockListener)).toBe(false)
    })

    it('should notify listeners of events', () => {
      const mockListener = vi.fn()
      iotService.addEventListener(mockListener)

      iotService.notifyListeners('test_event', { data: 'test' })

      expect(mockListener).toHaveBeenCalledWith('test_event', { data: 'test' })
    })

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error')
      })
      const goodListener = vi.fn()

      iotService.addEventListener(errorListener)
      iotService.addEventListener(goodListener)

      // Should not throw despite error in one listener
      expect(() => {
        iotService.notifyListeners('test_event', {})
      }).not.toThrow()

      expect(goodListener).toHaveBeenCalled()
    })
  })

  describe('Data Retrieval', () => {
    it('should retrieve all sensor data', () => {
      const allData = iotService.getAllSensorData()

      expect(Array.isArray(allData)).toBe(true)
      expect(allData.length).toBeGreaterThan(0)

      // Each machine should have required properties
      allData.forEach(machine => {
        expect(machine).toHaveProperty('machineId')
        expect(machine).toHaveProperty('sensors')
        expect(machine).toHaveProperty('oee')
        expect(machine).toHaveProperty('timestamp')
      })
    })

    it('should retrieve specific machine data', () => {
      const allData = iotService.getAllSensorData()
      const firstMachineId = allData[0].machineId

      const specificData = iotService.getMachineSensorData(firstMachineId)

      expect(specificData).toBeDefined()
      expect(specificData.machineId).toBe(firstMachineId)
    })

    it('should return undefined for non-existent machines', () => {
      const nonExistentData = iotService.getMachineSensorData('NON_EXISTENT_MACHINE')
      expect(nonExistentData).toBeUndefined()
    })
  })

  describe('Cleanup', () => {
    it('should disconnect properly', () => {
      const closeSpy = vi.fn()
      if (iotService.websocket) {
        iotService.websocket.close = closeSpy
      }

      iotService.disconnect()

      expect(closeSpy).toHaveBeenCalled()
      expect(iotService.isConnected).toBe(false)
    })
  })
})

describe('IoT Service Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle malformed WebSocket messages', async () => {
    await new Promise(resolve => setTimeout(resolve, 50))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Send malformed JSON
    if (iotService.websocket && iotService.websocket.onmessage) {
      iotService.websocket.onmessage({ data: 'invalid json' })
    }

    // Should not crash
    expect(() => {
      const status = iotService.getConnectionStatus()
      expect(status).toBeDefined()
    }).not.toThrow()

    consoleSpy.mockRestore()
  })

  it('should handle unknown message types', async () => {
    await new Promise(resolve => setTimeout(resolve, 50))

    const unknownMessage = {
      type: 'unknown_message_type',
      payload: { data: 'test' }
    }

    // Should not crash with unknown message type
    expect(() => {
      if (iotService.websocket) {
        iotService.websocket.simulateMessage(unknownMessage)
      }
    }).not.toThrow()
  })

  it('should handle sensor data for unknown machines', () => {
    const unknownMachineData = {
      type: 'sensor_data',
      payload: {
        machineId: 'UNKNOWN_MACHINE',
        sensors: {
          temperature: { value: 75, unit: '°C', status: 'normal' }
        }
      }
    }

    // Should not crash with unknown machine
    expect(() => {
      if (iotService.websocket) {
        iotService.websocket.simulateMessage(unknownMachineData)
      }
    }).not.toThrow()
  })
})