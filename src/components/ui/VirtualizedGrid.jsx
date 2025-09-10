// Enterprise Virtualized Grid Component
// High-performance grid layout with virtualization for large datasets

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import { areEqual } from 'react-window';
import { logInfo } from '../../services/observability/structuredLogger.js';

// Memoized grid cell component
const GridCell = React.memo(({ columnIndex, rowIndex, style, data }) => {
  const { items, columns, getColumnWidth, getRowHeight, onCellClick, selectedCells } = data;
  
  if (rowIndex === 0) {
    // Header row
    const column = columns[columnIndex];
    return (
      <div
        style={style}
        className="bg-gray-50 border-b border-r border-gray-300 px-3 py-2 font-medium text-gray-700 text-sm truncate"
      >
        {column?.title || column?.key}
      </div>
    );
  }

  const item = items[rowIndex - 1]; // Subtract 1 for header row
  const column = columns[columnIndex];
  const cellKey = `${rowIndex}-${columnIndex}`;
  const isSelected = selectedCells?.has?.(cellKey);

  const handleClick = useCallback(() => {
    onCellClick?.(item, column, rowIndex - 1, columnIndex);
  }, [item, column, rowIndex, columnIndex, onCellClick]);

  if (!item || !column) {
    return <div style={style} className="border-b border-r border-gray-200" />;
  }

  const cellValue = column.render ? column.render(item, rowIndex - 1) : item[column.key];

  return (
    <div
      style={style}
      className={`
        border-b border-r border-gray-200 px-3 py-2 text-sm text-gray-900 cursor-pointer 
        hover:bg-gray-50 transition-colors truncate
        ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
      `}
      onClick={handleClick}
      title={String(cellValue)}
    >
      {cellValue}
    </div>
  );
}, areEqual);

GridCell.displayName = 'GridCell';

// Main virtualized grid component
const VirtualizedGrid = ({
  data = [],
  columns = [],
  width = 800,
  height = 600,
  defaultColumnWidth = 150,
  defaultRowHeight = 48,
  headerHeight = 48,
  onCellClick,
  selectedCells = new Set(),
  loading = false,
  error = null,
  emptyMessage = "No data available",
  className = "",
  overscanColumnCount = 2,
  overscanRowCount = 5,
  onScroll,
  columnWidth,
  rowHeight,
  estimatedColumnWidth,
  estimatedRowHeight
}) => {
  const gridRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Performance logging
  useEffect(() => {
    if (data.length * columns.length > 50000) {
      logInfo('Large grid virtualization', { 
        rows: data.length,
        columns: columns.length,
        totalCells: data.length * columns.length,
        hasVirtualization: true 
      });
    }
  }, [data.length, columns.length]);

  // Dynamic column width calculation
  const getColumnWidth = useCallback((columnIndex) => {
    if (typeof columnWidth === 'function') {
      return columnWidth(columnIndex);
    }
    const column = columns[columnIndex];
    return column?.width || defaultColumnWidth;
  }, [columnWidth, columns, defaultColumnWidth]);

  // Dynamic row height calculation
  const getRowHeight = useCallback((rowIndex) => {
    if (typeof rowHeight === 'function') {
      return rowHeight(rowIndex);
    }
    if (rowIndex === 0) return headerHeight; // Header row
    return defaultRowHeight;
  }, [rowHeight, headerHeight, defaultRowHeight]);

  // Memoize grid data
  const gridData = useMemo(() => ({
    items: data,
    columns,
    getColumnWidth,
    getRowHeight,
    onCellClick,
    selectedCells
  }), [data, columns, getColumnWidth, getRowHeight, onCellClick, selectedCells]);

  // Handle scrolling state
  const handleScroll = useCallback(({ scrollLeft, scrollTop, scrollUpdateWasRequested }) => {
    if (!scrollUpdateWasRequested) {
      setIsScrolling(true);
    }
    onScroll?.({ scrollLeft, scrollTop, scrollUpdateWasRequested });
  }, [onScroll]);

  const handleScrollEnd = useCallback(() => {
    setIsScrolling(false);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={`border border-gray-300 rounded-lg ${className}`} style={{ width, height }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading grid data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`border border-red-300 rounded-lg bg-red-50 ${className}`} style={{ width, height }}>
        <div className="flex items-center justify-center h-full text-red-600">
          <span>Error loading grid: {error.message || error}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0 || columns.length === 0) {
    return (
      <div className={`border border-gray-300 rounded-lg ${className}`} style={{ width, height }}>
        <div className="flex items-center justify-center h-full text-gray-500">
          <span>{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <Grid
        ref={gridRef}
        width={width}
        height={height}
        columnCount={columns.length}
        rowCount={data.length + 1} // +1 for header row
        columnWidth={getColumnWidth}
        rowHeight={getRowHeight}
        itemData={gridData}
        overscanColumnCount={overscanColumnCount}
        overscanRowCount={overscanRowCount}
        estimatedColumnWidth={estimatedColumnWidth}
        estimatedRowHeight={estimatedRowHeight}
        onScroll={handleScroll}
        onItemsRendered={handleScrollEnd}
        className={isScrolling ? 'scrolling' : ''}
      >
        {GridCell}
      </Grid>
      
      {/* Selection indicator */}
      {selectedCells.size > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-sm text-blue-700">
          {selectedCells.size} cells selected
        </div>
      )}
    </div>
  );
};

// Specialized manufacturing data grid
export const ManufacturingDataGrid = React.memo(({
  productionData = [],
  qualityData = [],
  inventoryData = [],
  activeTab = 'production',
  ...props
}) => {
  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'production':
        return productionData;
      case 'quality':
        return qualityData;
      case 'inventory':
        return inventoryData;
      default:
        return productionData;
    }
  }, [productionData, qualityData, inventoryData, activeTab]);

  const manufacturingColumns = useMemo(() => {
    const baseColumns = [
      { key: 'id', title: 'ID', width: 80 },
      { key: 'timestamp', title: 'Time', width: 120, render: (item) => new Date(item.timestamp).toLocaleTimeString() },
    ];

    switch (activeTab) {
      case 'production':
        return [
          ...baseColumns,
          { key: 'line', title: 'Line', width: 100 },
          { key: 'product', title: 'Product', width: 150 },
          { key: 'quantity', title: 'Quantity', width: 100, render: (item) => item.quantity?.toLocaleString() },
          { key: 'status', title: 'Status', width: 120, render: (item) => (
            <span className={`px-2 py-1 rounded-full text-xs ${
              item.status === 'active' ? 'bg-green-100 text-green-800' :
              item.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {item.status}
            </span>
          )}
        ];
      case 'quality':
        return [
          ...baseColumns,
          { key: 'batch', title: 'Batch', width: 120 },
          { key: 'defectRate', title: 'Defect Rate', width: 120, render: (item) => `${(item.defectRate * 100).toFixed(2)}%` },
          { key: 'passRate', title: 'Pass Rate', width: 120, render: (item) => `${(item.passRate * 100).toFixed(2)}%` },
          { key: 'inspector', title: 'Inspector', width: 120 }
        ];
      case 'inventory':
        return [
          ...baseColumns,
          { key: 'sku', title: 'SKU', width: 120 },
          { key: 'name', title: 'Product Name', width: 200 },
          { key: 'currentStock', title: 'Stock', width: 100, render: (item) => item.currentStock?.toLocaleString() },
          { key: 'reorderLevel', title: 'Reorder Level', width: 120 },
          { key: 'location', title: 'Location', width: 120 }
        ];
      default:
        return baseColumns;
    }
  }, [activeTab]);

  return (
    <VirtualizedGrid
      {...props}
      data={currentData}
      columns={manufacturingColumns}
      className="manufacturing-data-grid"
    />
  );
});

ManufacturingDataGrid.displayName = 'ManufacturingDataGrid';

// Hook for managing grid state
export const useVirtualizedGrid = (initialData = [], initialColumns = []) => {
  const [data, setData] = useState(initialData);
  const [columns, setColumns] = useState(initialColumns);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateData = useCallback((newData) => {
    setData(newData);
    setError(null);
  }, []);

  const updateColumns = useCallback((newColumns) => {
    setColumns(newColumns);
  }, []);

  const selectCell = useCallback((rowIndex, columnIndex) => {
    const cellKey = `${rowIndex}-${columnIndex}`;
    setSelectedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
      } else {
        newSet.add(cellKey);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
  }, []);

  const selectRange = useCallback((startRow, startCol, endRow, endCol) => {
    const newSelection = new Set();
    for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
      for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
        newSelection.add(`${row}-${col}`);
      }
    }
    setSelectedCells(newSelection);
  }, []);

  return {
    data,
    columns,
    selectedCells,
    loading,
    error,
    updateData,
    updateColumns,
    selectCell,
    clearSelection,
    selectRange,
    setLoading,
    setError
  };
};

export default React.memo(VirtualizedGrid);