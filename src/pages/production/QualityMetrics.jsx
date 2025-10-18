/**
 * Quality Metrics Component
 *
 * Comprehensive quality monitoring and analysis:
 * - First Pass Yield (FPY) tracking
 * - Defect rate monitoring
 * - Pareto analysis (80/20 rule)
 * - Statistical Process Control (SPC) charts
 * - Quality trend analysis
 * - Root cause tracking
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Activity,
  Target,
  Filter,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts';
import { useSSE } from '../../hooks/useSSE';

/**
 * Quality Metric Card
 */
// eslint-disable-next-line no-unused-vars
function QualityMetricCard({ label, value, target, unit, trend, icon: IconComponent, status }) {
  const statusColors = {
    good: 'border-green-500 bg-green-50',
    warning: 'border-yellow-500 bg-yellow-50',
    poor: 'border-red-500 bg-red-50',
  };

  const StatusIcon = trend >= 0 ? TrendingUp : TrendingDown;
  const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`rounded-lg border-2 ${statusColors[status]} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${
            status === 'good' ? 'bg-green-600' :
            status === 'warning' ? 'bg-yellow-600' :
            'bg-red-600'
          }`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-xs text-gray-500">Target: {target}{unit}</p>
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl font-bold text-gray-900">{value}{unit}</span>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            status === 'good' ? 'bg-green-500' :
            status === 'warning' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Pareto Chart Component
 */
function ParetoChart({ defectTypes }) {
  // Calculate Pareto data
  const sorted = [...defectTypes].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((sum, d) => sum + d.count, 0);

  let cumulative = 0;
  const paretoData = sorted.map(defect => {
    cumulative += defect.count;
    return {
      type: defect.type,
      count: defect.count,
      percentage: (defect.count / total) * 100,
      cumulative: (cumulative / total) * 100,
    };
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Pareto Analysis - Defect Types
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Focus on the vital few defects that cause most quality issues (80/20 rule)
      </p>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={paretoData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
          <YAxis yAxisId="left" label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            label={{ value: 'Cumulative %', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            formatter={(value, name) => [
              name === 'cumulative' ? `${value.toFixed(1)}%` : value,
              name === 'count' ? 'Defects' :
              name === 'percentage' ? 'Percentage' :
              'Cumulative %'
            ]}
          />
          <Legend />

          <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Defect Count" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="#ef4444"
            strokeWidth={3}
            name="Cumulative %"
            dot={{ fill: '#ef4444', r: 5 }}
          />
          <ReferenceLine yAxisId="right" y={80} stroke="#10b981" strokeDasharray="3 3" label="80%" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Defect Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {paretoData.slice(0, 4).map((defect) => (
          <div key={defect.type} className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{defect.count}</div>
            <div className="text-xs text-gray-600 mt-1">{defect.type}</div>
            <div className="text-xs text-gray-500 mt-1">
              {defect.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Statistical Process Control (SPC) Chart
 */
function SPCChart({ spcData, metric }) {
  const { dataPoints, ucl, lcl, mean, sigma } = spcData;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Statistical Process Control - {metric}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Control chart showing process variation and control limits (±3σ)
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dataPoints}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(ts) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          />
          <YAxis domain={[Math.max(0, lcl - 5), ucl + 5]} />
          <Tooltip
            labelFormatter={(ts) => new Date(ts).toLocaleString()}
            formatter={(value) => value.toFixed(2)}
          />
          <Legend />

          {/* Control limits */}
          <ReferenceLine y={ucl} stroke="#ef4444" strokeDasharray="3 3" label="UCL" />
          <ReferenceLine y={mean} stroke="#10b981" strokeDasharray="3 3" label="Mean" />
          <ReferenceLine y={lcl} stroke="#ef4444" strokeDasharray="3 3" label="LCL" />

          {/* Data points */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const isOutOfControl = payload.value > ucl || payload.value < lcl;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isOutOfControl ? 6 : 4}
                  fill={isOutOfControl ? '#ef4444' : '#3b82f6'}
                  stroke={isOutOfControl ? '#dc2626' : '#2563eb'}
                  strokeWidth={2}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* SPC Stats */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-lg font-bold text-gray-900">{mean.toFixed(2)}</div>
          <div className="text-xs text-gray-600">Mean</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-lg font-bold text-gray-900">{sigma.toFixed(2)}</div>
          <div className="text-xs text-gray-600">Std Dev (σ)</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded">
          <div className="text-lg font-bold text-red-600">{ucl.toFixed(2)}</div>
          <div className="text-xs text-gray-600">UCL (+3σ)</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded">
          <div className="text-lg font-bold text-red-600">{lcl.toFixed(2)}</div>
          <div className="text-xs text-gray-600">LCL (-3σ)</div>
        </div>
      </div>
    </div>
  );
}

/**
 * FPY Trend Chart
 */
function FPYTrendChart({ trendData }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        First Pass Yield Trend (Last 30 Days)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
            formatter={(value) => `${value.toFixed(1)}%`}
          />
          <Legend />

          <ReferenceLine y={99} stroke="#10b981" strokeDasharray="3 3" label="Target: 99%" />

          <Area
            type="monotone"
            dataKey="fpy"
            fill="#3b82f6"
            fillOpacity={0.1}
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="fpy"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
            name="FPY"
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Target"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Quality Alerts Panel
 */
function QualityAlertsPanel({ alerts }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quality Alerts ({alerts.length})
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">No quality alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-2 ${
                alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                'border-yellow-500 bg-yellow-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                  alert.severity === 'critical' ? 'text-red-600' :
                  alert.severity === 'high' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                  {alert.product && (
                    <p className="text-xs text-gray-600">Product: {alert.product}</p>
                  )}
                  {alert.machine && (
                    <p className="text-xs text-gray-600">Machine: {alert.machine}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Root Cause Analysis Table
 */
function RootCauseTable({ rootCauses }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Root Cause Analysis
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Root Cause
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Occurrences
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Occurrence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rootCauses.map((cause) => (
              <tr key={cause.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{cause.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{cause.occurrences}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${
                    cause.impact === 'high' ? 'bg-red-100 text-red-700 border-red-300' :
                    cause.impact === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                    'bg-green-100 text-green-700 border-green-300'
                  }`}>
                    {cause.impact}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(cause.lastOccurrence).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    cause.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    cause.status === 'investigating' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {cause.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Main Quality Metrics Component
 */
export default function QualityMetrics() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('today');
  const [selectedProduct, setSelectedProduct] = useState('all');

  // Fetch quality data
  const { data, isLoading, error } = useQuery({
    queryKey: ['production', 'quality', dateRange, selectedProduct],
    queryFn: async () => {
      const params = new URLSearchParams({ dateRange, product: selectedProduct });
      const response = await fetch(`/api/v1/production/quality?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch quality data');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000,
  });

  // SSE for real-time quality updates
  const { connected } = useSSE('production', {
    enabled: true,
    onMessage: (message) => {
      if (message.type === 'quality:alert' || message.type === 'quality:update') {
        queryClient.invalidateQueries(['production', 'quality']);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quality data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading quality data: {error.message}</p>
      </div>
    );
  }

  const {
    overview = {},
    defectTypes = [],
    fpyTrend = [],
    spc = {},
    alerts = [],
    rootCauses = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Metrics</h1>
          <p className="text-gray-600 mt-1">
            Real-time quality monitoring and analysis
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
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Products</option>
            {/* Product options would be populated from API */}
          </select>
        </div>
      </div>

      {/* Quality Metrics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QualityMetricCard
          label="First Pass Yield"
          value={overview.fpy || 0}
          target={99}
          unit="%"
          trend={overview.fpyTrend}
          icon={CheckCircle2}
          status={overview.fpy >= 99 ? 'good' : overview.fpy >= 95 ? 'warning' : 'poor'}
        />

        <QualityMetricCard
          label="Defect Rate"
          value={overview.defectRate || 0}
          target={1}
          unit="%"
          trend={-overview.defectRateTrend}
          icon={XCircle}
          status={overview.defectRate <= 1 ? 'good' : overview.defectRate <= 3 ? 'warning' : 'poor'}
        />

        <QualityMetricCard
          label="Total Inspections"
          value={overview.totalInspections || 0}
          target={overview.targetInspections || 1000}
          unit=""
          trend={overview.inspectionsTrend}
          icon={Activity}
          status="good"
        />

        <QualityMetricCard
          label="Rework Rate"
          value={overview.reworkRate || 0}
          target={2}
          unit="%"
          trend={-overview.reworkRateTrend}
          icon={AlertTriangle}
          status={overview.reworkRate <= 2 ? 'good' : overview.reworkRate <= 5 ? 'warning' : 'poor'}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        <ParetoChart defectTypes={defectTypes} />
        <QualityAlertsPanel alerts={alerts} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        <FPYTrendChart trendData={fpyTrend} />
        <SPCChart spcData={spc} metric="Defect Rate" />
      </div>

      {/* Root Cause Analysis */}
      <RootCauseTable rootCauses={rootCauses} />
    </div>
  );
}
