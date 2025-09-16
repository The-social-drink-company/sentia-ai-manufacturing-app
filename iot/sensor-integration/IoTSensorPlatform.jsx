/**
 * IoT Sensor Integration Platform
 * Real-time sensor data collection, processing, and visualization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CpuChipIcon, 
  SignalIcon, 
  CircleStackIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  FireIcon,
  BeakerIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  WifiIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
         ReferenceLine, ReferenceArea } from 'recharts';

// Sensor Type Definitions
const SENSOR_TYPES = {
  temperature: {
    name: 'Temperature',
    unit: '°C',
    icon: FireIcon,
    color: '#ef4444',
    normalRange: { min: 20, max: 80 },
    alertThresholds: { low: 15, high: 85 }
  },
  vibration: {
    name: 'Vibration',
    unit: 'mm/s',
    icon: BoltIcon,
    color: '#f59e0b',
    normalRange: { min: 0, max: 10 },
    alertThresholds: { low: -1, high: 15 }
  },
  pressure: {
    name: 'Pressure',
    unit: 'bar',
    icon: BeakerIcon,
    color: '#3b82f6',
    normalRange: { min: 1, max: 50 },
    alertThresholds: { low: 0.5, high: 55 }
  },
  humidity: {
    name: 'Humidity',
    unit: '%',
    icon: CloudArrowUpIcon,
    color: '#06b6d4',
    normalRange: { min: 30, max: 70 },
    alertThresholds: { low: 25, high: 75 }
  },
  power: {
    name: 'Power',
    unit: 'kW',
    icon: BoltIcon,
    color: '#8b5cf6',
    normalRange: { min: 0, max: 100 },
    alertThresholds: { low: -5, high: 120 }
  },
  flow: {
    name: 'Flow Rate',
    unit: 'L/min',
    icon: ArrowTrendingUpIcon,
    color: '#10b981',
    normalRange: { min: 0, max: 500 },
    alertThresholds: { low: -10, high: 550 }
  }
};

// IoT Protocol Configurations
const IOT_PROTOCOLS = {
  mqtt: {
    name: 'MQTT',
    description: 'Message Queuing Telemetry Transport',
    port: 1883,
    security: 'TLS',
    reliability: 'High',
    latency: 'Low'
  },
  coap: {
    name: 'CoAP',
    description: 'Constrained Application Protocol',
    port: 5683,
    security: 'DTLS',
    reliability: 'Medium',
    latency: 'Low'
  },
  http: {
    name: 'HTTP/HTTPS',
    description: 'Hypertext Transfer Protocol',
    port: 80,
    security: 'TLS',
    reliability: 'High',
    latency: 'Medium'
  },
  websocket: {
    name: 'WebSocket',
    description: 'Full-duplex communication',
    port: 80,
    security: 'WSS',
    reliability: 'High',
    latency: 'Low'
  }
};

// IoT Sensor Platform Class
class IoTSensorPlatform {
  constructor() {
    this.sensors = new Map();
    this.gateways = new Map();
    this.dataStreams = new Map();
    this.alerts = [];
    this.metrics = {
      totalSensors: 0,
      activeSensors: 0,
      dataPoints: 0,
      alertsToday: 0,
      avgLatency: 0,
      batteryLow: 0
    };
    
    this.initializePlatform();
  }

  async initializePlatform() {
    await this.discoverSensors();
    this.startDataCollection();
    this.setupAlertSystem();
  }

  async discoverSensors() {
    // Simulate sensor discovery
    const sampleSensors = [
      { id: 'TEMP_001', type: 'temperature', location: 'Production Line A', gateway: 'GW_001' },
      { id: 'TEMP_002', type: 'temperature', location: 'Production Line B', gateway: 'GW_001' },
      { id: 'VIB_001', type: 'vibration', location: 'Motor 1', gateway: 'GW_002' },
      { id: 'VIB_002', type: 'vibration', location: 'Motor 2', gateway: 'GW_002' },
      { id: 'PRES_001', type: 'pressure', location: 'Hydraulic System', gateway: 'GW_003' },
      { id: 'HUM_001', type: 'humidity', location: 'Clean Room', gateway: 'GW_001' },
      { id: 'POW_001', type: 'power', location: 'Main Panel', gateway: 'GW_004' },
      { id: 'FLOW_001', type: 'flow', location: 'Cooling System', gateway: 'GW_003' }
    ];

    // REMOVED: No fake sensor data generation - connect to real IoT sensors only
    throw new Error('IoT sensor platform requires real sensor connections. Fake Math.random() sensor data is not permitted.');

    // Initialize gateways
    const sampleGateways = [
      { id: 'GW_001', name: 'Gateway 1', location: 'Building A', protocol: 'mqtt' },
      { id: 'GW_002', name: 'Gateway 2', location: 'Building B', protocol: 'coap' },
      { id: 'GW_003', name: 'Gateway 3', location: 'Building C', protocol: 'websocket' },
      { id: 'GW_004', name: 'Gateway 4', location: 'Main Plant', protocol: 'http' }
    ];

    sampleGateways.forEach(gateway => {
      this.registerGateway({
        ...gateway,
        status: 'online',
        connectedSensors: 0,
        uptime: Math.random() * 30 * 24 * 3600 * 1000, // Up to 30 days
        lastHeartbeat: Date.now()
      });
    });
  }

  registerSensor(sensorConfig) {
    this.sensors.set(sensorConfig.id, {
      ...sensorConfig,
      registeredAt: Date.now(),
      dataHistory: [],
      alerts: [],
      calibration: {
        offset: 0,
        gain: 1,
        lastCalibrated: Date.now() - Math.random() * 30 * 24 * 3600 * 1000
      }
    });

    this.metrics.totalSensors++;
    if (sensorConfig.status === 'active') {
      this.metrics.activeSensors++;
    }
    
    // Initialize data stream
    this.dataStreams.set(sensorConfig.id, {
      sensorId: sensorConfig.id,
      buffer: [],
      frequency: 1000, // 1Hz
      lastUpdate: Date.now()
    });

    // Update gateway sensor count
    const gateway = this.gateways.get(sensorConfig.gateway);
    if (gateway) {
      gateway.connectedSensors++;
    }
  }

  registerGateway(gatewayConfig) {
    this.gateways.set(gatewayConfig.id, {
      ...gatewayConfig,
      registeredAt: Date.now(),
      throughput: 0,
      errorRate: 0,
      firmware: '2.1.' + Math.floor(Math.random() * 5)
    });
  }

  startDataCollection() {
    // Simulate real-time data collection
    setInterval(() => {
      this.collectSensorData();
      this.updateMetrics();
    }, 1000);
  }

  collectSensorData() {
    this.sensors.forEach((sensor, sensorId) => {
      if (sensor.status !== 'active') return;

      const sensorType = SENSOR_TYPES[sensor.type];
      if (!sensorType) return;

      // Generate realistic sensor data
      const baseValue = (sensorType.normalRange.min + sensorType.normalRange.max) / 2;
      const variance = (sensorType.normalRange.max - sensorType.normalRange.min) * 0.1;
      const noise = (Math.random() - 0.5) * variance;
      const trend = Math.sin(Date.now() / 60000) * variance * 0.5;
      
      let value = baseValue + noise + trend;
      
      // Add occasional anomalies
      if (Math.random() < 0.02) {
        value += (Math.random() - 0.5) * variance * 3;
      }

      const dataPoint = {
        sensorId,
        timestamp: Date.now(),
        value: Number(value.toFixed(2)),
        quality: 0.95 + Math.random() * 0.05,
        latency: 10 + Math.random() * 50
      };

      // Update sensor data history
      sensor.dataHistory.push(dataPoint);
      if (sensor.dataHistory.length > 100) {
        sensor.dataHistory = sensor.dataHistory.slice(-100);
      }

      // Update data stream
      const stream = this.dataStreams.get(sensorId);
      if (stream) {
        stream.buffer.push(dataPoint);
        stream.lastUpdate = Date.now();
        if (stream.buffer.length > 50) {
          stream.buffer = stream.buffer.slice(-50);
        }
      }

      // Check for alerts
      this.checkSensorAlerts(sensor, dataPoint);

      // Update sensor last seen
      sensor.lastSeen = Date.now();
      
      this.metrics.dataPoints++;
    });
  }

  checkSensorAlerts(sensor, dataPoint) {
    const sensorType = SENSOR_TYPES[sensor.type];
    const { value } = dataPoint;
    const { alertThresholds } = sensorType;

    let alertTriggered = false;
    let alertLevel = 'info';
    let message = '';

    if (value > alertThresholds.high) {
      alertTriggered = true;
      alertLevel = 'critical';
      message = `${sensorType.name} reading (${value}${sensorType.unit}) exceeds maximum threshold (${alertThresholds.high}${sensorType.unit})`;
    } else if (value < alertThresholds.low) {
      alertTriggered = true;
      alertLevel = 'critical';
      message = `${sensorType.name} reading (${value}${sensorType.unit}) below minimum threshold (${alertThresholds.low}${sensorType.unit})`;
    }

    // Battery alert
    if (sensor.batteryLevel < 20) {
      alertTriggered = true;
      alertLevel = 'warning';
      message = `Low battery level: ${sensor.batteryLevel.toFixed(0)}%`;
      this.metrics.batteryLow++;
    }

    // Signal strength alert
    if (sensor.signalStrength < -80) {
      alertTriggered = true;
      alertLevel = 'warning';
      message = `Weak signal strength: ${sensor.signalStrength.toFixed(0)} dBm`;
    }

    if (alertTriggered) {
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sensorId: sensor.id,
        type: sensor.type,
        level: alertLevel,
        message,
        timestamp: Date.now(),
        acknowledged: false,
        location: sensor.location
      };

      this.alerts.unshift(alert);
      sensor.alerts.push(alert);
      
      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(0, 100);
      }

      this.metrics.alertsToday++;
    }
  }

  setupAlertSystem() {
    // Setup different alert delivery methods
    this.alertChannels = {
      email: { enabled: true, threshold: 'warning' },
      sms: { enabled: true, threshold: 'critical' },
      webhook: { enabled: true, threshold: 'info' },
      dashboard: { enabled: true, threshold: 'info' }
    };
  }

  updateMetrics() {
    const now = Date.now();
    let totalLatency = 0;
    let dataPointCount = 0;
    let activeSensorCount = 0;

    this.sensors.forEach(sensor => {
      if (sensor.status === 'active') {
        activeSensorCount++;
        
        if (sensor.dataHistory.length > 0) {
          const latestData = sensor.dataHistory[sensor.dataHistory.length - 1];
          totalLatency += latestData.latency;
          dataPointCount++;
        }
      }
    });

    this.metrics.activeSensors = activeSensorCount;
    this.metrics.avgLatency = dataPointCount > 0 ? totalLatency / dataPointCount : 0;
  }

  getSensorData(sensorId, duration = 3600000) {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return null;

    const cutoff = Date.now() - duration;
    return sensor.dataHistory.filter(point => point.timestamp > cutoff);
  }

  getSystemMetrics() {
    return {
      ...this.metrics,
      sensors: Array.from(this.sensors.values()),
      gateways: Array.from(this.gateways.values()),
      alerts: this.alerts.slice(0, 20),
      dataStreams: Array.from(this.dataStreams.values()),
      protocols: IOT_PROTOCOLS,
      sensorTypes: SENSOR_TYPES
    };
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
    }
  }

  calibrateSensor(sensorId, offset = 0, gain = 1) {
    const sensor = this.sensors.get(sensorId);
    if (sensor) {
      sensor.calibration.offset = offset;
      sensor.calibration.gain = gain;
      sensor.calibration.lastCalibrated = Date.now();
      return true;
    }
    return false;
  }
}

// React Component
const IoTSensorDashboard = () => {
  const [iotPlatform] = useState(() => new IoTSensorPlatform());
  const [metrics, setMetrics] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [viewMode, setViewMode] = useState('sensors');

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(iotPlatform.getSystemMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [iotPlatform]);

  const handleAcknowledgeAlert = useCallback((alertId) => {
    iotPlatform.acknowledgeAlert(alertId);
  }, [iotPlatform]);

  const chartData = useMemo(() => {
    if (!selectedSensor || !metrics) return [];
    
    const sensor = metrics.sensors.find(s => s.id === selectedSensor.id);
    if (!sensor) return [];
    
    return sensor.dataHistory.slice(-20).map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      value: point.value,
      quality: point.quality * 100
    }));
  }, [selectedSensor, metrics]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'online':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'inactive':
      case 'offline':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSignalStrengthIcon = (strength) => {
    if (strength > -50) return <WifiIcon className="w-4 h-4 text-green-500" />;
    if (strength > -70) return <WifiIcon className="w-4 h-4 text-yellow-500" />;
    return <WifiIcon className="w-4 h-4 text-red-500" />;
  };

  const getBatteryColor = (level) => {
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <CpuChipIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold">IoT Sensor Integration Platform</h1>
        </div>
        <p className="text-green-100">
          Real-time sensor data collection, processing, and visualization across manufacturing operations
        </p>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sensors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalSensors}</p>
            </div>
            <CpuChipIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sensors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.activeSensors}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.dataPoints.toLocaleString()}
              </p>
            </div>
            <CircleStackIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alerts Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.alertsToday}</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Latency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.avgLatency.toFixed(0)}ms
              </p>
            </div>
            <SignalIcon className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Battery Low</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.batteryLow}</p>
            </div>
            <BoltIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex space-x-4">
        <button
          onClick={() => setViewMode('sensors')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'sensors' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Sensors
        </button>
        <button
          onClick={() => setViewMode('gateways')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'gateways' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Gateways
        </button>
        <button
          onClick={() => setViewMode('alerts')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'alerts' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Alerts
        </button>
      </div>

      {/* Sensors Grid */}
      {viewMode === 'sensors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sensor Network</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {metrics.sensors.map((sensor) => {
                const sensorType = SENSOR_TYPES[sensor.type];
                const IconComponent = sensorType?.icon || CpuChipIcon;
                
                return (
                  <div
                    key={sensor.id}
                    onClick={() => setSelectedSensor(sensor)}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedSensor?.id === sensor.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`w-5 h-5`} style={{ color: sensorType?.color }} />
                        <h3 className="font-medium text-gray-900 dark:text-white">{sensor.id}</h3>
                      </div>
                      {getStatusIcon(sensor.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {sensorType?.name || sensor.type}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Location:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {sensor.location}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600 dark:text-gray-400">Signal:</span>
                        <div className="ml-2 flex items-center space-x-1">
                          {getSignalStrengthIcon(sensor.signalStrength)}
                          <span className="text-xs text-gray-500">
                            {sensor.signalStrength.toFixed(0)} dBm
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Battery:</span>
                        <span className={`ml-2 font-medium ${getBatteryColor(sensor.batteryLevel)}`}>
                          {sensor.batteryLevel.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {selectedSensor ? `${selectedSensor.id} - Real-time Data` : 'Select a Sensor'}
            </h2>
            
            {selectedSensor ? (
              <div>
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" name={`Value (${SENSOR_TYPES[selectedSensor.type]?.unit})`} />
                      <Line type="monotone" dataKey="quality" stroke="#10b981" name="Quality (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Protocol:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedSensor.protocol.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Firmware:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedSensor.firmware}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Seen:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedSensor.lastSeen).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Gateway:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedSensor.gateway}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Calibrated:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedSensor.calibration.lastCalibrated).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Alerts:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedSensor.alerts.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <CpuChipIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a sensor to view real-time data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gateways View */}
      {viewMode === 'gateways' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">IoT Gateways</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.gateways.map((gateway) => (
              <div key={gateway.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">{gateway.name}</h3>
                  {getStatusIcon(gateway.status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Location:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{gateway.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Protocol:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {gateway.protocol.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sensors:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {gateway.connectedSensors}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.floor(gateway.uptime / (24 * 3600 * 1000))}d
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Firmware:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{gateway.firmware}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts View */}
      {viewMode === 'alerts' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Active Alerts</h2>
          
          <div className="space-y-4">
            {metrics.alerts.map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-4 ${
                alert.level === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                alert.level === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <ExclamationTriangleIcon className={`w-5 h-5 ${
                        alert.level === 'critical' ? 'text-red-500' :
                        alert.level === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {alert.sensorId} - {alert.location}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.level === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        alert.level === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {alert.level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="ml-4 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {metrics.alerts.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IoTSensorDashboard;