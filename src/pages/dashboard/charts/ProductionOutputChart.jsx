import React, { useState } from 'react';
import {
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
  ResponsiveContainer,
} from 'recharts';
import ChartCard from './ChartCard';

/**
 * ProductionOutputChart Component
 *
 * Displays production output and efficiency metrics:
 * - Units produced over time
 * - OEE (Overall Equipment Effectiveness) trend
 * - Comparison to target/capacity
 * - Product SKU breakdown
 * - Shift performance
 *
 * @param {Object} props
 * @param {Array} props.data - Time series production data
 * @param {boolean} props.loading - Loading state
 * @param {Error} props.error - Error object
 * @param {Function} props.onRefresh - Refresh handler
 * @param {Function} props.onExport - Export handler
 */
function ProductionOutputChart({ data = [], loading = false, error = null, onRefresh, onExport }) {
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d
  const [view, setView] = useState('output'); // output, oee, comparison

  // Filter data based on time range
  const filteredData = filterDataByTimeRange(data, timeRange);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded shadow-lg p-3">
        <p className="font-medium text-gray-900 mb-2">{formatDate(label)}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold">
              {entry.dataKey === 'oee' || entry.dataKey === 'targetPercent'
                ? `${entry.value.toFixed(1)}%`
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Time range selector
  const timeRangeActions = (
    <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
      {['7d', '30d', '90d'].map((range) => (
        <button
          key={range}
          onClick={() => setTimeRange(range)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            timeRange === range
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {range.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title="Production Output"
      subtitle={`${getTimeRangeLabel(timeRange)} manufacturing performance`}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      onExport={onExport}
      actions={timeRangeActions}
    >
      {/* View toggle */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setView('output')}
          className={`px-3 py-1 rounded text-sm ${
            view === 'output'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Output
        </button>
        <button
          onClick={() => setView('oee')}
          className={`px-3 py-1 rounded text-sm ${
            view === 'oee' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          OEE Trend
        </button>
        <button
          onClick={() => setView('comparison')}
          className={`px-3 py-1 rounded text-sm ${
            view === 'comparison'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          vs Target
        </button>
      </div>

      {/* Output View - Bar chart of units produced */}
      {view === 'output' && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar dataKey="unitsProduced" name="Units Produced" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* OEE Trend View - Line chart of OEE percentage */}
      {view === 'oee' && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="oeeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            {/* Target line at 85% */}
            <Line
              type="monotone"
              dataKey="oeeTarget"
              name="OEE Target (85%)"
              stroke="#9ca3af"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="oee"
              name="OEE"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              fill="url(#oeeGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Comparison View - Composed chart with actual vs target */}
      {view === 'comparison' && (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar dataKey="target" name="Target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unitsProduced" name="Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="targetPercent"
              name="Target Achievement %"
              stroke="#f59e0b"
              strokeWidth={2}
              yAxisId="right"
              dot={{ r: 3 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 150]}
              stroke="#f59e0b"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value}%`}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Production Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Production Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryMetric
            label="Total Output"
            value={calculateTotal(filteredData, 'unitsProduced')}
            suffix="units"
            color="blue"
          />
          <SummaryMetric
            label="Avg Daily"
            value={calculateAverage(filteredData, 'unitsProduced')}
            suffix="units"
            color="green"
          />
          <SummaryMetric
            label="Avg OEE"
            value={calculateAverage(filteredData, 'oee')}
            suffix="%"
            decimals={1}
            color="purple"
          />
          <SummaryMetric
            label="Target Hit Rate"
            value={calculateTargetHitRate(filteredData)}
            suffix="%"
            decimals={0}
            color="orange"
          />
        </div>
      </div>
    </ChartCard>
  );
}

/**
 * SummaryMetric Component
 */
function SummaryMetric({ label, value, suffix, decimals = 0, color }) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className={`text-xl font-bold ${colorClasses[color] || colorClasses.blue}`}>
        {typeof value === 'number' ? value.toFixed(decimals).toLocaleString() : value}
        <span className="text-sm font-normal text-gray-600 ml-1">{suffix}</span>
      </div>
    </div>
  );
}

/**
 * Helper Functions
 */

function filterDataByTimeRange(data, range) {
  if (!data || data.length === 0) return [];

  const now = new Date();
  const ranges = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const daysAgo = ranges[range] || 30;
  const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  return data.filter((item) => new Date(item.date) >= cutoffDate);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTick(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getTimeRangeLabel(range) {
  const labels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  };
  return labels[range] || 'Last 30 days';
}

function calculateTotal(data, key) {
  if (!data || data.length === 0) return 0;
  return data.reduce((sum, item) => sum + (item[key] || 0), 0);
}

function calculateAverage(data, key) {
  if (!data || data.length === 0) return 0;
  const total = calculateTotal(data, key);
  return total / data.length;
}

function calculateTargetHitRate(data) {
  if (!data || data.length === 0) return 0;
  const daysHit = data.filter((item) => item.unitsProduced >= item.target).length;
  return (daysHit / data.length) * 100;
}

export default ProductionOutputChart;
