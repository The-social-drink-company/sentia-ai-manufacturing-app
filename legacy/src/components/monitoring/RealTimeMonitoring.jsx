import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { logInfo, logError } from '../../services/observability/structuredLogger.js';
import {
  SignalIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

const RealTimeMonitoring = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({});
  
  const {
    isConnected,
    connectionStatus,
    data,
    getData,
    sendMessage,
    getConnectionStatusInfo,
    lastUpdate,
  } = useRealTimeData();

  const connectionInfo = getConnectionStatusInfo();

  // Views configuration
  const views = [
    {
      id: 'overview',
      name: 'Overview',
      icon: ChartBarIcon,
      description: 'System-wide monitoring dashboard',
    },
    {
      id: 'production',
      name: 'Production Lines',
      icon: CpuChipIcon,
      description: 'Real-time production monitoring',
    },
    {
      id: 'quality',
      name: 'Quality Control',
      icon: ExclamationTriangleIcon,
      description: 'Quality metrics and alerts',
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: SignalIcon,
      description: 'Stock levels and movements',
    },
  ];

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        // Simulate production data
        const productionData = {
          lines: [
            { id: 'line1', status: 'running', efficiency: 94.2, units: 1247 },
            { id: 'line2', status: 'running', efficiency: 87.8, units: 1156 },
            { id: 'line3', status: 'maintenance', efficiency: 0, units: 0 },
            { id: 'line4', status: 'running', efficiency: 91.5, units: 1198 },
          ],
          totalUnits: 3601,
          averageEfficiency: 91.2,
        };

        // Simulate quality data
        const qualityData = {
          passRate: 96.8,
          defectRate: 0.8,
          inspections: 1247,
          alerts: [
            {
              id: 'q1',
              type: 'warning',
              message: 'Temperature variance detected on Line 2',
              timestamp: new Date().toISOString(),
              severity: 'medium',
            },
          ],
        };

        // Simulate inventory data
        const inventoryData = {
          totalItems: 2847,
          lowStock: 23,
          criticalStock: 5,
          movements: [
            { sku: 'SKU-001', action: 'in', quantity: 500, timestamp: new Date().toISOString() },
            { sku: 'SKU-002', action: 'out', quantity: 250, timestamp: new Date().toISOString() },
          ],
        };

        // Update metrics
        setMetrics({
          production: productionData,
          quality: qualityData,
          inventory: inventoryData,
          lastUpdate: new Date().toISOString(),
        });

        // Send data via real-time connection
        sendMessage('production_update', productionData);
        sendMessage('quality_update', qualityData);
        sendMessage('inventory_update', inventoryData);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isConnected, sendMessage]);

  // Handle alerts
  useEffect(() => {
    if (metrics.quality?.alerts) {
      setAlerts(prevAlerts => [
        ...metrics.quality.alerts,
        ...prevAlerts.filter(alert => 
          !metrics.quality.alerts.some(newAlert => newAlert.id === alert.id)
        )
      ]);
    }
  }, [metrics.quality?.alerts]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100';
      case 'stopped':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const selectedViewConfig = views.find(v => v.id === selectedView);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Real-Time Monitoring
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Live manufacturing operations dashboard
              </p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                connectionInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                connectionInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                <span className="text-lg">{connectionInfo.icon}</span>
                <span className="text-sm font-medium">{connectionInfo.message}</span>
              </div>
              
              {lastUpdate && (
                <div className="flex items-center space-x-2 text-gray-500 text-sm">
                  <ClockIcon className="w-4 h-4" />
                  <span>Updated {new Date(lastUpdate).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {views.map((view) => {
            const Icon = view.icon;
            const isSelected = selectedView === view.id;
            
            return (
              <motion.button
                key={view.id}
                onClick={() => setSelectedView(view.id)}
                className={`text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className={`w-5 h-5 ${
                    isSelected ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <span className={`font-medium ${
                    isSelected ? 'text-blue-900' : 'text-gray-900 dark:text-white'
                  }`}>
                    {view.name}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {view.description}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Monitoring Panel */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                {selectedView === 'overview' && <OverviewPanel metrics={metrics} />}
                {selectedView === 'production' && <ProductionPanel metrics={metrics} />}
                {selectedView === 'quality' && <QualityPanel metrics={metrics} />}
                {selectedView === 'inventory' && <InventoryPanel metrics={metrics} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Connection</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isConnected ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Data Stream</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {isConnected ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Update</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active Alerts
              </h3>
              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <button className="ml-2 text-gray-400 hover:text-gray-600">
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <CheckCircleIcon className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">No active alerts</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <motion.button
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>View Detailed Logs</span>
                </motion.button>
                <motion.button
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                  <span>Adjust Settings</span>
                </motion.button>
                <motion.button
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Export Data</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Panel Component
const OverviewPanel = ({ metrics }) => {
  const production = metrics.production || {};
  const quality = metrics.quality || {};
  const inventory = metrics.inventory || {};

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        System Overview
      </h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Production Efficiency</h3>
            <CpuChipIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {production.averageEfficiency || 0}%
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-200">
            {production.totalUnits || 0} units produced
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Quality Pass Rate</h3>
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {quality.passRate || 0}%
          </div>
          <div className="text-sm text-green-700 dark:text-green-200">
            {quality.inspections || 0} inspections
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">Inventory Status</h3>
            <SignalIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {inventory.totalItems || 0}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-200">
            {inventory.lowStock || 0} low stock items
          </div>
        </div>
      </div>

      {/* Production Lines Status */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Production Lines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {production.lines?.map((line, index) => (
            <div key={line.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{line.id.toUpperCase()}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(line.status)}`}>
                  {line.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Efficiency</span>
                <span className="font-semibold text-gray-900 dark:text-white">{line.efficiency}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Units</span>
                <span className="font-semibold text-gray-900 dark:text-white">{line.units}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Production Panel Component
const ProductionPanel = ({ metrics }) => {
  const production = metrics.production || {};

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Production Lines Monitoring
      </h2>
      
      <div className="space-y-4">
        {production.lines?.map((line, index) => (
          <div key={line.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{line.id.toUpperCase()}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Production Line</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(line.status)}`}>
                {line.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Efficiency</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${line.efficiency}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {line.efficiency}%
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Units Produced</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{line.units}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quality Panel Component
const QualityPanel = ({ metrics }) => {
  const quality = metrics.quality || {};

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Quality Control Monitoring
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">Pass Rate</h3>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100">
            {quality.passRate || 0}%
          </div>
          <div className="text-sm text-green-700 dark:text-green-200 mt-1">
            {quality.inspections || 0} total inspections
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Defect Rate</h3>
          <div className="text-3xl font-bold text-red-900 dark:text-red-100">
            {quality.defectRate || 0}%
          </div>
          <div className="text-sm text-red-700 dark:text-red-200 mt-1">
            Below target threshold
          </div>
        </div>
      </div>

      {/* Quality Trends */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quality Trends</h3>
        <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <ChartBarIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Quality trend visualization</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inventory Panel Component
const InventoryPanel = ({ metrics }) => {
  const inventory = metrics.inventory || {};

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Inventory Monitoring
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Total Items</h3>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {inventory.totalItems || 0}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-200 mt-1">
            Active SKUs
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Low Stock</h3>
          <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
            {inventory.lowStock || 0}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
            Items need attention
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Critical Stock</h3>
          <div className="text-3xl font-bold text-red-900 dark:text-red-100">
            {inventory.criticalStock || 0}
          </div>
          <div className="text-sm text-red-700 dark:text-red-200 mt-1">
            Immediate action required
          </div>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Movements</h3>
        <div className="space-y-3">
          {inventory.movements?.map((movement, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className={`w-2 h-2 rounded-full ${
                  movement.action === 'in' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-medium text-gray-900 dark:text-white">{movement.sku}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${
                  movement.action === 'in' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movement.action === 'in' ? '+' : '-'}{movement.quantity}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(movement.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'running':
      return 'text-green-600 bg-green-100';
    case 'maintenance':
      return 'text-yellow-600 bg-yellow-100';
    case 'stopped':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export default RealTimeMonitoring;
