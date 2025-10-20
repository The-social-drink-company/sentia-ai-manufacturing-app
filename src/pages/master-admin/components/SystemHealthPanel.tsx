/**
 * System Health Panel Component
 *
 * Real-time system health monitoring for master admin dashboard.
 * Displays database status, error tracking, memory usage, and uptime.
 *
 * @module src/pages/master-admin/components/SystemHealthPanel
 * @epic PHASE-5.1-MASTER-ADMIN-DASHBOARD
 * @story ADMIN-007
 */

import { useEffect } from 'react';
import { Activity, AlertTriangle, Database, Clock, Cpu } from 'lucide-react';
import { useMasterAdminSystemHealth } from '../hooks/useMasterAdmin';

export function SystemHealthPanel() {
  const { data, isLoading, error, refetch } = useMasterAdminSystemHealth();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-gray-400 animate-pulse" />
          <span className="text-sm text-gray-600">Loading system health...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-900">Failed to load system health</span>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return null;
  }

  const health = data.data;
  const isHealthy =
    health.database.status === 'healthy' && health.errors.lastHour < 10;

  // Format uptime
  const uptimeHours = Math.floor(health.uptime / 3600);
  const uptimeDays = Math.floor(uptimeHours / 24);
  const remainingHours = uptimeHours % 24;

  // Format memory usage
  const memoryUsedMB = Math.round(health.memory.heapUsed / 1024 / 1024);
  const memoryTotalMB = Math.round(health.memory.heapTotal / 1024 / 1024);
  const memoryPercent = Math.round((health.memory.heapUsed / health.memory.heapTotal) * 100);

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        isHealthy
          ? 'bg-green-50 border-green-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity
            className={`w-5 h-5 ${
              isHealthy ? 'text-green-600' : 'text-yellow-600'
            }`}
          />
          <h3 className="text-sm font-semibold text-gray-900">
            System Health
          </h3>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            isHealthy
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {isHealthy ? 'Healthy' : 'Warning'}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Status */}
        <div className="flex items-start space-x-3">
          <Database
            className={`w-5 h-5 mt-0.5 ${
              health.database.status === 'healthy'
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          />
          <div>
            <div className="text-xs text-gray-600">Database</div>
            <div className="text-sm font-medium text-gray-900">
              {health.database.status === 'healthy' ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-xs text-gray-500">
              Pool: {health.database.connectionPool}
            </div>
          </div>
        </div>

        {/* Error Count */}
        <div className="flex items-start space-x-3">
          <AlertTriangle
            className={`w-5 h-5 mt-0.5 ${
              health.errors.lastHour === 0
                ? 'text-gray-400'
                : health.errors.lastHour < 10
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          />
          <div>
            <div className="text-xs text-gray-600">Errors (1h)</div>
            <div className="text-sm font-medium text-gray-900">
              {health.errors.lastHour}
            </div>
            {health.errors.last24Hours !== undefined && (
              <div className="text-xs text-gray-500">
                {health.errors.last24Hours} in 24h
              </div>
            )}
          </div>
        </div>

        {/* System Uptime */}
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 mt-0.5 text-blue-600" />
          <div>
            <div className="text-xs text-gray-600">Uptime</div>
            <div className="text-sm font-medium text-gray-900">
              {uptimeDays > 0 ? `${uptimeDays}d ${remainingHours}h` : `${uptimeHours}h`}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(Date.now() - health.uptime * 1000).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="flex items-start space-x-3">
          <Cpu className="w-5 h-5 mt-0.5 text-purple-600" />
          <div>
            <div className="text-xs text-gray-600">Memory</div>
            <div className="text-sm font-medium text-gray-900">
              {memoryUsedMB} / {memoryTotalMB} MB
            </div>
            <div className="text-xs text-gray-500">{memoryPercent}% used</div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {!isHealthy && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-700 mt-0.5" />
            <div className="text-xs text-yellow-900">
              {health.database.status !== 'healthy' && (
                <p className="mb-1">
                  <strong>Database connection issue detected.</strong> Some
                  features may be unavailable.
                </p>
              )}
              {health.errors.lastHour >= 10 && (
                <p>
                  <strong>High error rate detected.</strong> {health.errors.lastHour}{' '}
                  errors in the last hour. Check logs for details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 text-right">
        Last updated: {new Date(health.timestamp).toLocaleTimeString()} • Auto-refreshes every 30s
      </div>
    </div>
  );
}
