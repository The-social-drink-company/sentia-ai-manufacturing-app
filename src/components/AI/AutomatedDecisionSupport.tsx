import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CogIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  BellIcon,
  UserIcon,
  DocumentTextIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { logInfo, logWarn, logError } from '../../lib/logger';

export interface DecisionRule {
  id: string;
  name: string;
  description: string;
  category: 'inventory' | 'procurement' | 'quality' | 'production' | 'financial' | 'supplier';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'paused' | 'disabled' | 'draft';
  conditions: Array<{
    id: string;
    parameter: string;
    operator: '>' | '<' | '=' | '!=' | '>=' | '<=' | 'contains' | 'not_contains';
    value: any;
    dataSource: string;
    description: string;
  }>;
  actions: Array<{
    id: string;
    type: 'reorder' | 'approve' | 'escalate' | 'notify' | 'adjust' | 'block';
    description: string;
    parameters: Record<string, any>;
    requiresApproval: boolean;
    approvers?: string[];
  }>;
  triggers: {
    schedule?: {
      frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
      time?: string;
      days?: number[];
    };
    events?: string[];
    thresholds?: Array<{
      metric: string;
      condition: string;
      value: number;
    }>;
  };
  performance: {
    executionCount: number;
    successRate: number;
    lastExecuted: Date | null;
    avgExecutionTime: number;
    totalSavings: number;
    errorCount: number;
  };
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'pending_approval';
  startTime: Date;
  endTime?: Date;
  triggeredBy: 'schedule' | 'event' | 'manual' | 'threshold';
  triggerData: Record<string, any>;
  steps: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: Date;
    endTime?: Date;
    result?: any;
    error?: string;
    duration?: number;
  }>;
  approvals: Array<{
    stepId: string;
    approver: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp?: Date;
    comments?: string;
  }>;
  metrics: {
    executionTime: number;
    resourcesAffected: number;
    financialImpact: number;
    successfulActions: number;
    failedActions: number;
  };
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: any;
  }>;
}

const mockRules: DecisionRule[] = [
  {
    id: 'rule_001',
    name: 'Automatic Reorder Point Adjustment',
    description: 'Automatically adjust reorder points based on demand variability and supplier performance',
    category: 'inventory',
    priority: 'high',
    status: 'active',
    conditions: [
      {
        id: 'cond_001',
        parameter: 'demand_variability',
        operator: '>',
        value: 0.3,
        dataSource: 'inventory_analytics',
        description: 'Demand coefficient of variation exceeds 30%'
      },
      {
        id: 'cond_002',
        parameter: 'supplier_reliability',
        operator: '>=',
        value: 0.95,
        dataSource: 'supplier_performance',
        description: 'Supplier on-time delivery rate is at least 95%'
      }
    ],
    actions: [
      {
        id: 'action_001',
        type: 'adjust',
        description: 'Increase reorder point by 15% to account for demand variability',
        parameters: {
          adjustment_factor: 1.15,
          max_adjustment: 0.5,
          notification_recipients: ['inventory_manager@company.com']
        },
        requiresApproval: false
      }
    ],
    triggers: {
      schedule: {
        frequency: 'daily',
        time: '09:00'
      },
      thresholds: [
        {
          metric: 'stockout_risk',
          condition: '>',
          value: 0.1
        }
      ]
    },
    performance: {
      executionCount: 45,
      successRate: 0.96,
      lastExecuted: new Date('2024-01-12T09:00:00Z'),
      avgExecutionTime: 2300,
      totalSavings: 28500,
      errorCount: 2
    },
    createdBy: 'system_admin',
    createdAt: new Date('2023-11-15'),
    lastModified: new Date('2024-01-10')
  },
  {
    id: 'rule_002',
    name: 'Critical Supplier Quality Escalation',
    description: 'Escalate quality issues to management when critical supplier defect rates exceed thresholds',
    category: 'quality',
    priority: 'critical',
    status: 'active',
    conditions: [
      {
        id: 'cond_003',
        parameter: 'defect_rate',
        operator: '>',
        value: 0.05,
        dataSource: 'quality_metrics',
        description: 'Supplier defect rate exceeds 5%'
      },
      {
        id: 'cond_004',
        parameter: 'supplier_criticality',
        operator: '=',
        value: 'critical',
        dataSource: 'supplier_master',
        description: 'Supplier is classified as critical'
      }
    ],
    actions: [
      {
        id: 'action_002',
        type: 'escalate',
        description: 'Escalate to quality manager and procurement director',
        parameters: {
          escalation_level: 'management',
          urgency: 'high',
          required_response_time: 4
        },
        requiresApproval: false
      },
      {
        id: 'action_003',
        type: 'block',
        description: 'Block new purchase orders until quality issue is resolved',
        parameters: {
          block_duration: 72,
          exceptions: []
        },
        requiresApproval: true,
        approvers: ['procurement_director@company.com']
      }
    ],
    triggers: {
      events: ['quality_report_generated', 'inspection_completed'],
      thresholds: [
        {
          metric: 'defect_rate',
          condition: '>',
          value: 0.05
        }
      ]
    },
    performance: {
      executionCount: 8,
      successRate: 1.0,
      lastExecuted: new Date('2024-01-08T14:30:00Z'),
      avgExecutionTime: 4500,
      totalSavings: 125000,
      errorCount: 0
    },
    createdBy: 'quality_manager',
    createdAt: new Date('2023-10-20'),
    lastModified: new Date('2024-01-05')
  }
];

const mockExecutions: WorkflowExecution[] = [
  {
    id: 'exec_001',
    ruleId: 'rule_001',
    ruleName: 'Automatic Reorder Point Adjustment',
    status: 'completed',
    startTime: new Date('2024-01-12T09:00:00Z'),
    endTime: new Date('2024-01-12T09:02:18Z'),
    triggeredBy: 'schedule',
    triggerData: { scheduled_time: '09:00', date: '2024-01-12' },
    steps: [
      {
        id: 'step_001',
        name: 'Analyze Demand Variability',
        status: 'completed',
        startTime: new Date('2024-01-12T09:00:05Z'),
        endTime: new Date('2024-01-12T09:00:45Z'),
        result: { items_analyzed: 156, high_variability_items: 12 },
        duration: 40000
      },
      {
        id: 'step_002',
        name: 'Check Supplier Performance',
        status: 'completed',
        startTime: new Date('2024-01-12T09:00:45Z'),
        endTime: new Date('2024-01-12T09:01:20Z'),
        result: { suppliers_checked: 8, qualifying_suppliers: 6 },
        duration: 35000
      },
      {
        id: 'step_003',
        name: 'Adjust Reorder Points',
        status: 'completed',
        startTime: new Date('2024-01-12T09:01:20Z'),
        endTime: new Date('2024-01-12T09:02:15Z'),
        result: { items_adjusted: 8, avg_adjustment: 0.12 },
        duration: 55000
      }
    ],
    approvals: [],
    metrics: {
      executionTime: 138000,
      resourcesAffected: 8,
      financialImpact: 4500,
      successfulActions: 3,
      failedActions: 0
    },
    logs: [
      {
        timestamp: new Date('2024-01-12T09:00:00Z'),
        level: 'info',
        message: 'Workflow execution started',
        data: { trigger: 'schedule' }
      },
      {
        timestamp: new Date('2024-01-12T09:02:18Z'),
        level: 'info',
        message: 'Workflow execution completed successfully',
        data: { duration: 138000 }
      }
    ]
  }
];

export const AutomatedDecisionSupport: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<DecisionRule | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'executions' | 'performance'>('rules');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const queryClient = useQueryClient();

  // Fetch decision rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['decision-rules', filterCategory, filterStatus],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filtered = [...mockRules];
      
      if (filterCategory !== 'all') {
        filtered = filtered.filter(rule => rule.category === filterCategory);
      }
      
      if (filterStatus !== 'all') {
        filtered = filtered.filter(rule => rule.status === filterStatus);
      }
      
      return filtered.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    }
  });

  // Fetch workflow executions
  const { data: executions = [], isLoading: executionsLoading } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...mockExecutions].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    }
  });

  // Toggle rule status
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, newStatus }: { ruleId: string; newStatus: string }) => {
      logInfo('Toggling rule status', { ruleId, newStatus });
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ruleId, newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decision-rules'] });
    }
  });

  // Execute rule manually
  const executeRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      logInfo('Executing rule manually', { ruleId });
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { executionId: `exec_${Date.now()}`, ruleId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
    }
  });

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      disabled: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      inventory: ChartBarIcon,
      procurement: CogIcon,
      quality: CheckCircleIcon,
      production: PlayIcon,
      financial: DocumentTextIcon,
      supplier: UserIcon
    };
    return icons[category as keyof typeof icons] || CogIcon;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <CogIcon className="h-7 w-7 text-indigo-600 mr-3" />
            Automated Decision Support
          </h2>
          <p className="text-gray-600">
            Intelligent automation for critical business decisions and workflows
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Create New Rule
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'rules', label: 'Decision Rules', icon: AdjustmentsHorizontalIcon },
            { key: 'executions', label: 'Workflow Executions', icon: PlayIcon },
            { key: 'performance', label: 'Performance Analytics', icon: ChartBarIcon }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Decision Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="inventory">Inventory</option>
                  <option value="procurement">Procurement</option>
                  <option value="quality">Quality</option>
                  <option value="production">Production</option>
                  <option value="financial">Financial</option>
                  <option value="supplier">Supplier</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="disabled">Disabled</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rules Grid */}
          {rulesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rules.map((rule) => {
                const CategoryIcon = getCategoryIcon(rule.category);
                
                return (
                  <div
                    key={rule.id}
                    className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <CategoryIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rule.priority)}`}>
                            {rule.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rule.status)}`}>
                        {rule.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="font-semibold text-gray-900 mb-2">{rule.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{rule.description}</p>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{rule.performance.executionCount}</div>
                        <div className="text-gray-500">Executions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(rule.performance.totalSavings)}
                        </div>
                        <div className="text-gray-500">Savings</div>
                      </div>
                    </div>

                    {/* Success Rate */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="text-sm font-medium">
                          {Math.round(rule.performance.successRate * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${rule.performance.successRate * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const newStatus = rule.status === 'active' ? 'paused' : 'active';
                          toggleRuleMutation.mutate({ ruleId: rule.id, newStatus });
                        }}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          rule.status === 'active'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {rule.status === 'active' ? (
                          <>
                            <PauseIcon className="h-4 w-4 inline mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-4 w-4 inline mr-1" />
                            Activate
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => executeRuleMutation.mutate(rule.id)}
                        disabled={rule.status !== 'active'}
                        className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Execute
                      </button>
                      
                      <button
                        onClick={() => setSelectedRule(rule)}
                        className="px-3 py-2 text-gray-600 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Workflow Executions Tab */}
      {activeTab === 'executions' && (
        <div className="space-y-6">
          {executionsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedExecution(execution)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{execution.ruleName}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span>ID: {execution.id}</span>
                        <span>Started: {execution.startTime.toLocaleString()}</span>
                        <span>Triggered by: {execution.triggeredBy}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(execution.status)}`}>
                        {execution.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {execution.endTime && (
                        <span className="text-sm text-gray-500">
                          {formatDuration(execution.endTime.getTime() - execution.startTime.getTime())}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Steps Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Execution Steps</span>
                      <span className="text-sm text-gray-500">
                        {execution.steps.filter(step => step.status === 'completed').length}/{execution.steps.length}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      {execution.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`flex-1 h-2 rounded ${
                            step.status === 'completed' ? 'bg-green-500' :
                            step.status === 'running' ? 'bg-blue-500' :
                            step.status === 'failed' ? 'bg-red-500' :
                            'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {execution.metrics.resourcesAffected}
                      </div>
                      <div className="text-sm text-gray-500">Resources</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(execution.metrics.financialImpact)}
                      </div>
                      <div className="text-sm text-gray-500">Impact</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {execution.metrics.successfulActions}
                      </div>
                      <div className="text-sm text-gray-500">Successful</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {execution.metrics.failedActions}
                      </div>
                      <div className="text-sm text-gray-500">Failed</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Performance Analytics Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {rules.filter(r => r.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-500">Active Rules</div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {rules.reduce((sum, rule) => sum + rule.performance.executionCount, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Executions</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <PlayIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-green-600">
                    {formatCurrency(rules.reduce((sum, rule) => sum + rule.performance.totalSavings, 0))}
                  </div>
                  <div className="text-sm text-gray-500">Total Savings</div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {Math.round(rules.reduce((sum, rule) => sum + rule.performance.successRate, 0) / rules.length * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Avg Success Rate</div>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Performance by Category */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">Performance by Category</h3>
            <div className="space-y-4">
              {['inventory', 'procurement', 'quality', 'production', 'financial', 'supplier'].map(category => {
                const categoryRules = rules.filter(rule => rule.category === category);
                const totalExecutions = categoryRules.reduce((sum, rule) => sum + rule.performance.executionCount, 0);
                const totalSavings = categoryRules.reduce((sum, rule) => sum + rule.performance.totalSavings, 0);
                const avgSuccessRate = categoryRules.length > 0 
                  ? categoryRules.reduce((sum, rule) => sum + rule.performance.successRate, 0) / categoryRules.length 
                  : 0;

                if (categoryRules.length === 0) return null;

                const CategoryIcon = getCategoryIcon(category);

                return (
                  <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg">
                        <CategoryIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 capitalize">{category}</div>
                        <div className="text-sm text-gray-500">{categoryRules.length} rules</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="font-semibold text-gray-900">{totalExecutions}</div>
                        <div className="text-xs text-gray-500">Executions</div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(totalSavings)}
                        </div>
                        <div className="text-xs text-gray-500">Savings</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {Math.round(avgSuccessRate * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rule Details Modal */}
      {selectedRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedRule.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedRule.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedRule.priority)}`}>
                      {selectedRule.priority.toUpperCase()} PRIORITY
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRule.status)}`}>
                      {selectedRule.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRule(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Conditions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Conditions</h3>
                <div className="space-y-3">
                  {selectedRule.conditions.map((condition) => (
                    <div key={condition.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-900">
                        {condition.parameter} {condition.operator} {condition.value}
                      </div>
                      <div className="text-sm text-blue-700 mt-1">{condition.description}</div>
                      <div className="text-xs text-blue-600 mt-1">Source: {condition.dataSource}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Actions</h3>
                <div className="space-y-3">
                  {selectedRule.actions.map((action) => (
                    <div key={action.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-green-900 capitalize">
                            {action.type}: {action.description}
                          </div>
                          {action.requiresApproval && (
                            <div className="text-sm text-orange-700 mt-1 flex items-center">
                              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                              Requires approval from: {action.approvers?.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">
                      {selectedRule.performance.executionCount}
                    </div>
                    <div className="text-sm text-gray-500">Executions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-green-600">
                      {Math.round(selectedRule.performance.successRate * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-green-600">
                      {formatCurrency(selectedRule.performance.totalSavings)}
                    </div>
                    <div className="text-sm text-gray-500">Total Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatDuration(selectedRule.performance.avgExecutionTime)}
                    </div>
                    <div className="text-sm text-gray-500">Avg Duration</div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => executeRuleMutation.mutate(selectedRule.id)}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Execute Now
                </button>
                <button
                  onClick={() => setSelectedRule(null)}
                  className="px-6 py-3 text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};