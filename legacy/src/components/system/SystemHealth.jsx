import { devLog } from '../lib/devLog.js';\nimport React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon,
  GlobeAltIcon,
  CircleStackIcon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const SystemHealth = () => {
  const [systemStatus, setSystemStatus] = useState({
    overall: 'healthy',
    lastUpdated: new Date(),
    services: {
      webServer: { status: 'healthy', responseTime: 45, uptime: '99.9%' },
      database: { status: 'healthy', responseTime: 12, uptime: '99.8%' },
      apiGateway: { status: 'healthy', responseTime: 23, uptime: '99.9%' },
      mcpServer: { status: 'warning', responseTime: 156, uptime: '98.2%' },
      xeroIntegration: { status: 'error', responseTime: null, uptime: '0%' },
      authService: { status: 'healthy', responseTime: 67, uptime: '99.7%' }
    },
    metrics: {
      cpuUsage: 34,
      memoryUsage: 67,
      diskUsage: 42,
      networkLatency: 23
    },
    alerts: [
      {
        id: 1,
        type: 'warning',
        service: 'MCP Server',
        message: 'High response time detected',
        timestamp: new Date(Date.now() - 300000),
        resolved: false
      },
      {
        id: 2,
        type: 'error',
        service: 'Xero Integration',
        message: 'Service unavailable - credentials not configured',
        timestamp: new Date(Date.now() - 1800000),
        resolved: false
      },
      {
        id: 3,
        type: 'info',
        service: 'Database',
        message: 'Scheduled backup completed successfully',
        timestamp: new Date(Date.now() - 7200000),
        resolved: true
      }
    ]
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSystemStatus = async () => {
    setIsRefreshing(true);
    
    try {
      // In a real implementation, this would fetch from your health check API
      const response = await fetch('/api/health');
      const data = await response.json();
      
      setSystemStatus(prev => ({
        ...prev,
        lastUpdated: new Date(),
        // Update with real data from API
      }));
    } catch (error) {
      devLog.error('Failed to refresh system status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshSystemStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getServiceIcon = (serviceName) => {
    switch (serviceName.toLowerCase()) {
      case 'webserver':
        return <ServerIcon className="h-5 w-5" />;
      case 'database':
        return <CircleStackIcon className="h-5 w-5" />;
      case 'apigateway':
        return <GlobeAltIcon className="h-5 w-5" />;
      case 'mcpserver':
        return <CpuChipIcon className="h-5 w-5" />;
      case 'xerointegration':
        return <ChartBarIcon className="h-5 w-5" />;
      case 'authservice':
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return <ServerIcon className="h-5 w-5" />;
    }
  };

  const formatServiceName = (serviceName) => {
    return serviceName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const getMetricColor = (value, thresholds = { warning: 70, critical: 90 }) => {
    if (value >= thresholds.critical) return 'text-red-600 dark:text-red-400';
    if (value >= thresholds.warning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressBarColor = (value, thresholds = { warning: 70, critical: 90 }) => {
    if (value >= thresholds.critical) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Health
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time system status and performance monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {formatTimestamp(systemStatus.lastUpdated)}
          </span>
          <button
            onClick={refreshSystemStatus}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          {getStatusIcon(systemStatus.overall)}
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Overall System Status
            </h2>
            <p className={`text-sm font-medium ${getStatusColor(systemStatus.overall)}`}>
              System is {systemStatus.overall}
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(systemStatus.services).map(([serviceName, service]) => (
          <div key={serviceName} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getServiceIcon(serviceName)}
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatServiceName(serviceName)}
                </h3>
              </div>
              {getStatusIcon(service.status)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`text-sm font-medium ${getStatusColor(service.status)}`}>
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </span>
              </div>
              
              {service.responseTime && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Response Time:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {service.responseTime}ms
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Uptime:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {service.uptime}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          System Resources
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(systemStatus.metrics).map(([metric, value]) => {
            const isPercentage = ['cpuUsage', 'memoryUsage', 'diskUsage'].includes(metric);
            const displayValue = isPercentage ? `${value}%` : `${value}ms`;
            
            return (
              <div key={metric} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <span className={`text-sm font-bold ${getMetricColor(value)}`}>
                    {displayValue}
                  </span>
                </div>
                
                {isPercentage && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressBarColor(value)}`}
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts and Issues */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Recent Alerts
        </h3>
        
        <div className="space-y-4">
          {systemStatus.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start space-x-4 p-4 rounded-lg border ${
                alert.resolved
                  ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  : alert.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : alert.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}
            >
              <div className="flex-shrink-0">
                {alert.type === 'error' && <XCircleIcon className="h-5 w-5 text-red-500" />}
                {alert.type === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />}
                {alert.type === 'info' && <CheckCircleIcon className="h-5 w-5 text-blue-500" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {alert.service}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(alert.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {alert.message}
                </p>
                {alert.resolved && (
                  <span className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {systemStatus.alerts.length === 0 && (
          <div className="text-center py-8">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
              No active alerts
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              All systems are operating normally.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealth;
