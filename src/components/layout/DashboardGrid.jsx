import React, { useMemo, useState, useCallback } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { useLayoutStore } from '../../stores/layoutStore'
import { useFeatureFlags } from '../../hooks/useFeatureFlags'
import { cn } from '../../lib/utils'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

// Grid breakpoints and column configurations
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const cols = { lg: 12, md: 8, sm: 4, xs: 2, xxs: 1 }

const DashboardGrid = ({ 
  widgets, 
  onLayoutChange,
  isDraggable = true,
  isResizable = true,
  className = "",
  children 
}) => {
  const { 
    currentLayout, 
    setLayout, 
    currentBreakpoint, 
    setBreakpoint,
    isEditing,
    gridSnap
  } = useLayoutStore()
  
  const { role } = useAuthRole()
  const { flags } = useFeatureFlags()
  
  // Layout state
  const [compactType, setCompactType] = useState('vertical')
  const [mounted, setMounted] = useState(false)
  
  // Grid configuration
  const gridProps = useMemo(() => ({
    className: cn(
      'layout',
      isEditing && 'editing-mode',
      className
    ),
    layouts: currentLayout,
    breakpoints,
    cols,
    rowHeight: 60,
    isDraggable: isDraggable && isEditing,
    isResizable: isResizable && isEditing,
    isBounded: true,
    compactType,
    preventCollision: !gridSnap,
    useCSSTransforms: true,
    measureBeforeMount: false,
    autoSize: true,
    margin: [16, 16],
    containerPadding: [16, 16],
    resizeHandles: ['se', 'e', 's']
  }), [
    currentLayout,
    isDraggable,
    isResizable,
    isEditing,
    compactType,
    gridSnap,
    className
  ])
  
  // Handle layout changes
  const handleLayoutChange = useCallback((layout, layouts) => {
    if (onLayoutChange) {
      onLayoutChange(layout, layouts)
    }
    
    // Update store
    Object.entries(layouts).forEach(([breakpoint, breakpointLayout]) => {
      setLayout(breakpoint, breakpointLayout)
    })
  }, [onLayoutChange, setLayout])
  
  // Handle breakpoint changes
  const handleBreakpointChange = useCallback((newBreakpoint, newCols) => {
    setBreakpoint(newBreakpoint)
  }, [setBreakpoint])
  
  // Mount effect
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render until mounted to avoid SSR issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="dashboard-grid-container">
      {/* Grid Header */}
      {isEditing && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Edit Mode Active
              </span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Drag to move • Resize from corners • Auto-save enabled
            </div>
          </div>
        </div>
      )}
      
      {/* Responsive Grid */}
      <ResponsiveGridLayout
        {...gridProps}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
      >
        {children}
      </ResponsiveGridLayout>
      
      {/* Grid Footer */}
      {isEditing && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Layout: {currentBreakpoint.toUpperCase()} • 
          Columns: {cols[currentBreakpoint]} • 
          Widgets: {React.Children.count(children)}
        </div>
      )}
    </div>
  )
}

export default DashboardGrid