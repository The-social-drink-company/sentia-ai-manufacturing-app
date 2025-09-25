import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
  PlusIcon,
  Cog6ToothIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../../styles/dashboard-grid.css';

// Import all widget components
import ProductionMetricsWidget from '../widgets/ProductionMetricsWidget';
import InventoryLevelsWidget from '../widgets/InventoryLevelsWidget';
import QualityControlWidget from '../widgets/QualityControlWidget';
import FinancialOverviewWidget from '../widgets/FinancialOverviewWidget';
import WorkingCapitalWidget from '../widgets/WorkingCapitalWidget';
import SupplyChainWidget from '../widgets/SupplyChainWidget';
import MaintenanceScheduleWidget from '../widgets/MaintenanceScheduleWidget';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget catalog with all available widgets
const WIDGET_CATALOG = [
  {
    id: 'production-metrics',
    name: 'Production Metrics',
    component: ProductionMetricsWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { minW: 3, minH: 3 },
    category: 'Operations'
  },
  {
    id: 'inventory-levels',
    name: 'Inventory Levels',
    component: InventoryLevelsWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { minW: 3, minH: 3 },
    category: 'Operations'
  },
  {
    id: 'quality-control',
    name: 'Quality Control',
    component: QualityControlWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { minW: 3, minH: 3 },
    category: 'Quality'
  },
  {
    id: 'financial-overview',
    name: 'Financial Overview',
    component: FinancialOverviewWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { minW: 4, minH: 3 },
    category: 'Finance'
  },
  {
    id: 'working-capital',
    name: 'Working Capital',
    component: WorkingCapitalWidget,
    defaultSize: { w: 6, h: 5 },
    minSize: { minW: 4, minH: 4 },
    category: 'Finance'
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    component: SupplyChainWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { minW: 4, minH: 3 },
    category: 'Supply Chain'
  },
  {
    id: 'maintenance-schedule',
    name: 'Maintenance Schedule',
    component: MaintenanceScheduleWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { minW: 4, minH: 3 },
    category: 'Maintenance'
  }
];

// Preset layouts for different roles
const PRESET_LAYOUTS = {
  admin: {
    lg: [
      { i: 'production-metrics', x: 0, y: 0, w: 6, h: 4 },
      { i: 'financial-overview', x: 6, y: 0, w: 6, h: 4 },
      { i: 'inventory-levels', x: 0, y: 4, w: 6, h: 4 },
      { i: 'quality-control', x: 6, y: 4, w: 6, h: 4 },
      { i: 'working-capital', x: 0, y: 8, w: 6, h: 5 },
      { i: 'supply-chain', x: 6, y: 8, w: 6, h: 5 }
    ]
  },
  manager: {
    lg: [
      { i: 'production-metrics', x: 0, y: 0, w: 6, h: 4 },
      { i: 'quality-control', x: 6, y: 0, w: 6, h: 4 },
      { i: 'inventory-levels', x: 0, y: 4, w: 6, h: 4 },
      { i: 'supply-chain', x: 6, y: 4, w: 6, h: 4 }
    ]
  },
  operator: {
    lg: [
      { i: 'production-metrics', x: 0, y: 0, w: 12, h: 4 },
      { i: 'quality-control', x: 0, y: 4, w: 6, h: 4 },
      { i: 'maintenance-schedule', x: 6, y: 4, w: 6, h: 4 }
    ]
  },
  viewer: {
    lg: [
      { i: 'production-metrics', x: 0, y: 0, w: 6, h: 4 },
      { i: 'financial-overview', x: 6, y: 0, w: 6, h: 4 }
    ]
  }
};

const DashboardGrid = ({ userRole = 'viewer' }) => {
  const { user } = useUser();
  const [layouts, setLayouts] = useState({});
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fullscreenWidget, setFullscreenWidget] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(userRole);

  // Load saved layout from database, then localStorage, then use preset
  useEffect(() => {
    const loadDashboardLayout = async () => {
      if (user?.id) {
        try {
          // First try to load from database
          const response = await fetch('/api/user/dashboard-layout', {
            headers: {
              'Authorization': `Bearer ${await user.getToken()}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.layouts && data.widgets) {
              setLayouts(data.layouts);
              setActiveWidgets(data.widgets);
              // Save to localStorage as cache
              localStorage.setItem(`dashboardLayout_${user.id}`, JSON.stringify(data.layouts));
              localStorage.setItem(`dashboardWidgets_${user.id}`, JSON.stringify(data.widgets));
              return;
            }
          }
        } catch (error) {
          logError('Failed to load layout from database:', error);
        }
      }

      // Fallback to localStorage
      const savedLayout = localStorage.getItem(`dashboardLayout_${user?.id}`);
      const savedWidgets = localStorage.getItem(`dashboardWidgets_${user?.id}`);

      if (savedLayout && savedWidgets) {
        setLayouts(JSON.parse(savedLayout));
        setActiveWidgets(JSON.parse(savedWidgets));
      } else {
        // Use preset layout for user role
        loadPresetLayout(userRole);
      }
    };

    loadDashboardLayout();
  }, [user, userRole]);

  // Load a preset layout
  const loadPresetLayout = (role) => {
    const preset = PRESET_LAYOUTS[role] || PRESET_LAYOUTS.viewer;
    const widgetIds = preset.lg.map(item => item.i);

    setLayouts({ lg: preset.lg, md: preset.lg, sm: preset.lg, xs: preset.lg });
    setActiveWidgets(widgetIds);
    setSelectedPreset(role);
  };

  // Save layout changes
  const handleLayoutChange = (layout, allLayouts) => {
    setLayouts(allLayouts);
    if (user?.id) {
      localStorage.setItem(`dashboardLayout_${user.id}`, JSON.stringify(allLayouts));
    }
  };

  // Add a widget to the dashboard
  const addWidget = (widgetId) => {
    if (activeWidgets.includes(widgetId)) return;

    const widget = WIDGET_CATALOG.find(w => w.id === widgetId);
    if (!widget) return;

    const newWidgets = [...activeWidgets, widgetId];
    setActiveWidgets(newWidgets);

    // Add to layout
    const newLayoutItem = {
      i: widgetId,
      x: 0,
      y: 0,
      ...widget.defaultSize,
      ...widget.minSize
    };

    const newLayouts = {
      lg: [...(layouts.lg || []), newLayoutItem],
      md: [...(layouts.md || []), newLayoutItem],
      sm: [...(layouts.sm || []), newLayoutItem],
      xs: [...(layouts.xs || []), newLayoutItem]
    };

    setLayouts(newLayouts);

    // Save to localStorage
    if (user?.id) {
      localStorage.setItem(`dashboardWidgets_${user.id}`, JSON.stringify(newWidgets));
      localStorage.setItem(`dashboardLayout_${user.id}`, JSON.stringify(newLayouts));
    }
  };

  // Remove a widget from the dashboard
  const removeWidget = (widgetId) => {
    const newWidgets = activeWidgets.filter(id => id !== widgetId);
    setActiveWidgets(newWidgets);

    const newLayouts = {
      lg: (layouts.lg || []).filter(item => item.i !== widgetId),
      md: (layouts.md || []).filter(item => item.i !== widgetId),
      sm: (layouts.sm || []).filter(item => item.i !== widgetId),
      xs: (layouts.xs || []).filter(item => item.i !== widgetId)
    };

    setLayouts(newLayouts);

    // Save to localStorage
    if (user?.id) {
      localStorage.setItem(`dashboardWidgets_${user.id}`, JSON.stringify(newWidgets));
      localStorage.setItem(`dashboardLayout_${user.id}`, JSON.stringify(newLayouts));
    }
  };

  // Toggle fullscreen for a widget
  const toggleFullscreen = (widgetId) => {
    setFullscreenWidget(fullscreenWidget === widgetId ? null : widgetId);
  };

  // Clear saved layout
  const clearLayout = () => {
    if (user?.id) {
      localStorage.removeItem(`dashboardLayout_${user.id}`);
      localStorage.removeItem(`dashboardWidgets_${user.id}`);
    }
    loadPresetLayout(userRole);
  };

  // Save layout to database (API call)
  const saveLayoutToDatabase = async () => {
    if (!user?.id) {
      logWarn('Cannot save layout: User not authenticated');
      return;
    }

    try {
      const token = await user.getToken();
      const response = await fetch('/api/user/dashboard-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          layouts,
          widgets: activeWidgets
        })
      });

      if (response.ok) {
        const data = await response.json();
        // // // // // // // logDebug('Layout saved to database:', data.message);
        // Show success notification (you can add a toast notification here)
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = 'Dashboard layout saved successfully!';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
      } else {
        const error = await response.json();
        logError('Failed to save layout:', error);
      }
    } catch (error) {
      logError('Failed to save layout:', error);
    }
  };

  // Render a widget component
  const renderWidget = (widgetId) => {
    const widget = WIDGET_CATALOG.find(w => w.id === widgetId);
    if (!widget) return null;

    const WidgetComponent = widget.component;

    return (
      <div key={widgetId} className="dashboard-widget-container h-full">
        {editMode && (
          <div className="widget-header absolute top-0 left-0 right-0 bg-gray-100 dark:bg-gray-700 p-2 flex justify-between items-center cursor-move z-10">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {widget.name}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleFullscreen(widgetId)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                title="Toggle fullscreen"
              >
                {fullscreenWidget === widgetId ?
                  <ArrowsPointingInIcon className="h-4 w-4" /> :
                  <ArrowsPointingOutIcon className="h-4 w-4" />
                }
              </button>
              <button
                onClick={() => removeWidget(widgetId)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                title="Remove widget"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        <div className={`h-full ${editMode ? 'pt-10' : ''} overflow-auto`}>
          <WidgetComponent />
        </div>
      </div>
    );
  };

  // Fullscreen widget overlay
  if (fullscreenWidget) {
    const widget = WIDGET_CATALOG.find(w => w.id === fullscreenWidget);
    const WidgetComponent = widget?.component;

    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-auto">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setFullscreenWidget(null)}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
          >
            <ArrowsPointingInIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 h-full">
          {WidgetComponent && <WidgetComponent />}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid-container">
      {/* Control Bar */}
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCatalog(!showCatalog)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Widget
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded flex items-center ${
                editMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              {editMode ? 'Done Editing' : 'Edit Layout'}
            </button>
          </div>

          <div className="flex space-x-2">
            {/* Preset Layout Selector */}
            <select
              value={selectedPreset}
              onChange={(e) => loadPresetLayout(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            >
              <option value="">Load Preset</option>
              <option value="admin">Admin Layout</option>
              <option value="manager">Manager Layout</option>
              <option value="operator">Operator Layout</option>
              <option value="viewer">Viewer Layout</option>
            </select>

            <button
              onClick={clearLayout}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Reset Layout
            </button>

            <button
              onClick={saveLayoutToDatabase}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save to Profile
            </button>
          </div>
        </div>
      </div>

      {/* Widget Catalog */}
      {showCatalog && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Widget Catalog</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {WIDGET_CATALOG.map(widget => (
              <div
                key={widget.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  activeWidgets.includes(widget.id)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
                onClick={() => !activeWidgets.includes(widget.id) && addWidget(widget.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{widget.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{widget.category}</p>
                  </div>
                  {activeWidgets.includes(widget.id) && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".widget-header"
        compactType="vertical"
        margin={[16, 16]}
      >
        {activeWidgets.map(widgetId => renderWidget(widgetId))}
      </ResponsiveGridLayout>

      {/* Empty State */}
      {activeWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Squares2X2Icon className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Widgets Added
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Click "Add Widget" to start building your dashboard
          </p>
          <button
            onClick={() => setShowCatalog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Your First Widget
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardGrid;