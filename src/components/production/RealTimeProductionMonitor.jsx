import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { productionIntegrationService } from '../../services/ProductionIntegrationService.js';

const RealTimeProductionMonitor = () => {
  const [productionStatus, setProductionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize production integration service
  useEffect(() => {
    const initializeProduction = async () => {
      try {
        setLoading(true);
        await productionIntegrationService.initialize();
        await fetchProductionStatus();
        setError(null);
      } catch (err) {
        setError(`Failed to initialize production systems: ${err.message}`);
        console.error('Production initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeProduction();
  }, []);

  // Fetch real-time production status
  const fetchProductionStatus = useCallback(async () => {
    try {
      const status = await productionIntegrationService.getRealTimeProductionStatus();
      setProductionStatus(status);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(`Failed to fetch production status: ${err.message}`);
      console.error('Production status error:', err);
    }
  }, []);

  // Auto-refresh production data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchProductionStatus();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchProductionStatus]);

  // Get status icon and color
  const getStatusConfig = (status) => {
    const configs = {
      running: { 
        icon: PlayIcon, 
        color: 'text-green-500', 
        bgColor: 'bg-green-100', 
        label: 'Running' 
      },
      idle: { 
        icon: PauseIcon, 
        color: 'text-yellow-500', 
        bgColor: 'bg-yellow-100', 
        label: 'Idle' 
      },
      maintenance: { 
        icon: WrenchScrewdriverIcon, 
        color: 'text-blue-500', 
        bgColor: 'bg-blue-100', 
        label: 'Maintenance' 
      },
      fault: { 
        icon: ExclamationTriangleIcon, 
        color: 'text-red-500', 
        bgColor: 'bg-red-100', 
        label: 'Fault' 
      }
    };
    return configs[status] || configs.idle;
  };

  // Get efficiency color based on percentage
  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="h-6 bg-gray-300 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <ExclamationTriangleIcon className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Production System Error</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchProductionStatus}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Real-Time Production Monitor</h2>
              <p className="text-blue-100 text-sm">
                Live manufacturing operations data
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right text-sm">
              <div className="text-blue-100">Last Update</div>
              <div className="font-medium">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </div>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      {productionStatus && (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Lines</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {productionStatus.totalLines}
                  </p>
                </div>
                <CubeIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Lines</p>
                  <p className="text-2xl font-bold text-green-600">
                    {productionStatus.activeLines}
                  </p>
                </div>
                <PlayIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Output</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {productionStatus.totalOutput.toLocaleString()}
                  </p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Efficiency</p>
                  <p className={`text-2xl font-bold ${getEfficiencyColor(productionStatus.efficiency)}`}>
                    {Math.round(productionStatus.efficiency)}%
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Production Lines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {productionStatus.lines.map((line, index) => {
                const statusConfig = getStatusConfig(line.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Line Header */}
                    <div className={`${statusConfig.bgColor} px-4 py-3`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                          <div>
                            <h3 className="font-semibold text-gray-900">{line.name}</h3>
                            <p className="text-sm text-gray-600">{line.location}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color} bg-white`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Line Details */}
                    <div className="p-4">
                      {/* Current Product */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Current Product</p>
                        <p className="font-medium text-gray-900">{line.currentProduct?.name || null}</p>
                        {line.currentProduct?.batchId && (
                          <p className="text-sm text-gray-500">Batch: {line.currentProduct.batchId}</p>
                        )}
                      </div>

                      {/* Output Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Output Progress</span>
                          <span className="font-medium">
                            {line.currentOutput?.toLocaleString()} / {line.plannedOutput?.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (line.currentOutput / line.plannedOutput) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Efficiency</p>
                          <p className={`text-lg font-bold ${getEfficiencyColor(line.efficiency)}`}>
                            {Math.round(line.efficiency)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Quality</p>
                          <p className="text-lg font-bold text-green-600">
                            {line.quality?.passRate 0}%
                          </p>
                        </div>
                      </div>

                      {/* OEE if available */}
                      {line.oee && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">OEE</span>
                            <span className={`text-lg font-bold ${
                              line.oee.overall >= 85 ? 'text-green-600' :
                              line.oee.overall >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {line.oee.overall}%
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-gray-600">Availability</div>
                              <div className="font-medium">{line.oee.availability}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-600">Performance</div>
                              <div className="font-medium">{line.oee.performance}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-600">Quality</div>
                              <div className="font-medium">{line.oee.quality}%</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Alerts */}
                      {line.alerts && line.alerts.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2 text-amber-600">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {line.alerts.length} Active Alert{line.alerts.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeProductionMonitor;