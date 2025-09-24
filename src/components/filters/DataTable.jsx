import React, { useState, useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  onRowClick = null,
  onSelectionChange = null,
  onSort = null,
  onFilter = null,
  onExport = null,
  pagination = {
    enabled: true,
    pageSize: 25,
    currentPage: 1,
    totalItems: 0
  },
  selection = {
    enabled: false,
    selectedRows: [],
    selectAll: false
  },
  customization = {
    enabled: false,
    hiddenColumns: [],
    columnOrder: []
  },
  className = ''
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState(selection.selectedRows || []);
  const [selectAll, setSelectAll] = useState(selection.selectAll || false);
  const [hiddenColumns, setHiddenColumns] = useState(customization.hiddenColumns || []);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [currentPage, setCurrentPage] = useState(pagination.currentPage || 1);
  const [pageSize, setPageSize] = useState(pagination.pageSize 0);

  // Memoized sorted and filtered data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (sortConfig.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return result;
  }, [data, sortConfig]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!pagination.enabled) return processedData;

    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize, pagination.enabled]);

  // Visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter(column => !hiddenColumns.includes(column.key));
  }, [columns, hiddenColumns]);

  // Handle sorting
  const handleSort = (columnKey) => {
    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key: columnKey, direction });
    
    if (onSort) {
      onSort(columnKey, direction);
    }
  };

  // Handle row selection
  const handleRowSelect = (rowId, isSelected) => {
    let newSelectedRows;
    if (isSelected) {
      newSelectedRows = [...selectedRows, rowId];
    } else {
      newSelectedRows = selectedRows.filter(id => id !== rowId);
    }
    
    setSelectedRows(newSelectedRows);
    setSelectAll(newSelectedRows.length === paginatedData.length);
    
    if (onSelectionChange) {
      onSelectionChange(newSelectedRows);
    }
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    let newSelectedRows;
    if (isSelected) {
      newSelectedRows = paginatedData.map(row => row.id || row._id);
    } else {
      newSelectedRows = [];
    }
    
    setSelectedRows(newSelectedRows);
    setSelectAll(isSelected);
    
    if (onSelectionChange) {
      onSelectionChange(newSelectedRows);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Handle column visibility
  const toggleColumnVisibility = (columnKey) => {
    const newHiddenColumns = hiddenColumns.includes(columnKey)
      ? hiddenColumns.filter(key => key !== columnKey)
      : [...hiddenColumns, columnKey];
    
    setHiddenColumns(newHiddenColumns);
  };

  // Render cell content
  const renderCell = (column, row, rowIndex) => {
    const value = row[column.key];

    if (column.render) {
      return column.render(value, row, rowIndex);
    }

    if (column.type === 'date') {
      return value ? new Date(value).toLocaleDateString() : '-';
    }

    if (column.type === 'datetime') {
      return value ? new Date(value).toLocaleString() : '-';
    }

    if (column.type === 'currency') {
      return value ? new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: column.currency || null
      }).format(value) : '-';
    }

    if (column.type === 'number') {
      return value !== null && value !== undefined ? value.toLocaleString() : '-';
    }

    if (column.type === 'boolean') {
      return (
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    if (column.type === 'badge') {
      const badgeConfig = column.badgeConfig || {};
      const color = badgeConfig[value] || 'gray';
      return (
        <span className={`inline-flex px-2 py-1 text-xs rounded-full bg-${color}-100 text-${color}-800 border border-${color}-200`}>
          {value}
        </span>
      );
    }

    return value || null;
  };

  // Calculate pagination info
  const totalItems = pagination.totalItems || processedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <div className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <EllipsisHorizontalIcon className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Table Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {selection.enabled && selectedRows.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedRows.length} selected
                </span>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                title="Export data"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            )}
            
            {customization.enabled && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
                  className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Customize columns"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                </button>
                
                {showColumnCustomizer && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Show/Hide Columns
                      </h3>
                      <div className="space-y-2">
                        {columns.map((column) => (
                          <label key={column.key} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={!hiddenColumns.includes(column.key)}
                              onChange={() => toggleColumnVisibility(column.key)}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {column.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {selection.enabled && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
              )}
              
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable !== false && sortConfig.key === column.key && (
                      <div className="flex items-center">
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (selection.enabled ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowId = row.id || row._id || rowIndex;
                const isSelected = selectedRows.includes(rowId);
                
                return (
                  <tr
                    key={rowId}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => onRowClick && onRowClick(row, rowIndex)}
                  >
                    {selection.enabled && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRowSelect(rowId, e.target.checked);
                          }}
                          className="rounded"
                        />
                      </td>
                    )}
                    
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap ${column.className || null}`}
                      >
                        {renderCell(column, row, rowIndex)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.enabled && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {startItem} to {endItem} of {totalItems} results
              </div>
              
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-1">
                {[] => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;