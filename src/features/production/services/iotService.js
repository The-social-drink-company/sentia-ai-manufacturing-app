/**
 * IoT Sensor Integration Service
 * Provides real-time machine data from IoT sensors and PLC systems
 */

import { auditService } from '../../working-capital/services/auditService'

// IoT Configuration
const IOT_CONFIG = {
  wsEndpoint: process.env.VITE_IOT_WEBSOCKET_URL || 'ws://localhost:8080/iot',
  mqttBroker: process.env.VITE_MQTT_BROKER || 'mqtt://localhost:1883',
  plcEndpoints: {
    modbus: process.env.VITE_PLC_MODBUS_URL || 'tcp://192.168.1.100:502',
    opcua: process.env.VITE_PLC_OPCUA_URL || 'opc.tcp://192.168.1.100:4840',
    ethernetip: process.env.VITE_PLC_ETHERNET_IP || '192.168.1.100:44818'
  },
  sensorTypes: [
    'temperature',
    'pressure',
    'vibration',
    'flow_rate',
    'power_consumption',
    'production_count',
    'quality_sensor',
    'safety_sensor'
  ],
  updateInterval: 1000, // 1 second
  reconnectInterval: 5000, // 5 seconds
  maxReconnectAttempts: 10
}

class IoTSensorService {
  constructor() {
    this.isConnected = false
    this.websocket = null
    this.mqttClient = null
    this.sensorData = new Map()
    this.machineStates = new Map()
    this.listeners = new Set()
    this.reconnectAttempts = 0
    this.connectionStartTime = null
    this.lastDataReceived = null

    // Initialize sensor data structure
    this.initializeSensorData()

    // Start connection attempt
    this.connect()

    // Set up periodic health check
    this.startHealthMonitoring()
  }

  // Initialize sensor data structure
  initializeSensorData() {
    const machines = [
      'CNC_001', 'CNC_002', 'CNC_003',
      'PRESS_001', 'PRESS_002',
      'ASSEMBLY_001', 'ASSEMBLY_002',
      'PACKAGING_001', 'PACKAGING_002',
      'QC_STATION_001', 'QC_STATION_002'
    ]

    machines.forEach(machineId => {
      this.sensorData.set(machineId, {
        machineId,
        timestamp: new Date().toISOString(),
        status: 'offline',
        sensors: {
          temperature: { value: 0, unit: '°C', status: 'normal' },
          pressure: { value: 0, unit: 'bar', status: 'normal' },
          vibration: { value: 0, unit: 'mm/s', status: 'normal' },
          flowRate: { value: 0, unit: 'L/min', status: 'normal' },
          powerConsumption: { value: 0, unit: 'kW', status: 'normal' },
          productionCount: { value: 0, unit: 'pieces', status: 'normal' },
          qualityScore: { value: 0, unit: '%', status: 'normal' },
          safetyStatus: { value: 'safe', unit: '', status: 'normal' }
        },
        oee: {
          availability: 0,
          performance: 0,
          quality: 0,
          overall: 0
        },
        alarms: [],
        lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextMaintenance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      })

      this.machineStates.set(machineId, {
        currentState: 'stopped',
        stateStartTime: new Date().toISOString(),
        cycleTime: 0,
        targetCycleTime: 120, // 2 minutes
        productivity: 0,
        efficiency: 0,
        downtime: 0,
        totalRuntime: 0
      })
    })

    auditService.logEvent('iot_sensor_data_initialized', {
      machineCount: machines.length,
      sensorTypes: IOT_CONFIG.sensorTypes.length
    })
  }

  // Connect to IoT infrastructure
  async connect() {
    try {
      this.connectionStartTime = new Date()
      auditService.logEvent('iot_connection_attempt', {
        attempt: this.reconnectAttempts + 1,
        wsEndpoint: IOT_CONFIG.wsEndpoint
      })

      // Try WebSocket connection first
      await this.connectWebSocket()

      // If successful, also try MQTT connection
      if (this.isConnected) {
        this.connectMQTT()
      }

      this.reconnectAttempts = 0
    } catch (error) {
      auditService.logError(error, { action: 'iot_connection' })
      this.handleConnectionFailure()
    }
  }

  // Connect via WebSocket
  connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(IOT_CONFIG.wsEndpoint)

        this.websocket.onopen = () => {
          this.isConnected = true
          this.lastDataReceived = new Date()

          auditService.logEvent('iot_websocket_connected', {
            endpoint: IOT_CONFIG.wsEndpoint,
            connectionTime: new Date() - this.connectionStartTime
          })

          // Request initial data for all machines
          this.requestInitialData()
          resolve()
        }

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event)
        }

        this.websocket.onclose = () => {
          this.isConnected = false
          auditService.logEvent('iot_websocket_disconnected', {
            wasConnected: this.isConnected,
            lastDataReceived: this.lastDataReceived
          })
          this.handleConnectionFailure()
        }

        this.websocket.onerror = (error) => {
          auditService.logError(error, { action: 'iot_websocket_error' })
          reject(error)
        }

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            this.websocket.close()
            reject(new Error('WebSocket connection timeout'))
          }
        }, 10000)

      } catch (error) {
        reject(error)
      }
    })
  }

  // Connect via MQTT (optional secondary connection)
  connectMQTT() {
    try {
      // Note: In a real implementation, you would use a library like mqtt.js
      // For now, we'll simulate MQTT connection
      console.log('MQTT connection simulated for:', IOT_CONFIG.mqttBroker)

      auditService.logEvent('iot_mqtt_connected', {
        broker: IOT_CONFIG.mqttBroker,
        topics: ['production/+/sensors', 'alarms/+', 'maintenance/+']
      })
    } catch (error) {
      auditService.logError(error, { action: 'iot_mqtt_connection' })
    }
  }

  // Handle WebSocket messages
  handleWebSocketMessage(event) {
    try {
      const data = JSON.parse(event.data)
      this.lastDataReceived = new Date()

      switch (data.type) {
        case 'sensor_data':
          this.processSensorData(data.payload)
          break
        case 'machine_state':
          this.processMachineState(data.payload)
          break
        case 'alarm':
          this.processAlarm(data.payload)
          break
        case 'oee_update':
          this.processOEEUpdate(data.payload)
          break
        default:
          console.warn('Unknown IoT message type:', data.type)
      }

      // Notify all listeners
      this.notifyListeners(data.type, data.payload)

    } catch (error) {
      auditService.logError(error, { action: 'iot_message_processing' })
    }
  }

  // Process incoming sensor data
  processSensorData(payload) {
    const { machineId, sensors, timestamp } = payload

    if (this.sensorData.has(machineId)) {
      const machineData = this.sensorData.get(machineId)

      // Update sensor values
      Object.keys(sensors).forEach(sensorType => {
        if (machineData.sensors[sensorType]) {
          machineData.sensors[sensorType] = {
            ...machineData.sensors[sensorType],
            ...sensors[sensorType]
          }
        }
      })

      machineData.timestamp = timestamp || new Date().toISOString()
      machineData.status = 'online'

      this.sensorData.set(machineId, machineData)

      auditService.logEvent('iot_sensor_data_processed', {
        machineId,
        sensorCount: Object.keys(sensors).length,
        timestamp: machineData.timestamp
      })
    }
  }

  // Process machine state changes
  processMachineState(payload) {
    const { machineId, state, cycleTime, productivity } = payload

    if (this.machineStates.has(machineId)) {
      const previousState = this.machineStates.get(machineId)
      const now = new Date().toISOString()

      // Calculate state duration
      const stateDuration = previousState.stateStartTime
        ? new Date(now) - new Date(previousState.stateStartTime)
        : 0

      const updatedState = {
        ...previousState,
        currentState: state,
        stateStartTime: now,
        cycleTime: cycleTime || previousState.cycleTime,
        productivity: productivity || previousState.productivity,
        efficiency: cycleTime && previousState.targetCycleTime
          ? (previousState.targetCycleTime / cycleTime) * 100
          : previousState.efficiency
      }

      // Update runtime/downtime
      if (previousState.currentState === 'running') {
        updatedState.totalRuntime = (updatedState.totalRuntime || 0) + stateDuration
      } else if (previousState.currentState === 'stopped' || previousState.currentState === 'error') {
        updatedState.downtime = (updatedState.downtime || 0) + stateDuration
      }

      this.machineStates.set(machineId, updatedState)

      auditService.logEvent('iot_machine_state_changed', {
        machineId,
        previousState: previousState.currentState,
        newState: state,
        stateDuration: Math.round(stateDuration / 1000) // seconds
      })
    }
  }

  // Process alarm notifications
  processAlarm(payload) {
    const { machineId, alarmId, severity, message, timestamp } = payload

    if (this.sensorData.has(machineId)) {
      const machineData = this.sensorData.get(machineId)

      const alarm = {
        id: alarmId,
        severity,
        message,
        timestamp: timestamp || new Date().toISOString(),
        acknowledged: false,
        resolved: false
      }

      machineData.alarms.push(alarm)

      // Keep only last 50 alarms per machine
      if (machineData.alarms.length > 50) {
        machineData.alarms = machineData.alarms.slice(-50)
      }

      this.sensorData.set(machineId, machineData)

      auditService.logEvent('iot_alarm_received', {
        machineId,
        alarmId,
        severity,
        message: message.substring(0, 100) // Truncate for logging
      })
    }
  }

  // Process OEE updates
  processOEEUpdate(payload) {
    const { machineId, availability, performance, quality, overall } = payload

    if (this.sensorData.has(machineId)) {
      const machineData = this.sensorData.get(machineId)

      machineData.oee = {
        availability: availability || machineData.oee.availability,
        performance: performance || machineData.oee.performance,
        quality: quality || machineData.oee.quality,
        overall: overall || (availability * performance * quality) / 10000
      }

      this.sensorData.set(machineId, machineData)

      auditService.logEvent('iot_oee_updated', {
        machineId,
        oee: machineData.oee.overall
      })
    }
  }

  // Request initial data from all connected devices
  requestInitialData() {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const request = {
        type: 'request_initial_data',
        payload: {
          machines: Array.from(this.sensorData.keys()),
          timestamp: new Date().toISOString()
        }
      }

      this.websocket.send(JSON.stringify(request))

      auditService.logEvent('iot_initial_data_requested', {
        machineCount: this.sensorData.size
      })
    }
  }

  // Handle connection failures
  handleConnectionFailure() {
    this.isConnected = false

    if (this.reconnectAttempts < IOT_CONFIG.maxReconnectAttempts) {
      this.reconnectAttempts++

      auditService.logEvent('iot_connection_retry_scheduled', {
        attempt: this.reconnectAttempts,
        nextAttemptIn: IOT_CONFIG.reconnectInterval
      })

      setTimeout(() => {
        this.connect()
      }, IOT_CONFIG.reconnectInterval)
    } else {
      auditService.logEvent('iot_connection_failed_permanently', {
        totalAttempts: this.reconnectAttempts,
        fallbackMode: 'mock_data'
      })

      // Start generating mock data
      this.startMockDataGeneration()
    }
  }

  // Start generating mock data when real connection fails
  startMockDataGeneration() {
    setInterval(() => {
      this.generateMockSensorData()
    }, IOT_CONFIG.updateInterval)

    auditService.logEvent('iot_mock_data_generation_started', {
      updateInterval: IOT_CONFIG.updateInterval,
      reason: 'connection_failure'
    })
  }

  // Generate realistic mock sensor data
  generateMockSensorData() {
    this.sensorData.forEach((machineData, machineId) => {
      const now = new Date().toISOString()

      // Update sensor values with realistic variations
      const sensors = machineData.sensors
      sensors.temperature.value = 65 + Math.random() * 20 // 65-85°C
      sensors.pressure.value = 2.5 + Math.random() * 1.5 // 2.5-4.0 bar
      sensors.vibration.value = 1.5 + Math.random() * 2.0 // 1.5-3.5 mm/s
      sensors.flowRate.value = 15 + Math.random() * 10 // 15-25 L/min
      sensors.powerConsumption.value = 5 + Math.random() * 15 // 5-20 kW
      sensors.productionCount.value += Math.random() > 0.7 ? 1 : 0 // Occasional production
      sensors.qualityScore.value = 85 + Math.random() * 15 // 85-100%

      // Update machine status
      const states = ['running', 'idle', 'maintenance', 'stopped']
      if (Math.random() < 0.05) { // 5% chance of state change
        const machineState = this.machineStates.get(machineId)
        const newState = states[Math.floor(Math.random() * states.length)]

        if (newState !== machineState.currentState) {
          this.processMachineState({
            machineId,
            state: newState,
            cycleTime: 100 + Math.random() * 40,
            productivity: 70 + Math.random() * 25
          })
        }
      }

      // Update OEE
      const availability = 75 + Math.random() * 20
      const performance = 80 + Math.random() * 15
      const quality = sensors.qualityScore.value

      machineData.oee = {
        availability,
        performance,
        quality,
        overall: (availability * performance * quality) / 10000
      }

      machineData.timestamp = now
      machineData.status = 'online'

      this.sensorData.set(machineId, machineData)
    })

    // Notify listeners of mock data update
    this.notifyListeners('mock_data_update', {
      timestamp: new Date().toISOString(),
      machineCount: this.sensorData.size
    })
  }

  // Add event listener
  addEventListener(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Notify all listeners
  notifyListeners(eventType, data) {
    this.listeners.forEach(listener => {
      try {
        listener(eventType, data)
      } catch (error) {
        console.warn('Error in IoT event listener:', error)
      }
    })
  }

  // Start health monitoring
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthCheck()
    }, 30000) // Every 30 seconds
  }

  // Perform health check
  performHealthCheck() {
    const now = new Date()
    const timeSinceLastData = this.lastDataReceived
      ? now - new Date(this.lastDataReceived)
      : Infinity

    const isHealthy = this.isConnected && timeSinceLastData < 60000 // 1 minute

    auditService.logEvent('iot_health_check', {
      isConnected: this.isConnected,
      isHealthy,
      timeSinceLastData: Math.round(timeSinceLastData / 1000),
      activeMachines: Array.from(this.sensorData.values()).filter(m => m.status === 'online').length,
      totalMachines: this.sensorData.size
    })

    if (!isHealthy && this.isConnected) {
      console.warn('IoT connection appears unhealthy, attempting reconnection')
      this.handleConnectionFailure()
    }
  }

  // Get all sensor data
  getAllSensorData() {
    return Array.from(this.sensorData.values())
  }

  // Get sensor data for specific machine
  getMachineSensorData(machineId) {
    return this.sensorData.get(machineId)
  }

  // Get machine state
  getMachineState(machineId) {
    return this.machineStates.get(machineId)
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      lastDataReceived: this.lastDataReceived,
      reconnectAttempts: this.reconnectAttempts,
      totalMachines: this.sensorData.size,
      onlineMachines: Array.from(this.sensorData.values()).filter(m => m.status === 'online').length,
      connectionStartTime: this.connectionStartTime
    }
  }

  // Acknowledge alarm
  acknowledgeAlarm(machineId, alarmId) {
    const machineData = this.sensorData.get(machineId)
    if (machineData) {
      const alarm = machineData.alarms.find(a => a.id === alarmId)
      if (alarm) {
        alarm.acknowledged = true
        alarm.acknowledgedAt = new Date().toISOString()

        auditService.logEvent('iot_alarm_acknowledged', {
          machineId,
          alarmId,
          acknowledgedBy: 'current_user'
        })

        // Send acknowledgment to IoT system
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          const message = {
            type: 'acknowledge_alarm',
            payload: { machineId, alarmId, timestamp: new Date().toISOString() }
          }
          this.websocket.send(JSON.stringify(message))
        }

        return true
      }
    }
    return false
  }

  // Send command to machine
  sendMachineCommand(machineId, command, parameters = {}) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'machine_command',
        payload: {
          machineId,
          command,
          parameters,
          timestamp: new Date().toISOString()
        }
      }

      this.websocket.send(JSON.stringify(message))

      auditService.logEvent('iot_machine_command_sent', {
        machineId,
        command,
        parameters: Object.keys(parameters)
      })

      return true
    }
    return false
  }

  // Disconnect from IoT infrastructure
  disconnect() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    this.isConnected = false

    auditService.logEvent('iot_disconnected', {
      reason: 'user_initiated',
      totalRuntime: this.connectionStartTime
        ? new Date() - new Date(this.connectionStartTime)
        : 0
    })
  }
}

// Create singleton instance
const iotService = new IoTSensorService()

export default iotService