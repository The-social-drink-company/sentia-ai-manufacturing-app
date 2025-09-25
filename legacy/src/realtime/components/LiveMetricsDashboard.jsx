import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChartBarIcon,
  BoltIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SignalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useRealtime } from '../RealtimeProvider';
import { useTheme } from '../../theming';
import { LineChart, BarChart, DoughnutChart } from '../../charts';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


export const LiveMetricsDashboard = ({
  className = '',
  refreshInterval = 1000, // 1 second
  maxDataPoints = 50,
  showConnectionStatus = true,
  ...props
}) => {
  const { 
    subscribe, 
    unsubscribe, 
    getLatestData, 
    isConnected, 
    getConnectionHealth,
    STREAM_TYPES 
  } = useRealtime();
  const { resolvedTheme } = useTheme();
  
  const [liveMetrics, setLiveMetrics] = useState({
    production: [],
    quality: [],
    equipment: [],
    energy: []
  });
  const [currentValues, setCurrentValues] = useState({});
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Handle production metrics updates
  const handleProductionData = useCallback((data) => {
    const timestamp = Date.now();

    if (!data.unitsPerHour || !data.efficiency) {
      throw new Error('Real API connection required - Production metrics must include unitsPerHour and efficiency from IoT sensors');
    }

    setLiveMetrics(prev => ({
      ...prev,
      production: [...prev.production, {
        timestamp,
        value: data.unitsPerHour,
        efficiency: data.efficiency,
        label: new Date(timestamp).toLocaleTimeString()
      }].slice(-maxDataPoints)
    }));

    setCurrentValues(prev => ({
      ...prev,
      production: data
    }));
    setLastUpdate(timestamp);
  }, [maxDataPoints]);

  // Handle quality data updates
  const handleQualityData = useCallback((data) => {
    const timestamp = Date.now();

    if (!data.qualityScore || data.defectRate === undefined) {
      throw new Error('Real API connection required - Quality data must include qualityScore and defectRate from quality control systems');
    }

    setLiveMetrics(prev => ({
      ...prev,
      quality: [...prev.quality, {
        timestamp,
        value: data.qualityScore,
        defectRate: data.defectRate,
        label: new Date(timestamp).toLocaleTimeString()
      }].slice(-maxDataPoints)
    }));

    setCurrentValues(prev => ({
      ...prev,
      quality: data
    }));
    setLastUpdate(timestamp);
  }, [maxDataPoints]);

  // Handle equipment status updates
  const handleEquipmentData = useCallback((data) => {
    const timestamp = Date.now();

    if (!data.temperature || !data.vibration || !data.status) {
      throw new Error('Real API connection required - Equipment data must include temperature, vibration, and status from IoT sensors');
    }

    setLiveMetrics(prev => ({
      ...prev,
      equipment: [...prev.equipment, {
        timestamp,
        temperature: data.temperature,
        vibration: data.vibration,
        status: data.status,
        label: new Date(timestamp).toLocaleTimeString()
      }].slice(-maxDataPoints)
    }));

    setCurrentValues(prev => ({
      ...prev,
      equipment: data
    }));
    setLastUpdate(timestamp);
  }, [maxDataPoints]);

  // Handle energy consumption updates
  const handleEnergyData = useCallback((data) => {
    const timestamp = Date.now();

    if (!data.kwh || data.cost === undefined) {
      throw new Error('Real API connection required - Energy data must include kwh consumption and cost from energy monitoring systems');
    }

    setLiveMetrics(prev => ({
      ...prev,
      energy: [...prev.energy, {
        timestamp,
        consumption: data.kwh,
        cost: data.cost,
        label: new Date(timestamp).toLocaleTimeString()
      }].slice(-maxDataPoints)
    }));

    setCurrentValues(prev => ({
      ...prev,
      energy: data
    }));
    setLastUpdate(timestamp);
  }, [maxDataPoints]);

  // Subscribe to real-time streams
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeFunctions = [
      subscribe(STREAM_TYPES.PRODUCTION_METRICS, handleProductionData),
      subscribe(STREAM_TYPES.QUALITY_DATA, handleQualityData),
      subscribe(STREAM_TYPES.EQUIPMENT_STATUS, handleEquipmentData),
      subscribe(STREAM_TYPES.ENERGY_CONSUMPTION, handleEnergyData)
    ];

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [isConnected, subscribe, handleProductionData, handleQualityData, handleEquipmentData, handleEnergyData]);

  // REMOVED: Fake data simulation - Real IoT sensor data required
  useEffect(() => {
    if (isConnected || !isAutoRefresh) return;

    // Display error message when not connected to real data sources
    logError('CRITICAL ERROR: Real IoT sensor connection required. No fake data simulation allowed.');

    // Show user-friendly error in dashboard
    setCurrentValues({
      error: 'Real-time manufacturing data requires IoT sensor connections. Please configure data sources.',
      connectionStatus: 'disconnected',
      requiredSources: ['Production IoT sensors', 'Quality control systems', 'Equipment monitoring', 'Energy meters']
    });

    return () => {
      // No cleanup needed for error state
    };
  }, [isConnected, isAutoRefresh]);

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const connectionHealth = getConnectionHealth();

  const cardClasses = `
    rounded-lg border shadow-sm
    ${resolvedTheme === 'dark'
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'
    }
  `;

  const textPrimaryClasses = resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const textMutedClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={className} {...props}>
      {/* Connection Status Header */}
      {showConnectionStatus && (
        <div className={`${cardClasses} p-4 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <SignalIcon className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className={`font-semibold ${textPrimaryClasses}`}>
                Live Manufacturing Metrics
              </h3>
              <div className={`
                ml-3 flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${isConnected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }
              `}>
                <div className={`
                  w-2 h-2 rounded-full mr-1
                  ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
                `} />
                {isConnected ? 'Live' : 'Simulated'}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection metrics */}
              <div className="text-xs text-right">
                <div className={textMutedClasses}>
                  Latency: {Math.round(connectionHealth.latency)}ms
                </div>
                <div className={textMutedClasses}>
                  Uptime: {Math.floor(connectionHealth.uptime / 60000)}m
                </div>
              </div>

              {/* Auto-refresh toggle */}
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`
                  p-2 rounded transition-colors
                  ${isAutoRefresh 
                    ? 'text-green-500 bg-green-100 dark:bg-green-900/30' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
                `}
                title={`Auto-refresh ${isAutoRefresh ? 'enabled' : 'disabled'}`}
              >
                <ArrowPathIcon className={`w-4 h-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {lastUpdate && (
            <div className={`mt-2 text-xs ${textMutedClasses}`}>
              Last update: {formatTimeAgo(lastUpdate)}
            </div>
          )}
        </div>
      )}

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Production Metrics */}
        <div className={cardClasses}>
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <CogIcon className="w-5 h-5 mr-2 text-blue-500" />
              <h4 className={`font-medium ${textPrimaryClasses}`}>Production Rate</h4>
            </div>
          </div>
          <div className="p-4">
            {liveMetrics.production.length > 0 ? (
              <>
                <div className="mb-4">
                  <div className={`text-3xl font-bold ${textPrimaryClasses}`}>
                    {liveMetrics.production[liveMetrics.production.length - 1]?.value || 0}
                  </div>
                  <div className={`text-sm ${textMutedClasses}`}>units/hour</div>
                </div>
                <LineChart
                  data={{
                    labels: liveMetrics.production.map(d => d.label),
                    datasets: [{
                      label: 'Production Rate',
                      data: liveMetrics.production.map(d => d.value),
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.1,
                      fill: true
                    }]
                  }}
                  height={200}
                  options={{
                    animation: { duration: 0 }, // Disable animations for real-time
                    scales: {
                      x: { display: false },
                      y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Units/Hour' }
                      }
                    }
                  }}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className={`text-center ${textMutedClasses}`}>
                  <CogIcon className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>Waiting for data...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quality Metrics */}
        <div className={cardClasses}>
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
              <h4 className={`font-medium ${textPrimaryClasses}`}>Quality Score</h4>
            </div>
          </div>
          <div className="p-4">
            {liveMetrics.quality.length > 0 ? (
              <>
                <div className="mb-4">
                  <div className={`text-3xl font-bold ${textPrimaryClasses}`}>
                    {Math.round(liveMetrics.quality[liveMetrics.quality.length - 1]?.value || 0)}%
                  </div>
                  <div className={`text-sm ${textMutedClasses}`}>quality score</div>
                </div>
                <LineChart
                  data={{
                    labels: liveMetrics.quality.map(d => d.label),
                    datasets: [{
                      label: 'Quality Score',
                      data: liveMetrics.quality.map(d => d.value),
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.1,
                      fill: true
                    }]
                  }}
                  height={200}
                  options={{
                    animation: { duration: 0 },
                    scales: {
                      x: { display: false },
                      y: { 
                        min: 90, 
                        max: 100,
                        title: { display: true, text: 'Quality (%)' }
                      }
                    }
                  }}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className={`text-center ${textMutedClasses}`}>
                  <CheckCircleIcon className="w-8 h-8 mx-auto mb-2" />
                  <p>Waiting for data...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Equipment & Energy Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Status */}
        <div className={cardClasses}>
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-orange-500" />
              <h4 className={`font-medium ${textPrimaryClasses}`}>Equipment Monitoring</h4>
            </div>
          </div>
          <div className="p-4">
            {liveMetrics.equipment.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-2xl font-bold ${textPrimaryClasses}`}>
                      {Math.round(liveMetrics.equipment[liveMetrics.equipment.length - 1]?.temperature || 0)}Â°C
                    </div>
                    <div className={`text-sm ${textMutedClasses}`}>Temperature</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${textPrimaryClasses}`}>
                      {Math.round(liveMetrics.equipment[liveMetrics.equipment.length - 1]?.vibration || 0 * 100) / 100}
                    </div>
                    <div className={`text-sm ${textMutedClasses}`}>Vibration</div>
                  </div>
                </div>
                
                <LineChart
                  data={{
                    labels: liveMetrics.equipment.map(d => d.label),
                    datasets: [
                      {
                        label: 'Temperature (Â°C)',
                        data: liveMetrics.equipment.map(d => d.temperature),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        yAxisID: 'y'
                      },
                      {
                        label: 'Vibration',
                        data: liveMetrics.equipment.map(d => d.vibration * 10), // Scale for visibility
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        yAxisID: 'y1'
                      }
                    ]
                  }}
                  height={200}
                  options={{
                    animation: { duration: 0 },
                    scales: {
                      x: { display: false },
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Temperature (Â°C)' }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Vibration (x10)' },
                        grid: { drawOnChartArea: false }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className={`text-center ${textMutedClasses}`}>
                  <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
                  <p>Waiting for data...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Energy Consumption */}
        <div className={cardClasses}>
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <BoltIcon className="w-5 h-5 mr-2 text-yellow-500" />
              <h4 className={`font-medium ${textPrimaryClasses}`}>Energy Consumption</h4>
            </div>
          </div>
          <div className="p-4">
            {liveMetrics.energy.length > 0 ? (
              <>
                <div className="mb-4">
                  <div className={`text-3xl font-bold ${textPrimaryClasses}`}>
                    {Math.round(liveMetrics.energy[liveMetrics.energy.length - 1]?.consumption || 0)}
                  </div>
                  <div className={`text-sm ${textMutedClasses}`}>kWh</div>
                </div>
                <BarChart
                  data={{
                    labels: liveMetrics.energy.slice(-10).map(d => d.label), // Last 10 points
                    datasets: [{
                      label: 'Energy (kWh)',
                      data: liveMetrics.energy.slice(-10).map(d => d.consumption),
                      backgroundColor: '#eab308',
                      borderColor: '#ca8a04',
                      borderWidth: 1
                    }]
                  }}
                  height={200}
                  options={{
                    animation: { duration: 0 },
                    scales: {
                      x: { display: false },
                      y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'kWh' }
                      }
                    }
                  }}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className={`text-center ${textMutedClasses}`}>
                  <BoltIcon className="w-8 h-8 mx-auto mb-2" />
                  <p>Waiting for data...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMetricsDashboard;
