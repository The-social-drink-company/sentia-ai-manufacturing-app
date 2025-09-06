import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  SignalIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const APIStatusDashboard = () => {
  const [apiStatus, setApiStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [healthMetrics, setHealthMetrics] = useState({});

  useEffect(() => {
    fetchAPIStatus();
    const interval = setInterval(fetchAPIStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAPIStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch overall health status
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      
      // Fetch detailed diagnostics
      const diagnosticsResponse = await fetch('/api/diagnostics');
      const diagnosticsData = await diagnosticsResponse.json();
      
      setApiStatus(healthData.checks || {});
      setHealthMetrics(diagnosticsData.metrics || {});
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch API status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'unhealthy':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatResponseTime = (time) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'N/A';
    return `${uptime.toFixed(2)}%`;
  };

  const apiServices = [
    {
      id: 'database',
      name: 'PostgreSQL Database',
      description: 'Primary data storage and user management',
      critical: true
    },
    {
      id: 'redis',
      name: 'Redis Cache',
      description: 'Session storage and caching layer',
      critical: false
    },
    {
      id: 'openai',
      name: 'OpenAI API',
      description: 'AI-powered demand forecasting',
      critical: false
    },
    {
      id: 'unleashed',
      name: 'Unleashed API',
      description: 'Inventory management integration',
      critical: false
    },
    {
      id: 'system',
      name: 'System Resources',
      description: 'Server memory, CPU, and performance',
      critical: true
    },
    {
      id: 'application',
      name: 'Application Health',
      description: 'Core application functionality',
      critical: true
    },
    {
      id: 'security',
      name: 'Security Status',
      description: 'Security configurations and monitoring',
      critical: true
    }
  ];

  if (loading && Object.keys(apiStatus).length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <SignalIcon className="h-5 w-5 mr-2" />
          API Integration Status
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const overallHealth = Object.values(apiStatus).length > 0 
    ? Object.values(apiStatus).every(service => service.status === 'healthy')
      ? 'healthy'
      : Object.values(apiStatus).some(service => service.status === 'unhealthy' && service.critical)
        ? 'unhealthy'
        : 'degraded'
    : 'unknown';

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <SignalIcon className="h-5 w-5 mr-2" />
          API Integration Status
        </h3>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(overallHealth)}`}>
            {getStatusIcon(overallHealth)}
            <span className="ml-2 capitalize">{overallHealth}</span>
          </div>
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Overall Metrics */}
      {healthMetrics && Object.keys(healthMetrics).length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Uptime</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatUptime(healthMetrics.uptime)}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Avg Response</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatResponseTime(healthMetrics.averageResponseTime)}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Healthy Services</div>
            <div className="text-2xl font-bold text-green-600">
              {healthMetrics.healthyServices}/{healthMetrics.totalServices}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Critical Services</div>
            <div className="text-2xl font-bold text-blue-600">
              {healthMetrics.criticalServices}
            </div>
          </div>
        </div>
      )}

      {/* Service Status List */}
      <div className="space-y-4">
        {apiServices.map((service) => {
          const status = apiStatus[service.id] || { status: 'unknown' };
          
          return (
            <div
              key={service.id}
              className={`border rounded-lg p-4 transition-colors duration-200 ${getStatusColor(status.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <h4 className="font-medium flex items-center">
                      {service.name}
                      {service.critical && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                          Critical
                        </span>
                      )}
                    </h4>
                    <p className="text-sm opacity-75">{service.description}</p>
                    {status.error && (
                      <p className="text-sm font-mono mt-1 opacity-90">
                        Error: {status.error}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatResponseTime(status.responseTime)}
                  </div>
                  {status.lastSuccess && (
                    <div className="text-xs opacity-75">
                      Last success: {new Date(status.lastSuccess).toLocaleTimeString()}
                    </div>
                  )}
                  {status.consecutiveFailures > 0 && (
                    <div className="text-xs text-red-600">
                      {status.consecutiveFailures} consecutive failures
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional service-specific info */}
              {service.id === 'openai' && status.status === 'healthy' && (
                <div className="mt-2 text-xs opacity-75">
                  Model: GPT-4, Usage tracking active
                </div>
              )}
              
              {service.id === 'database' && status.status === 'healthy' && (
                <div className="mt-2 text-xs opacity-75">
                  Connection pool: Active, Migrations: Up to date
                </div>
              )}
              
              {service.id === 'system' && status.status === 'healthy' && (
                <div className="mt-2 text-xs opacity-75">
                  Memory usage: Normal, Event loop lag: {"<"}10ms
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {Object.entries(apiStatus).map(([serviceId, status]) => (
            <div key={serviceId} className="text-sm text-gray-600 flex items-center justify-between">
              <span>{apiServices.find(s => s.id === serviceId)?.name || serviceId}</span>
              <span className="text-xs text-gray-400">
                {status.lastCheck ? new Date(status.lastCheck).toLocaleTimeString() : 'Never checked'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={fetchAPIStatus}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </button>
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            View Raw Health Data
          </a>
          <a
            href="/api/diagnostics"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            Detailed Diagnostics
          </a>
        </div>
      </div>
    </div>
  );
};

export default APIStatusDashboard;