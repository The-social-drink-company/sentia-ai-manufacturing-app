import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Server, Globe, Database, Cloud, Activity, AlertCircle, 
  CheckCircle, Clock, RefreshCw, Settings, TrendingUp, 
  TrendingDown, Zap, Shield, HardDrive, Wifi, Lock
} from 'lucide-react';

const APIStatusSimple = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock API status data
  const [apiServices] = useState([
    {
      name: 'Manufacturing API',
      endpoint: '/api/manufacturing',
      status: 'healthy',
      responseTime: 145,
      uptime: 99.9,
      lastCheck: '30 seconds ago',
      requests24h: 15420,
      errorRate: 0.1,
      region: 'EU-West',
      version: 'v2.1.0'
    },
    {
      name: 'Inventory Service',
      endpoint: '/api/inventory',
      status: 'healthy',
      responseTime: 89,
      uptime: 100,
      lastCheck: '15 seconds ago',
      requests24h: 8730,
      errorRate: 0,
      region: 'EU-West',
      version: 'v1.5.2'
    },
    {
      name: 'Analytics Engine',
      endpoint: '/api/analytics',
      status: 'degraded',
      responseTime: 520,
      uptime: 98.5,
      lastCheck: '45 seconds ago',
      requests24h: 12340,
      errorRate: 1.5,
      region: 'EU-West',
      version: 'v3.0.1'
    },
    {
      name: 'User Management',
      endpoint: '/api/auth',
      status: 'healthy',
      responseTime: 67,
      uptime: 99.8,
      lastCheck: '20 seconds ago',
      requests24h: 5680,
      errorRate: 0.2,
      region: 'Global',
      version: 'v2.0.0'
    },
    {
      name: 'File Storage',
      endpoint: '/api/storage',
      status: 'maintenance',
      responseTime: 0,
      uptime: 95.2,
      lastCheck: '5 minutes ago',
      requests24h: 3420,
      errorRate: 0,
      region: 'EU-West',
      version: 'v1.8.0'
    },
    {
      name: 'Notification Service',
      endpoint: '/api/notifications',
      status: 'error',
      responseTime: 1200,
      uptime: 89.3,
      lastCheck: '2 minutes ago',
      requests24h: 2150,
      errorRate: 10.5,
      region: 'Global',
      version: 'v1.2.1'
    }
  ]);

  const [externalServices] = useState([
    {
      name: 'Xero Accounting',
      provider: 'Xero',
      status: 'healthy',
      responseTime: 234,
      lastSync: '10 minutes ago',
      syncStatus: 'success',
      icon: Globe
    },
    {
      name: 'Amazon SP-API',
      provider: 'Amazon',
      status: 'healthy',
      responseTime: 156,
      lastSync: '5 minutes ago',
      syncStatus: 'success',
      icon: Cloud
    },
    {
      name: 'Shopify Store',
      provider: 'Shopify',
      status: 'healthy',
      responseTime: 98,
      lastSync: '2 minutes ago',
      syncStatus: 'success',
      icon: Globe
    },
    {
      name: 'Neon Database',
      provider: 'Neon',
      status: 'healthy',
      responseTime: 45,
      lastSync: 'Real-time',
      syncStatus: 'connected',
      icon: Database
    }
  ]);

  const [systemMetrics] = useState({
    totalRequests: 47740,
    totalErrors: 127,
    avgResponseTime: 189,
    activeConnections: 342,
    cpuUsage: 65,
    memoryUsage: 78,
    diskUsage: 45,
    networkTraffic: 2.3
  });

  const getStatusColor = (status) => {
    const colors = {
      healthy: 'text-green-600 bg-green-100',
      degraded: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100',
      maintenance: 'text-blue-600 bg-blue-100'
    };
    return colors[status] || colors.error;
  };

  const getStatusIcon = (status) => {
    const icons = {
      healthy: CheckCircle,
      degraded: AlertCircle,
      error: AlertCircle,
      maintenance: Settings
    };
    return icons[status] || AlertCircle;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdate(new Date());
    }, 1500);
  };

  const formatResponseTime = (time) => {
    if (time === 0) return 'N/A';
    if (time < 100) return `${time}ms`;
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const getResponseTimeColor = (time) => {
    if (time < 200) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Status & Diagnostics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor system health and API performance in real-time
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests (24h)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemMetrics.totalRequests.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12% from yesterday
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemMetrics.avgResponseTime}ms
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingDown className="h-3 w-3 inline mr-1" />
                  -5ms from yesterday
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {((systemMetrics.totalErrors / systemMetrics.totalRequests) * 100).toFixed(2)}%
                </p>
                <p className="text-sm text-red-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +0.1% from yesterday
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Connections</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemMetrics.activeConnections}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  <Wifi className="h-3 w-3 inline mr-1" />
                  Real-time
                </p>
              </div>
              <Server className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.cpuUsage}%</p>
              </div>
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
            <Progress value={systemMetrics.cpuUsage} className="w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.memoryUsage}%</p>
              </div>
              <HardDrive className="h-6 w-6 text-green-500" />
            </div>
            <Progress value={systemMetrics.memoryUsage} className="w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disk Usage</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.diskUsage}%</p>
              </div>
              <Database className="h-6 w-6 text-purple-500" />
            </div>
            <Progress value={systemMetrics.diskUsage} className="w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Network I/O</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.networkTraffic}GB/s</p>
              </div>
              <Wifi className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              â†‘ 1.2GB/s â†“ 1.1GB/s
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Internal API Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiServices.map((service, index) => {
              const StatusIcon = getStatusIcon(service.status);
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <StatusIcon className={`h-6 w-6 ${getStatusColor(service.status).split(' ')[0]}`} />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{service.name}</h3>
                      <p className="text-sm text-gray-500">{service.endpoint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-900 dark:text-white">Response Time</p>
                      <p className={getResponseTimeColor(service.responseTime)}>
                        {formatResponseTime(service.responseTime)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900 dark:text-white">Uptime</p>
                      <p className="text-green-600">{service.uptime}%</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900 dark:text-white">Requests</p>
                      <p className="text-gray-600">{service.requests24h.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900 dark:text-white">Errors</p>
                      <p className={service.errorRate > 1 ? 'text-red-600' : 'text-green-600'}>
                        {service.errorRate}%
                      </p>
                    </div>
                    <Badge className={getStatusColor(service.status)} variant="secondary">
                      {service.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* External Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            External Service Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {externalServices.map((service, index) => {
              const Icon = service.icon;
              const StatusIcon = getStatusIcon(service.status);
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{service.name}</h3>
                      <p className="text-sm text-gray-500">
                        Last sync: {service.lastSync} â€¢ {formatResponseTime(service.responseTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-5 w-5 ${getStatusColor(service.status).split(' ')[0]}`} />
                    <Badge className={getStatusColor(service.status)} variant="secondary">
                      {service.syncStatus}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Lock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">SSL Certificate</p>
                <p className="text-sm text-green-600">Valid until Dec 2024</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Authentication</p>
                <p className="text-sm text-green-600">All systems secure</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">API Keys</p>
                <p className="text-sm text-green-600">12 active, 0 expired</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIStatusSimple;
