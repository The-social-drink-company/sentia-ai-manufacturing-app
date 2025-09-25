import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../services/queryClient';
import {
  SparklesIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CogIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AGENT_PRESETS = [
  {
    id: 'protect-service',
    name: 'Protect Service Levels',
    goal: 'Protect service with ≤£{budget} WC (90 days)',
    params: { budget: 1000000 }
  },
  {
    id: 'drift-watch',
    name: 'Drift Watch & Retrain',
    goal: 'Drift watch & retrain if MAPE > {target}',
    params: { target: 0.1 }
  },
  {
    id: 'fx-shock',
    name: 'EU FX Shock Analysis',
    goal: 'EU FX shock {shock}%: re-plan stock & WC',
    params: { shock: -5 }
  }
];

export default function AgentConsole({ isOpen, onClose }) {
  const [goal, setGoal] = useState('');
  const [mode, setMode] = useState('DRY_RUN');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [activeRunId, setActiveRunId] = useState(null);

  // Check if feature is enabled
  const isEnabled = import.meta.env.VITE_FEATURE_AGENT === 'true';

  // Fetch available tools
  const { data: tools } = useQuery({
    queryKey: ['agent', 'tools'],
    queryFn: async () => {
      const response = await fetch('/api/agent/tools');
      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();
      return data.data;
    },
    enabled: isEnabled && isOpen
  });

  // Run agent mutation
  const runMutation = useMutation({
    mutationFn: async (params) => {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Failed to start agent run');
      const data = await response.json();
      return data.data;
    },
    onSuccess: (data) => {
      setActiveRunId(data.runId);
      queryClient.invalidateQueries(['agent', 'runs']);
    }
  });

  // Get run status
  const { data: runStatus } = useQuery({
    queryKey: ['agent', 'runs', activeRunId],
    queryFn: async () => {
      const response = await fetch(`/api/agent/runs/${activeRunId}`);
      if (!response.ok) throw new Error('Failed to get run status');
      const data = await response.json();
      return data.data;
    },
    enabled: !!activeRunId,
    refetchInterval: (data) => {
      if (!data || ['COMPLETED', 'FAILED'].includes(data.status)) {
        return false;
      }
      return 2000; // Poll every 2 seconds while running
    }
  });

  // Approve step mutation
  const approveMutation = useMutation({
    mutationFn: async ({ runId, stepId }) => {
      const response = await fetch(`/api/agent/runs/${runId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId })
      });
      if (!response.ok) throw new Error('Failed to approve step');
      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agent', 'runs', activeRunId]);
    }
  });

  const handlePresetSelect = useCallback((preset) => {
    setSelectedPreset(preset);
    let processedGoal = preset.goal;
    Object.entries(preset.params).forEach(([key, value]) => {
      processedGoal = processedGoal.replace(`{${key}}`, value);
    });
    setGoal(processedGoal);
  }, []);

  const handleRun = useCallback(() => {
    if (!goal) return;
    
    runMutation.mutate({
      goal,
      mode,
      scope: {},
      budgets: selectedPreset?.params || {}
    });
  }, [goal, mode, selectedPreset, runMutation]);

  if (!isEnabled) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Agent feature is disabled. Set FEATURE_AGENT=true to enable.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed right-0 top-0 h-full bg-white shadow-xl transition-transform z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`} style={{ width: '480px' }}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-6 w-6" />
              <h2 className="text-lg font-semibold">Agent Console</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Goal Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Describe what you want the agent to do..."
            />
          </div>

          {/* Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Presets
            </label>
            <div className="space-y-2">
              {AGENT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    selectedPreset?.id === preset.id
                      ? 'bg-purple-50 border-purple-300'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{preset.goal}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Execution Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="DRY_RUN">Dry Run (Preview Only)</option>
              <option value="PROPOSE">Propose (Requires Approval)</option>
              <option value="EXECUTE">Execute (Admin Only)</option>
            </select>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={!goal || runMutation.isPending}
            className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <PlayIcon className="h-5 w-5" />
            <span>{runMutation.isPending ? 'Running...' : 'Run Agent'}</span>
          </button>

          {/* Run Status */}
          {runStatus && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Run Status</h3>
                <StatusBadge status={runStatus.status} />
              </div>

              {/* Plan Steps */}
              {runStatus.steps && runStatus.steps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Execution Plan</h4>
                  <div className="space-y-2">
                    {runStatus.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center space-x-2">
                        <StepIcon status={step.status} />
                        <span className="text-sm flex-1">
                          Step {index + 1}: {step.toolId}
                        </span>
                        {step.status === 'PENDING' && mode === 'PROPOSE' && (
                          <button
                            onClick={() => approveMutation.mutate({
                              runId: runStatus.id,
                              stepId: step.id
                            })}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outcomes */}
              {runStatus.outcomes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Projected Outcomes</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {runStatus.outcomes.expectedMetrics && Object.entries(runStatus.outcomes.expectedMetrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reflection */}
              {runStatus.reflection && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis</h4>
                  <div className="text-sm text-gray-600">
                    <div>Quality Score: {runStatus.reflection.outcomeQuality?.score?.toFixed(2) || 'N/A'}</div>
                    <div>Rating: {runStatus.reflection.outcomeQuality?.rating || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {runStatus.nextSteps && runStatus.nextSteps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Next Steps</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {runStatus.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-600 mr-2">→</span>
                        {step.action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Available Tools */}
          {tools && tools.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Available Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                {tools.map(tool => (
                  <div key={tool.id} className="text-xs p-2 bg-gray-50 rounded flex items-center space-x-1">
                    <CogIcon className="h-3 w-3 text-gray-400" />
                    <span>{tool.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Mode: {mode}</span>
            <span>Tools: {tools?.length || 0} available</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    PLANNING: { color: 'blue', icon: DocumentTextIcon },
    EXECUTING: { color: 'yellow', icon: CogIcon },
    REFLECTING: { color: 'purple', icon: SparklesIcon },
    COMPLETED: { color: 'green', icon: CheckCircleIcon },
    FAILED: { color: 'red', icon: XCircleIcon }
  }[status] || { color: 'gray', icon: ClockIcon };

  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-${config.color}-100 text-${config.color}-700`}>
      <Icon className="h-3 w-3" />
      <span>{status}</span>
    </div>
  );
}

function StepIcon({ status }) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    case 'FAILED':
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    case 'EXECUTING':
      return <CogIcon className="h-4 w-4 text-yellow-500 animate-spin" />;
    default:
      return <ClockIcon className="h-4 w-4 text-gray-400" />;
  }
}