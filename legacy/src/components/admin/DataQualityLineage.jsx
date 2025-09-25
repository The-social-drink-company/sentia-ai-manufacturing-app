import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../services/queryClient';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
  ArrowPathIcon,
  CurrencyPoundIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function DataQualityLineage() {
  const [selectedDataset, setSelectedDataset] = useState('sales');
  const [showFindings, setShowFindings] = useState(false);

  // Check if DQ feature is enabled
  const isEnabled = import.meta.env.VITE_FEATURE_DQ === 'true';

  // Fetch DQ runs
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['dq', 'runs', selectedDataset],
    queryFn: async () => {
      const response = await fetch(`/api/dq/runs?dataset=${selectedDataset}`);
      if (!response.ok) throw new Error('Failed to fetch DQ runs');
      const data = await response.json();
      return data.data;
    },
    enabled: isEnabled,
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch freshness status
  const { data: freshness, isLoading: freshnessLoading } = useQuery({
    queryKey: ['dq', 'freshness'],
    queryFn: async () => {
      const response = await fetch('/api/dq/freshness');
      if (!response.ok) throw new Error('Failed to fetch freshness status');
      const data = await response.json();
      return data.data;
    },
    enabled: isEnabled,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch latest findings
  const { data: findings } = useQuery({
    queryKey: ['dq', 'findings', selectedDataset],
    queryFn: async () => {
      const response = await fetch(`/api/dq/findings?dataset=${selectedDataset}&limit=10`);
      if (!response.ok) throw new Error('Failed to fetch findings');
      const data = await response.json();
      return data.data;
    },
    enabled: isEnabled && showFindings
  });

  // Run DQ check mutation
  const runDQMutation = useMutation({
    mutationFn: async (dataset) => {
      const response = await fetch('/api/dq/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset })
      });
      if (!response.ok) throw new Error('Failed to run DQ check');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dq', 'runs']);
      queryClient.invalidateQueries(['dq', 'findings']);
    }
  });

  if (!isEnabled) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Data Quality feature is disabled. Set FEATURE_DQ=true to enable.
          </span>
        </div>
      </div>
    );
  }

  const datasets = ['sales', 'inventory', 'products', 'arap'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Quality & Lineage</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor data freshness, quality rules, and lineage tracking
          </p>
        </div>
        <button
          onClick={() => runDQMutation.mutate(selectedDataset)}
          disabled={runDQMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 ${runDQMutation.isPending ? 'animate-spin' : ''}`} />
          <span>Run DQ Check</span>
        </button>
      </div>

      {/* Freshness SLO Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {freshness && Object.entries(freshness).map(([dataset, status]) => (
          <FreshnessCard 
            key={dataset}
            dataset={dataset}
            status={status}
            loading={freshnessLoading}
          />
        ))}
      </div>

      {/* Dataset Selector */}
      <div className="flex space-x-2">
        {datasets.map((ds) => (
          <button
            key={ds}
            onClick={() => setSelectedDataset(ds)}
            className={`px-4 py-2 rounded-lg ${
              selectedDataset === ds
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {ds.charAt(0).toUpperCase() + ds.slice(1)}
          </button>
        ))}
      </div>

      {/* DQ Scorecard */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            DQ Scorecard - {selectedDataset.charAt(0).toUpperCase() + selectedDataset.slice(1)}
          </h3>
        </div>
        
        {runs && runs.length > 0 ? (
          <div className="p-6">
            <DQScorecard run={runs[0]} />
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No DQ runs found for this dataset
          </div>
        )}
      </div>

      {/* Top Findings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Top Findings</h3>
            <button
              onClick={() => setShowFindings(!showFindings)}
              className="text-sm text-purple-600 hover:text-purple-900"
            >
              {showFindings ? 'Hide' : 'Show'} Findings
            </button>
          </div>
        </div>
        
        {showFindings && findings && (
          <div className="divide-y divide-gray-200">
            {findings.map((finding, idx) => (
              <FindingRow key={idx} finding={finding} />
            ))}
          </div>
        )}
      </div>

      {/* Lineage Tracking */}
      <LineageSection dataset={selectedDataset} />
    </div>
  );
}

function FreshnessCard({ dataset, status, loading }) {
  const isWithinSLO = status?.isWithinSLO;
  const sloHours = status?.sloHours;
  const findings = status?.findings?.[0];
  
  return (
    <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${
      isWithinSLO ? 'border-green-500' : 'border-red-500'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900 capitalize">{dataset}</h4>
          <p className="text-xs text-gray-500">SLO: {sloHours}h</p>
        </div>
        {isWithinSLO ? (
          <CheckCircleIcon className="h-6 w-6 text-green-500" />
        ) : (
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
        )}
      </div>
      
      {findings && (
        <p className="mt-2 text-xs text-red-600">{findings.notes}</p>
      )}
      
      {loading && (
        <div className="mt-2 h-2 bg-gray-200 rounded animate-pulse" />
      )}
    </div>
  );
}

function DQScorecard({ run }) {
  const total = run.totalRules || 0;
  const passed = run.passedRules || 0;
  const failed = run.failedRules || 0;
  const warned = run.warnedRules || 0;
  
  const passRate = total > 0 ? (passed / total) * 100 : 0;
  
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">Total Rules</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-green-600">{passed}</p>
          <p className="text-sm text-gray-500">Passed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-red-600">{failed}</p>
          <p className="text-sm text-gray-500">Failed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-yellow-600">{warned}</p>
          <p className="text-sm text-gray-500">Warnings</p>
        </div>
      </div>
      
      {/* Pass Rate Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Pass Rate</span>
          <span>{passRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${
              passRate >= 95 ? 'bg-green-600' :
              passRate >= 80 ? 'bg-yellow-600' :
              'bg-red-600'
            }`}
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>
      
      {/* Last Run Time */}
      <div className="text-sm text-gray-500">
        Last run: {new Date(run.finishedAt || run.startedAt).toLocaleString()}
      </div>
    </div>
  );
}

function FindingRow({ finding }) {
  const impactValue = finding.impactValueBase || 0;
  const hasImpact = impactValue > 0;
  
  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${
              finding.severity === 'FAIL' 
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {finding.severity}
            </span>
            <span className="font-medium text-gray-900">{finding.ruleKey}</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{finding.notes}</p>
          {finding.sampleRef && (
            <p className="mt-1 text-xs text-gray-500">Sample: {finding.sampleRef}</p>
          )}
        </div>
        
        {hasImpact && (
          <div className="ml-4 flex items-center space-x-1 text-red-600">
            <CurrencyPoundIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {(impactValue / 1000).toFixed(0)}k excluded
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
        <span>Count: {finding.count}</span>
        <span>Run: {finding.runId?.slice(0, 8)}</span>
      </div>
    </div>
  );
}

function LineageSection({ dataset }) {
  const { data: lineage } = useQuery({
    queryKey: ['dq', 'lineage', dataset],
    queryFn: async () => {
      const response = await fetch(`/api/dq/lineage?dataset=${dataset}`);
      if (!response.ok) throw new Error('Failed to fetch lineage');
      const data = await response.json();
      return data.data;
    }
  });
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <DocumentMagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Data Lineage</h3>
        </div>
      </div>
      
      <div className="p-6">
        {lineage && lineage.length > 0 ? (
          <div className="space-y-4">
            {lineage.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-purple-600">
                      {idx + 1}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.lineageTag}
                  </p>
                  <p className="text-xs text-gray-500">
                    Import Job: {item.importJobId} â€¢ {item.rowsAffected} rows
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">No lineage data available</p>
            <p className="text-xs">Import data to track lineage</p>
          </div>
        )}
      </div>
    </div>
  );
}
