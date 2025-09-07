# Main Dashboard - Complete Implementation Code

## Full React Component Code with AI/ML/MCP Integration

```jsx
// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Activity, TrendingUp, Users, Package, AlertTriangle, 
  Settings, Plus, X, Save, RefreshCw, Maximize2, Minimize2,
  Cpu, Database, Globe, Zap, Shield, Bell
} from 'lucide-react';
import { useSSE } from '../hooks/useSSE';
import { useDashboardStore } from '../stores/dashboardStore';
import { useAuthRole } from '../hooks/useAuthRole';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Import AI/ML components
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel';
import { MCPConnectionStatus } from '../components/mcp/MCPConnectionStatus';
import { MLForecastWidget } from '../components/ml/MLForecastWidget';
import { DigitalTwinViewer } from '../components/3d/DigitalTwinViewer';
import { AgentMonitor } from '../components/agents/AgentMonitor';
import { NaturalLanguageQuery } from '../components/ai/NaturalLanguageQuery';

const ResponsiveGridLayout = WidthProvider(Responsive);

const Dashboard = () => {
  const { user } = useUser();
  const { hasPermission } = useAuthRole();
  const queryClient = useQueryClient();
  
  // State management
  const [editMode, setEditMode] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [mcpConnected, setMcpConnected] = useState(false);
  const [aiAgents, setAiAgents] = useState([]);
  const [mlModels, setMlModels] = useState([]);
  const [digitalTwinData, setDigitalTwinData] = useState(null);
  
  // Zustand store
  const { 
    layouts, 
    widgets, 
    updateLayout, 
    addWidget, 
    removeWidget,
    updateWidgetSettings 
  } = useDashboardStore();

  // Real-time SSE connection
  const sseEvents = useSSE('/api/sse/dashboard', {
    onMessage: (event) => handleSSEMessage(event),
    onError: (error) => console.error('SSE Error:', error),
    reconnectDelay: 3000
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/data', {
        headers: { 'Authorization': `Bearer ${await user.getToken()}` }
      });
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // MCP connection management
  useEffect(() => {
    connectToMCP();
    loadAIAgents();
    loadMLModels();
    initializeDigitalTwin();
    
    return () => {
      disconnectMCP();
    };
  }, []);

  const connectToMCP = async () => {
    try {
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getToken()}`
        },
        body: JSON.stringify({
          servers: [
            { name: 'filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
            { name: 'github', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
            { name: 'postgres', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'] }
          ]
        })
      });
      
      if (response.ok) {
        setMcpConnected(true);
        toast.success('MCP servers connected successfully');
      }
    } catch (error) {
      console.error('MCP connection failed:', error);
      toast.error('Failed to connect MCP servers');
    }
  };

  const disconnectMCP = async () => {
    try {
      await fetch('/api/mcp/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${await user.getToken()}` }
      });
    } catch (error) {
      console.error('MCP disconnect error:', error);
    }
  };

  const loadAIAgents = async () => {
    try {
      const response = await fetch('/api/ai/agents', {
        headers: { 'Authorization': `Bearer ${await user.getToken()}` }
      });
      const agents = await response.json();
      setAiAgents(agents);
    } catch (error) {
      console.error('Failed to load AI agents:', error);
    }
  };

  const loadMLModels = async () => {
    try {
      const response = await fetch('/api/ml/models', {
        headers: { 'Authorization': `Bearer ${await user.getToken()}` }
      });
      const models = await response.json();
      setMlModels(models);
    } catch (error) {
      console.error('Failed to load ML models:', error);
    }
  };

  const initializeDigitalTwin = async () => {
    try {
      const response = await fetch('/api/digital-twin/initialize', {
        headers: { 'Authorization': `Bearer ${await user.getToken()}` }
      });
      const data = await response.json();
      setDigitalTwinData(data);
    } catch (error) {
      console.error('Failed to initialize digital twin:', error);
    }
  };

  const handleSSEMessage = (event) => {
    const { type, data } = JSON.parse(event.data);
    
    switch (type) {
      case 'KPI_UPDATE':
        queryClient.invalidateQueries(['kpis']);
        break;
      case 'ALERT':
        toast.error(data.message, { icon: <AlertTriangle className="w-4 h-4" /> });
        break;
      case 'AGENT_STATUS':
        setAiAgents(prev => prev.map(agent => 
          agent.id === data.agentId ? { ...agent, ...data } : agent
        ));
        break;
      case 'ML_PREDICTION':
        queryClient.setQueryData(['predictions', data.modelId], data.prediction);
        break;
      case 'DIGITAL_TWIN_UPDATE':
        setDigitalTwinData(prev => ({ ...prev, ...data }));
        break;
      default:
        console.log('Unknown SSE event:', type);
    }
  };

  // Widget definitions with AI/ML features
  const availableWidgets = [
    {
      id: 'kpi-strip',
      name: 'KPI Strip',
      icon: <TrendingUp className="w-5 h-5" />,
      component: KPIStripWidget,
      defaultSize: { w: 12, h: 2 },
      permissions: ['view_dashboard']
    },
    {
      id: 'ai-insights',
      name: 'AI Insights',
      icon: <Brain className="w-5 h-5" />,
      component: AIInsightsPanel,
      defaultSize: { w: 6, h: 4 },
      permissions: ['view_ai_insights']
    },
    {
      id: 'ml-forecast',
      name: 'ML Forecast',
      icon: <Activity className="w-5 h-5" />,
      component: MLForecastWidget,
      defaultSize: { w: 6, h: 4 },
      permissions: ['view_forecasts']
    },
    {
      id: 'digital-twin',
      name: 'Digital Twin 3D',
      icon: <Cpu className="w-5 h-5" />,
      component: DigitalTwinViewer,
      defaultSize: { w: 8, h: 6 },
      permissions: ['view_digital_twin']
    },
    {
      id: 'agent-monitor',
      name: 'AI Agent Monitor',
      icon: <Zap className="w-5 h-5" />,
      component: AgentMonitor,
      defaultSize: { w: 4, h: 4 },
      permissions: ['view_agents']
    },
    {
      id: 'nlq-interface',
      name: 'Natural Language Query',
      icon: <Globe className="w-5 h-5" />,
      component: NaturalLanguageQuery,
      defaultSize: { w: 12, h: 3 },
      permissions: ['use_nlq']
    }
  ];

  // Layout change handler
  const handleLayoutChange = (layout, layouts) => {
    if (!editMode) return;
    updateLayout(layouts);
  };

  // Add widget handler
  const handleAddWidget = (widgetType) => {
    const widgetDef = availableWidgets.find(w => w.id === widgetType);
    if (!widgetDef) return;

    const newWidget = {
      i: `${widgetType}-${Date.now()}`,
      x: 0,
      y: 0,
      ...widgetDef.defaultSize,
      type: widgetType,
      settings: {}
    };

    addWidget(newWidget);
    toast.success(`Added ${widgetDef.name} widget`);
  };

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/dashboard/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getToken()}`
        },
        body: JSON.stringify({ layouts, widgets })
      });
      
      if (!response.ok) throw new Error('Failed to save layout');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Dashboard layout saved');
      setEditMode(false);
    },
    onError: () => {
      toast.error('Failed to save layout');
    }
  });

  // Render individual widget
  const renderWidget = (widget) => {
    const widgetDef = availableWidgets.find(w => w.id === widget.type);
    if (!widgetDef || !hasPermission(widgetDef.permissions[0])) return null;

    const WidgetComponent = widgetDef.component;
    
    return (
      <div key={widget.i} className="h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          {editMode && (
            <div className="absolute top-2 right-2 z-10 flex space-x-2">
              <button
                onClick={() => setSelectedWidget(widget)}
                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeWidget(widget.i)}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <WidgetComponent 
            widget={widget} 
            data={dashboardData}
            mcpConnected={mcpConnected}
            aiAgents={aiAgents}
            mlModels={mlModels}
            digitalTwinData={digitalTwinData}
          />
        </motion.div>
      </div>
    );
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Production Dashboard
              </h1>
              <MCPConnectionStatus connected={mcpConnected} />
              <AgentStatusIndicator agents={aiAgents} />
            </div>
            
            <div className="flex items-center space-x-3">
              {/* AI/ML Status Indicators */}
              <div className="flex items-center space-x-2">
                {mlModels.map(model => (
                  <ModelStatusBadge key={model.id} model={model} />
                ))}
              </div>

              {/* Dashboard Controls */}
              {hasPermission('edit_dashboard') && (
                <>
                  {editMode ? (
                    <>
                      <button
                        onClick={() => saveLayoutMutation.mutate()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Layout</span>
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Edit Dashboard</span>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => queryClient.invalidateQueries()}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Edit Mode Widget Selector */}
          {editMode && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Drag widgets to rearrange. Click + to add new widgets.
              </p>
              <div className="flex flex-wrap gap-2">
                {availableWidgets
                  .filter(w => hasPermission(w.permissions[0]))
                  .map(widget => (
                    <button
                      key={widget.id}
                      onClick={() => handleAddWidget(widget.id)}
                      className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-2 text-sm"
                    >
                      {widget.icon}
                      <span>{widget.name}</span>
                      <Plus className="w-4 h-4" />
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="p-4 sm:p-6 lg:p-8">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={editMode}
          isResizable={editMode}
          compactType="vertical"
          preventCollision={false}
        >
          {widgets.map(renderWidget)}
        </ResponsiveGridLayout>
      </div>

      {/* Widget Settings Modal */}
      <AnimatePresence>
        {selectedWidget && (
          <WidgetSettingsModal
            widget={selectedWidget}
            onClose={() => setSelectedWidget(null)}
            onSave={(settings) => {
              updateWidgetSettings(selectedWidget.i, settings);
              setSelectedWidget(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* AI Assistant Floating Button */}
      {hasPermission('use_ai_assistant') && (
        <AIAssistantButton />
      )}
    </div>
  );
};

// KPI Strip Widget Component
const KPIStripWidget = ({ data }) => {
  const kpis = [
    { label: 'Production Rate', value: data?.productionRate || '0', unit: 'units/hr', trend: '+5%' },
    { label: 'Quality Score', value: data?.qualityScore || '0', unit: '%', trend: '+2%' },
    { label: 'OEE', value: data?.oee || '0', unit: '%', trend: '+3%' },
    { label: 'Downtime', value: data?.downtime || '0', unit: 'hrs', trend: '-10%' }
  ];

  return (
    <div className="h-full p-4">
      <div className="grid grid-cols-4 gap-4 h-full">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">{kpi.label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {kpi.value}
              <span className="text-sm font-normal ml-1">{kpi.unit}</span>
            </div>
            <div className={`text-sm mt-1 ${
              kpi.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Agent Status Indicator Component
const AgentStatusIndicator = ({ agents }) => {
  const activeAgents = agents.filter(a => a.status === 'active').length;
  
  return (
    <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <Zap className={`w-4 h-4 ${activeAgents > 0 ? 'text-green-500' : 'text-gray-400'}`} />
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {activeAgents} / {agents.length} Agents Active
      </span>
    </div>
  );
};

// Model Status Badge Component
const ModelStatusBadge = ({ model }) => {
  return (
    <div className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${
      model.status === 'online' 
        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }`}>
      <Brain className="w-3 h-3" />
      <span>{model.name}</span>
    </div>
  );
};

// Widget Settings Modal Component
const WidgetSettingsModal = ({ widget, onClose, onSave }) => {
  const [settings, setSettings] = useState(widget.settings || {});

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Widget Settings</h3>
        
        {/* Widget-specific settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Refresh Interval</label>
            <select
              value={settings.refreshInterval || '30'}
              onChange={(e) => setSettings({ ...settings, refreshInterval: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data Source</label>
            <select
              value={settings.dataSource || 'live'}
              onChange={(e) => setSettings({ ...settings, dataSource: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="live">Live Data</option>
              <option value="historical">Historical</option>
              <option value="predicted">ML Predictions</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(settings)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// AI Assistant Floating Button
const AIAssistantButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white z-40"
      >
        <Brain className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <NaturalLanguageQuery
            onClose={() => setIsOpen(false)}
            floating={true}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Dashboard Skeleton Loader
const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-12 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="col-span-4 h-64 bg-white dark:bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

## Dashboard Store (Zustand)

```javascript
// src/stores/dashboardStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDashboardStore = create(
  persist(
    (set, get) => ({
      layouts: {
        lg: [],
        md: [],
        sm: [],
        xs: [],
        xxs: []
      },
      widgets: [],
      theme: 'light',
      
      updateLayout: (newLayouts) => set({ layouts: newLayouts }),
      
      addWidget: (widget) => set((state) => ({
        widgets: [...state.widgets, widget],
        layouts: {
          ...state.layouts,
          lg: [...state.layouts.lg, widget]
        }
      })),
      
      removeWidget: (widgetId) => set((state) => ({
        widgets: state.widgets.filter(w => w.i !== widgetId),
        layouts: Object.fromEntries(
          Object.entries(state.layouts).map(([key, value]) => [
            key,
            value.filter(w => w.i !== widgetId)
          ])
        )
      })),
      
      updateWidgetSettings: (widgetId, settings) => set((state) => ({
        widgets: state.widgets.map(w => 
          w.i === widgetId ? { ...w, settings } : w
        )
      })),
      
      setTheme: (theme) => set({ theme }),
      
      resetDashboard: () => set({
        layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
        widgets: []
      })
    }),
    {
      name: 'dashboard-storage',
      getStorage: () => localStorage
    }
  )
);
```

## Key Features Implemented

1. **MCP Integration**: Full Model Context Protocol support with multiple servers
2. **AI/ML Components**: Integrated forecasting, insights, and predictions
3. **Digital Twin**: 3D visualization component integration
4. **Agent Monitoring**: Real-time AI agent status tracking
5. **Natural Language Query**: AI-powered data exploration
6. **Real-time Updates**: SSE for live data streaming
7. **Drag-and-Drop Layout**: Fully customizable grid system
8. **Role-Based Access**: Permission-based widget visibility
9. **Dark Mode Support**: Complete theming system
10. **Persistent State**: Layout saved to localStorage and backend