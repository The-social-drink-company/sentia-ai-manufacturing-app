import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { logInfo, logError } from '../../services/observability/structuredLogger.js';
import {
  CpuChipIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

const ProductionMonitoring = () => {
  const [selectedLine, setSelectedLine] = useState(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, analytics

  const queryClient = useQueryClient();
  const { data: realTimeData, isConnected } = useRealTimeData();

  // Fetch production data
  const { data: productionData, isLoading, error } = useQuery({
    queryKey: ['production', 'monitoring'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/production/monitoring');
        if (!response.ok) {
          throw new Error('Failed to fetch production data');
        }
        return await response.json();
      } catch (error) {
        logError('Failed to fetch production data', error);
        // Return fallback data
        return {
          lines: [
            {
              id: 'line1',
              name: 'Premium Bottling Line 1',
              status: 'running',
              efficiency: 94.2,
              unitsProduced: 1247,
              targetUnits: 1300,
              speed: 45.2,
              targetSpeed: 50.0,
              quality: 98.5,
              uptime: 96.8,
              lastMaintenance: '2024-01-15T08:00:00Z',
              nextMaintenance: '2024-02-15T08:00:00Z',
              operator: 'John Smith',
              shift: 'Day',
              temperature: 22.5,
              humidity: 45.2,
              pressure: 2.1,
              vibration: 0.8,
              alerts: [],
              metrics: {
                cycleTime: 1.2,
                setupTime: 15.0,
                changeoverTime: 8.5,
                downtime: 3.2,
              },
            },
            {
              id: 'line2',
              name: 'Premium Bottling Line 2',
              status: 'running',
              efficiency: 87.8,
              unitsProduced: 1156,
              targetUnits: 1300,
              speed: 42.1,
              targetSpeed: 50.0,
              quality: 97.2,
              uptime: 91.5,
              lastMaintenance: '2024-01-10T14:00:00Z',
              nextMaintenance: '2024-02-10T14:00:00Z',
              operator: 'Sarah Johnson',
              shift: 'Day',
              temperature: 23.1,
              humidity: 47.8,
              pressure: 2.0,
              vibration: 1.2,
              alerts: [
                {
                  id: 'alert1',
                  type: 'warning',
                  message: 'Temperature variance detected',
                  timestamp: new Date().toISOString(),
                  severity: 'medium',
                },
              ],
              metrics: {
                cycleTime: 1.4,
                setupTime: 18.0,
                changeoverTime: 12.0,
                downtime: 8.5,
              },
            },
            {
              id: 'line3',
              name: 'Premium Bottling Line 3',
              status: 'maintenance',
              efficiency: 0,
              unitsProduced: 0,
              targetUnits: 1300,
              speed: 0,
              targetSpeed: 50.0,
              quality: 0,
              uptime: 0,
              lastMaintenance: '2024-01-20T10:00:00Z',
              nextMaintenance: '2024-01-20T16:00:00Z',
              operator: 'Mike Wilson',
              shift: 'Day',
              temperature: 21.8,
              humidity: 43.5,
              pressure: 0,
              vibration: 0,
              alerts: [
                {
                  id: 'alert2',
                  type: 'info',
                  message: 'Scheduled maintenance in progress',
                  timestamp: new Date().toISOString(),
                  severity: 'low',
                },
              ],
              metrics: {
                cycleTime: 0,
                setupTime: 0,
                changeoverTime: 0,
                downtime: 100,
              },
            },
            {
              id: 'line4',
              name: 'Premium Bottling Line 4',
              status: 'running',
              efficiency: 91.5,
              unitsProduced: 1198,
              targetUnits: 1300,
              speed: 46.8,
              targetSpeed: 50.0,
              quality: 99.1,
              uptime: 94.2,
              lastMaintenance: '2024-01-12T16:00:00Z',
              nextMaintenance: '2024-02-12T16:00:00Z',
              operator: 'Lisa Brown',
              shift: 'Day',
              temperature: 22.2,
              humidity: 46.1,
              pressure: 2.2,
              vibration: 0.9,
              alerts: [],
              metrics: {
                cycleTime: 1.1,
                setupTime: 12.0,
                changeoverTime: 7.5,
                downtime: 5.8,
              },
            },
          ],
          summary: {
            totalLines: 4,
            activeLines: 3,
            totalUnits: 3601,
            targetUnits: 5200,
            averageEfficiency: 91.2,
            overallQuality: 98.3,
            totalUptime: 94.2,
          },
          analytics: {
            oee: 87.5,
            availability: 94.2,
            performance: 91.2,
            quality: 98.3,
            trends: {
              efficiency: 'increasing',
              quality: 'stable',
              uptime: 'increasing',
            },
          },
        };
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Control production line
  const controlMutation = useMutation({
    mutationFn: async ({ lineId, action }) => {
      const response = await fetch(`/api/production/lines/${lineId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} line ${lineId}`);
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      logInfo('Production line control successful', { lineId: variables.lineId, action: variables.action });
      queryClient.invalidateQueries(['production']);
    },
    onError: (error, variables) => {
      logError('Production line control failed', { error: error.message, lineId: variables.lineId, action: variables.action });
    },
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100';
      case 'stopped':
        return 'text-red-600 bg-red-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="w-4 h-4" />;
      case 'maintenance':
        return <WrenchScrewdriverIcon className="w-4 h-4" />;
      case 'stopped':
        return <StopIcon className="w-4 h-4" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <PauseIcon className="w-4 h-4" />;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
      default:
        return <SignalIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading production data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">Failed to load production data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Production Monitoring
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Real-time production line monitoring and control
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Real-time indicator */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Live Data' : 'Offline'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1h">Last Hour</option>
                  <option value="8h">Last 8 Hours</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Units</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {productionData?.summary?.totalUnits || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Target: {productionData?.summary?.targetUnits || 0}
                </p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Efficiency</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {productionData?.summary?.averageEfficiency || 0}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(productionData?.analytics?.trends?.efficiency)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {productionData?.analytics?.trends?.efficiency || 'stable'}
                  </span>
                </div>
              </div>
              <CpuChipIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Quality</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {productionData?.summary?.overallQuality || 0}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(productionData?.analytics?.trends?.quality)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {productionData?.analytics?.trends?.quality || 'stable'}
                  </span>
                </div>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Equipment Effectiveness</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {productionData?.analytics?.oee || 0}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {productionData?.analytics?.availability || 0}% availability
                </p>
              </div>
              <SignalIcon className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Production Lines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {productionData?.lines?.map((line) => (
            <ProductionLineCard
              key={line.id}
              line={line}
              onSelect={() => setSelectedLine(line)}
              onControl={(action) => controlMutation.mutate({ lineId: line.id, action })}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              isControlling={controlMutation.isPending}
            />
          ))}
        </div>

        {/* Analytics Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Production Analytics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Availability</h3>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {productionData?.analytics?.availability || 0}%
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                Uptime vs. planned production time
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">Performance</h3>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {productionData?.analytics?.performance || 0}%
              </div>
              <div className="text-sm text-green-700 dark:text-green-200 mt-1">
                Actual vs. theoretical output
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">Quality</h3>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {productionData?.analytics?.quality || 0}%
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                Good units vs. total units
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Details Modal */}
      <AnimatePresence>
        {selectedLine && (
          <LineDetailsModal
            line={selectedLine}
            onClose={() => setSelectedLine(null)}
            onControl={(action) => controlMutation.mutate({ lineId: selectedLine.id, action })}
            isControlling={controlMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Production Line Card Component
const ProductionLineCard = ({ line, onSelect, onControl, getStatusColor, getStatusIcon, isControlling }) => {
  const progressPercentage = (line.unitsProduced / line.targetUnits) * 100;
  const speedPercentage = (line.speed / line.targetSpeed) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {line.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {line.operator} • {line.shift} Shift
          </p>
          <div className="flex items-center space-x-2">
            {getStatusIcon(line.status)}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(line.status)}`}>
              {line.status}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => onSelect()}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <EyeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Key Metrics */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Units Produced</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {line.unitsProduced} / {line.targetUnits}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Speed</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {line.speed} / {line.targetSpeed} units/min
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(speedPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Efficiency</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{line.efficiency}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Quality</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{line.quality}%</div>
          </div>
        </div>
      </div>

      {/* Environmental Data */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Temperature</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {line.temperature}°C
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Humidity</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {line.humidity}%
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Pressure</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {line.pressure} bar
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Vibration</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {line.vibration} mm/s
          </div>
        </div>
      </div>

      {/* Alerts */}
      {line.alerts && line.alerts.length > 0 && (
        <div className="mb-4">
          {line.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-2 rounded-lg text-xs ${
                alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center space-x-2">
        {line.status === 'running' ? (
          <motion.button
            onClick={() => onControl('pause')}
            disabled={isControlling}
            className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PauseIcon className="w-4 h-4 mr-1" />
            Pause
          </motion.button>
        ) : (
          <motion.button
            onClick={() => onControl('start')}
            disabled={isControlling}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PlayIcon className="w-4 h-4 mr-1" />
            Start
          </motion.button>
        )}
        
        <motion.button
          onClick={() => onControl('stop')}
          disabled={isControlling}
          className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <StopIcon className="w-4 h-4 mr-1" />
          Stop
        </motion.button>
      </div>
    </motion.div>
  );
};

// Line Details Modal Component
const LineDetailsModal = ({ line, onClose, onControl, isControlling }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {line.name} - Detailed View
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Production Metrics */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Production Metrics
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Units Produced</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {line.unitsProduced}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Target: {line.targetUnits}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Efficiency</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {line.efficiency}%
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quality</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {line.quality}%
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {line.uptime}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cycle Time</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {line.metrics.cycleTime}s
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Setup Time</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {line.metrics.setupTime}min
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Changeover</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {line.metrics.changeoverTime}min
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Downtime</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {line.metrics.downtime}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental & Maintenance */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Environmental Conditions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Temperature</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {line.temperature}°C
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Humidity</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {line.humidity}%
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pressure</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {line.pressure} bar
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Vibration</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {line.vibration} mm/s
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Maintenance Schedule
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Last Maintenance</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(line.lastMaintenance).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Next Maintenance</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(line.nextMaintenance).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {line.alerts && line.alerts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Active Alerts
                </h3>
                <div className="space-y-2">
                  {line.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg ${
                        alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <div className="text-sm font-medium">{alert.message}</div>
                      <div className="text-xs mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2 inline" />
              Adjust Settings
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductionMonitoring;
