// Export all agent widgets from this file for easy import
export { default as UIUXEnhancementWidget } from './UIUXEnhancementWidget';
export { default as DataIntegrationWidget } from './DataIntegrationWidget';
export { default as PerformanceOptimizationWidget } from './PerformanceOptimizationWidget';

import React from 'react';
import { 
  CheckCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  ShieldCheckIcon,
  BeakerIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  ServerStackIcon,
  ArrowsPointingInIcon,
  BugAntIcon
} from '@heroicons/react/24/outline';

// Quality Control Agent Widget
export const QualityControlWidget = () => {
  const agentData = {
    name: 'Quality Control Agent',
    status: 'running',
    completion: 90,
    cycles: 3,
    description: 'Continuous testing & quality enforcement',
    testsRun: 41,
    testsPassing: 41,
    coverage: '92%',
    violations: 0
  };

  const tasks = [
    { name: 'Production environment testing', status: 'completed', tests: 12 },
    { name: 'Development environment testing', status: 'completed', tests: 10 },
    { name: 'Authentication system testing', status: 'completed', tests: 8 },
    { name: 'API integration testing', status: 'completed', tests: 7 },
    { name: 'Performance testing', status: 'running', tests: 4 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-green-200">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{agentData.name}</h3>
              <p className="text-sm text-gray-600">{agentData.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">{agentData.completion}%</div>
            <div className="text-sm text-gray-500">41/41 Tests Passing</div>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full" style={{ width: '90%' }}></div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{agentData.testsRun}</div>
            <div className="text-xs text-gray-600">Tests Run</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{agentData.coverage}</div>
            <div className="text-xs text-gray-600">Coverage</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{agentData.violations}</div>
            <div className="text-xs text-gray-600">Violations</div>
          </div>
        </div>

        <h4 className="font-semibold text-gray-900 mb-3">Test Suites</h4>
        <div className="space-y-2">
          {tasks.map((task, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {task.status === 'completed' ? 
                  <CheckCircleIcon className="w-5 h-5 text-green-600" /> :
                  <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
                }
                <span className="text-sm text-gray-700">{task.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{task.tests} tests</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Autonomous Completion Agent Widget
export const AutonomousCompletionWidget = () => {
  const agentData = {
    name: 'Autonomous Completion Agent',
    status: 'running',
    completion: 40,
    cycles: 12,
    description: 'Overall project completion coordination',
    tasksTotal: 100,
    tasksCompleted: 40
  };

  const phases = [
    { name: 'Phase 1: Setup & Config', completion: 100, status: 'completed' },
    { name: 'Phase 2: Core Features', completion: 100, status: 'completed' },
    { name: 'Phase 3: Integration', completion: 75, status: 'running' },
    { name: 'Phase 4: Deployment', completion: 45, status: 'running' },
    { name: 'Phase 5: Optimization', completion: 20, status: 'running' },
    { name: 'Phase 6: Production', completion: 0, status: 'pending' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-indigo-200">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <ArrowPathIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{agentData.name}</h3>
              <p className="text-sm text-gray-600">{agentData.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">{agentData.completion}%</div>
            <div className="text-sm text-gray-500">{agentData.tasksCompleted}/{agentData.tasksTotal} Tasks</div>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
               style={{ width: `${agentData.completion}%` }}></div>
        </div>
      </div>

      <div className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Deployment Phases</h4>
        <div className="space-y-3">
          {phases.map((phase, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{phase.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                  phase.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {phase.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-300 ${
                    phase.completion === 100 ? 'bg-green-500' :
                    phase.completion > 0 ? 'bg-blue-500' : 'bg-gray-300'
                  }`} style={{ width: `${phase.completion}%` }}></div>
                </div>
                <span className="text-xs font-semibold text-gray-700">{phase.completion}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Monitoring Agent Widget
export const MonitoringAgentWidget = () => {
  const agentData = {
    name: 'Monitoring Agent',
    status: 'running',
    completion: 98,
    cycles: 8,
    description: '24/7 system health & continuous improvement',
    uptime: '99.98%',
    alertsFired: 3,
    issuesResolved: 18
  };

  const metrics = [
    { name: 'CPU Usage', value: '23%', status: 'healthy', trend: 'stable' },
    { name: 'Memory Usage', value: '42%', status: 'healthy', trend: 'down' },
    { name: 'Disk I/O', value: '156 MB/s', status: 'healthy', trend: 'up' },
    { name: 'Network Traffic', value: '2.3 GB/h', status: 'healthy', trend: 'stable' },
    { name: 'Error Rate', value: '0.02%', status: 'healthy', trend: 'down' },
    { name: 'Response Time', value: '45ms', status: 'healthy', trend: 'stable' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-blue-200">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <EyeIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{agentData.name}</h3>
              <p className="text-sm text-gray-600">{agentData.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{agentData.completion}%</div>
            <div className="text-sm text-gray-500">Uptime: {agentData.uptime}</div>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full" style={{ width: '98%' }}></div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{agentData.uptime}</div>
            <div className="text-xs text-gray-600">Uptime</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{agentData.alertsFired}</div>
            <div className="text-xs text-gray-600">Alerts</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{agentData.issuesResolved}</div>
            <div className="text-xs text-gray-600">Resolved</div>
          </div>
        </div>

        <h4 className="font-semibold text-gray-900 mb-3">System Metrics</h4>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-700">{metric.name}</div>
                <div className="text-lg font-bold text-gray-900">{metric.value}</div>
              </div>
              <div className="text-xs text-green-600">
                {metric.trend === 'up' ? 'â†‘' : metric.trend === 'down' ? 'â†“' : 'â†’'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Dashboard Update Agent Widget
export const DashboardUpdateWidget = () => {
  const agentData = {
    name: 'Dashboard Update Agent',
    status: 'running',
    completion: 86,
    cycles: 13,
    description: '2-minute update cycles for internal dashboard',
    lastUpdate: new Date().toLocaleTimeString(),
    nextUpdate: new Date(Date.now() + 120000).toLocaleTimeString(),
    successRate: '86%'
  };

  const recentUpdates = [
    { time: '10:11:56', status: 'success', tasks: 7, duration: '2.3s' },
    { time: '10:09:56', status: 'success', tasks: 7, duration: '2.1s' },
    { time: '10:07:56', status: 'success', tasks: 7, duration: '2.5s' },
    { time: '10:05:56', status: 'success', tasks: 7, duration: '2.2s' },
    { time: '10:03:56', status: 'partial', tasks: 6, duration: '1.9s' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-yellow-200">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ArrowsPointingInIcon className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{agentData.name}</h3>
              <p className="text-sm text-gray-600">{agentData.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-600">{agentData.completion}%</div>
            <div className="text-sm text-gray-500">Success Rate: {agentData.successRate}</div>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 h-3 rounded-full" style={{ width: '86%' }}></div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Last Update</div>
            <div className="text-lg font-bold text-blue-700">{agentData.lastUpdate}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Next Update</div>
            <div className="text-lg font-bold text-green-700">{agentData.nextUpdate}</div>
          </div>
        </div>

        <h4 className="font-semibold text-gray-900 mb-3">Recent Update Cycles</h4>
        <div className="space-y-2">
          {recentUpdates.map((update, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {update.status === 'success' ? 
                  <CheckCircleIcon className="w-5 h-5 text-green-600" /> :
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                }
                <span className="text-sm text-gray-700">{update.time}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-500">{update.tasks} tasks</span>
                <span className="text-xs font-semibold text-gray-700">{update.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
