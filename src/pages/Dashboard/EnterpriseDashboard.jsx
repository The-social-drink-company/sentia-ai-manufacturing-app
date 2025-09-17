import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { toast, Toaster } from 'react-hot-toast';
import { useHotkeys } from 'react-hotkeys-hook';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Components
import KPICard from '../../components/dashboard/KPICard';
import ProductionFlowChart from '../../components/charts/ProductionFlowChart';
import QualityMetricsChart from '../../components/charts/QualityMetricsChart';
import InventoryChart from '../../components/charts/InventoryChart';
import WorkingCapitalChart from '../../components/charts/WorkingCapitalChart';
import CommandPalette from '../../components/dashboard/CommandPalette';
import DashboardHeader from '../../components/layout/DashboardHeader';
import WidgetCatalog from '../../components/dashboard/WidgetCatalog';
import ThemeToggle from '../../components/ui/ThemeToggle';

// Hooks
import { useTheme } from '../../hooks/useTheme';
import { useProductionMetrics } from '../../hooks/useProductionMetrics';
import { useQualityMetrics } from '../../hooks/useQualityMetrics';
import { useInventoryMetrics } from '../../hooks/useInventoryMetrics';
import { useFinancialMetrics } from '../../hooks/useFinancialMetrics';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Default widget configurations
const defaultWidgets = [
  { id: 'production-flow', type: 'chart', title: 'Production Flow', component: 'ProductionFlowChart' },
  { id: 'quality-metrics', type: 'chart', title: 'Quality Metrics', component: 'QualityMetricsChart' },
  { id: 'inventory', type: 'chart', title: 'Inventory Levels', component: 'InventoryChart' },
  { id: 'working-capital', type: 'chart', title: 'Working Capital', component: 'WorkingCapitalChart' },
];

// Default grid layouts
const defaultLayouts = {
  lg: [
    { i: 'production-flow', x: 0, y: 0, w: 6, h: 4 },
    { i: 'quality-metrics', x: 6, y: 0, w: 6, h: 4 },
    { i: 'inventory', x: 0, y: 4, w: 6, h: 4 },
    { i: 'working-capital', x: 6, y: 4, w: 6, h: 4 },
  ],
  md: [
    { i: 'production-flow', x: 0, y: 0, w: 5, h: 4 },
    { i: 'quality-metrics', x: 5, y: 0, w: 5, h: 4 },
    { i: 'inventory', x: 0, y: 4, w: 5, h: 4 },
    { i: 'working-capital', x: 5, y: 4, w: 5, h: 4 },
  ],
  sm: [
    { i: 'production-flow', x: 0, y: 0, w: 6, h: 4 },
    { i: 'quality-metrics', x: 0, y: 4, w: 6, h: 4 },
    { i: 'inventory', x: 0, y: 8, w: 6, h: 4 },
    { i: 'working-capital', x: 0, y: 12, w: 6, h: 4 },
  ],
};

const EnterpriseDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [layouts, setLayouts] = useState(() => {
    const savedLayouts = localStorage.getItem('dashboardLayouts');
    return savedLayouts ? JSON.parse(savedLayouts) : defaultLayouts;
  });
  const [widgets, setWidgets] = useState(defaultWidgets);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [widgetCatalogOpen, setWidgetCatalogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch metrics
  const productionMetrics = useProductionMetrics();
  const qualityMetrics = useQualityMetrics();
  const inventoryMetrics = useInventoryMetrics();
  const financialMetrics = useFinancialMetrics();

  // Calculate KPI values
  const oee = productionMetrics?.oee || 85.2;
  const qualityRate = qualityMetrics?.rate || 98.7;
  const inventoryTurns = inventoryMetrics?.turns || 12.4;
  const workingCapital = financialMetrics?.workingCapital || 2450000;

  // Keyboard shortcuts
  useHotkeys('cmd+k, ctrl+k', (e) => {
    e.preventDefault();
    setCommandPaletteOpen(true);
  });

  useHotkeys('cmd+/, ctrl+/', (e) => {
    e.preventDefault();
    toggleTheme();
  });

  useHotkeys('cmd+e, ctrl+e', (e) => {
    e.preventDefault();
    setIsEditMode(!isEditMode);
    toast.success(`Edit mode ${!isEditMode ? 'enabled' : 'disabled'}`);
  });

  useHotkeys('cmd+w, ctrl+w', (e) => {
    e.preventDefault();
    setWidgetCatalogOpen(true);
  });

  // Handle layout changes
  const handleLayoutChange = useCallback((layout, allLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboardLayouts', JSON.stringify(allLayouts));
  }, []);

  // Add new widget
  const handleAddWidget = useCallback((widgetConfig) => {
    const newWidget = {
      ...widgetConfig,
      id: `widget-${Date.now()}`,
    };
    setWidgets([...widgets, newWidget]);

    // Add to layout
    const newLayoutItem = {
      i: newWidget.id,
      x: 0,
      y: 0,
      w: 6,
      h: 4,
    };

    const newLayouts = {
      lg: [...layouts.lg, newLayoutItem],
      md: [...layouts.md, newLayoutItem],
      sm: [...layouts.sm, { ...newLayoutItem, w: 6 }],
    };

    setLayouts(newLayouts);
    localStorage.setItem('dashboardLayouts', JSON.stringify(newLayouts));
    toast.success('Widget added successfully');
  }, [widgets, layouts]);

  // Remove widget
  const handleRemoveWidget = useCallback((widgetId) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));

    const newLayouts = {
      lg: layouts.lg.filter(l => l.i !== widgetId),
      md: layouts.md.filter(l => l.i !== widgetId),
      sm: layouts.sm.filter(l => l.i !== widgetId),
    };

    setLayouts(newLayouts);
    localStorage.setItem('dashboardLayouts', JSON.stringify(newLayouts));
    toast.success('Widget removed');
  }, [widgets, layouts]);

  // Widget component renderer
  const renderWidget = (widget) => {
    const componentMap = {
      ProductionFlowChart: <ProductionFlowChart data={productionMetrics} />,
      QualityMetricsChart: <QualityMetricsChart data={qualityMetrics} />,
      InventoryChart: <InventoryChart data={inventoryMetrics} />,
      WorkingCapitalChart: <WorkingCapitalChart data={financialMetrics} />,
    };

    return componentMap[widget.component] || <div>Unknown widget type</div>;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}
    >
      <Toaster position="top-right" />

      {/* Command Palette */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
        )}
      </AnimatePresence>

      {/* Widget Catalog */}
      <AnimatePresence>
        {widgetCatalogOpen && (
          <WidgetCatalog
            onClose={() => setWidgetCatalogOpen(false)}
            onAddWidget={handleAddWidget}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <DashboardHeader
        isEditMode={isEditMode}
        onToggleEdit={() => setIsEditMode(!isEditMode)}
        onOpenWidgetCatalog={() => setWidgetCatalogOpen(true)}
      />

      <div className="container mx-auto px-4 py-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <KPICard
              title="Production Efficiency"
              value={`${oee}%`}
              trend={+5.2}
              sparklineData={productionMetrics?.history || []}
              color="blue"
              icon="chart-line"
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <KPICard
              title="Quality Rate"
              value={`${qualityRate}%`}
              trend={-1.3}
              sparklineData={qualityMetrics?.history || []}
              color="green"
              icon="check-circle"
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <KPICard
              title="Inventory Turns"
              value={inventoryTurns}
              trend={+2.1}
              sparklineData={inventoryMetrics?.history || []}
              color="purple"
              icon="cube"
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <KPICard
              title="Working Capital"
              value={`$${(workingCapital / 1000000).toFixed(2)}M`}
              trend={+8.7}
              sparklineData={financialMetrics?.history || []}
              color="orange"
              icon="dollar-sign"
            />
          </motion.div>
        </div>

        {/* Main Grid */}
        <ResponsiveGridLayout
          className="dashboard-grid"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          compactType="vertical"
          preventCollision={false}
        >
          {widgets.map(widget => (
            <motion.div
              key={widget.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700"
              whileHover={isEditMode ? { scale: 1.02 } : {}}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {widget.title}
                </h3>
                {isEditMode && (
                  <button
                    onClick={() => handleRemoveWidget(widget.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="h-full">
                {renderWidget(widget)}
              </div>
            </motion.div>
          ))}
        </ResponsiveGridLayout>

        {/* Floating Action Button */}
        <motion.button
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setWidgetCatalogOpen(true)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </motion.button>

        {/* Theme Toggle */}
        <div className="fixed bottom-8 left-8">
          <ThemeToggle />
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-24 right-8 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs opacity-50 hover:opacity-100 transition-opacity">
        <div>⌘K - Command Palette</div>
        <div>⌘/ - Toggle Theme</div>
        <div>⌘E - Edit Mode</div>
        <div>⌘W - Widget Catalog</div>
      </div>
    </motion.div>
  );
};

export default EnterpriseDashboard;