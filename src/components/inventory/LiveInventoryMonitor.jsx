import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  TruckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { liveInventoryService } from '../../services/LiveInventoryService.js';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const LiveInventoryMonitor = () => {
  const [inventoryStatus, setInventoryStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Initialize inventory service
  useEffect(() => {
    const initializeInventory = async () => {
      try {
        setLoading(true);
        await liveInventoryService.initialize();
        await fetchInventoryStatus();
        setError(null);
      } catch (err) {
        setError(`Failed to initialize inventory systems: ${err.message}`);
        logError('Inventory initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeInventory();
  }, []);

  // Fetch real-time inventory status
  const fetchInventoryStatus = useCallback(async () => {
    try {
      const status = await liveInventoryService.getRealTimeInventoryStatus();
      setInventoryStatus(status);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(`Failed to fetch inventory status: ${err.message}`);
      logError('Inventory status error:', err);
    }
  }, []);

  // Auto-refresh inventory data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchInventoryStatus();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchInventoryStatus]);

  // Get stock status color
  const getStatusColor = (status) => {
    const colors = {
      normal: 'text-green-600 bg-green-100',
      low_stock: 'text-yellow-600 bg-yellow-100',
      out_of_stock: 'text-red-600 bg-red-100',
      overstock: 'text-blue-600 bg-blue-100'
    };
    return colors[status] || colors.normal;
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[urgency] || colors.low;
  };

  // Filter locations based on selection
  const getFilteredLocations = () => {
    if (!inventoryStatus) return [];
    if (selectedLocation === 'all') return inventoryStatus.locations;
    return inventoryStatus.locations.filter(loc => loc.id === selectedLocation);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="h-6 bg-gray-300 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 rounded mb-4"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-4 bg-gray-300 rounded"></div>
                  ))}
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
          <h3 className="text-lg font-semibold">Inventory System Error</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchInventoryStatus}
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
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CubeIcon className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Live Inventory Monitor</h2>
              <p className="text-green-100 text-sm">
                Real-time stock levels and automated management
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right text-sm">
              <div className="text-green-100">Last Update</div>
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
      {inventoryStatus && (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total SKUs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {inventoryStatus.totalSKUs}
                  </p>
                </div>
                <CubeIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${inventoryStatus.totalValue.toLocaleString()}
                  </p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock Alerts</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {inventoryStatus.lowStockAlerts}
                  </p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">
                    {inventoryStatus.outOfStock}
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Location Filter */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Location:</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Locations</option>
                {inventoryStatus.locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <AnimatePresence>
              {getFilteredLocations().map((location, index) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Location Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <BuildingStorefrontIcon className="w-5 h-5 text-gray-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{location.name}</h3>
                          <p className="text-sm text-gray-600">{location.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Value</p>
                        <p className="font-semibold text-gray-900">
                          ${location.totalValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location Stats */}
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{location.totalSKUs}</p>
                        <p className="text-xs text-gray-600">SKUs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{location.lowStockItems}</p>
                        <p className="text-xs text-gray-600">Low Stock</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{location.outOfStockItems}</p>
                        <p className="text-xs text-gray-600">Out of Stock</p>
                      </div>
                    </div>

                    {/* Top Items */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Top Items by Value</h4>
                      {location.items.slice(0, 3).map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-600">Stock: {item.currentStock.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">${item.totalValue.toLocaleString()}</p>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Reorder Suggestions */}
          {inventoryStatus.reorderSuggestions && inventoryStatus.reorderSuggestions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-orange-50 px-4 py-3 border-b">
                  <div className="flex items-center space-x-3">
                    <ShoppingCartIcon className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">Reorder Suggestions</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {inventoryStatus.reorderSuggestions.slice(0, 5).map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{suggestion.sku}</p>
                          <p className="text-xs text-gray-600">
                            Current: {suggestion.currentStock} | Suggested: {suggestion.suggestedQuantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(suggestion.urgency)}`}>
                            {suggestion.urgency}
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            ${suggestion.estimatedCost.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-blue-50 px-4 py-3 border-b">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Mock recent activities */}
                    {[
                      { type: 'in', sku: 'GABA_RED_500', quantity: 1000, time: '2 min ago' },
                      { type: 'out', sku: 'WHEY_VANILLA', quantity: 50, time: '15 min ago' },
                      { type: 'in', sku: 'OMEGA3_LIQUID', quantity: 250, time: '1 hour ago' },
                      { type: 'out', sku: 'CAPSULE_SHELLS', quantity: 5000, time: '2 hours ago' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                        <div className={`w-2 h-2 rounded-full ${activity.type === 'in' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.type === 'in' ? '+' : '-'}{activity.quantity} {activity.sku}
                          </p>
                          <p className="text-xs text-gray-600">{activity.time}</p>
                        </div>
                        <ArrowPathIcon className={`w-4 h-4 ${activity.type === 'in' ? 'text-green-500' : 'text-red-500'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveInventoryMonitor;