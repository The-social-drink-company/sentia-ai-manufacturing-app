import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../services/queryClient';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default function ModelsBaselines() {
  const [selectedType, setSelectedType] = useState('forecast');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  // Check if feature is enabled
  const isEnabled = import.meta.env.VITE_FEATURE_MODEL_REGISTRY === 'true';

  // Fetch artifacts
  const { data: artifacts, isLoading: artifactsLoading } = useQuery({
    queryKey: ['models', 'artifacts', selectedType],
    queryFn: async () => {
      const response = await fetch(`/api/models/artifacts?type=${selectedType}`);
      if (!response.ok) throw new Error('Failed to fetch artifacts');
      const data = await response.json();
      return data.data;
    },
    enabled: isEnabled,
    refetchInterval: 60000
  });

  // Fetch current baseline
  const { data: currentBaseline } = useQuery({
    queryKey: ['models', 'baseline', selectedType],
    queryFn: async () => {
      const response = await fetch(`/api/models/baseline/${selectedType}`);
      if (!response.ok) throw new Error('Failed to fetch baseline');
      const data = await response.json();
      return data.data;
    },
    enabled: isEnabled
  });

  // Fetch baseline history
  const { data: baselineHistory } = useQuery({
    queryKey: ['models', 'baseline-history', selectedType],
    queryFn: async () => {
      const response = await fetch(`/api/models/baseline-history/${selectedType}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      return data.data;
    },
    enabled: isEnabled
  });

  // Propose baseline change mutation
  const proposeBaselineMutation = useMutation({
    mutationFn: async ({ artifactId, notes }) => {
      const response = await fetch('/api/models/baseline/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          artifactId,
          notes
        })
      });
      if (!response.ok) throw new Error('Failed to propose baseline');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['models', 'baseline']);
      queryClient.invalidateQueries(['models', 'baseline-history']);
      setShowApprovalModal(false);
      setSelectedArtifact(null);
    }
  });

  // Rollback baseline mutation
  const rollbackMutation = useMutation({
    mutationFn: async (baselineId) => {
      const response = await fetch(`/api/models/baseline/${baselineId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Manual rollback from admin panel'
        })
      });
      if (!response.ok) throw new Error('Failed to rollback');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['models', 'baseline']);
      queryClient.invalidateQueries(['models', 'baseline-history']);
    }
  });

  if (!isEnabled) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Model Registry feature is disabled. Set FEATURE_MODEL_REGISTRY=true to enable.
          </span>
        </div>
      </div>
    );
  }

  const modelTypes = [
    { key: 'forecast', name: 'Forecast', icon: ChartBarIcon },
    { key: 'opt', name: 'Optimization', icon: ArrowTrendingUpIcon },
    { key: 'wc', name: 'Working Capital', icon: DocumentArrowDownIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Models & Baselines</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage model artifacts and baseline versions with rollback
          </p>
        </div>
      </div>

      {/* Model Type Selector */}
      <div className="flex space-x-2">
        {modelTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.key}
              onClick={() => setSelectedType(type.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                selectedType === type.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{type.name}</span>
            </button>
          );
        })}
      </div>

      {/* Current Baseline */}
      <CurrentBaselineCard 
        baseline={currentBaseline}
        type={selectedType}
        onRollback={(id) => rollbackMutation.mutate(id)}
      />

      {/* Recent Artifacts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Artifacts</h3>
        </div>
        
        {artifactsLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {artifacts?.slice(0, 5).map((artifact) => (
              <ArtifactRow
                key={artifact.id}
                artifact={artifact}
                isBaseline={currentBaseline?.artifactId === artifact.id}
                onPropose={() => {
                  setSelectedArtifact(artifact);
                  setShowApprovalModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Baseline History */}
      <BaselineHistorySection 
        history={baselineHistory}
        onRollback={(id) => rollbackMutation.mutate(id)}
      />

      {/* Performance Trends */}
      <PerformanceTrendsSection type={selectedType} />

      {/* Approval Modal */}
      {showApprovalModal && selectedArtifact && (
        <ApprovalModal
          artifact={selectedArtifact}
          currentBaseline={currentBaseline}
          onApprove={(notes) => proposeBaselineMutation.mutate({
            artifactId: selectedArtifact.id,
            notes
          })}
          onCancel={() => {
            setShowApprovalModal(false);
            setSelectedArtifact(null);
          }}
        />
      )}
    </div>
  );
}

function CurrentBaselineCard({ baseline, type, onRollback }) {
  if (!baseline) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">No baseline set for {type}</p>
        </div>
      </div>
    );
  }

  const metrics = baseline.artifact?.metricsJson || {};
  
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Current Baseline</h3>
        <CheckCircleIcon className="h-6 w-6" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(metrics).slice(0, 4).map(([key, value]) => (
          <div key={key}>
            <p className="text-sm opacity-90">{formatMetricName(key)}</p>
            <p className="text-2xl font-bold">{formatMetricValue(value)}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm opacity-90">
          <p>Active since: {new Date(baseline.activeFrom).toLocaleDateString()}</p>
          <p>Version: {baseline.artifact?.version || 'N/A'}</p>
        </div>
        
        {baseline.approvedAt && (
          <div className="text-sm text-right opacity-90">
            <p>Approved by: {baseline.approverId?.slice(0, 8)}</p>
            <p>{new Date(baseline.approvedAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ArtifactRow({ artifact, isBaseline, onPropose }) {
  const metrics = artifact.metricsJson || {};
  
  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {isBaseline && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Current Baseline
              </span>
            )}
            <span className="font-medium text-gray-900">
              {artifact.version || artifact.id.slice(0, 8)}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(artifact.createdAt).toLocaleString()}
            </span>
          </div>
          
          <div className="mt-2 flex space-x-4 text-sm">
            {Object.entries(metrics).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-1">
                <span className="text-gray-500">{formatMetricName(key)}:</span>
                <span className="font-medium">{formatMetricValue(value)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {!isBaseline && (
          <button
            onClick={onPropose}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
          >
            Propose as Baseline
          </button>
        )}
      </div>
    </div>
  );
}

function BaselineHistorySection({ history, onRollback }) {
  if (!history || history.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Baseline History</h3>
      </div>
      
      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {history.map((baseline, idx) => (
              <li key={baseline.id}>
                <div className="relative pb-8">
                  {idx !== history.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        baseline.activeTo ? 'bg-gray-400' : 'bg-green-500'
                      }`}>
                        {baseline.activeTo ? (
                          <ClockIcon className="h-4 w-4 text-white" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4 text-white" />
                        )}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {baseline.activeTo ? 'Previous' : 'Current'} Baseline
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(baseline.activeFrom).toLocaleDateString()} -{' '}
                          {baseline.activeTo 
                            ? new Date(baseline.activeTo).toLocaleDateString()
                            : 'Present'}
                        </p>
                        {baseline.notes && (
                          <p className="mt-1 text-sm text-gray-600">{baseline.notes}</p>
                        )}
                      </div>
                      {baseline.activeTo && (
                        <button
                          onClick={() => onRollback(baseline.id)}
                          className="flex-shrink-0 text-sm text-purple-600 hover:text-purple-900"
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PerformanceTrendsSection({ type }) {
  const { data: trends } = useQuery({
    queryKey: ['models', 'trends', type],
    queryFn: async () => {
      const response = await fetch(`/api/models/trends/${type}?days=30`);
      if (!response.ok) throw new Error('Failed to fetch trends');
      const data = await response.json();
      return data.data;
    }
  });
  
  if (!trends || trends.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends (30d)</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {getMetricTrends(trends).map((metric) => (
          <div key={metric.name} className="text-center">
            <p className="text-sm text-gray-500">{metric.name}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.current}</p>
            <div className={`flex items-center justify-center text-sm ${
              metric.trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metric.trend > 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(metric.trend).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovalModal({ artifact, currentBaseline, onApprove, onCancel }) {
  const [notes, setNotes] = useState('');
  
  const currentMetrics = currentBaseline?.artifact?.metricsJson || {};
  const proposedMetrics = artifact.metricsJson || {};
  const deltas = calculateDeltas(currentMetrics, proposedMetrics);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Propose Baseline Change
        </h3>
        
        {/* Comparison Table */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Metrics Comparison</h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Metric</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Current</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Proposed</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(deltas).map(([key, delta]) => (
                <tr key={key}>
                  <td className="px-4 py-2 text-sm text-gray-900">{formatMetricName(key)}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{formatMetricValue(delta.current)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 font-medium">{formatMetricValue(delta.proposed)}</td>
                  <td className={`px-4 py-2 text-sm ${
                    isImprovement(key, delta.delta) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {delta.delta > 0 ? '+' : ''}{formatMetricValue(delta.delta)}
                    {delta.deltaPercent !== null && ` (${delta.deltaPercent.toFixed(1)}%)`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (for audit trail)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            placeholder="Reason for baseline change..."
          />
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onApprove(notes)}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
          >
            Approve & Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatMetricName(key) {
  const names = {
    mape: 'MAPE',
    coverage: 'Coverage',
    piCoverage: 'PI Coverage',
    serviceLevel: 'Service Level',
    stockouts: 'Stockouts',
    inventoryValue: 'Inventory Value',
    ccc: 'CCC',
    minCash: 'Min Cash',
    breachMonths: 'Breach Months'
  };
  return names[key] || key;
}

function formatMetricValue(value) {
  if (typeof value === 'number') {
    if (value > 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value > 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    if (value < 1 && value > 0) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(2);
  }
  return value;
}

function calculateDeltas(current, proposed) {
  const deltas = {};
  const allKeys = new Set([...Object.keys(current), ...Object.keys(proposed)]);
  
  for (const key of allKeys) {
    const currentVal = parseFloat(current[key]) || 0;
    const proposedVal = parseFloat(proposed[key]) || 0;
    
    deltas[key] = {
      current: currentVal,
      proposed: proposedVal,
      delta: proposedVal - currentVal,
      deltaPercent: currentVal !== 0 ? ((proposedVal - currentVal) / currentVal) * 100 : null
    };
  }
  
  return deltas;
}

function isImprovement(metric, delta) {
  // Define which metrics improve when they increase vs decrease
  const increaseIsGood = ['coverage', 'piCoverage', 'serviceLevel', 'minCash'];
  const decreaseIsGood = ['mape', 'stockouts', 'inventoryValue', 'ccc', 'breachMonths'];
  
  if (increaseIsGood.includes(metric)) {
    return delta > 0;
  }
  if (decreaseIsGood.includes(metric)) {
    return delta < 0;
  }
  return true; // Neutral for unknown metrics
}

function getMetricTrends(trends) {
  // Calculate trends from time series data
  if (!trends || trends.length < 2) return [];
  
  const first = trends[0].metrics;
  const last = trends[trends.length - 1].metrics;
  
  return Object.keys(last).slice(0, 4).map(key => ({
    name: formatMetricName(key),
    current: formatMetricValue(last[key]),
    trend: first[key] ? ((last[key] - first[key]) / first[key]) * 100 : 0
  }));
}