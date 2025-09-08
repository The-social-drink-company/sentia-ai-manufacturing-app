import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';
import { ChartJS } from '../../lib/chartSetup';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const SmartAutomation = () => {
  const [automationData, setAutomationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProcesses, setActiveProcesses] = useState([]);
  const [automationStats, setAutomationStats] = useState({});

  // Fetch automation data
  useEffect(() => {
    const fetchAutomationData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        const response = await fetch(`${apiUrl}/automation/overview`);
        if (response.ok) {
          const data = await response.json();
          setAutomationData(data);
          setActiveProcesses(data.activeProcesses || []);
          setAutomationStats(data.stats || {});
        } else {
          // Use fallback data if API is unavailable
          setAutomationData(mockAutomationData);
          setActiveProcesses(mockActiveProcesses);
          setAutomationStats(mockAutomationStats);
        }
      } catch (error) {
        console.error('Failed to fetch automation data:', error);
        // Use fallback data
        setAutomationData(mockAutomationData);
        setActiveProcesses(mockActiveProcesses);
        setAutomationStats(mockAutomationStats);
      } finally {
        setLoading(false);
      }
    };

    fetchAutomationData();
    const interval = setInterval(fetchAutomationData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const mockEfficiencyTrend = [
    { time: '00:00', efficiency: 92 },
    { time: '04:00', efficiency: 88 },
    { time: '08:00', efficiency: 95 },
    { time: '12:00', efficiency: 93 },
    { time: '16:00', efficiency: 97 },
    { time: '20:00', efficiency: 89 }
  ];

  const mockProcessMetrics = [
    { name: 'Quality Control', uptime: 98.5, efficiency: 95.2 },
    { name: 'Packaging', uptime: 92.1, efficiency: 88.7 },
    { name: 'Assembly', uptime: 96.8, efficiency: 93.4 },
    { name: 'Testing', uptime: 99.2, efficiency: 97.1 }
  ];

  const mockActiveProcesses = [
    {
      id: 'QC-001',
      name: 'Quality Control Batch 2025-001',
      status: 'running',
      progress: 85,
      startTime: '2025-09-08T08:30:00Z',
      estimatedCompletion: '2025-09-08T16:00:00Z'
    },
    {
      id: 'PKG-002',
      name: 'Packaging Line Alpha',
      status: 'running',
      progress: 62,
      startTime: '2025-09-08T09:15:00Z',
      estimatedCompletion: '2025-09-08T17:30:00Z'
    },
    {
      id: 'ASM-003',
      name: 'Assembly Station B',
      status: 'paused',
      progress: 45,
      startTime: '2025-09-08T07:45:00Z',
      estimatedCompletion: '2025-09-08T19:00:00Z'
    }
  ];

  const mockAutomationStats = {
    totalProcesses: 12,
    activeProcesses: 8,
    completedToday: 24,
    averageEfficiency: 94.2
  };

  const mockAutomationData = {
    stats: mockAutomationStats,
    activeProcesses: mockActiveProcesses
  };

  const handleProcessControl = async (processId, action) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiUrl}/automation/process/${processId}/${action}`, {
        method: 'POST'
      });
      if (response.ok) {
        // Update local state optimistically
        setActiveProcesses(prevProcesses =>
          prevProcesses.map(process =>
            process.id === processId
              ? { ...process, status: action === 'start' ? 'running' : action === 'pause' ? 'paused' : 'stopped' }
              : process
          )
        );
      }
    } catch (error) {
      console.error('Failed to control process:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'stopped':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return CheckCircleIcon;
      case 'paused':
        return ClockIcon;
      case 'stopped':
        return ExclamationTriangleIcon;
      default:
        return CogIcon;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Automation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor and control automated manufacturing processes
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Processes</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{automationStats.totalProcesses || 12}</p>
              <p className="text-sm text-gray-500 mt-1">Configured</p>
            </div>
            <CogIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{automationStats.activeProcesses || 8}</p>
              <p className="text-sm text-gray-500 mt-1">Running now</p>
            </div>
            <BoltIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Completed Today</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{automationStats.completedToday || 24}</p>
              <p className="text-sm text-gray-500 mt-1">Processes</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Avg Efficiency</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{automationStats.averageEfficiency || 94.2}%</p>
              <p className="text-sm text-gray-500 mt-1">This week</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Efficiency Trend (24 hours)</h2>
          </div>
          <div className="p-6">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockEfficiencyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Efficiency']} />
                  <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Process Performance</h2>
          </div>
          <div className="p-6">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockProcessMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Performance']} />
                  <Bar dataKey="uptime" fill="#3B82F6" name="Uptime" />
                  <Bar dataKey="efficiency" fill="#10B981" name="Efficiency" />
                </BarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>
      </div>

      {/* Active Processes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Processes</h2>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Configure
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {activeProcesses.length > 0 ? activeProcesses.map((process) => {
              const StatusIcon = getStatusIcon(process.status);
              return (
                <div key={process.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <StatusIcon className="h-6 w-6 text-gray-500" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{process.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">ID: {process.id}</p>
                      <div className="flex items-center mt-1">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${process.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{process.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}>
                      {process.status.charAt(0).toUpperCase() + process.status.slice(1)}
                    </span>
                    <div className="flex space-x-1">
                      {process.status !== 'running' && (
                        <button
                          onClick={() => handleProcessControl(process.id, 'start')}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      )}
                      {process.status === 'running' && (
                        <button
                          onClick={() => handleProcessControl(process.id, 'pause')}
                          className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                        >
                          <PauseIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleProcessControl(process.id, 'stop')}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <StopIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-500">
                <CogIcon className="h-12 w-12 mx-auto mb-4" />
                <p>No active automation processes</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Start New Process
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAutomation;
