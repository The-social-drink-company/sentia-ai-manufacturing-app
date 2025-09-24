import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../services/queryClient';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon,
  ClipboardCheckIcon,
  BellAlertIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function AgentSafety() {
  const [selectedTab, setSelectedTab] = useState('metrics');
  const [editingPolicy, setEditingPolicy] = useState(null);

  // Fetch safety metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['agent', 'safety', 'metrics'],
    queryFn: async () => {
      const response = await fetch('/api/agent/safety/metrics?days=7');
      if (!response.ok) throw new Error('Failed to fetch safety metrics');
      const data = await response.json();
      return data.data;
    },
    refetchInterval: 30000
  });

  // Fetch current policy
  const { data: policy, isLoading: policyLoading } = useQuery({
    queryKey: ['agent', 'policies'],
    queryFn: async () => {
      const response = await fetch('/api/agent/policies');
      if (!response.ok) throw new Error('Failed to fetch policy');
      const data = await response.json();
      return data.data;
    }
  });

  // Fetch blocked plans
  const { data: blockedPlans } = useQuery({
    queryKey: ['agent', 'blocked-plans'],
    queryFn: async () => {
      // Mock data - would come from API
      return [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          user: 'user@example.com',
          reason: 'Tool budget exceeded: forecast.run 5/3 invocations',
          plan: { steps: 5 }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'manager@example.com',
          reason: 'System in freeze window - no changes allowed',
          plan: { steps: 3 }
        }
      ];
    }
  });

  // Update policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async (newPolicy) => {
      const response = await fetch('/api/agent/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPolicy)
      });
      if (!response.ok) throw new Error('Failed to update policy');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agent', 'policies']);
      setEditingPolicy(null);
    }
  });

  const tabs = [
    { id: 'metrics', name: 'Safety Metrics', icon: ChartBarIcon },
    { id: 'policy', name: 'Policy Settings', icon: CogIcon },
    { id: 'blocked', name: 'Blocked Queue', icon: ExclamationTriangleIcon },
    { id: 'telemetry', name: 'Telemetry', icon: BellAlertIcon }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Safety</h1>
            <p className="text-sm text-gray-500">
              Monitor and control agent execution safety policies
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${selectedTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <Icon className="mr-2 h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {selectedTab === 'metrics' && (
          <MetricsTab metrics={metrics} loading={metricsLoading} />
        )}
        
        {selectedTab === 'policy' && (
          <PolicyTab 
            policy={policy} 
            loading={policyLoading}
            onEdit={setEditingPolicy}
            onSave={(p) => updatePolicyMutation.mutate(p)}
          />
        )}
        
        {selectedTab === 'blocked' && (
          <BlockedQueueTab blockedPlans={blockedPlans} />
        )}
        
        {selectedTab === 'telemetry' && (
          <TelemetryTab metrics={metrics} />
        )}
      </div>
    </div>
  );
}

function MetricsTab({ metrics, loading }) {
  if (loading) {
    return <div className="animate-pulse">Loading metrics...</div>;
  }

  const cards = [
    {
      title: 'Blocked Plans',
      value: metrics?.totals?.blockedPlans || 0,
      icon: XCircleIcon,
      color: 'red',
      change: '+12%'
    },
    {
      title: 'Budget Exceeded',
      value: metrics?.totals?.exceededBudgets || 0,
      icon: ExclamationTriangleIcon,
      color: 'yellow',
      change: '-5%'
    },
    {
      title: 'Approvals Granted',
      value: metrics?.totals?.approvalsGranted || 0,
      icon: CheckCircleIcon,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Rate Limit Hits',
      value: metrics?.totals?.rateLimitHits || 0,
      icon: ClockIcon,
      color: 'blue',
      change: '-15%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} />
      ))}
      
      {/* Daily breakdown chart */}
      <div className="col-span-full bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Safety Events (Last 7 Days)
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          {/* Chart would go here */}
          <ChartBarIcon className="h-12 w-12" />
          <span className="ml-2">Chart visualization</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, change }) {
  const colorClasses = {
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600'
  }[color];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          <p className={`mt-2 text-sm ${change.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}>
            {change} from last period
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function PolicyTab({ policy, loading, onEdit, onSave }) {
  const [localPolicy, setLocalPolicy] = useState(policy);

  useEffect(() => {
    setLocalPolicy(policy);
  }, [policy]);

  if (loading) {
    return <div className="animate-pulse">Loading policy...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Policy Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure agent execution policies and safety constraints
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Allowed Tools */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allowed Tools
          </label>
          <div className="space-y-2">
            {localPolicy?.allowedTools?.map((tool) => (
              <div key={tool} className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-900">{tool}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Numeric Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Steps
            </label>
            <input
              type="number"
              value={localPolicy?.maxSteps || 0}
              onChange={(e) => setLocalPolicy({
                ...localPolicy,
                maxSteps: parseInt(e.target.value)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Wall Clock (ms)
            </label>
            <input
              type="number"
              value={localPolicy?.wallClockMs || 0}
              onChange={(e) => setLocalPolicy({
                ...localPolicy,
                wallClockMs: parseInt(e.target.value)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Mode Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Mode
          </label>
          <select
            value={localPolicy?.defaultMode || null}
            onChange={(e) => setLocalPolicy({
              ...localPolicy,
              defaultMode: e.target.value
            })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
          >
            <option value="DRY_RUN">Dry Run</option>
            <option value="PROPOSE">Propose</option>
            <option value="EXECUTE">Execute (Admin Only)</option>
          </select>
        </div>

        {/* Security Settings */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localPolicy?.requireStepUp || false}
              onChange={(e) => setLocalPolicy({
                ...localPolicy,
                requireStepUp: e.target.checked
              })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900">
              Require step-up authentication for EXECUTE mode
            </span>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={() => onSave(localPolicy)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockedQueueTab({ blockedPlans }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Blocked Plans</h3>
        <p className="mt-1 text-sm text-gray-500">
          Review plans that were blocked by safety policies
        </p>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Steps
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {blockedPlans?.map((plan) => (
            <tr key={plan.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(plan.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {plan.user}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <span className="text-red-600">{plan.reason}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {plan.plan.steps}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-purple-600 hover:text-purple-900">
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(!blockedPlans || blockedPlans.length === 0) && (
        <div className="p-6 text-center text-gray-500">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">No blocked plans</p>
        </div>
      )}
    </div>
  );
}

function TelemetryTab({ metrics }) {
  return (
    <div className="space-y-6">
      {/* Real-time telemetry */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Real-time Safety Telemetry
        </h3>
        
        <div className="space-y-4">
          <TelemetryItem
            label="Active Rate Limits"
            value="3 IPs, 1 User"
            status="warning"
          />
          <TelemetryItem
            label="Freeze Window Status"
            value="Inactive"
            status="success"
          />
          <TelemetryItem
            label="Policy Violations (24h)"
            value="12"
            status="error"
          />
          <TelemetryItem
            label="Pending Approvals"
            value="2"
            status="info"
          />
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Audit Events
        </h3>
        <div className="space-y-2 text-sm">
          <AuditEntry
            time="2 mins ago"
            event="Policy updated"
            user="admin@example.com"
            details="Max steps changed from 10 to 12"
          />
          <AuditEntry
            time="15 mins ago"
            event="Plan blocked"
            user="user@example.com"
            details="Exceeded working capital cap"
          />
          <AuditEntry
            time="1 hour ago"
            event="Approval granted"
            user="manager@example.com"
            details="EXECUTE mode for stock optimization"
          />
        </div>
      </div>
    </div>
  );
}

function TelemetryItem({ label, value, status }) {
  const statusColors = {
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100'
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {value}
      </span>
    </div>
  );
}

function AuditEntry({ time, event, user, details }) {
  return (
    <div className="border-l-2 border-gray-200 pl-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-gray-900">{event}</span>
          <span className="ml-2 text-gray-500">by {user}</span>
          <p className="text-gray-600">{details}</p>
        </div>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
    </div>
  );
}