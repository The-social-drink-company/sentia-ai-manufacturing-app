import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useLayoutStore } from '../../stores/layoutStore'
import { useAuthRole } from '../../hooks/useAuthRole.jsx'
import { cn } from '../../lib/utils'

const ResponsiveGridLayout = WidthProvider(Responsive)

// Grid configuration
const GRID_CONFIG = {
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 8, sm: 4, xs: 2, xxs: 1 },
  rowHeight: 60,
  margin: [16, 16],
  containerPadding: [16, 16],
  compactType: 'vertical',
  preventCollision: false
}

// Widget wrapper component with enhanced features
const WidgetWrapper = ({ 
  children, 
  widgetId, 
  title, 
  isEditing, 
  isMinimized, 
  onMinimize, 
  onRemove, 
  onSettings,
  className = "" 
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200",
        "dark:bg-gray-800 dark:border-gray-700",
        isEditing && "ring-2 ring-blue-300 dark:ring-blue-600",
        isHovered && isEditing && "ring-blue-500 dark:ring-blue-400",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Widget header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700",
        isMinimized && "border-b-0"
      )}>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {title}
        </h3>
        
        <div className={cn(
          "flex items-center space-x-1 opacity-0 transition-opacity",
          (isHovered || isEditing) && "opacity-100"
        )}>
          {/* Widget controls */}
          <button
            onClick={onMinimize}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMinimized ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              )}
            </svg>
          </button>
          
          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Widget settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          
          {isEditing && onRemove && (
            <button
              onClick={onRemove}
              className="p-1 text-red-400 hover:text-red-600"
              title="Remove widget"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {isEditing && (
            <div className="w-4 h-4 cursor-move text-gray-400" title="Drag to move">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          )}
        </div>
      </div>
      
      {/* Widget content */}
      {!isMinimized && (
        <div className="p-4 h-full overflow-auto">
          {children}
        </div>
      )}
      
      {/* Loading overlay for edit mode */}
      {isEditing && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity dark:bg-blue-900">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {title}
          </div>
        </div>
      )}
    </div>
  )
}

const Grid = ({ widgets, onLayoutChange, className = "" }) => {
  const { 
    currentLayout, 
    setLayout, 
    currentBreakpoint, 
    setBreakpoint, 
    isEditing,
    gridSnap,
    widgetSettings,
    updateWidgetSettings,
    visibleWidgets
  } = useLayoutStore()
  
  const { hasPermission } = useAuthRole()
  
  // Generate layouts from current layout state
  const layouts = useMemo(() => {
    const result = {}
    Object.keys(GRID_CONFIG.breakpoints).forEach(breakpoint => {
      result[breakpoint] = currentLayout[breakpoint] || []
    })
    return result
  }, [currentLayout])
  
  // Handle layout changes
  const handleLayoutChange = useCallback((layout, allLayouts) => {
    // Update the store with new layouts
    Object.keys(allLayouts).forEach(breakpoint => {
      setLayout(breakpoint, allLayouts[breakpoint])
    })
    
    // Call parent callback if provided
    if (onLayoutChange) {
      onLayoutChange(layout, allLayouts)
    }
  }, [setLayout, onLayoutChange])
  
  // Handle breakpoint changes
  const handleBreakpointChange = useCallback((newBreakpoint, newCols) => {
    setBreakpoint(newBreakpoint)
  }, [setBreakpoint])
  
  // Widget actions
  const handleWidgetMinimize = useCallback((widgetId) => {
    const currentSettings = widgetSettings[widgetId] || {}
    updateWidgetSettings(widgetId, {
      ...currentSettings,
      minimized: !currentSettings.minimized
    })
  }, [widgetSettings, updateWidgetSettings])
  
  const handleWidgetSettings = useCallback((widgetId) => {
    // Implementation for widget settings modal
    console.log('Open settings for widget:', widgetId)
  }, [])
  
  const handleWidgetRemove = useCallback((widgetId) => {
    updateWidgetSettings(widgetId, { visible: false })
  }, [updateWidgetSettings])
  
  // Generate grid items from widgets
  const gridItems = useMemo(() => {
    return widgets
      .filter(widget => visibleWidgets.includes(widget.id))
      .filter(widget => widgetSettings[widget.id]?.visible !== false)
      .map(widget => {
        const settings = widgetSettings[widget.id] || {}
        
        return (
          <div key={widget.id}>
            <WidgetWrapper
              widgetId={widget.id}
              title={widget.title}
              isEditing={isEditing && hasPermission('dashboard.edit')}
              isMinimized={settings.minimized}
              onMinimize={() => handleWidgetMinimize(widget.id)}
              onSettings={() => handleWidgetSettings(widget.id)}
              onRemove={hasPermission('dashboard.edit') ? () => handleWidgetRemove(widget.id) : null}
            >
              {widget.component}
            </WidgetWrapper>
          </div>
        )
      })
  }, [
    widgets, 
    visibleWidgets, 
    widgetSettings, 
    isEditing, 
    hasPermission, 
    handleWidgetMinimize, 
    handleWidgetSettings, 
    handleWidgetRemove
  ])
  
  // Grid props
  const gridProps = {
    ...GRID_CONFIG,
    layouts,
    isDraggable: isEditing && hasPermission('dashboard.edit'),
    isResizable: isEditing && hasPermission('dashboard.edit'),
    onLayoutChange: handleLayoutChange,
    onBreakpointChange: handleBreakpointChange,
    useCSSTransforms: true,
    measureBeforeMount: false,
    draggableCancel: '.no-drag',
    draggableHandle: isEditing ? '.drag-handle' : undefined,
    resizeHandles: isEditing ? ['se'] : [],
    autoSize: true,
    verticalCompact: gridSnap,
    preventCollision: !gridSnap
  }
  
  // Add custom styles for edit mode
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .react-grid-layout {
        position: relative;
      }
      
      .react-grid-item {
        transition: all 200ms ease;
        transition-property: left, top;
      }
      
      .react-grid-item.cssTransforms {
        transition-property: transform;
      }
      
      .react-grid-item > .react-resizable-handle {
        position: absolute;
        width: 20px;
        height: 20px;
        bottom: 0;
        right: 0;
        background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjOTk5IiBkPSJtMTUgMTJhMyAzIDAgMSAxLTYgMCAzIDMgMCAwIDEgNiAwem0tMyAwYTMgMyAwIDEgMS02IDAgMyAzIDAgMCAxIDYgMHptLTMgMGEzIDMgMCAxIDEtNiAwIDMgMyAwIDAgMSA2IDB6bS0zIDBhMyAzIDAgMSAxLTYgMCAzIDMgMCAwIDEgNiAwem0tMyAwYTMgMyAwIDEgMS02IDAgMyAzIDAgMCAxIDYgMHoiLz4KPHN2Zz4=') no-repeat;
        background-position: bottom right;
        padding: 0 3px 3px 0;
        background-repeat: no-repeat;
        background-origin: content-box;
        box-sizing: border-box;
        cursor: se-resize;
      }
      
      .react-grid-placeholder {
        background: rgb(59 130 246 / 0.3) !important;
        border: 2px dashed rgb(59 130 246) !important;
        border-radius: 6px !important;
        opacity: 0.6;
        transition-duration: 100ms;
      }
      
      .react-grid-item.react-grid-item--editing:hover {
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  
  return (
    <div className={cn("w-full h-full", className)}>
      <ResponsiveGridLayout
        {...gridProps}
        className={cn(
          "react-grid-layout",
          isEditing && "editing-mode"
        )}
      >
        {gridItems}
      </ResponsiveGridLayout>
      
      {/* Grid overlay for edit mode */}
      {isEditing && hasPermission('dashboard.edit') && (
        <div className="fixed inset-0 bg-blue-50 bg-opacity-20 pointer-events-none z-0 dark:bg-blue-900">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-10">
            Edit Mode: Drag widgets to rearrange, resize from bottom-right corner
          </div>
        </div>
      )}
      
      {/* No widgets message */}
      {gridItems.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-2">No widgets visible</p>
            <p className="text-sm">Configure your dashboard layout to show widgets</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Grid