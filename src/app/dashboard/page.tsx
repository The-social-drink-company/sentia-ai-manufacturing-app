// Executive Dashboard - Main dashboard page with comprehensive KPIs and AI insights

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { 
  Settings, 
  Maximize, 
  Minimize, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Save,
  Download,
  Command
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { KPISection } from '@/components/dashboard/KPISection';
import { MultiMarketHeatMap } from '@/components/dashboard/MultiMarketHeatMap';
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { CommandPalette } from '@/components/dashboard/CommandPalette';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useDashboardLayoutStore } from '@/stores/dashboardLayoutStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useMarketSelectionStore } from '@/stores/marketSelectionStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget definitions
interface DashboardWidget {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  minW: number;
  minH: number;
  maxW?: number;
  maxH?: number;
  props?: Record<string, any>;
  category: 'metrics' | 'analytics' | 'insights' | 'activity';
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'kpi-section',
    title: 'Key Performance Indicators',
    component: KPISection,
    minW: 12,
    minH: 4,
    maxH: 6,
    category: 'metrics',
  },
  {
    id: 'market-heatmap',
    title: 'Multi-Market Performance',
    component: MultiMarketHeatMap,
    minW: 6,
    minH: 6,
    maxW: 12,
    maxH: 8,
    category: 'analytics',
  },
  {
    id: 'ai-insights',
    title: 'AI Insights & Recommendations',
    component: AIInsightsPanel,
    minW: 4,
    minH: 8,
    maxW: 8,
    maxH: 12,
    category: 'insights',
  },
  {
    id: 'activity-feed',
    title: 'Real-Time Activity',
    component: ActivityFeed,
    minW: 4,
    minH: 6,
    maxW: 6,
    maxH: 10,
    category: 'activity',
  },
];

// Default layout configuration
const defaultLayouts = {
  lg: [
    { i: 'kpi-section', x: 0, y: 0, w: 12, h: 4 },
    { i: 'market-heatmap', x: 0, y: 4, w: 8, h: 6 },
    { i: 'ai-insights', x: 8, y: 4, w: 4, h: 8 },
    { i: 'activity-feed', x: 0, y: 10, w: 4, h: 6 },
  ],
  md: [
    { i: 'kpi-section', x: 0, y: 0, w: 10, h: 4 },
    { i: 'market-heatmap', x: 0, y: 4, w: 10, h: 6 },
    { i: 'ai-insights', x: 0, y: 10, w: 5, h: 8 },
    { i: 'activity-feed', x: 5, y: 10, w: 5, h: 8 },
  ],
  sm: [
    { i: 'kpi-section', x: 0, y: 0, w: 6, h: 4 },
    { i: 'market-heatmap', x: 0, y: 4, w: 6, h: 6 },
    { i: 'ai-insights', x: 0, y: 10, w: 6, h: 8 },
    { i: 'activity-feed', x: 0, y: 18, w: 6, h: 6 },
  ],
  xs: [
    { i: 'kpi-section', x: 0, y: 0, w: 4, h: 4 },
    { i: 'market-heatmap', x: 0, y: 4, w: 4, h: 6 },
    { i: 'ai-insights', x: 0, y: 10, w: 4, h: 8 },
    { i: 'activity-feed', x: 0, y: 18, w: 4, h: 6 },
  ],
  xxs: [
    { i: 'kpi-section', x: 0, y: 0, w: 1, h: 4 },
    { i: 'market-heatmap', x: 0, y: 4, w: 1, h: 6 },
    { i: 'ai-insights', x: 0, y: 10, w: 1, h: 8 },
    { i: 'activity-feed', x: 0, y: 18, w: 1, h: 6 },
  ],
};

export default function ExecutiveDashboard() {
  // State management
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());
  const [layouts, setLayouts] = useState(defaultLayouts);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

  // Store hooks
  const { preferences } = useUserPreferencesStore();
  const { activeMarket } = useMarketSelectionStore();
  const {
    currentLayout,
    actions: layoutActions,
  } = useDashboardLayoutStore();

  // WebSocket connection for real-time updates
  const { isConnected, connectionState } = useWebSocket({
    enabled: true,
    onConnect: () => console.log('Dashboard WebSocket connected'),
    onDisconnect: () => console.log('Dashboard WebSocket disconnected'),
  });

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Load saved layout if available
        if (currentLayout?.layouts) {
          setLayouts(currentLayout.layouts);
        }

        // Load widget visibility preferences
        if (currentLayout?.widgets) {
          const hiddenWidgetIds = Object.entries(currentLayout.widgets)
            .filter(([_, config]) => !config.visible)
            .map(([id]) => id);
          setHiddenWidgets(new Set(hiddenWidgetIds));
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [currentLayout]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command palette (Cmd+K or Ctrl+K)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }

      // Toggle edit mode (Cmd+E or Ctrl+E)
      if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
        event.preventDefault();
        toggleEditMode();
      }

      // Toggle fullscreen (Cmd+Shift+F or Ctrl+Shift+F)
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        toggleFullscreen();
      }

      // Escape key handlers
      if (event.key === 'Escape') {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
        } else if (isEditMode) {
          setIsEditMode(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isEditMode, isFullscreen]);

  // Layout change handler
  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
    
    if (isEditMode) {
      layoutActions.updateLayout({
        layouts: allLayouts,
        updatedAt: new Date(),
      });
    }
  }, [isEditMode, layoutActions]);

  // Breakpoint change handler
  const handleBreakpointChange = useCallback((breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  // Toggle functions
  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
    layoutActions.toggleEditMode();
  }, [layoutActions]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const newFullscreen = !prev;
      
      if (newFullscreen) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      
      return newFullscreen;
    });
  }, []);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setHiddenWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      
      // Update store
      const widgets = { ...currentLayout?.widgets };
      widgets[widgetId] = {
        ...widgets[widgetId],
        visible: !newSet.has(widgetId),
      };
      
      layoutActions.updateLayout({ widgets });
      
      return newSet;
    });
  }, [currentLayout?.widgets, layoutActions]);

  // Save layout
  const saveLayout = useCallback(async () => {
    try {
      await layoutActions.saveLayout('Custom Layout');
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  }, [layoutActions]);

  // Reset layout
  const resetLayout = useCallback(() => {
    setLayouts(defaultLayouts);
    setHiddenWidgets(new Set());
    layoutActions.resetLayout();
  }, [layoutActions]);

  // Visible widgets
  const visibleWidgets = defaultWidgets.filter(widget => !hiddenWidgets.has(widget.id));

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSkeleton className="p-6">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </LoadingSkeleton>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={cn(
        'min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300',
        isFullscreen && 'fixed inset-0 z-50 bg-white dark:bg-gray-900'
      )}>
        {/* Header */}
        <div className={cn(
          'border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
          isFullscreen && 'hidden'
        )}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Executive Dashboard
                </h1>
                
                {activeMarket && (
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20">
                    <span className="text-lg">{activeMarket.flagEmoji}</span>
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {activeMarket.name}
                    </span>
                  </div>
                )}

                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Command Palette Trigger */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="hidden sm:flex items-center space-x-2"
                >
                  <Command className="h-4 w-4" />
                  <span className="text-xs">Quick Actions</span>
                  <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>

                {/* Widget Toggles */}
                {isEditMode && (
                  <div className="flex items-center space-x-1 border-l pl-2 ml-2">
                    {defaultWidgets.map(widget => (
                      <Button
                        key={widget.id}
                        variant={hiddenWidgets.has(widget.id) ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() => toggleWidgetVisibility(widget.id)}
                        className="h-8 text-xs"
                      >
                        {hiddenWidgets.has(widget.id) ? (
                          <EyeOff className="h-3 w-3 mr-1" />
                        ) : (
                          <Eye className="h-3 w-3 mr-1" />
                        )}
                        {widget.title}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-1 border-l pl-2 ml-2">
                  {isEditMode && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetLayout}
                        title="Reset Layout"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={saveLayout}
                        title="Save Layout"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    variant={isEditMode ? 'default' : 'ghost'}
                    size="sm"
                    onClick={toggleEditMode}
                    title="Toggle Edit Mode"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className={cn(
          'p-6',
          isFullscreen && 'p-4 h-screen overflow-auto'
        )}>
          <ResponsiveGridLayout
            className={cn(
              'layout',
              isEditMode && 'editing'
            )}
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            onBreakpointChange={handleBreakpointChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 1 }}
            rowHeight={60}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            autoSize={!isFullscreen}
            verticalCompact={true}
            preventCollision={false}
            useCSSTransforms={true}
            measureBeforeMount={false}
          >
            {visibleWidgets.map(widget => {
              const WidgetComponent = widget.component;
              
              return (
                <div
                  key={widget.id}
                  className={cn(
                    'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden',
                    'transition-all duration-200',
                    isEditMode && 'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600',
                    isEditMode && 'cursor-move'
                  )}
                  data-testid={`dashboard-widget-${widget.id}`}
                >
                  {/* Widget Header */}
                  {isEditMode && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {widget.title}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleWidgetVisibility(widget.id)}
                          className="h-6 w-6"
                        >
                          <EyeOff className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Widget Content */}
                  <div className={cn(
                    'h-full',
                    isEditMode ? 'p-3' : 'p-0'
                  )}>
                    <ErrorBoundary>
                      <WidgetComponent
                        {...(widget.props || {})}
                        isEditMode={isEditMode}
                        isFullscreen={isFullscreen}
                        breakpoint={currentBreakpoint}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>

        {/* Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />

        {/* Edit Mode Overlay */}
        {isEditMode && (
          <div className="fixed bottom-6 right-6 z-40">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Edit Mode Active</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEditMode}
                className="text-white hover:bg-blue-700 ml-2"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Global styles for grid editing */}
        <style jsx global>{`
          .layout.editing .react-grid-item:hover {
            background-color: rgba(59, 130, 246, 0.05);
            border-color: rgb(59, 130, 246);
          }
          
          .layout.editing .react-grid-item.react-grid-placeholder {
            background-color: rgba(59, 130, 246, 0.2);
            border-color: rgb(59, 130, 246);
          }
          
          .layout .react-grid-item .react-resizable-handle {
            opacity: 0;
            transition: opacity 0.2s;
          }
          
          .layout.editing .react-grid-item:hover .react-resizable-handle {
            opacity: 1;
          }
          
          .react-resizable-handle.react-resizable-handle-se {
            bottom: 1px;
            right: 1px;
            background-color: rgb(59, 130, 246);
            border-radius: 2px 0 0 0;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}