// Enterprise Virtualized Table Component
// High-performance data table with virtualization for large datasets

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { FixedSizeGrid as Grid } from 'react-window';
import { areEqual } from 'react-window';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import { logInfo, logWarn } from '../../services/observability/structuredLogger.js';

// Memoized table row component for optimal performance
const TableRow = React.memo(({ index, style, data }) => {
  const { items, columns, onRowClick, selectedRows, onRowSelect } = data;
  const item = items[index];
  const isSelected = selectedRows?.has?.(item.id);

  const handleClick = useCallback(() => {
    onRowClick?.(item, index);
  }, [item, index, onRowClick]);

  const handleSelect = useCallback((e) => {
    e.stopPropagation();
    onRowSelect?.(item.id, !isSelected);
  }, [item.id, isSelected, onRowSelect]);

  return (
    <div
      style={style}
      className={`
        flex items-center border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
      `}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      {onRowSelect && (
        <div className="flex-shrink-0 w-12 px-3 py-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      {/* Data columns */}
      {columns.map((column, columnIndex) => (
        <div
          key={column.key || columnIndex}
          className={`
            flex-shrink-0 px-3 py-2 text-sm text-gray-900 truncate
            ${column.className || null}
          `}
          style={{ width: column.width 0 }}
          title={column.render ? column.render(item, index) : item[column.key]}
        >
          {column.render ? column.render(item, index) : item[column.key]}
        </div>
      ))}
    </div>
  );
}, areEqual);

TableRow.displayName = 'TableRow';

// Memoized table header component
const TableHeader = React.memo(({ 
  columns, 
  onSort, 
  sortColumn, 
  sortDirection, 
  onSelectAll,
  selectedRows,
  totalRows,
  hasSelection 
}) => {
  const isAllSelected = selectedRows?.size === totalRows && totalRows > 0;
  const isPartiallySelected = selectedRows?.size > 0 && selectedRows?.size < totalRows;

  return (
    <div className="flex items-center bg-gray-50 border-b border-gray-300 font-medium text-gray-700 text-sm">
      {/* Select all checkbox */}
      {hasSelection && (
        <div className="flex-shrink-0 w-12 px-3 py-3">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={input => {
              if (input) input.indeterminate = isPartiallySelected;
            }}
            onChange={() => onSelectAll?.(!isAllSelected)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      )}
      
      {/* Column headers */}
      {columns.map((column, index) => (
        <div
          key={column.key || index}
          className={`
            flex-shrink-0 px-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors
            ${column.sortable !== false ? 'select-none' : ''}
            ${column.headerClassName || null}
          `}
          style={{ width: column.width 0 }}
          onClick={() => column.sortable !== false && onSort?.(column.key)}
        >
          <div className="flex items-center justify-between">
            <span className="truncate">{column.title || column.key}</span>
            {column.sortable !== false && (
              <div className="ml-1 flex flex-col">
                <ChevronUpIcon 
                  className={`w-3 h-3 ${
                    sortColumn === column.key && sortDirection === 'asc' 
                      ? 'text-blue-600' 
                      : 'text-gray-400'
                  }`} 
                />
                <ChevronDownIcon 
                  className={`w-3 h-3 -mt-1 ${
                    sortColumn === column.key && sortDirection === 'desc' 
                      ? 'text-blue-600' 
                      : 'text-gray-400'
                  }`} 
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

TableHeader.displayName = 'TableHeader';

// Main virtualized table component
const VirtualizedTable = ({
  data = [],
  columns = [],
  height = 400,
  rowHeight = 52,
  headerHeight = 48,
  onRowClick,
  onRowSelect,
  onSelectAll,
  selectedRows = new Set(),
  sortColumn,
  sortDirection,
  onSort,
  loading = false,
  error = null,
  emptyMessage = "No data available",
  className = "",
  overscanCount = 5,
  estimatedItemCount,
  onScroll,
  initialScrollOffset = 0
}) => {
  const listRef = useRef(null);
  const containerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Performance logging
  useEffect(() => {
    if (data.length > 1000) {
      logInfo('Large dataset virtualization', { 
        itemCount: data.length,
        columns: columns.length,
        hasVirtualization: true 
      });
    }
  }, [data.length, columns.length]);

  // Memoize sorted data to prevent unnecessary re-renders
  const sortedData = useMemo(() => {
    if (!sortColumn || !onSort) return data;
    
    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [data, sortColumn, sortDirection, onSort]);

  // Memoize item data to prevent re-renders
  const itemData = useMemo(() => ({
    items: sortedData,
    columns,
    onRowClick,
    selectedRows,
    onRowSelect
  }), [sortedData, columns, onRowClick, selectedRows, onRowSelect]);

  // Handle scrolling state for performance optimizations
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }) => {
    if (!scrollUpdateWasRequested) {
      setIsScrolling(true);
    }
    onScroll?.({ scrollOffset, scrollUpdateWasRequested });
  }, [onScroll]);

  const handleScrollEnd = useCallback(() => {
    setIsScrolling(false);
  }, []);

  // Auto-scroll to top when data changes
  useEffect(() => {
    if (listRef.current && sortColumn) {
      listRef.current.scrollToItem(0);
    }
  }, [sortColumn, sortDirection]);

  // Loading state
  if (loading) {
    return (
      <div className={`border border-gray-300 rounded-lg ${className}`} style={{ height }}>
        <TableHeader 
          columns={columns}
          onSort={onSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSelectAll={onSelectAll}
          selectedRows={selectedRows}
          totalRows={data.length}
          hasSelection={!!onRowSelect}
        />
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`border border-red-300 rounded-lg bg-red-50 ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full text-red-600">
          <span>Error loading data: {error.message || error}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedData.length === 0) {
    return (
      <div className={`border border-gray-300 rounded-lg ${className}`} style={{ height }}>
        <TableHeader 
          columns={columns}
          onSort={onSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSelectAll={onSelectAll}
          selectedRows={selectedRows}
          totalRows={0}
          hasSelection={!!onRowSelect}
        />
        <div className="flex items-center justify-center h-full text-gray-500">
          <span>{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Table Header */}
      <TableHeader 
        columns={columns}
        onSort={onSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSelectAll={onSelectAll}
        selectedRows={selectedRows}
        totalRows={sortedData.length}
        hasSelection={!!onRowSelect}
      />
      
      {/* Virtualized List */}
      <div style={{ height: height - headerHeight }}>
        <List
          ref={listRef}
          height={height - headerHeight}
          itemCount={sortedData.length}
          itemSize={rowHeight}
          itemData={itemData}
          overscanCount={overscanCount}
          estimatedItemCount={estimatedItemCount}
          initialScrollOffset={initialScrollOffset}
          onScroll={handleScroll}
          onItemsRendered={handleScrollEnd}
          className={isScrolling ? 'scrolling' : ''}
        >
          {TableRow}
        </List>
      </div>
      
      {/* Selection indicator */}
      {selectedRows.size > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-sm text-blue-700">
          {selectedRows.size} of {sortedData.length} rows selected
          {onSelectAll && (
            <button
              onClick={() => onSelectAll(false)}
              className="ml-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Higher-order component for infinite loading
export const withInfiniteLoading = (WrappedComponent) => {
  return React.memo((props) => {
    const {
      data,
      hasNextPage,
      loadMore,
      isLoadingMore,
      threshold = 5,
      ...otherProps
    } = props;

    const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }) => {
      if (scrollUpdateWasRequested) return;
      
      const { scrollHeight, clientHeight } = document.querySelector('[data-testid="virtualized-list"]') || {};
      
      if (scrollHeight && clientHeight) {
        const scrollPercentage = (scrollOffset + clientHeight) / scrollHeight;
        
        if (scrollPercentage > 0.8 && hasNextPage && !isLoadingMore) {
          loadMore?.();
        }
      }
      
      props.onScroll?.({ scrollOffset, scrollUpdateWasRequested });
    }, [hasNextPage, isLoadingMore, loadMore, props]);

    return (
      <WrappedComponent
        {...otherProps}
        data={data}
        onScroll={handleScroll}
        loading={props.loading || isLoadingMore}
      />
    );
  });
};

export default React.memo(VirtualizedTable);
