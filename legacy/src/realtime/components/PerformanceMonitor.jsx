import React, { useState, useEffect, useMemo } from 'react';
import { 
  CpuChipIcon,
  ClockIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useRealtime } from '../RealtimeProvider';
import { useTheme } from '../../theming';

export const PerformanceMonitor = ({
  className = '',
  refreshInterval = 5000,
  showDetailedMetrics = true,
  alertThresholds = {
    cpu: 85,
    memory: 90,
    latency: 1000,
    errorRate: 5
  },
  ...props
}) => {
  const { 
    dataStreams, 
    metrics, 
    connectionState, 
    subscribe, 
    STREAM_TYPES 
  } = useRealtime();
  const { resolvedTheme } = useTheme();
  
  const [performanceData, setPerformanceData] = useState({
    cpu: { current: 0, history: [], trend: 'stable' },
    memory: { current: 0, history: [], trend: 'stable' },
    latency: { current: 0, history: [], trend: 'stable' },
    throughput: { current: 0, history: [], trend: 'stable' },
    errorRate: { current: 0, history: [], trend: 'stable' },
    activeConnections: 0
  });

  const [systemHealth, setSystemHealth] = useState('healthy');
  const [alerts, setAlerts] = useState([]);

  // Subscribe to system metrics
  useEffect(() => {
    const unsubscribe = subscribe(STREAM_TYPES.SYSTEM_METRICS, (data) => {
      setPerformanceData(prev => {
        const newData = { ...prev };
        
        Object.keys(data).forEach(metric => {
          if (newData[metric]) {
            const currentValue = data[metric];
            const history = [...(newData[metric].history || []), {
              value: currentValue,
              timestamp: Date.now()
            }].slice(-50); // Keep last 50 data points
            
            // Calculate trend
            let trend = 'stable';
            if (history.length >= 3) {
              const recent = history.slice(-3);
              const isIncreasing = recent[2].value > recent[0].value;
              const isDecreasing = recent[2].value < recent[0].value;
              const changePercent = Math.abs((recent[2].value - recent[0].value) / recent[0].value) * 100;
              
              if (changePercent > 10) {
                trend = isIncreasing ? 'increasing' : 'decreasing';
              }
            }
            
            newData[metric] = {
              current: currentValue,
              history,
              trend
            };
          }
        });
        
        return newData;
      });
    });

    return unsubscribe;
  }, [subscribe, STREAM_TYPES.SYSTEM_METRICS]);

  // Monitor system health and generate alerts
  useEffect(() => {
    const checkSystemHealth = () => {
      const newAlerts = [];
      let overallHealth = 'healthy';
      
      // CPU check
      if (performanceData.cpu.current > alertThresholds.cpu) {
        newAlerts.push({
          id: 'cpu-high',
          type: 'performance',
          level: performanceData.cpu.current > 95 ? 'critical' : 'warning',
          message: `High CPU usage: ${performanceData.cpu.current.toFixed(1)}%`,
          timestamp: Date.now()
        });
        overallHealth = 'warning';
      }
      
      // Memory check
      if (performanceData.memory.current > alertThresholds.memory) {
        newAlerts.push({
          id: 'memory-high',
          type: 'performance',
          level: performanceData.memory.current > 95 ? 'critical' : 'warning',
          message: `High memory usage: ${performanceData.memory.current.toFixed(1)}%`,
          timestamp: Date.now()
        });
        overallHealth = 'warning';
      }
      
      // Latency check
      if (performanceData.latency.current > alertThresholds.latency) {
        newAlerts.push({
          id: 'latency-high',
          type: 'performance',
          level: 'warning',
          message: `High latency: ${performanceData.latency.current}ms`,
          timestamp: Date.now()
        });
        overallHealth = 'warning';
      }
      
      // Error rate check
      if (performanceData.errorRate.current > alertThresholds.errorRate) {
        newAlerts.push({
          id: 'error-rate-high',
          type: 'performance',
          level: 'critical',
          message: `High error rate: ${performanceData.errorRate.current.toFixed(1)}%`,
          timestamp: Date.now()
        });
        overallHealth = 'critical';
      }
      
      if (newAlerts.length > 2) {
        overallHealth = 'critical';
      }
      
      setAlerts(newAlerts);
      setSystemHealth(overallHealth);
    };

    checkSystemHealth();
  }, [performanceData, alertThresholds]);

  // Format metric values
  const formatMetric = (value, type) => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'milliseconds':
        return `${Math.round(value)}ms`;
      case 'count':
        return Math.round(value).toLocaleString();
      case 'rate':
        return `${value.toFixed(1)}/s`;
      default:
        return value.toString();
    }
  };

  // Get metric color based on value and thresholds
  const getMetricColor = (value, type) => {
    const isHigh = 
      (type === 'cpu' && value > alertThresholds.cpu) ||
      (type === 'memory' && value > alertThresholds.memory) ||
      (type === 'latency' && value > alertThresholds.latency) ||
      (type === 'errorRate' && value > alertThresholds.errorRate);
    
    const isCritical = 
      (type === 'cpu' && value > 95) ||
      (type === 'memory' && value > 95) ||
      (type === 'latency' && value > alertThresholds.latency * 2) ||
      (type === 'errorRate' && value > alertThresholds.errorRate * 2);
    
    if (isCritical) {
      return 'text-red-600 dark:text-red-400';
    } else if (isHigh) {
      return 'text-orange-600 dark:text-orange-400';
    } else {
      return 'text-green-600 dark:text-green-400';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-orange-500" />;
      case 'decreasing':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-green-500" />;
      default:
        return <SignalIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  // System health indicator
  const getHealthColor = () => {
    switch (systemHealth) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const cardClasses = `
    rounded-lg border shadow-sm
    ${resolvedTheme === 'dark'
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'
    }
  `;

  const textPrimaryClasses = resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className={`${cardClasses} ${className}`} {...props}>
      {/* Header */}
      <div className={`
        flex items-center justify-between p-4 border-b
        ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
      `}>
        <div className="flex items-center">
          <CpuChipIcon className="w-5 h-5 mr-2 text-blue-500" />
          <h3 className={`font-semibold ${textPrimaryClasses}`}>
            System Performance
          </h3>
          <div className={`
            ml-3 px-2 py-1 rounded-full text-xs font-medium
            ${getHealthColor()}
          `}>
            {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`flex items-center text-sm ${textSecondaryClasses}`}>
            <SignalIcon className={`w-4 h-4 mr-1 ${
              connectionState === 'connected' ? 'text-green-500' : 'text-red-500'
            }`} />
            {connectionState === 'connected' ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* CPU Usage */}
          <div className={`
            p-3 rounded-lg border
            ${resolvedTheme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}
          `}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${textSecondaryClasses}`}>CPU</span>
              {getTrendIcon(performanceData.cpu.trend)}
            </div>
            <div className={`text-2xl font-bold ${getMetricColor(performanceData.cpu.current, 'cpu')}`}>
              {formatMetric(performanceData.cpu.current, 'percentage')}
            </div>
          </div>

          {/* Memory Usage */}
          <div className={`
            p-3 rounded-lg border
            ${resolvedTheme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}
          `}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${textSecondaryClasses}`}>Memory</span>
              {getTrendIcon(performanceData.memory.trend)}
            </div>
            <div className={`text-2xl font-bold ${getMetricColor(performanceData.memory.current, 'memory')}`}>
              {formatMetric(performanceData.memory.current, 'percentage')}
            </div>
          </div>

          {/* Latency */}
          <div className={`
            p-3 rounded-lg border
            ${resolvedTheme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}
          `}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${textSecondaryClasses}`}>Latency</span>
              {getTrendIcon(performanceData.latency.trend)}
            </div>
            <div className={`text-2xl font-bold ${getMetricColor(performanceData.latency.current, 'latency')}`}>
              {formatMetric(performanceData.latency.current, 'milliseconds')}
            </div>
          </div>

          {/* Throughput */}
          <div className={`
            p-3 rounded-lg border
            ${resolvedTheme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}
          `}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${textSecondaryClasses}`}>Throughput</span>
              {getTrendIcon(performanceData.throughput.trend)}
            </div>
            <div className={`text-2xl font-bold ${textPrimaryClasses}`}>
              {formatMetric(performanceData.throughput.current, 'rate')}
            </div>
          </div>

          {/* Error Rate */}
          <div className={`
            p-3 rounded-lg border
            ${resolvedTheme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}
          `}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${textSecondaryClasses}`}>Error Rate</span>
              {getTrendIcon(performanceData.errorRate.trend)}
            </div>
            <div className={`text-2xl font-bold ${getMetricColor(performanceData.errorRate.current, 'errorRate')}`}>
              {formatMetric(performanceData.errorRate.current, 'percentage')}
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className={`
            p-3 rounded-lg border
            ${alerts.some(alert => alert.level === 'critical')
              ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
            }
          `}>
            <div className="flex items-center mb-2">
              <ExclamationTriangleIcon className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
              <span className={`text-sm font-medium ${textSecondaryClasses}`}>
                Active Performance Alerts
              </span>
            </div>
            <div className="space-y-1">
              {alerts.map(alert => (
                <div key={alert.id} className={`text-sm ${textSecondaryClasses}`}>
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Metrics */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center text-sm">
            <div className={textSecondaryClasses}>
              <span>Messages: {metrics.messagesReceived?.toLocaleString() || 0}</span>
              <span className="mx-2">â€¢</span>
              <span>Uptime: {Math.round((metrics.connectionUptime || 0) / 1000)}s</span>
            </div>
            <div className={`flex items-center ${textSecondaryClasses}`}>
              <ClockIcon className="w-4 h-4 mr-1" />
              Avg Latency: {Math.round(metrics.averageLatency || 0)}ms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
