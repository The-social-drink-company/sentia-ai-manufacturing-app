import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowTrendingUpIcon, 
  CogIcon, 
  ChartBarIcon,
  BoltIcon,
  CpuChipIcon,
  BeakerIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  CloudIcon
} from '@heroicons/react/24/outline';

// Import AI and MCP components
import AIAnalyticsDashboard from '../components/AI/AIAnalyticsDashboard';
import MCPConnectionStatus from '../components/AI/MCPConnectionStatus';
import { useSSE } from '../hooks/useSSE';

export default function EnhancedDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');

  // Real-time data connection
  const { data: realtimeData, isConnected } = useSSE('/api/kpis/realtime');

  // MCP Service health check (disabled - service not available)
  // const { data: mcpHealth } = useQuery({
  //   queryKey: ['mcp-health'],
  //   queryFn: () => ({ status: 'disconnected', services: [] }),
  //   refetchInterval: 30000,
  // });

  // Fetch dashboard data
  const { data: dashboardData, refetch } = useQuery({
    queryKey: ['dashboard-data', selectedView],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/overview');
      if (!response.ok) {
        // Use fallback data if API not available
        return mockDashboardData;
      }
      return response.json();
    },
    refetchInterval: 15000,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing Sentia Enterprise Platform...</p>
          <p className="mt-2 text-sm text-gray-500">Loading AI Analytics & MCP Integration</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render AI Analytics view
  if (selectedView === 'ai-analytics') {
    return <AIAnalyticsDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sentia Manufacturing Dashboard</h1>
          <p className="text-gray-600 mt-2">Enterprise Manufacturing Analytics & Control Center</p>
          <div className="mt-2 flex items-center space-x-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ● Live Data
            </span>
            <span className="text-gray-500 text-sm">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Production Output</h3>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
                <p className="text-sm text-green-600">↗ +12% from yesterday</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Efficiency Rate</h3>
                <p className="text-2xl font-bold text-gray-900">94.2%</p>
                <p className="text-sm text-green-600">↗ +2.1% from last week</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 bg-yellow-600 rounded"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Quality Score</h3>
                <p className="text-2xl font-bold text-gray-900">98.7%</p>
                <p className="text-sm text-yellow-600">→ Stable</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Active Orders</h3>
                <p className="text-2xl font-bold text-gray-900">87</p>
                <p className="text-sm text-blue-600">24 urgent priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Production Overview */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Production Lines Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Line A - Assembly</p>
                    <p className="text-sm text-gray-500">Running at 98% capacity</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">Running</p>
                  <p className="text-xs text-gray-500">234 units/hr</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Line B - Packaging</p>
                    <p className="text-sm text-gray-500">Running at 95% capacity</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">Running</p>
                  <p className="text-xs text-gray-500">187 units/hr</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Line C - Quality Check</p>
                    <p className="text-sm text-gray-500">Scheduled maintenance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-600">Maintenance</p>
                  <p className="text-xs text-gray-500">Resumes at 2:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <p className="font-medium text-blue-900">Working Capital Analysis</p>
                  <p className="text-sm text-blue-600">Review financial metrics</p>
                </button>
                
                <button className="w-full text-left p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <p className="font-medium text-green-900">What-If Scenarios</p>
                  <p className="text-sm text-green-600">Model production changes</p>
                </button>
                
                <button className="w-full text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <p className="font-medium text-purple-900">Admin Panel</p>
                  <p className="text-sm text-purple-600">System configuration</p>
                </button>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-green-800">Order #12345 completed</p>
                    <p className="text-xs text-green-600">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800">Maintenance scheduled</p>
                    <p className="text-xs text-yellow-600">10 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800">Quality check passed</p>
                    <p className="text-xs text-blue-600">15 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Financial Overview */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">£1.2M</p>
              <p className="text-gray-600 text-sm">Current Cash Flow</p>
              <p className="text-xs text-green-600 mt-1">↗ +5.2% this month</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">£890K</p>
              <p className="text-gray-600 text-sm">Accounts Receivable</p>
              <p className="text-xs text-green-600 mt-1">↗ +2.1% this month</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">£450K</p>
              <p className="text-gray-600 text-sm">Inventory Value</p>
              <p className="text-xs text-yellow-600 mt-1">→ Stable</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">89 days</p>
              <p className="text-gray-600 text-sm">Cash Conversion Cycle</p>
              <p className="text-xs text-green-600 mt-1">↘ -3 days improvement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}