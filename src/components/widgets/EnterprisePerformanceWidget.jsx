import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const EnterprisePerformanceWidget = ({ config = {} }) => {
  const { data: performanceData, isLoading, error } = useQuery({
    queryKey: ['enterprise-performance'],
    queryFn: async () => {
      const response = await fetch('/api/enterprise/performance');
      if (!response.ok) throw new Error('Failed to fetch enterprise performance data');
      return response.json();
    },
    refetchInterval: 15000, // More frequent updates for performance monitoring
    staleTime: 10000,
  });

  const [metrics, setMetrics] = useState({
    system: {
      uptime: '99.9%',
      responseTime: 245,
      throughput: 1250,
      errorRate: 0.02
    },
    database: {
      connections: 8,
      avgQueryTime: 125,
      cacheHitRate: 85.7,
      slowQueries: 3
    },
    redis: {
      connected: true,
      memoryUsage: '156 MB',
      hitRate: 92.3,
      operations: 15420
    },
    scalability: {
      activeUsers: 247,
      peakLoad: '2.3k req/min',
      autoScaling: true,
      healthScore: 96
    }
  });

  useEffect(() => {
    if (performanceData) {
      setMetrics(prev => ({
        ...prev,
        ...performanceData
      }));
    }
  }, [performanceData]);

  const getHealthColor = (score) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (value, threshold = 90) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="sentia-card h-full">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title">Enterprise Performance</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-loading-state">
            <div className="sentia-spinner"></div>
            <p>Loading performance metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="sentia-card h-full border-red-200">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title text-red-600">Enterprise Performance</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-error-state">
            <p className="text-red-500">Error: {error.message}</p>
            <p className="text-sm text-gray-500 mt-2">Check monitoring systems</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sentia-card h-full">
      <CardHeader className="sentia-card-header">
        <CardTitle className="sentia-widget-title">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            Enterprise Performance Monitor
          </div>
        </CardTitle>
        <div className="text-sm text-gray-600">
          Real-time system health & scalability metrics
        </div>
      </CardHeader>
      <CardContent className="sentia-card-content">
        {/* System Health Overview */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="sentia-metric-card bg-green-50 border-green-200">
            <div className="text-lg font-bold text-green-600">{metrics.system.uptime}</div>
            <div className="text-xs text-green-700">Uptime SLA</div>
          </div>
          <div className="sentia-metric-card bg-blue-50 border-blue-200">
            <div className="text-lg font-bold text-blue-600">{metrics.system.responseTime}ms</div>
            <div className="text-xs text-blue-700">Response Time</div>
          </div>
          <div className="sentia-metric-card bg-purple-50 border-purple-200">
            <div className="text-lg font-bold text-purple-600">{metrics.system.throughput}</div>
            <div className="text-xs text-purple-700">Requests/min</div>
          </div>
          <div className="sentia-metric-card bg-emerald-50 border-emerald-200">
            <div className={`text-lg font-bold ${getHealthColor(metrics.scalability.healthScore)}`}>
              {metrics.scalability.healthScore}%
            </div>
            <div className="text-xs text-emerald-700">Health Score</div>
          </div>
        </div>

        {/* Database Performance */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">📊 Database Performance</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Connections</span>
                <span className="font-medium">{metrics.database.connections}/20</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full" 
                  style={{ width: `${(metrics.database.connections / 20) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cache Hit Rate</span>
                <span className={`font-medium ${getStatusColor(metrics.database.cacheHitRate)}`}>
                  {metrics.database.cacheHitRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div 
                  className="bg-green-500 h-1 rounded-full" 
                  style={{ width: `${metrics.database.cacheHitRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Redis Performance */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">🔴 Redis Cache</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Memory Usage</span>
                <span className="font-medium">{metrics.redis.memoryUsage}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${metrics.redis.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {metrics.redis.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hit Rate</span>
                <span className={`font-medium ${getStatusColor(metrics.redis.hitRate)}`}>
                  {metrics.redis.hitRate}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.redis.operations.toLocaleString()} ops
              </div>
            </div>
          </div>
        </div>

        {/* Scalability Status */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">⚡ Auto-Scaling Status</h4>
          <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${metrics.scalability.autoScaling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium">Auto-scaling {metrics.scalability.autoScaling ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{metrics.scalability.activeUsers} users</div>
              <div className="text-xs text-gray-500">Peak: {metrics.scalability.peakLoad}</div>
            </div>
          </div>
        </div>

        {/* Recent Issues */}
        {metrics.database.slowQueries > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-1">⚠️ Performance Alerts</h4>
            <div className="text-sm text-yellow-700">
              {metrics.database.slowQueries} slow queries detected in the last hour
            </div>
            <div className="text-xs text-yellow-600 mt-1">
              Avg query time: {metrics.database.avgQueryTime}ms
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 sentia-data-timestamp">
          Last updated: {performanceData?.lastUpdated ? new Date(performanceData.lastUpdated).toLocaleTimeString() : 'Live'}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnterprisePerformanceWidget;