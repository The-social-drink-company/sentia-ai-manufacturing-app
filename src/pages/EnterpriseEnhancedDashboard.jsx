import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
// Enterprise AI Components (Lazy Loaded for Performance)
const AIAnalyticsDashboard = lazy(() => import('../components/AI/AIAnalyticsDashboard'));
const PredictiveAnalyticsDashboard = lazy(() => import('../components/AI/PredictiveAnalyticsDashboard'));
// MCPConnectionStatus component removed - not available

// Advanced Widgets  
const AIForecastingWidget = lazy(() => import('../components/widgets/AIForecastingWidget'));
// MCPStatusWidget component removed - not available
const WorkingCapitalWidget = lazy(() => import('../components/widgets/WorkingCapitalWidget'));
const SupplyChainWidget = lazy(() => import('../components/widgets/SupplyChainWidget'));

// Real-time Hooks
import { useSSE } from '../hooks/useSSE';
import { useRealTimeData } from '../hooks/useRealTimeData.jsx';
import { useAIRealTimeData } from '../hooks/useAIRealTimeData';
// useMCPService hook removed - not available

// Enterprise Layout Components
import DashboardGrid from '../components/layout/DashboardGrid';
import { AdvancedKPI, ProductionStageKPI, ChannelKPI } from '../components/ui/AdvancedKPI';
import { MultiChannelBarChart, ProductionPipelineChart } from '../components/charts/RealTimeChart';
import { NotificationSystem, notifySuccess, notifyInfo } from '../components/ui/NotificationSystem';

// Icons
import { 
  Brain, Zap, TrendingUp, BarChart3, Settings, 
  Activity, AlertTriangle, Target, RefreshCw,
  Cpu, Database, Network, Shield
} from 'lucide-react';

// Enterprise Loading Component
const EnterpriseLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-secondary to-tertiary flex items-center justify-center">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
        <Cpu className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-primary">Sentia Manufacturing</h3>
      <p className="text-secondary">Loading enterprise dashboard with AI integration...</p>
      <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-tertiary">
        <Brain className="w-4 h-4" />
        <span>AI Analytics</span>
        <span>•</span>
        <Network className="w-4 h-4" />
        <span>MCP Protocol</span>
        <span>•</span>
        <Database className="w-4 h-4" />
        <span>Real-time Data</span>
      </div>
    </div>
  </div>
);

// Enterprise Error Boundary
const EnterpriseErrorFallback = ({ error, resetError }) => (
  <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-elevated rounded-lg shadow-theme-lg p-6 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-primary mb-2">Enterprise Dashboard Error</h2>
      <p className="text-secondary mb-4">
        A critical error occurred in the enterprise dashboard system.
      </p>
      <div className="bg-tertiary rounded p-3 mb-4 text-xs text-left overflow-x-auto">
        <code className="text-red-600">{error?.message}</code>
      </div>
      <div className="flex space-x-3">
        <button 
          onClick={resetError}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Dashboard
        </button>
        <button 
          onClick={() => window.location.href = '/dashboard?fallback=true'}
          className="flex-1 bg-secondary text-primary px-4 py-2 rounded hover:bg-tertiary"
        >
          Simple Mode
        </button>
      </div>
    </div>
  </div>
);

// Main Enterprise Enhanced Dashboard
export default function EnterpriseEnhancedDashboard() {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  const [selectedView, setSelectedView] = useState('overview');
  const [aiMode, setAIMode] = useState(true);
  const [mcpEnabled, setMcpEnabled] = useState(true);

  // Real-time Data Hooks
  const { data: kpiData, loading: kpiLoading } = useRealTimeData('/api/kpis/realtime', 15000);
  const { data: aiData, loading: aiLoading } = useAIRealTimeData('/api/ai/insights', 30000);
  const { data: mcpStatus, loading: mcpLoading } = useMCPService();
  
  // SSE for Live Updates
  const { data: liveUpdates, connected: sseConnected } = useSSE('/api/sse/dashboard');

  // Advanced Analytics Query
  const { data: analyticsData } = useQuery({
    queryKey: ['enterprise-analytics', selectedView],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/enterprise?view=${selectedView}`);
      return response.ok ? response.json() : null;
    },
    refetchInterval: 60000,
    enabled: isLoaded && !!user
  });

  // Production Data with AI Enhancement
  const { data: productionData } = useQuery({
    queryKey: ['production-ai-enhanced'],
    queryFn: async () => {
      const response = await fetch('/api/production/ai-enhanced');
      return response.ok ? response.json() : null;
    },
    refetchInterval: 30000,
    enabled: aiMode
  });

  if (!isLoaded) {
    return <EnterpriseLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <NotificationSystem />
      
      {/* Enterprise Header */}
      <div className="bg-elevated shadow-theme-sm border-b border-light">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Sentia Manufacturing</h1>
                <p className="text-sm text-secondary">Enterprise AI-Powered Dashboard</p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-secondary">Live Data</span>
              </div>
              
              {mcpEnabled && (
                <div className="flex items-center space-x-2">
                  <Network className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-secondary">MCP Active</span>
                </div>
              )}
              
              {aiMode && (
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-secondary">AI Enhanced</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-xs text-secondary">{"User" || null}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* View Selector */}
        <div className="mb-6 flex space-x-2 bg-white rounded-lg p-1 shadow-sm">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'ai-analytics', label: 'AI Analytics', icon: Brain },
            { id: 'production', label: 'Production', icon: Activity },
            { id: 'mcp-status', label: 'MCP Status', icon: Network }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedView(id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedView === id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-secondary hover:text-primary hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Dynamic Content Based on Selected View */}
        <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>

          {selectedView === 'overview' && (
            <div className="space-y-6">
              {/* Enterprise KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdvancedKPI
                  title="Production Efficiency"
                  value={kpiData?.efficiency || null}
                  trend={kpiData?.efficiencyTrend || null}
                  icon={<Target className="w-5 h-5" />}
                  color="blue"
                  loading={kpiLoading}
                />
                <AdvancedKPI
                  title="AI Predictions"
                  value={aiData?.predictions || null}
                  trend={aiData?.accuracy || null}
                  icon={<Brain className="w-5 h-5" />}
                  color="purple"
                  loading={aiLoading}
                />
                <ProductionStageKPI
                  title="Quality Score"
                  value={kpiData?.quality || null}
                  stages={kpiData?.qualityStages}
                  loading={kpiLoading}
                />
                <ChannelKPI
                  title="Multi-Channel"
                  channels={kpiData?.channels}
                  loading={kpiLoading}
                />
              </div>

              {/* Enterprise Widgets Grid */}
              <DashboardGrid>
                <AIForecastingWidget aiMode={aiMode} />
                <WorkingCapitalWidget />
                <SupplyChainWidget />
                {mcpEnabled && <MCPStatusWidget status={mcpStatus} />}
              </DashboardGrid>

              {/* Real-time Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Multi-Channel Performance
                  </h3>
                  <MultiChannelBarChart data={kpiData?.channelData} />
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Production Pipeline
                  </h3>
                  <ProductionPipelineChart data={productionData?.pipeline} />
                </div>
              </div>
            </div>
          )}

          {selectedView === 'ai-analytics' && (
            <AIAnalyticsDashboard />
          )}

          {selectedView === 'production' && (
            <PredictiveAnalyticsDashboard />
          )}

          {selectedView === 'mcp-status' && mcpEnabled && (
            <MCPConnectionStatus status={mcpStatus} />
          )}

        </Suspense>

        {/* Enterprise Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Real-time Integration</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI-Powered Analytics</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <Network className="w-4 h-4" />
              <span>MCP Protocol</span>
            </div>
          </div>
          <p className="mt-2">Sentia Manufacturing Dashboard v2.0 - Enterprise Edition</p>
        </div>
      </div>
    </div>
  );
}