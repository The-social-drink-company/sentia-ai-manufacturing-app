import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

/**
 * API Status Diagnostic Component
 * Shows real-time status of all API endpoints to help identify which APIs aren't working
 */
const APIStatusDiagnostic = () => {
  const [apiStatuses, setApiStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Define all the API endpoints that should be tested
  const apiEndpoints = [
    { name: 'Health Check', path: '/api/health', critical: true },
    { name: 'Analytics Overview', path: '/api/analytics/overview', critical: true },
    { name: 'Dashboard Overview', path: '/api/dashboard/overview', critical: true },
    { name: 'Working Capital KPIs', path: '/api/working-capital/kpis/trends', critical: true },
    { name: 'Production Optimization', path: '/api/production/optimization', critical: false },
    { name: 'Forecasting Enhanced', path: '/api/forecasting/enhanced', critical: false },
    { name: 'AI Insights', path: '/api/ai/insights', critical: false },
    { name: 'Inventory Management', path: '/api/inventory/status', critical: false },
    { name: 'Quality Control', path: '/api/quality/metrics', critical: false },
    { name: 'Xero Integration', path: '/api/xero/status', critical: false },
    { name: 'Shopify Integration', path: '/api/shopify/status', critical: false },
    { name: 'Admin System Stats', path: '/api/admin/system-stats', critical: false },
    { name: 'Real-time Data Sync', path: '/api/sync/status', critical: false },
  ];

  const testAPI = async (endpoint) => {
    const testStartTime = Date.now();
    
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const fullUrl = endpoint.path.startsWith('/api') 
        ? `${apiUrl.replace('/api', '')}${endpoint.path}`
        : `${apiUrl}${endpoint.path}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(fullUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      return {
        name: endpoint.name,
        path: endpoint.path,
        critical: endpoint.critical,
        status: response.ok ? 'online' : 'error',
        statusCode: response.status,
        statusText: response.statusText,
        responseTime: Date.now() - testStartTime,
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        name: endpoint.name,
        path: endpoint.path,
        critical: endpoint.critical,
        status: error.name === 'AbortError' ? 'timeout' : 'offline',
        statusCode: null,
        statusText: null,
        responseTime: null,
        error: error.name === 'AbortError' 
          ? 'Request timeout (>5s)' 
          : error.message.includes('ECONNREFUSED') 
            ? 'Server not running' 
            : error.message
      };
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    const results = {};
    
    // Test all APIs in parallel
    const testPromises = apiEndpoints.map(async (endpoint) => {
      const result = await testAPI(endpoint);
      results[endpoint.name] = result;
      return result;
    });

    await Promise.all(testPromises);
    
    setApiStatuses(results);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(runDiagnostics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'timeout':
        return <ClockIcon className="h-5 w-5 text-orange-500" />;
      case 'offline':
      default:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-yellow-200 bg-yellow-50';
      case 'timeout':
        return 'border-orange-200 bg-orange-50';
      case 'offline':
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  const getOverallStatus = () => {
    const statuses = Object.values(apiStatuses);
    const criticalAPIs = statuses.filter(api => api.critical);
    
    const criticalOnline = criticalAPIs.filter(api => api.status === 'online').length;
    const totalCritical = criticalAPIs.length;
    
    if (criticalOnline === totalCritical && totalCritical > 0) {
      return { status: 'healthy', message: 'All critical APIs are online' };
    } else if (criticalOnline > 0) {
      return { status: 'partial', message: `${criticalOnline}/${totalCritical} critical APIs online` };
    } else {
      return { status: 'critical', message: 'Critical APIs are offline' };
    }
  };

  const overallStatus = getOverallStatus();

  if (loading && Object.keys(apiStatuses).length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ServerIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              API Status Diagnostic
            </h1>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Testing API endpoints...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ServerIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                API Status Diagnostic
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time monitoring of all application APIs
              </p>
            </div>
          </div>
          
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Overall Status */}
        <div className={`mt-6 p-4 rounded-lg border-2 ${
          overallStatus.status === 'healthy' ? 'border-green-200 bg-green-50' :
          overallStatus.status === 'partial' ? 'border-yellow-200 bg-yellow-50' :
          'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center space-x-3">
            {overallStatus.status === 'healthy' ? 
              <CheckCircleIcon className="h-6 w-6 text-green-600" /> :
              overallStatus.status === 'partial' ?
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" /> :
              <XCircleIcon className="h-6 w-6 text-red-600" />
            }
            <div>
              <p className={`font-medium ${
                overallStatus.status === 'healthy' ? 'text-green-800' :
                overallStatus.status === 'partial' ? 'text-yellow-800' :
                'text-red-800'
              }`}>
                System Status: {overallStatus.status.charAt(0).toUpperCase() + overallStatus.status.slice(1)}
              </p>
              <p className={`text-sm ${
                overallStatus.status === 'healthy' ? 'text-green-600' :
                overallStatus.status === 'partial' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {overallStatus.message}
              </p>
            </div>
          </div>
        </div>

        {lastUpdated && (
          <p className="mt-4 text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}
      </div>

      {/* API Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(apiStatuses).map((api, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 ${getStatusColor(api.status)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(api.status)}
                  <h3 className="font-medium text-gray-900">
                    {api.name}
                    {api.critical && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Critical
                      </span>
                    )}
                  </h3>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Endpoint:</span> {api.path}</p>
                  
                  {api.status === 'online' && (
                    <>
                      <p><span className="font-medium">Status:</span> {api.statusCode} {api.statusText}</p>
                      {api.responseTime && (
                        <p><span className="font-medium">Response time:</span> {api.responseTime}ms</p>
                      )}
                    </>
                  )}
                  
                  {api.status !== 'online' && api.error && (
                    <p className="text-red-600"><span className="font-medium">Error:</span> {api.error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Status Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-600">Online - Working normally</span>
          </div>
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-600">Error - Returns error response</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-gray-600">Timeout - Response too slow</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircleIcon className="h-5 w-5 text-red-500" />
            <span className="text-sm text-gray-600">Offline - Server not responding</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIStatusDiagnostic;
