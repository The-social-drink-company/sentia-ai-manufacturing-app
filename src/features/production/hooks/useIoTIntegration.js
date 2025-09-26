/**
 * IoT Integration Hooks
 * Provides React integration for IoT sensor service
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import iotService from '../services/iotService'
import { useAuditTrail } from '../../working-capital/hooks/useAuditTrail'

// Main IoT integration hook
export const useIoTIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState(iotService.getConnectionStatus())
  const [realTimeData, setRealTimeData] = useState([])
  const [alarms, setAlarms] = useState([])
  const queryClient = useQueryClient()
  const audit = useAuditTrail('IoTIntegration')
  const listenerRef = useRef(null)

  // Set up real-time event listener
  useEffect(() => {
    const handleIoTEvent = (eventType, data) => {
      switch (eventType) {
        case 'sensor_data':
        case 'mock_data_update':
          setRealTimeData(iotService.getAllSensorData())
          // Invalidate related queries to trigger refresh
          queryClient.invalidateQueries({ queryKey: ['production', 'sensors'] })
          queryClient.invalidateQueries({ queryKey: ['production', 'oee'] })
          break

        case 'machine_state':
          queryClient.invalidateQueries({ queryKey: ['production', 'machines'] })
          audit.trackAction('iot_machine_state_changed', {
            machineId: data.machineId,
            newState: data.state
          })
          break

        case 'alarm':
          setAlarms(prev => [...prev, data])
          audit.trackAction('iot_alarm_received', {
            machineId: data.machineId,
            severity: data.severity
          })
          break

        case 'oee_update':
          queryClient.invalidateQueries({ queryKey: ['production', 'oee'] })
          break

        default:
          // Log unhandled events in development only
          if (import.meta.env.DEV) {
            console.log('Unhandled IoT event:', eventType, data)
          }
      }

      // Update connection status
      setConnectionStatus(iotService.getConnectionStatus())
    }

    // Add event listener
    listenerRef.current = iotService.addEventListener(handleIoTEvent)

    // Initial data load
    setRealTimeData(iotService.getAllSensorData())
    setConnectionStatus(iotService.getConnectionStatus())

    // Cleanup
    return () => {
      if (listenerRef.current) {
        listenerRef.current()
      }
    }
  }, [queryClient, audit])

  // Periodic status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const status = iotService.getConnectionStatus()
      setConnectionStatus(status)

      audit.logPerformance('iot_connection_status_check',
        status.isConnected ? 1 : 0,
        1,
        {
          onlineMachines: status.onlineMachines,
          totalMachines: status.totalMachines
        }
      )
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [audit])

  // Acknowledge alarm
  const acknowledgeAlarm = useCallback((machineId, alarmId) => {
    const success = iotService.acknowledgeAlarm(machineId, alarmId)
    if (success) {
      setAlarms(prev =>
        prev.map(alarm =>
          alarm.machineId === machineId && alarm.id === alarmId
            ? { ...alarm, acknowledged: true, acknowledgedAt: new Date().toISOString() }
            : alarm
        )
      )

      audit.trackAction('iot_alarm_acknowledged', { machineId, alarmId })
    }
    return success
  }, [audit])

  // Send machine command
  const sendCommand = useCallback((machineId, command, parameters = {}) => {
    const success = iotService.sendMachineCommand(machineId, command, parameters)

    if (success) {
      audit.trackAction('iot_machine_command_sent', {
        machineId,
        command,
        parameterCount: Object.keys(parameters).length
      })
    }

    return success
  }, [audit])

  return {
    connectionStatus,
    isConnected: connectionStatus.isConnected,
    realTimeData,
    alarms,
    acknowledgeAlarm,
    sendCommand,
    lastDataReceived: connectionStatus.lastDataReceived
  }
}

// Hook for machine sensor data
export const useIoTSensorData = (machineId = null) => {
  const { realTimeData, connectionStatus } = useIoTIntegration()
  const audit = useAuditTrail('IoTSensorData')

  return useQuery({
    queryKey: ['production', 'sensors', machineId],
    queryFn: () => {
      audit.logDataAccess('sensor_data', {
        source: 'iot_service',
        machineId: machineId || 'all_machines'
      })

      if (machineId) {
        const data = iotService.getMachineSensorData(machineId)
        if (!data) {
          throw new Error(`Machine ${machineId} not found`)
        }
        return data
      } else {
        return iotService.getAllSensorData()
      }
    },
    staleTime: 2000, // 2 seconds
    cacheTime: 10000, // 10 seconds
    refetchInterval: connectionStatus.isConnected ? 5000 : 30000, // More frequent when connected
    onError: (error) => {
      audit.logError(error, {
        query: 'sensor_data',
        machineId: machineId || 'all_machines'
      })
    }
  })
}

// Hook for machine states
export const useIoTMachineStates = (machineId = null) => {
  const { connectionStatus } = useIoTIntegration()
  const audit = useAuditTrail('IoTMachineStates')

  return useQuery({
    queryKey: ['production', 'machines', machineId],
    queryFn: () => {
      audit.logDataAccess('machine_states', {
        source: 'iot_service',
        machineId: machineId || 'all_machines'
      })

      if (machineId) {
        const data = iotService.getMachineState(machineId)
        if (!data) {
          throw new Error(`Machine state for ${machineId} not found`)
        }
        return data
      } else {
        // Get all machine states
        const allSensorData = iotService.getAllSensorData()
        const machineStates = {}

        allSensorData.forEach(machine => {
          const state = iotService.getMachineState(machine.machineId)
          if (state) {
            machineStates[machine.machineId] = state
          }
        })

        return machineStates
      }
    },
    staleTime: 5000, // 5 seconds
    cacheTime: 15000, // 15 seconds
    refetchInterval: connectionStatus.isConnected ? 10000 : 60000,
    onError: (error) => {
      audit.logError(error, {
        query: 'machine_states',
        machineId: machineId || 'all_machines'
      })
    }
  })
}

// Hook for OEE data
export const useIoTOEEData = (machineId = null) => {
  const { connectionStatus } = useIoTIntegration()
  const audit = useAuditTrail('IoTOEEData')

  return useQuery({
    queryKey: ['production', 'oee', machineId],
    queryFn: () => {
      audit.logDataAccess('oee_data', {
        source: 'iot_service',
        machineId: machineId || 'all_machines'
      })

      if (machineId) {
        const machineData = iotService.getMachineSensorData(machineId)
        if (!machineData) {
          throw new Error(`OEE data for ${machineId} not found`)
        }
        return {
          machineId,
          ...machineData.oee,
          timestamp: machineData.timestamp
        }
      } else {
        // Get OEE for all machines
        const allSensorData = iotService.getAllSensorData()
        return allSensorData.map(machine => ({
          machineId: machine.machineId,
          ...machine.oee,
          timestamp: machine.timestamp
        }))
      }
    },
    staleTime: 10000, // 10 seconds
    cacheTime: 30000, // 30 seconds
    refetchInterval: connectionStatus.isConnected ? 15000 : 120000,
    onError: (error) => {
      audit.logError(error, {
        query: 'oee_data',
        machineId: machineId || 'all_machines'
      })
    }
  })
}

// Hook for real-time alarms
export const useIoTAlarms = (machineId = null) => {
  const { alarms, acknowledgeAlarm } = useIoTIntegration()
  const audit = useAuditTrail('IoTAlarms')

  // Filter alarms by machine if specified
  const filteredAlarms = machineId
    ? alarms.filter(alarm => alarm.machineId === machineId)
    : alarms

  // Group alarms by severity
  const alarmsByServerty = {
    critical: filteredAlarms.filter(a => a.severity === 'critical'),
    high: filteredAlarms.filter(a => a.severity === 'high'),
    medium: filteredAlarms.filter(a => a.severity === 'medium'),
    low: filteredAlarms.filter(a => a.severity === 'low')
  }

  // Get unacknowledged alarms
  const unacknowledgedAlarms = filteredAlarms.filter(a => !a.acknowledged)

  return {
    allAlarms: filteredAlarms,
    alarmsBySeverity: alarmsByServerty,
    unacknowledgedAlarms,
    acknowledgeAlarm: (alarmMachineId, alarmId) => {
      audit.trackAction('iot_alarm_acknowledge_attempt', {
        machineId: alarmMachineId,
        alarmId
      })
      return acknowledgeAlarm(alarmMachineId, alarmId)
    },
    criticalCount: alarmsByServerty.critical.length,
    totalCount: filteredAlarms.length
  }
}

// Hook for production metrics derived from IoT data
export const useIoTProductionMetrics = () => {
  const sensorQuery = useIoTSensorData()
  const oeeQuery = useIoTOEEData()
  const machineStatesQuery = useIoTMachineStates()
  const { alarms } = useIoTAlarms()
  const audit = useAuditTrail('IoTProductionMetrics')

  const metrics = {
    isLoading: sensorQuery.isLoading || oeeQuery.isLoading || machineStatesQuery.isLoading,
    isError: sensorQuery.isError || oeeQuery.isError || machineStatesQuery.isError,
    error: sensorQuery.error || oeeQuery.error || machineStatesQuery.error,
    lastUpdated: new Date().toISOString()
  }

  if (!metrics.isLoading && !metrics.isError) {
    const sensorData = sensorQuery.data || []
    const oeeData = oeeQuery.data || []
    const machineStates = machineStatesQuery.data || {}

    // Calculate overall metrics
    const totalMachines = sensorData.length
    const onlineMachines = sensorData.filter(m => m.status === 'online').length
    const runningMachines = Object.values(machineStates)
      .filter(state => state.currentState === 'running').length

    // Calculate average OEE
    const avgOEE = oeeData.length > 0
      ? oeeData.reduce((sum, machine) => sum + machine.overall, 0) / oeeData.length
      : 0

    // Calculate total production
    const totalProduction = sensorData.reduce((sum, machine) =>
      sum + (machine.sensors.productionCount?.value || 0), 0)

    // Calculate average quality score
    const avgQuality = sensorData.length > 0
      ? sensorData.reduce((sum, machine) =>
          sum + (machine.sensors.qualityScore?.value || 0), 0) / sensorData.length
      : 0

    // Get active alarms count
    const activeAlarms = alarms.filter(a => !a.acknowledged).length
    const criticalAlarms = alarms.filter(a => !a.acknowledged && a.severity === 'critical').length

    metrics.summary = {
      totalMachines,
      onlineMachines,
      runningMachines,
      avgOEE: Math.round(avgOEE * 100) / 100,
      totalProduction,
      avgQuality: Math.round(avgQuality * 100) / 100,
      activeAlarms,
      criticalAlarms,
      availability: totalMachines > 0 ? (onlineMachines / totalMachines) * 100 : 0,
      utilization: onlineMachines > 0 ? (runningMachines / onlineMachines) * 100 : 0
    }

    metrics.machineData = sensorData
    metrics.oeeData = oeeData
    metrics.machineStates = machineStates
    metrics.alarms = alarms

    // Log metrics calculation
    audit.logPerformance('iot_metrics_calculation',
      Date.now() - new Date(metrics.lastUpdated),
      1000,
      {
        machineCount: totalMachines,
        avgOEE: metrics.summary.avgOEE,
        activeAlarms
      }
    )
  }

  return metrics
}

// Hook for machine control commands
export const useIoTMachineControl = (machineId) => {
  const { sendCommand, connectionStatus } = useIoTIntegration()
  const audit = useAuditTrail('IoTMachineControl')

  const executeCommand = useCallback(async (command, parameters = {}) => {
    if (!connectionStatus.isConnected) {
      throw new Error('IoT system not connected')
    }

    const startTime = performance.now()

    try {
      const success = sendCommand(machineId, command, parameters)
      const duration = performance.now() - startTime

      audit.logPerformance('iot_command_execution', duration, 5000, {
        machineId,
        command,
        success,
        parameterCount: Object.keys(parameters).length
      })

      if (!success) {
        throw new Error(`Failed to send command ${command} to ${machineId}`)
      }

      return { success: true, duration: Math.round(duration) }
    } catch (error) {
      audit.logError(error, {
        action: 'iot_command_execution',
        machineId,
        command
      })
      throw error
    }
  }, [machineId, sendCommand, connectionStatus.isConnected, audit])

  // Common machine commands
  const startMachine = useCallback(() => executeCommand('start'), [executeCommand])
  const stopMachine = useCallback(() => executeCommand('stop'), [executeCommand])
  const pauseMachine = useCallback(() => executeCommand('pause'), [executeCommand])
  const resetMachine = useCallback(() => executeCommand('reset'), [executeCommand])
  const setMaintenanceMode = useCallback((enabled) =>
    executeCommand('maintenance_mode', { enabled }), [executeCommand])

  return {
    executeCommand,
    startMachine,
    stopMachine,
    pauseMachine,
    resetMachine,
    setMaintenanceMode,
    isConnected: connectionStatus.isConnected
  }
}

export default useIoTIntegration