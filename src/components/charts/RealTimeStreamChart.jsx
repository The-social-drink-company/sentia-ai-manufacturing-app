import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const RealTimeStreamChart = ({
  initialData = [],
  maxDataPoints = 50,
  refreshInterval = 1000,
  title = 'Real-Time Data',
  yAxisLabel = 'Value',
  color = '#3B82F6',
  height = 300,
  showControls = true,
  autoStart = true,
  threshold = null,
  thresholdColor = '#EF4444',
  formatValue = (value) => value?.toFixed(2) || '0.00',
  formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString(),
  onDataUpdate = null,
  dataSource = null, // Function that returns new data point
  alertThreshold = null,
  onAlert = null
}) => {
  const [data, setData] = useState(initialData);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [currentValue, setCurrentValue] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const intervalRef = useRef(null);
  const dataRef = useRef(data);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // REMOVED: No mock data generation - require real data source
  const generateMockData = useCallback(() => {
    throw new Error('Real-time chart requires real data source. Math.random() mock data is not permitted.');
  }, []);

  // Add new data point
  const addDataPoint = useCallback(async () => {
    try {
      let newPoint;
      
      if (dataSource && typeof dataSource === 'function') {
        newPoint = await dataSource();
      } else {
        newPoint = generateMockData();
      }

      if (newPoint) {
        setCurrentValue(newPoint.value);
        
        setData(prevData => {
          const newData = [...prevData, newPoint];
          // Keep only the last maxDataPoints
          if (newData.length > maxDataPoints) {
            return newData.slice(-maxDataPoints);
          }
          return newData;
        });

        // Check for alerts
        if (alertThreshold && newPoint.value > alertThreshold) {
          setAlertCount(prev => prev + 1);
          if (onAlert) {
            onAlert(newPoint);
          }
        }

        // Notify parent component
        if (onDataUpdate) {
          onDataUpdate(newPoint);
        }
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  }, [dataSource, generateMockData, maxDataPoints, alertThreshold, onAlert, onDataUpdate]);

  // Start/stop data streaming
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(addDataPoint, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, addDataPoint, refreshInterval]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetData = () => {
    setData([]);
    setCurrentValue(0);
    setAlertCount(0);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 dark:text-white">
            {formatTime(label)}
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            Value: {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (data.length === 0) return { min: 0, max: 0, avg: 0, latest: 0 };
    
    const values = data.map(d => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      latest: values[values.length - 1] || 0
    };
  }, [data]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-sm text-gray-500">
              Current: <span className="font-medium text-gray-900 dark:text-white">
                {formatValue(currentValue)}
              </span>
            </span>
            {alertThreshold && (
              <span className="text-sm text-gray-500">
                Alerts: <span className="font-medium text-red-600">
                  {alertCount}
                </span>
              </span>
            )}
          </div>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlayPause}
              className={`p-2 rounded-lg transition-colors ${
                isPlaying 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={resetData}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Reset Data"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={formatTime}
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis 
              label={{ 
                value: yAxisLabel, 
                angle: -90, 
                position: 'insideLeft' 
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Threshold line */}
            {threshold && (
              <ReferenceLine 
                y={threshold} 
                stroke={thresholdColor}
                strokeDasharray="5 5"
                label="Threshold"
              />
            )}
            
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={refreshInterval / 2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Min</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {formatValue(stats.min)}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Max</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {formatValue(stats.max)}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {formatValue(stats.avg)}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Latest</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {formatValue(stats.latest)}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center mt-3">
        <div className={`w-2 h-2 rounded-full mr-2 ${
          isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`} />
        <span className="text-xs text-gray-500">
          {isPlaying ? 'Streaming live data' : 'Paused'} • {data.length} data points
        </span>
      </div>
    </div>
  );
};

export default RealTimeStreamChart;