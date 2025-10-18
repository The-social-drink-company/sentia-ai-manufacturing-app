import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSSE } from '@/hooks/useSSE';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Gauge,
  Package,
  AlertCircle,
} from 'lucide-react';

/**
 * ProductionDashboard Component
 *
 * Main production monitoring interface with:
 * - Active jobs board (summary view)
 * - OEE metrics (Availability, Performance, Quality)
 * - Downtime tracker
 * - Quality metrics (First Pass Yield, Defect Rate)
 * - Real-time updates via SSE
 */
function ProductionDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch production overview data
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['production', 'overview'],
    queryFn: async () => {
      const response = await fetch('/api/v1/production/overview');
      if (!response.ok) throw new Error('Failed to fetch production overview');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // SSE for real-time production updates
    const { connected } = useSSE('production', {
    enabled: true,
    onMessage: (message) => {
      // Invalidate queries based on update type
      if (message.type === 'job:status') {
        queryClient.invalidateQueries(['production', 'overview']);
        queryClient.invalidateQueries(['production', 'jobs']);
      }
      if (message.type === 'oee:update') {
        queryClient.invalidateQueries(['production', 'overview']);
        queryClient.invalidateQueries(['production', 'oee']);
      }
      if (message.type === 'downtime:event') {
        queryClient.invalidateQueries(['production', 'overview']);
        queryClient.invalidateQueries(['production', 'downtime']);
      }
      if (message.type === 'quality:alert') {
        queryClient.invalidateQueries(['production', 'overview']);
        queryClient.invalidateQueries(['production', 'quality']);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading production dashboard...</p>
        </div>
      </div>
    );
  }

  const {
    activeJobs = [],
    oee = {},
    downtime = {},
    quality = {},
    alerts = [],
  } = overviewData || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Real-time manufacturing operations monitoring • Target OEE: &gt;85%
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* SSE Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-700">
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                {alerts.length} Critical Alert{alerts.length > 1 ? 's' : ''}
              </h2>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded p-3">
                    <div>
                      <p className="font-medium text-red-900">{alert.title}</p>
                      <p className="text-sm text-red-700">{alert.description}</p>
                    </div>
                    <button
                      onClick={() => navigate(alert.actionUrl)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                    >
                      {alert.actionLabel || 'View'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OEE Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <OEECard
          label="Overall OEE"
          value={oee.overall || 0}
          target={85}
          icon={Gauge}
          trend={oee.trend}
          onClick={() => navigate('/production/oee')}
        />
        <OEECard
          label="Availability"
          value={oee.availability || 0}
          target={90}
          icon={Clock}
          trend={oee.availabilityTrend}
          onClick={() => navigate('/production/oee')}
        />
        <OEECard
          label="Performance"
          value={oee.performance || 0}
          target={95}
          icon={TrendingUp}
          trend={oee.performanceTrend}
          onClick={() => navigate('/production/oee')}
        />
        <OEECard
          label="Quality"
          value={oee.quality || 0}
          target={99}
          icon={CheckCircle}
          trend={oee.qualityTrend}
          onClick={() => navigate('/production/quality')}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Jobs Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Jobs Board */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Active Production Jobs</h2>
                <button
                  onClick={() => navigate('/production/jobs')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Job Board
                </button>
              </div>
            </div>
            <div className="p-6">
              {activeJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No active production jobs</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {activeJobs.slice(0, 4).map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClick={() => navigate(`/production/jobs/${job.id}`)}
                    />
                  ))}
                </div>
              )}
              {activeJobs.length > 4 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/production/jobs')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all {activeJobs.length} active jobs →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quality Metrics Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Quality Metrics</h2>
                <button
                  onClick={() => navigate('/production/quality')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Details →
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <MetricCard
                  label="First Pass Yield"
                  value={`${quality.fpy || 0}%`}
                  target={95}
                  actual={quality.fpy || 0}
                  status={getQualityStatus(quality.fpy, 95)}
                />
                <MetricCard
                  label="Defect Rate"
                  value={`${quality.defectRate || 0}%`}
                  target={2}
                  actual={quality.defectRate || 0}
                  status={getQualityStatus(100 - quality.defectRate, 98)}
                  inverse
                />
                <MetricCard
                  label="Scrap Rate"
                  value={`${quality.scrapRate || 0}%`}
                  target={1}
                  actual={quality.scrapRate || 0}
                  status={getQualityStatus(100 - quality.scrapRate, 99)}
                  inverse
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Downtime Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Downtime</h2>
                <button
                  onClick={() => navigate('/production/downtime')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {downtime.totalMinutes || 0}
                  </span>
                  <span className="text-gray-600">min</span>
                </div>
                <p className="text-sm text-gray-600">Total downtime today</p>
              </div>

              {downtime.events && downtime.events.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent Events</p>
                  {downtime.events.slice(0, 3).map((event, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                      <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${getSeverityColor(event.severity)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.reason}
                        </p>
                        <p className="text-xs text-gray-600">{event.duration} min</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No downtime events today</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <ActionButton
                label="View Job Board"
                onClick={() => navigate('/production/jobs')}
              />
              <ActionButton
                label="OEE Dashboard"
                onClick={() => navigate('/production/oee')}
              />
              <ActionButton
                label="Downtime Tracker"
                onClick={() => navigate('/production/downtime')}
              />
              <ActionButton
                label="Quality Metrics"
                onClick={() => navigate('/production/quality')}
              />
              <ActionButton
                label="Maintenance Schedule"
                onClick={() => navigate('/production/maintenance')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * OEECard Component
 */
function OEECard({ label, value, target, icon: Icon, trend, onClick }) {
  const percentage = value;
  const status = getOEEStatus(percentage, target);
  const trendValue = trend?.value || 0;
  const trendDirection = trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral';

  const statusColors = {
    excellent: 'border-green-500 bg-green-50',
    good: 'border-blue-500 bg-blue-50',
    warning: 'border-yellow-500 bg-yellow-50',
    critical: 'border-red-500 bg-red-50',
  };

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-lg border-2 text-left transition-all hover:shadow-lg ${statusColors[status]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-6 h-6 text-gray-700" />
        <span className="text-xs font-semibold text-gray-600">Target: {target}%</span>
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{percentage.toFixed(1)}%</span>
        {trendDirection !== 'neutral' && (
          <span className={`text-sm font-medium flex items-center gap-1 ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trendDirection === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trendValue).toFixed(1)}%
          </span>
        )}
      </div>
    </button>
  );
}

/**
 * JobCard Component
 */
function JobCard({ job, onClick }) {
  const statusConfig = {
    scheduled: { label: 'Scheduled', className: 'bg-gray-100 text-gray-800' },
    in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
    paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-800' },
  };

  const config = statusConfig[job.status] || statusConfig.scheduled;

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-left transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{job.name}</p>
          <p className="text-sm text-gray-600">{job.productName}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${config.className}`}>
          {config.label}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {job.completedUnits || 0} / {job.targetUnits} units
        </span>
        <span className="font-semibold text-gray-900">
          {job.progress || 0}%
        </span>
      </div>
      {job.status === 'in_progress' && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${job.progress || 0}%` }}
          />
        </div>
      )}
    </button>
  );
}

/**
 * MetricCard Component
 */
function MetricCard({ label, value, target, status, inverse = false }) {
  const statusColors = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${statusColors[status]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">
        Target: {inverse ? '<' : '>'}{target}%
      </p>
    </div>
  );
}

/**
 * ActionButton Component
 */
function ActionButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-medium text-gray-700 transition-colors"
    >
      {label}
    </button>
  );
}

/**
 * Helper Functions
 */

function getOEEStatus(value, target) {
  if (value >= target) return 'excellent';
  if (value >= target * 0.95) return 'good';
  if (value >= target * 0.85) return 'warning';
  return 'critical';
}

function getQualityStatus(value, target) {
  if (value >= target) return 'excellent';
  if (value >= target * 0.98) return 'good';
  if (value >= target * 0.95) return 'warning';
  return 'critical';
}

function getSeverityColor(severity) {
  const colors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };
  return colors[severity] || colors.medium;
}

export default ProductionDashboard;
