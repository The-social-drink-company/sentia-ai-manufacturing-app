import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../services/queryClient';
import {
  CalendarIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const PRESETS = [
  { key: 'protect-service', name: 'Protect Service Levels', icon: BoltIcon },
  { key: 'fx-shock', name: 'FX Shock Resilience', icon: CurrencyDollarIcon },
  { key: 'pre-close', name: 'Pre-Close Health Check', icon: ChartBarIcon },
  { key: 'promo-uplift', name: 'Promotion Uplift Guardrail', icon: CheckCircleIcon }
];

export default function AutopilotTab() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Check if autopilot is enabled
  const isEnabled = import.meta.env.VITE_FEATURE_AGENT_AUTOPILOT === 'true';

  // Fetch schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['agent', 'schedules'],
    queryFn: async () => {
      const response = await fetch('/api/agent/schedules');
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      return data.data;
    },
    enabled: isEnabled,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch metrics
  const { data: metrics } = useQuery({
    queryKey: ['agent', 'schedules', 'metrics'],
    queryFn: async () => {
      const response = await fetch('/api/agent/schedules/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      return data.data;
    },
    enabled: isEnabled,
    refetchInterval: 60000 // Refresh every minute
  });

  // Toggle schedule mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }) => {
      const response = await fetch(`/api/agent/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (!response.ok) throw new Error('Failed to update schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agent', 'schedules']);
    }
  });

  // Run now mutation
  const runNowMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/agent/schedules/${id}/run-now`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to run schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agent', 'schedules', 'metrics']);
    }
  });

  if (!isEnabled) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Autopilot feature is disabled. Set FEATURE_AGENT_AUTOPILOT=true to enable.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Autopilot Schedules</h2>
          <p className="mt-1 text-sm text-gray-500">
            Automated agent runs with evaluation and gating
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Schedule</span>
        </button>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            title="Total Schedules"
            value={metrics.totalSchedules}
            icon={CalendarIcon}
          />
          <MetricCard
            title="Active"
            value={metrics.activeSchedules}
            icon={CheckCircleIcon}
            color="green"
          />
          <MetricCard
            title="Running Now"
            value={metrics.runningNow}
            icon={PlayIcon}
            color="yellow"
          />
          <MetricCard
            title="Runs (24h)"
            value={metrics.runsLast24h}
            icon={ChartBarIcon}
            color="blue"
          />
        </div>
      )}

      {/* Schedules List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Run
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules?.map((schedule) => (
              <ScheduleRow
                key={schedule.id}
                schedule={schedule}
                onToggle={() => toggleMutation.mutate({
                  id: schedule.id,
                  enabled: !schedule.enabled
                })}
                onRunNow={() => runNowMutation.mutate(schedule.id)}
                onEdit={() => setSelectedSchedule(schedule)}
              />
            ))}
          </tbody>
        </table>
        
        {(!schedules || schedules.length === 0) && (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new autopilot schedule.
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || selectedSchedule) && (
        <ScheduleModal
          schedule={selectedSchedule}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedSchedule(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries(['agent', 'schedules']);
            setShowCreateModal(false);
            setSelectedSchedule(null);
          }}
        />
      )}

      {/* ROI Summary */}
      <ROISummary />
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color = 'gray' }) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    blue: 'bg-blue-100 text-blue-600'
  }[color];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value || 0}</p>
        </div>
      </div>
    </div>
  );
}

function ScheduleRow({ schedule, onToggle, onRunNow, onEdit }) {
  const preset = PRESETS.find(p => p.key === schedule.presetKey);
  const PresetIcon = preset?.icon || CalendarIcon;

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <PresetIcon className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
            <div className="text-xs text-gray-500">{schedule.cron}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">{preset?.name || '-'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {schedule.mode}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {schedule.lastRunAt ? new Date(schedule.lastRunAt).toLocaleString() : 'Never'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            schedule.enabled ? 'bg-green-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              schedule.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={onRunNow}
          className="text-purple-600 hover:text-purple-900 mr-4"
        >
          Run Now
        </button>
        <button
          onClick={onEdit}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Edit
        </button>
      </td>
    </tr>
  );
}

function ScheduleModal({ schedule, onClose, onSave }) {
  const [formData, setFormData] = useState(schedule || {
    name: '',
    cron: '0 9 * * 1', // Every Monday at 9 AM
    tz: 'Europe/London',
    mode: 'PROPOSE',
    presetKey: 'protect-service',
    enabled: true
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const url = schedule 
        ? `/api/agent/schedules/${schedule.id}`
        : '/api/agent/schedules';
      const method = schedule ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to save schedule');
      return response.json();
    },
    onSuccess: () => {
      onSave();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {schedule ? 'Edit Schedule' : 'Create Schedule'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cron Expression</label>
            <input
              type="text"
              value={formData.cron}
              onChange={(e) => setFormData({ ...formData, cron: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-500">e.g., "0 9 * * 1" for every Monday at 9 AM</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Preset</label>
            <select
              value={formData.presetKey}
              onChange={(e) => setFormData({ ...formData, presetKey: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              {PRESETS.map(preset => (
                <option key={preset.key} value={preset.key}>{preset.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mode</label>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="DRY_RUN">Dry Run</option>
              <option value="PROPOSE">Propose</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Enable schedule
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ROISummary() {
  // Mock ROI data - would come from API in real implementation
  const roi = {
    wcUnlocked: 250000,
    hoursSaved: 120,
    accuracyImprovement: 8.5,
    stockoutsAvoided: 23
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
      <h3 className="text-xl font-semibold mb-4">ROI Summary (Last 30 Days)</h3>
      <div className="grid grid-cols-4 gap-6">
        <div>
          <p className="text-3xl font-bold">Â£{(roi.wcUnlocked / 1000).toFixed(0)}K</p>
          <p className="text-sm opacity-90">Working Capital Unlocked</p>
        </div>
        <div>
          <p className="text-3xl font-bold">{roi.hoursSaved}h</p>
          <p className="text-sm opacity-90">Hours Saved</p>
        </div>
        <div>
          <p className="text-3xl font-bold">+{roi.accuracyImprovement}%</p>
          <p className="text-sm opacity-90">Accuracy Improvement</p>
        </div>
        <div>
          <p className="text-3xl font-bold">{roi.stockoutsAvoided}</p>
          <p className="text-sm opacity-90">Stockouts Avoided</p>
        </div>
      </div>
    </div>
  );
}
