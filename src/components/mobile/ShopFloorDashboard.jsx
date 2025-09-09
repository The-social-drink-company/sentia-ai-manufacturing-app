import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BellAlertIcon,
  PhoneIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  BeakerIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { shopFloorService } from '../../services/ShopFloorService.js';

const ShopFloorDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);

  // Initialize shop floor service
  useEffect(() => {
    const initializeShopFloor = async () => {
      try {
        setLoading(true);
        await shopFloorService.initialize();
        await fetchDashboardData();
        setError(null);
      } catch (err) {
        setError(`Failed to initialize shop floor systems: ${err.message}`);
        console.error('Shop floor initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeShopFloor();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await shopFloorService.getMobileDashboardOverview();
      setDashboardData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(`Failed to fetch dashboard data: ${err.message}`);
      console.error('Dashboard data error:', err);
    }
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Handle operator actions
  const handleOperatorAction = async (action) => {
    try {
      await shopFloorService.recordOperatorAction(action);
      await fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to record operator action:', error);
    }
  };

  // Get status color for stations
  const getStatusColor = (status) => {
    const colors = {
      running: 'bg-green-500 text-white',
      idle: 'bg-yellow-500 text-white',
      maintenance: 'bg-blue-500 text-white',
      fault: 'bg-red-500 text-white',
      active: 'bg-purple-500 text-white'
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  // Get alert severity color
  const getAlertColor = (severity) => {
    const colors = {
      high: 'bg-red-100 border-red-300 text-red-800',
      medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      low: 'bg-blue-100 border-blue-300 text-blue-800'
    };
    return colors[severity] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Loading Shop Floor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <ExclamationTriangleIcon className="w-8 h-8" />
            <h3 className="text-lg font-semibold">System Error</h3>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Shop Floor</h1>
            <p className="text-blue-100 text-sm">
              Shift {dashboardData?.shift?.number} • {dashboardData?.shift?.supervisor}
            </p>
          </div>
          <div className="text-right text-sm">
            <div className="text-blue-100">Updated</div>
            <div className="font-medium">
              {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--'}
            </div>
          </div>
        </div>
      </div>

      {dashboardData && (
        <div className="p-4 space-y-6">
          {/* Shift Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Shift Overview</h2>
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {dashboardData.shift?.duration}h
                </div>
                <div className="text-sm text-gray-600">Hours Worked</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData.shift?.timeRemaining}h
                </div>
                <div className="text-sm text-gray-600">Time Left</div>
              </div>
            </div>
          </div>

          {/* Production Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Production</h2>
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Target Progress</span>
                <span className="font-semibold text-gray-900">
                  {dashboardData.production?.totalProduced} / {dashboardData.production?.target}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, dashboardData.production?.completionRate || 0)}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {Math.round(dashboardData.production?.efficiency || 0)}%
                  </div>
                  <div className="text-xs text-gray-600">Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {Math.round(dashboardData.production?.qualityRate || 0)}%
                  </div>
                  <div className="text-xs text-gray-600">Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">
                    {dashboardData.production?.activeLines || 0}
                  </div>
                  <div className="text-xs text-gray-600">Active Lines</div>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          {dashboardData.alerts && dashboardData.alerts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
                <BellAlertIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-3">
                {dashboardData.alerts.slice(0, 3).map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 ${getAlertColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {alert.station} • {alert.timeAgo}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleOperatorAction({
                            type: 'acknowledge_alert',
                            alertId: alert.id,
                            operator: 'Current User'
                          })}
                          className="ml-3 px-3 py-1 bg-white bg-opacity-50 rounded text-xs font-medium"
                        >
                          ACK
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Work Orders */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Work Orders</h2>
              <ClipboardDocumentListIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="space-y-3">
              {dashboardData.workOrders?.slice(0, 3).map((wo, index) => (
                <motion.div
                  key={wo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">{wo.id}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      wo.priority === 'high' ? 'bg-red-100 text-red-800' :
                      wo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {wo.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{wo.product}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>{wo.completed} / {wo.quantity}</span>
                    <span>{wo.timeLeft}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        wo.completionRate >= 80 ? 'bg-green-500' :
                        wo.completionRate >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${wo.completionRate}%` }}
                    ></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Station Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Stations</h2>
              <CogIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {dashboardData.stationStatus?.map((station, index) => (
                <motion.button
                  key={station.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedStation(station)}
                  className={`p-4 rounded-lg text-left transition-all ${getStatusColor(station.status)}`}
                >
                  <div className="font-medium text-sm mb-1">{station.name}</div>
                  <div className="text-xs opacity-90 mb-2">{station.operator}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">{station.status}</span>
                    {station.efficiency > 0 && (
                      <span className="text-xs font-medium">
                        {Math.round(station.efficiency)}%
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleOperatorAction({
                  type: 'quality_check',
                  operator: 'Current User',
                  station: 'Mobile',
                  description: 'Quality check initiated from mobile'
                })}
                className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <BeakerIcon className="w-6 h-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-900">Quality Check</span>
              </button>
              
              <button
                onClick={() => handleOperatorAction({
                  type: 'material_request',
                  operator: 'Current User',
                  station: 'Mobile',
                  description: 'Material request from mobile'
                })}
                className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <TruckIcon className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-orange-900">Request Material</span>
              </button>
              
              <button
                onClick={() => handleOperatorAction({
                  type: 'maintenance_call',
                  operator: 'Current User',
                  station: 'Mobile',
                  description: 'Maintenance call from mobile'
                })}
                className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-900">Maintenance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Station Detail Modal */}
      <AnimatePresence>
        {selectedStation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20"
            onClick={() => setSelectedStation(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedStation.name}
                </h3>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XCircleIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedStation.status)}`}>
                    {selectedStation.status}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Operator</div>
                  <div className="font-medium text-gray-900">{selectedStation.operator}</div>
                </div>
                
                {selectedStation.currentProduct && (
                  <div>
                    <div className="text-sm text-gray-600">Current Product</div>
                    <div className="font-medium text-gray-900">{selectedStation.currentProduct}</div>
                  </div>
                )}
                
                {selectedStation.efficiency > 0 && (
                  <div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                    <div className="font-medium text-gray-900">{Math.round(selectedStation.efficiency)}%</div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopFloorDashboard;