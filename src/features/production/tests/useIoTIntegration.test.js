/**
 * IoT Integration Hooks Test Suite
 * Tests for React hooks that interface with IoT service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useIoTIntegration,
  useIoTSensorData,
  useIoTMachineStates,
  useIoTOEEData,
  useIoTAlarms,
  useIoTProductionMetrics,
  useIoTMachineControl
} from '../hooks/useIoTIntegration'

// Mock the IoT service
const mockIoTService = {
  getConnectionStatus: vi.fn(),
  getAllSensorData: vi.fn(),
  getMachineSensorData: vi.fn(),
  getMachineState: vi.fn(),
  addEventListener: vi.fn(),
  acknowledgeAlarm: vi.fn(),
  sendMachineCommand: vi.fn()
}

vi.mock('../services/iotService', () => ({
  default: mockIoTService
}))

// Mock audit trail hook
vi.mock('../../working-capital/hooks/useAuditTrail', () => ({
  useAuditTrail: () => ({
    trackAction: vi.fn(),
    logDataAccess: vi.fn(),
    logError: vi.fn(),
    logPerformance: vi.fn()
  })
}))

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  })

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useIoTIntegration', () => {
  let mockEventListener

  beforeEach(() => {
    vi.clearAllMocks()

    mockIoTService.getConnectionStatus.mockReturnValue({
      isConnected: true,
      totalMachines: 5,
      onlineMachines: 3,
      lastDataReceived: new Date().toISOString(),
      reconnectAttempts: 0
    })

    mockIoTService.getAllSensorData.mockReturnValue([
      {
        machineId: 'CNC_001',
        sensors: {
          temperature: { value: 75.2, unit: '°C', status: 'normal' }
        },
        oee: { overall: 85.5 }
      }
    ])

    // Mock addEventListener to capture the listener function
    mockIoTService.addEventListener.mockImplementation((listener) => {
      mockEventListener = listener
      return () => {} // cleanup function
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should initialize with connection _status', () => {
    const { result } = renderHook(() => useIoTIntegration(), {
      wrapper: createWrapper()
    })

    expect(result.current.isConnected).toBe(true)
    expect(result.current.connectionStatus.totalMachines).toBe(5)
    expect(result.current.connectionStatus.onlineMachines).toBe(3)
  })

  it('should set up event listener on _mount', () => {
    renderHook(() => useIoTIntegration(), {
      wrapper: createWrapper()
    })

    expect(mockIoTService.addEventListener).toHaveBeenCalledWith(
      expect.any(Function)
    )
  })

  it('should update real-time data when receiving sensor _events', async () => {
    const { result } = renderHook(() => useIoTIntegration(), {
      wrapper: createWrapper()
    })

    act(() => {
      // Simulate sensor data event
      mockEventListener('sensor_data', {
        machineId: 'CNC_001',
        sensors: { temperature: { value: 80.1 } }
      })
    })

    await waitFor(() => {
      expect(result.current.realTimeData).toHaveLength(1)
    })
  })

  it('should handle alarm _events', async () => {
    const { result } = renderHook(() => useIoTIntegration(), {
      wrapper: createWrapper()
    })

    const alarmData = {
      machineId: 'CNC_001',
      id: 'alarm_001',
      severity: 'critical',
      message: 'Temperature critical'
    }

    act(() => {
      mockEventListener('alarm', alarmData)
    })

    await waitFor(() => {
      expect(result.current.alarms).toContainEqual(alarmData)
    })
  })

  it('should acknowledge _alarms', async () => {
    mockIoTService.acknowledgeAlarm.mockReturnValue(true)

    const { result } = renderHook(() => useIoTIntegration(), {
      wrapper: createWrapper()
    })

    const success = result.current.acknowledgeAlarm('CNC_001', 'alarm_001')

    expect(success).toBe(true)
    expect(mockIoTService.acknowledgeAlarm).toHaveBeenCalledWith('CNC_001', 'alarm_001')
  })

  it('should send machine _commands', async () => {
    mockIoTService.sendMachineCommand.mockReturnValue(true)

    const { result } = renderHook(() => useIoTIntegration(), {
      wrapper: createWrapper()
    })

    const success = result.current.sendCommand('CNC_001', 'start', {})

    expect(success).toBe(true)
    expect(mockIoTService.sendMachineCommand).toHaveBeenCalledWith('CNC_001', 'start', {})
  })
})

describe('useIoTSensorData', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockIoTService.getConnectionStatus.mockReturnValue({
      isConnected: true
    })
  })

  it('should fetch all sensor data when no machineId _specified', async () => {
    const mockSensorData = [
      { machineId: 'CNC_001', sensors: { temperature: { value: 75 } } },
      { machineId: 'CNC_002', sensors: { temperature: { value: 78 } } }
    ]

    mockIoTService.getAllSensorData.mockReturnValue(mockSensorData)

    const { result } = renderHook(() => useIoTSensorData(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockSensorData)
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockIoTService.getAllSensorData).toHaveBeenCalled()
  })

  it('should fetch specific machine data when machineId _provided', async () => {
    const mockMachineData = {
      machineId: 'CNC_001',
      sensors: { temperature: { value: 75 } }
    }

    mockIoTService.getMachineSensorData.mockReturnValue(mockMachineData)

    const { result } = renderHook(() => useIoTSensorData('CNC_001'), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockMachineData)
    })

    expect(mockIoTService.getMachineSensorData).toHaveBeenCalledWith('CNC_001')
  })

  it('should handle error when machine not _found', async () => {
    mockIoTService.getMachineSensorData.mockReturnValue(null)

    const { result } = renderHook(() => useIoTSensorData('NON_EXISTENT'), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
      expect(result.current.error?.message).toContain('Machine NON_EXISTENT not found')
    })
  })
})

describe('useIoTMachineStates', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockIoTService.getConnectionStatus.mockReturnValue({
      isConnected: true
    })
  })

  it('should fetch machine state for specific _machine', async () => {
    const mockMachineState = {
      currentState: 'running',
      cycleTime: 120000,
      productivity: 95.2
    }

    mockIoTService.getMachineState.mockReturnValue(mockMachineState)

    const { result } = renderHook(() => useIoTMachineStates('CNC_001'), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockMachineState)
    })

    expect(mockIoTService.getMachineState).toHaveBeenCalledWith('CNC_001')
  })

  it('should fetch all machine states when no machineId _specified', async () => {
    const mockSensorData = [
      { machineId: 'CNC_001' },
      { machineId: 'CNC_002' }
    ]

    const mockStates = {
      'CNC_001': { currentState: 'running' },
      'CNC_002': { currentState: 'idle' }
    }

    mockIoTService.getAllSensorData.mockReturnValue(mockSensorData)
    mockIoTService.getMachineState.mockImplementation((id) => mockStates[id])

    const { result } = renderHook(() => useIoTMachineStates(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockStates)
    })
  })
})

describe('useIoTOEEData', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockIoTService.getConnectionStatus.mockReturnValue({
      isConnected: true
    })
  })

  it('should fetch OEE data for specific _machine', async () => {
    const mockMachineData = {
      machineId: 'CNC_001',
      timestamp: new Date().toISOString(),
      oee: {
        availability: 92.5,
        performance: 88.3,
        quality: 96.1,
        overall: 80.7
      }
    }

    mockIoTService.getMachineSensorData.mockReturnValue(mockMachineData)

    const { result } = renderHook(() => useIoTOEEData('CNC_001'), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.data.machineId).toBe('CNC_001')
      expect(result.current.data.availability).toBe(92.5)
      expect(result.current.data.overall).toBe(80.7)
    })
  })

  it('should fetch OEE data for all _machines', async () => {
    const mockSensorData = [
      {
        machineId: 'CNC_001',
        timestamp: new Date().toISOString(),
        oee: { availability: 92.5, performance: 88.3, quality: 96.1, overall: 80.7 }
      },
      {
        machineId: 'CNC_002',
        timestamp: new Date().toISOString(),
        oee: { availability: 88.0, performance: 92.1, quality: 94.5, overall: 76.5 }
      }
    ]

    mockIoTService.getAllSensorData.mockReturnValue(mockSensorData)

    const { result } = renderHook(() => useIoTOEEData(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data[0].machineId).toBe('CNC_001')
      expect(result.current.data[1].machineId).toBe('CNC_002')
    })
  })
})

describe('useIoTAlarms', () => {
  it('should filter alarms by machine when _specified', () => {
    const mockAlarms = [
      { machineId: 'CNC_001', id: 'alarm_001', severity: 'critical' },
      { machineId: 'CNC_002', id: 'alarm_002', severity: 'high' },
      { machineId: 'CNC_001', id: 'alarm_003', severity: 'medium' }
    ]

    // Mock the useIoTIntegration hook to return alarms
    vi.doMock('../hooks/useIoTIntegration', async () => {
      const actual = await vi.importActual('../hooks/useIoTIntegration')
      return {
        ...actual,
        useIoTIntegration: () => ({
          alarms: mockAlarms,
          acknowledgeAlarm: vi.fn()
        })
      }
    })

    const { result } = renderHook(() => useIoTAlarms('CNC_001'), {
      wrapper: createWrapper()
    })

    expect(result.current.allAlarms).toHaveLength(2)
    expect(result.current.allAlarms.every(alarm => alarm.machineId === 'CNC_001')).toBe(true)
  })

  it('should group alarms by _severity', () => {
    const mockAlarms = [
      { machineId: 'CNC_001', severity: 'critical', acknowledged: false },
      { machineId: 'CNC_001', severity: 'high', acknowledged: false },
      { machineId: 'CNC_001', severity: 'critical', acknowledged: true },
      { machineId: 'CNC_001', severity: 'medium', acknowledged: false }
    ]

    vi.doMock('../hooks/useIoTIntegration', async () => {
      const actual = await vi.importActual('../hooks/useIoTIntegration')
      return {
        ...actual,
        useIoTIntegration: () => ({
          alarms: mockAlarms,
          acknowledgeAlarm: vi.fn()
        })
      }
    })

    const { result } = renderHook(() => useIoTAlarms(), {
      wrapper: createWrapper()
    })

    expect(result.current.alarmsBySeverity.critical).toHaveLength(2)
    expect(result.current.alarmsBySeverity.high).toHaveLength(1)
    expect(result.current.alarmsBySeverity.medium).toHaveLength(1)
    expect(result.current.criticalCount).toBe(2)
  })

  it('should identify unacknowledged _alarms', () => {
    const mockAlarms = [
      { machineId: 'CNC_001', acknowledged: false },
      { machineId: 'CNC_001', acknowledged: true },
      { machineId: 'CNC_001', acknowledged: false }
    ]

    vi.doMock('../hooks/useIoTIntegration', async () => {
      const actual = await vi.importActual('../hooks/useIoTIntegration')
      return {
        ...actual,
        useIoTIntegration: () => ({
          alarms: mockAlarms,
          acknowledgeAlarm: vi.fn()
        })
      }
    })

    const { result } = renderHook(() => useIoTAlarms(), {
      wrapper: createWrapper()
    })

    expect(result.current.unacknowledgedAlarms).toHaveLength(2)
  })
})

describe('useIoTProductionMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate production metrics from IoT _data', async () => {
    const mockSensorData = [
      {
        machineId: 'CNC_001',
        status: 'online',
        sensors: {
          productionCount: { value: 100 },
          qualityScore: { value: 95 }
        }
      },
      {
        machineId: 'CNC_002',
        status: 'online',
        sensors: {
          productionCount: { value: 80 },
          qualityScore: { value: 92 }
        }
      }
    ]

    const mockOEEData = [
      { machineId: 'CNC_001', overall: 85 },
      { machineId: 'CNC_002', overall: 78 }
    ]

    const mockMachineStates = {
      'CNC_001': { currentState: 'running' },
      'CNC_002': { currentState: 'idle' }
    }

    // Mock the individual hooks
    vi.doMock('../hooks/useIoTIntegration', async () => {
      const actual = await vi.importActual('../hooks/useIoTIntegration')
      return {
        ...actual,
        useIoTSensorData: () => ({ data: mockSensorData, isLoading: false, isError: false }),
        useIoTOEEData: () => ({ data: mockOEEData, isLoading: false, isError: false }),
        useIoTMachineStates: () => ({ data: mockMachineStates, isLoading: false, isError: false }),
        useIoTAlarms: () => ({ alarms: [] })
      }
    })

    const { result } = renderHook(() => useIoTProductionMetrics(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.summary).toBeDefined()
      expect(result.current.summary.totalMachines).toBe(2)
      expect(result.current.summary.onlineMachines).toBe(2)
      expect(result.current.summary.runningMachines).toBe(1)
      expect(result.current.summary.totalProduction).toBe(180)
    })
  })
})

describe('useIoTMachineControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockIoTService.getConnectionStatus.mockReturnValue({
      isConnected: true
    })
  })

  it('should execute commands when _connected', async () => {
    mockIoTService.sendMachineCommand.mockReturnValue(true)

    const { result } = renderHook(() => useIoTMachineControl('CNC_001'), {
      wrapper: createWrapper()
    })

    const commandResult = await act(async () => {
      return result.current.executeCommand('start')
    })

    expect(commandResult.success).toBe(true)
    expect(mockIoTService.sendMachineCommand).toHaveBeenCalledWith('CNC_001', 'start', {})
  })

  it('should provide convenience methods for common _commands', async () => {
    mockIoTService.sendMachineCommand.mockReturnValue(true)

    const { result } = renderHook(() => useIoTMachineControl('CNC_001'), {
      wrapper: createWrapper()
    })

    await act(async () => {
      await result.current.startMachine()
    })

    expect(mockIoTService.sendMachineCommand).toHaveBeenCalledWith('CNC_001', 'start', {})

    await act(async () => {
      await result.current.stopMachine()
    })

    expect(mockIoTService.sendMachineCommand).toHaveBeenCalledWith('CNC_001', 'stop', {})
  })

  it('should throw error when not _connected', async () => {
    mockIoTService.getConnectionStatus.mockReturnValue({
      isConnected: false
    })

    const { result } = renderHook(() => useIoTMachineControl('CNC_001'), {
      wrapper: createWrapper()
    })

    await expect(
      act(async () => {
        await result.current.executeCommand('start')
      })
    ).rejects.toThrow('IoT system not connected')
  })

  it('should handle command _failures', async () => {
    mockIoTService.sendMachineCommand.mockReturnValue(false)

    const { result } = renderHook(() => useIoTMachineControl('CNC_001'), {
      wrapper: createWrapper()
    })

    await expect(
      act(async () => {
        await result.current.executeCommand('start')
      })
    ).rejects.toThrow('Failed to send command start to CNC_001')
  })
})