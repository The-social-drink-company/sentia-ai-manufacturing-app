import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  SignalIcon,
  BellAlertIcon,
  ChartBarIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

const RealTimeMonitoring = () => {
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    const eventSource = new EventSource('/api/monitoring/stream');

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      console.log('SSE connection opened');
    };

    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
      console.log('SSE connection error');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMonitoringData(data);
        setLastUpdate(new Date());
        
        if (data.alerts) {
          setAlerts(data.alerts);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/monitoring/status');
        if (response.ok) {
          const data = await response.json();
          setMonitoringData(data);
        } else {
          setMonitoringData(mockMonitoringData);
        }
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
        setMonitoringData(mockMonitoringData);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      eventSource.close();
    };
  }, []);

  const mockMonitoringData = {
    productionLines: [
      {
        id: 'line-a',
        name: 'GABA Red Production Line A',
        status: 'running',
        efficiency: 94.2,
        currentBatch: 'B2025001',
        temperature: 22.5,
        pressure: 1.85,
        speed: 1250,
        targetSpeed: 1300,
        lastMaintenance: '2025-09-06T10:00:00Z',
        nextMaintenance: '2025-09-15T08:00:00Z',
        operatorCount: 3,
        alertLevel: 'normal'
      },
      {
        id: 'line-b',
        name: 'GABA Clear Production Line B',
        status: 'warning',
        efficiency: 87.8,
        currentBatch: 'B2025002',
        temperature: 24.2,
        pressure: 1.92,
        speed: 1100,
        targetSpeed: 1200,
        lastMaintenance: '2025-09-05T14:00:00Z',
        nextMaintenance: '2025-09-12T09:00:00Z',
        operatorCount: 2,
        alertLevel: 'warning'
      },
      {
        id: 'line-c',
        name: 'Packaging Line C',
        status: 'maintenance',
        efficiency: 0,
        currentBatch: null,
        temperature: 20.1,
        pressure: 0,
        speed: 0,
        targetSpeed: 800,
        lastMaintenance: '2025-09-08T06:00:00Z',
        nextMaintenance: '2025-09-08T16:00:00Z',
        operatorCount: 1,
        alertLevel: 'maintenance'
      }
    ],
    equipment: [
      {
        id: 'mixer-001',
        name: 'Primary Mixer',
        type: 'mixer',
        status: 'operational',
        temperature: 65.2,
        rpm: 150,
        vibration: 0.5,
        efficiency: 96.1,
        lastService: '2025-09-01T00:00:00Z',
        nextService: '2025-09-29T00:00:00Z'
      },
      {
        id: 'bottler-001',
        name: 'Bottling Unit #1',
        type: 'bottler',
        status: 'warning',
        temperature: 18.5,
        rpm: 300,
        vibration: 1.2,
        efficiency: 89.3,
        lastService: '2025-08-28T00:00:00Z',
        nextService: '2025-09-25T00:00:00Z'
      },
      {
        id: 'conveyor-001',
        name: 'Main Conveyor',
        type: 'conveyor',
        status: 'operational',
        temperature: 22.0,
        rpm: 45,
        vibration: 0.3,
        efficiency: 98.7,
        lastService: '2025-09-03T00:00:00Z',
        nextService: '2025-10-03T00:00:00Z'
      }
    ],
    systemMetrics: {
      overallEfficiency: 91.4,
      activeAlerts: 3,
      maintenanceItems: 2,
      powerConsumption: 2847.5,
      waterUsage: 1250.8,
      totalOutput: 15420,
      qualityScore: 97.2,
      uptimePercentage: 94.8
    },
    alerts: [
      {
        id: 'alert-001',
        type: 'warning',
        severity: 'medium',
        title: 'Temperature Variance - Line B',
        message: 'Temperature reading 2.2°C above optimal range',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        equipment: 'line-b',
        acknowledged: false
      },
      {
        id: 'alert-002',
        type: 'maintenance',
        severity: 'high',
        title: 'Scheduled Maintenance Due',
        message: 'Packaging Line C maintenance window started',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        equipment: 'line-c',
        acknowledged: true
      },
      {
        id: 'alert-003',
        type: 'quality',
        severity: 'low',
        title: 'Quality Check Required',
        message: 'Batch B2025001 requires final quality verification',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        equipment: 'line-a',
        acknowledged: false
      }
    ]
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
      case 'operational':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'maintenance':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-blue-500" />;
      case 'stopped':
      case 'error':
        return <StopIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
      case 'operational':
        return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'maintenance':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'stopped':
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'maintenance':
        return <WrenchScrewdriverIcon className="h-4 w-4 text-blue-500" />;
      case 'quality':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default:
        return <BellAlertIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const data = monitoringData || mockMonitoringData;

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Real-Time Monitoring
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Live production line and equipment monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <SignalIcon className={`h-5 w-5 ${
              connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'
            }`} />
            <span className={`text-sm font-medium ${
              connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
            }`}>
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* System Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.systemMetrics.overallEfficiency}%
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.systemMetrics.activeAlerts}
              </p>
            </div>
            <BellAlertIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Output</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.systemMetrics.totalOutput.toLocaleString()}
              </p>
            </div>
            <CogIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.systemMetrics.uptimePercentage}%
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Production Lines Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Production Lines Status
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.productionLines.map((line) => (
              <div key={line.id} className={`border rounded-lg p-4 ${getStatusColor(line.status)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {line.name}
                  </h3>
                  {getStatusIcon(line.status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Efficiency:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.round(line.efficiency)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Speed:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {line.speed}/{line.targetSpeed} RPM
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {line.temperature}°C
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Operators:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {line.operatorCount}
                    </span>
                  </div>
                  
                  {line.currentBatch && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Batch:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {line.currentBatch}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipment Monitoring */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Equipment Status
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.equipment.map((equipment) => (
              <div key={equipment.id} className={`border rounded-lg p-4 ${getStatusColor(equipment.status)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {equipment.name}
                  </h3>
                  {getStatusIcon(equipment.status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Efficiency:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.round(equipment.efficiency)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {equipment.temperature}°C
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">RPM:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {equipment.rpm}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Vibration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {equipment.vibration}mm/s
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Next Service:</span>
                    <span className="font-medium text-gray-900 dark:text-white text-xs">
                      {formatTimestamp(equipment.nextService)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Active Alerts
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                alert.acknowledged 
                  ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-center space-x-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {alert.message}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {formatTimestamp(alert.timestamp)}
                  </div>
                  <div className={`text-xs font-medium ${
                    alert.severity === 'high' ? 'text-red-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitoring;