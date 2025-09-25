/**
 * ENTERPRISE DATA TABLE
 * Advanced data grid with virtual scrolling, filtering, sorting, and export
 * Features: column resizing, row selection, inline editing, custom renderers
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtual } from '@tanstack/react-virtual';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
  Squares2X2Icon,
  PencilSquareIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../ui/EnterpriseThemeSwitcher';
import * as XLSX from 'xlsx';

/**
 * Column configuration type
 */
const ColumnTypes = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  TAGS: 'tags',
  PROGRESS: 'progress',
  ACTIONS: 'actions',
  CUSTOM: 'custom',
};

/**
 * Main data table component
 */
export const EnterpriseDataTable = ({
  columns = [],
  data = [],
  onRowClick,
  onRowSelect,
  enableSelection = true,
  enableSorting = true,
  enableFiltering = true,
  enableExport = true,
  enableInlineEdit = false,
  enableVirtualization = true,
  enableColumnResize = true,
  enableGrouping = false,
  rowHeight = 48,
  headerHeight = 56,
  pageSize = 50,
  className = '',
  loading = false,
  emptyMessage = 'No data available',
  onEdit,
  onDelete,
  customActions = [],
  groupBy,
  aggregations = {},
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme === 'quantumDark';

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(columns.map(col => col.key))
  );
  const [columnWidths, setColumnWidths] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table, grid, compact

  const tableRef = useRef(null);
  const parentRef = useRef(null);

  // Process data with sorting, filtering, and search
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filterConfig).forEach(([key, filter]) => {
      if (filter.value) {
        result = result.filter(row => {
          const value = row[key];
          switch (filter.type) {
            case 'contains':
              return String(value).toLowerCase().includes(filter.value.toLowerCase());
            case 'equals':
              return value === filter.value;
            case 'greater':
              return Number(value) > Number(filter.value);
            case 'less':
              return Number(value) < Number(filter.value);
            case 'between':
              return Number(value) >= filter.value[0] && Number(value) <= filter.value[1];
            default:
              return true;
          }
        });
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    // Apply grouping if enabled
    if (enableGrouping && groupBy) {
      const grouped = {};
      result.forEach(row => {
        const key = row[groupBy];
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(row);
      });

      result = Object.entries(grouped).flatMap(([group, rows]) => [
        { _isGroupHeader: true, _groupName: group, _groupCount: rows.length },
        ...rows,
      ]);
    }

    return result;
  }, [data, sortConfig, filterConfig, searchQuery, enableGrouping, groupBy]);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtual({
    parentRef,
    size: processedData.length,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan: 5,
  });

  // Handle sorting
  const handleSort = useCallback((key) => {
    if (!enableSorting) return;

    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, [enableSorting]);

  // Handle row selection
  const handleRowSelect = useCallback((rowIndex, event) => {
    if (!enableSelection) return;

    const newSelected = new Set(selectedRows);
    if (event.shiftKey && selectedRows.size > 0) {
      // Range selection
      const lastSelected = Array.from(selectedRows).pop();
      const start = Math.min(lastSelected, rowIndex);
      const end = Math.max(lastSelected, rowIndex);
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Multi selection
      if (newSelected.has(rowIndex)) {
        newSelected.delete(rowIndex);
      } else {
        newSelected.add(rowIndex);
      }
    } else {
      // Single selection
      newSelected.clear();
      newSelected.add(rowIndex);
    }

    setSelectedRows(newSelected);
    onRowSelect?.(Array.from(newSelected).map(i => processedData[i]));
  }, [enableSelection, selectedRows, processedData, onRowSelect]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === processedData.length) {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    } else {
      const allIndices = new Set(processedData.map((_, i) => i));
      setSelectedRows(allIndices);
      onRowSelect?.(processedData);
    }
  }, [processedData, selectedRows, onRowSelect]);

  // Export functionality
  const handleExport = useCallback((format) => {
    const exportData = selectedRows.size > 0
      ? Array.from(selectedRows).map(i => processedData[i])
      : processedData;

    switch (format) {
      case 'csv':
        const csv = [
          columns.map(col => col.label).join(','),
          ...exportData.map(row =>
            columns.map(col => {
              const value = row[col.key];
              return typeof value === 'string' && value.includes(',')
                ? `"${value}"`
                : value;
            }).join(',')
          ),
        ].join('\n');

        const csvBlob = new Blob([csv], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = csvUrl;
        link.download = `data_${new Date().getTime()}.csv`;
        link.click();
        break;

      case 'excel':
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, `data_${new Date().getTime()}.xlsx`);
        break;

      case 'json':
        const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `data_${new Date().getTime()}.json`;
        jsonLink.click();
        break;
    }
  }, [columns, processedData, selectedRows]);

  // Column resize handler
  const handleColumnResize = useCallback((key, width) => {
    setColumnWidths(prev => ({ ...prev, [key]: width }));
  }, []);

  // Inline edit handler
  const handleCellEdit = useCallback((rowIndex, columnKey, value) => {
    if (!enableInlineEdit) return;

    const row = processedData[rowIndex];
    onEdit?.({ ...row, [columnKey]: value });
    setEditingCell(null);
  }, [enableInlineEdit, processedData, onEdit]);

  // Render cell content
  const renderCell = useCallback((row, column, rowIndex) => {
    const value = row[column.key];
    const isEditing = editingCell?.row === rowIndex && editingCell?.column === column.key;

    if (isEditing && enableInlineEdit) {
      return (
        <input
          type={column.type === ColumnTypes.NUMBER ? 'number' : 'text'}
          defaultValue={value}
          autoFocus
          className={`w-full px-2 py-1 rounded ${
            isDark
              ? 'bg-quantum-twilight text-gray-200 border-quantum-border'
              : 'bg-white text-gray-900 border-gray-300'
          } border focus:outline-none focus:ring-2 focus:ring-brand-primary`}
          onBlur={(e) => handleCellEdit(rowIndex, column.key, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellEdit(rowIndex, column.key, e.target.value);
            } else if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
        />
      );
    }

    switch (column.type) {
      case ColumnTypes.BOOLEAN:
        return (
          <span className="flex items-center">
            {value ? (
              <CheckCircleIcon className="w-5 h-5 text-success-dark" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-error-dark" />
            )}
          </span>
        );

      case ColumnTypes.PROGRESS:
        return (
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-quantum-overlay rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
              />
            </div>
            <span className="text-sm font-medium">{value}%</span>
          </div>
        );

      case ColumnTypes.TAGS:
        return (
          <div className="flex flex-wrap gap-1">
            {(value || []).map((tag, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 text-xs rounded-full ${
                  isDark
                    ? 'bg-brand-primary/20 text-brand-primary'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        );

      case ColumnTypes.ACTIONS:
        return (
          <div className="flex items-center space-x-1">
            {enableInlineEdit && (
              <button
                onClick={() => setEditingCell({ row: rowIndex, column: column.key })}
                className="p-1 hover:bg-gray-100 dark:hover:bg-quantum-hover rounded"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(row)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
            {customActions.map((action, i) => (
              <button
                key={i}
                onClick={() => action.handler(row)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-quantum-hover rounded"
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        );

      case ColumnTypes.CUSTOM:
        return column.render?.(value, row, rowIndex);

      default:
        return (
          <span className="truncate" title={String(value)}>
            {column.format ? column.format(value) : value}
          </span>
        );
    }
  }, [editingCell, enableInlineEdit, isDark, onDelete, customActions, handleCellEdit]);

  // Render table header
  const renderHeader = () => (
    <div
      className={`sticky top-0 z-10 flex border-b ${
        isDark
          ? 'bg-quantum-midnight border-quantum-border'
          : 'bg-gray-50 border-gray-200'
      }`}
      style={{ height: headerHeight }}
    >
      {enableSelection && (
        <div className="flex items-center justify-center w-12 border-r border-quantum-border">
          <input
            type="checkbox"
            checked={selectedRows.size === processedData.length && processedData.length > 0}
            indeterminate={selectedRows.size > 0 && selectedRows.size < processedData.length}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
          />
        </div>
      )}
      {columns
        .filter(col => visibleColumns.has(col.key))
        .map((column) => (
          <div
            key={column.key}
            className={`flex items-center px-4 font-semibold text-sm ${
              enableColumnResize ? 'resize-x' : ''
            } ${column.className || ''}`}
            style={{
              width: columnWidths[column.key] || column.width || 'auto',
              minWidth: column.minWidth || 100,
              maxWidth: column.maxWidth || 500,
            }}
          >
            <button
              onClick={() => handleSort(column.key)}
              className="flex items-center space-x-1 hover:text-brand-primary transition-colors"
              disabled={!enableSorting}
            >
              <span>{column.label}</span>
              {sortConfig.key === column.key && (
                sortConfig.direction === 'asc'
                  ? <ChevronUpIcon className="w-4 h-4" />
                  : <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
    </div>
  );

  // Render table row
  const renderRow = (virtualRow) => {
    const row = processedData[virtualRow.index];
    const isSelected = selectedRows.has(virtualRow.index);
    const isGroupHeader = row._isGroupHeader;

    if (isGroupHeader) {
      return (
        <div
          key={virtualRow.index}
          className={`flex items-center px-4 font-medium ${
            isDark ? 'bg-quantum-overlay' : 'bg-gray-100'
          }`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: virtualRow.size,
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {row._groupName} ({row._groupCount} items)
        </div>
      );
    }

    return (
      <motion.div
        key={virtualRow.index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: virtualRow.index * 0.01 }}
        className={`flex border-b transition-colors ${
          isDark
            ? `border-quantum-border ${
                isSelected ? 'bg-brand-primary/10' : 'hover:bg-quantum-hover'
              }`
            : `border-gray-200 ${
                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`
        }`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: virtualRow.size,
          transform: `translateY(${virtualRow.start}px)`,
        }}
        onClick={(e) => {
          handleRowSelect(virtualRow.index, e);
          onRowClick?.(row);
        }}
      >
        {enableSelection && (
          <div className="flex items-center justify-center w-12 border-r border-quantum-border">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
          </div>
        )}
        {columns
          .filter(col => visibleColumns.has(col.key))
          .map((column) => (
            <div
              key={column.key}
              className={`flex items-center px-4 ${column.className || ''}`}
              style={{
                width: columnWidths[column.key] || column.width || 'auto',
                minWidth: column.minWidth || 100,
                maxWidth: column.maxWidth || 500,
              }}
            >
              {renderCell(row, column, virtualRow.index)}
            </div>
          ))}
      </motion.div>
    );
  };

  // Render toolbar
  const renderToolbar = () => (
    <div className={`flex items-center justify-between p-4 border-b ${
      isDark ? 'border-quantum-border' : 'border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 pr-4 py-2 rounded-lg ${
              isDark
                ? 'bg-quantum-twilight text-gray-200 border-quantum-border'
                : 'bg-white text-gray-900 border-gray-300'
            } border focus:outline-none focus:ring-2 focus:ring-brand-primary`}
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded ${
              viewMode === 'table'
                ? 'bg-brand-primary/20 text-brand-primary'
                : 'hover:bg-gray-100 dark:hover:bg-quantum-hover'
            }`}
          >
            <TableCellsIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${
              viewMode === 'grid'
                ? 'bg-brand-primary/20 text-brand-primary'
                : 'hover:bg-gray-100 dark:hover:bg-quantum-hover'
            }`}
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Column visibility */}
        <div className="relative group">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-quantum-hover rounded">
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-quantum-midnight border border-gray-200 dark:border-quantum-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <div className="p-3">
              <h4 className="font-semibold mb-2">Visible Columns</h4>
              {columns.map(col => (
                <label key={col.key} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(col.key)}
                    onChange={(e) => {
                      const newVisible = new Set(visibleColumns);
                      if (e.target.checked) {
                        newVisible.add(col.key);
                      } else {
                        newVisible.delete(col.key);
                      }
                      setVisibleColumns(newVisible);
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Selected count */}
        {selectedRows.size > 0 && (
          <span className="text-sm text-gray-500">
            {selectedRows.size} selected
          </span>
        )}

        {/* Export button */}
        {enableExport && (
          <div className="relative group">
            <button className="flex items-center space-x-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90">
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>Export</span>
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-quantum-midnight border border-gray-200 dark:border-quantum-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-quantum-hover"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-quantum-hover"
              >
                Export as Excel
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-quantum-hover"
              >
                Export as JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Main render
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" />
      </div>
    );
  }

  if (processedData.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-96 ${className}`}>
        <TableCellsIcon className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${
      isDark ? 'bg-quantum-space text-gray-200' : 'bg-white text-gray-900'
    } rounded-lg shadow-lg overflow-hidden ${className}`}>
      {renderToolbar()}

      <div className="flex-1 relative">
        {renderHeader()}

        <div
          ref={parentRef}
          className="overflow-auto"
          style={{
            height: `calc(100% - ${headerHeight}px)`,
          }}
        >
          <div
            style={{
              height: rowVirtualizer.totalSize,
              width: '100%',
              position: 'relative',
            }}
          >
            {enableVirtualization
              ? rowVirtualizer.virtualItems.map(renderRow)
              : processedData.map((row, index) =>
                  renderRow({
                    index,
                    start: index * rowHeight,
                    size: rowHeight,
                  })
                )
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseDataTable;