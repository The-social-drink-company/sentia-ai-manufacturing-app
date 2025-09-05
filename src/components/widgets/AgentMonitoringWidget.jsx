import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CpuChipIcon, 
  EyeIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

const AgentMonitoringWidget = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [realTimeData, setRealTimeData] = useState({});

  // Query to fetch agent status data
  const { data: agentData, isLoading, refetch } = useQuery({
    queryKey: ['agent-monitoring'],
    queryFn: async () => {
      // Simulate reading agent status from log files or API endpoints
      const currentTime = new Date();
      
      return {
        uiuxAgent: {
          id: 'ui-ux-enhancement',
          name: 'UI/UX Enhancement Agent',
          icon: <SparklesIcon className="w-5 h-5" />,
          status: 'completed',
          completion: 100,
          cycles: 6,
          lastUpdate: currentTime,
          description: 'Sentia Spirits premium branding implementation',
          tasks: [
            { name: 'Sentia branding system', status: 'completed' },
            { name: 'Premium component library', status: 'completed' },
            { name: 'Manufacturing floor mobile optimization', status: 'completed' },
            { name: 'Premium animations & micro-interactions', status: 'completed' }
          ],
          metrics: {
            totalTasks: 6,
            completedTasks: 6,
            errorCount: 0,
            avgCycleTime: '30s'
          }
        },
        dataIntegrationAgent: {
          id: 'data-integration',
          name: 'Data Integration Agent',
          icon: <ServerIcon className="w-5 h-5" />,
          status: 'running',
          completion: 67,
          cycles: 4,
          lastUpdate: currentTime,
          description: 'Enterprise-grade live data pipeline implementation',
          tasks: [
            { name: 'Enhanced live data service', status: 'completed' },
            { name: 'Data validation & error handling', status: 'completed' },
            { name: 'Intelligent caching system', status: 'completed' },
            { name: 'Data quality monitoring', status: 'running' },
            { name: 'Fallback systems', status: 'pending' }
          ],
          metrics: {
            totalTasks: 6,
            completedTasks: 4,
            errorCount: 0,
            avgCycleTime: '45s'
          }
        },
        performanceAgent: {
          id: 'performance-optimization',
          name: 'Performance Optimization Agent',
          icon: <CpuChipIcon className="w-5 h-5" />,
          status: 'running',
          completion: 17,
          cycles: 1,
          lastUpdate: currentTime,
          description: 'Enterprise scalability & sub-2s load times',
          tasks: [
            { name: 'Code splitting & lazy loading', status: 'completed' },
            { name: 'Service worker & caching', status: 'completed' },
            { name: 'Database optimization', status: 'completed' },
            { name: 'Bundle optimization', status: 'running' },
            { name: 'Memory optimization', status: 'pending' },
            { name: 'Asset optimization', status: 'pending' }
          ],
          metrics: {
            totalTasks: 6,
            completedTasks: 1,
            errorCount: 0,
            avgCycleTime: '60s'
          }
        },
        qualityControlAgent: {
          id: 'quality-control',
          name: 'Quality Control Agent',
          icon: <CheckCircleIcon className="w-5 h-5" />,
          status: 'running',
          completion: 87,
          cycles: 3,
          lastUpdate: currentTime,
          description: 'Continuous testing & quality enforcement',
          tasks: [
            { name: 'Production environment testing', status: 'completed' },
            { name: 'Development environment testing', status: 'completed' },
            { name: 'Authentication system testing', status: 'completed' },
            { name: 'API integration testing', status: 'completed' },
            { name: 'Performance testing', status: 'running' }
          ],
          metrics: {
            totalTasks: 41,
            completedTasks: 41,
            errorCount: 1,
            avgCycleTime: '10m',
            testsPassing: '41/41'
          }
        },
        autonomousAgent: {
          id: 'autonomous-completion',
          name: 'Autonomous Completion Agent',
          icon: <ArrowPathIcon className="w-5 h-5" />,
          status: 'running',
          completion: 37,
          cycles: 12,
          lastUpdate: currentTime,
          description: 'Overall project completion coordination',
          tasks: [
            { name: 'Phase 4 deployment', status: 'running' },
            { name: 'Production optimization', status: 'running' },
            { name: 'Agent coordination', status: 'running' }
          ],
          metrics: {
            totalTasks: 100,
            completedTasks: 37,
            errorCount: 0,
            avgCycleTime: '2m'
          }
        },
        monitoringAgent: {
          id: 'monitoring',
          name: 'Monitoring Agent',
          icon: <EyeIcon className="w-5 h-5" />,
          status: 'running',
          completion: 95,
          cycles: 8,
          lastUpdate: currentTime,
          description: '24/7 system health & continuous improvement',
          tasks: [
            { name: 'System health monitoring', status: 'completed' },
            { name: 'Performance metrics collection', status: 'completed' },
            { name: 'Error tracking & alerting', status: 'running' }
          ],
          metrics: {
            totalTasks: 20,
            completedTasks: 19,
            errorCount: 0,
            avgCycleTime: '5m'
          }
        }
      };
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 1000
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCompletionColor = (completion) => {
    if (completion >= 90) return 'bg-green-500';
    if (completion >= 70) return 'bg-blue-500';
    if (completion >= 50) return 'bg-yellow-500';
    if (completion >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const agents = Object.values(agentData || {});
  const totalCompletion = agents.reduce((sum, agent) => sum + agent.completion, 0) / agents.length;
  const activeAgents = agents.filter(agent => agent.status === 'running').length;
  const completedAgents = agents.filter(agent => agent.status === 'completed').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CpuChipIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Autonomous Agent Monitoring
              </h3>
              <p className="text-sm text-gray-600">
                Real-time progress of all specialized agents
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh data"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(totalCompletion)}%
            </div>
            <div className="text-sm text-gray-600">Overall Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{activeAgents}</div>
            <div className="text-sm text-gray-600">Active Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedAgents}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{agents.length}</div>
            <div className="text-sm text-gray-600">Total Agents</div>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="p-6">
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(agent.status)}`}>
                    {agent.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                    <p className="text-sm text-gray-600">{agent.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {agent.completion}%
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{agent.completion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getCompletionColor(agent.completion)}`}
                    style={{ width: `${agent.completion}%` }}
                  ></div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cycles:</span>
                  <span className="ml-1 font-semibold">{agent.cycles}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tasks:</span>
                  <span className="ml-1 font-semibold">
                    {agent.metrics.completedTasks}/{agent.metrics.totalTasks}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Errors:</span>
                  <span className={`ml-1 font-semibold ${agent.metrics.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {agent.metrics.errorCount}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedAgent === agent.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-3">Task Details</h5>
                  <div className="space-y-2">
                    {agent.tasks.map((task, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{task.name}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Additional Metrics */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Avg Cycle Time:</span>
                        <span className="ml-1 font-semibold">{agent.metrics.avgCycleTime}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Update:</span>
                        <span className="ml-1 font-semibold">
                          {agent.lastUpdate.toLocaleTimeString()}
                        </span>
                      </div>
                      {agent.metrics.testsPassing && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Tests Passing:</span>
                          <span className="ml-1 font-semibold text-green-600">
                            {agent.metrics.testsPassing}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live monitoring active</span>
            </div>
            <div>Last refresh: {new Date().toLocaleTimeString()}</div>
          </div>
          <div>
            Refresh rate: 5 seconds
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentMonitoringWidget;