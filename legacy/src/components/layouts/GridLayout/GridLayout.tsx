// Grid Layout with drag-and-drop widget positioning

import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout as GridLayoutType } from 'react-grid-layout';
import { 
  Move, 
  Lock, 
  Unlock, 
  Plus, 
  Settings, 
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { cn } from '@/lib/utils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface GridWidget {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  resizable?: boolean;
  draggable?: boolean;
  visible?: boolean;
  category?: string;
}

export interface GridLayoutConfig {
  lg: GridLayoutType[];
  md: GridLayoutType[];
  sm: GridLayoutType[];
  xs: GridLayoutType[];
  xxs: GridLayoutType[];
}

export interface GridLayoutProps {
  widgets: GridWidget[];
  layouts?: Partial<GridLayoutConfig>;
  onLayoutChange?: (layout: GridLayoutType[], layouts: GridLayoutConfig) => void;
  onWidgetAdd?: (widgetId: string) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetToggle?: (widgetId: string, visible: boolean) => void;
  editMode?: boolean;
  onEditModeToggle?: (editMode: boolean) => void;
  showToolbar?: boolean;
  showWidgetControls?: boolean;
  cols?: { lg: number; md: number; sm: number; xs: number; xxs: number };
  breakpoints?: { lg: number; md: number; sm: number; xs: number; xxs: number };
  rowHeight?: number;
  margin?: [number, number];
  containerPadding?: [number, number];
  isDraggable?: boolean;
  isResizable?: boolean;
  autoSize?: boolean;
  verticalCompact?: boolean;
  preventCollision?: boolean;
  className?: string;
  'data-testid'?: string;
}

const defaultLayouts: GridLayoutConfig = {
  lg: [],
  md: [],
  sm: [],
  xs: [],
  xxs: []
};

const defaultCols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const defaultBreakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };

const GridLayout: React.FC<GridLayoutProps> = ({
  widgets,
  layouts = defaultLayouts,
  onLayoutChange,
  onWidgetAdd,
  onWidgetRemove,
  onWidgetToggle,
  editMode = false,
  onEditModeToggle,
  showToolbar = true,
  showWidgetControls = true,
  cols = defaultCols,
  breakpoints = defaultBreakpoints,
  rowHeight = 120,
  margin = [16, 16],
  containerPadding = [16, 16],
  isDraggable = true,
  isResizable = true,
  autoSize = true,
  verticalCompact = true,
  preventCollision = false,
  className,
  'data-testid': testId
}) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg');
  const [isLocked, setIsLocked] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());

  // Filter visible widgets
  const visibleWidgets = useMemo(() => 
    widgets.filter(widget => 
      widget.visible !== false && !hiddenWidgets.has(widget.id)
    ), 
    [widgets, hiddenWidgets]
  );

  // Generate layout items for widgets without layout
  const generateLayoutItems = useCallback((widgets: GridWidget[], breakpoint: string) => {
    const existingLayout = layouts[breakpoint as keyof GridLayoutConfig] || [];
    const existingIds = new Set(existingLayout.map(item => item.i));
    
    const newItems: GridLayoutType[] = [];
    let x = 0;
    let y = 0;
    const colCount = cols[breakpoint as keyof typeof cols] || cols.lg;
    
    widgets.forEach((widget, index) => {
      if (!existingIds.has(widget.id)) {
        const w = Math.min(widget.minW || 4, colCount);
        const h = widget.minH || 3;
        
        if (x + w > colCount) {
          x = 0;
          y++;
        }
        
        newItems.push({
          i: widget.id,
          x,
          y,
          w,
          h,
          minW: widget.minW,
          minH: widget.minH,
          maxW: widget.maxW,
          maxH: widget.maxH,
          static: isLocked || !widget.draggable,
          resizeHandles: widget.resizable !== false ? ['se', 'sw', 'ne', 'nw'] : []
        });
        
        x += w;
      }
    });
    
    return [...existingLayout, ...newItems];
  }, [layouts, cols, isLocked]);

  // Get current layout for the current breakpoint
  const currentLayout = useMemo(() => {
    return generateLayoutItems(visibleWidgets, currentBreakpoint);
  }, [generateLayoutItems, visibleWidgets, currentBreakpoint]);

  // Handle layout change
  const handleLayoutChange = useCallback((layout: GridLayoutType[], allLayouts: GridLayoutConfig) => {
    onLayoutChange?.(layout, allLayouts);
  }, [onLayoutChange]);

  // Handle breakpoint change
  const handleBreakpointChange = useCallback((breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  // Toggle widget visibility
  const handleWidgetToggle = useCallback((widgetId: string) => {
    setHiddenWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
        onWidgetToggle?.(widgetId, true);
      } else {
        newSet.add(widgetId);
        onWidgetToggle?.(widgetId, false);
      }
      return newSet;
    });
  }, [onWidgetToggle]);

  // Reset layout
  const handleResetLayout = useCallback(() => {
    if (onLayoutChange) {
      const resetLayouts: GridLayoutConfig = {
        lg: generateLayoutItems(widgets, 'lg'),
        md: generateLayoutItems(widgets, 'md'),
        sm: generateLayoutItems(widgets, 'sm'),
        xs: generateLayoutItems(widgets, 'xs'),
        xxs: generateLayoutItems(widgets, 'xxs')
      };
      onLayoutChange(resetLayouts[currentBreakpoint as keyof GridLayoutConfig], resetLayouts);
    }
  }, [onLayoutChange, generateLayoutItems, widgets, currentBreakpoint]);

  // Save layout
  const handleSaveLayout = useCallback(() => {
    // In a real application, this would save to localStorage or backend
    console.log('Saving layout:', layouts);
  }, [layouts]);

  // Widget categories for grouping
  const widgetsByCategory = useMemo(() => {
    return widgets.reduce((acc, widget) => {
      const category = widget.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(widget);
      return acc;
    }, {} as Record<string, GridWidget[]>);
  }, [widgets]);

  return (
    <div 
      className={cn(
        'flex flex-col h-full bg-gray-50 dark:bg-gray-900',
        className
      )}
      data-testid={testId}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {/* Edit Mode Toggle */}
            <Button
              variant={editMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => onEditModeToggle?.(!editMode)}
              data-testid={`${testId}-edit-toggle`}
            >
              <Settings className="h-4 w-4 mr-2" />
              {editMode ? 'Exit Edit' : 'Edit Layout'}
            </Button>

            {/* Lock Toggle */}
            {editMode && (
              <Button
                variant={isLocked ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setIsLocked(!isLocked)}
                data-testid={`${testId}-lock-toggle`}
              >
                {isLocked ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Locked
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlocked
                  </>
                )}
              </Button>
            )}

            {/* Breakpoint Indicator */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Breakpoint:</span>
              <span className="font-medium uppercase">{currentBreakpoint}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Widget Controls */}
            {editMode && showWidgetControls && (
              <div className="flex items-center space-x-1">
                {Object.entries(widgetsByCategory).map(([category, categoryWidgets]) => (
                  <div key={category} className="relative group">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {category}
                    </Button>
                    
                    {/* Dropdown menu for widgets in category */}
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <div className="py-1">
                        {categoryWidgets.map(widget => (
                          <button
                            key={widget.id}
                            type="button"
                            onClick={() => {
                              if (hiddenWidgets.has(widget.id)) {
                                handleWidgetToggle(widget.id);
                              } else {
                                onWidgetAdd?.(widget.id);
                              }
                            }}
                            className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {hiddenWidgets.has(widget.id) ? (
                              <EyeOff className="h-4 w-4 mr-2 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 mr-2" />
                            )}
                            {widget.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {editMode && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetLayout}
                  data-testid={`${testId}-reset-layout`}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveLayout}
                  data-testid={`${testId}-save-layout`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Widget Toggle Bar */}
      {editMode && showWidgetControls && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap gap-2">
            {widgets.map(widget => (
              <Button
                key={widget.id}
                variant={hiddenWidgets.has(widget.id) ? 'outline' : 'secondary'}
                size="sm"
                onClick={() => handleWidgetToggle(widget.id)}
                className="h-7 text-xs"
                data-testid={`${testId}-widget-toggle-${widget.id}`}
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
        </div>
      )}

      {/* Grid Container */}
      <div className="flex-1 overflow-auto">
        <ResponsiveGridLayout
          className={cn(
            'layout',
            editMode && 'edit-mode'
          )}
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          onBreakpointChange={handleBreakpointChange}
          cols={cols}
          breakpoints={breakpoints}
          rowHeight={rowHeight}
          margin={margin}
          containerPadding={containerPadding}
          isDraggable={editMode && isDraggable && !isLocked}
          isResizable={editMode && isResizable && !isLocked}
          autoSize={autoSize}
          verticalLayout={verticalCompact}
          preventCollision={preventCollision}
          useCSSTransforms={true}
          measureBeforeMount={false}
          data-testid={`${testId}-grid`}
        >
          {visibleWidgets.map(widget => {
            const WidgetComponent = widget.component;
            return (
              <div
                key={widget.id}
                className={cn(
                  'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden',
                  editMode && 'transition-all duration-200',
                  editMode && !isLocked && 'hover:shadow-md cursor-move'
                )}
                data-testid={`${testId}-widget-${widget.id}`}
              >
                {/* Widget Header */}
                {editMode && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2">
                      <Move className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {widget.title}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWidgetToggle(widget.id)}
                        className="h-6 w-6"
                        data-testid={`${testId}-widget-hide-${widget.id}`}
                      >
                        <EyeOff className="h-3 w-3" />
                      </Button>
                      
                      {onWidgetRemove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onWidgetRemove(widget.id)}
                          className="h-6 w-6 text-red-500 hover:text-red-700"
                          data-testid={`${testId}-widget-remove-${widget.id}`}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Widget Content */}
                <div className={cn(
                  'h-full',
                  editMode && 'p-2'
                )}>
                  <WidgetComponent {...(widget.props || {})} />
                </div>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>

      {/* Edit Mode Overlay Styles */}
      <style jsx global>{`
        .layout.edit-mode .react-grid-item:hover {
          background-color: rgba(59, 130, 246, 0.05);
          border-color: rgb(59, 130, 246);
        }
        
        .layout.edit-mode .react-grid-item.react-grid-placeholder {
          background-color: rgba(59, 130, 246, 0.2);
          border-color: rgb(59, 130, 246);
        }
        
        .layout .react-grid-item .react-resizable-handle {
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .layout.edit-mode .react-grid-item:hover .react-resizable-handle {
          opacity: 1;
        }
        
        .layout .react-grid-item .react-resizable-handle.react-resizable-handle-se {
          bottom: 1px;
          right: 1px;
          background-color: rgb(59, 130, 246);
          border-radius: 2px 0 0 0;
        }
        
        .layout .react-grid-item .react-resizable-handle.react-resizable-handle-sw {
          bottom: 1px;
          left: 1px;
          background-color: rgb(59, 130, 246);
          border-radius: 0 2px 0 0;
        }
        
        .layout .react-grid-item .react-resizable-handle.react-resizable-handle-ne {
          top: 1px;
          right: 1px;
          background-color: rgb(59, 130, 246);
          border-radius: 0 0 0 2px;
        }
        
        .layout .react-grid-item .react-resizable-handle.react-resizable-handle-nw {
          top: 1px;
          left: 1px;
          background-color: rgb(59, 130, 246);
          border-radius: 0 0 2px 0;
        }
      `}</style>
    </div>
  );
};

export { GridLayout };
export type { 
  GridLayoutProps, 
  GridWidget, 
  GridLayoutConfig 
};