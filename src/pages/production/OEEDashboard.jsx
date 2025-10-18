/**
 * OEE (Overall Equipment Effectiveness) Dashboard Component
 *
 * Comprehensive OEE monitoring with formula breakdown:
 * - OEE = Availability × Performance × Quality
 * - Real-time metrics and trends
 * - Machine-by-machine breakdown
 * - Loss analysis (Six Big Losses)
 * - Shift comparison
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Target,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ComposedChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useSSE } from '../../hooks/useSSE';

/**
 * OEE Metric Card Component
 */
// eslint-disable-next-line no-unused-vars
function OEEMetricCard({ label, value, target, formula, breakdown, icon: Icon, color }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const percentage = value;
  const targetPercentage = target;
  const difference = percentage - targetPercentage;
  const status = percentage >= targetPercentage ? 'good' : percentage >= targetPercentage - 5 ? 'warning' : 'poor';

  const statusColors = {
    good: 'border-green-500 bg-green-50',
    warning: 'border-yellow-500 bg-yellow-50',
    poor: 'border-red-500 bg-red-50',
  };

  const trendColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    poor: 'text-red-600',
  };

  return (
    <div className={`rounded-lg border-2 ${statusColors[status]} p-6 transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-xs text-gray-500">{formula}</p>
          </div>
        </div>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-gray-400 hover:text-gray-600"
        >
          {showBreakdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Value */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">{percentage.toFixed(1)}%</span>
          <span className={`text-sm font-medium ${trendColors[status]}`}>
            {difference >= 0 ? '+' : ''}{difference.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-600">Target: {targetPercentage}%</span>
          {difference >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all ${
            status === 'good' ? 'bg-green-500' :
            status === 'warning' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        <div
          className="absolute top-0 h-3 w-0.5 bg-gray-800"
          style={{ left: `${targetPercentage}%` }}
        />
      </div>

      {/* Breakdown */}
      {showBreakdown && breakdown && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{key}</span>
              <span className="font-medium text-gray-900">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Machine OEE Table
 */
function MachineOEETable({ machines }) {
  const [sortBy, setSortBy] = useState('oee');
  const [sortOrder, setSortOrder] = useState('desc');

  const sortedMachines = [...machines].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getStatusBadge = (value, target) => {
    const status = value >= target ? 'good' : value >= target - 5 ? 'warning' : 'poor';
    const colors = {
      good: 'bg-green-100 text-green-700 border-green-300',
      warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      poor: 'bg-red-100 text-red-700 border-red-300',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[status]}`}>
        {value.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Machine
              </th>
              <th
                onClick={() => handleSort('oee')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                OEE {sortBy === 'oee' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('availability')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Availability {sortBy === 'availability' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('performance')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Performance {sortBy === 'performance' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('quality')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Quality {sortBy === 'quality' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedMachines.map((machine) => (
              <tr key={machine.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="font-medium text-gray-900">{machine.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(machine.oee, 85)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(machine.availability, 90)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(machine.performance, 95)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(machine.quality, 99)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    machine.status === 'running' ? 'bg-green-100 text-green-700' :
                    machine.status === 'idle' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {machine.status}
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
 * Six Big Losses Analysis
 */
function SixBigLossesChart({ lossData }) {
  const losses = [
    { category: 'Breakdowns', value: lossData.breakdowns || 0, color: '#ef4444' },
    { category: 'Setup/Adjustments', value: lossData.setup || 0, color: '#f97316' },
    { category: 'Small Stops', value: lossData.smallStops || 0, color: '#f59e0b' },
    { category: 'Reduced Speed', value: lossData.reducedSpeed || 0, color: '#eab308' },
    { category: 'Startup Rejects', value: lossData.startupRejects || 0, color: '#84cc16' },
    { category: 'Production Rejects', value: lossData.productionRejects || 0, color: '#22c55e' },
  ];

  const totalLoss = losses.reduce((sum, loss) => sum + loss.value, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Six Big Losses Analysis
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={losses} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="category" width={150} />
          <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
          <Bar dataKey="value" fill="#3b82f6">
            {losses.map((entry, index) => (
              <Bar key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {losses.map((loss) => (
          <div key={loss.category} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: loss.color }}
            />
            <div className="flex-1">
              <p className="text-xs text-gray-600">{loss.category}</p>
              <p className="text-sm font-medium text-gray-900">
                {loss.value.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Loss</span>
          <span className="text-lg font-bold text-red-600">{totalLoss.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

/**
 * OEE Trend Chart
 */
function OEETrendChart({ trendData }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        OEE Trend (Last 30 Days)
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

          <ReferenceLine y={85} stroke="#10b981" strokeDasharray="3 3" label="Target: 85%" />

          <Area
            type="monotone"
            dataKey="oee"
            fill="#3b82f6"
            fillOpacity={0.1}
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="availability"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="performance"
            stroke="#ec4899"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="quality"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="oee"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Shift Comparison Radar Chart
 */
function ShiftComparisonChart({ shiftData }) {
  const radarData = [
    { metric: 'OEE', ...shiftData.reduce((acc, shift) => ({ ...acc, [shift.name]: shift.oee }), {}) },
    { metric: 'Availability', ...shiftData.reduce((acc, shift) => ({ ...acc, [shift.name]: shift.availability }), {}) },
    { metric: 'Performance', ...shiftData.reduce((acc, shift) => ({ ...acc, [shift.name]: shift.performance }), {}) },
    { metric: 'Quality', ...shiftData.reduce((acc, shift) => ({ ...acc, [shift.name]: shift.quality }), {}) },
  ];

  const colors = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Shift Comparison
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
          <Legend />

          {shiftData.map((shift, index) => (
            <Radar
              key={shift.name}
              name={shift.name}
              dataKey={shift.name}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.3}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Main OEE Dashboard Component
 */
export default function OEEDashboard() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('today');
  const [selectedMachine, setSelectedMachine] = useState('all');

  // Fetch OEE data
  const { data, isLoading, error } = useQuery({
    queryKey: ['production', 'oee', dateRange, selectedMachine],
    queryFn: async () => {
      const params = new URLSearchParams({ dateRange, machine: selectedMachine });
      const response = await fetch(`/api/v1/production/oee?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch OEE data');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000,
  });

  // SSE for real-time OEE updates
  const { connected } = useSSE('production', {
    enabled: true,
    onMessage: (message) => {
      if (message.type === 'oee:update') {
        queryClient.invalidateQueries(['production', 'oee']);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading OEE data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading OEE data: {error.message}</p>
      </div>
    );
  }

  const { overall, machines = [], trend = [], shifts = [], losses = {} } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OEE Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overall Equipment Effectiveness Monitoring
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
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Machines</option>
            {machines.map(machine => (
              <option key={machine.id} value={machine.id}>
                {machine.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* OEE Formula Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">OEE Calculation</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">OEE =</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded font-semibold">
              Availability
            </span>
            <span className="text-gray-500">×</span>
            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded font-semibold">
              Performance
            </span>
            <span className="text-gray-500">×</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded font-semibold">
              Quality
            </span>
          </div>
        </div>
      </div>

      {/* OEE Metrics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OEEMetricCard
          label="Overall OEE"
          value={overall?.oee || 0}
          target={85}
          formula="A × P × Q"
          breakdown={{
            'World Class': '85%+',
            'Current': `${(overall?.oee || 0).toFixed(1)}%`,
          }}
          icon={Activity}
          color="bg-blue-600"
        />

        <OEEMetricCard
          label="Availability"
          value={overall?.availability || 0}
          target={90}
          formula="Run Time / Planned Time"
          breakdown={{
            'Planned Time': `${overall?.breakdown?.plannedTime || 0} min`,
            'Run Time': `${overall?.breakdown?.runTime || 0} min`,
            'Downtime': `${overall?.breakdown?.downtime || 0} min`,
          }}
          icon={Clock}
          color="bg-purple-600"
        />

        <OEEMetricCard
          label="Performance"
          value={overall?.performance || 0}
          target={95}
          formula="(Ideal × Total) / Run Time"
          breakdown={{
            'Ideal Cycle Time': `${overall?.breakdown?.idealCycleTime || 0}s`,
            'Total Count': `${overall?.breakdown?.totalCount || 0} units`,
            'Run Time': `${overall?.breakdown?.runTime || 0} min`,
          }}
          icon={Zap}
          color="bg-pink-600"
        />

        <OEEMetricCard
          label="Quality"
          value={overall?.quality || 0}
          target={99}
          formula="Good Count / Total Count"
          breakdown={{
            'Total Count': `${overall?.breakdown?.totalCount || 0} units`,
            'Good Count': `${overall?.breakdown?.goodCount || 0} units`,
            'Reject Count': `${overall?.breakdown?.rejectCount || 0} units`,
          }}
          icon={CheckCircle2}
          color="bg-green-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        <OEETrendChart trendData={trend} />
        <SixBigLossesChart lossData={losses} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        <ShiftComparisonChart shiftData={shifts} />

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Best Performing Machine</span>
              <span className="font-semibold text-gray-900">
                {machines.length > 0 ? machines[0].name : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Downtime</span>
              <span className="font-semibold text-gray-900">
                {overall?.breakdown?.downtime || 0} min
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Units Produced</span>
              <span className="font-semibold text-gray-900">
                {overall?.breakdown?.totalCount || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Defect Rate</span>
              <span className="font-semibold text-red-600">
                {overall?.breakdown?.rejectCount && overall?.breakdown?.totalCount
                  ? ((overall.breakdown.rejectCount / overall.breakdown.totalCount) * 100).toFixed(2)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Breakdown Table */}
      <MachineOEETable machines={machines} />
    </div>
  );
}
