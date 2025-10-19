/**
 * Stock Alerts Component
 *
 * Real-time inventory alerts and actions:
 * - Low stock warnings
 * - Overstock alerts
 * - Expiration warnings
 * - Dead stock identification
 * - Quick action buttons (reorder, transfer, mark down)
 * - Alert history and trends
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  TrendingDown,
  Package,
  XCircle,
  CheckCircle2,
  ShoppingCart,
  RefreshCw,
  ArrowRight,
  Tag,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSSE } from '../../hooks/useSSE';

// Alert types and severity
const ALERT_TYPES = {
  LOW_STOCK: { label: 'Low Stock', icon: AlertTriangle, color: 'orange' },
  OUT_OF_STOCK: { label: 'Out of Stock', icon: XCircle, color: 'red' },
  OVERSTOCK: { label: 'Overstock', icon: Package, color: 'yellow' },
  EXPIRING_SOON: { label: 'Expiring Soon', icon: Clock, color: 'orange' },
  DEAD_STOCK: { label: 'Dead Stock', icon: TrendingDown, color: 'gray' },
};

const ALERT_SEVERITY = {
  critical: { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-600', borderColor: 'border-red-500' },
  high: { label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600', borderColor: 'border-orange-500' },
  medium: { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-600', borderColor: 'border-yellow-500' },
  low: { label: 'Low', color: 'bg-blue-500', textColor: 'text-blue-600', borderColor: 'border-blue-500' },
};

/**
 * Stock Alert Card
 */
function StockAlertCard({ alert, onAction, onDismiss }) {
  const alertType = ALERT_TYPES[alert.type] || ALERT_TYPES.LOW_STOCK;
  const severity = ALERT_SEVERITY[alert.severity] || ALERT_SEVERITY.medium;
  const Icon = alertType.icon;

  const [showActions, setShowActions] = useState(false);

  return (
    <div className={`rounded-lg border-2 ${severity.borderColor} bg-white p-4 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg ${severity.color} bg-opacity-10`}>
            <Icon className={`w-5 h-5 ${severity.textColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{alert.sku}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${severity.color} text-white`}>
                {severity.label}
              </span>
            </div>
            <p className="text-sm text-gray-600">{alert.productName}</p>
          </div>
        </div>
        <button
          onClick={() => onDismiss(alert.id)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Alert Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Type:</span>
          <span className="font-medium text-gray-900">{alertType.label}</span>
        </div>

        {alert.currentStock !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current Stock:</span>
            <span className={`font-medium ${
              alert.currentStock === 0 ? 'text-red-600' :
              alert.currentStock < alert.reorderPoint ? 'text-orange-600' :
              'text-gray-900'
            }`}>
              {alert.currentStock} units
            </span>
          </div>
        )}

        {alert.reorderPoint && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Reorder Point:</span>
            <span className="font-medium text-gray-900">{alert.reorderPoint} units</span>
          </div>
        )}

        {alert.warehouse && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Warehouse:</span>
            <span className="font-medium text-gray-900">{alert.warehouse}</span>
          </div>
        )}

        {alert.daysUntilExpiry && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Days Until Expiry:</span>
            <span className={`font-medium ${
              alert.daysUntilExpiry <= 7 ? 'text-red-600' :
              alert.daysUntilExpiry <= 30 ? 'text-orange-600' :
              'text-gray-900'
            }`}>
              {alert.daysUntilExpiry} days
            </span>
          </div>
        )}

        {alert.daysStagnant && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Days Stagnant:</span>
            <span className="font-medium text-gray-900">{alert.daysStagnant} days</span>
          </div>
        )}

        {alert.message && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
            {alert.message}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 pt-3">
        <button
          onClick={() => setShowActions(!showActions)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          Quick Actions
          <ArrowRight className={`w-4 h-4 transition-transform ${showActions ? 'rotate-90' : ''}`} />
        </button>

        {showActions && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {alert.type === 'LOW_STOCK' || alert.type === 'OUT_OF_STOCK' ? (
              <>
                <button
                  onClick={() => onAction('reorder', alert)}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Reorder
                </button>
                <button
                  onClick={() => onAction('transfer', alert)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Transfer
                </button>
              </>
            ) : null}

            {alert.type === 'OVERSTOCK' || alert.type === 'DEAD_STOCK' ? (
              <>
                <button
                  onClick={() => onAction('markdown', alert)}
                  className="px-3 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 flex items-center justify-center gap-1"
                >
                  <Tag className="w-4 h-4" />
                  Mark Down
                </button>
                <button
                  onClick={() => onAction('transfer', alert)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Transfer
                </button>
              </>
            ) : null}

            {alert.type === 'EXPIRING_SOON' ? (
              <>
                <button
                  onClick={() => onAction('markdown', alert)}
                  className="px-3 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 flex items-center justify-center gap-1"
                >
                  <Tag className="w-4 h-4" />
                  Mark Down
                </button>
                <button
                  onClick={() => onAction('transfer', alert)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Transfer
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="mt-3 text-xs text-gray-500">
        Alert created: {new Date(alert.createdAt).toLocaleString()}
      </div>
    </div>
  );
}

/**
 * Alert Summary Cards
 */
function AlertSummaryCards({ summary }) {
  const cards = [
    { label: 'Critical Alerts', value: summary.critical || 0, color: 'bg-red-500', icon: AlertTriangle },
    { label: 'High Priority', value: summary.high || 0, color: 'bg-orange-500', icon: AlertCircle },
    { label: 'Medium Priority', value: summary.medium || 0, color: 'bg-yellow-500', icon: AlertCircle },
    { label: 'Total Alerts', value: summary.total || 0, color: 'bg-blue-500', icon: Package },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-600 mt-1">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Alerts by Type Chart
 */
function AlertsByTypeChart({ alertsData }) {
  const chartData = Object.entries(ALERT_TYPES).map(([key, type]) => ({
    name: type.label,
    count: alertsData[key] || 0,
    color: type.color === 'red' ? '#ef4444' :
           type.color === 'orange' ? '#f97316' :
           type.color === 'yellow' ? '#eab308' :
           '#6b7280',
  }));

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Alerts by Type
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData.filter(d => d.count > 0)}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, count }) => `${name}: ${count}`}
              outerRadius={70}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex flex-col justify-center">
          <div className="space-y-2">
            {chartData
              .filter(d => d.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.count} ({total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Alert Trend Chart
 */
function AlertTrendChart({ trendData }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Alert Trend (Last 30 Days)
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          />
          <YAxis />
          <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
          <Legend />

          <Line
            type="monotone"
            dataKey="critical"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 3 }}
            name="Critical"
          />
          <Line
            type="monotone"
            dataKey="high"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 3 }}
            name="High"
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 3 }}
            name="Total"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Main Stock Alerts Component
 */
export default function StockAlerts() {
  const queryClient = useQueryClient();
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [showDismissed, setShowDismissed] = useState(false);

  // Fetch alerts
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', 'alerts', filterSeverity, filterType, showDismissed],
    queryFn: async () => {
      const params = new URLSearchParams({
        severity: filterSeverity,
        type: filterType,
        includeDismissed: showDismissed.toString(),
      });
      const response = await fetch(`/api/v1/inventory/alerts?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000,
  });

  // Dismiss alert mutation
  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      const response = await fetch(`/api/v1/inventory/alerts/${alertId}/dismiss`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to dismiss alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory', 'alerts']);
    },
  });

  // Handle action mutation
  const handleActionMutation = useMutation({
    mutationFn: async ({ action, alert }) => {
      const response = await fetch(`/api/v1/inventory/alerts/${alert.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, sku: alert.sku, warehouse: alert.warehouse }),
      });
      if (!response.ok) throw new Error(`Failed to execute ${action}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory', 'alerts']);
    },
  });

  // SSE for real-time alerts
  const { connected } = useSSE('inventory', {
    enabled: true,
    onMessage: (message) => {
      if (message.type === 'inventory:alert') {
        queryClient.invalidateQueries(['inventory', 'alerts']);
        // Show toast notification for new alert
        console.log('New inventory alert:', message.data);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading alerts: {error.message}</p>
      </div>
    );
  }

  const {
    alerts = [],
    summary = {},
    byType = {},
    trend = [],
  } = data || {};

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'ALL' || alert.severity === filterSeverity.toLowerCase();
    const matchesType = filterType === 'ALL' || alert.type === filterType;
    return matchesSeverity && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Alerts</h1>
          <p className="text-gray-600 mt-1">
            Real-time inventory alerts and actions
            {connected && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Live
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Severities</option>
            {Object.keys(ALERT_SEVERITY).map(severity => (
              <option key={severity} value={severity.toUpperCase()}>
                {ALERT_SEVERITY[severity].label}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            {Object.entries(ALERT_TYPES).map(([key, type]) => (
              <option key={key} value={key}>
                {type.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showDismissed}
              onChange={(e) => setShowDismissed(e.target.checked)}
              className="rounded"
            />
            Show Dismissed
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <AlertSummaryCards summary={summary} />

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <AlertsByTypeChart alertsData={byType} />
        <AlertTrendChart trendData={trend} />
      </div>

      {/* Alerts List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Alerts ({filteredAlerts.length})
        </h2>

        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Alerts</h3>
            <p className="text-gray-600">
              {filterSeverity !== 'ALL' || filterType !== 'ALL'
                ? 'No alerts match the selected filters.'
                : 'All inventory levels are within acceptable ranges.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlerts.map((alert) => (
              <StockAlertCard
                key={alert.id}
                alert={alert}
                onAction={(action, alert) => handleActionMutation.mutate({ action, alert })}
                onDismiss={(id) => dismissAlertMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
