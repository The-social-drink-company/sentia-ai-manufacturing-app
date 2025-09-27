# Production IoT Integration

## Overview

The Production IoT Integration provides real-time connectivity to manufacturing sensors, PLCs, and industrial automation systems. This system enables live monitoring of machine performance, automated data collection, and intelligent production optimization.

## Architecture

### Core Components

#### `iotService.js` - IoT Communication Service
- **WebSocket Integration**: Real-time bi-directional communication with IoT infrastructure
- **MQTT Support**: Message queuing for reliable sensor data transmission
- **PLC Connectivity**: Direct integration with Modbus, OPC-UA, and Ethernet/IP protocols
- **Data Processing**: Real-time sensor data aggregation and machine state management
- **Alarm Management**: Critical event notification and acknowledgment system

#### React Integration Hooks
- **`useIoTIntegration`** - Main IoT system management
- **`useIoTSensorData`** - Real-time sensor data access
- **`useIoTMachineStates`** - Machine operational status
- **`useIoTOEEData`** - Overall Equipment Effectiveness calculations
- **`useIoTAlarms`** - Active alarm monitoring and management
- **`useIoTProductionMetrics`** - Production KPI aggregation
- **`useIoTMachineControl`** - Machine command and control

#### UI Components
- **`IoTStatusDisplay`** - System health and connection monitoring
- **Production Dashboard Integration** - Real-time data indicators

## Supported IoT Protocols

### Industrial Communication
- **Modbus TCP/RTU** - Legacy PLC communication
- **OPC-UA** - Modern industrial automation standard
- **Ethernet/IP** - Allen-Bradley and Rockwell Automation
- **PROFINET** - Siemens industrial Ethernet
- **DNP3** - Distributed Network Protocol

### IoT Standards
- **WebSocket** - Real-time web communication
- **MQTT** - Message Queuing Telemetry Transport
- **HTTP/REST** - RESTful API integration
- **CoAP** - Constrained Application Protocol

### Sensor Types Supported
- **Temperature Sensors** - Thermocouple, RTD, thermistor
- **Pressure Sensors** - Pneumatic, hydraulic, vacuum
- **Vibration Sensors** - Accelerometer, velocity, displacement
- **Flow Sensors** - Ultrasonic, electromagnetic, turbine
- **Power Monitors** - Energy consumption, power quality
- **Production Counters** - Optical, proximity, encoder
- **Quality Sensors** - Vision systems, gauges, scales
- **Safety Sensors** - Emergency stops, light curtains, interlocks

## Configuration

### Environment Variables

```bash
# IoT Infrastructure Endpoints
VITE_IOT_WEBSOCKET_URL=ws://your-iot-gateway:8080/iot
VITE_MQTT_BROKER=mqtt://your-mqtt-broker:1883

# PLC Connection Settings
VITE_PLC_MODBUS_URL=tcp://192.168.1.100:502
VITE_PLC_OPCUA_URL=opc.tcp://192.168.1.100:4840
VITE_PLC_ETHERNET_IP=192.168.1.100:44818

# Security Configuration
VITE_IOT_API_KEY=your-iot-api-key
VITE_IOT_CLIENT_CERT=/path/to/client.crt
VITE_IOT_CLIENT_KEY=/path/to/client.key

# Optional Advanced Settings
VITE_IOT_UPDATE_INTERVAL=1000
VITE_IOT_RECONNECT_INTERVAL=5000
VITE_IOT_MAX_RECONNECT_ATTEMPTS=10
```

### Machine Configuration

The system automatically discovers and configures the following machines:

```javascript
const MACHINE_CONFIGURATION = {
  'CNC_001': {
    type: 'cnc_machine',
    sensors: ['temperature', 'vibration', 'power_consumption', 'production_count'],
    plcAddress: '192.168.1.101',
    protocol: 'modbus',
    targetCycleTime: 120000, // 2 minutes
    criticalTemp: 85, // °C
    maxVibration: 3.5 // mm/s
  },
  'PRESS_001': {
    type: 'hydraulic_press',
    sensors: ['pressure', 'temperature', 'safety_sensor'],
    plcAddress: '192.168.1.102',
    protocol: 'ethernet_ip',
    maxPressure: 200, // bar
    safetyInterlocks: ['light_curtain', 'emergency_stop']
  }
  // ... additional machine configurations
}
```

## Data Flow Architecture

### Real-time Data Pipeline

1. **Sensor Data Collection**
   ```
   Physical Sensors → PLC/IoT Gateway → WebSocket/MQTT → IoT Service → React Components
   ```

2. **Machine State Management**
   ```
   Machine Events → State Processing → OEE Calculation → Dashboard Updates
   ```

3. **Alarm Processing**
   ```
   Critical Events → Alarm Generation → User Notification → Acknowledgment Tracking
   ```

### Data Structures

#### Sensor Data Format
```javascript
{
  machineId: 'CNC_001',
  timestamp: '2025-09-26T12:00:00.000Z',
  status: 'online',
  sensors: {
    temperature: { value: 75.2, unit: '°C', status: 'normal' },
    vibration: { value: 2.1, unit: 'mm/s', status: 'normal' },
    powerConsumption: { value: 12.5, unit: 'kW', status: 'normal' },
    productionCount: { value: 1450, unit: 'pieces', status: 'normal' }
  },
  oee: {
    availability: 92.5,
    performance: 88.3,
    quality: 96.1,
    overall: 80.7
  }
}
```

#### Machine State Format
```javascript
{
  machineId: 'CNC_001',
  currentState: 'running', // 'running', 'idle', 'maintenance', 'stopped', 'error'
  stateStartTime: '2025-09-26T11:45:00.000Z',
  cycleTime: 118000, // milliseconds
  targetCycleTime: 120000,
  productivity: 92.3,
  efficiency: 98.3,
  totalRuntime: 28800000, // 8 hours in milliseconds
  downtime: 1200000 // 20 minutes in milliseconds
}
```

#### Alarm Format
```javascript
{
  id: 'alarm_001',
  machineId: 'CNC_001',
  severity: 'critical', // 'critical', 'high', 'medium', 'low'
  message: 'Temperature exceeded critical threshold (87.3°C)',
  timestamp: '2025-09-26T12:05:30.000Z',
  acknowledged: false,
  resolved: false,
  category: 'temperature_alarm',
  recommendedAction: 'Check coolant system and reduce feed rate'
}
```

## Machine Control Commands

### Available Commands

```javascript
// Basic machine control
iotService.sendMachineCommand('CNC_001', 'start')
iotService.sendMachineCommand('CNC_001', 'stop')
iotService.sendMachineCommand('CNC_001', 'pause')
iotService.sendMachineCommand('CNC_001', 'reset')

// Advanced operations
iotService.sendMachineCommand('CNC_001', 'set_speed', { rpm: 1500 })
iotService.sendMachineCommand('CNC_001', 'set_feed_rate', { rate: 0.2 })
iotService.sendMachineCommand('CNC_001', 'maintenance_mode', { enabled: true })

// Production parameters
iotService.sendMachineCommand('PRESS_001', 'set_pressure', { target: 180 })
iotService.sendMachineCommand('PRESS_001', 'cycle_count_reset')
```

### React Hook Usage

```javascript
function MachineControlPanel({ machineId }) {
  const {
    executeCommand,
    startMachine,
    stopMachine,
    pauseMachine,
    resetMachine,
    isConnected
  } = useIoTMachineControl(machineId)

  const handleStart = async () => {
    try {
      const result = await startMachine()
      console.log(`Machine started in ${result.duration}ms`)
    } catch (error) {
      console.error('Failed to start machine:', error)
    }
  }

  return (
    <div className="machine-controls">
      <button onClick={handleStart} disabled={!isConnected}>
        Start Machine
      </button>
      {/* Additional controls */}
    </div>
  )
}
```

## OEE Calculation

### Overall Equipment Effectiveness Formula

```
OEE = Availability × Performance × Quality

Where:
- Availability = (Operating Time / Planned Production Time) × 100
- Performance = (Ideal Cycle Time × Total Count) / Operating Time × 100
- Quality = (Good Count / Total Count) × 100
```

### Real-time OEE Processing

```javascript
// Automatic OEE calculation from sensor data
const calculateOEE = (machineData) => {
  const availability = calculateAvailability(machineData.uptime, machineData.plannedTime)
  const performance = calculatePerformance(machineData.actualOutput, machineData.targetOutput)
  const quality = calculateQuality(machineData.goodParts, machineData.totalParts)

  return {
    availability,
    performance,
    quality,
    overall: (availability * performance * quality) / 10000
  }
}
```

## Alarm Management

### Alarm Severity Levels

- **Critical** - Immediate attention required, production stopped
- **High** - Potential production impact, monitor closely
- **Medium** - Performance degradation, schedule maintenance
- **Low** - Informational, no immediate action required

### Alarm Categories

```javascript
const ALARM_CATEGORIES = {
  TEMPERATURE: 'temperature_alarm',
  VIBRATION: 'vibration_alarm',
  PRESSURE: 'pressure_alarm',
  QUALITY: 'quality_alarm',
  SAFETY: 'safety_alarm',
  MAINTENANCE: 'maintenance_alarm',
  COMMUNICATION: 'communication_alarm',
  PRODUCTION: 'production_alarm'
}
```

### Alarm Processing Workflow

1. **Detection** - Sensor threshold exceeded
2. **Generation** - Alarm created with metadata
3. **Notification** - Real-time alert to operators
4. **Acknowledgment** - Operator confirms awareness
5. **Resolution** - Root cause addressed
6. **Documentation** - Event logged for analysis

## Performance Monitoring

### System Metrics

- **Connection Health** - WebSocket/MQTT connectivity status
- **Data Latency** - Sensor-to-dashboard response time
- **Message Throughput** - Messages processed per second
- **Error Rate** - Failed communications percentage
- **Machine Availability** - Online/offline status tracking

### Performance Optimization

```javascript
// Batch sensor data updates for efficiency
const batchSensorUpdates = (updates) => {
  const batches = groupBy(updates, 'machineId')

  Object.entries(batches).forEach(([machineId, batch]) => {
    processMultipleSensorUpdates(machineId, batch)
  })
}

// Implement smart caching for frequently accessed data
const sensorDataCache = new Map()
const CACHE_TTL = 5000 // 5 seconds

const getCachedSensorData = (machineId) => {
  const cached = sensorDataCache.get(machineId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}
```

## Security Considerations

### Network Security
- **TLS/SSL Encryption** - All communications encrypted
- **Certificate-based Authentication** - Client certificates for device auth
- **VPN/Firewall** - Network segmentation and access control
- **API Key Management** - Secure key rotation and storage

### Data Security
- **Data Validation** - Input sanitization and validation
- **Access Control** - Role-based permissions for machine control
- **Audit Logging** - Complete activity tracking
- **Data Anonymization** - Sensitive information protection

### Industrial Security
- **ICS/SCADA Protocols** - Industrial-grade security standards
- **Air-Gap Deployment** - Isolated network configurations
- **Redundancy** - Failover and backup systems
- **Emergency Procedures** - Manual override capabilities

## Troubleshooting

### Common Connection Issues

**WebSocket Connection Failed**
```bash
# Check network connectivity
ping your-iot-gateway-ip
telnet your-iot-gateway-ip 8080

# Verify firewall settings
# Check SSL certificates
# Validate authentication credentials
```

**MQTT Broker Unreachable**
```bash
# Test MQTT connectivity
mosquitto_pub -h your-mqtt-broker -t test/topic -m "test message"
mosquitto_sub -h your-mqtt-broker -t "#" -v

# Check broker logs
# Verify topic permissions
# Test authentication
```

**PLC Communication Errors**
```bash
# Test Modbus connectivity
mbpoll -m tcp -a 1 -r 1 -c 10 192.168.1.100

# OPC-UA client test
opcua-client opc.tcp://192.168.1.100:4840

# Network diagnostics
nmap -p 502,4840 192.168.1.100
```

### Data Quality Issues

**Sensor Data Anomalies**
- Check sensor calibration
- Verify electrical connections
- Inspect for electromagnetic interference
- Review environmental conditions

**Missing Data Points**
- Verify sensor power supply
- Check communication cables
- Review PLC program logic
- Monitor network congestion

**Inconsistent Timestamps**
- Synchronize system clocks (NTP)
- Check timezone configurations
- Verify timestamp source
- Review data buffering logic

### Performance Optimization

**High Latency**
- Reduce sensor polling frequency
- Implement data compression
- Optimize network routing
- Use local edge computing

**Memory Usage**
- Implement data archiving
- Reduce cache sizes
- Optimize data structures
- Monitor memory leaks

## Integration Examples

### Basic Sensor Monitoring

```javascript
function SensorMonitor({ machineId }) {
  const { data, isLoading, error } = useIoTSensorData(machineId)

  if (isLoading) return <div>Loading sensor data...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="sensor-grid">
      {Object.entries(data.sensors).map(([type, sensor]) => (
        <div key={type} className="sensor-card">
          <h3>{type}</h3>
          <span className="value">{sensor.value} {sensor.unit}</span>
          <span className={`status status-${sensor.status}`}>
            {sensor.status}
          </span>
        </div>
      ))}
    </div>
  )
}
```

### Real-time OEE Dashboard

```javascript
function OEEDashboard() {
  const { data: oeeData } = useIoTOEEData()

  const averageOEE = oeeData?.reduce((sum, machine) =>
    sum + machine.overall, 0) / oeeData?.length || 0

  return (
    <div className="oee-dashboard">
      <h2>Overall Equipment Effectiveness</h2>
      <div className="oee-summary">
        <div className="metric">
          <label>Average OEE</label>
          <span className="value">{averageOEE.toFixed(1)}%</span>
        </div>
      </div>

      <div className="machine-oee-grid">
        {oeeData?.map(machine => (
          <OEECard key={machine.machineId} data={machine} />
        ))}
      </div>
    </div>
  )
}
```

### Alarm Management Interface

```javascript
function AlarmManager() {
  const { allAlarms, acknowledgeAlarm, criticalCount } = useIoTAlarms()

  return (
    <div className="alarm-manager">
      <div className="alarm-summary">
        <span className="critical-count">
          {criticalCount} Critical Alarms
        </span>
      </div>

      <div className="alarm-list">
        {allAlarms.map(alarm => (
          <div key={alarm.id} className={`alarm-item ${alarm.severity}`}>
            <div className="alarm-details">
              <strong>{alarm.machineId}</strong>
              <p>{alarm.message}</p>
              <span className="timestamp">{alarm.timestamp}</span>
            </div>

            {!alarm.acknowledged && (
              <button
                onClick={() => acknowledgeAlarm(alarm.machineId, alarm.id)}
                className="acknowledge-btn"
              >
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Future Enhancements

### Planned Features
- **Machine Learning Integration** - Predictive maintenance algorithms
- **Edge Computing** - Local data processing and decision making
- **Digital Twin** - Virtual machine models for simulation
- **Advanced Analytics** - Statistical process control and optimization
- **Mobile Application** - Remote monitoring and control

### Integration Opportunities
- **ERP Systems** - SAP, Oracle, Microsoft Dynamics integration
- **MES Platforms** - Manufacturing Execution System connectivity
- **CMMS Integration** - Computerized Maintenance Management Systems
- **Quality Systems** - Statistical Quality Control integration
- **Supply Chain** - Inventory and logistics system connectivity

## Support and Documentation

- **Technical Documentation** - Detailed API and integration guides
- **Training Materials** - Video tutorials and best practices
- **Community Support** - User forums and knowledge sharing
- **Professional Services** - Implementation and customization support
- **24/7 Support** - Critical system monitoring and assistance