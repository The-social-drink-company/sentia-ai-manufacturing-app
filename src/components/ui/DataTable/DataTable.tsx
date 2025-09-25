// Enterprise DataTable component with inline editing and bulk actions

import React, { useState, useCallback, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  SortingState,
  VisibilityState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Download, 
  Filter,
  Search,
  Settings2,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Checkbox } from '../Checkbox/Checkbox';
import { cn } from '@/lib/utils';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  enableSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableColumnVisibility?: boolean;
  enableInlineEditing?: boolean;
  bulkActions?: BulkAction[];
  onRowClick?: (row: TData) => void;
  onRowEdit?: (row: TData) => void;
  onRowDelete?: (row: TData) => void;
  onBulkAction?: (action: string, selectedRows: TData[]) => void;
  onRefresh?: () => void;
  onExport?: (selectedRows?: TData[]) => void;
  className?: string;
  'data-testid'?: string;
}

export interface BulkAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'secondary';
  requiresSelection?: boolean;
}

// Loading skeleton component
const TableSkeleton = ({ columns }: { columns: number }) => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex space-x-4">
        {[...Array(columns)].map((_, j) => (
          <div
            key={j}
            className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

// Error state component
const TableError = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <div className="text-red-500 text-center">
      <h3 className="font-semibold">Error loading data</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{message}</p>
    </div>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    )}
  </div>
);

// Empty state component
const TableEmpty = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <div className="text-gray-500 text-center">
      <h3 className="font-semibold">No data available</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{message}</p>
    </div>
  </div>
);

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = 'No results found.',
  enableSelection = true,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableColumnVisibility = true,
  enableInlineEditing = false,
  bulkActions = [],
  onRowClick,
  onRowEdit,
  onRowDelete,
  onBulkAction,
  onRefresh,
  onExport,
  className,
  'data-testid': testId
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);

  // Enhanced columns with selection and actions
  const enhancedColumns = useMemo(() => {
    const cols: ColumnDef<TData, TValue>[] = [];

    // Selection column
    if (enableSelection) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select row ${row.index + 1}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    // Data columns
    cols.push(...columns);

    // Actions column
    if (onRowEdit || onRowDelete || onRowClick) {
      cols.push({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            {onRowClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRowClick(row.original)}
                aria-label="View details"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onRowEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRowEdit(row.original)}
                aria-label="Edit row"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onRowDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRowDelete(row.original)}
                aria-label="Delete row"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    return cols;
  }, [columns, enableSelection, onRowClick, onRowEdit, onRowDelete]);

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
  const hasSelection = selectedRows.length > 0;

  const handleBulkAction = useCallback((actionKey: string) => {
    if (onBulkAction) {
      onBulkAction(actionKey, selectedRows);
    }
  }, [onBulkAction, selectedRows]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(hasSelection ? selectedRows : undefined);
    }
  }, [onExport, hasSelection, selectedRows]);

  // Render error state
  if (error) {
    return (
      <div className={cn('w-full', className)} data-testid={testId}>
        <TableError message={error} onRetry={onRefresh} />
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-4', className)} data-testid={testId}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Global search */}
          {enableFiltering && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search all columns..."
                value={globalFilter}
                onChange={(value) => setGlobalFilter(String(value))}
                className="pl-8 w-64"
                data-testid={`${testId}-global-search`}
              />
            </div>
          )}

          {/* Bulk actions */}
          {hasSelection && bulkActions.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRows.length} selected
              </span>
              {bulkActions.map((action) => (
                <Button
                  key={action.key}
                  variant={action.variant || 'secondary'}
                  size="sm"
                  onClick={() => handleBulkAction(action.key)}
                  disabled={action.requiresSelection && !hasSelection}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Column visibility */}
          {enableColumnVisibility && (
            <div className="relative">
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2" />
                Columns
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              {/* Column visibility dropdown would go here */}
            </div>
          )}

          {/* Export */}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export {hasSelection ? `(${selectedRows.length})` : ''}
            </Button>
          )}

          {/* Refresh */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              loading={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="relative overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b transition-colors hover:bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            'flex items-center space-x-2',
                            header.column.getCanSort() && 'cursor-pointer select-none'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {enableSorting && header.column.getCanSort() && (
                            <div className="flex flex-col">
                              {header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : header.column.getIsSorted() === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={enhancedColumns.length} className="p-4">
                    <TableSkeleton columns={enhancedColumns.length} />
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b transition-colors hover:bg-muted/50',
                      row.getIsSelected() && 'bg-muted',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    data-testid={`${testId}-row-${row.id}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                        data-testid={`${testId}-cell-${cell.id}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={enhancedColumns.length} className="p-4">
                    <TableEmpty message={emptyMessage} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {hasSelection && (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{' '}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            )}
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                className="h-8 w-[70px] border border-input bg-background px-2 py-1 text-sm"
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                {'<<'}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                {'<'}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                {'>'}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                {'>>'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { ColumnDef } from '@tanstack/react-table';